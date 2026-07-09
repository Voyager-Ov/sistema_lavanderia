"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { AuthApi } from "@/domains/auth/api/auth.api";

import { Button } from "@/shared/ui/forms/button";
import { Input } from "@/shared/ui/forms/input";
import { Spinner } from "@/shared/ui/feedback/spinner";
import { AuthFormWrapper, animateFormError } from "../_components/auth-form-wrapper";
import { AuthHeader } from "../_components/auth-header";

const verifySchema = z.object({
  token: z.string().min(1, "El código de verificación es requerido"),
});

type VerifyFormValues = z.infer<typeof verifySchema>;

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailParam = searchParams.get("email") || "";

  const [isLoading, setIsLoading] = useState(false);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<VerifyFormValues>({
    resolver: zodResolver(verifySchema),
    mode: "onChange",
  });

  const onVerify = async (data: VerifyFormValues) => {
    if (!emailParam) return toast.error("Email no encontrado en la URL.");

    try {
      setIsLoading(true);
      await AuthApi.verifyEmail({ email: emailParam, code: data.token });
      toast.success("¡Email verificado!", { description: "Ya puedes iniciar sesión en tu cuenta." });
      router.push("/login");
    } catch (error: any) {
      toast.error("Error al verificar", {
        description: error.data?.message || error.message || "Código inválido o expirado.",
      });
      animateFormError();
    } finally {
      setIsLoading(false);
    }
  };

  const onResend = async () => {
    if (!emailParam) return toast.error("Email no encontrado en la URL. Vuelve a iniciar sesión para reenviar.");

    try {
      setIsLoading(true);
      await AuthApi.resendVerification(emailParam);
      toast.success("Código reenviado", { description: "Revisa tu bandeja de entrada o spam." });
    } catch (error: any) {
      toast.error("Error", {
        description: error.data?.message || error.message || "No se pudo reenviar el código.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthFormWrapper>
      <AuthHeader 
        title="Verifica tu correo" 
        description={emailParam 
          ? `Ingresa el código que enviamos a ${emailParam}`
          : "Ingresa el código que enviamos a tu correo electrónico."
        }
        backUrl="/login" 
      />

      <form className="space-y-4" onSubmit={handleSubmit(onVerify, () => animateFormError())}>
        <div className="form-element space-y-2">
          <Input 
            {...register("token")}
            placeholder="Código de verificación" 
            disabled={isLoading}
            className="text-center text-lg tracking-widest uppercase font-mono h-12"
          />
          {errors.token && <p className="text-xs text-red-500 text-center">{errors.token.message}</p>}
        </div>

        <div className="form-element pt-4 flex flex-col space-y-2">
          <Button type="submit" className="w-full h-11 text-base" disabled={isLoading}>
            {isLoading ? <Spinner size="sm" className="mr-2" /> : null}
            Verificar cuenta
          </Button>
          
          {emailParam && (
            <Button 
              type="button" 
              variant="outline" 
              className="w-full h-11" 
              onClick={onResend}
              disabled={isLoading}
            >
              Reenviar código
            </Button>
          )}
        </div>
      </form>
    </AuthFormWrapper>
  );
}

/**
 * VerifyEmailPage
 * 
 * Permite a los usuarios verificar su correo electrónico ingresando un token.
 * Extrae automáticamente el email de la URL si proviene del registro para
 * facilitar el reenvío del código. Utiliza Suspense para procesar los query params.
 */
export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="flex justify-center w-full"><Spinner /></div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}
