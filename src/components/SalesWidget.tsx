import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Bot, Loader2, MessageCircle, Mic, MicOff, Palette, Send, Smile, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { buildWhatsAppRedirectUrl, parseChatResponseCommands, sanitizeHttpUrl } from "@/lib/chatCommands";

type Message = {
  role: "user" | "assistant" | "system";
  content: string;
  actionUrl?: string;
  actionLabel?: string;
  imageUrl?: string;
  imageAlt?: string;
  audioUrl?: string;
};

type WidgetLocale = "es" | "en";
type WidgetTheme = "light" | "dark";
type BrowserSpeechRecognitionCtor = new () => SpeechRecognition;

const MY_WIDGET_ID = "demo-landing";
const FALLBACK_IACALLCLOSER_REDIRECT_URL = "https://ai-call-closer.vercel.app/";
const SALES_WIDGET_WHATSAPP_DESTINATION = "51924464410";
const COLOR_PRESETS = ["#00C185", "#0EA5E9", "#2563EB", "#8B5CF6", "#DB2777", "#EA580C", "#16A34A", "#0F766E"];
const QUICK_EMOJIS = [
  "\u{1F600}",
  "\u{1F604}",
  "\u{1F64F}",
  "\u{2728}",
  "\u{1F525}",
  "\u{1F44D}",
  "\u{1F3AF}",
  "\u{1F4DE}",
  "\u{2705}",
  "\u{1F4AC}",
  "\u{1F60A}",
  "\u{1F680}",
];

const WIDGET_COPY: Record<
  WidgetLocale,
  {
    businessName: string;
    subtitle: string;
    welcome: string;
    placeholder: string;
    blockedPlaceholder: string;
    quickReplies: string[];
    teaserMessages: string[];
    testimonialLabel: string;
    testimonials: Array<{ text: string; name: string; stars: number }>;
    typing: string;
    hint: string;
    openingWhatsApp: string;
    openWhatsAppNow: string;
    openingIACallCloser: string;
    openIACallCloserNow: string;
    blockedMessage: string;
    connectionError: string;
    chatTooltip: string;
    poweredBy: string;
    voiceUnsupported: string;
    listeningNow: string;
    closeAria: string;
    emojiAria: string;
    voiceStartAria: string;
    voiceStopAria: string;
    talkNow: string;
    themeDarkAria: string;
    themeLightAria: string;
    colorAria: string;
  }
> = {
  es: {
    businessName: "Agencia Demo",
    subtitle: "Instant replies",
    welcome:
      "Hola, soy tu asistente de pre-calificacion. En menos de 2 minutos podemos ayudarte a activar una llamada guiada.",
    placeholder: "Escribe tu mensaje...",
    blockedPlaceholder: "Chat bloqueado por seguridad",
    quickReplies: ["Como funciona?", "Quiero mas informacion", "Ver precios"],
    teaserMessages: ["Podemos ayudarte ahora mismo", "Tenemos respuestas en menos de 1 minuto", "Activa una llamada guiada"],
    testimonialLabel: "Testimonios",
    testimonials: [
      { text: "Me gusto la demo. Fue directa y sin vueltas.", name: "Pepito Luna", stars: 5 },
      { text: "Subimos la calidad de los leads en la primera semana.", name: "Andrea Ruiz", stars: 5 },
      { text: "El flujo fue claro y el cierre mas rapido.", name: "Rocio Mena", stars: 5 },
    ],
    typing: "Escribiendo...",
    hint: "Estamos listos para ayudarte",
    openingWhatsApp: "Abriendo WhatsApp...",
    openWhatsAppNow: "Abrir WhatsApp Ahora",
    openingIACallCloser: "Abriendo IACloser...",
    openIACallCloserNow: "Abrir IACloser ahora",
    blockedMessage: "Acceso bloqueado por politicas de seguridad.",
    connectionError: "Tuvimos un problema de conexion. Intenta nuevamente.",
    chatTooltip: "Abrir chat",
    poweredBy: "Powered by LeadWidget",
    voiceUnsupported: "La entrada por voz no esta disponible en este navegador.",
    listeningNow: "Escuchando... al terminar se envia automaticamente.",
    closeAria: "Cerrar chat",
    emojiAria: "Abrir selector de emojis",
    voiceStartAria: "Grabar voz",
    voiceStopAria: "Detener grabacion de voz",
    talkNow: "Habla ahora",
    themeDarkAria: "Cambiar a modo oscuro",
    themeLightAria: "Cambiar a modo claro",
    colorAria: "Cambiar color principal",
  },
  en: {
    businessName: "Demo Agency",
    subtitle: "Instant replies",
    welcome:
      "Hi, I am your qualification assistant. In under 2 minutes we can help you trigger a guided call.",
    placeholder: "Type your message...",
    blockedPlaceholder: "Chat blocked for security",
    quickReplies: ["How it works?", "I want more information", "See pricing"],
    teaserMessages: ["We can help you right now", "Get answers in under 1 minute", "Trigger a guided call now"],
    testimonialLabel: "Testimonials",
    testimonials: [
      { text: "Great demo flow. Fast and clear.", name: "Peter Luna", stars: 5 },
      { text: "Lead quality improved during week one.", name: "Andrea Ruiz", stars: 5 },
      { text: "The path was clear and closing got faster.", name: "Rocio Mena", stars: 5 },
    ],
    typing: "Typing...",
    hint: "We are ready to help",
    openingWhatsApp: "Opening WhatsApp...",
    openWhatsAppNow: "Open WhatsApp Now",
    openingIACallCloser: "Opening IACloser...",
    openIACallCloserNow: "Open IACloser now",
    blockedMessage: "Access blocked by security policies.",
    connectionError: "We had a connection issue. Please try again.",
    chatTooltip: "Open chat",
    poweredBy: "Powered by LeadWidget",
    voiceUnsupported: "Voice input is not available in this browser.",
    listeningNow: "Listening... message auto-sends when you finish.",
    closeAria: "Close chat",
    emojiAria: "Open emoji picker",
    voiceStartAria: "Start voice input",
    voiceStopAria: "Stop voice input",
    talkNow: "Speak now",
    themeDarkAria: "Switch to dark mode",
    themeLightAria: "Switch to light mode",
    colorAria: "Change main color",
  },
};

