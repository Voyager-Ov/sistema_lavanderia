"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-white/70 group-[.toaster]:backdrop-blur-2xl group-[.toaster]:text-gray-900 group-[.toaster]:border group-[.toaster]:border-white/40 group-[.toaster]:shadow-[0_8px_40px_-12px_rgba(0,0,0,0.15)] group-[.toaster]:rounded-2xl group-[.toaster]:p-4 group-[.toaster]:font-medium group-[.toaster]:tracking-tight transition-all duration-300",
          description: "group-[.toast]:text-gray-500 group-[.toast]:font-normal",
          actionButton:
            "group-[.toast]:bg-black group-[.toast]:text-white group-[.toast]:rounded-xl group-[.toast]:px-4 group-[.toast]:py-2 group-[.toast]:font-semibold group-[.toast]:shadow-sm hover:group-[.toast]:scale-[1.02] transition-transform",
          cancelButton:
            "group-[.toast]:bg-gray-100/50 group-[.toast]:text-gray-600 group-[.toast]:rounded-xl group-[.toast]:px-4 group-[.toast]:py-2 hover:group-[.toast]:bg-gray-200/50 transition-colors",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
