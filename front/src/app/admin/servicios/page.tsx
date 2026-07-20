"use client"

import React, { useRef } from "react"
import { useRouter } from "next/navigation"
import { useGSAP } from "@gsap/react"
import gsap from "gsap"
import { useServiciosData } from "./hooks/useServiciosData"
import { useServiciosActions } from "./hooks/useServiciosActions"
import { useServiciosModals } from "./hooks/useServiciosModals"
import { ServiciosHeader } from "./components/servicios-header"
import { ServiciosKpis } from "./components/servicios-kpis"
import { ServiciosTable } from "./components/servicios-table"
import { ServiciosModals } from "./components/servicios-modals"

export default function ServiciosPage() {
  const containerRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  const data = useServiciosData()
  const actions = useServiciosActions({ fetchServicios: data.fetchServicios, fetchStats: data.fetchStats })
  const modals = useServiciosModals()

  gsap.registerPlugin(useGSAP)
  useGSAP(() => {
    const items = gsap.utils.toArray('.fade-item')
    if (items.length > 0) {
      gsap.fromTo(items, 
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.5, stagger: 0.1, ease: "power2.out", clearProps: "transform" }
      )
    }
  }, { scope: containerRef })

  const handleView = React.useCallback((servicio: any) => router.push(`/admin/servicios/${servicio.id}`), [router])
  const handleEdit = React.useCallback((servicio: any) => router.push(`/admin/servicios/${servicio.id}/editar`), [router])
  const handleNewService = React.useCallback(() => router.push("/admin/servicios/nuevo"), [router])
  const handleManageCategories = React.useCallback(() => modals.setIsCategoriesModalOpen(true), [modals])

  return (
    <div ref={containerRef} className="flex-1 flex flex-col h-full gap-6">
      <div className="flex-1 w-full flex flex-col gap-8">
        
        <ServiciosHeader 
          onNewService={handleNewService}
          onManageCategories={handleManageCategories}
        />

        <ServiciosKpis stats={data.stats} isLoading={data.isStatsLoading} />

        <ServiciosTable 
          data={data}
          actions={actions}
          modals={modals}
          onView={handleView}
          onEdit={handleEdit}
        />
      </div>

      <ServiciosModals 
        data={data}
        actions={actions}
        modals={modals}
      />
    </div>
  )
}
