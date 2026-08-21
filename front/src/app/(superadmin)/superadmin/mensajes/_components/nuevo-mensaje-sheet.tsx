"use client";

import React from "react";
import { 
  ResponsiveSheet, 
  ResponsiveSheetContent, 
  ResponsiveSheetHeader, 
  ResponsiveSheetTitle, 
  ResponsiveSheetDescription 
} from "@/shared/ui/overlays/responsive-sheet";
import { Button } from "@/shared/ui/forms/button";
import { Input } from "@/shared/ui/forms/input";
import { Textarea } from "@/shared/ui/forms/textarea";

interface NuevoMensajeSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nuevoTitulo: string;
  setNuevoTitulo: (v: string) => void;
  nuevoContenido: string;
  setNuevoContenido: (v: string) => void;
  nuevoTipo: "INFO" | "WARNING" | "URGENT" | "MAINTENANCE";
  setNuevoTipo: (v: "INFO" | "WARNING" | "URGENT" | "MAINTENANCE") => void;
  nuevoNegocioId: string;
  setNuevoNegocioId: (v: string) => void;
  publicando: boolean;
  onPublicar: () => void;
}

export function NuevoMensajeSheet({
  open,
  onOpenChange,
  nuevoTitulo,
  setNuevoTitulo,
  nuevoContenido,
  setNuevoContenido,
  nuevoTipo,
  setNuevoTipo,
  nuevoNegocioId,
  setNuevoNegocioId,
  publicando,
  onPublicar
}: NuevoMensajeSheetProps) {
  return (
    <ResponsiveSheet open={open} onOpenChange={onOpenChange}>
      <ResponsiveSheetContent side="right" className="w-full sm:max-w-md">
        <ResponsiveSheetHeader>
          <ResponsiveSheetTitle>Publicar Anuncio Broadcast</ResponsiveSheetTitle>
          <ResponsiveSheetDescription>
            Emitir aviso o notificación para los paneles de administración de los negocios
          </ResponsiveSheetDescription>
        </ResponsiveSheetHeader>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 text-foreground">
              Título del Anuncio
            </label>
            <Input
              value={nuevoTitulo}
              onChange={(e) => setNuevoTitulo(e.target.value)}
              placeholder="Ej: Mantenimiento Programado del Servidor"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 text-foreground">
              Tipo / Severidad
            </label>
            <select
              value={nuevoTipo}
              onChange={(e) => setNuevoTipo(e.target.value as any)}
              className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:border-blue-500"
            >
              <option value="INFO">INFORMACIÓN (Azul)</option>
              <option value="WARNING">ADVERTENCIA (Amarillo)</option>
              <option value="URGENT">URGENTE (Rojo)</option>
              <option value="MAINTENANCE">MANTENIMIENTO (Púrpura)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 text-foreground">
              Alcance / Negocio Específico (Opcional)
            </label>
            <Input
              value={nuevoNegocioId}
              onChange={(e) => setNuevoNegocioId(e.target.value)}
              placeholder="Dejar vacío para TODOS los negocios, o ingresar ID"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 text-foreground">
              Mensaje / Contenido
            </label>
            <Textarea
              rows={4}
              value={nuevoContenido}
              onChange={(e) => setNuevoContenido(e.target.value)}
              placeholder="Detalle del anuncio..."
            />
          </div>

          <div className="pt-4 flex gap-3">
            <Button
              className="flex-1"
              onClick={onPublicar}
              disabled={publicando || !nuevoTitulo.trim() || !nuevoContenido.trim()}
            >
              {publicando ? "Publicando..." : "Publicar Anuncio"}
            </Button>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
          </div>
        </div>
      </ResponsiveSheetContent>
    </ResponsiveSheet>
  );
}
