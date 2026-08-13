# Especificación del Módulo de Dashboards e Indicadores (Dashboard)

Este documento detalla la especificación técnica completa del **Módulo de Dashboards e Indicadores Operativos y Ejecutivos (`dashboard`)** para la plataforma SaaS Multi-Tenant de lavandería, diferenciando el **Portal Administrador (`admin`)** del **Portal Empleado / Mostrador (`pos` / `empleado`)**, vinculando cada Caso de Uso (CU) con sus **Actores autorizados**, las **Pantallas y Componentes de Interfaz del Frontend (UI)** donde se originan las acciones y la **Funcionalidad Backend/Frontend** utilizada para resolverlas.

---

## 1. Alcance y Objetivos del Módulo

El módulo de Dashboards es el centro de inteligencia de negocios e indicadores operativos de la lavandería. Su arquitectura está bifurcada para atender dos perfiles de usuario bien diferenciados:

*   **Portal Administrador (`admin`)**: Enfocado en la visión estratégica ejecutiva, métricas financieras consolidadas (recaudación actual vs mes anterior, potencial del día, tendencia de ventas de los últimos 7 días), ranking de clientes VIP/frecuentes, auditoría de alertas de vencimiento y control del turno de caja.
*   **Portal Empleado / Mostrador (`pos` / `empleado`)**: Enfocado en la producción operativa del turno, control de ropa en espera (`Pendiente`), monitoreo de máquinas ocupadas (`En Proceso`), pedidos listos para entrega al cliente (`Listo`), progreso de producción de la jornada y accesos directos de mostrador.

---

## 2. Mapeo Integral: Casos de Uso, Actores, Pantallas Frontend y Funcionalidad de Resolución

### A. Portal Administrador (`admin`)

#### CU-36: Consultar KPIs Ejecutivos y Recaudación Global
*   **Actores Autorizados:** `Administrador de Negocio` (`admin`).
*   **Pantalla / Componente Frontend de Origen:**
    *   **Dashboard Ejecutivo:** `/admin/dashboard`.
    *   **Componentes UI:** `DashboardKpi.tsx` (Tarjetas de *Pedidos del Día*, *Ingresos Hoy*, *Servicios Activos*, *Entregas Pendientes*).
*   **Funcionalidad con la que se Resuelve:**
    *   *Frontend:* Renderizado de tarjetas KPI animadas con GSAP `useGSAP` (`fade-up`), mostrando tendencias respecto al día anterior y dinero cobrado hoy vs facturación total potencial.
    *   *Backend (Endpoint `GET /api/v1/dashboard/stats`):* Invoca `getDashboardStats()` en `dashboard.service.js`. Sumariza con Sequelize `models.Pago.sum('monto')` los cobros de mes actual, mes anterior, hoy y ayer.

---

#### CU-37: Monitorear Tendencia de Ingresos Diarios (Gráfico 7 Días)
*   **Actores Autorizados:** `Administrador de Negocio` (`admin`).
*   **Pantalla / Componente Frontend de Origen:**
    *   **Dashboard Ejecutivo:** `/admin/dashboard`.
    *   **Componentes UI:** `DashboardBarChart.tsx` (Gráfico interactivo de barras Recharts/GSAP).
*   **Funcionalidad con la que se Resuelve:**
    *   *Frontend:* Muestra la distribución de ingresos en efectivo y medios digitales agrupados por día de la semana (`Dom` a `Sab`).
    *   *Backend:* `getDashboardStats()` consulta `models.Pago.findAll()` agrupando por `date(Pago.createdAt)` en los últimos 7 días y mapea los nombres de días en español.

---

#### CU-38: Supervisar Ranking de Clientes VIP y Frecuentes
*   **Actores Autorizados:** `Administrador de Negocio` (`admin`).
*   **Pantalla / Componente Frontend de Origen:**
    *   **Dashboard Ejecutivo:** `/admin/dashboard`.
    *   **Componentes UI:** `DashboardListCard.tsx` (Tarjeta de *Top Clientes* con badges VIP y Frecuente).
*   **Funcionalidad con la que se Resuelve:**
    *   *Backend:* `getDashboardStats()` realiza un agrupamiento `COUNT('Pedido.id')` ordenado descendentemente en el mes actual para obtener los clientes con mayor recurrencia de servicio.

---

#### CU-39: Auditar Alertas de Pedidos Demorados y Vencidos
*   **Actores Autorizados:** `Administrador de Negocio` (`admin`).
*   **Pantalla / Componente Frontend de Origen:**
    *   **Dashboard Ejecutivo:** `/admin/dashboard`.
    *   **Componentes UI:** `DashboardListCard.tsx` (Tarjeta de *Alertas Pendientes*).
