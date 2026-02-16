import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Handshake, Percent, ShieldCheck, Ticket, Sparkles } from 'lucide-react';

const benefits = [
  {
    title: 'Canal B2B2B listo para escalar',
    text: 'Vende Lead Widget a tus clientes con enlaces de checkout atribuidos por partner_code + UTM.',
    icon: Building2,
  },
  {
    title: 'Comisión recurrente transparente',
    text: 'Primer pago del cliente: 50% agencia / 50% SaaS. Pagos siguientes: 30% / 70% mientras esté activo.',
    icon: Percent,
  },
  {
    title: 'Todo auditable',
    text: 'Ledger mensual por cliente, estados pending/approved/paid, export CSV y trazabilidad por periodo.',
    icon: ShieldCheck,
  },
  {
    title: 'Operación sin fricción',
    text: 'Gestiona leads, pre-clientes draft, branding y tickets desde un dashboard separado del cliente final.',
    icon: Ticket,
  },
];

const faqs = [
  {
    q: '¿La agencia cobra al cliente final?',
    a: 'No. El cobro siempre entra a Leads Widget. La agencia solo recibe payout de comisión según ledger.',
  },
  {
    q: '¿Si un cliente cancela y reactiva vuelve a contar como primer pago?',
    a: 'No. La regla mantiene histórico: solo el primer pago de ese cliente usa 50%, luego todo es recurrente al 30%.',
  },
  {
    q: '¿Puedo cambiar precios o aprobar refunds desde el panel partner?',
    a: 'No. Eso está restringido a superadmin para mantener control financiero y cumplimiento.',
  },
  {
    q: '¿Qué pasa con branding?',
    a: 'El branding de agencia aplica únicamente a clientes en plan 60 (PLUS).',
  },
];

export default function PartnersLanding() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-white/10">
        <div className="container mx-auto px-4 py-5 flex items-center justify-between gap-3">
          <Link to="/" className="font-black text-lg tracking-tight">Lead Widget</Link>
          <div className="flex items-center gap-2">
            <Link to="/login?portal=partner">
              <Button variant="ghost" className="text-slate-100 hover:text-white">Ingresar</Button>
            </Link>
            <Link to="/register?account=partner">
              <Button className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold">Crear cuenta partner</Button>
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="container mx-auto px-4 py-16 md:py-24">
          <div className="max-w-4xl space-y-6">
            <p className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-400/30 text-emerald-300 text-xs font-semibold uppercase tracking-wider">
              <Handshake className="w-4 h-4" /> Partners Leads Widget
            </p>
            <h1 className="text-4xl md:text-6xl font-black leading-tight text-balance">
              Convierte tu agencia en canal de distribución con comisión recurrente.
            </h1>
            <p className="text-slate-300 text-lg max-w-2xl">
              Tu equipo obtiene un panel exclusivo para ventas, atribución, branding, soporte y comisiones.
              El cliente final mantiene su dashboard de métricas sin cambios.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/register?account=partner">
                <Button size="lg" className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold">
                  Crear cuenta partner
                </Button>
              </Link>
              <Link to="/login?portal=partner">
                <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10">
                  Login partner
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <section className="container mx-auto px-4 pb-10 md:pb-16">
          <div className="grid md:grid-cols-2 gap-4">
            {benefits.map((item) => (
              <Card key={item.title} className="bg-slate-900/80 border-white/10 text-slate-100">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <item.icon className="w-5 h-5 text-emerald-400" />
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
          <Card className="bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 border-emerald-300/20 text-slate-100">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2"><Sparkles className="w-6 h-6 text-emerald-400" /> Cómo funciona</CardTitle>
            </CardHeader>
            <CardContent className="grid md:grid-cols-3 gap-4 text-sm">
              <div className="p-4 rounded-xl border border-white/10 bg-slate-900/40">
                <p className="font-semibold mb-2">1. Atribución</p>
                <p>Generas links con partner_code/UTM o pre-cliente draft con link de pago embebido.</p>
              </div>
              <div className="p-4 rounded-xl border border-white/10 bg-slate-900/40">
                <p className="font-semibold mb-2">2. Activación</p>
                <p>Cuando el cliente paga y queda activo, el sistema registra comisión en ledger mensual.</p>
              </div>
              <div className="p-4 rounded-xl border border-white/10 bg-slate-900/40">
                <p className="font-semibold mb-2">3. Payout</p>
                <p>Superadmin aprueba y marca pagos de comisiones. Tú solo registras método de cobro.</p>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="container mx-auto px-4 pb-10 md:pb-16">
          <h2 className="text-2xl md:text-3xl font-black mb-4">FAQ</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {faqs.map((item) => (
              <Card key={item.q} className="bg-slate-900/80 border-white/10 text-slate-100">
                <CardHeader>
                  <CardTitle className="text-base">{item.q}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-300">{item.a}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="container mx-auto px-4 pb-20">
          <Card className="bg-slate-900 border-white/10 text-slate-100">
            <CardContent className="py-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <p className="text-xl font-black">Listo para activar tu canal partner</p>
                <p className="text-sm text-slate-300">Empieza hoy con tu panel de agencia y trazabilidad completa.</p>
              </div>
              <div className="flex gap-2">
                <Link to="/register?account=partner">
                  <Button className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold">Crear cuenta partner</Button>
                </Link>
                <Link to="/login?portal=partner">
                  <Button variant="outline" className="border-white/30 text-white hover:bg-white/10">Login</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
}
