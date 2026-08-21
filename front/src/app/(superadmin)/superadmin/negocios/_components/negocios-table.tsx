"use client";

import React from "react";
import { Settings2, Power, Image as ImageIcon, HardDrive } from "lucide-react";
import { Card, CardContent } from "@/shared/ui/data-display/card";
import { Badge } from "@/shared/ui/data-display/badge";
import { Button } from "@/shared/ui/forms/button";

interface NegociosTableProps {
  negocios: any[];
  onOpenCuotas: (negocio: any) => void;
  onToggleStatus: (id: number, currentStatus: boolean) => void;
}

export function NegociosTable({ negocios, onOpenCuotas, onToggleStatus }: NegociosTableProps) {
  return (
    <Card>
      <CardContent className="p-0 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted text-muted-foreground uppercase text-[11px] font-bold tracking-wider border-b border-border">
            <tr>
              <th className="py-3.5 px-6">Negocio / Subdominio</th>
              <th className="py-3.5 px-6">CUIT & Razón Social</th>
              <th className="py-3.5 px-6">Estado Servicio</th>
              <th className="py-3.5 px-6">Límites Storage</th>
              <th className="py-3.5 px-6 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {negocios.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-muted-foreground text-sm">
                  No hay negocios registrados actualmente.
                </td>
              </tr>
            ) : (
              negocios.map((neg: any) => (
                <tr key={neg.id} className="hover:bg-muted/40 transition-colors">
                  <td className="py-4 px-6">
                    <div className="font-bold text-foreground">{neg.nombre}</div>
                    <div className="text-xs text-blue-500 font-mono">{neg.subdominio}.lavanderia.com</div>
                  </td>
                  <td className="py-4 px-6 text-xs">
                    <div className="font-medium text-foreground">{neg.razonSocial || neg.nombre}</div>
                    <div className="text-muted-foreground font-mono">CUIT: {neg.cuit || "Sin registrar"}</div>
                  </td>
                  <td className="py-4 px-6">
                    {neg.activo ? (
                      <Badge variant="success">Activo</Badge>
                    ) : (
                      <Badge variant="destructive">Suspendido</Badge>
                    )}
                  </td>
                  <td className="py-4 px-6 text-xs">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1 font-semibold text-foreground">
                        <ImageIcon size={14} className="text-blue-500" />
                        {neg.maxImagenes || 50} fotos
                      </div>
                      <div className="flex items-center gap-1 font-semibold text-foreground">
                        <HardDrive size={14} className="text-purple-500" />
                        {neg.maxStorageGB || 1.0} GB
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onOpenCuotas(neg)}
                        title="Editar Límites y Cuotas"
                      >
                        <Settings2 size={16} />
                      </Button>

                      <Button
                        size="sm"
                        variant={neg.activo ? "outlineRed" : "outlineGreen"}
                        onClick={() => onToggleStatus(neg.id, neg.activo)}
                        title={neg.activo ? "Suspender Servicio" : "Reactivar Servicio"}
                      >
                        <Power size={16} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
