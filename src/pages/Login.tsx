import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/lib/auth';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { MessageCircle, Loader2, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';

export default function Login() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localLoading, setLocalLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { signIn, signInWithGoogle, user, isSuperAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (user && !authLoading) {
      // DEBUG LOGS
      console.log('Login useEffect:', { userEmail: user.email, isSuperAdmin });

      // Check role OR specific email hardcoded fallback (for instant feedback)
      if (isSuperAdmin || user.email === 'superadmin2@leadwidget.pe' || user.email === 'superadmin@leadwidget.pe') {
        console.log('Redirecting to SUPERADMIN');
        navigate('/superadmin');
      } else {
        console.log('Redirecting to APP');
        navigate('/app');
      }
    }
  }, [user, isSuperAdmin, authLoading, navigate]);

  const handlePasswordReset = async () => {
    if (!email) {
      toast({
        title: "Ingresa tu correo",
        description: "Escribe tu correo electrónico en el campo de arriba y vuelve a hacer clic aquí.",
      });
      return;
    }
    try {
      setLocalLoading(true);
      await sendPasswordResetEmail(auth, email);
      toast({
        title: "✅ Correo enviado",
        description: "Revisa tu bandeja de entrada para restablecer tu contraseña.",
        className: "bg-emerald-600 text-white border-0"
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "No pudimos enviar el correo. Verifica que esté bien escrito.",
        variant: "destructive"
      });
    } finally {
      setLocalLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalLoading(true);

    try {
      const { error } = await signIn(email, password);

      if (error) {
        toast({
          title: t('auth_pages.login.error_title') || 'Error',
          description: error.message,
          variant: 'destructive',
        });
        setLocalLoading(false);
      }
      // Redirect handled by useEffect
    } catch (err: any) {
      toast({
        title: 'Error inesperado',
        description: err.message,
        variant: 'destructive',
      });
      setLocalLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      const { error } = await signInWithGoogle();
      if (error) {
        toast({
          title: t('auth_pages.login.error_title') || 'Error',
          description: error.message,
          variant: 'destructive',
        });
      }
    } catch (err: any) {
      toast({
        title: 'Error inesperado',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-[#020617]">
      {/* Theme Toggle - Removed */}

      {/* Left Panel - Form */}
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
            <h1 className="text-3xl font-bold mt-6 tracking-tight">{t('auth_pages.login.title')}</h1>
            <p className="text-muted-foreground mt-2">{t('auth_pages.login.subtitle')}</p>
          </div>

          {/* Social Login Buttons */}
          <div className="space-y-3">
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="w-full h-12 text-base font-semibold border-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
              onClick={handleGoogleSignIn}
              disabled={localLoading || authLoading || googleLoading}
            >
              {googleLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  {t('auth_pages.login.social_google')}
                </>
              )}
            </Button>
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-slate-200 dark:border-slate-800" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white dark:bg-slate-900 px-2 text-muted-foreground">
                {t('auth_pages.login.divider')}
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">{t('auth_pages.login.email_label')}</Label>
              <Input
                id="email"
                type="email"
                placeholder={t('auth_pages.login.placeholders.email')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-12 bg-slate-50 dark:bg-slate-950/50"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="password">{t('auth_pages.login.password_label')}</Label>
                <button
                  type="button"
                  onClick={handlePasswordReset}
                  className="text-xs text-muted-foreground hover:text-emerald-500 hover:underline transition-colors"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder={t('auth_pages.login.placeholders.password')}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
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
              variant="default"
              size="lg"
              className="w-full h-12 text-lg font-bold btn-iridescent text-white"
              disabled={localLoading || authLoading}
            >
              {localLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                t('auth_pages.login.submit_btn')
              )}
            </Button>
          </form>

          <p className="text-center text-muted-foreground">
            {t('auth_pages.login.no_account')}{' '}
            <Link to="/register" className="text-primary font-bold hover:underline">
              {t('auth_pages.login.register_link')}
            </Link>
          </p>
        </div>
      </div>

      {/* Right Panel - Decoration */}
      <div className="hidden lg:flex flex-1 hero-gradient items-center justify-center p-12 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '40px 40px' }}></div>

        <div className="text-center text-white max-w-md relative z-10 glass-dark p-12 rounded-3xl border border-white/10">
          <div className="w-24 h-24 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-8 backdrop-blur-sm shadow-xl">
            <MessageCircle className="w-12 h-12 text-white" />
          </div>
          <h2 className="text-4xl font-bold mb-6 tracking-tight">{t('auth_pages.login.right_panel.title')}</h2>
          <p className="text-lg opacity-90 leading-relaxed">
            {t('auth_pages.login.right_panel.desc')}
          </p>
        </div>
      </div>
    </div>
  );
}
