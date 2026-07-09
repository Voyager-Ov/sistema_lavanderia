import * as React from "react"

import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/shared/lib/utils"

const cardVariants = cva(
  "flex flex-col gap-6 rounded-[2rem] border py-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-colors duration-300",
  {
    variants: {
      variant: {
        default: "bg-white border-gray-100",
        glassRed: "bg-red-50/50 backdrop-blur-xl border-red-100/50 shadow-[0_8px_30px_rgba(239,68,68,0.08)]",
        glassBlue: "bg-blue-50/50 backdrop-blur-xl border-blue-100/50 shadow-[0_8px_30px_rgba(59,130,246,0.08)]",
        glassYellow: "bg-amber-50/50 backdrop-blur-xl border-amber-100/50 shadow-[0_8px_30px_rgba(245,158,11,0.08)]",
        glassGreen: "bg-emerald-50/50 backdrop-blur-xl border-emerald-100/50 shadow-[0_8px_30px_rgba(16,185,129,0.08)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, ...props }, ref) => {
    return (
      <div
        ref={ref}
        data-slot="card"
        className={cn(cardVariants({ variant }), className)}
        {...props}
      />
    )
  }
)
Card.displayName = "Card"

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "flex flex-col gap-1.5 px-8",
        className
      )}
      {...props}
    />
  )
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn("text-xl font-bold tracking-tight text-gray-900", className)}
      {...props}
    />
  )
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-gray-500 text-sm", className)}
      {...props}
    />
  )
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn("px-8", className)}
      {...props}
    />
  )
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn("flex items-center px-8 pt-6 border-t border-gray-100", className)}
      {...props}
    />
  )
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
}
