import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation, Trans } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { SalesWidget } from '@/components/SalesWidget';
import { HandCoins, TrendingUp, Users, ShieldCheck, ArrowRight, MessageCircle, Calculator, Wallet } from 'lucide-react';

export default function AffiliatesLanding() {
    const navigate = useNavigate();
    const { t } = useTranslation();

    // Calculator State
    const [refers, setRefers] = useState(10);
    const [plan, setPlan] = useState<'pro' | 'plus'>('pro');

    // Logic (Simulated for Landing)
    const price = plan === 'pro' ? 30 : 60;
    const commission = 0.20;
    const earnings = (refers * price * commission).toFixed(2);

    return (
        <div className="min-h-screen bg-slate-950 text-white selection:bg-emerald-500/30 font-sans">
            {/* Navigation */}
            <nav className="fixed w-full z-50 bg-slate-950/80 backdrop-blur-md border-b border-white/5">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2 font-bold text-xl cursor-pointer" onClick={() => navigate('/')}>
                        <div className="w-8 h-8 rounded-xl bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                            <MessageCircle className="w-5 h-5" />
                        </div>
                        <span>LeadWidget <span className="text-emerald-400">{t('affiliates_landing.nav_partners')}</span></span>
                    </div>
                    <div className="flex gap-4">
                        <Button variant="ghost" className="text-slate-300 hover:text-white" onClick={() => navigate('/login')}>{t('affiliates_landing.login')}</Button>
                        <Button className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold hidden sm:flex" onClick={() => navigate('/register')}>{t('affiliates_landing.register')}</Button>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="pt-32 pb-20 px-4 relative overflow-hidden">
                {/* Background Effects */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-emerald-500/10 blur-[120px] rounded-full pointer-events-none" />

                <div className="container mx-auto max-w-5xl text-center space-y-8 relative z-10 transition-all animate-in fade-in slide-in-from-bottom-8 duration-700">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium">
                        <TrendingUp className="w-4 h-4" />
                        {t('affiliates_landing.hero_badge')}
                    </div>

                    <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-tight">
                        <span className="text-white">{t('affiliates_landing.hero_title_1')}</span><br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400">{t('affiliates_landing.hero_title_2')}</span>
                    </h1>

                    <p className="text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
                        <Trans i18nKey="affiliates_landing.hero_subtitle" components={[<strong className="text-white" />]} />
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                        <Button onClick={() => document.getElementById('calculator')?.scrollIntoView({ behavior: 'smooth' })} size="lg" className="h-14 px-8 text-lg bg-white text-slate-950 hover:bg-slate-200 font-bold rounded-full w-full sm:w-auto transition-transform hover:scale-105">
                            {t('affiliates_landing.cta_calc')}
                        </Button>
                        <Button onClick={() => navigate('/register')} size="lg" variant="outline" className="h-14 px-8 text-lg border-white/10 hover:bg-white/5 text-white rounded-full w-full sm:w-auto font-medium transition-transform hover:scale-105">
                            {t('affiliates_landing.cta_register')}
                        </Button>
                    </div>
                </div>
            </section>

            {/* Calculator Section */}
            <section id="calculator" className="py-24 bg-slate-900/50 border-y border-white/5">
                <div className="container mx-auto px-4">
                    <div className="max-w-4xl mx-auto bg-slate-950 border border-white/10 rounded-3xl p-8 md:p-12 shadow-2xl relative overflow-hidden ring-1 ring-white/5">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 blur-3xl rounded-full" />

                        <div className="grid md:grid-cols-2 gap-12 items-center relative z-10">
                            <div className="space-y-8">
                                <div>
                                    <h3 className="text-2xl font-bold mb-2 flex items-center gap-2">
                                        <Calculator className="w-6 h-6 text-emerald-400" />
                                        {t('affiliates_landing.calculator_title')}
                                    </h3>
                                    <p className="text-slate-400">{t('affiliates_landing.calculator_subtitle')}</p>
                                </div>

                                <div className="space-y-6">
                                    <div className="space-y-3">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-slate-300">{t('affiliates_landing.clients_label')}</span>
                                            <span className="font-bold text-white bg-slate-800 px-2 py-1 rounded">{refers}</span>
                                        </div>
                                        <input
                                            type="range" min="1" max="100" step="1"
                                            value={refers}
                                            onChange={(e) => setRefers(parseInt(e.target.value))}
                                            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                                        />
                                        <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                                            <span>1</span>
                                            <span>50</span>
                                            <span>100+</span>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <span className="text-sm text-slate-300 block">{t('affiliates_landing.plan_label')}</span>
                                        <div className="grid grid-cols-2 gap-2 bg-slate-900 p-1 rounded-xl border border-white/5">
                                            <button
                                                onClick={() => setPlan('pro')}
                                                className={`py-2 px-4 rounded-lg text-sm font-medium transition-all ${plan === 'pro' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/50' : 'text-slate-400 hover:text-white'}`}
                                            >
                                                Plan Pro
                                            </button>
                                            <button
                                                onClick={() => setPlan('plus')}
                                                className={`py-2 px-4 rounded-lg text-sm font-medium transition-all ${plan === 'plus' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/50' : 'text-slate-400 hover:text-white'}`}
                                            >
                                                Plan Plus
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gradient-to-br from-emerald-900/20 to-slate-900/50 rounded-2xl p-8 border border-white/5 text-center space-y-2 backdrop-blur-sm">
                                <div className="inline-block p-3 rounded-full bg-emerald-500/10 mb-2 ring-1 ring-emerald-500/20">
                                    <Wallet className="w-8 h-8 text-emerald-400" />
                                </div>
                                <p className="text-sm font-medium text-emerald-400 uppercase tracking-widest">{t('affiliates_landing.monthly_earnings')}</p>
                                <div className="text-5xl md:text-6xl font-black text-white tracking-tighter tabular-nums my-4">
                                    <span className="text-2xl align-top opacity-50 mr-1">S/</span>{earnings}
                                </div>
                                <p className="text-xs text-slate-500 mt-4 border-t border-white/5 pt-4">{t('affiliates_landing.earnings_note')}</p>

                                <Button onClick={() => navigate('/register')} className="w-full mt-6 bg-white text-slate-950 hover:bg-slate-200 font-bold h-12 shadow-lg shadow-emerald-900/20 transition-transform hover:-translate-y-1">
                                    {t('affiliates_landing.start_earning')}
                                    <ArrowRight className="w-4 h-4 ml-2" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Benefits Grid */}
            <section className="py-24 px-4 bg-slate-950">
                <div className="container mx-auto max-w-6xl">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold mb-4">{t('affiliates_landing.benefits_title')}</h2>
                        <p className="text-slate-400">{t('affiliates_landing.benefits_subtitle')}</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        <div className="p-8 bg-slate-900/30 border border-white/5 rounded-3xl hover:bg-slate-900/50 transition-colors group">
                            <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 border border-white/5">
                                <Users className="w-7 h-7 text-emerald-400" />
                            </div>
                            <h3 className="text-xl font-bold mb-3 text-white">{t('affiliates_landing.benefit_1_title')}</h3>
                            <p className="text-slate-400 leading-relaxed text-sm">{t('affiliates_landing.benefit_1_desc')}</p>
                        </div>
                        <div className="p-8 bg-slate-900/30 border border-white/5 rounded-3xl hover:bg-slate-900/50 transition-colors group">
                            <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 border border-white/5">
                                <HandCoins className="w-7 h-7 text-blue-400" />
                            </div>
                            <h3 className="text-xl font-bold mb-3 text-white">{t('affiliates_landing.benefit_2_title')}</h3>
                            <p className="text-slate-400 leading-relaxed text-sm">{t('affiliates_landing.benefit_2_desc')}</p>
                        </div>
                        <div className="p-8 bg-slate-900/30 border border-white/5 rounded-3xl hover:bg-slate-900/50 transition-colors group">
                            <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 border border-white/5">
                                <ShieldCheck className="w-7 h-7 text-purple-400" />
                            </div>
                            <h3 className="text-xl font-bold mb-3 text-white">{t('affiliates_landing.benefit_3_title')}</h3>
                            <p className="text-slate-400 leading-relaxed text-sm">{t('affiliates_landing.benefit_3_desc')}</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 border-t border-white/5 text-center text-slate-500 text-sm bg-slate-950">
                <p className="flex items-center justify-center gap-2">
                    © {new Date().getFullYear()} LeadWidget Partners.
                    <span className="w-1 h-1 bg-slate-700 rounded-full" />
                    {t('affiliates_landing.footer_rights')}
                </p>
            </footer>

            {/* Sales Widget */}
            <SalesWidget />
        </div>
    );
}
