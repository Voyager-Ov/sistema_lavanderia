"use client"

import * as React from "react"
import { Calculator, Calendar, CreditCard, Settings, Smile, User, Search, X } from "lucide-react"
import gsap from "gsap"
import { useGSAP } from "@gsap/react"

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/shared/ui/overlays/command"
import { Popover, PopoverContent, PopoverAnchor } from "@/shared/ui/overlays/popover"
import { cn } from "@/shared/lib/utils"

export interface SearchDropdownProps {
  placeholder?: string
  className?: string
}

export function GlobalSearch({ placeholder = "Buscar clientes, productos...", className }: SearchDropdownProps) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState("")
  
  const inputRef = React.useRef<HTMLInputElement>(null)
  const containerRef = React.useRef<HTMLDivElement>(null)
  const popoverRef = React.useRef<HTMLDivElement>(null)

  gsap.registerPlugin(useGSAP)

  // Animación del input al hacer focus
  const { contextSafe } = useGSAP({ scope: containerRef })

  const handleFocus = contextSafe(() => {
    setOpen(true)
    gsap.to(inputRef.current, {
      scale: 1.02,
      boxShadow: "0 10px 25px -5px rgba(66, 133, 244, 0.15), 0 8px 10px -6px rgba(66, 133, 244, 0.1)",
      duration: 0.4,
      ease: "back.out(1.5)"
    })
  })

  const handleBlur = contextSafe(() => {
    gsap.to(inputRef.current, {
      scale: 1,
      boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
      duration: 0.3,
      ease: "power2.out"
    })
  })

  // Animación de los items del menú cuando se abre
  useGSAP(() => {
    if (open) {
      gsap.from(".gsap-item", {
        opacity: 0,
        x: -20,
        stagger: 0.05,
        ease: "power3.out",
        duration: 0.4,
        delay: 0.05 // Esperar a que el popover termine de abrir
      })
    }
  }, { dependencies: [open], scope: popoverRef })

  // Atajo de teclado (Cmd/Ctrl + K)
  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  return (
    <Command className={cn("overflow-visible bg-transparent", className)} ref={containerRef}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverAnchor asChild>
          <div className="relative w-full">
            <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-gray-400 z-10" />
            <CommandInput 
              ref={inputRef}
              placeholder={placeholder}
              value={search}
              onValueChange={setSearch}
              onFocus={handleFocus}
              onBlur={handleBlur}
              className="pl-10 pr-10 h-11 w-full rounded-full !bg-gray-100 border-2 border-transparent hover:!bg-gray-200/80 focus:!bg-white focus:border-brand-blue/50 focus:ring-4 focus:ring-brand-blue/10 shadow-none transition-all text-sm font-medium outline-none !text-gray-900 placeholder:!text-gray-500"
            />
            
            {search.length > 0 ? (
              <button 
                onClick={(e) => {
                  e.preventDefault()
                  setSearch("")
                  inputRef.current?.focus()
                }}
                className="absolute right-2.5 top-2.5 p-1 rounded-full bg-gray-200 text-gray-600 hover:bg-gray-300 z-10 transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            ) : (
              <kbd className="pointer-events-none absolute right-2.5 top-2.5 hidden h-5 select-none items-center gap-1 rounded border bg-white/50 px-1.5 font-mono text-[10px] font-medium text-gray-400 sm:flex z-10">
                <span className="text-xs">⌘</span>K
              </kbd>
            )}
          </div>
        </PopoverAnchor>
        
        <PopoverContent 
          ref={popoverRef}
          className="w-[var(--radix-popover-trigger-width)] p-0 shadow-2xl border-gray-100 rounded-xl overflow-hidden"
          align="start"
          sideOffset={8}
          onOpenAutoFocus={(e) => e.preventDefault()} 
        >
          <CommandList className="max-h-[300px] overflow-y-auto p-2 bg-white/80 backdrop-blur-xl">
            <CommandEmpty className="py-6 text-center text-sm text-gray-500">
              No se encontraron resultados para "{search}".
            </CommandEmpty>
            
            <CommandGroup heading="Sugerencias rápidas" className="text-gray-500">
              <CommandItem onSelect={() => setOpen(false)} className="gsap-item rounded-lg cursor-pointer my-0.5 data-[selected=true]:bg-brand-blue/10 data-[selected=true]:text-brand-blue">
                <User className="mr-2 h-4 w-4" />
                <span className="font-medium">Cliente: Juan Pérez</span>
              </CommandItem>
              <CommandItem onSelect={() => setOpen(false)} className="gsap-item rounded-lg cursor-pointer my-0.5 data-[selected=true]:bg-brand-green/10 data-[selected=true]:text-brand-green">
                <Calendar className="mr-2 h-4 w-4" />
                <span className="font-medium">Turno: Hoy 14:00</span>
              </CommandItem>
              <CommandItem onSelect={() => setOpen(false)} className="gsap-item rounded-lg cursor-pointer my-0.5 data-[selected=true]:bg-brand-yellow/10 data-[selected=true]:text-brand-yellow">
                <Smile className="mr-2 h-4 w-4" />
                <span className="font-medium">Ver todos los clientes</span>
              </CommandItem>
            </CommandGroup>
            
            <CommandSeparator className="my-1 bg-gray-100" />
            
            <CommandGroup heading="Configuración" className="text-gray-500">
              <CommandItem onSelect={() => setOpen(false)} className="gsap-item rounded-lg cursor-pointer my-0.5 data-[selected=true]:bg-gray-100">
                <CreditCard className="mr-2 h-4 w-4" />
                <span className="font-medium">Facturación</span>
              </CommandItem>
              <CommandItem onSelect={() => setOpen(false)} className="gsap-item rounded-lg cursor-pointer my-0.5 data-[selected=true]:bg-gray-100">
                <Settings className="mr-2 h-4 w-4" />
                <span className="font-medium">Ajustes del sistema</span>
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </PopoverContent>
      </Popover>
    </Command>
  )
}
