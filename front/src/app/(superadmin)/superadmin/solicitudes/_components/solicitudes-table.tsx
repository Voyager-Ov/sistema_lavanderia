"use client";

import React from "react";
import { Card, CardContent } from "@/shared/ui/data-display/card";
import { Badge } from "@/shared/ui/data-display/badge";
import { Button } from "@/shared/ui/forms/button";

interface SolicitudesTableProps {
  solicitudes: any[];
  processing: boolean;
  onAprobar: (id: number) => void;
  onOpenRechazo: (solicitud: any) => void;
}

export function SolicitudesTable({ solicitudes, processing, onAprobar, onOpenRechazo }: SolicitudesTableProps) {
  return (
    <Card>
      <CardContent className="p-0 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted text-muted-foreground uppercase text-[11px] font-bold tracking-wider border-b border-border">
            <tr>
              <th className="py-3.5 px-6">Solicitante / Email</th>
              <th className="py-3.5 px-6">Nombre Negocio</th>
              <th className="py-3.5 px-6">CUIT</th>
              <th className="py-3.5 px-6">Estado</th>
              <th className="py-3.5 px-6 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {solicitudes.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-muted-foreground text-sm">
                  No hay solicitudes registradas actualmente.
                </td>
              </tr>
            ) : (
              solicitudes.map((sol: any) => (
                <tr key={sol.id} className="hover:bg-muted/40 transition-colors">
                  <td className="py-4 px-6">
                    <div className="font-bold text-foreground">{sol.nombreSolicitante}</div>
                    <div className="text-xs text-muted-foreground font-mono">{sol.emailSolicitante}</div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="font-semibold text-foreground">{sol.nombreNegocio}</div>
                    <div className="text-xs text-blue-500 font-mono">{sol.subdominio}.lavanderia.com</div>
                  </td>
                  <td className="py-4 px-6 font-mono text-xs text-foreground">
                    {sol.cuit || "Sin especificar"}
                  </td>
                  <td className="py-4 px-6">
                    {sol.estado === "PENDIENTE" && <Badge variant="warning">PENDIENTE</Badge>}
                    {sol.estado === "APROBADO" && <Badge variant="success">APROBADO</Badge>}
                    {sol.estado === "RECHAZADO" && <Badge variant="destructive">RECHAZADO</Badge>}
                  </td>
                  <td className="py-4 px-6 text-right">
                    {sol.estado === "PENDIENTE" && (
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="success"
                          onClick={() => onAprobar(sol.id)}
                          disabled={processing}
                        >
                          Aprobar & Crear Schema
                        </Button>
                        <Button
                          size="sm"
                          variant="outlineRed"
                          onClick={() => onOpenRechazo(sol)}
                          disabled={processing}
                        >
                          Rechazar
                        </Button>
                      </div>
                    )}
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
