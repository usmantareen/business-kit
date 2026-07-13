"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/src/lib/utils"
import {
  LayoutDashboard, FileText, Users, Package, BarChart3, Settings,
  PanelLeftClose, PanelLeft, Plus,
} from "lucide-react"
import { useState, useEffect } from "react"
import { Button } from "@/src/components/ui/button"
import { Separator } from "@/src/components/ui/separator"

const navGroups = [
  {
    label: "Workspace",
    items: [
      { href: "/", label: "Dashboard", icon: LayoutDashboard },
      { href: "/documents", label: "Documents", icon: FileText },
    ],
  },
  {
    label: "Data",
    items: [
      { href: "/customers", label: "Customers", icon: Users },
      { href: "/products", label: "Products", icon: Package },
    ],
  },
  {
    label: "Insights",
    items: [
      { href: "/analytics", label: "Analytics", icon: BarChart3 },
    ],
  },
  {
    label: "System",
    items: [
      { href: "/settings", label: "Settings", icon: Settings },
    ],
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("sidebar-collapsed") === "true"
    }
    return false
  })

  const toggleCollapsed = () => {
    const next = !collapsed
    setCollapsed(next)
    localStorage.setItem("sidebar-collapsed", String(next))
  }

  return (
    <aside
      className={cn(
        "flex flex-col border-r bg-background transition-all duration-200",
        collapsed ? "w-16" : "w-56"
      )}
    >
      <div className={cn("flex h-14 items-center border-b px-4", collapsed && "justify-center px-2")}>
        <Link href="/" className={cn("flex items-center gap-2", collapsed && "justify-center")}>
          <div className="flex h-7 w-7 items-center justify-center rounded-lg border bg-primary text-[10px] font-bold text-primary-foreground">
            BK
          </div>
          {!collapsed && <span className="text-base font-semibold tracking-tight">Business Kit</span>}
        </Link>
        <Button
          variant="ghost"
          size="icon"
          className={cn("h-7 w-7", collapsed ? "ml-0" : "ml-auto")}
          onClick={toggleCollapsed}
        >
          {collapsed ? <PanelLeft className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
        </Button>
      </div>

      {!collapsed && (
        <div className="p-2 pt-3">
          <Button asChild className="w-full justify-start gap-2 h-9 text-sm">
            <Link href="/documents/new">
              <Plus className="h-4 w-4" /> New Document
            </Link>
          </Button>
        </div>
      )}

      <nav className="flex-1 space-y-4 p-2 pt-3 overflow-y-auto">
        {navGroups.map((group) => (
          <div key={group.label}>
            {!collapsed && (
              <p className="px-3 pb-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/60">
                {group.label}
              </p>
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon
                const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                      active ? "bg-accent text-accent-foreground" : "text-muted-foreground",
                      collapsed && "justify-center px-2"
                    )}
                    title={collapsed ? item.label : undefined}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {!collapsed && <span>{item.label}</span>}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      <Separator />
      <div className="p-2">
        {!collapsed && (
          <div className="px-3 space-y-0.5">
            <p className="text-xs font-medium text-foreground">
              Business Kit v0.1
            </p>
            <p className="text-[11px] text-muted-foreground">
              Open Source Project By Usman Tareen
            </p>
          </div>
        )}
      </div>
    </aside>
  )
}
