'use client';

import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Plus, Trash2, Banknote, CreditCard, Wallet, Smartphone, Landmark, QrCode, Building, Gem, DollarSign } from 'lucide-react';
import { Switch } from '@/shared/ui/forms/switch';
import { Input } from '@/shared/ui/forms/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/forms/select';
import { obtenerMetodosPago, crearMetodoPago, toggleMetodoPago, eliminarMetodoPago, MetodoPago } from '@/domains/pagos/api';

// Lucide Icons mapped by name for the DB
export const ICON_OPTIONS = {
  Banknote: Banknote,
  CreditCard: CreditCard,
  Wallet: Wallet,
  Smartphone: Smartphone,
  Landmark: Landmark,
  QrCode: QrCode,
  Building: Building,
  Gem: Gem,
  DollarSign: DollarSign
};

export type IconName = keyof typeof ICON_OPTIONS;

export const resolveIcon = (iconName?: string) => {
  if (!iconName) return Banknote;
  const Icon = ICON_OPTIONS[iconName as IconName];
  return Icon || Banknote;
};

export default function PaymentsForm() {
  const [methods, setMethods] = useState<MetodoPago[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [newIcon, setNewIcon] = useState<string>('Banknote');

  useEffect(() => {
    loadMethods();
  }, []);

  const loadMethods = async () => {
    try {
      setLoading(true);
      const data = await obtenerMetodosPago();
      setMethods(data);
    } catch (error) {
      toast.error('Error al cargar los métodos de pago');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    try {
      const added = await crearMetodoPago(newName, newIcon);
      setMethods([...methods, added]);
      setNewName('');
      setNewIcon('Banknote');
      toast.success('Método de pago agregado');
    } catch (error: any) {
      toast.error(error.message || 'Error al agregar');
    }
  };

  const handleToggle = async (id: number, currentStatus: boolean) => {
    // Optimistic update
    setMethods(methods.map(m => m.id === id ? { ...m, activo: !currentStatus } : m));
    try {
      await toggleMetodoPago(id);
    } catch (error: any) {
      // Revert on error
      setMethods(methods.map(m => m.id === id ? { ...m, activo: currentStatus } : m));
      toast.error(error.message || 'Error al actualizar estado');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await eliminarMetodoPago(id);
      setMethods(methods.filter(m => m.id !== id));
      toast.success('Método de pago eliminado');
    } catch (error: any) {
      toast.error(error.message || 'Error al eliminar');
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-neutral-500">Cargando métodos de pago...</div>;
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
            Métodos de Pago
          </h2>
          <p className="mt-2 text-[15px] text-neutral-500 dark:text-neutral-400">
            Administra los medios de pago disponibles para los cajeros.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {methods.map((method) => {
          const isEnabled = method.activo;
          const Icon = resolveIcon(method.icono);

          return (
            <div 
              key={method.id}
              className={`p-5 rounded-2xl border transition-all shadow-sm relative group ${
                isEnabled 
                  ? 'border-neutral-200/80 dark:border-neutral-800/80 bg-white/70 dark:bg-neutral-900/40 backdrop-blur-xl hover:shadow-md hover:border-brand-blue/30' 
                  : 'border-neutral-200/50 dark:border-neutral-800/50 bg-neutral-50/50 dark:bg-neutral-950/30 opacity-75'
              }`}
            >
              {!method.esFijo && (
                <div className="absolute right-4 top-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={() => handleDelete(method.id)}
                    className="p-1.5 text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950 rounded-lg transition-colors"
                    title="Eliminar método"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-5 items-start sm:items-center pr-12">
                <div className="flex items-center gap-4 flex-1 w-full">
                  <div className={`p-3 rounded-xl ${isEnabled ? 'bg-brand-blue/10 text-brand-blue' : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-500'}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  
                  <div className="flex-1 space-y-3 w-full">
                    <p className={`font-bold text-lg ${!isEnabled && 'text-neutral-500'}`}>
                      {method.nombre}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-center gap-1 sm:pl-4 sm:border-l border-neutral-200 dark:border-neutral-800">
                  <label className="text-xs font-semibold text-neutral-500">Estado</label>
                  <Switch
                    checked={isEnabled}
                    onCheckedChange={() => handleToggle(method.id, isEnabled)}
                  />
                </div>
              </div>
            </div>
          );
        })}

        {methods.length === 0 && (
          <div className="p-8 text-center border-2 border-dashed border-neutral-200 dark:border-neutral-800 rounded-2xl text-neutral-500">
            No tienes métodos de pago configurados.
          </div>
        )}

        <form onSubmit={handleAdd} className="mt-6 flex flex-col md:flex-row items-center gap-3 bg-neutral-50 dark:bg-neutral-900 p-2 rounded-2xl border border-neutral-200 dark:border-neutral-800">
          <div className="w-full md:w-[180px]">
            <Select value={newIcon} onValueChange={setNewIcon}>
              <SelectTrigger className="border-none shadow-none bg-transparent focus:ring-0 font-medium">
                <SelectValue placeholder="Ícono" />
              </SelectTrigger>
              <SelectContent>
                {Object.keys(ICON_OPTIONS).map((key) => {
                  const IconCmp = ICON_OPTIONS[key as IconName];
                  return (
                    <SelectItem key={key} value={key}>
                      <div className="flex items-center gap-2">
                        <IconCmp className="w-4 h-4 text-brand-blue" />
                        <span>{key}</span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
          
          <Input 
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder="Nombre del nuevo método..." 
            className="flex-1 border-none shadow-none bg-transparent focus-visible:ring-0 px-4 font-medium"
          />
          <button
            type="submit"
            disabled={!newName.trim()}
            className="flex items-center justify-center gap-2 px-6 py-2.5 w-full md:w-auto bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-sm font-bold rounded-xl hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors shadow-sm disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            Agregar
          </button>
        </form>
      </div>
    </div>
  );
}
