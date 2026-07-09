"use client";

import React, { useRef, useEffect } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useUIStore } from "@/shared/store/useUIStore";

export function LiquidBackground() {
  const containerRef = useRef<HTMLDivElement>(null);
  const isProcessing = useUIStore((state) => state.isProcessing);
  
  // Guardar referencias a los tweens de animación para poder manipular su velocidad
  const tweensRef = useRef<gsap.core.Tween[]>([]);

  useGSAP(() => {
    // Animación suave y orgánica para las esferas (blobs) como líquido
    const blobs = gsap.utils.toArray<HTMLElement>(".gsap-blob");
    tweensRef.current = [];
    
    blobs.forEach((blob, i) => {
      // Movimiento complejo continuo para simular líquido giratorio
      const tween = gsap.to(blob, {
        x: () => gsap.utils.random(-150, 150),
        y: () => gsap.utils.random(-150, 150),
        scale: () => gsap.utils.random(0.7, 1.5),
        rotation: () => gsap.utils.random(-180, 180),
        borderRadius: () => `${gsap.utils.random(30, 70)}% ${gsap.utils.random(30, 70)}% ${gsap.utils.random(30, 70)}% ${gsap.utils.random(30, 70)}%`,
        duration: () => gsap.utils.random(10, 15),
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true,
        delay: i * -3,
      });
      tweensRef.current.push(tween);
    });
  }, { scope: containerRef });

  // Reaccionar al estado isProcessing
  useEffect(() => {
    if (isProcessing) {
      // Girar todo el conjunto 360 grados con aceleración y desaceleración
      gsap.to(".gsap-blob-container", { 
        rotation: "+=360", 
        duration: 1.5, 
        ease: "power3.inOut",
        overwrite: "auto"
      });
      // Intensificar colores
      gsap.to(".gsap-blob", { opacity: 1, duration: 0.5 });
    } else {
      // Volver a la calma de opacidad
      gsap.to(".gsap-blob", { opacity: 0.7, duration: 1.5 });
    }
  }, [isProcessing]);

  return (
    <div ref={containerRef} className="absolute inset-0 opacity-60 mix-blend-multiply pointer-events-none overflow-hidden flex items-center justify-center">
      {/* Contenedor que agrupa los 4 colores para girarlos en conjunto */}
      <div className="gsap-blob-container relative w-full h-full max-w-lg max-h-[500px]">
        <div className="gsap-blob absolute top-0 left-0 w-72 h-72 bg-red-400 mix-blend-multiply filter blur-[80px] opacity-70 rounded-full" />
        <div className="gsap-blob absolute top-0 right-0 w-72 h-72 bg-blue-400 mix-blend-multiply filter blur-[80px] opacity-70 rounded-full" />
        <div className="gsap-blob absolute bottom-0 left-0 w-72 h-72 bg-yellow-400 mix-blend-multiply filter blur-[80px] opacity-70 rounded-full" />
        <div className="gsap-blob absolute bottom-0 right-0 w-72 h-72 bg-green-400 mix-blend-multiply filter blur-[80px] opacity-70 rounded-full" />
      </div>
    </div>
  );
}
