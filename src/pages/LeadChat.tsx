import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { CheckCircle2, Loader2, PhoneCall, Send, ShieldCheck, Sparkles } from "lucide-react";
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
  testimonials?: Testimonial[];
  consentText?: string;
  consentTextVersion?: string;
  iacloserRedirectUrl?: string;
  leadChatHeadline?: string;
  leadChatSubheadline?: string;
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
  const [conversationSignal, setConversationSignal] = useState("");
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const proofScrollRef = useRef<HTMLDivElement | null>(null);
  const consentPanelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const loadConfig = async () => {
      setLoadingConfig(true);
      try {
        const response = await fetch(`/api/widget-config/${encodeURIComponent(identity)}`, { cache: "no-store" });
        const payload = await response.json();
        if (!response.ok || !payload?.config) {
          throw new Error(payload?.error || "No se pudo cargar la configuracion");
        }

        const cfg = payload.config as PublicWidgetConfig;
        setConfig(cfg);
        setMessages([
          {
            role: "assistant",
            content: cfg.welcomeMessage || "Hola. Soy tu asistente virtual, te ayudo a encontrar la mejor opcion para ti.",
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
  }, [messages, sending, consentVisible]);

  const quickReplies = useMemo(
    () => (Array.isArray(config?.quickReplies) ? config?.quickReplies.filter(Boolean).slice(0, 6) : []),
    [config?.quickReplies],
  );

  const testimonials = useMemo(
    () => (Array.isArray(config?.testimonials) ? config.testimonials.slice(0, 8) : []),
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

  const proofFeed = useMemo(
    () => (testimonials.length > 1 ? [...testimonials, ...testimonials] : testimonials),
    [testimonials],
  );

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
    const interval = setInterval(() => {
      index = (index + 1) % source.length;
      setSocialProofToast(source[index] || "");
    }, 8000);
    return () => clearInterval(interval);
  }, [config?.leadChatLiveToasts, testimonials]);

  useEffect(() => {
    const container = proofScrollRef.current;
    if (!container || proofFeed.length < 2) return;

    const intervalId = window.setInterval(() => {
      const card = container.querySelector("[data-proof-card]") as HTMLElement | null;
      const step = (card?.offsetHeight || 96) + 8;
      const maxScroll = container.scrollHeight - container.clientHeight;
      if (maxScroll <= 0) return;
      const nearEnd = container.scrollTop >= maxScroll - 10;

      container.scrollTo({
        top: nearEnd ? 0 : container.scrollTop + step,
        behavior: "smooth",
      });
    }, 3200);

    return () => window.clearInterval(intervalId);
  }, [proofFeed.length]);

  useEffect(() => {
    const lastUserMessage = [...messages].reverse().find((msg) => msg.role === "user")?.content?.toLowerCase() || "";
    if (!lastUserMessage) return;

    let signal = "";
    if (/precio|costo|cuanto|presupuesto/.test(lastUserMessage)) {
      signal = "Senal de compra: el lead esta evaluando precio y presupuesto.";
    } else if (/hoy|ahora|urgente|rapido|pronto/.test(lastUserMessage)) {
      signal = "Senal de urgencia detectada: es buen momento para activar cierre.";
    } else if (/servicio|producto|tratamiento|plan/.test(lastUserMessage)) {
      signal = "Interes claro en la oferta: conviene guiar hacia consentimiento.";
    } else if (userMessageCount >= 2) {
      signal = "Conversacion activa: el lead sigue comprometido en el flujo.";
    }

    if (!signal) return;
    setConversationSignal(signal);
    const timer = window.setTimeout(() => setConversationSignal(""), 5200);
    return () => window.clearTimeout(timer);
  }, [messages, userMessageCount]);

  const conversionStep = useMemo(() => {
    if (handoffMessage) return 4;
    if (consentVisible) return 3;
    if (messages.filter((msg) => msg.role === "user").length >= 2) return 2;
    return 1;
  }, [consentVisible, handoffMessage, messages]);

  const conversionSteps = ["Conversacion", "Calificacion", "Consentimiento", "Llamada"];

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
    setConsentVisible(true);
    window.setTimeout(() => {
      consentPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 150);
  };

  const handleSend = async (overrideText?: string) => {
    if (!config?.widgetId || sending) return;
    const text = (overrideText ?? input).trim();
    if (!text) return;

    setChatError("");
    setHandoffMessage("");

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

      setMessages((prev) => [...prev, { role: "assistant", content: cleanResponse }]);

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

      <div className="relative mx-auto grid min-h-screen max-w-[1600px] grid-cols-1 gap-4 px-3 py-3 lg:grid-cols-[250px_minmax(0,1fr)_320px] lg:px-5 lg:py-5">
        <aside className="order-2 min-w-0 space-y-4 lg:order-1">
          <div className="rounded-2xl border border-slate-800/90 bg-slate-950/70 p-4 backdrop-blur">
            <p className="text-xs text-slate-300">Embudo en tiempo real</p>
            <p className="mt-1 text-2xl font-semibold">{conversionStep}/4</p>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-800">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${(conversionStep / 4) * 100}%`,
                  backgroundColor: config.primaryColor || "#00C185",
                }}
              />
            </div>
            <div className="mt-3 grid gap-2">
              {conversionSteps.map((step, idx) => {
                const active = conversionStep >= idx + 1;
                return (
                  <div
                    key={step}
                    className={`rounded-lg border px-2 py-1 text-[11px] ${
                      active
                        ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-200"
                        : "border-slate-700 bg-slate-900 text-slate-400"
                    }`}
                  >
                    {step}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800/90 bg-slate-950/70 p-4 backdrop-blur">
            <h2 className="flex items-center gap-2 text-sm font-semibold">
              <Sparkles className="h-4 w-4 text-cyan-300" />
              Actividad dinamica
            </h2>
            <p className="mt-2 rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-3 py-2 text-xs text-cyan-100">
              {socialProofToast || "Mostrando pruebas sociales y actividad en vivo."}
            </p>
            {conversationSignal ? (
              <p className="mt-2 rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-3 py-2 text-xs text-emerald-100">
                {conversationSignal}
              </p>
            ) : null}
          </div>
        </aside>

        <section className="order-1 min-w-0 lg:order-2">
          <div className="flex min-h-[calc(100vh-1.5rem)] flex-col rounded-3xl bg-gradient-to-b from-cyan-400/30 via-slate-800/60 to-slate-900/80 p-[1px] shadow-[0_16px_60px_-24px_rgba(34,211,238,0.35)]">
            <div className="flex h-full min-h-0 flex-col rounded-3xl border border-slate-800/80 bg-[#071423]/95">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 px-4 py-4 sm:px-6">
                <div className="min-w-0">
                  <p className="text-[10px] uppercase tracking-[0.25em] text-cyan-200/80">Lead Chat publico</p>
                  <h1 className="text-lg font-semibold leading-tight sm:text-2xl">
                    {config.businessName || "Asistente comercial"}
                  </h1>
                  <p className="mt-1 text-xs text-slate-300 sm:text-sm">
                    {config.leadChatHeadline || "Conversa, califica y activa tu llamada de cierre."}
                  </p>
                  <p className="mt-1 text-[11px] text-slate-400 sm:text-xs">
                    {config.leadChatSubheadline || "Esta pagina esta enfocada en precalificar al lead y activar cierre rapido con IACloser."}
                  </p>
                </div>
                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1.5 text-xs text-emerald-200">
                  <PhoneCall className="h-3.5 w-3.5" />
                  IACloser en menos de 60s
                </div>
              </div>

              <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4 sm:px-6">
                {messages.map((msg, index) => (
                  <div key={`${msg.role}-${index}`} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[88%] break-words rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
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
                    <div className="mx-auto w-full max-w-2xl rounded-2xl border border-amber-300/40 bg-slate-950/90 p-4 sm:p-5">
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
              </div>

              <div className="space-y-3 border-t border-slate-800 px-4 py-4 sm:px-6">
                {quickReplies.length > 0 && messages.length < 6 && (
                  <div className="flex flex-wrap gap-2">
                    {quickReplies.map((item, idx) => (
                      <button
                        key={`${item}-${idx}`}
                        type="button"
                        onClick={() => handleSend(item)}
                        className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-200 transition-colors hover:border-cyan-400/60 hover:text-cyan-200"
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                )}
                <form
                  onSubmit={(event) => {
                    event.preventDefault();
                    void handleSend();
                  }}
                  className="flex gap-2"
                >
                  <Input
                    value={input}
                    onChange={(event) => setInput(event.target.value)}
                    placeholder={config.chatPlaceholder || "Escribe tu mensaje..."}
                    className="border-slate-700 bg-slate-900 text-slate-100"
                    disabled={sending}
                  />
                  <Button type="submit" disabled={sending || !input.trim()} className="shrink-0">
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </section>

        <aside className="order-3 min-w-0 space-y-4 lg:overflow-y-auto lg:pr-1">
          <div className="rounded-2xl border border-slate-800/90 bg-slate-950/70 p-4 backdrop-blur">
            <h2 className="text-sm font-semibold">Por que convierte mejor</h2>
            <ul className="mt-3 space-y-2 text-xs text-slate-300">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
                Chat centrado en toda la pantalla para reducir distracciones.
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
                Prueba social dinamica en laterales para reforzar confianza.
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
                Handoff inmediato a IACloser solo con consentimiento expreso.
              </li>
            </ul>
            <Button type="button" onClick={openConsentStep} className="mt-4 w-full">
              {config.leadChatCtaLabel || "Quiero acelerar mi llamada"}
            </Button>
          </div>

          <div ref={consentPanelRef} className="rounded-2xl border border-slate-800/90 bg-slate-950/70 p-4 backdrop-blur">
            <h2 className="flex items-center gap-2 text-sm font-semibold">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              Consentimiento expreso
            </h2>
            <p className="mt-2 text-xs text-slate-300">
              Antes de enviar tu informacion, debes aceptar explicitamente el contacto para cumplimiento legal.
            </p>

            {!consentVisible ? (
              <p className="mt-3 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-400">
                El formulario aparece cuando el chat detecta intencion de compra.
              </p>
            ) : (
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
                <Button type="submit" disabled={handoffLoading} className="w-full gap-2 animate-pulse">
                  {handoffLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <PhoneCall className="h-4 w-4" />}
                  Enviar a IACloser
                </Button>
              </form>
            )}

            {(chatError || handoffMessage) && (
              <p className={`mt-3 text-xs ${chatError ? "text-rose-300" : "text-emerald-300"}`}>
                {chatError || handoffMessage}
              </p>
            )}
          </div>

          <div className="rounded-2xl border border-slate-800/90 bg-slate-950/70 p-4 backdrop-blur">
            <h2 className="flex items-center gap-2 text-sm font-semibold">
              <Sparkles className="h-4 w-4 text-amber-300" />
              Testimonios en movimiento
            </h2>
            {testimonials.length === 0 ? (
              <p className="mt-2 text-xs text-slate-400">Agrega testimonios desde el dashboard para reforzar esta seccion.</p>
            ) : (
              <div
                ref={proofScrollRef}
                className="mt-3 max-h-[280px] space-y-2 overflow-y-auto pr-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
              >
                {proofFeed.map((item, idx) => {
                  const duplicate = testimonials.length > 1 && idx >= testimonials.length;
                  return (
                    <article
                      key={`${item.name || "testimonial"}-${idx}`}
                      data-proof-card="true"
                      aria-hidden={duplicate}
                      className="rounded-xl border border-slate-700 bg-slate-900/80 p-3 transition-transform duration-300 hover:-translate-y-0.5 hover:border-cyan-400/40"
                    >
                      <p className="text-xs text-slate-100">{item.text || "Excelente experiencia."}</p>
                      <p className="mt-2 text-[11px] text-slate-400">{item.name || "Cliente"}</p>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </aside>
      </div>

      {!!socialProofToast && (
        <div className="pointer-events-none fixed bottom-5 right-4 z-40 hidden max-w-xs animate-in slide-in-from-bottom-4 fade-in md:block">
          <div className="rounded-xl border border-cyan-400/30 bg-slate-950/95 px-3 py-2 text-xs text-cyan-100 shadow-xl">
            <p className="font-semibold text-cyan-200">Actividad en vivo</p>
            <p className="mt-1 line-clamp-2">{socialProofToast}</p>
          </div>
        </div>
      )}
    </main>
  );
}

