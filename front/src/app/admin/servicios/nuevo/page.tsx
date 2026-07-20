"use client"

import { ServicioForm } from "../components/servicio-form"

export default function NuevoServicioPage() {
  return (
    <div className="flex-1 flex flex-col h-full gap-6 p-4 md:p-8 pt-6">
      <ServicioForm />
    </div>
  )
}
