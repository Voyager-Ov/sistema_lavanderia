"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/shared/ui/forms/button";
import { SecurityLogsTable } from "./_components/security-logs-table";
import { apiClient } from "@/shared/lib/api-client";

function SeguridadContent() {
  const [securityLogs, setSecurityLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchLogs = async () => {
    try {
      const token = localStorage.getItem("superadmin_token");
      if (!token || token === "null" || token === "undefined") {
        router.push("/login");
        return;
      }

      const res: any = await apiClient.get("/superadmin/seguridad/logs");
      setSecurityLogs(res?.data || []);
    } catch (error: any) {
      console.error("Error fetching security logs", error);
      if (error?.status === 401) {
        localStorage.removeItem("superadmin_token");
        router.push("/login");
        return;
      }
      toast.error("Error al cargar logs de seguridad", {
        description: error?.message || "Verifica que el servidor backend esté disponible."
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground font-sans">
        <RefreshCw className="animate-spin mr-2" size={24} /> Cargando logs de seguridad...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center pb-4 border-b border-border">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground tracking-tight flex items-center gap-2">
            <ShieldCheck className="text-emerald-500" size={24} /> Auditoría de Seguridad & Logs RBAC
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Registro cronológico de eventos administrativos, accesos y alertas de seguridad
          </p>
        </div>

        <Button size="sm" variant="outline" onClick={() => fetchLogs()}>
          <RefreshCw size={14} className="mr-1.5" /> Refrescar
        </Button>
      </div>

      <SecurityLogsTable logs={securityLogs} />
    </div>
  );
}

export default function SeguridadPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-muted-foreground">Cargando auditoría...</div>}>
      <SeguridadContent />
    </Suspense>
  );
}
