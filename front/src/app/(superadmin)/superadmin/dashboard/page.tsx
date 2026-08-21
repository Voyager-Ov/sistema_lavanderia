"use client";

import { useEffect, useState, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  ServerIcon, 
  DatabaseIcon, 
  GlobeIcon, 
  ActivityIcon,
  PowerIcon,
  UsersIcon,
  ClockIcon,
  ImageIcon,
  HardDriveIcon,
  Settings2Icon,
  Trash2Icon,
  RefreshCwIcon,
  XCircleIcon,
  EyeIcon,
  KeyIcon,
  Building2Icon,
  ShieldAlertIcon,
  FileCheck2Icon,
  MegaphoneIcon,
  ShieldCheckIcon,
  SendIcon,
  LogOutIcon
} from "lucide-react";
import { toast } from "sonner";
import { 
  ResponsiveSheet, 
  ResponsiveSheetContent, 
  ResponsiveSheetHeader, 
  ResponsiveSheetTitle, 
  ResponsiveSheetDescription 
} from "@/shared/ui/overlays/responsive-sheet";
import { SidebarProvider } from "@/shared/ui/layout/sidebar";
import { AppSidebar, NavItem } from "@/shared/ui/layout/app-sidebar";
import { AppHeader } from "@/shared/ui/layout/app-header";

// Shared Reusable UI Components
import { Button } from "@/shared/ui/forms/button";
import { Badge } from "@/shared/ui/data-display/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/shared/ui/data-display/card";
import { Input } from "@/shared/ui/forms/input";
import { Textarea } from "@/shared/ui/forms/textarea";

