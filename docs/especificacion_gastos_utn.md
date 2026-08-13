# Especificación Técnica de API y Requerimientos: Módulo de Gestión de Gastos y Categorías de Egresos

**Estándar de Documentación de Cátedra (UTN FRC)**  
**Proyecto:** SaaS Lavandería Multi-Negocio  
**Módulo:** Módulo 6 - Gestión de Gastos y Categorías de Egresos  

---

## 1. Arquitectura y Patrones de Diseño Recomendados

### Estilo Arquitectónico: Arquitectura en Capas (Layered Architecture)

*   **Capa de Presentación («boundary»)**:
    *   Modal/Formulario de Registro de Gasto en `ResponsiveSheet` (`registrar-gasto-modal.tsx`).
    *   Dashboard de Finanzas (`/admin/finanzas` - `FinanzasKPIs.tsx`, `FinanzasCharts.tsx`).
    *   Gestor de Categorías en `ResponsiveSheet` (`categorias-sheet.tsx`).
    *   Ficha de Anulación de Movimiento (`movimiento-detail-sheet.tsx`).
*   **Capa de Control/Servicios («control»)**:
    *   `GastoController`: Serialización de respuestas sanitizadas.
    *   `GastoService`: Validación de caja abierta, enforcement de Guard Rules RBAC por categoría y notificaciones WebSockets.
*   **Capa de Dominio/Entidades («entity»)**:
    *   Modelos Sequelize: `Gasto`, `CategoriaGasto`, `Caja`, `MetodoPago`, `Usuario`.

---

## 2. Jerarquía de Actores y Matriz de Permisos por Rol

### Jerarquía de Actores (Estándar UTN FRC)

*   **Usuario** (Actor Abstracto).
    *   **Empleado** (Actor Físico):
        *   **Administrador** (Rol `admin`).
        *   **Empleado Operativo / Cajero** (Rol `empleado`).
*   **Servidor de Correo / WebSockets** (Actor Secundario / Sistema Externo).

---

## 3. Mapeo de Casos de Uso, Actores y Componentes UI del Frontend

| Caso de Uso (CU) | Actores Autorizados | Pantalla / Componente Frontend (UI) | Funcionalidad y Endpoint Backend |
| :--- | :---: | :--- | :--- |
| **CU-24: Registrar Gasto de Caja** | Admin, Empleado | `/admin/caja`, `/pos/caja`<br>`registrar-gasto-modal.tsx` (`ResponsiveSheet`) | `POST /api/v1/gastos`<br>Validación de caja abierta + Guard Rule por categoría (bloqueo HTTP 403 a empleados en *Nómina*, *Servicios*, *Alquiler*). |
| **CU-25: Consultar Historial y Filtros** | Admin, Empleado | `/admin/finanzas` y `/admin/caja`<br>`FinanzasKPIs.tsx`, `FinanzasCharts.tsx` | `GET /api/v1/gastos`<br>Scoping automático por `cajaId` de turno para empleados y global para administradores. |
| **CU-26: Gestionar Categorías (ABM)** | Admin *(Exclusivo)* | `/admin/finanzas`<br>`categorias-sheet.tsx` (`ResponsiveSheet`) | `POST /api/v1/categorias-gastos`<br>ABM exclusivo de categorías contables de egresos. |
| **CU-27: Anular Gasto de Caja** | Admin *(Exclusivo)* | `/admin/finanzas`<br>`movimiento-detail-sheet.tsx` (`ResponsiveSheet`) | `PATCH /api/v1/gastos/:id/anular`<br>Invalida comprobante (`estadoGasto = "Anulado"`) y reajusta la caja. |

---

## 4. Especificación del Front-End (Vistas y Componentes UX)

### Formulario y Gestión en `ResponsiveSheet`
> [!IMPORTANT]
> Los formularios de registro de egresos (`registrar-gasto-modal.tsx`) y ABM de categorías (`categorias-sheet.tsx`) se presentan mediante `ResponsiveSheet` (`src/shared/ui/overlays/responsive-sheet.tsx`), alternando entre `SideSheet` en Desktop y `BottomSheet` en Móvil.

---

## 5. Reglas de Negocio, Contratos API y Códigos HTTP

### Contratos de Datos JSON

#### A. Registrar Gasto (`POST /api/v1/gastos`)
```json
{
  "monto": 4500.00,
  "categoria": "Insumos",
  "descripcion": "Compra de 5 litros de detergente concentrado industrial",
  "metodoPagoId": 1,
  "proveedor": "Distribuidora Química San Martín",
  "nroComprobante": "FACT-B-0001-00045211"
}
```
*   **Respuesta (HTTP 201 Created):**
```json
{
  "status": "success",
  "message": "Gasto registrado exitosamente",
  "data": {
    "id": 42,
    "montoTotal": 4500.00,
    "categoria": "Insumos",
    "estadoGasto": "Pagado"
  }
}
```

---

### Diagnóstico de Códigos de Respuesta HTTP

| Código HTTP | Significado Contable / Operativo | Ejemplo de Causa |
| :---: | :--- | :--- |
| **200 OK** | Consulta o anulación exitosa | Obtener lista de gastos o anular comprobante. |
| **201 Created** | Gasto registrado exitosamente | Persistencia del comprobante de egreso. |
| **400 Bad Request** | Error de validación o sin caja abierta | Registrar egreso sin poseer un turno de caja en estado `ABIERTA`. |
| **403 Forbidden** | Violación de permisos por rol | Intento de un empleado de registrar gastos en *Nómina*, *Servicios* o *Alquiler*. |
