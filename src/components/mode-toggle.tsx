import { Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTheme } from "@/components/theme-provider"

export function ModeToggle() {
    const { theme, setTheme } = useTheme()

    const isDark = theme === "dark"

    return (
        <Button
            variant="outline"
            size="sm"
            onClick={() => setTheme(isDark ? "light" : "dark")}
            className="rounded-full border-primary/20 bg-background/80 backdrop-blur hover:bg-muted transition-all px-4 gap-2 min-w-[140px] justify-between shadow-sm group"
        >
            <div className="flex items-center gap-2">
                {/* Icon Container */}
                <div className="relative w-4 h-4 text-primary group-hover:text-foreground transition-colors">
                    <Sun className="absolute w-4 h-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                    <Moon className="absolute w-4 h-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                </div>
                <span className="text-xs font-semibold">
                    {isDark ? "Modo Claro" : "Modo Oscuro"}
                </span>
            </div>
        </Button>
    )
}
