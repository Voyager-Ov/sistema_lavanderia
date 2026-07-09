import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/shared/lib/utils"

const alertVariants = cva(
  "relative w-full rounded-2xl border p-5 [&>svg~*]:pl-8 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-5 [&>svg]:top-5 [&>svg]:text-foreground transition-all duration-300",
  {
    variants: {
      variant: {
        default: "bg-white/80 backdrop-blur-md border-gray-100 text-gray-900 shadow-sm",
        destructive:
          "bg-red-50/50 backdrop-blur-md border-red-100/50 text-red-900 shadow-[0_4px_20px_-10px_rgba(239,68,68,0.2)] [&>svg]:text-red-600",
        success: 
          "bg-emerald-50/50 backdrop-blur-md border-emerald-100/50 text-emerald-900 shadow-[0_4px_20px_-10px_rgba(16,185,129,0.2)] [&>svg]:text-emerald-600",
        warning:
          "bg-amber-50/50 backdrop-blur-md border-amber-100/50 text-amber-900 shadow-[0_4px_20px_-10px_rgba(245,158,11,0.2)] [&>svg]:text-amber-600"
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const Alert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>
>(({ className, variant, ...props }, ref) => (
  <div
    ref={ref}
    role="alert"
    className={cn(alertVariants({ variant }), className)}
    {...props}
  />
))
Alert.displayName = "Alert"

const AlertTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn("mb-1.5 font-semibold leading-none tracking-tight", className)}
    {...props}
  />
))
AlertTitle.displayName = "AlertTitle"

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm opacity-90 [&_p]:leading-relaxed", className)}
    {...props}
  />
))
AlertDescription.displayName = "AlertDescription"

export { Alert, AlertTitle, AlertDescription }
