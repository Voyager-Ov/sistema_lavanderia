import { ReactNode } from "react";
import { cn } from "@/shared/lib/utils";

interface SettingItemProps {
  title: string;
  description: string;
  children: ReactNode;
  className?: string;
  vertical?: boolean;
}

export function SettingItem({ title, description, children, className, vertical = false }: SettingItemProps) {
  return (
    <div className={cn(
      "flex gap-4 p-5 rounded-2xl border border-neutral-200/80 dark:border-neutral-800/80 bg-white/70 dark:bg-neutral-900/40 backdrop-blur-xl shadow-sm transition-all hover:shadow-md hover:border-brand-blue/30 dark:hover:border-brand-blue/30",
      vertical ? "flex-col" : "flex-col sm:flex-row sm:items-center justify-between",
      className
    )}>
      <div className="space-y-1 max-w-xl">
        <label className="text-[15px] font-semibold text-neutral-900 dark:text-neutral-100 tracking-tight">{title}</label>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">{description}</p>
      </div>
      <div className={cn("flex-shrink-0 flex", vertical ? "w-full mt-2" : "items-center justify-end")}>
        {children}
      </div>
    </div>
  );
}
