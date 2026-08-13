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
    *   `UsuarioController`: Gestión de endpoints sanitizados.
    *   `UsuarioService`: Alta atómica cross-database (DB Central `public.Usuario` + DB Tenant `tenant_{id}.Empleado`), cifrado bcrypt, asignación de roles y métricas de desempeño.
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
| **CU-43: Registrar Empleado (Alta)** | Admin *(Exclusivo)* | `/admin/empleados`<br>`empleados-header.tsx`, `empleados-modals.tsx` | `POST /api/v1/usuarios`<br>Transación atómica: Hash bcrypt, registro `Usuario` en DB Central y `Empleado` en DB Tenant. |
| **CU-44: Modificar Perfil y Rol** | Admin *(Exclusivo)* | `/admin/empleados`<br>`empleados-table.tsx`, `empleados-modals.tsx` | `PUT /api/v1/usuarios/:id`<br>Actualización de datos de legajo, contacto y rol (`admin` vs `empleado`). |
| **CU-45: Consultar Padrón y KPIs** | Admin *(Exclusivo)* | `/admin/empleados`<br>`empleados-kpis.tsx`, `empleados-table.tsx` | `GET /api/v1/usuarios`<br>Listado paginado de personal activo/inactivo por `negocioId`. |
| **CU-46: Desactivar Empleado (Baja)** | Admin *(Exclusivo)* | `/admin/empleados`<br>`empleados-table.tsx` | `PATCH /api/v1/usuarios/:id/estado`<br>Inhabilita acceso (`activo = false`) revocando JWT y preservando legajo histórico. |
| **CU-47: Auditar Desempeño y Métricas** | Admin *(Exclusivo)* | `/admin/reportes/empleados`<br>`empleados-report-table.tsx`, `caja-detalle-sheet.tsx` | `GET /api/v1/usuarios/:id/metricas`<br>Cálculo de pedidos procesados, total facturado en mostrador y cajas atendidas. |

---

## 4. Especificación del Front-End (Vistas y Componentes UX)

### Formulario y Gestión en `ResponsiveSheet`
> [!IMPORTANT]
> Los formularios de alta y edición de personal (`empleados-modals.tsx`) se despliegan mediante `ResponsiveSheet` (`src/shared/ui/overlays/responsive-sheet.tsx`), ofreciendo un `SideSheet` en Desktop y un `BottomSheet` en Móvil sin sobrescribir dimensiones manuales.

---

## 5. Diagnóstico de Códigos de Respuesta HTTP

| Código HTTP | Significado Contable / Operativo | Ejemplo de Causa |
| :---: | :--- | :--- |
| **200 OK** | Consulta o modificación exitosa | Obtención del padrón de empleados o métricas de desempeño. |
| **201 Created** | Empleado registrado exitosamente | Creación de credencial de usuario y legajo. |
| **400 Bad Request** | Error de validación sanitarios | Correo duplicado o legajo nulo. |
| **403 Forbidden** | Violación de permisos por rol | Intento de un empleado de acceder al padrón o métricas de personal. |
