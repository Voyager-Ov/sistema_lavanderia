"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  RefreshCw, 
  Activity, 
  Key, 
  Building2, 
  Clock, 
  Megaphone, 
  ShieldCheck, 
  Send 
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/shared/ui/forms/button";
import { apiClient } from "@/shared/lib/api-client";

// Subcomponentes modulares de cada área
import { OverviewStatsGrid } from "./_components/overview-stats-grid";
import { NotificationsFeedCard } from "./_components/notifications-feed-card";
import { NegociosTable } from "../negocios/_components/negocios-table";
import { CuotasModalSheet } from "../negocios/_components/cuotas-modal-sheet";
import { SolicitudesTable } from "../solicitudes/_components/solicitudes-table";
import { RechazoModalSheet } from "../solicitudes/_components/rechazo-modal-sheet";
import { MensajesTable } from "../mensajes/_components/mensajes-table";
import { NuevoMensajeSheet } from "../mensajes/_components/nuevo-mensaje-sheet";
import { SecurityLogsTable } from "../seguridad/_components/security-logs-table";

type SuperAdminTab = "overview" | "negocios" | "solicitudes" | "mensajes" | "seguridad";

function UnifiedDashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const tabParam = searchParams.get("tab") as SuperAdminTab | null;
  const [activeTab, setActiveTab] = useState<SuperAdminTab>(tabParam || "overview");

  useEffect(() => {
    if (tabParam && ["overview", "negocios", "solicitudes", "mensajes", "seguridad"].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const handleTabChange = (tab: SuperAdminTab) => {
    setActiveTab(tab);
    router.push(`/superadmin/dashboard?tab=${tab}`);
  };

  // Estados de datos centralizados
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [health, setHealth] = useState<any>(null);
  const [negocios, setNegocios] = useState<any[]>([]);
  const [solicitudes, setSolicitudes] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [mensajesBroadcast, setMensajesBroadcast] = useState<any[]>([]);
  const [securityLogs, setSecurityLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  // Estados modales: Cuotas Negocio
  const [selectedNegocioForCuotas, setSelectedNegocioForCuotas] = useState<any>(null);
  const [maxImagenesInput, setMaxImagenesInput] = useState<number>(50);
  const [maxStorageGBInput, setMaxStorageGBInput] = useState<number>(1.0);
  const [savingCuotas, setSavingCuotas] = useState(false);

  // Estados modales: Rechazo Solicitud
  const [selectedSolicitudForRechazo, setSelectedSolicitudForRechazo] = useState<any>(null);
  const [motivoRechazoInput, setMotivoRechazoInput] = useState("");

  // Estados modales: Nuevo Mensaje Broadcast
  const [showNewMessageSheet, setShowNewMessageSheet] = useState(false);
  const [nuevoTitulo, setNuevoTitulo] = useState("");
  const [nuevoContenido, setNuevoContenido] = useState("");
  const [nuevoTipo, setNuevoTipo] = useState<"INFO" | "WARNING" | "URGENT" | "MAINTENANCE">("INFO");
  const [nuevoNegocioId, setNuevoNegocioId] = useState<string>("");
  const [publicandoMensaje, setPublicandoMensaje] = useState(false);

  const fetchAllSuperAdminData = async () => {
    try {
      const token = localStorage.getItem("superadmin_token");
      if (!token || token === "null" || token === "undefined") {
        router.push("/superadmin/login");
        return;
      }

      const [dashRes, healthRes, solicitudesRes, notifRes, mensajesRes, logsRes]: any[] = await Promise.all([
        apiClient.get("/superadmin/dashboard").catch(() => null),
        apiClient.get("/superadmin/health-check").catch(() => null),
        apiClient.get("/superadmin/solicitudes").catch(() => null),
        apiClient.get("/superadmin/notificaciones").catch(() => null),
        apiClient.get("/superadmin/mensajes").catch(() => null),
        apiClient.get("/superadmin/seguridad/logs").catch(() => null)
      ]);

      if (dashRes) {
        setDashboardData(dashRes);
        setNegocios(dashRes.negocios || []);
      }
      if (healthRes) setHealth(healthRes);
      if (solicitudesRes) setSolicitudes(solicitudesRes.data || []);
      if (notifRes) setNotifications(notifRes.data || []);
      if (mensajesRes) setMensajesBroadcast(mensajesRes.data || []);
      if (logsRes) setSecurityLogs(logsRes.data || []);
    } catch (error: any) {
      console.error("Error fetching superadmin data", error);
      if (error?.status === 401) {
        localStorage.removeItem("superadmin_token");
        router.push("/superadmin/login");
        return;
      }
      toast.error("Error al cargar datos del panel SuperAdmin");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllSuperAdminData();
    const interval = setInterval(fetchAllSuperAdminData, 60000);
    return () => clearInterval(interval);
  }, []);

  // Handlers para Negocios
  const toggleNegocioStatus = async (id: number, currentStatus: boolean) => {
    if (!confirm(`¿Estás seguro de que quieres ${currentStatus ? 'desactivar' : 'activar'} este negocio?`)) return;

    try {
      await apiClient.put(`/superadmin/negocios/${id}/status`, { activo: !currentStatus });
      toast.success(`Negocio ${!currentStatus ? 'activado' : 'suspendido'} exitosamente`);
      fetchAllSuperAdminData();
    } catch (error: any) {
      toast.error("No se pudo cambiar el estado del negocio", { description: error?.message });
    }
  };

  const handleOpenCuotasModal = (negocio: any) => {
    setSelectedNegocioForCuotas(negocio);
    setMaxImagenesInput(negocio.maxImagenes || 50);
    setMaxStorageGBInput(negocio.maxStorageGB || 1.0);
  };

  const handleSaveCuotas = async () => {
    if (!selectedNegocioForCuotas) return;
    setSavingCuotas(true);
    try {
      await apiClient.put(`/superadmin/negocios/${selectedNegocioForCuotas.id}/limites`, {
        maxImagenes: maxImagenesInput,
        maxStorageGB: maxStorageGBInput
      });

      toast.success("Límites de almacenamiento actualizados exitosamente");
      setSelectedNegocioForCuotas(null);
      fetchAllSuperAdminData();
    } catch (error: any) {
      toast.error("Error al guardar cuotas", { description: error?.message });
    } finally {
      setSavingCuotas(false);
    }
  };

  // Handlers para Solicitudes
  const handleAprobarSolicitud = async (solicitudId: number) => {
    if (!confirm("¿Aprobar esta solicitud y crear la base de datos del negocio?")) return;
    setProcessing(true);
    try {
      await apiClient.patch(`/superadmin/solicitudes/${solicitudId}/aprobar`, {});
      toast.success("¡Solicitud Aprobada!", { description: "El negocio y su esquema fueron aprovisionados correctamente." });
      fetchAllSuperAdminData();
    } catch (error: any) {
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
      fetchAllSuperAdminData();
    } catch (error: any) {
      toast.error("Error al rechazar solicitud", { description: error?.message });
    } finally {
      setProcessing(false);
    }
  };

  // Handlers para Mensajes Broadcast
  const handlePublicarMensaje = async () => {
    if (!nuevoTitulo.trim() || !nuevoContenido.trim()) {
      toast.error("Por favor completa el título y contenido del anuncio");
      return;
    }
    setPublicandoMensaje(true);
    try {
      await apiClient.post("/superadmin/mensajes", {
        titulo: nuevoTitulo,
        contenido: nuevoContenido,
        tipo: nuevoTipo,
        negocioId: nuevoNegocioId ? Number(nuevoNegocioId) : null
      });

      toast.success("📢 Anuncio Broadcast Publicado Exitosamente");
      setShowNewMessageSheet(false);
      setNuevoTitulo("");
      setNuevoContenido("");
      setNuevoTipo("INFO");
      setNuevoNegocioId("");
      fetchAllSuperAdminData();
    } catch (error: any) {
      toast.error("Error al publicar anuncio", { description: error?.message });
    } finally {
      setPublicandoMensaje(false);
    }
  };

  const handleDesactivarMensaje = async (id: number) => {
    if (!confirm("¿Desactivar este anuncio broadcast para todos los negocios?")) return;
    try {
      await apiClient.patch(`/superadmin/mensajes/${id}/desactivar`, {});
      toast.success("Anuncio desactivado correctamente");
      fetchAllSuperAdminData();
    } catch (error: any) {
      toast.error("Error al desactivar anuncio", { description: error?.message });
    }
  };

  const handleResetPasswordRequest = async () => {
    const targetEmail = "octavio.velo2022@gmail.com";
    if (!confirm(`¿Enviar enlace seguro con token para cambiar contraseña a ${targetEmail}?`)) return;

    try {
      await apiClient.post("/auth/forgot-password", { email: targetEmail });
      toast.success(`🔑 Enlace seguro enviado a ${targetEmail}`);
    } catch (e: any) {
      toast.error("Error al solicitar restablecimiento", { description: e.message });
    }
  };

  const totalNegocios = negocios.length || (dashboardData?.stats?.totalNegocios ?? 0);
  const activosCount = negocios.filter(n => n.activo).length || (dashboardData?.stats?.activos ?? 0);
  const pendientesCount = solicitudes.filter(s => s.estado === "PENDIENTE").length || (dashboardData?.stats?.solicitudesPendientes ?? 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground font-sans">
        <RefreshCw className="animate-spin mr-2" size={24} /> Cargando Consola SuperAdmin...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-border">
        <div>
          <h1 className="text-2xl font-black text-foreground tracking-tight flex items-center gap-2">
            <Activity className="text-blue-500" size={24} /> Consola Unificada Super Admin
          </h1>
          <p className="text-muted-foreground text-xs mt-1">
            Gestión centralizada de infraestructura multi-tenant, negocios, solicitudes y alertas de seguridad
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button size="sm" variant="outline" onClick={() => fetchAllSuperAdminData()}>
            <RefreshCw size={14} className="mr-1.5" /> Refrescar
          </Button>
          <Button size="sm" variant="warning" onClick={handleResetPasswordRequest}>
            <Key size={14} className="mr-1.5" /> Cambiar Contraseña
          </Button>
        </div>
      </div>

      {/* Tabs de Navegación Unificada */}
      <div className="flex items-center gap-2 border-b border-border overflow-x-auto pb-2 scrollbar-none">
        <button
          onClick={() => handleTabChange("overview")}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-lg transition-colors whitespace-nowrap ${
            activeTab === "overview"
              ? "bg-blue-600 text-white shadow-sm"
              : "text-muted-foreground hover:bg-neutral-800 hover:text-foreground"
          }`}
        >
          <Activity size={16} /> Vista General
        </button>

        <button
          onClick={() => handleTabChange("negocios")}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-lg transition-colors whitespace-nowrap ${
            activeTab === "negocios"
              ? "bg-blue-600 text-white shadow-sm"
              : "text-muted-foreground hover:bg-neutral-800 hover:text-foreground"
          }`}
        >
          <Building2 size={16} /> Gestión de Negocios
          {totalNegocios > 0 && (
            <span className="ml-1 px-2 py-0.5 text-xs rounded-full bg-blue-500/20 text-blue-200">
              {totalNegocios}
            </span>
          )}
        </button>

        <button
          onClick={() => handleTabChange("solicitudes")}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-lg transition-colors whitespace-nowrap ${
            activeTab === "solicitudes"
              ? "bg-blue-600 text-white shadow-sm"
              : "text-muted-foreground hover:bg-neutral-800 hover:text-foreground"
          }`}
        >
          <Clock size={16} /> Solicitudes Pendientes
          {pendientesCount > 0 && (
            <span className="ml-1 px-2 py-0.5 text-xs rounded-full bg-amber-500/30 text-amber-300 font-bold">
              {pendientesCount}
            </span>
          )}
        </button>

        <button
          onClick={() => handleTabChange("mensajes")}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-lg transition-colors whitespace-nowrap ${
            activeTab === "mensajes"
              ? "bg-blue-600 text-white shadow-sm"
              : "text-muted-foreground hover:bg-neutral-800 hover:text-foreground"
          }`}
        >
          <Megaphone size={16} /> Mensajería Broadcast
        </button>

        <button
          onClick={() => handleTabChange("seguridad")}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-lg transition-colors whitespace-nowrap ${
            activeTab === "seguridad"
              ? "bg-blue-600 text-white shadow-sm"
              : "text-muted-foreground hover:bg-neutral-800 hover:text-foreground"
          }`}
        >
          <ShieldCheck size={16} /> Auditoría de Seguridad
        </button>
      </div>

      {/* Contenido Modular según la pestaña activa */}
      {activeTab === "overview" && (
        <div className="space-y-8">
          <OverviewStatsGrid
            health={health}
            totalNegocios={totalNegocios}
            pendientesCount={pendientesCount}
            activosCount={activosCount}
          />
          <NotificationsFeedCard notifications={notifications} />
        </div>
      )}

      {activeTab === "negocios" && (
        <div className="space-y-6">
          <NegociosTable
            negocios={negocios}
            onOpenCuotas={handleOpenCuotasModal}
            onToggleStatus={toggleNegocioStatus}
          />
          <CuotasModalSheet
            selectedNegocio={selectedNegocioForCuotas}
            maxImagenesInput={maxImagenesInput}
            setMaxImagenesInput={setMaxImagenesInput}
            maxStorageGBInput={maxStorageGBInput}
            setMaxStorageGBInput={setMaxStorageGBInput}
            saving={savingCuotas}
            onSave={handleSaveCuotas}
            onClose={() => setSelectedNegocioForCuotas(null)}
          />
        </div>
      )}

      {activeTab === "solicitudes" && (
        <div className="space-y-6">
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
      )}

      {activeTab === "mensajes" && (
        <div className="space-y-6">
          <div className="flex justify-end">
            <Button size="sm" onClick={() => setShowNewMessageSheet(true)}>
              <Send size={14} className="mr-1.5" /> Publicar Nuevo Anuncio
            </Button>
          </div>
          <MensajesTable
            mensajes={mensajesBroadcast}
            onDesactivar={handleDesactivarMensaje}
          />
          <NuevoMensajeSheet
            open={showNewMessageSheet}
            onOpenChange={setShowNewMessageSheet}
            nuevoTitulo={nuevoTitulo}
            setNuevoTitulo={setNuevoTitulo}
            nuevoContenido={nuevoContenido}
            setNuevoContenido={setNuevoContenido}
            nuevoTipo={nuevoTipo}
            setNuevoTipo={setNuevoTipo}
            nuevoNegocioId={nuevoNegocioId}
            setNuevoNegocioId={setNuevoNegocioId}
            publicando={publicandoMensaje}
            onPublicar={handlePublicarMensaje}
          />
        </div>
      )}

      {activeTab === "seguridad" && (
        <div className="space-y-6">
          <SecurityLogsTable logs={securityLogs} />
        </div>
      )}
    </div>
  );
}

export default function SuperAdminDashboardPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-muted-foreground">Cargando consola SuperAdmin...</div>}>
      <UnifiedDashboardContent />
    </Suspense>
  );
}
