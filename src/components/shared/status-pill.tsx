import { cn } from "@/src/lib/utils"

interface StatusPillProps {
  status: string
  label?: string
  className?: string
}

export function StatusPill({ status, label, className }: StatusPillProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-2 py-0.5 text-[11px] font-medium text-foreground/80",
        className
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-foreground/70" />
      {label || status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  )
}
