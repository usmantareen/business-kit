import { cn } from "@/src/lib/utils"
import { Button } from "@/src/components/ui/button"
import Link from "next/link"
import { type LucideIcon } from "lucide-react"

interface PageAction {
  label: string
  href?: string
  onClick?: () => void
  icon?: LucideIcon
  variant?: "default" | "secondary" | "outline" | "ghost" | "destructive"
}

interface PageHeaderProps {
  title: string
  description?: string
  actions?: PageAction[]
  className?: string
}

export function PageHeader({ title, description, actions, className }: PageHeaderProps) {
  return (
    <div className={cn("flex items-center justify-between", className)}>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && actions.length > 0 && (
        <div className="flex items-center gap-2">
          {actions.map((action, i) => {
            const Icon = action.icon
            return action.href ? (
              <Button key={i} asChild variant={action.variant || "default"}>
                <Link href={action.href}>
                  {Icon && <Icon className="mr-1 h-4 w-4" />} {action.label}
                </Link>
              </Button>
            ) : (
              <Button key={i} variant={action.variant || "default"} onClick={action.onClick}>
                {Icon && <Icon className="mr-1 h-4 w-4" />} {action.label}
              </Button>
            )
          })}
        </div>
      )}
    </div>
  )
}
