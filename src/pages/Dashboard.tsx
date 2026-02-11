import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { db, storage } from '@/lib/firebase';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  setDoc,
  updateDoc,
  deleteDoc,
  orderBy,
  addDoc,
  onSnapshot
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  ShieldCheck, ShieldAlert, TrendingUp, Info, MessageCircle, Copy, Check, Download,
  ExternalLink, Settings, History, Lock, AlertCircle, LogOut, Loader2, Sparkles,
  Layout, Palette, Code, BarChart as BarChartIcon, BarChart3, Users, CreditCard,
  Eye, Target, Upload, Clock, Bot, Key, Shield, X, Smartphone, EyeOff, MoreHorizontal, Globe,
  ShoppingBag, HeartPulse, Wrench, Home, Utensils, Banknote, Calculator, HandCoins, BookOpen, Rocket
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { PayPalPaymentButton } from '@/components/PayPalButton';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { WidgetPreview } from '@/components/WidgetPreview';
import { AffiliateCard } from '@/components/AffiliateCard';
import { useToast } from '@/hooks/use-toast';

interface Lead {
  id: string;
  client_id: string;
  widget_id: string;
  name: string;
  phone: string;
  interest: string;
  created_at: string;
  status: string;
}

interface WidgetConfig {
  id: string;
  user_id: string;
  widget_id: string;
  business_name: string;
  phone_number: string;
  welcome_message: string;
  position: 'right' | 'left';
  theme_color: string;
  template: string;
  niche_question: string;
  is_active: boolean;
  created_at: string;
  ai_security_prompt?: string;
  language?: 'es' | 'en';
  testimonials_json?: string;
  launcher_icon?: string;
  hide_branding?: boolean;
}

const STATIC_ICONS = [
  { id: 'default', label: 'dashboard.static_icons.default', icon: MessageCircle, value: '' },
  { id: 'ecommerce', label: 'dashboard.static_icons.ecommerce', icon: ShoppingBag, value: 'shopping-bag' },
  { id: 'health', label: 'dashboard.static_icons.health', icon: HeartPulse, value: 'heart-pulse' },
  { id: 'auto', label: 'dashboard.static_icons.auto', icon: Wrench, value: 'wrench' },
  { id: 'real_estate', label: 'dashboard.static_icons.real_estate', icon: Home, value: 'home' },
  { id: 'restaurant', label: 'dashboard.static_icons.restaurant', icon: Utensils, value: 'utensils' },
  { id: 'robot', label: 'dashboard.static_icons.robot', icon: Bot, value: 'bot' }
];

interface Testimonial {
  id: string;
  name: string;
  text: string;
  stars: number;
  avatar_url?: string;
}



interface Profile {
  id: string;
  email: string;
  business_name: string;
  subscription_status: string;
  status?: string; // Used in UI
  created_at?: string;
  trial_ends_at?: string;
  plan_type?: string;
  ai_enabled: boolean;
  ai_api_key?: string;
  ai_provider?: string;
  ai_model?: string;
  ai_temperature?: number;
  ai_system_prompt?: string;
  ai_max_tokens?: number;
  business_description?: string;
  ai_security_prompt?: string;
}

type Payment = any;

const templates = [
  {
    value: 'general',
    label: 'dashboard.templates.general_label',
    translationKey: 'dashboard.templates.general_q'
  },
  {
    value: 'inmobiliaria',
    label: 'dashboard.templates.real_estate_label',
    translationKey: 'dashboard.templates.real_estate_q'
  },
  {
    value: 'clinica',
    label: 'dashboard.templates.health_label',
    translationKey: 'dashboard.templates.health_q'
  },
  {
    value: 'taller',
    label: 'dashboard.templates.auto_label',
    translationKey: 'dashboard.templates.auto_q'
  },
  {
    value: 'delivery',
    label: 'dashboard.templates.delivery_label',
    translationKey: 'dashboard.templates.delivery_q'
  },
  {
    value: 'personalizado',
    label: 'dashboard.templates.custom_label',
    translationKey: ''
  },
];

