import { create } from "zustand";

interface UIStore {
  isProcessing: boolean;
  setProcessing: (isProcessing: boolean) => void;
}

export const useUIStore = create<UIStore>((set) => ({
  isProcessing: false,
  setProcessing: (isProcessing) => set({ isProcessing }),
}));
