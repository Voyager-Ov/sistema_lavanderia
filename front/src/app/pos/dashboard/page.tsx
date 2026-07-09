"use client";

import React, { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";

export default function POSDashboardPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  gsap.registerPlugin(useGSAP);

  useGSAP(() => {
    gsap.from(".card-anim", {
      y: 20,
      opacity: 0,
      stagger: 0.1,
      duration: 0.5,
      ease: "power2.out"
    });
  }, { scope: containerRef });

  return (
    <div ref={containerRef} className="flex flex-col gap-6">
      <div className="card-anim bg-white rounded-[2rem] p-8 border border-gray-100 shadow-sm">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Punto de Venta</h2>
        <p className="text-gray-500">Inicia un nuevo pedido o gestiona la caja actual.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="card-anim bg-white rounded-3xl p-6 border border-gray-100 shadow-sm h-32 flex flex-row items-center gap-4">
            <div className="w-16 h-16 bg-green-50 rounded-2xl" />
            <div className="flex flex-col gap-2">
              <div className="w-32 h-4 bg-gray-100 rounded-full" />
              <div className="w-20 h-3 bg-gray-50 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
