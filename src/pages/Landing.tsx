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
  BarChart3,
  CheckCircle2,
  Clock3,
  DollarSign,
  Menu,
  MessageCircle,
  Moon,
  Play,
  ShieldCheck,
  Sparkles,
  Star,
  Sun,
  Target,
  TrendingUp,
  Users2,
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
    heroBadge: isEn ? "Built for Real Estate, Ready for High-Ticket Sales" : "Disenado para inmobiliarias y ventas de ticket alto",
    heroTitle: isEn
      ? "Turn WhatsApp into predictable revenue for real estate and high-ticket businesses"
      : "Convierte WhatsApp en ingresos predecibles para inmobiliarias y negocios de ticket alto",
    heroSubtitle: isEn
      ? "Primary fit for real estate sales teams, and profitable for any product or service business with average ticket above S/500. WhatsWidget unifies CRM WhatsApp, Leads Widget and Lead Chat in one measurable commercial flow."
      : "Enfoque principal para equipos inmobiliarios, y rentable para cualquier negocio de productos o servicios con ticket promedio mayor a S/500. WhatsWidget une CRM WhatsApp, Leads Widget y Lead Chat en un flujo comercial medible.",
    ctaPrimary: isEn ? "Activate now" : "Activar ahora",
    ctaSecondary: isEn ? "Activate via WhatsApp" : "Activar por WhatsApp",
    modesTitle: isEn ? "WhatsWidget in three usage modes" : "WhatsWidget en tres modos de uso",
    capabilitiesTitle: isEn ? "What your business gains with WhatsWidget" : "Lo que tu negocio gana con WhatsWidget",
    useCasesTitle: isEn ? "Who gets the fastest business impact" : "Quien logra impacto mas rapido",
    testimonialsTitle: isEn ? "What decision-makers are seeing" : "Lo que ya estan viendo los decisores",
    pricingTitle: isEn ? "Choose your plan" : "Elige tu plan",
    finalTitle: isEn
      ? "Scale WhatsApp sales with control, visibility and predictable numbers"
      : "Escala tus ventas en WhatsApp con control, visibilidad y numeros predecibles",
    finalSubtitle: isEn
      ? "Designed first for real estate. Also ideal for any high-ticket operation with average sale above S/500 that needs profitable and compliant growth."
      : "Pensado primero para inmobiliarias. Tambien ideal para cualquier operacion de ticket alto con venta promedio mayor a S/500 que busca crecer con rentabilidad y cumplimiento.",
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
              subtitle: "Every WhatsApp conversation becomes a measurable commercial opportunity with owner, stage and next action.",
              purpose: "Give leadership full pipeline visibility and enforce follow-up discipline across advisors.",
              idealFor: "Real estate teams and any high-ticket operation with average ticket above S/500.",
              result: "Higher response speed, stronger conversion and better monthly revenue predictability.",
              chatTitle: "WhatsApp conversation",
              panelTitle: "CRM panel output",
              steps: [
                {
                  id: "crm-step-1",
                  title: "1. Incoming lead in WhatsApp",
                  chatLine: "Hi, I saw your apartment ad in Surco.",
                  panelLine: "Lead auto-tagged + owner assigned + SLA first response 5 minutes",
                  outcome: "Managers can track response discipline per advisor in real time.",
                },
                {
                  id: "crm-step-2",
                  title: "2. Qualification and pipeline",
                  chatLine: "Budget between S/350k and S/450k. Move in 30 days.",
                  panelLine: "Stage moved to qualified + reminder created + close probability updated",
                  outcome: "Commercial forecasts stop depending on guesswork.",
                },
                {
                  id: "crm-step-3",
                  title: "3. Handoff and close",
                  chatLine: "Perfect, send me options and visit schedule.",
                  panelLine: "Quote template inserted + follow-up task assigned + expected value tracked",
                  outcome: "Teams close faster because context and accountability are always visible.",
                },
              ],
            },
            {
              id: "leads_widget",
              label: "Leads Widget",
              title: "Leads Widget simulation",
              subtitle: "Website traffic is filtered before sales intervention, so advisors only receive purchase-ready conversations.",
              purpose: "Protect ad budget quality and reduce commercial noise from low-intent contacts.",
              idealFor: "Real estate marketing teams and any paid-traffic business with average ticket above S/500.",
              result: "Lower cost per useful lead and more qualified opportunities in pipeline.",
              chatTitle: "Website widget chat",
              panelTitle: "Qualified lead output",
              steps: [
                {
                  id: "widget-step-1",
                  title: "1. Visitor opens widget",
                  chatLine: "Hi, I'm looking for a 3-bedroom apartment in Miraflores.",
                  panelLine: "Lead source captured with campaign data and attribution channel",
                  outcome: "Leadership can identify profitable campaigns with clear source traceability.",
                },
                {
                  id: "widget-step-2",
                  title: "2. Auto pre-qualification",
                  chatLine: "My budget is S/480k and I want to move in this quarter.",
                  panelLine: "Intent score high + profile completeness 92% + urgency validated",
                  outcome: "Sales time is focused on leads with real potential to close.",
                },
                {
                  id: "widget-step-3",
                  title: "3. WhatsApp handoff",
                  chatLine: "Great, connect me with an advisor now.",
                  panelLine: "WhatsApp handoff with preloaded context and campaign attribution",
                  outcome: "Advisors arrive prepared and move conversations toward revenue faster.",
                },
              ],
            },
            {
              id: "lead_chat",
              label: "Lead Chat",
              title: "Lead Chat simulation",
              subtitle: "One public link captures and qualifies conversations from ads and social media without needing a website.",
              purpose: "Launch a scalable commercial entry point in minutes with measurable conversion.",
              idealFor: "Real estate projects and high-ticket businesses selling from social channels without full web stack.",
              result: "Faster market launch and higher recovery of high-intent leads from digital channels.",
              chatTitle: "Public Lead Chat flow",
              panelTitle: "Conversation conversion output",
              steps: [
                {
                  id: "chat-step-1",
                  title: "1. Lead opens public link",
                  chatLine: "Hello, I found your ad and want options near San Isidro.",
                  panelLine: "Conversation started from public link with source captured",
                  outcome: "You monetize social traffic immediately without waiting for website projects.",
                },
                {
                  id: "chat-step-2",
                  title: "2. Guided qualification",
                  chatLine: "I can invest around S/520k and I'm ready to visit this week.",
                  panelLine: "Intent verified + budget validated + stage moved to contacted",
                  outcome: "Qualification quality improves with consistent commercial criteria.",
                },
                {
                  id: "chat-step-3",
                  title: "3. Action to advisor",
                  chatLine: "Perfect, let's continue on WhatsApp.",
                  panelLine: "CRM contact created + owner assigned + follow-up task generated",
                  outcome: "Each qualified conversation enters pipeline with accountability and next step.",
                },
              ],
            },
          ]
        : [
            {
              id: "crm_whatsapp",
              label: "CRM WhatsApp",
              title: "Demo CRM WhatsApp",
              subtitle: "Cada conversacion de WhatsApp se convierte en una oportunidad medible con responsable, etapa y siguiente accion.",
              purpose: "Dar visibilidad total del embudo al gerente y disciplina de seguimiento al equipo.",
              idealFor: "Equipos inmobiliarios y cualquier operacion de ticket alto con promedio mayor a S/500.",
              result: "Mas velocidad de respuesta, mejor conversion y facturacion mensual mas predecible.",
              chatTitle: "Conversacion en WhatsApp",
              panelTitle: "Resultado en panel CRM",
              steps: [
                {
                  id: "crm-step-1",
                  title: "1. Llega el lead por WhatsApp",
                  chatLine: "Hola, vi tu anuncio de departamento en Surco.",
                  panelLine: "Lead etiquetado + asesor asignado + SLA de primera respuesta 5 min",
                  outcome: "Gerencia puede medir disciplina de respuesta por asesor en tiempo real.",
                },
                {
                  id: "crm-step-2",
                  title: "2. Calificacion y pipeline",
                  chatLine: "Presupuesto entre S/350k y S/450k. Me mudo en 30 dias.",
                  panelLine: "Etapa en qualified + recordatorio creado + probabilidad de cierre actualizada",
                  outcome: "La proyeccion comercial deja de depender de suposiciones.",
                },
                {
                  id: "crm-step-3",
                  title: "3. Handoff y cierre",
                  chatLine: "Perfecto, enviame opciones y agenda de visita.",
                  panelLine: "Plantilla de propuesta + tarea de seguimiento + valor esperado visible",
                  outcome: "El equipo cierra mas rapido porque siempre hay contexto y responsable.",
                },
              ],
            },
            {
              id: "leads_widget",
              label: "Leads Widget",
              title: "Demo Leads Widget",
              subtitle: "El trafico web se filtra antes de pasar a ventas, asi tu equipo solo recibe conversaciones con potencial real.",
              purpose: "Proteger la inversion en anuncios y reducir ruido comercial de contactos no utiles.",
              idealFor: "Equipos de marketing inmobiliario y negocios con trafico pagado y ticket promedio mayor a S/500.",
              result: "Menor costo por lead util y mas oportunidades calificadas en el embudo.",
              chatTitle: "Chat del widget web",
              panelTitle: "Resultado de lead calificado",
              steps: [
                {
                  id: "widget-step-1",
                  title: "1. Visitante abre widget",
                  chatLine: "Hola, busco un departamento de 3 cuartos en Miraflores.",
                  panelLine: "Origen del lead capturado con datos de campana y canal de atribucion",
                  outcome: "Gerencia identifica que campanas si producen ventas con trazabilidad real.",
                },
                {
                  id: "widget-step-2",
                  title: "2. Precalificacion automatica",
                  chatLine: "Mi presupuesto es S/480k y quiero mudarme este trimestre.",
                  panelLine: "Score de intencion alto + perfil 92% completo + urgencia validada",
                  outcome: "El tiempo del asesor se concentra en leads con mayor probabilidad de cierre.",
                },
                {
                  id: "widget-step-3",
                  title: "3. Derivacion a WhatsApp",
                  chatLine: "Perfecto, conectame ahora con un asesor.",
                  panelLine: "Handoff a WhatsApp con contexto precargado y atribucion de campana",
                  outcome: "El asesor entra preparado y acelera el paso a cierre.",
                },
              ],
            },
            {
              id: "lead_chat",
              label: "Lead Chat",
              title: "Demo Lead Chat",
              subtitle: "Con un enlace publico capturas y calificas conversaciones desde anuncios y redes, sin depender de web propia.",
              purpose: "Lanzar un canal comercial escalable en minutos con conversion medible.",
              idealFor: "Proyectos inmobiliarios y negocios de ticket alto que venden por redes sin depender de web completa.",
              result: "Salida rapida al mercado y mayor recuperacion de leads con intencion real.",
              chatTitle: "Flujo Lead Chat publico",
              panelTitle: "Resultado de conversion de conversacion",
              steps: [
                {
                  id: "chat-step-1",
                  title: "1. Lead abre enlace publico",
                  chatLine: "Hola, vengo del anuncio y quiero opciones cerca a San Isidro.",
                  panelLine: "Conversacion iniciada desde enlace publico con fuente capturada",
                  outcome: "Monetizas trafico social de inmediato sin esperar desarrollo web.",
                },
                {
                  id: "chat-step-2",
                  title: "2. Calificacion guiada",
                  chatLine: "Puedo invertir S/520k y estoy listo para visitar esta semana.",
                  panelLine: "Intencion validada + presupuesto confirmado + etapa en contacted",
                  outcome: "Sube la calidad de calificacion con criterio comercial consistente.",
                },
                {
                  id: "chat-step-3",
                  title: "3. Accion para asesor",
                  chatLine: "Perfecto, seguimos por WhatsApp.",
                  panelLine: "Contacto CRM creado + asesor asignado + tarea de seguimiento",
                  outcome: "Cada conversacion calificada entra al embudo con responsable y proximo paso.",
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
                { label: "Effective contact rate", before: "42%", after: "71%" },
                { label: "Avg first response", before: "18 min", after: "4 min" },
                { label: "Expected monthly closes", before: "9", after: "14" },
              ],
              onboarding: [
                "Install extension and login in WhatsWidget.",
                "Import CSV or create contacts manually.",
                "Move leads by stage and schedule reminders.",
              ],
              compliance:
                "No auto-send. Every outbound action is manually confirmed and campaigns are sent only to opted-in leads.",
              roi: "With 120 monthly leads and ticket S/3,500, this lift projects +S/17,500 monthly gross revenue. For operations above S/500 average ticket, one extra close often pays the plan.",
              pipelineStages: ["New", "Contacted", "Visit", "Offer", "Close"],
              pipelineGoal: "Manager goal: 100% of active leads with owner + next action.",
            },
            leads_widget: {
              kpis: [
                { label: "Lead profile completeness", before: "41%", after: "88%" },
                { label: "Cost per useful lead", before: "S/62", after: "S/39" },
                { label: "Qualified appointments / month", before: "22", after: "34" },
              ],
              onboarding: [
                "Paste widget script on your website.",
                "Enable quick replies and pre-qualification fields.",
                "Sync qualified leads directly into CRM pipeline.",
              ],
              compliance:
                "The widget captures consent and routes to WhatsApp with manual send confirmation by your team.",
              roi: "Same ad spend, but stronger quality raises expected monthly pipeline value by +S/26,000. Works best when your average ticket is above S/500.",
              pipelineStages: ["Visitor", "Qualified", "WhatsApp", "Follow-up", "Closed"],
              pipelineGoal: "Manager goal: keep sales queue focused only on high-intent leads.",
            },
            lead_chat: {
              kpis: [
                { label: "Go-live time without website", before: "14 days", after: "1 day" },
                { label: "Recovered leads from social channels", before: "0", after: "+58 / month" },
                { label: "Handoff speed to advisors", before: "2h", after: "12 min" },
              ],
              onboarding: [
                "Create your public Lead Chat link.",
                "Share it in ads, bio, and social campaigns.",
                "Convert conversations into CRM contacts and tasks.",
              ],
              compliance:
                "Lead Chat keeps a compliant flow: no auto-send and explicit user action before final handoff.",
              roi: "Without website dependency, teams activate a new revenue channel in under one day. It is especially profitable for average ticket above S/500.",
              pipelineStages: ["Open link", "Qualified", "Assigned", "Follow-up", "Won/Lost"],
              pipelineGoal: "Manager goal: every qualified chat assigned in less than 15 minutes.",
            },
          }
        : {
            crm_whatsapp: {
              kpis: [
                { label: "Tasa de contacto efectivo", before: "42%", after: "71%" },
                { label: "Primera respuesta promedio", before: "18 min", after: "4 min" },
                { label: "Cierres mensuales estimados", before: "9", after: "14" },
              ],
              onboarding: [
                "Instala la extension e inicia sesion en WhatsWidget.",
                "Importa CSV o crea contactos manualmente.",
                "Mueve leads por etapa y programa recordatorios.",
              ],
              compliance:
                "Sin auto-envio. Cada salida se confirma manualmente y las campanas se envian solo a leads opted_in.",
              roi: "Con 120 leads al mes y ticket de S/3,500, la mejora proyecta +S/17,500 de ingreso bruto mensual. En operaciones con ticket promedio mayor a S/500, un cierre extra suele pagar el plan.",
              pipelineStages: ["Nuevo", "Contactado", "Visita", "Oferta", "Cierre"],
              pipelineGoal: "Meta gerencial: 100% de leads activos con responsable y siguiente accion.",
            },
            leads_widget: {
              kpis: [
                { label: "Perfil completo del lead", before: "41%", after: "88%" },
                { label: "Costo por lead util", before: "S/62", after: "S/39" },
                { label: "Citas calificadas / mes", before: "22", after: "34" },
              ],
              onboarding: [
                "Pega el script del widget en tu web.",
                "Activa respuestas rapidas y campos de precalificacion.",
                "Sincroniza leads calificados directo al pipeline CRM.",
              ],
              compliance:
                "El widget captura consentimiento y deriva a WhatsApp con confirmacion manual de envio por tu equipo.",
              roi: "Con la misma inversion en anuncios, mejoras calidad y elevas el valor mensual del pipeline en +S/26,000. Funciona mejor cuando el ticket promedio supera S/500.",
              pipelineStages: ["Visitante", "Calificado", "WhatsApp", "Seguimiento", "Cerrado"],
              pipelineGoal: "Meta gerencial: mantener cola comercial enfocada solo en leads de alta intencion.",
            },
            lead_chat: {
              kpis: [
                { label: "Tiempo de salida sin web", before: "14 dias", after: "1 dia" },
                { label: "Leads recuperados desde redes", before: "0", after: "+58 / mes" },
                { label: "Velocidad de derivacion a asesores", before: "2h", after: "12 min" },
              ],
              onboarding: [
                "Crea tu enlace publico de Lead Chat.",
                "Compartelo en anuncios, bio y campañas en redes.",
                "Convierte conversaciones en contactos y tareas CRM.",
              ],
              compliance:
                "Lead Chat mantiene un flujo de cumplimiento: sin auto-envio y accion explicita del usuario antes del handoff final.",
              roi: "Sin depender de web, tu equipo activa un nuevo canal de ingresos en menos de un dia. Es especialmente rentable para tickets promedio mayores a S/500.",
              pipelineStages: ["Abre enlace", "Calificado", "Asignado", "Seguimiento", "Ganado/Perdido"],
              pipelineGoal: "Meta gerencial: toda conversacion calificada asignada en menos de 15 minutos.",
            },
          },
    [isEn],
  );

  const capabilities = isEn
    ? [
        {
          title: "Revenue pipeline visibility in one screen",
          body: "Leadership sees every opportunity by stage, value and owner to decide faster and with less uncertainty.",
        },
        {
          title: "Commercial discipline by stage",
          body: "Every lead keeps a next action and deadline, reducing forgotten follow-up and commercial leakage.",
        },
        {
          title: "Higher-quality leads for your sales team",
          body: "Leads Widget filters intent before handoff so advisors spend time where close probability is higher.",
        },
        {
          title: "Faster response without losing quality",
          body: "Shared context, notes and ready-to-use messages help advisors answer quickly with consistent standards.",
        },
        {
          title: "Measurable team accountability",
          body: "You can track response times, workload and bottlenecks per advisor to improve execution each week.",
        },
        {
          title: "Campaign budget protection",
          body: "Attribution by source and campaign shows where profitable leads come from and where spend should be reduced.",
        },
        {
          title: "Compliant communication from day one",
          body: "No automatic sending. Every outbound action is manually confirmed to protect your business operation.",
        },
        {
          title: "Fast onboarding with your current data",
          body: "Import existing contacts and start operating in minutes without waiting for heavy implementation projects.",
        },
      ]
    : [
        {
          title: "Visibilidad del embudo en una sola pantalla",
          body: "Gerencia ve cada oportunidad por etapa, valor y responsable para decidir con mas velocidad y menos incertidumbre.",
        },
        {
          title: "Disciplina comercial por etapas",
          body: "Cada lead mantiene siguiente accion y fecha, reduciendo olvidos y fuga comercial.",
        },
        {
          title: "Leads de mayor calidad para ventas",
          body: "Leads Widget filtra intencion antes del handoff para que los asesores inviertan tiempo donde hay mas cierre.",
        },
        {
          title: "Respuesta mas rapida sin bajar calidad",
          body: "Contexto compartido, notas y mensajes listos ayudan a responder rapido con estandar comercial consistente.",
        },
        {
          title: "Responsabilidad medible por asesor",
          body: "Puedes medir tiempos de respuesta, carga de trabajo y cuellos de botella para mejorar ejecucion semanal.",
        },
        {
          title: "Proteccion de inversion en campanas",
          body: "La atribucion por canal y campana muestra donde vienen leads rentables y donde conviene recortar gasto.",
        },
        {
          title: "Comunicacion en cumplimiento desde el inicio",
          body: "Sin envio automatico. Cada salida se confirma manualmente para proteger la operacion.",
        },
        {
          title: "Onboarding rapido con tu data actual",
          body: "Importa tus contactos y empieza a operar en minutos sin proyectos largos de implementacion.",
        },
      ];

  const useCases = isEn
    ? [
        "Real estate agencies, brokers and project sales teams",
        "Any product/service business with average ticket above S/500",
        "CEOs that need weekly visibility of pipeline health and expected revenue",
        "Commercial managers with teams overloaded by WhatsApp lead volume",
        "Businesses investing in ads that need better quality per lead",
        "Teams that need clear accountability by advisor and response SLA",
        "Companies seeking compliant growth without risky automation",
      ]
    : [
        "Inmobiliarias, brokers y equipos de venta de proyectos",
        "Cualquier negocio de producto/servicio con ticket promedio mayor a S/500",
        "CEOs que necesitan visibilidad semanal del embudo y del ingreso esperado",
        "Gerencias comerciales con equipos saturados por volumen de WhatsApp",
        "Negocios que invierten en anuncios y necesitan mejor calidad por lead",
        "Equipos que requieren responsabilidad clara por asesor y SLA de respuesta",
        "Empresas que buscan crecer con cumplimiento sin automatizacion riesgosa",
      ];

  const conversionBullets = isEn
    ? ["Real estate-first commercial flow", "Profitable when avg ticket is > S/500", "Grow revenue with measurable execution"]
    : ["Flujo comercial pensado para inmobiliarias", "Rentable cuando el ticket promedio es > S/500", "Crece en facturacion con ejecucion medible"];

  const heroExecutiveMetrics = isEn
    ? [
        {
          icon: DollarSign,
          value: "S/ 28,400",
          label: "Potential monthly revenue recovered",
          detail: "Simulated for real estate operations and high-ticket sales",
        },
        {
          icon: Clock3,
          value: "18 min -> 4 min",
          label: "First response improvement",
          detail: "When team follows owner + next action discipline",
        },
        {
          icon: Users2,
          value: "-62%",
          label: "Commercial leakage reduction",
          detail: "Common in teams with average ticket above S/500",
        },
      ]
    : [
        {
          icon: DollarSign,
          value: "S/ 28,400",
          label: "Ingreso mensual recuperable",
          detail: "Simulacion para inmobiliarias y ventas de ticket alto",
        },
        {
          icon: Clock3,
          value: "18 min -> 4 min",
          label: "Mejora en primera respuesta",
          detail: "Cuando el equipo usa responsable y siguiente accion",
        },
        {
          icon: Users2,
          value: "-62%",
          label: "Reduccion de fuga comercial",
          detail: "Frecuente en equipos con ticket promedio mayor a S/500",
        },
      ];

  const testimonials = useMemo<LandingTestimonial[]>(
    () =>
      isEn
        ? [
            {
              quote:
                "In less than 60 days we stopped running sales blindly. Now we see expected revenue by stage and correct execution before month-end.",
              name: "Marcela Contreras",
              role: "CEO, Andina Homes",
              result: "+S/96k quarterly revenue",
              avatar: "https://i.pravatar.cc/160?img=52",
            },
            {
              quote:
                "Leads Widget gave us cleaner demand. We reduced low-value conversations and our advisors started closing with better focus.",
              name: "Jorge Alvarado",
              role: "Commercial Manager, Optima Seguros",
              result: "-37% cost per sale",
              avatar: "https://i.pravatar.cc/160?img=12",
            },
            {
              quote:
                "Lead Chat let us launch and sell before finishing our website. We captured qualified demand from ads and turned it into real appointments.",
              name: "Renzo Paredes",
              role: "Founder, Nova Salud",
              result: "+52 qualified leads / month",
              avatar: "https://i.pravatar.cc/160?img=33",
            },
            {
              quote:
                "What convinced us was control: each advisor now has clear ownership and leadership can see execution quality every week.",
              name: "Carla Mendez",
              role: "General Manager, Urbantia",
              result: "+29% close rate",
              avatar: "https://i.pravatar.cc/160?img=45",
            },
          ]
        : [
            {
              quote:
                "En menos de 60 dias dejamos de vender a ciegas. Ahora vemos ingreso esperado por etapa y corregimos ejecucion antes de fin de mes.",
              name: "Marcela Contreras",
              role: "CEO, Andina Homes",
              result: "+S/96k facturacion trimestral",
              avatar: "https://i.pravatar.cc/160?img=52",
            },
            {
              quote:
                "Leads Widget nos dio demanda mas limpia. Bajamos conversaciones de poco valor y los asesores empezaron a cerrar con mejor foco.",
              name: "Jorge Alvarado",
              role: "Gerente Comercial, Optima Seguros",
              result: "-37% costo por venta",
              avatar: "https://i.pravatar.cc/160?img=12",
            },
            {
              quote:
                "Lead Chat nos permitio salir a vender antes de terminar la web. Capturamos demanda calificada desde anuncios y la convertimos en citas reales.",
              name: "Renzo Paredes",
              role: "Founder, Nova Salud",
              result: "+52 leads calificados / mes",
              avatar: "https://i.pravatar.cc/160?img=33",
            },
            {
              quote:
                "Lo que nos convencio fue el control: cada asesor tiene responsable claro y gerencia puede revisar calidad de ejecucion cada semana.",
              name: "Carla Mendez",
              role: "Gerente General, Urbantia",
              result: "+29% tasa de cierre",
              avatar: "https://i.pravatar.cc/160?img=45",
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
    crm_whatsapp: { leads: 180, closeRate: 7, lift: 4, ticket: 3900 },
    leads_widget: { leads: 260, closeRate: 5, lift: 3, ticket: 3200 },
    lead_chat: { leads: 190, closeRate: 4, lift: 3, ticket: 2900 },
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
    const defaultMessage = "Hola Leads Widget, quiero activar el sistema para mi inmobiliaria (o negocio con ticket promedio > S/500) y revisar proyeccion de resultados.";
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
        <div className="mx-auto grid w-full max-w-[1160px] gap-10 lg:grid-cols-[1.02fr_0.98fr] lg:items-center">
          <div className="space-y-6">
            <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] ${isLandingDark ? "border-cyan-400/40 bg-cyan-400/10 text-cyan-100" : "border-cyan-200 bg-cyan-50 text-cyan-700"}`}>
              <Sparkles className="h-3.5 w-3.5" />
              {copy.heroBadge}
            </span>
            <h1 className={`text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl ${isLandingDark ? "text-slate-100" : "text-slate-950"}`}>
              {copy.heroTitle}
            </h1>
            <p className={`max-w-2xl text-base leading-relaxed sm:text-lg ${isLandingDark ? "text-slate-300" : "text-slate-600"}`}>
              {copy.heroSubtitle}
            </p>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                type="button"
                size="xl"
                className="w-full rounded-full px-8 text-white sm:w-auto"
                onClick={() => openWhatsAppCta()}
              >
                {copy.ctaPrimary}
              </Button>
              <Button
                size="xl"
                variant="outline"
                className={`w-full rounded-full px-8 sm:w-auto ${isLandingDark ? "border-slate-700 text-slate-100 hover:bg-slate-800" : "border-slate-300 text-slate-800 hover:bg-slate-100"}`}
                onClick={() => openWhatsAppCta()}
              >
                <Play className="mr-2 h-4 w-4" />
                {copy.ctaSecondary}
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
              {heroExecutiveMetrics.map((metric) => (
                <article key={metric.label} className={`rounded-2xl border p-4 ${isLandingDark ? "border-slate-800 bg-slate-900/80" : "border-slate-200/80 bg-white/80"}`}>
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-lg font-semibold">{metric.value}</p>
                    <span className={`grid h-7 w-7 place-items-center rounded-lg ${isLandingDark ? "bg-slate-800 text-cyan-200" : "bg-cyan-50 text-cyan-700"}`}>
                      <metric.icon className="h-4 w-4" />
                    </span>
                  </div>
                  <p className={`mt-2 text-xs font-semibold uppercase tracking-[0.08em] ${isLandingDark ? "text-slate-300" : "text-slate-700"}`}>
                    {metric.label}
                  </p>
                  <p className={`mt-1 text-[11px] leading-relaxed ${isLandingDark ? "text-slate-400" : "text-slate-500"}`}>
                    {metric.detail}
                  </p>
                </article>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className={`pointer-events-none absolute inset-0 rounded-[34px] bg-gradient-to-br blur-2xl ${isLandingDark ? "from-cyan-500/20 via-indigo-500/15 to-emerald-500/20" : "from-cyan-300/30 via-indigo-300/20 to-emerald-300/25"}`} />
            <div className={`relative rounded-[32px] border p-3 shadow-[0_35px_90px_-45px_rgba(14,116,144,0.45)] backdrop-blur-xl ${isLandingDark ? "border-slate-700/80 bg-slate-900/70" : "border-white/70 bg-white/85"}`}>
              <div className={`overflow-hidden rounded-[26px] border ${isLandingDark ? "border-slate-700 bg-[#061326]" : "border-slate-200/70 bg-[#061326]"}`}>
                <div className="crm-wa-preview">
                  <aside className="flex flex-col items-center gap-4 border-r border-slate-800/80 bg-slate-950/85 pt-4">
                    {[MessageCircle, BarChart3, Target, ShieldCheck].map((Icon, idx) => (
                      <span
                        key={`rail-${idx}`}
                        className="grid h-8 w-8 place-items-center rounded-lg border border-slate-700/80 bg-slate-900/80 text-slate-300"
                      >
                        <Icon className="h-4 w-4" />
                      </span>
                    ))}
                  </aside>

                  <aside className="relative border-r border-slate-800/80 bg-[#0f1722] p-3 text-slate-200">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-cyan-200">
                      {isEn ? "Performance focus" : "Enfoque de rendimiento"}
                    </p>
                    <div className="mt-3 space-y-2 text-[11px]">
                      {[
                        isEn ? "CRM WhatsApp live" : "CRM WhatsApp activo",
                        isEn ? "Leads Widget filtering" : "Leads Widget filtrando",
                        isEn ? "Lead Chat acquisition" : "Lead Chat captacion",
                        isEn ? "Campaign quality score" : "Score de calidad de campana",
                      ].map((item, idx) => (
                        <div key={item} className={`rounded-xl border px-2.5 py-2 ${idx === 0 ? "border-cyan-400/60 bg-cyan-500/15 text-cyan-100" : "border-slate-700/80 bg-slate-900/55 text-slate-300"}`}>
                          {item}
                        </div>
                      ))}
                    </div>
                    <div className="crm-wa-pixel-mask inset-x-2 bottom-4 top-[146px]" />
                  </aside>

                  <section className="relative overflow-hidden bg-[#0a121b] p-4">
                    <div className="flex items-center justify-between rounded-xl border border-slate-700/70 bg-slate-900/80 px-3 py-2 text-slate-100">
                      <div>
                        <p className="text-sm font-semibold">{isEn ? "Executive Command Center" : "Tablero ejecutivo comercial"}</p>
                        <p className="mt-1 text-[10px] uppercase tracking-[0.15em] text-slate-400">
                          {isEn ? "Real-time operation snapshot" : "Snapshot de operacion en tiempo real"}
                        </p>
                      </div>
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-1 text-[10px] font-semibold text-emerald-200">
                        <TrendingUp className="h-3 w-3" />
                        {isEn ? "Growth trend +18%" : "Tendencia +18%"}
                      </span>
                    </div>

                    <div className="mt-3 grid gap-2 sm:grid-cols-3">
                      <article className="rounded-xl border border-slate-700/80 bg-slate-900/70 px-3 py-2">
                        <p className="text-[10px] uppercase tracking-[0.12em] text-slate-400">{isEn ? "Pipeline value" : "Valor pipeline"}</p>
                        <p className="mt-1 text-sm font-semibold text-emerald-200">S/ 412,000</p>
                      </article>
                      <article className="rounded-xl border border-slate-700/80 bg-slate-900/70 px-3 py-2">
                        <p className="text-[10px] uppercase tracking-[0.12em] text-slate-400">{isEn ? "First response SLA" : "SLA primera respuesta"}</p>
                        <p className="mt-1 text-sm font-semibold text-cyan-200">4m 12s</p>
                      </article>
                      <article className="rounded-xl border border-slate-700/80 bg-slate-900/70 px-3 py-2">
                        <p className="text-[10px] uppercase tracking-[0.12em] text-slate-400">{isEn ? "Close projection" : "Proyeccion de cierre"}</p>
                        <p className="mt-1 text-sm font-semibold text-indigo-200">14 deals</p>
                      </article>
                    </div>

                    <div className="mt-3 rounded-xl border border-slate-700/80 bg-slate-900/70 p-3">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold text-slate-100">{isEn ? "Pipeline by stage" : "Embudo por etapa"}</p>
                        <p className="text-[10px] text-slate-400">{isEn ? "Week target: 22 meetings" : "Meta semanal: 22 citas"}</p>
                      </div>
                      <div className="mt-2 grid gap-2 sm:grid-cols-4">
                        {[
                          { stage: isEn ? "Contacted" : "Contactado", value: 58 },
                          { stage: isEn ? "Qualified" : "Calificado", value: 37 },
                          { stage: isEn ? "Visit" : "Visita", value: 21 },
                          { stage: isEn ? "Offer" : "Oferta", value: 12 },
                        ].map((item) => (
                          <div key={item.stage} className="rounded-lg border border-slate-700/70 bg-slate-950/70 px-2 py-2">
                            <p className="text-[10px] uppercase tracking-[0.08em] text-slate-400">{item.stage}</p>
                            <p className="mt-1 text-sm font-semibold text-slate-100">{item.value}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      <article className="rounded-xl border border-slate-700/80 bg-slate-900/70 p-3">
                        <p className="text-xs font-semibold text-slate-100">Leads Widget</p>
                        <p className="mt-1 text-[11px] text-slate-300">
                          {isEn ? "Real-estate and high-ticket campaigns reduce noise from 52% to 19%." : "Campanas inmobiliarias y de ticket alto reducen ruido de 52% a 19%."}
                        </p>
                      </article>
                      <article className="rounded-xl border border-slate-700/80 bg-slate-900/70 p-3">
                        <p className="text-xs font-semibold text-slate-100">Lead Chat</p>
                        <p className="mt-1 text-[11px] text-slate-300">
                          {isEn ? "Go-live in 1 day, ideal for businesses with average ticket above S/500." : "Salida en 1 dia, ideal para negocios con ticket promedio mayor a S/500."}
                        </p>
                      </article>
                    </div>
                  </section>
                </div>
              </div>
            </div>

            <article className={`absolute -top-4 left-6 hidden rounded-2xl border px-4 py-3 shadow-lg lg:block ${isLandingDark ? "border-slate-700 bg-slate-900/90" : "border-slate-200 bg-white/95"}`}>
              <p className="text-[10px] uppercase tracking-[0.12em] text-slate-500">{isEn ? "CEO snapshot" : "Snapshot CEO"}</p>
              <p className="mt-1 text-sm font-semibold">{isEn ? "Team execution score: 87/100" : "Score de ejecucion: 87/100"}</p>
            </article>
            <article className={`absolute -bottom-4 right-5 hidden rounded-2xl border px-4 py-3 shadow-lg lg:block ${isLandingDark ? "border-emerald-500/50 bg-emerald-500/15 text-emerald-100" : "border-emerald-200 bg-emerald-50 text-emerald-800"}`}>
              <p className="text-[10px] uppercase tracking-[0.12em]">{isEn ? "Projected net monthly gain" : "Neto mensual proyectado"}</p>
              <p className="mt-1 text-sm font-semibold">+S/ 18,900</p>
            </article>
          </div>
        </div>
      </section>

      <section className={`relative z-10 border-y px-4 py-14 sm:px-6 lg:py-16 ${isLandingDark ? "border-slate-800/70 bg-slate-900/60" : "border-slate-200/70 bg-white/75"}`}>
        <div className="mx-auto grid w-full max-w-[1160px] gap-8 lg:grid-cols-[0.46fr_0.54fr]">
          <div>
            <p className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] ${isLandingDark ? "border-cyan-400/30 bg-cyan-400/10 text-cyan-200" : "border-cyan-200 bg-cyan-50 text-cyan-700"}`}>
              {isEn ? "Real Estate + High-Ticket Simulator" : "Simulador inmobiliario y ticket alto"}
            </p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight">
              {isEn ? "Project monthly impact before switching your sales operation" : "Proyecta impacto mensual antes de cambiar tu operacion comercial"}
            </h2>
            <p className={`mt-3 text-sm leading-relaxed ${isLandingDark ? "text-slate-300" : "text-slate-600"}`}>
              {isEn
                ? "Compare CRM WhatsApp, Leads Widget and Lead Chat with before/after metrics, ROI simulation and operational checkpoints. Built for real estate, and valid for any business with average ticket above S/500."
                : "Compara CRM WhatsApp, Leads Widget y Lead Chat con metricas antes/despues, simulacion ROI y puntos de control operativos. Creado para inmobiliarias y valido para cualquier negocio con ticket promedio mayor a S/500."}
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
                <p className="text-sm font-semibold">{isEn ? "Risk control + ROI view" : "Control de riesgo + ROI"}</p>
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
                <p className="text-sm font-semibold">{isEn ? "Business impact calculator" : "Calculadora de impacto de negocio"}</p>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${isLandingDark ? "bg-emerald-500/15 text-emerald-200" : "bg-emerald-100 text-emerald-700"}`}>
                  {isEn ? `Plan considered: S/${currentDemoPlanPrice}` : `Plan considerado: S/${currentDemoPlanPrice}`}
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
                  ? "Decision support simulation. Final results depend on execution quality, sales team discipline and traffic source."
                  : "Simulacion para apoyar decision. El resultado final depende de la calidad de ejecucion, disciplina comercial y fuente de trafico."}
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
              <h3 className="mt-4 text-2xl font-semibold">{isEn ? "Control execution, improve close rate" : "Controla ejecucion y mejora cierre"}</h3>
              <p className={`mt-3 text-sm leading-relaxed ${isLandingDark ? "text-slate-300" : "text-slate-600"}`}>{isEn ? "Transform dispersed chats into an accountable pipeline with owner, stage and expected value." : "Transforma chats dispersos en un embudo con responsable, etapa y valor esperado."}</p>
            </article>
            <article className={`rounded-3xl border p-6 ${isLandingDark ? "border-slate-800 bg-slate-900/70" : "border-slate-200/80 bg-white/85"}`}>
              <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] ${isLandingDark ? "bg-emerald-400/15 text-emerald-200" : "bg-emerald-50 text-emerald-700"}`}>Widget embebido</span>
              <h3 className="mt-4 text-2xl font-semibold">{isEn ? "Protect ad budget quality" : "Protege calidad del presupuesto ads"}</h3>
              <p className={`mt-3 text-sm leading-relaxed ${isLandingDark ? "text-slate-300" : "text-slate-600"}`}>{isEn ? "Filter intent before sales handoff so your team focuses on leads with higher probability to buy." : "Filtra intencion antes del handoff para que ventas enfoque tiempo en leads con mayor probabilidad de compra."}</p>
            </article>
            <article className={`rounded-3xl border p-6 ${isLandingDark ? "border-slate-800 bg-slate-900/70" : "border-slate-200/80 bg-white/85"}`}>
              <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] ${isLandingDark ? "bg-cyan-400/15 text-cyan-200" : "bg-cyan-50 text-cyan-700"}`}>Lead Chat publico</span>
              <h3 className="mt-4 text-2xl font-semibold">{isEn ? "Launch faster without website dependency" : "Lanza mas rapido sin depender de web"}</h3>
              <p className={`mt-3 text-sm leading-relaxed ${isLandingDark ? "text-slate-300" : "text-slate-600"}`}>{isEn ? "Activate one public link to capture demand from social channels and convert it into pipeline." : "Activa un enlace publico para capturar demanda desde redes y convertirla en pipeline comercial."}</p>
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
                ? "Choose by growth stage: execution control only, or full acquisition stack. Built for real estate and profitable for businesses with average ticket above S/500."
                : "Elige segun tu etapa de crecimiento: control de ejecucion o stack completo de captacion. Pensado para inmobiliarias y rentable para negocios con ticket promedio mayor a S/500."}
            </p>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-2">
            <article className={`rounded-3xl border p-6 ${isLandingDark ? "border-cyan-700/70 bg-slate-900/75" : "border-cyan-200 bg-cyan-50/70"}`}>
              <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] ${isLandingDark ? "bg-cyan-500/20 text-cyan-200" : "bg-cyan-100 text-cyan-700"}`}>
                {isEn ? "CRM WhatsApp" : "CRM WhatsApp"}
              </span>
              <h3 className="mt-4 text-2xl font-semibold">{isEn ? "CRM WhatsApp plan" : "Plan CRM WhatsApp"}</h3>
              <p className={`mt-3 text-sm leading-relaxed ${isLandingDark ? "text-slate-300" : "text-slate-600"}`}>
                {isEn ? "Ideal for real estate teams and high-ticket businesses that need execution control in WhatsApp." : "Ideal para equipos inmobiliarios y negocios de ticket alto que necesitan control de ejecucion en WhatsApp."}
              </p>
              <ul className={`mt-4 space-y-2 text-sm ${isLandingDark ? "text-slate-300" : "text-slate-600"}`}>
                {(isEn
                  ? [
                      "Commercial pipeline with owner, stage and expected value",
                      "Follow-up discipline with reminders and accountability",
                      "Faster responses with shared context and reusable templates",
                      "Compliance-first operation with manual outbound confirmation",
                    ]
                  : [
                      "Pipeline comercial con responsable, etapa y valor esperado",
                      "Disciplina de seguimiento con recordatorios y responsables",
                      "Respuestas mas rapidas con contexto compartido y plantillas",
                      "Operacion en cumplimiento con confirmacion manual de salida",
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
                {isEn ? "Full stack for real estate growth and any product/service business with average ticket above S/500." : "Stack completo para crecimiento inmobiliario y para negocios de producto/servicio con ticket promedio mayor a S/500."}
              </p>
              <ul className={`mt-4 space-y-2 text-sm ${isLandingDark ? "text-slate-300" : "text-slate-600"}`}>
                {(isEn
                  ? [
                      "Everything from CRM WhatsApp plan",
                      "Leads Widget to increase paid traffic quality",
                      "Public Lead Chat for social channels and no-website setups",
                      "Business simulator, segmentation and onboarding acceleration",
                    ]
                  : [
                      "Todo lo del plan CRM WhatsApp",
                      "Leads Widget para mejorar calidad de trafico pagado",
                      "Lead Chat publico para redes y escenarios sin web",
                      "Simulador de negocio, segmentacion y onboarding acelerado",
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
            {isEn ? "Current offer: CRM WhatsApp S/50 or full PRO stack S/99 per month. Best ROI when average ticket is above S/500." : "Oferta actual: CRM WhatsApp S/50 o stack PRO completo S/99 al mes. Mayor retorno cuando tu ticket promedio supera S/500."}
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
          <div><p className="text-sm font-semibold">WhatsWidget</p><p className={`text-sm ${isLandingDark ? "text-slate-400" : "text-slate-600"}`}>{isEn ? "Commercial system for WhatsApp focused on measurable growth, execution discipline and compliant operations." : "Sistema comercial para WhatsApp enfocado en crecimiento medible, disciplina de ejecucion y operacion en cumplimiento."}</p></div>
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
