"use client";

import React, { useState, Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { Button } from "@/shared/ui/forms/button";
import { Label } from "@/shared/ui/forms/label";
import { PasswordInput } from "@/shared/ui/forms/password-input";
import { Spinner } from "@/shared/ui/feedback/spinner";
import { AuthApi } from "@/domains/auth/api/auth.api";
import { useUIStore } from "@/shared/store/useUIStore";

import { AuthFormWrapper, animateFormError } from "../_components/auth-form-wrapper";
import { AuthHeader } from "../_components/auth-header";

const resetSchema = z.object({
  password: z.string()
    .min(8, "La contraseña debe tener al menos 8 caracteres")
    .regex(/^[a-zA-Z0-9]+$/, "Debe ser estrictamente alfanumérica"),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

type ResetFormValues = z.infer<typeof resetSchema>;

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const setProcessing = useUIStore((state) => state.setProcessing);

  useEffect(() => {
    if (!token) {
      toast.error("Enlace inválido", { description: "Falta el token de seguridad. Redirigiendo al login..." });
      router.push("/login");
    }
  }, [token, router]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetFormValues>({
    resolver: zodResolver(resetSchema),
    mode: "onChange",
  });

  const onSubmit = async (data: ResetFormValues) => {
    if (!token) return;
    
    try {
      setIsLoading(true);
      setProcessing(true);
      await AuthApi.resetPassword({ token, newPassword: data.password });
      setIsSuccess(true);
      toast.success("Contraseña actualizada", { description: "Ya puedes iniciar sesión con tu nueva contraseña." });
      setTimeout(() => router.push("/login"), 3000);
    } catch (error: any) {
      toast.error("Error", {
        description: error.message || "El enlace pudo haber expirado.",
      });
      animateFormError();
      if (error.status === 400) {
        setTimeout(() => router.push("/login"), 2000);
      }
    } finally {
      setIsLoading(false);
      setProcessing(false);
    }
  };

  if (!token) return null;

  return (
    <AuthFormWrapper>
      <AuthHeader 
        title="Nueva contraseña" 
        description="Establece una nueva contraseña para tu cuenta." 
        backUrl="/login" 
      />

      {isSuccess ? (
        <div className="form-element bg-blue-50 border border-blue-100 p-6 rounded-2xl text-center">
          <p className="text-blue-800 font-medium mb-2">¡Todo listo!</p>
          <p className="text-blue-600 text-sm mb-6">
            Redirigiéndote al inicio de sesión...
          </p>
        </div>
      ) : (
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit, () => animateFormError())}>
          <div className="form-element space-y-2">
            <Label htmlFor="password">Nueva contraseña</Label>
            <PasswordInput 
              id="password" 
              placeholder="••••••••" 
              {...register("password")}
              disabled={isLoading}
            />
            {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
          </div>

          <div className="form-element space-y-2">
            <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
            <PasswordInput 
              id="confirmPassword" 
              placeholder="••••••••" 
              {...register("confirmPassword")}
              disabled={isLoading}
            />
            {errors.confirmPassword && <p className="text-xs text-red-500">{errors.confirmPassword.message}</p>}
          </div>

          <div className="form-element pt-4">
            <Button type="submit" className="w-full h-11 text-base" disabled={isLoading}>
              {isLoading ? <Spinner size="sm" className="mr-2" /> : null}
              Guardar contraseña
            </Button>
          </div>
        </form>
      )}
    </AuthFormWrapper>
  );
}

/**
 * ResetPasswordPage
 * 
 * Interfaz donde el usuario introduce su nueva contraseña tras haber hecho clic en el enlace
 * de recuperación enviado por correo. Valida la existencia de un token en la URL y lo
 * envía al backend. Utiliza Suspense para el manejo seguro de los query params.
 */
export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="flex justify-center w-full"><Spinner /></div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
