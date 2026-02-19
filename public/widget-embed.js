(function () {
  'use strict';

  // Default Configuration
  const defaultConfig = {
    primaryColor: '#00C185',
    businessName: 'LeadWidget',
    welcomeMessage: "Hi! I'm the qualification assistant. In under 2 minutes, our AI can call you and help you book or close customers live. What would you like to do?",
    whatsappDestination: '',
    template: 'general',
    chatPlaceholder: 'Type your message...',
    quickReplies: ['Book more appointments', 'Close deals by phone', 'See how it works'],
    teaserMessages: ['How can we help you today? 👋', 'Do you have any questions? ✨', 'We are online now 🚀'],
    vibrationIntensity: 'soft',
    triggerDelay: 5,
    exitIntentEnabled: true,
    exitIntentTitle: 'Wait a second',
    exitIntentDescription: 'Do you want quick help before you leave?',
    exitIntentCta: 'Open chat',
    testimonials: [],
    liveActivities: [],
    hideBranding: false,
    brandingText: '',
    brandingLink: '',
    consentText: 'I agree to be contacted by phone or messages to continue my request.',
    consentTextVersion: 'v1',
    iacloserRedirectUrl: '',
    iacloserEnabled: false,
    projectId: 'leads-widget',
    apiKey: 'AIzaSyCXNFoeg1nrYcFHzU9TEKNnDPg1mHU3_tA'
  };

  const LEGACY_QUICK_REPLIES = {
    en: ['Book more appointments', 'Close deals by phone', 'See how it works'],
    es: ['Agendar clientes', 'Cerrar ventas por llamada', 'Ver como funciona']
  };

  const OLD_QUICK_REPLY_SETS = [
    ['How does it work?', 'I want more information', 'See pricing'],
    ['Como funciona?', 'Quiero mas informacion', 'Ver precios']
  ];

  const LEGACY_TEASERS = {
    en: ['How can we help you today? 👋', 'Do you have any questions? ✨', 'We are online now 🚀'],
    es: ['Como podemos ayudarte? 👋', 'Tienes alguna duda? ✨', 'Estamos en linea ahora 🚀']
  };

  const LIVE_ACTIVITY_DEFAULTS = {
    en: [
      'Mark got the ICallCloser system.',
      'Samantha requested a call in under 60 seconds.',
      'Robert shared his phone and accepted contact consent.',
      'Emily asked for pricing and moved to a closer call.'
    ],
    es: [
      'Mark adquirio el sistema ICallCloser.',
      'Samantha solicito llamada en menos de 60 segundos.',
      'Robert compartio su telefono y acepto el consentimiento.',
      'Emily pidio precios y paso a llamada de cierre.'
    ]
  };

  const I18N = {
    en: {
      headerSubtitle: 'Instant AI replies',
      chatPlaceholder: 'Type your message...',
      closeExitIntent: 'No thanks',
      liveActivityLabel: 'Live activity',
      viralTexts: ['Powered by LeadWidget', 'Want this chat on your website?', 'Create your FREE widget here'],
      aiUnavailableWithWa: 'The AI assistant is not configured yet. You can contact us on WhatsApp for immediate support.',
      aiUnavailableNoWa: 'The AI assistant is not configured yet. The admin must add an OpenAI or Anthropic API key.',
      fallbackResponse: 'I had a connection issue. Want to continue on WhatsApp?',
      blockedPlaceholder: 'Chat blocked for security reasons',
      waFallback: 'Great! I will connect you with an advisor on WhatsApp now.',
      systemAudioUnsupported: 'Voice input is not supported in this browser.',
      languageLabel: 'ES',
      themeLabel: 'Theme',
      voiceLabel: 'Voice input',
      emojiLabel: 'Emoji picker'
    },
    es: {
      headerSubtitle: 'Respuestas con IA al instante',
      chatPlaceholder: 'Escribe tu mensaje...',
      closeExitIntent: 'No gracias',
      liveActivityLabel: 'Actividad en vivo',
      viralTexts: ['Potenciado por LeadWidget', 'Quieres este chat en tu web?', 'Crea tu widget GRATIS aqui'],
      aiUnavailableWithWa: 'El asistente de IA aun no esta configurado. Puedes escribirnos por WhatsApp para atencion inmediata.',
      aiUnavailableNoWa: 'El asistente de IA aun no esta configurado. El administrador debe agregar la API key de OpenAI o Anthropic.',
      fallbackResponse: 'Tuve un problema de conexion. Quieres continuar por WhatsApp?',
      blockedPlaceholder: 'Chat blocked for security reasons',
      waFallback: 'Excelente, te paso con un asesor por WhatsApp.',
      systemAudioUnsupported: 'La entrada por voz no es compatible con este navegador.',
      languageLabel: 'EN',
      themeLabel: 'Tema',
      voiceLabel: 'Entrada por voz',
      emojiLabel: 'Selector de emojis'
    }
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
  let themeMode = 'light';
  let activeLanguage = 'en';
  let speechRecognition = null;
  let isListening = false;
  let emojiPanelOpen = false;

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

  function normalizeText(value) {
    return String(value || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function parseStringList(value) {
    if (Array.isArray(value)) {
      return value
        .map(item => {
          if (typeof item === 'string') return item.trim();
          if (item && typeof item === 'object') {
            const candidate = item.message || item.text || item.label || '';
            return String(candidate).trim();
          }
          return String(item || '').trim();
        })
        .filter(Boolean);
    }
    if (typeof value === 'string') {
      return value
        .split('\n')
        .map(item => item.trim())
        .filter(Boolean);
    }
    return [];
  }

  function getText(key) {
    const lang = I18N[activeLanguage] ? activeLanguage : 'en';
    return I18N[lang][key] || I18N.en[key] || '';
  }

  function arraysLooselyMatch(a, b) {
    if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return false;
    return a.every((item, idx) => normalizeText(item) === normalizeText(b[idx]));
  }

  function shouldUseLocalizedQuickReplies(currentQuickReplies) {
    return (
      arraysLooselyMatch(currentQuickReplies, LEGACY_QUICK_REPLIES.en) ||
      arraysLooselyMatch(currentQuickReplies, LEGACY_QUICK_REPLIES.es) ||
      OLD_QUICK_REPLY_SETS.some(set => arraysLooselyMatch(currentQuickReplies, set))
    );
  }

  function shouldUseLocalizedTeasers(currentTeasers) {
    return (
      arraysLooselyMatch(currentTeasers, LEGACY_TEASERS.en) ||
      arraysLooselyMatch(currentTeasers, LEGACY_TEASERS.es)
    );
  }

  function getLocalizedQuickReplies(currentQuickReplies) {
    if (!Array.isArray(currentQuickReplies) || currentQuickReplies.length === 0 || shouldUseLocalizedQuickReplies(currentQuickReplies)) {
      return [...LEGACY_QUICK_REPLIES[activeLanguage]];
    }
    return currentQuickReplies;
  }

  function getLocalizedTeaserMessages(currentTeasers) {
    if (!Array.isArray(currentTeasers) || currentTeasers.length === 0 || shouldUseLocalizedTeasers(currentTeasers)) {
      return [...LEGACY_TEASERS[activeLanguage]];
    }
    return currentTeasers;
  }

  function shouldUseLocalizedLiveActivities(currentLiveActivities) {
    return (
      arraysLooselyMatch(currentLiveActivities, LIVE_ACTIVITY_DEFAULTS.en) ||
      arraysLooselyMatch(currentLiveActivities, LIVE_ACTIVITY_DEFAULTS.es)
    );
  }

  function getLocalizedLiveActivities(currentLiveActivities) {
    if (!Array.isArray(currentLiveActivities) || currentLiveActivities.length === 0 || shouldUseLocalizedLiveActivities(currentLiveActivities)) {
      return [...LIVE_ACTIVITY_DEFAULTS[activeLanguage]];
    }
    return currentLiveActivities;
  }

  function containsEmoji(text) {
    if (!text) return false;
    try {
      return /\p{Extended_Pictographic}/u.test(text);
    } catch (_) {
      return /[\u{1F300}-\u{1FAFF}]/u.test(text);
    }
  }

  function withBotEmoji(text) {
    if (!text || containsEmoji(text)) return text;
    const pool = activeLanguage === 'es' ? ['😊', '✨', '🙌', '👍'] : ['😊', '✨', '🙌', '👍'];
    return `${pool[Math.floor(Math.random() * pool.length)]} ${text}`;
  }

  function updateLocalizedDefaults() {
    const welcomeDefaults = [
      'Hi! I am your virtual assistant. How can I help you today?',
      "Hi! I'm the qualification assistant. In under 2 minutes, our AI can call you and help you book or close customers live. What would you like to do?",
      'Hola! Soy tu asistente virtual. En que puedo ayudarte hoy?',
      'Hola, soy el asistente de pre-calificacion. En menos de 2 minutos podemos llamarte y ayudarte a cerrar o agendar clientes. Que te gustaria hacer ahora?'
    ];
    if (welcomeDefaults.some(item => normalizeText(config.welcomeMessage) === normalizeText(item))) {
      config.welcomeMessage = activeLanguage === 'es'
        ? 'Hola, soy el asistente de pre-calificacion. En menos de 2 minutos podemos llamarte y ayudarte a cerrar o agendar clientes. Que te gustaria hacer ahora?'
        : "Hi! I'm the qualification assistant. In under 2 minutes, our AI can call you and help you book or close customers live. What would you like to do?";
    }

    const placeholderDefaults = ['Type your message...', 'Escribe tu mensaje...'];
    if (!config.chatPlaceholder || placeholderDefaults.some(item => normalizeText(config.chatPlaceholder) === normalizeText(item))) {
      config.chatPlaceholder = getText('chatPlaceholder');
    }

    const exitTitleDefaults = ['Wait a second', 'Espera un segundo'];
    if (!config.exitIntentTitle || exitTitleDefaults.some(item => normalizeText(config.exitIntentTitle) === normalizeText(item))) {
      config.exitIntentTitle = activeLanguage === 'es' ? 'Espera un segundo' : 'Wait a second';
    }

    const exitDescDefaults = [
      'Do you want quick help before you leave?',
      'Quieres ayuda rapida antes de salir?'
    ];
    if (!config.exitIntentDescription || exitDescDefaults.some(item => normalizeText(config.exitIntentDescription) === normalizeText(item))) {
      config.exitIntentDescription = activeLanguage === 'es'
        ? 'Quieres ayuda rapida antes de salir?'
        : 'Do you want quick help before you leave?';
    }

    const exitCtaDefaults = ['Open chat', 'Abrir chat'];
    if (!config.exitIntentCta || exitCtaDefaults.some(item => normalizeText(config.exitIntentCta) === normalizeText(item))) {
      config.exitIntentCta = activeLanguage === 'es' ? 'Abrir chat' : 'Open chat';
    }

    if (shouldUseLocalizedQuickReplies(config.quickReplies)) {
      config.quickReplies = [...LEGACY_QUICK_REPLIES[activeLanguage]];
    }

    if (shouldUseLocalizedTeasers(config.teaserMessages)) {
      config.teaserMessages = [...LEGACY_TEASERS[activeLanguage]];
    }

    if (shouldUseLocalizedLiveActivities(config.liveActivities)) {
      config.liveActivities = [...LIVE_ACTIVITY_DEFAULTS[activeLanguage]];
    }
  }

  function getBackendApiBase() {
    try {
      const scripts = document.getElementsByTagName('script');
      for (const s of scripts) {
        if (s.src && s.src.includes('widget-embed.js')) {
          const parsed = new URL(s.src);
          return `${parsed.origin}/api`;
        }
      }
    } catch (e) {
      console.warn('LeadWidget: Could not detect backend API base', e);
    }
    return '/api';
  }

  // Get widget config from Firestore
  async function getWidgetConfig(identity) {
    if (!identity) return null;

    const backendApi = getBackendApiBase();

    // Primary source: backend public endpoint (avoids browser blockers/permission edge cases)
    try {
      const backendResponse = await fetch(`${backendApi}/widget-config/${encodeURIComponent(identity)}`, {
        method: 'GET',
        cache: 'no-store'
      });

      if (backendResponse.ok) {
        const payload = await backendResponse.json();
        if (payload && payload.config) {
          const liveActivities = parseStringList(
            payload.config.liveActivities ||
            payload.config.liveActivityMessages ||
            payload.config.leadChatLiveToasts
          );
          return {
            ...payload.config,
            liveActivities: liveActivities.length > 0 ? liveActivities : [...config.liveActivities],
            clientId: payload.config.clientId || config.clientId || identity,
            widgetId: payload.config.widgetId || identity
          };
        }
      }
    } catch (e) {
      console.warn('LeadWidget: Backend config lookup failed, using Firestore fallback', e);
    }

    try {
      const projectId = config.projectId || defaultConfig.projectId;
      const apiKey = config.apiKey || defaultConfig.apiKey;
      const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents:runQuery?key=${apiKey}`;

      const queryByWidgetId = {
        structuredQuery: {
          from: [{ collectionId: "widget_configs" }],
          where: {
            fieldFilter: {
              field: { fieldPath: "widget_id" },
              op: "EQUAL",
              value: { stringValue: identity }
            }
          },
          limit: 1
        }
      };

      let response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(queryByWidgetId)
      });

      let data = await response.json();

      if (!(data && data[0] && data[0].document)) {
        const queryByUserId = {
          structuredQuery: {
            from: [{ collectionId: "widget_configs" }],
            where: {
              fieldFilter: {
                field: { fieldPath: "user_id" },
                op: "EQUAL",
                value: { stringValue: identity }
              }
            },
            limit: 1
          }
        };

        response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(queryByUserId)
        });
        data = await response.json();
      }

      if (data && data[0] && data[0].document) {
        const fields = data[0].document.fields;
        const resolvedClientId = fields.user_id?.stringValue || config.clientId || identity;
        const resolvedWidgetId = fields.widget_id?.stringValue || identity;

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

        // Parse live activities for the live activity bar (not testimonials)
        let liveActivities = [];
        if (fields.lead_chat_live_toasts?.arrayValue?.values) {
          liveActivities = fields.lead_chat_live_toasts.arrayValue.values.map(v => v.stringValue).filter(Boolean);
        } else if (fields.lead_chat_live_toasts?.stringValue) {
          liveActivities = parseStringList(fields.lead_chat_live_toasts.stringValue);
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
          liveActivities: liveActivities,
          launcherIcon: fields.launcher_icon?.stringValue || '',
          vibrationIntensity: fields.vibration_intensity?.stringValue || 'soft',
          triggerDelay: parseInt(fields.trigger_delay?.integerValue) || 5,
          exitIntentEnabled: fields.trigger_exit_intent?.booleanValue !== false,
          exitIntentTitle: fields.exit_intent_title?.stringValue || defaultConfig.exitIntentTitle,
          exitIntentDescription: fields.exit_intent_description?.stringValue || defaultConfig.exitIntentDescription,
          exitIntentCta: fields.exit_intent_cta?.stringValue || defaultConfig.exitIntentCta,
          clientId: resolvedClientId,
          widgetId: resolvedWidgetId,
          hideBranding: fields.hide_branding?.booleanValue === true,
          brandingText: fields.branding_text?.stringValue || '',
          brandingLink: fields.branding_link?.stringValue || '',
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
          widgetId: config.widgetId || config.clientId
        })
      });

      const data = await response.json();

      return {
        response: data.response || withBotEmoji('I could not process your message.'),
        blocked: response.status === 403 || data.blocked === true
      };
    } catch (error) {
      console.error('LeadWidget: Connection Error', error);
      return {
        response: withBotEmoji(getText('fallbackResponse')),
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

  function toSafeBrandingLink(value) {
    if (typeof value !== 'string') return '';
    const normalized = value.trim();
    if (!normalized) return '';
    try {
      const parsed = new URL(normalized);
      if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return '';
      return parsed.toString();
    } catch (error) {
      return '';
    }
  }

  function getDefaultBrandingLink() {
    if (config.clientId) {
      return `https://leads-widget.vercel.app/crear-ahora?ref=${encodeURIComponent(config.clientId)}`;
    }
    return 'https://leads-widget.vercel.app/crear-ahora';
  }

  // Render the widget
  function renderWidget() {
    // Cleanup previous state to prevent conflicts
    cleanupWidget();

    // Remove existing if present
    const existing = document.getElementById('lw-root');
    if (existing) existing.remove();

    updateLocalizedDefaults();
    config.quickReplies = getLocalizedQuickReplies(config.quickReplies);
    config.teaserMessages = getLocalizedTeaserMessages(config.teaserMessages);
    config.liveActivities = getLocalizedLiveActivities(config.liveActivities);

    const styles = `
      #lw-root,
      #lw-root * { box-sizing: border-box; font-family: "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
      #lw-root {
        --lw-primary: ${config.primaryColor};
        --lw-primary-strong: ${adjustColor(config.primaryColor, -26)};
        --lw-surface: #ffffff;
        --lw-surface-soft: #f3f6fb;
        --lw-surface-strong: #edf2f7;
        --lw-text: #0f172a;
        --lw-muted: #475569;
        --lw-border: rgba(148, 163, 184, 0.28);
        --lw-shadow: 0 22px 48px rgba(15, 23, 42, 0.22);
      }
      #lw-root[data-theme="dark"] {
        --lw-surface: #0b1220;
        --lw-surface-soft: #09101d;
        --lw-surface-strong: #101a2c;
        --lw-text: #e2e8f0;
        --lw-muted: #9aa8bf;
        --lw-border: rgba(148, 163, 184, 0.22);
        --lw-shadow: 0 26px 56px rgba(2, 6, 23, 0.55);
      }

      #lw-button {
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 2147483646;
        width: 60px;
        height: 60px;
        border-radius: 999px;
        border: none;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: transform 0.25s ease, box-shadow 0.25s ease;
        box-shadow: 0 10px 28px rgba(2, 8, 23, 0.28);
        background: linear-gradient(145deg, var(--lw-primary) 0%, var(--lw-primary-strong) 100%);
        -webkit-tap-highlight-color: transparent;
        outline: none;
      }
      #lw-button:hover { transform: translateY(-2px) scale(1.04); }
      #lw-button:focus-visible { box-shadow: 0 0 0 3px rgba(255,255,255,0.6), 0 0 0 6px var(--lw-primary); }
      #lw-button > * { pointer-events: none; }

      @keyframes lw-vibrate-soft { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.08); } }
      @keyframes lw-vibrate-strong {
        0%, 100% { transform: translateX(0) scale(1); }
        20% { transform: translateX(-3px) scale(1.02); }
        40% { transform: translateX(3px) scale(1.02); }
        60% { transform: translateX(-3px) scale(1.02); }
        80% { transform: translateX(3px) scale(1.02); }
      }
      #lw-button.lw-vibrating-soft { animation: lw-vibrate-soft 1.5s ease-in-out infinite; }
      #lw-button.lw-vibrating-strong { animation: lw-vibrate-strong 0.6s ease-in-out infinite; }

      #lw-teaser {
        position: fixed;
        bottom: 92px;
        right: 20px;
        z-index: 999997;
        background: var(--lw-surface);
        border: 1px solid var(--lw-border);
        padding: 12px 16px;
        border-radius: 16px 16px 6px 16px;
        box-shadow: var(--lw-shadow);
        max-width: 280px;
        font-size: 13px;
        color: var(--lw-text);
        font-weight: 550;
        animation: lw-teaser-in 0.35s ease-out;
        cursor: pointer;
        display: none;
        backdrop-filter: blur(10px);
      }
      @keyframes lw-teaser-in { from { opacity: 0; transform: translateY(8px) scale(0.97); } to { opacity: 1; transform: translateY(0) scale(1); } }
      #lw-teaser-close {
        position: absolute;
        top: -8px;
        right: -8px;
        width: 20px;
        height: 20px;
        border-radius: 999px;
        background: #64748b;
        border: none;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      #lw-panel {
        position: fixed;
        bottom: 16px;
        right: 16px;
        left: 16px;
        z-index: 999999;
        width: auto;
        max-width: 420px;
        height: 74vh;
        max-height: 640px;
        background:
          radial-gradient(120% 100% at 10% -10%, rgba(255,255,255,0.32), transparent 42%),
          radial-gradient(120% 100% at 100% -20%, ${config.primaryColor}20, transparent 46%),
          var(--lw-surface);
        border: 1px solid var(--lw-border);
        border-radius: 28px;
        box-shadow: var(--lw-shadow);
        display: none;
        flex-direction: column;
        overflow: hidden;
        animation: lw-slideUp 0.35s ease-out;
        backdrop-filter: blur(16px);
      }
      @media (min-width: 640px) {
        #lw-panel { left: auto; width: 400px; height: 620px; right: 20px; bottom: 20px; }
      }
      @keyframes lw-slideUp { from { opacity: 0; transform: translateY(20px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }

      #lw-header {
        padding: 15px 16px;
        display: flex;
        align-items: center;
        gap: 10px;
        color: white;
        background: linear-gradient(135deg, var(--lw-primary) 0%, var(--lw-primary-strong) 100%);
        border-bottom: 1px solid rgba(255,255,255,0.1);
      }
      #lw-avatar {
        width: 38px;
        height: 38px;
        background: rgba(255,255,255,0.22);
        border-radius: 999px;
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
        flex-shrink: 0;
      }
      #lw-avatar::after {
        content: '';
        position: absolute;
        bottom: 2px;
        right: 1px;
        width: 10px;
        height: 10px;
        background: #22c55e;
        border-radius: 999px;
        border: 2px solid var(--lw-primary);
      }
      #lw-header-actions { display: inline-flex; gap: 6px; align-items: center; }
      .lw-chip-btn,
      .lw-icon-btn {
        border: 1px solid rgba(255,255,255,0.28);
        background: rgba(255,255,255,0.15);
        color: #ffffff;
        border-radius: 999px;
        cursor: pointer;
        transition: background 0.2s ease, transform 0.2s ease;
      }
      .lw-chip-btn:hover,
      .lw-icon-btn:hover { background: rgba(255,255,255,0.26); transform: translateY(-1px); }
      .lw-chip-btn:focus-visible,
      .lw-icon-btn:focus-visible { outline: none; box-shadow: 0 0 0 2px rgba(255,255,255,0.75), 0 0 0 4px rgba(2,6,23,0.4); }
      .lw-chip-btn { min-width: 40px; height: 30px; padding: 0 10px; font-size: 11px; font-weight: 700; letter-spacing: 0.06em; }
      .lw-icon-btn { width: 30px; height: 30px; display: inline-flex; align-items: center; justify-content: center; }
      #lw-close-btn { border-color: rgba(255,255,255,0.28); }

      #lw-live-bar {
        --mx: 50%;
        --my: 50%;
        position: relative;
        background: color-mix(in srgb, var(--lw-surface) 92%, white 8%);
        border-bottom: 1px solid var(--lw-border);
        padding: 9px 12px;
        display: none;
        align-items: center;
        gap: 10px;
        animation: lw-slideDown 0.3s ease-out;
        overflow: hidden;
      }
      #lw-live-bar::before {
        content: "";
        position: absolute;
        inset: -35%;
        background:
          radial-gradient(circle at var(--mx) var(--my), rgba(255,255,255,0.54) 0%, rgba(255,255,255,0) 42%),
          conic-gradient(from 0deg, rgba(99,102,241,0), rgba(56,189,248,0.24), rgba(16,185,129,0.22), rgba(99,102,241,0));
        opacity: 0;
        transition: opacity 0.24s ease;
        pointer-events: none;
        filter: blur(14px) saturate(1.2);
      }
      #lw-live-bar:hover::before {
        opacity: 1;
        animation: lw-iridescence 4.6s linear infinite;
      }
      @keyframes lw-iridescence {
        0% { transform: rotate(0deg) scale(1); }
        100% { transform: rotate(360deg) scale(1.08); }
      }
      @keyframes lw-slideDown { from { transform: translateY(-10px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
      .lw-live-dot {
        width: 10px;
        height: 10px;
        border-radius: 999px;
        background: #22c55e;
        box-shadow: 0 0 0 0 rgba(34,197,94,0.5);
        animation: lw-livePulse 1.8s ease-out infinite;
        position: relative;
        z-index: 1;
        flex-shrink: 0;
      }
      @keyframes lw-livePulse {
        0% { box-shadow: 0 0 0 0 rgba(34,197,94,0.5); }
        100% { box-shadow: 0 0 0 10px rgba(34,197,94,0); }
      }
      .lw-live-content { flex: 1; overflow: hidden; position: relative; z-index: 1; }
      .lw-live-label {
        display: block;
        font-size: 10px;
        font-weight: 700;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: var(--lw-primary);
        margin-bottom: 2px;
      }
      .lw-live-text {
        font-size: 12px;
        color: var(--lw-text);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .lw-fade-in { animation: lw-fadeInT 0.45s ease-in-out; }
      @keyframes lw-fadeInT { from { opacity: 0; transform: translateY(2px); } to { opacity: 1; transform: translateY(0); } }

      #lw-messages {
        flex: 1;
        overflow-y: auto;
        padding: 16px;
        background: var(--lw-surface-soft);
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      .lw-msg {
        max-width: 88%;
        padding: 12px 14px;
        border-radius: 16px;
        font-size: 14px;
        line-height: 1.45;
        animation: lw-fadeIn 0.25s ease-out;
        word-wrap: break-word;
        white-space: pre-wrap;
      }
      @keyframes lw-fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
      .lw-msg-assistant {
        background: var(--lw-surface);
        color: var(--lw-text);
        border: 1px solid var(--lw-border);
        border-bottom-left-radius: 6px;
        align-self: flex-start;
        box-shadow: 0 2px 5px rgba(2,6,23,0.05);
      }
      .lw-msg-user {
        background: linear-gradient(140deg, var(--lw-primary) 0%, var(--lw-primary-strong) 100%);
        color: #fff;
        border-bottom-right-radius: 6px;
        align-self: flex-end;
      }
      .lw-msg-system {
        background: var(--lw-surface-strong);
        color: var(--lw-muted);
        font-size: 12px;
        text-align: center;
        align-self: center;
        border-radius: 12px;
        padding: 8px 14px;
      }

      #lw-typing {
        display: flex;
        gap: 4px;
        padding: 11px 14px;
        background: var(--lw-surface);
        border-radius: 14px;
        border: 1px solid var(--lw-border);
        align-self: flex-start;
      }
      .lw-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--lw-primary); animation: lw-bounce 1.4s infinite ease-in-out both; }
      .lw-dot:nth-child(1) { animation-delay: 0s; }
      .lw-dot:nth-child(2) { animation-delay: 0.16s; }
      .lw-dot:nth-child(3) { animation-delay: 0.32s; }
      @keyframes lw-bounce { 0%, 80%, 100% { transform: scale(0); } 40% { transform: scale(1); } }

      #lw-input-area {
        padding: 10px 12px 10px;
        background: var(--lw-surface);
        border-top: 1px solid var(--lw-border);
      }
      #lw-quick-replies {
        display: flex;
        flex-wrap: nowrap;
        gap: 8px;
        margin-bottom: 10px;
        overflow-x: auto;
        overflow-y: hidden;
        scrollbar-width: none;
        -ms-overflow-style: none;
        padding-bottom: 2px;
      }
      #lw-quick-replies::-webkit-scrollbar { display: none; }
      .lw-quick-btn {
        flex: 0 0 auto;
        background: var(--lw-surface-soft);
        border: 1px solid var(--lw-border);
        padding: 8px 13px;
        border-radius: 999px;
        font-size: 12px;
        cursor: pointer;
        transition: all 0.2s;
        color: var(--lw-muted);
        white-space: nowrap;
      }
      .lw-quick-btn:hover { background: color-mix(in srgb, var(--lw-primary) 13%, var(--lw-surface)); color: var(--lw-primary); border-color: color-mix(in srgb, var(--lw-primary) 40%, var(--lw-border)); }

      #lw-form { display: grid; grid-template-columns: 1fr auto; gap: 8px; }
      #lw-composer {
        display: flex;
        align-items: center;
        gap: 8px;
        background: var(--lw-surface-soft);
        border: 1px solid var(--lw-border);
        border-radius: 14px;
        padding: 8px 10px;
        position: relative;
        min-width: 0;
      }
      #lw-input {
        flex: 1;
        min-width: 0;
        border: none;
        font-size: 14px;
        background: transparent;
        outline: none;
        color: var(--lw-text);
      }
      #lw-input::placeholder { color: color-mix(in srgb, var(--lw-muted) 72%, transparent); }
      #lw-composer:focus-within { border-color: color-mix(in srgb, var(--lw-primary) 55%, var(--lw-border)); box-shadow: 0 0 0 3px color-mix(in srgb, var(--lw-primary) 20%, transparent); }
      .lw-mini-btn {
        width: 28px;
        height: 28px;
        border-radius: 999px;
        border: 1px solid var(--lw-border);
        background: var(--lw-surface);
        color: var(--lw-muted);
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        transition: background 0.2s ease, color 0.2s ease, transform 0.2s ease;
        flex-shrink: 0;
      }
      .lw-mini-btn:hover { background: color-mix(in srgb, var(--lw-primary) 16%, var(--lw-surface)); color: var(--lw-primary); transform: translateY(-1px); }
      .lw-mini-btn:focus-visible { outline: none; box-shadow: 0 0 0 2px color-mix(in srgb, var(--lw-primary) 30%, transparent); }
      .lw-mini-btn.active { background: color-mix(in srgb, var(--lw-primary) 20%, var(--lw-surface)); color: var(--lw-primary); }

      #lw-emoji-panel {
        position: absolute;
        bottom: 42px;
        left: 8px;
        right: 8px;
        background: var(--lw-surface);
        border: 1px solid var(--lw-border);
        border-radius: 14px;
        padding: 8px;
        display: none;
        gap: 6px;
        flex-wrap: wrap;
        box-shadow: 0 18px 34px rgba(2,6,23,0.18);
        z-index: 2;
      }
      #lw-emoji-panel.open { display: flex; }
      .lw-emoji-btn {
        border: none;
        background: var(--lw-surface-soft);
        width: 32px;
        height: 32px;
        border-radius: 10px;
        cursor: pointer;
        font-size: 18px;
        line-height: 1;
      }
      .lw-emoji-btn:hover { background: color-mix(in srgb, var(--lw-primary) 14%, var(--lw-surface-soft)); }

      #lw-send {
        width: 48px;
        height: 48px;
        border-radius: 14px;
        border: none;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #fff;
        background: linear-gradient(140deg, var(--lw-primary) 0%, var(--lw-primary-strong) 100%);
        transition: opacity 0.2s, transform 0.2s;
        flex-shrink: 0;
        box-shadow: 0 8px 16px rgba(0, 193, 133, 0.2);
      }
      #lw-send:hover { opacity: 0.95; transform: translateY(-1px); }
      #lw-send:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

      #lw-footer {
        text-align: center;
        padding: 8px 0 2px;
        font-size: 9px;
        color: var(--lw-muted);
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      #lw-close-mobile {
        position: fixed;
        bottom: 16px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 1000000;
        width: 56px;
        height: 56px;
        border-radius: 999px;
        background: #dc2626;
        border: 4px solid #fff;
        color: #fff;
        cursor: pointer;
        box-shadow: 0 8px 22px rgba(0,0,0,0.35);
        display: none;
        align-items: center;
        justify-content: center;
      }
      @media (max-width: 639px) {
        #lw-close-mobile.visible { display: flex; }
        #lw-panel.open { padding-bottom: 72px; }
      }
      @media (min-width: 640px) {
        #lw-close-mobile { display: none !important; }
      }

      #lw-exit-overlay {
        position: fixed;
        inset: 0;
        background: rgba(15, 23, 42, 0.45);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        z-index: 1000001;
        display: none;
        align-items: center;
        justify-content: center;
        padding: 24px;
        animation: lw-fadeMask 0.35s ease-out;
      }
      @keyframes lw-fadeMask { from { opacity: 0; } to { opacity: 1; } }
      #lw-exit-popup {
        background: var(--lw-surface);
        border-radius: 28px;
        padding: 34px 28px;
        max-width: 420px;
        width: 100%;
        text-align: center;
        box-shadow: var(--lw-shadow);
        border: 1px solid var(--lw-border);
        animation: lw-popReveal 0.45s cubic-bezier(0.16, 1, 0.3, 1);
      }
      @keyframes lw-popReveal { from { opacity: 0; transform: scale(0.93) translateY(16px); } to { opacity: 1; transform: scale(1) translateY(0); } }
      #lw-exit-icon {
        width: 76px;
        height: 76px;
        background: color-mix(in srgb, var(--lw-primary) 16%, transparent);
        color: var(--lw-primary);
        border-radius: 22px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto 22px;
        transform: rotate(-8deg);
      }
      #lw-exit-title { font-size: 26px; font-weight: 800; color: var(--lw-text); margin-bottom: 10px; line-height: 1.2; letter-spacing: -0.02em; }
      #lw-exit-desc { font-size: 15px; color: var(--lw-muted); margin-bottom: 26px; line-height: 1.55; }
      #lw-exit-cta {
        width: 100%;
        padding: 14px;
        background: linear-gradient(140deg, var(--lw-primary) 0%, var(--lw-primary-strong) 100%);
        color: #fff;
        border: none;
        border-radius: 14px;
        font-weight: 700;
        cursor: pointer;
        font-size: 15px;
        transition: transform 0.2s ease, opacity 0.2s ease;
      }
      #lw-exit-cta:hover { transform: translateY(-1px); opacity: 0.95; }
      #lw-exit-close {
        background: none;
        border: none;
        color: var(--lw-muted);
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
        margin-top: 16px;
      }
      #lw-exit-close:hover { color: var(--lw-text); }
    `;
    const brandingHref = toSafeBrandingLink(config.brandingLink) || getDefaultBrandingLink();

    const html = `
      <div id="lw-root" data-theme="${themeMode}">
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
              <div id="lw-header-subtitle" style="font-size: 11px; opacity: 0.9;">${getText('headerSubtitle')}</div>
            </div>
            <div id="lw-header-actions">
              <button type="button" id="lw-lang-btn" class="lw-chip-btn" aria-label="Toggle language">${getText('languageLabel')}</button>
              <button type="button" id="lw-theme-btn" class="lw-icon-btn" aria-label="${getText('themeLabel')}">
                ${themeMode === 'dark'
          ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3a9 9 0 1 0 9 9 7 7 0 0 1-9-9z"></path></svg>'
          : '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="4"></circle><path d="M12 2v2"></path><path d="M12 20v2"></path><path d="m4.93 4.93 1.41 1.41"></path><path d="m17.66 17.66 1.41 1.41"></path><path d="M2 12h2"></path><path d="M20 12h2"></path><path d="m6.34 17.66-1.41 1.41"></path><path d="m19.07 4.93-1.41 1.41"></path></svg>'}
              </button>
              <button id="lw-close-btn" class="lw-icon-btn" type="button" aria-label="Close chat">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
              </button>
            </div>
          </div>

          <!-- Live Activity -->
          <div id="lw-live-bar">
            <span class="lw-live-dot" aria-hidden="true"></span>
            <div class="lw-live-content">
              <span id="lw-live-label" class="lw-live-label">${getText('liveActivityLabel')}</span>
              <div id="lw-live-text" class="lw-live-text"></div>
            </div>
          </div>

          <div id="lw-messages"></div>

          <div id="lw-input-area">
            <div id="lw-quick-replies"></div>
            <form id="lw-form">
              <div id="lw-composer">
                <button type="button" id="lw-emoji-btn" class="lw-mini-btn" aria-label="${getText('emojiLabel')}">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="9"></circle>
                    <path d="M8 14s1.5 2 4 2 4-2 4-2"></path>
                    <line x1="9" y1="10" x2="9.01" y2="10"></line>
                    <line x1="15" y1="10" x2="15.01" y2="10"></line>
                  </svg>
                </button>
                <button type="button" id="lw-mic-btn" class="lw-mini-btn" aria-label="${getText('voiceLabel')}">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="9" y="2" width="6" height="12" rx="3"></rect>
                    <path d="M5 10a7 7 0 0 0 14 0"></path>
                    <line x1="12" y1="19" x2="12" y2="22"></line>
                    <line x1="8" y1="22" x2="16" y2="22"></line>
                  </svg>
                </button>
                <input type="text" id="lw-input" placeholder="${config.chatPlaceholder || getText('chatPlaceholder')}" autocomplete="off">
                <div id="lw-emoji-panel"></div>
              </div>
              <button type="submit" id="lw-send">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="22" y1="2" x2="11" y2="13"></line>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                </svg>
              </button>
            </form>
            ${!config.hideBranding ? `
            <div id="lw-footer" style="text-align:center; padding:8px 0; font-size:10px;">
              <a href="${brandingHref}" target="_blank" rel="noopener noreferrer" style="color:${config.primaryColor}; text-decoration:none; font-weight:600; display:flex; align-items:center; justify-content:center; gap:4px;">
                <span style="background:rgba(0,0,0,0.05); padding:2px 6px; border-radius:4px; font-weight:800;">LW</span>
                <span id="lw-viral-text">${getText('viralTexts')[0]}</span>
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
            <button id="lw-exit-close">${getText('closeExitIntent')}</button>
          </div>
        </div>
      </div>
    `;

    const container = document.createElement('div');
    container.innerHTML = html;
    document.body.appendChild(container);

    // Get elements
    const root = document.getElementById('lw-root');
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
    const exitTitleEl = document.getElementById('lw-exit-title');
    const exitDescEl = document.getElementById('lw-exit-desc');
    const langBtn = document.getElementById('lw-lang-btn');
    const themeBtn = document.getElementById('lw-theme-btn');
    const emojiBtn = document.getElementById('lw-emoji-btn');
    const micBtn = document.getElementById('lw-mic-btn');
    const emojiPanel = document.getElementById('lw-emoji-panel');
    const subtitleEl = document.getElementById('lw-header-subtitle');
    const liveLabelEl = document.getElementById('lw-live-label');
    const liveBar = document.getElementById('lw-live-bar');
    const liveTextEl = document.getElementById('lw-live-text');
    const viralTextEl = document.getElementById('lw-viral-text');

    const quickEmojiSet = ['😀', '😄', '😊', '🔥', '👍', '✨', '🙌', '📞', '🚀', '🎯'];

    function themeIconMarkup() {
      if (themeMode === 'dark') {
        return '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3a9 9 0 1 0 9 9 7 7 0 0 1-9-9z"></path></svg>';
      }
      return '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="4"></circle><path d="M12 2v2"></path><path d="M12 20v2"></path><path d="m4.93 4.93 1.41 1.41"></path><path d="m17.66 17.66 1.41 1.41"></path><path d="M2 12h2"></path><path d="M20 12h2"></path><path d="m6.34 17.66-1.41 1.41"></path><path d="m19.07 4.93-1.41 1.41"></path></svg>';
    }

    function updateViralText() {
      if (!viralTextEl) return;
      const customBranding = (config.brandingText || '').trim();
      if (customBranding) {
        viralTextEl.textContent = customBranding;
      } else {
        const choices = getText('viralTexts');
        const randomText = choices[Math.floor(Math.random() * choices.length)];
        viralTextEl.textContent = randomText;
      }
    }

    function applyTheme() {
      if (root) root.setAttribute('data-theme', themeMode);
      if (themeBtn) themeBtn.innerHTML = themeIconMarkup();
    }

    function renderEmojiPanel() {
      if (!emojiPanel) return;
      emojiPanel.innerHTML = quickEmojiSet
        .map(emoji => `<button type="button" class="lw-emoji-btn" data-emoji="${emoji}">${emoji}</button>`)
        .join('');

      emojiPanel.querySelectorAll('.lw-emoji-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const emoji = btn.getAttribute('data-emoji') || '';
          input.value = `${input.value}${emoji}`;
          input.focus();
          emojiPanelOpen = false;
          emojiPanel.classList.remove('open');
          if (emojiBtn) emojiBtn.classList.remove('active');
        });
      });
    }

    function applyLanguageUI() {
      updateLocalizedDefaults();
      config.quickReplies = getLocalizedQuickReplies(config.quickReplies);
      config.teaserMessages = getLocalizedTeaserMessages(config.teaserMessages);
      config.liveActivities = getLocalizedLiveActivities(config.liveActivities);

      if (langBtn) langBtn.textContent = getText('languageLabel');
      if (subtitleEl) subtitleEl.textContent = getText('headerSubtitle');
      if (liveLabelEl) liveLabelEl.textContent = getText('liveActivityLabel');
      if (input) input.placeholder = config.chatPlaceholder || getText('chatPlaceholder');
      if (exitClose) exitClose.textContent = getText('closeExitIntent');
      if (exitTitleEl) exitTitleEl.textContent = config.exitIntentTitle || '';
      if (exitDescEl) exitDescEl.textContent = config.exitIntentDescription || '';
      if (exitCta) exitCta.textContent = config.exitIntentCta || '';
      if (emojiBtn) emojiBtn.setAttribute('aria-label', getText('emojiLabel'));
      if (micBtn) micBtn.setAttribute('aria-label', getText('voiceLabel'));
      if (themeBtn) themeBtn.setAttribute('aria-label', getText('themeLabel'));
      updateViralText();
      renderQuickReplies();
      if (isOpen) {
        startLiveActivityRotator();
      } else {
        stopLiveActivityRotator();
      }
    }

    function initSpeechRecognition() {
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SR) return null;
      const recognition = new SR();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
      recognition.onresult = (event) => {
        const transcript = event?.results?.[0]?.[0]?.transcript || '';
        if (transcript) {
          input.value = `${input.value}${input.value ? ' ' : ''}${transcript}`;
          input.focus();
        }
      };
      recognition.onstart = () => {
        isListening = true;
        if (micBtn) micBtn.classList.add('active');
      };
      recognition.onend = () => {
        isListening = false;
        if (micBtn) micBtn.classList.remove('active');
      };
      recognition.onerror = () => {
        isListening = false;
        if (micBtn) micBtn.classList.remove('active');
      };
      return recognition;
    }

    // Start vibration animation
    function startVibration() {
      if (config.vibrationIntensity === 'none' || isOpen) return;

      const vibClass = config.vibrationIntensity === 'strong' ? 'lw-vibrating-strong' : 'lw-vibrating-soft';
      button.classList.add(vibClass);
    }

    function stopVibration() {
      button.classList.remove('lw-vibrating-soft', 'lw-vibrating-strong');
    }

    // Render quick replies
    function renderQuickReplies() {
      if (messages.length > 2) {
        quickRepliesContainer.style.display = 'none';
        return;
      }
      const quickReplies = getLocalizedQuickReplies(config.quickReplies);
      quickRepliesContainer.style.display = 'flex';
      quickRepliesContainer.innerHTML = quickReplies.map(text =>
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
          response = getText('aiUnavailableWithWa');
        } else {
          response = getText('aiUnavailableNoWa');
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
        if (!response) response = getText('waFallback');
      }
      isLoading = false;
      messages.push({ role: 'assistant', content: withBotEmoji(response) });

      // Handle Auto-Redirect & Save Lead
      if (waRedirectData && config.whatsappDestination) {
        console.log('LeadWidget: Auto-redirecting to WhatsApp with data:', waRedirectData);

        // Save Qualified Lead to Firestore
        let leadName = activeLanguage === 'es' ? 'Lead calificado' : 'Qualified lead';
        // Try to extract common name snippets from the summary text.
        const nameMatch =
          waRedirectData.match(/i am\s+([A-Za-zÀ-ÿ'\-]+)/i) ||
          waRedirectData.match(/my name is\s+([A-Za-zÀ-ÿ'\-]+)/i) ||
          waRedirectData.match(/soy\s+([A-Za-zÀ-ÿ'\-]+)/i) ||
          waRedirectData.match(/nombre es\s+([A-Za-zÀ-ÿ'\-]+)/i) ||
          waRedirectData.match(/client\s+([A-Za-zÀ-ÿ'\-]+)/i) ||
          waRedirectData.match(/cliente\s+([A-Za-zÀ-ÿ'\-]+)/i);
        if (nameMatch) {
          leadName = nameMatch[1];
        }

        // Save with extracted info
        // Use a marker because user phone still comes later in WhatsApp.
        saveLeadToFirestore(leadName, activeLanguage === 'es' ? 'Clic en WhatsApp' : 'WhatsApp click', waRedirectData);

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
        input.placeholder = getText('blockedPlaceholder');
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
          messages.push({ role: 'assistant', content: withBotEmoji(config.welcomeMessage) });
          renderMessages();
        }
        startLiveActivityRotator();
      } else {
        hasBeenClosedOnce = true;
        startVibration();
        if (emojiPanel) emojiPanel.classList.remove('open');
        if (emojiBtn) emojiBtn.classList.remove('active');
        emojiPanelOpen = false;
        if (speechRecognition && isListening) {
          try { speechRecognition.stop(); } catch (_) { /* noop */ }
        }
        // Start teaser cycle after a short delay
        // Start teaser cycle after a short delay
        teaserStartTimeout = setTimeout(() => {
          startTeaserCycle();
        }, 2000);

        stopLiveActivityRotator();
      }
    }

    // Live activity rotator (independent from testimonials)
    function startLiveActivityRotator() {
      stopLiveActivityRotator();
      const activities = getLocalizedLiveActivities(config.liveActivities);

      if (!activities || !Array.isArray(activities) || activities.length === 0) {
        if (liveBar) liveBar.style.display = 'none';
        return;
      }

      if (liveBar) liveBar.style.display = 'flex';
      let activityIndex = 0;

      const showLiveActivity = () => {
        const currentActivity = activities[activityIndex];
        if (!currentActivity) return;

        if (liveTextEl) {
          liveTextEl.classList.remove('lw-fade-in');
          void liveTextEl.offsetWidth;
          liveTextEl.classList.add('lw-fade-in');
          liveTextEl.textContent = currentActivity;
        }

        activityIndex = (activityIndex + 1) % activities.length;
      };

      showLiveActivity();
      if (activities.length > 1) {
        testimonialInterval = setInterval(showLiveActivity, 4200);
      }
    }

    function stopLiveActivityRotator() {
      if (testimonialInterval) {
        clearInterval(testimonialInterval);
        testimonialInterval = null;
      }
    }

    // Teaser cycle
    function startTeaserCycle() {
      const teaserMessages = getLocalizedTeaserMessages(config.teaserMessages);
      if (isOpen || !teaserMessages || teaserMessages.length === 0) {
        console.log('LeadWidget: Teaser cycle not started', { isOpen, teaserCount: teaserMessages?.length });
        return;
      }

      stopTeaserCycle();
      let index = Math.floor(Math.random() * teaserMessages.length);

      const showTeaser = () => {
        if (isOpen) return;
        activeTeaser = teaserMessages[index];
        teaserText.textContent = activeTeaser;
        teaser.style.display = 'block';
        console.log('LeadWidget: Showing teaser:', activeTeaser);
        index = (index + 1) % teaserMessages.length;
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

    if (langBtn) {
      langBtn.addEventListener('click', () => {
        activeLanguage = activeLanguage === 'en' ? 'es' : 'en';
        applyLanguageUI();
      });
    }

    if (themeBtn) {
      themeBtn.addEventListener('click', () => {
        themeMode = themeMode === 'dark' ? 'light' : 'dark';
        applyTheme();
      });
    }

    if (emojiBtn && emojiPanel) {
      emojiBtn.addEventListener('click', () => {
        emojiPanelOpen = !emojiPanelOpen;
        emojiPanel.classList.toggle('open', emojiPanelOpen);
        emojiBtn.classList.toggle('active', emojiPanelOpen);
      });
    }

    if (micBtn) {
      speechRecognition = initSpeechRecognition();
      micBtn.addEventListener('click', () => {
        if (!speechRecognition) {
          messages.push({ role: 'system', content: getText('systemAudioUnsupported') });
          renderMessages();
          return;
        }
        try {
          if (isListening) {
            speechRecognition.stop();
            return;
          }
          speechRecognition.lang = activeLanguage === 'es' ? 'es-ES' : 'en-US';
          speechRecognition.start();
        } catch (_) {
          isListening = false;
          micBtn.classList.remove('active');
        }
      });
    }

    exitCta.addEventListener('click', () => {
      exitOverlay.style.display = 'none';
      togglePanel(true);
    });
    exitClose.addEventListener('click', () => { exitOverlay.style.display = 'none'; });
    exitOverlay.addEventListener('click', (e) => { if (e.target === exitOverlay) exitOverlay.style.display = 'none'; });

    document.addEventListener('click', (e) => {
      if (!emojiPanel || !emojiBtn) return;
      const clickInsideEmoji = emojiPanel.contains(e.target) || emojiBtn.contains(e.target);
      if (!clickInsideEmoji) {
        emojiPanelOpen = false;
        emojiPanel.classList.remove('open');
        emojiBtn.classList.remove('active');
      }
    });

    if (liveBar) {
      liveBar.addEventListener('mousemove', (event) => {
        const rect = liveBar.getBoundingClientRect();
        const x = ((event.clientX - rect.left) / rect.width) * 100;
        const y = ((event.clientY - rect.top) / rect.height) * 100;
        liveBar.style.setProperty('--mx', `${x}%`);
        liveBar.style.setProperty('--my', `${y}%`);
      });
      liveBar.addEventListener('mouseleave', () => {
        liveBar.style.setProperty('--mx', '50%');
        liveBar.style.setProperty('--my', '50%');
      });
    }

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
    renderEmojiPanel();
    applyTheme();
    applyLanguageUI();
    renderMessages();
  }

  // Refresh config periodically (every 30 seconds)
  async function refreshConfig() {
    const newConfig = await getWidgetConfig(config.widgetId || config.clientId);
    if (newConfig) {
      // Check for visual changes that require re-render
      const visualKeys = [
        'primaryColor', 'businessName', 'welcomeMessage',
        'whatsappDestination', 'quickReplies', 'teaserMessages',
        'chatPlaceholder', 'exitIntentTitle', 'exitIntentDescription', 'exitIntentCta',
        'vibrationIntensity', 'testimonials', 'liveActivities', 'launcherIcon', 'hideBranding', 'brandingText', 'brandingLink'
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
    const bootstrapConfig = window.LEADWIDGET_CONFIG || {};
    const clientId = window.LEADWIDGET_CLIENT_ID || bootstrapConfig.clientId;
    const widgetId = bootstrapConfig.widgetId || window.LEADWIDGET_WIDGET_ID || clientId;

    console.log('LeadWidget: Initializing with client ID:', clientId);

    if (clientId) {
      config.clientId = clientId;
      config.widgetId = widgetId;
      config.projectId = window.LEADWIDGET_CONFIG?.projectId || defaultConfig.projectId;
      config.apiKey = window.LEADWIDGET_CONFIG?.apiKey || defaultConfig.apiKey;

      // Load widget config
      const remoteConfig = await getWidgetConfig(widgetId || clientId);
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
