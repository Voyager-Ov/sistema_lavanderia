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

interface CuotasModalSheetProps {
  selectedNegocio: any;
  maxImagenesInput: number;
  setMaxImagenesInput: (v: number) => void;
  maxStorageGBInput: number;
  setMaxStorageGBInput: (v: number) => void;
  saving: boolean;
  onSave: () => void;
  onClose: () => void;
}

export function CuotasModalSheet({
  selectedNegocio,
  maxImagenesInput,
  setMaxImagenesInput,
  maxStorageGBInput,
  setMaxStorageGBInput,
  saving,
  onSave,
  onClose
}: CuotasModalSheetProps) {
  if (!selectedNegocio) return null;

  return (
    <ResponsiveSheet open={!!selectedNegocio} onOpenChange={onClose}>
      <ResponsiveSheetContent side="right" className="w-full sm:max-w-md">
        <ResponsiveSheetHeader>
          <ResponsiveSheetTitle>Ajustar Límites & Cuotas</ResponsiveSheetTitle>
          <ResponsiveSheetDescription>
            Configuración de almacenamiento para {selectedNegocio.nombre}
          </ResponsiveSheetDescription>
        </ResponsiveSheetHeader>

        <div className="p-6 space-y-6">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-foreground">
              Límite Máximo de Imágenes
            </label>
            <Input
              type="number"
              min={1}
              value={maxImagenesInput}
              onChange={(e) => setMaxImagenesInput(parseInt(e.target.value, 10) || 1)}
              placeholder="Ej: 50"
            />
            <p className="text-[11px] text-muted-foreground mt-1">
              Cantidad de fotos de catálogo/servicios permitidas para este tenant.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-foreground">
              Límite Máximo de Storage (GB)
            </label>
            <Input
              type="number"
              step="0.1"
              min={0.1}
              value={maxStorageGBInput}
              onChange={(e) => setMaxStorageGBInput(parseFloat(e.target.value) || 0.1)}
              placeholder="Ej: 1.0"
            />
            <p className="text-[11px] text-muted-foreground mt-1">
              Capacidad máxima en gigabytes asignada en disco.
            </p>
          </div>

          <div className="pt-4 flex gap-3">
            <Button className="flex-1" onClick={onSave} disabled={saving}>
              {saving ? "Guardando..." : "Guardar Límites"}
            </Button>
            <Button variant="outline" onClick={onClose} disabled={saving}>
              Cancelar
            </Button>
          </div>
        </div>
      </ResponsiveSheetContent>
    </ResponsiveSheet>
  );
}
