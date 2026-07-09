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
            "group toast group-[.toaster]:bg-white/80 group-[.toaster]:backdrop-blur-xl group-[.toaster]:text-gray-900 group-[.toaster]:border-gray-100 group-[.toaster]:shadow-[0_8px_30px_rgb(0,0,0,0.08)] group-[.toaster]:rounded-2xl group-[.toaster]:p-5",
          description: "group-[.toast]:text-gray-500",
          actionButton:
            "group-[.toast]:bg-black group-[.toast]:text-white group-[.toast]:rounded-xl group-[.toast]:px-4 group-[.toast]:py-2",
          cancelButton:
            "group-[.toast]:bg-gray-100 group-[.toast]:text-gray-600 group-[.toast]:rounded-xl group-[.toast]:px-4 group-[.toast]:py-2",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
