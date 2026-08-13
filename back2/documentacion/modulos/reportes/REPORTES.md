# Especificación del Módulo de Reportes, Analítica y Gráficos (Reportes)

Este documento detalla la especificación técnica completa del **Módulo de Reportes, Analítica y Gráficos (`reportes`)** para la plataforma SaaS Multi-Tenant de lavandería, explicando la separación de lógicas por cada reporte, la arquitectura de los **8 gráficos analíticos**, los filtros multicriterio, la matemática de agregación y los mecanismos de exportación.

---

## 1. Alcance y Objetivos del Módulo

El módulo de Reportes consolida la inteligencia de datos de la lavandería en tres niveles:
1.  **Analítica Financiera Global (`/admin/finanzas`):** Desglose de ingresos vs egresos, ticket promedio, volumen vs transacciones, flujo por día de la semana y distribución por método de pago/categoría.
2.  **Reportes Operativos por Dominio (`/admin/reportes/*`):**
    *   *Reporte de Pedidos (`/admin/reportes/pedidos`):* Cumplimiento de plazos de entrega, volumen de carga e ingresos por estado.
    *   *Reporte de Personal (`/admin/reportes/empleados`):* Desempeño por cajero, cobranzas en mostrador y auditoría de arqueos.
    *   *Reporte de Servicios (`/admin/reportes/servicios`):* Ranking de prendas y servicios de lavandería/tintorería más rentables.
3.  **Motor de Exportación:** Generación de archivos imprimibles PDF y planillas Excel/CSV.

---

## 2. Separación de Lógicas y Catálogo de Gráficos Analíticos

La capa de analítica frontend (`FinanzasCharts.tsx`) utiliza la librería **Recharts** con hooks de memorización `useMemo` para recalcular los gráficos de forma reactiva ante cambios en los filtros de fecha sin re-ejecutar renders innecesarios.

### 1. Evolución Temporal de Flujos (`AreaChart` Doble)
*   **Componente Recharts:** `<AreaChart data={evolutionData}>`.
*   **Fórmula y Transformación:**
    $$\text{Ingresos}(d) = \sum_{m \in \text{Ingresos}, \text{fecha}(m)=d} m.\text{monto}, \quad \text{Egresos}(d) = \sum_{m \in \text{Egresos}, \text{fecha}(m)=d} m.\text{monto}$$
*   **Visualización:** Áreas de color verde (`#10b981`) para Ingresos y rojo (`#f43f5e`) para Egresos con curva suave `monotone`.

---

### 2. Flujo de Caja por Día de la Semana (`BarChart` Apilado)
*   **Componente Recharts:** `<BarChart data={diaSemanaData}>` con `<Bar stackId="a">`.
*   **Fórmula y Transformación:** Mapea la fecha a días de la semana (`Dom`, `Lun`, `Mar`, `Mié`, `Jue`, `Vie`, `Sáb`) y acumula ingresos y egresos apilados verticalmente por jornada.

---

### 3. Volumen vs Cantidad de Transacciones (`ComposedChart` Doble Eje Y)
*   **Componente Recharts:** `<ComposedChart data={volumenData}>`.
*   **Fórmula y Transformación:**
    *   *Eje Y Izquierdo (Barras Azules):* Volumen total cobrado $V(d) = \sum m.\text{monto}$.
    *   *Eje Y Derecho (Línea Naranja):* Conteo atómico de cobros $N(d) = \text{COUNT}(m)$.

---

### 4. Evolución del Ticket Promedio (`LineChart`)
*   **Componente Recharts:** `<LineChart data={ticketPromedioData}>`.
*   **Fórmula y Transformación:**
    $$\text{TicketPromedio}(d) = \frac{V(d)}{N(d)} = \frac{\sum m.\text{monto}}{\text{COUNT}(m)}$$
*   **Visualización:** Línea violeta (`#8b5cf6`) mostrando el valor promedio en pesos por pedido cobrado en cada fecha.

---

### 5. Ranking de Recaudación por Cajero (`BarChart` Horizontal)
*   **Componente Recharts:** `<BarChart layout="vertical" data={rankingCajerosData}>`.
*   **Fórmula y Transformación:** Agrupa movimientos de `INGRESO` por el atributo `registradoPor` (nombre del cajero), ordena descendentemente y toma el Top 5.

---

### 6. Distribución de Egresos por Categoría (`PieChart` Dona)
*   **Componente Recharts:** `<PieChart>` con `<Pie innerRadius={60} outerRadius={90}>`.
*   **Fórmula y Transformación:** Filtra movimientos de `EGRESO`, agrupa por `categoriaGastoId`, calcula su peso porcentual respecto al total de egresos y extrae las 5 categorías principales (*Insumos*, *Nómina*, *Alquiler*, etc.).

---

