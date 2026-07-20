'use client';

import React, { useEffect, useRef } from 'react';
import { useConfigStore } from '../_store/useConfigStore';
import gsap from 'gsap';
import { Save, X } from 'lucide-react';

export default function FloatingSaveBar() {
  const { isDirty, setIsDirty } = useConfigStore();
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!barRef.current) return;

    if (isDirty) {
      gsap.to(barRef.current, {
        y: 0,
        autoAlpha: 1,
        duration: 0.4,
        ease: 'back.out(1.2)',
      });
    } else {
      gsap.to(barRef.current, {
        y: 100,
        autoAlpha: 0,
        duration: 0.3,
        ease: 'power2.in',
      });
    }
  }, [isDirty]);

  // We set initial state via inline styles to avoid hydration mismatch jumps
  return (
    <div
      ref={barRef}
      className="fixed bottom-6 left-1/2 z-50 flex w-[90%] max-w-2xl -translate-x-1/2 items-center justify-between gap-4 rounded-full border border-neutral-200/50 bg-white/80 px-6 py-3 shadow-xl backdrop-blur-md dark:border-neutral-700/50 dark:bg-neutral-800/80 sm:w-auto"
      style={{ transform: 'translate(-50%, 100px)', opacity: 0, visibility: 'hidden' }}
    >
      <div className="flex items-center gap-2">
        <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
        <span className="text-sm font-medium text-neutral-700 dark:text-neutral-200">
          Tienes cambios sin guardar
        </span>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => setIsDirty(false)} // We'll implement actual reset from forms later
          className="rounded-full p-2 text-neutral-500 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-700/50 transition-colors"
          title="Descartar"
        >
          <X className="h-4 w-4" />
        </button>
        
        {/* We use form="config-form" later to trigger the active form's submit */}
        <button
          type="submit"
          form="active-config-form"
          className="flex items-center gap-2 rounded-full bg-neutral-900 px-4 py-2 text-sm font-medium text-white shadow-md hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:ring-offset-2 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100 transition-colors"
        >
          <Save className="h-4 w-4" />
          Guardar cambios
        </button>
      </div>
    </div>
  );
}
