import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Gift, Copy, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils'; // Assuming you have utility for class merging or just use logic

interface AffiliateCardProps {
    dismissible?: boolean;
    className?: string;
}

export function AffiliateCard({ dismissible = false, className }: AffiliateCardProps) {
    const { user } = useAuth();
    const { toast } = useToast();
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        if (dismissible) {
            const isHidden = localStorage.getItem('hide_affiliate_card');
            if (isHidden) setIsVisible(false);
        }
    }, [dismissible]);

    if (!isVisible && dismissible) return null;

    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://whatsapp-leads-peru.vercel.app';
    const referralLink = `${origin}/crear-ahora?ref=${user?.uid}`;

    return (
        <Card className={`bg-gradient-to-br from-emerald-600 to-teal-700 border-0 text-white overflow-hidden relative mb-6 ${className || ''}`}>
            {dismissible && (
                <button
                    onClick={() => {
                        localStorage.setItem('hide_affiliate_card', 'true');
                        setIsVisible(false);
                    }}
                    className="absolute top-2 right-2 p-1 rounded-full bg-black/10 hover:bg-black/20 text-white/70 hover:text-white transition-colors"
                >
                    <X className="w-4 h-4" />
                </button>
            )}
            <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row gap-4 sm:gap-5 items-center sm:items-start text-center sm:text-left">

                    <div className="p-3 sm:p-4 bg-white/10 rounded-2xl shrink-0 text-emerald-100">
                        <Gift className="w-6 h-6 sm:w-8 sm:h-8" />
                    </div>

                    <div className="space-y-3 flex-1 w-full min-w-0">
                        <div>
                            <h3 className="font-bold text-lg sm:text-xl text-white">
                                🎁 ¡Gana Meses Gratis!
                            </h3>
                            <p className="text-sm text-emerald-50 mt-1">
                                Por cada negocio que use tu enlace para crear su propio chat, te regalamos 1 mes gratis (o 20% de comisión).
                            </p>
                        </div>

                        <div className="w-full bg-black/20 rounded-xl p-2 flex flex-col sm:flex-row gap-2 max-w-full">
                            <input
                                readOnly
                                value={referralLink}
                                className="w-full min-w-0 rounded-lg border border-white/5 bg-black/10 sm:bg-transparent px-3 py-2 text-[10px] sm:text-xs font-mono text-white placeholder-white/50 focus:outline-none focus:ring-1 focus:ring-white/20"
                                onClick={(e) => e.currentTarget.select()}
                            />
                            <Button
                                size="sm"
                                variant="secondary"
                                className="h-9 sm:h-auto w-full sm:w-auto bg-white/10 hover:bg-white/20 text-white border-0 shrink-0"
                                onClick={() => {
                                    navigator.clipboard.writeText(referralLink);
                                    toast({
                                        title: '¡Enlace Copiado!',
                                        description: 'Compártelo con tus amigos dueños de negocio.',
                                    });
                                }}
                            >
                                <Copy className="w-4 h-4 mr-2 sm:mr-1" />
                                <span className="text-xs font-bold">COPIAR</span>
                            </Button>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
