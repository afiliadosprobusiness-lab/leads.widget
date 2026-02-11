import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation, Trans } from 'react-i18next';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { Button } from '@/components/ui/button';
import { SalesWidget } from '@/components/SalesWidget';
import { SocialProofToast } from '@/components/SocialProofToast';
import {
  MessageCircle,
  Zap,
  BarChart3,
  Smartphone,
  Check,
  ArrowRight,
  Star,
  Users,
  TrendingUp,
  Menu,
  X as CloseIcon,
  MousePointer2,
  Globe,
  Copy,
  ShieldCheck,
  ChevronRight,
  Play,
  Bot,
  Send,
  Sparkles,
  Cloud,
  Database,
  Lock,
  Server,
  Code2,
  Cpu,
  Fingerprint,
  CreditCard,
  Settings,
  Download,
  ShoppingBag
} from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';



const stats = [
  { value: '22%', label: 'Tasa de conversión promedio' },
  { value: '+500', label: 'Leads capturados / mes' },
  { value: '2min', label: 'Tiempo de instalación' },
];

export default function Landing() {
  const { t, i18n } = useTranslation();
  const [activeTemplate, setActiveTemplate] = useState('real_estate');
  const [showExitPopup, setShowExitPopup] = useState(false);
  const [hasShownExit, setHasShownExit] = useState(false);

  useEffect(() => {
    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 0 && !hasShownExit) {
        setShowExitPopup(true);
        setHasShownExit(true);
      }
    };
    document.addEventListener('mouseleave', handleMouseLeave);
    return () => document.removeEventListener('mouseleave', handleMouseLeave);
  }, [hasShownExit]);

  // ViewContent 50% Scroll Tracker
  useEffect(() => {
    let viewContentTriggered = false;

    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;

      // Calculate percentage scrolled
      const scrollPercent = ((scrollTop + windowHeight) / documentHeight) * 100;

      // Debugging: Uncomment to see scroll % in console
      // console.log('Scroll %:', Math.round(scrollPercent));

      if (scrollPercent >= 50 && !viewContentTriggered) {
        // Safe Pixel Event Dispatch
        // @ts-ignore
        if (window.fbq) {
          // @ts-ignore
          window.fbq('track', 'ViewContent');
          console.log('Pixel Event Fired: ViewContent (Scroll > 50%)');
        } else {
          console.warn('Facebook Pixel not found (fbq is undefined)');
        }

        viewContentTriggered = true;
        window.removeEventListener('scroll', handleScroll);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleOpenDemoFromPopup = () => {
    setShowExitPopup(false);
    setTimeout(() => {
      window.dispatchEvent(new Event('open-lead-widget'));
    }, 100);
  };

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300 selection:bg-primary/20">

      {/* Background Mesh/Grid Effect */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-[0.03] dark:opacity-[0.05]"
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.4'%3E%3Cpath d='M36 34v2H20v-2h16zm0-8v2H20v-2h16zm-16-8v2h16v-2H20zM0 0h60v60H0V0zm1 1h58v58H1V1z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` }}>
      </div>

      {/* --- SOCIAL PROOF TOAST --- */}
      <SocialProofToast />

      {/* --- NAVIGATION --- */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center group-hover:scale-105 transition-transform">
              <MessageCircle className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg tracking-tight">Lead Widget</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-4">
            <LanguageSwitcher />
            <Link to="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              {t('nav.login')}
            </Link>
            <div className="flex items-center gap-2 pl-2 border-l border-border">
              <Link to="/register">
                <Button className="font-bold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all btn-iridescent text-white">
                  {t('nav.try_free')} <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Mobile Nav */}
          <div className="md:hidden flex items-center gap-2">
            <LanguageSwitcher />
            <Link to="/register">
              <Button size="sm" className="font-bold">
                {t('nav.try')}
              </Button>
            </Link>
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right">
                <div className="flex flex-col gap-6 mt-10">
                  <Link to="/" className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                      <MessageCircle className="w-4 h-4 text-primary-foreground" />
                    </div>
                    <span className="font-bold text-lg">Lead Widget</span>
                  </Link>
                  <div className="grid gap-3">
                    <Link to="/login"><Button variant="outline" className="w-full justify-start">{t('nav.login')}</Button></Link>
                    <Link to="/register"><Button className="w-full justify-start">{t('nav.create_account')}</Button></Link>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </nav>

      {/* --- HERO SECTION --- */}
      <section className="relative pt-24 pb-16 lg:pt-48 lg:pb-32 px-4 overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-0 inset-x-0 h-[600px] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background dark:from-primary/5 dark:via-background dark:to-background -z-10" />

        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">

            {/* Left Content */}
            <div className="flex-1 space-y-6 lg:space-y-8 text-center lg:text-left z-10 w-full">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs sm:text-sm font-semibold border border-primary/20 animate-fade-in-up">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                </span>
                {t('hero.system_badge')} • <span>{t('hero.users_online', { count: 124 })}</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-7xl font-extrabold tracking-tight leading-[1.1] text-balance">
                {t('hero.title_1')} <br className="hidden lg:block" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-emerald-600 dark:to-emerald-400">
                  {t('hero.title_2')}
                </span>
              </h1>

              <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto lg:mx-0 text-pretty">
                <Trans i18nKey="hero.subtitle" components={[<strong className="text-foreground" key="0" />, <strong className="text-foreground" key="1" />]} />
              </p>

              <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start w-full sm:w-auto">
                <Link to="/register" className="w-full sm:w-auto">
                  <Button size="xl" className="w-full sm:w-auto text-lg font-bold h-14 px-8 shadow-xl shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-1 transition-all btn-iridescent text-white">
                    {t('hero.cta_primary')}
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  size="xl"
                  className="w-full sm:w-auto h-14 px-8 border-2 group"
                  onClick={() => window.dispatchEvent(new Event('open-lead-widget'))}
                >
                  <Play className="w-4 h-4 mr-2 fill-current opacity-50 group-hover:opacity-100 transition-opacity" />
                  {t('hero.cta_secondary')}
                </Button>
              </div>

              <div className="pt-4 lg:pt-8 flex flex-wrap justify-center lg:justify-start gap-8 lg:gap-12 opacity-80">
                <div className="text-center lg:text-left">
                  <p className="text-2xl font-bold text-foreground">22%</p>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">{t('hero.stats.conversion')}</p>
                </div>
                <div className="text-center lg:text-left">
                  <p className="text-2xl font-bold text-foreground">+500</p>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">{t('hero.stats.leads')}</p>
                </div>
                <div className="text-center lg:text-left">
                  <p className="text-2xl font-bold text-foreground">2min</p>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">{t('hero.stats.time')}</p>
                </div>
              </div>
            </div>

            {/* Right Image/Mockup */}
            <div className="flex-1 relative w-full max-w-[350px] sm:max-w-[500px] lg:max-w-none mx-auto lg:mx-0 mt-8 lg:mt-0">
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-purple-500/20 rounded-full blur-3xl opacity-30 animate-pulse-slow" />
              <div className="relative bg-card border border-border/50 rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl overflow-hidden p-2 transform hover:scale-[1.01] transition-transform duration-500">
                <img
                  src="/assets/hero-mockup.png"
                  alt="Dashboard Preview"
                  className="w-full rounded-[1.5rem] sm:rounded-[2rem] shadow-inner bg-muted/50"
                />
                {/* Floating elements - Hidden on very small screens */}
                <div className="hidden sm:flex absolute -right-4 top-10 bg-white dark:bg-slate-800 p-3 sm:p-4 rounded-xl shadow-xl items-center gap-3 animate-float border border-border scale-90 sm:scale-100">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-[#25D366] rounded-full flex items-center justify-center text-white">
                    <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <div>
                    <p className="text-[10px] sm:text-xs font-bold opacity-60">Nuevo Lead</p>
                    <p className="font-bold text-xs sm:text-sm">+51 902 *** ***</p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* --- TRUST BADGE SECTION --- */}
      <section className="py-12 lg:py-16 bg-background overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10 max-w-xs mx-auto md:max-w-none">
            <div className="h-px w-12 bg-primary mx-auto mb-4 opacity-50" />
            <p className="text-[10px] sm:text-xs font-black text-muted-foreground uppercase tracking-[0.3em] mb-2 px-6">
              {t('trust_badge.title')}
            </p>
          </div>

          <div className="flex flex-wrap justify-center items-center gap-x-12 gap-y-10 md:gap-20 opacity-90">
            {/* WordPress */}
            <div className="flex flex-col items-center gap-3 transition-all duration-300 hover:-translate-y-1 group">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10 text-slate-400 group-hover:text-[#21759b] transition-colors">
                <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 0 1-8-8c0-1.8.6-3.5 1.6-4.8L17 19a7.9 7.9 0 0 1-5 1zm6.9-3.1L13.8 9h-.8l-3.3 9.4a8 8 0 0 1-2.8-5.7c0-2.3 1-4.4 2.6-5.9l5.6 13.1c1.2-1 2.2-2.3 2.8-3.8z" />
              </svg>
              <span className="text-xs font-semibold text-muted-foreground group-hover:text-primary transition-colors">WordPress</span>
            </div>

            {/* Shopify */}
            <div className="flex flex-col items-center gap-3 transition-all duration-300 hover:-translate-y-1 group">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10 text-slate-400 group-hover:text-[#95BF47] transition-colors">
                <path d="M19.5 6h-2.9c-.3-1.6-1.6-2.5-1.6-2.5S14.3.4 12 .4s-3 3.1-3 3.1-1.3.9-1.6 2.5H4.5L2.8 23.6h18.4L19.5 6zM12 2.4c1.2 0 1.9 2.1 2 3.6H10c.1-1.5.8-3.6 2-3.6z" />
              </svg>
              <span className="text-xs font-semibold text-muted-foreground group-hover:text-primary transition-colors">Shopify</span>
            </div>

            {/* Squarespace */}
            <div className="flex flex-col items-center gap-3 transition-all duration-300 hover:-translate-y-1 group">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10 text-slate-400 group-hover:text-foreground transition-colors">
                <path d="M12.9 13.2c0-2.6 2.1-4.7 4.7-4.7 2.9 0 4.7 2.2 4.7 5.5 0 2.6-2.1 4.7-4.7 4.7-3 0-4.7-2.3-4.7-5.5zM1.7 10.8c0 2.6 2.1 4.7 4.7 4.7 2.9 0 4.7-2.2 4.7-5.5 0-2.6-2.1-4.7-4.7-4.7-2.9 0-4.7 2.2-4.7 5.5z" />
              </svg>
              <span className="text-xs font-semibold text-muted-foreground group-hover:text-primary transition-colors">Squarespace</span>
            </div>

            {/* Wix */}
            <div className="flex flex-col items-center gap-3 transition-all duration-300 hover:-translate-y-1 group">
              <svg viewBox="0 0 40 20" fill="currentColor" className="w-12 h-8 text-slate-400 group-hover:text-foreground transition-colors">
                <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" fontSize="16" fontWeight="900" fontFamily="sans-serif">WiX</text>
              </svg>
              <span className="text-xs font-semibold text-muted-foreground group-hover:text-primary transition-colors">Wix</span>
            </div>

            {/* Webflow */}
            <div className="flex flex-col items-center gap-3 transition-all duration-300 hover:-translate-y-1 group">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10 text-slate-400 group-hover:text-[#4353FF] transition-colors">
                <path d="M12 0C5.37 0 0 5.37 0 12s5.37 12 12 12 12-5.37 12-12S18.63 0 12 0zm5.5 13.5l-2.2-6.5h-1.6l-1.5 5-1.5-5H9l-2.2 6.5h1.7l1.1-3.5 1.5 4.8h1.6l1.5-4.8 1.1 3.5h1.7z" />
              </svg>
              <span className="text-xs font-semibold text-muted-foreground group-hover:text-primary transition-colors">Webflow</span>
            </div>

            {/* Carrd */}
            <div className="flex flex-col items-center gap-3 transition-all duration-300 hover:-translate-y-1 group">
              <div className="w-10 h-10 rounded-lg border-2 border-slate-400 group-hover:border-slate-800 dark:group-hover:border-slate-200 flex items-center justify-center transition-colors">
                <span className="font-black text-[10px] text-slate-400 group-hover:text-foreground">CARRD</span>
              </div>
              <span className="text-xs font-semibold text-muted-foreground group-hover:text-primary transition-colors">Carrd</span>
            </div>
          </div>
        </div>
      </section>

      {/* --- WORDPRESS PLUGIN SPOTLIGHT --- */}
      <section className="py-20 bg-gradient-to-b from-background to-blue-50/50 dark:from-background dark:to-blue-900/10 border-b border-border/50">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="flex flex-col md:flex-row items-center gap-12 lg:gap-20">
            {/* Visual */}
            <div className="flex-1 w-full max-w-md order-2 md:order-1">
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-3xl blur opacity-30 group-hover:opacity-50 transition duration-1000"></div>
                <div className="relative bg-slate-900 text-white rounded-3xl p-6 sm:p-8 border border-slate-700 shadow-2xl overflow-hidden transform group-hover:scale-[1.02] transition-transform duration-500">
                  {/* WP Admin Mockup */}
                  <div className="flex items-center gap-3 mb-8 border-b border-white/10 pb-4">
                    <div className="w-10 h-10 bg-[#21759b] rounded-lg flex items-center justify-center shadow-lg">
                      <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-white">
                        <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 0 1-8-8c0-1.8.6-3.5 1.6-4.8L17 19a7.9 7.9 0 0 1-5 1zm6.9-3.1L13.8 9h-.8l-3.3 9.4a8 8 0 0 1-2.8-5.7c0-2.3 1-4.4 2.6-5.9l5.6 13.1c1.2-1 2.2-2.3 2.8-3.8z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-bold text-sm">Lead Widget Settings</h3>
                      <p className="text-[10px] text-slate-400">WordPress Admin Panel</p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Tu Widget ID Único</p>
                      <div className="bg-slate-950 border border-slate-700 rounded-xl p-4 font-mono text-green-400 text-sm flex justify-between items-center shadow-inner">
                        <span className="tracking-widest opacity-50">abc123xyz</span>
                        <div className="flex items-center gap-1 bg-green-500/10 px-2 py-1 rounded text-[10px] text-green-400 border border-green-500/20">
                          <Check className="w-3 h-3" /> Verificado
                        </div>
                      </div>
                    </div>
                    <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl flex gap-3 items-start">
                      <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-lg shadow-green-500/20">
                        <Check className="w-3 h-3 text-white stroke-[3]" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-green-100 mb-0.5">Conectado Exitosamente</p>
                        <p className="text-[10px] text-green-200/80 leading-relaxed">El widget ya es visible en todas las páginas de tu sitio web.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 text-center md:text-left space-y-6 order-1 md:order-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#21759b]/10 text-[#21759b] dark:text-blue-400 text-xs font-bold uppercase tracking-wide">
                <Settings className="w-3 h-3" />
                Nueva Integración
              </div>

              <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-balance leading-tight">
                Instalación Nativa en <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#21759b] to-cyan-500">WordPress</span>
              </h2>

              <p className="text-lg text-muted-foreground leading-relaxed">
                Olvídate de editar código o tocar archivos del tema. Con nuestro nuevo <strong>Plugin Oficial</strong>, conectar Lead Widget es tan fácil como copiar y pegar.
              </p>

              <ul className="space-y-3 inline-block text-left mx-auto md:mx-0 bg-card/50 p-6 rounded-2xl border border-border/50 backdrop-blur-sm">
                {[
                  "Instalación en 1 Clic (Sin código)",
                  "Carga asíncrona optimizada (No ralentiza tu web)",
                  "Compatible con Elementor, Divi y Gutenberg",
                  "Actualizaciones automáticas y seguras"
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                    <span className="font-medium text-sm sm:text-base text-foreground/90">{item}</span>
                  </li>
                ))}
              </ul>

              <div className="pt-4 flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                <Link to="/register">
                  <Button size="lg" className="font-bold shadow-lg shadow-blue-500/20 bg-[#21759b] hover:bg-[#1a5c7a] text-white rounded-full w-full sm:w-auto h-12 px-8 transition-transform hover:-translate-y-0.5">
                    <Download className="w-4 h-4 mr-2" />
                    Obtener Plugin Gratis
                  </Button>
                </Link>
                {/* <p className="text-xs text-muted-foreground mt-3 sm:mt-0 sm:ml-4 flex items-center justify-center">
                  Disponible para todos los planes
                </p> */}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- SHOPIFY INTEGRATION (COMING SOON) --- */}
      <section className="py-16 border-b border-border/50 bg-gradient-to-r from-green-50/50 via-emerald-50/30 to-green-50/50 dark:from-green-950/10 dark:via-emerald-900/10 dark:to-green-950/10">
        <div className="container mx-auto max-w-6xl px-4 text-center">

          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider mb-6 border border-emerald-200 dark:border-emerald-800">
            <Sparkles className="w-3.5 h-3.5" />
            Próximamente
          </div>

          <h2 className="text-3xl md:text-4xl font-black mb-6 flex items-center justify-center gap-3">
            <ShoppingBag className="w-8 h-8 md:w-10 md:h-10 text-[#95bF47]" />
            Integración Nativa con <span className="text-[#95bF47]">Shopify</span>
          </h2>

          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10 text-balance">
            Estamos construyendo la App Oficial para Shopify. Muy pronto podrás instalar Lead Widget directamente desde la <strong>Shopify App Store</strong>.
          </p>

          <div className="flex flex-wrap justify-center gap-8 md:gap-16 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
            {/* Feature Mocks */}
            <div className="flex flex-col items-center gap-3 group">
              <div className="w-14 h-14 rounded-2xl bg-white dark:bg-card border border-border flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <ShoppingBag className="w-7 h-7 text-[#95bF47]" />
              </div>
              <span className="text-sm font-semibold">Shopify App</span>
            </div>
            <div className="flex flex-col items-center gap-3 group">
              <div className="w-14 h-14 rounded-2xl bg-white dark:bg-card border border-border flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <MousePointer2 className="w-7 h-7 text-blue-500" />
              </div>
              <span className="text-sm font-semibold">1-Click Setup</span>
            </div>
            <div className="flex flex-col items-center gap-3 group">
              <div className="w-14 h-14 rounded-2xl bg-white dark:bg-card border border-border flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <Zap className="w-7 h-7 text-amber-500" />
              </div>
              <span className="text-sm font-semibold">Zero Lag</span>
            </div>
          </div>
        </div>

      </section>

      {/* --- PAIN POINTS SECTION (Dark Style) --- */}
      <section className="py-16 lg:py-24 px-4 bg-slate-950 text-white relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent"></div>

        <div className="container mx-auto max-w-6xl relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div className="order-2 lg:order-1">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black mb-6 leading-tight text-balance">
                <Trans i18nKey="pain_points.title" components={[<span className="text-primary italic" key="0" />]} />
              </h2>
              <p className="text-slate-400 text-base sm:text-lg mb-8 leading-relaxed text-pretty">
                {t('pain_points.description')}
              </p>

              <div className="space-y-4">
                {[
                  t('pain_points.point_1'),
                  t('pain_points.point_2'),
                  t('pain_points.point_3'),
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-4 p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                    <div className="w-6 h-6 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <CloseIcon className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-slate-300 font-medium text-sm sm:text-base">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative order-1 lg:order-2">
              <div className="absolute -inset-1 bg-gradient-to-r from-primary to-blue-600 rounded-3xl blur opacity-30"></div>
              <div className="relative bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-2xl">
                <div className="flex items-center gap-4 mb-6 border-b border-slate-800 pb-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary/20 flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base sm:text-lg">{t('pain_points.solution_title')}</h3>
                    <p className="text-slate-400 text-xs sm:text-sm">{t('pain_points.solution_subtitle')}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  {[
                    { t: t('pain_points.step_1_title'), d: t('pain_points.step_1_desc') },
                    { t: t('pain_points.step_2_title'), d: t('pain_points.step_2_desc') },
                    { t: t('pain_points.step_3_title'), d: t('pain_points.step_3_desc') },
                  ].map((step, idx) => (
                    <div key={idx} className="flex gap-4">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-primary font-bold flex items-center justify-center text-sm border border-primary/20 flex-shrink-0">
                        {idx + 1}
                      </div>
                      <div>
                        <h4 className="font-bold text-white mb-1 text-sm sm:text-base">{step.t}</h4>
                        <p className="text-slate-400 text-xs sm:text-sm">{step.d}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- FEATURES GRID --- */}
      <section className="py-16 lg:py-24 px-4 bg-background" id="features">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12 lg:mb-16 max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-5xl font-bold mb-4 text-balance">{t('features.title')}</h2>
            <p className="text-base sm:text-lg text-muted-foreground text-pretty px-4">{t('features.subtitle')}</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 relative z-10">
            {[
              { icon: Bot, t: t('features.predictive_ai_title'), d: t('features.predictive_ai_desc'), color: "emerald" },
              { icon: Zap, t: t('features.auto_redirect_title'), d: t('features.auto_redirect_desc'), color: "blue" },
              { icon: ShieldCheck, t: t('features.anti_abuse_title'), d: t('features.anti_abuse_desc'), color: "red" },
              { icon: MousePointer2, t: t('features.triggers_title'), d: t('features.triggers_desc'), color: "orange" },
              { icon: BarChart3, t: t('features.dashboard_title'), d: t('features.dashboard_desc'), color: "purple" },
              { icon: Smartphone, t: t('features.mobile_title'), d: t('features.mobile_desc'), color: "pink" },
              { icon: Star, t: t('features.social_proof_title'), d: t('features.social_proof_desc'), color: "yellow" },
            ].map((f, i) => (
              <div key={i} className="group p-6 sm:p-8 rounded-3xl bg-card/50 backdrop-blur-sm border border-border/50 hover:border-primary/50 hover:shadow-[0_0_30px_-10px_rgba(0,193,133,0.2)] transition-all duration-500">
                <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4 sm:mb-6 group-hover:scale-110 group-hover:bg-primary group-hover:text-white transition-all duration-500`}>
                  <f.icon className="w-6 h-6 sm:w-7 sm:h-7" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold mb-2 sm:mb-3 group-hover:text-primary transition-colors">{f.t}</h3>
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">{f.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- DATA SAFETY SECTION --- */}
      <section className="py-20 bg-slate-50 dark:bg-slate-900/30 border-y border-border/50">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-bold uppercase tracking-wide mb-4">
              <ShieldCheck className="w-3 h-3" />
              {t('data_safety.badge')}
            </div>
            <h2 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white mb-6">
              <Trans i18nKey="data_safety.title" components={[<span className="text-blue-600" key="0" />]} />
            </h2>
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              {t('data_safety.description')}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 lg:gap-8 max-w-5xl mx-auto">
            {/* Card 1 */}
            <div className="bg-white dark:bg-slate-950 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 dark:bg-blue-900/20 rounded-bl-[100px] -mr-8 -mt-8 transition-transform group-hover:scale-110" />
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/50 rounded-2xl flex items-center justify-center text-blue-600 dark:text-blue-400 mb-6 relative z-10">
                <Cloud className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3 relative z-10">{t('data_safety.card_1_title')}</h3>
              <p className="text-slate-500 dark:text-slate-400 leading-relaxed relative z-10 text-sm">
                {t('data_safety.card_1_desc')}
              </p>
            </div>

            {/* Card 2 */}
            <div className="bg-white dark:bg-slate-950 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 dark:bg-emerald-900/20 rounded-bl-[100px] -mr-8 -mt-8 transition-transform group-hover:scale-110" />
              <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/50 rounded-2xl flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-6 relative z-10">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3 relative z-10">{t('data_safety.card_2_title')}</h3>
              <p className="text-slate-500 dark:text-slate-400 leading-relaxed relative z-10 text-sm">
                {t('data_safety.card_2_desc')}
              </p>
            </div>

            {/* Card 3 */}
            <div className="bg-white dark:bg-slate-950 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300">
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-50 dark:bg-purple-900/20 rounded-bl-[100px] -mr-8 -mt-8 transition-transform group-hover:scale-110" />
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/50 rounded-2xl flex items-center justify-center text-purple-600 dark:text-purple-400 mb-6 relative z-10">
                <Database className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3 relative z-10">{t('data_safety.card_3_title')}</h3>
              <p className="text-slate-500 dark:text-slate-400 leading-relaxed relative z-10 text-sm">
                {t('data_safety.card_3_desc')}
              </p>
            </div>
          </div>

          <div className="mt-12 text-center">
            <div className="inline-flex items-center gap-4 px-6 py-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm mx-auto">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Infraestructura</span>
              <div className="flex items-center gap-2 opacity-80">
                <Cloud className="w-4 h-4 text-slate-500" />
                <span className="font-bold text-slate-600 dark:text-slate-300 text-sm">Google Cloud</span>
              </div>
              <div className="h-4 w-px bg-slate-300 dark:bg-slate-700 mx-2"></div>
              <div className="flex items-center gap-2 opacity-80">
                <span className="font-bold text-[#FFCA28] text-sm">Firebase</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- SECURITY SHIELD SECTION --- */}
      <section className="py-20 lg:py-32 px-4 bg-slate-950 relative overflow-hidden">
        {/* Decorative Grid */}
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

        <div className="container mx-auto max-w-6xl relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <div className="flex-1 text-center lg:text-left space-y-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/10 text-red-500 border border-red-500/20 text-sm font-bold">
                <ShieldCheck className="w-4 h-4" /> SEGURIDAD DE GRADO MILITAR
              </div>
              <h2 className="text-4xl lg:text-6xl font-black text-white leading-tight">
                <Trans i18nKey="data_safety.security_shield_title" components={[<span className="text-red-500" key="0" />]} />
              </h2>
              <p className="text-slate-400 text-lg sm:text-xl leading-relaxed max-w-xl mx-auto lg:mx-0">
                {t('data_safety.security_shield_desc')}
              </p>

              <div className="grid sm:grid-cols-2 gap-4 text-left">
                {[
                  { t: t('data_safety.shield_features.keyword_filter'), d: t('data_safety.shield_features.keyword_filter_desc') },
                  { t: t('data_safety.shield_features.ip_block'), d: t('data_safety.shield_features.ip_block_desc') },
                  { t: t('data_safety.shield_features.refusal_analysis'), d: t('data_safety.shield_features.refusal_analysis_desc') },
                  { t: t('data_safety.shield_features.dashboard_mgmt'), d: t('data_safety.shield_features.dashboard_mgmt_desc') },
                ].map((item, i) => (
                  <div key={i} className="p-4 rounded-2xl bg-white/5 border border-white/10">
                    <Check className="w-5 h-5 text-red-500 mb-2" />
                    <h4 className="text-white font-bold text-sm mb-1">{item.t}</h4>
                    <p className="text-slate-500 text-xs leading-relaxed">{item.d}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex-1 relative w-full max-w-md mx-auto">
              {/* Security Shield Visual */}
              <div className="relative aspect-square flex items-center justify-center">
                <div className="absolute inset-0 bg-red-500/20 rounded-full blur-[120px] animate-pulse" />
                <div className="relative w-72 h-72 lg:w-96 lg:h-96 border-2 border-red-500/30 rounded-full flex items-center justify-center animate-spin-slow">
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 bg-red-500 rounded-full shadow-[0_0_20px_rgba(239,68,68,0.5)]" />
                  <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-8 h-8 bg-red-500 rounded-full shadow-[0_0_20px_rgba(239,68,68,0.5)]" />
                </div>
                <div className="absolute w-48 h-48 lg:w-64 lg:h-64 border border-white/10 rounded-full flex items-center justify-center animate-spin-reverse">
                  <ShieldCheck className="w-24 h-24 lg:w-32 lg:h-32 text-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,0.3)]" />
                </div>
                {/* Floating alert */}
                <div className="absolute top-1/4 -right-10 bg-slate-900 border border-red-500/50 p-4 rounded-xl shadow-2xl animate-bounce-slow">
                  <p className="text-red-500 font-bold text-xs">⚠️ ATENTADO BLOQUEADO</p>
                  <p className="text-white text-[10px]">IP: 190.11.**.*.89 - Bloqueada</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section >

      {/* --- SALES FLOW SECTION --- */}
      < section className="py-20 lg:py-32 bg-background relative overflow-hidden" >
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16 lg:mb-24">
            <h2 className="text-4xl lg:text-5xl font-black mb-6">
              <Trans i18nKey="sales_flow.title" components={[<span className="text-primary" key="0" />]} />
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">{t('sales_flow.subtitle')}</p>
          </div>

          <div className="grid md:grid-cols-4 gap-8 relative">
            {/* Connecting Line (Desktop) */}
            <div className="hidden md:block absolute top-1/4 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-border to-transparent -z-10" />

            {[
              {
                icon: Zap,
                t: t('sales_flow.step_1_title'),
                d: t('sales_flow.step_1_desc'),
                badge: t('sales_flow.step_1_badge')
              },
              {
                icon: MousePointer2,
                t: t('sales_flow.step_2_title'),
                d: t('sales_flow.step_2_desc'),
                badge: t('sales_flow.step_2_badge')
              },
              {
                icon: Bot,
                t: t('sales_flow.step_3_title'),
                d: t('sales_flow.step_3_desc'),
                badge: t('sales_flow.step_3_badge')
              },
              {
                icon: MessageCircle,
                t: t('sales_flow.step_4_title'),
                d: t('sales_flow.step_4_desc'),
                badge: t('sales_flow.step_4_badge')
              }
            ].map((step, i) => (
              <div key={i} className="group flex flex-col items-center text-center p-6 rounded-3xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-300">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-6 shadow-lg shadow-primary/10 group-hover:scale-110 transition-transform">
                  <step.icon className="w-8 h-8" />
                </div>
                <div className="inline-block px-2 py-1 rounded bg-primary/10 text-primary text-[10px] font-bold uppercase mb-3 tracking-widest">
                  {step.badge}
                </div>
                <h3 className="text-xl font-bold mb-3 group-hover:text-foreground">{step.t}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed group-hover:text-muted-foreground/90">{step.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section >

      {/* --- TEMPLATES SHOWCASE --- */}
      <section className="py-16 lg:py-24 px-4 bg-slate-950 text-white relative border-y border-white/5" id="templates">
        <div className="container mx-auto max-w-5xl">
          <div className="mb-8 md:mb-12">
            <div className="text-left mb-6">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white mb-2">{t('templates_section.title')}</h2>
              <p className="text-slate-400 text-sm sm:text-base">{t('templates_section.subtitle')}</p>
            </div>
            <div className="flex flex-wrap gap-3 w-full overflow-x-auto pb-2 no-scrollbar">
              {[
                { key: 'real_estate', emoji: '🏠' },
                { key: 'clinics', emoji: '🏥' },
                { key: 'workshops', emoji: '🔧' },
                { key: 'delivery', emoji: '🛵' },
                { key: 'ecommerce', emoji: '🛍️' },
                { key: 'general', emoji: '💼' },
              ].map(template => (
                <button
                  key={template.key}
                  onClick={() => setActiveTemplate(template.key)}
                  className={`px-5 py-2.5 rounded-full text-xs sm:text-sm font-bold whitespace-nowrap transition-all border flex items-center gap-2 ${activeTemplate === template.key
                    ? 'bg-primary border-primary text-primary-foreground shadow-lg shadow-primary/20 scale-105'
                    : 'bg-slate-900 border-white/10 text-slate-400 hover:border-white/20 hover:text-white'
                    }`}
                >
                  <span className="text-lg">{template.emoji}</span> {t(`templates_section.industries.${template.key}.name`)}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white/5 rounded-3xl p-6 md:p-8 border border-white/10 shadow-sm flex flex-col md:flex-row gap-8 items-center backdrop-blur-sm">
            <div className="flex-1 space-y-4 w-full">
              <h3 className="text-xl sm:text-2xl font-bold text-white">
                {t(`templates_section.industries.${activeTemplate}.name`)}
              </h3>
              <p className="text-base sm:text-lg text-slate-400">
                {t(`templates_section.industries.${activeTemplate}.desc`)}
              </p>
              <ul className="space-y-3 pt-4">
                {[
                  t('templates_section.features.preconfigured'),
                  t('templates_section.features.tone'),
                  t('templates_section.features.capture')
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3" />
                    </div>
                    <span className="text-sm sm:text-base">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex-1 bg-slate-950 rounded-2xl p-4 sm:p-6 w-full flex flex-col min-h-[300px] border border-white/10 shadow-2xl overflow-hidden relative group">
              {/* Header Simulation */}
              <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div className="text-left">
                    <p className="text-[10px] font-bold text-white">{t('templates_section.demo.assistant_role')}</p>
                    <p className="text-[8px] text-primary">{t('templates_section.demo.status')}</p>
                  </div>
                </div>
              </div>

              {/* Messages Simulation */}
              <div className="space-y-3 mb-4 flex-1">
                <div className="bg-white/5 p-3 rounded-2xl rounded-bl-none max-w-[80%] text-left">
                  <p className="text-[11px] text-slate-300">
                    {t(`templates_section.demo.messages.${activeTemplate}`)}
                  </p>
                </div>
                <div className="bg-primary/20 p-3 rounded-2xl rounded-br-none max-w-[80%] ml-auto text-right border border-primary/20">
                  <p className="text-[11px] text-primary-foreground font-medium italic">{t('templates_section.demo.client_label')}</p>
                </div>
                <div className="bg-white/5 p-3 rounded-2xl rounded-bl-none max-w-[80%] text-left animate-pulse">
                  <p className="text-[11px] text-slate-400">{t('templates_section.demo.typing')}</p>
                </div>
              </div>

              {/* Input Area Simulation */}
              <div className="mt-auto flex gap-2">
                <div className="h-8 flex-1 bg-white/5 rounded-full border border-white/10 px-3 flex items-center">
                  <p className="text-[10px] text-slate-500">{t('templates_section.demo.input_placeholder')}</p>
                </div>
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                  <Send className="w-3.5 h-3.5 text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- PRICING --- */}
      < section className="py-16 lg:py-24 px-4 bg-slate-950 text-white" id="pricing" >
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-10 lg:mb-12">
            <h2 className="text-3xl sm:text-4xl font-extrabold mb-4">{t('pricing.title')}</h2>
            <p className="text-lg sm:text-xl text-slate-400">{t('pricing.subtitle')}</p>
          </div>

          <div className="relative max-w-md mx-auto md:max-w-none">
            {/* Gradient Outline Effect */}
            <div className="absolute -inset-1 rounded-[2.5rem] bg-gradient-to-b from-primary/50 to-transparent blur-sm opacity-50" />

            <div className="relative bg-card rounded-[2rem] border shadow-2xl overflow-hidden">
              {/* Badge */}
              <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-primary via-emerald-400 to-primary" />
              <div className="absolute top-4 right-4 sm:top-6 sm:right-6">
                <span className="bg-primary/10 text-primary border border-primary/20 px-3 py-1 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-wide">
                  Oferta Lanzamiento
                </span>
              </div>

              <div className="p-6 sm:p-10 md:p-12 flex flex-col md:flex-row gap-8 md:gap-12 items-center">

                {/* Left: Price & Features */}
                <div className="flex-1 w-full text-center md:text-left mt-6 md:mt-0">
                  <p className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-2">{t('pricing.plan_name')}</p>
                  <div className="flex items-baseline justify-center md:justify-start gap-1 mb-8">
                    <span className="text-5xl sm:text-7xl font-black tracking-tighter text-foreground">
                      {(i18n.language?.startsWith('en') || i18n.language?.includes('US')) ? '$15' : 'S/ 30'}
                    </span>
                    <span className="text-lg text-muted-foreground font-medium">{t('pricing.period')}</span>
                  </div>

                  <div className="space-y-4 mb-8 text-left max-w-xs mx-auto md:mx-0">
                    {[
                      t('pricing.feature_1'),
                      t('pricing.feature_2'),
                      t('pricing.feature_3'),
                      t('pricing.feature_4')
                    ].map((f, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <div className="rounded-full bg-primary/10 p-1 mt-0.5">
                          <Check className="w-3.5 h-3.5 text-primary" />
                        </div>
                        <span className="font-medium text-sm sm:text-base">{f}</span>
                      </div>
                    ))}
                  </div>

                  <Link to="/register" className="block w-full">
                    <Button size="lg" className="w-full font-bold text-base sm:text-lg h-12 sm:h-14 btn-iridescent text-white shadow-lg sm:shadow-xl shadow-primary/20 rounded-xl hover:scale-[1.02] transition-transform">
                      {t('pricing.cta')}
                    </Button>
                  </Link>
                  <p className="text-center text-xs text-muted-foreground mt-3">No requiere tarjeta de crédito</p>
                </div>

                {/* Right: Payment Methods */}
                {/* Right: Payment Methods - Ultra Premium Redesign */}
                <div className="w-full md:w-80 relative group/card">
                  {/* Cinematic Glow Background */}
                  <div className="absolute -inset-1 bg-gradient-to-br from-primary/30 to-purple-500/30 rounded-[2rem] blur-2xl opacity-20 group-hover/card:opacity-40 transition-opacity duration-1000" />

                  <div className="relative bg-[#0A0A0A]/90 backdrop-blur-xl rounded-3xl p-6 border border-white/5 shadow-2xl overflow-hidden">
                    {/* Subtle Grid Pattern Overlay */}
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay"></div>

                    <h4 className="relative font-bold mb-6 text-[10px] text-white/30 uppercase tracking-[0.2em] text-center">
                      {i18n.language?.startsWith('es') ? 'Pagos Locales' : 'Secure Checkout'}
                    </h4>

                    {i18n.language?.startsWith('es') ? (
                      // Spanish: Local Payments PREMIUM GRID
                      <div className="relative grid grid-cols-2 gap-4">
                        {/* YAPE - Neobrutalism Pop */}
                        <div className="group cursor-default relative">
                          <div className="absolute inset-0 bg-[#742284] rounded-2xl blur-md opacity-0 group-hover:opacity-40 transition-opacity duration-500" />
                          <div className="relative h-28 bg-[#1a1a1a] border border-white/5 rounded-2xl flex flex-col items-center justify-center gap-3 hover:border-[#742284]/50 hover:-translate-y-1 transition-all duration-300">
                            <div className="w-12 h-12 rounded-xl bg-[#742284] flex items-center justify-center text-white font-black italic text-xs shadow-lg shadow-[#742284]/30">Yape</div>
                            <span className="text-[10px] font-bold text-white/50 tracking-wider">INSTANT</span>
                          </div>
                        </div>

                        {/* PLIN */}
                        <div className="group cursor-default relative">
                          <div className="absolute inset-0 bg-[#00D1D1] rounded-2xl blur-md opacity-0 group-hover:opacity-40 transition-opacity duration-500" />
                          <div className="relative h-28 bg-[#1a1a1a] border border-white/5 rounded-2xl flex flex-col items-center justify-center gap-3 hover:border-[#00D1D1]/50 hover:-translate-y-1 transition-all duration-300">
                            <div className="w-12 h-12 rounded-xl bg-[#00D1D1] flex items-center justify-center text-white font-bold text-xs shadow-lg shadow-[#00D1D1]/30">Plin</div>
                            <span className="text-[10px] font-bold text-white/50 tracking-wider">INSTANT</span>
                          </div>
                        </div>

                        {/* Scotiabank - Sleek Strip */}
                        <div className="col-span-2 relative group cursor-default">
                          <div className="bg-[#1a1a1a] border border-white/5 p-3 rounded-xl flex items-center justify-center gap-3 hover:bg-red-500/5 hover:border-red-500/30 transition-all">
                            <div className="flex space-x-1">
                              <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                              <div className="w-1.5 h-1.5 rounded-full bg-red-500/50" />
                            </div>
                            <span className="text-[10px] font-medium text-white/60 group-hover:text-red-400 transition-colors tracking-widest uppercase">Transferencias Scotiabank</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      // English: PayPal PREMIUM CARD
                      <div className="relative flex flex-col items-center justify-center h-full space-y-5">
                        <div className="w-full relative group cursor-pointer overflow-hidden rounded-2xl">
                          <div className="absolute inset-0 bg-gradient-to-r from-[#0070BA] to-[#1546A0] opacity-10 group-hover:opacity-20 transition-opacity duration-500" />
                          <div className="relative bg-[#1a1a1a] border border-white/5 p-6 rounded-2xl flex flex-col items-center gap-4 hover:border-[#0070BA]/50 transition-all duration-300 group-hover:shadow-[0_0_30px_-5px_rgba(0,112,186,0.3)]">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-[#0070BA] flex items-center justify-center text-white shadow-lg">
                                <span className="font-bold italic text-xs">P</span>
                              </div>
                              <span className="text-lg font-bold text-white tracking-tight">PayPal</span>
                            </div>

                            {/* Card Pills */}
                            <div className="flex items-center gap-2 opacity-60 grayscale group-hover:grayscale-0 transition-all duration-500">
                              <div className="h-5 w-8 rounded bg-white/10 flex items-center justify-center border border-white/5"><div className="w-3 h-3 rounded-full bg-red-400/80" /></div>
                              <div className="h-5 w-8 rounded bg-white/10 flex items-center justify-center border border-white/5"><div className="w-3 h-3 rounded-full bg-orange-400/80" /></div>
                              <div className="h-5 w-8 rounded bg-white/10 flex items-center justify-center border border-white/5"><div className="w-3 h-3 rounded-full bg-blue-400/80" /></div>
                            </div>

                            <span className="text-[10px] text-white/30 uppercase tracking-widest mt-1">World Class Security</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-[9px] text-white/20 uppercase tracking-widest">
                          <ShieldCheck className="w-3 h-3" />
                          256-bit SSL Encrypted
                        </div>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      </section >

      {/* --- FAQ --- */}
      < section className="py-16 lg:py-24 px-4 bg-slate-950 text-white border-t border-white/5" >
        <div className="container mx-auto max-w-3xl">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-8 sm:mb-12">{t('faq.title')}</h2>
          <Accordion type="single" collapsible className="w-full">
            {[
              {
                q: t('faq.q1'),
                a: t('faq.a1')
              },
              {
                q: t('faq.q2'),
                a: t('faq.a2')
              },
              {
                q: t('faq.q3'),
                a: t('faq.a3')
              },
              {
                q: t('faq.q4'),
                a: t('faq.a4')
              }
            ].map((faq, i) => (
              <AccordionItem key={i} value={`item-${i}`} className="border-white/10">
                <AccordionTrigger className="text-base sm:text-lg font-medium text-left hover:text-primary transition-colors">{faq.q}</AccordionTrigger>
                <AccordionContent className="text-slate-400 text-sm sm:text-base">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section >

      {/* --- CTA BOTTOM --- */}
      < section className="py-16 sm:py-20 px-4" >
        <div className="container mx-auto max-w-5xl">
          <div className="relative rounded-[2rem] sm:rounded-[3rem] bg-slate-900 overflow-hidden px-6 py-12 sm:px-8 sm:py-16 md:p-20 text-center shadow-2xl">
            <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(68,68,68,.2)_50%,transparent_75%,transparent_100%)] bg-[length:250%_250%,100%_100%] bg-[position:-100%_0,0_0] bg-no-repeat animate-[shine_3s_infinite]" />
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-[100px]" />

            <h2 className="text-3xl md:text-5xl font-black text-white mb-6 relative z-10 text-balance">
              {t('cta_bottom.title')}
            </h2>
            <p className="text-slate-400 text-base sm:text-lg mb-8 sm:mb-10 max-w-2xl mx-auto relative z-10 text-pretty">
              {t('cta_bottom.subtitle')}
            </p>
            <Link to="/register" className="relative z-10 w-full sm:w-auto block sm:inline-block">
              <Button size="xl" className="btn-iridescent text-white hover:scale-105 font-bold h-14 sm:h-16 px-8 sm:px-12 text-base sm:text-lg shadow-xl hover:shadow-2xl transition-all border-none w-full sm:w-auto">
                {t('cta_bottom.btn')}
              </Button>
            </Link>
            <p className="text-slate-500 text-xs sm:text-sm mt-6 relative z-10">{t('cta_bottom.made_in')}</p>
          </div>
        </div>
      </section >

      {/* --- FOOTER --- */}
      < footer className="py-16 border-t border-white/10 bg-slate-950 text-white relative overflow-hidden px-4" >
        <div className="container mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12 mb-12">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/20">
                  <MessageCircle className="w-6 h-6" />
                </div>
                <span className="font-black text-xl tracking-tight">Lead Widget</span>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed">
                {t('footer.description')}
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-6 text-sm uppercase tracking-widest text-white">{t('footer.product')}</h4>
              <ul className="space-y-4 text-sm text-slate-400">
                <li><button onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })} className="hover:text-primary transition-colors">{t('footer.features')}</button></li>
                <li><button onClick={() => document.getElementById('templates')?.scrollIntoView({ behavior: 'smooth' })} className="hover:text-primary transition-colors">{t('footer.templates')}</button></li>
                <li><button onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })} className="hover:text-primary transition-colors">{t('footer.integrations')}</button></li>
                <li><button onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })} className="hover:text-primary transition-colors">{t('footer.pricing')}</button></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-6 text-sm uppercase tracking-widest text-white">{t('footer.company')}</h4>
              <ul className="space-y-4 text-sm text-slate-400">
                <li><button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="hover:text-primary transition-colors">{t('footer.about')}</button></li>
                <li><button className="hover:text-primary transition-colors opacity-50 cursor-not-allowed">{t('footer.success_stories')}</button></li>
                <li><button className="hover:text-primary transition-colors opacity-50 cursor-not-allowed">{t('footer.blog')}</button></li>
                <li><Link to="/afiliados" target="_blank" rel="noopener noreferrer" className="hover:text-emerald-400 transition-colors font-medium relative group flex items-center gap-2 w-fit">
                  Afiliados
                  <span className="bg-emerald-500/20 text-emerald-400 text-[10px] px-1.5 py-0.5 rounded-full border border-emerald-500/30 group-hover:bg-emerald-500 group-hover:text-white transition-all">Socio</span>
                </Link></li>
                <li><button onClick={() => window.dispatchEvent(new Event('open-lead-widget'))} className="hover:text-primary transition-colors">{t('footer.support')}</button></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-6 text-sm uppercase tracking-widest text-white">{t('footer.legal')}</h4>
              <ul className="space-y-4 text-sm text-slate-400">
                <li className="hover:text-primary transition-colors cursor-pointer">{t('footer.privacy')}</li>
                <li className="hover:text-primary transition-colors cursor-pointer">{t('footer.terms')}</li>
                <li className="hover:text-primary transition-colors cursor-pointer">{t('footer.claims')}</li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-500">
            <p>{t('footer.rights')}</p>
            <div className="flex gap-6">
              <span className="hover:text-primary transition-colors cursor-pointer">Instagram</span>
              <span className="hover:text-primary transition-colors cursor-pointer">LinkedIn</span>
              <span className="hover:text-primary transition-colors cursor-pointer">WhatsApp</span>
            </div>
          </div>
        </div>
      </footer >

      <SalesWidget />

      {/* Exit Popup */}
      {
        showExitPopup && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-md animate-in fade-in duration-500">
            <div className="bg-card w-full max-w-lg p-1 sm:p-2 rounded-[2.5rem] border shadow-2xl relative animate-in zoom-in-95 duration-300">
              <div className="bg-background rounded-[2rem] p-8 md:p-12 text-center space-y-6 relative overflow-hidden">
                {/* Decorative background circle */}
                <div className="absolute -top-12 -right-12 w-32 h-32 bg-primary/10 rounded-full blur-2xl" />

                <button
                  onClick={() => setShowExitPopup(false)}
                  className="absolute top-6 right-6 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <CloseIcon className="w-5 h-5" />
                </button>

                <div className="w-16 h-16 bg-gradient-to-tr from-primary to-emerald-400 rounded-2xl flex items-center justify-center mx-auto text-white shadow-xl shadow-primary/20 rotate-6 transform transition-transform group-hover:rotate-0">
                  <Sparkles className="w-8 h-8" />
                </div>

                <div className="space-y-2">
                  <h3 className="text-3xl font-black tracking-tight">{t('exit_popup.title')}</h3>
                  <p className="text-muted-foreground text-lg text-balance">
                    {t('exit_popup.subtitle')}
                  </p>
                </div>

                <div className="pt-2">
                  <Button
                    onClick={handleOpenDemoFromPopup}
                    className="w-full font-bold h-14 text-lg btn-iridescent text-white shadow-xl shadow-primary/30 rounded-xl"
                    size="lg"
                  >
                    {t('exit_popup.cta')}
                  </Button>
                  <button
                    onClick={() => setShowExitPopup(false)}
                    className="mt-4 text-sm text-muted-foreground hover:text-foreground transition-colors underline underline-offset-4"
                  >
                    {t('exit_popup.dismiss')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      }

    </div >
  );
}
