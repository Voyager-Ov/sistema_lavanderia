'use client';

import React, { useEffect, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useConfigStore } from '../../_store/useConfigStore';
import { toast } from 'sonner';

import { SettingItem } from '../SettingItem';

const appearanceSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']),
  primaryColor: z.string(),
});

type AppearanceFormValues = z.infer<typeof appearanceSchema>;

export default function AppearanceForm() {
  const { appearanceConfig, setAppearanceConfig, setIsDirty } = useConfigStore();
  const formRef = useRef<HTMLFormElement>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { isDirty },
    reset,
  } = useForm<AppearanceFormValues>({
    resolver: zodResolver(appearanceSchema),
    defaultValues: appearanceConfig,
    mode: 'onSubmit',
  });

  const selectedTheme = watch('theme');

  useEffect(() => {
    setIsDirty(isDirty);
  }, [isDirty, setIsDirty]);

  const onSubmit = (data: AppearanceFormValues) => {
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 800)),
      {
        loading: 'Guardando configuración visual...',
        success: () => {
          setAppearanceConfig(data);
          reset(data);
          return 'Apariencia actualizada';
        },
        error: 'Error al actualizar',
      }
    );
  };

  return (
    <form 
      id="active-config-form"
      ref={formRef} 
      onSubmit={handleSubmit(onSubmit)} 
      className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500"
    >
      <div className="mb-8">
        <h2 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
          Apariencia Visual
        </h2>
        <p className="mt-2 text-[15px] text-neutral-500 dark:text-neutral-400">
          Personaliza cómo se ve el panel de administración según tu marca y preferencias.
        </p>
      </div>

      <div className="space-y-4">
        <SettingItem
          title="Tema del Sistema"
          description="Alterna entre modo claro, oscuro, o sincronizado con tu sistema operativo."
          vertical
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
            {['light', 'dark', 'system'].map((t) => (
              <label 
                key={t}
                className={`relative flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 p-5 transition-all shadow-sm ${
                  selectedTheme === t 
                    ? 'border-brand-blue bg-brand-blue/5 text-brand-blue dark:bg-brand-blue/10 dark:text-blue-400' 
                    : 'border-neutral-200 dark:border-neutral-800 bg-white/50 dark:bg-neutral-900/30 hover:border-brand-blue/30 text-neutral-700 dark:text-neutral-300'
                }`}
              >
                <input 
                  type="radio" 
                  value={t} 
                  {...register('theme')} 
                  className="sr-only" 
                />
                <span className="text-sm font-semibold capitalize tracking-wide">
                  {t === 'system' ? 'Automático' : t === 'light' ? 'Claro' : 'Oscuro'}
                </span>
                {selectedTheme === t && (
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-brand-blue rounded-full flex items-center justify-center border-2 border-white dark:border-neutral-900 shadow-md">
                    <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </label>
            ))}
          </div>
        </SettingItem>

        <SettingItem
          title="Color Primario de la Marca"
          description="Este color se usará para los botones principales, alertas y enlaces."
          vertical
        >
          <div className="flex flex-col sm:flex-row sm:items-center gap-6 p-4 rounded-xl bg-neutral-50 dark:bg-neutral-950/50 w-full">
            <div className="relative group">
              <input 
                type="color" 
                {...register('primaryColor')}
                className="w-16 h-16 rounded-full cursor-pointer border-4 border-white dark:border-neutral-800 shadow-lg p-0 bg-transparent [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:border-none [&::-webkit-color-swatch]:rounded-full transition-transform group-hover:scale-105"
              />
            </div>
            <div className="space-y-1">
              <span className="text-base font-mono font-bold bg-white dark:bg-neutral-900 px-4 py-2 rounded-lg shadow-sm border border-neutral-100 dark:border-neutral-800">
                {watch('primaryColor')}
              </span>
              <p className="text-xs text-neutral-500 mt-2 ml-1">Valor Hexadecimal.</p>
            </div>
          </div>
        </SettingItem>
      </div>
    </form>
  );
}
