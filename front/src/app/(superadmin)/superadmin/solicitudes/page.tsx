"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import { Clock, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/shared/ui/forms/button";
import { SolicitudesTable } from "./_components/solicitudes-table";
import { RechazoModalSheet } from "./_components/rechazo-modal-sheet";

function SolicitudesContent() {
  const [solicitudes, setSolicitudes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  // Modal de rechazar solicitud
  const [selectedSolicitudForRechazo, setSelectedSolicitudForRechazo] = useState<any>(null);
  const [motivoRechazoInput, setMotivoRechazoInput] = useState("");

  const router = useRouter();
  const getApiUrl = () => (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api").replace(/\/api\/?$/, "");

  const fetchSolicitudes = async () => {
    try {
      const token = localStorage.getItem("superadmin_token");
      if (!token || token === "null" || token === "undefined") {
        router.push("/superadmin/login");
        return;
      }

      const apiUrl = getApiUrl();
      const res = await fetch(`${apiUrl}/api/superadmin/solicitudes`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.status === 401) {
        localStorage.removeItem("superadmin_token");
        router.push("/superadmin/login");
        return;
      }

      const data = await res.json();
      setSolicitudes(data.data || []);
    } catch (error) {
      console.error("Error fetching solicitudes", error);
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
      const token = localStorage.getItem("superadmin_token");
      const apiUrl = getApiUrl();

      const res = await fetch(`${apiUrl}/api/superadmin/solicitudes/${solicitudId}/aprobar`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` }
      });

      const resData = await res.json();
      if (res.ok && resData.success) {
        toast.success("¡Solicitud Aprobada!", { description: "El negocio y su base de datos fueron aprovisionados correctamente." });
        fetchSolicitudes();
      } else {
        toast.error("Error al aprobar solicitud", { description: resData.message || "Inténtalo nuevamente" });
      }
    } catch (error) {
      console.error("Error al aprobar solicitud", error);
      toast.error("Error de conexión al aprobar solicitud");
    } finally {
      setProcessing(false);
    }
  };

  const handleRechazarSolicitud = async () => {
    if (!selectedSolicitudForRechazo) return;
    setProcessing(true);
    try {
      const token = localStorage.getItem("superadmin_token");
      const apiUrl = getApiUrl();

      const res = await fetch(`${apiUrl}/api/superadmin/solicitudes/${selectedSolicitudForRechazo.id}/rechazar`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ motivo: motivoRechazoInput })
      });

      const resData = await res.json();
      if (res.ok && resData.success) {
        toast.success("Solicitud Rechazada", { description: "Se notificó al usuario por correo electrónico." });
        setSelectedSolicitudForRechazo(null);
        setMotivoRechazoInput("");
        fetchSolicitudes();
      } else {
        toast.error("Error al rechazar solicitud", { description: resData.message });
      }
    } catch (error) {
      console.error("Error al rechazar solicitud", error);
      toast.error("Error de conexión al rechazar solicitud");
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
