'use client';

import React from 'react';
import { User, Shield } from 'lucide-react';
import { Input } from '@/shared/ui/forms/input';
import { Button } from '@/shared/ui/forms/button';

export default function PerfilPage() {
  return (
    <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-2">
        <h2 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50 flex items-center gap-3">
          <span className="bg-brand-blue/10 p-2 rounded-xl">
            <User className="w-7 h-7 text-brand-blue" />
          </span>
          Mi Perfil
        </h2>
        <p className="mt-3 text-[15px] text-neutral-500 dark:text-neutral-400 max-w-lg leading-relaxed">
          Administra tu información personal y credenciales de acceso al sistema.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="rounded-2xl border border-neutral-200 bg-white shadow-md dark:border-neutral-800 dark:bg-neutral-900/50 p-6 md:p-8 space-y-6 flex flex-col">
          <h3 className="text-xl font-bold text-neutral-900 dark:text-neutral-50 flex items-center gap-2 border-b border-neutral-100 dark:border-neutral-800 pb-4">
            <User className="w-5 h-5 text-neutral-400" />
            Datos Personales
          </h3>
          
          <div className="space-y-5 flex-1">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">Nombre Completo</label>
              <Input placeholder="Tu nombre" className="h-11 rounded-xl" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">Correo Electrónico</label>
              <Input type="email" placeholder="tu@email.com" className="h-11 rounded-xl" />
            </div>
          </div>

          <div className="pt-6 flex justify-end">
            <Button className="font-bold rounded-xl px-6">Guardar Datos</Button>
          </div>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white shadow-md dark:border-neutral-800 dark:bg-neutral-900/50 p-6 md:p-8 space-y-6 flex flex-col">
          <h3 className="text-xl font-bold text-neutral-900 dark:text-neutral-50 flex items-center gap-2 border-b border-neutral-100 dark:border-neutral-800 pb-4">
            <Shield className="w-5 h-5 text-neutral-400" />
            Seguridad
          </h3>
          
          <div className="space-y-5 flex-1">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">Contraseña Actual</label>
              <Input type="password" placeholder="••••••••" className="h-11 rounded-xl" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">Nueva Contraseña</label>
              <Input type="password" placeholder="••••••••" className="h-11 rounded-xl" />
            </div>
          </div>

          <div className="pt-6 flex justify-end">
            <Button className="font-bold rounded-xl px-6" variant="outline">Actualizar Contraseña</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
