import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Loader2, Copy, Building2, Users, DollarSign, Ticket, Palette, Link as LinkIcon, LogOut } from 'lucide-react';
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

export default function PartnerDashboard() {
  const { user, role, isSuperAdmin, signOut, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [partner, setPartner] = useState<JsonMap | null>(null);
  const [overview, setOverview] = useState<JsonMap | null>(null);
  const [clients, setClients] = useState<JsonMap[]>([]);
  const [links, setLinks] = useState<JsonMap[]>([]);
  const [leads, setLeads] = useState<JsonMap[]>([]);
  const [drafts, setDrafts] = useState<JsonMap[]>([]);
  const [tickets, setTickets] = useState<JsonMap[]>([]);
  const [ledger, setLedger] = useState<JsonMap[]>([]);
  const [summary, setSummary] = useState<JsonMap>({ pending: 0, approved: 0, paid: 0 });
  const [users, setUsers] = useState<JsonMap[]>([]);
  const [payouts, setPayouts] = useState<JsonMap[]>([]);

  const [utmSource, setUtmSource] = useState('partner');
  const [utmCampaign, setUtmCampaign] = useState('');
  const [leadName, setLeadName] = useState('');
  const [leadEmail, setLeadEmail] = useState('');
  const [leadNotes, setLeadNotes] = useState('');
  const [draftName, setDraftName] = useState('');
  const [draftEmail, setDraftEmail] = useState('');
  const [draftPlan, setDraftPlan] = useState<'pro' | 'plus'>('pro');
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketDescription, setTicketDescription] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'partner_staff' | 'partner_admin'>('partner_staff');

  const [brandingName, setBrandingName] = useState('');
  const [brandingLogo, setBrandingLogo] = useState('');
  const [brandingSupportText, setBrandingSupportText] = useState('');
  const [brandingCta, setBrandingCta] = useState('');

  const [payoutMethod, setPayoutMethod] = useState<'yape' | 'plin' | 'cci'>('yape');
  const [payoutAccount, setPayoutAccount] = useState('');
  const [payoutHolder, setPayoutHolder] = useState('');

  const isPartnerAdmin = role === 'partner_admin';

  const runFullRefresh = async () => {
    if (!user) return;
    const token = await user.getIdToken();

    const [me, over, c, l, ld, d, t, com, u, p] = await Promise.all([
      apiRequest<{ partner: JsonMap; user: JsonMap }>('/api/partners/me', token),
      apiRequest<{ kpis: JsonMap }>('/api/partners/overview', token),
      apiRequest<{ clients: JsonMap[] }>('/api/partners/clients', token),
      apiRequest<{ links: JsonMap[] }>('/api/partners/checkout-links', token),
      apiRequest<{ leads: JsonMap[] }>('/api/partners/leads', token),
      apiRequest<{ drafts: JsonMap[] }>('/api/partners/drafts', token),
      apiRequest<{ tickets: JsonMap[] }>('/api/partners/tickets', token),
      apiRequest<{ ledger: JsonMap[]; summary: JsonMap }>('/api/partners/commissions', token),
      apiRequest<{ users: JsonMap[] }>('/api/partners/users', token),
      apiRequest<{ payouts: JsonMap[] }>('/api/partners/payouts', token),
    ]);

    setPartner(me.partner || null);
    setOverview(over.kpis || null);
    setClients(c.clients || []);
    setLinks(l.links || []);
    setLeads(ld.leads || []);
    setDrafts(d.drafts || []);
    setTickets(t.tickets || []);
    setLedger(com.ledger || []);
    setSummary(com.summary || { pending: 0, approved: 0, paid: 0 });
    setUsers(u.users || []);
    setPayouts(p.payouts || []);

    const branding = me.partner?.branding || {};
    setBrandingName(branding.agency_name || '');
    setBrandingLogo(branding.logo_url || '');
    setBrandingSupportText(branding.support_text || '');
    setBrandingCta(branding.cta_text || '');

    const payout = me.partner?.payout_method || {};
    setPayoutMethod((payout.method || 'yape') as 'yape' | 'plin' | 'cci');
    setPayoutAccount(payout.account || '');
    setPayoutHolder(payout.holder_name || '');
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
  }, [authLoading, user, role, isSuperAdmin, navigate]);

  const visibleLedger = useMemo(
    () => ledger.sort((a, b) => String(b.created_at || '').localeCompare(String(a.created_at || ''))).slice(0, 100),
    [ledger]
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
        body: JSON.stringify({ utm_source: utmSource || 'partner', utm_campaign: utmCampaign }),
      });
      setLinks((prev) => [{ id: payload.id, url: payload.url, created_at: new Date().toISOString() }, ...prev]);
      toast({ title: 'Enlace creado', description: 'Checkout link generado correctamente.' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const submitLead = async () => {
    if (!user || !leadName) return;
    try {
      const token = await user.getIdToken();
      await apiRequest('/api/partners/leads', token, {
        method: 'POST',
        body: JSON.stringify({ name: leadName, email: leadEmail, notes: leadNotes, stage: 'new' }),
      });
      setLeadName('');
      setLeadEmail('');
      setLeadNotes('');
      await runFullRefresh();
      toast({ title: 'Lead registrado' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const createDraft = async () => {
    if (!user || !draftName) return;
    try {
      const token = await user.getIdToken();
      await apiRequest('/api/partners/drafts', token, {
        method: 'POST',
        body: JSON.stringify({ business_name: draftName, email: draftEmail, plan_type: draftPlan }),
      });
      setDraftName('');
      setDraftEmail('');
      await runFullRefresh();
      toast({ title: 'Pre-cliente creado', description: 'Ya puedes compartir su enlace de pago.' });
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
          agency_name: brandingName,
          logo_url: brandingLogo,
          support_text: brandingSupportText,
          cta_text: brandingCta,
        }),
      });
      toast({ title: 'Branding guardado' });
      await runFullRefresh();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const submitTicket = async () => {
    if (!user || !ticketSubject || !ticketDescription) return;
    try {
      const token = await user.getIdToken();
      await apiRequest('/api/partners/tickets', token, {
        method: 'POST',
        body: JSON.stringify({ subject: ticketSubject, description: ticketDescription }),
      });
      setTicketSubject('');
      setTicketDescription('');
      await runFullRefresh();
      toast({ title: 'Ticket creado' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const savePayoutMethod = async () => {
    if (!user || !payoutAccount) return;
    try {
      const token = await user.getIdToken();
      await apiRequest('/api/partners/payout-method', token, {
        method: 'PUT',
        body: JSON.stringify({ method: payoutMethod, account: payoutAccount, holder_name: payoutHolder }),
      });
      toast({ title: 'Método de cobro registrado' });
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

  const inviteUser = async () => {
    if (!user || !inviteEmail) return;
    try {
      const token = await user.getIdToken();
      const payload = await apiRequest<{ signup_url: string }>('/api/partners/users/invite', token, {
        method: 'POST',
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      });
      setInviteEmail('');
      await runFullRefresh();
      toast({ title: 'Invitación creada', description: 'Se generó el enlace para ese usuario.' });
      if (payload?.signup_url) await copy(payload.signup_url);
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
      <header className="border-b bg-white/90 dark:bg-slate-900/90 backdrop-blur sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Partners Leads Widget</p>
            <h1 className="text-xl font-black truncate">{partner?.name || 'Agencia'}</h1>
            <p className="text-xs text-muted-foreground">Código: {partner?.code || '-'}</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">{role === 'partner_admin' ? 'Partner Admin' : 'Partner Staff'}</Badge>
            <Button variant="outline" size="sm" onClick={signOutNow}>
              <LogOut className="w-4 h-4 mr-2" />Salir
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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
          <TabsList className="grid grid-cols-3 md:grid-cols-6 h-auto gap-1">
            <TabsTrigger value="sales">Ventas</TabsTrigger>
            <TabsTrigger value="clients">Clientes</TabsTrigger>
            <TabsTrigger value="branding">Branding</TabsTrigger>
            <TabsTrigger value="support">Soporte</TabsTrigger>
            <TabsTrigger value="commissions">Comisiones</TabsTrigger>
            <TabsTrigger value="users">Usuarios</TabsTrigger>
          </TabsList>

          <TabsContent value="sales" className="space-y-6">
            <div className="grid lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-1">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2"><LinkIcon className="w-4 h-4" />Links de checkout</CardTitle>
                  <CardDescription>Genera URLs con partner_code + UTM.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label>UTM source</Label>
                    <Input value={utmSource} onChange={(e) => setUtmSource(e.target.value)} />
                  </div>
                  <div>
                    <Label>UTM campaign</Label>
                    <Input value={utmCampaign} onChange={(e) => setUtmCampaign(e.target.value)} placeholder="q1-agencias" />
                  </div>
                  <Button onClick={createCheckoutLink} className="w-full">Generar link</Button>
                </CardContent>
              </Card>

              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-base">Links recientes</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {links.length === 0 && <p className="text-sm text-muted-foreground">Sin links aún.</p>}
                  {links.slice(0, 8).map((row) => (
                    <div key={row.id} className="flex items-center gap-2 p-2 border rounded-lg">
                      <p className="text-xs truncate flex-1">{row.url}</p>
                      <Button variant="outline" size="sm" onClick={() => copy(row.url)}><Copy className="w-4 h-4" /></Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Registrar lead</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Input value={leadName} onChange={(e) => setLeadName(e.target.value)} placeholder="Nombre" />
                  <Input value={leadEmail} onChange={(e) => setLeadEmail(e.target.value)} placeholder="Email" />
                  <Textarea value={leadNotes} onChange={(e) => setLeadNotes(e.target.value)} placeholder="Notas" rows={3} />
                  <Button onClick={submitLead} className="w-full">Guardar lead</Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Crear pre-cliente draft</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Input value={draftName} onChange={(e) => setDraftName(e.target.value)} placeholder="Nombre del negocio" />
                  <Input value={draftEmail} onChange={(e) => setDraftEmail(e.target.value)} placeholder="Email de contacto" />
                  <div>
                    <Label>Plan sugerido</Label>
                    <select className="w-full border rounded-md h-10 px-3 bg-background" value={draftPlan} onChange={(e) => setDraftPlan(e.target.value as 'pro' | 'plus')}>
                      <option value="pro">Plan 30 (Pro)</option>
                      <option value="plus">Plan 60 (Plus)</option>
                    </select>
                  </div>
                  <Button onClick={createDraft} className="w-full">Crear draft + link de pago</Button>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader><CardTitle className="text-base">Pipeline rápido</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {leads.length === 0 && <p className="text-sm text-muted-foreground">Aún no registras leads.</p>}
                {leads.slice(0, 10).map((lead) => (
                  <div key={lead.id} className="flex items-center justify-between border rounded-lg p-2 text-sm">
                    <div className="min-w-0">
                      <p className="font-semibold truncate">{lead.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{lead.email || 'Sin correo'} · {lead.stage || 'new'}</p>
                    </div>
                    <Badge variant="outline">{lead.stage || 'new'}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="clients">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2"><Users className="w-4 h-4" />Clientes referidos</CardTitle>
                <CardDescription>Solo ves clientes atribuidos a tu partner_id.</CardDescription>
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
                          <td className="py-2">{c.next_renewal_at || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {clients.length === 0 && <p className="text-sm text-muted-foreground py-4">No hay clientes atribuidos aún.</p>}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="branding" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2"><Palette className="w-4 h-4" />Branding de agencia</CardTitle>
                <CardDescription>Aplica para clientes en plan 60 (PLUS).</CardDescription>
              </CardHeader>
              <CardContent className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Input value={brandingName} onChange={(e) => setBrandingName(e.target.value)} placeholder="Nombre de marca" />
                  <Input value={brandingLogo} onChange={(e) => setBrandingLogo(e.target.value)} placeholder="URL logo" />
                  <Input value={brandingSupportText} onChange={(e) => setBrandingSupportText(e.target.value)} placeholder="Texto soporte" />
                  <Input value={brandingCta} onChange={(e) => setBrandingCta(e.target.value)} placeholder="CTA" />
                  <Button disabled={!isPartnerAdmin} onClick={saveBranding}>Guardar branding</Button>
                  {!isPartnerAdmin && <p className="text-xs text-muted-foreground">Solo Partner Admin puede editar branding.</p>}
                </div>
                <div className="p-4 rounded-xl border bg-slate-50 dark:bg-slate-900 space-y-2">
                  <p className="text-xs uppercase text-muted-foreground">Preview</p>
                  <p className="font-black text-lg">{brandingName || partner?.name || 'Tu marca'}</p>
                  <p className="text-sm text-muted-foreground">{brandingSupportText || 'Soporte de agencia'}</p>
                  <Button variant="outline" size="sm">{brandingCta || 'Contáctanos'}</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="support" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2"><Ticket className="w-4 h-4" />Centro de ayuda + tickets</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm space-y-1">
                  <p>1. Activación de clientes: validar pago y estado de suscripción.</p>
                  <p>2. Branding plan 60: habilita logo/textos en clientes Plus.</p>
                  <p>3. Atribución: usar checkout links con partner_code.</p>
                </div>
                <Input value={ticketSubject} onChange={(e) => setTicketSubject(e.target.value)} placeholder="Asunto del ticket" />
                <Textarea value={ticketDescription} onChange={(e) => setTicketDescription(e.target.value)} placeholder="Describe el caso" rows={4} />
                <Button onClick={submitTicket}>Crear ticket</Button>
                <div className="space-y-2 pt-2">
                  {tickets.slice(0, 8).map((t) => (
                    <div key={t.id} className="p-2 border rounded-lg text-sm">
                      <p className="font-semibold">{t.subject}</p>
                      <p className="text-xs text-muted-foreground">{t.status || 'open'} · {t.created_at || ''}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="commissions" className="space-y-6">
            <div className="grid md:grid-cols-3 gap-4">
              <Card><CardContent className="pt-5"><p className="text-xs text-muted-foreground">Pendiente</p><p className="text-2xl font-black">S/ {Number(summary.pending || 0).toFixed(2)}</p></CardContent></Card>
              <Card><CardContent className="pt-5"><p className="text-xs text-muted-foreground">Aprobado</p><p className="text-2xl font-black">S/ {Number(summary.approved || 0).toFixed(2)}</p></CardContent></Card>
              <Card><CardContent className="pt-5"><p className="text-xs text-muted-foreground">Pagado</p><p className="text-2xl font-black text-emerald-600">S/ {Number(summary.paid || 0).toFixed(2)}</p></CardContent></Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2"><DollarSign className="w-4 h-4" />Ledger mensual por cliente</CardTitle>
                <CardDescription>Primer pago: 50% agencia / 50% SaaS. Siguientes pagos: 30% / 70%.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={exportCommissionsCsv}>Export CSV</Button>
                </div>
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
                          <td className="py-2 uppercase text-xs">{row.status || 'pending'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">Método de cobro (sin ejecución automática)</CardTitle></CardHeader>
              <CardContent className="grid md:grid-cols-3 gap-3">
                <div>
                  <Label>Método</Label>
                  <select className="w-full border rounded-md h-10 px-3 bg-background" value={payoutMethod} onChange={(e) => setPayoutMethod(e.target.value as 'yape' | 'plin' | 'cci')}>
                    <option value="yape">Yape</option>
                    <option value="plin">Plin</option>
                    <option value="cci">CCI</option>
                  </select>
                </div>
                <div>
                  <Label>Cuenta / número</Label>
                  <Input value={payoutAccount} onChange={(e) => setPayoutAccount(e.target.value)} />
                </div>
                <div>
                  <Label>Titular</Label>
                  <Input value={payoutHolder} onChange={(e) => setPayoutHolder(e.target.value)} />
                </div>
                <div className="md:col-span-3">
                  <Button disabled={!isPartnerAdmin} onClick={savePayoutMethod}>Guardar método de cobro</Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">Historial de payouts</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {payouts.length === 0 && <p className="text-sm text-muted-foreground">Sin payouts aún.</p>}
                {payouts.map((p) => (
                  <div key={p.id} className="border rounded-lg p-2 text-sm flex items-center justify-between">
                    <span>{p.period || '-'} · S/ {Number(p.total_amount || 0).toFixed(2)}</span>
                    <Badge variant="outline">{p.status || 'approved'}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2"><Building2 className="w-4 h-4" />Usuarios de agencia</CardTitle>
                <CardDescription>Invita equipo interno y asigna roles.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid md:grid-cols-3 gap-3">
                  <Input value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="correo@agencia.com" />
                  <select className="border rounded-md h-10 px-3 bg-background" value={inviteRole} onChange={(e) => setInviteRole(e.target.value as 'partner_staff' | 'partner_admin')}>
                    <option value="partner_staff">Partner Staff</option>
                    <option value="partner_admin">Partner Admin</option>
                  </select>
                  <Button disabled={!isPartnerAdmin} onClick={inviteUser}>Invitar</Button>
                </div>
                {!isPartnerAdmin && <p className="text-xs text-muted-foreground">Solo Partner Admin puede invitar usuarios.</p>}

                <div className="space-y-2">
                  {users.map((u) => (
                    <div key={u.id} className="p-2 border rounded-lg text-sm flex items-center justify-between">
                      <span>{u.email || u.id}</span>
                      <Badge variant="outline">{u.role || 'partner_staff'}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="text-xs text-muted-foreground">
          Restricciones activas: partner no puede cambiar precios globales, comisiones globales, refunds, suscripciones ni integraciones.
          Cualquier solicitud se procesa vía tickets para validación de superadmin.
        </div>
        <div className="text-xs">
          <Link to="/" className="underline text-muted-foreground hover:text-foreground">Volver al sitio</Link>
        </div>
      </main>
    </div>
  );
}
