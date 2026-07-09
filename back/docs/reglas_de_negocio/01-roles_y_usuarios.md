# Reglas de Negocio: Roles y Usuarios

En el sistema SaaS de Lavandería, implementamos un modelo de seguridad basado en Roles (RBAC). El sistema es multi-tenant, lo que significa que un usuario pertenece a un Negocio específico.

## 1. Roles Disponibles

### 1.1 Administrador (`admin`)
- **Descripción**: Es el dueño o gerente de la lavandería.
- **Permisos**:
  - Acceso total a la plataforma del Negocio.
  - Ver dashboard financiero y reportes.
  - Modificar el catálogo de Productos/Servicios (precios, disponibilidad).
  - Gestionar (crear/editar/eliminar) Empleados.
  - Anular pagos o pedidos cancelados.
  - Configurar datos generales del Negocio.

### 1.2 Empleado (`empleado`)
- **Descripción**: Operario de mostrador o de planta.
- **Permisos**:
  - Cargar nuevos pedidos y cambiar sus estados.
  - Registrar pagos de los pedidos (Cobrar).
  - Gestionar (Crear, Editar, Borrar) Clientes de su local.
  - NO pueden modificar precios, no pueden crear ni desactivar otros empleados, ni ver la caja total.

## 2. Gestión de Clientes y Eliminación (Soft Delete)
- **Alcance**: Tanto el Administrador como los Empleados pueden crear, editar y dar de baja Clientes. Sin embargo, el filtro lógico `negocioId` está siempre presente, impidiendo que accedan a clientes de otras lavanderías.
- **Baja Lógica (Soft Delete)**: Cuando se elimina un cliente, la fila no se borra de la tabla (`DELETE`). En su lugar, el campo `activo` se cambia a `false` y es obligatorio registrar el por qué en el campo `motivoBaja` (ej: "Se mudó y pidió borrar sus datos"). Esto asegura que si ese cliente tuvo facturas y pedidos en el pasado, la base de datos no pierda integridad referencial para los históricos.

## 3. Autenticación y Sesión
- Se utiliza **JWT (JSON Web Tokens)** almacenado preferentemente en Cookies `HttpOnly` (o en cabecera `Authorization` Bearer).
- Al iniciar sesión, el payload del token incluirá:
  - `id`: ID del usuario
  - `negocioId`: ID del negocio al que pertenece (crucial para filtrar todas las peticiones)
  - `rol`: `admin` o `empleado`
- Los tokens tienen una expiración (ej: 1 hora) para seguridad.
- Las contraseñas en la base de datos se almacenan hasheadas con `bcryptjs`.
