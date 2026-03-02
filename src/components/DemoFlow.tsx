import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, ChevronRight, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type DemoFlowModuleId = "crm_whatsapp" | "leads_widget" | "lead_chat";

type DemoFlowProps = {
  moduleId: DemoFlowModuleId;
  isDark: boolean;
  isEn: boolean;
};

type FlowStep = {
  title: string;
  hint: string;
};

type FlowConfig = {
  shellLabel: string;
  microSummary: string;
  steps: FlowStep[];
};

export function DemoFlow({ moduleId, isDark, isEn }: DemoFlowProps) {
  const flows = useMemo<Record<DemoFlowModuleId, FlowConfig>>(
    () =>
      isEn
        ? {
            crm_whatsapp: {
              shellLabel: "WhatsWidget executive demo",
              microSummary: "Show leadership how response speed and pipeline control look in practice.",
              steps: [
                {
                  title: "1. Lead arrives",
                  hint: "A paid lead enters, the team is alerted instantly, and no warm demand gets ignored.",
                },
                {
                  title: "2. Qualification and pipeline",
                  hint: "The advisor qualifies the lead and management gets a visible pipeline stage with accountability.",
                },
                {
                  title: "3. Handoff and close",
                  hint: "The opportunity is closed with a clear summary, so revenue is measurable instead of guessed.",
                },
              ],
            },
            leads_widget: {
              shellLabel: "Leads Widget executive demo",
              microSummary: "Show how paid traffic gets filtered before it consumes sales time.",
              steps: [
                {
                  title: "1. Visitor opens widget",
                  hint: "The visitor enters from your website and the buying context is captured from the first second.",
                },
                {
                  title: "2. Pre-qualification",
                  hint: "The system filters budget, urgency and fit before sending low-quality demand to your team.",
                },
                {
                  title: "3. Ready for handoff",
                  hint: "Sales receives a cleaner lead, better prepared to close and cheaper to manage.",
                },
              ],
            },
            lead_chat: {
              shellLabel: "Lead Chat executive demo",
              microSummary: "Show how to monetize social traffic even before a full website exists.",
              steps: [
                {
                  title: "1. Public page opens",
                  hint: "The lead enters through a public link, so campaigns can start converting immediately.",
                },
                {
                  title: "2. Qualification",
                  hint: "Budget and intent are validated in the conversation before an advisor invests time.",
                },
                {
                  title: "3. Advisor handoff",
                  hint: "Only qualified conversations move to the next step, improving commercial efficiency.",
                },
              ],
            },
          }
        : {
            crm_whatsapp: {
              shellLabel: "Demo ejecutiva WhatsWidget",
              microSummary: "Muestra a gerencia como se ve en real una operacion con mas control y respuesta rapida.",
              steps: [
                {
                  title: "1. Llega el lead",
                  hint: "Entra un lead pagado, el equipo se entera al instante y no se enfria demanda valiosa.",
                },
                {
                  title: "2. Calificacion y pipeline",
                  hint: "El asesor califica y gerencia ve la etapa con responsable, seguimiento y orden comercial.",
                },
                {
                  title: "3. Handoff y cierre",
                  hint: "La oportunidad se cierra con resumen claro, para que el ingreso deje de depender de suposiciones.",
                },
              ],
            },
            leads_widget: {
              shellLabel: "Demo ejecutiva Leads Widget",
              microSummary: "Muestra como el trafico pagado se filtra antes de consumir tiempo comercial.",
              steps: [
                {
                  title: "1. Visitante abre widget",
                  hint: "El visitante entra desde tu web y el contexto de compra se captura desde el primer segundo.",
                },
                {
                  title: "2. Precalificacion",
                  hint: "El sistema filtra presupuesto, urgencia y ajuste antes de pasar demanda poco util al equipo.",
                },
                {
                  title: "3. Listo para handoff",
                  hint: "Ventas recibe un lead mas limpio, mas listo para cerrar y mas barato de gestionar.",
                },
              ],
            },
            lead_chat: {
              shellLabel: "Demo ejecutiva Lead Chat",
              microSummary: "Muestra como monetizar trafico de redes incluso antes de tener una web completa.",
              steps: [
                {
                  title: "1. Se abre la pagina publica",
                  hint: "El lead entra por un enlace publico, asi la campana empieza a convertir de inmediato.",
                },
                {
                  title: "2. Calificacion",
                  hint: "Se validan presupuesto e intencion antes de que un asesor invierta tiempo comercial.",
                },
                {
                  title: "3. Handoff al asesor",
                  hint: "Solo las conversaciones calificadas avanzan, mejorando eficiencia y foco del equipo.",
                },
              ],
            },
          },
    [isEn],
  );

  const [stepIndex, setStepIndex] = useState(0);
  const [renderedStepIndex, setRenderedStepIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  const currentFlow = flows[moduleId];
  const renderedStep = currentFlow.steps[renderedStepIndex];
  const isLastStep = stepIndex >= currentFlow.steps.length - 1;

  // Reset the demo when the selected tool changes.
  useEffect(() => {
    setStepIndex(0);
    setRenderedStepIndex(0);
    setIsVisible(true);
  }, [moduleId]);

  // Fade out, swap state, then fade in to simulate a guided UI transition.
  useEffect(() => {
    if (stepIndex === renderedStepIndex) return;

    let frame = 0;
    setIsVisible(false);

    const timeout = window.setTimeout(() => {
      setRenderedStepIndex(stepIndex);
      frame = window.requestAnimationFrame(() => setIsVisible(true));
    }, 180);

    return () => {
      window.clearTimeout(timeout);
      window.cancelAnimationFrame(frame);
    };
  }, [stepIndex, renderedStepIndex]);

  return (
    <div className={cn("relative overflow-hidden rounded-3xl border p-4", isDark ? "border-slate-700 bg-slate-950/90" : "border-slate-200 bg-slate-50/90")}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className={cn("text-[11px] font-semibold uppercase tracking-[0.12em]", isDark ? "text-slate-400" : "text-slate-500")}>
            {currentFlow.shellLabel}
          </p>
          <p className={cn("mt-1 text-[11px]", isDark ? "text-slate-400" : "text-slate-500")}>{currentFlow.microSummary}</p>
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="rounded-full"
            onClick={() => setStepIndex(0)}
          >
            <RotateCcw className="mr-1 h-3.5 w-3.5" />
            {isEn ? "Reset demo" : "Reiniciar demo"}
          </Button>
          <Button
            type="button"
            size="sm"
            className="rounded-full text-white"
            onClick={() => setStepIndex((prev) => Math.min(prev + 1, currentFlow.steps.length - 1))}
            disabled={isLastStep}
          >
            {isEn ? "Next" : "Siguiente"}
            <ChevronRight className="ml-1 h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {currentFlow.steps.map((step, index) => (
          <button
            key={step.title}
            type="button"
            onClick={() => setStepIndex(index)}
            className={cn(
              "rounded-full border px-3 py-1 text-[10px] font-semibold transition-colors",
              stepIndex === index
                ? isDark
                  ? "border-cyan-400/70 bg-cyan-500/15 text-cyan-100"
                  : "border-cyan-300 bg-cyan-50 text-cyan-800"
                : isDark
                  ? "border-slate-700 bg-slate-900 text-slate-300"
                  : "border-slate-200 bg-white text-slate-600",
            )}
          >
            {step.title}
          </button>
        ))}
      </div>

      <p className={cn("mt-3 text-xs leading-relaxed", isDark ? "text-slate-300" : "text-slate-600")}>
        {renderedStep.hint}
      </p>

      <div
        className={cn(
          "mt-4 transition-all duration-300 ease-out",
          isVisible ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0",
        )}
      >
        {moduleId === "crm_whatsapp" && (
          <WhatsWidgetFlow stepIndex={renderedStepIndex} isDark={isDark} isEn={isEn} />
        )}
        {moduleId === "leads_widget" && (
          <LeadsWidgetFlow stepIndex={renderedStepIndex} isDark={isDark} isEn={isEn} />
        )}
        {moduleId === "lead_chat" && (
          <LeadChatFlow stepIndex={renderedStepIndex} isDark={isDark} isEn={isEn} />
        )}
      </div>
    </div>
  );
}

