"use client";

import React, { useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { X } from "lucide-react";

interface BottomSheetWrapperProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  height?: "auto" | "full";
}

export function BottomSheetWrapper({ isOpen, onClose, title, children, height = "auto" }: BottomSheetWrapperProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = React.useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useGSAP(() => {
    if (isOpen) {
      // Entrada
      gsap.to(overlayRef.current, { opacity: 1, duration: 0.3, ease: "power2.out", display: "block" });
      gsap.to(sheetRef.current, { y: "0%", duration: 0.5, ease: "power3.out" });
    } else {
      // Salida
      gsap.to(sheetRef.current, { y: "100%", duration: 0.4, ease: "power3.in" });
      gsap.to(overlayRef.current, { opacity: 0, duration: 0.3, ease: "power2.in", display: "none", delay: 0.1 });
    }
  }, [isOpen]);

  if (!mounted) return null;

  return createPortal(
    <div className="md:hidden z-[100] relative">
      {/* Overlay */}
      <div 
        ref={overlayRef}
        className="fixed inset-0 bg-black/40 backdrop-blur-sm opacity-0 hidden z-40"
        onClick={onClose}
      />
      
      {/* Sheet */}
      <div 
        ref={sheetRef}
        className={`fixed bottom-0 left-0 right-0 bg-white rounded-t-[2rem] shadow-[0_-8px_30px_rgb(0,0,0,0.12)] z-50 flex flex-col translate-y-[100%]
          ${height === "full" ? "h-[90vh]" : "max-h-[90vh] min-h-[40vh]"}
        `}
      >
        <div className="flex justify-center pt-3 pb-2 flex-shrink-0" onClick={onClose}>
          <div className="w-12 h-1.5 bg-gray-200 rounded-full" />
        </div>
        
        {title && (
          <div className="px-6 pb-4 flex items-center justify-between flex-shrink-0 border-b border-gray-100">
            <h3 className="font-bold text-lg text-gray-900">{title}</h3>
            <button onClick={onClose} className="p-2 -mr-2 bg-gray-50 text-gray-500 rounded-full hover:bg-gray-100 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        
        <div className="flex-1 overflow-y-auto px-6 py-4 pb-12">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}
