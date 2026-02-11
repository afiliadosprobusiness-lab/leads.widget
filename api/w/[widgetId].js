import { db } from '../_firebase.js';

export default async function handler(req, res) {
  const { widgetId } = req.query;

  if (!widgetId) {
    return res.status(400).send('// Widget ID is required');
  }

  try {
    // 1. Fetch Widget Config
    // First try by document ID (if widgetId matches a doc ID format)
    let widgetDoc = await db.collection('widget_configs').doc(widgetId).get();
    let widgetData = widgetDoc.exists ? { id: widgetDoc.id, ...widgetDoc.data() } : null;

    // Fallback to custom widget_id field if not found by doc id
    if (!widgetData) {
      const q = await db.collection('widget_configs').where('widget_id', '==', widgetId).limit(1).get();
      if (!q.empty) {
        widgetData = { id: q.docs[0].id, ...q.docs[0].data() };
      }
    }

    if (!widgetData) {
      return res.status(404).send('// Widget not found');
    }

    // 2. Fetch Profile to get business info
    const profileDoc = await db.collection('profiles').doc(widgetData.user_id).get();
    const profileData = profileDoc.exists ? profileDoc.data() : {};

    // Check if account is suspended
    if (profileData.subscription_status === 'suspended') {
      res.setHeader('Content-Type', 'application/javascript');
      res.setHeader('Access-Control-Allow-Origin', '*');
      return res.status(200).send('console.warn("LeadWidget: Service suspended for this account.");');
    }

    // Determine Base URL for API calls
    const protocol = req.headers['x-forwarded-proto'] || 'http';
    const host = req.headers.host;
    const baseUrl = `${protocol}://${host}`;

    const TRANSLATIONS = {
      es: {
        welcome: '¡Hola! soy tu asistente virtual. ¿En qué puedo ayudarte hoy?',
        placeholder: 'Escribe tu mensaje...',
        exitTitle: '¡Espera!',
        exitDesc: 'Prueba Lead Widget gratis por 3 días y aumenta tus ventas.',
        exitCTA: 'Probar Demo Ahora',
        online: 'En línea ahora',
        hint: '¿Tienes alguna duda? ✨',
        wa_pre: 'Envía este mensaje así tal cual:',
        connecting: '✅ Conectando con WhatsApp...',
        wa_msg_pre: '¡Hola! Vengo de la web de ',
        teaser_text: '¿Cómo puedo ayudarte con tu negocio? 👋',
        fields: { name: 'Nombre', interest: 'Interés', budget: 'Presupuesto', website: 'Web', service: 'Servicio', phone: 'Teléfono' },
        teasers: ['¿Cómo podemos ayudarte? 👋', '¿Tienes alguna duda sobre el servicio? ✨', '¡Hola! Estamos en línea para atenderte 🚀'],
        quick: ['¿Cómo funciona?', 'Quiero más información', 'Ver precios'],
        blocked_chat: 'Chat bloqueado por seguridad',
        connection_error: 'Lo siento, hubo un error de conexión.',
        whatsapp_btn: 'Abrir WhatsApp Ahora'
      },
      en: {
        welcome: 'Hello! I am your virtual assistant. How can I help you today?',
        placeholder: 'Type your message...',
        exitTitle: 'Wait!',
        exitDesc: 'Try Lead Widget free for 3 days and boost your sales.',
        exitCTA: 'Try Demo Now',
        online: 'Online now',
        hint: 'Any questions? ✨',
        wa_pre: 'Send this message as is:',
        connecting: '✅ Connecting to WhatsApp...',
        wa_msg_pre: 'Hello! I coming from ',
        teaser_text: 'How can I help you with your business? 👋',
        fields: { name: 'Name', interest: 'Interest', budget: 'Budget', website: 'Website', service: 'Service', phone: 'Phone' },
        teasers: ['How can we help you? 👋', 'Any questions? ✨', 'Hello! We are online to assist you 🚀'],
        quick: ['How does it work?', 'More info', 'See pricing'],
        blocked_chat: 'Chat blocked for security',
        connection_error: 'Sorry, connection error.',
        whatsapp_btn: 'Open WhatsApp Now'
      }
    };

    const lang = widgetData.language || 'es';
    const t = TRANSLATIONS[lang] || TRANSLATIONS.es;

    const config = {
      primaryColor: widgetData.primary_color || '#00C185',
      businessName: profileData.business_name || 'Lead Widget',
      welcomeMessage: widgetData.welcome_message || t.welcome,
      whatsappDestination: widgetData.whatsapp_destination || profileData.whatsapp_number || '',
      widgetId: widgetData.id,
      triggerDelay: widgetData.trigger_delay || 5,
      chatPlaceholder: widgetData.chat_placeholder || t.placeholder,
      vibrationIntensity: widgetData.vibration_intensity || 'soft',
      exitIntentTitle: widgetData.exit_intent_title || t.exitTitle,
      exitIntentDescription: widgetData.exit_intent_description || t.exitDesc,
      exitIntentCTA: widgetData.exit_intent_cta || t.exitCTA,
      teaserMessages: widgetData.teaser_messages || t.teasers,
      quickReplies: widgetData.quick_replies || t.quick,
      exitIntentEnabled: widgetData.trigger_exit_intent,
      apiUrl: `${baseUrl}/api/chat`,
      trackUrl: `${baseUrl}/api/track`,
      text: t
    };

    const widgetScript = `
(function() {
  'use strict';
  const config = ${JSON.stringify(config)};
  
  let messages = [
    { role: 'assistant', content: config.welcomeMessage }
  ];
  let isOpen = false;
  let isLoading = false;

  // Helper to adjust color brightness
  function adjustColor(color, amount) {
    const num = parseInt(color.replace('#', ''), 16);
    const r = Math.max(0, Math.min(255, (num >> 16) + amount));
    const g = Math.max(0, Math.min(255, ((num >> 8) & 0x00FF) + amount));
    const b = Math.max(0, Math.min(255, (num & 0x0000FF) + amount));
    return '#' + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0');
  }

  // Inject CSS
  const styles = \`
    #leadwidget-container {
      position: fixed; bottom: 20px; right: 20px; z-index: 99999;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    }
    #leadwidget-button {
      width: 60px; height: 60px; border-radius: 50%;
      background: linear-gradient(135deg, \${config.primaryColor} 0%, \${adjustColor(config.primaryColor, -20)} 100%);
      border: none; cursor: pointer;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      display: flex; align-items: center; justify-content: center;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    #leadwidget-button:hover { transform: scale(1.05); }
    
    #leadwidget-chat-window {
      position: absolute; bottom: 80px; right: 0;
      width: 360px; height: 500px;
      max-width: calc(100vw - 40px); max-height: 75vh;
      background: white; border-radius: 20px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
      display: none; flex-direction: column; overflow: hidden;
      border: 1px solid #e2e8f0;
      animation: lw-slide-up 0.4s cubic-bezier(0.16, 1, 0.3, 1);
    }
    
    .lw-header {
      background: \${config.primaryColor}; color: white; padding: 14px 18px;
      display: flex; align-items: center; justify-content: space-between;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    .lw-messages {
      flex: 1; overflow-y: auto; padding: 16px;
      background: #f8fafc; display: flex; flex-direction: column; gap: 12px;
      scroll-behavior: smooth;
    }
    .lw-input-area {
      padding: 14px; background: white; border-top: 1px solid #f1f5f9;
      display: flex; flex-direction: column; gap: 8px;
    }
    .lw-input-row { display: flex; gap: 8px; align-items: center; }
    .lw-input {
      flex: 1; padding: 12px 16px; border: 1px solid #e2e8f0; border-radius: 24px;
      outline: none; font-size: 14px; background: #f8fafc; transition: all 0.2s;
    }
    .lw-input:focus { border-color: \${config.primaryColor}; background: white; box-shadow: 0 0 0 3px \${config.primaryColor}20; }
    .lw-send-btn {
      background: \${config.primaryColor}; color: white; border: none;
      width: 44px; height: 44px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      cursor: pointer; transition: all 0.2s;
    }
    .lw-send-btn:hover { transform: scale(1.05); }
    .lw-send-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: scale(1); }
    
    .lw-msg { max-width: 85%; padding: 10px 14px; font-size: 14px; line-height: 1.5; animation: lw-fade-in 0.3s; }
    .lw-msg-user {
      align-self: flex-end; background: \${config.primaryColor}; color: white;
      border-radius: 18px 18px 2px 18px;
    }
    .lw-msg-assistant {
      align-self: flex-start; background: white; color: #1e293b;
      border: 1px solid #e2e8f0; border-radius: 18px 18px 18px 2px;
    }
    .lw-msg-system {
      align-self: center; width: 100%; text-align: center;
      background: transparent; padding: 4px;
    }
    .lw-system-text {
      font-size: 11px; color: #64748b; background: #f1f5f9;
      padding: 4px 12px; border-radius: 20px; display: inline-block; margin-bottom: 8px;
      font-weight: 500;
    }
    
    .lw-btn-whatsapp {
      background: #25D366; color: white; font-weight: 700;
      padding: 12px 16px; border-radius: 12px; text-decoration: none;
      display: inline-flex; align-items: center; justify-content: center; gap: 10px;
      width: 100%; box-sizing: border-box; font-size: 14px;
      box-shadow: 0 4px 15px rgba(37, 211, 102, 0.3);
    }
    .lw-btn-whatsapp:hover { background: #128C7E; }
    
    .lw-quick-replies {
      display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 8px;
    }
    .lw-quick-chip {
      background: #f1f5f9; border: 1px solid #e2e8f0; color: #475569;
      padding: 6px 12px; border-radius: 16px; font-size: 11px; cursor: pointer;
      transition: all 0.2s; font-weight: 500;
    }
    .lw-quick-chip:hover {
      background: \\${config.primaryColor}; color: white; border-color: \\${config.primaryColor};
    }
    
    .typing-indicator { display: flex; gap: 4px; padding: 4px 8px; align-items: center; }
    .typing-dot {
      width: 6px; height: 6px; background: \${config.primaryColor}; opacity: 0.6; border-radius: 50%;
      animation: lw-bounce-dots 1.4s infinite ease-in-out both;
    }
    .typing-dot:nth-child(1) { animation-delay: -0.32s; }
    .typing-dot:nth-child(2) { animation-delay: -0.16s; }
    
    /* Attention seeker animations */
    .lw-animate-vibrate { animation: lw-vibrate 3s infinite; }
    .lw-animate-vibrate-strong { animation: lw-vibrate-strong 1.5s infinite; }
    .lw-animate-vibrate-subtle { animation: lw-vibrate-subtle 4s infinite; }
    .lw-animate-pulse-subtle { animation: lw-pulse-subtle 2s infinite ease-in-out; }

    /* Exit Intent Popup */
    .lw-popup-overlay {
      position: fixed; inset: 0; z-index: 999999; background: rgba(0,0,0,0.6); backdrop-filter: blur(6px);
      display: none; align-items: center; justify-content: center; padding: 20px; animation: lw-fade-in 0.3s;
    }
    .lw-popup {
      background: white; border-radius: 28px; padding: 40px 32px; max-width: 400px; width: 100%;
      text-align: center; box-shadow: 0 25px 60px rgba(0,0,0,0.3); position: relative;
    }
    .lw-popup-title { font-size: 26px; font-weight: 900; margin-bottom: 12px; color: #1e293b; }
    .lw-popup-desc { font-size: 16px; color: #64748b; margin-bottom: 28px; line-height: 1.6; }
    .lw-popup-btn {
      background: \${config.primaryColor}; color: white; border: none; padding: 16px 24px;
      border-radius: 14px; font-weight: 800; cursor: pointer; width: 100%; font-size: 16px;
      box-shadow: 0 6px 20px \${config.primaryColor}40; transition: transform 0.2s, box-shadow 0.2s;
    }
    .lw-popup-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 25px \${config.primaryColor}50; }
    .lw-popup-close {
      position: absolute; top: 16px; right: 16px; border: none; background: none; cursor: pointer; color: #cbd5e1;
    }

    /* Teaser Bubble */
    .lw-teaser {
       position: absolute; bottom: 75px; right: 0; background: white;
       padding: 10px 16px; border-radius: 18px; width: 220px;
       box-shadow: 0 4px 20px rgba(0,0,0,0.15); border: 1px solid #e2e8f0;
       display: none; animation: lw-slide-up 0.4s ease-out; cursor: pointer;
       z-index: 99998;
    }
    .lw-teaser::after {
       content: ''; position: absolute; bottom: -8px; right: 24px;
       width: 15px; height: 15px; background: white;
       transform: rotate(45deg); border-right: 1px solid #e2e8f0; border-bottom: 1px solid #e2e8f0;
    }
    .lw-teaser-text { font-size: 13px; color: #1e293b; font-weight: 500; line-height: 1.4; }
    
    .lw-badge {
       position: absolute; -top: 2px; -right: 2px; width: 18px; height: 18px;
       background: #ef4444; border: 2px solid white; border-radius: 50%;
       display: none; justify-content: center; align-items: center;
       color: white; font-size: 10px; font-weight: bold;
    }

    @keyframes lw-fade-in { from { opacity: 0; } to { opacity: 1; } }
    @keyframes lw-zoom-in { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
    @keyframes lw-slide-up { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes lw-bounce-dots { 0%, 80%, 100% { transform: scale(0); } 40% { transform: scale(1); } }
    @keyframes lw-vibrate { 0%, 15%, 100% { transform: translateX(0); } 3%, 9% { transform: translateX(-4px); } 6%, 12% { transform: translateX(4px); } }
    @keyframes lw-vibrate-strong { 0%, 20%, 100% { transform: translateX(0) scale(1); } 5%, 15% { transform: translateX(-8px) scale(1.02); } 10% { transform: translateX(8px) scale(1.02); } }
    @keyframes lw-vibrate-subtle { 0%, 20%, 100% { transform: translateX(0); } 2%, 6% { transform: translateX(-1.5px); } 4%, 8% { transform: translateX(1.5px); } }
    @keyframes lw-pulse-subtle { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.85; transform: scale(0.99); } }
    @keyframes lw-bounce-small { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }
  \`;

  // HTML Structure
  const widgetHTML = \`
    <div id="leadwidget-container">
      <style>\${styles}</style>
      <div id="lw-teaser" class="lw-teaser">
         <div class="lw-teaser-text">\${config.text.teaser_text}</div>
      </div>
      <button id="leadwidget-button">
        <div id="lw-badge" class="lw-badge">1</div>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
           <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        </svg>
      </button>
      
      <div id="leadwidget-chat-window">
        <!-- Header -->
        <div class="lw-header">
           <div style="display: flex; align-items: center; gap: 10px;">
              <div style="width: 32px; height: 32px; background: rgba(255,255,255,0.2); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                 <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M12 2a10 10 0 0 1 10 10c0 5.523-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2Z"/></svg>
              </div>
              <div>
                 <div style="font-weight: 600; font-size: 14px; line-height: 1.2;">${config.businessName}</div>
                 <div style="font-size: 11px; opacity: 0.9;">${config.text.online}</div>
              </div>
           </div>
           <button id="lw-close" style="background:none; border:none; color:white; cursor:pointer;">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
           </button>
        </div>
        
        <!-- Messages -->
        <div id="lw-messages" class="lw-messages"></div>
        
        <!-- Input -->
        <form id="lw-form" class="lw-input-area">
           <div id="lw-quick-replies" class="lw-quick-replies"></div>
           <div id="lw-hint" style="text-align:center; display:none; animation: lw-bounce-small 2s infinite;">
              <span style="font-size:10px; background:${config.primaryColor}15; color:${config.primaryColor}; padding:2px 10px; border-radius:10px; font-weight:600;">${config.text.hint}</span>
           </div>
           <div class="lw-input-row">
              <input id="lw-input" class="lw-input" type="text" placeholder="${config.chatPlaceholder}" autocomplete="off">
              <button type="submit" id="lw-submit" class="lw-send-btn" disabled>
                 <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
              </button>
           </div>
        </form>
        <div style="text-align:center; padding-bottom:8px; background:white;">
            <span style="font-size:9px; color:#94a3b8; font-weight:500; letter-spacing:0.3px;">Powered by Lead Widget AI</span>
        </div>
      </div>
      
      <!-- Exit Intent Popup -->
      <div id="lw-exit-popup-overlay" class="lw-popup-overlay">
        <div class="lw-popup" style="animation: lw-zoom-in 0.4s ease-out">
          <button id="lw-popup-close-btn" class="lw-popup-close">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
          <div style="font-size: 40px; margin-bottom: 16px;">🚀</div>
          <div class="lw-popup-title">${config.exitIntentTitle}</div>
          <div class="lw-popup-desc">${config.exitIntentDescription}</div>
          <button id="lw-popup-cta" class="lw-popup-btn">${config.exitIntentCTA}</button>
        </div>
      </div>
    </div>
  `;

    // Render Function
    function renderMessages() {
      const container = document.getElementById('lw-messages');
      if (!container) return;

      container.innerHTML = messages.map(msg => {
        if (msg.role === 'system') {
          return `
          <div class="lw-msg lw-msg-system">
             <div class="lw-system-text">${msg.content}</div>
             ${msg.actionUrl ? `<a href="${msg.actionUrl}" target="_blank" class="lw-btn-whatsapp">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                ${config.text.whatsapp_btn}
             </a>` : ''}
          </div>
        `;
        }
        return `<div class="lw-msg lw-msg-${msg.role}">${msg.content}</div>`;
      }).join('');

      if (isLoading) {
        container.innerHTML += `
        <div class="lw-msg lw-msg-assistant" style="width: fit-content;">
           <div class="typing-indicator">
              <div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>
           </div>
        </div>
      `;
      }

      // Scroll to bottom
      container.scrollTop = container.scrollHeight;
    }

    // API Call
    async function sendMessage(text) {
      if (!text.trim()) return;

      // Add user message
      messages.push({ role: 'user', content: text });
      isLoading = true;
      renderMessages();

      try {
        const resp = await fetch(config.apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: text,
            history: messages.filter(m => m.role !== 'system'),
            widgetId: config.widgetId
          })
        });

        const data = await resp.json();

        if (data.blocked) {
          messages.push({ role: 'assistant', content: data.response });
          const inputEl = document.getElementById('lw-input');
          if (inputEl) {
            inputEl.disabled = true;
            inputEl.placeholder = config.text.blocked_chat;
          }
          const submitEl = document.getElementById('lw-submit');
          if (submitEl) submitEl.disabled = true;
          return;
        }

        if (data.error) throw new Error(data.error);

        // Check for action
        const jsonMatch = data.response.match(/\{"action":\s*"collect_lead"[^}]*\}/);

        if (jsonMatch) {
          let capturedData = { name: 'Cliente' };
          try {
            const leadPayload = JSON.parse(jsonMatch[0].replace(/\\/g, ''));
            if (leadPayload.data) capturedData = Object.assign(capturedData, leadPayload.data);
          } catch (e) { }

          const cleanResponse = data.response.replace(jsonMatch[0], '').trim();
          if (cleanResponse) {
            messages.push({ role: 'assistant', content: cleanResponse });
          }

          // Generate Dynamic WhatsApp Message from captured fields
          let messageBody = config.text.wa_msg_pre + config.businessName + ".\\n\\n";
          const emojis = ["👤", "🎯", "💰", "🏠", "📍", "🩺", "🔧", "🛵", "⏰", "📦"];
          let emojiIdx = 0;

          const fieldLabels = config.text.fields;

          Object.entries(capturedData).forEach(([key, value]) => {
            const label = fieldLabels[key.toLowerCase()] || (key.charAt(0).toUpperCase() + key.slice(1));
            const emoji = emojis[emojiIdx % emojis.length];
            messageBody += emoji + " *" + label + ":* " + value + "\\n";
            emojiIdx++;
          });

          const waNumber = config.whatsappDestination.replace(/\D/g, '');
          const waUrl = "https://wa.me/" + waNumber + "?text=" + encodeURIComponent(messageBody);

          // Instruction for the user
          const previewBody = messageBody.replace(/\\n/g, '<br/>');
          messages.push({
            role: 'system',
            content: '<div style="margin-bottom:4px;">👉 <b>' + config.text.wa_pre + '</b></div><div style="margin-top:8px; padding:12px; background:rgba(0,0,0,0.04); border:1px solid rgba(0,0,0,0.05); border-radius:12px; font-size:12px; line-height:1.5; text-align:left; color:#475569; font-family:monospace;">' + previewBody + '</div>'
          });

          // Add system message with button
          messages.push({
            role: 'system',
            content: config.text.connecting,
            actionUrl: waUrl
          });

          // Auto-redirect attempt
          setTimeout(() => { window.open(waUrl, '_blank'); }, 4000);

        } else {
          messages.push({ role: 'assistant', content: data.response });
        }

      } catch (err) {
        console.error(err);
        messages.push({ role: 'assistant', content: config.text.connection_error });
      } finally {
        isLoading = false;
        renderMessages();
      }
    }

    // Init
    function init() {
      const div = document.createElement('div');
      div.innerHTML = widgetHTML;
      document.body.appendChild(div);

      const btn = document.getElementById('leadwidget-button');
      const win = document.getElementById('leadwidget-chat-window');
      const close = document.getElementById('lw-close');
      const form = document.getElementById('lw-form');
      const input = document.getElementById('lw-input');
      const submitBtn = document.getElementById('lw-submit');
      const teaser = document.getElementById('lw-teaser');
      const badge = document.getElementById('lw-badge');
      const quickRepliesContainer = document.getElementById('lw-quick-replies');
      const messagesContainer = document.getElementById('lw-messages'); // Ensure we have reference

      // Render Quick Replies
      function renderQuickReplies() {
        if (!quickRepliesContainer || messages.length > 2) {
          if (quickRepliesContainer) quickRepliesContainer.style.display = 'none';
          return;
        }
        quickRepliesContainer.style.display = 'flex';
        if (quickRepliesContainer.querySelectorAll('.lw-quick-chip').length === 0) {
          quickRepliesContainer.innerHTML = config.quickReplies.map(text =>
            \`<button type="button" class="lw-quick-chip" data-text="\${text}">\${text}</button>\`
           ).join('');
        }
    
    // Add click handlers
    quickRepliesContainer.querySelectorAll('.lw-quick-chip').forEach(chip => {
      chip.onclick = () => {
        const text = chip.getAttribute('data-text');
        sendMessage(text);
        quickRepliesContainer.style.display = 'none';
      };
    });
  }

  let hasBeenClosedOnce = false;
  let hasTrackedOpen = false;

  async function track(type) {
     try {
       await fetch(config.trackUrl, {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ widgetId: config.widgetId, eventType: type })
       });
     } catch(e) {}
  }

  function toggleChat(forceOpen) {
    isOpen = forceOpen !== undefined ? forceOpen : !isOpen;
    win.style.display = isOpen ? 'flex' : 'none';

    if (isOpen) {
      if (!hasTrackedOpen) {
         track('chat_open');
         hasTrackedOpen = true;
      }
      renderMessages();
      renderQuickReplies();
      input.focus();
      // Hide teaser and badge when chat is active
      if (teaser) teaser.style.display = 'none';
      if (badge) badge.style.display = 'none';
    } else {
      // If user closes it, show teaser after a tiny delay if it was auto-opened or first close
      if (hasBeenClosedOnce === false) {
        hasBeenClosedOnce = true;
        setTimeout(() => {
          if (!isOpen && teaser) {
            // Pick a random teaser message
            const randomIdx = Math.floor(Math.random() * config.teaserMessages.length);
            const teaserTextEl = teaser.querySelector('.lw-teaser-text');
            if (teaserTextEl) teaserTextEl.innerText = config.teaserMessages[randomIdx];

            teaser.style.display = 'block';
          }
          if (!isOpen && badge) badge.style.display = 'flex';
        }, 500);
      }
    }
  }

  btn.onclick = () => toggleChat();
  if (teaser) teaser.onclick = () => toggleChat(true);
  close.onclick = (e) => {
    e.stopPropagation();
    toggleChat(false);
  };

  input.oninput = (e) => {
    submitBtn.disabled = !e.target.value.trim();
  };

  form.onsubmit = (e) => {
    e.preventDefault();
    const text = input.value;
    if (!text.trim()) return;
    input.value = '';
    submitBtn.disabled = true;
    sendMessage(text);
  };

  // Auto-open
  setTimeout(() => {
    if (!isOpen) toggleChat(true);
  }, config.triggerDelay * 1000);

  // Interaction seeker logic
  let idleTimer;
  let isAttentionSeeking = false;
  const hint = document.getElementById('lw-hint');
  const submitBtnFull = document.getElementById('lw-submit');

  function startIdleTimer() {
    if (idleTimer) clearTimeout(idleTimer);

    idleTimer = setTimeout(() => {
      if (isOpen && messages.length === 1 && !isAttentionSeeking) {
        // Persistent attention seeker
        const animClass = config.vibrationIntensity === 'strong' ? 'lw-animate-vibrate-strong' : (config.vibrationIntensity === 'none' ? 'lw-animate-pulse-subtle' : 'lw-animate-vibrate-subtle');
        win.classList.add(animClass);

        // Show floating hint
        if (hint) hint.style.display = 'block';

        // Pulse the send button
        if (submitBtnFull) submitBtnFull.classList.add('lw-animate-pulse-subtle');

        // Add a fake typing message to message container
        isLoading = true;
        renderMessages();

        isAttentionSeeking = true;
      }
    }, 6000); // 6 seconds of silence
  }

  function stopAttentionSeeking() {
    win.classList.remove('lw-animate-vibrate');
    win.classList.remove('lw-animate-vibrate-strong');
    win.classList.remove('lw-animate-vibrate-subtle');
    win.classList.remove('lw-animate-pulse-subtle');
    if (hint) hint.style.display = 'none';
    if (submitBtnFull) submitBtnFull.classList.remove('lw-animate-pulse-subtle');

    if (isAttentionSeeking && messages.length === 1) {
      isLoading = false;
      renderMessages();
    }

    isAttentionSeeking = false;
    if (idleTimer) clearTimeout(idleTimer);
  }

  input.onfocus = () => stopAttentionSeeking();
  input.oninput = (e) => {
    stopAttentionSeeking();
    submitBtn.disabled = !e.target.value.trim();
  };

  // Initial start after open
  setTimeout(startIdleTimer, (config.triggerDelay + 1) * 1000);

  // Exit Intent Logic
  if (config.exitIntentEnabled) {
    let hasShownExit = false;
    const overlay = document.getElementById('lw-exit-popup-overlay');
    const popupClose = document.getElementById('lw-popup-close-btn');
    const popupCta = document.getElementById('lw-popup-cta');

    document.addEventListener('mouseleave', (e) => {
      if (e.clientY <= 0 && !hasShownExit) {
        overlay.style.display = 'flex';
        hasShownExit = true;
      }
    });

    popupClose.onclick = () => overlay.style.display = 'none';
    popupCta.onclick = () => {
      overlay.style.display = 'none';
      toggleChat(true);
    };
  }

  // Record initial view
  track('view');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
}) ();
  `;

          res.setHeader('Content-Type', 'application/javascript');
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
          res.status(200).send(widgetScript);

        } catch (error) {
          console.error('Error:', error);
          res.status(500).send('// Error generating widget');
        }
      }
