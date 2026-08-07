"use client";

import React, { useState, useEffect } from 'react';
import { apiClient } from '@/shared/lib/api-client';
import { Button } from '@/shared/ui/forms/button';
import { Input } from '@/shared/ui/forms/input';
import { Label } from '@/shared/ui/forms/label';
import { Switch } from '@/shared/ui/forms/switch';
import { Trash2, Plus, GripVertical, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface Motivo {
  id?: number;
  motivo: string;
  activo: boolean;
}

export default function OrdersForm() {
  const [motivos, setMotivos] = useState<Motivo[]>([]);
  const [newMotivo, setNewMotivo] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMotivos();
  }, []);

  const fetchMotivos = async () => {
    try {
      const res = await apiClient.get<any>('/pedidos/motivos-cancelacion/admin');
      setMotivos(res);
    } catch (error) {
      toast.error("Error al cargar motivos de cancelación");
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!newMotivo.trim()) return;
    try {
      const res = await apiClient.post<any>('/pedidos/motivos-cancelacion', { motivo: newMotivo.trim() });
      setMotivos([...motivos, res]);
      setNewMotivo("");
      toast.success("Motivo agregado");
    } catch (error) {
      toast.error("Error al agregar motivo");
    }
  };

  const handleToggle = async (id: number, activo: boolean) => {
    try {
      await apiClient.put(`/pedidos/motivos-cancelacion/${id}`, { activo });
      setMotivos(motivos.map(m => m.id === id ? { ...m, activo } : m));
      toast.success(activo ? "Motivo activado" : "Motivo desactivado");
    } catch (error) {
      toast.error("Error al actualizar motivo");
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await apiClient.delete(`/pedidos/motivos-cancelacion/${id}`);
      setMotivos(motivos.filter(m => m.id !== id));
      toast.success("Motivo eliminado");
    } catch (error) {
      toast.error("Error al eliminar motivo");
    }
  };

  if (loading) return <div className="p-8 text-center text-neutral-500">Cargando...</div>;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div>
        <h2 className="text-xl font-bold text-foreground">Gestión de Pedidos</h2>
        <p className="text-sm text-muted-foreground mt-1">Configura las reglas operativas de los pedidos y el punto de venta.</p>
      </div>

      <div className="space-y-4 max-w-2xl">
        <h3 className="text-sm font-bold text-foreground">Motivos de Cancelación</h3>
        <p className="text-xs text-muted-foreground mb-4">
          Estas opciones aparecerán en la ventana de cancelación de pedidos para que el empleado seleccione rápidamente el motivo.
        </p>

        {motivos.length === 0 && (
          <div className="p-4 bg-blue-50 dark:bg-blue-900/10 text-brand-blue rounded-xl flex items-start gap-3 border border-brand-blue/20">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-bold">No hay motivos configurados</p>
              <p className="mt-1">El sistema usará motivos por defecto. Agrega tus propios motivos aquí para personalizarlos.</p>
            </div>
          </div>
        )}

        <div className="flex gap-2 mb-6">
          <Input 
            placeholder="Ej: Problemas técnicos" 
            value={newMotivo}
            onChange={(e) => setNewMotivo(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            className="flex-1"
          />
          <Button onClick={handleAdd} className="gap-2 bg-brand-blue hover:bg-blue-700 text-white font-bold">
            <Plus className="w-4 h-4" /> Agregar
          </Button>
        </div>

        <div className="space-y-2">
          {motivos.map((m) => (
            <div key={m.id} className="flex items-center gap-3 p-3 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl border border-neutral-200 dark:border-neutral-700">
              <GripVertical className="w-4 h-4 text-neutral-400 cursor-grab active:cursor-grabbing" />
              <span className={`flex-1 text-sm font-medium ${!m.activo && 'text-neutral-400 line-through'}`}>{m.motivo}</span>
              
              <Switch 
                checked={m.activo} 
                onCheckedChange={(checked) => handleToggle(m.id!, checked)}
              />
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                onClick={() => handleDelete(m.id!)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
