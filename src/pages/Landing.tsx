import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Button } from "@/components/ui/button";
import { SalesWidget } from "@/components/SalesWidget";
import { SocialProofToast } from "@/components/SocialProofToast";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  ArrowRight,
  Bot,
  CheckCircle2,
  Menu,
  MessageCircle,
  Mic,
  Moon,
  Play,
  Send,
  ShieldCheck,
  Smile,
  Sparkles,
  Star,
  Sun,
  X as CloseIcon,
} from "lucide-react";

type LandingTestimonial = {
  quote: string;
  name: string;
  role: string;
  result: string;
  avatar: string;
};

export default function Landing() {
  const { i18n } = useTranslation();
  const isEn = String(i18n.language || "").toLowerCase().startsWith("en");
  const [landingTheme, setLandingTheme] = useState<"light" | "dark">("light");
  const isLandingDark = landingTheme === "dark";
  const pageBaseBg = isLandingDark ? "#020817" : "#f7f9fc";

  useEffect(() => {
    const prefersLight = window.matchMedia("(prefers-color-scheme: light)").matches;
    setLandingTheme(prefersLight ? "light" : "dark");
  }, []);

  const copy = {
    heroBadge: isEn ? "Lead qualification widget for real estate" : "Widget de precalificacion para inmobiliarias",
    heroTitle: isEn
      ? "Pre-qualify leads and send only serious buyers to WhatsApp"
      : "Precalifica leads y envia solo compradores serios a WhatsApp",
    heroSubtitle: isEn
      ? "Lead Widget asks, filters by zone, budget and timeline, and sends your team only high-intent conversations with key data."
      : "Lead Widget pregunta, filtra por zona, presupuesto y plazo, y pasa a tu equipo solo conversaciones de alta intencion con datos clave.",
    ctaPrimary: isEn ? "Start free" : "Empezar gratis",
    ctaSecondary: isEn ? "See widget demo" : "Ver demo del widget",
    modesTitle: isEn ? "One product, two deployment modes" : "Un producto, dos modos de uso",
    capabilitiesTitle: isEn ? "What helps your team close better" : "Lo que ayuda a tu equipo a cerrar mejor",
    useCasesTitle: isEn ? "Built for real estate teams" : "Pensado para equipos inmobiliarios",
    testimonialsTitle: isEn ? "Results from active clients" : "Resultados de clientes activos",
    pricingTitle: isEn ? "One plan focused on qualified leads" : "Un plan enfocado en leads calificados",
    finalTitle: isEn
      ? "Stop losing time with low-intent conversations"
      : "Deja de perder tiempo en conversaciones sin intencion real",
    finalSubtitle: isEn
      ? "Pre-qualify in chat, route only qualified leads to WhatsApp, and keep your pipeline ordered with CRM follow-up."
      : "Precalifica en chat, deriva solo leads calificados a WhatsApp y ordena tu seguimiento con CRM.",
    navLogin: isEn ? "Login" : "Iniciar sesion",
    navRegister: isEn ? "Create account" : "Crear cuenta",
    navTry: isEn ? "Try demo" : "Probar demo",
    navTheme: isLandingDark ? (isEn ? "Light mode" : "Modo claro") : (isEn ? "Dark mode" : "Modo oscuro"),
    footerRights: isEn
      ? "2026 Lead Widget. All rights reserved."
      : "2026 Lead Widget. Todos los derechos reservados.",
    exitTitle: isEn ? "Before you leave" : "Antes de salir",
    exitSubtitle: isEn
      ? "Run the full flow and compare lead quality against your current process."
      : "Prueba el flujo completo y compara la calidad de leads frente a tu proceso actual.",
    exitCta: isEn ? "Open demo now" : "Abrir demo ahora",
    exitDismiss: isEn ? "Keep browsing" : "Seguir navegando",
  };

  const capabilities = isEn
    ? [
        {
          title: "Pre-qualification before handoff",
          body: "Ask one focused question per turn and filter by property type, zone, budget and move-in timeline.",
        },
        {
          title: "Property catalog with media",
          body: "Show property images and short videos directly in chat to speed up decision-making.",
        },
        {
          title: "Automatic WhatsApp handoff",
          body: "When the lead qualifies, the chat shows a short countdown and opens WhatsApp with preloaded details.",
        },
        {
          title: "CRM follow-up ready",
          body: "Qualified conversations go into your operation with cleaner context for pipeline, tasks and next actions.",
        },
      ]
    : [
        {
          title: "Precalificacion antes del handoff",
          body: "Hace una pregunta puntual por turno y filtra por tipo de inmueble, zona, presupuesto y plazo de mudanza.",
        },
        {
          title: "Catalogo de propiedades con multimedia",
          body: "Muestra fotos y videos cortos de propiedades dentro del chat para acelerar decision.",
        },
        {
          title: "Handoff automatico a WhatsApp",
          body: "Cuando el lead califica, el chat muestra cuenta regresiva y abre WhatsApp con datos precargados.",
        },
        {
          title: "Seguimiento con CRM",
          body: "Las conversaciones calificadas llegan con mejor contexto para pipeline, tareas y siguientes pasos.",
        },
      ];

  const useCases = isEn
    ? [
        "Real estate brokers with paid traffic",
        "Agencies selling projects in multiple districts",
        "Teams that need to filter by real budget",
        "Businesses that need qualification before WhatsApp",
        "Sales teams that need CRM follow-up discipline",
        "Operations without website using public Lead Chat",
      ]
    : [
        "Brokers inmobiliarios con trafico pago",
        "Agencias que venden proyectos en varios distritos",
        "Equipos que necesitan filtrar por presupuesto real",
        "Negocios que requieren precalificacion antes de WhatsApp",
        "Equipos comerciales que necesitan disciplina de seguimiento CRM",
        "Operaciones sin web usando Lead Chat publico",
      ];

  const conversionBullets = isEn
    ? ["No setup fees", "Only qualified leads go to WhatsApp", "Launch in under 5 minutes"]
    : ["Sin costo de setup", "Solo leads calificados pasan a WhatsApp", "Activa en menos de 5 minutos"];

  const testimonials = useMemo<LandingTestimonial[]>(
    () =>
      isEn
        ? [
            {
              quote:
                "Lead quality improved in week one. We now spend time only on prospects with real purchase intent.",
              name: "Daniela Rojas",
              role: "Commercial Director",
              result: "2.4x qualified leads",
              avatar: "https://i.pravatar.cc/160?img=48",
            },
            {
              quote:
                "Public Lead Chat gave us a high-conversion channel while our website was still under construction.",
              name: "Carlos Mena",
              role: "Founder",
              result: "+39% useful leads",
              avatar: "https://i.pravatar.cc/160?img=14",
            },
            {
              quote:
                "The WhatsApp handoff with preloaded context helped our team respond faster and with better close rate.",
              name: "Valeria Torres",
              role: "Operations Lead",
              result: "-34% wasted follow-up time",
              avatar: "https://i.pravatar.cc/160?img=23",
            },
          ]
        : [
            {
              quote:
                "La calidad de lead subio desde la primera semana. Ahora solo atendemos prospectos con intencion real de compra.",
              name: "Daniela Rojas",
              role: "Directora Comercial",
              result: "2.4x leads calificados",
              avatar: "https://i.pravatar.cc/160?img=48",
            },
            {
              quote:
                "Lead Chat publico nos dio conversion real mientras nuestra web aun estaba en desarrollo.",
              name: "Carlos Mena",
              role: "Founder",
              result: "+39% leads utiles",
              avatar: "https://i.pravatar.cc/160?img=14",
            },
            {
              quote:
                "El handoff a WhatsApp con datos precargados mejoro el tiempo de respuesta y el porcentaje de cierre.",
              name: "Valeria Torres",
              role: "Lider de Operaciones",
              result: "-34% tiempo improductivo",
              avatar: "https://i.pravatar.cc/160?img=23",
            },
          ],
    [isEn],
  );

  const loopedTestimonials = useMemo(
    () => (testimonials.length > 1 ? [...testimonials, ...testimonials] : testimonials),
    [testimonials],
  );

  const [showExitPopup, setShowExitPopup] = useState(false);
  const [hasShownExit, setHasShownExit] = useState(false);
  const testimonialsRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const desktopPointer = window.matchMedia("(min-width: 1024px) and (pointer:fine)").matches;
    if (!desktopPointer) return;

    const onExit = (event: MouseEvent) => {
      const isExit = event.clientY <= 6 || (event.relatedTarget === null && event.clientY < 10);
      if (isExit && !hasShownExit) {
        setShowExitPopup(true);
        setHasShownExit(true);
      }
    };

    document.addEventListener("mouseout", onExit);
    document.addEventListener("mouseleave", onExit);
    return () => {
      document.removeEventListener("mouseout", onExit);
      document.removeEventListener("mouseleave", onExit);
    };
  }, [hasShownExit]);

  useEffect(() => {
    const container = testimonialsRef.current;
    if (!container || testimonials.length < 2) return;

    let raf = 0;
    let prev = 0;
    const speed = 20;
    const loopPoint = container.scrollWidth / 2;

    const tick = (ts: number) => {
      if (!prev) prev = ts;
      const delta = (ts - prev) / 1000;
      prev = ts;

      if (!container.matches(":hover") && !document.hidden) {
        container.scrollLeft += speed * delta;
        if (container.scrollLeft >= loopPoint) container.scrollLeft -= loopPoint;
      }
      raf = window.requestAnimationFrame(tick);
    };

    raf = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(raf);
  }, [testimonials.length, loopedTestimonials.length]);

  const openDemoWidget = () => {
    window.dispatchEvent(new Event("open-lead-widget"));
  };

  const scrollTestimonials = (direction: "prev" | "next") => {
    const container = testimonialsRef.current;
    if (!container) return;
    const card = container.querySelector("[data-testimonial-card]") as HTMLElement | null;
    const step = (card?.offsetWidth || 320) + 16;
    const loopPoint = container.scrollWidth / 2;

    if (direction === "prev") {
      if (container.scrollLeft <= step) {
        container.scrollTo({ left: Math.max(loopPoint - step, 0), behavior: "smooth" });
        return;
      }
      container.scrollBy({ left: -step, behavior: "smooth" });
      return;
    }

    if (container.scrollLeft + step >= loopPoint) {
      container.scrollTo({ left: 0, behavior: "smooth" });
      return;
    }
    container.scrollBy({ left: step, behavior: "smooth" });
  };

  return (
    <main className={`min-h-screen overflow-x-hidden selection:bg-cyan-200/70 ${isLandingDark ? "bg-[#020817] text-slate-100" : "bg-[#f7f9fc] text-slate-900"}`}>
      <style>{`
        @keyframes floatSoft {
          0% { transform: translate3d(0,0,0); }
          50% { transform: translate3d(0,-12px,0); }
          100% { transform: translate3d(0,0,0); }
        }
        @keyframes igBorderShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes igShineSweep {
          0% { transform: translateX(-140%) skewX(-20deg); opacity: 0; }
          20% { opacity: 0.36; }
          60% { opacity: 0.12; }
          100% { transform: translateX(240%) skewX(-20deg); opacity: 0; }
        }
        .ig-testimonial-card {
          position: relative;
          overflow: hidden;
          border: 1px solid transparent;
          background-image:
            ${isLandingDark
              ? "linear-gradient(rgba(15,23,42,0.94), rgba(15,23,42,0.9))"
              : "linear-gradient(rgba(255,255,255,0.96), rgba(255,255,255,0.92))"},
            ${isLandingDark
              ? "linear-gradient(120deg, rgba(14,165,233,0.55), rgba(52,211,153,0.35), rgba(99,102,241,0.42), rgba(14,165,233,0.5))"
              : "linear-gradient(115deg, #f58529, #dd2a7b, #8134af, #515bd4, #feda77, #f58529)"};
          background-origin: border-box;
          background-clip: padding-box, border-box;
          background-size: 100% 100%, 220% 220%;
          animation: igBorderShift 10s linear infinite;
        }
        .ig-testimonial-card::after {
          content: "";
          position: absolute;
          inset: 0;
          left: -120%;
          width: 42%;
          pointer-events: none;
          background: linear-gradient(110deg, transparent, rgba(255,255,255,0.22), transparent);
          animation: igShineSweep 6s ease-in-out infinite;
        }
      `}</style>

      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className={`absolute -left-28 top-24 h-[380px] w-[380px] rounded-full blur-3xl ${isLandingDark ? "bg-cyan-500/20" : "bg-cyan-300/30"}`} style={{ animation: "floatSoft 9s ease-in-out infinite" }} />
        <div className={`absolute right-[-120px] top-[-100px] h-[420px] w-[420px] rounded-full blur-3xl ${isLandingDark ? "bg-indigo-500/15" : "bg-indigo-300/25"}`} style={{ animation: "floatSoft 11s ease-in-out infinite" }} />
      </div>

      <SocialProofToast />

      <nav className={`fixed inset-x-0 top-0 z-50 border-b backdrop-blur-xl ${isLandingDark ? "border-slate-800/70 bg-slate-950/80" : "border-slate-200/70 bg-white/80"}`}>
        <div className="mx-auto flex h-16 w-full max-w-[1160px] items-center justify-between px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-500 text-white shadow-md">
              <MessageCircle className="h-5 w-5" />
            </span>
            <span className="text-sm font-semibold tracking-tight sm:text-base">Lead Widget</span>
          </Link>

          <div className="hidden items-center gap-3 md:flex">
            <button
              type="button"
              onClick={() => setLandingTheme((prev) => (prev === "dark" ? "light" : "dark"))}
              className={`inline-flex h-10 items-center gap-2 rounded-full border px-4 text-xs font-semibold uppercase tracking-[0.1em] transition ${isLandingDark ? "border-slate-700 bg-slate-900 text-slate-100 hover:bg-slate-800" : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100"}`}
              aria-label={copy.navTheme}
            >
              {isLandingDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              <span>{copy.navTheme}</span>
            </button>
            <LanguageSwitcher />
            <Link to="/partners" className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${isLandingDark ? "text-slate-300 hover:bg-slate-800 hover:text-slate-100" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"}`}>Partners</Link>
            <Link to="/login" className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${isLandingDark ? "text-slate-300 hover:bg-slate-800 hover:text-slate-100" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"}`}>{copy.navLogin}</Link>
            <Link to="/register"><Button className="h-10 rounded-full px-5 font-semibold text-white">{copy.navRegister}</Button></Link>
          </div>

          <div className="flex items-center gap-2 md:hidden">
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => setLandingTheme((prev) => (prev === "dark" ? "light" : "dark"))}
              className={`rounded-full ${isLandingDark ? "border-slate-700 bg-slate-900 text-slate-100 hover:bg-slate-800" : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100"}`}
              aria-label={copy.navTheme}
            >
              {isLandingDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <LanguageSwitcher />
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full"><Menu className="h-5 w-5" /></Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px]">
                <div className="mt-10 grid gap-3">
                  <Link to="/partners"><Button variant="outline" className="w-full justify-start">Partners</Button></Link>
                  <Link to="/login"><Button variant="outline" className="w-full justify-start">{copy.navLogin}</Button></Link>
                  <Link to="/register"><Button className="w-full justify-start">{copy.navRegister}</Button></Link>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </nav>

      <section className="relative z-10 px-4 pb-18 pt-28 sm:px-6 lg:pt-32">
        <div className="mx-auto grid w-full max-w-[1160px] gap-10 lg:grid-cols-[1.04fr_0.96fr] lg:items-center">
          <div className="space-y-6">
            <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] ${isLandingDark ? "border-cyan-400/40 bg-cyan-400/10 text-cyan-100" : "border-cyan-200 bg-cyan-50 text-cyan-700"}`}><Sparkles className="h-3.5 w-3.5" />{copy.heroBadge}</span>
            <h1 className={`text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl ${isLandingDark ? "text-slate-100" : "text-slate-950"}`}>{copy.heroTitle}</h1>
            <p className={`max-w-2xl text-base leading-relaxed sm:text-lg ${isLandingDark ? "text-slate-300" : "text-slate-600"}`}>{copy.heroSubtitle}</p>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link to="/register"><Button size="xl" className="w-full rounded-full px-8 text-white sm:w-auto">{copy.ctaPrimary}</Button></Link>
              <Button size="xl" variant="outline" className={`w-full rounded-full px-8 sm:w-auto ${isLandingDark ? "border-slate-700 text-slate-100 hover:bg-slate-800" : "border-slate-300 text-slate-800 hover:bg-slate-100"}`} onClick={openDemoWidget}>
                <Play className="mr-2 h-4 w-4" />{copy.ctaSecondary}
              </Button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {conversionBullets.map((item) => (
                <span key={item} className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-[11px] font-semibold ${isLandingDark ? "border-slate-700 bg-slate-900 text-slate-200" : "border-slate-200 bg-white text-slate-600"}`}>
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                  {item}
                </span>
              ))}
            </div>

            <div className="grid gap-3 pt-2 sm:grid-cols-3">
              <div className={`rounded-2xl border p-4 ${isLandingDark ? "border-slate-800 bg-slate-900/80" : "border-slate-200/80 bg-white/70"}`}><p className="text-xl font-semibold">&lt; 5 min</p><p className={`mt-1 text-xs uppercase tracking-[0.12em] ${isLandingDark ? "text-slate-400" : "text-slate-500"}`}>Go live</p></div>
              <div className={`rounded-2xl border p-4 ${isLandingDark ? "border-slate-800 bg-slate-900/80" : "border-slate-200/80 bg-white/70"}`}><p className="text-xl font-semibold">+37%</p><p className={`mt-1 text-xs uppercase tracking-[0.12em] ${isLandingDark ? "text-slate-400" : "text-slate-500"}`}>{isEn ? "More qualified leads" : "Mas leads calificados"}</p></div>
              <div className={`rounded-2xl border p-4 ${isLandingDark ? "border-slate-800 bg-slate-900/80" : "border-slate-200/80 bg-white/70"}`}><p className="text-xl font-semibold">&lt; 2 min</p><p className={`mt-1 text-xs uppercase tracking-[0.12em] ${isLandingDark ? "text-slate-400" : "text-slate-500"}`}>WhatsApp handoff</p></div>
            </div>
          </div>

          <div className="relative">
            <div className={`pointer-events-none absolute inset-0 rounded-[34px] bg-gradient-to-br blur-2xl ${isLandingDark ? "from-cyan-500/20 via-indigo-500/15 to-emerald-500/20" : "from-cyan-300/30 via-indigo-300/20 to-emerald-300/25"}`} />
            <div className={`relative rounded-[32px] border p-3 shadow-[0_35px_90px_-45px_rgba(14,116,144,0.45)] backdrop-blur-xl ${isLandingDark ? "border-slate-700/80 bg-slate-900/70" : "border-white/70 bg-white/80"}`}>
              <div className={`overflow-hidden rounded-[26px] border text-slate-100 ${isLandingDark ? "border-slate-700 bg-[#061326]" : "border-slate-200/70 bg-[#061326]"}`}>
                <div className="flex items-center justify-between bg-gradient-to-r from-emerald-600 to-emerald-500 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="grid h-8 w-8 place-items-center rounded-full bg-white/20"><Bot className="h-4 w-4" /></span>
                    <div><p className="text-sm font-semibold leading-none">Inmobiliaria Demo</p><p className="mt-1 text-[10px] uppercase tracking-[0.18em] text-emerald-50/90">instant replies</p></div>
                  </div>
                </div>

                <div className="mx-3 mt-3 rounded-xl border border-cyan-300/30 bg-slate-950/80 px-3 py-2 text-xs">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan-200">Testimonios</p>
                  <p className="mt-1 truncate">"Nos mostro propiedades y filtro compradores reales"</p>
                  <p className="mt-1 text-[11px] text-slate-300">Andrea Ruiz - *****</p>
                </div>

                <div className="space-y-3 px-3 pb-3 pt-3">
                  <div className="max-w-[86%] rounded-2xl rounded-bl-md border border-white/10 bg-white/[0.05] px-3 py-2 text-sm">Hola. Te ayudo a encontrar propiedad y, si calificas, te paso por WhatsApp con un asesor.</div>
                  <div className="flex flex-nowrap gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    {[(isEn ? "How it works?" : "Como funciona?"), (isEn ? "Show properties" : "Ver propiedades"), (isEn ? "See pricing" : "Ver precios")].map((item) => (
                      <span key={item} className="shrink-0 rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-xs text-slate-200">{item}</span>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex h-11 min-w-0 flex-1 items-center gap-2 rounded-[14px] border border-cyan-500/35 bg-[#0a1627]/92 px-2.5">
                      <span className="grid h-7 w-7 place-items-center rounded-full border border-white/20 bg-white/5 text-slate-300"><Smile className="h-3.5 w-3.5" /></span>
                      <span className="grid h-7 w-7 place-items-center rounded-full border border-white/20 bg-white/5 text-slate-300"><Mic className="h-3.5 w-3.5" /></span>
                      <span className="text-sm text-slate-400">Type your message...</span>
                    </div>
                    <button type="button" className="grid h-11 w-11 place-items-center rounded-[14px] text-white" style={{ background: "linear-gradient(140deg,#00C185 0%,#00a36d 100%)", boxShadow: "0 8px 16px rgba(0,193,133,0.2)" }}>
                      <Send className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-10 px-4 py-16 sm:px-6 lg:py-20">
        <div className="mx-auto w-full max-w-[1160px]">
          <div className="mb-10 text-center"><h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">{copy.testimonialsTitle}</h2></div>
          <div className="relative">
            <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-8 bg-gradient-to-r to-transparent" style={{ backgroundImage: `linear-gradient(to right, ${pageBaseBg}, transparent)` }} />
            <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-8 bg-gradient-to-l to-transparent" style={{ backgroundImage: `linear-gradient(to left, ${pageBaseBg}, transparent)` }} />
            <div ref={testimonialsRef} className="flex gap-4 overflow-x-auto pb-2 px-1 scroll-smooth [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              {loopedTestimonials.map((item, idx) => {
                const duplicate = loopedTestimonials.length > testimonials.length && idx >= testimonials.length;
                const initials = item.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
                return (
                  <article key={`${item.name}-${idx}`} data-testimonial-card aria-hidden={duplicate} className={`ig-testimonial-card min-w-[86%] snap-start rounded-3xl p-6 sm:min-w-[68%] lg:min-w-[40%] xl:min-w-[31%] ${isLandingDark ? "shadow-xl shadow-cyan-950/30" : "shadow-xl shadow-slate-200/50"}`}>
                    <div className="mb-5 flex items-start justify-between gap-3"><div className="flex items-center gap-1 text-amber-500">{[...Array(5)].map((_, i) => <Star key={`${item.name}-${i}`} className="h-4 w-4 fill-current" />)}</div><span className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${isLandingDark ? "border-cyan-400/40 bg-cyan-500/15 text-cyan-100" : "border-cyan-300/60 bg-cyan-50 text-cyan-700"}`}>{item.result}</span></div>
                    <p className={`min-h-[98px] text-sm leading-relaxed ${isLandingDark ? "text-slate-200" : "text-slate-700"}`}>"{item.quote}"</p>
                    <div className="mt-5 flex items-center gap-3"><div className={`relative h-12 w-12 overflow-hidden rounded-full border ${isLandingDark ? "border-cyan-400/40 bg-slate-800" : "border-cyan-300/60 bg-slate-100"}`}><span className={`absolute inset-0 grid place-items-center text-xs font-bold ${isLandingDark ? "text-cyan-200" : "text-cyan-700"}`}>{initials}</span><img src={item.avatar} alt={item.name} loading="lazy" className="relative z-10 h-full w-full object-cover" onError={(e) => { e.currentTarget.style.display = "none"; }} /></div><div className="min-w-0"><p className="truncate text-sm font-semibold">{item.name}</p><p className={`truncate text-xs ${isLandingDark ? "text-slate-400" : "text-slate-500"}`}>{item.role}</p></div></div>
                  </article>
                );
              })}
            </div>
            <div className="mt-6 flex justify-center gap-3">
              <Button type="button" variant="outline" size="icon" onClick={() => scrollTestimonials("prev")} className="rounded-full border-slate-300 bg-white" aria-label="Previous testimonial"><ArrowRight className="h-4 w-4 rotate-180" /></Button>
              <Button type="button" variant="outline" size="icon" onClick={() => scrollTestimonials("next")} className="rounded-full border-slate-300 bg-white" aria-label="Next testimonial"><ArrowRight className="h-4 w-4" /></Button>
            </div>
          </div>
        </div>
      </section>

      <section className={`relative z-10 border-y px-4 py-16 backdrop-blur sm:px-6 lg:py-20 ${isLandingDark ? "border-slate-800/70 bg-slate-900/60" : "border-slate-200/70 bg-white/70"}`}>
        <div className="mx-auto w-full max-w-[1160px]">
          <div className="mb-10 text-center"><h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">{copy.modesTitle}</h2></div>
          <div className="grid gap-4 lg:grid-cols-2">
            <article className={`rounded-3xl border p-6 ${isLandingDark ? "border-slate-800 bg-slate-900/70" : "border-slate-200/80 bg-white/85"}`}>
              <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] ${isLandingDark ? "bg-emerald-400/15 text-emerald-200" : "bg-emerald-50 text-emerald-700"}`}>Widget embebido</span>
              <h3 className="mt-4 text-2xl font-semibold">{isEn ? "Embedded widget" : "Widget embebido"}</h3>
              <p className={`mt-3 text-sm leading-relaxed ${isLandingDark ? "text-slate-300" : "text-slate-600"}`}>{isEn ? "Install the script on your website and qualify leads in real time before your team gets involved." : "Instala el script en tu web y precalifica leads en tiempo real antes de que entre tu equipo."}</p>
            </article>
            <article className={`rounded-3xl border p-6 ${isLandingDark ? "border-slate-800 bg-slate-900/70" : "border-slate-200/80 bg-white/85"}`}>
              <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] ${isLandingDark ? "bg-cyan-400/15 text-cyan-200" : "bg-cyan-50 text-cyan-700"}`}>Lead Chat publico</span>
              <h3 className="mt-4 text-2xl font-semibold">{isEn ? "Public Lead Chat" : "Lead Chat publico"}</h3>
              <p className={`mt-3 text-sm leading-relaxed ${isLandingDark ? "text-slate-300" : "text-slate-600"}`}>{isEn ? "Share one URL, qualify leads even without website, and send only serious prospects to WhatsApp." : "Comparte una URL, precalifica leads incluso sin web y envia solo prospectos serios a WhatsApp."}</p>
            </article>
          </div>
        </div>
      </section>

      <section className="relative z-10 px-4 py-16 sm:px-6 lg:py-20">
        <div className="mx-auto w-full max-w-[1160px]">
          <div className="mb-10 text-center"><h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">{copy.capabilitiesTitle}</h2></div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {capabilities.map((item) => (
              <article key={item.title} className={`rounded-2xl border p-5 ${isLandingDark ? "border-slate-800 bg-slate-900/70" : "border-slate-200/80 bg-white/90"}`}>
                <h3 className="text-lg font-semibold">{item.title}</h3>
                <p className={`mt-2 text-sm leading-relaxed ${isLandingDark ? "text-slate-300" : "text-slate-600"}`}>{item.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className={`relative z-10 border-y px-4 py-16 sm:px-6 lg:py-20 ${isLandingDark ? "border-slate-800/70 bg-gradient-to-b from-slate-950 to-slate-900/80" : "border-slate-200/70 bg-gradient-to-b from-white to-slate-50"}`}>
        <div className="mx-auto w-full max-w-[1160px]">
          <div className="mb-10 text-center"><h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">{copy.useCasesTitle}</h2></div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{useCases.map((item) => <article key={item} className={`rounded-2xl border p-5 ${isLandingDark ? "border-slate-800 bg-slate-900/70" : "border-slate-200 bg-white/90"}`}><p className="font-semibold">{item}</p></article>)}</div>
        </div>
      </section>

      <section className="relative z-10 px-4 py-16 sm:px-6 lg:py-20">
        <div className={`mx-auto max-w-[820px] rounded-[30px] border p-8 text-center shadow-[0_34px_80px_-50px_rgba(2,132,199,0.45)] ${isLandingDark ? "border-slate-700 bg-slate-900/85" : "border-slate-200/90 bg-white/92"}`}>
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">{copy.pricingTitle}</h2>
          <div className="mt-7">
            <span className="text-4xl font-semibold tracking-tight sm:text-5xl">
              {isEn ? "From S/ 150 per month" : "Desde 150 soles al mes"}
            </span>
          </div>
          <p className={`mt-2 text-sm font-medium ${isLandingDark ? "text-cyan-200" : "text-cyan-700"}`}>
            {isEn ? "One-time setup: S/ 200" : "Implementacion unica: S/ 200"}
          </p>
          <div className="mx-auto mt-7 grid max-w-xl gap-3 text-left">
            {[
              isEn ? "Embedded widget + Public Lead Chat" : "Widget embebido + Lead Chat publico",
              isEn ? "Property catalog with images and videos in chat" : "Catalogo de propiedades con imagenes y videos en chat",
              isEn ? "Live activity + social proof strip in flow" : "Actividad en vivo + prueba social dentro del flujo",
              isEn ? "Pre-qualification + automatic WhatsApp handoff" : "Precalificacion + redireccion automatica a WhatsApp",
              isEn ? "CRM pipeline, tasks and follow-up context" : "Pipeline CRM, tareas y contexto para seguimiento",
            ].map((item) => <p key={item} className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm ${isLandingDark ? "border-slate-700 bg-slate-800/80 text-slate-200" : "border-slate-200 bg-slate-50/80 text-slate-700"}`}><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" /><span>{item}</span></p>)}
          </div>
          <Link to="/register" className="mt-8 inline-block"><Button size="xl" className="rounded-full px-9 text-white">{copy.navRegister}</Button></Link>
        </div>
      </section>

      <section className="relative z-10 px-4 pb-20 sm:px-6 lg:pb-24">
        <div className="mx-auto max-w-[980px] rounded-[34px] border border-slate-200/80 bg-gradient-to-br from-slate-900 via-slate-900 to-cyan-900 px-8 py-14 text-center text-white shadow-[0_40px_110px_-55px_rgba(15,23,42,0.75)] sm:px-12">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-5xl">{copy.finalTitle}</h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-slate-300 sm:text-base">{copy.finalSubtitle}</p>
          <p className="mx-auto mt-2 max-w-2xl text-sm font-medium text-cyan-200">
            {isEn ? "Current offer: from S/ 150 per month." : "Oferta actual: desde 150 soles al mes."}
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link to="/register"><Button size="xl" className="rounded-full px-8 text-white">{copy.navRegister}</Button></Link>
            <Button size="xl" variant="outline" className="rounded-full border-white/30 bg-white/10 px-8 text-white hover:bg-white/15" onClick={openDemoWidget}>{copy.navTry}</Button>
          </div>
        </div>
      </section>

      <footer className={`relative z-10 border-t px-4 py-12 backdrop-blur sm:px-6 ${isLandingDark ? "border-slate-800/80 bg-slate-950/85" : "border-slate-200/80 bg-white/80"}`}>
        <div className="mx-auto flex w-full max-w-[1160px] flex-col items-center justify-between gap-4 text-center sm:flex-row sm:text-left">
          <div><p className="text-sm font-semibold">Lead Widget</p><p className={`text-sm ${isLandingDark ? "text-slate-400" : "text-slate-600"}`}>{isEn ? "Pre-qualification system for real leads and fast WhatsApp handoff." : "Sistema de precalificacion para leads reales y handoff rapido a WhatsApp."}</p></div>
          <div className={`flex gap-4 text-sm ${isLandingDark ? "text-slate-400" : "text-slate-600"}`}><Link to="/legal/privacy" className={isLandingDark ? "hover:text-slate-100" : "hover:text-slate-900"}>Privacy</Link><Link to="/legal/terms" className={isLandingDark ? "hover:text-slate-100" : "hover:text-slate-900"}>Terms</Link><Link to="/legal/claims" className={isLandingDark ? "hover:text-slate-100" : "hover:text-slate-900"}>Claims</Link></div>
        </div>
        <div className={`mx-auto mt-6 w-full max-w-[1160px] border-t pt-5 text-xs ${isLandingDark ? "border-slate-800 text-slate-500" : "border-slate-200 text-slate-500"}`}>{copy.footerRights}</div>
      </footer>

      <SalesWidget />

      {showExitPopup ? (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-[30px] border border-slate-200 bg-white p-6 shadow-2xl sm:p-8">
            <button type="button" onClick={() => setShowExitPopup(false)} className="ml-auto grid h-8 w-8 place-items-center rounded-full border border-slate-300 text-slate-500 transition hover:text-slate-900" aria-label="Close"><CloseIcon className="h-4 w-4" /></button>
            <div className="mt-2 text-center">
              <span className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-cyan-100 text-cyan-700"><ShieldCheck className="h-7 w-7" /></span>
              <h3 className="text-3xl font-semibold tracking-tight text-slate-900">{copy.exitTitle}</h3>
              <p className="mx-auto mt-3 max-w-md text-slate-600">{copy.exitSubtitle}</p>
              <div className="mt-6 grid gap-2 sm:grid-cols-2">
                <Button type="button" onClick={() => { setShowExitPopup(false); openDemoWidget(); }}>{copy.exitCta}</Button>
                <Button type="button" variant="outline" onClick={() => setShowExitPopup(false)}>{copy.exitDismiss}</Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
