import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { Loader2, PhoneCall, Send, ShieldCheck, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ChatMessage = {
  role: "user" | "assistant" | "system";
  content: string;
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

function sanitizePhone(value: string) {
  return value.replace(/\D/g, "").slice(0, 15);
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
  const fullMatch = responseText.match(/\[\s*ICLOSER_READY\s*:\s*([\s\S]*?)\]/i);
  const bareMatch = responseText.match(/\[\s*ICLOSER_READY\s*\]/i);

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
  const [leadConsent, setLeadConsent] = useState(false);
  const [collectedInfoSeed, setCollectedInfoSeed] = useState("");
  const [handoffMessage, setHandoffMessage] = useState("");
  const [offerDismissed, setOfferDismissed] = useState(false);
  const [socialProofToast, setSocialProofToast] = useState("");
  const [activeTestimonialIndex, setActiveTestimonialIndex] = useState(0);
  const [activeTeaser, setActiveTeaser] = useState("");
  const [teaserVisible, setTeaserVisible] = useState(false);
  const [showExitIntent, setShowExitIntent] = useState(false);
  const [exitIntentShown, setExitIntentShown] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const consentPanelRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const appendAssistantWithTypewriter = (text: string) =>
    new Promise<void>((resolve) => {
      const cleanText = text.trim();
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
          iacloserRedirectUrl: String(raw.iacloserRedirectUrl || raw.icloser_redirect_url || ""),
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
            content: normalized.welcomeMessage || "Hola. Soy tu asistente virtual, te ayudo a encontrar la mejor opcion para ti.",
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
    () => !consentVisible && !handoffMessage && !offerDismissed && userMessageCount >= 2,
    [consentVisible, handoffMessage, offerDismissed, userMessageCount],
  );

  const activeTestimonial = useMemo(() => {
    if (testimonials.length === 0) return null;
    return testimonials[activeTestimonialIndex % testimonials.length];
  }, [activeTestimonialIndex, testimonials]);

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

  const openConsentStep = () => {
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
        setConsentVisible(true);
      }
    } catch (error: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Tuvimos un problema de conexion. Puedes intentarlo nuevamente.",
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
    if (!leadConsent) {
      setChatError("Debes aceptar el consentimiento para continuar.");
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

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#04111d] text-slate-100">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-cyan-400/20 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-emerald-400/10 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-[1650px] px-2 pb-16 pt-2 sm:px-3 sm:pb-16 sm:pt-3 lg:px-5 lg:pb-20 lg:pt-5">
        <section className="min-w-0">
          <div className="flex h-[calc(100dvh-5.5rem)] min-h-[560px] flex-col rounded-[28px] bg-gradient-to-b from-cyan-400/25 via-slate-800/60 to-slate-900/85 p-[1px] shadow-[0_20px_80px_-35px_rgba(34,211,238,0.5)] sm:h-[calc(100dvh-6rem)] lg:h-[calc(100dvh-7rem)]">
            <div className="flex h-full min-h-0 flex-col rounded-[27px] border border-slate-800/80 bg-[#071423]/95">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 px-4 py-4 sm:px-6">
                <div className="min-w-0">
                  <p className="text-[10px] uppercase tracking-[0.25em] text-cyan-200/80">
                    {config.leadChatEyebrow || "Lead Chat publico"}
                  </p>
                  <h1 className="text-xl font-semibold leading-tight sm:text-4xl">{config.businessName || "Asistente comercial"}</h1>
                  <p className="mt-1 text-sm text-slate-200 sm:text-base">
                    {config.leadChatHeadline || "Conversa, califica y activa tu llamada de cierre."}
                  </p>
                  <p className="mt-1 text-xs text-slate-400 sm:text-sm">
                    {config.leadChatSubheadline || "Esta pagina esta enfocada en precalificar al lead y activar cierre rapido con IACloser."}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={openConsentStep}
                  className="inline-flex items-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1.5 text-xs text-emerald-200 transition-colors hover:bg-emerald-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
                >
                  <PhoneCall className="h-3.5 w-3.5" />
                  {config.leadChatBadgeText || "IACloser en menos de 60s"}
                </button>
              </div>

              <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4 sm:px-6">
                {activeTestimonial ? (
                  <article className="sticky top-0 z-20 rounded-2xl border border-cyan-400/30 bg-slate-950/85 p-2.5 backdrop-blur animate-in fade-in duration-300">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 shrink-0 rounded-full bg-cyan-900/60 text-[11px] font-semibold text-cyan-100 grid place-items-center">
                        {String(activeTestimonial.name || "C")
                          .split(" ")
                          .map((chunk) => chunk[0] || "")
                          .join("")
                          .slice(0, 2)
                          .toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-[11px] font-medium text-cyan-100">
                          {activeTestimonial.name || "Cliente"}
                          <span className="ml-2 text-[10px] text-amber-300">
                            {"*".repeat(Math.max(1, Math.min(5, Number(activeTestimonial.stars || 5))))}
                          </span>
                        </p>
                        <p className="truncate text-[11px] text-slate-300">"{activeTestimonial.text || "Excelente experiencia."}"</p>
                      </div>
                    </div>
                  </article>
                ) : null}

                {messages.map((msg, index) => (
                  <div key={`${msg.role}-${index}`} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[88%] break-words rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed animate-in fade-in slide-in-from-bottom-2 duration-300 ${
                        msg.role === "user"
                          ? "rounded-br-md text-slate-950 shadow-sm"
                          : msg.role === "system"
                            ? "rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
                            : "rounded-bl-md border border-slate-700 bg-slate-800/90 text-slate-100"
                      }`}
                      style={msg.role === "user" ? { backgroundColor: config.primaryColor || "#00C185" } : {}}
                    >
                      {msg.content}
                    </div>
                  </div>
                ))}

                {assistantTyping && (
                  <div className="flex justify-start">
                    <div className="max-w-[88%] rounded-2xl rounded-bl-md border border-slate-700 bg-slate-800/90 px-3.5 py-2.5 text-sm leading-relaxed text-slate-100">
                      {assistantDraft}
                      <span className="ml-0.5 inline-block h-4 w-[1px] animate-pulse bg-cyan-300 align-middle" aria-hidden="true" />
                    </div>
                  </div>
                )}

                {sending && (
                  <div className="flex justify-start">
                    <div className="inline-flex items-center gap-2 rounded-2xl rounded-bl-md border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-slate-300">
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
                        Antes de enviar tu informacion, debes aceptar explicitamente el contacto para cumplimiento legal.
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
                        <label className="flex items-start gap-2 text-xs text-slate-300">
                          <input
                            type="checkbox"
                            checked={leadConsent}
                            onChange={(event) => setLeadConsent(event.target.checked)}
                            className="mt-0.5 h-4 w-4 rounded border-slate-600 bg-slate-900"
                          />
                          <span>{config.consentText || "Acepto ser contactado por telefono o mensajes para continuar con mi solicitud."}</span>
                        </label>
                        <Button type="submit" disabled={handoffLoading} className="w-full gap-2">
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

              <div className="space-y-3 border-t border-slate-800 px-4 py-4 sm:px-6">
                {teaserVisible && !!activeTeaser ? (
                  <button
                    type="button"
                    onClick={() => void handleSend(activeTeaser)}
                    className="w-full rounded-xl border border-cyan-400/35 bg-cyan-400/10 px-3 py-2 text-left text-xs text-cyan-100 transition-colors hover:bg-cyan-400/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 animate-in fade-in slide-in-from-bottom-2 duration-300"
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
                        className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-200 transition-colors hover:border-cyan-400/60 hover:text-cyan-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
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
                  <Input
                    ref={inputRef}
                    value={input}
                    onChange={(event) => setInput(event.target.value)}
                    placeholder={config.chatPlaceholder || "Escribe tu mensaje..."}
                    className="border-slate-700 bg-slate-900 text-slate-100 focus-visible:ring-2 focus-visible:ring-cyan-300/70"
                    disabled={sending || assistantTyping}
                  />
                  <Button type="submit" disabled={sending || assistantTyping || !input.trim()} className="shrink-0">
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </section>
      </div>

      {!!socialProofToast && (
        <div className="pointer-events-none fixed bottom-5 right-4 z-40 max-w-xs animate-in slide-in-from-bottom-4 fade-in">
          <div className="rounded-xl border border-cyan-400/30 bg-slate-950/95 px-3 py-2 text-xs text-cyan-100 shadow-xl">
            <p className="font-semibold text-cyan-200">Actividad en vivo</p>
            <p className="mt-1 line-clamp-2">{socialProofToast}</p>
          </div>
        </div>
      )}

      {showExitIntent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4">
          <div className="w-full max-w-md rounded-2xl border border-cyan-300/35 bg-slate-950 p-5 shadow-2xl animate-in zoom-in-95 fade-in duration-300">
            <button
              type="button"
              onClick={() => setShowExitIntent(false)}
              className="ml-auto grid h-8 w-8 place-items-center rounded-full border border-slate-700 bg-slate-900 text-slate-300 transition-colors hover:text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
              aria-label="Cerrar pop de salida"
            >
              <X className="h-4 w-4" />
            </button>
            <p className="text-[11px] uppercase tracking-[0.25em] text-cyan-200">Intencion de salida detectada</p>
            <h3 className="mt-2 text-xl font-semibold">{config.exitIntentTitle || "Espera"}</h3>
            <p className="mt-2 text-sm text-slate-300">
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

