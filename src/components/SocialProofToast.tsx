import { useState, useEffect } from "react"
import { ShieldCheck, Check } from "lucide-react"
import { cn } from "@/lib/utils"

const NOTIFICATIONS = [
    { name: "Luis G.", city: "Cusco", action: "verificó su identidad", time: "Hace 1 min" },
    { name: "María R.", city: "Lima", action: "activó su widget", time: "Hace 2 min" },
    { name: "Carlos P.", city: "Arequipa", action: "recibió 3 leads", time: "Hace 5 min" },
    { name: "Ana Torres", city: "Trujillo", action: "comenzó prueba gratis", time: "Hace 30 seg" },
    { name: "Jorge M.", city: "Piura", action: "conectó su WhatsApp", time: "Hace 10 min" },
]

export function SocialProofToast() {
    const [isVisible, setIsVisible] = useState(false)
    const [currentNotification, setCurrentNotification] = useState(0)

    useEffect(() => {
        // Start delay
        const initialTimer = setTimeout(() => setIsVisible(true), 3000)

        // Cycle notifications
        const interval = setInterval(() => {
            setIsVisible(false) // Hide

            setTimeout(() => {
                // Change content and show
                setCurrentNotification(prev => (prev + 1) % NOTIFICATIONS.length)
                setIsVisible(true)
            }, 500) // Wait for fade out

        }, 12000) // Every 12 seconds (slower)

        return () => {
            clearTimeout(initialTimer)
            clearInterval(interval)
        }
    }, [])

    const data = NOTIFICATIONS[currentNotification]

    return (
        <div
            className={cn(
                // Hidden on mobile, visible only on desktop (sm and up)
                "hidden sm:block fixed left-4 z-40 transition-all duration-700 transform",
                // Desktop: Bottom-Left position
                "bottom-4",
                isVisible
                    ? "translate-x-0 opacity-100 scale-100"
                    : "-translate-x-12 opacity-0 scale-90"
            )}
        >
            <div className="bg-white/90 dark:bg-slate-950/90 backdrop-blur-lg border border-primary/20 text-slate-900 dark:text-slate-100 pr-6 p-3 rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.3)] flex items-center gap-4 min-w-[280px] max-w-sm">

                {/* Icon Badge */}
                <div className="relative">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                        <ShieldCheck className="w-6 h-6 text-primary" />
                    </div>
                    <div className="absolute -top-1 -left-1 flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1">
                    <div className="flex items-center justify-between mb-0.5">
                        <p className="text-[10px] uppercase tracking-widest text-primary font-black">Actividad en vivo</p>
                        <p className="text-[9px] text-muted-foreground font-medium">{data.time}</p>
                    </div>
                    <p className="text-sm font-medium leading-tight">
                        <span className="font-bold text-foreground">{data.name}</span> <span className="opacity-60 text-xs">de {data.city}</span>
                    </p>
                    <p className="text-sm font-extrabold text-foreground/80 mt-1 flex items-center gap-1">
                        {data.action} <Check className="w-3 h-3 text-primary stroke-[4]" />
                    </p>
                </div>
            </div>
        </div>
    )
}

