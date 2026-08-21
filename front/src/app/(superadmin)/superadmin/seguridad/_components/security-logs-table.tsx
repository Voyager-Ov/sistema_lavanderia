"use client";

import React from "react";
import { Card, CardContent } from "@/shared/ui/data-display/card";
import { Badge } from "@/shared/ui/data-display/badge";
import { safeFormatDate } from "@/shared/lib/utils";

interface SecurityLogsTableProps {
  logs: any[];
}

export function SecurityLogsTable({ logs }: SecurityLogsTableProps) {
  return (
    <Card>
      <CardContent className="p-0 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted text-muted-foreground uppercase text-[11px] font-bold tracking-wider border-b border-border">
            <tr>
              <th className="py-3.5 px-6">Fecha & Hora</th>
              <th className="py-3.5 px-6">Evento / Acción</th>
              <th className="py-3.5 px-6">Usuario / IP</th>
              <th className="py-3.5 px-6">Severidad</th>
              <th className="py-3.5 px-6">Detalles</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {logs.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-muted-foreground text-sm">
                  No hay logs de seguridad registrados actualmente.
                </td>
              </tr>
            ) : (
              logs.map((log: any) => (
                <tr key={log.id} className="hover:bg-muted/40 transition-colors">
                  <td className="py-4 px-6 text-xs text-muted-foreground font-mono">
                    {safeFormatDate(log.createdAt || log.fechaHora, "dd/MM/yyyy HH:mm:ss")}
                  </td>
                  <td className="py-4 px-6 font-bold text-foreground">
                    {log.evento || log.tipoEvento || "Alerta de Seguridad"}
                  </td>
                  <td className="py-4 px-6 text-xs">
                    <div className="font-semibold text-foreground">{log.usuarioEmail || log.usuario || "Sistema"}</div>
                    <div className="text-muted-foreground font-mono">IP: {log.ip || "Interna"}</div>
                  </td>
                  <td className="py-4 px-6">
                    {log.nivel === "CRITICAL" && <Badge variant="destructive">CRÍTICO</Badge>}
                    {log.nivel === "WARNING" && <Badge variant="warning">ADVERTENCIA</Badge>}
                    {(!log.nivel || log.nivel === "INFO") && <Badge variant="secondary">INFO</Badge>}
                  </td>
                  <td className="py-4 px-6 text-xs text-foreground max-w-sm">
                    {log.descripcion || log.detalles || "Sin detalles"}
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
