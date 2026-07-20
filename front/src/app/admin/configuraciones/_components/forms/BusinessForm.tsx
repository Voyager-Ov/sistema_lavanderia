'use client';

import React, { useEffect, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useConfigStore } from '../../_store/useConfigStore';
import gsap from 'gsap';
import { toast } from 'sonner';

import { Input } from '@/shared/ui/forms/input';
import { SettingItem } from '../SettingItem';
import { actualizarConfiguracion } from '@/domains/configuracion/api';

const businessSchema = z.object({
  razonSocial: z.string().min(3, 'El nombre debe tener al menos 3 caracteres').nullable(),
  cuit: z.string().nullable(),
  direccion: z.string().min(5, 'La dirección es muy corta').nullable(),
  telefonoContacto: z.string().regex(/^\+?[\d\s-]{8,}$/, 'Formato de teléfono inválido').nullable(),
  simboloMoneda: z.string().min(1, 'La moneda es requerida'),
});

type BusinessFormValues = z.infer<typeof businessSchema>;

export default function BusinessForm() {
  const { businessConfig, setBusinessConfig, setIsDirty } = useConfigStore();
  const formRef = useRef<HTMLFormElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
  } = useForm<BusinessFormValues>({
    resolver: zodResolver(businessSchema),
    defaultValues: businessConfig,
    mode: 'onSubmit', // Validate on submit to show animations
  });

  // Keep global store in sync with local dirty state for navigation guard
  useEffect(() => {
    setIsDirty(isDirty);
  }, [isDirty, setIsDirty]);

  // Animate fields with errors on submit attempt
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

  const onSubmit = async (data: BusinessFormValues) => {
    try {
      await actualizarConfiguracion({
        razonSocial: data.razonSocial,
        cuit: data.cuit,
        direccion: data.direccion,
        telefonoContacto: data.telefonoContacto,
        simboloMoneda: data.simboloMoneda,
      });

      setBusinessConfig(data);
      reset(data); // reset makes isDirty false
      toast.success('Configuración actualizada correctamente');
    } catch (error: any) {
      toast.error(error.message || 'Error al actualizar configuración');
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
        <h2 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50 flex items-center gap-2">
          Información del Negocio
        </h2>
        <p className="mt-2 text-[15px] text-neutral-500 dark:text-neutral-400">
          Los detalles básicos de tu local. Esta información se utilizará en tickets, facturas y correos.
        </p>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <SettingItem
            title="Razón Social / Nombre"
            description="El nombre legal o de fantasía de tu negocio."
            vertical
          >
            <Input
              id="input-razonSocial"
              {...register('razonSocial')}
              placeholder="Ej. Lavandería Burbujas"
              className={errors.razonSocial ? 'border-red-500 focus-visible:ring-red-500' : ''}
            />
            {errors.razonSocial && <p className="text-sm font-medium text-red-500 mt-1">{errors.razonSocial.message}</p>}
          </SettingItem>

          <SettingItem
            title="CUIT"
            description="Clave Única de Identificación Tributaria."
            vertical
          >
            <Input
              id="input-cuit"
              {...register('cuit')}
              placeholder="Ej. 30-12345678-9"
              className={errors.cuit ? 'border-red-500 focus-visible:ring-red-500' : ''}
            />
            {errors.cuit && <p className="text-sm font-medium text-red-500 mt-1">{errors.cuit.message}</p>}
          </SettingItem>
        </div>

        <SettingItem
          title="Dirección Principal"
          description="Calle, número, localidad y código postal."
          vertical
        >
          <Input
            id="input-direccion"
            {...register('direccion')}
            placeholder="Ej. Av. Siempre Viva 123"
            className={errors.direccion ? 'border-red-500 focus-visible:ring-red-500' : ''}
          />
          {errors.direccion && <p className="text-sm font-medium text-red-500 mt-1">{errors.direccion.message}</p>}
        </SettingItem>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <SettingItem
            title="Teléfono de Contacto"
            description="Número principal, preferiblemente con WhatsApp."
            vertical
          >
            <Input
              id="input-telefonoContacto"
              {...register('telefonoContacto')}
              placeholder="+54 11 1234-5678"
              className={errors.telefonoContacto ? 'border-red-500 focus-visible:ring-red-500' : ''}
            />
            {errors.telefonoContacto && <p className="text-sm font-medium text-red-500 mt-1">{errors.telefonoContacto.message}</p>}
          </SettingItem>

          <SettingItem
            title="Símbolo Monetario"
            description="Símbolo monetario usado en todo el software."
            vertical
          >
            <Input
              id="input-simboloMoneda"
              {...register('simboloMoneda')}
              placeholder="Ej. $"
              className={`max-w-[150px] uppercase ${errors.simboloMoneda ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
            />
            {errors.simboloMoneda && <p className="text-sm font-medium text-red-500 mt-1">{errors.simboloMoneda.message}</p>}
          </SettingItem>
        </div>
      </div>
    </form>
  );
}
