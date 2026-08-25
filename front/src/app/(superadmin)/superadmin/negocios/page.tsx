"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import { Building2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/shared/ui/forms/button";
import { NegociosTable } from "./_components/negocios-table";
import { CuotasModalSheet } from "./_components/cuotas-modal-sheet";
import { apiClient } from "@/shared/lib/api-client";

function NegociosContent() {
  const [negocios, setNegocios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal de edición de cuotas
  const [selectedNegocioForCuotas, setSelectedNegocioForCuotas] = useState<any>(null);
  const [maxImagenesInput, setMaxImagenesInput] = useState<number>(50);
  const [maxStorageGBInput, setMaxStorageGBInput] = useState<number>(1.0);
  const [savingCuotas, setSavingCuotas] = useState(false);

  const router = useRouter();

  const fetchNegocios = async () => {
    try {
      const token = localStorage.getItem("superadmin_token");
      if (!token || token === "null" || token === "undefined") {
        router.push("/login");
        return;
      }

      const res: any = await apiClient.get("/superadmin/dashboard");
      setNegocios(res?.negocios || []);
    } catch (error: any) {
      console.error("Error fetching negocios", error);
      if (error?.status === 401) {
        localStorage.removeItem("superadmin_token");
        router.push("/login");
        return;
      }
      toast.error("Error al cargar lista de negocios");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNegocios();
  }, []);

  const toggleNegocioStatus = async (id: number, currentStatus: boolean) => {
    if (!confirm(`¿Estás seguro de que quieres ${currentStatus ? 'desactivar' : 'activar'} este negocio?`)) return;

    try {
      await apiClient.put(`/superadmin/negocios/${id}/status`, { activo: !currentStatus });
      toast.success(`Negocio ${!currentStatus ? 'activado' : 'suspendido'} exitosamente`);
      fetchNegocios();
    } catch (error: any) {
      console.error("Error toggling status", error);
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
      fetchNegocios();
    } catch (error: any) {
      console.error("Error saving limits", error);
      toast.error("Error al guardar cuotas", { description: error?.message });
    } finally {
      setSavingCuotas(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground font-sans">
        <RefreshCw className="animate-spin mr-2" size={24} /> Cargando lista de negocios...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center pb-4 border-b border-border">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground tracking-tight flex items-center gap-2">
            <Building2 className="text-blue-500" size={24} /> Gestión de Negocios & Cuotas Multitenant
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Administra estados de servicio, suspensión y límites de storage por negocio
          </p>
        </div>

        <Button size="sm" variant="outline" onClick={() => fetchNegocios()}>
          <RefreshCw size={14} className="mr-1.5" /> Refrescar
        </Button>
      </div>

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
  );
}

export default function NegociosPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-muted-foreground">Cargando negocios...</div>}>
      <NegociosContent />
    </Suspense>
  );
}
