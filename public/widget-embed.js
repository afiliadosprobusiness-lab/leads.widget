(function () {
  'use strict';
  const FALLBACK_IACALLCLOSER_REDIRECT_URL = 'https://ai-call-closer.vercel.app/';

  // Default Configuration
  const defaultConfig = {
    primaryColor: '#00C185',
    businessName: 'LeadWidget',
    welcomeMessage: "Hi! I'm the qualification assistant. In under 2 minutes, our AI can call you and help you book or close customers live. What would you like to do?",
    welcomeImageUrl: '',
    welcomeAudioUrl: '',
    welcomeVideoUrl: '',
    whatsappDestination: '',
    template: 'general',
    chatPlaceholder: 'Type your message...',
    quickReplies: ['Book more appointments', 'Close deals by phone', 'See how it works'],
    teaserMessages: ['How can we help you today? 👋', 'Do you have any questions? ✨', 'We are online now 🚀'],
    realEstateProperties: [],
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

  const LEGACY_SHORT_WELCOME = {
    en: 'Hello! Choose one of these options',
    es: 'Hola! Elige una de estas opciones'
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

  const LEGACY_TESTIMONIALS = {
    en: [{ name: 'Mark Dirac', text: 'I love this service!!', stars: 5, avatar_url: '' }],
    es: [{ name: 'Mark Dirac', text: 'Me gusta este servicio!!', stars: 5, avatar_url: '' }]
  };

  const LEGACY_TESTIMONIAL_SINGLE_TEXTS = [
    'I love this service!!',
    'I love this service!',
    'Me gusta este servicio!!',
    'Me gusta este servicio!',
    'Me gusto este servicio!!',
    'Me gusto este servicio!'
  ];

  const I18N = {
    en: {
      headerSubtitle: 'Instant AI replies',
      chatPlaceholder: 'Type your message...',
      closeExitIntent: 'No thanks',
      testimonialLabel: 'Testimonials',
      presenceNowSuffix: 'people are checking live outcomes now',
      viralTexts: ['Powered by LeadWidget', 'Want this chat on your website?', 'Create your FREE widget here'],
      aiUnavailableWithWa: 'The AI assistant is not configured yet. You can contact us on WhatsApp for immediate support.',
      aiUnavailableNoWa: 'The AI assistant is not configured yet. The admin must add an OpenAI or Anthropic API key.',
      fallbackResponse: 'I had a connection issue. Want to continue on WhatsApp?',
      blockedPlaceholder: 'Chat blocked for security reasons',
      waFallback: 'Great! I will connect you with an advisor on WhatsApp now.',
      openWhatsAppNow: 'Open WhatsApp now',
      iacallcloserFallback: 'Great! I will open IACloser now.',
      systemAudioUnsupported: 'Voice input is not supported in this browser.',
      openingIACallCloser: 'Opening IACloser...',
      openIACallCloserNow: 'Open IACloser now',
      talkNow: 'Speak now',
      listeningNow: 'Listening... speak now.',
      languageLabel: 'ES',
      themeLabel: 'Theme',
      voiceLabel: 'Voice input',
      emojiLabel: 'Emoji picker'
    },
    es: {
      headerSubtitle: 'Respuestas con IA al instante',
      chatPlaceholder: 'Escribe tu mensaje...',
      closeExitIntent: 'No gracias',
      testimonialLabel: 'Testimonios',
      presenceNowSuffix: 'personas revisando resultados en vivo ahora',
      viralTexts: ['Potenciado por LeadWidget', 'Quieres este chat en tu web?', 'Crea tu widget GRATIS aqui'],
      aiUnavailableWithWa: 'El asistente de IA aun no esta configurado. Puedes escribirnos por WhatsApp para atencion inmediata.',
      aiUnavailableNoWa: 'El asistente de IA aun no esta configurado. El administrador debe agregar la API key de OpenAI o Anthropic.',
      fallbackResponse: 'Tuve un problema de conexion. Quieres continuar por WhatsApp?',
      blockedPlaceholder: 'Chat blocked for security reasons',
      waFallback: 'Excelente, te paso con un asesor por WhatsApp.',
      openWhatsAppNow: 'Abrir WhatsApp ahora',
      iacallcloserFallback: 'Excelente, abrimos IACloser ahora.',
      systemAudioUnsupported: 'La entrada por voz no es compatible con este navegador.',
      openingIACallCloser: 'Abriendo IACloser...',
      openIACallCloserNow: 'Abrir IACloser ahora',
      talkNow: 'Habla ahora',
      listeningNow: 'Escuchando... habla ahora.',
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
  let teaserDismissedThisSession = false;
  let teaserInterval = null;
  let exitIntentShown = false;
  let configRefreshInterval = null;
  let vibrationInterval = null;
  let testimonialInterval = null;
  let presenceInterval = null;
  let inlineTeaserInterval = null;
  let autoOpenTimeout = null;
  let teaserStartTimeout = null;
  let themeMode = 'light';
  let activeLanguage = 'en';
  let speechRecognition = null;
  let isListening = false;
  let emojiPanelOpen = false;
  let pendingVoiceAutoSend = false;
  let latestVoiceTranscript = '';
  let conversationId = `embed-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  let hasUserInteracted = false;
  let inlineTeaserStartTimeout = null;
  let inlineTeaserHideTimeout = null;
  const INLINE_TEASER_IDLE_DELAY_MS = 6200;
  const INLINE_TEASER_ROTATE_MS = 8200;
  const INLINE_TEASER_VISIBLE_MS = 3600;

  // Cleanup all timers and listeners
  function cleanupWidget() {
    if (teaserInterval) clearInterval(teaserInterval);
    if (vibrationInterval) clearInterval(vibrationInterval);
    if (testimonialInterval) clearInterval(testimonialInterval);
    if (presenceInterval) clearInterval(presenceInterval);
    if (inlineTeaserInterval) clearInterval(inlineTeaserInterval);
    if (inlineTeaserStartTimeout) clearTimeout(inlineTeaserStartTimeout);
    if (inlineTeaserHideTimeout) clearTimeout(inlineTeaserHideTimeout);
    if (autoOpenTimeout) clearTimeout(autoOpenTimeout);
    if (teaserStartTimeout) clearTimeout(teaserStartTimeout);

    teaserInterval = null;
    vibrationInterval = null;
    testimonialInterval = null;
    presenceInterval = null;
    inlineTeaserInterval = null;
    inlineTeaserStartTimeout = null;
    inlineTeaserHideTimeout = null;
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

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function detectMessageLocale(value, fallback = 'en') {
    const raw = String(value || '');
    const normalized = normalizeText(raw);
    if (!normalized) return fallback;

    const spanishSignals = /\b(hola|como|quiero|necesito|precio|precios|ayuda|gracias|por favor|agendar|llamada|ventas|cita|telefono|numero|espanol|si)\b/;
    if (spanishSignals.test(normalized)) return 'es';

    const englishSignals = /\b(hello|hi|i need|price|pricing|help|thanks|please|book|call|appointment|sales|phone|yes)\b/;
    if (englishSignals.test(normalized)) return 'en';

    return fallback;
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

  function normalizeRealEstateProperties(value) {
    let source = value;
    if (source && typeof source === 'object' && !Array.isArray(source)) {
      if (Array.isArray(source.arrayValue && source.arrayValue.values)) {
        source = source.arrayValue.values.map((item) => {
          const fields = item && item.mapValue && item.mapValue.fields ? item.mapValue.fields : null;
          if (!fields) return {};
          const mapped = {};
          Object.keys(fields).forEach((key) => {
            const entry = fields[key];
            if (typeof entry?.stringValue === 'string') mapped[key] = entry.stringValue;
            else if (typeof entry?.integerValue === 'string') mapped[key] = entry.integerValue;
            else if (typeof entry?.doubleValue === 'number') mapped[key] = entry.doubleValue;
          });
          return mapped;
        });
      } else if (typeof source.stringValue === 'string') {
        source = source.stringValue;
      }
    }

    if (typeof source === 'string') {
      const trimmed = source.trim();
      if (!trimmed) return [];
      if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
        try {
          source = JSON.parse(trimmed);
        } catch (_) {
          return [];
        }
      } else {
        return [];
      }
    }

    if (!Array.isArray(source)) return [];

    return source
      .map((item, index) => {
        if (!item || typeof item !== 'object') return null;
        const row = item;
        const id = String(row.id || `property-${index + 1}`).trim();
        const title = String(row.title || row.name || row.property_title || '').trim();
        const district = String(row.district || row.zone || '').trim();
        const price = String(row.price || row.amount || '').trim();
        const bedrooms = String(row.bedrooms || row.rooms || row.dorms || '').trim();
        const areaM2 = String(row.areaM2 || row.area_m2 || row.m2 || '').trim();
        const imageUrl = optimizeCloudinaryImageUrl(row.imageUrl || row.image_url || row.photo || '');
        const videoUrl = sanitizeHttpUrl(row.videoUrl || row.video_url || row.video || '');
        if (!title && !imageUrl && !videoUrl) return null;
        return {
          id: id || `property-${index + 1}`,
          title: title || `Property ${index + 1}`,
          district,
          price,
          bedrooms,
          areaM2,
          imageUrl,
          videoUrl
        };
      })
      .filter(Boolean)
      .slice(0, 20);
  }

  function getRealEstateDirectiveFromConfig() {
    if (normalizeText(config.template) !== 'inmobiliaria') return '';
    const properties = Array.isArray(config.realEstateProperties) ? config.realEstateProperties : [];
    if (properties.length === 0) return '';

    const catalog = properties
      .slice(0, 8)
      .map((property, index) => {
        const rows = [
          `id=${property.id || `prop-${index + 1}`}`,
          `title=${property.title || '-'}`,
          property.district ? `district=${property.district}` : '',
          property.price ? `price=${property.price}` : '',
          property.bedrooms ? `bedrooms=${property.bedrooms}` : '',
          property.areaM2 ? `m2=${property.areaM2}` : '',
          property.imageUrl ? `image=${property.imageUrl}` : '',
          property.videoUrl ? `video=${property.videoUrl}` : ''
        ].filter(Boolean);
        return rows.join(' | ');
      })
      .join('\n');

    if (!catalog) return '';

    if (activeLanguage === 'es') {
      return [
        'Modo inmobiliaria activo.',
        'Usa SOLO URLs del catalogo y no inventes enlaces.',
        'Si el usuario pide ver propiedad/departamento/casa o el contexto lo amerita, responde con maximo 1 imagen y 1 video usando:',
        '- [IMAGE: <url>|<alt corto>]',
        '- [VIDEO: <url>]',
        'Catalogo de propiedades:',
        catalog
      ].join('\n');
    }

    return [
      'Real estate mode is active.',
      'Use ONLY catalog URLs. Never invent links.',
      'If user asks to see listings/house/apartment, or context suggests visual proof, return up to 1 image and 1 video with:',
      '- [IMAGE: <url>|<short alt>]',
      '- [VIDEO: <url>]',
      'Property catalog:',
      catalog
    ].join('\n');
  }

  function sanitizeHttpUrl(value, maxLength = 500) {
    const normalized = String(value || '').trim();
    if (!normalized || normalized.length > maxLength) return '';
    try {
      const parsed = new URL(normalized);
      if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return '';
      return parsed.toString();
    } catch (_) {
      return '';
    }
  }

  function optimizeCloudinaryImageUrl(rawUrl) {
    const safeUrl = sanitizeHttpUrl(rawUrl);
    if (!safeUrl) return '';
    try {
      const parsed = new URL(safeUrl);
      if (!/(\.|^)res\.cloudinary\.com$/i.test(parsed.hostname)) return safeUrl;
      if (!/\/image\/upload\//.test(parsed.pathname)) return safeUrl;

      const segments = parsed.pathname.split('/').filter(Boolean);
      const uploadIndex = segments.findIndex((segment) => segment === 'upload');
      if (uploadIndex < 0) return safeUrl;

      const nextSegment = segments[uploadIndex + 1] || '';
      const hasTransformSegment = Boolean(nextSegment) && !/^v\d+$/i.test(nextSegment);
      if (hasTransformSegment) return safeUrl;

      segments.splice(uploadIndex + 1, 0, 'f_auto,q_auto:good,c_limit,w_960');
      parsed.pathname = `/${segments.join('/')}`;
      return parsed.toString();
    } catch (_) {
      return safeUrl;
    }
  }

  function stripCommandQuotes(value) {
    return String(value || '').trim().replace(/^["']|["']$/g, '').trim();
  }

  function buildWhatsAppRedirectUrl(destination, message) {
    const cleanDestination = String(destination || '').replace(/\D/g, '');
    if (!cleanDestination) return '';
    const cleanMessage = String(message || '').trim();
    if (!cleanMessage) return `https://wa.me/${cleanDestination}`;
    return `https://wa.me/${cleanDestination}?text=${encodeURIComponent(cleanMessage)}`;
  }

  function inferChatEventTypeByUrl(url) {
    const normalized = String(url || '').trim().toLowerCase();
    if (!normalized) return '';
    if (normalized.includes('wa.me/') || normalized.includes('whatsapp.com')) return 'whatsapp_open';
    if (normalized.includes('ai-call-closer') || normalized.includes('iacallcloser') || normalized.includes('icloser')) {
      return 'iacallcloser_open';
    }
    return '';
  }

  function trackConversationEvent(eventType, meta) {
    const safeEventType = String(eventType || '').trim().toLowerCase();
    if (!safeEventType) return;
    const widgetId = String(config.widgetId || config.clientId || '').trim();
    if (!widgetId) return;
    let endpoint = '/api/chat-event';
    const scripts = document.getElementsByTagName('script');
    for (const script of scripts) {
      if (script.src && script.src.includes('widget-embed.js')) {
        try {
          const url = new URL(script.src);
          endpoint = `${url.origin}/api/chat-event`;
        } catch (_) {
          endpoint = '/api/chat-event';
        }
        break;
      }
    }
    try {
      fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          widgetId: widgetId,
          source: 'widget_embed',
          conversationId: conversationId,
          eventType: safeEventType,
          userTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          meta: meta && typeof meta === 'object' ? meta : {}
        })
      }).catch(() => {});
    } catch (_) {
      // non-blocking telemetry
    }
  }

  function parseImagePayload(rawPayload) {
    const payload = stripCommandQuotes(rawPayload || '');
    if (!payload) return { url: '', alt: '' };

    try {
      const asJson = JSON.parse(payload);
      if (asJson && typeof asJson === 'object') {
        const candidateUrl = typeof asJson.url === 'string'
          ? asJson.url
          : (typeof asJson.image === 'string' ? asJson.image : '');
        const candidateAlt = typeof asJson.alt === 'string'
          ? asJson.alt
          : (typeof asJson.caption === 'string' ? asJson.caption : '');
        return {
          url: optimizeCloudinaryImageUrl(candidateUrl),
          alt: String(candidateAlt || '').trim()
        };
      }
    } catch (_) {
      // noop
    }

    const [rawUrl, ...altParts] = payload.split('|');
    return {
      url: optimizeCloudinaryImageUrl(rawUrl || ''),
      alt: altParts.join('|').trim()
    };
  }

  function parseAudioPayload(rawPayload) {
    const payload = stripCommandQuotes(rawPayload || '');
    if (!payload) return { url: '' };

    try {
      const asJson = JSON.parse(payload);
      if (asJson && typeof asJson === 'object') {
        const candidateUrl = typeof asJson.url === 'string'
          ? asJson.url
          : (typeof asJson.audio === 'string' ? asJson.audio : '');
        return {
          url: sanitizeHttpUrl(candidateUrl)
        };
      }
    } catch (_) {
      // noop
    }

    return {
      url: sanitizeHttpUrl(payload)
    };
  }

  function parseVideoPayload(rawPayload) {
    const payload = stripCommandQuotes(rawPayload || '');
    if (!payload) return { url: '' };

    try {
      const asJson = JSON.parse(payload);
      if (asJson && typeof asJson === 'object') {
        const candidateUrl = typeof asJson.url === 'string'
          ? asJson.url
          : (typeof asJson.video === 'string' ? asJson.video : '');
        return {
          url: sanitizeHttpUrl(candidateUrl)
        };
      }
    } catch (_) {
      // noop
    }

    return {
      url: sanitizeHttpUrl(payload)
    };
  }

  function parseChatCommands(responseText) {
    const raw = String(responseText || '');
    const whatsappRe = /\[\s*WHATSAPP_REDIRECT\s*:\s*([\s\S]*?)\]/ig;
    const iaCallCloserRedirectRe = /\[\s*(?:ICLOSER_REDIRECT|ICALLCLOSER_REDIRECT|IACALLCLOSER_REDIRECT)\s*:\s*([\s\S]*?)\]/ig;
    const iaCallCloserReadyRe = /\[\s*(?:ICLOSER_READY|ICALLCLOSER_READY|IACALLCLOSER_READY)(?:\s*:\s*([\s\S]*?))?\s*\]/ig;
    const imageCommandRe = /\[\s*(?:IMAGE|IMG|PHOTO)\s*:\s*([\s\S]*?)\]/ig;
    const audioCommandRe = /\[\s*(?:AUDIO|VOICE|SOUND)\s*:\s*([\s\S]*?)\]/ig;
    const videoCommandRe = /\[\s*(?:VIDEO|VID|CLIP)\s*:\s*([\s\S]*?)\]/ig;
    const markdownImageRe = /!\[([^\]]*)\]\((https?:\/\/[^\s)]+)\)/ig;
    const parsed = {
      cleanText: raw.trim(),
      whatsappPayload: '',
      whatsappIndex: null,
      iaCallCloserRedirectUrl: '',
      iaCallCloserRedirectIndex: null,
      iaCallCloserReady: false,
      iaCallCloserReadyIndex: null,
      images: [],
      audios: [],
      videos: []
    };

    let match;
    while ((match = whatsappRe.exec(raw)) !== null) {
      if (parsed.whatsappIndex === null || match.index < parsed.whatsappIndex) {
        parsed.whatsappPayload = stripCommandQuotes(match[1] || '');
        parsed.whatsappIndex = match.index;
      }
    }

    while ((match = iaCallCloserRedirectRe.exec(raw)) !== null) {
      if (parsed.iaCallCloserRedirectIndex === null || match.index < parsed.iaCallCloserRedirectIndex) {
        parsed.iaCallCloserRedirectUrl = sanitizeHttpUrl(stripCommandQuotes(match[1] || '')) || FALLBACK_IACALLCLOSER_REDIRECT_URL;
        parsed.iaCallCloserRedirectIndex = match.index;
      }
    }

    while ((match = iaCallCloserReadyRe.exec(raw)) !== null) {
      if (parsed.iaCallCloserReadyIndex === null || match.index < parsed.iaCallCloserReadyIndex) {
        parsed.iaCallCloserReady = true;
        parsed.iaCallCloserReadyIndex = match.index;
      }
    }

    while ((match = imageCommandRe.exec(raw)) !== null) {
      const parsedImage = parseImagePayload(match[1] || '');
      if (parsedImage.url) {
        parsed.images.push({
          url: parsedImage.url,
          alt: parsedImage.alt,
          index: match.index
        });
      }
    }

    while ((match = markdownImageRe.exec(raw)) !== null) {
      const markdownUrl = sanitizeHttpUrl(match[2] || '');
      if (markdownUrl) {
        parsed.images.push({
          url: optimizeCloudinaryImageUrl(markdownUrl),
          alt: String(match[1] || '').trim(),
          index: match.index
        });
      }
    }

    while ((match = audioCommandRe.exec(raw)) !== null) {
      const parsedAudio = parseAudioPayload(match[1] || '');
      if (parsedAudio.url) {
        parsed.audios.push({
          url: parsedAudio.url,
          index: match.index
        });
      }
    }

    while ((match = videoCommandRe.exec(raw)) !== null) {
      const parsedVideo = parseVideoPayload(match[1] || '');
      if (parsedVideo.url) {
        parsed.videos.push({
          url: parsedVideo.url,
          index: match.index
        });
      }
    }

    parsed.images.sort((a, b) => a.index - b.index);
    parsed.images = parsed.images.slice(0, 4);
    parsed.audios.sort((a, b) => a.index - b.index);
    parsed.audios = parsed.audios.slice(0, 4);
    parsed.videos.sort((a, b) => a.index - b.index);
    parsed.videos = parsed.videos.slice(0, 3);

    parsed.cleanText = raw
      .replace(whatsappRe, '')
      .replace(iaCallCloserRedirectRe, '')
      .replace(iaCallCloserReadyRe, '')
      .replace(imageCommandRe, '')
      .replace(markdownImageRe, '')
      .replace(audioCommandRe, '')
      .replace(videoCommandRe, '')
      .trim();

    return parsed;
  }

  function normalizeTestimonials(value) {
    if (!Array.isArray(value)) return [];
    return value
      .map(item => {
        if (typeof item === 'string') {
          const text = item.trim();
          if (!text) return null;
          return { name: '', text, stars: 5, avatar_url: '' };
        }
        if (!item || typeof item !== 'object') return null;

        const rawName = item.name || item.author || item.client || item.business || '';
        const rawText = item.text || item.quote || item.message || '';
        const rawStars = Number(item.stars);

        const text = String(rawText || '').trim();
        if (!text) return null;

        return {
          name: String(rawName || '').trim(),
          text,
          stars: Number.isFinite(rawStars) ? Math.max(1, Math.min(5, Math.round(rawStars))) : 5,
          avatar_url: String(item.avatar_url || item.avatarUrl || '').trim()
        };
      })
      .filter(Boolean);
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
    if (!Array.isArray(currentTeasers) || shouldUseLocalizedTeasers(currentTeasers)) {
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

  function testimonialsLooselyMatch(a, b) {
    const left = normalizeTestimonials(a);
    const right = normalizeTestimonials(b);
    if (left.length !== right.length) return false;

    return left.every((item, idx) => {
      const other = right[idx] || {};
      return (
        normalizeText(item.text) === normalizeText(other.text) &&
        normalizeText(item.name) === normalizeText(other.name)
      );
    });
  }

  function shouldUseLocalizedTestimonials(currentTestimonials) {
    const normalized = normalizeTestimonials(currentTestimonials);
    if (normalized.length === 0) return false;

    if (testimonialsLooselyMatch(normalized, LEGACY_TESTIMONIALS.en) || testimonialsLooselyMatch(normalized, LEGACY_TESTIMONIALS.es)) {
      return true;
    }

    if (normalized.length === 1) {
      const singleText = normalizeText(normalized[0].text);
      return LEGACY_TESTIMONIAL_SINGLE_TEXTS.some(item => normalizeText(item) === singleText);
    }

    return false;
  }

  function getLocalizedTestimonials(currentTestimonials) {
    const normalized = normalizeTestimonials(currentTestimonials);
    if (normalized.length === 0) return [];

    if (shouldUseLocalizedTestimonials(normalized)) {
      return normalizeTestimonials(LEGACY_TESTIMONIALS[activeLanguage]);
    }

    return normalized;
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

  function randomPresenceCount() {
    return Math.floor(Math.random() * 298) + 3;
  }

  function buildPresenceMessage(count) {
    return `${count} ${getText('presenceNowSuffix')}`;
  }

  function updateLocalizedDefaults() {
    const salesWelcomeDefaults = [
      'Hi! I am your virtual assistant. How can I help you today?',
      "Hi! I'm the qualification assistant. In under 2 minutes, our AI can call you and help you book or close customers live. What would you like to do?",
      'Hola! Soy tu asistente virtual. En que puedo ayudarte hoy?',
      'Hola, soy el asistente de pre-calificacion. En menos de 2 minutos podemos llamarte y ayudarte a cerrar o agendar clientes. Que te gustaria hacer ahora?'
    ];
    const normalizedWelcome = normalizeText(config.welcomeMessage);
    if (normalizedWelcome.includes('choose one of these options') || normalizedWelcome.includes('elige una de estas opciones')) {
      config.welcomeMessage = activeLanguage === 'es'
        ? LEGACY_SHORT_WELCOME.es
        : LEGACY_SHORT_WELCOME.en;
    } else if (salesWelcomeDefaults.some(item => normalizeText(config.welcomeMessage) === normalizeText(item))) {
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

  async function fetchWelcomeMediaFromFirestore(identity) {
    if (!identity) return { welcomeImageUrl: '', welcomeAudioUrl: '', welcomeVideoUrl: '' };

    try {
      const projectId = config.projectId || defaultConfig.projectId;
      const apiKey = config.apiKey || defaultConfig.apiKey;
      const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents:runQuery?key=${apiKey}`;
      const candidates = [
        { fieldPath: 'widget_id', value: identity },
        { fieldPath: 'user_id', value: identity },
        { fieldPath: 'lead_chat_slug', value: identity }
      ];

      for (const candidate of candidates) {
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            structuredQuery: {
              from: [{ collectionId: 'widget_configs' }],
              where: {
                fieldFilter: {
                  field: { fieldPath: candidate.fieldPath },
                  op: 'EQUAL',
                  value: { stringValue: candidate.value }
                }
              },
              limit: 1
            }
          })
        });
        if (!response.ok) continue;
        const data = await response.json();
        const fields = data?.[0]?.document?.fields;
        if (!fields) continue;

        return {
          welcomeImageUrl: optimizeCloudinaryImageUrl(fields.welcome_image_url?.stringValue || ''),
          welcomeAudioUrl: sanitizeHttpUrl(fields.welcome_audio_url?.stringValue || ''),
          welcomeVideoUrl: sanitizeHttpUrl(fields.welcome_video_url?.stringValue || '')
        };
      }
    } catch (err) {
      console.warn('LeadWidget: Could not read welcome media fallback from Firestore', err);
    }

    return { welcomeImageUrl: '', welcomeAudioUrl: '', welcomeVideoUrl: '' };
  }

  async function fetchRealEstatePropertiesFromFirestore(identity) {
    if (!identity) return [];

    try {
      const projectId = config.projectId || defaultConfig.projectId;
      const apiKey = config.apiKey || defaultConfig.apiKey;
      const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents:runQuery?key=${apiKey}`;
      const candidates = [
        { fieldPath: 'widget_id', value: identity },
        { fieldPath: 'user_id', value: identity },
        { fieldPath: 'lead_chat_slug', value: identity }
      ];

      for (const candidate of candidates) {
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            structuredQuery: {
              from: [{ collectionId: 'widget_configs' }],
              where: {
                fieldFilter: {
                  field: { fieldPath: candidate.fieldPath },
                  op: 'EQUAL',
                  value: { stringValue: candidate.value }
                }
              },
              limit: 1
            }
          })
        });
        if (!response.ok) continue;
        const data = await response.json();
        const fields = data?.[0]?.document?.fields;
        if (!fields) continue;
        const properties = normalizeRealEstateProperties(fields.real_estate_properties);
        if (properties.length > 0) return properties;
      }
    } catch (err) {
      console.warn('LeadWidget: Could not read real estate catalog fallback from Firestore', err);
    }

    return [];
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
          const hasTeaserField =
            Object.prototype.hasOwnProperty.call(payload.config, 'teaserMessages') ||
            Object.prototype.hasOwnProperty.call(payload.config, 'teaser_messages');
          const quickReplies = parseStringList(
            payload.config.quickReplies ||
            payload.config.quick_replies
          );
          const teaserMessages = parseStringList(
            payload.config.teaserMessages ||
            payload.config.teaser_messages
          );
          const liveActivities = parseStringList(
            payload.config.liveActivities ||
            payload.config.liveActivityMessages ||
            payload.config.leadChatLiveToasts
          );
          const testimonials = normalizeTestimonials(payload.config.testimonials);
          const backendRealEstateProperties = normalizeRealEstateProperties(
            payload.config.realEstateProperties || payload.config.real_estate_properties
          );
          const firestoreRealEstatePropertiesFallback =
            backendRealEstateProperties.length === 0
              ? await fetchRealEstatePropertiesFromFirestore(identity)
              : [];
          const backendWelcomeImage = optimizeCloudinaryImageUrl(payload.config.welcomeImageUrl || payload.config.welcome_image_url || '');
          const backendWelcomeAudio = sanitizeHttpUrl(payload.config.welcomeAudioUrl || payload.config.welcome_audio_url || '');
          const backendWelcomeVideo = sanitizeHttpUrl(payload.config.welcomeVideoUrl || payload.config.welcome_video_url || '');
          const firestoreWelcomeFallback =
            (!backendWelcomeImage || !backendWelcomeAudio || !backendWelcomeVideo)
              ? await fetchWelcomeMediaFromFirestore(identity)
              : { welcomeImageUrl: '', welcomeAudioUrl: '', welcomeVideoUrl: '' };
          return {
            ...payload.config,
            template: payload.config.template || (firestoreRealEstatePropertiesFallback.length > 0 ? 'inmobiliaria' : (payload.config.template || 'general')),
            welcomeImageUrl: backendWelcomeImage || firestoreWelcomeFallback.welcomeImageUrl,
            welcomeAudioUrl: backendWelcomeAudio || firestoreWelcomeFallback.welcomeAudioUrl,
            welcomeVideoUrl: backendWelcomeVideo || firestoreWelcomeFallback.welcomeVideoUrl,
            quickReplies: quickReplies.length > 0 ? quickReplies : [...config.quickReplies],
            teaserMessages: hasTeaserField ? teaserMessages : [...config.teaserMessages],
            realEstateProperties: backendRealEstateProperties.length > 0 ? backendRealEstateProperties : firestoreRealEstatePropertiesFallback,
            testimonials: testimonials.length > 0 ? testimonials : [],
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
        if (Object.prototype.hasOwnProperty.call(fields, 'teaser_messages')) {
          if (Array.isArray(fields.teaser_messages?.arrayValue?.values)) {
            teaserMessages = fields.teaser_messages.arrayValue.values.map(v => v.stringValue);
          } else if (typeof fields.teaser_messages?.stringValue === 'string') {
            teaserMessages = fields.teaser_messages.stringValue.split('\n').filter(r => r.trim());
          } else {
            teaserMessages = [];
          }
        }

        // Parse legacy live activity values (kept for compatibility in config refresh)
        let liveActivities = [];
        if (fields.lead_chat_live_toasts?.arrayValue?.values) {
          liveActivities = fields.lead_chat_live_toasts.arrayValue.values.map(v => v.stringValue).filter(Boolean);
        } else if (fields.lead_chat_live_toasts?.stringValue) {
          liveActivities = parseStringList(fields.lead_chat_live_toasts.stringValue);
        }

        // Parse testimonials from JSON string
        let testimonials = [];
        if (fields.testimonials_json?.stringValue) {
          try {
            const t = JSON.parse(fields.testimonials_json.stringValue);
            if (Array.isArray(t)) testimonials = normalizeTestimonials(t);
          } catch (e) { console.warn('LeadWidget: Error parsing testimonials JSON', e); }
        }

        // Parse testimonials from array/map fallback
        if (testimonials.length === 0 && fields.testimonials?.arrayValue?.values) {
          const fallbackTestimonials = fields.testimonials.arrayValue.values.map(item => {
            if (item.stringValue) {
              return { text: item.stringValue };
            }
            const mapFields = item.mapValue?.fields || {};
            return {
              name: mapFields.name?.stringValue || mapFields.author?.stringValue || '',
              text: mapFields.text?.stringValue || mapFields.quote?.stringValue || mapFields.message?.stringValue || '',
              stars: Number(
                mapFields.stars?.integerValue ||
                mapFields.stars?.doubleValue ||
                mapFields.stars?.stringValue ||
                5
              ),
              avatar_url: mapFields.avatar_url?.stringValue || ''
            };
          });
          testimonials = normalizeTestimonials(fallbackTestimonials);
        }

        // Extract AI configuration from widget_configs (since profiles has restricted access)
        const aiApiKey = fields.ai_api_key?.stringValue || '';
        console.log('LeadWidget: AI API Key found in widget_configs:', aiApiKey ? 'Yes (length: ' + aiApiKey.length + ')' : 'No');

        return {
          primaryColor: fields.primary_color?.stringValue || defaultConfig.primaryColor,
          businessName: fields.business_name?.stringValue || defaultConfig.businessName,
          welcomeMessage: fields.welcome_message?.stringValue || defaultConfig.welcomeMessage,
          welcomeImageUrl: optimizeCloudinaryImageUrl(fields.welcome_image_url?.stringValue || ''),
          welcomeAudioUrl: sanitizeHttpUrl(fields.welcome_audio_url?.stringValue || ''),
          welcomeVideoUrl: sanitizeHttpUrl(fields.welcome_video_url?.stringValue || ''),
          whatsappDestination: fields.whatsapp_destination?.stringValue || '',
          template: fields.template?.stringValue || 'general',
          chatPlaceholder: fields.chat_placeholder?.stringValue || defaultConfig.chatPlaceholder,
          quickReplies: quickReplies,
          teaserMessages: teaserMessages,
          realEstateProperties: normalizeRealEstateProperties(fields.real_estate_properties),
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

      const languageDirective =
        activeLanguage === 'es'
          ? 'Responde siempre en espanol claro y natural.'
          : 'Respond in clear, natural English.';
      const costDirective =
        activeLanguage === 'es'
          ? 'Se breve y orientado a conversion. Maximo 90 palabras, usa como maximo 1 emoji, evita repetir imagenes/audios/videos. Usa [AUDIO] solo en bienvenida o CTA final (maximo 1 audio dinamico por conversacion). Si usas [IMAGE], prioriza URL Cloudinary en calidad media (q_auto:good, w<=960).'
          : 'Be concise and conversion-focused. Max 90 words, use at most 1 emoji, avoid repeating images/audio/video. Use [AUDIO] only for opening or final CTA (max 1 dynamic audio per conversation). For [IMAGE], prefer Cloudinary medium quality URLs (q_auto:good, w<=960).';
      const realEstateDirective = getRealEstateDirectiveFromConfig();
      const compactHistory = messages
        .filter(m => m.role !== 'system')
        .map(m => ({
          role: m.role === 'assistant' ? 'assistant' : 'user',
          content: m.content
        }))
        .slice(-12);
      const conversationHistory = [
        { role: 'system', content: languageDirective },
        { role: 'system', content: costDirective },
        ...(realEstateDirective ? [{ role: 'system', content: realEstateDirective }] : []),
        ...compactHistory,
      ];

      const response = await fetch(backendUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          history: conversationHistory,
          widgetId: config.widgetId || config.clientId,
          source: 'widget_embed',
          conversationId,
          userTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
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
    config.testimonials = getLocalizedTestimonials(config.testimonials);

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
        --lw-testimonial-border: linear-gradient(120deg, rgba(14,165,233,0.52), rgba(56,189,248,0.24), rgba(148,163,184,0.42), rgba(14,165,233,0.52));
        --lw-testimonial-overlay: radial-gradient(circle at var(--mx) var(--my), rgba(56,189,248,0.28) 0%, rgba(148,163,184,0.12) 44%, rgba(255,255,255,0) 72%);
        --lw-theme-halo: rgba(56,189,248,0.45);
      }
      #lw-root[data-theme="dark"] {
        --lw-surface: #0b1220;
        --lw-surface-soft: #09101d;
        --lw-surface-strong: #101a2c;
        --lw-text: #e2e8f0;
        --lw-muted: #9aa8bf;
        --lw-border: rgba(148, 163, 184, 0.22);
        --lw-shadow: 0 26px 56px rgba(2, 6, 23, 0.55);
        --lw-testimonial-border: linear-gradient(120deg, #f58529, #dd2a7b, #8134af, #515bd4, #feda77, #f58529);
        --lw-testimonial-overlay: radial-gradient(circle at var(--mx) var(--my), rgba(255,255,255,0.48) 0%, rgba(255,255,255,0.02) 44%);
        --lw-theme-halo: rgba(34,211,238,0.5);
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
        padding: 10px 14px;
        border-radius: 16px 16px 6px 16px;
        box-shadow: var(--lw-shadow);
        max-width: 260px;
        font-size: 12px;
        line-height: 1.35;
        color: var(--lw-text);
        font-weight: 550;
        animation: lw-teaser-in 0.35s ease-out;
        cursor: pointer;
        display: none;
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        transition: opacity 0.2s ease, transform 0.2s ease;
      }
      #lw-teaser-text {
        display: block;
        padding-right: 16px;
      }
      @keyframes lw-teaser-in { from { opacity: 0; transform: translateY(8px) scale(0.97); } to { opacity: 1; transform: translateY(0) scale(1); } }
      #lw-teaser-close {
        position: absolute;
        top: 6px;
        right: 6px;
        width: 16px;
        height: 16px;
        border-radius: 999px;
        background: rgba(100, 116, 139, 0.78);
        border: 1px solid rgba(255, 255, 255, 0.28);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      @keyframes lw-teaser-breathe {
        0%, 100% { box-shadow: 0 8px 18px rgba(2, 6, 23, 0.16); }
        50% { box-shadow: 0 12px 24px rgba(2, 6, 23, 0.26); }
      }

      #lw-panel {
        position: fixed;
        bottom: 16px;
        right: 16px;
        left: 16px;
        z-index: 999999;
        width: auto;
        max-width: 420px;
        height: 76vh;
        max-height: 660px;
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
        #lw-panel { left: auto; width: 400px; height: 640px; right: 20px; bottom: 20px; }
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
      @media (min-width: 1024px) {
        #lw-theme-btn {
          box-shadow: 0 0 0 1px var(--lw-theme-halo);
          animation: lw-themePulse 2.8s ease-in-out infinite;
        }
      }
      @keyframes lw-themePulse {
        0%, 100% { box-shadow: 0 0 0 1px var(--lw-theme-halo); }
        50% { box-shadow: 0 0 0 2px color-mix(in srgb, var(--lw-theme-halo) 78%, transparent); }
      }
      #lw-close-btn { border-color: rgba(255,255,255,0.28); }

      #lw-presence-row {
        margin: 8px 10px 0;
        display: flex;
        align-items: center;
      }
      #lw-presence-pill {
        display: inline-flex;
        max-width: 100%;
        align-items: center;
        gap: 7px;
        border-radius: 999px;
        border: 1px solid;
        padding: 4px 10px;
        font-size: 11px;
        line-height: 1.2;
      }
      #lw-root[data-theme='dark'] #lw-presence-pill {
        border-color: rgba(244, 114, 182, 0.45);
        background: rgba(244, 63, 94, 0.1);
        color: #fecdd3;
      }
      #lw-root[data-theme='light'] #lw-presence-pill {
        border-color: rgba(251, 113, 133, 0.42);
        background: rgba(255, 241, 242, 0.9);
        color: #be123c;
      }
      .lw-presence-dot {
        width: 7px;
        height: 7px;
        flex-shrink: 0;
        border-radius: 999px;
        background: #f43f5e;
        box-shadow: 0 0 0 4px rgba(244, 63, 94, 0.16);
        animation: lw-presencePulse 1.8s ease-in-out infinite;
      }
      @keyframes lw-presencePulse {
        0%, 100% { transform: scale(1); opacity: 0.9; }
        50% { transform: scale(1.18); opacity: 1; }
      }
      #lw-presence-text {
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      #lw-testimonial-bar {
        --mx: 50%;
        --my: 50%;
        position: relative;
        border: 1px solid transparent;
        border-radius: 12px;
        margin: 8px 10px 0;
        background:
          linear-gradient(color-mix(in srgb, var(--lw-surface) 94%, white 6%), color-mix(in srgb, var(--lw-surface) 90%, white 10%)) padding-box,
          var(--lw-testimonial-border) border-box;
        background-size: 100% 100%, 220% 220%;
        animation: lw-instagramBorderShift 11s linear infinite;
        padding: 9px 12px;
        display: none;
        overflow: hidden;
      }
      @keyframes lw-instagramBorderShift {
        0% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
        100% { background-position: 0% 50%; }
      }
      #lw-testimonial-bar::before {
        content: "";
        position: absolute;
        inset: -26%;
        background:
          var(--lw-testimonial-overlay),
          conic-gradient(from 0deg, rgba(99,102,241,0), rgba(56,189,248,0.22), rgba(16,185,129,0.2), rgba(99,102,241,0));
        opacity: 0;
        pointer-events: none;
        filter: blur(16px) saturate(1.18);
      }
      #lw-testimonial-bar.lw-testimonial-glow::before {
        animation: lw-testimonialGlow 0.85s ease-out;
      }
      @keyframes lw-testimonialGlow {
        0% { opacity: 0; transform: scale(0.96); }
        40% { opacity: 0.85; transform: scale(1); }
        100% { opacity: 0; transform: scale(1.06); }
      }
      .lw-testimonial-content { position: relative; z-index: 1; min-width: 0; }
      .lw-testimonial-label {
        display: block;
        font-size: 10px;
        font-weight: 700;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: var(--lw-primary);
        margin-bottom: 2px;
      }
      .lw-testimonial-text {
        font-size: 12px;
        color: var(--lw-text);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .lw-testimonial-meta {
        margin-top: 2px;
        display: flex;
        align-items: center;
        gap: 6px;
        min-width: 0;
        font-size: 10px;
        color: var(--lw-muted);
      }
      .lw-testimonial-author {
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .lw-meta-sep {
        opacity: 0.55;
      }
      .lw-star-badge {
        display: inline-flex;
        align-items: center;
        gap: 1px;
        flex-shrink: 0;
        padding: 1px 6px;
        border-radius: 999px;
        background:
          linear-gradient(180deg, rgba(255, 244, 170, 0.52), rgba(246, 190, 44, 0.22)),
          rgba(15, 23, 42, 0.14);
        border: 1px solid rgba(255, 214, 90, 0.48);
        box-shadow:
          0 0 0 1px rgba(255, 243, 181, 0.18) inset,
          0 4px 12px rgba(255, 183, 28, 0.22);
      }
      .lw-star-emoji {
        font-size: 11px;
        line-height: 1;
        filter: drop-shadow(0 0 4px rgba(255, 200, 55, 0.72));
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
      .lw-msg-media-only {
        min-width: 176px;
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
      .lw-msg-system.lw-msg-system-action {
        width: min(88%, 320px);
        padding: 10px 12px;
      }
      .lw-system-action-btn {
        margin-top: 8px;
        width: 100%;
        border: none;
        border-radius: 10px;
        background: #25D366;
        color: white;
        font-size: 12px;
        font-weight: 600;
        padding: 10px 12px;
        cursor: pointer;
        transition: background 0.2s ease, transform 0.2s ease;
      }
      .lw-system-action-btn:hover {
        background: #1ea955;
        transform: translateY(-1px);
      }
      .lw-system-action-btn:focus-visible {
        outline: none;
        box-shadow: 0 0 0 2px rgba(37, 211, 102, 0.35);
      }
      .lw-audio-premium {
        margin-top: 8px;
        width: 100%;
        min-width: 0;
        max-width: 300px;
        padding: 8px 10px;
        border-radius: 14px;
        border: 1px solid var(--lw-border);
        background: var(--lw-surface-soft);
        box-shadow: 0 10px 30px -20px rgba(15,23,42,0.9);
        backdrop-filter: blur(7px);
      }
      .lw-audio-controls {
        display: flex;
        align-items: center;
        gap: 10px;
      }
      .lw-audio-btn {
        width: 30px;
        height: 30px;
        border-radius: 999px;
        border: 1px solid var(--lw-border);
        background: rgba(255,255,255,0.06);
        color: var(--lw-text);
        display: grid;
        place-items: center;
        cursor: pointer;
        flex-shrink: 0;
      }
      .lw-audio-btn:hover { background: rgba(255,255,255,0.12); }
      .lw-audio-btn:focus-visible {
        outline: none;
        box-shadow: 0 0 0 2px rgba(34,211,238,0.35);
      }
      .lw-audio-glyph { font-size: 11px; line-height: 1; }
      .lw-audio-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        margin-bottom: 6px;
      }
      .lw-audio-title {
        min-width: 0;
        display: inline-flex;
        align-items: center;
        gap: 6px;
        font-size: 10px;
        font-weight: 600;
        color: var(--lw-muted);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .lw-audio-dot {
        width: 8px;
        height: 8px;
        border-radius: 999px;
        background: #34d399;
        box-shadow: 0 0 0 0 rgba(52, 211, 153, 0.55);
        animation: lw-audioPulse 1.6s ease-out infinite;
      }
      .lw-audio-time {
        font-size: 10px;
        color: var(--lw-muted);
        white-space: nowrap;
      }
      .lw-audio-track {
        position: relative;
        width: 100%;
        flex: 1;
        height: 10px;
        border-radius: 999px;
        border: 1px solid var(--lw-border);
        background: rgba(148, 163, 184, 0.24);
        cursor: pointer;
      }
      .lw-audio-fill {
        position: absolute;
        left: 0;
        top: 0;
        bottom: 0;
        width: 0%;
        border-radius: 999px;
        background: linear-gradient(90deg, #22d3ee, #34d399);
        transition: width 0.12s linear;
      }
      .lw-audio-el {
        display: none;
      }
      @media (max-width: 480px) {
        .lw-audio-premium {
          max-width: 262px;
          padding: 6px 8px;
          border-radius: 12px;
        }
        .lw-audio-controls {
          gap: 8px;
        }
        .lw-audio-btn {
          width: 28px;
          height: 28px;
        }
        .lw-audio-row {
          margin-bottom: 4px;
        }
      }
      @keyframes lw-audioPulse {
        0% { box-shadow: 0 0 0 0 rgba(52, 211, 153, 0.55); }
        70% { box-shadow: 0 0 0 9px rgba(52, 211, 153, 0); }
        100% { box-shadow: 0 0 0 0 rgba(52, 211, 153, 0); }
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
        position: relative;
        padding: 10px 12px 10px;
        background: var(--lw-surface);
        border-top: 1px solid var(--lw-border);
      }
      #lw-inline-teaser {
        position: absolute;
        left: 12px;
        right: 12px;
        top: -14px;
        border-radius: 10px;
        border: 1px solid;
        padding: 5px 10px;
        font-size: 11px;
        line-height: 1.25;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        display: none;
        z-index: 2;
        transition: opacity 0.24s ease, transform 0.24s ease;
      }
      #lw-inline-teaser.lw-inline-teaser-attention {
        animation: lw-teaser-in 0.24s ease-out, lw-inline-teaser-breathe 3.8s ease-in-out infinite;
      }
      #lw-root[data-theme='dark'] #lw-inline-teaser {
        border-color: rgba(34, 211, 238, 0.35);
        background: rgba(17, 94, 89, 0.3);
        color: #cffafe;
      }
      #lw-root[data-theme='light'] #lw-inline-teaser {
        border-color: rgba(56, 189, 248, 0.45);
        background: rgba(224, 242, 254, 0.88);
        color: #075985;
      }
      @keyframes lw-inline-teaser-breathe {
        0%, 100% { transform: translateY(0) scale(1); }
        50% { transform: translateY(-1px) scale(1.01); }
      }
      #lw-quick-replies {
        display: flex;
        flex-wrap: nowrap;
        align-items: center;
        gap: 8px;
        margin-bottom: 10px;
        overflow-x: auto;
        overflow-y: hidden;
        scroll-behavior: smooth;
        -webkit-overflow-scrolling: touch;
        touch-action: pan-x;
        overscroll-behavior-x: contain;
        scroll-snap-type: x proximity;
        scrollbar-width: none;
        -ms-overflow-style: none;
        padding-bottom: 2px;
        padding-right: 2px;
        cursor: grab;
        user-select: none;
        -webkit-user-select: none;
      }
      #lw-quick-replies::-webkit-scrollbar { display: none; }
      #lw-quick-replies.lw-dragging {
        cursor: grabbing;
        scroll-behavior: auto;
      }
      #lw-quick-replies.lw-dragging .lw-quick-btn { pointer-events: none; }
      .lw-quick-btn {
        flex: 0 0 auto;
        scroll-snap-align: start;
        background: var(--lw-surface-soft);
        border: 1px solid var(--lw-border);
        padding: 8px 13px;
        border-radius: 999px;
        font-size: 12px;
        cursor: pointer;
        transition: all 0.2s;
        color: var(--lw-muted);
        white-space: nowrap;
        touch-action: pan-x;
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

      #lw-voice-overlay {
        position: absolute;
        inset: 0;
        display: none;
        align-items: center;
        justify-content: center;
        padding: 18px;
        background: color-mix(in srgb, var(--lw-bg) 72%, transparent);
        backdrop-filter: blur(3px);
        z-index: 6;
      }
      #lw-voice-overlay.open { display: flex; }
      #lw-voice-shell {
        width: 100%;
        border-radius: 18px;
        border: 1px solid var(--lw-border);
        background: color-mix(in srgb, var(--lw-surface) 95%, transparent);
        padding: 18px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 14px;
      }
      #lw-voice-text {
        font-size: 16px;
        font-weight: 600;
        color: var(--lw-text);
      }
      #lw-voice-subtext {
        margin-top: 4px;
        font-size: 12px;
        color: var(--lw-muted);
      }
      #lw-voice-stop {
        position: relative;
        width: 96px;
        height: 96px;
        border-radius: 999px;
        border: 1px solid rgba(255,255,255,0.62);
        background: rgba(255,255,255,0.04);
        color: #ef4444;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        justify-content: center;
      }
      #lw-voice-stop::before {
        content: '';
        position: absolute;
        inset: 0;
        border-radius: 999px;
        border: 1px solid rgba(248,113,113,0.58);
        animation: lw-voicePing 1.6s infinite;
      }
      #lw-voice-stop::after {
        content: '';
        position: absolute;
        inset: 12px;
        border-radius: 999px;
        border: 1px solid rgba(252,165,165,0.72);
      }
      #lw-voice-stop svg {
        position: relative;
        z-index: 1;
      }
      @keyframes lw-voicePing {
        0% { transform: scale(0.9); opacity: 0.95; }
        70% { transform: scale(1.08); opacity: 0.1; }
        100% { transform: scale(1.13); opacity: 0; }
      }

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
        #lw-teaser {
          right: 88px;
          bottom: 24px;
          max-width: min(56vw, 185px);
          padding: 8px 10px;
          border-radius: 12px;
          font-size: 11px;
          line-height: 1.25;
          animation: lw-teaser-in 0.26s ease-out, lw-teaser-breathe 3.6s ease-in-out infinite;
        }
        #lw-root[data-theme='dark'] #lw-teaser {
          background: rgba(15, 23, 42, 0.6);
          border-color: rgba(148, 163, 184, 0.32);
        }
        #lw-root[data-theme='light'] #lw-teaser {
          background: rgba(255, 255, 255, 0.76);
          border-color: rgba(148, 163, 184, 0.4);
        }
        #lw-teaser-close {
          top: 4px;
          right: 4px;
          width: 15px;
          height: 15px;
        }
        #lw-teaser-close svg {
          width: 8px;
          height: 8px;
        }
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
      #lw-exit-title {
        font-size: 26px;
        font-weight: 800;
        color: var(--lw-text);
        margin-bottom: 10px;
        line-height: 1.2;
        letter-spacing: -0.02em;
        overflow-wrap: anywhere;
        word-break: break-word;
      }
      #lw-exit-desc {
        font-size: 15px;
        color: var(--lw-muted);
        margin-bottom: 26px;
        line-height: 1.55;
        overflow-wrap: anywhere;
        word-break: break-word;
      }
      #lw-exit-cta {
        width: 100%;
        padding: 14px 12px;
        background: linear-gradient(140deg, var(--lw-primary) 0%, var(--lw-primary-strong) 100%);
        color: #fff;
        border: none;
        border-radius: 14px;
        font-weight: 700;
        cursor: pointer;
        font-size: 15px;
        transition: transform 0.2s ease, opacity 0.2s ease;
        white-space: normal;
        overflow-wrap: anywhere;
        word-break: break-word;
        line-height: 1.3;
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

          <div id="lw-presence-row" aria-live="polite">
            <div id="lw-presence-pill">
              <span class="lw-presence-dot" aria-hidden="true"></span>
              <span id="lw-presence-text"></span>
            </div>
          </div>

          <div id="lw-testimonial-bar" aria-live="polite">
            <div class="lw-testimonial-content">
              <span id="lw-testimonial-label" class="lw-testimonial-label">${getText('testimonialLabel')}</span>
              <div id="lw-testimonial-text" class="lw-testimonial-text"></div>
              <div id="lw-testimonial-meta" class="lw-testimonial-meta"></div>
            </div>
          </div>
          <div id="lw-messages"></div>
          <div id="lw-voice-overlay" role="status" aria-live="polite">
            <div id="lw-voice-shell">
              <div>
                <div id="lw-voice-text">${getText('talkNow')}</div>
                <div id="lw-voice-subtext">${getText('listeningNow')}</div>
              </div>
              <button type="button" id="lw-voice-stop" aria-label="${getText('voiceLabel')}">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4">
                  <rect x="9" y="2" width="6" height="12" rx="3"></rect>
                  <path d="M5 10a7 7 0 0 0 14 0"></path>
                  <line x1="12" y1="19" x2="12" y2="22"></line>
                  <line x1="8" y1="22" x2="16" y2="22"></line>
                </svg>
              </button>
            </div>
          </div>

          <div id="lw-input-area">
            <button type="button" id="lw-inline-teaser"></button>
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
    const voiceOverlay = document.getElementById('lw-voice-overlay');
    const voiceTextEl = document.getElementById('lw-voice-text');
    const voiceSubtextEl = document.getElementById('lw-voice-subtext');
    const voiceStopBtn = document.getElementById('lw-voice-stop');
    const subtitleEl = document.getElementById('lw-header-subtitle');
    const testimonialLabelEl = document.getElementById('lw-testimonial-label');
    const testimonialBar = document.getElementById('lw-testimonial-bar');
    const testimonialTextEl = document.getElementById('lw-testimonial-text');
    const testimonialMetaEl = document.getElementById('lw-testimonial-meta');
    const presenceTextEl = document.getElementById('lw-presence-text');
    const inlineTeaserEl = document.getElementById('lw-inline-teaser');
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

    function updatePresenceNowMessage() {
      if (!presenceTextEl) return;
      presenceTextEl.textContent = buildPresenceMessage(randomPresenceCount());
    }

    function startPresenceTicker() {
      if (presenceInterval) {
        clearInterval(presenceInterval);
        presenceInterval = null;
      }
      updatePresenceNowMessage();
      presenceInterval = setInterval(updatePresenceNowMessage, 5600);
    }

    function stopPresenceTicker() {
      if (presenceInterval) {
        clearInterval(presenceInterval);
        presenceInterval = null;
      }
    }

    function hideInlineTeaser() {
      if (!inlineTeaserEl) return;
      inlineTeaserEl.classList.remove('lw-inline-teaser-attention');
      inlineTeaserEl.style.opacity = '0';
      inlineTeaserEl.style.display = 'none';
    }

    function markUserInteraction() {
      hasUserInteracted = true;
      startInlineTeaserCycle();
    }

    function startInlineTeaserCycle() {
      if (!inlineTeaserEl) return;
      if (inlineTeaserStartTimeout) {
        clearTimeout(inlineTeaserStartTimeout);
        inlineTeaserStartTimeout = null;
      }
      if (inlineTeaserInterval) {
        clearInterval(inlineTeaserInterval);
        inlineTeaserInterval = null;
      }
      if (inlineTeaserHideTimeout) {
        clearTimeout(inlineTeaserHideTimeout);
        inlineTeaserHideTimeout = null;
      }
      const source = getLocalizedTeaserMessages(config.teaserMessages);
      if (!isOpen || !hasUserInteracted || isLoading || input.value.trim() || !Array.isArray(source) || source.length === 0) {
        hideInlineTeaser();
        return;
      }

      const idleDelay = Math.max(INLINE_TEASER_IDLE_DELAY_MS, Math.max(4, Number(config.triggerDelay || 5)) * 1000);
      let index = Math.floor(Math.random() * source.length);
      const showInlineTeaser = () => {
        const text = source[index] || '';
        if (!text || !isOpen || isLoading || input.value.trim()) return;
        inlineTeaserEl.textContent = text;
        inlineTeaserEl.style.display = 'block';
        inlineTeaserEl.style.opacity = '1';
        inlineTeaserEl.classList.remove('lw-inline-teaser-attention');
        void inlineTeaserEl.offsetWidth;
        inlineTeaserEl.classList.add('lw-inline-teaser-attention');
        if (inlineTeaserHideTimeout) clearTimeout(inlineTeaserHideTimeout);
        inlineTeaserHideTimeout = setTimeout(() => {
          if (!inlineTeaserEl) return;
          inlineTeaserEl.classList.remove('lw-inline-teaser-attention');
          inlineTeaserEl.style.opacity = '0';
        }, INLINE_TEASER_VISIBLE_MS);
        index = (index + 1) % source.length;
      };
      inlineTeaserStartTimeout = setTimeout(() => {
        showInlineTeaser();
        inlineTeaserInterval = setInterval(showInlineTeaser, INLINE_TEASER_ROTATE_MS);
      }, idleDelay);
    }

    function stopInlineTeaserCycle() {
      if (inlineTeaserStartTimeout) {
        clearTimeout(inlineTeaserStartTimeout);
        inlineTeaserStartTimeout = null;
      }
      if (inlineTeaserInterval) {
        clearInterval(inlineTeaserInterval);
        inlineTeaserInterval = null;
      }
      if (inlineTeaserHideTimeout) {
        clearTimeout(inlineTeaserHideTimeout);
        inlineTeaserHideTimeout = null;
      }
      hideInlineTeaser();
    }

    function renderEmojiPanel() {
      if (!emojiPanel) return;
      emojiPanel.innerHTML = quickEmojiSet
        .map(emoji => `<button type="button" class="lw-emoji-btn" data-emoji="${emoji}">${emoji}</button>`)
        .join('');

      emojiPanel.querySelectorAll('.lw-emoji-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const emoji = btn.getAttribute('data-emoji') || '';
          markUserInteraction();
          input.value = `${input.value}${emoji}`;
          input.focus();
          emojiPanelOpen = false;
          emojiPanel.classList.remove('open');
          if (emojiBtn) emojiBtn.classList.remove('active');
        });
      });
    }

    function syncInitialAssistantMessageLanguage() {
      if (!Array.isArray(messages) || messages.length !== 1) return false;
      if (messages[0]?.role !== 'assistant') return false;

      const normalizedCurrent = normalizeText(messages[0].content || '');
      const looksLikeWelcome =
        normalizedCurrent.includes('choose one of these options') ||
        normalizedCurrent.includes('elige una de estas opciones') ||
        normalizedCurrent.includes(normalizeText('Hi! I am your virtual assistant. How can I help you today?')) ||
        normalizedCurrent.includes(normalizeText("Hi! I'm the qualification assistant. In under 2 minutes, our AI can call you and help you book or close customers live. What would you like to do?")) ||
        normalizedCurrent.includes(normalizeText('Hola! Soy tu asistente virtual. En que puedo ayudarte hoy?')) ||
        normalizedCurrent.includes(normalizeText('Hola, soy el asistente de pre-calificacion. En menos de 2 minutos podemos llamarte y ayudarte a cerrar o agendar clientes. Que te gustaria hacer ahora?'));

      if (!looksLikeWelcome) return false;

      messages = [{
        role: 'assistant',
        content: withBotEmoji(config.welcomeMessage),
        imageUrl: optimizeCloudinaryImageUrl(config.welcomeImageUrl || ''),
        audioUrl: sanitizeHttpUrl(config.welcomeAudioUrl || ''),
        videoUrl: sanitizeHttpUrl(config.welcomeVideoUrl || '')
      }];
      return true;
    }

    function applyLanguageUI() {
      updateLocalizedDefaults();
      config.quickReplies = getLocalizedQuickReplies(config.quickReplies);
      config.teaserMessages = getLocalizedTeaserMessages(config.teaserMessages);
      config.testimonials = getLocalizedTestimonials(config.testimonials);

      if (langBtn) langBtn.textContent = getText('languageLabel');
      if (subtitleEl) subtitleEl.textContent = getText('headerSubtitle');
      if (testimonialLabelEl) testimonialLabelEl.textContent = getText('testimonialLabel');
      if (input) input.placeholder = config.chatPlaceholder || getText('chatPlaceholder');
      if (exitClose) exitClose.textContent = getText('closeExitIntent');
      if (exitTitleEl) exitTitleEl.textContent = config.exitIntentTitle || '';
      if (exitDescEl) exitDescEl.textContent = config.exitIntentDescription || '';
      if (exitCta) exitCta.textContent = config.exitIntentCta || '';
      if (emojiBtn) emojiBtn.setAttribute('aria-label', getText('emojiLabel'));
      if (micBtn) micBtn.setAttribute('aria-label', getText('voiceLabel'));
      if (themeBtn) themeBtn.setAttribute('aria-label', getText('themeLabel'));
      if (voiceTextEl) voiceTextEl.textContent = getText('talkNow');
      if (voiceSubtextEl) voiceSubtextEl.textContent = getText('listeningNow');
      if (voiceStopBtn) voiceStopBtn.setAttribute('aria-label', getText('voiceLabel'));
      updatePresenceNowMessage();
      if (isOpen) {
        startPresenceTicker();
        startInlineTeaserCycle();
      } else {
        stopPresenceTicker();
        stopInlineTeaserCycle();
      }
      const welcomeSynced = syncInitialAssistantMessageLanguage();
      updateViralText();
      if (welcomeSynced) {
        renderMessages();
      } else {
        renderQuickReplies();
      }
      if (isOpen) {
        startTestimonialRotator();
      } else {
        stopTestimonialRotator();
      }
    }

    function setVoiceOverlayOpen(open) {
      if (!voiceOverlay) return;
      voiceOverlay.classList.toggle('open', Boolean(open));
    }

    function initSpeechRecognition() {
      const SR =
        window.SpeechRecognition ||
        window.webkitSpeechRecognition ||
        window.mozSpeechRecognition ||
        window.msSpeechRecognition;
      if (!SR) return null;
      const recognition = new SR();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;
      recognition.onresult = (event) => {
        let finalTranscript = '';
        let interimTranscript = '';
        for (let index = event.resultIndex || 0; index < (event.results?.length || 0); index += 1) {
          const chunk = event.results[index]?.[0]?.transcript || '';
          if (event.results[index]?.isFinal) {
            finalTranscript += chunk;
          } else {
            interimTranscript += chunk;
          }
        }
        const transcript = `${finalTranscript} ${interimTranscript}`.trim();
        if (transcript) {
          latestVoiceTranscript = transcript;
          input.value = transcript;
          input.focus();
        }
      };
      recognition.onstart = () => {
        isListening = true;
        if (micBtn) micBtn.classList.add('active');
        setVoiceOverlayOpen(true);
      };
      recognition.onend = () => {
        isListening = false;
        if (micBtn) micBtn.classList.remove('active');
        setVoiceOverlayOpen(false);
        const transcript = (latestVoiceTranscript || '').trim();
        const shouldAutoSend = pendingVoiceAutoSend;
        pendingVoiceAutoSend = false;
        latestVoiceTranscript = '';
        if (shouldAutoSend && transcript) {
          handleSendMessage(transcript);
        }
      };
      recognition.onerror = () => {
        isListening = false;
        pendingVoiceAutoSend = false;
        latestVoiceTranscript = '';
        if (micBtn) micBtn.classList.remove('active');
        setVoiceOverlayOpen(false);
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

    function initQuickRepliesScroll() {
      if (!quickRepliesContainer || quickRepliesContainer.dataset.dragScrollInit === '1') return;
      quickRepliesContainer.dataset.dragScrollInit = '1';

      let pointerActive = false;
      let pointerId = null;
      let startX = 0;
      let startScrollLeft = 0;
      let moved = false;
      let suppressClickUntil = 0;

      const releasePointer = () => {
        if (!pointerActive) return;
        pointerActive = false;
        if (moved) suppressClickUntil = Date.now() + 140;
        moved = false;
        quickRepliesContainer.classList.remove('lw-dragging');
        if (pointerId !== null && quickRepliesContainer.releasePointerCapture) {
          try { quickRepliesContainer.releasePointerCapture(pointerId); } catch (_) {}
        }
        pointerId = null;
      };

      quickRepliesContainer.addEventListener('pointerdown', (event) => {
        if (event.pointerType === 'mouse' && event.button !== 0) return;
        if (quickRepliesContainer.scrollWidth <= quickRepliesContainer.clientWidth) return;

        pointerActive = true;
        pointerId = event.pointerId;
        startX = event.clientX;
        startScrollLeft = quickRepliesContainer.scrollLeft;
        moved = false;
        quickRepliesContainer.classList.add('lw-dragging');

        if (quickRepliesContainer.setPointerCapture) {
          try { quickRepliesContainer.setPointerCapture(pointerId); } catch (_) {}
        }
      });

      quickRepliesContainer.addEventListener('pointermove', (event) => {
        if (!pointerActive || event.pointerId !== pointerId) return;
        const deltaX = event.clientX - startX;
        if (!moved && Math.abs(deltaX) > 3) moved = true;
        quickRepliesContainer.scrollLeft = startScrollLeft - deltaX;
        if (moved) event.preventDefault();
      });

      quickRepliesContainer.addEventListener('pointerup', releasePointer);
      quickRepliesContainer.addEventListener('pointercancel', releasePointer);
      quickRepliesContainer.addEventListener('pointerleave', (event) => {
        if (!pointerActive || event.pointerType !== 'mouse') return;
        releasePointer();
      });

      quickRepliesContainer.addEventListener('wheel', (event) => {
        if (quickRepliesContainer.scrollWidth <= quickRepliesContainer.clientWidth) return;
        const hasVerticalIntent = Math.abs(event.deltaY) > Math.abs(event.deltaX);
        const delta = hasVerticalIntent ? event.deltaY : event.deltaX;
        if (!delta) return;
        quickRepliesContainer.scrollLeft += delta;
        if (hasVerticalIntent) event.preventDefault();
      }, { passive: false });

      quickRepliesContainer.addEventListener('click', (event) => {
        if (Date.now() > suppressClickUntil) return;
        event.preventDefault();
        event.stopPropagation();
      }, true);
    }

    // Render quick replies
    function renderQuickReplies() {
      initQuickRepliesScroll();
      const quickReplies = getLocalizedQuickReplies(config.quickReplies);
      if (!Array.isArray(quickReplies) || quickReplies.length === 0) {
        quickRepliesContainer.style.display = 'none';
        return;
      }
      quickRepliesContainer.style.display = 'flex';
      quickRepliesContainer.style.flexWrap = 'nowrap';
      quickRepliesContainer.style.overflowX = 'auto';
      quickRepliesContainer.style.overflowY = 'hidden';
      quickRepliesContainer.style.webkitOverflowScrolling = 'touch';
      quickRepliesContainer.style.touchAction = 'pan-x';
      quickRepliesContainer.innerHTML = quickReplies.map(text =>
        `<button type="button" class="lw-quick-btn">${text}</button>`
      ).join('');

      quickRepliesContainer.querySelectorAll('.lw-quick-btn').forEach(btn => {
        btn.addEventListener('click', () => handleSendMessage(btn.textContent));
      });
    }

    function formatAudioTime(seconds) {
      const safe = Number.isFinite(seconds) && seconds >= 0 ? Math.floor(seconds) : 0;
      const mins = Math.floor(safe / 60);
      const secs = safe % 60;
      return `${mins}:${String(secs).padStart(2, '0')}`;
    }

    function initPremiumAudioCards(container) {
      if (!container) return;
      const cards = container.querySelectorAll('[data-audio-card]');
      cards.forEach((card) => {
        const audio = card.querySelector('[data-audio-el]');
        const playBtn = card.querySelector('[data-audio-play]');
        const playGlyph = card.querySelector('[data-audio-play-glyph]');
        const muteBtn = card.querySelector('[data-audio-mute]');
        const muteGlyph = card.querySelector('[data-audio-mute-glyph]');
        const track = card.querySelector('[data-audio-track]');
        const fill = card.querySelector('[data-audio-fill]');
        const timeEl = card.querySelector('[data-audio-time]');

        if (!audio || !playBtn || !playGlyph || !muteBtn || !muteGlyph || !track || !fill || !timeEl) return;

        const updateTime = () => {
          const current = audio.currentTime || 0;
          const duration = Number.isFinite(audio.duration) ? audio.duration : 0;
          const ratio = duration > 0 ? Math.min(1, Math.max(0, current / duration)) : 0;
          fill.style.width = `${ratio * 100}%`;
          timeEl.textContent = `${formatAudioTime(current)} / ${duration > 0 ? formatAudioTime(duration) : '--:--'}`;
        };

        const updatePlayGlyph = () => {
          playGlyph.textContent = audio.paused ? '\u25B6' : '\u275A\u275A';
        };

        const updateMuteGlyph = () => {
          muteGlyph.textContent = audio.muted ? '\uD83D\uDD07' : '\uD83D\uDD0A';
        };

        playBtn.addEventListener('click', async () => {
          try {
            if (audio.paused) {
              await audio.play();
            } else {
              audio.pause();
            }
          } catch (_) {
            // noop
          } finally {
            updatePlayGlyph();
          }
        });

        muteBtn.addEventListener('click', () => {
          audio.muted = !audio.muted;
          updateMuteGlyph();
        });

        track.addEventListener('click', (event) => {
          const rect = track.getBoundingClientRect();
          const ratio = Math.min(1, Math.max(0, (event.clientX - rect.left) / Math.max(rect.width, 1)));
          const duration = Number.isFinite(audio.duration) ? audio.duration : 0;
          if (!duration) return;
          audio.currentTime = ratio * duration;
          updateTime();
        });

        audio.addEventListener('timeupdate', updateTime);
        audio.addEventListener('loadedmetadata', updateTime);
        audio.addEventListener('play', updatePlayGlyph);
        audio.addEventListener('pause', updatePlayGlyph);
        audio.addEventListener('ended', updatePlayGlyph);
        audio.addEventListener('volumechange', updateMuteGlyph);

        updateTime();
        updatePlayGlyph();
        updateMuteGlyph();
      });
    }

    // Render messages
    function renderMessages() {
      let html = messages.map((m, messageIndex) => {
        if (m.role === 'system' && m.actionUrl) {
          const actionLabel = m.actionLabel || getText('openIACallCloserNow');
          return `<div class="lw-msg lw-msg-system lw-msg-system-action"><div>${m.content}</div><button type="button" class="lw-system-action-btn" data-action-url="${escapeHtml(m.actionUrl)}">${escapeHtml(actionLabel)}</button></div>`;
        }
        if (m.role === 'system') {
          return `<div class="lw-msg lw-msg-system">${m.content}</div>`;
        }
        const imageUrl = optimizeCloudinaryImageUrl(m.imageUrl || '');
        const audioUrl = sanitizeHttpUrl(m.audioUrl || '');
        const videoUrl = sanitizeHttpUrl(m.videoUrl || '');
        const isMediaOnly = !m.content && (imageUrl || audioUrl || videoUrl);
        const shouldExpandForAudio = Boolean(audioUrl || videoUrl);
        const textMarkup = m.content ? `<div>${m.content}</div>` : '';
        const imageMarkup = imageUrl
          ? `<img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(m.imageAlt || 'Assistant image')}" loading="lazy" style="margin-top:8px;width:100%;max-width:260px;border-radius:12px;border:1px solid var(--lw-border);display:block;">`
          : '';
        const audioMarkup = audioUrl
          ? `<div class="lw-audio-premium" data-audio-card data-audio-id="audio-${messageIndex}"><div class="lw-audio-row"><span class="lw-audio-title"><span class="lw-audio-dot"></span>${escapeHtml(getText('talkNow'))}</span><span class="lw-audio-time" data-audio-time>0:00 / --:--</span></div><div class="lw-audio-controls"><button type="button" class="lw-audio-btn" data-audio-play aria-label="Play audio"><span class="lw-audio-glyph" data-audio-play-glyph>\u25B6</span></button><button type="button" class="lw-audio-track" data-audio-track aria-label="Seek audio"><span class="lw-audio-fill" data-audio-fill></span></button><button type="button" class="lw-audio-btn" data-audio-mute aria-label="Mute audio"><span class="lw-audio-glyph" data-audio-mute-glyph>\uD83D\uDD0A</span></button></div><audio preload="metadata" class="lw-audio-el" data-audio-el><source src="${escapeHtml(audioUrl)}"></audio></div>`
          : '';
        const videoMarkup = videoUrl
          ? `<video controls preload="metadata" playsinline style="margin-top:8px;width:100%;max-width:260px;border-radius:12px;border:1px solid var(--lw-border);display:block;background:rgba(2,6,23,0.82);"><source src="${escapeHtml(videoUrl)}"></video>`
          : '';
        return `<div class="lw-msg lw-msg-${m.role}${(isMediaOnly || shouldExpandForAudio) ? ' lw-msg-media-only' : ''}">${textMarkup}${imageMarkup}${audioMarkup}${videoMarkup}</div>`;
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
      messagesContainer.querySelectorAll('.lw-system-action-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
          const url = String(btn.getAttribute('data-action-url') || '').trim();
          if (!url) return;
          const eventType = inferChatEventTypeByUrl(url);
          if (eventType) {
            trackConversationEvent(eventType, { trigger: 'button' });
          }
          window.open(url, '_blank', 'noopener,noreferrer');
        });
      });
      initPremiumAudioCards(messagesContainer);
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
      renderQuickReplies();
    }

    // Handle send message
    async function handleSendMessage(text) {
      const userMessage = text || input.value.trim();
      if (!userMessage || isLoading) return;
      markUserInteraction();

      const detectedLocale = detectMessageLocale(userMessage, activeLanguage);
      if (detectedLocale === 'es' && activeLanguage !== 'es') {
        activeLanguage = 'es';
        applyLanguageUI();
      }

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
      let waRedirectData = '';
      let selectedAction = null;
      let parsedCommands = null;

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
        parsedCommands = parseChatCommands(response);
        const existingAudioUrls = new Set(
          messages
            .map((item) => sanitizeHttpUrl(item.audioUrl || ''))
            .filter(Boolean)
        );
        const maxAudioMessages = config.welcomeAudioUrl ? 2 : 1;
        const availableAudioSlots = Math.max(0, maxAudioMessages - existingAudioUrls.size);
        const budgetedAudios = Array.isArray(parsedCommands.audios)
          ? parsedCommands.audios
            .filter((item) => !existingAudioUrls.has(sanitizeHttpUrl(item.url || '')))
            .slice(0, availableAudioSlots)
          : [];
        const budgetedVideos = Array.isArray(parsedCommands.videos)
          ? parsedCommands.videos.slice(0, 1)
          : [];
        waRedirectData = parsedCommands.whatsappPayload || userMessage;
        const whatsappUrl = buildWhatsAppRedirectUrl(config.whatsappDestination, waRedirectData);
        const iaCallCloserUrl = sanitizeHttpUrl(
          parsedCommands.iaCallCloserRedirectUrl ||
          ((parsedCommands.iaCallCloserRedirectIndex !== null || parsedCommands.iaCallCloserReadyIndex !== null)
            ? (config.iacloserRedirectUrl || FALLBACK_IACALLCLOSER_REDIRECT_URL)
            : '')
        );
        const iaCallCloserIndexes = [parsedCommands.iaCallCloserRedirectIndex, parsedCommands.iaCallCloserReadyIndex]
          .filter((value) => typeof value === 'number');
        const iaCallCloserIndex = iaCallCloserIndexes.length > 0 ? Math.min(...iaCallCloserIndexes) : null;
        const actionCandidates = [];

        if (parsedCommands.whatsappIndex !== null && whatsappUrl) {
          actionCandidates.push({
            type: 'whatsapp',
            index: parsedCommands.whatsappIndex,
            url: whatsappUrl,
            notice: getText('waFallback'),
            label: getText('openWhatsAppNow')
          });
        }

        if (iaCallCloserIndex !== null && iaCallCloserUrl) {
          actionCandidates.push({
            type: 'iacallcloser',
            index: iaCallCloserIndex,
            url: iaCallCloserUrl,
            notice: getText('openingIACallCloser'),
            label: getText('openIACallCloserNow')
          });
        }

        actionCandidates.sort((a, b) => a.index - b.index);
        selectedAction = actionCandidates[0] || null;
        const hasMediaPayload = (
          (parsedCommands.images && parsedCommands.images.length > 0) ||
          budgetedAudios.length > 0 ||
          budgetedVideos.length > 0
        );
        response = parsedCommands.cleanText || (selectedAction
          ? selectedAction.notice
          : (hasMediaPayload ? '' : getText('fallbackResponse')));
        parsedCommands.audios = budgetedAudios;
        parsedCommands.videos = budgetedVideos;
      }
      isLoading = false;
      if (response) {
        messages.push({ role: 'assistant', content: withBotEmoji(response) });
      }
      if (parsedCommands && Array.isArray(parsedCommands.images) && parsedCommands.images.length > 0) {
        parsedCommands.images.forEach((item, index) => {
          messages.push({
            role: 'assistant',
            content: '',
            imageUrl: item.url,
            imageAlt: item.alt || `assistant-image-${index + 1}`
          });
        });
      }
      if (parsedCommands && Array.isArray(parsedCommands.audios) && parsedCommands.audios.length > 0) {
        parsedCommands.audios.forEach((item) => {
          messages.push({
            role: 'assistant',
            content: '',
            audioUrl: item.url
          });
        });
      }
      if (parsedCommands && Array.isArray(parsedCommands.videos) && parsedCommands.videos.length > 0) {
        parsedCommands.videos.forEach((item) => {
          messages.push({
            role: 'assistant',
            content: '',
            videoUrl: item.url
          });
        });
      }

      // Handle Auto-Redirect & Save Lead
      if (selectedAction) {
        messages.push({
          role: 'system',
          content: selectedAction.notice,
          actionUrl: selectedAction.url,
          actionLabel: selectedAction.label
        });
      }

      if (selectedAction && selectedAction.type === 'whatsapp' && waRedirectData && config.whatsappDestination) {
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
      }

      if (selectedAction) {
        setTimeout(() => {
          const eventType = inferChatEventTypeByUrl(selectedAction.url);
          if (eventType) {
            trackConversationEvent(eventType, { trigger: 'auto' });
          }
          window.open(selectedAction.url, '_blank', 'noopener,noreferrer');
        }, 1800);
      }

      renderMessages();
      startInlineTeaserCycle();

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
        setVoiceOverlayOpen(false);
        startPresenceTicker();
        startInlineTeaserCycle();
        if (messages.length === 0) {
          messages.push({
            role: 'assistant',
            content: withBotEmoji(config.welcomeMessage),
            imageUrl: optimizeCloudinaryImageUrl(config.welcomeImageUrl || ''),
            audioUrl: sanitizeHttpUrl(config.welcomeAudioUrl || ''),
            videoUrl: sanitizeHttpUrl(config.welcomeVideoUrl || '')
          });
          renderMessages();
        }
        startTestimonialRotator();
      } else {
        hasBeenClosedOnce = true;
        startVibration();
        if (emojiPanel) emojiPanel.classList.remove('open');
        if (emojiBtn) emojiBtn.classList.remove('active');
        emojiPanelOpen = false;
        if (speechRecognition && isListening) {
          pendingVoiceAutoSend = false;
          latestVoiceTranscript = '';
          try { speechRecognition.stop(); } catch (_) { /* noop */ }
        }
        setVoiceOverlayOpen(false);
        if (!teaserDismissedThisSession) {
          teaserStartTimeout = setTimeout(() => {
            startTeaserCycle();
          }, 2000);
        }

        stopPresenceTicker();
        stopInlineTeaserCycle();
        stopTestimonialRotator();
      }
    }

    // Testimonial rotator
    function startTestimonialRotator() {
      stopTestimonialRotator();
      const testimonials = getLocalizedTestimonials(config.testimonials);

      if (!testimonials || !Array.isArray(testimonials) || testimonials.length === 0) {
        if (testimonialBar) testimonialBar.style.display = 'none';
        return;
      }

      if (testimonialBar) testimonialBar.style.display = 'block';
      let testimonialIndex = 0;

      const showTestimonial = () => {
        const current = testimonials[testimonialIndex];
        if (!current) return;

        if (testimonialTextEl) {
          testimonialTextEl.classList.remove('lw-fade-in');
          void testimonialTextEl.offsetWidth;
          testimonialTextEl.classList.add('lw-fade-in');
          testimonialTextEl.textContent = `"${current.text}"`;
        }

        if (testimonialMetaEl) {
          const starsCount = Math.max(1, Math.min(5, Number(current.stars || 5)));
          const author = (current.name || '').trim();
          const starsMarkup = new Array(starsCount)
            .fill('<span class="lw-star-emoji" aria-hidden="true">\u2B50</span>')
            .join('');
          const starsBadge = `<span class="lw-star-badge" aria-label="${starsCount} stars">${starsMarkup}</span>`;

          testimonialMetaEl.innerHTML = author
            ? `<span class="lw-testimonial-author">${escapeHtml(author)}</span><span class="lw-meta-sep">\u2022</span>${starsBadge}`
            : starsBadge;
        }

        if (testimonialBar) {
          testimonialBar.classList.remove('lw-testimonial-glow');
          void testimonialBar.offsetWidth;
          testimonialBar.classList.add('lw-testimonial-glow');
        }

        testimonialIndex = (testimonialIndex + 1) % testimonials.length;
      };

      showTestimonial();
      if (testimonials.length > 1) {
        testimonialInterval = setInterval(showTestimonial, 4800);
      }
    }

    function stopTestimonialRotator() {
      if (testimonialInterval) {
        clearInterval(testimonialInterval);
        testimonialInterval = null;
      }
      if (testimonialBar) testimonialBar.classList.remove('lw-testimonial-glow');
    }

    // Teaser cycle
    function startTeaserCycle() {
      const teaserMessages = getLocalizedTeaserMessages(config.teaserMessages);
      if (isOpen || teaserDismissedThisSession || !teaserMessages || teaserMessages.length === 0) {
        console.log('LeadWidget: Teaser cycle not started', { isOpen, teaserDismissedThisSession, teaserCount: teaserMessages?.length });
        return;
      }

      stopTeaserCycle();
      let index = Math.floor(Math.random() * teaserMessages.length);

      const showTeaser = () => {
        if (isOpen || teaserDismissedThisSession) return;
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
    teaserClose.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      teaserDismissedThisSession = true;
      if (teaserStartTimeout) {
        clearTimeout(teaserStartTimeout);
        teaserStartTimeout = null;
      }
      stopTeaserCycle();
      teaser.style.display = 'none';
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      handleSendMessage();
    });
    input.addEventListener('input', () => {
      markUserInteraction();
      if (input.value.trim()) {
        hideInlineTeaser();
        return;
      }
      startInlineTeaserCycle();
    });
    input.addEventListener('focus', () => markUserInteraction());
    if (inlineTeaserEl) {
      inlineTeaserEl.addEventListener('click', () => {
        const teaserValue = (inlineTeaserEl.textContent || '').trim();
        if (teaserValue) handleSendMessage(teaserValue);
      });
    }

    if (langBtn) {
      langBtn.addEventListener('click', () => {
        markUserInteraction();
        activeLanguage = activeLanguage === 'en' ? 'es' : 'en';
        applyLanguageUI();
      });
    }

    if (themeBtn) {
      themeBtn.addEventListener('click', () => {
        markUserInteraction();
        themeMode = themeMode === 'dark' ? 'light' : 'dark';
        applyTheme();
      });
    }

    if (emojiBtn && emojiPanel) {
      emojiBtn.addEventListener('click', () => {
        markUserInteraction();
        emojiPanelOpen = !emojiPanelOpen;
        emojiPanel.classList.toggle('open', emojiPanelOpen);
        emojiBtn.classList.toggle('active', emojiPanelOpen);
      });
    }

    if (micBtn) {
      speechRecognition = initSpeechRecognition();
      micBtn.addEventListener('click', () => {
        markUserInteraction();
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
          pendingVoiceAutoSend = true;
          latestVoiceTranscript = '';
          if (emojiPanel) emojiPanel.classList.remove('open');
          if (emojiBtn) emojiBtn.classList.remove('active');
          emojiPanelOpen = false;
          speechRecognition.lang = activeLanguage === 'es' ? 'es-ES' : 'en-US';
          speechRecognition.start();
        } catch (_) {
          pendingVoiceAutoSend = false;
          latestVoiceTranscript = '';
          isListening = false;
          micBtn.classList.remove('active');
          setVoiceOverlayOpen(false);
        }
      });
    }

    if (voiceStopBtn) {
      voiceStopBtn.addEventListener('click', () => {
        markUserInteraction();
        if (!speechRecognition || !isListening) return;
        try {
          speechRecognition.stop();
        } catch (_) {
          isListening = false;
          setVoiceOverlayOpen(false);
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

    if (testimonialBar) {
      testimonialBar.addEventListener('mousemove', (event) => {
        const rect = testimonialBar.getBoundingClientRect();
        const x = ((event.clientX - rect.left) / rect.width) * 100;
        const y = ((event.clientY - rect.top) / rect.height) * 100;
        testimonialBar.style.setProperty('--mx', `${x}%`);
        testimonialBar.style.setProperty('--my', `${y}%`);
      });
      testimonialBar.addEventListener('mouseleave', () => {
        testimonialBar.style.setProperty('--mx', '50%');
        testimonialBar.style.setProperty('--my', '50%');
      });
    }

    // Exit intent (desktop only) - Use both mouseout and mouseleave for better coverage
    document.addEventListener('mouseout', handleExitIntent);
    document.addEventListener('mouseleave', handleExitIntent);

    // Start vibration immediately
    // Start vibration immediately (if closed)
    if (!isOpen) startVibration();

    // Restore teaser if it was running (re-render happened while closed)
    if (hasBeenClosedOnce && !isOpen && !teaserDismissedThisSession) {
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
        'welcomeImageUrl', 'welcomeAudioUrl', 'welcomeVideoUrl',
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
        const normalizedLanguage = String(config.language || '').toLowerCase();
        if (normalizedLanguage === 'es' || normalizedLanguage === 'en') {
          activeLanguage = normalizedLanguage;
        }
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
