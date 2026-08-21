"use client";

import React from "react";
import { Card, CardContent } from "@/shared/ui/data-display/card";
import { Badge } from "@/shared/ui/data-display/badge";
import { Button } from "@/shared/ui/forms/button";

interface MensajesTableProps {
  mensajes: any[];
  onDesactivar: (id: number) => void;
}

export function MensajesTable({ mensajes, onDesactivar }: MensajesTableProps) {
  return (
    <Card>
      <CardContent className="p-0 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted text-muted-foreground uppercase text-[11px] font-bold tracking-wider border-b border-border">
            <tr>
              <th className="py-3.5 px-6">Título & Severidad</th>
              <th className="py-3.5 px-6">Contenido</th>
              <th className="py-3.5 px-6">Alcance</th>
              <th className="py-3.5 px-6">Estado</th>
              <th className="py-3.5 px-6 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {mensajes.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-muted-foreground text-sm">
                  No hay mensajes broadcast publicados.
                </td>
              </tr>
            ) : (
              mensajes.map((msg: any) => (
                <tr key={msg.id} className="hover:bg-muted/40 transition-colors">
                  <td className="py-4 px-6">
                    <div className="font-bold text-foreground">{msg.titulo}</div>
                    <div className="mt-1">
                      {msg.tipo === "INFO" && <Badge variant="secondary">INFO</Badge>}
                      {msg.tipo === "WARNING" && <Badge variant="warning">WARNING</Badge>}
                      {msg.tipo === "URGENT" && <Badge variant="destructive">URGENT</Badge>}
                      {msg.tipo === "MAINTENANCE" && <Badge variant="outline">MANTENIMIENTO</Badge>}
                    </div>
                  </td>
                  <td className="py-4 px-6 text-xs max-w-md text-foreground">
                    {msg.contenido}
                  </td>
                  <td className="py-4 px-6 text-xs font-mono text-foreground">
                    {msg.negocioId ? `Negocio ID: ${msg.negocioId}` : "TODOS LOS TENANTS"}
                  </td>
                  <td className="py-4 px-6">
                    {msg.activo ? <Badge variant="success">ACTIVO</Badge> : <Badge variant="destructive">INACTIVO</Badge>}
                  </td>
                  <td className="py-4 px-6 text-right">
                    {msg.activo && (
                      <Button
                        size="sm"
                        variant="outlineRed"
                        onClick={() => onDesactivar(msg.id)}
                      >
                        Desactivar
                      </Button>
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
