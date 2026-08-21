"use client"

import React from "react"
import { RadialSegmentedGauge } from "./radial-segmented-gauge"

export interface DashboardGaugeProps {
  title: string
  currentValue: number
  targetValue: number
  subtitle?: string
  color?: "blue" | "green" | "yellow" | "red" | "orange" | "purple"
  className?: string
  badgeText?: string
}

export function DashboardGauge({
  title,
  currentValue,
  targetValue,
  subtitle,
  color = "green",
  className,
  badgeText = "Hoy"
}: DashboardGaugeProps) {
  const mappedColor = color === "yellow" ? "orange" : color

  return (
    <RadialSegmentedGauge
      title={title}
      subtitle={subtitle}
      currentValue={currentValue}
      targetValue={targetValue}
      badgeText={badgeText}
      color={mappedColor}
      className={className}
      totalSegments={24}
      tickWidth={7.5}
      tickHeight={22}
      showLegend={true}
    />
  )
}
