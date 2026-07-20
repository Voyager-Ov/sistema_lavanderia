"use client";

import React, { useState } from "react";
import Link from "next/link";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { Button } from "@/shared/ui/forms/button";
import { Input } from "@/shared/ui/forms/input";
import { Label } from "@/shared/ui/forms/label";
import { Spinner } from "@/shared/ui/feedback/spinner";
import { AuthApi } from "@/domains/auth/api/auth.api";
import { useUIStore } from "@/shared/store/useUIStore";

import { AuthFormWrapper, animateFormError } from "../_components/auth-form-wrapper";
import { AuthHeader } from "../_components/auth-header";

const forgotSchema = z.object({
  email: z.string().email("Ingresa un correo electrónico válido"),
});

type ForgotFormValues = z.infer<typeof forgotSchema>;

/**
 * ForgotPasswordPage
 * 
 * Permite a los usuarios solicitar un enlace de restablecimiento de contraseña.
 * Tras un envío exitoso, muestra un mensaje de confirmación sin revelar si
 * el correo realmente existe (para prevenir enumeración de usuarios).
 */
export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const setProcessing = useUIStore((state) => state.setProcessing);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotFormValues>({
    resolver: zodResolver(forgotSchema),
    mode: "onChange",
  });

  const onSubmit = async (data: ForgotFormValues) => {
    try {
      setIsLoading(true);
      setProcessing(true);
      await AuthApi.forgotPassword(data.email);
      setIsSuccess(true);
      toast.success("Correo enviado", { description: "Revisa tu bandeja de entrada o spam." });
    } catch (error: any) {
      toast.error("Error", {
        description: error.message || "No se pudo procesar la solicitud.",
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
        title="Recuperar acceso" 
        description="Te enviaremos un enlace para que crees una nueva contraseña." 
        backUrl="/login" 
      />

      {isSuccess ? (
        <div className="form-element bg-green-50 border border-green-100 p-6 rounded-2xl text-center">
          <p className="text-green-800 font-medium mb-2">¡Revisa tu correo!</p>
          <p className="text-green-600 text-sm mb-6">
            Hemos enviado las instrucciones para restablecer tu contraseña.
          </p>
          <Button variant="outline" className="w-full" onClick={() => setIsSuccess(false)}>
            Intentar con otro correo
          </Button>
        </div>
      ) : (
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit, () => animateFormError())}>
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

          <div className="form-element pt-4">
            <Button type="submit" className="w-full h-11 text-base" disabled={isLoading}>
              {isLoading ? <Spinner size="sm" className="mr-2" /> : null}
              Enviar enlace
            </Button>
          </div>
        </form>
      )}

      <div className="form-element mt-8 text-center text-sm text-gray-500">
        ¿Recordaste tu contraseña?{" "}
        <Link href="/login" className="text-blue-600 font-medium hover:underline transition-colors">
          Vuelve a iniciar sesión
        </Link>
      </div>
    </AuthFormWrapper>
  );
}
