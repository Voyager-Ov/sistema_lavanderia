"use client"

import * as React from "react"
import * as RechartsPrimitive from "recharts"

import { cn } from "@/shared/lib/utils"

const THEMES = { light: "", dark: ".dark" } as const

export type ChartConfig = {
  [k in string]: {
    label?: React.ReactNode
    icon?: React.ComponentType
  } & (
    | { color?: string; theme?: never }
    | { color?: never; theme: Record<keyof typeof THEMES, string> }
  )
}

type ChartContextProps = {
  config: ChartConfig
}

const ChartContext = React.createContext<ChartContextProps | null>(null)

function useChart() {
  const context = React.useContext(ChartContext)

  if (!context) {
    throw new Error("useChart must be used within a <ChartContainer />")
  }

  return context
}

function ChartContainer({
  id,
  className,
  children,
  config,
  ...props
}: React.ComponentProps<"div"> & {
  config: ChartConfig
  children: React.ComponentProps<
    typeof RechartsPrimitive.ResponsiveContainer
  >["children"]
}) {
  const uniqueId = React.useId()
  const chartId = `chart-${id || uniqueId.replace(/:/g, "")}`

  return (
    <ChartContext.Provider value={{ config }}>
      <div
        data-slot="chart"
        data-chart={chartId}
        className={cn(
          "[&_.recharts-cartesian-axis-tick_text]:fill-gray-400 [&_.recharts-cartesian-grid_line[stroke='#ccc']]:stroke-gray-100 [&_.recharts-curve.recharts-tooltip-cursor]:stroke-gray-200 [&_.recharts-polar-grid_[stroke='#ccc']]:stroke-gray-200 [&_.recharts-radial-bar-background-sector]:fill-gray-100 [&_.recharts-rectangle.recharts-tooltip-cursor]:fill-gray-50 [&_.recharts-reference-line_[stroke='#ccc']]:stroke-gray-200 flex aspect-video justify-center text-xs [&_.recharts-dot[stroke='#fff']]:stroke-transparent [&_.recharts-layer]:outline-hidden [&_.recharts-sector]:outline-hidden [&_.recharts-sector[stroke='#fff']]:stroke-transparent [&_.recharts-surface]:outline-hidden",
          className
        )}
        {...props}
      >
        <ChartStyle id={chartId} config={config} />
        <RechartsPrimitive.ResponsiveContainer>
          {children}
        </RechartsPrimitive.ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  )
}

const ChartStyle = ({ id, config }: { id: string; config: ChartConfig }) => {
  const colorConfig = Object.entries(config).filter(([, config]: [string, Record<string, unknown>]) => config.theme || config.color)

  if (!colorConfig.length) {
    return null
  }

  return (
    <style
      dangerouslySetInnerHTML={{
        __html: Object.entries(THEMES)
          .map(([theme, prefix]: [string, string]) => `
${prefix} [data-chart=${id}] {
${colorConfig
  .map(([key, itemConfig]: [string, Record<string, unknown>]) => {
    const color =
      itemConfig.theme?.[theme as keyof typeof itemConfig.theme] ||
      itemConfig.color
    return color ? `  --color-${key}: ${color};` : null
  })
  .join("\n")}
}
`
          )
          .join("\n"),
      }}
    />
  )
}

const ChartTooltip = RechartsPrimitive.Tooltip

