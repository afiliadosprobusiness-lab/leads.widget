import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Loader2, Copy, Users, DollarSign, Palette, Link as LinkIcon, LogOut, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type JsonMap = Record<string, any>;

async function apiRequest<T>(path: string, token: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(init?.headers || {}),
    },
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload?.error || `Request failed: ${response.status}`);
  }
  return payload as T;
}

function formatRenewalDate(value: unknown): string {
  const raw = typeof value === 'string' ? value.trim() : '';
  if (!raw) return '-';
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return raw;
  return date.toLocaleDateString('es-PE');
}

export default function PartnerDashboard() {
  const { user, role, isSuperAdmin, signOut, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [partner, setPartner] = useState<JsonMap | null>(null);
  const [overview, setOverview] = useState<JsonMap | null>(null);
  const [clients, setClients] = useState<JsonMap[]>([]);
  const [links, setLinks] = useState<JsonMap[]>([]);
  const [ledger, setLedger] = useState<JsonMap[]>([]);
  const [summary, setSummary] = useState<JsonMap>({ pending: 0, approved: 0, paid: 0 });
  const [payouts, setPayouts] = useState<JsonMap[]>([]);

  const [utmSource, setUtmSource] = useState('partner');
  const [utmCampaign, setUtmCampaign] = useState('');

  const [brandingText, setBrandingText] = useState('');
  const [brandingLink, setBrandingLink] = useState('');

  const isPartnerAdmin = role === 'partner_admin';

  const runFullRefresh = async () => {
    if (!user) return;
    const token = await user.getIdToken();

    const [me, over, c, l, com, p] = await Promise.all([
      apiRequest<{ partner: JsonMap; user: JsonMap }>('/api/partners/me', token),
      apiRequest<{ kpis: JsonMap }>('/api/partners/overview', token),
      apiRequest<{ clients: JsonMap[] }>('/api/partners/clients', token),
      apiRequest<{ links: JsonMap[] }>('/api/partners/checkout-links', token),
      apiRequest<{ ledger: JsonMap[]; summary: JsonMap }>('/api/partners/commissions', token),
      apiRequest<{ payouts: JsonMap[] }>('/api/partners/payouts', token),
    ]);

    setPartner(me.partner || null);
    setOverview(over.kpis || null);
    setClients(c.clients || []);
    setLinks(l.links || []);
    setLedger(com.ledger || []);
    setSummary(com.summary || { pending: 0, approved: 0, paid: 0 });
    setPayouts(p.payouts || []);

    const branding = me.partner?.branding || {};
    setBrandingText(branding.branding_text || branding.agency_name || '');
    setBrandingLink(branding.branding_link || branding.cta_url || '');
  };

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate('/login?portal=partner');
      return;
    }
    if (isSuperAdmin) {
      navigate('/superadmin');
      return;
    }
    if (!(role === 'partner_admin' || role === 'partner_staff')) {
      navigate('/app');
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        await runFullRefresh();
      } catch (error: any) {
        if (!cancelled) {
          toast({ title: 'Error', description: error.message, variant: 'destructive' });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [authLoading, user, role, isSuperAdmin, navigate, toast]);

  const visibleLedger = useMemo(
    () => ledger.sort((a, b) => String(b.created_at || '').localeCompare(String(a.created_at || ''))).slice(0, 100),
    [ledger],
  );

  const copy = async (value: string) => {
    await navigator.clipboard.writeText(value);
    toast({ title: 'Copiado', description: 'Enlace copiado al portapapeles.' });
  };

  const createCheckoutLink = async () => {
    if (!user) return;
    try {
      const token = await user.getIdToken();
      const payload = await apiRequest<{ id: string; url: string }>('/api/partners/checkout-links', token, {
        method: 'POST',
        body: JSON.stringify({
          utm_source: utmSource || 'partner',
          utm_campaign: utmCampaign || null,
        }),
      });
      setLinks((prev) => [{ id: payload.id, url: payload.url, created_at: new Date().toISOString() }, ...prev]);
      toast({ title: 'Enlace creado', description: 'Compártelo con nuevos clientes de tu agencia.' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const saveBranding = async () => {
    if (!user) return;
    try {
      const token = await user.getIdToken();
      await apiRequest('/api/partners/branding', token, {
        method: 'PUT',
        body: JSON.stringify({
          branding_text: brandingText,
          branding_link: brandingLink,
        }),
      });
      toast({ title: 'Branding guardado' });
      await runFullRefresh();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const exportCommissionsCsv = async () => {
    if (!user) return;
    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/partners/commissions?format=csv', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload?.error || 'No se pudo exportar CSV');
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `partner-commissions-${partner?.code || 'report'}.csv`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const signOutNow = async () => {
    await signOut();
    navigate('/login?portal=partner');
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <header className="sticky top-0 z-40 border-b bg-white/90 backdrop-blur dark:bg-slate-900/90">
        <div className="container mx-auto flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Partners Leads Widget</p>
            <h1 className="truncate text-xl font-black">{partner?.name || 'Agencia'}</h1>
            <p className="truncate text-xs text-muted-foreground">Código: {partner?.code || '-'}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">{role === 'partner_admin' ? 'Partner Admin' : 'Partner Staff'}</Badge>
            <Button variant="outline" size="sm" onClick={signOutNow}>
              <LogOut className="mr-2 h-4 w-4" />
              Salir
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto max-w-6xl space-y-6 px-4 py-6 sm:py-8">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Card>
            <CardContent className="pt-5">
              <p className="text-xs text-muted-foreground">Clientes referidos</p>
              <p className="text-2xl font-black">{overview?.clients_total ?? 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5">
              <p className="text-xs text-muted-foreground">Clientes activos</p>
              <p className="text-2xl font-black text-emerald-600">{overview?.clients_active ?? 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5">
              <p className="text-xs text-muted-foreground">Comisión pendiente</p>
              <p className="text-2xl font-black">S/ {Number(summary.pending || 0).toFixed(2)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5">
              <p className="text-xs text-muted-foreground">Comisión pagada</p>
              <p className="text-2xl font-black text-cyan-600">S/ {Number(summary.paid || 0).toFixed(2)}</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="sales" className="w-full">
          <div className="overflow-x-auto">
            <TabsList className="inline-flex h-auto min-w-full justify-start gap-1 p-1">
              <TabsTrigger value="sales">Ventas</TabsTrigger>
              <TabsTrigger value="clients">Clientes</TabsTrigger>
              <TabsTrigger value="branding">Branding</TabsTrigger>
              <TabsTrigger value="commissions">Comisiones</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="sales" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <LinkIcon className="h-4 w-4" />
                  Link de registro para clientes referidos
                </CardTitle>
                <CardDescription>
                  Este enlace es para clientes nuevos de tu agencia. Si lo pruebas con tu sesión partner activa, úsalo en incógnito.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <Label>UTM source</Label>
                    <Input value={utmSource} onChange={(e) => setUtmSource(e.target.value)} />
                  </div>
                  <div>
                    <Label>UTM campaign</Label>
                    <Input value={utmCampaign} onChange={(e) => setUtmCampaign(e.target.value)} placeholder="q1-agencias" />
                  </div>
                </div>
                <Button onClick={createCheckoutLink} className="w-full sm:w-auto">Generar link</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Links recientes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {links.length === 0 && <p className="py-2 text-sm text-muted-foreground">Sin links aún.</p>}
                {links.slice(0, 10).map((row) => (
                  <div key={row.id} className="flex flex-col gap-2 rounded-lg border p-3 sm:flex-row sm:items-center">
                    <p className="min-w-0 flex-1 break-all text-xs leading-relaxed">{row.url}</p>
                    <div className="flex shrink-0 gap-2">
                      <Button variant="outline" size="sm" onClick={() => copy(row.url)}>
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" asChild>
                        <a href={row.url} target="_blank" rel="noreferrer">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="clients">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Users className="h-4 w-4" />
                  Clientes referidos
                </CardTitle>
                <CardDescription>Solo clientes atribuidos a tu agencia.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left">
                        <th className="py-2">Cliente</th>
                        <th className="py-2">Plan</th>
                        <th className="py-2">Estado</th>
                        <th className="py-2">Próx. renovación</th>
                      </tr>
                    </thead>
                    <tbody>
                      {clients.map((c) => (
                        <tr key={c.id} className="border-b">
                          <td className="py-2">
                            <p className="font-semibold">{c.business_name || 'Sin nombre'}</p>
                            <p className="text-xs text-muted-foreground">{c.email || 'Sin email'}</p>
                          </td>
                          <td className="py-2 uppercase">{c.plan_type || 'pro'}</td>
                          <td className="py-2">{c.subscription_status || 'trial'}</td>
                          <td className="py-2">{formatRenewalDate(c.next_renewal_at)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {clients.length === 0 && <p className="py-4 text-sm text-muted-foreground">No hay clientes atribuidos aún.</p>}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="branding" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Palette className="h-4 w-4" />
                  Branding de agencia
                </CardTitle>
                <CardDescription>
                  Solo aplica en clientes plan 60 (PLUS). Define el texto del pie del chat y el enlace al hacer clic.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-6 md:grid-cols-2">
                <div className="space-y-3">
                  <div className="space-y-1">
                    <Label htmlFor="partner-branding-text">Texto de marca</Label>
                    <Input
                      id="partner-branding-text"
                      value={brandingText}
                      onChange={(e) => setBrandingText(e.target.value)}
                      placeholder="Potenciado por Agencia Wonder"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="partner-branding-link">Enlace de marca</Label>
                    <Input
                      id="partner-branding-link"
                      type="url"
                      value={brandingLink}
                      onChange={(e) => setBrandingLink(e.target.value)}
                      placeholder="https://agenciawonder.com"
                    />
                  </div>
                  <Button disabled={!isPartnerAdmin} onClick={saveBranding}>Guardar branding</Button>
                  {!isPartnerAdmin && <p className="text-xs text-muted-foreground">Solo Partner Admin puede editar branding.</p>}
                </div>
                <div className="space-y-2 rounded-xl border bg-slate-50 p-4 dark:bg-slate-900">
                  <p className="text-xs uppercase text-muted-foreground">Preview del pie del chat</p>
                  <p className="text-lg font-black">{brandingText || partner?.name || 'Tu marca'}</p>
                  <Button variant="outline" size="sm">
                    {brandingLink ? 'Ir al enlace de marca' : 'Sin enlace configurado'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="commissions" className="space-y-6">
            <div className="grid gap-3 md:grid-cols-3">
              <Card>
                <CardContent className="pt-5">
                  <p className="text-xs text-muted-foreground">Pendiente</p>
                  <p className="text-2xl font-black">S/ {Number(summary.pending || 0).toFixed(2)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-5">
                  <p className="text-xs text-muted-foreground">Aprobado</p>
                  <p className="text-2xl font-black">S/ {Number(summary.approved || 0).toFixed(2)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-5">
                  <p className="text-xs text-muted-foreground">Pagado</p>
                  <p className="text-2xl font-black text-emerald-600">S/ {Number(summary.paid || 0).toFixed(2)}</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <DollarSign className="h-4 w-4" />
                  Ledger mensual por cliente
                </CardTitle>
                <CardDescription>Primer pago: 50% agencia. Pagos siguientes: 30% agencia.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" size="sm" onClick={exportCommissionsCsv}>Export CSV</Button>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left">
                        <th className="py-2">Periodo</th>
                        <th className="py-2">Cliente</th>
                        <th className="py-2">Base</th>
                        <th className="py-2">Rate</th>
                        <th className="py-2">Comisión</th>
                        <th className="py-2">Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visibleLedger.map((row) => (
                        <tr key={row.id} className="border-b">
                          <td className="py-2">{row.period || '-'}</td>
                          <td className="py-2">{row.client_user_id || '-'}</td>
                          <td className="py-2">{row.currency === 'USD' ? '$' : 'S/'} {Number(row.base_amount || 0).toFixed(2)}</td>
                          <td className="py-2">{Math.round(Number(row.rate_applied || 0) * 100)}%</td>
                          <td className="py-2 font-semibold">S/ {Number(row.commission_amount || 0).toFixed(2)}</td>
                          <td className="py-2 text-xs uppercase">{row.status || 'pending'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">Historial de payouts</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {payouts.length === 0 && <p className="text-sm text-muted-foreground">Sin payouts aún.</p>}
                {payouts.map((p) => (
                  <div key={p.id} className="flex items-center justify-between rounded-lg border p-2 text-sm">
                    <span>{p.period || '-'} · S/ {Number(p.total_amount || 0).toFixed(2)}</span>
                    <Badge variant="outline">{p.status || 'approved'}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="text-xs text-muted-foreground">
          Restricciones activas: partner no puede cambiar precios globales, comisiones globales, refunds, suscripciones ni integraciones.
        </div>
      </main>
    </div>
  );
}
