import { useEffect, useState } from 'react'
import { Sun, Moon } from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Helpers ────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'insighto-theme'

function getSystemPreference(): 'dark' | 'light' {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function applyTheme(theme: 'dark' | 'light') {
  const root = document.documentElement
  if (theme === 'dark') {
    root.classList.add('dark')
  } else {
    root.classList.remove('dark')
  }
  localStorage.setItem(STORAGE_KEY, theme)
}

// ─── Hook ────────────────────────────────────────────────────────────────────

function useTheme() {
  const [theme, setThemeState] = useState<'dark' | 'light'>(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as 'dark' | 'light' | null
    return stored ?? getSystemPreference()
  })

  // Sync html class on mount and whenever theme changes
  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  const toggleTheme = () => {
    setThemeState(prev => (prev === 'dark' ? 'light' : 'dark'))
  }

  return { theme, toggleTheme }
}

// ─── Props ───────────────────────────────────────────────────────────────────

interface ThemeToggleProps {
  /** Additional Tailwind classes for the button */
  className?: string
  /** Accessible label (defaults to 'Toggle theme') */
  label?: string
}

// ─── Component ───────────────────────────────────────────────────────────────

/**
 * `ThemeToggle` – Syncs `.dark` on `<html>` with localStorage.
 * Drop it anywhere in the layout; it is self-contained.
 *
 * @example
 * <ThemeToggle className="ml-auto" />
 */
export function ThemeToggle({ className, label = 'Toggle theme' }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <button
      id="theme-toggle"
      type="button"
      aria-label={label}
      aria-pressed={isDark}
      onClick={toggleTheme}
      className={cn(
        // Layout & shape
        'relative inline-flex h-9 w-9 items-center justify-center rounded-full',
        // Border / outline style matching the outline button variant
        'border border-slate-700 dark:border-slate-600',
        // Background
        'bg-transparent',
        // Text / icon colour
        'text-slate-700 dark:text-slate-300',
        // Hover
        'hover:bg-slate-100 dark:hover:bg-surface-highlight',
        'hover:text-slate-900 dark:hover:text-white',
        // Focus ring
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500',
        'focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-bg-dark',
        // Micro-interaction
        'active:scale-95 transition-all duration-150',
        className
      )}
    >
      {/* Sun icon – shown in dark mode (click → switch to light) */}
      <Sun
        aria-hidden="true"
        className={cn(
          'absolute size-4 transition-all duration-300',
          isDark
            ? 'rotate-0 scale-100 opacity-100'
            : '-rotate-90 scale-0 opacity-0'
        )}
      />

      {/* Moon icon – shown in light mode (click → switch to dark) */}
      <Moon
        aria-hidden="true"
        className={cn(
          'absolute size-4 transition-all duration-300',
          isDark
            ? 'rotate-90 scale-0 opacity-0'
            : 'rotate-0 scale-100 opacity-100'
        )}
      />
    </button>
  )
}
