# Especificación Técnica de API y Requerimientos: Módulo de Pedidos y Trazabilidad de Estados

**Estándar de Documentación de Cátedra (UTN FRC)**  
**Proyecto:** SaaS Lavandería Multi-Negocio  
**Módulo:** Módulo 4 - Pedidos y Trazabilidad de Estados  

---

## 1. Arquitectura y Patrones de Diseño Recomendados

### Estilo Arquitectónico: Arquitectura en Capas (Layered Architecture)

*   **Capa de Presentación («boundary»)**:
    *   Formulario de Alta de Pedido (`/admin/pedidos/nuevo` y `/pos/pedidos/nuevo`).
    *   Tablero Kanban de Trazabilidad (`/admin/pedidos`) con columnas `Pendiente`, `Lavando`, `Listo`, `Entregado`, `Cancelado`.
    *   Detalle del Pedido desplegado mediante el componente `ResponsiveSheet` (`pedido-detail-view.tsx`).
    *   Modales de Cancelación (`cancel-order-sheet.tsx`) y Cobro (`cobrar-pedido-sheet.tsx`).
    *   Template de Impresión de Ticket Térmico (`ticket-print-template.tsx`).
*   **Capa de Control/Servicios («control»)**:
    *   `PedidoController`: Recepción de solicitudes HTTP y serialización de respuestas.
    *   `PedidoService`: Máquina de estados, congelamiento inmutable de precios por snapshot y notificaciones en tiempo real.
*   **Capa de Dominio/Entidades («entity»)**:
    *   Modelos Sequelize: `Pedido`, `DetallePedido`, `CambioEstadoPedido`, `Estado`, `Cliente`, `Servicio`.

---

### Patrones de Diseño (GoF) Claves Aplicados al Módulo de Pedidos

1.  **Patrón State (Máquina de Estados de Pedido)**:
    *   *Propósito:* Controlar estrictamente las transiciones del ciclo de vida del pedido sin condicionales anidados.
    *   *Transiciones:* `Pendiente` ➔ `Lavando` ➔ `Listo` ➔ `Entregado` (o `Cancelado` desde estados previos).

2.  **Patrón Observer (Observador de Notificaciones de Retiro)**:
    *   *Propósito:* Disparar avisos automáticos al cliente al completarse el proceso de lavado.
    *   *Implementación:* Al transicionar a `Listo`, el sistema notifica de forma asíncrona por SMS/Email o WhatsApp.

3.  **Patrón Memento (Snapshot de Precios)**:
    *   *Propósito:* Inmutabilidad histórica de tarifas cobradas.
    *   *Implementación:* `DetallePedido` captura `precioHistorico` desde el catálogo comercial en el instante de la emisión.

---

## 2. Jerarquía de Actores y Matriz de Permisos por Rol

### Jerarquía de Actores (Estándar UTN FRC)

*   **Usuario** (Actor Abstracto).
    *   **Empleado** (Actor Físico):
        *   **Administrador** (Rol `admin`).
        *   **Empleado Operativo / Mostrador** (Rol `empleado`).
*   **Servidor de Correo / WebSockets** (Actor Secundario / Sistema Externo).

---

## 3. Mapeo de Casos de Uso, Actores y Componentes UI del Frontend

| Caso de Uso (CU) | Actores Autorizados | Pantalla / Componente Frontend (UI) | Funcionalidad y Endpoint Backend |
| :--- | :---: | :--- | :--- |
| **CU-24: Registrar Pedido** | Admin, Empleado | `/admin/pedidos/nuevo`<br>`PedidoForm.tsx`, `ClienteSearchSelect.tsx` | `POST /api/v1/pedidos`<br>Cálculo de subtotal, snapshot `precioHistorico` y `codigoSeguimiento`. |
| **CU-25: Iniciar Lavado de Pedido** | Admin, Empleado | `/admin/pedidos`<br>Tablero Kanban y `pedido-detail-view.tsx` | `PATCH /api/v1/pedidos/:id/estado`<br>Transición de `Pendiente` ➔ `Lavando`. |
| **CU-26: Finalizar Lavado (Aviso Listo)** | Admin, Empleado | `/admin/pedidos`<br>Tarjeta Kanban y `pedido-detail-view.tsx` | `PATCH /api/v1/pedidos/:id/estado`<br>Transición a `Listo` + Observer Notificación. |
| **CU-27: Entregar Pedido** | Admin, Empleado | `/admin/pedidos`<br>`cobrar-pedido-sheet.tsx` (`ResponsiveSheet`) | `PATCH /api/v1/pedidos/:id/estado`<br>Transición a `Entregado` previa confirmación de cobro. |
| **CU-28: Cancelar Pedido** | Admin, Empleado | `/admin/pedidos`<br>`cancel-order-sheet.tsx` | `PATCH /api/v1/pedidos/:id/cancelar`<br>Anulación + Generación de crédito por saldo previo. |
| **CU-29: Consultar Pedidos** | Admin, Empleado | `/admin/pedidos`<br>`pedidos-table.tsx`, `pedidos-kpis.tsx` | `GET /api/v1/pedidos`<br>Búsqueda predictiva y filtro por estado y fechas. |
| **CU-30: Imprimir Ticket** | Admin, Empleado | `/admin/pedidos`<br>`ticket-print-template.tsx` | `PATCH /api/v1/pedidos/:id/ticket-impreso`<br>Ticket térmico de mostrador (80mm/58mm). |

---

## 4. Especificación del Front-End (Vistas y Componentes UX)

### 1. Formulario de Alta de Pedido (`/admin/pedidos/nuevo`)
*   Panel dividido: Selección predictiva de cliente a la izquierda, Grid de servicios con cálculo dinámico a la derecha.

### 2. Componente de Ficha de Pedido (`ResponsiveSheet`)
> [!IMPORTANT]
> El detalle del pedido, acciones de cobro y cancelación se gestionan mediante el componente `ResponsiveSheet` (`src/shared/ui/overlays/responsive-sheet.tsx`), desplegándose como `SideSheet` en Desktop y `BottomSheet` en Móvil sin sobrescribir dimensiones manuales.

---

## 5. Reglas de Negocio, Contratos API y Códigos HTTP

### Contratos de Datos JSON

#### A. Registrar Pedido (`POST /api/v1/pedidos`)
```json
{
  "clienteId": 12,
  "observaciones": "Lavar prendas delicadas con agua fría",
  "origen": "Local",
  "costoEnvio": 0,
  "detalles": [
    { "servicioId": 2, "cantidad": 3, "precioUnitario": 1500.00 }
  ]
}
```
*   **Respuesta (HTTP 201 Created):**
```json
{
  "status": "success",
  "message": "Pedido registrado exitosamente",
  "data": {
    "numeroPedido": 105,
    "codigoSeguimiento": "PED-00105",
    "clienteId": 12,
    "total": 4500.00,
    "estado": "Pendiente"
  }
}
```

---

### Diagnóstico de Códigos de Respuesta HTTP

| Código HTTP | Significado Contable / Operativo | Ejemplo de Causa |
| :---: | :--- | :--- |
| **200 OK** | Operación realizada con éxito | Cambio de estado o consulta de lista de pedidos. |
| **201 Created** | Pedido creado exitosamente | Emisión de nuevo pedido en mostrador. |
| **400 Bad Request** | Error de validación o transición no permitida | Intentar avanzar un pedido cancelado o entregado. |
| **401 Unauthorized** | Token ausente o expirado | Sesión no válida. |
| **404 Not Found** | Recurso no encontrado | ID de pedido inexistente. |