### 7. Ingresos por Método de Pago (`PieChart` Dona)
*   **Componente Recharts:** `<PieChart>` con paleta de colores alternada (`#10b981`, `#3b82f6`, `#f59e0b`, `#8b5cf6`).
*   **Fórmula y Transformación:** Agrupa los cobros por el atributo `metodoPago` (*Efectivo*, *MercadoPago QR*, *Tarjeta Débito*, *Tarjeta Crédito*, *Transferencia*).

---

### 8. Egresos por Método de Pago (`PieChart` Dona)
*   **Componente Recharts:** `<PieChart>`.
*   **Fórmula y Transformación:** Agrupa las salidas de dinero por el método utilizado (*Efectivo de Caja*, *Transferencia Bancaria del Negocio*).

---

## 3. Mapeo Integral: Casos de Uso, Actores, Pantallas y Funcionalidades

| Caso de Uso (CU) | Actores Autorizados | Pantalla / Componente Frontend (UI) | Funcionalidad y Endpoint Backend |
| :--- | :---: | :--- | :--- |
| **CU-52: Consultar Analítica Financiera y Gráficos** | Admin | `/admin/finanzas`<br>`FinanzasKPIs.tsx`, `FinanzasCharts.tsx` | `GET /api/v1/finanzas/movimientos`<br>Recuperación de movimientos con filtros de fecha (`fechaInicio`, `fechaFin`). |
| **CU-53: Reporte de Pedidos y Plazos de Entrega** | Admin, Empleado | `/admin/reportes/pedidos`<br>`pedidos-report-header.tsx`, `pedidos-report-table.tsx` | `GET /api/v1/pedidos/reporte`<br>Métricas de cumplimiento a tiempo y volumen facturado por estado. |
| **CU-54: Reporte de Desempeño de Personal** | Admin *(Exclusivo)* | `/admin/reportes/empleados`<br>`empleados-report-header.tsx`, `empleados-report-table.tsx` | `GET /api/v1/usuarios/reporte`<br>Cobranzas por cajero y auditoría de arqueos. |
| **CU-55: Reporte de Servicios y Productos** | Admin | `/admin/reportes/servicios`<br>`servicios-report-table.tsx` | `GET /api/v1/servicios/reporte`<br>Ranking de prendas más lavadas/secadas. |
| **CU-56: Exportar Reportes (PDF / Excel)** | Admin, Empleado | `/admin/finanzas` y `/admin/reportes/*`<br>Botón *"Exportar Info"* / *"Descargar Excel"* | Formateador frontend (`formatCurrency`, `csvExport`) y generación de planillas. |

---

## 4. Algoritmos de Negocio y Lógica en los Servicios

### Algoritmo Backend de Agregación de Movimientos Financieros

```javascript
export const obtenerMovimientosFinancieros = async (negocioId, filtros) => {
    const { fechaInicio, fechaFin, tipoMovimiento, metodoPagoId } = filtros;
    const where = { negocioId };

    if (fechaInicio && fechaFin) {
        where.fecha = { [Op.between]: [new Date(fechaInicio), new Date(fechaFin)] };
    }
    if (tipoMovimiento) where.tipoMovimiento = tipoMovimiento;
    if (metodoPagoId) where.metodoPagoId = metodoPagoId;

    const pagos = await models.Pago.findAll({
        where: { estado: "COMPLETADO" },
        include: [{ model: models.Pedido, as: "pedido", where, attributes: ["id", "createdAt"] },
                  { model: models.MetodoPago, as: "metodoPago", attributes: ["nombre"] },
                  { model: models.Usuario, as: "registradoPor", attributes: ["nombre", "apellido"] }]
    });

    const gastos = await models.Gasto.findAll({
        where: { negocioId, estadoGasto: { [Op.ne]: "Anulado" } },
        include: [{ model: models.CategoriaGasto, as: "categoria", attributes: ["nombre"] },
                  { model: models.MetodoPago, as: "metodoPago", attributes: ["nombre"] }]
    });

    // Mapeo unificado de movimientos
    const movimientos = [
        ...pagos.map(p => ({
            id: `P-${p.id}`,
            tipoMovimiento: "INGRESO",
            monto: parseFloat(p.monto),
            fecha: p.createdAt,
            metodoPago: p.metodoPago?.nombre || "Efectivo",
            registradoPor: `${p.registradoPor?.nombre} ${p.registradoPor?.apellido}`,
            referenciaId: p.pedidoId
        })),
        ...gastos.map(g => ({
            id: `G-${g.id}`,
            tipoMovimiento: "EGRESO",
            monto: parseFloat(g.montoTotal),
            fecha: g.fechaHora,
            metodoPago: g.metodoPago?.nombre || "Efectivo",
            registradoPor: "Sistema",
            referenciaId: g.categoria?.nombre || "General"
        }))
    ];

    return movimientos.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
};
```

---

## 5. Middlewares y Seguridad

*   `verificarToken` y `verificarSuscripcionActiva`.
*   `verificarRol(["admin"])` para reportes consolidados de desempeño de personal y finanzas globales.
