"use client";

import React, { useState, useEffect, useRef } from "react";
import { LayoutDashboard, ShoppingCart, Wallet, Search, Menu, X, Loader2 } from "lucide-react";
import { MobileMenuSheet } from "./mobile-menu-sheet";
import { NavItem } from "../app-sidebar";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";

interface MobileBottomNavProps {
  mainMenu: NavItem[];
  accountMenu: NavItem[];
  onLogout?: () => void;
  colors: any[];
}

import { useRouter, usePathname } from "next/navigation";

export function MobileBottomNav({ mainMenu, accountMenu, onLogout, colors }: MobileBottomNavProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  // Search state
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  const navItems = [
    // Tomamos hasta los 3 primeros elementos del menú principal
    ...mainMenu.slice(0, 3).map((item, index) => {
      const color = colors[index % colors.length];
      return {
        id: item.title,
        icon: item.icon,
        href: item.href,
        colorClass: color.icon, // e.g. text-blue-600
        bgClass: `${color.bg} border-${color.icon.replace('text-', '')}/20`, 
        isAction: false,
        action: undefined
      };
    }),
    // Acciones fijas
    { id: "Buscador", icon: Search, isAction: true, action: () => openSearch(), colorClass: "text-gray-700", bgClass: "bg-gray-200/50 border-gray-300/50" },
    { id: "Menu", icon: Menu, isAction: true, action: () => setIsMenuOpen(true), colorClass: "text-gray-700", bgClass: "bg-gray-200/50 border-gray-300/50" },
  ];

  const openSearch = () => {
    setIsSearchOpen(true);
    setQuery("");
    setResults([]);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  const closeSearch = () => {
    setIsSearchOpen(false);
    setQuery("");
    setResults([]);
  };

  // Animar Overlay
  useGSAP(() => {
    if (isSearchOpen) {
      gsap.to(overlayRef.current, { opacity: 1, duration: 0.3, display: "block", ease: "power2.out" });
    } else {
      gsap.to(overlayRef.current, { opacity: 0, duration: 0.3, display: "none", ease: "power2.in" });
    }
  }, [isSearchOpen]);

  // Simulación de búsqueda
  useEffect(() => {
    if (query.length > 2) {
      setIsSearching(true);
      const timer = setTimeout(() => {
        setResults([
          { id: 1, title: `Pedido #${Math.floor(Math.random() * 1000)}`, desc: "En proceso" },
          { id: 2, title: "Cliente: Juan Pérez", desc: "Última visita: hoy" },
          { id: 3, title: "Producto: Jabón Líquido", desc: "Stock: 12 unidades" },
        ]);
        setIsSearching(false);
      }, 600);
      return () => clearTimeout(timer);
    } else {
      setResults([]);
    }
  }, [query]);

  // Animar resultados (stagger)
  useGSAP(() => {
    if (results.length > 0 && resultsRef.current) {
      const items = resultsRef.current.querySelectorAll(".search-result-item");
      gsap.fromTo(items, 
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 0.3, stagger: 0.05, ease: "power2.out" }
      );
    }
  }, [results]);

  return (
    <>
      {/* Overlay oscuro para la búsqueda */}
      <div 
        ref={overlayRef}
        className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm opacity-0 hidden z-50"
        onClick={closeSearch}
      />

      <div className="md:hidden fixed bottom-6 left-4 right-4 z-[60] flex flex-col justify-end">
        {/* Floating Pill Container */}
        <div className={`
          bg-white/95 backdrop-blur-xl shadow-[0_8px_32px_rgb(0,0,0,0.15)] overflow-hidden transition-all duration-300 ease-out
          ${isSearchOpen ? 'rounded-[2rem] p-3' : 'border border-white/40 rounded-[2rem] p-2 flex items-center justify-between'}
        `}>
          
          {isSearchOpen ? (
            <div className="flex flex-col w-full">
              {/* Resultados de búsqueda dinámicos (crecen hacia arriba) */}
              <div 
                ref={resultsRef} 
                className="w-full flex flex-col-reverse gap-2 max-h-[50vh] overflow-y-auto px-1 transition-all duration-300"
              >
                {results.map((res) => (
                  <div 
                    key={res.id} 
                    className="search-result-item p-4 bg-gray-50 border border-gray-100 rounded-2xl hover:border-blue-200 active:scale-[0.98] transition-all cursor-pointer"
                    onClick={closeSearch}
                  >
                    <h4 className="font-bold text-gray-900">{res.title}</h4>
                    <p className="text-sm text-gray-500">{res.desc}</p>
                  </div>
                ))}

                {query.length > 0 && query.length <= 2 && (
                  <p className="text-center text-sm font-medium text-gray-500 py-4">Escribe al menos 3 caracteres...</p>
                )}
                
                {query.length > 2 && results.length === 0 && !isSearching && (
                  <p className="text-center text-sm font-medium text-gray-500 py-4">No se encontraron resultados.</p>
                )}
              </div>

              {/* Separador dinámico si hay contenido arriba */}
              {(query.length > 0 || results.length > 0) && (
                <div className="w-full h-px bg-gray-100 my-2" />
              )}

              {/* Search Input Row (siempre visible abajo) */}
              <div className="flex items-center h-12 px-2">
                <Search className="w-5 h-5 text-gray-400 flex-shrink-0" />
                <input 
                  ref={inputRef}
                  className="flex-1 bg-transparent border-none px-3 h-full focus:outline-none focus:ring-0 text-gray-900 placeholder:text-gray-400 font-medium" 
                  placeholder="Buscar..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
                {isSearching ? (
                  <Loader2 className="w-5 h-5 text-blue-500 animate-spin flex-shrink-0" />
                ) : (
                  <button 
                    onClick={closeSearch}
                    className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 active:bg-gray-200 transition-colors flex-shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ) : (
            // Iconos del menú normal
            navItems.map((item) => {
              const isActive = !item.isAction && 'href' in item && item.href ? pathname.startsWith(item.href) : false;
              const Icon = item.icon;

              return (
                <button
                  key={item.id}
                  onClick={(e) => {
                    if (item.isAction && item.action) {
                      item.action();
                    } else if ('href' in item && item.href) {
                      e.preventDefault();
                      router.push(item.href);
                    }
                  }}
                  className={`
                    relative flex items-center justify-center h-12 transition-all duration-300 ease-out
                    ${isActive ? `w-28 rounded-2xl border ${item.bgClass}` : 'w-12 rounded-full hover:bg-gray-100/50'}
                  `}
                >
                  <div className={`flex items-center gap-2 ${isActive ? item.colorClass : 'text-gray-500'}`}>
                    <Icon className={`w-6 h-6 transition-transform duration-300 ${isActive ? 'scale-110' : 'scale-100'}`} />
                    {isActive && (
                      <span className="font-semibold text-sm animate-in fade-in slide-in-from-left-2 duration-300">
                        {item.id}
                      </span>
                    )}
                  </div>
                </button>
              );
            })
          )}
          
        </div>
      </div>

      {/* GSAP Bottom Sheets para Menú */}
      <MobileMenuSheet 
        isOpen={isMenuOpen} 
        onClose={() => setIsMenuOpen(false)}
        mainMenu={mainMenu}
        accountMenu={accountMenu}
        onLogout={onLogout}
        colors={colors}
      />
    </>
  );
}
