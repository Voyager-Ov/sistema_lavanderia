# Especificación Técnica de API y Requerimientos: Módulo de Reportes, Analítica y Gráficos

**Estándar de Documentación de Cátedra (UTN FRC)**  
**Proyecto:** SaaS Lavandería Multi-Negocio  
**Módulo:** Módulo de Reportes, Analítica y Gráficos (`reportes` / `analytics`)  

---

## 1. Arquitectura y Motores de Visualización

### Estilo Arquitectónico: Arquitectura en Capas (Layered Architecture)

*   **Capa de Presentación («boundary»)**:
    *   Dashboard de Finanzas (`/admin/finanzas` - `FinanzasKPIs.tsx`, `FinanzasCharts.tsx`).
    *   Reporte de Pedidos (`/admin/reportes/pedidos` - `pedidos-report-header.tsx`, `pedidos-report-table.tsx`).
    *   Reporte de Empleados (`/admin/reportes/empleados` - `empleados-report-header.tsx`, `empleados-report-table.tsx`, `ultimas-cajas-table.tsx`).
    *   Reporte de Servicios (`/admin/reportes/servicios` - `servicios-report-table.tsx`).
*   **Capa de Control/Servicios («control»)**:
    *   `FinanzasController` / `ReportesController`: Filtros multicriterio sanitizados.
    *   `FinanzasService`: Unificación atómica de registros de `Pago` (ingresos) y `Gasto` (egresos) en un stream de movimientos financieros.
*   **Capa de Dominio/Entidades («entity»)**:
    *   Modelos Sequelize: `Pago`, `Gasto`, `Pedido`, `Usuario`, `MetodoPago`, `CategoriaGasto`.

---

## 2. Jerarquía de Actores y Matriz de Permisos por Rol

### Jerarquía de Actores (Estándar UTN FRC)

*   **Usuario** (Actor Abstracto).
    *   **Empleado** (Actor Físico):
        *   **Administrador** (Rol `admin`): Control total para consultar reportes consolidados financieros, desempeño de personal, márgenes de servicios y exportar archivos.
        *   **Empleado Operativo / Cajero** (Rol `empleado`): Acceso restringido a reportes operativos de su turno.

---

## 3. Mapeo de Casos de Uso, Actores y Componentes UI del Frontend

| Caso de Uso (CU) | Actores Autorizados | Pantalla / Componente Frontend (UI) | Funcionalidad y Endpoint Backend |
| :--- | :---: | :--- | :--- |
| **CU-52: Consultar Analítica Financiera y Gráficos** | Admin | `/admin/finanzas`<br>`FinanzasKPIs.tsx`, `FinanzasCharts.tsx` | `GET /api/v1/finanzas/movimientos`<br>Motor Recharts con 8 gráficos analíticos y memorización `useMemo`. |
| **CU-53: Reporte de Pedidos y Plazos** | Admin, Empleado | `/admin/reportes/pedidos`<br>`pedidos-report-header.tsx`, `pedidos-report-table.tsx` | `GET /api/v1/pedidos/reporte`<br>Agregación por estados, cumplimiento a tiempo y volumen facturado. |
| **CU-54: Reporte de Desempeño de Personal** | Admin *(Exclusivo)* | `/admin/reportes/empleados`<br>`empleados-report-header.tsx`, `empleados-report-table.tsx` | `GET /api/v1/usuarios/reporte`<br>Cobranzas por cajero, total atendido y auditoría de arqueos. |
| **CU-55: Reporte de Servicios y Productos** | Admin | `/admin/reportes/servicios`<br>`servicios-report-table.tsx` | `GET /api/v1/servicios/reporte`<br>Ranking de prendas más lavadas/secadas. |
| **CU-56: Exportar Reportes (PDF / Excel)** | Admin, Empleado | `/admin/finanzas` y `/admin/reportes/*`<br>Botón *"Exportar Info"* / *"Descargar Excel"* | Formateador `formatCurrency`, `csvExport` y generación de planillas. |

---

## 4. Arquitectura de los 8 Gráficos Analíticos

1.  **Evolución Temporal de Flujos (`AreaChart`):** Curva suave de Ingresos verdes vs Egresos rojos.
2.  **Flujo por Día de la Semana (`BarChart` Apilado):** Distribución de cobros y gastos por día (`Dom` a `Sáb`).
3.  **Volumen vs Transacciones (`ComposedChart`):** Barras de volumen en `$` y Línea de cantidad de cobros en 2º eje Y.
4.  **Ticket Promedio (`LineChart`):** Evolución en pesos del importe promedio cobrado ($\text{Volumen} / \text{Cantidad}$).
5.  **Ranking Cajeros (`BarChart` Horizontal):** Top 5 cajeros con mayor recaudación en mostrador.
6.  **Top 5 Gastos por Categoría (`PieChart` Dona):** Desglose porcentual de egresos.
7.  **Ingresos por Método de Pago (`PieChart` Dona):** Distribución entre Efectivo, MercadoPago QR, Tarjetas y Transferencias.
8.  **Egresos por Método de Pago (`PieChart` Dona):** Métodos empleados en la salida de dinero.

---

## 5. Diagnóstico de Códigos de Respuesta HTTP

| Código HTTP | Significado Contable / Operativo | Ejemplo de Causa |
| :---: | :--- | :--- |
| **200 OK** | Consulta de movimientos o reporte exitosa | Retorno del dataset para renderizado de gráficos Recharts. |
| **400 Bad Request** | Rango de fechas inválido | `fechaInicio` posterior a `fechaFin`. |
| **403 Forbidden** | Acceso no autorizado | Empleado intentando consultar reportes financieros o de personal. |
