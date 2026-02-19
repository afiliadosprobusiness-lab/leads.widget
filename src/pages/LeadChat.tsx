import { FormEvent, MouseEvent as ReactMouseEvent, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { Loader2, Mic, MicOff, Moon, PhoneCall, Send, ShieldCheck, Smile, Sun, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ChatMessage = {
  role: "user" | "assistant" | "system";
  content: string;
  audioUrl?: string;
};

type Testimonial = {
  id?: string;
  name?: string;
  text?: string;
  stars?: number;
  avatar_url?: string;
};

type PublicWidgetConfig = {
  widgetId: string;
  businessName?: string;
  primaryColor?: string;
  welcomeMessage?: string;
  chatPlaceholder?: string;
  quickReplies?: string[];
  teaserMessages?: string[];
  testimonials?: Testimonial[];
  triggerDelay?: number;
  exitIntentEnabled?: boolean;
  exitIntentTitle?: string;
  exitIntentDescription?: string;
  exitIntentCta?: string;
  consentText?: string;
  consentTextVersion?: string;
  iacloserRedirectUrl?: string;
  leadChatHeadline?: string;
  leadChatSubheadline?: string;
  leadChatEyebrow?: string;
  leadChatBadgeText?: string;
  leadChatOfferTitle?: string;
  leadChatOfferDescription?: string;
  leadChatCtaLabel?: string;
  leadChatLiveToasts?: string[];
};

type CloserSeed = {
  name?: string;
  phone?: string;
  collected_info?: string;
};

const FIXED_IACLOSER_REDIRECT_URL = "https://ai-call-closer.vercel.app/";
const HAS_EMOJI_RE = /[\p{Extended_Pictographic}]/u;
const QUICK_EMOJIS = ["😀", "😄", "🙏", "✨", "🔥", "👍", "🎯", "📞", "✅", "💬", "😊", "🚀"];

declare global {
  interface Window {
    SpeechRecognition?: any;
    webkitSpeechRecognition?: any;
  }
}

function sanitizePhone(value: string) {
  return value.replace(/\D/g, "").slice(0, 15);
}

function withBotEmoji(value: string) {
  const text = value.trim();
  if (!text) return "✨";
  if (HAS_EMOJI_RE.test(text)) return text;
  return `✨ ${text}`;
}

function normalizeConsentAnswer(value: string) {
  return value.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function hasExplicitConsentYes(value: string) {
  const normalized = normalizeConsentAnswer(value);
  return normalized === "si" || normalized === "yes";
}

function normalizeStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((item) => (typeof item === "string" ? item.trim() : ""))
      .filter(Boolean);
  }
  if (typeof value === "string") {
    return value
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
}

function normalizeTestimonials(value: unknown): Testimonial[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const record = item as Record<string, unknown>;
      return {
        id: typeof record.id === "string" ? record.id : "",
        name: typeof record.name === "string" ? record.name : "Cliente",
        text: typeof record.text === "string" ? record.text : "",
        stars: typeof record.stars === "number" ? record.stars : 5,
        avatar_url: typeof record.avatar_url === "string" ? record.avatar_url : "",
      } as Testimonial;
    })
    .filter((item): item is Testimonial => Boolean(item) && Boolean(item.text || item.name));
}

function parseIACCloserSeed(responseText: string) {
  const fullMatch = responseText.match(/\[\s*(?:ICLOSER_READY|ICALLCLOSER_READY|IACALLCLOSER_READY)\s*:\s*([\s\S]*?)\]/i);
  const bareMatch = responseText.match(/\[\s*(?:ICLOSER_READY|ICALLCLOSER_READY|IACALLCLOSER_READY)\s*\]/i);

  if (!fullMatch && !bareMatch) {
    return { isReady: false, cleanText: responseText, seed: {} as CloserSeed };
  }

  let seed: CloserSeed = {};
  if (fullMatch?.[1]) {
    try {
      const parsed = JSON.parse(fullMatch[1]);
      if (parsed && typeof parsed === "object") {
        seed = {
          name: typeof parsed.name === "string" ? parsed.name.trim() : "",
          phone: typeof parsed.phone === "string" ? parsed.phone.trim() : "",
          collected_info: typeof parsed.collected_info === "string" ? parsed.collected_info.trim() : "",
        };
      }
    } catch {
      seed = {};
    }
  }

  const cleanText = responseText
    .replace(fullMatch?.[0] || "", "")
    .replace(bareMatch?.[0] || "", "")
    .trim();

  return { isReady: true, cleanText, seed };
}

