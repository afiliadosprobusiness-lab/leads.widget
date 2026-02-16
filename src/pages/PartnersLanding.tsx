import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  ChartNoAxesCombined,
  Handshake,
  Percent,
  ShieldCheck,
  Sparkles,
  Ticket,
  UserRoundCheck,
} from 'lucide-react';

const stats = [
  { label: 'Tiempo para activar partner', value: '10 min' },
  { label: 'Comisión primer pago', value: '50%' },
  { label: 'Comisión recurrente', value: '30%' },
  { label: 'Frecuencia de corte', value: 'Mensual' },
];

const benefits = [
  {
    title: 'Canal B2B2B para agencias',
    text: 'Vende Lead Widget con links de checkout atribuidos por partner_code y campañas UTM.',
    icon: Building2,
  },
  {
    title: 'Comisiones claras y predecibles',
    text: 'Primer pago: 50% para agencia. Pagos siguientes del mismo cliente: 30% mientras esté activo.',
    icon: Percent,
  },
  {
    title: 'Trazabilidad completa',
    text: 'Ledger por cliente y periodo, estados pending/approved/paid y exportación CSV para cierre contable.',
    icon: ShieldCheck,
  },
  {
    title: 'Operación centralizada',
    text: 'Gestiona leads, drafts, branding, usuarios internos y tickets desde un dashboard dedicado.',
    icon: Ticket,
  },
];

const processSteps = [
  {
    title: 'Genera atribución',
    body: 'Crea links de checkout con partner_code o registra un pre-cliente draft para compartir pago directo.',
  },
  {
    title: 'Activa clientes',
    body: 'Cuando el pago entra a Leads Widget y el cliente queda activo, la comisión se registra automáticamente.',
  },
  {
    title: 'Controla tu cartera',
    body: 'Visualiza estado de clientes, próximas renovaciones, plan 30/60 y solicitudes de soporte por ticket.',
  },
  {
    title: 'Recibe payout mensual',
    body: 'Superadmin aprueba el corte y marca el pago de comisiones. Tú solo registras método de cobro.',
  },
];

const testimonials = [
  {
    name: 'María Fernanda Soto',
    role: 'Directora Comercial',
    agency: 'Atlas Growth Studio',
    quote:
      'En 6 semanas pasamos de vender servicios sueltos a empaquetar Lead Widget como producto recurrente. El dashboard partner nos ordenó todo.',
    image:
      'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=240&q=80',
  },
  {
    name: 'Javier Ramos',
    role: 'Founder',
    agency: 'Nexo Media Lab',
    quote:
      'Lo que más valoramos es la atribución: cada cliente referido queda trazado y el cálculo de comisión no depende de hojas manuales.',
    image:
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=240&q=80',
  },
  {
    name: 'Camila Torres',
    role: 'Head of Growth',
    agency: 'Impulso Digital',
    quote:
      'El modelo 50/30 hace fácil venderlo al equipo. Cerramos más rápido porque el cliente entiende que paga directo al SaaS.',
    image:
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=240&q=80',
  },
  {
    name: 'Diego Paredes',
    role: 'CEO',
    agency: 'Scale Partners',
    quote:
      'Tener branding para clientes en plan 60 nos ayudó a elevar ticket sin perder control operativo ni financiero.',
    image:
      'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=240&q=80',
  },
  {
    name: 'Lucía Méndez',
    role: 'Estratega de Cuentas',
    agency: 'Andes Performance',
    quote:
      'Antes perdíamos tiempo validando pagos. Ahora todo queda en ledger con historial y export CSV para cerrar el mes.',
    image:
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=240&q=80',
  },
];

const faqs = [
  {
    q: '¿La agencia cobra al cliente final?',
    a: 'No. El pago siempre ingresa a Leads Widget (tarjeta o Yape/Plin). La agencia solo recibe payout de comisión.',
  },
  {
    q: '¿Qué pasa si un cliente cancela y luego reactiva?',
    a: 'No se reinicia el “primer pago”. Ese cliente ya quedó marcado como recurrente, por lo que aplica comisión del 30%.',
  },
  {
    q: '¿Partner puede cambiar precios o hacer refunds?',
    a: 'No. Precios, comisiones globales, suscripciones, refunds e integraciones están restringidos a superadmin.',
  },
  {
    q: '¿Qué incluye el branding de agencia?',
    a: 'Solo para plan 60: logo, nombre de marca y textos permitidos. En plan 30 se mantiene marca de Leads Widget.',
  },
  {
    q: '¿Cómo se evita pagar comisión duplicada?',
    a: 'El backend usa ledger por periodo con control de idempotencia e identificación única por pago procesado.',
  },
];

