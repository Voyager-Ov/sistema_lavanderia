"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { Button } from "@/shared/ui/forms/button";
import { Input } from "@/shared/ui/forms/input";
import { Label } from "@/shared/ui/forms/label";
import { PasswordInput } from "@/shared/ui/forms/password-input";
import { Separator } from "@/shared/ui/layout/separator";
import { Spinner } from "@/shared/ui/feedback/spinner";
import { AuthApi } from "@/domains/auth/api/auth.api";
import { useAuthStore } from "@/shared/store/useAuthStore";
import { useUIStore } from "@/shared/store/useUIStore";

import { AuthFormWrapper, animateFormError } from "../_components/auth-form-wrapper";
import { AuthHeader } from "../_components/auth-header";
import { GoogleAuthButton } from "../_components/google-auth-button";

const loginSchema = z.object({
  email: z.string().email("Ingresa un correo electrónico válido"),
  password: z.string().min(1, "La contraseña es obligatoria"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

/**
 * LoginPage
 * 
 * Página principal de autenticación. Permite a los usuarios acceder al sistema
 * mediante correo y contraseña, o mediante Google OAuth.
 * Si el usuario no ha verificado su correo, será redirigido a `/verify-email`.
 */
export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  const setProcessing = useUIStore((state) => state.setProcessing);
  const [isLoading, setIsLoading] = useState(false);
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('expired') === 'true') {
        toast.error("Sesión expirada", { description: "Tu sesión ha caducado. Por favor, vuelve a iniciar sesión." });
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, []);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    mode: "onChange",
  });

  const onSubmit = async (data: LoginFormValues) => {
    try {
      setIsLoading(true);
      setProcessing(true);
      const res = await AuthApi.login(data);
      if (res.data) {
        setAuth(res.data.usuario, res.data.token);
        toast.success("¡Bienvenido!", { description: "Has iniciado sesión exitosamente." });
        
        const rol = res.data.usuario.rol?.toLowerCase() || "";
        if (rol.includes("admin")) {
          router.push("/admin/dashboard");
        } else {
          router.push("/pos/pedidos");
        }
      }
    } catch (error: any) {
      const errorMsg = error.message;
      
      // Si el backend dice que no está verificado, redirigir
      if (errorMsg?.includes("verificar tu email") || errorMsg?.includes("verificado")) {
        toast.warning("Cuenta no verificada", { description: "Te hemos redirigido para que verifiques tu correo." });
        router.push(`/verify-email?email=${encodeURIComponent(data.email)}`);
        return;
      }

      toast.error("Error al iniciar sesión", {
        description: errorMsg || "Verifica tus credenciales",
      });
      animateFormError();
    } finally {
      setIsLoading(false);
      setProcessing(false);
    }
  };

  return (
    <AuthFormWrapper>
      <AuthHeader 
        title="Iniciar sesión" 
        description="Accede a tus tareas, métricas y proyectos en un solo lugar." 
      />

      <form className="space-y-5" onSubmit={handleSubmit(onSubmit, () => animateFormError())}>
        <div className="form-element space-y-2">
          <Label htmlFor="email">Tu email</Label>
          <Input 
            id="email" 
            type="email" 
            placeholder="nombre@empresa.com" 
            {...register("email")}
            disabled={isLoading}
          />
          {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
        </div>

        <div className="form-element space-y-2">
          <div className="flex justify-between items-center">
            <Label htmlFor="password">Contraseña</Label>
            <Link href="/forgot-password" className="text-xs text-blue-600 hover:underline">
              ¿Olvidaste tu contraseña?
            </Link>
          </div>
          <PasswordInput 
            id="password" 
            placeholder="••••••••" 
            {...register("password")}
            disabled={isLoading}
          />
          {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
        </div>

        <div className="form-element pt-2">
          <Button type="submit" className="w-full h-11 text-base" disabled={isLoading}>
            {isLoading ? <Spinner size="sm" className="mr-2" /> : null}
            Ingresar
          </Button>
        </div>
      </form>

      <div className="form-element relative my-8">
        <div className="absolute inset-0 flex items-center">
          <Separator />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-3 text-gray-400 font-medium tracking-wider">o continúa con</span>
        </div>
      </div>

      <div className="form-element flex justify-center w-full">
        <GoogleAuthButton disabled={isLoading} />
      </div>

      <div className="form-element mt-8 text-center text-sm text-gray-500">
        ¿Aún no tienes una cuenta?{" "}
        <Link href="/register" className="text-blue-600 font-medium hover:underline transition-colors">
          Regístrate
        </Link>
      </div>
    </AuthFormWrapper>
  );
}
