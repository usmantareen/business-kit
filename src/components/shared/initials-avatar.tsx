import { cn } from "@/src/lib/utils"

interface InitialsAvatarProps {
  name?: string
  className?: string
  size?: "sm" | "md" | "lg"
}

const sizeMap = {
  sm: "h-7 w-7 text-[10px]",
  md: "h-9 w-9 text-xs",
  lg: "h-12 w-12 text-sm",
}

function hashString(str: string): number {
  let h = 0
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i)
    h |= 0
  }
  return Math.abs(h)
}

const shades = [
  "bg-foreground text-background",
  "bg-foreground/90 text-background",
  "bg-foreground/80 text-background",
  "bg-foreground/70 text-background",
  "bg-foreground/60 text-background",
]

export function InitialsAvatar({ name, className, size = "md" }: InitialsAvatarProps) {
  const initials = (name || "?")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("") || "?"

  const shade = shades[hashString(name || "?") % shades.length]

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full font-semibold ring-1 ring-inset ring-foreground/10",
        shade,
        sizeMap[size],
        className
      )}
      aria-hidden
    >
      {initials}
    </div>
  )
}
