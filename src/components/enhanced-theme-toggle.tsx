"use client"

import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { Moon, Sun, SunMoon } from "lucide-react"
import { useEffect, useState } from "react"

export function EnhancedThemeToggle() {
    const { theme, setTheme } = useTheme()
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    // This avoids hydration mismatch - the title is only set client-side after mounting
    const titleText = mounted ? (theme === "dark" ? "Switch to light mode" : "Switch to dark mode") : "Toggle theme"

    if (!mounted) {
        return (
            <Button
                variant="outline"
                size="icon"
                className="relative bg-[var(--surface)] shadow-sm hover:shadow-md border-[var(--border)] rounded-full w-10 h-10 transition-all duration-300"
                aria-label="Loading theme toggle"
                disabled
            >
                <SunMoon className="w-5 h-5 text-[var(--text-secondary)] animate-pulse" />
            </Button>
        )
    } return (
        <Button
            variant="outline"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            title={titleText}
            className="relative bg-[var(--surface)] shadow-sm hover:shadow-md border-[var(--border)] rounded-full focus-visible:ring-[var(--primary)] focus-visible:ring-2 w-10 h-10 overflow-hidden transition-all duration-300"
            aria-label="Toggle theme"
        >
            <div className="absolute inset-0 bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)] opacity-0 dark:opacity-10 transition-opacity duration-300"></div>

            <Sun className="absolute w-5 h-5 text-[var(--primary)] rotate-0 dark:rotate-90 scale-100 dark:scale-0 transition-all duration-300" />
            <Moon className="absolute w-5 h-5 text-[var(--primary)] rotate-90 dark:rotate-0 scale-0 dark:scale-100 transition-all duration-300" />

            <span className="sr-only">Toggle theme</span>
            {mounted && (
                <span className="sr-only">{theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}</span>
            )}
        </Button>
    )
}