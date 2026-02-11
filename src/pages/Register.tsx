import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/lib/auth';
import { MessageCircle, Loader2, ArrowLeft, Check, Mail, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';

export default function Register() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const benefits = t('auth_pages.register.left_panel.benefits', { returnObjects: true }) as string[];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error, data } = await signUp(email, password, businessName);

    if (error) {
      toast({
        title: 'Error al registrarse', // You could translate this too if desired
        description: error.message,
        variant: 'destructive',
      });
      setLoading(false);
    } else {
      if (data) {
        navigate('/app');
      } else {
        setIsSubmitted(true);
        setLoading(false);
      }
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 bg-slate-50 dark:bg-[#020617]">
        <div className="w-full max-w-md text-center space-y-8 animate-in fade-in zoom-in duration-300 bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl">
          <div className="flex justify-center">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
              <Mail className="w-10 h-10 text-primary" />
            </div>
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">{t('auth_pages.register.success.title')}</h1>
            <p className="text-muted-foreground text-lg">
              {t('auth_pages.register.success.subtitle')} <span className="font-semibold text-foreground">{email}</span>.
            </p>
          </div>

          <div className="bg-slate-50 dark:bg-slate-950/50 p-6 rounded-2xl text-left space-y-4 border border-border">
            <p className="text-sm font-medium flex items-center gap-2">
              <Check className="w-4 h-4 text-primary" /> {t('auth_pages.register.success.check_inbox')}
            </p>
            <p className="text-sm font-medium flex items-center gap-2">
              <Check className="w-4 h-4 text-primary" /> {t('auth_pages.register.success.click_button')}
            </p>
            <p className="text-sm font-medium flex items-center gap-2">
              <Check className="w-4 h-4 text-primary" /> {t('auth_pages.register.success.start_capture')}
            </p>
          </div>

          <div className="space-y-4">
            <Button asChild className="w-full h-12 btn-iridescent text-white font-bold text-lg">
              <Link to="/login">
                {t('auth_pages.register.success.go_login')}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>

            <p className="text-sm text-muted-foreground">
              {t('auth_pages.register.success.no_email')}{' '}
              <button
                onClick={() => setIsSubmitted(false)}
                className="text-primary hover:underline font-bold"
              >
                {t('auth_pages.register.success.try_other')}
              </button>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-[#020617]">
      {/* Theme Toggle - Removed */}

      {/* Left Panel - Decoration */}
      <div className="hidden lg:flex flex-1 hero-gradient items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '40px 40px' }}></div>
        <div className="text-white max-w-md relative z-10 glass-dark p-12 rounded-3xl border border-white/10">
          <div className="w-24 h-24 bg-white/10 rounded-2xl flex items-center justify-center mb-8 backdrop-blur-sm shadow-xl">
            <MessageCircle className="w-12 h-12 text-white" />
          </div>
          <h2 className="text-3xl font-bold mb-4 tracking-tight">{t('auth_pages.register.left_panel.title')}</h2>
          <p className="text-lg opacity-90 mb-8 leading-relaxed">
            {t('auth_pages.register.left_panel.desc')}
          </p>

          <ul className="space-y-4">
            {Array.isArray(benefits) && benefits.map((benefit) => (
              <li key={benefit} className="flex items-center gap-3">
                <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center shrink-0">
                  <Check className="w-4 h-4 text-white" />
                </div>
                <span className="font-medium">{benefit}</span>
              </li>
            ))}
          </ul>

          <div className="mt-12 p-6 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-md">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center font-bold text-lg">MF</div>
              <div>
                <p className="font-bold">{t('auth_pages.register.left_panel.testimonial_author')}</p>
                <p className="text-sm opacity-80">{t('auth_pages.register.left_panel.testimonial_role')}</p>
              </div>
            </div>
            <p className="text-sm opacity-90 italic">
              "{t('auth_pages.register.left_panel.testimonial')}"
            </p>
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8 bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl dark:shadow-primary/5 transition-all">
          <div>
            <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8">
              <ArrowLeft className="w-4 h-4" />
              {t('auth_pages.back_home')}
            </Link>

            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
                <MessageCircle className="w-6 h-6 text-white" />
              </div>
              <span className="font-bold text-2xl tracking-tight">Lead <span className="text-primary">Widget</span></span>
            </div>
            <h1 className="text-3xl font-bold mt-6 tracking-tight">{t('auth_pages.register.title')}</h1>
            <p className="text-muted-foreground mt-2">{t('auth_pages.register.subtitle')}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="businessName">{t('auth_pages.register.business_label')}</Label>
              <Input
                id="businessName"
                type="text"
                placeholder={t('auth_pages.register.placeholders.business')}
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                required
                className="h-12 bg-slate-50 dark:bg-slate-950/50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">{t('auth_pages.register.email_label')}</Label>
              <Input
                id="email"
                type="email"
                placeholder={t('auth_pages.register.placeholders.email')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-12 bg-slate-50 dark:bg-slate-950/50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">{t('auth_pages.register.password_label')}</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder={t('auth_pages.register.placeholders.password')}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="h-12 pr-12 bg-slate-50 dark:bg-slate-950/50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              size="lg"
              className="w-full h-12 text-lg font-bold btn-iridescent text-white"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                t('auth_pages.register.submit_btn')
              )}
            </Button>
          </form>

          <p className="text-center text-muted-foreground">
            {t('auth_pages.register.has_account')}{' '}
            <Link to="/login" className="text-primary font-bold hover:underline">
              {t('auth_pages.register.login_link')}
            </Link>
          </p>

          <p className="text-center text-xs text-muted-foreground">
            {t('auth_pages.register.terms')}
          </p>
        </div>
      </div>
    </div>
  );
}