function DashboardContent() {
  const [data, setData] = useState<any>(null);
  const [health, setHealth] = useState<any>(null);
  const [solicitudes, setSolicitudes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "negocios" | "solicitudes" | "mensajes" | "seguridad">("overview");
  
  // Modal de edición de cuotas
  const [selectedNegocioForCuotas, setSelectedNegocioForCuotas] = useState<any>(null);
  const [maxImagenesInput, setMaxImagenesInput] = useState<number>(50);
  const [maxStorageGBInput, setMaxStorageGBInput] = useState<number>(1.0);
  const [savingCuotas, setSavingCuotas] = useState(false);

  // Modal de galería de imágenes tenant
  const [selectedNegocioForGallery, setSelectedNegocioForGallery] = useState<any>(null);
  const [tenantImages, setTenantImages] = useState<any[]>([]);
  const [loadingImages, setLoadingImages] = useState(false);

  // Modal de rechazar solicitud
  const [selectedSolicitudForRechazo, setSelectedSolicitudForRechazo] = useState<any>(null);
  const [motivoRechazoInput, setMotivoRechazoInput] = useState("");
  const [processingSolicitud, setProcessingSolicitud] = useState(false);

  // Mensajería Broadcast
  const [mensajesBroadcast, setMensajesBroadcast] = useState<any[]>([]);
  const [showNewMessageSheet, setShowNewMessageSheet] = useState(false);
  const [nuevoTitulo, setNuevoTitulo] = useState("");
  const [nuevoContenido, setNuevoContenido] = useState("");
  const [nuevoTipo, setNuevoTipo] = useState<"INFO" | "WARNING" | "URGENT" | "MAINTENANCE">("INFO");
  const [nuevoNegocioId, setNuevoNegocioId] = useState<string>("");
  const [publicandoMensaje, setPublicandoMensaje] = useState(false);

  // Auditoría de Seguridad
  const [securityLogs, setSecurityLogs] = useState<any[]>([]);

  const router = useRouter();
  const searchParams = useSearchParams();

  const getApiUrl = () => (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api").replace(/\/api\/?$/, "");

  // Sync tab with query param
  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam === "negocios" || tabParam === "solicitudes" || tabParam === "overview" || tabParam === "mensajes" || tabParam === "seguridad") {
      setActiveTab(tabParam as any);
    }
  }, [searchParams]);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem("superadmin_token");
      if (!token || token === "null" || token === "undefined") {
        localStorage.removeItem("superadmin_token");
        router.push("/superadmin/login");
        return;
      }

      const apiUrl = getApiUrl();
      
      const [dashRes, healthRes, solicitudesRes, mensajesRes, logsRes] = await Promise.all([
        fetch(`${apiUrl}/api/superadmin/dashboard`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${apiUrl}/api/superadmin/health-check`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${apiUrl}/api/superadmin/solicitudes`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${apiUrl}/api/superadmin/mensajes`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${apiUrl}/api/superadmin/seguridad/logs`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      if (dashRes.status === 401 || healthRes.status === 401) {
        localStorage.removeItem("superadmin_token");
        router.push("/superadmin/login");
        return;
      }

      const dashData = await dashRes.json();
      const healthData = await healthRes.json();
      const solicitudesData = await solicitudesRes.json();
      const mensajesData = await mensajesRes.json();
      const logsData = await logsRes.json();

      setData(dashData);
      setHealth(healthData);
      setSolicitudes(solicitudesData.data || []);
      setMensajesBroadcast(mensajesData.data || []);
      setSecurityLogs(logsData.data || []);
    } catch (error) {
      console.error("Error fetching dashboard data", error);
      toast.error("Error al cargar datos del sistema");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 60000);
    return () => clearInterval(interval);
  }, []);

  const toggleNegocioStatus = async (id: number, currentStatus: boolean) => {
    if (!confirm(`¿Estás seguro de que quieres ${currentStatus ? 'desactivar' : 'activar'} este negocio?`)) return;

    try {
      const token = localStorage.getItem("superadmin_token");
      const apiUrl = getApiUrl();
      
      const res = await fetch(`${apiUrl}/api/superadmin/negocios/${id}/status`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ activo: !currentStatus })
      });
      
      if (res.ok) {
        toast.success(`Negocio ${!currentStatus ? 'activado' : 'suspendido'} exitosamente`);
        fetchDashboardData();
      } else {
        toast.error("No se pudo cambiar el estado del negocio");
      }
    } catch (error) {
      console.error("Error toggling status", error);
    }
  };

  const handleAprobarSolicitud = async (solicitudId: number) => {
    if (!confirm("¿Aprobar esta solicitud y crear la base de datos del negocio?")) return;
    setProcessingSolicitud(true);
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
        fetchDashboardData();
      } else {
        toast.error("Error al aprobar solicitud", { description: resData.message || "Inténtalo nuevamente" });
      }
    } catch (error) {
      console.error("Error al aprobar solicitud", error);
      toast.error("Error de conexión al aprobar solicitud");
    } finally {
      setProcessingSolicitud(false);
    }
  };

  const handleRechazarSolicitud = async () => {
    if (!selectedSolicitudForRechazo) return;
    setProcessingSolicitud(true);
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
        fetchDashboardData();
      } else {
        toast.error("Error al rechazar solicitud", { description: resData.message });
      }
    } catch (error) {
      console.error("Error al rechazar solicitud", error);
      toast.error("Error de conexión al rechazar solicitud");
    } finally {
      setProcessingSolicitud(false);
    }
  };

  const handlePublicarMensaje = async () => {
    if (!nuevoTitulo.trim() || !nuevoContenido.trim()) {
      toast.error("Por favor completa el título y contenido del anuncio");
      return;
    }
    setPublicandoMensaje(true);
    try {
      const token = localStorage.getItem("superadmin_token");
      const apiUrl = getApiUrl();

      const res = await fetch(`${apiUrl}/api/superadmin/mensajes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          titulo: nuevoTitulo,
          contenido: nuevoContenido,
          tipo: nuevoTipo,
          negocioId: nuevoNegocioId ? Number(nuevoNegocioId) : null
        })
      });

      const resData = await res.json();
      if (res.ok) {
        toast.success("📢 Anuncio Broadcast Publicado Exitosamente");
        setShowNewMessageSheet(false);
        setNuevoTitulo("");
        setNuevoContenido("");
        setNuevoTipo("INFO");
        setNuevoNegocioId("");
        fetchDashboardData();
      } else {
        toast.error("Error al publicar anuncio", { description: resData.message });
      }
    } catch (error) {
      console.error("Error al publicar anuncio", error);
      toast.error("Error de conexión al publicar anuncio");
    } finally {
      setPublicandoMensaje(false);
    }
  };

  const handleDesactivarMensaje = async (id: number) => {
    if (!confirm("¿Desactivar este anuncio broadcast para todos los negocios?")) return;
    try {
      const token = localStorage.getItem("superadmin_token");
      const apiUrl = getApiUrl();

      const res = await fetch(`${apiUrl}/api/superadmin/mensajes/${id}/desactivar`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        toast.success("Anuncio desactivado correctamente");
        fetchDashboardData();
      }
    } catch (error) {
      console.error("Error al desactivar mensaje", error);
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
      const token = localStorage.getItem("superadmin_token");
      const apiUrl = getApiUrl();

      const res = await fetch(`${apiUrl}/api/superadmin/negocios/${selectedNegocioForCuotas.id}/limites`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          maxImagenes: maxImagenesInput,
          maxStorageGB: maxStorageGBInput
        })
      });

      const resData = await res.json();
      if (res.ok && resData.success) {
        toast.success("Límites de almacenamiento actualizados exitosamente");
        setSelectedNegocioForCuotas(null);
        fetchDashboardData();
      } else {
        toast.error("Error al actualizar cuotas", { description: resData.message });
      }
    } catch (error) {
      console.error("Error saving limits", error);
      toast.error("Error al guardar cuotas");
    } finally {
      setSavingCuotas(false);
    }
  };

  const handleResetPasswordRequest = async () => {
    const targetEmail = "octavio.velo2022@gmail.com";
    if (!confirm(`¿Enviar enlace seguro con token para cambiar contraseña a ${targetEmail}?`)) return;

    try {
      const apiUrl = getApiUrl();
      const res = await fetch(`${apiUrl}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: targetEmail })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`🔑 Enlace seguro enviado a ${targetEmail}`);
      } else {
        toast.error("Error al solicitar enlace de contraseña", { description: data.message });
      }
    } catch (e) {
      toast.error("Error de conexión al solicitar restablecimiento de contraseña");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("superadmin_token");
    router.push("/superadmin/login");
  };

  const pendientesCount = useMemo(() => {
    return solicitudes.filter(s => s.estado === "PENDIENTE").length;
  }, [solicitudes]);

  const superAdminMainMenu: NavItem[] = useMemo(() => [
    { 
      title: "Vista General", 
      icon: ActivityIcon, 
      href: "/superadmin/dashboard?tab=overview",
      isActive: activeTab === "overview"
    },
    { 
      title: "Gestión de Negocios", 
      icon: UsersIcon, 
      href: "/superadmin/dashboard?tab=negocios",
      isActive: activeTab === "negocios"
    },
    { 
      title: "Solicitudes", 
      icon: ClockIcon, 
      href: "/superadmin/dashboard?tab=solicitudes",
      isActive: activeTab === "solicitudes"
    },
    { 
      title: "Mensajería Broadcast", 
      icon: MegaphoneIcon, 
      href: "/superadmin/dashboard?tab=mensajes",
      isActive: activeTab === "mensajes"
    },
    { 
      title: "Auditoría de Seguridad", 
      icon: ShieldCheckIcon, 
      href: "/superadmin/dashboard?tab=seguridad",
      isActive: activeTab === "seguridad"
    },
  ], [activeTab]);

  const superAdminAccountMenu: NavItem[] = useMemo(() => [
    { title: "Cambiar Contraseña", icon: KeyIcon, href: "#" },
  ], []);

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center text-zinc-300 font-sans">
        <RefreshCwIcon className="animate-spin mr-2" size={24} /> Cargando consola Super Admin...
      </div>
    );
  }

  return (
    <SidebarProvider className="bg-white dark:bg-neutral-950 p-3 sm:p-4 gap-4 transition-colors duration-300">
      <AppSidebar 
        portalName="Super Admin"
        portalSubtitle="Lavandería SaaS Central"
        mainMenu={superAdminMainMenu}
        accountMenu={superAdminAccountMenu}
        onLogout={handleLogout}
      />

      <main className="flex-1 h-[calc(100vh-2rem)] my-auto bg-[#FAFAFA] dark:bg-neutral-900 rounded-[2rem] shadow-xl dark:shadow-none border border-gray-200 dark:border-neutral-800 overflow-y-auto flex flex-col relative transition-colors duration-300 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        
        {/* Top Header */}
        <AppHeader 
          title={
            activeTab === "overview" 
              ? "Monitoreo Central & Salud del Sistema" 
              : activeTab === "negocios" 
              ? "Gestión de Negocios & Cuotas Multitenant" 
              : activeTab === "solicitudes"
              ? "Solicitudes de Registro Diferidas"
              : activeTab === "mensajes"
              ? "Mensajería Broadcast & Banners del Sistema"
              : "Auditoría de Seguridad & Logs RBAC"
          }
          breadcrumbs={[
            { label: "Super Admin", href: "/superadmin/dashboard" },
            { 
              label: activeTab.toUpperCase(), 
              href: `/superadmin/dashboard?tab=${activeTab}` 
            }
          ]}
        />

        {/* Action Header Banner */}
        <div className="px-6 sm:px-10 pt-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-gray-200 dark:border-neutral-800">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">Super Admin Console</h1>
              <Badge variant="glass">v2.0 Multitenant</Badge>
            </div>
            <p className="text-muted-foreground text-sm mt-1">Gestión central de esquemas Neon PostgreSQL, límites de GB y auditoría RBAC</p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {activeTab === "mensajes" && (
              <Button size="sm" onClick={() => setShowNewMessageSheet(true)}>
                <SendIcon size={14} /> Publicar Anuncio
              </Button>
            )}

            <Button size="sm" variant="outline" onClick={() => fetchDashboardData()}>
              <RefreshCwIcon size={14} /> Refrescar
            </Button>

            <Button size="sm" variant="warning" onClick={handleResetPasswordRequest}>
              <KeyIcon size={14} /> Cambiar Contraseña
            </Button>

            <Button size="sm" variant="destructive" onClick={handleLogout}>
              <LogOutIcon size={15} /> Cerrar Sesión
            </Button>
          </div>
        </div>

        {/* Quick Tab Selector inside Content */}
        <div className="px-6 sm:px-10 pt-6">
          <div className="flex gap-2 border-b border-gray-200 dark:border-neutral-800 pb-3 overflow-x-auto">
            <Button
              size="sm"
              variant={activeTab === "overview" ? "default" : "ghost"}
              onClick={() => setActiveTab("overview")}
            >
              <ActivityIcon size={16} /> Monitoreo y Salud
            </Button>

            <Button
              size="sm"
              variant={activeTab === "negocios" ? "default" : "ghost"}
              onClick={() => setActiveTab("negocios")}
            >
              <Building2Icon size={16} /> Negocios ({data?.negocios?.length || 0})
            </Button>

            <Button
              size="sm"
              variant={activeTab === "solicitudes" ? "default" : "ghost"}
              onClick={() => setActiveTab("solicitudes")}
              className="relative"
            >
              <FileCheck2Icon size={16} /> Solicitudes
              {pendientesCount > 0 && (
                <span className="ml-1 w-5 h-5 rounded-full bg-amber-500 text-black text-[11px] font-black flex items-center justify-center animate-pulse">
                  {pendientesCount}
                </span>
              )}
            </Button>

            <Button
              size="sm"
              variant={activeTab === "mensajes" ? "default" : "ghost"}
              onClick={() => setActiveTab("mensajes")}
            >
              <MegaphoneIcon size={16} /> Broadcast ({mensajesBroadcast.filter(m => m.activo).length})
            </Button>

            <Button
              size="sm"
              variant={activeTab === "seguridad" ? "default" : "ghost"}
              onClick={() => setActiveTab("seguridad")}
            >
              <ShieldCheckIcon size={16} /> Auditoría ({securityLogs.length})
            </Button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 w-full p-6 sm:p-10 pb-28 md:pb-10">
          
          {/* TAB 1: OVERVIEW & HEALTH */}
          {activeTab === "overview" && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <Card variant="glassBlue">
                  <CardHeader className="flex justify-between items-start mb-2">
                    <div className="p-2.5 bg-blue-500/10 rounded-xl text-blue-500">
                      <DatabaseIcon size={22} />
                    </div>
                    <Badge variant="success">ONLINE</Badge>
                  </CardHeader>
                  <CardContent>
                    <h3 className="text-2xl font-black text-foreground">{health?.centralDatabase?.negociosRegistrados || 0}</h3>
                    <p className="text-xs text-muted-foreground font-medium mt-0.5">Negocios Registrados en BD Central</p>
                  </CardContent>
                </Card>

                <Card variant="glassBlue">
                  <CardHeader className="flex justify-between items-start mb-2">
                    <div className="p-2.5 bg-purple-500/10 rounded-xl text-purple-500">
                      <ServerIcon size={22} />
                    </div>
                    <Badge variant="secondary">NEON PG</Badge>
                  </CardHeader>
                  <CardContent>
                    <h3 className="text-2xl font-black text-foreground">{health?.centralDatabase?.schemasIsolation || "Isolated Schemas"}</h3>
                    <p className="text-xs text-muted-foreground font-medium mt-0.5">Multitenancy por Esquema</p>
                  </CardContent>
                </Card>

                <Card variant="glassYellow">
                  <CardHeader className="flex justify-between items-start mb-2">
                    <div className="p-2.5 bg-amber-500/10 rounded-xl text-amber-500">
                      <ClockIcon size={22} />
                    </div>
                    {pendientesCount > 0 ? (
                      <Badge variant="warning">PENDIENTE</Badge>
                    ) : (
                      <Badge variant="success">AL DÍA</Badge>
                    )}
                  </CardHeader>
                  <CardContent>
                    <h3 className="text-2xl font-black text-foreground">{pendientesCount}</h3>
                    <p className="text-xs text-muted-foreground font-medium mt-0.5">Solicitudes Pendientes de Aprobación</p>
                  </CardContent>
                </Card>

                <Card variant="glassGreen">
                  <CardHeader className="flex justify-between items-start mb-2">
                    <div className="p-2.5 bg-emerald-500/10 rounded-xl text-emerald-500">
                      <ActivityIcon size={22} />
                    </div>
                    <Badge variant="success">OK</Badge>
                  </CardHeader>
                  <CardContent>
                    <h3 className="text-2xl font-black text-foreground">{health?.uptimeSeconds ? `${Math.floor(health.uptimeSeconds / 60)} min` : "Activo"}</h3>
                    <p className="text-xs text-muted-foreground font-medium mt-0.5">Uptime del Servidor Backend</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* TAB 2: NEGOCIOS & ALMACENAMIENTO */}
          {activeTab === "negocios" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-extrabold text-foreground">Listado de Tenants Registrados</h3>
                  <p className="text-xs text-muted-foreground">Administra estados de servicio, suspensión y límites de storage por negocio</p>
                </div>
              </div>

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
                      {data?.negocios?.map((neg: any) => (
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
                                <HardDriveIcon size={14} className="text-purple-500" />
                                {neg.maxStorageGB || 1.0} GB
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-6 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleOpenCuotasModal(neg)}
                                title="Editar Límites y Cuotas"
                              >
                                <Settings2Icon size={16} />
                              </Button>

                              <Button
                                size="sm"
                                variant={neg.activo ? "outlineRed" : "outlineGreen"}
                                onClick={() => toggleNegocioStatus(neg.id, neg.activo)}
                                title={neg.activo ? "Suspender Servicio" : "Reactivar Servicio"}
                              >
                                <PowerIcon size={16} />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            </div>
          )}

          {/* TAB 3: SOLICITUDES DE REGISTRO */}
          {activeTab === "solicitudes" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-extrabold text-foreground">Solicitudes de Apertura de Negocios</h3>
                <p className="text-xs text-muted-foreground">Revisa y aprueba solicitudes recibidas desde la landing pública para aprovisionar esquemas</p>
              </div>

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
                                    onClick={() => handleAprobarSolicitud(sol.id)}
                                    disabled={processingSolicitud}
                                  >
                                    Aprobar & Crear Schema
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outlineRed"
                                    onClick={() => {
                                      setSelectedSolicitudForRechazo(sol);
                                      setMotivoRechazoInput("");
                                    }}
                                    disabled={processingSolicitud}
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
            </div>
          )}

          {/* TAB 4: MENSAJERÍA BROADCAST */}
          {activeTab === "mensajes" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-extrabold text-foreground">Anuncios del Sistema & Broadcast</h3>
                  <p className="text-xs text-muted-foreground">Publica avisos globales o específicos a los clientes del sistema</p>
                </div>

                <Button size="sm" onClick={() => setShowNewMessageSheet(true)}>
                  <SendIcon size={14} /> Nuevo Anuncio
                </Button>
              </div>

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
                      {mensajesBroadcast.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-muted-foreground text-sm">
                            No hay mensajes broadcast publicados.
                          </td>
                        </tr>
                      ) : (
                        mensajesBroadcast.map((msg: any) => (
                          <tr key={msg.id} className="hover:bg-muted/40 transition-colors">
                            <td className="py-4 px-6">
                              <div className="font-bold text-foreground">{msg.titulo}</div>
                              <div className="mt-1">
                                {msg.tipo === "URGENT" && <Badge variant="destructive">URGENT</Badge>}
                                {msg.tipo === "MAINTENANCE" && <Badge variant="warning">MAINTENANCE</Badge>}
                                {msg.tipo === "WARNING" && <Badge variant="warning">WARNING</Badge>}
                                {msg.tipo === "INFO" && <Badge variant="glass">INFO</Badge>}
                              </div>
                            </td>
                            <td className="py-4 px-6 text-xs text-foreground max-w-md truncate">
                              {msg.contenido}
                            </td>
                            <td className="py-4 px-6 text-xs font-semibold">
                              {msg.negocioId ? `Tenant #${msg.negocioId}` : "Global (Todos)"}
                            </td>
                            <td className="py-4 px-6">
                              {msg.activo ? (
                                <Badge variant="success">Activo</Badge>
                              ) : (
                                <Badge variant="secondary">Inactivo</Badge>
                              )}
                            </td>
                            <td className="py-4 px-6 text-right">
                              {msg.activo && (
                                <Button
                                  size="sm"
                                  variant="outlineRed"
                                  onClick={() => handleDesactivarMensaje(msg.id)}
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
            </div>
          )}

          {/* TAB 5: AUDITORÍA DE SEGURIDAD */}
          {activeTab === "seguridad" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-extrabold text-foreground">Auditoría de Seguridad & Registros RBAC</h3>
                <p className="text-xs text-muted-foreground">Historial de accesos, intentos denegados y bloqueos de seguridad por IP</p>
              </div>

              <Card>
                <CardContent className="p-0 overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-muted text-muted-foreground uppercase text-[11px] font-bold tracking-wider border-b border-border">
                      <tr>
                        <th className="py-3.5 px-6">Fecha & Hora</th>
                        <th className="py-3.5 px-6">Usuario / IP</th>
                        <th className="py-3.5 px-6">Endpoint & Método</th>
                        <th className="py-3.5 px-6">Nivel Severidad</th>
                        <th className="py-3.5 px-6">Detalles</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {securityLogs.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-muted-foreground text-sm">
                            Sin eventos de seguridad registrados.
                          </td>
                        </tr>
                      ) : (
                        securityLogs.map((log: any) => (
                          <tr key={log.id} className="hover:bg-muted/40 transition-colors">
                            <td className="py-4 px-6 text-xs font-mono text-muted-foreground">
                              {new Date(log.createdAt).toLocaleString()}
                            </td>
                            <td className="py-4 px-6">
                              <div className="font-bold text-foreground">{log.usuarioEmail || "Anónimo"}</div>
                              <div className="text-xs text-blue-500 font-mono">IP: {log.ip || "Localhost"}</div>
                            </td>
                            <td className="py-4 px-6 font-mono text-xs text-foreground">
                              <span className="font-bold text-purple-500 mr-1.5">{log.metodo}</span>
                              {log.endpoint}
                            </td>
                            <td className="py-4 px-6">
                              {log.nivel === "CRITICAL" && <Badge variant="destructive">CRITICAL</Badge>}
                              {log.nivel === "HIGH" && <Badge variant="destructive">HIGH</Badge>}
                              {log.nivel === "MEDIUM" && <Badge variant="warning">MEDIUM</Badge>}
                              {log.nivel === "LOW" && <Badge variant="glass">LOW</Badge>}
                            </td>
                            <td className="py-4 px-6 text-xs text-muted-foreground max-w-xs truncate">
                              {log.detalles || "Registro de acceso administrativo"}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            </div>
          )}

        </div>
      </main>

      {/* OVERLAY 1: ResponsiveSheet para Cuotas y Límites */}
      <ResponsiveSheet 
        open={!!selectedNegocioForCuotas} 
        onOpenChange={(open) => !open && setSelectedNegocioForCuotas(null)}
      >
        <ResponsiveSheetContent>
          <ResponsiveSheetHeader className="mb-6">
            <ResponsiveSheetTitle className="text-xl font-bold flex items-center gap-2">
              <Settings2Icon className="text-purple-500" size={20} />
              Configurar Cuotas de Almacenamiento
            </ResponsiveSheetTitle>
            <ResponsiveSheetDescription className="text-xs text-muted-foreground">
              Ajusta el límite máximo de fotos y almacenamiento en GB para {selectedNegocioForCuotas?.nombre}.
            </ResponsiveSheetDescription>
          </ResponsiveSheetHeader>

          <div className="space-y-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-foreground">
                Máximo de Imágenes Permitidas
              </label>
              <Input
                type="number"
                min="10"
                max="500"
                value={maxImagenesInput}
                onChange={(e) => setMaxImagenesInput(Number(e.target.value))}
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-foreground">
                Almacenamiento Máximo (en GB)
              </label>
              <Input
                type="number"
                step="0.1"
                min="0.1"
                max="10"
                value={maxStorageGBInput}
                onChange={(e) => setMaxStorageGBInput(Number(e.target.value))}
              />
            </div>

            <div className="pt-4 flex gap-3">
              <Button
                className="flex-1"
                onClick={handleSaveCuotas}
                disabled={savingCuotas}
              >
                {savingCuotas ? "Guardando..." : "Guardar Cambios"}
              </Button>
              <Button
                variant="outline"
                onClick={() => setSelectedNegocioForCuotas(null)}
              >
                Cancelar
              </Button>
            </div>
          </div>
        </ResponsiveSheetContent>
      </ResponsiveSheet>

      {/* OVERLAY 2: ResponsiveSheet para Rechazar Solicitud */}
      <ResponsiveSheet 
        open={!!selectedSolicitudForRechazo} 
        onOpenChange={(open) => !open && setSelectedSolicitudForRechazo(null)}
      >
        <ResponsiveSheetContent>
          <ResponsiveSheetHeader className="mb-6">
            <ResponsiveSheetTitle className="text-xl font-bold text-red-500 flex items-center gap-2">
              <XCircleIcon size={20} />
              Rechazar Solicitud de Apertura
            </ResponsiveSheetTitle>
            <ResponsiveSheetDescription className="text-xs text-muted-foreground">
              Indica la razón del rechazo para {selectedSolicitudForRechazo?.nombreSolicitante} ({selectedSolicitudForRechazo?.nombreNegocio}).
            </ResponsiveSheetDescription>
          </ResponsiveSheetHeader>

          <div className="space-y-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-foreground">
                Motivo del Rechazo
              </label>
              <Textarea
                rows={4}
                value={motivoRechazoInput}
                onChange={(e) => setMotivoRechazoInput(e.target.value)}
                placeholder="Ejemplo: CUIT no corresponde a la razón social..."
              />
            </div>

            <div className="pt-2 flex gap-3">
              <Button
                className="flex-1"
                variant="destructive"
                onClick={handleRechazarSolicitud}
                disabled={processingSolicitud || !motivoRechazoInput.trim()}
              >
                {processingSolicitud ? "Procesando..." : "Confirmar Rechazo"}
              </Button>
              <Button
                variant="outline"
                onClick={() => setSelectedSolicitudForRechazo(null)}
              >
                Cancelar
              </Button>
            </div>
          </div>
        </ResponsiveSheetContent>
      </ResponsiveSheet>

      {/* OVERLAY 3: ResponsiveSheet para Nuevo Anuncio Broadcast */}
      <ResponsiveSheet 
        open={showNewMessageSheet} 
        onOpenChange={(open) => !open && setShowNewMessageSheet(false)}
      >
        <ResponsiveSheetContent>
          <ResponsiveSheetHeader className="mb-6">
            <ResponsiveSheetTitle className="text-xl font-bold flex items-center gap-2">
              <MegaphoneIcon className="text-blue-500" size={20} />
              Publicar Anuncio Broadcast
            </ResponsiveSheetTitle>
            <ResponsiveSheetDescription className="text-xs text-muted-foreground">
              Redacta un comunicado del sistema que se desplegará en la cabecera de los portales de los clientes.
            </ResponsiveSheetDescription>
          </ResponsiveSheetHeader>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 text-foreground">
                Título del Anuncio
              </label>
              <Input
                type="text"
                value={nuevoTitulo}
                onChange={(e) => setNuevoTitulo(e.target.value)}
                placeholder="Ejemplo: Mantenimiento Programado"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 text-foreground">
                Tipo / Severidad
              </label>
              <select
                value={nuevoTipo}
                onChange={(e) => setNuevoTipo(e.target.value as any)}
                className="w-full h-10 rounded-full border border-input bg-background px-4 text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="INFO">Informativo (Azul)</option>
                <option value="WARNING">Advertencia (Amarillo)</option>
                <option value="URGENT">Urgente (Rojo)</option>
                <option value="MAINTENANCE">Mantenimiento (Naranja)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 text-foreground">
                Alcance
              </label>
              <select
                value={nuevoNegocioId}
                onChange={(e) => setNuevoNegocioId(e.target.value)}
                className="w-full h-10 rounded-full border border-input bg-background px-4 text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Global (Todos los Negocios)</option>
                {data?.negocios?.map((n: any) => (
                  <option key={n.id} value={n.id}>Solo Negocio #{n.id} - {n.nombre}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 text-foreground">
                Mensaje / Contenido
              </label>
              <Textarea
                rows={4}
                value={nuevoContenido}
                onChange={(e) => setNuevoContenido(e.target.value)}
                placeholder="Detalle del anuncio..."
              />
            </div>

            <div className="pt-4 flex gap-3">
              <Button
                className="flex-1"
                onClick={handlePublicarMensaje}
                disabled={publicandoMensaje || !nuevoTitulo.trim() || !nuevoContenido.trim()}
              >
                {publicandoMensaje ? "Publicando..." : "Publicar Anuncio"}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowNewMessageSheet(false)}
              >
                Cancelar
              </Button>
            </div>
          </div>
        </ResponsiveSheetContent>
      </ResponsiveSheet>

    </SidebarProvider>
  );
}

export default function SuperAdminDashboard() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center text-zinc-300 font-sans">
        <RefreshCwIcon className="animate-spin mr-2" size={24} /> Cargando consola Super Admin...
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}
