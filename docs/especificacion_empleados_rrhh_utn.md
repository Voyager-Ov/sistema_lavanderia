# Especificación Técnica de API y Requerimientos: Módulo de Gestión de Empleados y Recursos Humanos

**Estándar de Documentación de Cátedra (UTN FRC)**  
**Proyecto:** SaaS Lavandería Multi-Negocio  
**Módulo:** Módulo de Gestión de Empleados y Recursos Humanos (Portal Admin)  

---

## 1. Arquitectura y Patrones de Diseño Recomendados

### Estilo Arquitectónico: Arquitectura en Capas (Layered Architecture)

*   **Capa de Presentación («boundary»)**:
    *   Pantalla Principal de Empleados (`/admin/empleados`).
    *   Tarjetas KPI de Personal (`empleados-kpis.tsx`).
    *   Tabla de Legajos y Acciones (`empleados-table.tsx`).
    *   Formulario de Alta y Edición en `ResponsiveSheet` (`empleados-modals.tsx`).
    *   Pantalla de Reportes de Desempeño (`/admin/reportes/empleados` - `empleados-report-table.tsx`, `ultimas-cajas-table.tsx`).
    *   Detalle de Turnos de Caja por Empleado en `ResponsiveSheet` (`caja-detalle-sheet.tsx`).
*   **Capa de Control/Servicios («control»)**:
    *   `empleados.controller.js` / `estadoEmpleados.controller.js` / `desempenoEmpleados.controller.js`: Peticiones sanitizadas.
    *   `empleados.service.js` / `estadoEmpleados.service.js` / `desempenoEmpleados.service.js`: Alta atómica cross-database (DB Central `public.Usuario` + DB Tenant `tenant_{id}.Empleado`), cifrado bcrypt, asignación de roles y métricas de desempeño.
*   **Capa de Dominio/Entidades («entity»)**:
    *   Modelos Sequelize: `Usuario`, `Rol`, `UsuarioRoles` (DB Central), `Empleado`, `Caja`, `Pago` (DB Tenant).

---

## 2. Jerarquía de Actores y Matriz de Permisos por Rol

### Jerarquía de Actores (Estándar UTN FRC)

*   **Usuario** (Actor Abstracto).
    *   **Empleado** (Actor Físico):
        *   **Administrador** (Rol `admin`): Control exclusivo para dar de alta empleados, editar legajos, asignar roles, inhabilitar accesos y auditar métricas de desempeño.
        *   **Empleado Operativo / Cajero** (Rol `empleado`): Sujeto de gestión del módulo.

---

## 3. Mapeo de Casos de Uso, Actores y Componentes UI del Frontend

| Caso de Uso (CU) | Actores Autorizados | Pantalla / Componente Frontend (UI) | Funcionalidad y Endpoint Backend |
| :--- | :---: | :--- | :--- |
| **CU-43: Registrar Empleado (Alta)** | Admin *(Exclusivo)* | `/admin/empleados`<br>`empleados-header.tsx`, `empleados-modals.tsx` | `POST /api/empleados` o `/api/rrhh`<br>Transacción atómica: Hash bcryptjs, registro `Usuario` en DB Central y `Empleado` en DB Tenant. |
| **CU-44: Modificar Perfil y Rol** | Admin *(Exclusivo)* | `/admin/empleados`<br>`empleados-table.tsx`, `empleados-modals.tsx` | `PUT /api/empleados/:id`<br>Actualización de datos de legajo, contacto y rol (`admin` vs `empleado`). |
| **CU-45: Consultar Padrón y KPIs** | Admin *(Exclusivo)* | `/admin/empleados`<br>`empleados-kpis.tsx`, `empleados-table.tsx` | `GET /api/empleados`<br>Listado paginado de personal activo/inactivo por `negocioId`. |
| **CU-46: Desactivar Empleado (Baja)** | Admin *(Exclusivo)* | `/admin/empleados`<br>`empleados-table.tsx` | `PATCH /api/empleados/:id/estado`<br>Inhabilita acceso (`activo = false`) revocando JWT y preservando legajo histórico. |
| **CU-47: Auditar Desempeño y Métricas** | Admin *(Exclusivo)* | `/admin/reportes/empleados`<br>`empleados-report-table.tsx`, `caja-detalle-sheet.tsx` | `GET /api/empleados/:id/metricas` / `/api/reportes/empleados`<br>Cálculo de pedidos procesados, total facturado en mostrador y cajas atendidas. |

