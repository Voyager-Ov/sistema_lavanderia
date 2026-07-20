'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useConfigStore } from '../../_store/useConfigStore';
import { toast } from 'sonner';

import { Switch } from '@/shared/ui/forms/switch';
import { SettingItem } from '../SettingItem';
import { actualizarConfiguracion } from '@/domains/configuracion/api';
import { QrCode, Printer, Plus, RefreshCw } from 'lucide-react';
import { Button } from '@/shared/ui/forms/button';

const hardwareSchema = z.object({
  imprimirTicketAutomatico: z.boolean(),
  mensajeTicket: z.string().optional().nullable(),
  showQr: z.boolean(),
});

type HardwareFormValues = z.infer<typeof hardwareSchema>;

const VARIABLES = [
  { key: '{{razonSocial}}', label: 'Razón Social' },
  { key: '{{cliente}}', label: 'Nombre del Cliente' },
  { key: '{{fecha}}', label: 'Fecha Actual' },
  { key: '{{hora}}', label: 'Hora Actual' },
  { key: '{{total}}', label: 'Total del Pedido' },
  { key: '{{nro_pedido}}', label: 'Nro de Pedido' },
  { key: '{{bulto}}', label: 'Bulto X de Y' },
  { key: '{{detalle}}', label: 'Detalle (Prendas)' },
  { key: '{{estado}}', label: 'Estado Pago (PAGADO/NO PAGADO)' },
  { key: '{{estado_pedido}}', label: 'Estado del Pedido (PENDIENTE, LISTO, etc)' },
];

export const DEFAULT_TICKET_TEMPLATE = `{{razonSocial}}
Ticket de Servicios
--------------------------------
Orden: {{nro_pedido}}
Bulto: {{bulto}}
Cliente: {{cliente}}
Fecha: {{fecha}} {{hora}}
--------------------------------
Detalle:
{{detalle}}
--------------------------------
TOTAL              {{total}}

*** {{estado}} ***

¡Gracias por su confianza!`;

// ─── Ticket Preview ──────────────────────────────────────────────────────────
function TicketPreview({ template, showQr, razonSocial }: { template: string, showQr: boolean, razonSocial: string }) {
  const [renderedContent, setRenderedContent] = useState<React.ReactNode[]>([]);

  useEffect(() => {
    const renderTemplate = () => {
      const activeTemplate = template || DEFAULT_TICKET_TEMPLATE;
      
      const parsedText = activeTemplate
        .replace(/\{\{razonSocial\}\}/g, razonSocial.toUpperCase() || 'LAVANDERÍA')
        .replace(/\{\{cliente\}\}/g, 'Juan Perez')
        .replace(/\{\{fecha\}\}/g, new Date().toLocaleDateString())
        .replace(/\{\{hora\}\}/g, new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}))
        .replace(/\{\{total\}\}/g, '$15.000,00')
        .replace(/\{\{nro_pedido\}\}/g, '#LAV-1003')
        .replace(/\{\{bulto\}\}/g, '1 de 1')
        .replace(/\{\{estado\}\}/g, 'PAGADO')
        .replace(/\{\{estado_pedido\}\}/g, 'PENDIENTE')
        .replace(/\{\{detalle\}\}/g, '1x Traje             $15.000,00');

      const lines = parsedText.split('\n');
      
      const renderedLines = lines.map((line, i) => {
        let isCentered = false;
        let isBold = false;
        
        // Basic heuristic for centering/bolding the title or footer
        if (i < 2 || line.includes('***') || line.includes('Gracias')) {
          isCentered = true;
        }
        if (i === 0 || line.includes('TOTAL') || line.includes('Detalle:') || line.includes('***')) {
          isBold = true;
        }

        return (
          <div key={i} style={{ 
            textAlign: isCentered ? 'center' : 'left',
            fontWeight: isBold ? 'bold' : 'normal',
            whiteSpace: 'pre',
            fontSize: i === 0 ? '14px' : '11px',
            minHeight: '14px'
          }}>
            {line}
          </div>
        );
      });

      setRenderedContent(renderedLines);
    };

    renderTemplate();
  }, [template, showQr, razonSocial]);

  return (
    <div
      className="bg-white text-black mx-auto shadow-xl"
      style={{
        fontFamily: "'Courier New', Courier, monospace",
        lineHeight: '1.4',
        width: '260px',
        padding: '20px 14px',
        border: '1px solid #e5e7eb',
        borderRadius: '4px',
      }}
    >
      {renderedContent}

      {/* QR */}
      {showQr && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '12px', marginBottom: '12px' }}>
          <div style={{ fontSize: '10px', marginBottom: '8px', color: '#6b7280' }}>
            Escanea para seguir tu pedido:
          </div>
          <div style={{ border: '2px solid black', padding: '6px', display: 'inline-block' }}>
            <QrCode style={{ width: '90px', height: '90px', color: 'black' }} />
          </div>
          <div style={{ fontSize: '9px', marginTop: '4px', color: '#9ca3af' }}>3E70A29A</div>
        </div>
      )}
    </div>
  );
}

