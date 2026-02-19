import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { Bot, CheckCircle2, Clock3, Loader2, PhoneCall, Send, ShieldCheck, Sparkles } from "lucide-react";
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
  const [salesPopupOpen, setSalesPopupOpen] = useState(false);
  const [socialProofToast, setSocialProofToast] = useState("");
  const scrollRef = useRef<HTMLDivElement | null>(null);

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

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!consentVisible && !handoffMessage) {
        setSalesPopupOpen(true);
      }
    }, 9000);
    return () => clearTimeout(timer);
  }, [consentVisible, handoffMessage]);

  const quickReplies = useMemo(
    () => (Array.isArray(config?.quickReplies) ? config?.quickReplies.filter(Boolean).slice(0, 6) : []),
    [config?.quickReplies],
  );

  const testimonials = useMemo(
    () => (Array.isArray(config?.testimonials) ? config.testimonials.slice(0, 4) : []),
    [config?.testimonials],
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

      <div className="relative mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-8">
        <header className="mb-6 grid gap-4 rounded-3xl border border-slate-800/90 bg-slate-950/70 p-5 backdrop-blur md:grid-cols-[minmax(0,1fr)_280px] md:p-7">
          <div className="space-y-3">
            <p className="text-[10px] uppercase tracking-[0.35em] text-cyan-200/80">Lead Chat Experience</p>
            <h1 className="text-2xl leading-tight font-semibold md:text-4xl md:leading-tight">
              {config.businessName || "Asistente comercial"} en modo
              <span className="text-cyan-300"> conversion total</span>
            </h1>
            <p className="max-w-2xl text-sm text-slate-300 md:text-base">
              {config.leadChatHeadline || "Conversa, califica y activa tu llamada de cierre."}
            </p>
            <p className="max-w-2xl text-xs text-slate-400 md:text-sm">
              {config.leadChatSubheadline || "Esta pagina esta diseñada para precalificar mejor, generar confianza y activar el cierre automatizado sin depender de una web externa."}
            </p>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1.5 text-xs text-emerald-200">
              <PhoneCall className="h-3.5 w-3.5" />
              IACloser llama en menos de 60 segundos despues del consentimiento
            </div>
          </div>

          <div className="rounded-2xl border border-slate-700/80 bg-slate-900/80 p-4">
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
        </header>

        <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="rounded-3xl bg-gradient-to-b from-cyan-400/30 via-slate-800/60 to-slate-900/80 p-[1px] shadow-[0_16px_60px_-24px_rgba(34,211,238,0.35)]">
            <div className="h-full rounded-3xl border border-slate-800/80 bg-[#071423]/95">
              <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
                <div className="flex items-center gap-3">
                  <div
                    className="grid h-9 w-9 place-items-center rounded-full"
                    style={{ backgroundColor: `${config.primaryColor || "#00C185"}26` }}
                  >
                    <Bot className="h-4 w-4" style={{ color: config.primaryColor || "#00C185" }} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Asistente de preventa</p>
                    <p className="text-[11px] text-slate-400">Califica y transfiere contexto a IACloser</p>
                  </div>
                </div>
                <span className="rounded-full border border-slate-700 px-2 py-1 text-[10px] text-slate-300">Chat en vivo</span>
              </div>

              <div ref={scrollRef} className="h-[56vh] min-h-[360px] space-y-3 overflow-y-auto px-4 py-4">
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
              </div>

              <div className="space-y-3 border-t border-slate-800 px-4 py-4">
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

          <aside className="space-y-4">
            <div className="rounded-2xl border border-slate-800/90 bg-slate-950/70 p-4 backdrop-blur">
              <h2 className="text-sm font-semibold">Por que convierte mejor</h2>
              <ul className="mt-3 space-y-2 text-xs text-slate-300">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
                  Pantalla completa: mas atencion y menos distracciones.
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
                  Flujo guiado para calificar, capturar datos y activar consentimiento.
                </li>
                <li className="flex items-start gap-2">
                  <Clock3 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-300" />
                  Handoff instantaneo para llamada outbound.
                </li>
              </ul>
              <Button
                type="button"
                onClick={() => {
                  setConsentVisible(true);
                  setSalesPopupOpen(false);
                }}
                className="mt-4 w-full animate-pulse"
              >
                {config.leadChatCtaLabel || "Quiero acelerar mi llamada"}
              </Button>
            </div>

            <div className="rounded-2xl border border-slate-800/90 bg-slate-950/70 p-4 backdrop-blur">
              <h2 className="flex items-center gap-2 text-sm font-semibold">
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                Consentimiento expreso
              </h2>
              <p className="mt-2 text-xs text-slate-300">
                Antes de enviar tu informacion, debes aceptar explicitamente el contacto para cumplimiento legal.
              </p>

              {!consentVisible ? (
                <p className="mt-3 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-400">
                  El formulario se habilita cuando el bot detecta intencion de compra.
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
                Prueba social
              </h2>
              {testimonials.length === 0 ? (
                <p className="mt-2 text-xs text-slate-400">Agrega testimonios desde el dashboard para reforzar esta seccion.</p>
              ) : (
                <div className="mt-3 space-y-2">
                  {testimonials.map((item, idx) => (
                    <article key={`${item.name || "testimonial"}-${idx}`} className="rounded-xl border border-slate-700 bg-slate-900/80 p-3 transition-transform duration-300 hover:-translate-y-0.5 hover:border-cyan-400/40">
                      <p className="line-clamp-3 text-xs text-slate-100">{item.text || "Excelente experiencia."}</p>
                      <p className="mt-2 text-[11px] text-slate-400">{item.name || "Cliente"}</p>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </aside>
        </section>
      </div>

      {!!socialProofToast && (
        <div className="fixed bottom-5 left-4 z-40 max-w-xs animate-in slide-in-from-bottom-4 fade-in md:left-6">
          <div className="rounded-xl border border-cyan-400/30 bg-slate-950/95 px-3 py-2 text-xs text-cyan-100 shadow-xl">
            <p className="font-semibold text-cyan-200">Actividad en vivo</p>
            <p className="mt-1 line-clamp-2">{socialProofToast}</p>
          </div>
        </div>
      )}

      {salesPopupOpen && !consentVisible && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/70 px-4">
          <div className="w-full max-w-md rounded-2xl border border-amber-300/40 bg-slate-950 p-5 shadow-2xl animate-in zoom-in-95 fade-in">
            <p className="text-[11px] uppercase tracking-[0.25em] text-amber-200">Oferta activa</p>
            <h3 className="mt-2 text-xl font-semibold">{config.leadChatOfferTitle || "Bloquea tu llamada de cierre ahora"}</h3>
            <p className="mt-2 text-sm text-slate-300">
              {config.leadChatOfferDescription || "Estas en el momento mas caliente. Si aceptas el contacto ahora, IACloser toma tu contexto y prioriza el cierre."}
            </p>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <Button
                type="button"
                onClick={() => {
                  setSalesPopupOpen(false);
                  setConsentVisible(true);
                }}
              >
                {config.leadChatCtaLabel || "Activar llamada"}
              </Button>
              <Button type="button" variant="outline" onClick={() => setSalesPopupOpen(false)}>
                Continuar chat
              </Button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

