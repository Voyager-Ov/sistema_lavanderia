# Módulo: Cajas

## Descripción General
Este módulo administra la apertura y cierre de la caja registradora (física o virtual) asignada a un usuario durante su turno, permitiendo el arqueo del efectivo y calculando en vivo los ingresos, egresos y el monto esperado.

## Roles Permitidos
- Todos los roles (ADMIN, EMPLEADO, SUPERADMIN) pueden abrir y cerrar su propia caja.
- Requiere autenticación y suscripción activa del negocio.

## Endpoints (Requerimientos Funcionales)

### 1. Abrir Caja
- **Ruta y Método**: `POST /api/cajas/abrir`
- **Acción**: Inicia un nuevo registro de caja para el usuario en estado `ABIERTA`.
- **Validaciones**: `montoInicial` (opcional, por defecto `0`).
- **Reglas de Negocio**:
  - **Restricción Única**: Un usuario **no puede abrir más de una caja** simultáneamente en un mismo negocio. El sistema rechazará la solicitud si ya existe una caja en estado `ABIERTA`.
- **Cuerpo (Payload) Esperado**:
  ```json
  {
    "montoInicial": 5000
  }
  ```

### 2. Obtener Caja Actual
- **Ruta y Método**: `GET /api/cajas/actual`
- **Acción**: Devuelve los detalles de la caja `ABIERTA` del usuario logueado, calculando los saldos en vivo.
- **Reglas de Negocio**:
  - Si el usuario no tiene una caja abierta, devuelve un error `404`.
  - **Cálculo en vivo**: El backend suma todos los `Pagos` asociados a esa caja que estén en estado `COMPLETADO` (`totalIngresosEnVivo`), suma todos los `Gastos` asociados (`totalEgresosEnVivo`) y calcula el `efectivoEsperadoEnVivo` (`montoInicial` + `Ingresos` - `Egresos`). Estos valores no se guardan en la BD hasta el cierre, pero se calculan al vuelo para mantener el dashboard actualizado.

### 3. Cerrar Caja
- **Ruta y Método**: `POST /api/cajas/:id/cerrar`
- **Acción**: Finaliza la sesión de la caja, guardando los totales definitivos y calculando la diferencia (faltante o sobrante).
- **Validaciones**: `efectivoReal` (obligatorio, número flotante). Es el dinero que el cajero contó físicamente.
- **Reglas de Negocio**:
  - Verifica que la caja con ese `id` le pertenezca al usuario y esté en estado `ABIERTA`.
  - Calcula los totales exactos en ese instante (Ingresos por pagos `COMPLETADO` y Egresos por `Gastos`).
  - **Diferencia de Efectivo**: Calcula `efectivoReal` - `efectivoEsperado` (Si es negativo es faltante, si es positivo es sobrante).
  - Actualiza el estado a `CERRADA` y sella los montos finales en la base de datos.
- **Cuerpo (Payload) Esperado**:
  ```json
  {
    "efectivoReal": 15000
  }
  ```
