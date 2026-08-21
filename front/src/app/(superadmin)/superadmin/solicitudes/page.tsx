"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import { Clock, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/shared/ui/forms/button";
import { SolicitudesTable } from "./_components/solicitudes-table";
import { RechazoModalSheet } from "./_components/rechazo-modal-sheet";
import { apiClient } from "@/shared/lib/api-client";

function SolicitudesContent() {
  const [solicitudes, setSolicitudes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  // Modal de rechazar solicitud
  const [selectedSolicitudForRechazo, setSelectedSolicitudForRechazo] = useState<any>(null);
  const [motivoRechazoInput, setMotivoRechazoInput] = useState("");

  const router = useRouter();

  const fetchSolicitudes = async () => {
    try {
      const token = localStorage.getItem("superadmin_token");
      if (!token || token === "null" || token === "undefined") {
        router.push("/superadmin/login");
        return;
      }

      const res: any = await apiClient.get("/superadmin/solicitudes");
      setSolicitudes(res?.data || []);
    } catch (error: any) {
      console.error("Error fetching solicitudes", error);
      if (error?.status === 401) {
        localStorage.removeItem("superadmin_token");
        router.push("/superadmin/login");
        return;
      }
      toast.error("Error al cargar lista de solicitudes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSolicitudes();
  }, []);

  const handleAprobarSolicitud = async (solicitudId: number) => {
    if (!confirm("¿Aprobar esta solicitud y crear la base de datos del negocio?")) return;
    setProcessing(true);
    try {
      await apiClient.patch(`/superadmin/solicitudes/${solicitudId}/aprobar`, {});
      toast.success("¡Solicitud Aprobada!", { description: "El negocio y su base de datos fueron aprovisionados correctamente." });
      fetchSolicitudes();
    } catch (error: any) {
      console.error("Error al aprobar solicitud", error);
      toast.error("Error al aprobar solicitud", { description: error?.message || "Inténtalo nuevamente" });
    } finally {
      setProcessing(false);
    }
  };

  const handleRechazarSolicitud = async () => {
    if (!selectedSolicitudForRechazo) return;
    setProcessing(true);
    try {
      await apiClient.patch(`/superadmin/solicitudes/${selectedSolicitudForRechazo.id}/rechazar`, {
        motivo: motivoRechazoInput
      });

      toast.success("Solicitud Rechazada", { description: "Se notificó al usuario por correo electrónico." });
      setSelectedSolicitudForRechazo(null);
      setMotivoRechazoInput("");
      fetchSolicitudes();
    } catch (error: any) {
      console.error("Error al rechazar solicitud", error);
      toast.error("Error al rechazar solicitud", { description: error?.message });
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground font-sans">
        <RefreshCw className="animate-spin mr-2" size={24} /> Cargando solicitudes...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center pb-4 border-b border-border">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground tracking-tight flex items-center gap-2">
            <Clock className="text-amber-500" size={24} /> Solicitudes de Apertura de Negocios
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Revisa y aprueba solicitudes recibidas desde la landing pública para aprovisionar esquemas
          </p>
        </div>

        <Button size="sm" variant="outline" onClick={() => fetchSolicitudes()}>
          <RefreshCw size={14} className="mr-1.5" /> Refrescar
        </Button>
      </div>

      <SolicitudesTable
        solicitudes={solicitudes}
        processing={processing}
        onAprobar={handleAprobarSolicitud}
        onOpenRechazo={(sol) => {
          setSelectedSolicitudForRechazo(sol);
          setMotivoRechazoInput("");
        }}
      />

      <RechazoModalSheet
        selectedSolicitud={selectedSolicitudForRechazo}
        motivoInput={motivoRechazoInput}
        setMotivoInput={setMotivoRechazoInput}
        processing={processing}
        onConfirmRechazo={handleRechazarSolicitud}
        onClose={() => setSelectedSolicitudForRechazo(null)}
      />
    </div>
  );
}

export default function SolicitudesPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-muted-foreground">Cargando solicitudes...</div>}>
      <SolicitudesContent />
    </Suspense>
  );
}
