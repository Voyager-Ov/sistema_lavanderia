import React from "react";
import Link from "next/link";
import { BottomSheetWrapper } from "./bottom-sheet-wrapper";
import { NavItem } from "../app-sidebar";
import { ChevronRight, LogOut, Sun, Moon, Monitor } from "lucide-react";
import { useTheme } from "next-themes";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/shared/ui/overlays/collapsible";

interface MobileMenuSheetProps {
  isOpen: boolean;
  onClose: () => void;
  mainMenu: NavItem[];
  accountMenu: NavItem[];
  onLogout?: () => void;
  colors: any[];
}

export function MobileMenuSheet({ isOpen, onClose, mainMenu, accountMenu, onLogout, colors }: MobileMenuSheetProps) {
  // Mostramos en el sheet secundario todos los ítems a partir del 4to (índice 3), 
  // ya que los 3 primeros están fijos en la barra inferior (MobileBottomNav).
  const filteredMainMenu = mainMenu.slice(3);
  const { theme, setTheme } = useTheme();

  return (
    <BottomSheetWrapper isOpen={isOpen} onClose={onClose} title="Menú">
      <div className="space-y-6">
        
        {/* Sección Principal */}
        <div className="space-y-1">
          <h4 className="text-[10px] font-bold text-gray-400 dark:text-neutral-500 uppercase tracking-widest px-2 mb-2">Más Opciones</h4>
          <div className="flex flex-col space-y-2">
            {filteredMainMenu.map((item, index) => {
              const color = colors[index % colors.length];
              const isActive = item.isActive;

              if (item.children && item.children.length > 0) {
                return (
                  <Collapsible key={item.title} className="group/collapsible bg-gray-50/50 dark:bg-neutral-800/40 rounded-2xl">
                    <CollapsibleTrigger asChild>
                      <button className="w-full flex items-center justify-between p-4 rounded-2xl active:bg-gray-100 dark:active:bg-neutral-800 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-xl ${color.bg}`}>
                            <item.icon className={`w-5 h-5 ${color.icon}`} />
                          </div>
                          <span className="font-semibold text-gray-900 dark:text-neutral-100">{item.title}</span>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400 dark:text-neutral-500 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                      </button>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="px-4 pb-4 pt-1 ml-[3.25rem] border-l-2 border-gray-200 dark:border-neutral-700 flex flex-col gap-3">
                        {item.children.map(sub => (
                          <Link 
                            key={sub.title}
                            prefetch={false}
                            href={sub.href}
                            className="text-gray-600 dark:text-neutral-400 font-medium active:text-blue-600"
                            onClick={onClose}
                          >
                            {sub.title}
                          </Link>
                        ))}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                );
              }

              return (
                <Link
                  key={item.title}
                  prefetch={false}
                  href={item.href}
                  onClick={onClose}
                  className={`flex items-center gap-3 p-4 rounded-2xl transition-all active:scale-[0.98]
                    ${isActive ? `${color.bg} border border-${color.icon.replace('text-', '')}/20` : 'hover:bg-gray-50 dark:hover:bg-neutral-800/50 active:bg-gray-100 dark:active:bg-neutral-800'}`}
                >
                  <div className={`p-2 rounded-xl ${isActive ? 'bg-white dark:bg-neutral-900' : color.bg}`}>
                    <item.icon className={`w-5 h-5 ${color.icon}`} />
                  </div>
                  <span className={`font-semibold ${isActive ? 'text-gray-900 dark:text-neutral-100' : 'text-gray-700 dark:text-neutral-300'}`}>
                    {item.title}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Selector de Tema */}
        <div className="space-y-2 pt-4 border-t border-gray-100 dark:border-neutral-800">
          <h4 className="text-[10px] font-bold text-gray-400 dark:text-neutral-500 uppercase tracking-widest px-2 mb-1">Apariencia Visual</h4>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => setTheme("light")}
              className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all ${
                theme === "light"
                  ? "bg-blue-50 dark:bg-blue-500/10 border-blue-500 text-blue-600 dark:text-blue-400 font-bold"
                  : "bg-gray-50 dark:bg-neutral-800/40 border-gray-200 dark:border-neutral-700/60 text-gray-600 dark:text-neutral-400"
              }`}
            >
              <Sun className="w-5 h-5 mb-1 text-amber-500" />
              <span className="text-xs">Claro</span>
            </button>
            <button
              onClick={() => setTheme("dark")}
              className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all ${
                theme === "dark"
                  ? "bg-blue-50 dark:bg-blue-500/10 border-blue-500 text-blue-600 dark:text-blue-400 font-bold"
                  : "bg-gray-50 dark:bg-neutral-800/40 border-gray-200 dark:border-neutral-700/60 text-gray-600 dark:text-neutral-400"
              }`}
            >
              <Moon className="w-5 h-5 mb-1 text-indigo-400" />
              <span className="text-xs">Oscuro</span>
            </button>
            <button
              onClick={() => setTheme("system")}
              className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all ${
                theme === "system"
                  ? "bg-blue-50 dark:bg-blue-500/10 border-blue-500 text-blue-600 dark:text-blue-400 font-bold"
                  : "bg-gray-50 dark:bg-neutral-800/40 border-gray-200 dark:border-neutral-700/60 text-gray-600 dark:text-neutral-400"
              }`}
            >
              <Monitor className="w-5 h-5 mb-1 text-slate-500 dark:text-neutral-400" />
              <span className="text-xs">Sistema</span>
            </button>
          </div>
        </div>

        {/* Sección de Cuenta */}
        <div className="space-y-1 pt-4 border-t border-gray-100 dark:border-neutral-800">
          <h4 className="text-[10px] font-bold text-gray-400 dark:text-neutral-500 uppercase tracking-widest px-2 mb-2">Mi Cuenta</h4>
          <div className="flex flex-col space-y-2">
            {accountMenu.map(item => (
              <Link
                key={item.title}
                href={item.href}
                onClick={onClose}
                className="flex items-center gap-3 p-4 rounded-2xl active:bg-gray-50 dark:active:bg-neutral-800 transition-colors"
              >
                <div className="p-2 rounded-xl bg-gray-100 dark:bg-neutral-800">
                  <item.icon className="w-5 h-5 text-gray-500 dark:text-neutral-400" />
                </div>
                <span className="font-semibold text-gray-700 dark:text-neutral-200">{item.title}</span>
              </Link>
            ))}

            <button
              onClick={() => {
                onLogout?.();
                onClose();
              }}
              className="flex items-center gap-3 p-4 rounded-2xl active:bg-red-50 dark:active:bg-red-500/10 transition-colors w-full text-left mt-4"
            >
              <div className="p-2 rounded-xl bg-red-100 dark:bg-red-500/20">
                <LogOut className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <span className="font-bold text-red-600 dark:text-red-400">Cerrar sesión</span>
            </button>
          </div>
        </div>

      </div>
    </BottomSheetWrapper>
  );
}
