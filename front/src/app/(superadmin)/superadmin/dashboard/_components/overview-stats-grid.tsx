"use client";

import React from "react";
import { Database, Server, Clock, Activity } from "lucide-react";
import { Card, CardHeader, CardContent } from "@/shared/ui/data-display/card";
import { Badge } from "@/shared/ui/data-display/badge";

interface OverviewStatsGridProps {
  health: any;
  pendientesCount: number;
}

export function OverviewStatsGrid({ health, pendientesCount }: OverviewStatsGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      <Card variant="glassBlue">
        <CardHeader className="flex justify-between items-start mb-2">
          <div className="p-2.5 bg-blue-500/10 rounded-xl text-blue-500">
            <Database size={22} />
          </div>
          <Badge variant="success">ONLINE</Badge>
        </CardHeader>
        <CardContent>
          <h3 className="text-2xl font-black text-foreground">
            {health?.centralDatabase?.negociosRegistrados || 0}
          </h3>
          <p className="text-xs text-muted-foreground font-medium mt-0.5">
            Negocios Registrados en BD Central
          </p>
        </CardContent>
      </Card>

      <Card variant="glassBlue">
        <CardHeader className="flex justify-between items-start mb-2">
          <div className="p-2.5 bg-purple-500/10 rounded-xl text-purple-500">
            <Server size={22} />
          </div>
          <Badge variant="secondary">NEON PG</Badge>
        </CardHeader>
        <CardContent>
          <h3 className="text-2xl font-black text-foreground">
            {health?.centralDatabase?.schemasIsolation || "Isolated Schemas"}
          </h3>
          <p className="text-xs text-muted-foreground font-medium mt-0.5">
            Multitenancy por Esquema
          </p>
        </CardContent>
      </Card>

      <Card variant="glassYellow">
        <CardHeader className="flex justify-between items-start mb-2">
          <div className="p-2.5 bg-amber-500/10 rounded-xl text-amber-500">
            <Clock size={22} />
          </div>
          {pendientesCount > 0 ? (
            <Badge variant="warning">PENDIENTE</Badge>
          ) : (
            <Badge variant="success">AL DÍA</Badge>
          )}
        </CardHeader>
        <CardContent>
          <h3 className="text-2xl font-black text-foreground">{pendientesCount}</h3>
          <p className="text-xs text-muted-foreground font-medium mt-0.5">
            Solicitudes Pendientes de Aprobación
          </p>
        </CardContent>
      </Card>

      <Card variant="glassGreen">
        <CardHeader className="flex justify-between items-start mb-2">
          <div className="p-2.5 bg-emerald-500/10 rounded-xl text-emerald-500">
            <Activity size={22} />
          </div>
          <Badge variant="success">OK</Badge>
        </CardHeader>
        <CardContent>
          <h3 className="text-2xl font-black text-foreground">
            {health?.uptimeSeconds
              ? `${Math.floor(health.uptimeSeconds / 60)} min`
              : "Activo"}
          </h3>
          <p className="text-xs text-muted-foreground font-medium mt-0.5">
            Uptime del Servidor Backend
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