function WhatsWidgetFlow({
  stepIndex,
  isDark,
  isEn,
}: {
  stepIndex: number;
  isDark: boolean;
  isEn: boolean;
}) {
  const leadStages = stepIndex === 0
    ? [isEn ? "New" : "Nuevo"]
    : stepIndex === 1
      ? [isEn ? "New" : "Nuevo", isEn ? "Contacted" : "Contactado", isEn ? "Qualified" : "Calificado"]
      : [isEn ? "Closed" : "Cerrado"];

  return (
    <div className="relative rounded-2xl border border-slate-700 bg-[#0b141a] p-3 text-slate-100">
      <div className="flex items-center justify-between rounded-lg bg-[#202c33] px-3 py-2 text-xs">
        <span>WhatsApp Web</span>
        <span className={cn("rounded-full px-2 py-0.5 text-[10px] transition-all duration-300", stepIndex > 0 ? "bg-emerald-500/30 text-emerald-100" : "bg-emerald-500/15 text-emerald-200")}>
          {isEn ? "CRM extension active" : "Extension CRM activa"}
        </span>
      </div>

      <div className="mt-3 grid gap-3 md:grid-cols-[0.34fr_0.46fr_0.2fr]">
        <aside className="rounded-xl border border-slate-700 bg-[#111b21] p-2">
          {[
            { name: "Lead Surco", active: true },
            { name: "Lead Miraflores", active: false },
            { name: "Lead San Isidro", active: false },
          ].map((item, index) => (
            <div
              key={item.name}
              className={cn(
                "mb-1 rounded-lg border px-2 py-1 text-[11px] transition-all duration-300 last:mb-0",
                item.active
                  ? stepIndex === 0
                    ? "border-cyan-300 bg-cyan-500/15 shadow-[0_0_0_1px_rgba(34,211,238,0.25)]"
                    : stepIndex === 2
                      ? "border-emerald-400/60 bg-emerald-500/15"
                      : "border-cyan-400/40 bg-cyan-500/10"
                  : "border-transparent bg-slate-800/80",
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <span>{item.name}</span>
                {index === 0 && stepIndex === 0 && (
                  <span className="inline-flex h-4 min-w-4 animate-pulse items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white">
                    1
                  </span>
                )}
                {index === 0 && stepIndex === 2 && (
                  <span className="rounded-full bg-emerald-500 px-1.5 py-0.5 text-[9px] font-semibold text-white">
                    {isEn ? "Won" : "Cerrado"}
                  </span>
                )}
              </div>
            </div>
          ))}
        </aside>

        <div className="rounded-xl border border-slate-700 bg-[#111b21] p-2">
          <div className="mb-2 max-w-[78%] rounded-xl rounded-bl-md bg-slate-700 px-2 py-1.5 text-[11px]">
            {isEn ? "Hi, I saw your property ad." : "Hola, vi tu anuncio de propiedad."}
          </div>
          <div className="ml-auto mb-2 max-w-[78%] rounded-xl rounded-br-md bg-emerald-600 px-2 py-1.5 text-[11px] text-white">
            {stepIndex < 2
              ? isEn
                ? "Perfect. I will move this lead in the pipeline."
                : "Perfecto. Muevo este lead en el pipeline."
              : isEn
                ? "Closed. Visit booked and opportunity marked as won."
                : "Cerrado. Visita agendada y oportunidad ganada."}
          </div>
          <div className="flex flex-wrap gap-1">
            {leadStages.map((stage, index) => (
              <span
                key={`${stage}-${index}`}
                className={cn(
                  "rounded-full px-2 py-0.5 text-[10px] font-semibold transition-all duration-300",
                  index === leadStages.length - 1
                    ? stepIndex === 2
                      ? "bg-emerald-500 text-white"
                      : "bg-cyan-500/15 text-cyan-100"
                    : "bg-slate-800 text-slate-300",
                )}
              >
                {stage}
              </span>
            ))}
          </div>
        </div>

        <div
          className={cn(
            "rounded-xl border border-slate-700 bg-[#111b21] p-2 text-[10px] transition-all duration-300",
            stepIndex > 0 ? "translate-x-0 opacity-100" : "translate-x-3 opacity-0",
          )}
        >
          <p className="font-semibold text-slate-100">{isEn ? "CRM panel" : "Panel CRM"}</p>
          <div className="mt-2 space-y-1 text-slate-300">
            <p>{isEn ? "Owner: Camila" : "Asesor: Camila"}</p>
            <p>{isEn ? "SLA: 4 min" : "SLA: 4 min"}</p>
            <p>{isEn ? "Stage sync active" : "Sync de etapa activo"}</p>
          </div>
        </div>
      </div>

      {stepIndex === 0 && (
        <div className="pointer-events-none absolute left-5 top-16 rounded-lg border border-amber-300/50 bg-amber-500/15 px-2 py-1 text-[10px] text-amber-100 shadow-lg">
          {isEn ? "New lead from ad. Team gets notified immediately." : "Nuevo lead desde anuncio. El equipo se entera al instante."}
        </div>
      )}

      {stepIndex === 2 && (
        <div className="mt-3 rounded-xl border border-emerald-400/40 bg-emerald-500/15 px-3 py-2 text-[11px] text-emerald-100">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            <span className="font-semibold">
              {isEn ? "Lead closed successfully" : "Lead cerrado con exito"}
            </span>
          </div>
          <p className="mt-1 text-emerald-100/90">
            {isEn ? "Summary: qualified, assigned and marked as won." : "Resumen: calificado, asignado y marcado como ganado."}
          </p>
        </div>
      )}
    </div>
  );
}

function LeadsWidgetFlow({
  stepIndex,
  isDark,
  isEn,
}: {
  stepIndex: number;
  isDark: boolean;
  isEn: boolean;
}) {
  return (
    <div className={cn("relative rounded-2xl border p-3", isDark ? "border-slate-700 bg-slate-900/80" : "border-slate-200 bg-white")}>
      <div className={cn("rounded-lg border px-3 py-2 text-xs", isDark ? "border-slate-700 bg-slate-900" : "border-slate-200 bg-slate-50")}>
        {isEn ? "Website page" : "Pagina web"}
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        {Array.from({ length: 6 }).map((_, idx) => (
          <div key={idx} className={cn("h-12 rounded-lg transition-all duration-300", isDark ? "bg-slate-800" : "bg-slate-100", stepIndex === 0 && idx === 4 && "ring-2 ring-cyan-300/70")} />
        ))}
      </div>

      <div className={cn("absolute right-4 top-4 rounded-lg border px-2 py-1 text-[10px] transition-all duration-300", stepIndex > 0 ? "border-rose-300/50 bg-rose-500/10 text-rose-600 dark:text-rose-200 opacity-100" : "border-transparent opacity-0")}>
        {isEn ? "Exit popup" : "Popup de salida"}
      </div>

      <div
        className={cn(
          "absolute bottom-4 right-4 w-[220px] rounded-xl border p-2 transition-all duration-300",
          isDark ? "border-slate-700 bg-[#0b121a]" : "border-slate-200 bg-white shadow-lg",
          stepIndex === 0 ? "translate-y-4 scale-95 opacity-80" : "translate-y-0 scale-100 opacity-100",
        )}
      >
        <p className="text-[11px] font-semibold">Leads Widget</p>
        <div className={cn("mt-2 rounded-lg px-2 py-1 text-[10px]", isDark ? "bg-slate-800 text-slate-300" : "bg-slate-100 text-slate-700")}>
          {stepIndex < 2
            ? isEn
              ? "Budget, zone and urgency pre-qualification"
              : "Precalificacion de presupuesto, zona y urgencia"
            : isEn
              ? "Lead scored: high intent"
              : "Lead puntuado: alta intencion"}
        </div>
        <div className="mt-2 flex flex-wrap gap-1">
          {(stepIndex > 0
            ? [
                isEn ? "Budget OK" : "Presupuesto OK",
                isEn ? "Timeline OK" : "Plazo OK",
              ]
            : [isEn ? "Launcher active" : "Launcher activo"]).map((item) => (
            <span key={item} className={cn("rounded-full px-2 py-0.5 text-[9px]", isDark ? "bg-slate-800 text-slate-300" : "bg-slate-100 text-slate-600")}>
              {item}
            </span>
          ))}
        </div>
        <div className={cn("mt-2 rounded-md px-2 py-1 text-[10px] text-white transition-all duration-300", stepIndex === 2 ? "bg-emerald-600" : "bg-emerald-600/80")}>
          {isEn ? "Send to WhatsApp with context" : "Enviar a WhatsApp con contexto"}
        </div>
      </div>
    </div>
  );
}

function LeadChatFlow({
  stepIndex,
  isDark,
  isEn,
}: {
  stepIndex: number;
  isDark: boolean;
  isEn: boolean;
}) {
  return (
    <div className={cn("rounded-2xl border p-3", isDark ? "border-slate-700 bg-[#0b121a]" : "border-slate-200 bg-white")}>
      <div className={cn("flex items-center justify-between rounded-lg px-3 py-2 text-xs", isDark ? "bg-slate-900 text-slate-200" : "bg-slate-100 text-slate-700")}>
        <span>{isEn ? "Public Lead Chat page" : "Pagina publica Lead Chat"}</span>
        <span className="rounded-full bg-cyan-500/15 px-2 py-0.5 text-[10px] text-cyan-500">/lc/tu-negocio</span>
      </div>
      <div className="mt-3 space-y-2">
        <div className={cn("max-w-[82%] rounded-xl rounded-bl-md px-3 py-2 text-[11px]", isDark ? "bg-slate-800 text-slate-200" : "bg-slate-100 text-slate-700")}>
          {stepIndex === 0
            ? isEn
              ? "Hi, I came from your campaign."
              : "Hola, vengo de tu campana."
            : isEn
              ? "I can invest S/500k and move this month."
              : "Puedo invertir S/500k y mudarme este mes."}
        </div>
        <div className="ml-auto max-w-[82%] rounded-xl rounded-br-md bg-emerald-600 px-3 py-2 text-[11px] text-white">
          {stepIndex < 2
            ? isEn
              ? "Perfect. I am validating the lead."
              : "Perfecto. Estoy validando el lead."
            : isEn
              ? "Done. Advisor assigned and WhatsApp handoff ready."
              : "Listo. Asesor asignado y handoff a WhatsApp listo."}
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {(stepIndex === 0
          ? [isEn ? "Source tracked" : "Fuente capturada"]
          : stepIndex === 1
            ? [
                isEn ? "Budget validated" : "Presupuesto validado",
                isEn ? "Timeline confirmed" : "Plazo confirmado",
              ]
            : [
                isEn ? "Assigned in CRM" : "Asignado en CRM",
                isEn ? "Ready for WhatsApp" : "Listo para WhatsApp",
              ]).map((chip) => (
          <span key={chip} className={cn("rounded-full px-2 py-1 text-[10px]", isDark ? "bg-emerald-500/15 text-emerald-200" : "bg-emerald-100 text-emerald-700")}>
            {chip}
          </span>
        ))}
      </div>
      <div className={cn("mt-3 rounded-lg px-3 py-2 text-center text-[11px] font-semibold text-white transition-all duration-300", stepIndex === 2 ? "bg-emerald-600" : "bg-emerald-600/80")}>
        {isEn ? "CTA: Continue on WhatsApp" : "CTA: Continuar por WhatsApp"}
      </div>
    </div>
  );
}
