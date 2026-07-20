"use client";

import React, { useState } from "react";
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
import { Spinner } from "@/shared/ui/feedback/spinner";
import { AuthApi } from "@/domains/auth/api/auth.api";

import { useUIStore } from "@/shared/store/useUIStore";

import { AuthFormWrapper, animateFormError } from "../_components/auth-form-wrapper";
import { AuthHeader } from "../_components/auth-header";

const registerSchema = z.object({
  nombre: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  email: z.string().email("Ingresa un correo electrónico válido"),
  password: z.string()
    .min(8, "La contraseña debe tener al menos 8 caracteres")
    .regex(/^[a-zA-Z0-9]+$/, "Debe ser estrictamente alfanumérica (solo letras y números, sin símbolos)"),
  negocioNombre: z.string().min(2, "El nombre del negocio es obligatorio"),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

/**
 * RegisterPage
 * 
 * Interfaz para la creación de nuevas cuentas de administradores de negocio.
 * Tras un registro exitoso, el usuario es redirigido a la verificación de correo electrónico.
 */
export default function RegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const setProcessing = useUIStore((state) => state.setProcessing);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    mode: "onChange",
  });

  const onSubmit = async (data: RegisterFormValues) => {
    try {
      setIsLoading(true);
      setProcessing(true);
      const res = await AuthApi.register({
        usuarioNombre: data.nombre,
        email: data.email,
        password: data.password,
        negocioNombre: data.negocioNombre,
        rol: "ADMIN",
      });
      
      if (res.data) {
        toast.success("¡Cuenta creada!", { description: "Revisa tu bandeja de entrada para verificar tu cuenta." });
        router.push(`/verify-email?email=${encodeURIComponent(data.email)}`);
      }
    } catch (error: any) {
      toast.error("Error al registrarse", {
        description: error.message || "Hubo un problema al crear tu cuenta",
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
        title="Crear una cuenta" 
        description="Únete a la plataforma central para llevar el control total." 
        backUrl="/login" 
      />

      <form className="space-y-4" onSubmit={handleSubmit(onSubmit, () => animateFormError())}>
        <div className="form-element space-y-2">
          <Label htmlFor="nombre">Nombre completo</Label>
          <Input 
            id="nombre" 
            type="text" 
            placeholder="Tu nombre" 
            {...register("nombre")}
            disabled={isLoading}
          />
          {errors.nombre && <p className="text-xs text-red-500">{errors.nombre.message}</p>}
        </div>

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
          <Label htmlFor="negocioNombre">Nombre de tu lavandería</Label>
          <Input 
            id="negocioNombre" 
            type="text" 
            placeholder="Ej: Lavandería Burbujas" 
            {...register("negocioNombre")}
            disabled={isLoading}
          />
          {errors.negocioNombre && <p className="text-xs text-red-500">{errors.negocioNombre.message}</p>}
        </div>

        <div className="form-element space-y-2">
          <Label htmlFor="password">Crea tu contraseña</Label>
          <PasswordInput 
            id="password" 
            placeholder="••••••••" 
            {...register("password")}
            disabled={isLoading}
          />
          {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
        </div>

        <div className="form-element pt-4">
          <Button type="submit" className="w-full h-11 text-base" disabled={isLoading}>
            {isLoading ? <Spinner size="sm" className="mr-2" /> : null}
            Crear cuenta
          </Button>
        </div>
      </form>

      <div className="form-element mt-8 text-center text-sm text-gray-500">
        ¿Ya tienes una cuenta?{" "}
        <Link href="/login" className="text-blue-600 font-medium hover:underline transition-colors">
          Inicia sesión
        </Link>
      </div>
    </AuthFormWrapper>
  );
}