*   **Funcionalidad con la que se Resuelve:**
    *   *Frontend:* Evaluación con `date-fns` (`isBefore`, `addDays`) comparando `fechaEntregaEstimada` contra la hora actual. Asigna badges `VENCIDO` (rojo) para pedidos fuera de plazo u `HOY` (amarillo) para los próximos a vencer.

---

### B. Portal Empleado / Mostrador (`pos` / `empleado`)

#### CU-40: Consultar Estado y Prioridades del Turno de Mostrador
*   **Actores Autorizados:** `Empleado Operativo / Cajero` (`empleado`), `Administrador de Negocio` (`admin`).
*   **Pantalla / Componente Frontend de Origen:**
    *   **Dashboard POS:** `/pos/dashboard`.
    *   **Componentes UI:** `DashboardKpi.tsx` (Tarjetas de *Pedidos del Día*, *Pendientes*, *En Proceso*, *Listos p/ Entregar*) y `DashboardListCard.tsx` (*Prioridades Pendientes*).
*   **Funcionalidad con la que se Resuelve:**
    *   *Frontend:* Visualización en tiempo real del flujo de ropa sucia recibida (`Pendientes`), ropa ocupando lavadoras/secadoras (`En Proceso`) y ropa preparada para cobrar (`Listos`).
    *   *Backend:* Conteo atómico por agrupamiento `models.Pedido.findAll({ group: ['estado'] })`.

---

#### CU-41: Controlar Entregas Pendientes en Mostrador
*   **Actores Autorizados:** `Empleado Operativo / Cajero` (`empleado`), `Administrador de Negocio` (`admin`).
*   **Pantalla / Componente Frontend de Origen:**
    *   **Dashboard POS:** `/pos/dashboard`.
    *   **Componentes UI:** `DashboardKpi.tsx` (Tarjeta *Listos p/ Entregar*) con redirección directa a `/pos/pedidos?filtro=listos`.
*   **Funcionalidad con la que se Resuelve:**
    *   *Frontend:* Muestra el número de pedidos que el cliente debe pasar a retirar hoy, facilitando el cobro e independizando la atención en mostrador.

---

#### CU-42: Monitorear Progreso de Producción Diaria
*   **Actores Autorizados:** `Empleado Operativo / Cajero` (`empleado`), `Administrador de Negocio` (`admin`).
*   **Pantalla / Componente Frontend de Origen:**
    *   **Dashboard POS:** `/pos/dashboard`.
    *   **Componentes UI:** `DashboardGauge.tsx` (Gauge de Progreso de Producción).
*   **Funcionalidad con la que se Resuelve:**
    *   *Frontend:* Medidor circular de porcentaje que compara los pedidos finalizados (`Listo` + `Entregado`) contra el total de pedidos ingresados en la jornada.

---

## 3. Modelos de Base de Datos Vinculados

El servicio del dashboard realiza agregaciones de consulta de lectura (Read-Only) sobre las principales entidades del tenant (`tenant_{id}`).

*   `Pedido`: Recuento por estados (`PENDIENTE`, `EN_PROCESO`, `LISTO_PARA_RETIRAR`, `ENTREGADO`, `CANCELADO`) y pedidos recibidos hoy vs ayer.
*   `Pago`: Sumatoria de montos cobrados en estado `COMPLETADO` por rango de fechas (mes actual, mes anterior, hoy, ayer y últimos 7 días).
*   `PedidoItem` & `Producto` / `Servicio`: Sumatoria de unidades vendidas por ítem del catálogo comercial.
*   `Cliente`: Frecuencia de pedidos por cliente en el mes.
*   `Caja`: Estado del turno activo del usuario (`ABIERTA` / `CERRADA`).

---

## 4. Contratos de API (JSON Payloads)

