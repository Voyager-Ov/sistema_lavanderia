"use client";

import React from "react";
import Link from "next/link";
import { BottomSheetWrapper } from "./bottom-sheet-wrapper";
import { NavItem } from "../app-sidebar";
import { ChevronRight, LogOut } from "lucide-react";
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

  return (
    <BottomSheetWrapper isOpen={isOpen} onClose={onClose} title="Menú">
      <div className="space-y-6">
        
        {/* Sección Principal */}
        <div className="space-y-1">
          <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2 mb-2">Más Opciones</h4>
          <div className="flex flex-col space-y-2">
            {filteredMainMenu.map((item, index) => {
              const color = colors[index % colors.length];
              const isActive = item.isActive;

              if (item.children && item.children.length > 0) {
                return (
                  <Collapsible key={item.title} className="group/collapsible bg-gray-50/50 rounded-2xl">
                    <CollapsibleTrigger asChild>
                      <button className="w-full flex items-center justify-between p-4 rounded-2xl active:bg-gray-100 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-xl ${color.bg}`}>
                            <item.icon className={`w-5 h-5 ${color.icon}`} />
                          </div>
                          <span className="font-semibold text-gray-900">{item.title}</span>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                      </button>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="px-4 pb-4 pt-1 ml-[3.25rem] border-l-2 border-gray-200 flex flex-col gap-3">
                        {item.children.map(sub => (
                          <Link 
                            key={sub.title}
                            href={sub.href}
                            className="text-gray-600 font-medium active:text-blue-600"
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
                  href={item.href}
                  onClick={onClose}
                  className={`flex items-center gap-3 p-4 rounded-2xl transition-all active:scale-[0.98]
                    ${isActive ? `${color.bg} border border-${color.icon.replace('text-', '')}/20` : 'hover:bg-gray-50 active:bg-gray-100'}`}
                >
                  <div className={`p-2 rounded-xl ${isActive ? 'bg-white' : color.bg}`}>
                    <item.icon className={`w-5 h-5 ${color.icon}`} />
                  </div>
                  <span className={`font-semibold ${isActive ? 'text-gray-900' : 'text-gray-700'}`}>
                    {item.title}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Sección de Cuenta */}
        <div className="space-y-1 pt-4 border-t border-gray-100">
          <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2 mb-2">Mi Cuenta</h4>
          <div className="flex flex-col space-y-2">
            {accountMenu.map(item => (
              <Link
                key={item.title}
                href={item.href}
                onClick={onClose}
                className="flex items-center gap-3 p-4 rounded-2xl active:bg-gray-50 transition-colors"
              >
                <div className="p-2 rounded-xl bg-gray-100">
                  <item.icon className="w-5 h-5 text-gray-500" />
                </div>
                <span className="font-semibold text-gray-700">{item.title}</span>
              </Link>
            ))}

            <button
              onClick={() => {
                onLogout?.();
                onClose();
              }}
              className="flex items-center gap-3 p-4 rounded-2xl active:bg-red-50 transition-colors w-full text-left mt-4"
            >
              <div className="p-2 rounded-xl bg-red-100">
                <LogOut className="w-5 h-5 text-red-600" />
              </div>
              <span className="font-bold text-red-600">Cerrar sesión</span>
            </button>
          </div>
        </div>

      </div>
    </BottomSheetWrapper>
  );
}
