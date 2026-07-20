'use client';

import React, { useEffect } from 'react';
import { useConfigStore } from './_store/useConfigStore';
import { obtenerConfiguracion } from '@/domains/configuracion/api';
import SidebarNav from './_components/SidebarNav';
import BusinessForm from './_components/forms/BusinessForm';
import NotificationsForm from './_components/forms/NotificationsForm';
import HardwareForm from './_components/forms/HardwareForm';
import ArcaForm from './_components/forms/ArcaForm';
import AppearanceForm from './_components/forms/AppearanceForm';
import PaymentsForm from './_components/forms/PaymentsForm';
import FloatingSaveBar from './_components/FloatingSaveBar';
import UnsavedChangesDialog from './_components/UnsavedChangesDialog';

import { Spinner } from '@/shared/ui/feedback/spinner';

export default function ConfiguracionesPage() {
  const { activeTab, setAllConfig, isLoaded, setIsLoaded } = useConfigStore();

  useEffect(() => {
    obtenerConfiguracion().then((data) => {
      if (data) {
        setAllConfig(data);
      }
      setIsLoaded(true);
    }).catch(err => {
      console.error('Error fetching configuracion:', err);
      setIsLoaded(true); // Stop loading even on error
    });
  }, [setAllConfig, setIsLoaded]);

  if (!isLoaded) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] w-full text-neutral-500">
        <Spinner size="lg" className="mb-4" />
        <p className="text-sm font-medium">Cargando configuraciones...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 md:flex-row">
      <aside className="w-full shrink-0 md:min-w-[280px] lg:w-1/4">
        <SidebarNav />
      </aside>

      <main className="flex-1 overflow-hidden">
        {/* Content Area */}
        <div className="rounded-2xl border border-neutral-200 bg-white shadow-md dark:border-neutral-800 dark:bg-neutral-900/50 p-6 md:p-8">
          {activeTab === 'business' && <BusinessForm />}
          {activeTab === 'payments' && <PaymentsForm />}
          {activeTab === 'notifications' && <NotificationsForm />}
          {activeTab === 'hardware' && <HardwareForm />}
          {activeTab === 'arca' && <ArcaForm />}
          {activeTab === 'appearance' && <AppearanceForm />}
        </div>
      </main>

      <FloatingSaveBar />
      <UnsavedChangesDialog />
    </div>
  );
}