export default function PartnersLanding() {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-slate-950 text-slate-100">
      <style>{`
        @keyframes partnersMarquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>

      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 top-24 h-64 w-64 rounded-full bg-emerald-500/20 blur-3xl" />
        <div className="absolute right-0 top-0 h-72 w-72 rounded-full bg-cyan-500/15 blur-3xl" />
      </div>

      <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/90 backdrop-blur">
        <div className="container mx-auto flex items-center justify-between gap-3 px-4 py-5">
          <Link to="/" className="text-lg font-black tracking-tight">
            Lead Widget
          </Link>
          <div className="flex items-center gap-2">
            <Link to="/login?portal=partner">
              <Button variant="ghost" className="text-slate-100 hover:bg-white/10 hover:text-white">
                Ingresar
              </Button>
            </Link>
            <Link to="/register?account=partner">
              <Button className="bg-emerald-500 font-bold text-slate-950 hover:bg-emerald-400">
                Crear cuenta partner
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="relative z-10">
        <section className="container mx-auto px-4 pb-16 pt-16 md:pb-24 md:pt-20">
          <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-6">
              <p className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-emerald-300">
                <Handshake className="h-4 w-4" />
                Partners Leads Widget
              </p>
              <h1 className="max-w-3xl text-balance text-4xl font-black leading-tight sm:text-5xl lg:text-6xl">
                Convierte tu agencia en un canal de distribución recurrente.
              </h1>
              <p className="max-w-2xl text-lg text-slate-300">
                Tu equipo comercial obtiene un panel propio para ventas, atribución, branding, soporte y comisiones.
                El cliente final mantiene su dashboard de métricas sin cambios.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link to="/register?account=partner">
                  <Button size="lg" className="bg-emerald-500 font-bold text-slate-950 hover:bg-emerald-400">
                    Crear cuenta partner
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link to="/login?portal=partner">
                  <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10">
                    Login partner
                  </Button>
                </Link>
              </div>
              <div className="grid gap-2 pt-2 sm:grid-cols-2">
                <p className="inline-flex items-center gap-2 text-sm text-slate-300">
                  <BadgeCheck className="h-4 w-4 text-emerald-300" />
                  Cobro centralizado por Leads Widget
                </p>
                <p className="inline-flex items-center gap-2 text-sm text-slate-300">
                  <BadgeCheck className="h-4 w-4 text-emerald-300" />
                  Dashboard separado para agencia
                </p>
                <p className="inline-flex items-center gap-2 text-sm text-slate-300">
                  <BadgeCheck className="h-4 w-4 text-emerald-300" />
                  Ledger auditable por cliente
                </p>
                <p className="inline-flex items-center gap-2 text-sm text-slate-300">
                  <BadgeCheck className="h-4 w-4 text-emerald-300" />
                  Roles Partner Admin / Partner Staff
                </p>
              </div>
            </div>

            <Card className="border-white/10 bg-slate-900/80 text-slate-100 shadow-glow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <ChartNoAxesCombined className="h-5 w-5 text-emerald-400" />
                  Resumen del programa
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid grid-cols-2 gap-3">
                  {stats.map((item) => (
                    <div key={item.label} className="rounded-xl border border-white/10 bg-slate-950/70 p-3">
                      <p className="text-xl font-black text-emerald-300">{item.value}</p>
                      <p className="mt-1 text-xs text-slate-400">{item.label}</p>
                    </div>
                  ))}
                </div>
                <div className="space-y-2 rounded-xl border border-emerald-300/20 bg-emerald-500/10 p-4 text-sm">
                  <p className="font-semibold text-emerald-300">Modelo de comisión</p>
                  <p className="text-slate-200">Primer pago exitoso del cliente referido: 50% agencia / 50% SaaS.</p>
                  <p className="text-slate-200">Pagos siguientes del mismo cliente: 30% agencia / 70% SaaS.</p>
                  <p className="text-slate-300">Si cancela y reactiva, no vuelve a primer pago.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="container mx-auto px-4 pb-14 md:pb-20">
          <div className="mb-6 flex items-end justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-300">Testimonios</p>
              <h2 className="mt-2 text-2xl font-black sm:text-3xl">Agencias que ya escalan con Partners</h2>
            </div>
            <p className="hidden text-sm text-slate-400 md:block">Desliza o deja correr para ver más casos.</p>
          </div>
          <div className="overflow-hidden [mask-image:linear-gradient(to_right,transparent,white_8%,white_92%,transparent)]">
            <div className="flex w-max gap-4 py-2 hover:[animation-play-state:paused] [animation:partnersMarquee_40s_linear_infinite]">
              {[...testimonials, ...testimonials].map((item, idx) => (
                <Card key={`${item.name}-${idx}`} className="w-[300px] shrink-0 border-white/10 bg-slate-900/80 text-slate-100">
                  <CardContent className="space-y-4 p-5">
                    <p className="text-sm leading-relaxed text-slate-300">“{item.quote}”</p>
                    <div className="flex items-center gap-3">
                      <img
                        src={item.image}
                        alt={item.name}
                        loading="lazy"
                        className="h-12 w-12 rounded-full object-cover ring-2 ring-emerald-400/30"
                      />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">{item.name}</p>
                        <p className="truncate text-xs text-slate-400">
                          {item.role} · {item.agency}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="container mx-auto px-4 pb-10 md:pb-16">
          <div className="grid gap-4 md:grid-cols-2">
            {benefits.map((item) => (
              <Card key={item.title} className="border-white/10 bg-slate-900/80 text-slate-100">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <item.icon className="h-5 w-5 text-emerald-400" />
                    {item.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-300">{item.text}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="container mx-auto px-4 pb-10 md:pb-16">
          <Card className="border-emerald-300/20 bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 text-slate-100">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <Sparkles className="h-6 w-6 text-emerald-400" />
                Cómo funciona
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              {processSteps.map((step, idx) => (
                <div key={step.title} className="rounded-xl border border-white/10 bg-slate-900/40 p-4">
                  <p className="mb-2 text-sm font-bold text-emerald-300">{idx + 1}. {step.title}</p>
                  <p className="text-sm text-slate-200">{step.body}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>

        <section className="container mx-auto px-4 pb-10 md:pb-16">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="border-white/10 bg-slate-900/80 text-slate-100">
              <CardHeader>
                <CardTitle className="text-xl">Lo que sí puede hacer un partner</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-slate-300">
                <p className="inline-flex items-start gap-2">
                  <UserRoundCheck className="mt-0.5 h-4 w-4 text-emerald-300" />
                  Generar links de venta con atribución.
                </p>
                <p className="inline-flex items-start gap-2">
                  <UserRoundCheck className="mt-0.5 h-4 w-4 text-emerald-300" />
                  Gestionar leads, drafts y tickets de sus clientes.
                </p>
                <p className="inline-flex items-start gap-2">
                  <UserRoundCheck className="mt-0.5 h-4 w-4 text-emerald-300" />
                  Configurar branding en plan 60 y exportar comisiones CSV.
                </p>
              </CardContent>
            </Card>

            <Card className="border-white/10 bg-slate-900/80 text-slate-100">
              <CardHeader>
                <CardTitle className="text-xl">Lo que está restringido</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-slate-300">
                <p className="inline-flex items-start gap-2">
                  <ShieldCheck className="mt-0.5 h-4 w-4 text-rose-300" />
                  Cambiar precios globales o estructura de comisiones.
                </p>
                <p className="inline-flex items-start gap-2">
                  <ShieldCheck className="mt-0.5 h-4 w-4 text-rose-300" />
                  Ejecutar refunds, tocar suscripciones o pagos directos.
                </p>
                <p className="inline-flex items-start gap-2">
                  <ShieldCheck className="mt-0.5 h-4 w-4 text-rose-300" />
                  Acceder a clientes de otras agencias.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="container mx-auto px-4 pb-12 md:pb-16">
          <Card className="border-white/10 bg-slate-900/80 text-slate-100">
            <CardHeader>
              <CardTitle className="text-2xl font-black">Preguntas frecuentes</CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {faqs.map((item, index) => (
                  <AccordionItem key={item.q} value={`faq-${index}`} className="border-white/10">
                    <AccordionTrigger className="text-left text-base font-semibold hover:no-underline">
                      {item.q}
                    </AccordionTrigger>
                    <AccordionContent className="text-sm leading-relaxed text-slate-300">
                      {item.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        </section>

        <section className="container mx-auto px-4 pb-20">
          <Card className="border-emerald-300/20 bg-gradient-to-r from-slate-900 to-slate-900/80 text-slate-100 shadow-glow">
            <CardContent className="flex flex-col items-start justify-between gap-5 py-8 md:flex-row md:items-center">
              <div>
                <p className="text-xl font-black">Activa tu canal partner hoy</p>
                <p className="mt-1 text-sm text-slate-300">
                  Entra con tu equipo comercial y empieza a convertir clientes referidos en ingreso recurrente.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link to="/register?account=partner">
                  <Button className="bg-emerald-500 font-bold text-slate-950 hover:bg-emerald-400">
                    Crear cuenta partner
                  </Button>
                </Link>
                <Link to="/login?portal=partner">
                  <Button variant="outline" className="border-white/30 text-white hover:bg-white/10">
                    Ingresar
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
}
