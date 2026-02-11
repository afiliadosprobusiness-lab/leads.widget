(function () {
  'use strict';

  // Default Configuration
  const defaultConfig = {
    primaryColor: '#00C185',
    businessName: 'LeadWidget',
    welcomeMessage: '👋 ¡Hola! Soy tu asistente virtual. ¿En qué puedo ayudarte hoy?',
    whatsappDestination: '',
    template: 'general',
    chatPlaceholder: 'Escribe tu consulta aquí...',
    quickReplies: ['¿Cómo funciona?', 'Quiero información', 'Ver precios'],
    teaserMessages: ['¿Cómo podemos ayudarte? 👋', '¿Tienes alguna duda? ✨', '¡Estamos en línea! 🚀'],
    vibrationIntensity: 'soft',
    triggerDelay: 5,
    exitIntentEnabled: true,
    exitIntentTitle: '¡Espera!',
    exitIntentDescription: '¿Tienes alguna pregunta antes de irte?',
    exitIntentCta: 'Chatear Ahora',
    testimonials: [],
    projectId: 'whatsapp-leads-peru',
    apiKey: 'AIzaSyDoUHZtRvgEwhEUhZj6x4xEZvVmxliMCJo'
  };

  // State
  let config = { ...defaultConfig };
  let messages = [];
  let isLoading = false;
  let isOpen = false;
  let hasBeenClosedOnce = false;
  let activeTeaser = '';
  let teaserInterval = null;
  let exitIntentShown = false;
  let configRefreshInterval = null;
  let vibrationInterval = null;
  let testimonialInterval = null;
  let autoOpenTimeout = null;
  let teaserStartTimeout = null;

  // Cleanup all timers and listeners
  function cleanupWidget() {
    if (teaserInterval) clearInterval(teaserInterval);
    if (vibrationInterval) clearInterval(vibrationInterval);
    if (testimonialInterval) clearInterval(testimonialInterval);
    if (autoOpenTimeout) clearTimeout(autoOpenTimeout);
    if (teaserStartTimeout) clearTimeout(teaserStartTimeout);

    teaserInterval = null;
    vibrationInterval = null;
    testimonialInterval = null;
    autoOpenTimeout = null;
    teaserStartTimeout = null;
  }

  // Get widget config from Firestore
  async function getWidgetConfig(clientId) {
    if (!clientId) return null;

    try {
      const url = `https://firestore.googleapis.com/v1/projects/${defaultConfig.projectId}/databases/(default)/documents:runQuery?key=${defaultConfig.apiKey}`;

      const query = {
        structuredQuery: {
          from: [{ collectionId: "widget_configs" }],
          where: {
            fieldFilter: {
              field: { fieldPath: "user_id" },
              op: "EQUAL",
              value: { stringValue: clientId }
            }
          },
          limit: 1
        }
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(query)
      });

      const data = await response.json();

      if (data && data[0] && data[0].document) {
        const fields = data[0].document.fields;

        // Parse quick replies (array or string)
        let quickReplies = defaultConfig.quickReplies;
        if (fields.quick_replies?.arrayValue?.values) {
          quickReplies = fields.quick_replies.arrayValue.values.map(v => v.stringValue);
        } else if (fields.quick_replies?.stringValue) {
          quickReplies = fields.quick_replies.stringValue.split('\n').filter(r => r.trim());
        }

        // Parse teaser messages
        let teaserMessages = defaultConfig.teaserMessages;
        if (fields.teaser_messages?.arrayValue?.values) {
          teaserMessages = fields.teaser_messages.arrayValue.values.map(v => v.stringValue);
        }

        // Parse Testimonials (Bulletproof JSON String)
        let testimonials = [];
        if (fields.testimonials_json?.stringValue) {
          try {
            const t = JSON.parse(fields.testimonials_json.stringValue);
            if (Array.isArray(t)) testimonials = t;
          } catch (e) { console.warn('LeadWidget: Error parsing testimonials JSON', e); }
        }

        // Extract AI configuration from widget_configs (since profiles has restricted access)
        const aiApiKey = fields.ai_api_key?.stringValue || '';
        console.log('LeadWidget: AI API Key found in widget_configs:', aiApiKey ? 'Yes (length: ' + aiApiKey.length + ')' : 'No');

        return {
          primaryColor: fields.primary_color?.stringValue || defaultConfig.primaryColor,
          businessName: fields.business_name?.stringValue || defaultConfig.businessName,
          welcomeMessage: fields.welcome_message?.stringValue || defaultConfig.welcomeMessage,
          whatsappDestination: fields.whatsapp_destination?.stringValue || '',
          template: fields.template?.stringValue || 'general',
          chatPlaceholder: fields.chat_placeholder?.stringValue || defaultConfig.chatPlaceholder,
          quickReplies: quickReplies,
          teaserMessages: teaserMessages,
          testimonials: testimonials,
          launcherIcon: fields.launcher_icon?.stringValue || '',
          vibrationIntensity: fields.vibration_intensity?.stringValue || 'soft',
          triggerDelay: parseInt(fields.trigger_delay?.integerValue) || 5,
          exitIntentEnabled: fields.trigger_exit_intent?.booleanValue !== false,
          exitIntentTitle: fields.exit_intent_title?.stringValue || defaultConfig.exitIntentTitle,
          exitIntentDescription: fields.exit_intent_description?.stringValue || defaultConfig.exitIntentDescription,
          exitIntentCta: fields.exit_intent_cta?.stringValue || defaultConfig.exitIntentCta,
          clientId: clientId,
          hideBranding: fields.hide_branding?.booleanValue === true,
          // AI Configuration (now stored in widget_configs for public access)
          ai_enabled: fields.ai_enabled?.booleanValue === true,
          ai_provider: fields.ai_provider?.stringValue || 'openai',
          ai_api_key: aiApiKey,
          ai_model: fields.ai_model?.stringValue || 'gpt-4o-mini',
          ai_system_prompt: fields.ai_system_prompt?.stringValue || '',
          business_description: fields.business_description?.stringValue || '',
          ai_temperature: parseFloat(fields.ai_temperature?.doubleValue || fields.ai_temperature?.integerValue || 0.7),
          ai_max_tokens: parseInt(fields.ai_max_tokens?.integerValue || fields.ai_max_tokens?.stringValue) || 500
        };
      }
    } catch (e) {
      console.error('LeadWidget: Error fetching config', e);
    }
    return null;
  }

  // Send message to AI - now uses config object directly
  // Send message to AI - Now calls our secure backend to enforce security protocols
  async function sendToAI(userMessage) {
    try {
      // Find our backend URL based on where the script is hosted
      let backendUrl = '/api/chat';
      const scripts = document.getElementsByTagName('script');
      for (let s of scripts) {
        if (s.src && s.src.includes('widget-embed.js')) {
          const url = new URL(s.src);
          backendUrl = `${url.origin}/api/chat`;
          break;
        }
      }

      console.log('LeadWidget: Connecting to secure backend:', backendUrl);

      const conversationHistory = messages.filter(m => m.role !== 'system').map(m => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content
      }));

      const response = await fetch(backendUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          history: conversationHistory,
          widgetId: config.clientId
        })
      });

      const data = await response.json();

      return {
        response: data.response || "No pude procesar tu mensaje.",
        blocked: response.status === 403 || data.blocked === true
      };
    } catch (error) {
      console.error('LeadWidget: Connection Error', error);
      return {
        response: "Hubo un error de conexión. ¿Te gustaría contactarnos por WhatsApp?",
        blocked: false
      };
    }
  }

  // Save lead to Firestore
  async function saveLeadToFirestore(name, phone, interest) {
    if (!config.clientId || config.clientId === 'demo_client_id') return;

    try {
      const url = `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/(default)/documents/leads?key=${config.apiKey}`;
      const payload = {
        fields: {
          client_id: { stringValue: config.clientId },
          name: { stringValue: name || 'Visitante' },
          phone: { stringValue: phone || 'Pendiente (Click WA)' },
          interest: { stringValue: interest },
          source: { stringValue: 'website_widget' },
          status: { stringValue: 'new' },
          created_at: { timestampValue: new Date().toISOString() }
        }
      };
      fetch(url, { method: 'POST', body: JSON.stringify(payload), headers: { 'Content-Type': 'application/json' } });
    } catch (error) { console.error('LeadWidget: Error saving lead', error); }
  }

  // Save Visit to Firestore (Lightweight)
  async function saveVisitToFirestore() {
    if (!config.clientId || config.clientId === 'demo_client_id') return;
    try {
      const url = `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/(default)/documents/visits?key=${config.apiKey}`;
      const payload = {
        fields: {
          client_id: { stringValue: config.clientId },
          source: { stringValue: 'website_widget' },
          timestamp: { timestampValue: new Date().toISOString() }
        }
      };
      fetch(url, { method: 'POST', body: JSON.stringify(payload), headers: { 'Content-Type': 'application/json' } });
    } catch (error) { console.error('LeadWidget: Error logging visit', error); }
  }

  // Adjust color brightness
  function adjustColor(color, amount) {
    if (!color) return '#000000';
    const num = parseInt(color.replace('#', ''), 16);
    const r = Math.max(0, Math.min(255, (num >> 16) + amount));
    const g = Math.max(0, Math.min(255, ((num >> 8) & 0x00FF) + amount));
    const b = Math.max(0, Math.min(255, (num & 0x0000FF) + amount));
    return '#' + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0');
  }

  // Render the widget
  function renderWidget() {
    // Cleanup previous state to prevent conflicts
    cleanupWidget();

    // Remove existing if present
    const existing = document.getElementById('lw-root');
    if (existing) existing.remove();

    const styles = `
      #lw-root * { box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
      
      /* Button */
      #lw-button { 
        position: fixed; bottom: 20px; right: 20px; z-index: 2147483646;
        width: 60px; height: 60px; border-radius: 50%; border: none; cursor: pointer; 
        display: flex; align-items: center; justify-content: center; 
        transition: transform 0.2s, box-shadow 0.2s; 
        box-shadow: 0 4px 20px rgba(0,0,0,0.25); 
        background: linear-gradient(135deg, ${config.primaryColor} 0%, ${adjustColor(config.primaryColor, -30)} 100%);
        -webkit-tap-highlight-color: transparent;
        outline: none;
      }
      #lw-button:hover { transform: scale(1.08); }
      #lw-button > * { pointer-events: none; } /* Critical: ensure clicks pass through icon to button */
      
      /* Vibration animations */
      @keyframes lw-vibrate-soft { 
        0%, 100% { transform: scale(1); } 
        50% { transform: scale(1.08); } 
      }
      @keyframes lw-vibrate-strong { 
        0%, 100% { transform: translateX(0) scale(1); } 
        20% { transform: translateX(-3px) scale(1.02); } 
        40% { transform: translateX(3px) scale(1.02); }
        60% { transform: translateX(-3px) scale(1.02); }
        80% { transform: translateX(3px) scale(1.02); }
      }
      #lw-button.lw-vibrating-soft { animation: lw-vibrate-soft 1.5s ease-in-out infinite; }
      #lw-button.lw-vibrating-strong { animation: lw-vibrate-strong 0.6s ease-in-out infinite; }

      /* Teaser bubble */
      #lw-teaser {
        position: fixed; bottom: 90px; right: 20px; z-index: 999997;
        background: white; padding: 12px 16px; border-radius: 16px 16px 4px 16px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.15); max-width: 250px;
        font-size: 14px; color: #1e293b; font-weight: 500;
        animation: lw-teaser-in 0.4s ease-out;
        cursor: pointer;
        display: none;
      }
      @keyframes lw-teaser-in { from { opacity: 0; transform: translateY(10px) scale(0.9); } to { opacity: 1; transform: translateY(0) scale(1); } }
      #lw-teaser-close { position: absolute; top: -8px; right: -8px; width: 20px; height: 20px; border-radius: 50%; background: #64748b; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; }

      /* Panel */
      #lw-panel { 
        position: fixed; bottom: 16px; right: 16px; left: 16px; z-index: 999999;
        width: auto; max-width: 360px; height: 70vh; max-height: 550px;
        background: white; border-radius: 24px; 
        box-shadow: 0 8px 40px rgba(0,0,0,0.2); 
        display: none; flex-direction: column; overflow: hidden; 
        animation: lw-slideUp 0.3s ease-out;
      }
      @media (min-width: 640px) { 
        #lw-panel { left: auto; width: 360px; height: 500px; bottom: 20px; right: 20px; } 
      }
      @keyframes lw-slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }

      /* Header */
      #lw-header { padding: 16px; display: flex; align-items: center; gap: 12px; color: white; background: ${config.primaryColor}; position: relative; }
      #lw-avatar { width: 40px; height: 40px; background: rgba(255,255,255,0.2); border-radius: 50%; display: flex; align-items: center; justify-content: center; position: relative; flex-shrink: 0; }
      #lw-avatar::after { content: ''; position: absolute; bottom: 2px; right: 2px; width: 10px; height: 10px; background: #22c55e; border-radius: 50%; border: 2px solid ${config.primaryColor}; }
      #lw-close-btn { position: absolute; top: 12px; right: 12px; background: rgba(255,255,255,0.2); border: none; width: 32px; height: 32px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; color: white; transition: background 0.2s; }
      #lw-close-btn:hover { background: rgba(255,255,255,0.3); }

      /* Messages */
      #lw-messages { flex: 1; overflow-y: auto; padding: 16px; background: #f8fafc; display: flex; flex-direction: column; gap: 12px; }
      .lw-msg { max-width: 85%; padding: 12px 16px; border-radius: 18px; font-size: 14px; line-height: 1.5; animation: lw-fadeIn 0.3s ease-out; word-wrap: break-word; white-space: pre-wrap; }
      @keyframes lw-fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
      .lw-msg-assistant { background: white; color: #1e293b; border: 1px solid #e2e8f0; border-bottom-left-radius: 4px; align-self: flex-start; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
      .lw-msg-user { background: ${config.primaryColor}; color: white; border-bottom-right-radius: 4px; align-self: flex-end; }
      .lw-msg-system { background: #f1f5f9; color: #64748b; font-size: 12px; text-align: center; align-self: center; border-radius: 12px; padding: 8px 16px; }

      /* Testimonial Rotator */
      #lw-testimonial-bar { 
          background: rgba(255,255,255,0.95); 
          border-bottom: 1px solid #f0f0f0; 
          padding: 8px 12px; 
          display: none; /* Hidden by default if no testimonials */
          align-items: center; 
          gap: 10px;
          animation: lw-slideDown 0.3s ease-out;
      }
      @keyframes lw-slideDown { from { transform: translateY(-10px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
      
      .lw-t-avatar { width: 28px; height: 28px; border-radius: 50%; object-fit: cover; flex-shrink: 0; border: 1px solid #e2e8f0; }
      .lw-t-content { flex: 1; overflow: hidden; }
      .lw-t-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 2px; }
      .lw-t-name { font-size: 11px; font-weight: 700; color: #334155; }
      .lw-t-stars { font-size: 9px; color: #fbbf24; letter-spacing: -1px; }
      .lw-t-text { font-size: 11px; color: #64748b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      
      .lw-fade-in { animation: lw-fadeInT 0.5s ease-in-out; }
      @keyframes lw-fadeInT { from { opacity: 0; transform: translateY(2px); } to { opacity: 1; transform: translateY(0); } }

      /* Typing indicator */
      #lw-typing { display: flex; gap: 4px; padding: 12px 16px; background: white; border-radius: 18px; border: 1px solid #e2e8f0; align-self: flex-start; }
      .lw-dot { width: 6px; height: 6px; border-radius: 50%; background: ${config.primaryColor}; animation: lw-bounce 1.4s infinite ease-in-out both; }
      .lw-dot:nth-child(1) { animation-delay: 0s; }
      .lw-dot:nth-child(2) { animation-delay: 0.16s; }
      .lw-dot:nth-child(3) { animation-delay: 0.32s; }
      @keyframes lw-bounce { 0%, 80%, 100% { transform: scale(0); } 40% { transform: scale(1); } }

      /* Input area */
      #lw-input-area { padding: 12px; background: white; border-top: 1px solid #e2e8f0; }
      #lw-quick-replies { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 12px; }
      .lw-quick-btn { background: #f1f5f9; border: 1px solid #e2e8f0; padding: 8px 14px; border-radius: 20px; font-size: 12px; cursor: pointer; transition: all 0.2s; color: #475569; }
      .lw-quick-btn:hover { background: ${config.primaryColor}15; color: ${config.primaryColor}; border-color: ${config.primaryColor}; }
      #lw-form { display: flex; gap: 8px; }
      #lw-input { flex: 1; padding: 12px 16px; border: 1px solid #e2e8f0; border-radius: 12px; font-size: 14px; background: #f8fafc; outline: none; color: #1e293b; }
      #lw-input:focus { border-color: ${config.primaryColor}; box-shadow: 0 0 0 3px ${config.primaryColor}20; }
      #lw-send { width: 48px; height: 48px; border-radius: 12px; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; color: white; background: ${config.primaryColor}; transition: opacity 0.2s; flex-shrink: 0; }
      #lw-send:hover { opacity: 0.9; }
      #lw-send:disabled { opacity: 0.5; cursor: not-allowed; }
      #lw-footer { text-align: center; padding: 8px; font-size: 9px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; }

      /* WhatsApp button */
      #lw-wa-btn { display: flex; align-items: center; justify-content: center; gap: 8px; width: 100%; padding: 14px; background: #25D366; color: white; border: none; border-radius: 12px; font-weight: 600; cursor: pointer; margin-top: 8px; font-size: 14px; }
      #lw-wa-btn:hover { background: #128C7E; }

      /* Mobile close button - Only on small screens */
      #lw-close-mobile { 
        position: fixed; bottom: 16px; left: 50%; transform: translateX(-50%); z-index: 1000000;
        width: 56px; height: 56px; border-radius: 50%; background: #dc2626; border: 4px solid white; 
        color: white; cursor: pointer; box-shadow: 0 4px 20px rgba(0,0,0,0.3); 
        display: none; align-items: center; justify-content: center;
      }
      @media (max-width: 639px) { 
        #lw-close-mobile.visible { display: flex; }
        #lw-panel.open { padding-bottom: 70px; }
      }
      @media (min-width: 640px) {
        #lw-close-mobile { display: none !important; }
      }

      /* Exit intent popup */
      #lw-exit-overlay { 
        position: fixed; inset: 0; 
        background: rgba(15, 23, 42, 0.4); 
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        z-index: 1000001; 
        display: none; align-items: center; justify-content: center; padding: 24px;
        animation: lw-fadeMask 0.4s ease-out;
      }
      @keyframes lw-fadeMask { from { opacity: 0; } to { opacity: 1; } }
      
      #lw-exit-popup { 
        background: white; border-radius: 32px; padding: 40px 32px; max-width: 420px; width: 100%; 
        text-align: center; 
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        border: 1px solid rgba(226, 232, 240, 0.8);
        animation: lw-popReveal 0.5s cubic-bezier(0.16, 1, 0.3, 1);
        position: relative;
        overflow: hidden;
      }
      @keyframes lw-popReveal { 
        from { opacity: 0; transform: scale(0.9) translateY(20px); } 
        to { opacity: 1; transform: scale(1) translateY(0); } 
      }
      
      #lw-exit-icon { 
        width: 80px; height: 80px; 
        background: ${config.primaryColor}10; 
        color: ${config.primaryColor};
        border-radius: 24px; display: flex; align-items: center; justify-content: center; 
        margin: 0 auto 24px;
        transform: rotate(-10deg);
      }
      #lw-exit-title { 
        font-size: 28px; font-weight: 800; color: #0f172a; 
        margin-bottom: 12px; line-height: 1.2;
        letter-spacing: -0.02em;
      }
      #lw-exit-desc { 
        font-size: 16px; color: #475569; margin-bottom: 32px; 
        line-height: 1.6;
      }
      #lw-exit-cta { 
        width: 100%; padding: 16px; 
        background: ${config.primaryColor}; color: white; border: none; 
        border-radius: 16px; font-weight: 700; cursor: pointer; font-size: 16px;
        box-shadow: 0 10px 15px -3px ${config.primaryColor}40;
        transition: all 0.2s;
      }
      #lw-exit-cta:hover { transform: translateY(-2px); box-shadow: 0 20px 25px -5px ${config.primaryColor}40; }
      #lw-exit-close { 
        background: none; border: none; color: #94a3b8; font-size: 14px; 
        font-weight: 500; cursor: pointer; margin-top: 20px; transition: color 0.2s;
      }
      #lw-exit-close:hover { color: #64748b; }
    `;

    const html = `
      <div id="lw-root">
        <style>${styles}</style>
        
        <!-- Main Button -->
        <button id="lw-button">
          ${(() => {
        const iconMap = {
          'shopping-bag': '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>',
          'heart-pulse': '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>',
          'wrench': '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>',
          'home': '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>',
          'utensils': '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/></svg>',
          'bot': '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/></svg>',
          'default': '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>'
        };
        return iconMap[config.launcherIcon] || iconMap['default'];
      })()}
        </button>

        <!-- Teaser Bubble -->
        <div id="lw-teaser">
          <span id="lw-teaser-text"></span>
          <button id="lw-teaser-close">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <!-- Chat Panel -->
        <div id="lw-panel">
          <div id="lw-header">
            <div id="lw-avatar">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                <rect x="3" y="11" width="18" height="10" rx="2"></rect>
                <circle cx="12" cy="5" r="3"></circle>
              </svg>
            </div>
            <div style="flex: 1;">
              <div style="font-weight: 600; font-size: 14px;">${config.businessName}</div>
              <div style="font-size: 11px; opacity: 0.9;">Responde al instante con IA</div>
            </div>
            <!-- Close button in header -->
            <button id="lw-close-btn">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>



          <!-- Testimonial Rotator -->
          <div id="lw-testimonial-bar">
             <img id="lw-t-img" class="lw-t-avatar" src="" />
             <div class="lw-t-content">
                <div class="lw-t-header">
                   <span id="lw-t-name" class="lw-t-name"></span>
                   <span id="lw-t-stars" class="lw-t-stars"></span>
                </div>
                <div id="lw-t-text" class="lw-t-text"></div>
             </div>
          </div>

          <div id="lw-messages"></div>

          <div id="lw-input-area">
            <div id="lw-quick-replies"></div>
            <form id="lw-form">
              <input type="text" id="lw-input" placeholder="${config.chatPlaceholder}" autocomplete="off">
              <button type="submit" id="lw-send">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="22" y1="2" x2="11" y2="13"></line>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                </svg>
              </button>
            </form>
            ${!config.hideBranding ? `
            <div id="lw-footer" style="text-align:center; padding:8px 0; background:white; font-size:10px;">
              <a href="https://whatsapp-leads-peru.vercel.app/crear-ahora?ref=${config.clientId}" target="_blank" style="color:${config.primaryColor}; text-decoration:none; font-weight:600; display:flex; align-items:center; justify-content:center; gap:4px;">
                <span style="background:rgba(0,0,0,0.05); padding:2px 6px; border-radius:4px; font-weight:800;">⚡</span>
                <span id="lw-viral-text">Tecnología LeadWidget</span>
              </a>
            </div>
            ` : ''}
          </div>
        </div>

        <!-- Mobile Close Button -->
        <button id="lw-close-mobile">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        <!-- Exit Intent Popup -->
        <div id="lw-exit-overlay">
          <div id="lw-exit-popup">
            <div id="lw-exit-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="${config.primaryColor}" stroke-width="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
              </svg>
            </div>
            <h2 id="lw-exit-title">${config.exitIntentTitle}</h2>
            <p id="lw-exit-desc">${config.exitIntentDescription}</p>
            <button id="lw-exit-cta">${config.exitIntentCta}</button>
            <button id="lw-exit-close">No, gracias</button>
          </div>
        </div>
      </div>
    `;

    const container = document.createElement('div');
    container.innerHTML = html;
    document.body.appendChild(container);

    // Get elements
    const button = document.getElementById('lw-button');
    const panel = document.getElementById('lw-panel');
    const messagesContainer = document.getElementById('lw-messages');
    const form = document.getElementById('lw-form');
    const input = document.getElementById('lw-input');
    const quickRepliesContainer = document.getElementById('lw-quick-replies');
    const closeBtn = document.getElementById('lw-close-btn');
    const closeMobile = document.getElementById('lw-close-mobile');
    const teaser = document.getElementById('lw-teaser');
    const teaserText = document.getElementById('lw-teaser-text');
    const teaserClose = document.getElementById('lw-teaser-close');
    const exitOverlay = document.getElementById('lw-exit-overlay');
    const exitCta = document.getElementById('lw-exit-cta');
    const exitClose = document.getElementById('lw-exit-close');

    // Testimonial elements
    const testimonialBar = document.getElementById('lw-testimonial-bar');
    const tImg = document.getElementById('lw-t-img');
    const tName = document.getElementById('lw-t-name');
    const tStars = document.getElementById('lw-t-stars');
    const tText = document.getElementById('lw-t-text');
    const tContentDiv = document.querySelector('.lw-t-content');

    // Start vibration animation
    function startVibration() {
      if (config.vibrationIntensity === 'none' || isOpen) return;

      const vibClass = config.vibrationIntensity === 'strong' ? 'lw-vibrating-strong' : 'lw-vibrating-soft';
      button.classList.add(vibClass);
    }

    function stopVibration() {
      button.classList.remove('lw-vibrating-soft', 'lw-vibrating-strong');
    }

    // Viral Loop A/B Testing
    const viralTexts = [
      '⚡ Tecnología LeadWidget',
      '¿Quieres un chat así en tu web?',
      'Crea tu Widget GRATIS aquí'
    ];
    const viralTextEl = document.getElementById('lw-viral-text');
    if (viralTextEl) {
      const randomText = viralTexts[Math.floor(Math.random() * viralTexts.length)];
      viralTextEl.textContent = randomText;
    }

    // Render quick replies
    function renderQuickReplies() {
      if (messages.length > 2) {
        quickRepliesContainer.style.display = 'none';
        return;
      }
      quickRepliesContainer.style.display = 'flex';
      quickRepliesContainer.innerHTML = config.quickReplies.map(text =>
        `<button type="button" class="lw-quick-btn">${text}</button>`
      ).join('');

      quickRepliesContainer.querySelectorAll('.lw-quick-btn').forEach(btn => {
        btn.addEventListener('click', () => handleSendMessage(btn.textContent));
      });
    }

    // Render messages
    function renderMessages() {
      let html = messages.map(m => {
        if (m.role === 'system') {
          return `<div class="lw-msg lw-msg-system">${m.content}</div>`;
        }
        return `<div class="lw-msg lw-msg-${m.role}">${m.content}</div>`;
      }).join('');

      if (isLoading) {
        html += `
          <div id="lw-typing">
            <div class="lw-dot"></div>
            <div class="lw-dot"></div>
            <div class="lw-dot"></div>
          </div>
        `;
      }

      messagesContainer.innerHTML = html;
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
      renderQuickReplies();
    }

    // Handle send message
    async function handleSendMessage(text) {
      const userMessage = text || input.value.trim();
      if (!userMessage || isLoading) return;

      messages.push({ role: 'user', content: userMessage });
      input.value = '';
      isLoading = true;
      renderMessages();

      // Save visit (First interaction only) for Analytics
      if (messages.filter(m => m.role === 'user').length === 1) {
        saveVisitToFirestore();
      }

      // Get AI response
      let response = '';
      let isBlocked = false;
      let waRedirectData = null;

      const aiResult = await sendToAI(userMessage);

      if (aiResult === null) {
        // No AI configured - show helpful message
        if (config.whatsappDestination) {
          response = `⚠️ El asistente de IA aún no está configurado por el administrador.\n\n¡Pero no te preocupes! Puedes contactarnos directamente por WhatsApp para una atención inmediata. 👇`;
        } else {
          response = `⚠️ El asistente de IA aún no está configurado.\n\nEl administrador debe configurar su API Key de OpenAI o Anthropic en el panel de control para activar las respuestas automáticas.`;
        }
      } else {
        response = aiResult.response;
        isBlocked = aiResult.blocked;
      }

      // Check for WhatsApp redirect command from AI (Robust Regex)
      const redirectMatch = response.match(/\[\s*WHATSAPP_REDIRECT\s*:\s*([\s\S]*?)\]/i);

      if (redirectMatch) {
        waRedirectData = redirectMatch[1].trim().replace(/^["']|["']$/g, '');
        // Remove the command from the visible response
        response = response.replace(redirectMatch[0], '').trim();
        // If response became empty, provide a default text
        if (!response) response = "¡Excelente! Te paso con un asesor en WhatsApp para confirmar los detalles.";
      }
      isLoading = false;
      messages.push({ role: 'assistant', content: response });

      // Handle Auto-Redirect & Save Lead
      if (waRedirectData && config.whatsappDestination) {
        console.log('LeadWidget: Auto-redirecting to WhatsApp with data:', waRedirectData);

        // Save Qualified Lead to Firestore
        let leadName = 'Lead Calificado';
        // Try to extract name from the summary text (e.g. "Soy Juan...")
        const nameMatch = waRedirectData.match(/soy\s+([A-Za-zÁ-Úá-úñÑ]+)/i) || waRedirectData.match(/nombre\s+es\s+([A-Za-zÁ-Úá-úñÑ]+)/i) || waRedirectData.match(/Cliente\s+([A-Za-zÁ-Úá-úñÑ]+)/i);
        if (nameMatch) {
          leadName = nameMatch[1];
        }

        // Save with extracted info
        // Use 'Clic en WhatsApp' as marker since we don't have user's phone yet (they are just going to WA)
        saveLeadToFirestore(leadName, 'Clic en WhatsApp', waRedirectData);

        setTimeout(() => {
          const cleanDest = config.whatsappDestination.replace(/\D/g, '');
          const encodedMsg = encodeURIComponent(waRedirectData);
          window.open(`https://wa.me/${cleanDest}?text=${encodedMsg}`, '_blank');
        }, 2000); // 2s delay for better UX
      }

      renderMessages();

      if (isBlocked) {
        disableChatInput();
      }
    }

    // Disable Chat UI on Block
    function disableChatInput() {
      if (input) {
        input.disabled = true;
        input.placeholder = "Chat bloqueado por seguridad";
        input.style.opacity = "0.6";
        input.style.cursor = "not-allowed";
      }
      const sendBtn = document.getElementById('lw-send');
      if (sendBtn) {
        sendBtn.disabled = true;
        sendBtn.style.opacity = "0.5";
        sendBtn.style.cursor = "not-allowed";
      }
    }

    // Toggle panel
    function togglePanel(show) {
      isOpen = show;
      panel.style.display = show ? 'flex' : 'none';
      panel.classList.toggle('open', show);
      closeMobile.classList.toggle('visible', show);
      button.style.display = show ? 'none' : 'flex';
      teaser.style.display = 'none';

      if (show) {
        stopVibration();
        stopTeaserCycle();
        if (messages.length === 0) {
          messages.push({ role: 'assistant', content: config.welcomeMessage });
          renderMessages();
        }
        startTestimonialRotator();
      } else {
        hasBeenClosedOnce = true;
        startVibration();
        // Start teaser cycle after a short delay
        // Start teaser cycle after a short delay
        teaserStartTimeout = setTimeout(() => {
          startTeaserCycle();
        }, 2000);

        stopTestimonialRotator();
      }
    }

    // Testimonial Rotator Logic (Bulletproof)
    function startTestimonialRotator() {
      if (!config.testimonials || !Array.isArray(config.testimonials) || config.testimonials.length === 0) {
        if (testimonialBar) testimonialBar.style.display = 'none';
        return;
      }

      if (testimonialBar) testimonialBar.style.display = 'flex';
      let tIndex = 0;

      const showTestimonial = () => {
        const t = config.testimonials[tIndex];
        if (!t) return;

        // Animate out (if not first) - simplified to just fade in new content
        if (tContentDiv) {
          tContentDiv.classList.remove('lw-fade-in');
          void tContentDiv.offsetWidth; // trigger reflow
          tContentDiv.classList.add('lw-fade-in');
        }

        if (tImg) tImg.src = t.avatar_url || `https://ui-avatars.com/api/?name=${(t.name || 'C').replace(' ', '+')}&background=random`;
        if (tName) tName.textContent = t.name || 'Cliente';
        if (tStars) tStars.textContent = '★'.repeat(t.stars || 5);
        if (tText) tText.textContent = `"${t.text || ''}"`;

        tIndex = (tIndex + 1) % config.testimonials.length;
      };

      showTestimonial(); // Show first immediately
      if (config.testimonials.length > 1) {
        testimonialInterval = setInterval(showTestimonial, 4000);
      }
    }

    function stopTestimonialRotator() {
      if (testimonialInterval) {
        clearInterval(testimonialInterval);
        testimonialInterval = null;
      }
    }

    // Teaser cycle
    function startTeaserCycle() {
      if (isOpen || !config.teaserMessages || config.teaserMessages.length === 0) {
        console.log('LeadWidget: Teaser cycle not started', { isOpen, teaserCount: config.teaserMessages?.length });
        return;
      }

      stopTeaserCycle();
      let index = Math.floor(Math.random() * config.teaserMessages.length);

      const showTeaser = () => {
        if (isOpen) return;
        activeTeaser = config.teaserMessages[index];
        teaserText.textContent = activeTeaser;
        teaser.style.display = 'block';
        console.log('LeadWidget: Showing teaser:', activeTeaser);
        index = (index + 1) % config.teaserMessages.length;
      };

      showTeaser();
      teaserInterval = setInterval(showTeaser, 8000);
    }

    function stopTeaserCycle() {
      if (teaserInterval) {
        clearInterval(teaserInterval);
        teaserInterval = null;
      }
      teaser.style.display = 'none';
    }

    // Exit intent handler
    function handleExitIntent(e) {
      // Robust check for exit intent (mouse leaving viewport at the top)
      const isExit = e.clientY <= 5 || (e.relatedTarget === null && e.clientY < 10);

      if (isExit && !exitIntentShown && !isOpen && config.exitIntentEnabled) {
        console.log('LeadWidget: Exit intent detected');
        exitIntentShown = true;
        exitOverlay.style.display = 'flex';
      }
    }

    // Event listeners
    button.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log('LeadWidget: Launcher clicked');
      togglePanel(true);
    };

    closeBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      togglePanel(false);
    });
    closeMobile.addEventListener('click', () => togglePanel(false));
    teaser.addEventListener('click', () => togglePanel(true));
    teaserClose.addEventListener('click', (e) => { e.stopPropagation(); teaser.style.display = 'none'; });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      handleSendMessage();
    });

    exitCta.addEventListener('click', () => {
      exitOverlay.style.display = 'none';
      togglePanel(true);
    });
    exitClose.addEventListener('click', () => { exitOverlay.style.display = 'none'; });
    exitOverlay.addEventListener('click', (e) => { if (e.target === exitOverlay) exitOverlay.style.display = 'none'; });

    // Exit intent (desktop only) - Use both mouseout and mouseleave for better coverage
    document.addEventListener('mouseout', handleExitIntent);
    document.addEventListener('mouseleave', handleExitIntent);

    // Start vibration immediately
    // Start vibration immediately (if closed)
    if (!isOpen) startVibration();

    // Restore teaser if it was running (re-render happened while closed)
    if (hasBeenClosedOnce && !isOpen) {
      teaserStartTimeout = setTimeout(() => startTeaserCycle(), 2000);
    }

    // Auto-open after delay (only if never closed and not open)
    if (!hasBeenClosedOnce && !isOpen) {
      autoOpenTimeout = setTimeout(() => {
        if (!isOpen && !hasBeenClosedOnce) togglePanel(true);
      }, (config.triggerDelay || 5) * 1000);
    }

    // Render initial
    renderMessages();
  }

  // Refresh config periodically (every 30 seconds)
  async function refreshConfig() {
    const newConfig = await getWidgetConfig(config.clientId);
    if (newConfig) {
      // Check for visual changes that require re-render
      const visualKeys = [
        'primaryColor', 'businessName', 'welcomeMessage',
        'whatsappDestination', 'quickReplies', 'teaserMessages',
        'chatPlaceholder', 'exitIntentTitle', 'exitIntentDescription', 'exitIntentCta',
        'vibrationIntensity', 'testimonials', 'launcherIcon'
      ];

      let hasVisualChanges = false;
      for (const key of visualKeys) {
        if (JSON.stringify(newConfig[key]) !== JSON.stringify(config[key])) {
          hasVisualChanges = true;
          break;
        }
      }

      // Check for functional changes (AI, etc) to log them
      const hasFunctionalChanges = JSON.stringify(newConfig) !== JSON.stringify(config);

      // Always update config state (for AI parameters, logic, etc)
      if (hasFunctionalChanges) {
        Object.assign(config, newConfig);
        console.log('LeadWidget: Config updated in background');
      }

      // Only re-render if visual changes occurred AND widget is closed
      // If widget is open, we avoid re-rendering to not disrupt the user
      if (hasVisualChanges) {
        if (!isOpen) {
          console.log('LeadWidget: Visual changes detected, re-rendering...');
          renderWidget();
        } else {
          console.log('LeadWidget: Visual changes detected but widget is open. Skipping re-render.');
        }
      }
    }
  }

  // Main Initialization
  async function initialize() {
    const clientId = window.LEADWIDGET_CLIENT_ID || window.LEADWIDGET_CONFIG?.clientId;

    console.log('LeadWidget: Initializing with client ID:', clientId);

    if (clientId) {
      config.clientId = clientId;
      config.projectId = defaultConfig.projectId;
      config.apiKey = defaultConfig.apiKey;

      // Load widget config
      const remoteConfig = await getWidgetConfig(clientId);
      if (remoteConfig) {
        Object.assign(config, remoteConfig);
        console.log('LeadWidget: Loaded configuration for', config.businessName);
        console.log('LeadWidget: Teaser messages:', config.teaserMessages);
        console.log('LeadWidget: Vibration:', config.vibrationIntensity);
        console.log('LeadWidget: AI Config loaded from widget_configs, API key present:', !!config.ai_api_key);
      }
    }

    renderWidget();

    // Refresh config every 30 seconds for dynamic updates
    configRefreshInterval = setInterval(refreshConfig, 30000);
  }

  // Start
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    initialize();
  }

})();
