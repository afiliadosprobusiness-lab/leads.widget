
import { useEffect, useRef, useState } from 'react';

interface WidgetTriggerConfig {
    timeDelay?: number; // Tiempo en ms antes de abrirse automáticamente
    scrollThreshold?: number; // Porcentaje de scroll (0-100)
    enableExitIntent?: boolean; // Detectar intención de salida (mouse fuera del viewport superior)
    inactivityTime?: number; // Tiempo de inactividad de mouse en ms
}

export function useWidgetTriggers(
    isOpen: boolean,
    setIsOpen: (open: boolean) => void,
    config: WidgetTriggerConfig = {}
) {
    const [hasTriggered, setHasTriggered] = useState(false);
    const triggerRef = useRef(false); // Ref para evitar re-triggers en el mismo render cycle

    // Handler para activar el widget
    const trigger = () => {
        if (!isOpen && !triggerRef.current) {
            triggerRef.current = true;
            setHasTriggered(true);
            setIsOpen(true);
            // Reproducir sonido de notificación sutil si se desea (opcional)
        }
    };

    useEffect(() => {
        // 1. Time Delay
        let timeoutId: NodeJS.Timeout;
        if (config.timeDelay && !hasTriggered) {
            timeoutId = setTimeout(() => {
                trigger();
            }, config.timeDelay);
        }

        // 2. Scroll Trigger
        const handleScroll = () => {
            if (config.scrollThreshold && !hasTriggered) {
                const scrolled = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
                if (scrolled >= config.scrollThreshold) {
                    trigger();
                }
            }
        };

        // 3. Exit Intent
        const handleMouseLeave = (e: MouseEvent) => {
            if (config.enableExitIntent && !hasTriggered) {
                if (e.clientY <= 0) {
                    trigger();
                }
            }
        };

        // 4. Inactivity
        let inactivityTimeout: NodeJS.Timeout;
        const resetInactivity = () => {
            if (config.inactivityTime && !hasTriggered) {
                clearTimeout(inactivityTimeout);
                inactivityTimeout = setTimeout(trigger, config.inactivityTime);
            }
        };

        window.addEventListener('scroll', handleScroll);
        if (config.enableExitIntent) {
            document.addEventListener('mouseleave', handleMouseLeave);
        }
        if (config.inactivityTime) {
            window.addEventListener('mousemove', resetInactivity);
            window.addEventListener('keydown', resetInactivity);
            resetInactivity(); // Iniciar timer
        }

        return () => {
            clearTimeout(timeoutId);
            clearTimeout(inactivityTimeout);
            window.removeEventListener('scroll', handleScroll);
            if (config.enableExitIntent) {
                document.removeEventListener('mouseleave', handleMouseLeave);
            }
            if (config.inactivityTime) {
                window.removeEventListener('mousemove', resetInactivity);
                window.removeEventListener('keydown', resetInactivity);
            }
        };
    }, [isOpen, hasTriggered, config]); // Re-run effect si cambia config o estado

    return { hasTriggered };
}
