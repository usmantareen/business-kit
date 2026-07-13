"use client"

import { useState } from "react"
import { useSettingsStore } from "@/src/lib/stores/settings-store"
import { ThemeToggle } from "@/src/components/shared/theme-toggle"
import { OnboardingWizard } from "@/src/components/shared/onboarding-wizard"
import { Sparkles } from "lucide-react"

export function Topbar() {
  const settings = useSettingsStore((s) => s.settings)
  const loaded = useSettingsStore((s) => s.loaded)
  const [wizardOpen, setWizardOpen] = useState(false)

  const showSetupCta = loaded && settings && !settings.onboardingComplete

  return (
    <>
      <header className="flex h-14 items-center justify-between gap-4 border-b bg-background px-6">
        <div className="flex flex-1 items-center gap-2">
          {showSetupCta && (
            <button
              onClick={() => setWizardOpen(true)}
              className="group relative inline-flex items-center gap-1.5 overflow-hidden rounded-full border border-primary/30 bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 px-3.5 py-1.5 text-xs font-medium text-primary transition-all duration-300 hover:from-primary/20 hover:via-primary/10 hover:to-primary/20 hover:border-primary/50 hover:shadow-[0_0_24px_-4px_var(--primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              aria-label="Setup the system"
            >
              <span
                className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-primary/30 to-transparent transition-transform duration-700 group-hover:translate-x-full"
                aria-hidden
              />
              <Sparkles className="h-3.5 w-3.5 animate-pulse" />
              <span>Setup The System</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
        </div>
      </header>

      {wizardOpen && <OnboardingWizard onClose={() => setWizardOpen(false)} />}
    </>
  )
}
