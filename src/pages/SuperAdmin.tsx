import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, getDocs, getDoc, doc, updateDoc, setDoc, where, limit, onSnapshot, deleteDoc } from 'firebase/firestore';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import {
  MessageCircle,
  Users,
  CreditCard,
  BarChart3,
  LogOut,
  Check,
  X,
  Loader2,
  Search,
  Eye,
  Clock,
  DollarSign,
  TrendingUp,
  AlertCircle,
  Shield,
  ShieldCheck,
  Settings,
  Plus,
  Pencil,
  Copy,
  ExternalLink,
  Trash2,
  Gift
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

// Define simple interfaces for TS
interface Profile {
  id: string;
  email: string;
  business_name: string;
  whatsapp_number?: string;
  subscription_status?: string;
  created_at: string;
  trial_ends_at?: string;
  plan_type?: string;
  referred_by?: string;
}

interface Payment {
  id: string;
  user_id: string;
  amount: number;
  status: string;
  payment_method: string;
  proof_url?: string;
  operation_ref?: string;
  created_at: string;
}

interface ClientWithLeads extends Profile {
  leads_count: number;
}

export default function SuperAdmin() {
  const { user, isSuperAdmin, signOut, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [clients, setClients] = useState<ClientWithLeads[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [updatingClient, setUpdatingClient] = useState<string | null>(null);
  const [verifyingPayment, setVerifyingPayment] = useState<string | null>(null);

  // New States for Management
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Profile | null>(null);
  const [editForm, setEditForm] = useState({ business_name: '', phone: '', email: '' });
  const [blockedDemoIps, setBlockedDemoIps] = useState<any[]>([]);



  // Stats
  const [stats, setStats] = useState({
    totalClients: 0,
    activeClients: 0,
    trialClients: 0,
    suspendedClients: 0,
    totalLeads: 0,
    pendingPayments: 0,
    totalViews: 0,
    mrr: 0,
  });

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        navigate('/login');
      } else if (!isSuperAdmin) {
        if (user.email !== 'superadmin@leadwidget.pe' && user.email !== 'superadmin2@leadwidget.pe') {
          navigate('/app');
        }
      }
    }
  }, [user, isSuperAdmin, authLoading, navigate]);

  useEffect(() => {
    if (!user) return;

    // Real-time Profiles subscription
    // Using onSnapshot for real-time updates
    const unsubProfiles = onSnapshot(query(collection(db, 'profiles'), orderBy('created_at', 'desc')), (snapshot) => {
      const profilesData = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as Profile[];

      setClients(prev => {
        // preserve leads_count map or re-calc if needed. 
        // Ideally we fetch leads count too, but let's assume leads updates handle that.
        // Or if this is the first load, we need leads count.
        // For simplicity, we initialize with 0 if map missing, but the Leads listener handles the count updates.
        // We just need to ensure we don't wipe out existing counts if profiles update.
        const currentMap = prev.reduce((acc, c) => ({ ...acc, [c.id]: c.leads_count }), {} as Record<string, number>);

        return profilesData.map(p => ({
          ...p,
          leads_count: currentMap[p.id] || 0
        }));
      });
    });

    // Real-time Payments
    const unsubPayments = onSnapshot(query(collection(db, 'payments'), orderBy('created_at', 'desc')), (snapshot) => {
      setPayments(snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as Payment[]);
    });

    // Real-time Leads (Counts)
    const unsubLeads = onSnapshot(collection(db, 'leads'), (snapshot) => {
      const leadsData = snapshot.docs.map(d => d.data());
      const leadsCounts = leadsData.reduce((acc: Record<string, number>, lead: any) => {
        if (lead.client_id) acc[lead.client_id] = (acc[lead.client_id] || 0) + 1;
        return acc;
      }, {});

      setClients(prevClients => prevClients.map(c => ({
        ...c,
        leads_count: leadsCounts[c.id] || 0
      })));

      setStats(prev => ({
        ...prev,
        totalLeads: snapshot.size
      }));
    });

    // Real-time Analytics
    const unsubAnalytics = onSnapshot(collection(db, 'analytics'), (snapshot) => {
      const totalViews = snapshot.docs.filter(d => d.data().event_type === 'view').length;
      setStats(prev => ({ ...prev, totalViews }));
    });



    // Real-time Blocked IPs (Demo Widget Only)
    const unsubBlockedIps = onSnapshot(
      query(collection(db, 'blocked_ips'), where('widget_id', '==', 'demo-landing')),
      (snapshot) => {
        const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        // Sort in JS to avoid index requirement
        docs.sort((a: any, b: any) => {
          const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
          const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
          return dateB - dateA;
        });
        setBlockedDemoIps(docs);
      }
    );





    setLoading(false);

    return () => {
      unsubProfiles();
      unsubPayments();
      unsubLeads();
      unsubAnalytics();
      unsubBlockedIps();
    };
  }, [user]);

  // Update stats when clients/payments change
  useEffect(() => {
    const activeCount = clients.filter(c => c.subscription_status === 'active').length;
    const trialCount = clients.filter(c => c.subscription_status === 'trial' || !c.subscription_status).length;
    const suspendedCount = clients.filter(c => c.subscription_status === 'suspended').length;
    const pendingPaymentsCount = payments.filter(p => p.status === 'pending').length;

    setStats(prev => ({
      ...prev,
      totalClients: clients.length,
      activeClients: activeCount,
      trialClients: trialCount,
      suspendedClients: suspendedCount,
      pendingPayments: pendingPaymentsCount,
      mrr: activeCount * 30, // Assuming 30 PEN plan
    }));
  }, [clients, payments]);

  const handleDeleteUser = async (clientId: string) => {
    const confirm = window.confirm('¿Estás seguro de eliminar este usuario? Se borrará su perfil y acceso.');
    if (!confirm) return;

    try {
      await deleteDoc(doc(db, 'profiles', clientId));
      await deleteDoc(doc(db, 'user_roles', clientId));

      // Optionally delete widget_configs too
      const qConfig = query(collection(db, 'widget_configs'), where('user_id', '==', clientId));
      const configSnap = await getDocs(qConfig);
      configSnap.forEach(async (d) => await deleteDoc(d.ref));

      toast({ title: 'Usuario eliminado (Soft Delete)' });
    } catch (error: any) {
      toast({ title: 'Error al eliminar', description: error.message, variant: 'destructive' });
    }
  };


  const unblockDemoIp = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'blocked_ips', id));
      toast({ title: 'IP desbloqueada para demo' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const updateClientStatus = async (clientId: string, newStatus: 'trial' | 'active' | 'suspended') => {
    setUpdatingClient(clientId);
    try {
      await updateDoc(doc(db, 'profiles', clientId), { subscription_status: newStatus });
      toast({
        title: 'Estado actualizado',
        description: `Cliente marcado como ${newStatus}`,
      });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setUpdatingClient(null);
    }
  };

  const verifyPayment = async (paymentId: string, status: 'verified' | 'rejected') => {
    setVerifyingPayment(paymentId);
    try {
      const payment = payments.find(p => p.id === paymentId);

      await updateDoc(doc(db, 'payments', paymentId), {
        status,
        verified_at: new Date().toISOString(),
        verified_by: user?.uid,
      });

      // If verified, activate client
      if (status === 'verified' && payment) {
        await updateDoc(doc(db, 'profiles', payment.user_id), { subscription_status: 'active' });
      }

      toast({
        title: status === 'verified' ? '✅ Pago verificado' : '❌ Pago rechazado',
        description: status === 'verified' ? 'Cliente activado automáticamente' : 'Se notificará al cliente',
      });

    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setVerifyingPayment(null);
    }
  };

  const handleEditClick = (client: Profile) => {
    setEditingClient(client);
    setEditForm({
      business_name: client.business_name || '',
      phone: client.whatsapp_number || '',
      email: client.email || ''
    });
  };

  const handleUpdateProfile = async () => {
    if (!editingClient) return;

    setLoading(true);
    try {
      await updateDoc(doc(db, 'profiles', editingClient.id), {
        business_name: editForm.business_name,
        whatsapp_number: editForm.phone
      });

      toast({ title: 'Cliente actualizado correctamente' });
      setEditingClient(null);
    } catch (error: any) {
      toast({
        title: 'Error al actualizar',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const copyInviteLink = () => {
    const link = `${window.location.origin}/register`;
    navigator.clipboard.writeText(link);
    toast({
      title: "Link copiado",
      description: "Envía este link al cliente para que se registre",
    });
    setIsCreateOpen(false);
  };

  const filteredClients = clients.filter(client =>
    client.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.business_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );



  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
      window.location.href = '/login';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'trial':
        return <span className="badge-trial px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200">Trial</span>;
      case 'active':
        return <span className="badge-active px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">Activo</span>;
      case 'suspended':
        return <span className="badge-suspended px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">Suspendido</span>;
      default:
        return <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">Desconocido</span>;
    }
  };


  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="bg-foreground text-background border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-xl">Super Admin (Real-time)</span>
          </Link>

          <div className="flex items-center gap-4">
            <span className="text-sm opacity-80 hidden sm:inline">{user?.email}</span>

            <Button variant="secondary" size="sm" onClick={handleSignOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Salir
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-8">
          <Card className="stat-card">
            <CardContent className="pt-4 pb-4">
              <p className="text-sm text-muted-foreground">Clientes Totales</p>
              <div className="flex items-center justify-between">
                <p className="text-2xl font-bold">{stats.totalClients}</p>
                <div className="w-8 h-8 bg-secondary/10 rounded-lg flex items-center justify-center">
                  <Users className="w-4 h-4 text-secondary" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="stat-card">
            <CardContent className="pt-4 pb-4">
              <p className="text-sm text-muted-foreground">Activos</p>
              <div className="flex items-center justify-between">
                <p className="text-2xl font-bold text-green-600">{stats.activeClients}</p>
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <Check className="w-4 h-4 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="stat-card">
            <CardContent className="pt-4 pb-4">
              <p className="text-sm text-muted-foreground">En Demo/Trial</p>
              <div className="flex items-center justify-between">
                <p className="text-2xl font-bold text-yellow-600">{stats.trialClients}</p>
                <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-4 h-4 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="stat-card">
            <CardContent className="pt-4 pb-4">
              <p className="text-sm text-muted-foreground">Suspendidos</p>
              <div className="flex items-center justify-between">
                <p className="text-2xl font-bold text-red-600">{stats.suspendedClients}</p>
                <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                  <X className="w-4 h-4 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="stat-card">
            <CardContent className="pt-4 pb-4">
              <p className="text-sm text-muted-foreground">Leads Totales</p>
              <div className="flex items-center justify-between">
                <p className="text-2xl font-bold">{stats.totalLeads}</p>
                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Users className="w-4 h-4 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="stat-card">
            <CardContent className="pt-4 pb-4">
              <p className="text-sm text-muted-foreground">Visitas Global</p>
              <div className="flex items-center justify-between">
                <p className="text-2xl font-bold">{stats.totalViews}</p>
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Eye className="w-4 h-4 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="stat-card bg-primary text-primary-foreground">
            <CardContent className="pt-4 pb-4">
              <p className="text-sm font-medium text-primary-foreground/80">MRR Mensual</p>
              <div className="flex items-center justify-between">
                <p className="text-2xl font-bold text-white">S/{stats.mrr}</p>
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>


        <Tabs defaultValue="clients" className="space-y-8">
          <TabsList className="bg-slate-900/90 text-slate-400 p-1 rounded-2xl border border-slate-800 backdrop-blur-sm inline-flex h-auto w-full sm:w-auto gap-1">
            <TabsTrigger
              value="clients"
              className="flex flex-col gap-1 px-3 py-2 h-auto data-[state=active]:bg-emerald-500/10 data-[state=active]:text-emerald-500 data-[state=active]:shadow-none rounded-xl transition-all"
            >
              <Users className="w-4 h-4 stroke-[2.5px]" />
              <span className="text-[9px] font-medium">Clientes</span>
            </TabsTrigger>
            <TabsTrigger
              value="payments"
              className="flex flex-col gap-1 px-3 py-2 h-auto data-[state=active]:bg-emerald-500/10 data-[state=active]:text-emerald-500 data-[state=active]:shadow-none rounded-xl transition-all"
            >
              <CreditCard className="w-4 h-4 stroke-[2.5px]" />
              <span className="text-[9px] font-medium">Pagos</span>
            </TabsTrigger>
            <TabsTrigger
              value="analytics"
              className="flex flex-col gap-1 px-3 py-2 h-auto data-[state=active]:bg-emerald-500/10 data-[state=active]:text-emerald-500 data-[state=active]:shadow-none rounded-xl transition-all"
            >
              <BarChart3 className="w-4 h-4 stroke-[2.5px]" />
              <span className="text-[9px] font-medium">Data</span>
            </TabsTrigger>
            <TabsTrigger
              value="security"
              className="flex flex-col gap-1 px-3 py-2 h-auto data-[state=active]:bg-emerald-500/10 data-[state=active]:text-emerald-500 data-[state=active]:shadow-none rounded-xl transition-all"
            >
              <ShieldCheck className="w-4 h-4 stroke-[2.5px]" />
              <span className="text-[9px] font-medium">Seguridad</span>
            </TabsTrigger>
            <TabsTrigger
              value="affiliates"
              className="flex flex-col gap-1 px-3 py-2 h-auto data-[state=active]:bg-emerald-500/10 data-[state=active]:text-emerald-500 data-[state=active]:shadow-none rounded-xl transition-all"
            >
              <Gift className="w-4 h-4 stroke-[2.5px]" />
              <span className="text-[9px] font-medium">Afiliados</span>
            </TabsTrigger>
          </TabsList>

          {/* Clients Tab */}
          <TabsContent value="clients">
            <Card>
              <CardHeader>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <CardTitle>Gestión de Clientes</CardTitle>
                    <CardDescription>{clients.length} clientes registrados</CardDescription>
                  </div>
                  <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
                    <div className="relative w-full md:w-64">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Buscar por email o empresa..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>

                    <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                      <DialogTrigger asChild>
                        <Button className="gap-2">
                          <Plus className="w-4 h-4" /> Nuevo Cliente
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Invitar Nuevo Cliente</DialogTitle>
                          <DialogDescription>
                            Comparte este enlace único para que el cliente se registre.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="py-4">
                          <div className="flex items-center gap-2 p-2 border rounded bg-muted">
                            <code className="text-sm flex-1 truncate">{window.location.origin}/register</code>
                            <Button size="icon" variant="ghost" onClick={copyInviteLink}>
                              <Copy className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button onClick={copyInviteLink}>Copiar Link</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-medium">Cliente</th>
                        <th className="text-left py-3 px-4 font-medium">Registro</th>
                        <th className="text-left py-3 px-4 font-medium">Estado</th>
                        <th className="text-left py-3 px-4 font-medium">Leads</th>
                        <th className="text-left py-3 px-4 font-medium">Trial Expira</th>
                        <th className="text-left py-3 px-4 font-medium">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredClients.map((client) => (
                        <tr key={client.id} className="border-b hover:bg-muted/50">
                          <td className="py-3 px-4">
                            <div>
                              <p className="font-medium">{client.business_name || 'Sin nombre'}</p>
                              <p className="text-sm text-muted-foreground">{client.email}</p>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-sm text-muted-foreground">
                            {new Date(client.created_at).toLocaleDateString('es-PE')}
                          </td>
                          <td className="py-3 px-4">
                            {getStatusBadge(client.subscription_status || 'trial')}
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-semibold">{client.leads_count}</span>
                          </td>
                          <td className="py-3 px-4 text-sm text-muted-foreground">
                            {(() => {
                              const created = new Date(client.created_at);
                              const trialEnd = new Date(created);
                              trialEnd.setDate(created.getDate() + 3);
                              return trialEnd.toLocaleDateString('es-PE');
                            })()}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleEditClick(client)}
                              >
                                <Pencil className="w-4 h-4 text-muted-foreground" />
                              </Button>

                              {/* Action Buttons Logic based on provided states */}
                              {/* If NOT active, show Activate (Green Check) */}
                              {client.subscription_status !== 'active' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => updateClientStatus(client.id, 'active')}
                                  disabled={updatingClient === client.id}
                                  className="text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200"
                                  title="Activar (Pasar a Active)"
                                >
                                  {updatingClient === client.id ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <Check className="w-4 h-4" />
                                  )}
                                </Button>
                              )}

                              {/* If NOT suspended, show Suspend (Red X) */}
                              {client.subscription_status !== 'suspended' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => updateClientStatus(client.id, 'suspended')}
                                  disabled={updatingClient === client.id}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                                  title="Suspender"
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              )}

                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDeleteUser(client.id)}
                                className="text-gray-500 hover:text-red-600 hover:bg-red-50 border-gray-200"
                                title="Eliminar permanentemente"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payments Tab */}
          <TabsContent value="payments">
            <Card>
              <CardHeader>
                <CardTitle>Pagos Pendientes de Verificación</CardTitle>
                <CardDescription>Revisa los comprobantes y activa cuentas</CardDescription>
              </CardHeader>
              <CardContent>
                {payments.filter(p => p.status === 'pending').length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Check className="w-12 h-12 mx-auto mb-4 opacity-50 text-success" />
                    <p>No hay pagos pendientes</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {payments.filter(p => p.status === 'pending').map((payment) => {
                      const client = clients.find(c => c.id === payment.user_id);
                      return (
                        <div key={payment.id} className="flex items-center justify-between p-4 border rounded-xl">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-warning/10 rounded-xl flex items-center justify-center">
                              <Clock className="w-6 h-6 text-warning" />
                            </div>
                            <div>
                              <p className="font-medium">{client?.business_name || client?.email}</p>
                              <p className="text-sm text-muted-foreground">
                                S/{payment.amount} • {payment.payment_method || 'Yape/Plin'}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(payment.created_at).toLocaleString('es-PE')}
                              </p>
                              {payment.operation_ref && (
                                <p className="text-xs font-mono bg-slate-100 px-2 py-0.5 rounded mt-1 border border-slate-200">
                                  REF: {payment.operation_ref}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => verifyPayment(payment.id, 'verified')}
                              disabled={verifyingPayment === payment.id}
                            >
                              {verifyingPayment === payment.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <>
                                  <Check className="w-4 h-4 mr-1" /> Aprobar
                                </>
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => verifyPayment(payment.id, 'rejected')}
                              disabled={verifyingPayment === payment.id}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* All Payments History */}
                <div className="mt-8">
                  <h3 className="font-semibold mb-4">Historial completo</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4 font-medium">Cliente</th>
                          <th className="text-left py-3 px-4 font-medium">Monto</th>
                          <th className="text-left py-3 px-4 font-medium">Estado</th>
                          <th className="text-left py-3 px-4 font-medium">Fecha</th>
                        </tr>
                      </thead>
                      <tbody>
                        {payments.map((payment) => {
                          const client = clients.find(c => c.id === payment.user_id);
                          return (
                            <tr key={payment.id} className="border-b hover:bg-muted/50">
                              <td className="py-3 px-4">{client?.email}</td>
                              <td className="py-3 px-4 font-medium">S/{payment.amount}</td>
                              <td className="py-3 px-4">
                                {payment.status === 'verified' && (
                                  <span className="badge-active px-2 py-1 rounded-full text-xs">Verificado</span>
                                )}
                                {payment.status === 'pending' && (
                                  <span className="badge-trial px-2 py-1 rounded-full text-xs">Pendiente</span>
                                )}
                                {payment.status === 'rejected' && (
                                  <span className="badge-suspended px-2 py-1 rounded-full text-xs">Rechazado</span>
                                )}
                              </td>
                              <td className="py-3 px-4 text-sm text-muted-foreground">
                                {new Date(payment.created_at).toLocaleDateString('es-PE')}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Leads por Cliente</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {clients
                      .sort((a, b) => b.leads_count - a.leads_count)
                      .slice(0, 10)
                      .map((client, index) => (
                        <div key={client.id} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-medium">
                              {index + 1}
                            </span>
                            <span className="text-sm">{client.business_name || client.email}</span>
                          </div>
                          <span className="font-semibold">{client.leads_count}</span>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Resumen de Ingresos</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-primary/5 rounded-xl">
                    <div className="flex items-center gap-3">
                      <DollarSign className="w-8 h-8 text-primary" />
                      <div>
                        <p className="text-sm text-muted-foreground">MRR Actual</p>
                        <p className="text-2xl font-bold">S/{stats.mrr}</p>
                      </div>
                    </div>
                    <TrendingUp className="w-6 h-6 text-success" />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-muted/50 rounded-xl">
                      <p className="text-sm text-muted-foreground">Pagos este mes</p>
                      <p className="text-xl font-bold">
                        {payments.filter(p =>
                          p.status === 'verified' &&
                          new Date(p.created_at).getMonth() === new Date().getMonth()
                        ).length}
                      </p>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-xl">
                      <p className="text-sm text-muted-foreground">Ingresos mes</p>
                      <p className="text-xl font-bold">
                        S/{payments
                          .filter(p =>
                            p.status === 'verified' &&
                            new Date(p.created_at).getMonth() === new Date().getMonth()
                          )
                          .reduce((sum, p) => sum + Number(p.amount), 0)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>



          {/* Security Tab - Demo Widget Blocked IPs */}
          <TabsContent value="security">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <CardTitle>Seguridad - Widget Demo</CardTitle>
                    <CardDescription>IPs bloqueadas en el widget de la landing page</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl flex gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-amber-800 dark:text-amber-200">
                    Estas IPs fueron bloqueadas automáticamente por intentar manipular el chat demo de tu landing page.
                    Si crees que algún bloqueo fue un error, puedes rehabilitar manualmente.
                  </p>
                </div>

                {blockedDemoIps.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-2xl">
                    <ShieldCheck className="w-12 h-12 mx-auto mb-4 opacity-10" />
                    <p>No hay IPs bloqueadas en el widget demo actualmente</p>
                    <p className="text-sm mt-1">El sistema de seguridad está activo y vigilando.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b text-xs uppercase tracking-wider text-muted-foreground">
                          <th className="text-left py-3 px-4 font-medium">Dirección IP</th>
                          <th className="text-left py-3 px-4 font-medium">Motivo</th>
                          <th className="text-left py-3 px-4 font-medium">Fecha de Bloqueo</th>
                          <th className="text-right py-3 px-4 font-medium">Acción</th>
                        </tr>
                      </thead>
                      <tbody className="text-sm">
                        {blockedDemoIps.map((ip) => (
                          <tr key={ip.id} className="border-b hover:bg-muted/50 transition-colors">
                            <td className="py-4 px-4 font-mono text-xs">{ip.ip_address}</td>
                            <td className="py-4 px-4">
                              <span className="px-2 py-1 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-md text-xs font-medium">
                                {ip.reason || 'AI detected abuse'}
                              </span>
                            </td>
                            <td className="py-4 px-4 text-muted-foreground">
                              {new Date(ip.created_at).toLocaleString('es-PE')}
                            </td>
                            <td className="py-4 px-4 text-right">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => unblockDemoIp(ip.id)}
                                className="text-primary border-primary/20 hover:bg-primary/10"
                              >
                                Desbloquear
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Affiliates Tab */}
          <TabsContent value="affiliates">
            <Card>
              <CardHeader>
                <CardTitle>Sistema de Referidos y Comisiones</CardTitle>
                <CardDescription>
                  Tracking completo de afiliados - 20% de comisión o 1 mes gratis por cada referido activo
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Referral Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="bg-emerald-50 border-emerald-200">
                      <CardContent className="pt-4">
                        <p className="text-sm text-emerald-700 font-medium">Total Referidos</p>
                        <p className="text-3xl font-bold text-emerald-900">
                          {clients.filter(c => c.referred_by).length}
                        </p>
                      </CardContent>
                    </Card>
                    <Card className="bg-cyan-50 border-cyan-200">
                      <CardContent className="pt-4">
                        <p className="text-sm text-cyan-700 font-medium">Referidos Activos</p>
                        <p className="text-3xl font-bold text-cyan-900">
                          {clients.filter(c => c.referred_by && c.subscription_status === 'active').length}
                        </p>
                      </CardContent>
                    </Card>
                    <Card className="bg-purple-50 border-purple-200">
                      <CardContent className="pt-4">
                        <p className="text-sm text-purple-700 font-medium">Comisiones Potenciales</p>
                        <p className="text-2xl font-bold text-purple-900">
                          S/ {(clients.filter(c => c.referred_by && c.subscription_status === 'active').length * 30 * 0.2).toFixed(2)}
                        </p>
                        <p className="text-xs text-purple-600">20% por mes</p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Referral Table */}
                  <div className="rounded-xl border overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Referido (Cliente Nuevo)</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Afiliado (Quién Refirió)</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Plan</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Estado</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Comisión/Mes</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {clients
                          .filter(c => c.referred_by)
                          .map((client) => {
                            const referrer = clients.find(c => c.id === client.referred_by);
                            const isActive = client.subscription_status === 'active';
                            const plan = client.plan_type || 'standard';
                            const basePrice = plan === 'plus' ? 60 : 30;
                            const commission = isActive ? (basePrice * 0.2).toFixed(2) : '0.00';

                            return (
                              <tr key={client.id} className="hover:bg-slate-50">
                                <td className="px-4 py-3">
                                  <div>
                                    <p className="font-medium text-sm">{client.business_name}</p>
                                    <p className="text-xs text-slate-500">{client.email}</p>
                                  </div>
                                </td>
                                <td className="px-4 py-3">
                                  {referrer ? (
                                    <div>
                                      <p className="font-medium text-sm text-emerald-700">
                                        {referrer.business_name}
                                      </p>
                                      <p className="text-xs text-slate-500">{referrer.email}</p>
                                    </div>
                                  ) : (
                                    <span className="text-xs text-slate-400">
                                      Usuario eliminado ({client.referred_by?.substring(0, 8)})
                                    </span>
                                  )}
                                </td>
                                <td className="px-4 py-3">
                                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${plan === 'plus'
                                    ? 'bg-purple-100 text-purple-700'
                                    : 'bg-blue-100 text-blue-700'
                                    }`}>
                                    {plan === 'plus' ? '👑 PLUS' : 'Estándar'}
                                  </span>
                                </td>
                                <td className="px-4 py-3">
                                  {getStatusBadge(client.subscription_status || 'trial')}
                                </td>
                                <td className="px-4 py-3">
                                  <div className="text-sm font-bold text-emerald-700">
                                    S/ {commission}
                                  </div>
                                  <div className="text-xs text-slate-500">
                                    {isActive ? '🎁 Activo' : '⏸️ Inactivo'}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        {clients.filter(c => c.referred_by).length === 0 && (
                          <tr>
                            <td colSpan={5} className="px- py-8 text-center text-slate-500">
                              <Gift className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                              <p>Aún no hay referidos en el sistema</p>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Info Card */}
                  <Card className="bg-gradient-to-br from-emerald-50 to-cyan-50 border-emerald-200">
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-4">
                        <div className="p-3 bg-white rounded-xl">
                          <Gift className="w-6 h-6 text-emerald-600" />
                        </div>
                        <div>
                          <h4 className="font-bold text-emerald-900 mb-2">Cómo Funciona el Sistema de Afiliados</h4>
                          <ul className="space-y-1 text-sm text-emerald-800">
                            <li>✅ Cada cliente activo genera un 20% de comisión mensual para su afiliado</li>
                            <li>✅ Alternativamente, puede otorgarse 1 mes gratis por referido activo</li>
                            <li>✅ Plan Estándar (S/ 30) = S/ 6 comisión/mes</li>
                            <li>✅ Plan PLUS (S/ 60) = S/ 12 comisión/mes</li>
                            <li>✅ El tracking es automático via parámetro `?ref=USER_ID`</li>
                          </ul>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Edit Dialog */}
        <Dialog open={!!editingClient} onOpenChange={(open) => !open && setEditingClient(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Cliente</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Nombre del Negocio</Label>
                <Input
                  value={editForm.business_name}
                  onChange={(e) => setEditForm({ ...editForm, business_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Teléfono WhatsApp</Label>
                <Input
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleUpdateProfile} disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Guardar Cambios'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div >
  );
}
