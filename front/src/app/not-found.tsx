"use client";

import React, { useRef } from "react";
import Link from "next/link";
import { ArrowRight, CloudOff } from "lucide-react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

export default function NotFound() {
  const containerRef = useRef<HTMLDivElement>(null);
  
  gsap.registerPlugin(useGSAP);

  useGSAP(() => {
    // Background floating elements animation
    gsap.to(".float-element", {
      y: "-=30",
      x: "+=20",
      rotation: 15,
      duration: 4,
      yoyo: true,
      repeat: -1,
      ease: "sine.inOut",
      stagger: 0.5
    });

    // Entrance animation
    gsap.from(".not-found-content", {
      y: 40,
      opacity: 0,
      duration: 0.8,
      ease: "back.out(1.2)",
      stagger: 0.15
    });

  }, { scope: containerRef });

  return (
    <div 
      ref={containerRef}
      className="min-h-screen w-full flex items-center justify-center bg-gray-50 relative overflow-hidden selection:bg-brand-blue selection:text-white"
    >
      {/* Decorative background elements */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-blue/20 rounded-full mix-blend-multiply filter blur-[80px] opacity-70 float-element" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-brand-red/20 rounded-full mix-blend-multiply filter blur-[80px] opacity-70 float-element" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white/40 via-transparent to-transparent pointer-events-none" />

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center justify-center p-8 text-center max-w-2xl">
        
        <div className="not-found-content relative mb-8">
          <div className="absolute inset-0 bg-brand-blue/10 blur-3xl rounded-full scale-150" />
          <div className="relative w-32 h-32 bg-white/80 backdrop-blur-2xl rounded-[2rem] shadow-2xl border border-white/50 flex items-center justify-center rotate-3 hover:rotate-6 transition-transform duration-500">
            <CloudOff className="w-16 h-16 text-brand-blue" strokeWidth={1.5} />
          </div>
        </div>

        <h1 className="not-found-content text-8xl font-black text-transparent bg-clip-text bg-gradient-to-br from-gray-900 to-gray-500 mb-4 tracking-tighter">
          404
        </h1>
        
        <h2 className="not-found-content text-3xl font-bold text-gray-800 mb-4 tracking-tight">
          Página no encontrada
        </h2>
        
        <p className="not-found-content text-lg text-gray-500 mb-12 max-w-md mx-auto leading-relaxed">
          Parece que te has perdido en el ciberespacio. La página que buscas no existe o ha sido movida.
        </p>

        <Link 
          href="/login" 
          className="not-found-content group relative inline-flex items-center gap-3 bg-gray-900 text-white px-8 py-4 rounded-full font-bold text-lg overflow-hidden transition-transform hover:scale-105 active:scale-95 shadow-xl shadow-gray-900/20"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-brand-blue via-brand-red to-brand-yellow opacity-0 group-hover:opacity-20 transition-opacity duration-500" />
          <span>Volver a Iniciar Sesión</span>
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </Link>

      </div>
    </div>
  );
}
