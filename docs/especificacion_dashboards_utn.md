# Especificación Técnica de API y Requerimientos: Módulo de Dashboards e Indicadores por Portal

**Estándar de Documentación de Cátedra (UTN FRC)**  
**Proyecto:** SaaS Lavandería Multi-Negocio  
**Módulo:** Módulo de Dashboards e Indicadores por Portal (`admin` vs `pos` / `empleado`)  

---

## 1. Arquitectura y Bifurcación por Portal de Usuario

El Módulo de Dashboards atiende la capa de presentación de los dos portales mantenidos en la plataforma:

*   **Portal Administrador (`/admin/dashboard`)**:
    *   Enfoque: Ejecutivo, Estratégico, Financiero y de Salud Global del SaaS.
    *   Métricas: Recaudación actual vs mes anterior, potencial del día, gráfico de tendencia de 7 días, alertas de pedidos vencidos y top clientes VIP.
*   **Portal Empleado / Mostrador (`/pos/dashboard`)**:
    *   Enfoque: Operativo, Producción de Turno y Atención Rápida POS.
    *   Métricas: Conteo de pedidos `Pendiente`, `En Proceso`, `Listos p/ Entregar`, estado del turno de caja del cajero y gauge de producción de la jornada.

---

## 2. Jerarquía de Actores y Matriz de Permisos por Rol

### Jerarquía de Actores (Estándar UTN FRC)

*   **Usuario** (Actor Abstracto).
    *   **Empleado** (Actor Físico):
        *   **Administrador** (Rol `admin`): Acceso completo al Dashboard Ejecutivo Financiero y de Gestión (`/admin/dashboard`).
        *   **Empleado Operativo / Cajero** (Rol `empleado`): Acceso exclusivo al Dashboard Operativo de Mostrador (`/pos/dashboard`).

---

## 3. Mapeo de Casos de Uso, Actores y Componentes UI del Frontend

| Caso de Uso (CU) | Actores Autorizados | Pantalla / Componente Frontend (UI) | Funcionalidad y Endpoint Backend |
| :--- | :---: | :--- | :--- |
| **CU-36: Consultar KPIs Ejecutivos Financieros** | Admin *(Exclusivo)* | `/admin/dashboard`<br>`DashboardKpi.tsx` | `GET /api/v1/dashboard/stats`<br>Sumatoria de cobros del mes y recaudación del día. |
| **CU-37: Monitorear Tendencia 7 Días** | Admin *(Exclusivo)* | `/admin/dashboard`<br>`DashboardBarChart.tsx` | `GET /api/v1/dashboard/stats`<br>Agrupamiento por fecha en los últimos 7 días. |
| **CU-38: Supervisar Top Clientes VIP** | Admin *(Exclusivo)* | `/admin/dashboard`<br>`DashboardListCard.tsx` | `GET /api/v1/dashboard/stats`<br>Ranking por cantidad de pedidos en el mes. |
| **CU-39: Auditar Alertas Vencidas** | Admin | `/admin/dashboard`<br>`DashboardListCard.tsx` | Comparación `fechaEntregaEstimada` vs `NOW()` con badges `VENCIDO` u `HOY`. |
| **CU-40: Consultar Turno y Prioridades POS** | Admin, Empleado | `/pos/dashboard`<br>`DashboardKpi.tsx`, `DashboardListCard.tsx` | Conteo de pedidos `PENDIENTE`, `EN_PROCESO` y `LISTO_PARA_RETIRAR`. |
| **CU-41: Controlar Entregas de Mostrador** | Admin, Empleado | `/pos/dashboard`<br>`DashboardKpi.tsx` (*Listos p/ Entregar*) | Acceso directo a pedidos preparados para cobro y retiro. |
| **CU-42: Medir Progreso de Producción** | Admin, Empleado | `/pos/dashboard`<br>`DashboardGauge.tsx` | Medidor de porcentaje de pedidos terminados vs recibidos hoy. |

---

## 4. Especificación del Front-End (Vistas y Componentes UX)

### 1. Dashboard Ejecutivo (`/admin/dashboard`)
*   Tarjetas KPI interactivas, gráfico Recharts/GSAP de 7 días, alertas urgentes y modal de gastos.

### 2. Dashboard POS Operativo (`/pos/dashboard`)
*   KPIs orientados a la producción, indicador circular Gauge de avance de lavado y accesos directos al terminal POS.

---

## 5. Diagnóstico de Códigos de Respuesta HTTP

| Código HTTP | Significado Contable / Operativo | Ejemplo de Causa |
| :---: | :--- | :--- |
| **200 OK** | Consulta de estadísticas exitosa | Retorno del JSON de métricas del dashboard. |
| **401 Unauthorized** | Token ausente o expirado | Sesión no válida. |
| **500 Internal Server Error** | Error de servidor | Fallo durante el cálculo de sumatorias o agrupamientos. |
