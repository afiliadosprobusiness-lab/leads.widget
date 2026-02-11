import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Code, Globe, ShoppingBag, LayoutTemplate, HelpCircle, Check, Copy, ExternalLink, Menu, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useTranslation, Trans } from 'react-i18next';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';

export default function InstallationGuide() {
    const { t } = useTranslation();
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('wordpress');
    const [widgetId, setWidgetId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [copiedId, setCopiedId] = useState(false);
    const [copiedCode, setCopiedCode] = useState(false);

    useEffect(() => {
        const fetchWidgetId = async () => {
            if (!user) return;
            try {
                // Correct collection: 'widget_configs', Correct field: 'user_id'
                const q = query(collection(db, 'widget_configs'), where('user_id', '==', user.uid), limit(1));
                const querySnapshot = await getDocs(q);
                if (!querySnapshot.empty) {
                    const data = querySnapshot.docs[0].data();
                    // The public short ID is usually stored in 'widget_id' field, NOT the document ID
                    setWidgetId(data.widget_id || querySnapshot.docs[0].id);
                }
            } catch (error) {
                console.error("Error fetching widget ID:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchWidgetId();
    }, [user]);

    const scriptCode = widgetId
        ? `<script src="${window.location.origin}/api/w/${widgetId}.js" async></script>`
        : '<!-- Cargando tu código único... -->';

    const handleCopyId = () => {
        if (widgetId) {
            navigator.clipboard.writeText(widgetId);
            setCopiedId(true);
            setTimeout(() => setCopiedId(false), 2000);
        }
    };

    const handleCopyCode = () => {
        if (widgetId) {
            navigator.clipboard.writeText(scriptCode);
            setCopiedCode(true);
            setTimeout(() => setCopiedCode(false), 2000);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-8">
            <div className="max-w-4xl mx-auto space-y-8">

                {/* Header */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div>
                        <Link to="/app" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-2 transition-colors">
                            <ArrowLeft className="w-4 h-4 mr-1" /> {t('installation_guide.back_to_dashboard')}
                        </Link>
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">{t('installation_guide.title')}</h1>
                        <p className="text-slate-500 dark:text-slate-400 mt-2">
                            {t('installation_guide.subtitle')}
                        </p>
                    </div>
                    <div className="flex items-center gap-3 bg-white dark:bg-slate-900 p-2 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
                        <span className="text-xs font-medium text-muted-foreground px-2 hidden sm:inline">Idioma:</span>
                        <LanguageSwitcher />
                    </div>
                </div>

                {/* Main Content */}
                <Card className="border-slate-200 dark:border-slate-800 shadow-xl">
                    <CardHeader>
                        <CardTitle>{t('installation_guide.platform_question')}</CardTitle>
                        <CardDescription>{t('installation_guide.platform_desc')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="flex justify-center py-12">
                                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                            </div>
                        ) : (
                            <Tabs defaultValue="wordpress" value={activeTab} onValueChange={setActiveTab} className="space-y-8">

                                <TabsList className="flex flex-wrap h-auto gap-2 bg-transparent p-0 justify-start">
                                    <TabsTrigger value="wordpress" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white border border-slate-200 dark:border-slate-700 px-6 py-3 rounded-xl gap-2 h-auto hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">
                                        <Globe className="w-5 h-5" /> {t('installation_guide.wordpress_tab')}
                                    </TabsTrigger>
                                    <TabsTrigger value="shopify" className="data-[state=active]:bg-green-600 data-[state=active]:text-white border border-slate-200 dark:border-slate-700 px-6 py-3 rounded-xl gap-2 h-auto hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">
                                        <ShoppingBag className="w-5 h-5" /> {t('installation_guide.shopify_tab')}
                                    </TabsTrigger>
                                    <TabsTrigger value="wix" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white border border-slate-200 dark:border-slate-700 px-6 py-3 rounded-xl gap-2 h-auto hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">
                                        <LayoutTemplate className="w-5 h-5" /> {t('installation_guide.wix_tab')}
                                    </TabsTrigger>
                                    <TabsTrigger value="html" className="data-[state=active]:bg-orange-600 data-[state=active]:text-white border border-slate-200 dark:border-slate-700 px-6 py-3 rounded-xl gap-2 h-auto hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">
                                        <Code className="w-5 h-5" /> {t('installation_guide.html_tab')}
                                    </TabsTrigger>
                                </TabsList>

                                <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-6 border border-slate-200 dark:border-slate-800">

                                    {/* WordPress Instructions */}
                                    <TabsContent value="wordpress" className="mt-0 space-y-8 animate-in fade-in zoom-in-95 duration-300">
                                        <div className="flex items-center gap-4 mb-6">
                                            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                                                <Globe className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-bold">{t('installation_guide.wp_title')}</h3>
                                                <p className="text-sm text-muted-foreground">{t('installation_guide.wp_subtitle')}</p>
                                            </div>
                                        </div>

                                        {/* OPTION A: OFFICIAL PLUGIN */}
                                        <div className="bg-white dark:bg-slate-950 border border-blue-200 dark:border-blue-900/50 rounded-xl p-6 shadow-sm">
                                            <div className="flex items-start justify-between gap-4 mb-4">
                                                <div>
                                                    <h4 className="font-semibold text-lg text-blue-700 dark:text-blue-400 flex items-center gap-2">
                                                        <Check className="w-5 h-5" /> Opción Recomendada: Plugin Oficial
                                                    </h4>
                                                    <p className="text-sm text-muted-foreground mt-1">
                                                        La forma más fácil. Instala nuestro plugin y pega tu ID único.
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex flex-col md:flex-row gap-6 items-center">
                                                <div className="flex-1 space-y-3 w-full">
                                                    <div className="flex items-center justify-between text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                                                        <span>Tu Widget ID Único</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        {loading ? (
                                                            <div className="flex-1 bg-slate-900 border border-slate-700 rounded-lg p-3 flex justify-center">
                                                                <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
                                                            </div>
                                                        ) : widgetId ? (
                                                            <code className="flex-1 bg-slate-900 text-green-400 px-4 py-3 rounded-lg font-mono text-center text-lg tracking-widest border border-slate-700 shadow-inner">
                                                                {widgetId}
                                                            </code>
                                                        ) : (
                                                            <div className="flex-1 bg-red-900/20 border border-red-900/50 text-red-400 px-4 py-3 rounded-lg text-center text-sm">
                                                                ⚠️ No has creado ningún widget aún.
                                                                <Link to="/app" className="underline ml-2 hover:text-red-300">Ir al Dashboard</Link>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <Button
                                                        onClick={handleCopyId}
                                                        className="w-full bg-slate-800 hover:bg-slate-700 text-white"
                                                        disabled={!widgetId || loading}
                                                    >
                                                        {copiedId ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                                                        {copiedId ? "¡Copiado!" : "Copiar ID para el Plugin"}
                                                    </Button>
                                                </div>
                                                <div className="w-full md:w-px h-px md:h-24 bg-slate-200 dark:bg-slate-800"></div>
                                                <div className="flex-1 text-sm space-y-2">
                                                    <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                                                        <li>Instala el plugin <strong>LeadWidget</strong> en tu WordPress.</li>
                                                        <li>Ve a <strong>Ajustes &gt; LeadWidget</strong>.</li>
                                                        <li>Pega este ID en el campo correspondiente.</li>
                                                        <li>Guarda y ¡listo!</li>
                                                    </ol>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="relative">
                                            <div className="absolute inset-0 flex items-center">
                                                <span className="w-full border-t border-slate-200 dark:border-slate-800" />
                                            </div>
                                            <div className="relative flex justify-center text-xs uppercase">
                                                <span className="bg-slate-50 dark:bg-slate-900 px-2 text-muted-foreground">
                                                    O hazlo manualmente (Opción Avanzada)
                                                </span>
                                            </div>
                                        </div>

                                        {/* OPTION B: MANUAL CODE */}
                                        <div className="grid gap-6 md:grid-cols-2 opacity-80 hover:opacity-100 transition-opacity">
                                            <div className="space-y-4">
                                                <div className="flex gap-3">
                                                    <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-sm">1</div>
                                                    <p className="text-sm">
                                                        Instala el plugin gratuito <strong>"WPCode"</strong> (o "Insert Headers and Footers").
                                                    </p>
                                                </div>
                                                <div className="flex gap-3">
                                                    <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-sm">2</div>
                                                    <p className="text-sm">
                                                        Ve a <strong>Code Snippets &gt; Header &amp; Footer</strong>.
                                                    </p>
                                                </div>
                                                <div className="flex gap-3">
                                                    <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-sm">3</div>
                                                    <div className="space-y-2 w-full">
                                                        <p className="text-sm">
                                                            Pega este código en la sección <strong>Footer</strong>:
                                                        </p>
                                                        {/* Dark Code Block for Manual Install */}
                                                        <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden shadow-lg">
                                                            <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800">
                                                                <div className="flex gap-1.5">
                                                                    <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50"></div>
                                                                    <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50"></div>
                                                                    <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50"></div>
                                                                </div>
                                                                <span className="text-[10px] uppercase font-mono text-slate-500">HTML Script</span>
                                                            </div>
                                                            <div className="p-4 overflow-x-auto">
                                                                <pre className="text-xs font-mono text-slate-300 whitespace-pre-wrap break-all">
                                                                    {scriptCode}
                                                                </pre>
                                                            </div>
                                                            <div className="px-4 py-2 bg-slate-900 border-t border-slate-800 flex justify-end">
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="h-8 text-xs text-slate-400 hover:text-white hover:bg-slate-800"
                                                                    onClick={handleCopyCode}
                                                                >
                                                                    {copiedCode ? <Check className="w-3 h-3 mr-1" /> : <Copy className="w-3 h-3 mr-1" />}
                                                                    {copiedCode ? "Copiado" : "Copiar código"}
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="bg-white dark:bg-slate-950 rounded-xl border p-4 flex items-center justify-center">
                                                <div className="text-center space-y-2 opacity-50">
                                                    <LayoutTemplate className="w-16 h-16 mx-auto mb-2" />
                                                    <p className="text-xs">{t('installation_guide.wp_visual')}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </TabsContent>

                                    {/* Shopify Instructions */}
                                    <TabsContent value="shopify" className="mt-0 space-y-6 animate-in fade-in zoom-in-95 duration-300">
                                        <div className="flex items-center gap-4 mb-6">
                                            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
                                                <ShoppingBag className="w-6 h-6 text-green-600 dark:text-green-400" />
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="text-xl font-bold flex items-center gap-2">
                                                    {t('installation_guide.shopify_title')}
                                                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                                                        App Próximamente
                                                    </span>
                                                </h3>
                                                <p className="text-sm text-muted-foreground">{t('installation_guide.shopify_subtitle')}</p>
                                            </div>
                                        </div>

                                        {/* Coming Soon Banner */}
                                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border border-green-200 dark:border-green-900/50 rounded-xl p-4 flex items-start gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center flex-shrink-0">
                                                <ShoppingBag className="w-5 h-5 text-green-600 dark:text-green-400" />
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="font-semibold text-sm text-green-900 dark:text-green-100 mb-1">
                                                    🚀 App Nativa en Desarrollo
                                                </h4>
                                                <p className="text-xs text-green-700 dark:text-green-300 leading-relaxed">
                                                    Estamos construyendo una <strong>App Oficial para Shopify</strong> que permitirá instalación en 1-clic directamente desde la Shopify App Store. Mientras tanto, puedes usar el método manual que funciona perfectamente.
                                                </p>
                                            </div>
                                        </div>

                                        {/* Manual Installation */}
                                        <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
                                            <h4 className="font-semibold text-base mb-4 flex items-center gap-2">
                                                <Code className="w-4 h-4 text-green-600" />
                                                Instalación Manual (Disponible Ahora)
                                            </h4>

                                            {/* Code Block */}
                                            <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden shadow-lg mb-4">
                                                <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800">
                                                    <div className="flex gap-1.5">
                                                        <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50"></div>
                                                        <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50"></div>
                                                        <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50"></div>
                                                    </div>
                                                    <span className="text-[10px] uppercase font-mono text-slate-500">Liquid Script</span>
                                                </div>
                                                <div className="p-4 overflow-x-auto">
                                                    <pre className="text-xs font-mono text-slate-300 whitespace-pre-wrap break-all">
                                                        {scriptCode}
                                                    </pre>
                                                </div>
                                                <div className="px-4 py-2 bg-slate-900 border-t border-slate-800 flex justify-end">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 text-xs text-slate-400 hover:text-white hover:bg-slate-800"
                                                        onClick={handleCopyCode}
                                                    >
                                                        {copiedCode ? <Check className="w-3 h-3 mr-1" /> : <Copy className="w-3 h-3 mr-1" />}
                                                        {copiedCode ? "Copiado" : "Copiar código"}
                                                    </Button>
                                                </div>
                                            </div>

                                            <div className="space-y-3">
                                                <div className="flex gap-3">
                                                    <div className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center font-bold text-sm text-green-600">1</div>
                                                    <p className="text-sm">En tu admin de Shopify, ve a <strong>Tienda Online → Temas</strong>.</p>
                                                </div>
                                                <div className="flex gap-3">
                                                    <div className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center font-bold text-sm text-green-600">2</div>
                                                    <p className="text-sm">Haz clic en los 3 puntos <strong>(...)</strong> junto a tu tema actual y selecciona <strong>"Editar código"</strong>.</p>
                                                </div>
                                                <div className="flex gap-3">
                                                    <div className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center font-bold text-sm text-green-600">3</div>
                                                    <p className="text-sm">En la carpeta <strong>Layout</strong>, abre el archivo <code className="bg-slate-200 dark:bg-slate-800 px-1.5 py-0.5 rounded text-xs font-mono">theme.liquid</code>.</p>
                                                </div>
                                                <div className="flex gap-3">
                                                    <div className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center font-bold text-sm text-green-600">4</div>
                                                    <p className="text-sm">Pega el script justo <strong>antes</strong> de la etiqueta de cierre <code className="bg-red-100 dark:bg-red-900/30 px-1.5 py-0.5 rounded text-xs font-mono text-red-600 dark:text-red-400">&lt;/body&gt;</code>.</p>
                                                </div>
                                                <div className="flex gap-3">
                                                    <div className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center font-bold text-sm text-green-600">5</div>
                                                    <p className="text-sm">Haz clic en <strong>"Guardar"</strong> y ¡listo! 🎉</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Help Note */}
                                        <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/50 rounded-lg p-3 flex gap-2 text-xs">
                                            <HelpCircle className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                                            <p className="text-blue-700 dark:text-blue-300">
                                                <strong>Nota:</strong> El widget aparecerá en todas las páginas de tu tienda automáticamente. Compatible con cualquier tema de Shopify.
                                            </p>
                                        </div>
                                    </TabsContent>

                                    {/* Wix Instructions - Reusing Dark Block */}
                                    <TabsContent value="wix" className="mt-0 space-y-6 animate-in fade-in zoom-in-95 duration-300">
                                        <div className="flex items-center gap-4 mb-6">
                                            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
                                                <LayoutTemplate className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-bold">{t('installation_guide.wix_title')}</h3>
                                                <p className="text-sm text-muted-foreground">{t('installation_guide.wix_subtitle')}</p>
                                            </div>
                                        </div>
                                        <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden shadow-lg my-4">
                                            <div className="p-4 overflow-x-auto">
                                                <pre className="text-xs font-mono text-slate-300 whitespace-pre-wrap break-all">
                                                    {scriptCode}
                                                </pre>
                                            </div>
                                            <div className="px-4 py-2 bg-slate-900 border-t border-slate-800 flex justify-end">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 text-xs text-slate-400 hover:text-white hover:bg-slate-800"
                                                    onClick={handleCopyCode}
                                                >
                                                    {copiedCode ? <Check className="w-3 h-3 mr-1" /> : <Copy className="w-3 h-3 mr-1" />}
                                                    {copiedCode ? "Copiado" : "Copiar código"}
                                                </Button>
                                            </div>
                                        </div>
                                        <div className="space-y-4">
                                            <div className="flex gap-3">
                                                <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-sm">1</div>
                                                <p className="text-sm">Ve a <strong>Configuración &gt; Código personalizado</strong>.</p>
                                            </div>
                                            <div className="flex gap-3">
                                                <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-sm">2</div>
                                                <p className="text-sm">Selecciona <strong>"Body - fin"</strong>.</p>
                                            </div>
                                        </div>
                                    </TabsContent>

                                    {/* HTML / Other Instructions - Reusing Dark Block */}
                                    <TabsContent value="html" className="mt-0 space-y-6 animate-in fade-in zoom-in-95 duration-300">
                                        <div className="flex items-center gap-4 mb-6">
                                            <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center">
                                                <Code className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-bold">{t('installation_guide.html_title')}</h3>
                                                <p className="text-sm text-muted-foreground">{t('installation_guide.html_subtitle')}</p>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <p className="text-sm">
                                                Pega el siguiente código justo antes de cerrar la etiqueta <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded font-mono text-red-500">&lt;/body&gt;</code>:
                                            </p>

                                            <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden shadow-lg">
                                                <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800">
                                                    <span className="text-[10px] uppercase font-mono text-slate-500">HTML</span>
                                                </div>
                                                <div className="p-4 overflow-x-auto">
                                                    <pre className="text-xs font-mono text-slate-300 whitespace-pre-wrap break-all">
                                                        {scriptCode}
                                                    </pre>
                                                </div>
                                                <div className="px-4 py-2 bg-slate-900 border-t border-slate-800 flex justify-end">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 text-xs text-slate-400 hover:text-white hover:bg-slate-800"
                                                        onClick={handleCopyCode}
                                                    >
                                                        {copiedCode ? <Check className="w-3 h-3 mr-1" /> : <Copy className="w-3 h-3 mr-1" />}
                                                        {copiedCode ? "Copiado" : "Copiar código"}
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </TabsContent>

                                </div>
                            </Tabs>
                        )}
                    </CardContent>
                </Card>

                {/* Support Section */}
                <div className="text-center">
                    <h3 className="font-semibold text-lg">{t('installation_guide.still_problems')}</h3>
                    <p className="text-muted-foreground text-sm mb-4">{t('installation_guide.support_help')}</p>
                    <Button variant="outline" className="gap-2" asChild>
                        <a href="https://wa.me/51924464410" target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="w-4 h-4" />
                            {t('installation_guide.contact_support')}
                        </a>
                    </Button>
                </div>

            </div>
        </div>
    );
}
