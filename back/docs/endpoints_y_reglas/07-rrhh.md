# Módulo: Recursos Humanos (Asistencias)

## Descripción General
Este módulo permite el control de asistencia de los empleados, registrando las fichadas de entrada y salida para calcular posteriormente las horas trabajadas.

## Roles Permitidos
- Todos los roles pueden registrar sus propias entradas y salidas.
- Todos los roles pueden consultar sus propias asistencias.
- Solo `ADMIN` (y `SUPERADMIN`) pueden consultar las asistencias de todos los empleados.
- Requiere autenticación y suscripción de negocio activa.

## Endpoints (Requerimientos Funcionales)

### 1. Fichar Entrada
- **Ruta y Método**: `POST /api/rrhh/asistencias/entrada`
- **Acción**: Inicia un turno para el usuario logueado, guardando la `fechaHoraEntrada`.
- **Reglas de Negocio**:
  - **Turno Único**: No se permite fichar una entrada si el usuario ya tiene un turno abierto (es decir, una fichada anterior sin registrar la salida correspondiente).

### 2. Fichar Salida
- **Ruta y Método**: `POST /api/rrhh/asistencias/salida`
- **Acción**: Finaliza el turno actual del usuario logueado, registrando la `fechaHoraSalida`.
- **Reglas de Negocio**:
  - **Turno Existente**: No se puede fichar salida si no existe un turno previamente abierto.

### 3. Obtener Asistencias
- **Ruta y Método**: `GET /api/rrhh/asistencias`
- **Acción**: Retorna el registro histórico de asistencias de los empleados.
- **Reglas de Negocio (RBAC)**:
  - Si el rol es `EMPLEADO`, el sistema fuerza el filtro para devolver **solo** las asistencias del propio usuario que consulta (ignora si se solicita el ID de otro empleado).
  - Si el rol es `ADMIN`, puede ver las asistencias de cualquier empleado del negocio.
- **Filtros Soportados**:
  - `empleadoId`: Filtra los registros para un empleado en particular (solo útil para Admins).
  - `fechaInicio` y `fechaFin`: Permite buscar asistencias dentro de un rango de fechas de entrada.
- **Dato Técnico**: Dado que los Usuarios viven en la base de datos central y las Asistencias en la base de datos del negocio (Tenant), el servicio hace el cruce (join) a nivel de código para devolver el nombre y rol del empleado junto a los registros de fichadas.

### 4. Reporte Mensual de Sueldos
- **Ruta y Método**: `GET /api/rrhh/reportes/sueldos`
- **Acción**: Genera un reporte consolidado de las horas trabajadas por cada empleado en un mes específico.
- **Roles Permitidos**: Solo `ADMIN`.
- **Filtros Soportados**:
  - `mes`: Mes (1-12).
  - `anio`: Año (ej. 2026).