export default function Dashboard() {
  const { t, i18n } = useTranslation();
  const { user, signOut, loading: authLoading, isSuperAdmin } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Redirect SuperAdmin to their panel if they land here


  const [profile, setProfile] = useState<Profile | null>(null);
  const [widgetConfig, setWidgetConfig] = useState<WidgetConfig | null>(null);
  const [activeTab, setActiveTab] = useState("config");
  const [leads, setLeads] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState({ views: 0, interactions: 0, viewsToday: 0 });
  const [payments, setPayments] = useState<any[]>([]);
  const [blockedIps, setBlockedIps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [savingAI, setSavingAI] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [chartData, setChartData] = useState<any[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [isTestimonialDialogOpen, setIsTestimonialDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'standard' | 'plus'>('standard');
  const [currency, setCurrency] = useState<'PEN' | 'USD'>('PEN');
  const [affiliateRefers, setAffiliateRefers] = useState(10); // Calculator state
  const [affiliatePlanType, setAffiliatePlanType] = useState<'pro' | 'plus'>('pro'); // Calculator Plan Selector

  const [isPayoutModalOpen, setIsPayoutModalOpen] = useState(false);
  const [payoutMethod, setPayoutMethod] = useState('yape');
  const [payoutAccount, setPayoutAccount] = useState('');

  // Real Affiliate Data Hooks
  const [realAffiliatesCount, setRealAffiliatesCount] = useState(0);
  useEffect(() => {
    if (!user?.uid) return;
    const fetchAffiliates = async () => {
      try {
        const q = query(collection(db, 'profiles'), where('referred_by', '==', user.uid));
        const snapshot = await getDocs(q);
        setRealAffiliatesCount(snapshot.size);
      } catch (e) {
        console.error("Error fetching affiliates", e);
      }
    };
    fetchAffiliates();
  }, [user]);

  const pendingEarnings = realAffiliatesCount * 30; // Min commission S/ 30
  const minWithdrawal = 100;

  useEffect(() => {
    // Detect currency based on locale or current app language
    const currentLang = i18n.language || navigator.language;
    const isForeign = currentLang?.startsWith('en') || currentLang?.includes('US');
    setCurrency(isForeign ? 'USD' : 'PEN');
  }, [i18n.language]);


  // PWA Install Prompt
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [canInstall, setCanInstall] = useState(false);

  useEffect(() => {
    // Check if already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    if (isStandalone) {
      console.log('App already installed');
      return;
    }

    const handler = (e: any) => {
      console.log('beforeinstallprompt event fired');
      e.preventDefault();
      setDeferredPrompt(e);
      setCanInstall(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // For testing: show button after 2 seconds if in development
    if (import.meta.env.DEV) {
      setTimeout(() => {
        console.log('Dev mode: enabling install button for testing');
        setCanInstall(true);
      }, 2000);
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const installApp = async () => {
    if (!deferredPrompt) {
      toast({
        title: t('dashboard.pwa.not_available'),
        description: t('dashboard.pwa.not_available_desc'),
        variant: 'destructive'
      });
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      toast({ title: t('dashboard.pwa.installed'), description: t('dashboard.pwa.installed_desc') });
    }
    setDeferredPrompt(null);
    setCanInstall(false);
  };

  // AI config form state
  const [aiConfig, setAiConfig] = useState({
    ai_enabled: true,
    ai_provider: 'openai',
    ai_api_key: '',
    ai_model: 'gpt-4o-mini',
    ai_temperature: 0.7,
    ai_max_tokens: 500,
    business_description: '',
    ai_system_prompt: t('dashboard.ai_config.system_prompt_hint'),
    ai_security_prompt: t('dashboard.ai_config.security_prompt_hint'),
  });

  // Widget config form state
  const [formConfig, setFormConfig] = useState({
    template: 'general',
    language: 'es',
    primary_color: '#00C185',
    business_name: 'Lead Widget',
    welcome_message: '¡Hola! ¿En qué podemos ayudarte?',
    whatsapp_destination: '',
    niche_question: '¿En qué distrito te encuentras?',
    trigger_delay: 15,
    // Campos exclusivos para modo personalizado
    custom_placeholder: 'Tu respuesta',
    custom_button_text: 'Continuar',
    custom_confirmation_message: '¡Listo! Te pasamos al WhatsApp del equipo',
    chat_placeholder: 'Escribe tu mensaje...',
    // New behavioral settings
    vibration_intensity: 'soft',
    exit_intent_enabled: true,
    exit_intent_title: '¡Espera!',
    exit_intent_description: 'Prueba Lead Widget gratis por 3 días y aumenta tus ventas.',
    exit_intent_cta: 'Probar Demo Ahora',
    teaser_messages: '¿Cómo podemos ayudarte? 👋\n¿Tienes alguna duda sobre el servicio? ✨\n¡Hola! Estamos en línea para atenderte 🚀',
    // Quick Replies
    quick_replies: '¿Cómo funciona?\nQuiero más información\nVer precios',
    launcher_icon: '',
    hide_branding: false,
  });

  const [showApiKey, setShowApiKey] = useState(false);



  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    } else if (user) {
      loadData();
    }
  }, [user, authLoading, navigate]);



  const loadData = async () => {
    if (!user) return;

    try {
      const userId = user.uid;

      // Load profile
      const profileSnap = await getDoc(doc(db, 'profiles', userId));
      const profileData = profileSnap.exists() ? { id: profileSnap.id, ...profileSnap.data() } as Profile : null;
      setProfile(profileData);

      // Load AI config from profile
      if (profileData) {
        setAiConfig({
          ai_enabled: true,
          ai_provider: profileData.ai_provider || 'openai',
          ai_api_key: profileData.ai_api_key || '',
          ai_model: profileData.ai_model || 'gpt-4o-mini',
          ai_temperature: profileData.ai_temperature || 0.7,
          ai_max_tokens: 500,
          business_description: profileData.business_description || '',
          ai_system_prompt: profileData.ai_system_prompt || t('dashboard.ai_config.system_prompt_hint'),
          ai_security_prompt: profileData.ai_security_prompt || t('dashboard.ai_config.security_prompt_hint'),
        });


      }

      // Load widget config
      const qConfig = query(collection(db, 'widget_configs'), where('user_id', '==', userId));
      const configSnap = await getDocs(qConfig);

      let configData: any = null;

      if (configSnap.empty) {
        // AUTO-CREATE DEFAULT CONFIG FOR NEW USER
        const newWidgetRef = doc(collection(db, 'widget_configs'));
        const defaultConfig = {
          user_id: userId,
          widget_id: Math.random().toString(36).substring(2, 12),
          template: 'general',
          language: 'es',
          primary_color: '#00C165',
          welcome_message: '¡Hola! ¿En qué podemos ayudarte?',
          whatsapp_destination: '',
          niche_question: '¿En qué distrito te encuentras?',
          trigger_delay: 3,
          chat_placeholder: 'Escribe tu mensaje...',
          vibration_intensity: 'soft',
          trigger_exit_intent: true,
          exit_intent_title: '¡Espera!',
          exit_intent_description: 'Prueba Lead Widget gratis por 3 días y aumenta tus ventas.',
          exit_intent_cta: 'Probar Demo Ahora',
          teaser_messages: [
            '¿Cómo podemos ayudarte? 👋',
            '¿Tienes alguna duda sobre el servicio? ✨',
            '¡Hola! Estamos en línea para atenderte 🚀'
          ],
          quick_replies: [
            '¿Cómo funciona?',
            'Quiero más información',
            'Ver precios'
          ],
          created_at: new Date().toISOString()
        };
        await setDoc(newWidgetRef, defaultConfig);
        configData = { id: newWidgetRef.id, ...defaultConfig };
      } else {
        configData = { id: configSnap.docs[0].id, ...configSnap.docs[0].data() };
      }

      if (configData) {
        setWidgetConfig(configData);
        setFormConfig({
          template: configData.template || 'general',
          language: configData.language || 'es',
          primary_color: configData.primary_color || '#00C185',
          business_name: configData.business_name || profileData?.business_name || 'Lead Widget',
          welcome_message: configData.welcome_message || '¡Hola! ¿En qué podemos ayudarte?',
          whatsapp_destination: configData.whatsapp_destination || '',
          niche_question: configData.niche_question || '¿En qué distrito te encuentras?',
          trigger_delay: configData.trigger_delay ?? 3,
          chat_placeholder: configData.chat_placeholder || 'Escribe tu mensaje...',
          custom_placeholder: 'Tu respuesta',
          custom_button_text: 'Continuar',
          custom_confirmation_message: '¡Listo! Te pasamos al WhatsApp del equipo',
          vibration_intensity: configData.vibration_intensity || 'soft',
          exit_intent_enabled: configData.trigger_exit_intent ?? true,
          exit_intent_title: configData.exit_intent_title || '¡Espera!',
          exit_intent_description: configData.exit_intent_description || 'Prueba Lead Widget gratis por 3 días y aumenta tus ventas.',
          exit_intent_cta: configData.exit_intent_cta || 'Probar Demo Ahora',
          teaser_messages: Array.isArray(configData.teaser_messages)
            ? configData.teaser_messages.join('\n')
            : (configData.teaser_messages || [
              '¿Cómo podemos ayudarte? 👋',
              '¿Tienes alguna duda sobre el servicio? ✨',
              '¡Hola! Estamos en línea para atenderte 🚀'
            ]).join('\n'),
          quick_replies: Array.isArray(configData.quick_replies)
            ? configData.quick_replies.join('\n')
            : (configData.quick_replies || '¿Cómo funciona?\nQuiero más información\nVer precios'),
          launcher_icon: configData.launcher_icon || '',
          hide_branding: configData.hide_branding || false,
        });

        if (configData.testimonials_json) {
          try {
            const t = JSON.parse(configData.testimonials_json);
            setTestimonials(Array.isArray(t) ? t : []);
          } catch { setTestimonials([]); }
        }
      }

      // Load leads (remove orderBy)
      const qLeads = query(collection(db, 'leads'), where('client_id', '==', userId));
      const leadsSnap = await getDocs(qLeads);
      const leadsData = leadsSnap.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        // Filter out old 'Visitante' leads (only show converted ones)
        .filter((lead: any) => lead.name !== 'Visitante')
        .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()) as Lead[];

      setLeads(leadsData);

      // Load payments (remove orderBy)
      const qPayments = query(collection(db, 'payments'), where('user_id', '==', userId));
      const paymentSnap = await getDocs(qPayments);
      const paymentsData = paymentSnap.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()) as Payment[];

      setPayments(paymentsData);

      // Load analytics and blocked IPs if widget exists
      // Load Visits (from new 'visits' collection) where client_id == userId
      if (configData) {
        try {
          const qVisits = query(collection(db, 'visits'), where('client_id', '==', userId));
          const visitsSnap = await getDocs(qVisits);
          const totalVisits = visitsSnap.size;

          // --- CHART DATA PROCESSING ---
          try {
            const days = [];
            for (let i = 6; i >= 0; i--) {
              const d = new Date();
              d.setDate(d.getDate() - i);
              days.push(d.toLocaleDateString('es-PE', { weekday: 'short', day: 'numeric' }));
            }

            const chartDataRaw = days.map(day => ({ name: day, visitas: 0, leads: 0 }));
            const todayKey = days[days.length - 1];

            const getDayKey = (ts: any) => {
              if (!ts) return null;
              try {
                let d;
                if (ts?.seconds) d = new Date(ts.seconds * 1000);
                else d = new Date(ts);
                if (isNaN(d.getTime())) return null;
                return d.toLocaleDateString('es-PE', { weekday: 'short', day: 'numeric' });
              } catch (e) { return null; }
            };

            // 1. Process visits
            visitsSnap.docs.forEach(doc => {
              const data = doc.data();
              // Fix: Widget uses 'timestamp', API uses 'created_at'. Check both.
              const dateField = data.created_at || data.timestamp;
              const key = getDayKey(dateField);

              // Only count as 'Today' if key matches todayKey essentially, but for chart we map to days
              // If date is invalid/missing, we shouldn't default to today for historical data integrity, 
              // but for now let's keep it safe or ignore. 
              // Better: If no date, don't plot it, or plot as today only if it really just happened?
              // Let's stick to the mapping but fix the field read.
              if (key) {
                const found = chartDataRaw.find(c => c.name === key);
                if (found) found.visitas++;
              }
            });

            // Calculate Today's counts for the summary card
            const todayStr = new Date().toLocaleDateString('es-PE', { weekday: 'short', day: 'numeric' });
            const todayStats = chartDataRaw.find(c => c.name === todayStr);
            const visitsToday = todayStats ? todayStats.visitas : 0;

            setAnalytics({
              views: totalVisits,
              interactions: totalVisits, // This could be refined if we had distinct 'chats' vs 'visits'
              viewsToday: visitsToday
            });

            // 2. Process leads and ensure they count as visits too
            leadsData.forEach((lead: any) => {
              const key = getDayKey(lead.created_at);
              if (key) {
                const found = chartDataRaw.find(c => c.name === key);
                if (found) {
                  found.leads++;
                  // Only increment visit if it wasn't already tracked (simple heuristic: ensure visits >= leads)
                  if (found.visitas < found.leads) {
                    found.visitas = found.leads;
                  }
                }
              }
            });

            setChartData(chartDataRaw);
          } catch (chartError) {
            console.error('Error calculating chart data:', chartError);
          }



        } catch (analyticsError) {
          console.error('Non-critical: Error loading visits:', analyticsError);
        }
      }

      try {
        // Load blocked IPs
        const qBlocked = query(collection(db, 'blocked_ips'), where('widget_id', '==', configData.id));
        const blockedSnap = await getDocs(qBlocked);
        const blockedData = blockedSnap.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

        setBlockedIps(blockedData);
      } catch (blockedError) {
        console.error('Non-critical: Error loading blocked IPs:', blockedError);
      }




    } catch (error: any) {
      console.error('CRITICAL: Error loading dashboard data:', error);
      toast({
        title: 'Error al cargar datos',
        description: `Error: ${error.message || 'Error desconocido'}`,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const saveWidgetConfig = async () => {
    if (!user || !widgetConfig) return;

    setSaving(true);
    try {
      // Update widget config
      const widgetRef = doc(db, 'widget_configs', widgetConfig.id);
      await updateDoc(widgetRef, {
        template: formConfig.template,
        language: formConfig.language,
        primary_color: formConfig.primary_color,
        business_name: formConfig.business_name, // Also save here for embedded widget
        welcome_message: formConfig.welcome_message,
        whatsapp_destination: formConfig.whatsapp_destination,
        niche_question: formConfig.niche_question,
        trigger_delay: formConfig.trigger_delay,
        chat_placeholder: formConfig.chat_placeholder,
        vibration_intensity: formConfig.vibration_intensity,
        trigger_exit_intent: formConfig.exit_intent_enabled,
        exit_intent_title: formConfig.exit_intent_title,
        exit_intent_description: formConfig.exit_intent_description,
        exit_intent_cta: formConfig.exit_intent_cta,
        teaser_messages: Array.isArray(formConfig.teaser_messages)
          ? formConfig.teaser_messages
          : (typeof formConfig.teaser_messages === 'string'
            ? formConfig.teaser_messages.split('\n').filter((m: string) => m.trim() !== '')
            : formConfig.teaser_messages),
        quick_replies: typeof formConfig.quick_replies === 'string'
          ? formConfig.quick_replies.split('\n').filter((m: string) => m.trim() !== '')
          : formConfig.quick_replies,
        testimonials_json: JSON.stringify(testimonials),
        launcher_icon: formConfig.launcher_icon || ''
      });

      // Update business name in profile
      await updateDoc(doc(db, 'profiles', user.uid), {
        business_name: formConfig.business_name
      });

      toast({
        title: '¡Guardado!',
        description: 'Tu widget ha sido actualizado.',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUploadProof = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Optional: Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'Archivo muy grande',
        description: 'La imagen no debe superar los 5MB.',
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);
    console.log('Iniciando subida de comprobante...');

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.uid}-${Math.floor(Date.now() / 1000)}.${fileExt}`;
      const storageRef = ref(storage, `proofs/${fileName}`);

      // Upload to Firebase Storage
      console.log('Subiendo a Storage:', fileName);
      await uploadBytes(storageRef, file);
      const publicUrl = await getDownloadURL(storageRef);
      console.log('URL obtenida:', publicUrl);

      // Add to payments collection
      console.log('Guardando en Firestore...');
      await addDoc(collection(db, 'payments'), {
        user_id: user.uid,
        amount: 30,
        payment_method: 'Yape/Plin',
        description: 'Suscripción Mensual Lead Widget',
        proof_url: publicUrl,
        status: 'pending',
        created_at: new Date().toISOString()
      });

      toast({
        title: '¡Comprobante enviado!',
        description: 'Revisaremos tu pago pronto para activar tu cuenta.',
      });

      console.log('Actualizando datos del dashboard...');
      await loadData();
    } catch (error: any) {
      console.error('Error detallado de subida:', error);
      toast({
        title: 'Error de subida',
        description: error.code === 'storage/unauthorized'
          ? 'No tienes permiso para subir. Revisa las reglas de Storage.'
          : 'No se pudo subir el archivo. Verifica tu conexión.',
        variant: 'destructive',
      });
    } finally {
      console.log('Proceso de subida finalizado.');
      setUploading(false);
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const copyEmbedCode = () => {
    // Generate the widget URL 
    const currentDomain = window.location.origin;
    const widgetUrl = `${currentDomain}/widget-embed.js`;

    // SaaS Style: Only ID is needed. Config is fetched remotely.
    const configScript = `
<script>
  window.LEADWIDGET_CLIENT_ID = '${user?.uid}';
</script>
<script src="${widgetUrl}" async></script>
`.trim();

    navigator.clipboard.writeText(configScript);
    toast({
      title: t('dashboard.embed.copy_toast_title'),
      description: t('dashboard.embed.copy_toast_desc'),
      duration: 5000,
    });
  };

  const exportLeadsCSV = () => {
    // Helper to escape CSV values
    const escape = (str: string | undefined | null) => {
      if (!str) return '';
      return `"${String(str).replace(/"/g, '""')}"`; // Proper CSV escaping
    };

    const formatDateCSV = (date: any) => {
      if (!date) return '';
      if (date.seconds) return new Date(date.seconds * 1000).toLocaleString('es-PE');
      return new Date(date).toLocaleString('es-PE');
    };

    const formatPhoneCSV = (phone: string) => {
      if (phone === 'Clic en WhatsApp' || phone === 'Usuario WhatsApp') return t('dashboard.leads_export.status_chat_started');
      if (phone === 'Pendiente (Click WA)') return t('dashboard.leads_export.status_pending');
      // Check if phone matches destination number and hide it if preferred, or just show it
      if (formConfig?.whatsapp_destination && phone.replace(/\D/g, '') === formConfig.whatsapp_destination.replace(/\D/g, '')) {
        return 'Chat Iniciado (Redirigido)';
      }
      return phone;
    };

    const headers = (t('dashboard.leads_export.headers', { returnObjects: true }) as string[]);

    const rows = leads.map(lead => [
      escape(lead.name),
      escape(formatPhoneCSV(lead.phone)),
      escape(lead.interest),
      escape(lead.page_url),
      escape(lead.trigger_used || 'IA Chat'),
      escape(formatDateCSV(lead.created_at))
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    // Add BOM for Excel compatibility with clean characters
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `leads_lead_widget_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();

    toast({
      title: t('dashboard.leads_export.toast_title'),
      description: t('dashboard.leads_export.toast_desc'),
    });
  };

  const unblockIp = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'blocked_ips', id));

      setBlockedIps(blockedIps.filter(ip => ip.id !== id));
      toast({
        title: t('dashboard.unblock.toast_title'),
        description: t('dashboard.unblock.toast_desc'),
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleTemplateChange = (value: string) => {
    const template = templates.find(t => t.value === value);
    // Don't overwrite description if switching TO personalizado, allowing user to keep custom text
    const newDescription = value === 'personalizado'
      ? formConfig.niche_question
      : (t(template?.translationKey || '', { defaultValue: formConfig.niche_question }));

    setFormConfig({
      ...formConfig,
      template: value,
      niche_question: newDescription,
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'trial':
        return <span className="badge-trial px-2 py-1 rounded-full text-xs font-medium">{t('dashboard.badges.trial')}</span>;
      case 'active':
        return <span className="badge-active px-2 py-1 rounded-full text-xs font-medium">{t('dashboard.badges.active')}</span>;
      case 'suspended':
        return <span className="badge-suspended px-2 py-1 rounded-full text-xs font-medium">{t('dashboard.badges.suspended')}</span>;
      default:
        return null;
    }
  };

  const getTrialDaysLeft = () => {
    let endDate: Date;

    if (profile?.trial_ends_at) {
      endDate = new Date(profile.trial_ends_at);
    } else if (profile?.created_at) {
      const created = new Date(profile.created_at);
      endDate = new Date(created);
      endDate.setDate(created.getDate() + 3);
    } else {
      return 0; // Fallback
    }

    const diff = endDate.getTime() - new Date().getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  const getTrialEndDateString = () => {
    if (profile?.trial_ends_at) {
      return new Date(profile.trial_ends_at).toLocaleDateString('es-PE');
    }
    if (profile?.created_at) {
      const created = new Date(profile.created_at);
      const end = new Date(created);
      end.setDate(created.getDate() + 3);
      return end.toLocaleDateString('es-PE');
    }
    return '...';
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
      // Fallback redirect
      window.location.href = '/login';
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const isTrialExpired = getTrialDaysLeft() <= 0 && profile?.subscription_status !== 'active';

  // BLOCKING OVERLAY
  if (isTrialExpired) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full shadow-2xl border-primary/20">
          <CardHeader className="text-center pb-2">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <LogOut className="w-8 h-8 text-red-600 ml-1" />
            </div>
            <CardTitle className="text-2xl font-black text-slate-800">¡Tu prueba ha terminado!</CardTitle>
            <CardDescription className="text-base mt-2">
              Esperamos que Lead Widget haya sido útil. Para seguir capturando leads ilimitadamente, activa tu plan hoy.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-6 animate-in fade-in slide-in-from-bottom-4">
            <PayPalPaymentButton
              amount="9.90"
              currency="USD"
              onSuccess={async (details) => {
                try {
                  await addDoc(collection(db, 'payments'), {
                    user_id: user?.uid,
                    amount: 9.90,
                    currency: 'USD',
                    payment_method: 'PayPal',
                    description: 'Lead Widget Pro Subscription',
                    status: 'completed',
                    paypal_order_id: details.id,
                    payer_email: details.payer.email_address,
                    created_at: new Date().toISOString()
                  });

                  if (user?.uid) {
                    await updateDoc(doc(db, 'profiles', user.uid), {
                      subscription_status: 'active',
                      plan_type: 'pro',
                      trial_ends_at: null
                    });
                  }

                  toast({
                    title: "¡Suscripción Activada!",
                    description: "Gracias por confiar en Lead Widget.",
                  });

                  // Reload to update UI
                  window.location.reload();
                } catch (e: any) {
                  console.error("Payment Error: ", e);
                  toast({ title: "Error activando suscripción", description: e.message, variant: "destructive" });
                }
              }}
            />
            <p className="text-xs text-center text-muted-foreground mt-4">Secure payment via PayPal</p>
          </CardContent>
          <CardContent className="space-y-6 pt-6">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-center">
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold mb-1">Plan Mensual</p>
              <div className="flex items-center justify-center gap-1">
                <span className="text-3xl font-black text-primary">S/ 30.00</span>
                <span className="text-sm text-muted-foreground">/mes</span>
              </div>
            </div>

            {!showPayment ? (
              <Button
                className="w-full h-12 text-lg font-bold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all"
                onClick={() => setShowPayment(true)}
              >
                Pagar Ahora
              </Button>
            ) : null}

            {showPayment && (
              <div id="billing-action" className="space-y-4 pt-4 border-t animate-in fade-in slide-in-from-top-4 duration-500">
                <p className="text-center text-sm font-medium mb-2">Métodos de Pago:</p>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-2 bg-sky-50 rounded border border-sky-100">
                    <span className="font-bold block text-sky-700">Scotiabank</span>
                    <span className="font-medium">0997561105</span>
                    <p className="text-[10px] opacity-70">Kenneth Herrera</p>
                  </div>
                  <div className="p-2 bg-purple-50 rounded border border-purple-100">
                    <span className="font-bold block text-purple-700">Yape/Plin</span>
                    902 105 668
                    <p className="text-[10px] opacity-70">Kenneth Herrera</p>
                  </div>
                </div>

                <div className="pt-4">
                  <p className="text-xs text-center text-muted-foreground mb-2">Ingresa tu Nro. de Operación o Titular:</p>
                  <div className="flex gap-2">
                    <Input id="blocked-ref" placeholder="Ej: 123456 o Juan Perez" />
                    <Button onClick={async () => {
                      const refInput = document.getElementById('blocked-ref') as HTMLInputElement;
                      if (!refInput.value) return toast({ title: "Requerido", variant: "destructive" });

                      try {
                        await addDoc(collection(db, 'payments'), {
                          user_id: user?.uid,
                          amount: 30,
                          description: 'Renovación (Blocked)',
                          operation_ref: refInput.value,
                          status: 'pending',
                          created_at: new Date().toISOString()
                        });
                        toast({ title: "Pago reportado", description: "Espera la activación manual." });
                      } catch (e) { toast({ title: "Error", variant: "destructive" }); }
                    }}>Enviar</Button>
                  </div>
                </div>
              </div>
            )}

          </CardContent>
          <div className="p-4 bg-slate-50 text-center text-xs text-muted-foreground border-t rounded-b-xl">
            <button onClick={handleSignOut} className="hover:text-red-500 underline flex items-center justify-center gap-1 w-full">
              <LogOut className="w-3 h-3" /> Cerrar Sesión
            </button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 dark:bg-slate-950 transition-colors duration-300">


      {/* Header */}
      <header className="bg-background border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 select-none">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-xl">Lead Widget</span>
          </div>

          <div className="flex items-center gap-1 sm:gap-3 flex-wrap">
            <LanguageSwitcher />
            {/* Theme Toggle - Removed */}
            {isSuperAdmin && (
              <Link to="/superadmin">
                <Button variant="outline" size="sm" className="hidden sm:flex border-primary text-primary hover:bg-primary/10">
                  <Shield className="w-4 h-4 mr-2" />
                  Panel SuperAdmin
                </Button>
                <Button variant="outline" size="icon" className="sm:hidden border-primary text-primary hover:bg-primary/10">
                  <Shield className="w-4 h-4" />
                </Button>
              </Link>
            )}

            {getStatusBadge(profile?.subscription_status || 'trial')}
            {profile?.subscription_status === 'trial' && (
              <span className="text-sm text-muted-foreground hidden md:inline">
                {getTrialDaysLeft()} días restantes
              </span>
            )}
            {canInstall && (
              <Button variant="outline" size="sm" onClick={installApp} className="hidden sm:flex border-green-500 text-green-600 hover:bg-green-50">
                <Smartphone className="w-4 h-4 mr-2" />
                Instalar App
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={handleSignOut} className="px-2 sm:px-4">
              <LogOut className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">{t('dashboard.sign_out')}</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 max-w-6xl">
        {/* Trial Alert Notice */}
        {profile?.subscription_status === 'trial' && (
          <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-primary/10 border border-primary/20 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in slide-in-from-top-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-xs sm:text-sm">{t('dashboard.trial_alert.title')}</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground">{t('dashboard.trial_alert.subtitle', { date: getTrialEndDateString() })}</p>
              </div>
            </div>
            <div className="text-left sm:text-right ml-11 sm:ml-0">
              <p className="text-base sm:text-lg font-bold text-primary">{t('dashboard.trial_alert.days_left', { count: getTrialDaysLeft() })}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{t('dashboard.trial_alert.remaining')}</p>
            </div>
          </div>
        )}

        {/* Affiliate Card */}
        <AffiliateCard dismissible={true} />

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          {/* Mobile Navigation (Segmented Control) */}
          <div className="sm:hidden grid grid-cols-5 gap-1 mb-6 bg-background/50 backdrop-blur-sm p-1 rounded-2xl sticky top-[73px] z-40 border border-border/50 shadow-sm">
            {/* 1. Widget */}
            <button
              onClick={() => setActiveTab('config')}
              className={`flex flex-col items-center justify-center gap-1 min-h-[56px] rounded-xl transition-all duration-300 active:scale-95 ${activeTab === 'config' ? 'bg-primary/10 text-primary font-bold shadow-sm' : 'text-muted-foreground hover:bg-muted/50'}`}
            >
              <Settings className={`w-5 h-5 ${activeTab === 'config' ? 'stroke-[2.5px]' : ''}`} />
              <span className="text-[10px] leading-none">{t('dashboard.tabs.config')}</span>
            </button>

            {/* 2. IA */}
            <button
              onClick={() => setActiveTab('ai')}
              className={`flex flex-col items-center justify-center gap-1 min-h-[56px] rounded-xl transition-all duration-300 active:scale-95 ${activeTab === 'ai' ? 'bg-primary/10 text-primary font-bold shadow-sm' : 'text-muted-foreground hover:bg-muted/50'}`}
            >
              <Bot className={`w-5 h-5 ${activeTab === 'ai' ? 'stroke-[2.5px]' : ''}`} />
              <span className="text-[10px] leading-none">{t('dashboard.tabs.ai')}</span>
            </button>

            {/* 3. Leads */}
            <button
              onClick={() => setActiveTab('leads')}
              className={`flex flex-col items-center justify-center gap-1 min-h-[56px] rounded-xl transition-all duration-300 active:scale-95 ${activeTab === 'leads' ? 'bg-primary/10 text-primary font-bold shadow-sm' : 'text-muted-foreground hover:bg-muted/50'}`}
            >
              <Users className={`w-5 h-5 ${activeTab === 'leads' ? 'stroke-[2.5px]' : ''}`} />
              <span className="text-[10px] leading-none">{t('dashboard.tabs.leads')}</span>
            </button>

            {/* 4. Data */}
            <button
              onClick={() => setActiveTab('analytics')}
              className={`flex flex-col items-center justify-center gap-1 min-h-[56px] rounded-xl transition-all duration-300 active:scale-95 ${activeTab === 'analytics' ? 'bg-primary/10 text-primary font-bold shadow-sm' : 'text-muted-foreground hover:bg-muted/50'}`}
            >
              <BarChart3 className={`w-5 h-5 ${activeTab === 'analytics' ? 'stroke-[2.5px]' : ''}`} />
              <span className="text-[10px] leading-none">{t('dashboard.tabs.data')}</span>
            </button>

            {/* 5. More (Dropdown) */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className={`flex flex-col items-center justify-center gap-1 min-h-[56px] rounded-xl transition-all duration-300 active:scale-95 ${['security', 'billing'].includes(activeTab) ? 'bg-primary/10 text-primary font-bold shadow-sm' : 'text-muted-foreground hover:bg-muted/50'}`}
                >
                  <MoreHorizontal className="w-5 h-5" />
                  <span className="text-[10px] leading-none">{t('dashboard.tabs.more')}</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 rounded-xl">
                <DropdownMenuItem onClick={() => setActiveTab('security')} className="gap-2 h-10 cursor-pointer">
                  <ShieldCheck className="w-4 h-4" /> {t('dashboard.tabs.security')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setActiveTab('billing')} className="gap-2 h-10 cursor-pointer">
                  <CreditCard className="w-4 h-4" /> {t('dashboard.tabs.billing')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setActiveTab('affiliates')} className="gap-2 h-10 cursor-pointer text-emerald-600 font-bold bg-emerald-50">
                  <Banknote className="w-4 h-4" /> Afiliados
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Desktop Navigation */}
          <TabsList className="hidden sm:grid sm:grid-cols-6 w-full no-scrollbar gap-1 sm:max-w-3xl">
            <TabsTrigger value="config" className="gap-2 flex-shrink-0 px-4">
              <Settings className="w-4 h-4" />
              <span>{t('dashboard.config')}</span>
            </TabsTrigger>
            <TabsTrigger value="ai" className="gap-2 flex-shrink-0 px-4">
              <Bot className="w-4 h-4" />
              <span>{t('dashboard.tabs.ai')}</span>
            </TabsTrigger>
            <TabsTrigger value="leads" className="gap-2 flex-shrink-0 px-4">
              <Users className="w-4 h-4" />
              <span>{t('dashboard.leads')}</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-2 flex-shrink-0 px-4">
              <BarChart3 className="w-4 h-4" />
              <span>{t('dashboard.analytics')}</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="gap-2 flex-shrink-0 px-4">
              <ShieldCheck className="w-4 h-4" />
              <span>{t('dashboard.security')}</span>
            </TabsTrigger>
            <TabsTrigger value="billing" className="gap-2 flex-shrink-0 px-4">
              <CreditCard className="w-4 h-4" />
              <span>{t('dashboard.billing')}</span>
            </TabsTrigger>
            <TabsTrigger value="affiliates" className="gap-2 flex-shrink-0 px-4 text-emerald-600 data-[state=active]:text-emerald-700 data-[state=active]:bg-emerald-50">
              <Banknote className="w-4 h-4" />
              <span>Afiliados</span>
            </TabsTrigger>
          </TabsList>

          {/* Widget Config Tab */}
          <TabsContent value="config" className="space-y-6 overflow-hidden">
            <div className="grid lg:grid-cols-2 gap-4 sm:gap-8">
              {/* Config Form */}
              <Card>
                <CardHeader>
                  <CardTitle>{t('dashboard.widget_config.title')}</CardTitle>
                  <CardDescription>{t('dashboard.widget_config.subtitle')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label>{t('dashboard.widget_config.industry')}</Label>
                    <Select value={formConfig.template} onValueChange={handleTemplateChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {templates.map(tmpl => (
                          <SelectItem key={tmpl.value} value={tmpl.value}>{t(tmpl.label)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <div className="space-y-2 mt-4">
                      <Label>{t('dashboard.widget_language')}</Label>
                      <Select
                        value={formConfig.language}
                        onValueChange={(v) => {
                          setFormConfig(prev => ({ ...prev, language: v }));
                          // Optional: Auto-update helper texts if needed, relying on manual edit for now as per instructions
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="es">{t('dashboard.lang_es')}</SelectItem>
                          <SelectItem value="en">{t('dashboard.lang_en')}</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">{t('dashboard.widget_language_desc')}</p>
                    </div>
                    {formConfig.template === 'personalizado' && (
                      <div className="mt-3 p-3 bg-primary/10 border border-primary/20 rounded-lg">
                        <p className="text-sm text-primary font-medium flex items-center gap-2">
                          <Target className="w-4 h-4" />
                          {t('dashboard.widget_config.custom_mode_active')}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {t('dashboard.widget_config.custom_mode_desc')}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>{t('dashboard.widget_config.business_name')}</Label>
                    <Input
                      value={formConfig.business_name}
                      onChange={(e) => setFormConfig({ ...formConfig, business_name: e.target.value })}
                      placeholder="Ej: Mi Empresa, Clínica San Juan, Taller Express"
                    />
                    <p className="text-xs text-muted-foreground">{t('dashboard.widget_config.business_name_desc')}</p>
                  </div>

                  <div className="space-y-2">
                    <Label>{t('dashboard.widget_config.primary_color')}</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={formConfig.primary_color}
                        onChange={(e) => setFormConfig({ ...formConfig, primary_color: e.target.value })}
                        className="w-12 h-10 p-1 cursor-pointer"
                      />
                      <Input
                        value={formConfig.primary_color}
                        onChange={(e) => setFormConfig({ ...formConfig, primary_color: e.target.value })}
                        className="flex-1 font-mono"
                      />
                    </div>
                  </div>

                  <div className="space-y-3 pt-2 pb-2 border-y border-dashed">
                    <Label className="flex items-center gap-2">
                      <Palette className="w-4 h-4 text-purple-500" />
                      {t('dashboard.widget_config.launcher_icon')}
                    </Label>
                    <div className="grid grid-cols-4 gap-2">
                      {STATIC_ICONS.map((item) => (
                        <div
                          key={item.id}
                          onClick={() => setFormConfig({ ...formConfig, launcher_icon: item.value })}
                          className={`
                            border rounded-lg p-2 cursor-pointer transition-all hover:bg-slate-50 dark:hover:bg-slate-800 flex flex-col items-center gap-2
                            ${formConfig.launcher_icon === item.value
                              ? 'ring-2 ring-primary bg-primary/10'
                              : 'border-slate-200 dark:border-slate-700 bg-transparent'}
                          `}
                        >
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors
                            ${formConfig.launcher_icon === item.value ? 'bg-primary text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}
                          `}>
                            <item.icon className="w-5 h-5" />
                          </div>
                          <span className="text-[10px] text-center font-medium leading-tight">{t(item.label)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>{t('dashboard.widget_config.welcome_message')}</Label>
                    <Input
                      value={formConfig.welcome_message}
                      onChange={(e) => setFormConfig({ ...formConfig, welcome_message: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>{t('dashboard.widget_config.chat_placeholder')}</Label>
                    <Input
                      value={formConfig.chat_placeholder}
                      onChange={(e) => setFormConfig({ ...formConfig, chat_placeholder: e.target.value })}
                      placeholder="Ej: Escribe tu duda aquí..."
                    />
                    <p className="text-xs text-muted-foreground">{t('dashboard.widget_config.chat_placeholder_desc')}</p>
                  </div>

                  {/* Info box for Personalizado mode */}
                  {formConfig.template === 'personalizado' && (
                    <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-4 animate-in fade-in slide-in-from-top-2">
                      <h4 className="font-semibold text-blue-800 dark:text-blue-300 text-sm mb-1 flex items-center gap-2">
                        <Sparkles className="w-4 h-4" /> {t('dashboard.widget_config.custom_mode_active')}
                      </h4>
                      <p className="text-xs text-blue-600 dark:text-blue-400">
                        {t('dashboard.widget_config.custom_mode_ai_hint')}
                      </p>
                    </div>
                  )}

                  {/* Campos exclusivos para modo personalizado - REMOVED LEGACY FIELDS */}

                  {/* Logic update for template change handled in function */}

                  <div className="space-y-2">
                    <Label>{t('dashboard.widget_config.whatsapp_dest')}</Label>
                    <Input
                      value={formConfig.whatsapp_destination}
                      onChange={(e) => setFormConfig({ ...formConfig, whatsapp_destination: e.target.value })}
                      placeholder="+51 987 654 321"
                    />
                  </div>

                  {/* Testimonial Management Section */}
                  <div className="space-y-4 pt-4 border-t">
                    <h4 className="font-semibold text-sm flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      {t('dashboard.widget_config.testimonials_title')}
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      {t('dashboard.widget_config.testimonials_desc')}
                    </p>

                    <div className="space-y-3">
                      {testimonials.map((t, index) => (
                        <div key={index} className="flex gap-2 items-start p-3 bg-slate-50 dark:bg-slate-900 border rounded-lg group">
                          <img
                            src={t.avatar_url || `https://ui-avatars.com/api/?name=${t.name.replace(' ', '+')}&background=random`}
                            alt="Avatar"
                            className="w-10 h-10 rounded-full bg-slate-200 object-cover"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start">
                              <p className="font-bold text-sm truncate">{t.name}</p>
                              <div className="flex text-yellow-500 text-[10px]">
                                {[...Array(t.stars)].map((_, i) => <span key={i}>★</span>)}
                              </div>
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-2">{t.text}</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-muted-foreground hover:text-red-500"
                            onClick={() => {
                              const newTestimonials = [...testimonials];
                              newTestimonials.splice(index, 1);
                              setTestimonials(newTestimonials);
                            }}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      ))}

                      <Dialog open={isTestimonialDialogOpen} onOpenChange={setIsTestimonialDialogOpen}>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" className="w-full border-dashed">
                            {t('dashboard.widget_config.add_testimonial')}
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>{t('dashboard.widget_config.new_testimonial.title')}</DialogTitle>
                            <DialogDescription>
                              {t('dashboard.widget_config.new_testimonial.desc')}
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div className="space-y-2">
                              <Label>{t('dashboard.widget_config.new_testimonial.name')}</Label>
                              <Input id="t-name" placeholder="Ej: Juan Pérez" />
                            </div>
                            <div className="space-y-2">
                              <Label>{t('dashboard.widget_config.new_testimonial.text')}</Label>
                              <Input id="t-text" maxLength={80} placeholder="Ej: Excelente servicio, muy rápido." />
                            </div>
                            <div className="space-y-2">
                              <Label>{t('dashboard.widget_config.new_testimonial.stars')}</Label>
                              <Select defaultValue="5" onValueChange={(v) => document.getElementById('t-stars')?.setAttribute('data-value', v)}>
                                <SelectTrigger id="t-stars" data-value="5">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="5">⭐⭐⭐⭐⭐ (5)</SelectItem>
                                  <SelectItem value="4">⭐⭐⭐⭐ (4)</SelectItem>
                                  <SelectItem value="3">⭐⭐⭐ (3)</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label>{t('dashboard.widget_config.new_testimonial.avatar')}</Label>
                              <Input id="t-avatar" placeholder="https://..." />
                              <p className="text-[10px] text-muted-foreground">{t('dashboard.widget_config.new_testimonial.avatar_desc')}</p>
                            </div>
                            <Button onClick={() => {
                              const name = (document.getElementById('t-name') as HTMLInputElement).value;
                              const text = (document.getElementById('t-text') as HTMLInputElement).value;
                              const stars = parseInt((document.getElementById('t-stars') as HTMLElement).getAttribute('data-value') || '5');
                              const avatar = (document.getElementById('t-avatar') as HTMLInputElement).value;

                              if (!name || !text) return toast({ title: "Faltan datos", variant: "destructive" });

                              const newTestimonial = {
                                id: Date.now().toString(),
                                name,
                                text,
                                stars,
                                avatar_url: avatar || undefined
                              };

                              setTestimonials([...testimonials, newTestimonial]);
                              setIsTestimonialDialogOpen(false);
                            }}>
                              {t('dashboard.widget_config.new_testimonial.add_btn')}
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t">
                    <h4 className="font-semibold text-sm">{t('dashboard.widget_config.advanced_behavior')}</h4>

                    <div className="space-y-2">
                      <Label>{t('dashboard.widget_config.movement_intensity')}</Label>
                      <Select
                        value={formConfig.vibration_intensity}
                        onValueChange={(v) => setFormConfig({ ...formConfig, vibration_intensity: v })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">{t('dashboard.widget_config.intensity_none')}</SelectItem>
                          <SelectItem value="soft">{t('dashboard.widget_config.intensity_soft')}</SelectItem>
                          <SelectItem value="strong">{t('dashboard.widget_config.intensity_strong')}</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">{t('dashboard.widget_config.movement_desc')}</p>
                    </div>

                    <div className="space-y-4 p-4 bg-muted/50 rounded-xl border">
                      <div className="flex items-center justify-between">
                        <Label className="cursor-pointer" htmlFor="exit-intent">{t('dashboard.widget_config.exit_intent')}</Label>
                        <Switch
                          id="exit-intent"
                          checked={formConfig.exit_intent_enabled}
                          onCheckedChange={(checked) => setFormConfig({ ...formConfig, exit_intent_enabled: checked })}
                        />
                      </div>

                      {formConfig.exit_intent_enabled && (
                        <div className="space-y-4 mt-4 animate-in fade-in slide-in-from-top-2">
                          <div className="space-y-2">
                            <Label className="text-xs">{t('dashboard.widget_config.exit_intent_title')}</Label>
                            <Input
                              value={formConfig.exit_intent_title}
                              onChange={(e) => setFormConfig({ ...formConfig, exit_intent_title: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs">{t('dashboard.widget_config.exit_intent_desc')}</Label>
                            <textarea
                              value={formConfig.exit_intent_description}
                              onChange={(e) => setFormConfig({ ...formConfig, exit_intent_description: e.target.value })}
                              className="w-full p-2 text-xs border rounded-md bg-background min-h-[60px]"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs">{t('dashboard.widget_config.exit_intent_cta')}</Label>
                            <Input
                              value={formConfig.exit_intent_cta}
                              onChange={(e) => setFormConfig({ ...formConfig, exit_intent_cta: e.target.value })}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* PLUS Plan: Hide Branding */}
                    <div className="space-y-4 p-4 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl border-2 border-emerald-200">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Label className="cursor-pointer font-semibold text-emerald-900" htmlFor="hide-branding">
                              🎁 Ocultar Marca de Agua
                            </Label>
                            {profile?.plan_type === 'plus' && (
                              <span className="text-[10px] bg-emerald-600 text-white px-2 py-0.5 rounded-full font-bold">
                                PLAN PLUS
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-emerald-700">
                            {profile?.plan_type === 'plus'
                              ? 'Activa esta opción para remover "⚡ Tecnología LeadWidget" del pie de tu chat.'
                              : 'Actualiza al Plan PLUS (S/ 60/mes) para remover la marca de agua y tener un widget 100% tuyo.'
                            }
                          </p>
                        </div>
                        <Switch
                          id="hide-branding"
                          checked={formConfig.hide_branding || false}
                          onCheckedChange={(checked) => setFormConfig({ ...formConfig, hide_branding: checked })}
                          disabled={profile?.plan_type !== 'plus'}
                          className={profile?.plan_type !== 'plus' ? 'opacity-50' : ''}
                        />
                      </div>
                      {profile?.plan_type !== 'plus' && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full border-emerald-600 text-emerald-700 hover:bg-emerald-50"
                          onClick={() => setActiveTab('billing')}
                        >
                          🚀 Actualizar a Plan PLUS
                        </Button>
                      )}
                    </div>
                  </div>

                  <Button onClick={saveWidgetConfig} disabled={saving} className="w-full">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : t('dashboard.widget_config.save_btn')}
                  </Button>
                </CardContent>
              </Card>

              {/* Preview - Responsive */}
              <div className="space-y-4 sm:space-y-6 lg:sticky lg:top-24 h-fit">
                <Card>
                  <CardHeader className="pb-2 sm:pb-6">
                    <CardTitle className="text-base sm:text-lg">{t('dashboard.widget_config.preview_title')}</CardTitle>
                    <CardDescription className="text-xs sm:text-sm">{t('dashboard.widget_config.preview_subtitle')}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4 sm:space-y-6">
                    {/* Widget Preview Container - Responsive (View-only, no interactions) */}
                    <div className="relative h-[350px] sm:h-[500px] bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden p-2 sm:p-6 flex justify-center items-center">
                      <div className="w-full max-w-[280px] sm:max-w-[320px] h-full max-h-[320px] sm:max-h-[480px] shadow-2xl rounded-2xl overflow-hidden border border-slate-200 bg-white transform scale-[0.85] sm:scale-100 origin-center pointer-events-none select-none">
                        <WidgetPreview
                          primaryColor={formConfig.primary_color}
                          welcomeMessage={formConfig.welcome_message}
                          template={formConfig.template}
                          businessName={formConfig.business_name}
                          customPlaceholder={formConfig.custom_placeholder}
                          customButtonText={formConfig.custom_button_text}
                          customConfirmationMessage={formConfig.custom_confirmation_message}
                          chatPlaceholder={formConfig.chat_placeholder}
                          vibrationIntensity={formConfig.vibration_intensity as any}
                          exitIntentEnabled={formConfig.exit_intent_enabled}
                          exitIntentTitle={formConfig.exit_intent_title}
                          exitIntentDescription={formConfig.exit_intent_description}
                          exitIntentCTA={formConfig.exit_intent_cta}
                          mode="dashboard"
                          language={formConfig.language as 'es' | 'en'}
                        />
                      </div>
                    </div>

                    {/* Teaser Messages Editor */}
                    <div className="space-y-3 p-4 bg-muted/50 rounded-xl border">
                      <div>
                        <Label>{t('dashboard.widget_config.teaser_messages')}</Label>
                        <p className="text-[10px] text-muted-foreground mt-1">{t('dashboard.widget_config.teaser_desc')}</p>
                      </div>
                      <textarea
                        value={formConfig.teaser_messages}
                        onChange={(e) => setFormConfig({ ...formConfig, teaser_messages: e.target.value })}
                        className="w-full p-3 text-xs border rounded-md bg-background min-h-[80px]"
                        placeholder="Escribe un mensaje por línea..."
                      />
                      <p className="text-[10px] text-primary italic">{t('dashboard.widget_config.teaser_hint')}</p>
                    </div>

                    {/* Quick Replies Editor */}
                    <div className="space-y-3 p-4 bg-muted/50 rounded-xl border">
                      <div>
                        <Label>{t('dashboard.widget_config.quick_replies')}</Label>
                        <p className="text-[10px] text-muted-foreground mt-1">{t('dashboard.widget_config.quick_replies_desc')}</p>
                      </div>
                      <textarea
                        value={formConfig.quick_replies}
                        onChange={(e) => setFormConfig({ ...formConfig, quick_replies: e.target.value })}
                        className="w-full p-3 text-xs border rounded-md bg-background min-h-[80px]"
                        placeholder="Escribe un atajo por línea..."
                      />
                      <p className="text-[10px] text-primary italic">{t('dashboard.widget_config.quick_replies_hint')}</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 border-indigo-100 dark:border-slate-700">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Rocket className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                      Activa tu Widget
                    </CardTitle>
                    <CardDescription>Conéctalo a tu web para empezar a recibir clientes.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Button asChild className="w-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200 dark:shadow-none transition-all py-6 rounded-xl group" size="lg">
                      <Link to="/installation-guide">
                        <BookOpen className="w-5 h-5 mr-3 group-hover:scale-110 transition-transform" />
                        <span className="font-semibold text-base">Ver Guía de Instalación</span>
                      </Link>
                    </Button>
                    <p className="text-xs text-center text-muted-foreground">
                      Compatible con WordPress, Shopify, Wix y más.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* AI Configuration Tab */}
          <TabsContent value="ai" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <CardTitle>{t('dashboard.ai_config.title')}</CardTitle>
                    <CardDescription>{t('dashboard.ai_config.subtitle')}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">


                {/* AI Provider */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Key className="w-4 h-4" />
                    {t('dashboard.ai_config.provider')}
                  </Label>
                  <Select value={aiConfig.ai_provider} onValueChange={(value) => setAiConfig({ ...aiConfig, ai_provider: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {aiConfig.ai_provider === 'openai' && (
                        <>
                          <SelectItem value="openai">OpenAI (GPT-4, GPT-3.5)</SelectItem>
                          <SelectItem value="anthropic">Anthropic (Claude)</SelectItem>
                          <SelectItem value="google">Google (Gemini)</SelectItem>
                        </>
                      )}
                      {aiConfig.ai_provider === 'anthropic' && (
                        <>
                          <SelectItem value="openai">OpenAI (GPT-4, GPT-3.5)</SelectItem>
                          <SelectItem value="anthropic">Anthropic (Claude)</SelectItem>
                          <SelectItem value="google">Google (Gemini)</SelectItem>
                        </>
                      )}
                      {aiConfig.ai_provider === 'google' && (
                        <>
                          <SelectItem value="openai">OpenAI (GPT-4, GPT-3.5)</SelectItem>
                          <SelectItem value="anthropic">Anthropic (Claude)</SelectItem>
                          <SelectItem value="google">Google (Gemini)</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {/* API Key */}
                <div className="space-y-2">
                  <Label>{t('dashboard.ai_config.api_key')}</Label>
                  <div className="relative">
                    <Input
                      type={showApiKey ? "text" : "password"}
                      value={aiConfig.ai_api_key}
                      onChange={(e) => setAiConfig({ ...aiConfig, ai_api_key: e.target.value })}
                      placeholder="sk-..."
                      className="pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                    >
                      {showApiKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {aiConfig.ai_provider === 'openai' && t('dashboard.ai_config.get_key_openai')}
                    {aiConfig.ai_provider === 'anthropic' && t('dashboard.ai_config.get_key_anthropic')}
                    {aiConfig.ai_provider === 'google' && t('dashboard.ai_config.get_key_google')}
                  </p>
                </div>

                {/* NUEVO: Guía de Autoservicio */}
                <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 dark:from-blue-950/30 dark:to-indigo-950/30 dark:border-blue-800 transition-colors">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-blue-600" />
                      {t('dashboard.ai_config.guide.title')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="bg-white/90 dark:bg-slate-900/60 p-4 rounded-lg space-y-3 text-sm border border-blue-100 dark:border-blue-900/50 shadow-sm">
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold flex-shrink-0 text-xs">1</div>
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-slate-100">{t('dashboard.ai_config.guide.step1_title')}</p>
                          <p className="text-slate-600 dark:text-slate-300">{t('dashboard.ai_config.guide.step1_desc')}</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold flex-shrink-0 text-xs">2</div>
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-slate-100">{t('dashboard.ai_config.guide.step2_title')}</p>
                          <p className="text-slate-600 dark:text-slate-300">{t('dashboard.ai_config.guide.step2_desc')}</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold flex-shrink-0 text-xs">3</div>
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-slate-100">{t('dashboard.ai_config.guide.step3_title')}</p>
                          <p className="text-slate-600 dark:text-slate-300">{t('dashboard.ai_config.guide.step3_desc')}</p>
                        </div>
                      </div>

                      {/* Multilingual Badge */}
                      <div className="mt-4 p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg border border-indigo-200 dark:border-indigo-800 flex items-center gap-3">
                        <div className="bg-indigo-600 text-white p-2 rounded-full">
                          <Globe className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-bold text-indigo-900 dark:text-indigo-100 text-xs uppercase tracking-wider">{t('dashboard.ai_config.guide.multilingual_new')}</p>
                          <p className="text-xs text-indigo-700 dark:text-indigo-300">{t('dashboard.ai_config.guide.multilingual_desc')}</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg">
                      <p className="text-xs text-amber-800 font-medium flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <span><strong>{t('dashboard.ai_config.guide.costs_title')}</strong> {t('dashboard.ai_config.guide.costs_desc')}</span>
                      </p>
                    </div>

                    <div className="bg-green-50 border border-green-200 p-3 rounded-lg">
                      <p className="text-xs text-green-800 flex items-start gap-2">
                        <Check className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <span><strong>{t('dashboard.ai_config.guide.security_title')}</strong> {t('dashboard.ai_config.guide.security_desc')}</span>
                      </p>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => window.open('https://platform.openai.com/api-keys', '_blank')}
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      {t('dashboard.ai_config.guide.open_platform')}
                    </Button>
                  </CardContent>
                </Card>

                {/* Model Selection */}
                <div className="space-y-2">
                  <Label>{t('dashboard.ai_config.model')}</Label>
                  <Select value={aiConfig.ai_model} onValueChange={(value) => setAiConfig({ ...aiConfig, ai_model: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {aiConfig.ai_provider === 'openai' && (
                        <>
                          <SelectItem value="gpt-4o">GPT-4o (Más potente)</SelectItem>
                          <SelectItem value="gpt-4o-mini">GPT-4o Mini (Recomendado)</SelectItem>
                          <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo (Económico)</SelectItem>
                        </>
                      )}
                      {aiConfig.ai_provider === 'anthropic' && (
                        <>
                          <SelectItem value="claude-3-opus">Claude 3 Opus</SelectItem>
                          <SelectItem value="claude-3-sonnet">Claude 3 Sonnet</SelectItem>
                          <SelectItem value="claude-3-haiku">Claude 3 Haiku</SelectItem>
                        </>
                      )}
                      {aiConfig.ai_provider === 'google' && (
                        <>
                          <SelectItem value="gemini-pro">Gemini Pro</SelectItem>
                          <SelectItem value="gemini-pro-vision">Gemini Pro Vision</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {/* Temperature */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>{t('dashboard.ai_config.temperature', { value: aiConfig.ai_temperature })}</Label>
                    <span className="text-xs text-muted-foreground">{t('dashboard.ai_config.creativity')}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={aiConfig.ai_temperature}
                    onChange={(e) => setAiConfig({ ...aiConfig, ai_temperature: parseFloat(e.target.value) })}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{t('dashboard.ai_config.precise')}</span>
                    <span>{t('dashboard.ai_config.creative')}</span>
                  </div>
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                    🌟 {t('dashboard.ai_config.rec_temp')}
                  </p>
                </div>

                {/* Max Tokens */}
                <div className="space-y-2">
                  <Label>{t('dashboard.ai_config.max_tokens')}</Label>
                  <Input
                    type="number"
                    value={aiConfig.ai_max_tokens}
                    onChange={(e) => setAiConfig({ ...aiConfig, ai_max_tokens: parseInt(e.target.value) })}
                    min={100}
                    max={4000}
                  />
                  <p className="text-xs text-muted-foreground">{t('dashboard.ai_config.tokens_desc')}</p>
                </div>

                {/* Business Description */}
                <div className="space-y-2">
                  <Label>{t('dashboard.ai_config.business_desc')}</Label>
                  <textarea
                    value={aiConfig.business_description}
                    onChange={(e) => setAiConfig({ ...aiConfig, business_description: e.target.value })}
                    rows={4}
                    className="w-full p-3 text-sm border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary bg-slate-50 text-slate-900 placeholder:text-slate-400"
                    placeholder={t('dashboard.ai_config.business_desc_hint')}
                  />
                  <p className="text-xs text-muted-foreground">{t('dashboard.ai_config.business_desc_sub')}</p>
                </div>

                {/* System Prompt */}
                <div className="space-y-2">
                  <Label>{t('dashboard.ai_config.system_prompt')}</Label>
                  <textarea
                    value={aiConfig.ai_system_prompt}
                    onChange={(e) => setAiConfig({ ...aiConfig, ai_system_prompt: e.target.value })}
                    rows={6}
                    className="w-full p-3 text-sm border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary bg-slate-50 text-slate-900 placeholder:text-slate-400"
                    placeholder={t('dashboard.ai_config.system_prompt_hint')}
                  />
                  <p className="text-xs text-muted-foreground">
                    {t('dashboard.ai_config.system_prompt_sub')}
                  </p>
                </div>

                {/* Security Prompt */}
                <div className="space-y-2 border-t pt-6">
                  <Label className="flex items-center gap-2 text-red-600 dark:text-red-400">
                    <ShieldAlert className="w-4 h-4" /> {t('dashboard.ai_config.security_prompt')}
                  </Label>
                  <textarea
                    value={aiConfig.ai_security_prompt}
                    onChange={(e) => setAiConfig({ ...aiConfig, ai_security_prompt: e.target.value })}
                    rows={4}
                    className="w-full p-3 text-sm border-2 border-red-500/20 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-red-500 bg-red-500/5 text-foreground placeholder:text-muted-foreground font-medium"
                    placeholder={t('dashboard.ai_config.security_prompt_hint')}
                  />
                  <p className="text-xs text-red-600 dark:text-red-400 font-medium">
                    {t('dashboard.ai_config.security_prompt_sub')}
                  </p>
                </div>

                <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 text-sm space-y-3">
                  <p className="font-semibold text-blue-800 dark:text-blue-300 flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    {t('dashboard.ai_config.redirect_title')}
                  </p>
                  <p className="text-blue-700 dark:text-blue-400 text-xs">
                    {t('dashboard.ai_config.redirect_desc')}
                  </p>
                  <div className="bg-background/80 p-3 rounded border border-blue-200 dark:border-blue-800 text-xs font-mono space-y-1 overflow-x-auto">
                    <p className="text-muted-foreground">// {t('dashboard.ai_config.redirect_title')}</p>
                    <p className="text-green-600 dark:text-green-400">"Pide Nombre, Fecha y Servicio. Cuando tengas todo, pregunta si quiere confirmar."</p>
                    <p className="text-green-600 dark:text-green-400">"{t('dashboard.ai_config.redirect_example')}"</p>
                    <p className="text-primary font-bold">[WHATSAPP_REDIRECT: Cliente Juan Pérez quiere Cita Dental el Lunes]</p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {t('dashboard.ai_config.redirect_note')}
                  </p>
                </div>

                {/* Save Button */}
                <Button
                  onClick={async () => {
                    if (!user || !widgetConfig) return;
                    setSavingAI(true);
                    try {
                      // Save to profiles (for dashboard access)
                      await updateDoc(doc(db, 'profiles', user.uid), {
                        ai_enabled: true,
                        ai_provider: aiConfig.ai_provider,
                        ai_api_key: aiConfig.ai_api_key,
                        ai_model: aiConfig.ai_model,
                        ai_temperature: aiConfig.ai_temperature,
                        ai_max_tokens: aiConfig.ai_max_tokens,
                        business_description: aiConfig.business_description,
                        ai_system_prompt: aiConfig.ai_system_prompt,
                        ai_security_prompt: aiConfig.ai_security_prompt,
                      });

                      // ALSO save to widget_configs (for embedded widget public access)
                      await updateDoc(doc(db, 'widget_configs', widgetConfig.id), {
                        ai_enabled: true,
                        ai_provider: aiConfig.ai_provider,
                        ai_api_key: aiConfig.ai_api_key,
                        ai_model: aiConfig.ai_model,
                        ai_temperature: aiConfig.ai_temperature,
                        ai_max_tokens: aiConfig.ai_max_tokens,
                        business_description: aiConfig.business_description,
                        ai_system_prompt: aiConfig.ai_system_prompt,
                        ai_security_prompt: aiConfig.ai_security_prompt,
                      });

                      toast({
                        title: `✅ ${t('dashboard.ai_config.saved_toast')}`,
                        description: t('dashboard.ai_config.saved_desc'),
                      });
                    } catch (error: any) {
                      toast({
                        title: 'Error',
                        description: error.message,
                        variant: 'destructive',
                      });
                    } finally {
                      setSavingAI(false);
                    }
                  }}
                  disabled={savingAI}
                  className="w-full"
                >
                  {savingAI ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
                  {t('dashboard.ai_config.save_btn')}
                </Button>

                {/* Info Card */}
                <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-xl">
                  <div className="flex gap-3">
                    <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                    <div className="space-y-2 text-sm">
                      <p className="font-medium text-blue-900 dark:text-blue-100">{t('dashboard.ai_config.chatbot_how')}</p>
                      <ul className="space-y-1 text-blue-700 dark:text-blue-300 list-disc list-inside">
                        {(t('dashboard.ai_config.how_items', { returnObjects: true }) as string[]).map((item: string, i: number) => (
                          <li key={i}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Leads Tab */}
          <TabsContent value="leads" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>{t('dashboard.leads_list.title')}</CardTitle>
                  <CardDescription>{t('dashboard.leads_list.total', { count: leads.length })}</CardDescription>
                </div>
                <Button variant="outline" onClick={exportLeadsCSV} disabled={leads.length === 0}>
                  <Download className="w-4 h-4 mr-2" />
                  {t('dashboard.leads_list.export_csv')}
                </Button>
              </CardHeader>
              <CardContent>
                {leads.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-2xl">
                    <Users className="w-12 h-12 mx-auto mb-4 opacity-10" />
                    <p>{t('dashboard.leads_list.no_leads')}</p>
                    <p className="text-sm mt-1">{t('dashboard.leads_list.install_hint')}</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b text-xs uppercase tracking-wider text-muted-foreground">
                          <th className="text-left py-3 px-4 font-medium">{t('dashboard.leads_list.table_name')}</th>
                          <th className="text-left py-3 px-4 font-medium">{t('dashboard.leads_list.table_phone')}</th>
                          <th className="text-left py-3 px-4 font-medium">{t('dashboard.leads_list.table_interest')}</th>
                          <th className="text-left py-3 px-4 font-medium">{t('dashboard.leads_list.table_date')}</th>
                        </tr>
                      </thead>
                      <tbody className="text-sm">
                        {leads.map((lead) => (
                          <tr key={lead.id} className="border-b hover:bg-muted/50 transition-colors">
                            <td className="py-4 px-4 font-medium">{lead.name}</td>
                            <td className="py-4 px-4 font-mono text-xs">
                              {(lead.phone === 'Clic en WhatsApp' ||
                                lead.phone === 'Usuario WhatsApp' ||
                                (formConfig?.whatsapp_destination && lead.phone.replace(/\D/g, '') === formConfig.whatsapp_destination.replace(/\D/g, ''))) ? (
                                <span className="flex items-center gap-1 text-green-600 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-full border border-green-200 dark:border-green-800 w-fit font-sans font-medium">
                                  <MessageCircle className="w-3 h-3" /> {t('dashboard.leads_list.status_started')}
                                </span>
                              ) : lead.phone === 'Pendiente (Click WA)' ? (
                                <span className="text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">{t('dashboard.leads_list.status_pending')}</span>
                              ) : (
                                <a href={`https://wa.me/${lead.phone.replace(/\D/g, '')}`} target="_blank" className="text-primary hover:underline">{lead.phone}</a>
                              )}
                            </td>
                            <td className="py-4 px-4 text-muted-foreground truncate max-w-[200px]">{lead.interest || '-'}</td>
                            <td className="py-4 px-4 text-muted-foreground text-xs">
                              {(() => {
                                const d = lead.created_at;
                                if (!d) return '-';
                                // Handle Firestore Timestamp (seconds)
                                if (d.seconds) return new Date(d.seconds * 1000).toLocaleString('es-PE');
                                // Handle string ISO or Date
                                return new Date(d).toLocaleString('es-PE');
                              })()}
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

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid md:grid-cols-3 gap-6">
              <Card className="stat-card">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{t('dashboard.analytics_view.views')}</p>
                      <div className="flex items-baseline gap-2">
                        <p className="text-3xl font-bold">{analytics.views}</p>
                        {analytics.viewsToday > 0 && (
                          <span className="text-xs font-medium text-green-600 bg-green-100 px-1.5 py-0.5 rounded-full">
                            {t('dashboard.analytics_view.today', { count: analytics.viewsToday })}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="w-12 h-12 bg-secondary/10 rounded-xl flex items-center justify-center">
                      <Eye className="w-6 h-6 text-secondary" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="stat-card">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{t('dashboard.analytics_view.leads')}</p>
                      <p className="text-3xl font-bold">{leads.length}</p>
                    </div>
                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                      <Users className="w-6 h-6 text-primary" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="stat-card">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{t('dashboard.analytics_view.conversion')}</p>
                      <p className="text-3xl font-bold">
                        {analytics.views > 0 ? Math.round((leads.length / analytics.views) * 100) : 0}%
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>{t('dashboard.analytics_view.weekly_title')}</CardTitle>
                <CardDescription>{t('dashboard.analytics_view.weekly_subtitle')}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 w-full pt-4">
                  {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.5} />
                        <XAxis
                          dataKey="name"
                          fontSize={10}
                          tickLine={false}
                          axisLine={false}
                          stroke="hsl(var(--muted-foreground))"
                        />
                        <YAxis
                          fontSize={10}
                          tickLine={false}
                          axisLine={false}
                          stroke="hsl(var(--muted-foreground))"
                          allowDecimals={false}
                        />
                        <RechartsTooltip
                          cursor={{ fill: 'hsl(var(--muted)/0.3)' }}
                          contentStyle={{
                            backgroundColor: 'hsl(var(--popover))',
                            borderColor: 'hsl(var(--border))',
                            borderRadius: '8px',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                            fontSize: '12px'
                          }}
                          itemStyle={{ color: 'hsl(var(--popover-foreground))' }}
                          labelStyle={{ color: 'hsl(var(--muted-foreground))', marginBottom: '4px' }}
                        />
                        <Bar
                          dataKey="visitas"
                          fill="hsl(var(--secondary))"
                          radius={[4, 4, 0, 0]}
                          name="Visitas"
                          maxBarSize={50}
                        />
                        <Bar
                          dataKey="leads"
                          fill="hsl(var(--primary))"
                          radius={[4, 4, 0, 0]}
                          name="Leads"
                          maxBarSize={50}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      <p>Cargando datos...</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <CardTitle>{t('dashboard.security_tab.title')}</CardTitle>
                    <CardDescription>{t('dashboard.security_tab.subtitle')}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl flex gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-amber-800 dark:text-amber-200">
                    {t('dashboard.security_tab.banner_desc')}
                  </p>
                </div>

                {blockedIps.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-2xl">
                    <ShieldCheck className="w-12 h-12 mx-auto mb-4 opacity-10" />
                    <p>{t('dashboard.security_tab.no_blocked')}</p>
                    <p className="text-sm">{t('dashboard.security_tab.shield_active')}</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b text-xs uppercase tracking-wider text-muted-foreground">
                          <th className="text-left py-3 px-4 font-medium">{t('dashboard.security_tab.table_ip')}</th>
                          <th className="text-left py-3 px-4 font-medium">{t('dashboard.security_tab.table_reason')}</th>
                          <th className="text-left py-3 px-4 font-medium">{t('dashboard.security_tab.table_date')}</th>
                          <th className="text-right py-3 px-4 font-medium">{t('dashboard.security_tab.table_action')}</th>
                        </tr>
                      </thead>
                      <tbody className="text-sm">
                        {blockedIps.map((ip) => (
                          <tr key={ip.id} className="border-b hover:bg-muted/50 transition-colors">
                            <td className="py-4 px-4 font-mono">{ip.ip_address}</td>
                            <td className="py-4 px-4">
                              <span className="px-2 py-1 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-md text-xs font-medium">
                                {ip.reason || t('dashboard.security_tab.reason_default')}
                              </span>
                            </td>
                            <td className="py-4 px-4 text-muted-foreground">
                              {new Date(ip.created_at).toLocaleString('es-PE')}
                            </td>
                            <td className="py-4 px-4 text-right">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => unblockIp(ip.id)}
                                className="text-primary border-primary/20 hover:bg-primary/10"
                              >
                                {t('dashboard.security_tab.unblock_btn')}
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

          {/* Billing Tab */}
          <TabsContent value="billing" className="space-y-6">
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Plan Status */}
              <Card className="lg:col-span-1">
                <CardHeader>
                  <CardTitle>{t('dashboard.billing_section.title')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-6 bg-slate-50 dark:bg-slate-900 border dark:border-slate-800 rounded-2xl">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold mb-1">{t('dashboard.billing_section.current_plan')}</p>
                        <p className="text-2xl font-black text-primary capitalize">{profile?.plan_type || 'Trial'}</p>
                      </div>
                      {getStatusBadge(profile?.subscription_status || 'trial')}
                    </div>

                    <div className="space-y-3 py-4 border-t border-slate-200 mt-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{t('dashboard.billing_section.table_amount')}:</span>
                        <span className="font-bold text-slate-900 dark:text-white">{t('dashboard.billing_section.price_usd')} <span className="text-xs text-muted-foreground font-medium">{t('dashboard.billing_section.price_pen')}</span></span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{t('dashboard.billing_section.next_payment')}</span>
                        <span className="font-bold text-slate-900 dark:text-white">{getTrialEndDateString()}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Upgrade to PLUS - Only show if not already PLUS */}
              {profile?.plan_type !== 'plus' && (
                <Card className="lg:col-span-1 border-2 border-emerald-500 bg-gradient-to-br from-emerald-50 to-cyan-50 dark:from-emerald-950/30 dark:to-cyan-950/30">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-emerald-500 rounded-lg">
                        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                        </svg>
                      </div>
                      <div>
                        <CardTitle className="text-emerald-900 dark:text-emerald-100">Plan PLUS</CardTitle>
                        <p className="text-xs text-emerald-700 dark:text-emerald-300">Widget 100% Personalizable</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-center py-4">
                      <div className="flex items-baseline justify-center gap-2 mb-1">
                        <span className="text-4xl font-black text-emerald-900 dark:text-emerald-100">
                          {currency === 'USD' ? '$29' : 'S/ 60'}
                        </span>
                        <span className="text-sm text-emerald-700 dark:text-emerald-300">/mes</span>
                      </div>
                      <p className="text-xs text-emerald-600 dark:text-emerald-400">
                        {currency === 'USD'
                          ? '(~S/ 110/mes)'
                          : '(~$16 USD/mes)'}
                      </p>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-200">
                        <Check className="w-4 h-4 text-emerald-600" />
                        <span className="font-semibold">🎁 Sin marca de agua</span>
                      </div>
                      <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-200">
                        <Check className="w-4 h-4 text-emerald-600" />
                        <span>Widget 100% tuyo</span>
                      </div>
                      <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-200">
                        <Check className="w-4 h-4 text-emerald-600" />
                        <span>Soporte prioritario</span>
                      </div>
                      <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-200">
                        <Check className="w-4 h-4 text-emerald-600" />
                        <span>Estadísticas avanzadas</span>
                      </div>
                    </div>

                    <Button
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                      onClick={() => {
                        setSelectedPlan('plus');
                        // Scroll to payment section
                        setTimeout(() => {
                          const paymentSection = document.querySelector('[value="paypal"]');
                          paymentSection?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }, 100);
                        toast({
                          title: "💎 Upgrade a Plan PLUS",
                          description: "Selecciona tu método de pago preferido abajo para actualizar",
                        });
                      }}
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                      </svg>
                      Actualizar a PLUS
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Payment Info */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>{t('dashboard.billing_section.renew_title')}</CardTitle>
                  <CardDescription>{t('dashboard.billing_section.renew_desc')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Plan Selector */}
                  <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800/50 dark:to-slate-900/50 p-6 rounded-2xl border-2 border-slate-200 dark:border-slate-700">
                    <h3 className="font-bold text-lg mb-4 text-center">Selecciona tu Plan</h3>
                    <div className="grid grid-cols-2 gap-4">
                      {/* Pro Plan (Antes Estándar) */}
                      <button
                        onClick={() => setSelectedPlan('standard')}
                        className={`p-4 rounded-xl border-2 transition-all ${selectedPlan === 'standard'
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30 shadow-lg scale-105'
                          : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 hover:border-blue-300'
                          }`}
                      >
                        <div className="text-center">
                          <div className="text-xs text-slate-600 dark:text-slate-400 mb-1">Plan</div>
                          <div className="font-bold text-lg mb-2">Pro</div>
                          <div className="text-2xl font-black text-blue-600">
                            {currency === 'USD' ? '$15' : 'S/ 30'}
                          </div>
                          <div className="text-[10px] text-slate-500 mt-1">/mes</div>
                          <div className="mt-3 text-xs text-slate-600 dark:text-slate-400">
                            Con marca de agua
                          </div>
                        </div>
                      </button>

                      {/* PLUS Plan */}
                      <button
                        onClick={() => setSelectedPlan('plus')}
                        className={`p-4 rounded-xl border-2 transition-all relative ${selectedPlan === 'plus'
                          ? 'border-emerald-500 bg-gradient-to-br from-emerald-50 to-cyan-50 dark:from-emerald-950/30 dark:to-cyan-950/30 shadow-lg scale-105'
                          : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 hover:border-emerald-300'
                          }`}
                      >
                        {selectedPlan === 'plus' && (
                          <div className="absolute -top-2 -right-2 bg-emerald-500 text-white text-[9px] px-2 py-0.5 rounded-full font-bold">
                            SELECCIONADO
                          </div>
                        )}
                        <div className="text-center">
                          <div className="text-xs text-emerald-600 mb-1">Plan</div>
                          <div className="font-bold text-lg mb-2 flex items-center justify-center gap-1">
                            <span>PLUS</span>
                            <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                            </svg>
                          </div>
                          <div className="text-2xl font-black text-emerald-600">
                            {currency === 'USD' ? '$29' : 'S/ 60'}
                          </div>
                          <div className="text-[10px] text-emerald-600 mt-1">/mes</div>
                          <div className="mt-3 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                            🎁 Sin marca de agua
                          </div>
                        </div>
                      </button>
                    </div>

                    {/* Selected Plan Summary */}
                    <div className="mt-4 p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-600 dark:text-slate-400">Plan seleccionado:</span>
                        <span className="font-bold">
                          {selectedPlan === 'plus' ? 'PLUS' : 'Estándar'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm mt-2">
                        <span className="text-slate-600 dark:text-slate-400">Monto a pagar:</span>
                        <span className="text-xl font-black text-primary">
                          {selectedPlan === 'plus'
                            ? (currency === 'USD' ? '$29' : 'S/ 60')
                            : (currency === 'USD' ? '$15' : 'S/ 30')
                          } /mes
                        </span>
                      </div>
                    </div>
                  </div>

                  <Tabs defaultValue="paypal" className="w-full">
                    <TabsList className={`w-full h-auto min-h-[52px] p-1.5 bg-slate-100 dark:bg-slate-800 rounded-full grid ${currency === 'PEN' ? 'grid-cols-2' : 'grid-cols-1'} mb-8`}>
                      <TabsTrigger
                        value="paypal"
                        className="rounded-full py-2.5 text-xs sm:text-sm font-medium transition-all data-[state=active]:bg-slate-900 data-[state=active]:text-white dark:data-[state=active]:bg-slate-200 dark:data-[state=active]:text-slate-900 data-[state=inactive]:text-slate-500 data-[state=inactive]:hover:bg-transparent whitespace-normal h-full leading-tight flex items-center justify-center px-2"
                      >
                        {t('dashboard.billing_section.tab_paypal')}
                      </TabsTrigger>
                      {currency === 'PEN' && (
                        <TabsTrigger
                          value="local"
                          className="rounded-full py-2.5 text-xs sm:text-sm font-medium transition-all data-[state=active]:bg-slate-900 data-[state=active]:text-white dark:data-[state=active]:bg-slate-200 dark:data-[state=active]:text-slate-900 data-[state=inactive]:text-slate-500 data-[state=inactive]:hover:bg-transparent whitespace-normal h-full leading-tight flex items-center justify-center px-2"
                        >
                          {t('dashboard.billing_section.tab_local')}
                        </TabsTrigger>
                      )}
                    </TabsList>

                    {/* PayPal Tab */}
                    <TabsContent value="paypal" className="space-y-4">
                      <div className="max-w-md mx-auto py-4">
                        <PayPalPaymentButton
                          amount={
                            currency === 'PEN'
                              ? (selectedPlan === 'plus' ? '17.00' : '9.00') // Local price converted to USD check
                              : (selectedPlan === 'plus' ? '29.00' : '15.00') // International price adjusted
                          }
                          currency="USD"
                          onSuccess={async (details) => {
                            try {
                              // Call Server-Side Verification
                              const verifyResponse = await fetch('/api/verify-payment', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                  orderID: details.id,
                                  user_id: user?.uid
                                })
                              });

                              const verifyData = await verifyResponse.json();

                              if (!verifyResponse.ok) {
                                throw new Error(verifyData.error || 'Verification Failed');
                              }

                              toast({
                                title: t('dashboard.billing_section.success_title'),
                                description: t('dashboard.billing_section.success_desc'),
                              });

                              // Reload to update UI
                              loadData();

                              // Show Beautiful Success Confirmation
                              const Swal = (await import('sweetalert2')).default;
                              Swal.fire({
                                title: t('dashboard.billing_section.alert_title_success'),
                                text: t('dashboard.billing_section.alert_text_success'),
                                icon: 'success',
                                confirmButtonText: t('dashboard.billing_section.alert_btn_success'),
                                confirmButtonColor: '#00C185',
                                background: document.documentElement.classList.contains('dark') ? '#1e293b' : '#fff',
                                color: document.documentElement.classList.contains('dark') ? '#fff' : '#000'
                              });

                            } catch (e: any) {
                              console.error("Payment Verification Error: ", e);
                              const Swal = (await import('sweetalert2')).default;
                              Swal.fire({
                                title: t('dashboard.billing_section.alert_title_error'),
                                text: t('dashboard.billing_section.alert_text_error') + details.id,
                                icon: 'error',
                                confirmButtonText: t('dashboard.billing_section.alert_btn_error')
                              });
                            }
                          }}
                        />
                        <div className="mt-4 text-center">
                          <p className="text-xs text-muted-foreground">
                            <ShieldCheck className="w-3 h-3 inline mr-1" />
                            {t('dashboard.billing_section.secure_note')}
                          </p>
                        </div>
                      </div>
                    </TabsContent>

                    {/* Local Payment Tab */}
                    <TabsContent value="local" className="space-y-6 animate-in fade-in slide-in-from-top-2">
                      <div className="flex flex-col gap-4">
                        <div className="p-4 bg-sky-50 dark:bg-sky-950/30 border border-sky-100 dark:border-sky-800 rounded-xl shadow-sm">
                          <h4 className="font-bold flex items-center gap-2 mb-3 text-sky-900 dark:text-sky-100">
                            <div className="w-8 h-8 bg-sky-600 rounded-lg flex items-center justify-center text-white text-[10px] font-bold">Scotia</div>
                            Transferencia Bancaria (Scotia)
                          </h4>
                          <div className="space-y-2 text-sm text-sky-800 dark:text-sky-200">
                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center border-b border-sky-200 dark:border-sky-800 pb-1">
                              <span className="text-xs opacity-70 uppercase tracking-wider">Cuenta Soles</span>
                              <span className="font-mono font-bold select-all">099-7561105</span>
                            </div>
                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center border-b border-sky-200 dark:border-sky-800 pb-1">
                              <span className="text-xs opacity-70 uppercase tracking-wider">CCI Interbancario</span>
                              <span className="font-mono font-bold select-all text-xs">009-263-200997561105-53</span>
                            </div>
                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center pt-1">
                              <span className="text-xs opacity-70 uppercase tracking-wider">Titular</span>
                              <span className="font-medium">Kenneth Herrera</span>
                            </div>
                          </div>
                        </div>

                        <div className="p-4 bg-purple-50 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-800 rounded-xl shadow-sm">
                          <h4 className="font-bold flex items-center gap-2 mb-3 text-purple-900 dark:text-purple-100">
                            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-fuchsia-500 rounded-lg flex items-center justify-center text-white text-[10px] font-bold">Y/P</div>
                            Yape / Plin
                          </h4>
                          <div className="space-y-2 text-sm text-purple-800 dark:text-purple-200">
                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center border-b border-purple-200 dark:border-purple-800 pb-1">
                              <span className="text-xs opacity-70 uppercase tracking-wider">Número Celular</span>
                              <span className="font-bold text-xl select-all">902 105 668</span>
                            </div>
                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center pt-1">
                              <span className="text-xs opacity-70 uppercase tracking-wider">Titular</span>
                              <span className="font-medium">Kenneth Herrera</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="p-8 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50 dark:bg-slate-900 text-center space-y-4">
                        <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-full shadow-sm flex items-center justify-center mx-auto mb-2 border border-slate-100 dark:border-slate-700">
                          <MessageCircle className="w-8 h-8 text-primary/40" />
                        </div>
                        <div>
                          <p className="font-bold mb-1">{t('dashboard.billing_section.report_payment_title')}</p>
                          <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-4">
                            {t('dashboard.billing_section.report_payment_desc')}
                          </p>
                        </div>

                        <div className="max-w-xs mx-auto space-y-3">
                          <Input
                            placeholder={t('dashboard.billing_section.ref_placeholder')}
                            id="payment-ref"
                            className="text-center font-bold h-12 border-primary/20 focus:ring-primary"
                          />
                          <Button
                            className="w-full h-12 font-bold text-lg"
                            onClick={async () => {
                              const refInput = document.getElementById('payment-ref') as HTMLInputElement;
                              const reference = refInput?.value;
                              if (!reference || reference.trim().length < 3) {
                                toast({ title: t('dashboard.billing_section.toast_required'), description: t('dashboard.billing_section.toast_required_desc'), variant: 'destructive' });
                                return;
                              }

                              setUploading(true);
                              try {
                                await addDoc(collection(db, 'payments'), {
                                  user_id: user?.uid,
                                  amount: selectedPlan === 'plus' ? 60 : 30,
                                  payment_method: 'Yape/Plin/BCP',
                                  description: `Plan ${selectedPlan === 'plus' ? 'PLUS' : 'Estándar'} Lead Widget`,
                                  operation_ref: reference,
                                  status: 'pending',
                                  created_at: new Date().toISOString()
                                });

                                toast({
                                  title: t('dashboard.billing_section.toast_success'),
                                  description: t('dashboard.billing_section.toast_success_desc'),
                                });

                                if (refInput) refInput.value = '';
                                loadData();
                              } catch (e: any) {
                                toast({ title: t('dashboard.billing_section.toast_error'), description: t('dashboard.billing_section.toast_error_desc'), variant: 'destructive' });
                              } finally {
                                setUploading(false);
                              }
                            }}
                            disabled={uploading}
                          >
                            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : t('dashboard.billing_section.report_btn')}
                          </Button>

                          <p className="text-[10px] text-muted-foreground mt-2">
                            {t('dashboard.billing_section.wa_hint')} <a href="https://wa.me/51902105668" target="_blank" className="underline text-primary">WhatsApp</a>.
                          </p>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>

            {/* Payment History */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t('dashboard.billing_section.history_title')}</CardTitle>
              </CardHeader>
              <CardContent>
                {payments.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-2xl">
                    <CreditCard className="w-12 h-12 mx-auto mb-4 opacity-10" />
                    <p>{t('dashboard.billing_section.no_payments')}</p>
                    <p className="text-sm mt-1">{t('dashboard.billing_section.no_payments_sub')}</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b text-xs uppercase tracking-wider text-muted-foreground">
                          <th className="text-left py-4 px-6 font-bold">{t('dashboard.billing_section.table_desc')}</th>
                          <th className="text-left py-4 px-6 font-bold">{t('dashboard.billing_section.table_amount')}</th>
                          <th className="text-left py-4 px-6 font-bold">{t('dashboard.leads_list.table_date')}</th>
                          <th className="text-left py-4 px-6 font-bold">{t('dashboard.billing_section.table_method')}</th>
                          <th className="text-right py-4 px-6 font-bold">{t('dashboard.billing_section.table_status')}</th>
                        </tr>
                      </thead>
                      <tbody className="text-sm">
                        {payments.map((p) => (
                          <tr key={p.id} className="border-b group hover:bg-slate-50/50 transition-colors">
                            <td className="py-4 px-6">
                              <div className="font-bold text-slate-900 dark:text-slate-100">{p.description || 'Suscripción Lead Widget'}</div>
                              <div className="text-[10px] text-muted-foreground font-mono">ID: {p.id.substring(0, 8)}</div>
                            </td>
                            <td className="py-4 px-6 font-bold text-slate-700 dark:text-slate-300">
                              {p.currency === 'USD' ? '$' : 'S/'} {Number(p.amount).toFixed(2)}
                            </td>
                            <td className="py-4 px-6 text-muted-foreground">{new Date(p.created_at).toLocaleDateString('es-PE')}</td>
                            <td className="py-4 px-6">
                              <span className="text-xs font-medium px-2 py-1 bg-slate-100 rounded text-slate-600 uppercase tracking-tighter">{p.payment_method || 'Varios'}</span>
                            </td>
                            <td className="py-4 px-6 text-right">
                              <span className={`px-3 py-1 rounded-full text-xs font-bold ${['completed', 'active', 'verified'].includes(p.status)
                                ? 'bg-green-100 text-green-700 border border-green-200'
                                : 'bg-amber-100 text-amber-700 border border-amber-200'
                                }`}>
                                {['completed', 'active', 'verified'].includes(p.status) ? t('dashboard.billing_section.status_paid') : t('dashboard.billing_section.status_pending')}
                              </span>
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

          {/* Affiliate Tab */}
          <TabsContent value="affiliates" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Left Column: Link & Info */}
              <div className="space-y-6 w-full max-w-full overflow-hidden">
                {/* Fixed Affiliate Card */}
                <AffiliateCard dismissible={false} className="shadow-xl" />

                {/* Terms Box */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Info className="w-5 h-5 text-slate-400" />
                      ¿Cómo funciona el pago?
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 text-sm text-slate-600 dark:text-slate-400">
                    <p>
                      Nuestro modelo de afiliados funciona bajo el esquema <strong>CPA (Costo Por Adquisición)</strong>.
                    </p>
                    <ul className="space-y-2 list-disc pl-4">
                      <li>
                        Recibes el <strong>20% del valor del primer pago</strong> que realice tu referido.
                      </li>
                      <li>
                        No aplica para pagos recurrentes mensuales (esos se destinan al 100% al mantenimiento de la infraestructura de IA).
                      </li>
                      <li>
                        Los pagos se realizan mensualmente vía Transferencia o PayPal una vez acumules un mínimo de S/ 100.
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </div>

              {/* Right Column: Calculator */}
              <div className="space-y-6">
                <Card className="border-emerald-100 dark:border-emerald-900/30 shadow-lg shadow-emerald-100/50 dark:shadow-none">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle>Calculadora de Ingresos</CardTitle>
                      <Calculator className="w-5 h-5 text-emerald-600" />
                    </div>
                    <CardDescription>Proyecta tus ganancias estimadas</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6 pt-6">
                    {/* Plan Selector */}
                    <div className="space-y-3">
                      <Label>¿Qué plan estimas vender?</Label>
                      <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
                        <button
                          onClick={() => setAffiliatePlanType('pro')}
                          className={`py-2 px-3 text-xs font-bold rounded-md transition-all ${affiliatePlanType === 'pro' ? 'bg-white dark:bg-slate-700 shadow text-emerald-600' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                          Plan Pro ({currency === 'USD' ? '$15' : 'S/ 30'})
                        </button>
                        <button
                          onClick={() => setAffiliatePlanType('plus')}
                          className={`py-2 px-3 text-xs font-bold rounded-md transition-all ${affiliatePlanType === 'plus' ? 'bg-white dark:bg-slate-700 shadow text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                          Plan Plus ({currency === 'USD' ? '$29' : 'S/ 60'})
                        </button>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="flex justify-between items-center">
                        <Label>Clientes referidos al mes</Label>
                        <span className="text-2xl font-bold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-4 py-1 rounded-lg">
                          {affiliateRefers}
                        </span>
                      </div>

                      <input
                        type="range"
                        min="1"
                        max="100"
                        step="1"
                        value={affiliateRefers}
                        onChange={(e) => setAffiliateRefers(parseInt(e.target.value))}
                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>1 cliente</span>
                        <span>50 clientes</span>
                        <span>100 clientes</span>
                      </div>
                    </div>

                    <div className="p-6 bg-emerald-50 dark:bg-emerald-900/10 rounded-2xl border border-emerald-100 dark:border-emerald-900/20 text-center space-y-2">
                      <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300 uppercase tracking-widest">Ganancia Estimada (CPA 20%)</p>
                      <div className="text-5xl font-black text-emerald-600 dark:text-emerald-400">
                        {currency === 'USD' ? '$' : 'S/'}
                        {(() => {
                          const price = currency === 'USD'
                            ? (affiliatePlanType === 'pro' ? 15 : 29)
                            : (affiliatePlanType === 'pro' ? 30 : 60);
                          return (affiliateRefers * price * 0.20).toFixed(2);
                        })()}
                      </div>
                      <p className="text-xs text-emerald-700/60 dark:text-emerald-400/60">
                        Basado en el precio del Plan {affiliatePlanType === 'pro' ? 'Pro' : 'Plus'}
                      </p>
                    </div>

                    {/* Motivational Tip for PEN users */}
                    {currency === 'PEN' && (
                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border border-blue-200 dark:border-blue-900/50 rounded-xl p-4 space-y-2">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                            <Globe className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div className="flex-1 text-left">
                            <h4 className="font-semibold text-sm text-blue-900 dark:text-blue-100 mb-1">
                              💡 ¿Quieres más? ¡Vende a USA y gana en dólares!
                            </h4>
                            <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed mb-2">
                              El mercado estadounidense paga en <strong>USD</strong>. Cambia el idioma a <strong>Inglés</strong>{' '}
                              <button
                                onClick={() => i18n.changeLanguage('en')}
                                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors font-semibold"
                              >
                                (haz clic aquí)
                              </button>
                              {' '}y tu link de afiliado mostrará precios en dólares automáticamente.
                            </p>
                            <p className="text-[10px] text-blue-600/70 dark:text-blue-400/70">
                              <strong>Ejemplo:</strong> 10 ventas del Plan Pro = <strong>${(10 * 15 * 0.20).toFixed(2)} USD</strong> vs S/{(10 * 30 * 0.20).toFixed(2)} PEN
                            </p>
                          </div>
                        </div>
                      </div>
                    )}



                    <div className="flex flex-col gap-2">
                      <Button
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-12 disabled:opacity-50"
                        onClick={() => setIsPayoutModalOpen(true)}
                        disabled={pendingEarnings < minWithdrawal}
                      >
                        <HandCoins className="w-4 h-4 mr-2" />
                        Solicitar Retiro (Min S/ 100)
                      </Button>
                      {pendingEarnings < minWithdrawal && (
                        <p className="text-[10px] text-center text-muted-foreground">
                          Te faltan S/ {minWithdrawal - pendingEarnings} para retirar.
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Real Stats Card */}
                <div className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800 p-4 rounded-xl space-y-3">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-emerald-600" />
                    <h4 className="font-bold text-emerald-900 dark:text-emerald-100 text-sm">Tus Resultados Hoy</h4>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-2xl font-black text-slate-800 dark:text-white">{realAffiliatesCount}</div>
                      <div className="text-xs text-slate-500">Usuarios Registrados</div>
                    </div>
                    <div>
                      <div className="text-2xl font-black text-emerald-600">S/ {pendingEarnings}</div>
                      <div className="text-xs text-slate-500">Ganancias Pendientes</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Payout Request Modal */}
      <Dialog open={isPayoutModalOpen} onOpenChange={setIsPayoutModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <HandCoins className="w-5 h-5 text-emerald-600" />
              Solicitar Retiro
            </DialogTitle>
            <DialogDescription>
              Ingresa tus datos para recibir sus comisiones. El pago se procesa en 24-48 horas hábiles.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Método de Pago</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={payoutMethod}
                onChange={(e) => setPayoutMethod(e.target.value)}
              >
                <option value="yape">Yape / Plin (Perú)</option>
                <option value="bcp">Transferencia BCP (Perú)</option>
                <option value="bank">Interbank / Otros (Perú)</option>
                <option value="paypal">PayPal (Internacional)</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>
                {payoutMethod === 'paypal' ? 'Correo PayPal' : (payoutMethod === 'yape' ? 'Número de Celular' : 'Número de Cuenta / CCI')}
              </Label>
              <Input
                placeholder={payoutMethod === 'paypal' ? 'ejemplo@gmail.com' : 'Ingresa tu número aquí'}
                value={payoutAccount}
                onChange={(e) => setPayoutAccount(e.target.value)}
              />
            </div>
            <div className="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-300 text-xs p-3 rounded-lg flex items-start gap-2 border border-emerald-100 dark:border-emerald-800">
              <Info className="w-4 h-4 shrink-0 mt-0.5" />
              <p>Las comisiones solo se pagan por ventas confirmadas. Mínimo de retiro: <strong>S/ 100 o $30 USD</strong>.</p>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsPayoutModalOpen(false)}>Cancelar</Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={() => {
                if (!payoutAccount) {
                  toast({ title: "Faltan datos", description: "Por favor ingresa tu cuenta o celular.", variant: "destructive" });
                  return;
                }
                setIsPayoutModalOpen(false);
                toast({
                  title: "✅ Solicitud Enviada",
                  description: "Revisaremos tus referidos y procesaremos el pago brevemente."
                });
                setPayoutAccount('');
              }}
            >
              Enviar Solicitud
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div >
  );
}
