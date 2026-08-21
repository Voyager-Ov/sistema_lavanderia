"use client"

import React from "react"
import { GraphicDonutChart } from "@/shared/ui/dashboard/graphic-donut-chart"

interface PieChartAnimatedProps {
  data: any[]
  dataKey?: string
  nameKey?: string
  title: string
  subtitle?: string
  colors?: string[]
  delay?: number
  className?: string
}

export function PieChartAnimated({
  data,
  dataKey = "value",
  nameKey = "name",
  title,
  subtitle,
  colors,
  className
}: PieChartAnimatedProps) {
  return (
    <GraphicDonutChart
      data={data}
      dataKey={dataKey}
      nameKey={nameKey}
      title={title}
      subtitle={subtitle}
      colors={colors}
      className={className}
    />
  )
}

export default PieChartAnimated