function ChartTooltipContent({
  active,
  payload,
  className,
  indicator = "dot",
  hideLabel = false,
  hideIndicator = false,
  label,
  labelFormatter,
  labelClassName,
  formatter,
  color,
  nameKey,
  labelKey,
}: React.ComponentProps<typeof RechartsPrimitive.Tooltip> &
  React.ComponentProps<"div"> & {
    hideLabel?: boolean
    hideIndicator?: boolean
    indicator?: "line" | "dot" | "dashed"
    nameKey?: string
    labelKey?: string
    payload?: any[]
    label?: any
    labelFormatter?: any
    labelClassName?: string
    formatter?: any
    color?: string
  }) {
  const { config } = useChart()

  const tooltipLabel = React.useMemo(() => {
    if (hideLabel || !payload?.length) {
      return null
    }

    const [item] = payload
    const key = `${labelKey || item?.dataKey || item?.name || "value"}`
    const itemConfig = getPayloadConfigFromPayload(config, item, key)
    const value =
      !labelKey && typeof label === "string"
        ? config[label as keyof typeof config]?.label || label
        : itemConfig?.label

    if (labelFormatter) {
      return (
        <div className={cn("font-medium text-gray-900", labelClassName)}>
          {labelFormatter(value, payload)}
        </div>
      )
    }

    if (!value) {
      return null
    }

    return <div className={cn("font-medium text-gray-900", labelClassName)}>{value}</div>
  }, [
    label,
    labelFormatter,
    payload,
    hideLabel,
    labelClassName,
    config,
    labelKey,
  ])

  if (!active || !payload?.length) {
    return null
  }

  const nestLabel = payload.length === 1 && indicator !== "dot"

  return (
    <div
      className={cn(
        "bg-white/90 backdrop-blur-md grid min-w-[10rem] items-start gap-2 rounded-2xl border border-gray-100 px-4 py-3 text-sm shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)]",
        className
      )}
    >
      {!nestLabel ? tooltipLabel : null}
      <div className="grid gap-2">
        {payload
          .filter((item: unknown) => (item as Record<string, unknown>).type !== "none")
          .map((item: unknown, index: number) => {
            const typedItem = item as Record<string, unknown>;
            const key = `${nameKey || typedItem.name || typedItem.dataKey || "value"}`
            const itemConfig = getPayloadConfigFromPayload(config, typedItem, key)
            const indicatorColor = color || (typedItem.payload as Record<string, unknown>)?.fill || typedItem.color

            return (
              <div
                key={typedItem.dataKey as string}
                className={cn(
                  "[&>svg]:text-gray-400 flex w-full flex-wrap items-stretch gap-2.5 [&>svg]:h-3 [&>svg]:w-3",
                  indicator === "dot" && "items-center"
                )}
              >
                {formatter && typedItem?.value !== undefined && typedItem.name ? (
                  formatter(typedItem.value as never, typedItem.name as never, typedItem as never, index, typedItem.payload as never)
                ) : (
                  <>
                    {itemConfig?.icon ? (
                      <itemConfig.icon />
                    ) : (
                      !hideIndicator && (
                        <div
                          className={cn(
                            "shrink-0 rounded-[4px] border-(--color-border) bg-(--color-bg)",
                            {
                              "h-3 w-3": indicator === "dot",
                              "w-1": indicator === "line",
                              "w-0 border-[1.5px] border-dashed bg-transparent":
                                indicator === "dashed",
                              "my-0.5": nestLabel && indicator === "dashed",
                            }
                          )}
                          style={
                            {
                              "--color-bg": indicatorColor,
                              "--color-border": indicatorColor,
                            } as React.CSSProperties
                          }
                        />
                      )
                    )}
                    <div
                      className={cn(
                        "flex flex-1 justify-between leading-none gap-4",
                        nestLabel ? "items-end" : "items-center"
                      )}
                    >
                      <div className="grid gap-1.5">
                        {nestLabel ? tooltipLabel : null}
                        <span className="text-gray-500 font-medium">
                          {itemConfig?.label || (typedItem.name as string)}
                        </span>
                      </div>
                      {typedItem.value !== undefined && (
                        <span className="text-gray-900 font-mono font-bold tabular-nums">
                          {(typedItem.value as number).toLocaleString()}
                        </span>
                      )}
                    </div>
                  </>
                )}
              </div>
            )
          })}
      </div>
    </div>
  )
}

const ChartLegend = RechartsPrimitive.Legend

function ChartLegendContent({
  className,
  hideIcon = false,
  payload,
  verticalAlign = "bottom",
  nameKey,
}: React.ComponentProps<"div"> & {
    payload?: any[]
    verticalAlign?: any
    hideIcon?: boolean
    nameKey?: string
  }) {
  const { config } = useChart()

  if (!payload?.length) {
    return null
  }

  return (
    <div
      className={cn(
        "flex items-center justify-center gap-6",
        verticalAlign === "top" ? "pb-4" : "pt-4",
        className
      )}
    >
      {payload
        .filter((item: unknown) => (item as Record<string, unknown>).type !== "none")
        .map((item: unknown) => {
          const typedItem = item as Record<string, unknown>;
          const key = `${nameKey || typedItem.dataKey || "value"}`
          const itemConfig = getPayloadConfigFromPayload(config, typedItem, key)

          return (
            <div
              key={typedItem.value as string}
              className={cn(
                "[&>svg]:text-gray-400 flex items-center gap-2 [&>svg]:h-3.5 [&>svg]:w-3.5 text-sm font-medium text-gray-600"
              )}
            >
              {itemConfig?.icon && !hideIcon ? (
                <itemConfig.icon />
              ) : (
                <div
                  className="h-3 w-3 shrink-0 rounded-full"
                  style={{
                    backgroundColor: typedItem.color as string,
                  }}
                />
              )}
              {itemConfig?.label}
            </div>
          )
        })}
    </div>
  )
}

function getPayloadConfigFromPayload(
  config: ChartConfig,
  payload: unknown,
  key: string
) {
  if (typeof payload !== "object" || payload === null) {
    return undefined
  }

  const payloadPayload =
    "payload" in payload &&
    typeof payload.payload === "object" &&
    payload.payload !== null
      ? payload.payload
      : undefined

  let configLabelKey: string = key

  if (
    key in payload &&
    typeof payload[key as keyof typeof payload] === "string"
  ) {
    configLabelKey = payload[key as keyof typeof payload] as string
  } else if (
    payloadPayload &&
    key in payloadPayload &&
    typeof payloadPayload[key as keyof typeof payloadPayload] === "string"
  ) {
    configLabelKey = payloadPayload[
      key as keyof typeof payloadPayload
    ] as string
  }

  return configLabelKey in config
    ? config[configLabelKey]
    : config[key as keyof typeof config]
}

export {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  ChartStyle,
}
