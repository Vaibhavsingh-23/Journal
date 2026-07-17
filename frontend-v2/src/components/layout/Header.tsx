import { useTheme } from "../../app/providers"
import { Moon, Sun } from "lucide-react"

export function Header() {
  const { theme, setTheme } = useTheme()

  return (
    <header className="h-16 flex items-center justify-between px-6 border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-10">
      <div className="flex-1" />
      <div className="flex items-center space-x-4">
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="p-2 text-secondary-foreground hover:text-foreground transition-colors rounded-full hover:bg-secondary/50"
          aria-label="Toggle theme"
        >
          {theme === "dark" ? <Sun className="w-4 h-4 stroke-[1.5]" /> : <Moon className="w-4 h-4 stroke-[1.5]" />}
        </button>
      </div>
    </header>
  )
}
