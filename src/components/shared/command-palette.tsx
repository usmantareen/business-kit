"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  CommandDialog, CommandInput, CommandList, CommandEmpty,
  CommandGroup, CommandItem,
} from "@/src/components/ui/command"
import { FileText, Users, Package, BarChart3, Settings, LayoutDashboard, Plus } from "lucide-react"
import { DOCUMENT_TYPES, DocTypeLabel } from "@/src/types"

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((o) => !o)
      }
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  const runCommand = (cmd: () => void) => {
    setOpen(false)
    cmd()
  }

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Search pages, create documents..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Pages">
          <CommandItem onSelect={() => runCommand(() => router.push("/"))}>
            <LayoutDashboard className="mr-2 h-4 w-4" /> Dashboard
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/documents"))}>
            <FileText className="mr-2 h-4 w-4" /> Documents
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/customers"))}>
            <Users className="mr-2 h-4 w-4" /> Customers
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/products"))}>
            <Package className="mr-2 h-4 w-4" /> Products
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/analytics"))}>
            <BarChart3 className="mr-2 h-4 w-4" /> Analytics
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/settings"))}>
            <Settings className="mr-2 h-4 w-4" /> Settings
          </CommandItem>
        </CommandGroup>
        <CommandGroup heading="New Document">
          {DOCUMENT_TYPES.map((type) => (
            <CommandItem key={type} onSelect={() => runCommand(() => router.push(`/documents/new/${type}`))}>
              <Plus className="mr-2 h-4 w-4" /> {DocTypeLabel[type]}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}
