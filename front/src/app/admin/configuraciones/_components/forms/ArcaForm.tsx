'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useConfigStore } from '../../_store/useConfigStore';
import gsap from 'gsap';
import { toast } from 'sonner';

import { Switch } from '@/shared/ui/forms/switch';
import { Input } from '@/shared/ui/forms/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/forms/select';
import { SettingItem } from '../SettingItem';
import { actualizarConfiguracion, subirCertificadosAfip } from '@/domains/configuracion/api';
import { UploadCloud, CheckCircle2 } from 'lucide-react';

const arcaSchema = z.object({
  afipActivo: z.boolean(),
  afipModoFacturacion: z.enum(['AUTOMATICO', 'MANUAL', 'DESACTIVADO']),
  afipPuntoVenta: z.coerce.number().min(1, 'El punto de venta debe ser mayor a 0').nullable(),
});

type ArcaFormValues = z.infer<typeof arcaSchema>;

export default function ArcaForm() {
  const { arcaConfig, setArcaConfig, setIsDirty } = useConfigStore();
  const formRef = useRef<HTMLFormElement>(null);

  const [certificadoFile, setCertificadoFile] = useState<File | null>(null);
  const [llaveFile, setLlaveFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const {
    control,
    register,
    handleSubmit,
    watch,
    formState: { errors, isDirty },
    reset,
  } = useForm<ArcaFormValues>({
    resolver: zodResolver(arcaSchema) as any,
    defaultValues: arcaConfig,
    mode: 'onSubmit',
  });

  const afipActivo = watch('afipActivo');

  useEffect(() => {
    setIsDirty(isDirty || certificadoFile !== null || llaveFile !== null);
  }, [isDirty, certificadoFile, llaveFile, setIsDirty]);

  // Animate error fields
  useEffect(() => {
    const errorKeys = Object.keys(errors);
    if (errorKeys.length > 0) {
      errorKeys.forEach((key) => {
        const el = document.getElementById(`input-${key}`);
        if (el) {
          gsap.fromTo(el, 
            { x: -5 },
            { x: 5, clearProps: "x", repeat: 5, yoyo: true, duration: 0.05, ease: "none" }
          );
        }
      });
    }
  }, [errors]);

  const onSubmit = async (data: ArcaFormValues) => {
    try {
      // 1. Guardar configuraciones de texto
      await actualizarConfiguracion({
        afipActivo: data.afipActivo,
        afipModoFacturacion: data.afipModoFacturacion,
        afipPuntoVenta: data.afipPuntoVenta,
      });

      // 2. Subir certificados si se seleccionaron
      if (certificadoFile || llaveFile) {
        setUploading(true);
        await subirCertificadosAfip(certificadoFile, llaveFile);
        setCertificadoFile(null);
        setLlaveFile(null);
      }

      setArcaConfig(data);
      reset(data);
      toast.success('Configuración de ARCA guardada exitosamente');
    } catch (error: any) {
      toast.error(error.message || 'Error al guardar la configuración');
    } finally {
      setUploading(false);
    }
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
          Facturación ARCA (ex AFIP)
        </h2>
        <p className="mt-2 text-[15px] text-neutral-500 dark:text-neutral-400">
          Configura la emisión de facturas electrónicas para tu negocio.
        </p>
      </div>

      <div className="space-y-4">
        <SettingItem
          title="Habilitar Integración ARCA"
          description="Permite generar facturas electrónicas de forma oficial conectándose con la API de ARCA."
          vertical={afipActivo}
        >
          <div className="flex items-center justify-between w-full">
            {afipActivo && <div className="hidden sm:block" />}
            <Controller
              control={control}
              name="afipActivo"
              render={({ field }) => (
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
          </div>

          {afipActivo && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-5 mt-5 border-t border-neutral-100 dark:border-neutral-800/60 w-full animate-in fade-in slide-in-from-top-2 duration-300">
              
              <div className="space-y-3">
                <label className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">Modo de Facturación</label>
                <Controller
                  control={control}
                  name="afipModoFacturacion"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="input-afipModoFacturacion" className={`w-full ${errors.afipModoFacturacion ? 'border-red-500 focus:ring-red-500' : ''}`}>
                        <SelectValue placeholder="Seleccionar modo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="AUTOMATICO">Automático (Al cobrar)</SelectItem>
                        <SelectItem value="MANUAL">Manual (Botón de facturar)</SelectItem>
                        <SelectItem value="DESACTIVADO">Desactivado</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.afipModoFacturacion && <p className="text-sm text-red-500">{errors.afipModoFacturacion.message}</p>}
              </div>

              <div className="space-y-3">
                <label className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">Punto de Venta</label>
                <Input
                  id="input-afipPuntoVenta"
                  type="number"
                  {...register('afipPuntoVenta')}
                  className={errors.afipPuntoVenta ? 'border-red-500 focus-visible:ring-red-500' : ''}
                  placeholder="Ej: 1"
                />
                {errors.afipPuntoVenta && <p className="text-sm text-red-500">{errors.afipPuntoVenta.message}</p>}
              </div>

              {/* Subida de Certificados */}
              <div className="md:col-span-2 pt-4 space-y-4">
                <h3 className="text-lg font-semibold text-neutral-800 dark:text-neutral-200">Certificados Digitales</h3>
                <p className="text-sm text-neutral-500">Sube tu certificado .crt y llave privada generados para la facturación electrónica.</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Certificado */}
                  <div className="border border-dashed border-neutral-300 dark:border-neutral-700 rounded-xl p-6 flex flex-col items-center justify-center text-center hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-colors relative">
                    <input 
                      type="file" 
                      accept=".crt,.pem" 
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                      onChange={(e) => {
                        if (e.target.files && e.target.files.length > 0) {
                          setCertificadoFile(e.target.files[0]);
                        }
                      }}
                    />
                    {certificadoFile ? (
                      <div className="flex flex-col items-center text-brand-green">
                        <CheckCircle2 className="w-8 h-8 mb-2" />
                        <span className="font-medium text-sm truncate max-w-[200px]">{certificadoFile.name}</span>
                        <span className="text-xs text-neutral-500 mt-1">Listo para guardar</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center text-neutral-500">
                        <UploadCloud className="w-8 h-8 mb-2 text-brand-blue" />
                        <span className="font-medium text-sm text-neutral-700 dark:text-neutral-300">Subir Certificado (.crt)</span>
                        <span className="text-xs mt-1">Arrastra o haz clic aquí</span>
                      </div>
                    )}
                  </div>

                  {/* Llave Privada */}
                  <div className="border border-dashed border-neutral-300 dark:border-neutral-700 rounded-xl p-6 flex flex-col items-center justify-center text-center hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-colors relative">
                    <input 
                      type="file" 
                      accept=".key" 
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                      onChange={(e) => {
                        if (e.target.files && e.target.files.length > 0) {
                          setLlaveFile(e.target.files[0]);
                        }
                      }}
                    />
                    {llaveFile ? (
                      <div className="flex flex-col items-center text-brand-green">
                        <CheckCircle2 className="w-8 h-8 mb-2" />
                        <span className="font-medium text-sm truncate max-w-[200px]">{llaveFile.name}</span>
                        <span className="text-xs text-neutral-500 mt-1">Listo para guardar</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center text-neutral-500">
                        <UploadCloud className="w-8 h-8 mb-2 text-brand-blue" />
                        <span className="font-medium text-sm text-neutral-700 dark:text-neutral-300">Subir Llave Privada (.key)</span>
                        <span className="text-xs mt-1">Arrastra o haz clic aquí</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </SettingItem>
      </div>
    </form>
  );
}