### Obtener Estadísticas Consolidadas del Dashboard (`GET /api/v1/dashboard/stats`)
*   **Headers:** `Authorization: Bearer <token_jwt>`
*   **Responses:**
    *   `200 OK` ➔ Estadísticas consolidadas del negocio.
        ```json
        {
          "status": "success",
          "message": null,
          "data": {
            "ingresos": {
              "mesActual": 450000.00,
              "mesAnterior": 380000.00,
              "hoyCobrado": 35000.00,
              "ayerCobrado": 28000.00,
              "hoyTotalPedidos": 42000.00
            },
            "pedidosDelDia": {
              "hoy": 14,
              "ayer": 10
            },
            "pedidosActivos": {
              "PENDIENTE": 5,
              "EN_PROCESO": 3,
              "LISTO_PARA_RETIRAR": 4,
              "ENTREGADO": 2,
              "CANCELADO": 0
            },
            "ventasPorDia": [
              { "name": "Dom", "ventas": 12000.00 },
              { "name": "Lun", "ventas": 25000.00 },
              { "name": "Mar", "ventas": 30000.00 },
              { "name": "Mie", "ventas": 28000.00 },
              { "name": "Jue", "ventas": 35000.00 },
              { "name": "Vie", "ventas": 0.00 },
              { "name": "Sab", "ventas": 0.00 }
            ],
            "topClientes": [
              { "id": 12, "nombre": "Juan Pérez", "pedidos": 8 },
              { "id": 15, "nombre": "María González", "pedidos": 5 }
            ],
            "ultimosPedidos": [
              { "id": 108, "title": "Juan Pérez", "subtitle": "Ticket #108", "badgeText": "PENDIENTE", "badgeColor": "yellow" }
            ]
          }
        }
        ```

---

## 5. Algoritmos de Negocio y Lógica en los Servicios

### Algoritmo de Agregación de Métricas del Dashboard (`getDashboardStats`)

```javascript
export const getDashboardStats = async (negocioId) => {
    const ahora = new Date();
    
    // Rango de fechas
    const inicioMesActual = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
    const finMesActual = new Date(ahora.getFullYear(), ahora.getMonth() + 1, 0, 23, 59, 59);
    const inicioHoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
    const finHoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate(), 23, 59, 59);
    const inicioAyer = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate() - 1);
    const finAyer = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate() - 1, 23, 59, 59);
    const inicioUltimos7Dias = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate() - 6);

    // 1. Ingresos Cobrados (Pagos COMPLETADOS)
    const ingresosActuales = await models.Pago.sum('monto', {
        where: { estado: 'COMPLETADO', createdAt: { [Op.between]: [inicioMesActual, finMesActual] } },
        include: [{ model: models.Pedido, as: 'pedido', where: { negocioId }, attributes: [] }]
    });

    const ingresosHoyCobrado = await models.Pago.sum('monto', {
        where: { estado: 'COMPLETADO', createdAt: { [Op.between]: [inicioHoy, finHoy] } },
        include: [{ model: models.Pedido, as: 'pedido', where: { negocioId }, attributes: [] }]
    });

    // 2. Pedidos activos por estado
    const pedidosPorEstado = await models.Pedido.findAll({
        where: { negocioId },
        attributes: ['estado', [sequelize.fn('COUNT', sequelize.col('id')), 'cantidad']],
        group: ['estado']
    });

    const estadosMap = { PENDIENTE: 0, EN_PROCESO: 0, LISTO_PARA_RETIRAR: 0, ENTREGADO: 0, CANCELADO: 0 };
    pedidosPorEstado.forEach(p => {
        const estado = p.getDataValue('estado');
        const cantidad = parseInt(p.getDataValue('cantidad'), 10);
        if (estadosMap.hasOwnProperty(estado)) estadosMap[estado] = cantidad;
    });

    // 3. Ventas por Día (Últimos 7 días)
    const pagosUltimos7Dias = await models.Pago.findAll({
        attributes: [
            [sequelize.fn('date', sequelize.col('Pago.createdAt')), 'fecha'],
            [sequelize.fn('SUM', sequelize.col('monto')), 'total']
        ],
        where: { estado: 'COMPLETADO', createdAt: { [Op.between]: [inicioUltimos7Dias, finHoy] } },
        include: [{ model: models.Pedido, as: 'pedido', where: { negocioId }, attributes: [] }],
        group: [sequelize.fn('date', sequelize.col('Pago.createdAt'))]
    });

    const ventasPorDiaMap = {};
    pagosUltimos7Dias.forEach(p => {
        ventasPorDiaMap[p.getDataValue('fecha')] = parseFloat(p.getDataValue('total'));
    });

    const diasSemana = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'];
    const ventasPorDia = [];
    for (let i = 0; i < 7; i++) {
        const d = new Date(inicioUltimos7Dias);
        d.setDate(d.getDate() + i);
        const fechaStr = d.toISOString().split('T')[0];
        ventasPorDia.push({ name: diasSemana[d.getDay()], ventas: ventasPorDiaMap[fechaStr] || 0 });
    }

    return {
        ingresos: { mesActual: parseFloat(ingresosActuales) || 0, hoyCobrado: parseFloat(ingresosHoyCobrado) || 0 },
        pedidosActivos: estadosMap,
        ventasPorDia
    };
};
```

---

## 6. Middlewares y Seguridad

*   `verificarToken` y `verificarSuscripcionActiva`: Garantizan el aislamiento multi-tenant por `negocioId`.
