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
    *   `gastos.controller.js` / `categoriasGastos.controller.js` / `anulacionGastos.controller.js`: Serialización y respuesta HTTP sanitizada.
    *   `gastos.service.js` / `categoriasGastos.service.js` / `anulacionGastos.service.js`: Lógica de negocio, validación de caja abierta e impacto contable.
*   **Capa de Dominio/Entidades («entity»)**:
    *   Modelos Sequelize: `Gasto`, `CategoriaGasto`, `Caja`, `MovimientoCaja`, `MetodoPago`, `Usuario`.

---

## 2. Jerarquía de Actores y Matriz de Permisos por Rol

### Jerarquía de Actores (Estándar UTN FRC)

*   **Usuario** (Actor Abstracto).
    *   **Empleado** (Actor Físico):
        *   **Administrador** (Rol `admin`).
        *   **Empleado Operativo / Cajero** (Rol `empleado`).

---

## 3. Mapeo de Casos de Uso, Actores y Componentes UI del Frontend

| Caso de Uso (CU) | Actores Autorizados | Pantalla / Componente Frontend (UI) | Funcionalidad y Endpoint Backend |
| :--- | :---: | :--- | :--- |
| **CU-24: Registrar Gasto de Caja** | Admin, Empleado | `/admin/caja`, `/pos/caja`<br>`registrar-gasto-modal.tsx` (`ResponsiveSheet`) | `POST /api/gastos`<br>Validación de caja abierta + registro de egreso negativo en `MovimientoCaja`. |
| **CU-25: Consultar Historial y Filtros** | Admin, Empleado | `/admin/finanzas` y `/admin/caja`<br>`FinanzasKPIs.tsx`, `FinanzasCharts.tsx` | `GET /api/gastos`<br>Listado paginado con ordenamiento descendente por fecha. |
| **CU-26: Gestionar Categorías (ABM)** | Admin *(Exclusivo)* | `/admin/finanzas`<br>`categorias-sheet.tsx` (`ResponsiveSheet`) | `GET /api/categorias-gastos`<br>`POST /api/categorias-gastos`<br>`DELETE /api/categorias-gastos/:id`<br>ABM exclusivo de categorías contables de egresos. |
| **CU-27: Anular Gasto de Caja** | Admin *(Exclusivo)* | `/admin/finanzas`<br>`movimiento-detail-sheet.tsx` (`ResponsiveSheet`) | `PATCH /api/gastos/:id/anular`<br>Invalida comprobante (`estadoGasto = "Anulado"`) y reajusta la caja. |

---

## 4. Desglose y Separación Modular de Archivos Backend (`src/modules/gastos/`)

Para asegurar la mantenibilidad y evitar archivos monolíticos (cumpliendo la norma de menos de 100 líneas por componente), la funcionalidad del módulo se encuentra dividida estrictamente por responsabilidad:

```mermaid
graph TD
    Subgraph Capa_Enrutamiento["1. Rutas (Routes)"]
        R1["gastos.routes.js (/api/gastos)"]
        R2["categoriasGastos.routes.js (/api/categorias-gastos)"]
    end

    Subgraph Capa_Validacion["2. Validadores (Validators)"]
        V1["gastos.validator.js"]
        V2["categoriasGastos.validator.js"]
    end

    Subgraph Capa_Controladores["3. Controladores (Controllers)"]
        C1["gastos.controller.js"]
        C2["anulacionGastos.controller.js"]
        C3["categoriasGastos.controller.js"]
    end

    Subgraph Capa_Servicios["4. Servicios (Services)"]
        S1["gastos.service.js"]
        S2["anulacionGastos.service.js"]
        S3["categoriasGastos.service.js"]
    end

    R1 --> V1 --> C1 --> S1
    R1 --> C2 --> S2
    R2 --> V2 --> C3 --> S3
```

### 4.1. Capa de Servicios (`src/modules/gastos/services/`)

1. **`categoriasGastos.service.js`**
   * **Responsabilidad:** ABM de categorías de egresos e inserción automática de categorías base sugeridas por tenant (*Insumos, Mantenimiento, Servicios, Nómina, Alquiler, Varios*).
   * **Casos de Uso que Resuelve:** `CU-26 (Gestionar Categorías - ABM)`.
2. **`gastos.service.js`**
   * **Responsabilidad:** Creación de comprobantes de egreso (`registrarGasto`), consulta paginada (`obtenerGastos`), consulta por ID (`obtenerGastoPorId`) e impacto automático de saldo negativo en la `Caja` activa (`MovimientoCaja`).
   * **Casos de Uso que Resuelve:** `CU-24 (Registrar Gasto de Caja)` y `CU-25 (Consultar Historial y Filtros)`.
3. **`anulacionGastos.service.js`**
   * **Responsabilidad:** Anulación contable de comprobantes de egreso (`anularGasto`), cambiando el estado del comprobante a `Anulado` y actualizando el movimiento de caja asociado.
   * **Casos de Uso que Resuelve:** `CU-27 (Anular Gasto de Caja)`.

---

### 4.2. Capa de Controladores (`src/modules/gastos/controllers/`)

1. **`categoriasGastos.controller.js`**
   * **Responsabilidad:** Handlers de peticiones Express para `GET /`, `POST /` y `DELETE /:id` en `/api/categorias-gastos`.
   * **Caso de Uso que Resuelve:** Interfaz de control para `CU-26`.
2. **`gastos.controller.js`**
   * **Responsabilidad:** Handlers de peticiones Express para `POST /`, `GET /` y `GET /:id` en `/api/gastos`.
   * **Casos de Uso que Resuelve:** Interfaz de control para `CU-24` y `CU-25`.
3. **`anulacionGastos.controller.js`**
   * **Responsabilidad:** Handler de petición Express para `PATCH /:id/anular` en `/api/gastos`.
   * **Caso de Uso que Resuelve:** Interfaz de control para `CU-27`.

---

### 4.3. Capa de Validadores (`src/modules/gastos/validators/`)

1. **`categoriasGastos.validator.js`**
   * **Responsabilidad:** Middleware de validación para asegurar la presencia y formato del atributo `nombre` al crear categorías.
2. **`gastos.validator.js`**
   * **Responsabilidad:** Middleware de validación para asegurar que el monto del egreso sea un número válido y mayor a cero.

---

### 4.4. Capa de Enrutamiento (`src/modules/gastos/`)

1. **`categoriasGastos.routes.js`**: Define los endpoints montados en `/api/categorias-gastos` protegidos por JWT (`verificarToken`).
2. **`gastos.routes.js`**: Define los endpoints montados en `/api/gastos` protegidos por JWT (`verificarToken`).

---

## 5. Especificación del Front-End (Vistas y Componentes UX)

### Formulario y Gestión en `ResponsiveSheet`
> [!IMPORTANT]
> Los formularios de registro de egresos (`registrar-gasto-modal.tsx`) y ABM de categorías (`categorias-sheet.tsx`) se presentan mediante `ResponsiveSheet` (`src/shared/ui/overlays/responsive-sheet.tsx`), alternando entre `SideSheet` en Desktop y `BottomSheet` en Móvil.

---

## 6. Reglas de Negocio, Contratos API y Códigos HTTP

### Contratos de Datos JSON

#### A. Registrar Gasto (`POST /api/gastos`)
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
  "success": true,
  "message": "Gasto registrado exitosamente",
  "data": {
    "id": 42,
    "montoTotal": 4500.00,
    "descripcion": "Compra de 5 litros de detergente concentrado industrial",
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
| **403 Forbidden** | Violación de permisos por rol | Intento de un empleado de anular gastos sin ser Administrador. |
