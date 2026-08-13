import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { useConfigStore } from "@/app/admin/configuraciones/_store/useConfigStore"
import { format, isValid } from "date-fns"
import { es } from "date-fns/locale"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  const symbol = useConfigStore.getState().businessConfig.simboloMoneda || '$';
  return `${symbol}${Number(amount).toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function safeFormatDate(
  dateInput: string | Date | number | null | undefined,
  formatStr: string = "dd MMM HH:mm",
  fallback: string = "-"
): string {
  if (!dateInput) return fallback;
  const d = typeof dateInput === "object" && dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (!isValid(d) || isNaN(d.getTime())) return fallback;
  try {
    return format(d, formatStr, { locale: es });
  } catch (e) {
    return fallback;
  }
}