export default function LeadChat() {
  const { identity = "" } = useParams();
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [sending, setSending] = useState(false);
  const [assistantTyping, setAssistantTyping] = useState(false);
  const [assistantDraft, setAssistantDraft] = useState("");
  const [handoffLoading, setHandoffLoading] = useState(false);
  const [config, setConfig] = useState<PublicWidgetConfig | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [chatError, setChatError] = useState("");
  const [consentVisible, setConsentVisible] = useState(false);
  const [leadName, setLeadName] = useState("");
  const [leadPhone, setLeadPhone] = useState("");
  const [leadConsentAnswer, setLeadConsentAnswer] = useState("");
  const [handoffEligible, setHandoffEligible] = useState(false);
  const [collectedInfoSeed, setCollectedInfoSeed] = useState("");
  const [handoffMessage, setHandoffMessage] = useState("");
  const [offerDismissed, setOfferDismissed] = useState(false);
  const [socialProofToast, setSocialProofToast] = useState("");
  const [activeTestimonialIndex, setActiveTestimonialIndex] = useState(0);
  const [activeTeaser, setActiveTeaser] = useState("");
  const [teaserVisible, setTeaserVisible] = useState(false);
  const [showExitIntent, setShowExitIntent] = useState(false);
  const [exitIntentShown, setExitIntentShown] = useState(false);
  const [themeMode, setThemeMode] = useState<"dark" | "light">("dark");
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const [speechListening, setSpeechListening] = useState(false);
  const [testimonialGlow, setTestimonialGlow] = useState({ x: 50, y: 50, active: false });
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const consentPanelRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const recognitionRef = useRef<any>(null);

  const appendAssistantWithTypewriter = (text: string) =>
    new Promise<void>((resolve) => {
      const cleanText = withBotEmoji(text);
      if (!cleanText) {
        resolve();
        return;
      }

      const chars = Array.from(cleanText);
      let index = 0;
      const speed = chars.length > 220 ? 8 : chars.length > 140 ? 12 : 16;

      setAssistantTyping(true);
      setAssistantDraft("");

      const intervalId = window.setInterval(() => {
        index += 1;
        setAssistantDraft(chars.slice(0, index).join(""));

        if (index >= chars.length) {
          window.clearInterval(intervalId);
          window.setTimeout(() => {
            setMessages((prev) => [...prev, { role: "assistant", content: cleanText }]);
            setAssistantTyping(false);
            setAssistantDraft("");
            resolve();
          }, 120);
        }
      }, speed);
    });

  useEffect(() => {
    const loadConfig = async () => {
      setLoadingConfig(true);
      try {
        const response = await fetch(`/api/widget-config/${encodeURIComponent(identity)}`, { cache: "no-store" });
        const payload = await response.json();
        if (!response.ok || !payload?.config) {
          throw new Error(payload?.error || "No se pudo cargar la configuracion");
        }

        const raw = payload.config as Record<string, unknown>;
        const normalized: PublicWidgetConfig = {
          widgetId: String(raw.widgetId || raw.widget_id || identity || ""),
          businessName: String(raw.businessName || raw.business_name || "Asistente comercial"),
          primaryColor: String(raw.primaryColor || raw.primary_color || "#00C185"),
          welcomeMessage: String(
            raw.welcomeMessage || raw.welcome_message || "Hola. Soy tu asistente virtual, te ayudo a encontrar la mejor opcion para ti.",
          ),
          chatPlaceholder: String(raw.chatPlaceholder || raw.chat_placeholder || "Escribe tu mensaje..."),
          quickReplies: normalizeStringArray(raw.quickReplies ?? raw.quick_replies).slice(0, 8),
          teaserMessages: normalizeStringArray(raw.teaserMessages ?? raw.teaser_messages).slice(0, 12),
          testimonials: normalizeTestimonials(raw.testimonials).slice(0, 10),
          triggerDelay: Number(raw.triggerDelay || raw.trigger_delay || 5),
          exitIntentEnabled:
            typeof raw.exitIntentEnabled === "boolean"
              ? raw.exitIntentEnabled
              : typeof raw.trigger_exit_intent === "boolean"
                ? raw.trigger_exit_intent
                : true,
          exitIntentTitle: String(raw.exitIntentTitle || raw.exit_intent_title || "Espera"),
          exitIntentDescription: String(
            raw.exitIntentDescription || raw.exit_intent_description || "Antes de salir, mira como este Lead Chat acelera el cierre.",
          ),
          exitIntentCta: String(raw.exitIntentCta || raw.exit_intent_cta || "Volver al chat"),
          consentText: String(
            raw.consentText || raw.consent_text || "Acepto ser contactado por telefono o mensajes para continuar con mi solicitud.",
          ),
          consentTextVersion: String(raw.consentTextVersion || raw.consent_text_version || "v1"),
          iacloserRedirectUrl: String(raw.iacloserRedirectUrl || raw.icloser_redirect_url || FIXED_IACLOSER_REDIRECT_URL),
          leadChatHeadline: String(raw.leadChatHeadline || raw.lead_chat_headline || "Conversa, califica y activa tu llamada de cierre."),
          leadChatSubheadline: String(
            raw.leadChatSubheadline ||
              raw.lead_chat_subheadline ||
              "Esta pagina esta enfocada en precalificar al lead y activar cierre rapido con IACloser.",
          ),
          leadChatEyebrow: String(raw.leadChatEyebrow || raw.lead_chat_eyebrow || "Lead Chat publico"),
          leadChatBadgeText: String(raw.leadChatBadgeText || raw.lead_chat_badge_text || "IACloser en menos de 60s"),
          leadChatOfferTitle: String(raw.leadChatOfferTitle || raw.lead_chat_offer_title || "Bloquea tu llamada de cierre ahora"),
          leadChatOfferDescription: String(
            raw.leadChatOfferDescription ||
              raw.lead_chat_offer_description ||
              "Estas en el momento mas caliente. Si aceptas el contacto ahora, IACloser toma tu contexto y prioriza el cierre.",
          ),
          leadChatCtaLabel: String(raw.leadChatCtaLabel || raw.lead_chat_cta_label || "Activar llamada"),
          leadChatLiveToasts: normalizeStringArray(raw.leadChatLiveToasts ?? raw.lead_chat_live_toasts).slice(0, 12),
        };

        setConfig(normalized);
        setMessages([
          {
            role: "assistant",
            content: withBotEmoji(normalized.welcomeMessage || "Hola. Soy tu asistente virtual, te ayudo a encontrar la mejor opcion para ti."),
          },
        ]);
      } catch (error: any) {
        setChatError(error?.message || "No se pudo iniciar el chat.");
      } finally {
        setLoadingConfig(false);
      }
    };

    if (identity) {
      loadConfig();
    } else {
      setLoadingConfig(false);
      setChatError("Falta identidad de Lead Chat.");
    }
  }, [identity]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, sending, assistantTyping, assistantDraft, consentVisible]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const prefersLight = window.matchMedia("(prefers-color-scheme: light)").matches;
    setThemeMode(prefersLight ? "light" : "dark");
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const SpeechRecognitionCtor = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionCtor) return;

    const recognition = new SpeechRecognitionCtor();
    recognition.lang = navigator.language || "en-US";
    recognition.interimResults = true;
    recognition.continuous = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: any) => {
      let transcript = "";
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        transcript += event.results[index][0]?.transcript || "";
      }
      setInput(transcript.trim());
    };

    recognition.onend = () => setSpeechListening(false);
    recognition.onerror = () => setSpeechListening(false);

    recognitionRef.current = recognition;
    return () => {
      try {
        recognition.stop();
      } catch {
        // noop
      }
      recognitionRef.current = null;
    };
  }, []);

  const quickReplies = useMemo(
    () => (Array.isArray(config?.quickReplies) ? config.quickReplies.filter(Boolean).slice(0, 8) : []),
    [config?.quickReplies],
  );

  const testimonials = useMemo(
    () => (Array.isArray(config?.testimonials) ? config.testimonials.slice(0, 10) : []),
    [config?.testimonials],
  );

  const userMessageCount = useMemo(
    () => messages.filter((msg) => msg.role === "user").length,
    [messages],
  );

  const shouldShowInlineOffer = useMemo(
    () => handoffEligible && !consentVisible && !handoffMessage && !offerDismissed && userMessageCount >= 2,
    [handoffEligible, consentVisible, handoffMessage, offerDismissed, userMessageCount],
  );

  const activeTestimonial = useMemo(() => {
    if (testimonials.length === 0) return null;
    return testimonials[activeTestimonialIndex % testimonials.length];
  }, [activeTestimonialIndex, testimonials]);

  const handleTestimonialPointerMove = (event: ReactMouseEvent<HTMLElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    setTestimonialGlow({ x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)), active: true });
  };

  const handleTestimonialPointerLeave = () => {
    setTestimonialGlow((prev) => ({ ...prev, active: false }));
  };

  useEffect(() => {
    if (testimonials.length <= 1) return;
    const interval = window.setInterval(() => {
      setActiveTestimonialIndex((prev) => (prev + 1) % testimonials.length);
    }, 4200);
    return () => window.clearInterval(interval);
  }, [testimonials.length]);

  useEffect(() => {
    const fallbackMessages = [
      "Nuevo lead activo hace 2 min",
      "Un asesor IA acaba de cerrar una llamada",
      "Conversiones en vivo: este chat esta funcionando",
    ];
    const customToasts = Array.isArray(config?.leadChatLiveToasts)
      ? config.leadChatLiveToasts.filter(Boolean).slice(0, 12)
      : [];
    const source = customToasts.length > 0
      ? customToasts
      : testimonials.length > 0
      ? testimonials.map((item) => `${item.name || "Cliente"}: ${item.text || "Excelente experiencia"}`)
      : fallbackMessages;

    let index = 0;
    setSocialProofToast(source[0] || "");
    const interval = window.setInterval(() => {
      index = (index + 1) % source.length;
      setSocialProofToast(source[index] || "");
    }, 7600);
    return () => window.clearInterval(interval);
  }, [config?.leadChatLiveToasts, testimonials]);

  useEffect(() => {
    const source = Array.isArray(config?.teaserMessages) ? config.teaserMessages.filter(Boolean) : [];
    if (source.length === 0 || consentVisible || !!handoffMessage || !!input.trim() || sending || assistantTyping) {
      setTeaserVisible(false);
      return;
    }

    let index = Math.floor(Math.random() * source.length);
    let hideTimeout: number | undefined;
    const startupDelay = Math.max(4, Number(config?.triggerDelay || 5)) * 1000;

    const showTeaser = () => {
      setActiveTeaser(source[index] || "");
      setTeaserVisible(true);
      index = (index + 1) % source.length;
      hideTimeout = window.setTimeout(() => setTeaserVisible(false), 4200);
    };

    const startTimeout = window.setTimeout(showTeaser, startupDelay);
    const intervalId = window.setInterval(showTeaser, 8500);

    return () => {
      window.clearTimeout(startTimeout);
      window.clearInterval(intervalId);
      if (hideTimeout) window.clearTimeout(hideTimeout);
    };
  }, [config?.teaserMessages, config?.triggerDelay, consentVisible, handoffMessage, input, sending, assistantTyping]);

  useEffect(() => {
    if (config?.exitIntentEnabled === false || exitIntentShown || showExitIntent || consentVisible || !!handoffMessage) return;
    const desktopPointer = window.matchMedia("(min-width: 1024px) and (pointer:fine)").matches;
    if (!desktopPointer) return;

    const handleExitIntent = (event: MouseEvent) => {
      const isExit = event.clientY <= 6 || (event.relatedTarget === null && event.clientY < 10);
      if (!isExit) return;
      setExitIntentShown(true);
      setShowExitIntent(true);
    };

    document.addEventListener("mouseout", handleExitIntent);
    document.addEventListener("mouseleave", handleExitIntent);
    return () => {
      document.removeEventListener("mouseout", handleExitIntent);
      document.removeEventListener("mouseleave", handleExitIntent);
    };
  }, [config?.exitIntentEnabled, consentVisible, handoffMessage, exitIntentShown, showExitIntent]);

  const conversationHistory = useMemo(
    () => messages.filter((msg) => msg.role !== "system").map((msg) => ({ role: msg.role, content: msg.content })),
    [messages],
  );

  const buildCollectedInfo = () => {
    if (collectedInfoSeed) return collectedInfoSeed;
    return conversationHistory
      .slice(-12)
      .map((entry) => `${entry.role}: ${entry.content}`)
      .join(" | ")
      .slice(0, 1800);
  };

  const toggleSpeechInput = () => {
    if (!recognitionRef.current) {
      setChatError("Tu navegador no soporta captura de voz. Usa Chrome o Edge actualizado.");
      return;
    }
    setChatError("");
    if (speechListening) {
      recognitionRef.current.stop();
      setSpeechListening(false);
      return;
    }
    try {
      recognitionRef.current.start();
      setSpeechListening(true);
    } catch {
      setSpeechListening(false);
    }
  };

  const appendEmojiToInput = (emoji: string) => {
    setInput((prev) => `${prev}${emoji}`);
    setEmojiPickerOpen(false);
    inputRef.current?.focus();
  };

  const openConsentStep = () => {
    if (!handoffEligible) {
      setChatError("Primero terminemos la precalificacion. Al final te pediremos confirmar el consentimiento.");
      return;
    }

    setChatError("");
    setOfferDismissed(true);
    setShowExitIntent(false);
    setConsentVisible(true);
    window.setTimeout(() => {
      const container = scrollRef.current;
      const panel = consentPanelRef.current;
      if (container && panel) {
        container.scrollTo({ top: Math.max(panel.offsetTop - 12, 0), behavior: "smooth" });
        return;
      }
      panel?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 150);
  };

  const handleSend = async (overrideText?: string) => {
    if (!config?.widgetId || sending || assistantTyping) return;
    const text = (overrideText ?? input).trim();
    if (!text) return;

    setChatError("");
    setHandoffMessage("");
    setTeaserVisible(false);
    setEmojiPickerOpen(false);

    const nextMessages: ChatMessage[] = [...messages, { role: "user", content: text }];
    setMessages(nextMessages);
    setInput("");
    setSending(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          history: nextMessages.map((m) => ({ role: m.role, content: m.content })),
          widgetId: config.widgetId,
          userTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        }),
      });
      const payload = await response.json();
      if (!response.ok && !payload?.response) {
        throw new Error(payload?.error || "No se pudo procesar el mensaje.");
      }

      const aiText = String(payload?.response || "").trim();
      const parsed = parseIACCloserSeed(aiText);
      const cleanResponse = parsed.cleanText || "Perfecto, continuemos.";

      await appendAssistantWithTypewriter(cleanResponse);

      if (parsed.isReady) {
        if (parsed.seed?.name && !leadName) setLeadName(parsed.seed.name);
        if (parsed.seed?.phone && !leadPhone) setLeadPhone(sanitizePhone(parsed.seed.phone));
        if (parsed.seed?.collected_info) setCollectedInfoSeed(parsed.seed.collected_info);
        setHandoffEligible(true);
        setOfferDismissed(true);
        setShowExitIntent(false);
        setConsentVisible(true);
      }
    } catch (error: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: withBotEmoji("Tuvimos un problema de conexion. Puedes intentarlo nuevamente."),
        },
      ]);
      setChatError(error?.message || "Error en el chat.");
    } finally {
      setSending(false);
    }
  };

  const submitHandoff = async (event: FormEvent) => {
    event.preventDefault();
    if (!config?.widgetId) return;

    const cleanName = leadName.trim();
    const cleanPhone = sanitizePhone(leadPhone);
    if (!cleanName || cleanPhone.length < 8) {
      setChatError("Completa nombre y telefono valido para continuar.");
      return;
    }
    if (!hasExplicitConsentYes(leadConsentAnswer)) {
      setChatError("Para continuar debes escribir SI de forma expresa.");
      return;
    }

    setChatError("");
    setHandoffLoading(true);
    setHandoffMessage("");

    try {
      const response = await fetch("/api/icloser/handoff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          widgetId: config.widgetId,
          name: cleanName,
          phone: cleanPhone,
          collectedInfo: buildCollectedInfo(),
          history: conversationHistory,
          consent: {
            accepted: true,
            explicitResponse: leadConsentAnswer.trim(),
            textVersion: config.consentTextVersion || "v1",
            text: config.consentText || "",
          },
        }),
      });
      const payload = await response.json();
      if (!response.ok || payload?.success !== true) {
        throw new Error(payload?.error || "No se pudo enviar el handoff a IACloser.");
      }

      const redirectUrl = String(payload?.redirectUrl || config.iacloserRedirectUrl || "").trim();
      setHandoffMessage("Todo listo. IACloser te contactara en menos de 60 segundos.");
      setMessages((prev) => [
        ...prev,
        {
          role: "system",
          content: "Consentimiento confirmado. Te estamos conectando con IACloser.",
        },
      ]);

      if (redirectUrl) {
        setTimeout(() => {
          window.location.href = redirectUrl;
        }, 900);
      }
    } catch (error: any) {
      setChatError(error?.message || "No se pudo completar el handoff.");
    } finally {
      setHandoffLoading(false);
    }
  };

  if (loadingConfig) {
    return (
      <main className="min-h-screen grid place-items-center bg-slate-950 text-slate-100">
        <div className="flex items-center gap-3 text-sm">
          <Loader2 className="w-4 h-4 animate-spin" />
          Cargando Lead Chat...
        </div>
      </main>
    );
  }

  if (!config) {
    return (
      <main className="min-h-screen grid place-items-center bg-slate-950 text-slate-100 px-4 text-center">
        <div className="space-y-2">
          <p className="font-semibold">No pudimos abrir este Lead Chat.</p>
          <p className="text-sm text-slate-300">{chatError || "Configuracion no encontrada."}</p>
        </div>
      </main>
    );
  }

  const isLightMode = themeMode === "light";

  return (
    <main className={`relative min-h-screen overflow-hidden ${isLightMode ? "bg-[#eef3fb] text-slate-900" : "bg-[#050b15] text-slate-100"}`}>
      <div className="pointer-events-none absolute inset-0">
        <div className={`absolute -top-32 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full blur-3xl ${isLightMode ? "bg-sky-300/25" : "bg-cyan-400/20"}`} />
        <div className={`absolute bottom-0 right-0 h-72 w-72 rounded-full blur-3xl ${isLightMode ? "bg-indigo-300/20" : "bg-emerald-400/10"}`} />
        <div className={`absolute top-[28%] -left-20 h-64 w-64 rounded-full blur-3xl ${isLightMode ? "bg-fuchsia-200/25" : "bg-fuchsia-500/10"}`} />
      </div>

      <div className="relative mx-auto w-full max-w-[1080px] px-3 pb-10 pt-4 sm:px-5 lg:px-6 lg:pb-12 lg:pt-6">
        <section className="min-w-0">
          <div className={`flex h-[calc(100dvh-6rem)] max-h-[860px] min-h-[560px] flex-col rounded-[34px] p-[1px] shadow-[0_30px_120px_-60px_rgba(56,189,248,0.55)] ${isLightMode ? "bg-gradient-to-b from-white via-sky-100/70 to-sky-100/30" : "bg-gradient-to-b from-white/30 via-slate-500/25 to-transparent"}`}>
            <div className={`flex h-full min-h-0 flex-col rounded-[33px] border backdrop-blur-2xl ${isLightMode ? "border-white/70 bg-white/85" : "border-white/10 bg-[#071322]/85"}`}>
              <div className={`flex flex-wrap items-center justify-between gap-3 border-b px-4 py-4 sm:px-7 sm:py-5 ${isLightMode ? "border-slate-200" : "border-white/10"}`}>
                <div className="min-w-0">
                  <p className={`text-[10px] uppercase tracking-[0.35em] ${isLightMode ? "text-sky-700/85" : "text-sky-200/90"}`}>
                    {config.leadChatEyebrow || "Lead Chat publico"}
                  </p>
                  <h1 className={`text-2xl font-semibold tracking-tight leading-tight sm:text-[2.15rem] ${isLightMode ? "text-slate-900" : "text-slate-100"}`}>{config.businessName || "Asistente comercial"}</h1>
                  <p className={`mt-1 text-sm sm:text-base ${isLightMode ? "text-slate-700" : "text-slate-200/95"}`}>
                    {config.leadChatHeadline || "Conversa, califica y activa tu llamada de cierre."}
                  </p>
                  <p className={`mt-1 text-xs sm:text-sm ${isLightMode ? "text-slate-500" : "text-slate-300/80"}`}>
                    {config.leadChatSubheadline || "Esta pagina esta enfocada en precalificar al lead y activar cierre rapido con IACloser."}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setThemeMode((prev) => (prev === "dark" ? "light" : "dark"))}
                    className={`inline-flex h-9 w-9 items-center justify-center rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 ${
                      isLightMode
                        ? "border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
                        : "border-white/15 bg-white/5 text-slate-200 hover:bg-white/10"
                    }`}
                    aria-label={isLightMode ? "Cambiar a modo oscuro" : "Cambiar a modo claro"}
                  >
                    {isLightMode ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                  </button>
                  <button
                    type="button"
                    onClick={openConsentStep}
                    disabled={!handoffEligible}
                    className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 ${
                      handoffEligible
                        ? "border-emerald-300/45 bg-emerald-400/12 text-emerald-100 hover:bg-emerald-400/20 hover:shadow-[0_0_0_1px_rgba(52,211,153,0.35)]"
                        : (isLightMode ? "cursor-not-allowed border-slate-300 bg-slate-100 text-slate-500" : "cursor-not-allowed border-white/15 bg-white/5 text-slate-400")
                    }`}
                  >
                    <PhoneCall className="h-3.5 w-3.5" />
                    {handoffEligible ? (config.leadChatBadgeText || "IACloser en menos de 60s") : "Precalificando..."}
                  </button>
                </div>
              </div>

              <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4 sm:px-7">
                {activeTestimonial ? (
                  <article
                    onMouseMove={handleTestimonialPointerMove}
                    onMouseEnter={handleTestimonialPointerMove}
                    onMouseLeave={handleTestimonialPointerLeave}
                    className={`group relative sticky top-0 z-20 overflow-hidden rounded-2xl border p-2.5 backdrop-blur-xl transition-all duration-500 animate-in fade-in ${
                      isLightMode
                        ? "border-slate-200 bg-white/90 hover:border-sky-300 hover:shadow-[0_22px_80px_-45px_rgba(14,165,233,0.55)]"
                        : "border-white/15 bg-white/[0.035] hover:border-sky-200/60 hover:shadow-[0_22px_80px_-38px_rgba(125,211,252,0.65)]"
                    }`}
                  >
                    <div
                      className={`pointer-events-none absolute inset-0 transition-opacity duration-500 ${testimonialGlow.active ? "opacity-100" : "opacity-0"}`}
                      style={{
                        background: `radial-gradient(280px circle at ${testimonialGlow.x}% ${testimonialGlow.y}%, rgba(255,255,255,0.45) 0%, rgba(125,211,252,0.28) 24%, rgba(196,181,253,0.2) 46%, rgba(45,212,191,0.16) 66%, rgba(2,6,23,0.02) 100%)`,
                      }}
                    />
                    <div
                      className="pointer-events-none absolute -inset-[120%] opacity-0 blur-2xl transition-all duration-700 group-hover:opacity-70 group-hover:translate-x-10"
                      style={{
                        background: "conic-gradient(from 180deg at 50% 50%, rgba(244,114,182,0.3), rgba(59,130,246,0.3), rgba(45,212,191,0.3), rgba(167,139,250,0.3), rgba(244,114,182,0.3))",
                      }}
                    />
                    <div className="relative flex items-center gap-2">
                      <div className={`h-8 w-8 shrink-0 rounded-full text-[11px] font-semibold grid place-items-center ${isLightMode ? "border border-sky-200 bg-sky-100 text-sky-700" : "border border-white/15 bg-sky-900/55 text-sky-100"}`}>
                        {String(activeTestimonial.name || "C")
                          .split(" ")
                          .map((chunk) => chunk[0] || "")
                          .join("")
                          .slice(0, 2)
                          .toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className={`truncate text-[11px] font-medium ${isLightMode ? "text-slate-700" : "text-sky-100"}`}>
                          {activeTestimonial.name || "Cliente"}
                          <span className="ml-2 text-[10px] text-amber-300/90">
                            {"*".repeat(Math.max(1, Math.min(5, Number(activeTestimonial.stars || 5))))}
                          </span>
                        </p>
                        <p className={`truncate text-[11px] ${isLightMode ? "text-slate-500" : "text-slate-200/90"}`}>
                          "{activeTestimonial.text || "Excelente experiencia."}"
                        </p>
                      </div>
                    </div>
                  </article>
                ) : null}

                {messages.map((msg, index) => (
                  <div key={`${msg.role}-${index}`} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[88%] break-words rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed animate-in fade-in slide-in-from-bottom-2 duration-300 ${
                        msg.role === "user"
                          ? "rounded-br-md text-slate-950 shadow-[0_8px_24px_-16px_rgba(15,23,42,0.7)]"
                          : msg.role === "system"
                            ? (isLightMode
                              ? "rounded-xl border border-emerald-300 bg-emerald-100/90 text-emerald-800"
                              : "rounded-xl border border-emerald-400/35 bg-emerald-400/10 text-emerald-100")
                            : (isLightMode
                              ? "rounded-bl-md border border-slate-200 bg-white text-slate-700"
                              : "rounded-bl-md border border-white/10 bg-white/[0.045] text-slate-100 backdrop-blur")
                      }`}
                      style={msg.role === "user" ? { backgroundColor: config.primaryColor || "#00C185" } : {}}
                    >
                      <p>{msg.content}</p>
                      {msg.audioUrl ? (
                        <audio controls src={msg.audioUrl} className="mt-2 h-8 w-full max-w-[240px]" preload="metadata" />
                      ) : null}
                    </div>
                  </div>
                ))}

                {assistantTyping && (
                  <div className="flex justify-start">
                    <div className={`max-w-[88%] rounded-2xl rounded-bl-md border px-3.5 py-2.5 text-sm leading-relaxed ${isLightMode ? "border-slate-200 bg-white text-slate-700" : "border-white/10 bg-white/[0.045] text-slate-100 backdrop-blur"}`}>
                      {assistantDraft}
                      <span className={`ml-0.5 inline-block h-4 w-[1px] animate-pulse align-middle ${isLightMode ? "bg-sky-500" : "bg-cyan-300"}`} aria-hidden="true" />
                    </div>
                  </div>
                )}

                {sending && (
                  <div className="flex justify-start">
                    <div className={`inline-flex items-center gap-2 rounded-2xl rounded-bl-md border px-3 py-2 text-xs ${isLightMode ? "border-slate-200 bg-white text-slate-500" : "border-white/10 bg-white/[0.04] text-slate-300 backdrop-blur"}`}>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Escribiendo...
                    </div>
                  </div>
                )}

                {shouldShowInlineOffer && (
                  <div className="pt-2">
                    <div className="mx-auto w-full max-w-2xl rounded-2xl border border-amber-300/40 bg-slate-950/90 p-4 sm:p-5 animate-in fade-in zoom-in-95 duration-300">
                      <p className="text-[11px] uppercase tracking-[0.25em] text-amber-200">Oferta activa</p>
                      <h3 className="mt-2 text-lg font-semibold sm:text-xl">
                        {config.leadChatOfferTitle || "Bloquea tu llamada de cierre ahora"}
                      </h3>
                      <p className="mt-2 text-sm text-slate-300">
                        {config.leadChatOfferDescription || "Estas en el momento mas caliente. Si aceptas el contacto ahora, IACloser toma tu contexto y prioriza el cierre."}
                      </p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <Button type="button" onClick={openConsentStep}>
                          {config.leadChatCtaLabel || "Activar llamada"}
                        </Button>
                        <Button type="button" variant="outline" onClick={() => setOfferDismissed(true)}>
                          Continuar chat
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {consentVisible && (
                  <div ref={consentPanelRef} className="pt-2">
                    <div className="mx-auto w-full max-w-2xl rounded-2xl border border-slate-700/80 bg-slate-950/90 p-4 sm:p-5 animate-in fade-in zoom-in-95 duration-300">
                      <h3 className="flex items-center gap-2 text-base font-semibold sm:text-lg">
                        <ShieldCheck className="h-4 w-4 text-emerald-400" />
                        Consentimiento expreso
                      </h3>
                      <p className="mt-2 text-xs text-slate-300 sm:text-sm">
                        Ya terminamos la precalificacion. Para activar tu llamada, confirma de forma expresa que SI aceptas el contacto.
                      </p>
                      <form onSubmit={submitHandoff} className="mt-3 space-y-3">
                        <div className="space-y-1.5">
                          <Label htmlFor="lead-name">Nombre</Label>
                          <Input
                            id="lead-name"
                            value={leadName}
                            onChange={(event) => setLeadName(event.target.value)}
                            placeholder="Tu nombre completo"
                            className="border-slate-700 bg-slate-900"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="lead-phone">Telefono</Label>
                          <Input
                            id="lead-phone"
                            value={leadPhone}
                            onChange={(event) => setLeadPhone(sanitizePhone(event.target.value))}
                            inputMode="tel"
                            placeholder="Ej: 14155552671"
                            className="border-slate-700 bg-slate-900"
                          />
                        </div>
                        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-2.5 text-xs text-emerald-100">
                          {config.consentText || "Acepto ser contactado por telefono o mensajes para continuar con mi solicitud."}
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="lead-consent-answer">Escribe SI para autorizar contacto</Label>
                          <Input
                            id="lead-consent-answer"
                            value={leadConsentAnswer}
                            onChange={(event) => setLeadConsentAnswer(event.target.value)}
                            placeholder='Escribe "SI"'
                            className="border-slate-700 bg-slate-900 uppercase"
                            autoComplete="off"
                          />
                          <p className="text-[11px] text-slate-400">
                            Solo te contactaremos para esta solicitud. No compartimos tu informacion con terceros ajenos a este proceso.
                          </p>
                        </div>
                        <Button type="submit" disabled={handoffLoading || !hasExplicitConsentYes(leadConsentAnswer)} className="w-full gap-2">
                          {handoffLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <PhoneCall className="h-4 w-4" />}
                          Enviar a IACloser
                        </Button>
                      </form>
                      {(chatError || handoffMessage) && (
                        <p className={`mt-3 text-xs ${chatError ? "text-rose-300" : "text-emerald-300"}`}>
                          {chatError || handoffMessage}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className={`space-y-3 border-t px-4 py-4 sm:px-6 ${isLightMode ? "border-slate-200" : "border-white/10"}`}>
                {teaserVisible && !!activeTeaser ? (
                  <button
                    type="button"
                    onClick={() => void handleSend(activeTeaser)}
                    className={`w-full rounded-xl border px-3 py-2 text-left text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 animate-in fade-in slide-in-from-bottom-2 duration-300 ${
                      isLightMode
                        ? "border-sky-200 bg-sky-100/70 text-sky-800 hover:bg-sky-100 focus-visible:ring-sky-400"
                        : "border-cyan-400/35 bg-cyan-400/10 text-cyan-100 hover:bg-cyan-400/15 focus-visible:ring-cyan-300"
                    }`}
                  >
                    {activeTeaser}
                  </button>
                ) : null}

                {quickReplies.length > 0 && messages.length < 7 && (
                  <div className="flex flex-wrap gap-2">
                    {quickReplies.map((item, idx) => (
                      <button
                        key={`${item}-${idx}`}
                        type="button"
                        onClick={() => void handleSend(item)}
                        className={`rounded-full border px-3 py-1.5 text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 ${
                          isLightMode
                            ? "border-slate-300 bg-white text-slate-700 hover:border-sky-300 hover:text-sky-700 focus-visible:ring-sky-400"
                            : "border-slate-700 bg-slate-900 text-slate-200 hover:border-cyan-400/60 hover:text-cyan-200 focus-visible:ring-cyan-300"
                        }`}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                )}

                {!consentVisible && (chatError || handoffMessage) && (
                  <p className={`text-xs ${chatError ? "text-rose-300" : "text-emerald-300"}`}>
                    {chatError || handoffMessage}
                  </p>
                )}

                <form
                  onSubmit={(event) => {
                    event.preventDefault();
                    void handleSend();
                  }}
                  className="flex gap-2"
                >
                  <div className="relative">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setEmojiPickerOpen((prev) => !prev)}
                      className={`h-10 w-10 p-0 ${isLightMode ? "border-slate-300 bg-white text-slate-700 hover:bg-slate-100" : "border-white/20 bg-white/[0.04] text-slate-200 hover:bg-white/[0.08]"}`}
                      aria-label="Abrir selector de emojis"
                    >
                      <Smile className="h-4 w-4" />
                    </Button>
                    {emojiPickerOpen ? (
                      <div className={`absolute bottom-12 left-0 z-30 w-56 rounded-xl border p-2 shadow-2xl ${isLightMode ? "border-slate-200 bg-white" : "border-white/15 bg-[#0a1627]/95 backdrop-blur"}`}>
                        <div className="grid grid-cols-6 gap-1">
                          {QUICK_EMOJIS.map((emoji) => (
                            <button
                              key={emoji}
                              type="button"
                              onClick={() => appendEmojiToInput(emoji)}
                              className={`rounded-md p-1.5 text-base transition-colors ${isLightMode ? "hover:bg-slate-100" : "hover:bg-white/10"}`}
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={toggleSpeechInput}
                    className={`h-10 w-10 p-0 ${isLightMode ? "border-slate-300 bg-white text-slate-700 hover:bg-slate-100" : "border-white/20 bg-white/[0.04] text-slate-200 hover:bg-white/[0.08]"}`}
                    aria-label={speechListening ? "Detener grabacion de voz" : "Grabar voz"}
                  >
                    {speechListening ? <MicOff className="h-4 w-4 text-rose-400" /> : <Mic className="h-4 w-4" />}
                  </Button>
                  <Input
                    ref={inputRef}
                    value={input}
                    onChange={(event) => setInput(event.target.value)}
                    placeholder={config.chatPlaceholder || "Escribe tu mensaje..."}
                    className={`border text-sm focus-visible:ring-2 ${
                      isLightMode
                        ? "border-slate-300 bg-white text-slate-900 focus-visible:ring-sky-400/70"
                        : "border-white/20 bg-white/[0.04] text-slate-100 backdrop-blur focus-visible:ring-cyan-300/70"
                    }`}
                    disabled={sending || assistantTyping}
                  />
                  <Button type="submit" disabled={sending || assistantTyping || !input.trim()} className="shrink-0 rounded-xl">
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
                {speechListening ? (
                  <p className={`text-[11px] ${isLightMode ? "text-rose-600" : "text-rose-300"}`}>
                    🎙️ Escuchando... habla ahora y te convertimos el audio en texto.
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        </section>
      </div>

      {!!socialProofToast && (
        <div className="pointer-events-none fixed bottom-5 right-4 z-40 max-w-xs animate-in slide-in-from-bottom-4 fade-in">
          <div className={`rounded-xl border px-3 py-2 text-xs shadow-xl backdrop-blur ${
            isLightMode
              ? "border-sky-200 bg-white/95 text-sky-700"
              : "border-cyan-400/30 bg-slate-950/95 text-cyan-100"
          }`}>
            <p className={`font-semibold ${isLightMode ? "text-sky-700" : "text-cyan-200"}`}>✨ Actividad en vivo</p>
            <p className="mt-1 line-clamp-2">{socialProofToast}</p>
          </div>
        </div>
      )}

      {showExitIntent && (
        <div className={`fixed inset-0 z-50 flex items-center justify-center px-4 ${isLightMode ? "bg-slate-900/35" : "bg-slate-950/70"}`}>
          <div className={`w-full max-w-md rounded-2xl border p-5 shadow-2xl animate-in zoom-in-95 fade-in duration-300 ${isLightMode ? "border-sky-200 bg-white" : "border-cyan-300/35 bg-slate-950"}`}>
            <button
              type="button"
              onClick={() => setShowExitIntent(false)}
              className={`ml-auto grid h-8 w-8 place-items-center rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 ${
                isLightMode
                  ? "border-slate-300 bg-white text-slate-500 hover:text-slate-800"
                  : "border-slate-700 bg-slate-900 text-slate-300 hover:text-slate-100"
              }`}
              aria-label="Cerrar pop de salida"
            >
              <X className="h-4 w-4" />
            </button>
            <p className={`text-[11px] uppercase tracking-[0.25em] ${isLightMode ? "text-sky-600" : "text-cyan-200"}`}>Intencion de salida detectada</p>
            <h3 className={`mt-2 text-xl font-semibold ${isLightMode ? "text-slate-800" : "text-slate-100"}`}>{config.exitIntentTitle || "Espera"}</h3>
            <p className={`mt-2 text-sm ${isLightMode ? "text-slate-600" : "text-slate-300"}`}>
              {config.exitIntentDescription || "Antes de salir, mira como este Lead Chat acelera el cierre."}
            </p>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <Button
                type="button"
                onClick={() => {
                  setShowExitIntent(false);
                  inputRef.current?.focus();
                }}
              >
                {config.exitIntentCta || "Volver al chat"}
              </Button>
              <Button type="button" variant="outline" onClick={() => setShowExitIntent(false)}>
                Continuar navegando
              </Button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

