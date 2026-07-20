'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useConfigStore } from '../../_store/useConfigStore';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { toast } from 'sonner';

import { SettingItem } from '../SettingItem';
import { actualizarConfiguracion } from '@/domains/configuracion/api';
import { Plus, CheckCheck, Smartphone, MessageCircle } from 'lucide-react';

gsap.registerPlugin(useGSAP);

const notificationsSchema = z.object({
  whatsappMensajeManual: z.string().min(5, 'La plantilla es muy corta'),
});

type NotificationsFormValues = z.infer<typeof notificationsSchema>;

const VARIABLES_MANUAL = [
  { key: '{{nombre}}', label: 'Nombre' },
  { key: '{{codigo}}', label: 'Código' },
  { key: '{{estado}}', label: 'Estado' },
  { key: '{{detalle}}', label: 'Detalle' },
];

export default function NotificationsForm() {
  const { notificationsConfig, setNotificationsConfig, setIsDirty } = useConfigStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const textareaManualRef = useRef<HTMLTextAreaElement>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isDirty },
    reset,
  } = useForm<NotificationsFormValues>({
    resolver: zodResolver(notificationsSchema),
    defaultValues: {
      whatsappMensajeManual: notificationsConfig.whatsappMensajeManual || '',
    },
    mode: 'onSubmit',
  });

  const whatsappMensajeManual = watch('whatsappMensajeManual');

  // GSAP Animations
  useGSAP({ scope: containerRef });

  useEffect(() => {
    setIsDirty(isDirty);
  }, [isDirty, setIsDirty]);

  // Shake Error Animation
  useEffect(() => {
    if (errors.whatsappMensajeManual) {
      const el = document.getElementById(`input-whatsappMensajeManual`);
      if (el) {
        gsap.fromTo(el, 
          { x: -5 },
          { x: 5, clearProps: "x", repeat: 5, yoyo: true, duration: 0.05, ease: "none" }
        );
      }
    }
  }, [errors]);

  const insertVariable = (variableKey: string, ref: React.RefObject<HTMLTextAreaElement | null>) => {
    if (!ref.current) return;
    const start = ref.current.selectionStart;
    const end = ref.current.selectionEnd;
    const text = whatsappMensajeManual || '';
    
    const newText = text.substring(0, start) + variableKey + text.substring(end);
    setValue('whatsappMensajeManual', newText, { shouldDirty: true });
    
    setTimeout(() => {
      if (ref.current) {
        ref.current.focus();
        ref.current.setSelectionRange(start + variableKey.length, start + variableKey.length);
      }
    }, 0);
  };

  const onSubmit = async (data: NotificationsFormValues) => {
    try {
      await actualizarConfiguracion({
        whatsappActivo: false,
        whatsappMensajeListo: "",
        whatsappMensajeManual: data.whatsappMensajeManual,
      });

      setNotificationsConfig({
        ...notificationsConfig,
        whatsappEnabled: false,
        whatsappTemplate: "",
        whatsappMensajeManual: data.whatsappMensajeManual
      });
      reset(data);
      toast.success('Notificaciones configuradas correctamente');
    } catch (error: any) {
      toast.error(error.message || 'Error al actualizar');
    }
  };

  const renderPreview = () => {
    let previewText = whatsappMensajeManual || '';
    
    previewText = previewText.replace(/\{\{nombre\}\}/g, 'Juan Perez');
    previewText = previewText.replace(/\{\{negocio\}\}/g, 'Lavandería Burbujas');
    previewText = previewText.replace(/\{\{codigo\}\}/g, '#10042');
    previewText = previewText.replace(/\{\{estado\}\}/g, 'listo para retirar');
    previewText = previewText.replace(/\{\{detalle\}\}/g, '2x Camisas, 1x Pantalón');

    return (
      <div className="relative w-[300px] h-[500px] bg-[#efeae2] dark:bg-[#0b141a] rounded-[2rem] border-[8px] border-neutral-800 dark:border-neutral-900 overflow-hidden shadow-2xl flex flex-col font-sans shrink-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-neutral-800 dark:bg-neutral-900 rounded-b-2xl z-20"></div>
        
        <div className="bg-[#008069] dark:bg-[#202c33] text-white px-4 py-3 pt-8 flex items-center gap-3 z-10 shadow-sm transition-colors duration-500">
          <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center shrink-0">
            <span className="font-semibold text-sm">JP</span>
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-[15px] leading-tight">Juan Perez</span>
            <span className="text-[11px] text-white/80">en línea</span>
          </div>
        </div>

        <div className="absolute inset-0 opacity-[0.06] dark:opacity-[0.03] pointer-events-none" 
             style={{ backgroundImage: 'url("https://w0.peakpx.com/wallpaper/818/148/HD-wallpaper-whatsapp-background-solid-color-whatsapp-background.jpg")', backgroundSize: 'cover' }}>
        </div>

        <div className="flex-1 p-4 overflow-y-auto flex flex-col justify-end gap-4 relative z-10">
          <div className="bg-[#d9fdd3] dark:bg-[#005c4b] text-[#111b21] dark:text-[#e9edef] rounded-lg rounded-tr-none p-2 px-3 self-end max-w-[85%] shadow-sm relative animate-in fade-in slide-in-from-bottom-2 duration-300">
            <svg viewBox="0 0 8 13" width="8" height="13" className="absolute top-0 -right-2 text-[#d9fdd3] dark:text-[#005c4b] fill-current">
              <path d="M5.188 1H0v11.193l6.467-8.625C7.526 2.156 6.958 1 5.188 1z"></path>
            </svg>
            
            <div className="text-[14.2px] leading-[1.35] whitespace-pre-wrap break-words pb-3">
              {previewText || <span className="text-black/30 dark:text-white/30 italic">Escribe un mensaje...</span>}
            </div>
            <div className="absolute bottom-1 right-2 flex items-center gap-1">
              <span className="text-[10px] text-black/40 dark:text-white/50">{new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
              <CheckCheck className="w-3.5 h-3.5 text-[#53bdeb]" />
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div ref={containerRef} className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <form 
        id="active-config-form"
        ref={formRef} 
        onSubmit={handleSubmit(onSubmit)} 
        className="space-y-8"
      >
        <div className="mb-2">
          <h2 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50 flex items-center gap-3">
            <span className="bg-[#008069]/10 dark:bg-[#00a884]/10 p-2 rounded-xl">
              <MessageCircle className="w-7 h-7 text-[#008069] dark:text-[#00a884]" />
            </span>
            Comunicaciones
          </h2>
          <p className="mt-3 text-[15px] text-neutral-500 dark:text-neutral-400 max-w-lg leading-relaxed">
            Configura la plantilla del mensaje de WhatsApp que enviarás manualmente a tus clientes para notificarles sobre sus pedidos.
          </p>
        </div>

        <div className="space-y-6">
          {/* MENSAJE MANUAL SECCIÓN */}
          <SettingItem
            title="Mensaje Manual (Tabla de Pedidos)"
            description="Plantilla utilizada al hacer clic en el botón de WhatsApp desde la tabla de pedidos."
            vertical
          >
            <div className="flex flex-col w-full">
              <div className="flex flex-wrap gap-2 mb-3 mt-2">
                {VARIABLES_MANUAL.map((v) => (
                  <button
                    key={v.key}
                    type="button"
                    onClick={() => insertVariable(v.key, textareaManualRef)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 transition-colors border border-neutral-200 dark:border-neutral-700"
                  >
                    <Plus className="w-3 h-3 text-[#008069] dark:text-[#00a884]" />
                    {v.label}
                  </button>
                ))}
              </div>
              <textarea
                {...register('whatsappMensajeManual')}
                id="input-whatsappMensajeManual"
                ref={(e) => {
                  register('whatsappMensajeManual').ref(e);
                  // @ts-ignore
                  textareaManualRef.current = e;
                }}
                rows={4}
                placeholder="Hola {{nombre}}, tu pedido {{codigo}} está {{estado}}. Detalle: {{detalle}}"
                className={`w-full rounded-xl border bg-white dark:bg-neutral-950 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#008069] dark:focus:ring-[#00a884] transition-all resize-y shadow-sm font-medium ${
                  errors.whatsappMensajeManual ? 'border-red-500 ring-1 ring-red-500 bg-red-50 dark:bg-red-950/20' : 'border-neutral-200 dark:border-neutral-800'
                }`}
              />
              {errors.whatsappMensajeManual && <p className="text-xs font-medium text-red-500 mt-2">{errors.whatsappMensajeManual.message}</p>}
            </div>
          </SettingItem>
        </div>
      </form>

      {/* WHATSAPP PREVIEW (Right Side) */}
      <div className="lg:border-l border-neutral-200 dark:border-neutral-800 lg:pl-8 flex flex-col items-center">
        <div className="sticky top-8 w-full flex flex-col items-center">
          
          <div className="flex items-center justify-between w-full max-w-[300px] mb-6">
            <div className="flex items-center gap-2 text-neutral-500 dark:text-neutral-400">
              <Smartphone className="w-4 h-4" />
              <span className="text-xs font-semibold uppercase tracking-wider">Vista Previa</span>
            </div>
          </div>
          
          <div className="w-full flex justify-center perspective-1000">
             {renderPreview()}
          </div>
        </div>
      </div>
    </div>
  );
}
