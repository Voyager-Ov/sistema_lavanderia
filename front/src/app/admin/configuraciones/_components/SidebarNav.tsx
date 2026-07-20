'use client';

import React, { useRef } from 'react';
import { useConfigStore, ConfigTab } from '../_store/useConfigStore';
import { 
  Building2, 
  Settings2, 
  BellRing, 
  Printer, 
  Palette,
  CreditCard,
  Archive,
  Receipt
} from 'lucide-react';
import { cn } from '@/lib/utils'; // Assuming this utility exists

const navItems: { id: ConfigTab; label: string; icon: React.ElementType; color: string }[] = [
  { id: 'business', label: 'Negocio', icon: Building2, color: 'text-brand-blue bg-blue-50/50 dark:bg-blue-900/20' },
  { id: 'payments', label: 'Pagos', icon: CreditCard, color: 'text-brand-green bg-green-50/50 dark:bg-green-900/20' },
  { id: 'notifications', label: 'Notificaciones', icon: BellRing, color: 'text-brand-orange bg-orange-50/50 dark:bg-orange-900/20' },
  { id: 'hardware', label: 'Hardware y Tickets', icon: Printer, color: 'text-brand-purple bg-purple-50/50 dark:bg-purple-900/20' },
  { id: 'arca', label: 'Facturación ARCA', icon: Receipt, color: 'text-blue-500 bg-blue-50 dark:bg-blue-900/30' },
  { id: 'appearance', label: 'Apariencia', icon: Palette, color: 'text-pink-600 bg-pink-50/50 dark:bg-pink-900/20' },
];

export default function SidebarNav() {
  const { activeTab, setActiveTab, setPendingTabChange } = useConfigStore();
  const navRef = useRef<HTMLElement>(null);

  const handleTabClick = (tabId: ConfigTab) => {
    if (activeTab === tabId) return;
    
    if (useConfigStore.getState().isDirty) {
      setPendingTabChange(tabId);
    } else {
      setActiveTab(tabId);
    }
  };

  return (
    <nav ref={navRef} className="flex space-x-2 md:flex-col md:space-x-0 md:space-y-1.5 overflow-x-auto pb-4 md:pb-0">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;
        
        return (
          <button
            key={item.id}
            onClick={() => handleTabClick(item.id)}
            className={cn(
              'nav-item flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-300',
              'hover:bg-neutral-100 dark:hover:bg-neutral-800 whitespace-nowrap md:whitespace-normal',
              isActive
                ? `shadow-sm border border-transparent ${item.color}`
                : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100 hover:bg-neutral-50 dark:hover:bg-neutral-800/50'
            )}
          >
            <Icon className={cn('h-5 w-5', isActive ? '' : 'text-neutral-400')} />
            {item.label}
          </button>
        );
      })}
    </nav>
  );
}
