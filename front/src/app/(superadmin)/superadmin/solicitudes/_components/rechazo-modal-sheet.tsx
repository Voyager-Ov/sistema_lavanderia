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
import { Textarea } from "@/shared/ui/forms/textarea";

interface RechazoModalSheetProps {
  selectedSolicitud: any;
  motivoInput: string;
  setMotivoInput: (v: string) => void;
  processing: boolean;
  onConfirmRechazo: () => void;
  onClose: () => void;
}

export function RechazoModalSheet({
  selectedSolicitud,
  motivoInput,
  setMotivoInput,
  processing,
  onConfirmRechazo,
  onClose
}: RechazoModalSheetProps) {
  if (!selectedSolicitud) return null;

  return (
    <ResponsiveSheet open={!!selectedSolicitud} onOpenChange={onClose}>
      <ResponsiveSheetContent side="right" className="w-full sm:max-w-md">
        <ResponsiveSheetHeader>
          <ResponsiveSheetTitle>Rechazar Solicitud de Registro</ResponsiveSheetTitle>
          <ResponsiveSheetDescription>
            Solicitante: {selectedSolicitud.nombreSolicitante} ({selectedSolicitud.nombreNegocio})
          </ResponsiveSheetDescription>
        </ResponsiveSheetHeader>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-foreground">
              Motivo del Rechazo
            </label>
            <Textarea
              rows={4}
              value={motivoInput}
              onChange={(e) => setMotivoInput(e.target.value)}
              placeholder="Explica el motivo del rechazo para notificar por email..."
            />
          </div>

          <div className="pt-4 flex gap-3">
            <Button 
              variant="destructive" 
              className="flex-1" 
              onClick={onConfirmRechazo} 
              disabled={processing}
            >
              {processing ? "Procesando..." : "Confirmar Rechazo"}
            </Button>
            <Button variant="outline" onClick={onClose} disabled={processing}>
              Cancelar
            </Button>
          </div>
        </div>
      </ResponsiveSheetContent>
    </ResponsiveSheet>
  );
}
