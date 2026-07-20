import React from 'react';

export const metadata = {
  title: 'Configuraciones | Sistema Lavandería',
  description: 'Módulo central de configuraciones del sistema',
};

export default function ConfiguracionesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-neutral-50/50 dark:bg-neutral-950/50">
      <div className="mx-auto w-full px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
            Configuraciones
          </h1>
          <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
            Administra los ajustes generales, operaciones, facturación y apariencia de tu negocio.
          </p>
        </div>
        
        {/* Children will contain the Grid for Sidebar and Main Content */}
        {children}
      </div>
    </div>
  );
}
