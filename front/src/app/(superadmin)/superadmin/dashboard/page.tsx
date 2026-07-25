"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  ServerIcon, 
  DatabaseIcon, 
  GlobeIcon, 
  ActivityIcon,
  PowerIcon,
  UsersIcon,
  AlertCircleIcon,
  CheckCircle2Icon,
  LogOutIcon
} from "lucide-react";

export default function SuperAdminDashboard() {
  const [data, setData] = useState<any>(null);
  const [health, setHealth] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem("superadmin_token");
      if (!token) {
        router.push("/superadmin/login");
        return;
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      
      const [dashRes, healthRes] = await Promise.all([
        fetch(`${apiUrl}/api/superadmin/dashboard`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${apiUrl}/api/superadmin/health-check`, {
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

      setData(dashData);
      setHealth(healthData);
    } catch (error) {
      console.error("Error fetching dashboard data", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 60000); // Refrescar cada minuto
    return () => clearInterval(interval);
  }, []);

  const toggleNegocioStatus = async (id: number, currentStatus: boolean) => {
    if (!confirm(`¿Estás seguro de que quieres ${currentStatus ? 'desactivar' : 'activar'} este negocio?`)) return;

    try {
      const token = localStorage.getItem("superadmin_token");
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      
      await fetch(`${apiUrl}/api/superadmin/negocios/${id}/status`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ activo: !currentStatus })
      });
      
      fetchDashboardData();
    } catch (error) {
      console.error("Error toggling status", error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("superadmin_token");
    router.push("/superadmin/login");
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Cargando panel...</div>;
  }

  return (
    <div className="min-h-screen p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Super Admin Console</h1>
          <p className="text-zinc-400 mt-1">Monitoreo general y gestión de inquilinos</p>
        </div>
        <button 
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg hover:bg-zinc-800 transition-colors text-sm font-medium"
        >
          <LogOutIcon size={16} /> Cerrar Sesión
        </button>
      </div>

      {/* Tarjetas de Salud del Sistema */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 p-6 rounded-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-10">
            <DatabaseIcon size={64} />
          </div>
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-3 h-3 rounded-full ${health?.dbStatus?.status === 'ok' ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)] animate-pulse'}`} />
            <h3 className="font-semibold text-lg text-white">Base de Datos Central</h3>
          </div>
          <p className="text-zinc-400 text-sm">
            {health?.dbStatus?.status === 'ok' ? 'Conexión estable y queries respondiendo.' : health?.dbStatus?.message || 'Error de conexión'}
          </p>
        </div>

        <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 p-6 rounded-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-10">
            <ServerIcon size={64} />
          </div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-3 h-3 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
            <h3 className="font-semibold text-lg text-white">API / Backend</h3>
          </div>
          <p className="text-zinc-400 text-sm">
            El servicio de backend está operativo y respondiendo a peticiones.
          </p>
        </div>

        <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 p-6 rounded-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-10">
            <GlobeIcon size={64} />
          </div>
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-3 h-3 rounded-full ${health?.mfStatus?.some((m: any) => m.status !== 'ok') ? 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]' : 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]'}`} />
            <h3 className="font-semibold text-lg text-white">Microfrontends</h3>
          </div>
          <p className="text-zinc-400 text-sm mb-3">
            {health?.mfStatus?.filter((m: any) => m.status === 'ok').length} / {health?.mfStatus?.length} activos operando correctamente.
          </p>
          <div className="space-y-2">
            {health?.mfStatus?.map((mf: any, idx: number) => (
              <div key={idx} className="flex justify-between items-center text-xs">
                <span className="text-zinc-300">{mf.name}</span>
                {mf.status === 'ok' ? (
                  <CheckCircle2Icon size={14} className="text-green-500" />
                ) : (
                  <span title={mf.message}>
                    <AlertCircleIcon size={14} className="text-red-500" />
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 rounded-2xl overflow-hidden">
            <div className="p-6 border-b border-zinc-800 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <UsersIcon size={20} className="text-blue-400" /> Negocios (Tenants)
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-zinc-950/50 text-zinc-400 text-sm">
                  <tr>
                    <th className="p-4 font-medium">Nombre</th>
                    <th className="p-4 font-medium">Suscripción</th>
                    <th className="p-4 font-medium">Estado</th>
                    <th className="p-4 font-medium text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/50 text-sm">
                  {data?.negocios?.map((negocio: any) => (
                    <tr key={negocio.id} className="hover:bg-zinc-800/20 transition-colors">
                      <td className="p-4 text-zinc-200">{negocio.nombre}</td>
                      <td className="p-4">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border
                          ${negocio.estadoSuscripcion === 'ACTIVA' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 
                            negocio.estadoSuscripcion === 'PRUEBA' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 
                            'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                          {negocio.estadoSuscripcion}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${negocio.activo ? 'bg-green-500' : 'bg-red-500'}`} />
                          <span className={negocio.activo ? 'text-zinc-300' : 'text-zinc-500'}>
                            {negocio.activo ? 'Operativo' : 'Suspendido'}
                          </span>
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => toggleNegocioStatus(negocio.id, negocio.activo)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors
                            ${negocio.activo 
                              ? 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20' 
                              : 'bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/20'}`}
                        >
                          <PowerIcon size={14} />
                          {negocio.activo ? 'Cortar Servicio' : 'Reactivar'}
                        </button>
                      </td>
                    </tr>
                  ))}
                  {data?.negocios?.length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-zinc-500">
                        No hay negocios registrados.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 p-6 rounded-2xl">
            <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
              <ActivityIcon size={20} className="text-purple-400" /> Resumen General
            </h2>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 bg-zinc-950/50 rounded-xl border border-zinc-800/50">
                <span className="text-zinc-400 text-sm">Total Negocios</span>
                <span className="text-2xl font-bold text-white">{data?.stats?.totalNegocios || 0}</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-zinc-950/50 rounded-xl border border-zinc-800/50">
                <span className="text-zinc-400 text-sm">Negocios Activos</span>
                <span className="text-2xl font-bold text-green-400">{data?.stats?.activos || 0}</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-zinc-950/50 rounded-xl border border-zinc-800/50">
                <span className="text-zinc-400 text-sm">Negocios Suspendidos</span>
                <span className="text-2xl font-bold text-red-400">{data?.stats?.inactivos || 0}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