declare global {
  interface Window {
    SpeechRecognition?: BrowserSpeechRecognitionCtor;
    webkitSpeechRecognition?: BrowserSpeechRecognitionCtor;
    mozSpeechRecognition?: BrowserSpeechRecognitionCtor;
    msSpeechRecognition?: BrowserSpeechRecognitionCtor;
    fbq?: (...args: unknown[]) => void;
  }
}

function hexToRgb(hex: string) {
  const raw = hex.replace("#", "");
  const normalized = raw.length === 3 ? raw.split("").map((ch) => `${ch}${ch}`).join("") : raw;
  const parsed = Number.parseInt(normalized, 16);
  if (!Number.isFinite(parsed)) return { r: 0, g: 193, b: 133 };
  return {
    r: (parsed >> 16) & 255,
    g: (parsed >> 8) & 255,
    b: parsed & 255,
  };
}

function adjustHex(hex: string, amount: number) {
  const { r, g, b } = hexToRgb(hex);
  const clamp = (value: number) => Math.max(0, Math.min(255, value));
  const rr = clamp(r + amount);
  const gg = clamp(g + amount);
  const bb = clamp(b + amount);
  return `#${[rr, gg, bb].map((item) => item.toString(16).padStart(2, "0")).join("")}`;
}

function getContrastText(hex: string) {
  const { r, g, b } = hexToRgb(hex);
  const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  return luminance > 0.62 ? "#0f172a" : "#ffffff";
}

