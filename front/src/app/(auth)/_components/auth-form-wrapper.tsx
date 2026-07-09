"use client";

import React, { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";

/**
 * shakeForm
 * Utilidad global para hacer temblar los campos de texto con errores.
 * Se llama desde onSubmit o onError de react-hook-form.
 */
export const animateFormError = (elementSelector: string = ".form-element") => {
  gsap.fromTo(elementSelector, 
    { x: -10 },
    { 
      x: 0, 
      ease: "elastic.out(2, 0.3)", 
      duration: 0.6, 
      clearProps: "transform" 
    }
  );
};

/**
 * AuthFormWrapper
 * 
 * Componente contenedor principal para todos los formularios de autenticación.
 * 
 * Responsabilidades:
 * 1. Establece la estructura visual básica y el ancho máximo (max-w-sm mx-auto).
 * 2. Ejecuta la animación de cascada (stagger) usando GSAP sobre todos los
 *    elementos hijos que posean la clase "form-element".
 * 
 * Uso de seguridad: No expone estado interno, puramente presentacional.
 */
export function AuthFormWrapper({ children }: { children: React.ReactNode }) {
  const formRef = useRef<HTMLDivElement>(null);

  // Animación suave de entrada en cascada para mejorar la UX
  useGSAP(
    () => {
      gsap.from(".form-element", {
        y: 20,
        opacity: 0,
        duration: 0.6,
        stagger: 0.1,
        ease: "power2.out",
        delay: 0.2, // Reducimos un poco el delay para que se sienta más rápido con el nuevo slide up de mobile
      });
    },
    { scope: formRef }
  );

  return (
    <div ref={formRef} className="w-full max-w-sm mx-auto relative flex flex-col justify-center">
      {children}
    </div>
  );
}
