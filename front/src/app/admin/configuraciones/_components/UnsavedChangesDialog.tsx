'use client';

import React from 'react';
import { useConfigStore } from '../_store/useConfigStore';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/shared/ui/overlays/alert-dialog";

export default function UnsavedChangesDialog() {
  const { pendingTabChange, setPendingTabChange, setActiveTab, setIsDirty } = useConfigStore();

  const handleConfirm = () => {
    if (pendingTabChange) {
      setIsDirty(false); // Discard changes
      setActiveTab(pendingTabChange);
      setPendingTabChange(null);
    }
  };

  const handleCancel = () => {
    setPendingTabChange(null);
  };

  return (
    <AlertDialog open={pendingTabChange !== null} onOpenChange={(open) => !open && handleCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Tienes cambios sin guardar</AlertDialogTitle>
          <AlertDialogDescription>
            Si cambias de pestaña ahora, perderás las modificaciones que no has guardado. ¿Estás seguro de querer descartar tus cambios?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleCancel}>Cancelar</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleConfirm} 
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            Descartar cambios
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
