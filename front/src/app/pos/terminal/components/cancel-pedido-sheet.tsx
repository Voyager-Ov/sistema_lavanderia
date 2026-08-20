"use client"

import React from "react"
import { Pedido, cambiarEstadoPedido } from "@/domains/pedidos/api"
import { CancelOrderSheet } from "@/app/admin/pedidos/components/cancel-order-sheet"
import { toast } from "sonner"

interface CancelPedidoSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  pedido: Pedido | null
  onSuccess: () => void
  onDismiss: () => void
}

export function CancelPedidoSheet({ open, onOpenChange, pedido, onSuccess, onDismiss }: CancelPedidoSheetProps) {
  const handleConfirm = async (
    pedidoId: number,
    motivo: string,
    descripcion: string,
    accionDinero: "SALDO_A_FAVOR" | "DEVOLVER"
  ) => {
    try {
      await cambiarEstadoPedido(pedidoId, "CANCELADO", undefined, motivo, descripcion, accionDinero)
      toast.success("Pedido cancelado correctamente")
      onSuccess()
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message || "Error al cancelar el pedido"
      toast.error(errorMessage)
      throw error
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      onDismiss()
    }
    onOpenChange(newOpen)
  }

  return (
    <CancelOrderSheet
      open={open}
      onOpenChange={handleOpenChange}
      pedido={pedido}
      onConfirm={handleConfirm}
    />
  )
}
