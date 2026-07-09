"use client"

import React, { useRef, useEffect } from "react"
import gsap from "gsap"

interface LoadingBarsProps {
  collapsed?: boolean
  isLoading?: boolean
}

export function LoadingBars({ collapsed = false, isLoading = false }: LoadingBarsProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  
  const bar1 = useRef<HTMLDivElement>(null)
  const bar2 = useRef<HTMLDivElement>(null)
  const bar3 = useRef<HTMLDivElement>(null)
  const bar4 = useRef<HTMLDivElement>(null)

  const animationRef = useRef<gsap.core.Timeline | null>(null)

  // Efecto para la animación de Carga (Onda senoidal pura)
  useEffect(() => {
    const bars = [bar1.current, bar2.current, bar3.current, bar4.current]
    
    if (animationRef.current) {
      animationRef.current.kill()
      animationRef.current = null
    }

    if (isLoading) {
      animationRef.current = gsap.timeline({ repeat: -1 })
      
      // Animamos el scaleY de cada barra. 
      // Al rotar el contenedor 90 grados, scaleY actuará como scaleX visualmente.
      animationRef.current
        .to(bar1.current, { scaleY: 0.3, duration: 0.4, ease: "sine.inOut", yoyo: true, repeat: 1 }, 0)
        .to(bar2.current, { scaleY: 0.5, duration: 0.4, ease: "sine.inOut", yoyo: true, repeat: 1 }, 0.1)
        .to(bar3.current, { scaleY: 0.2, duration: 0.4, ease: "sine.inOut", yoyo: true, repeat: 1 }, 0.2)
        .to(bar4.current, { scaleY: 0.4, duration: 0.4, ease: "sine.inOut", yoyo: true, repeat: 1 }, 0.3)
    } else {
      gsap.to(bars, { scaleY: 1, duration: 0.4, ease: "power2.out" })
    }

    return () => {
      if (animationRef.current) animationRef.current.kill()
    }
  }, [isLoading])

  // Efecto para animar la rotación del contenedor cuando colapsa
  useEffect(() => {
    if (containerRef.current) {
      gsap.to(containerRef.current, {
        rotate: collapsed ? -90 : 0,
        gap: collapsed ? "0.3rem" : "0.1rem", // Ajustar el gap un poco al rotar para mejor proporción
        duration: 0.5,
        ease: "power3.inOut"
      })
    }
  }, [collapsed])

  return (
    // Siempre renderizamos el mismo DOM para que la rotación sea fluida y no salte
    <div className="w-8 h-8 flex items-center justify-center">
      <div ref={containerRef} className="flex items-center justify-center h-8 origin-center">
        <div ref={bar1} className="w-1.5 h-6 bg-brand-red rounded-full origin-bottom" />
        <div ref={bar2} className="w-1.5 h-6 bg-brand-blue rounded-full origin-bottom" />
        <div ref={bar3} className="w-1.5 h-6 bg-brand-yellow rounded-full origin-bottom" />
        <div ref={bar4} className="w-1.5 h-6 bg-brand-green rounded-full origin-bottom" />
      </div>
    </div>
  )
}
