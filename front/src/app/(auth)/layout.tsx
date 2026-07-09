"use client";

import React, { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { LiquidBackground } from "@/shared/ui/layout/LiquidBackground";
import { GuestGuard } from "@/shared/ui/layout/guards/GuestGuard";

/**
 * AuthLayout
 * 
 * Plantilla principal (Layout) para todas las rutas de autenticación `/(auth)`.
 * Presenta un diseño de pantalla dividida (split-screen) en desktop, ocultando
 * el panel izquierdo (con el LiquidBackground) en dispositivos móviles para optimizar el espacio.
 * Maneja las animaciones de carga inicial (entrada) de ambos paneles usando GSAP.
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  
  useGSAP(() => {
    const mm = gsap.matchMedia();

    mm.add("(min-width: 768px)", () => {
      // Desktop animations
      gsap.from(".auth-left-panel", {
        opacity: 0,
        x: -50,
        duration: 1,
        ease: "power3.out"
      });

      gsap.from(".auth-right-panel", {
        opacity: 0,
        x: 50,
        duration: 1,
        delay: 0.2,
        ease: "power3.out"
      });
    });

    mm.add("(max-width: 767px)", () => {
      // Mobile bottom-sheet entrance animation
      gsap.from(".auth-right-panel", {
        y: "100%", // Deslizar desde abajo (fuera de la pantalla)
        duration: 0.8,
        ease: "power3.out"
      });
      // Animamos sutilmente el panel de arriba para que baje
      gsap.from(".auth-left-panel-mobile", {
        opacity: 0,
        y: -30,
        duration: 0.8,
        ease: "power3.out"
      });
    });

    return () => mm.revert();
  }, { scope: containerRef });

  return (
    <div 
      ref={containerRef}
      className="min-h-[100dvh] w-full flex flex-col md:flex-row md:items-center md:justify-center bg-gray-50 md:p-6 lg:p-8 relative overflow-hidden"
    >
      {/* 
        ========================
        MOBILE ONLY BACKGROUND 
        ========================
        Este contenedor sólo se ve en mobile y ocupa la mitad superior de la pantalla.
      */}
      <div className="auth-left-panel-mobile absolute top-0 left-0 w-full h-[50vh] flex md:hidden flex-col justify-center items-center z-0 p-6 overflow-hidden bg-gray-50">
        <LiquidBackground />
        
        <div className="relative z-10 flex flex-col items-center text-center mt-[-10vh]">
          <div className="flex items-center gap-2 font-bold text-xl tracking-tight text-gray-900 mb-2">
            <div className="w-8 h-8 rounded-lg bg-black text-white flex items-center justify-center shadow-lg">L</div>
            Lavandería
          </div>
          <p className="text-gray-800 font-medium tracking-wide uppercase text-xs opacity-80">
            Tu centro de operaciones
          </p>
        </div>
      </div>

      <div className="w-full h-[100dvh] md:h-auto max-w-6xl md:bg-white md:rounded-[2rem] md:shadow-[0_8px_40px_rgb(0,0,0,0.08)] md:overflow-hidden flex flex-col justify-end md:flex-row md:min-h-[700px] md:border md:border-gray-100 z-10 pointer-events-none">
        
        {/* Columna Izquierda: Desktop */}
        <div className="auth-left-panel relative hidden md:flex md:w-1/2 bg-gray-50 p-8 lg:p-12 flex-col justify-between pointer-events-auto">
          
          <LiquidBackground />

          <div className="relative z-10">
            <div className="flex items-center gap-2 font-bold text-xl tracking-tight text-gray-900">
              <div className="w-8 h-8 rounded-lg bg-black text-white flex items-center justify-center">L</div>
              Lavandería
            </div>
          </div>

          <div className="relative z-10 mb-8">
            <p className="text-gray-600 font-medium mb-4 tracking-wide uppercase text-sm">
              Tu centro de operaciones
            </p>
            <h1 className="text-4xl lg:text-5xl font-extrabold tracking-tight text-gray-900 leading-[1.1]">
              Accede a tu plataforma central para claridad y control.
            </h1>
          </div>
        </div>

        {/* Columna Derecha: Formularios (Actúa como Bottom Sheet en Mobile) */}
        <div className="auth-right-panel w-full md:w-1/2 p-6 sm:p-10 md:p-12 lg:p-16 flex flex-col bg-white relative z-20 rounded-t-[2.5rem] md:rounded-none shadow-[0_-8px_30px_rgb(0,0,0,0.08)] md:shadow-none min-h-[60vh] md:min-h-0 pt-8 pointer-events-auto md:justify-center">
          
          {/* Pill / handle (Solo visible en mobile) */}
          <div className="absolute top-3 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-gray-200 rounded-full md:hidden" />
          
          <div className="w-full flex-grow flex flex-col justify-center">
            <GuestGuard>
              {children}
            </GuestGuard>
          </div>
        </div>
        
      </div>
    </div>
  );
}
