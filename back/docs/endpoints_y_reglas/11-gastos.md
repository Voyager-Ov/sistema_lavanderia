# Módulo: Gastos

## Descripción General
Este módulo permite registrar las salidas de dinero (egresos) que ocurren durante el turno de una caja, como compra de insumos de limpieza, pago de servicios o nómina.

## Roles Permitidos
- Todos los roles pueden consultar y registrar gastos, pero los **EMPLEADOS** tienen fuertes restricciones en cuanto a qué pueden registrar y qué pueden ver.
- Requiere autenticación y suscripción activa.

## Endpoints (Requerimientos Funcionales)

### 1. Registrar Gasto
- **Ruta y Método**: `POST /api/gastos`
- **Acción**: Crea un nuevo registro de gasto que se descuenta del saldo de la caja.
- **Validaciones**: `monto` (numérico, mayor a 0), `categoria` (string), `descripcion` (opcional).
- **Reglas de Negocio**:
  - **Caja Obligatoria**: El usuario que intenta registrar el gasto **debe tener una caja abierta** en el momento de la petición. Si no, se rechaza.
  - **Restricción de Categorías (RBAC)**: Si el usuario es un `EMPLEADO`, **NO** se le permite registrar gastos en las siguientes categorías restringidas: `"Nomina"`, `"Servicios"`, `"Alquiler"`. Si intenta hacerlo, recibirá un error `403 Prohibido`. (Los Admins no tienen esta restricción).
- **Cuerpo (Payload) Esperado**:
  ```json
  {
    "monto": 2500,
    "categoria": "Insumos",
    "descripcion": "Compra de Jabón en Polvo X 5Kg"
  }
  ```

### 2. Listar Gastos
- **Ruta y Método**: `GET /api/gastos`
- **Acción**: Retorna el listado de gastos paginado.
- **Reglas de Negocio (RBAC)**:
  - Si el usuario es un `EMPLEADO`, el backend automáticamente fuerza un filtro interno (`where.cajaId = cajaAbierta.id`) para que **solo vea los gastos asociados a su caja actualmente abierta**. Si el empleado no tiene una caja abierta al momento de hacer la petición, el endpoint retorna una lista vacía (sin importar si tuvo gastos en el pasado).
  - Los Admins pueden ver todos los gastos del negocio.
- **Filtros Soportados**:
  - `categoria`: Búsqueda por categoría exacta de gasto.
  - `fechaInicio` y `fechaFin`: Filtrado por rango de fechas en las que se creó el registro del gasto.