// ─── Main Form ────────────────────────────────────────────────────────────────
export default function HardwareForm() {
  const { hardwareConfig, businessConfig, setHardwareConfig, setIsDirty } = useConfigStore();
  const formRef = useRef<HTMLFormElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const {
    control,
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { isDirty },
    reset,
  } = useForm<HardwareFormValues>({
    resolver: zodResolver(hardwareSchema),
    defaultValues: {
      imprimirTicketAutomatico: hardwareConfig.imprimirTicketAutomatico,
      mensajeTicket: hardwareConfig.mensajeTicket,
      showQr: hardwareConfig.showQr,
    },
    mode: 'onSubmit',
  });

  const watchedValues = watch();

  useEffect(() => {
    setIsDirty(isDirty);
  }, [isDirty, setIsDirty]);

  const insertVariable = (variableKey: string) => {
    if (!textareaRef.current) return;
    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    const text = watchedValues.mensajeTicket || '';
    
    const newText = text.substring(0, start) + variableKey + text.substring(end);
    setValue('mensajeTicket', newText, { shouldDirty: true });
    
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(start + variableKey.length, start + variableKey.length);
      }
    }, 0);
  };

  const setTemplateDefault = () => {
    setValue('mensajeTicket', DEFAULT_TICKET_TEMPLATE, { shouldDirty: true });
  }

  const onSubmit = async (data: HardwareFormValues) => {
    try {
      await actualizarConfiguracion({
        imprimirTicketAutomatico: data.imprimirTicketAutomatico,
        mensajeTicket: data.mensajeTicket || '',
        mostrarQrTicket: data.showQr,
      });

      setHardwareConfig({
        imprimirTicketAutomatico: data.imprimirTicketAutomatico,
        mensajeTicket: data.mensajeTicket || '',
        showQr: data.showQr,
      });
      reset(data);
      toast.success('Configuración de hardware guardada');
    } catch (error: any) {
      toast.error(error.message || 'Error al actualizar hardware');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <form
        id="active-config-form"
        ref={formRef}
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-8"
      >
        <div className="mb-6">
          <h2 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
            Hardware y Tickets
          </h2>
          <p className="mt-2 text-[15px] text-neutral-500 dark:text-neutral-400">
            Administra la impresión térmica y diseña el formato completo del ticket.
          </p>
        </div>

        <div className="space-y-6">
          {/* Auto-print toggle */}
          <SettingItem
            title="Imprimir Ticket Automático"
            description="Lanza la impresión del ticket inmediatamente al cobrar un pedido."
          >
            <Controller
              control={control}
              name="imprimirTicketAutomatico"
              render={({ field }) => (
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              )}
            />
          </SettingItem>

          {/* Show QR toggle */}
          <SettingItem
            title="Mostrar Código QR"
            description="Imprime un código QR al final del ticket para que el cliente siga su pedido online."
          >
            <Controller
              control={control}
              name="showQr"
              render={({ field }) => (
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              )}
            />
          </SettingItem>

          {/* Separator */}
          <div className="border-t border-neutral-100 dark:border-neutral-800 pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">
                Diseño del Ticket
              </h3>
              <Button type="button" variant="outline" size="sm" onClick={setTemplateDefault}>
                <RefreshCw className="w-3.5 h-3.5 mr-2" />
                Restaurar Plantilla
              </Button>
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              {VARIABLES.map((v) => (
                <button
                  key={v.key}
                  type="button"
                  onClick={() => insertVariable(v.key)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors border border-neutral-200 dark:border-neutral-700 shadow-sm"
                >
                  <Plus className="w-3 h-3" />
                  {v.label}
                </button>
              ))}
            </div>

            <textarea
              {...register('mensajeTicket')}
              ref={(e) => {
                register('mensajeTicket').ref(e);
                // @ts-ignore
                textareaRef.current = e;
              }}
              rows={18}
              className="w-full rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-950 px-5 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-neutral-100 transition-colors font-mono resize-y shadow-sm leading-relaxed"
              placeholder="Escribe el diseño del ticket aquí..."
            />
          </div>
        </div>
      </form>

      {/* TICKET PREVIEW */}
      <div className="lg:border-l border-neutral-200 dark:border-neutral-800 lg:pl-8 flex flex-col items-center">
        <div className="sticky top-8 w-full flex flex-col items-center">
          <div className="flex items-center gap-2 mb-6 text-neutral-500">
            <Printer className="w-4 h-4" />
            <span className="text-sm font-medium uppercase tracking-wider">Vista Previa</span>
          </div>

          <div className="bg-neutral-100 dark:bg-neutral-900 p-8 rounded-3xl w-full flex justify-center border border-neutral-200 dark:border-neutral-800 shadow-inner overflow-hidden">
            <TicketPreview 
              template={watchedValues.mensajeTicket || ''} 
              showQr={watchedValues.showQr} 
              razonSocial={businessConfig.razonSocial || ''} 
            />
          </div>
        </div>
      </div>
    </div>
  );
}