---

## 4. Desglose y Separación Modular de Archivos Backend (`src/modules/rrhh/`)

Para mantener el código enfocado y fácil de auditar (< 100 líneas por archivo), la lógica de RRHH se divide por dominios funcionales:

```mermaid
graph TD
    Subgraph Capa_Enrutamiento["1. Rutas (Routes)"]
        R1["rrhh.routes.js (/api/rrhh y /api/empleados)"]
    end

    Subgraph Capa_Validacion["2. Validadores (Validators)"]
        V1["empleados.validator.js"]
    end

    Subgraph Capa_Controladores["3. Controladores (Controllers)"]
        C1["empleados.controller.js"]
        C2["estadoEmpleados.controller.js"]
        C3["desempenoEmpleados.controller.js"]
    end

    Subgraph Capa_Servicios["4. Servicios (Services)"]
        S1["empleados.service.js"]
        S2["estadoEmpleados.service.js"]
        S3["desempenoEmpleados.service.js"]
    end

    R1 --> V1 --> C1 --> S1
    R1 --> C2 --> S2
    R1 --> C3 --> S3
```

### 4.1. Capa de Servicios (`src/modules/rrhh/services/`)

1. **`empleados.service.js`**
   * **Responsabilidad:** Alta atómica cross-database (DB Central `public.Usuario` con bcryptjs + DB Tenant `tenant_{id}.Empleado`), consulta paginada (`obtenerEmpleados`) y actualización de legajo.
   * **Casos de Uso:** `CU-43 (Alta)`, `CU-44 (Modificar Perfil)` y `CU-45 (Consultar Padrón)`.
2. **`estadoEmpleados.service.js`**
   * **Responsabilidad:** Modificación del estado activo/inactivo (`activo = true/false`) sincronizando el acceso central del usuario.
   * **Caso de Uso:** `CU-46 (Desactivar Empleado - Baja)`.
3. **`desempenoEmpleados.service.js`**
   * **Responsabilidad:** Auditoría y cálculo de métricas de rendimiento por personal (pedidos procesados, cajas atendidas y recaudación de mostrador).
   * **Caso de Uso:** `CU-47 (Auditar Desempeño y Métricas)`.

---

### 4.2. Capa de Controladores (`src/modules/rrhh/controllers/`)

1. **`empleados.controller.js`**: Handlers HTTP Express para `GET /`, `POST /`, `GET /:id` y `PUT /:id`. Interfaz de control para `CU-43`, `CU-44` y `CU-45`.
2. **`estadoEmpleados.controller.js`**: Handler HTTP Express para `PATCH /:id/estado`. Interfaz de control para `CU-46`.
3. **`desempenoEmpleados.controller.js`**: Handler HTTP Express para `GET /:id/metricas` y `/api/reportes/empleados`. Interfaz de control para `CU-47`.

---

### 4.3. Capa de Validadores y Enrutamiento (`src/modules/rrhh/`)

1. **`empleados.validator.js`**: Sanitiza y valida formato de `nombre` y `email`.
2. **`rrhh.routes.js`**: Enrutador Express expuesto en `/api/rrhh`, `/api/empleados` y `/api/usuarios` protegido con token JWT (`verificarToken`).

---

## 5. Especificación del Front-End (Vistas y Componentes UX)

### Formulario y Gestión en `ResponsiveSheet`
> [!IMPORTANT]
> Los formularios de alta y edición de personal (`empleados-modals.tsx`) se despliegan mediante `ResponsiveSheet` (`src/shared/ui/overlays/responsive-sheet.tsx`), ofreciendo un `SideSheet` en Desktop y un `BottomSheet` en Móvil sin sobrescribir dimensiones manuales.

---

## 6. Diagnóstico de Códigos de Respuesta HTTP

| Código HTTP | Significado Contable / Operativo | Ejemplo de Causa |
| :---: | :--- | :--- |
| **200 OK** | Consulta o modificación exitosa | Obtención del padrón de empleados o métricas de desempeño. |
| **201 Created** | Empleado registrado exitosamente | Creación de credencial de usuario y legajo. |
| **400 Bad Request** | Error de validación sanitarios | Correo duplicado o legajo nulo. |
| **403 Forbidden** | Violación de permisos por rol | Intento de un empleado de acceder al padrón o métricas de personal. |
