import { Loader2 } from "lucide-react"
import { cn } from "@/shared/lib/utils"

interface SpinnerProps extends React.ComponentProps<typeof Loader2> {
  size?: "sm" | "default" | "lg" | "xl"
}

export function Spinner({ className, size = "default", ...props }: SpinnerProps) {
  const sizeClasses = {
    sm: "h-3 w-3",
    default: "h-4 w-4",
    lg: "h-6 w-6",
    xl: "h-8 w-8",
  }

  return (
    <Loader2
      className={cn("animate-spin text-muted-foreground", sizeClasses[size], className)}
      {...props}
    />
  )
}
