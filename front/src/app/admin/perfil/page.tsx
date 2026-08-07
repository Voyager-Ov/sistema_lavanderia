'use client';

import React, { useState } from 'react';
import { User, Shield, Link2, Unlink, LogIn, Loader2 } from 'lucide-react';
import { Input } from '@/shared/ui/forms/input';
import { Button } from '@/shared/ui/forms/button';
import { useAuthStore } from '@/shared/store/useAuthStore';
import { useGoogleLogin } from '@react-oauth/google';
import { apiClient } from '@/shared/lib/api-client';
import { toast } from 'sonner';

export default function PerfilPage() {
  const { user, updateUser } = useAuthStore();
  const [isLinking, setIsLinking] = useState(false);
  const [isUnlinking, setIsUnlinking] = useState(false);

  // Link account handler
  const login = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        setIsLinking(true);
        await apiClient.post('/auth/google/link', { token: tokenResponse.access_token });
        updateUser({ googleLinked: true });
        toast.success("Cuenta de Google vinculada correctamente.");
      } catch (error: any) {
        toast.error(error.response?.data?.error || error.response?.data?.message || "Error al vincular cuenta de Google.");
      } finally {
        setIsLinking(false);
      }
    },
    onError: () => {
      toast.error('Ocurrió un error al intentar vincular con Google.');
    }
  });

  const handleUnlink = async () => {
    try {
      setIsUnlinking(true);
      await apiClient.post('/auth/google/unlink', {});
      updateUser({ googleLinked: false });
      toast.success("Cuenta de Google desvinculada.");
    } catch (error: any) {
      toast.error(error.response?.data?.error || error.response?.data?.message || "Error al desvincular cuenta de Google.");
    } finally {
      setIsUnlinking(false);
    }
  };

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
        {/* Datos Personales */}
        <div className="rounded-2xl border border-neutral-200 bg-white shadow-md dark:border-neutral-800 dark:bg-neutral-900/50 p-6 md:p-8 space-y-6 flex flex-col">
          <h3 className="text-xl font-bold text-neutral-900 dark:text-neutral-50 flex items-center gap-2 border-b border-neutral-100 dark:border-neutral-800 pb-4">
            <User className="w-5 h-5 text-neutral-400" />
            Datos Personales
          </h3>
          
          <div className="space-y-5 flex-1">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">Nombre Completo</label>
              <Input defaultValue={user?.nombre} placeholder="Tu nombre" className="h-11 rounded-xl" readOnly />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">Correo Electrónico</label>
              <Input type="email" defaultValue={user?.email} placeholder="tu@email.com" className="h-11 rounded-xl" readOnly />
            </div>
          </div>

          <div className="pt-6 flex justify-end">
            <Button className="font-bold rounded-xl px-6" disabled>Guardar Datos</Button>
          </div>
        </div>

        <div className="flex flex-col gap-8">
          {/* Seguridad */}
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

          {/* Cuentas Vinculadas */}
          <div className="rounded-2xl border border-neutral-200 bg-white shadow-md dark:border-neutral-800 dark:bg-neutral-900/50 p-6 md:p-8 space-y-4">
            <h3 className="text-xl font-bold text-neutral-900 dark:text-neutral-50 flex items-center gap-2 border-b border-neutral-100 dark:border-neutral-800 pb-4">
              <Link2 className="w-5 h-5 text-neutral-400" />
              Cuentas Vinculadas
            </h3>
            
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              Vincula tu cuenta de Google para poder iniciar sesión rápidamente.
            </p>

            <div className="pt-2">
              {user?.googleLinked ? (
                <div className="flex items-center justify-between p-4 border border-neutral-200 dark:border-neutral-700 rounded-xl bg-neutral-50 dark:bg-neutral-800/50">
                  <div className="flex items-center gap-3">
                    <svg className="w-6 h-6" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    <div>
                      <p className="font-semibold text-neutral-900 dark:text-neutral-50 text-sm">Google</p>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">Vinculada</p>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950 border-red-200"
                    onClick={handleUnlink}
                    disabled={isUnlinking}
                  >
                    {isUnlinking ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Unlink className="w-4 h-4 mr-2" />}
                    Desvincular
                  </Button>
                </div>
              ) : (
                <Button 
                  className="w-full font-bold h-12 rounded-xl bg-white text-neutral-700 border border-neutral-200 hover:bg-neutral-50 dark:bg-neutral-800 dark:text-neutral-200 dark:border-neutral-700 dark:hover:bg-neutral-700"
                  onClick={() => login()}
                  disabled={isLinking}
                >
                  {isLinking ? (
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  ) : (
                    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                  )}
                  {isLinking ? "Vinculando..." : "Vincular con Google"}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
