"use client"

import { Sidebar } from "@/src/components/layout/sidebar"
import { Topbar } from "@/src/components/layout/topbar"
import { CommandPalette } from "@/src/components/shared/command-palette"
import { useEffect } from "react"
import { useTheme } from "next-themes"
import { useSettingsStore } from "@/src/lib/stores/settings-store"

export function AppShell({ children }: { children: React.ReactNode }) {
  const { settings, loaded, load } = useSettingsStore()
  const { theme, setTheme } = useTheme()

  useEffect(() => {
    if (!loaded) {
      load()
    }
  }, [loaded, load])

  useEffect(() => {
    if (loaded && settings?.theme && theme !== settings.theme) {
      setTheme(settings.theme)
    }
  }, [loaded, settings?.theme, theme, setTheme])

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
      <CommandPalette />
    </div>
  )
}
