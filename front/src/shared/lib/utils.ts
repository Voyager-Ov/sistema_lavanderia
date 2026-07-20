import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { useConfigStore } from "@/app/admin/configuraciones/_store/useConfigStore"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  const symbol = useConfigStore.getState().businessConfig.simboloMoneda || '$';
  return `${symbol}${Number(amount).toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
