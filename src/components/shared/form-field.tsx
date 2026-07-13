import React from "react"
import { cn } from "@/src/lib/utils"

interface FormFieldProps {
  label: string
  htmlFor?: string
  children: React.ReactNode
  className?: string
  helper?: string
  icon?: React.ReactNode
  required?: boolean
}

export function FormField({
  label,
  htmlFor,
  children,
  className,
  helper,
  icon,
  required,
}: FormFieldProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label
        htmlFor={htmlFor}
        className="flex items-center gap-1.5 text-sm font-semibold text-foreground"
      >
        {icon && <span className="text-muted-foreground">{icon}</span>}
        {label}
        {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {helper && (
        <p className="text-xs text-muted-foreground">{helper}</p>
      )}
    </div>
  )
}
