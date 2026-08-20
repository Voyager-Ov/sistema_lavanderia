"use client"

import React from "react"
import { MinusCircle, Flag } from "lucide-react"
import { CajaActual } from "@/domains/caja/caja.api"
import { Button } from "@/shared/ui/forms/button"

interface PosHeaderActionsProps {
  caja: CajaActual
  onOpenGastoModal: () => void
  onOpenCierreModal: () => void
}

export function PosHeaderActions({ onOpenGastoModal, onOpenCierreModal }: PosHeaderActionsProps) {
  return (
    <div className="flex items-center justify-end gap-2 flex-shrink-0">
      <Button
        type="button"
        onClick={onOpenGastoModal}
        variant="outlineRed"
        size="sm"
        className="h-[36px] px-4 font-bold rounded-full flex items-center gap-1.5"
      >
        <MinusCircle className="w-4 h-4 text-brand-red" />
        <span>Registrar Gasto</span>
      </Button>

      <Button
        type="button"
        onClick={onOpenCierreModal}
        variant="outline"
        size="sm"
        className="h-[36px] px-4 font-bold rounded-full border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-neutral-700 shadow-sm flex items-center gap-1.5"
      >
        <Flag className="w-4 h-4" />
        <span>Cerrar Turno POS</span>
      </Button>
    </div>
  )
}
