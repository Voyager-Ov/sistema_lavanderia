"use client";

import React, { useState } from "react";
import { Bell, ShieldAlert, Clock, HardDrive, CheckCircle2, ArrowRight } from "lucide-react";
import { Card, CardHeader, CardContent } from "@/shared/ui/data-display/card";
import { Badge } from "@/shared/ui/data-display/badge";
import { Button } from "@/shared/ui/forms/button";
import { safeFormatDate } from "@/shared/lib/utils";
import Link from "next/link";

interface NotificationsFeedCardProps {
  notifications: any[];
}

export function NotificationsFeedCard({ notifications }: NotificationsFeedCardProps) {
  const [filter, setFilter] = useState<"ALL" | "SOLICITUD" | "SEGURIDAD" | "ALMACENAMIENTO">("ALL");

  const filteredNotifications = notifications.filter((item) => {
    if (filter === "ALL") return true;
    return item.tipo === filter;
  });

  return (
    <Card className="border border-border">
      <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-border">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-blue-500/10 rounded-xl text-blue-500">
            <Bell size={20} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground tracking-tight">
              Centro de Notificaciones & Alertas Centrales
            </h2>
            <p className="text-xs text-muted-foreground">
              Eventos prioritarios, solicitudes de permisos y alertas de seguridad del sistema
            </p>
          </div>
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap gap-1.5 bg-muted p-1 rounded-xl">
          <button
            onClick={() => setFilter("ALL")}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
              filter === "ALL"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Todas ({notifications.length})
          </button>
          <button
            onClick={() => setFilter("SOLICITUD")}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
              filter === "SOLICITUD"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Solicitudes
          </button>
          <button
            onClick={() => setFilter("SEGURIDAD")}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
              filter === "SEGURIDAD"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Seguridad
          </button>
          <button
            onClick={() => setFilter("ALMACENAMIENTO")}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
              filter === "ALMACENAMIENTO"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Almacenamiento
          </button>
        </div>
      </CardHeader>

      <CardContent className="p-0 divide-y divide-border">
        {filteredNotifications.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground text-xs font-medium">
            <CheckCircle2 size={32} className="mx-auto mb-2 text-emerald-500 opacity-80" />
            No hay alertas ni notificaciones pendientes en esta categoría.
          </div>
        ) : (
          filteredNotifications.map((item) => (
            <div
              key={item.id}
              className="p-4 sm:p-5 flex flex-col sm:flex-row items-start justify-between gap-4 hover:bg-muted/30 transition-colors"
            >
              <div className="flex items-start gap-3.5">
                <div className="mt-0.5">
                  {item.tipo === "SOLICITUD" && (
                    <div className="p-2 bg-amber-500/10 text-amber-500 rounded-xl">
                      <Clock size={18} />
                    </div>
                  )}
                  {item.tipo === "SEGURIDAD" && (
                    <div className="p-2 bg-red-500/10 text-red-500 rounded-xl">
                      <ShieldAlert size={18} />
                    </div>
                  )}
                  {item.tipo === "ALMACENAMIENTO" && (
                    <div className="p-2 bg-purple-500/10 text-purple-500 rounded-xl">
                      <HardDrive size={18} />
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-foreground text-sm">{item.titulo}</span>
                    {item.nivel === "URGENT" && <Badge variant="destructive">URGENTE</Badge>}
                    {item.nivel === "WARNING" && <Badge variant="warning">ADVERTENCIA</Badge>}
                    {item.nivel === "INFO" && <Badge variant="secondary">INFO</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{item.mensaje}</p>
                  <div className="text-[11px] text-muted-foreground font-mono">
                    {safeFormatDate(item.fecha, "dd/MM/yyyy HH:mm:ss")}
                  </div>
                </div>
              </div>

              {/* Botón de acción directa */}
              <div className="self-end sm:self-center shrink-0">
                {item.tipo === "SOLICITUD" && (
                  <Link href="/superadmin/solicitudes">
                    <Button size="sm" variant="outline">
                      Gestionar <ArrowRight size={14} className="ml-1" />
                    </Button>
                  </Link>
                )}
                {item.tipo === "ALMACENAMIENTO" && (
                  <Link href="/superadmin/negocios">
                    <Button size="sm" variant="outline">
                      Ajustar Cuota <ArrowRight size={14} className="ml-1" />
                    </Button>
                  </Link>
                )}
                {item.tipo === "SEGURIDAD" && (
                  <Link href="/superadmin/seguridad">
                    <Button size="sm" variant="outline">
                      Ver Logs <ArrowRight size={14} className="ml-1" />
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
