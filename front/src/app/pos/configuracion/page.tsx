"use client"

import React, { useEffect, useRef } from 'react'
import { useConfigStore, ConfigTab } from '@/app/admin/configuraciones/_store/useConfigStore'
import { obtenerConfiguracion } from '@/domains/configuracion/api'
import HardwareForm from '@/app/admin/configuraciones/_components/forms/HardwareForm'
import AppearanceForm from '@/app/admin/configuraciones/_components/forms/AppearanceForm'
import FloatingSaveBar from '@/app/admin/configuraciones/_components/FloatingSaveBar'
import UnsavedChangesDialog from '@/app/admin/configuraciones/_components/UnsavedChangesDialog'
import { Spinner } from '@/shared/ui/feedback/spinner'
import { Printer, Palette, Settings } from 'lucide-react'
import { cn } from '@/shared/lib/utils'

const navItems: { id: ConfigTab; label: string; icon: React.ElementType; color: string }[] = [
  { id: 'hardware', label: 'Hardware y Tickets', icon: Printer, color: 'text-brand-purple bg-purple-50/50 dark:bg-purple-900/20' },
  { id: 'appearance', label: 'Apariencia', icon: Palette, color: 'text-pink-600 bg-pink-50/50 dark:bg-pink-900/20' },
]

function PosSidebarNav() {
  const { activeTab, setActiveTab, setPendingTabChange } = useConfigStore()
  const navRef = useRef<HTMLElement>(null)

  // Force active tab to be one of the available ones if it isn't
  useEffect(() => {
    if (activeTab !== 'hardware' && activeTab !== 'appearance') {
      setActiveTab('hardware')
    }
  }, [activeTab, setActiveTab])

  const handleTabClick = (tabId: ConfigTab) => {
    if (activeTab === tabId) return
    
    if (useConfigStore.getState().isDirty) {
      setPendingTabChange(tabId)
    } else {
      setActiveTab(tabId)
    }
  }

  return (
    <nav ref={navRef} className="flex space-x-2 md:flex-col md:space-x-0 md:space-y-1.5 overflow-x-auto pb-4 md:pb-0">
      {navItems.map((item) => {
        const Icon = item.icon
        const isActive = activeTab === item.id
        
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
        )
      })}
    </nav>
  )
}

export default function PosConfiguracionPage() {
  const { activeTab, setAllConfig, isLoaded, setIsLoaded } = useConfigStore()

  useEffect(() => {
    obtenerConfiguracion().then((data) => {
      if (data) {
        setAllConfig(data)
      }
      setIsLoaded(true)
    }).catch(err => {
      console.error('Error fetching configuracion:', err)
      setIsLoaded(true) // Stop loading even on error
    })
  }, [setAllConfig, setIsLoaded])

  if (!isLoaded) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] w-full text-neutral-500">
        <Spinner size="lg" className="mb-4" />
        <p className="text-sm font-medium">Cargando configuraciones...</p>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col h-full gap-6 p-4 lg:p-8 max-w-[1400px] mx-auto w-full">
      <div className="flex items-center gap-4 mb-2">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-slate-200 text-slate-700">
          <Settings className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            Ajustes Locales
          </h1>
          <p className="text-slate-500 mt-1">Configura preferencias y hardware para esta terminal.</p>
        </div>
      </div>

      <div className="flex flex-col gap-8 md:flex-row mt-4">
        <aside className="w-full shrink-0 md:min-w-[280px] lg:w-1/4">
          <PosSidebarNav />
        </aside>

        <main className="flex-1 overflow-hidden">
          {/* Content Area */}
          <div className="rounded-2xl border border-neutral-200 bg-white shadow-md dark:border-neutral-800 dark:bg-neutral-900/50 p-6 md:p-8">
            {activeTab === 'hardware' && <HardwareForm />}
            {activeTab === 'appearance' && <AppearanceForm />}
          </div>
        </main>

        <FloatingSaveBar />
        <UnsavedChangesDialog />
      </div>
    </div>
  )
}
