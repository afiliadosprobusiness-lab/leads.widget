import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { MessageCircle, CheckCircle, Zap, ArrowRight } from 'lucide-react';

export default function CreateNow() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [currency, setCurrency] = useState<'PEN' | 'USD'>('PEN');

    useEffect(() => {
        const ref = searchParams.get('ref');
        if (ref) {
            localStorage.setItem('leadwidget_ref', ref);
        }

        // Simple currency detection
        const isForeign = navigator.language?.startsWith('en') || navigator.language?.includes('US');
        setCurrency(isForeign ? 'USD' : 'PEN');
    }, [searchParams]);

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 text-white flex flex-col">
            <nav className="p-6 flex justify-between items-center max-w-6xl mx-auto w-full">
                <div className="flex items-center gap-2 font-bold text-xl">
                    <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
                        <MessageCircle className="w-5 h-5 text-white" />
                    </div>
                    LeadWidget
                </div>
                <Button variant="ghost" className="text-slate-300 hover:text-white" onClick={() => navigate('/login')}>
                    Ingresar
                </Button>
            </nav>

            <main className="flex-1 container mx-auto px-4 py-8 flex items-center justify-center">
                <div className="max-w-2xl space-y-8 text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">
                        <Zap className="w-4 h-4" />
                        Instalación en 2 minutos
                    </div>

                    <h1 className="text-4xl sm:text-6xl font-extrabold leading-tight">
                        ¿Te gustó la <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">velocidad</span> del chat?
                    </h1>

                    <p className="text-xl text-slate-400 max-w-lg mx-auto">
                        Instala este mismo sistema de IA en tu negocio. Atiende 24/7, captura datos y vende más.
                    </p>

                    <div className="space-y-4">
                        <div className="flex items-center gap-3 text-slate-300 justify-center">
                            <CheckCircle className="w-5 h-5 text-emerald-400" />
                            <span>IA entrenada para tu negocio</span>
                        </div>
                        <div className="flex items-center gap-3 text-slate-300 justify-center">
                            <CheckCircle className="w-5 h-5 text-emerald-400" />
                            <span>Funciona en cualquier web</span>
                        </div>
                        <div className="flex items-center gap-3 text-slate-300 justify-center">
                            <CheckCircle className="w-5 h-5 text-emerald-400" />
                            <span>Precio: <b>{currency === 'USD' ? '$15 USD' : 'S/ 30'} al mes</b></span>
                        </div>
                    </div>

                    <div className="pt-4">
                        <Button
                            size="lg"
                            className="bg-emerald-500 hover:bg-emerald-400 text-black font-bold h-14 px-8 text-lg"
                            onClick={() => window.location.href = '/register'}
                        >
                            Crear mi Widget Ahora
                            <ArrowRight className="ml-2 w-5 h-5" />
                        </Button>
                        <p className="text-xs text-slate-500 mt-4">
                            ✅ Prueba gratis 3 días • Sin tarjeta de crédito
                        </p>
                    </div>
                </div>
            </main>

            <footer className="py-6 text-center text-slate-600 text-sm">
                © 2024 LeadWidget
            </footer>
        </div>
    );
}
