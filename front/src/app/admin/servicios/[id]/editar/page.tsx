"use client"

import { useParams } from "next/navigation"
import { ServicioForm } from "../../components/servicio-form"

export default function EditarServicioPage() {
  const params = useParams()
  const id = Array.isArray(params.id) ? params.id[0] : params.id as string

  return (
    <div className="flex-1 flex flex-col h-full gap-6 p-4 md:p-8 pt-6">
      <ServicioForm id={id} />
    </div>
  )
}
