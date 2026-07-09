import { create } from 'zustand';

interface ClientFiltersState {
  filtroActividad: string;
  setFiltroActividad: (filtro: string) => void;
  // Puedes agregar más filtros aquí en el futuro
  // searchTerm: string;
  // setSearchTerm: (term: string) => void;
}

export const useClientFiltersStore = create<ClientFiltersState>((set) => ({
  filtroActividad: 'todos', // valor por defecto
  setFiltroActividad: (filtro) => set({ filtroActividad: filtro }),
}));
