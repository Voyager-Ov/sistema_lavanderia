"use client";

import React, { useRef } from "react";
import Link from "next/link";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ArrowRight, Droplets } from "lucide-react";

export default function LandingPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  
  gsap.registerPlugin(useGSAP);

  useGSAP(() => {
    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

    // Fondo y elementos decorativos
    tl.fromTo(".bg-shape", 
      { scale: 0, opacity: 0, rotation: -45 }, 
      { scale: 1, opacity: 0.8, rotation: 0, duration: 1.5, stagger: 0.2 }
    )
    // Contenido principal
    .fromTo(".hero-text",
      { y: 50, opacity: 0, clipPath: "polygon(0 0, 100% 0, 100% 0, 0 0)" },
      { y: 0, opacity: 1, clipPath: "polygon(0 0, 100% 0, 100% 100%, 0 100%)", duration: 1.2, stagger: 0.15 },
      "-=1.0"
    )
    // Botón
    .fromTo(".cta-button",
      { y: 20, opacity: 0, scale: 0.9 },
      { y: 0, opacity: 1, scale: 1, duration: 0.8, ease: "back.out(1.5)" },
      "-=0.6"
    );

  }, { scope: containerRef });

  const handleButtonHover = (e: React.MouseEvent) => {
    gsap.to(e.currentTarget.querySelector('.arrow-icon'), { x: 5, duration: 0.2, ease: "power2.out" });
  };

  const handleButtonLeave = (e: React.MouseEvent) => {
    gsap.to(e.currentTarget.querySelector('.arrow-icon'), { x: 0, duration: 0.2, ease: "power2.out" });
  };

  return (
    <div ref={containerRef} className="min-h-screen bg-[#FAFAFA] flex flex-col items-center justify-center relative overflow-hidden font-sans">
      
      {/* Decorative Background Shapes */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden flex items-center justify-center">
        <div className="bg-shape absolute w-[800px] h-[800px] bg-gradient-to-tr from-blue-100/40 to-transparent rounded-full blur-3xl -translate-x-1/2 -translate-y-1/4" />
        <div className="bg-shape absolute w-[600px] h-[600px] bg-gradient-to-bl from-indigo-100/30 to-transparent rounded-full blur-3xl translate-x-1/3 translate-y-1/3" />
      </div>

      <div className="relative z-10 max-w-4xl w-full px-6 text-center flex flex-col items-center">
        {/* Logo/Icon */}
        <div className="hero-text w-20 h-20 bg-white rounded-3xl shadow-xl shadow-blue-900/5 flex items-center justify-center mb-10 border border-gray-100">
          <Droplets className="w-10 h-10 text-blue-600" />
        </div>

        {/* Headline */}
        <h1 className="hero-text text-6xl md:text-8xl font-extrabold text-gray-900 tracking-tighter leading-[1.1] mb-6">
          Gestión <br/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
            Inteligente.
          </span>
        </h1>
        
        {/* Subtitle */}
        <p className="hero-text text-lg md:text-2xl text-gray-500 max-w-2xl font-medium mb-12">
          Plataforma integral para lavanderías. Optimiza tus pedidos, gestiona tus clientes y toma el control total de tu negocio.
        </p>

        {/* CTA */}
        <div className="cta-button">
          <Link 
            href="/login"
            onMouseEnter={handleButtonHover}
            onMouseLeave={handleButtonLeave}
            className="group relative inline-flex items-center justify-center gap-3 bg-gray-900 text-white px-8 py-5 rounded-2xl text-lg font-bold transition-transform active:scale-95 shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.2)]"
          >
            <span>Iniciar Sesión</span>
            <div className="arrow-icon w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <ArrowRight className="w-4 h-4 text-white" />
            </div>
          </Link>
        </div>
      </div>
      
    </div>
  );
}
