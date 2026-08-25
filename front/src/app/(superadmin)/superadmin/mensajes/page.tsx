"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import { Megaphone, RefreshCw, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/shared/ui/forms/button";
import { MensajesTable } from "./_components/mensajes-table";
import { NuevoMensajeSheet } from "./_components/nuevo-mensaje-sheet";
import { apiClient } from "@/shared/lib/api-client";

function MensajesContent() {
  const [mensajesBroadcast, setMensajesBroadcast] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Formulario nuevo mensaje
  const [showNewMessageSheet, setShowNewMessageSheet] = useState(false);
  const [nuevoTitulo, setNuevoTitulo] = useState("");
  const [nuevoContenido, setNuevoContenido] = useState("");
  const [nuevoTipo, setNuevoTipo] = useState<"INFO" | "WARNING" | "URGENT" | "MAINTENANCE">("INFO");
  const [nuevoNegocioId, setNuevoNegocioId] = useState<string>("");
  const [publicandoMensaje, setPublicandoMensaje] = useState(false);

  const router = useRouter();

  const fetchMensajes = async () => {
    try {
      const token = localStorage.getItem("superadmin_token");
      if (!token || token === "null" || token === "undefined") {
        router.push("/login");
        return;
      }

      const res: any = await apiClient.get("/superadmin/mensajes");
      setMensajesBroadcast(res?.data || []);
    } catch (error: any) {
      console.error("Error fetching mensajes", error);
      if (error?.status === 401) {
        localStorage.removeItem("superadmin_token");
        router.push("/login");
        return;
      }
      toast.error("Error al cargar mensajes broadcast");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMensajes();
  }, []);

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
      fetchMensajes();
    } catch (error: any) {
      console.error("Error al publicar anuncio", error);
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
      fetchMensajes();
    } catch (error: any) {
      console.error("Error al desactivar mensaje", error);
      toast.error("Error al desactivar anuncio", { description: error?.message });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground font-sans">
        <RefreshCw className="animate-spin mr-2" size={24} /> Cargando mensajes...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center pb-4 border-b border-border">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground tracking-tight flex items-center gap-2">
            <Megaphone className="text-purple-500" size={24} /> Mensajería Broadcast & Banners del Sistema
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Publica avisos globales o específicos a los clientes del sistema
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button size="sm" onClick={() => setShowNewMessageSheet(true)}>
            <Send size={14} className="mr-1.5" /> Publicar Anuncio
          </Button>
          <Button size="sm" variant="outline" onClick={() => fetchMensajes()}>
            <RefreshCw size={14} className="mr-1.5" /> Refrescar
          </Button>
        </div>
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
  );
}

export default function MensajesPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-muted-foreground">Cargando mensajes...</div>}>
      <MensajesContent />
    </Suspense>
  );
}
