"use client"

import React, { useEffect, useRef, useImperativeHandle, forwardRef, useState } from "react"
import gsap from "gsap"

export interface TopLoaderRef {
  start: () => void
  complete: () => void
}

export const TopLoader = forwardRef<TopLoaderRef>((_, ref) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const redRef = useRef<HTMLDivElement>(null)
  const blueRef = useRef<HTMLDivElement>(null)
  const yellowRef = useRef<HTMLDivElement>(null)
  const greenRef = useRef<HTMLDivElement>(null)
  
  const [isVisible, setIsVisible] = useState(false)
  const tl = useRef<gsap.core.Timeline | null>(null)

  useImperativeHandle(ref, () => ({
    start: () => {
      setIsVisible(true)
      
      // Stop any existing animation
      if (tl.current) tl.current.kill()
      
      // Reset positions
      gsap.set([redRef.current, blueRef.current, yellowRef.current, greenRef.current], {
        xPercent: -100,
        opacity: 1
      })
      
      tl.current = gsap.timeline({ repeat: -1 })
      
      const duration = 1.2
      const staggerDelay = 0.15
      
      // Endless wave animation across the screen
      tl.current
        .to(redRef.current, { xPercent: 100, duration, ease: "power2.inOut" }, 0)
        .to(blueRef.current, { xPercent: 100, duration, ease: "power2.inOut" }, staggerDelay)
        .to(yellowRef.current, { xPercent: 100, duration, ease: "power2.inOut" }, staggerDelay * 2)
        .to(greenRef.current, { xPercent: 100, duration, ease: "power2.inOut" }, staggerDelay * 3)
    },
    complete: () => {
      if (tl.current) {
        // Quick exit animation
        const exitTl = gsap.timeline({
          onComplete: () => {
            setIsVisible(false)
            if (tl.current) tl.current.kill()
          }
        })
        
        exitTl.to([redRef.current, blueRef.current, yellowRef.current, greenRef.current], {
          opacity: 0,
          duration: 0.3,
          ease: "power2.out"
        })
      }
    }
  }))

  if (!isVisible) return null

  return (
    <div 
      ref={containerRef}
      className="fixed top-0 left-0 w-full h-1.5 z-50 overflow-hidden bg-transparent"
    >
      <div ref={redRef} className="absolute inset-0 w-full h-full bg-brand-red origin-left" />
      <div ref={blueRef} className="absolute inset-0 w-full h-full bg-brand-blue origin-left" />
      <div ref={yellowRef} className="absolute inset-0 w-full h-full bg-brand-yellow origin-left" />
      <div ref={greenRef} className="absolute inset-0 w-full h-full bg-brand-green origin-left" />
    </div>
  )
})

TopLoader.displayName = "TopLoader"