function hexToRgba(hex: string, alpha: number) {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function detectMessageLocale(value: string, fallback: WidgetLocale): WidgetLocale {
  const raw = String(value || "");
  const normalized = raw
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");
  if (!normalized) return fallback;

  const spanishSignals =
    /\b(hola|como|quiero|necesito|precio|precios|ayuda|gracias|por favor|agendar|llamada|ventas|cita|telefono|numero|espanol|si)\b/;
  if (spanishSignals.test(normalized)) return "es";

  const englishSignals =
    /\b(hello|hi|i need|price|pricing|help|thanks|please|book|call|appointment|sales|phone|yes)\b/;
  if (englishSignals.test(normalized)) return "en";

  return fallback;
}

function getCostControlDirective(locale: WidgetLocale) {
  if (locale === "es") {
    return "Se breve y orientado a conversion. Maximo 90 palabras, usa como maximo 1 emoji, evita repetir imagenes/audios. Usa [AUDIO] solo en bienvenida o CTA final (maximo 1 audio dinamico por conversacion). Si usas [IMAGE], prioriza URL Cloudinary en calidad media (q_auto:good, w<=960).";
  }
  return "Be concise and conversion-focused. Max 90 words, use at most 1 emoji, avoid repeating images/audio. Use [AUDIO] only for opening or final CTA (max 1 dynamic audio per conversation). For [IMAGE], prefer Cloudinary medium quality URLs (q_auto:good, w<=960).";
}

function buildWhatsAppStars(value: number) {
  const total = Math.max(1, Math.min(5, Number(value || 5)));
  return Array.from({ length: total }, () => "\u2B50").join("");
}

export function SalesWidget() {
  const inferredLocale: WidgetLocale = "en";

  const [locale, setLocale] = useState<WidgetLocale>(inferredLocale);
  const [themeMode, setThemeMode] = useState<WidgetTheme>("dark");
  const [primaryColor, setPrimaryColor] = useState("#00C185");
  const [isOpen, setIsOpen] = useState(false);
  const [hasBeenClosedOnce, setHasBeenClosedOnce] = useState(false);
  const [activeTeaser, setActiveTeaser] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [speechListening, setSpeechListening] = useState(false);
  const [activeTestimonialIndex, setActiveTestimonialIndex] = useState(0);
  const [testimonialTransition, setTestimonialTransition] = useState(false);
  const [isIdle, setIsIdle] = useState(false);

  const copy = useMemo(() => WIDGET_COPY[locale], [locale]);
  const isLightMode = themeMode === "light";
  const headerTextColor = getContrastText(primaryColor);
  const userBubbleTextColor = getContrastText(primaryColor);
  const primaryStrong = adjustHex(primaryColor, -24);
  const nextLanguageLabel = locale === "es" ? "EN" : "ES";

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const voiceDraftRef = useRef("");
  const pendingVoiceAutoSendRef = useRef(false);
  const handleSendFromVoiceRef = useRef<(value: string) => void>(() => {});

  const testimonial = copy.testimonials[activeTestimonialIndex % copy.testimonials.length];
  const testimonialStars = buildWhatsAppStars(testimonial.stars);

  const closePaletteAndEmoji = () => {
    setPaletteOpen(false);
    setEmojiPickerOpen(false);
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    const prefersLight = window.matchMedia("(prefers-color-scheme: light)").matches;
    setThemeMode(prefersLight ? "light" : "dark");
  }, []);

  useEffect(() => {
    setMessages((prev) => {
      if (prev.length === 0) return [{ role: "assistant", content: copy.welcome }];
      if (prev.length === 1 && prev[0]?.role === "assistant") return [{ role: "assistant", content: copy.welcome }];
      return prev;
    });
  }, [copy.welcome]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen, isLoading]);

  useEffect(() => {
    const timer = setTimeout(() => setIsOpen(true), 5000);
    const handleExternalOpen = () => {
      setIsOpen(true);
      setHasBeenClosedOnce(false);
    };
    window.addEventListener("open-lead-widget", handleExternalOpen);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("open-lead-widget", handleExternalOpen);
    };
  }, []);

  useEffect(() => {
    if (!isOpen || inputText.trim() || isLoading || messages.length > 1) {
      setIsIdle(false);
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      return;
    }

    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(() => setIsIdle(true), 5000);
    return () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, [isOpen, inputText, isLoading, messages.length]);

  useEffect(() => {
    if (!hasBeenClosedOnce || isOpen) return;
    const pickTeaser = () => {
      const pool = copy.teaserMessages;
      setActiveTeaser(pool[Math.floor(Math.random() * pool.length)] || "");
    };
    pickTeaser();
    const interval = setInterval(pickTeaser, 8500);
    return () => clearInterval(interval);
  }, [copy.teaserMessages, hasBeenClosedOnce, isOpen]);

  useEffect(() => {
    if (!isOpen || copy.testimonials.length <= 1) return;
    const interval = setInterval(() => {
      setActiveTestimonialIndex((prev) => (prev + 1) % copy.testimonials.length);
    }, 4600);
    return () => clearInterval(interval);
  }, [copy.testimonials.length, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    setTestimonialTransition(true);
    const timeout = setTimeout(() => setTestimonialTransition(false), 700);
    return () => clearTimeout(timeout);
  }, [activeTestimonialIndex, isOpen]);

  useEffect(() => {
    const SR =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition ||
      window.mozSpeechRecognition ||
      window.msSpeechRecognition;
    if (!SR) {
      recognitionRef.current = null;
      return;
    }

    const recognition = new SR();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognition.lang = locale === "es" ? "es-ES" : "en-US";

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = "";
      let interimTranscript = "";
      for (let index = event.resultIndex || 0; index < (event.results?.length || 0); index += 1) {
        const chunk = event.results[index]?.[0]?.transcript || "";
        if (event.results[index]?.isFinal) {
          finalTranscript += chunk;
        } else {
          interimTranscript += chunk;
        }
      }
      const transcript = `${finalTranscript} ${interimTranscript}`.trim();
      if (!transcript) return;
      voiceDraftRef.current = transcript;
      setInputText(transcript);
    };

    recognition.onend = () => {
      setSpeechListening(false);
      const transcript = voiceDraftRef.current.trim();
      const shouldAutoSend = pendingVoiceAutoSendRef.current;
      pendingVoiceAutoSendRef.current = false;
      voiceDraftRef.current = "";
      if (shouldAutoSend && transcript) {
        handleSendFromVoiceRef.current(transcript);
      }
    };

    recognition.onerror = () => {
      setSpeechListening(false);
      pendingVoiceAutoSendRef.current = false;
      voiceDraftRef.current = "";
    };

    recognitionRef.current = recognition;
    return () => {
      pendingVoiceAutoSendRef.current = false;
      voiceDraftRef.current = "";
      try {
        recognition.stop();
      } catch {
        // noop
      }
      recognitionRef.current = null;
    };
  }, [locale]);

  const handleSendMessage = useCallback(
    async (overrideText?: string) => {
      const textToSend = typeof overrideText === "string" ? overrideText : inputText;
      const userMessage = textToSend.trim();
      if (!userMessage || isLoading || isBlocked) return;

      const detectedLocale = detectMessageLocale(userMessage, locale);
      const responseLocale: WidgetLocale = detectedLocale === "es" ? "es" : locale;
      if (responseLocale === "es" && locale !== "es") {
        setLocale("es");
      }

      closePaletteAndEmoji();
      setIsIdle(false);
      setInputText("");
      setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
      setIsLoading(true);

      const languageDirective =
        responseLocale === "es"
          ? "Responde siempre en espanol claro y natural."
          : "Respond in clear, natural English.";
      const compactHistory = [
        ...messages.filter((item) => item.role !== "system").map((item) => ({ role: item.role, content: item.content })),
        { role: "user" as const, content: userMessage },
      ].slice(-12);
      const history = [
        { role: "system", content: languageDirective },
        { role: "system", content: getCostControlDirective(responseLocale) },
        ...compactHistory,
      ];

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: userMessage,
            history,
            widgetId: MY_WIDGET_ID,
            userTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          }),
        });

        const payload = await response.json();

        if (payload?.blocked) {
          setIsBlocked(true);
          setMessages((prev) => [...prev, { role: "assistant", content: copy.blockedMessage }]);
          return;
        }

        if (payload?.error && !payload?.response) {
          throw new Error(payload.error);
        }

        const parsed = parseChatResponseCommands(String(payload?.response || ""), {
          defaultIaCallCloserUrl: FALLBACK_IACALLCLOSER_REDIRECT_URL,
        });
        const existingAudioUrls = new Set(messages.map((item) => item.audioUrl).filter(Boolean));
        const maxAudioMessages = 1;
        const availableAudioSlots = Math.max(0, maxAudioMessages - existingAudioUrls.size);
        const budgetedAudios = parsed.audios
          .filter((item) => !existingAudioUrls.has(item.url))
          .slice(0, availableAudioSlots);
        const whatsappUrl = buildWhatsAppRedirectUrl(
          SALES_WIDGET_WHATSAPP_DESTINATION,
          parsed.whatsappPayload || userMessage,
        );
        const iaCallCloserUrl = sanitizeHttpUrl(
          parsed.iaCallCloserRedirectUrl ||
            (parsed.iaCallCloserReady ? FALLBACK_IACALLCLOSER_REDIRECT_URL : ""),
        );
        const iaCallCloserIndexCandidates = [parsed.iaCallCloserRedirectIndex, parsed.iaCallCloserReadyIndex]
          .filter((value): value is number => typeof value === "number");
        const iaCallCloserIndex = iaCallCloserIndexCandidates.length > 0
          ? Math.min(...iaCallCloserIndexCandidates)
          : null;
        const actionCandidates: Array<{
          type: "whatsapp" | "iacallcloser";
          index: number;
          url: string;
          notice: string;
          label: string;
        }> = [];

        if (parsed.whatsappIndex !== null && whatsappUrl) {
          actionCandidates.push({
            type: "whatsapp",
            index: parsed.whatsappIndex,
            url: whatsappUrl,
            notice: copy.openingWhatsApp,
            label: copy.openWhatsAppNow,
          });
        }

        if (iaCallCloserIndex !== null && iaCallCloserUrl) {
          actionCandidates.push({
            type: "iacallcloser",
            index: iaCallCloserIndex,
            url: iaCallCloserUrl,
            notice: copy.openingIACallCloser,
            label: copy.openIACallCloserNow,
          });
        }

        actionCandidates.sort((a, b) => a.index - b.index);
        const selectedAction = actionCandidates[0];
        const assistantReply = parsed.cleanText || selectedAction?.notice || (parsed.images.length > 0 || budgetedAudios.length > 0 ? "" : copy.hint);

        setMessages((prev) => [
          ...prev,
          ...(assistantReply ? [{ role: "assistant" as const, content: assistantReply }] : []),
          ...parsed.images.map((item, idx) => ({
            role: "assistant" as const,
            content: "",
            imageUrl: item.url,
            imageAlt: item.alt || `assistant-image-${idx + 1}`,
          })),
          ...budgetedAudios.map((item) => ({
            role: "assistant" as const,
            content: "",
            audioUrl: item.url,
          })),
          ...(selectedAction
            ? [{
                role: "system" as const,
                content: selectedAction.notice,
                actionUrl: selectedAction.url,
                actionLabel: selectedAction.label,
              }]
            : []),
        ]);

        if (selectedAction) {
          if (selectedAction.type === "whatsapp" && window.fbq) window.fbq("track", "Lead");
          window.setTimeout(() => {
            window.open(selectedAction.url, "_blank", "noopener,noreferrer");
          }, 1600);
        }
      } catch (error) {
        console.error("SalesWidget chat error", error);
        setMessages((prev) => [...prev, { role: "assistant", content: copy.connectionError }]);
      } finally {
        setIsLoading(false);
      }
    },
    [
      copy.blockedMessage,
      copy.connectionError,
      copy.hint,
      copy.openIACallCloserNow,
      copy.openWhatsAppNow,
      copy.openingIACallCloser,
      copy.openingWhatsApp,
      inputText,
      isBlocked,
      isLoading,
      locale,
      messages,
    ],
  );

  useEffect(() => {
    handleSendFromVoiceRef.current = (voiceText: string) => {
      void handleSendMessage(voiceText);
    };
  }, [handleSendMessage]);

  const toggleSpeechInput = () => {
    if (!recognitionRef.current) {
      setMessages((prev) => [...prev, { role: "system", content: copy.voiceUnsupported }]);
      return;
    }
    if (isLoading || isBlocked) return;

    setEmojiPickerOpen(false);
    setPaletteOpen(false);

    if (speechListening) {
      try {
        recognitionRef.current.stop();
      } catch {
        pendingVoiceAutoSendRef.current = false;
        setSpeechListening(false);
      }
      return;
    }

    try {
      pendingVoiceAutoSendRef.current = true;
      voiceDraftRef.current = "";
      recognitionRef.current.lang = locale === "es" ? "es-ES" : "en-US";
      recognitionRef.current.start();
      setSpeechListening(true);
    } catch {
      pendingVoiceAutoSendRef.current = false;
      setSpeechListening(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setHasBeenClosedOnce(true);
    closePaletteAndEmoji();
    pendingVoiceAutoSendRef.current = false;
    voiceDraftRef.current = "";
    if (recognitionRef.current && speechListening) {
      try {
        recognitionRef.current.stop();
      } catch {
        // noop
      }
      setSpeechListening(false);
    }
  };

  const testimonialBarStyle = isLightMode
    ? {
        backgroundImage:
          "linear-gradient(rgba(255,255,255,0.95), rgba(248,250,252,0.93)), linear-gradient(118deg, rgba(14,165,233,0.55), rgba(56,189,248,0.2), rgba(148,163,184,0.45), rgba(14,165,233,0.55))",
        backgroundOrigin: "border-box",
        backgroundClip: "padding-box, border-box",
        backgroundSize: "100% 100%, 180% 180%",
      }
    : {
        backgroundImage:
          "linear-gradient(rgba(2,6,23,0.9), rgba(2,6,23,0.86)), linear-gradient(120deg, #f58529, #dd2a7b, #8134af, #515bd4, #feda77, #f58529)",
        backgroundOrigin: "border-box",
        backgroundClip: "padding-box, border-box",
        backgroundSize: "100% 100%, 220% 220%",
      };

  const headerChipStyles =
    headerTextColor === "#ffffff"
      ? "border-white/35 bg-white/15 text-white hover:bg-white/25"
      : "border-slate-900/25 bg-slate-900/10 text-slate-900 hover:bg-slate-900/18";

  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3 font-sans">
        {hasBeenClosedOnce && Boolean(activeTeaser) ? (
          <button
            type="button"
            onClick={() => {
              setIsOpen(true);
              setHasBeenClosedOnce(false);
            }}
            className="relative max-w-[240px] rounded-2xl border border-slate-200 bg-white px-4 py-2 text-left text-xs font-semibold text-slate-800 shadow-xl transition hover:shadow-2xl"
          >
            {activeTeaser}
            <span className="absolute -bottom-2 right-6 h-4 w-4 rotate-45 border-b border-r border-slate-200 bg-white" />
            <span className="absolute -right-1 top-1 h-2 w-2 rounded-full animate-ping" style={{ backgroundColor: primaryColor }} />
          </button>
        ) : null}

        <button
          type="button"
          onClick={() => {
            setIsOpen(true);
            setHasBeenClosedOnce(false);
          }}
          className="group relative grid h-16 w-16 place-items-center rounded-full text-white shadow-lg transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
          style={{
            background: `linear-gradient(140deg, ${primaryColor} 0%, ${primaryStrong} 100%)`,
            color: headerTextColor,
          }}
          aria-label={copy.chatTooltip}
        >
          <Bot className="h-8 w-8 transition-transform group-hover:rotate-12" />
          <span className="absolute -right-1 -top-1 flex h-5 w-5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">1</span>
          </span>
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 pb-20 font-sans sm:bottom-6 sm:left-auto sm:right-6 sm:w-[390px] sm:pb-0">
      <div
        className={`relative flex h-[72vh] max-h-[620px] min-h-[540px] flex-col overflow-hidden rounded-3xl border shadow-2xl ${
          isLightMode ? "border-slate-200 bg-white text-slate-900" : "border-white/10 bg-[#081427] text-slate-100"
        } ${isIdle ? "ring-2 ring-emerald-400/30" : ""}`}
      >
        <div
          className="flex items-center justify-between gap-3 px-4 py-3"
          style={{
            background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryStrong} 100%)`,
            color: headerTextColor,
          }}
        >
          <div className="flex min-w-0 items-center gap-3">
            <div
              className={`relative grid h-10 w-10 place-items-center rounded-full ${headerTextColor === "#ffffff" ? "bg-white/20" : "bg-slate-900/10"}`}
            >
              <Bot className="h-5 w-5" />
              <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-current bg-green-400" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold">{copy.businessName}</p>
              <p className={`truncate text-[10px] ${headerTextColor === "#ffffff" ? "text-white/90" : "text-slate-900/80"}`}>{copy.subtitle}</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setLocale((prev) => (prev === "es" ? "en" : "es"))}
              className={`inline-flex h-8 min-w-8 items-center justify-center rounded-full border px-2 text-[11px] font-bold tracking-[0.06em] transition ${headerChipStyles}`}
              aria-label="Toggle language"
            >
              {nextLanguageLabel}
            </button>
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setPaletteOpen((prev) => !prev);
                  setEmojiPickerOpen(false);
                }}
                className={`inline-flex h-8 w-8 items-center justify-center rounded-full border transition ${headerChipStyles}`}
                aria-label={copy.colorAria}
              >
                <Palette className="h-4 w-4" />
              </button>
              {paletteOpen ? (
                <div className={`absolute right-0 top-10 z-30 w-44 rounded-xl border p-2 shadow-2xl ${isLightMode ? "border-slate-200 bg-white" : "border-white/15 bg-slate-900/95 backdrop-blur"}`}>
                  <div className="grid grid-cols-4 gap-1.5">
                    {COLOR_PRESETS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => {
                          setPrimaryColor(color);
                          setPaletteOpen(false);
                        }}
                        className={`h-7 w-7 rounded-full border ${primaryColor === color ? "ring-2 ring-offset-2 ring-cyan-400 ring-offset-transparent" : ""}`}
                        style={{ backgroundColor: color, borderColor: hexToRgba(color, 0.4) }}
                        aria-label={`Color ${color}`}
                      />
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
            <button
              type="button"
              onClick={handleClose}
              className={`inline-flex h-8 w-8 items-center justify-center rounded-full border transition ${headerChipStyles}`}
              aria-label={copy.closeAria}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div
          className={`relative mx-3 mt-3 overflow-hidden rounded-xl border px-3 py-2 text-xs transition-all duration-500 ${
            testimonialTransition
              ? isLightMode
                ? "shadow-[0_0_24px_-16px_rgba(56,189,248,0.6)]"
                : "shadow-[0_0_35px_-16px_rgba(34,211,238,0.9)]"
              : ""
          }`}
          style={testimonialBarStyle}
        >
          <div
            className={`pointer-events-none absolute -inset-16 transition-opacity duration-500 ${testimonialTransition ? "opacity-100" : "opacity-0"}`}
            style={{
              background: isLightMode
                ? "radial-gradient(circle at 50% 50%, rgba(56,189,248,0.28) 0%, rgba(148,163,184,0.2) 40%, rgba(255,255,255,0) 74%)"
                : "radial-gradient(circle at 50% 50%, rgba(125,211,252,0.42) 0%, rgba(52,211,153,0.25) 35%, rgba(2,6,23,0) 72%)",
            }}
          />
          <div className="relative min-w-0">
            <p className={`text-[10px] font-semibold uppercase tracking-[0.2em] ${isLightMode ? "text-sky-700" : "text-cyan-200"}`}>{copy.testimonialLabel}</p>
            <p className="mt-0.5 truncate text-xs">"{testimonial.text}"</p>
            <div className={`mt-1 flex min-w-0 items-center gap-1.5 text-[11px] ${isLightMode ? "text-slate-500" : "text-slate-300"}`}>
              <span className="truncate">{testimonial.name}</span>
              <span aria-hidden="true" className="opacity-60">•</span>
              <span
                className="inline-flex shrink-0 rounded-full border border-amber-300/70 bg-gradient-to-b from-amber-100/80 to-amber-300/25 px-1.5 py-0.5 text-[10px] leading-none shadow-[0_0_10px_rgba(251,191,36,0.42)]"
                style={{ textShadow: "0 0 6px rgba(251,191,36,0.75)" }}
                aria-label={`${testimonial.stars} stars`}
              >
                {testimonialStars}
              </span>
            </div>
          </div>
        </div>

        <div
          ref={scrollRef}
          className={`flex-1 space-y-3 overflow-y-auto px-4 py-4 ${
            isLightMode ? "bg-slate-50/70" : "bg-[#041024]"
          }`}
        >
          {messages.map((msg, index) => (
            <div key={`${msg.role}-${index}`} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              {msg.role === "system" ? (
                <div className="w-full space-y-2 text-center">
                  <p className={`inline-block rounded-full px-3 py-1 text-xs ${isLightMode ? "bg-slate-200 text-slate-600" : "bg-white/10 text-slate-200"}`}>{msg.content}</p>
                  {msg.actionUrl ? (
                    <Button type="button" className="h-10 w-full gap-2 bg-[#25D366] font-semibold text-white hover:bg-[#1ea955]" onClick={() => window.open(msg.actionUrl, "_blank", "noopener,noreferrer")}>
                      <MessageCircle className="h-4 w-4" />
                      {msg.actionLabel || copy.openWhatsAppNow}
                    </Button>
                  ) : null}
                </div>
              ) : (
                (() => {
                  const hasMediaOnly = !msg.content && (Boolean(msg.imageUrl) || Boolean(msg.audioUrl));
                  const shouldExpandForAudio = Boolean(msg.audioUrl);
                  return (
                <div
                  className={`max-w-[86%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "rounded-br-md"
                      : isLightMode
                        ? "rounded-bl-md border border-slate-200 bg-white text-slate-700"
                        : "rounded-bl-md border border-white/10 bg-white/[0.04] text-slate-100"
                  } ${hasMediaOnly || shouldExpandForAudio ? "min-w-[220px]" : ""}`}
                  style={msg.role === "user" ? { backgroundColor: primaryColor, color: userBubbleTextColor } : undefined}
                >
                  {msg.content ? <p>{msg.content}</p> : null}
                  {msg.imageUrl ? (
                    <img
                      src={msg.imageUrl}
                      alt={msg.imageAlt || "Assistant image"}
                      loading="lazy"
                      className="mt-2 w-full max-w-[250px] rounded-lg border border-white/10 object-cover"
                    />
                  ) : null}
                  {msg.audioUrl ? (
                    <div className={`mt-2 rounded-xl border px-2.5 py-2 ${
                      isLightMode
                        ? "border-slate-200 bg-slate-50"
                        : "border-white/15 bg-slate-900/60"
                    }`}>
                      <div className={`mb-1 flex items-center gap-2 text-[11px] font-medium ${
                        isLightMode ? "text-slate-600" : "text-slate-200/90"
                      }`}>
                        <span className={`h-2 w-2 rounded-full animate-pulse ${isLightMode ? "bg-emerald-500" : "bg-emerald-300"}`} />
                        <span>{copy.talkNow}</span>
                      </div>
                      <audio
                        controls
                        preload="metadata"
                        className="block w-full min-w-[210px] max-w-[250px]"
                        style={{ colorScheme: isLightMode ? "light" : "dark" }}
                      >
                        <source src={msg.audioUrl} />
                      </audio>
                    </div>
                  ) : null}
                </div>
                  );
                })()
              )}
            </div>
          ))}

          {isLoading ? (
            <div className="flex justify-start">
              <div className={`inline-flex items-center gap-2 rounded-2xl rounded-bl-md border px-3 py-2 text-xs ${isLightMode ? "border-slate-200 bg-white text-slate-500" : "border-white/10 bg-white/[0.04] text-slate-300"}`}>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                {copy.typing}
              </div>
            </div>
          ) : null}
        </div>

        <div className={`space-y-3 border-t px-4 py-4 ${isLightMode ? "border-slate-200 bg-white" : "border-white/10 bg-[#081427]"}`}>
          {messages.length < 3 ? (
            <div className="flex flex-nowrap gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {copy.quickReplies.map((text) => (
                <button
                  key={text}
                  type="button"
                  onClick={() => void handleSendMessage(text)}
                  disabled={isBlocked || isLoading}
                  className={`shrink-0 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs transition ${
                    isLightMode
                      ? "border-slate-300 bg-white text-slate-700 hover:border-sky-300 hover:text-sky-700"
                      : "border-slate-700 bg-slate-900 text-slate-200 hover:border-cyan-400/60 hover:text-cyan-200"
                  } disabled:cursor-not-allowed disabled:opacity-50`}
                >
                  {text}
                </button>
              ))}
            </div>
          ) : null}

          <form
            onSubmit={(event) => {
              event.preventDefault();
              void handleSendMessage();
            }}
            className={`flex items-center gap-2 transition ${isIdle ? "scale-[1.01]" : ""}`}
          >
            <div
              className={`relative flex h-12 min-w-0 flex-1 items-center gap-2 rounded-[14px] border px-2.5 ${
                isLightMode ? "border-slate-300 bg-white" : "border-cyan-500/35 bg-[#0a1627]/92"
              }`}
            >
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setEmojiPickerOpen((prev) => !prev);
                    setPaletteOpen(false);
                  }}
                  className={`inline-flex h-7 w-7 items-center justify-center rounded-full border ${
                    isLightMode
                      ? "border-slate-300 bg-white text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                      : "border-white/15 bg-white/[0.04] text-slate-400 hover:bg-white/[0.1] hover:text-cyan-200"
                  }`}
                  aria-label={copy.emojiAria}
                >
                  <Smile className="h-3.5 w-3.5" />
                </button>
                {emojiPickerOpen ? (
                  <div className={`absolute bottom-10 left-0 z-30 w-56 rounded-xl border p-2 shadow-2xl ${isLightMode ? "border-slate-200 bg-white" : "border-white/15 bg-[#0a1627]/95 backdrop-blur"}`}>
                    <div className="grid grid-cols-6 gap-1">
                      {QUICK_EMOJIS.map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => setInputText((prev) => `${prev}${emoji}`)}
                          className={`rounded-md p-1.5 text-base ${isLightMode ? "hover:bg-slate-100" : "hover:bg-white/10"}`}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>

              <button
                type="button"
                onClick={toggleSpeechInput}
                className={`inline-flex h-7 w-7 items-center justify-center rounded-full border ${
                  isLightMode
                    ? "border-slate-300 bg-white text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                    : "border-white/15 bg-white/[0.04] text-slate-400 hover:bg-white/[0.1] hover:text-cyan-200"
                } disabled:cursor-not-allowed disabled:opacity-50`}
                aria-label={speechListening ? copy.voiceStopAria : copy.voiceStartAria}
                disabled={isLoading || isBlocked}
              >
                {speechListening ? <MicOff className="h-3.5 w-3.5 text-rose-400" /> : <Mic className="h-3.5 w-3.5" />}
              </button>

              <Input
                value={inputText}
                onChange={(event) => setInputText(event.target.value)}
                onFocus={() => setIsIdle(false)}
                placeholder={isBlocked ? copy.blockedPlaceholder : copy.placeholder}
                className={`h-9 min-w-0 border-0 bg-transparent px-0 text-sm shadow-none placeholder:text-slate-400 focus-visible:ring-0 ${
                  isLightMode ? "text-slate-900" : "text-slate-100"
                }`}
                disabled={isLoading || isBlocked}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || isBlocked || !inputText.trim()}
              className="inline-flex h-12 w-12 items-center justify-center rounded-[14px] transition hover:-translate-y-[1px] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
              style={{
                background: `linear-gradient(140deg, ${primaryColor} 0%, ${primaryStrong} 100%)`,
                boxShadow: `0 8px 16px ${hexToRgba(primaryColor, 0.28)}`,
                color: getContrastText(primaryColor),
              }}
            >
              <Send className="h-4 w-4" />
            </button>
          </form>

          <div className="flex items-center justify-center gap-1">
            <span className="h-1 w-1 rounded-full" style={{ backgroundColor: primaryColor }} />
            <p className={`text-[10px] font-medium uppercase tracking-[0.15em] ${isLightMode ? "text-slate-500" : "text-slate-400"}`}>{copy.poweredBy}</p>
            <span className="h-1 w-1 rounded-full" style={{ backgroundColor: primaryColor }} />
          </div>
        </div>

        {speechListening ? (
          <div className={`absolute inset-0 z-40 flex items-center justify-center px-5 ${isLightMode ? "bg-slate-900/45" : "bg-slate-950/70"} backdrop-blur-sm`}>
            <div className={`w-full rounded-2xl border p-5 ${isLightMode ? "border-slate-200 bg-white/95 text-slate-800" : "border-white/15 bg-slate-900/92 text-slate-100"}`} role="status" aria-live="polite">
              <div className="flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <p className="text-sm font-semibold">{copy.talkNow}</p>
                  <p className={`text-xs ${isLightMode ? "text-slate-500" : "text-slate-300"}`}>{copy.listeningNow}</p>
                </div>
                <button
                  type="button"
                  onClick={toggleSpeechInput}
                  className="relative inline-flex h-24 w-24 items-center justify-center rounded-full border border-white/60 bg-white/5 text-rose-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300"
                  aria-label={copy.voiceStopAria}
                >
                  <span className="absolute inset-0 rounded-full border border-rose-400/50 animate-ping" />
                  <span className="absolute inset-3 rounded-full border border-rose-300/70" />
                  <Mic className="relative z-10 h-7 w-7" />
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      <button
        type="button"
        onClick={handleClose}
        className="absolute bottom-2 left-1/2 z-50 grid h-14 w-14 -translate-x-1/2 place-items-center rounded-full border-4 border-white bg-red-600 text-white shadow-2xl transition active:scale-95 sm:hidden"
        aria-label={copy.closeAria}
      >
        <X className="h-6 w-6" />
      </button>
    </div>
  );
}

