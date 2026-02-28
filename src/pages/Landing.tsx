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
  Moon,
  Play,
  ShieldCheck,
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

type DemoStep = {
  id: string;
  title: string;
  chatLine: string;
  panelLine: string;
  outcome: string;
};

type DemoModule = {
  id: "crm_whatsapp" | "leads_widget" | "lead_chat";
  label: string;
  title: string;
  subtitle: string;
  purpose: string;
  idealFor: string;
  result: string;
  chatTitle: string;
  panelTitle: string;
  steps: DemoStep[];
};

type DemoInsight = {
  kpis: Array<{
    label: string;
    before: string;
    after: string;
  }>;
  onboarding: string[];
  compliance: string;
  roi: string;
  pipelineStages: string[];
  pipelineGoal: string;
};

type DemoRoiInput = {
  leads: number;
  closeRate: number;
  lift: number;
  ticket: number;
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
    heroBadge: isEn ? "WhatsWidget CRM for sales teams" : "WhatsWidget CRM para equipos comerciales",
    heroTitle: isEn
      ? "Operate sales inside WhatsApp with WhatsWidget, without complex systems"
      : "Opera tus ventas en WhatsApp con WhatsWidget, sin sistemas complejos",
    heroSubtitle: isEn
      ? "Real Kanban, custom stages, notes by contact, reminders with local notifications, quick replies, and compliant campaigns to opted-in leads. Choose General or Real Estate workflow."
      : "Kanban real, etapas personalizadas, notas por contacto, recordatorios con notificaciones locales, respuestas rapidas y campanas a leads opted_in con cumplimiento. Elige flujo General o Inmobiliaria.",
    ctaPrimary: isEn ? "Activate now" : "Activar ahora",
    ctaSecondary: isEn ? "Activate via WhatsApp" : "Activar por WhatsApp",
    modesTitle: isEn ? "WhatsWidget in three usage modes" : "WhatsWidget en tres modos de uso",
    capabilitiesTitle: isEn ? "New WhatsWidget functions that impact revenue" : "Nuevas funciones de WhatsWidget que impactan ventas",
    useCasesTitle: isEn ? "Teams getting the most value with WhatsWidget" : "Equipos que mas valor obtienen con WhatsWidget",
    testimonialsTitle: isEn ? "Results from active clients" : "Resultados de clientes activos",
    pricingTitle: isEn ? "Choose your plan" : "Elige tu plan",
    finalTitle: isEn
      ? "Stop losing leads between chats and follow-up"
      : "Deja de perder leads entre chat y seguimiento",
    finalSubtitle: isEn
      ? "WhatsWidget keeps your operation clean: no auto-send, manual confirmation for compliance, and full CRM traceability per contact."
      : "WhatsWidget mantiene tu operacion ordenada: sin auto-envio, confirmacion manual para cumplimiento y trazabilidad CRM por contacto.",
    navLogin: isEn ? "Login" : "Iniciar sesion",
    navRegister: isEn ? "Activate now" : "Activar ahora",
    navTry: isEn ? "Activate now" : "Activar ahora",
    navTheme: isLandingDark ? (isEn ? "Light mode" : "Modo claro") : (isEn ? "Dark mode" : "Modo oscuro"),
    footerRights: isEn
      ? "2026 WhatsWidget. All rights reserved."
      : "2026 WhatsWidget. Todos los derechos reservados.",
    exitTitle: isEn ? "Before you leave" : "Antes de salir",
    exitSubtitle: isEn
      ? "Run the full flow and compare lead quality against your current process."
      : "Prueba el flujo completo y compara la calidad de leads frente a tu proceso actual.",
    exitCta: isEn ? "Activate now" : "Activar ahora",
    exitDismiss: isEn ? "Keep browsing" : "Seguir navegando",
  };

  const demoModules = useMemo<DemoModule[]>(
    () =>
      isEn
        ? [
            {
              id: "crm_whatsapp",
              label: "CRM WhatsApp",
              title: "CRM WhatsApp simulation",
              subtitle: "Lead arrives in WhatsApp Web and your team runs follow-up inside the CRM panel.",
              purpose: "Turn WhatsApp conversations into an ordered pipeline with tags, stages, and tasks.",
              idealFor: "Teams already receiving many WhatsApp chats and losing control of follow-up.",
              result: "Faster response and fewer lost leads in daily operation.",
              chatTitle: "WhatsApp conversation",
              panelTitle: "CRM panel output",
              steps: [
                {
                  id: "crm-step-1",
                  title: "1. Incoming lead in WhatsApp",
                  chatLine: "Hi, I saw your apartment ad in Surco.",
                  panelLine: "Lead auto-tagged: comprador, surco, urgente",
                  outcome: "The team prioritizes high-intent chats first.",
                },
                {
                  id: "crm-step-2",
                  title: "2. Qualification and pipeline",
                  chatLine: "Budget between S/350k and S/450k. Move in 30 days.",
                  panelLine: "Stage updated to qualified + reminder 24h",
                  outcome: "No lead is lost without next action.",
                },
                {
                  id: "crm-step-3",
                  title: "3. Handoff and close",
                  chatLine: "Perfect, send me options and visit schedule.",
                  panelLine: "Template inserted + follow-up task assigned",
                  outcome: "Advisor replies faster with full context.",
                },
              ],
            },
            {
              id: "leads_widget",
              label: "Leads Widget",
              title: "Leads Widget simulation",
              subtitle: "A visitor interacts with your website widget and only qualified intent reaches your team.",
              purpose: "Pre-qualify website visitors before they reach your sales advisors.",
              idealFor: "Businesses with traffic on their website and paid ads.",
              result: "Less noise in WhatsApp and more qualified opportunities.",
              chatTitle: "Website widget chat",
              panelTitle: "Qualified lead output",
              steps: [
                {
                  id: "widget-step-1",
                  title: "1. Visitor opens widget",
                  chatLine: "Hi, I'm looking for a 3-bedroom apartment in Miraflores.",
                  panelLine: "Lead source captured: widget_embed + campaign UTM",
                  outcome: "You know exactly where each lead comes from.",
                },
                {
                  id: "widget-step-2",
                  title: "2. Auto pre-qualification",
                  chatLine: "My budget is S/480k and I want to move in this quarter.",
                  panelLine: "Qualified score: high intent + complete profile",
                  outcome: "Low-quality chats are filtered before reaching sales.",
                },
                {
                  id: "widget-step-3",
                  title: "3. WhatsApp handoff",
                  chatLine: "Great, connect me with an advisor now.",
                  panelLine: "WhatsApp redirect triggered with preloaded context",
                  outcome: "Advisors answer with context and close faster.",
                },
              ],
            },
            {
              id: "lead_chat",
              label: "Lead Chat",
              title: "Lead Chat simulation",
              subtitle: "You share one public link and collect qualified conversations even without a website.",
              purpose: "Capture and qualify leads from one public chat link.",
              idealFor: "Businesses without website or teams that sell from social media and ads.",
              result: "You launch quickly and collect qualified conversations from day one.",
              chatTitle: "Public Lead Chat flow",
              panelTitle: "Conversation conversion output",
              steps: [
                {
                  id: "chat-step-1",
                  title: "1. Lead opens public link",
                  chatLine: "Hello, I found your ad and want options near San Isidro.",
                  panelLine: "Conversation started via lead_chat link",
                  outcome: "You can capture leads from ads, bios or stories instantly.",
                },
                {
                  id: "chat-step-2",
                  title: "2. Guided qualification",
                  chatLine: "I can invest around S/520k and I'm ready to visit this week.",
                  panelLine: "Intent verified + stage moved to contacted",
                  outcome: "The flow structures qualification without manual scripts.",
                },
                {
                  id: "chat-step-3",
                  title: "3. Action to advisor",
                  chatLine: "Perfect, let's continue on WhatsApp.",
                  panelLine: "Contact created in CRM + follow-up task generated",
                  outcome: "Every qualified conversation lands in your pipeline.",
                },
              ],
            },
          ]
        : [
            {
              id: "crm_whatsapp",
              label: "CRM WhatsApp",
              title: "Demo CRM WhatsApp",
              subtitle: "El lead llega por WhatsApp Web y tu equipo ejecuta seguimiento desde el panel CRM.",
              purpose: "Convertir conversaciones de WhatsApp en pipeline ordenado con etiquetas, etapas y tareas.",
              idealFor: "Equipos que ya reciben muchos chats por WhatsApp y pierden seguimiento.",
              result: "Mas velocidad de respuesta y menos leads perdidos en la operacion diaria.",
              chatTitle: "Conversacion en WhatsApp",
              panelTitle: "Resultado en panel CRM",
              steps: [
                {
                  id: "crm-step-1",
                  title: "1. Llega el lead por WhatsApp",
                  chatLine: "Hola, vi tu anuncio de departamento en Surco.",
                  panelLine: "Lead etiquetado: comprador, surco, urgente",
                  outcome: "El equipo prioriza primero chats con intencion real.",
                },
                {
                  id: "crm-step-2",
                  title: "2. Calificacion y pipeline",
                  chatLine: "Presupuesto entre S/350k y S/450k. Me mudo en 30 dias.",
                  panelLine: "Etapa actualizada a qualified + recordatorio 24h",
                  outcome: "Ningun lead se queda sin siguiente accion.",
                },
                {
                  id: "crm-step-3",
                  title: "3. Handoff y cierre",
                  chatLine: "Perfecto, enviame opciones y agenda de visita.",
                  panelLine: "Plantilla insertada + tarea de seguimiento asignada",
                  outcome: "El asesor responde mas rapido con contexto completo.",
                },
              ],
            },
            {
              id: "leads_widget",
              label: "Leads Widget",
              title: "Demo Leads Widget",
              subtitle: "Un visitante conversa desde tu web y solo la intencion real llega al equipo comercial.",
              purpose: "Precalificar visitantes de tu web antes de que entren al equipo comercial.",
              idealFor: "Negocios con trafico web y anuncios pagados.",
              result: "Menos ruido en WhatsApp y mas oportunidades calificadas.",
              chatTitle: "Chat del widget web",
              panelTitle: "Resultado de lead calificado",
              steps: [
                {
                  id: "widget-step-1",
                  title: "1. Visitante abre widget",
                  chatLine: "Hola, busco un departamento de 3 cuartos en Miraflores.",
                  panelLine: "Origen de lead detectado: widget_embed + UTM campana",
                  outcome: "Sabes exactamente de donde viene cada lead.",
                },
                {
                  id: "widget-step-2",
                  title: "2. Precalificacion automatica",
                  chatLine: "Mi presupuesto es S/480k y quiero mudarme este trimestre.",
                  panelLine: "Score de calificacion: alta intencion + perfil completo",
                  outcome: "Los chats de baja calidad se filtran antes de ventas.",
                },
                {
                  id: "widget-step-3",
                  title: "3. Derivacion a WhatsApp",
                  chatLine: "Perfecto, conectame ahora con un asesor.",
                  panelLine: "Redireccion a WhatsApp ejecutada con contexto precargado",
                  outcome: "El asesor responde con contexto y cierra mas rapido.",
                },
              ],
            },
            {
              id: "lead_chat",
              label: "Lead Chat",
              title: "Demo Lead Chat",
              subtitle: "Compartes un enlace publico y capturas conversaciones calificadas aunque no tengas web.",
              purpose: "Capturar y calificar leads desde un solo enlace de chat publico.",
              idealFor: "Negocios sin web o equipos que venden por redes y anuncios.",
              result: "Empiezas rapido y capturas conversaciones calificadas desde el primer dia.",
              chatTitle: "Flujo Lead Chat publico",
              panelTitle: "Resultado de conversion de conversacion",
              steps: [
                {
                  id: "chat-step-1",
                  title: "1. Lead abre enlace publico",
                  chatLine: "Hola, vengo del anuncio y quiero opciones cerca a San Isidro.",
                  panelLine: "Conversacion iniciada desde enlace lead_chat",
                  outcome: "Capturas leads desde anuncios, bio o historias en minutos.",
                },
                {
                  id: "chat-step-2",
                  title: "2. Calificacion guiada",
                  chatLine: "Puedo invertir S/520k y estoy listo para visitar esta semana.",
                  panelLine: "Intencion validada + etapa movida a contacted",
                  outcome: "El flujo ordena la calificacion sin guiones manuales.",
                },
                {
                  id: "chat-step-3",
                  title: "3. Accion para asesor",
                  chatLine: "Perfecto, seguimos por WhatsApp.",
                  panelLine: "Contacto creado en CRM + tarea de seguimiento generada",
                  outcome: "Toda conversacion calificada entra a tu pipeline.",
                },
              ],
            },
          ],
    [isEn],
  );

  const demoInsights: Record<DemoModule["id"], DemoInsight> = useMemo(
    () =>
      isEn
        ? {
            crm_whatsapp: {
              kpis: [
                { label: "Avg first response", before: "18 min", after: "4 min" },
                { label: "Leads without follow-up", before: "35%", after: "8%" },
                { label: "Pipeline visibility", before: "Low", after: "Full" },
              ],
              onboarding: [
                "Install extension and login in WhatsWidget.",
                "Import CSV or create contacts manually.",
                "Move leads by stage and schedule reminders.",
              ],
              compliance:
                "No auto-send. Every outbound action is manually confirmed and campaigns are sent only to opted-in leads.",
              roi: "If one extra deal closes per month, the CRM plan usually pays itself.",
              pipelineStages: ["New", "Contacted", "Visit", "Offer", "Close"],
              pipelineGoal: "Daily goal: all active leads must have stage + next task.",
            },
            leads_widget: {
              kpis: [
                { label: "Unqualified chat noise", before: "52%", after: "19%" },
                { label: "Lead profile completeness", before: "41%", after: "86%" },
                { label: "Advisor productivity", before: "Base", after: "+32%" },
              ],
              onboarding: [
                "Paste widget script on your website.",
                "Enable quick replies and pre-qualification fields.",
                "Sync qualified leads directly into CRM pipeline.",
              ],
              compliance:
                "The widget captures consent and routes to WhatsApp with manual send confirmation by your team.",
              roi: "Same ad budget, fewer junk chats, more qualified conversations for sales.",
              pipelineStages: ["Visitor", "Qualified", "WhatsApp", "Follow-up", "Closed"],
              pipelineGoal: "Daily goal: prioritize only high-intent handoffs in sales queue.",
            },
            lead_chat: {
              kpis: [
                { label: "Setup time without website", before: "Days", after: "< 10 min" },
                { label: "Recoverable interested leads", before: "Low", after: "+44%" },
                { label: "Team handoff context", before: "Partial", after: "Structured" },
              ],
              onboarding: [
                "Create your public Lead Chat link.",
                "Share it in ads, bio, and social campaigns.",
                "Convert conversations into CRM contacts and tasks.",
              ],
              compliance:
                "Lead Chat keeps a compliant flow: no auto-send and explicit user action before final handoff.",
              roi: "For teams without website, it opens a conversion channel from day one.",
              pipelineStages: ["Open link", "Qualified", "Assigned", "Follow-up", "Won/Lost"],
              pipelineGoal: "Daily goal: every qualified chat must be assigned to an advisor.",
            },
          }
        : {
            crm_whatsapp: {
              kpis: [
                { label: "Primera respuesta promedio", before: "18 min", after: "4 min" },
                { label: "Leads sin seguimiento", before: "35%", after: "8%" },
                { label: "Visibilidad del pipeline", before: "Baja", after: "Total" },
              ],
              onboarding: [
                "Instala la extension e inicia sesion en WhatsWidget.",
                "Importa CSV o crea contactos manualmente.",
                "Mueve leads por etapa y programa recordatorios.",
              ],
              compliance:
                "Sin auto-envio. Cada salida se confirma manualmente y las campanas se envian solo a leads opted_in.",
              roi: "Si cierras una venta extra al mes, el plan CRM normalmente se paga solo.",
              pipelineStages: ["Nuevo", "Contactado", "Visita", "Oferta", "Cierre"],
              pipelineGoal: "Meta diaria: todo lead activo debe tener etapa + siguiente tarea.",
            },
            leads_widget: {
              kpis: [
                { label: "Ruido de chats no calificados", before: "52%", after: "19%" },
                { label: "Perfil completo del lead", before: "41%", after: "86%" },
                { label: "Productividad del asesor", before: "Base", after: "+32%" },
              ],
              onboarding: [
                "Pega el script del widget en tu web.",
                "Activa respuestas rapidas y campos de precalificacion.",
                "Sincroniza leads calificados directo al pipeline CRM.",
              ],
              compliance:
                "El widget captura consentimiento y deriva a WhatsApp con confirmacion manual de envio por tu equipo.",
              roi: "Con el mismo presupuesto en ads, filtras ruido y elevas conversaciones realmente vendibles.",
              pipelineStages: ["Visitante", "Calificado", "WhatsApp", "Seguimiento", "Cerrado"],
              pipelineGoal: "Meta diaria: priorizar solo handoffs de alta intencion en ventas.",
            },
            lead_chat: {
              kpis: [
                { label: "Tiempo de salida sin web", before: "Dias", after: "< 10 min" },
                { label: "Leads interesados recuperables", before: "Bajo", after: "+44%" },
                { label: "Contexto para handoff", before: "Parcial", after: "Estructurado" },
              ],
              onboarding: [
                "Crea tu enlace publico de Lead Chat.",
                "Compartelo en anuncios, bio y campañas en redes.",
                "Convierte conversaciones en contactos y tareas CRM.",
              ],
              compliance:
                "Lead Chat mantiene un flujo de cumplimiento: sin auto-envio y accion explicita del usuario antes del handoff final.",
              roi: "Para equipos sin web, abre un canal de conversion desde el primer dia.",
              pipelineStages: ["Abre enlace", "Calificado", "Asignado", "Seguimiento", "Ganado/Perdido"],
              pipelineGoal: "Meta diaria: toda conversacion calificada debe quedar asignada a un asesor.",
            },
          },
    [isEn],
  );

  const capabilities = isEn
    ? [
        {
          title: "Real Kanban in popup and embedded CRM tab",
          body: "Move opportunities visually between stages from WhatsApp and keep the same view in CRM without switching tools.",
        },
        {
          title: "Custom stages and smart stage filters",
          body: "Use default stages or create your own and filter chats by stage to focus your team on the right contacts first.",
        },
        {
          title: "Mass campaigns only to opted-in leads",
          body: "Run outbound campaigns to consented contacts and keep compliant communication policies from day one.",
        },
        {
          title: "Notes and quick replies by contact",
          body: "Each chat keeps notes, context and reusable templates so advisors answer faster and with better consistency.",
        },
        {
          title: "Reminders with local notifications",
          body: "Schedule follow-ups and get browser notifications to avoid missing opportunities in daily operations.",
        },
        {
          title: "Custom segments in popup",
          body: "Create focused views by tags, source, urgency or agent and prioritize your highest-intent portfolio in one click.",
        },
        {
          title: "Manual chat open for unsaved numbers",
          body: "Open chats to non-saved numbers with manual send confirmation to keep WhatsApp compliance intact.",
        },
        {
          title: "CSV import and blur mode for demos",
          body: "Import your own CRM contacts via CSV and enable blur mode to present workflows without exposing private data.",
        },
      ]
    : [
        {
          title: "Kanban real en popup y tab CRM embebido",
          body: "Mueve oportunidades por etapas desde WhatsApp y manten la misma vista en CRM sin cambiar de herramienta.",
        },
        {
          title: "Etapas personalizadas y filtros por etapa",
          body: "Usa etapas predeterminadas o crea las tuyas y filtra chats por etapa para enfocar al equipo en lo prioritario.",
        },
        {
          title: "Campanas masivas solo a leads opted_in",
          body: "Ejecuta campanas a contactos con consentimiento y mantiene cumplimiento comercial desde el primer dia.",
        },
        {
          title: "Notas por contacto y respuestas rapidas",
          body: "Cada chat guarda notas, contexto y plantillas reutilizables para responder con rapidez y consistencia comercial.",
        },
        {
          title: "Recordatorios con notificaciones locales",
          body: "Programa seguimientos y recibe alertas del navegador para no dejar oportunidades sin contacto.",
        },
        {
          title: "Segmentos personalizados en popup",
          body: "Crea vistas por tags, fuente, urgencia o agente y prioriza cartera caliente en un clic.",
        },
        {
          title: "Chat manual a numeros no guardados",
          body: "Abre conversaciones a numeros no guardados con confirmacion manual de envio para cumplir politicas de WhatsApp.",
        },
        {
          title: "Importacion CSV y modo blur para demos",
          body: "Importa contactos a tu CRM con CSV y activa blur para mostrar tu flujo sin exponer conversaciones reales.",
        },
      ];

  const useCases = isEn
    ? [
        "Sales teams managing WhatsApp as their main channel",
        "Real estate and non-real-estate operations with different workflows",
        "Businesses that need manual compliance (no auto-send)",
        "Teams that need segmented views by tags, source and urgency",
        "Companies importing existing contacts by CSV into CRM",
        "Operations that need to open chats with unsaved numbers safely",
      ]
    : [
        "Equipos comerciales que operan WhatsApp como canal principal",
        "Operaciones inmobiliarias y no inmobiliarias con flujos distintos",
        "Negocios que necesitan cumplimiento manual (sin auto-envio)",
        "Equipos que requieren segmentacion por tags, fuente y urgencia",
        "Empresas que importan su base actual por CSV al CRM",
        "Operaciones que necesitan abrir chat a numeros no guardados con seguridad",
      ];

  const conversionBullets = isEn
    ? ["WhatsWidget CRM from S/50", "No auto-send: manual compliance", "General + Real Estate templates"]
    : ["WhatsWidget CRM desde S/50", "Sin auto-envio: cumplimiento manual", "Plantillas General + Inmobiliaria"];

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
  const [activeDemoModule, setActiveDemoModule] = useState<DemoModule["id"]>("crm_whatsapp");
  const [activeDemoStep, setActiveDemoStep] = useState(0);
  const [demoPipelineStageIndex, setDemoPipelineStageIndex] = useState(0);
  const [demoRoiInputs, setDemoRoiInputs] = useState<Record<DemoModule["id"], DemoRoiInput>>({
    crm_whatsapp: { leads: 120, closeRate: 8, lift: 4, ticket: 3500 },
    leads_widget: { leads: 220, closeRate: 6, lift: 3, ticket: 2800 },
    lead_chat: { leads: 160, closeRate: 5, lift: 3, ticket: 2400 },
  });
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

  useEffect(() => {
    setDemoPipelineStageIndex(0);
  }, [activeDemoModule]);

  const openWhatsAppCta = (message?: string) => {
    const defaultMessage = "Hola Leads Widget, quiero activar mi CRM para WhatsApp.";
    const finalMessage = message || defaultMessage;
    const whatsappUrl = `https://wa.me/51924464410?text=${encodeURIComponent(finalMessage)}`;
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
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

  const currentDemoModule =
    demoModules.find((module) => module.id === activeDemoModule) || demoModules[0];
  const currentDemoStep =
    currentDemoModule?.steps[activeDemoStep] || currentDemoModule?.steps[0];
  const currentDemoInsight = demoInsights[currentDemoModule?.id || "crm_whatsapp"];
  const currentDemoRoiInput = demoRoiInputs[currentDemoModule?.id || "crm_whatsapp"];
  const currentDemoPlanPrice = currentDemoModule?.id === "crm_whatsapp" ? 50 : 99;
  const currentDemoImprovedRate = Math.min(100, Math.max(0, currentDemoRoiInput.closeRate + currentDemoRoiInput.lift));
  const currentDemoBaselineDeals = currentDemoRoiInput.leads * (Math.max(0, currentDemoRoiInput.closeRate) / 100);
  const currentDemoImprovedDeals = currentDemoRoiInput.leads * (currentDemoImprovedRate / 100);
  const currentDemoExtraDeals = Math.max(0, currentDemoImprovedDeals - currentDemoBaselineDeals);
  const currentDemoExtraRevenue = currentDemoExtraDeals * Math.max(0, currentDemoRoiInput.ticket);
  const currentDemoNetGain = currentDemoExtraRevenue - currentDemoPlanPrice;
  const penFormatter = new Intl.NumberFormat(isEn ? "en-US" : "es-PE", {
    style: "currency",
    currency: "PEN",
    maximumFractionDigits: 0,
  });

  const updateDemoRoiField = (field: keyof DemoRoiInput, value: number) => {
    const moduleId = currentDemoModule?.id || "crm_whatsapp";
    const safe = Number.isFinite(value) ? value : 0;
    setDemoRoiInputs((prev) => {
      const base = prev[moduleId] || { leads: 100, closeRate: 5, lift: 2, ticket: 2000 };
      const nextValue =
        field === "closeRate" || field === "lift"
          ? Math.min(100, Math.max(0, safe))
          : Math.max(0, safe);
      return {
        ...prev,
        [moduleId]: {
          ...base,
          [field]: nextValue,
        },
      };
    });
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
        .crm-wa-preview {
          position: relative;
          display: grid;
          grid-template-columns: 56px minmax(220px, 34%) minmax(380px, 1fr);
          min-height: 438px;
          background: #0b1118;
        }
        .crm-wa-pixel-mask {
          position: absolute;
          border-radius: 12px;
          backdrop-filter: blur(7px);
          background:
            linear-gradient(135deg, rgba(6, 8, 12, 0.55), rgba(6, 8, 12, 0.62)),
            repeating-linear-gradient(
              0deg,
              rgba(133, 146, 167, 0.18) 0px,
              rgba(133, 146, 167, 0.18) 8px,
              rgba(32, 41, 55, 0.22) 8px,
              rgba(32, 41, 55, 0.22) 16px
            );
          box-shadow: inset 0 0 0 1px rgba(148, 163, 184, 0.12);
        }
        @media (max-width: 1024px) {
          .crm-wa-preview {
            grid-template-columns: 44px minmax(170px, 38%) minmax(250px, 1fr);
            min-height: 390px;
          }
        }
        @media (max-width: 768px) {
          .crm-wa-preview {
            grid-template-columns: 38px minmax(140px, 38%) minmax(220px, 1fr);
            min-height: 360px;
          }
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
            <span className="text-sm font-semibold tracking-tight sm:text-base">WhatsWidget</span>
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
            <Button
              type="button"
              className="h-10 rounded-full px-5 font-semibold text-white"
              onClick={() => openWhatsAppCta()}
            >
              {copy.navRegister}
            </Button>
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
                  <Button
                    type="button"
                    className="w-full justify-start"
                    onClick={() => openWhatsAppCta()}
                  >
                    {copy.navRegister}
                  </Button>
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
              <Button
                type="button"
                size="xl"
                className="w-full rounded-full px-8 text-white sm:w-auto"
                onClick={() => openWhatsAppCta()}
              >
                {copy.ctaPrimary}
              </Button>
              <Button size="xl" variant="outline" className={`w-full rounded-full px-8 sm:w-auto ${isLandingDark ? "border-slate-700 text-slate-100 hover:bg-slate-800" : "border-slate-300 text-slate-800 hover:bg-slate-100"}`} onClick={() => openWhatsAppCta()}>
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
              <div className={`overflow-hidden rounded-[26px] border ${isLandingDark ? "border-slate-700 bg-[#061326]" : "border-slate-200/70 bg-[#061326]"}`}>
                <div className="crm-wa-preview">
                  <aside className="flex flex-col items-center gap-4 border-r border-slate-800/80 bg-slate-950/80 pt-4">
                    {[MessageCircle, Bot, Sparkles, ShieldCheck].map((Icon, idx) => (
                      <span
                        key={`rail-${idx}`}
                        className="grid h-8 w-8 place-items-center rounded-lg border border-slate-700/80 bg-slate-900/80 text-slate-300"
                      >
                        <Icon className="h-4 w-4" />
                      </span>
                    ))}
                  </aside>

                  <aside className="relative border-r border-slate-800/80 bg-[#0f1722] p-3 text-slate-200">
                    <div className="rounded-xl border border-slate-700/80 bg-slate-900/70 px-3 py-2 text-xs text-slate-300">
                      {isEn ? "Search chat..." : "Buscar chat..."}
                    </div>
                    <div className="mt-3 space-y-2">
                      {[1, 2, 3, 4, 5, 6].map((row) => (
                        <div key={`chat-row-${row}`} className="rounded-xl border border-slate-800/80 bg-slate-900/55 p-2.5">
                          <div className="h-2.5 w-24 rounded bg-slate-600/70" />
                          <div className="mt-1.5 h-2 w-32 rounded bg-slate-700/70" />
                        </div>
                      ))}
                    </div>
                    <div className="crm-wa-pixel-mask inset-x-2 bottom-4 top-[82px]" />
                  </aside>

                  <section className="relative overflow-hidden bg-[#0a121b]">
                    <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between border-b border-slate-800/80 bg-slate-950/80 px-4 py-2.5 text-slate-100">
                      <div>
                        <p className="text-sm font-semibold leading-none">+51 934 664 490</p>
                        <p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-slate-400">Cuenta de empresa</p>
                      </div>
                      <MessageCircle className="h-4 w-4 text-slate-400" />
                    </div>

                    <div className="space-y-3 px-4 pb-4 pt-16 text-sm text-slate-100">
                      <div className="ml-auto max-w-[72%] rounded-2xl rounded-br-md bg-emerald-700/90 px-3 py-2">
                        Hola 👋, revisamos tu anuncio de inmueble.
                      </div>
                      <div className="ml-auto max-w-[72%] rounded-2xl rounded-br-md bg-emerald-700/90 px-3 py-2">
                        Te muestro el CRM en WhatsApp en 2 minutos?
                      </div>
                    </div>

                    <div className="crm-wa-pixel-mask left-4 top-20 h-28 w-[52%]" />

                    <aside className="absolute bottom-4 right-4 z-20 w-[300px] max-w-[62%] rounded-2xl border border-slate-200/80 bg-slate-100/95 p-3 text-slate-800 shadow-2xl">
                      <div className="flex items-center justify-between rounded-xl bg-gradient-to-r from-emerald-700 to-cyan-700 px-3 py-2 text-xs font-semibold text-white">
                        <span>CRM WhatsApp 0.4.1</span>
                        <span>{isEn ? "Live" : "Activo"}</span>
                      </div>
                      <div className="mt-3 space-y-2">
                        <div className="grid grid-cols-2 gap-2 text-[11px]">
                          <span className="rounded-lg bg-white px-2 py-1.5">Lead</span>
                          <span className="rounded-lg bg-white px-2 py-1.5">Etapa: qualified</span>
                        </div>
                        <div className="rounded-lg bg-white px-2 py-1.5 text-[11px]">Tags: comprador, urgente, surco</div>
                        <div className="grid grid-cols-3 gap-2 text-[10px] font-semibold">
                          <span className="rounded-lg bg-emerald-600 px-2 py-1 text-center text-white">Guardar</span>
                          <span className="rounded-lg bg-slate-200 px-2 py-1 text-center">Atajo</span>
                          <span className="rounded-lg bg-cyan-700 px-2 py-1 text-center text-white">Seguimiento</span>
                        </div>
                      </div>
                    </aside>
                  </section>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className={`relative z-10 border-y px-4 py-14 sm:px-6 lg:py-16 ${isLandingDark ? "border-slate-800/70 bg-slate-900/60" : "border-slate-200/70 bg-white/75"}`}>
        <div className="mx-auto grid w-full max-w-[1160px] gap-8 lg:grid-cols-[0.46fr_0.54fr]">
          <div>
            <p className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] ${isLandingDark ? "border-cyan-400/30 bg-cyan-400/10 text-cyan-200" : "border-cyan-200 bg-cyan-50 text-cyan-700"}`}>
              {isEn ? "Interactive conversion sandbox" : "Sandbox interactivo de conversion"}
            </p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight">
              {isEn ? "Evaluate results before buying" : "Evalua resultados antes de comprar"}
            </h2>
            <p className={`mt-3 text-sm leading-relaxed ${isLandingDark ? "text-slate-300" : "text-slate-600"}`}>
              {isEn
                ? "Switch between CRM WhatsApp, Leads Widget and Lead Chat. Each view simulates before/after metrics, full flow, compliance and onboarding."
                : "Cambia entre CRM WhatsApp, Leads Widget y Lead Chat. Cada vista simula metricas antes/despues, flujo completo, cumplimiento y onboarding."}
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              {demoModules.map((module) => (
                <button
                  key={module.id}
                  type="button"
                  onClick={() => {
                    setActiveDemoModule(module.id);
                    setActiveDemoStep(0);
                  }}
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${activeDemoModule === module.id
                    ? isLandingDark
                      ? "border-cyan-400/70 bg-cyan-500/15 text-cyan-100"
                      : "border-cyan-300 bg-cyan-50 text-cyan-800"
                    : isLandingDark
                      ? "border-slate-700 bg-slate-900 text-slate-300 hover:border-slate-500"
                      : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"}`}
                >
                  {module.label}
                </button>
              ))}
            </div>

            <h3 className="mt-5 text-lg font-semibold">{currentDemoModule?.title}</h3>
            <p className={`mt-2 text-sm leading-relaxed ${isLandingDark ? "text-slate-300" : "text-slate-600"}`}>
              {currentDemoModule?.subtitle}
            </p>

            <div className="mt-4 grid gap-2 sm:grid-cols-3">
              {currentDemoInsight.kpis.map((kpi) => (
                <article
                  key={`${currentDemoModule?.id}-${kpi.label}`}
                  className={`rounded-2xl border p-3 ${isLandingDark ? "border-slate-700 bg-slate-900/80" : "border-slate-200 bg-white"}`}
                >
                  <p className={`text-[11px] font-semibold uppercase tracking-[0.12em] ${isLandingDark ? "text-slate-400" : "text-slate-500"}`}>
                    {kpi.label}
                  </p>
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <span className={`rounded-md px-2 py-0.5 text-xs ${isLandingDark ? "bg-rose-500/15 text-rose-200" : "bg-rose-50 text-rose-700"}`}>
                      {isEn ? "Before" : "Antes"} {kpi.before}
                    </span>
                    <ArrowRight className={`h-3.5 w-3.5 ${isLandingDark ? "text-slate-500" : "text-slate-400"}`} />
                    <span className={`rounded-md px-2 py-0.5 text-xs font-semibold ${isLandingDark ? "bg-emerald-500/15 text-emerald-200" : "bg-emerald-50 text-emerald-700"}`}>
                      {isEn ? "After" : "Despues"} {kpi.after}
                    </span>
                  </div>
                </article>
              ))}
            </div>

            <div className={`mt-4 rounded-2xl border p-4 ${isLandingDark ? "border-slate-700 bg-slate-900/80" : "border-slate-200 bg-white"}`}>
              <div className="grid gap-2 text-sm">
                <p className={isLandingDark ? "text-slate-200" : "text-slate-800"}>
                  <span className="font-semibold">{isEn ? "Serves for:" : "Sirve para:"}</span>{" "}
                  {currentDemoModule?.purpose}
                </p>
                <p className={isLandingDark ? "text-slate-300" : "text-slate-700"}>
                  <span className="font-semibold">{isEn ? "Ideal if:" : "Ideal si:"}</span>{" "}
                  {currentDemoModule?.idealFor}
                </p>
                <p className={isLandingDark ? "text-cyan-200" : "text-cyan-800"}>
                  <span className="font-semibold">{isEn ? "Result:" : "Resultado:"}</span>{" "}
                  {currentDemoModule?.result}
                </p>
              </div>
            </div>

            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <article className={`rounded-2xl border p-4 ${isLandingDark ? "border-slate-700 bg-slate-900/75" : "border-slate-200 bg-white"}`}>
                <p className="text-sm font-semibold">{isEn ? "Onboarding in minutes" : "Onboarding en minutos"}</p>
                <div className="mt-3 grid gap-2 text-xs">
                  {currentDemoInsight.onboarding.map((item) => (
                    <p key={`${currentDemoModule?.id}-${item}`} className={`flex items-start gap-2 ${isLandingDark ? "text-slate-300" : "text-slate-700"}`}>
                      <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                      <span>{item}</span>
                    </p>
                  ))}
                </div>
              </article>
              <article className={`rounded-2xl border p-4 ${isLandingDark ? "border-slate-700 bg-slate-900/75" : "border-slate-200 bg-white"}`}>
                <p className="text-sm font-semibold">{isEn ? "Compliance + ROI" : "Cumplimiento + ROI"}</p>
                <p className={`mt-3 text-xs leading-relaxed ${isLandingDark ? "text-slate-300" : "text-slate-700"}`}>
                  {currentDemoInsight.compliance}
                </p>
                <p className={`mt-2 rounded-lg px-2 py-1.5 text-xs font-medium ${isLandingDark ? "bg-cyan-500/10 text-cyan-200" : "bg-cyan-50 text-cyan-800"}`}>
                  {currentDemoInsight.roi}
                </p>
              </article>
            </div>

            <article className={`mt-4 rounded-2xl border p-4 ${isLandingDark ? "border-slate-700 bg-slate-900/80" : "border-slate-200 bg-white"}`}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold">{isEn ? "Mini ROI calculator" : "Mini calculadora ROI"}</p>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${isLandingDark ? "bg-emerald-500/15 text-emerald-200" : "bg-emerald-100 text-emerald-700"}`}>
                  {isEn ? `Plan used: S/${currentDemoPlanPrice}` : `Plan usado: S/${currentDemoPlanPrice}`}
                </span>
              </div>

              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor={`demo-roi-leads-${currentDemoModule?.id}`}
                    className={`text-xs font-medium ${isLandingDark ? "text-slate-300" : "text-slate-700"}`}
                  >
                    {isEn ? "Monthly leads" : "Leads mensuales"}
                  </label>
                  <input
                    id={`demo-roi-leads-${currentDemoModule?.id}`}
                    type="number"
                    min={0}
                    value={Math.round(currentDemoRoiInput.leads)}
                    onChange={(event) => updateDemoRoiField("leads", Number(event.target.value || 0))}
                    className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none transition focus-visible:ring-2 focus-visible:ring-cyan-400 ${isLandingDark ? "border-slate-700 bg-slate-950 text-slate-100" : "border-slate-300 bg-white text-slate-900"}`}
                  />
                </div>
                <div>
                  <label
                    htmlFor={`demo-roi-close-${currentDemoModule?.id}`}
                    className={`text-xs font-medium ${isLandingDark ? "text-slate-300" : "text-slate-700"}`}
                  >
                    {isEn ? "Current close rate (%)" : "Tasa de cierre actual (%)"}
                  </label>
                  <input
                    id={`demo-roi-close-${currentDemoModule?.id}`}
                    type="number"
                    min={0}
                    max={100}
                    value={Math.round(currentDemoRoiInput.closeRate)}
                    onChange={(event) => updateDemoRoiField("closeRate", Number(event.target.value || 0))}
                    className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none transition focus-visible:ring-2 focus-visible:ring-cyan-400 ${isLandingDark ? "border-slate-700 bg-slate-950 text-slate-100" : "border-slate-300 bg-white text-slate-900"}`}
                  />
                </div>
                <div>
                  <label
                    htmlFor={`demo-roi-lift-${currentDemoModule?.id}`}
                    className={`text-xs font-medium ${isLandingDark ? "text-slate-300" : "text-slate-700"}`}
                  >
                    {isEn ? "Expected lift (pp)" : "Mejora esperada (pp)"}
                  </label>
                  <input
                    id={`demo-roi-lift-${currentDemoModule?.id}`}
                    type="number"
                    min={0}
                    max={100}
                    value={Math.round(currentDemoRoiInput.lift)}
                    onChange={(event) => updateDemoRoiField("lift", Number(event.target.value || 0))}
                    className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none transition focus-visible:ring-2 focus-visible:ring-cyan-400 ${isLandingDark ? "border-slate-700 bg-slate-950 text-slate-100" : "border-slate-300 bg-white text-slate-900"}`}
                  />
                </div>
                <div>
                  <label
                    htmlFor={`demo-roi-ticket-${currentDemoModule?.id}`}
                    className={`text-xs font-medium ${isLandingDark ? "text-slate-300" : "text-slate-700"}`}
                  >
                    {isEn ? "Average ticket (S/)" : "Ticket promedio (S/)"}
                  </label>
                  <input
                    id={`demo-roi-ticket-${currentDemoModule?.id}`}
                    type="number"
                    min={0}
                    value={Math.round(currentDemoRoiInput.ticket)}
                    onChange={(event) => updateDemoRoiField("ticket", Number(event.target.value || 0))}
                    className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none transition focus-visible:ring-2 focus-visible:ring-cyan-400 ${isLandingDark ? "border-slate-700 bg-slate-950 text-slate-100" : "border-slate-300 bg-white text-slate-900"}`}
                  />
                </div>
              </div>

              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                <div className={`rounded-xl border px-3 py-2 ${isLandingDark ? "border-slate-700 bg-slate-950/80" : "border-slate-200 bg-slate-50"}`}>
                  <p className={`text-[11px] uppercase tracking-[0.1em] ${isLandingDark ? "text-slate-400" : "text-slate-500"}`}>{isEn ? "Extra deals/mo" : "Cierres extra/mes"}</p>
                  <p className="mt-1 text-base font-semibold">{currentDemoExtraDeals.toFixed(1)}</p>
                </div>
                <div className={`rounded-xl border px-3 py-2 ${isLandingDark ? "border-slate-700 bg-slate-950/80" : "border-slate-200 bg-slate-50"}`}>
                  <p className={`text-[11px] uppercase tracking-[0.1em] ${isLandingDark ? "text-slate-400" : "text-slate-500"}`}>{isEn ? "Extra revenue/mo" : "Ingreso extra/mes"}</p>
                  <p className="mt-1 text-base font-semibold">{penFormatter.format(currentDemoExtraRevenue)}</p>
                </div>
                <div className={`rounded-xl border px-3 py-2 ${isLandingDark ? "border-slate-700 bg-slate-950/80" : "border-slate-200 bg-slate-50"}`}>
                  <p className={`text-[11px] uppercase tracking-[0.1em] ${isLandingDark ? "text-slate-400" : "text-slate-500"}`}>{isEn ? "Net after plan" : "Neto despues del plan"}</p>
                  <p className={`mt-1 text-base font-semibold ${currentDemoNetGain >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
                    {penFormatter.format(currentDemoNetGain)}
                  </p>
                </div>
              </div>

              <p className={`mt-2 text-[11px] ${isLandingDark ? "text-slate-400" : "text-slate-500"}`}>
                {isEn
                  ? "Estimated simulation for decision support. Real results vary by sales process and traffic quality."
                  : "Simulacion estimada para apoyar la decision. El resultado real depende de tu proceso comercial y calidad del trafico."}
              </p>
            </article>

            <div className="mt-4 grid gap-2">
              {currentDemoModule?.steps.map((step, index) => (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => setActiveDemoStep(index)}
                  className={`rounded-2xl border p-3 text-left transition ${activeDemoStep === index
                    ? isLandingDark
                      ? "border-cyan-400/60 bg-cyan-400/10 text-cyan-100"
                      : "border-cyan-300 bg-cyan-50 text-cyan-800"
                    : isLandingDark
                      ? "border-slate-700 bg-slate-900/70 text-slate-300 hover:border-slate-500"
                      : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"}`}
                >
                  <p className="text-sm font-semibold">{step.title}</p>
                </button>
              ))}
            </div>
            <Button type="button" className="mt-6 rounded-full px-7 text-white" onClick={() => openWhatsAppCta()}>
              {isEn ? "Activate this on my business" : "Quiero activar esto en mi negocio"}
            </Button>
          </div>

          <div className={`rounded-[28px] border p-4 ${isLandingDark ? "border-slate-700 bg-slate-950/80" : "border-slate-200 bg-slate-50/85"}`}>
            <div className={`rounded-2xl border p-3 ${isLandingDark ? "border-slate-700 bg-[#0b121a]" : "border-slate-200 bg-white"}`}>
              <div className="flex items-center justify-between rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 px-3 py-2 text-white">
                <span className="text-xs font-semibold">{currentDemoModule?.chatTitle}</span>
                <MessageCircle className="h-4 w-4" />
              </div>
              <div className="mt-3 space-y-2">
                <div className={`max-w-[82%] rounded-2xl rounded-bl-md px-3 py-2 text-sm ${isLandingDark ? "bg-slate-800 text-slate-100" : "bg-slate-100 text-slate-700"}`}>
                  {currentDemoStep?.chatLine}
                </div>
                <div className="ml-auto max-w-[82%] rounded-2xl rounded-br-md bg-emerald-600 px-3 py-2 text-sm text-white">
                  {isEn ? "Done. Updating workflow..." : "Listo. Actualizando flujo..."}
                </div>
              </div>
            </div>

            <div className={`mt-3 rounded-2xl border p-3 ${isLandingDark ? "border-slate-700 bg-slate-900/80" : "border-slate-200 bg-white"}`}>
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">{currentDemoModule?.panelTitle}</p>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${isLandingDark ? "bg-cyan-500/15 text-cyan-200" : "bg-cyan-100 text-cyan-700"}`}>
                  {isEn ? "Auto-updated" : "Auto-actualizado"}
                </span>
              </div>
              <p className={`mt-2 rounded-lg px-2 py-1.5 text-sm ${isLandingDark ? "bg-slate-800 text-slate-200" : "bg-slate-100 text-slate-700"}`}>
                {currentDemoStep?.panelLine}
              </p>
              <p className={`mt-2 text-xs ${isLandingDark ? "text-slate-400" : "text-slate-600"}`}>
                {currentDemoStep?.outcome}
              </p>
            </div>

            <div className={`mt-3 rounded-2xl border p-3 ${isLandingDark ? "border-slate-700 bg-slate-900/80" : "border-slate-200 bg-white"}`}>
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold">{isEn ? "Full flow in one view" : "Flujo completo en una vista"}</p>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${isLandingDark ? "bg-emerald-500/15 text-emerald-200" : "bg-emerald-100 text-emerald-700"}`}>
                  {isEn ? "Interactive" : "Interactivo"}
                </span>
              </div>

              <div className="mt-3 grid gap-2 sm:grid-cols-5">
                {currentDemoInsight.pipelineStages.map((stage, index) => (
                  <button
                    key={`${currentDemoModule?.id}-${stage}`}
                    type="button"
                    onClick={() => setDemoPipelineStageIndex(index)}
                    className={`rounded-xl border px-2 py-2 text-[11px] font-semibold transition ${demoPipelineStageIndex === index
                      ? isLandingDark
                        ? "border-cyan-400/70 bg-cyan-500/15 text-cyan-100"
                        : "border-cyan-300 bg-cyan-50 text-cyan-800"
                      : isLandingDark
                        ? "border-slate-700 bg-slate-900 text-slate-300 hover:border-slate-500"
                        : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"}`}
                  >
                    {stage}
                  </button>
                ))}
              </div>

              <div className={`mt-3 h-2 rounded-full ${isLandingDark ? "bg-slate-800" : "bg-slate-200"}`}>
                <div
                  className="h-2 rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500 transition-all duration-300"
                  style={{
                    width: `${((demoPipelineStageIndex + 1) / currentDemoInsight.pipelineStages.length) * 100}%`,
                  }}
                />
              </div>

              <p className={`mt-2 text-xs ${isLandingDark ? "text-slate-300" : "text-slate-700"}`}>
                {isEn ? "Current simulated stage:" : "Etapa simulada actual:"}{" "}
                <span className="font-semibold">{currentDemoInsight.pipelineStages[demoPipelineStageIndex]}</span>
              </p>
              <p className={`mt-1 text-xs ${isLandingDark ? "text-slate-400" : "text-slate-600"}`}>
                {currentDemoInsight.pipelineGoal}
              </p>

              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  className="rounded-full px-4 text-white"
                  onClick={() =>
                    setDemoPipelineStageIndex((prev) =>
                      Math.min(prev + 1, currentDemoInsight.pipelineStages.length - 1),
                    )
                  }
                  disabled={demoPipelineStageIndex >= currentDemoInsight.pipelineStages.length - 1}
                >
                  {isEn ? "Move to next stage" : "Mover a la siguiente etapa"}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="rounded-full px-4"
                  onClick={() => setDemoPipelineStageIndex(0)}
                >
                  {isEn ? "Reset flow" : "Reiniciar flujo"}
                </Button>
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
          <div className="grid gap-4 lg:grid-cols-3">
            <article className={`rounded-3xl border p-6 ${isLandingDark ? "border-slate-800 bg-slate-900/70" : "border-slate-200/80 bg-white/85"}`}>
              <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] ${isLandingDark ? "bg-teal-400/15 text-teal-200" : "bg-teal-50 text-teal-700"}`}>CRM WhatsApp</span>
              <h3 className="mt-4 text-2xl font-semibold">{isEn ? "CRM on WhatsApp Web" : "CRM en WhatsApp Web"}</h3>
              <p className={`mt-3 text-sm leading-relaxed ${isLandingDark ? "text-slate-300" : "text-slate-600"}`}>{isEn ? "Sell directly on WhatsApp Web with stages, tags and follow-up tasks, without changing your daily workflow." : "Vende directo en WhatsApp Web con etapas, etiquetas y tareas de seguimiento sin cambiar tu rutina diaria."}</p>
            </article>
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
        <div className="mx-auto w-full max-w-[1160px]">
          <div className="text-center">
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">{copy.pricingTitle}</h2>
            <p className={`mt-3 text-sm ${isLandingDark ? "text-slate-300" : "text-slate-600"}`}>
              {isEn
                ? "Simple monthly pricing for WhatsWidget: CRM WhatsApp or full PRO bundle."
                : "Precios mensuales simples de WhatsWidget: CRM WhatsApp o bundle PRO completo."}
            </p>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-2">
            <article className={`rounded-3xl border p-6 ${isLandingDark ? "border-cyan-700/70 bg-slate-900/75" : "border-cyan-200 bg-cyan-50/70"}`}>
              <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] ${isLandingDark ? "bg-cyan-500/20 text-cyan-200" : "bg-cyan-100 text-cyan-700"}`}>
                {isEn ? "CRM WhatsApp" : "CRM WhatsApp"}
              </span>
              <h3 className="mt-4 text-2xl font-semibold">{isEn ? "CRM WhatsApp plan" : "Plan CRM WhatsApp"}</h3>
              <p className={`mt-3 text-sm leading-relaxed ${isLandingDark ? "text-slate-300" : "text-slate-600"}`}>
                {isEn ? "Use WhatsWidget on WhatsApp Web with real Kanban, contact notes and disciplined follow-up." : "Usa WhatsWidget en WhatsApp Web con Kanban real, notas por contacto y seguimiento disciplinado."}
              </p>
              <ul className={`mt-4 space-y-2 text-sm ${isLandingDark ? "text-slate-300" : "text-slate-600"}`}>
                {(isEn
                  ? [
                      "Kanban + pipeline with custom stages and filters",
                      "Notes by contact + reminders with local notifications",
                      "Quick templates + manual send only (compliance)",
                      "General and Real Estate operational templates",
                    ]
                  : [
                      "Kanban + pipeline con etapas personalizadas y filtros",
                      "Notas por contacto + recordatorios con notificacion local",
                      "Plantillas rapidas + envio manual (cumplimiento)",
                      "Plantillas operativas General e Inmobiliaria",
                    ]).map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-cyan-500" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-6 text-3xl font-black">S/ 50</p>
              <p className={`text-xs ${isLandingDark ? "text-slate-400" : "text-slate-500"}`}>{isEn ? "per month" : "por mes"}</p>
            </article>

            <article className={`rounded-3xl border p-6 ${isLandingDark ? "border-emerald-700/70 bg-slate-900/75" : "border-emerald-200 bg-emerald-50/70"}`}>
              <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] ${isLandingDark ? "bg-emerald-500/20 text-emerald-200" : "bg-emerald-100 text-emerald-700"}`}>
                PRO
              </span>
              <h3 className="mt-4 text-2xl font-semibold">{isEn ? "PRO bundle plan" : "Plan bundle PRO"}</h3>
              <p className={`mt-3 text-sm leading-relaxed ${isLandingDark ? "text-slate-300" : "text-slate-600"}`}>
                {isEn ? "Full WhatsWidget stack in one package for acquisition, qualification and follow-up." : "Stack completo de WhatsWidget en un paquete para captacion, calificacion y seguimiento."}
              </p>
              <ul className={`mt-4 space-y-2 text-sm ${isLandingDark ? "text-slate-300" : "text-slate-600"}`}>
                {(isEn
                  ? [
                      "Everything in CRM WhatsApp",
                      "Leads Widget + public Lead Chat enabled",
                      "Custom segments and campaigns to opted-in leads",
                      "CSV import to CRM + blur mode for demos",
                    ]
                  : [
                      "Todo lo del CRM WhatsApp",
                      "Leads Widget + Lead Chat publico activados",
                      "Segmentos personalizados y campanas a opted_in",
                      "Importacion CSV al CRM + modo blur para demos",
                    ]).map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-6 text-3xl font-black">S/ 99</p>
              <p className={`text-xs ${isLandingDark ? "text-slate-400" : "text-slate-500"}`}>{isEn ? "per month" : "por mes"}</p>
            </article>
          </div>

          <div className="mt-8 text-center">
            <Button type="button" size="xl" className="rounded-full px-9 text-white" onClick={() => openWhatsAppCta()}>
              {copy.navRegister}
            </Button>
          </div>
        </div>
      </section>

      <section className="relative z-10 px-4 pb-20 sm:px-6 lg:pb-24">
        <div className="mx-auto max-w-[980px] rounded-[34px] border border-slate-200/80 bg-gradient-to-br from-slate-900 via-slate-900 to-cyan-900 px-8 py-14 text-center text-white shadow-[0_40px_110px_-55px_rgba(15,23,42,0.75)] sm:px-12">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-5xl">{copy.finalTitle}</h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-slate-300 sm:text-base">{copy.finalSubtitle}</p>
          <p className="mx-auto mt-2 max-w-2xl text-sm font-medium text-cyan-200">
            {isEn ? "Current offer in WhatsWidget: CRM WhatsApp S/50 or PRO bundle S/99 monthly." : "Oferta actual en WhatsWidget: CRM WhatsApp S/50 o bundle PRO S/99 mensual."}
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button type="button" size="xl" className="rounded-full px-8 text-white" onClick={() => openWhatsAppCta()}>
              {copy.navRegister}
            </Button>
            <Button type="button" size="xl" variant="outline" className="rounded-full border-white/30 bg-white/10 px-8 text-white hover:bg-white/15" onClick={() => openWhatsAppCta()}>{copy.navTry}</Button>
          </div>
        </div>
      </section>

      <footer className={`relative z-10 border-t px-4 py-12 backdrop-blur sm:px-6 ${isLandingDark ? "border-slate-800/80 bg-slate-950/85" : "border-slate-200/80 bg-white/80"}`}>
        <div className="mx-auto flex w-full max-w-[1160px] flex-col items-center justify-between gap-4 text-center sm:flex-row sm:text-left">
          <div><p className="text-sm font-semibold">WhatsWidget</p><p className={`text-sm ${isLandingDark ? "text-slate-400" : "text-slate-600"}`}>{isEn ? "WhatsApp CRM system with Kanban, reminders, campaigns and manual-compliant handoff." : "Sistema CRM para WhatsApp con Kanban, recordatorios, campanas y handoff manual con cumplimiento."}</p></div>
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
                <Button type="button" onClick={() => { setShowExitPopup(false); openWhatsAppCta(); }}>{copy.exitCta}</Button>
                <Button type="button" variant="outline" onClick={() => setShowExitPopup(false)}>{copy.exitDismiss}</Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
