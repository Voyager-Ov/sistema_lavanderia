"use client";

import React, { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ClockIcon, CheckCircle2Icon, XCircleIcon, StoreIcon, MailIcon, ArrowLeftIcon } from "lucide-react";
import { AuthFormWrapper } from "../_components/auth-form-wrapper";

function SolicitudPendienteContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";
  const negocio = searchParams.get("negocio") || "";
  const status = searchParams.get("status") || "PENDIENTE";
  const motivo = searchParams.get("motivo") || "";

  const isRechazado = status === "RECHAZADO";

  return (
    <div className="space-y-6 text-center">
      <div className="flex justify-center">
        {isRechazado ? (
          <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 border border-red-500/20">
            <XCircleIcon size={36} />
          </div>
        ) : (
          <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-400 border border-amber-500/20 animate-pulse">
            <ClockIcon size={36} />
          </div>
        )}
      </div>

      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">
          {isRechazado ? "Solicitud Rechazada" : "Solicitud en Revisión"}
        </h1>
        <p className="text-sm text-zinc-400 mt-2">
          {isRechazado
            ? "Tu solicitud de registro para abrir el negocio ha sido rechazada por el Super Admin."
            : "Tu solicitud de apertura de negocio está siendo evaluada por nuestro equipo de Super Admin."}
        </p>
      </div>

      <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5 text-left space-y-3">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <span className="text-xs text-zinc-400 flex items-center gap-1.5 font-medium">
            <StoreIcon size={14} className="text-blue-400" /> Negocio
          </span>
          <span className="text-sm font-semibold text-white">{negocio || "Nombre del negocio"}</span>
        </div>

        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <span className="text-xs text-zinc-400 flex items-center gap-1.5 font-medium">
            <MailIcon size={14} className="text-purple-400" /> Correo de contacto
          </span>
          <span className="text-xs text-zinc-300 font-mono">{email || "Sin correo"}</span>
        </div>

        <div className="flex items-center justify-between pt-1">
          <span className="text-xs text-zinc-400 font-medium">Estado de la solicitud</span>
          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
            isRechazado 
              ? "bg-red-500/10 text-red-400 border-red-500/20" 
              : "bg-amber-500/10 text-amber-400 border-amber-500/20"
          }`}>
            {isRechazado ? "Rechazada" : "Pendiente de Aprobación"}
          </span>
        </div>

        {isRechazado && motivo && (
          <div className="mt-3 p-3 bg-red-950/40 border border-red-800/40 rounded-lg text-xs text-red-300">
            <strong>Motivo:</strong> {motivo}
          </div>
        )}
      </div>

      <div className="p-4 bg-zinc-900/40 border border-zinc-800/60 rounded-xl text-xs text-zinc-400 leading-relaxed">
        {isRechazado
          ? "Si crees que esto es un error o deseas volver a ingresar tus datos, puedes contactarte con soporte."
          : "Una vez que el Super Admin apruebe la creación de tu negocio y el aprovisionamiento de tu base de datos, recibirás un correo electrónico de confirmación y podrás ingresar con tus credenciales."}
      </div>

      <div className="pt-2">
        <Link
          href="/login"
          className="inline-flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <ArrowLeftIcon size={16} /> Volver al Inicio de Sesión
        </Link>
      </div>
    </div>
  );
}

export default function SolicitudPendientePage() {
  return (
    <AuthFormWrapper>
      <Suspense fallback={<div className="text-center text-zinc-400 py-8">Cargando datos de la solicitud...</div>}>
        <SolicitudPendienteContent />
      </Suspense>
    </AuthFormWrapper>
  );
}
