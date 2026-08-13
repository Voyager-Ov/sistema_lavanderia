# Especificación Técnica de API y Requerimientos: Módulo de Control de Cajas, Arqueo de Efectivo y Cierre de Turnos

**Estándar de Documentación de Cátedra (UTN FRC)**  
**Proyecto:** SaaS Lavandería Multi-Negocio  
**Módulo:** Módulo 7 - Control de Cajas, Arqueo de Efectivo y Cierre de Turnos  

---

## 1. Arquitectura y Patrones de Diseño Recomendados

### Estilo Arquitectónico: Arquitectura en Capas (Layered Architecture)

*   **Capa de Presentación («boundary»)**:
    *   Pantalla Principal de Caja (`/admin/caja` y `/pos/caja`).
    *   Formulario/Modal de Apertura (`abrir-caja-form.tsx`).
    *   Tarjetas KPI de Estado de Caja en Vivo (`caja-metricas.tsx`).
    *   Modal/Sheet de Cierre y Arqueo (`cerrar-caja-modal.tsx`).
    *   Tabla de Historial de Turnos de Caja (`caja-historial.tsx` y `ultimas-cajas-table.tsx`).
    *   Detalle de Caja de Turno en `ResponsiveSheet` (`caja-detalle-sheet.tsx`).
*   **Capa de Control/Servicios («control»)**:
    *   `CajaController`: Serialización de respuestas sanitizadas.
    *   `CajaCoreService`: Apertura de turno, segregación de métodos de pago en tiempo real y cálculo determinístico de efectivo esperado.
    *   `CajaHistorialService`: Auditoría de turnos pasados con scoping por rol.
*   **Capa de Dominio/Entidades («entity»)**:
    *   Modelos Sequelize: `Caja`, `Pago`, `Gasto`, `MetodoPago`, `Usuario`.

---

### Patrones de Diseño (GoF) Claves Aplicados al Módulo de Cajas

1.  **Patrón State (Estado del Turno de Caja)**:
    *   *Propósito:* Prevenir operaciones sin turno abierto o la apertura de múltiples cajas simultáneas por un mismo usuario.
    *   *Estados:* `ABIERTA` y `CERRADA`.

2.  **Patrón Observer (WebSockets de Caja en Tiempo Real)**:
    *   *Propósito:* Refrescar métricas en vivo al registrar cobros o gastos.
    *   *Implementación:* Emisión del evento `caja_actualizada`.

3.  **Patrón Strategy (Segregación de Métodos de Pago)**:
    *   *Propósito:* Desglosar dinero físico de cobros digitales para el arqueo final.
    *   *Fórmula:* $\text{Efectivo Esperado} = \text{Monto Inicial} + \text{Ingresos Efectivo} - \text{Egresos Efectivo}$.

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
| **CU-28: Abrir Caja de Turno** | Admin, Empleado | `/admin/caja` y `/pos/caja`<br>`abrir-caja-form.tsx` | `POST /api/v1/cajas/abrir`<br>Verificación de unicidad de caja abierta e inyección de `montoInicial`. |
| **CU-29: Consultar Caja Actual (En Vivo)** | Admin, Empleado | `/admin/caja` y `/pos/caja`<br>`caja-dashboard.tsx`, `caja-metricas.tsx` | `GET /api/v1/cajas/actual`<br>`calcularMetricasCaja` (Efectivo Esperado vs Digitales). |
| **CU-30: Realizar Arqueo y Cerrar Caja** | Admin, Empleado | `/admin/caja` y `/pos/caja`<br>`cerrar-caja-modal.tsx` (`ResponsiveSheet`) | `POST /api/v1/cajas/:id/cerrar`<br>Conciliación `efectivoReal` vs `efectivoEsperado` ➔ `diferenciaEfectivo`. |
| **CU-31: Consultar Historial Propio** | Admin, Empleado | `/admin/caja` y `/pos/caja`<br>`caja-historial.tsx` | `GET /api/v1/cajas`<br>Scoping por usuario para empleados (`where.usuarioId = req.user.id`). |
| **CU-32: Consultar Historial Global** | Admin *(Exclusivo)* | `/admin/reportes/empleados`<br>`ultimas-cajas-table.tsx` | `GET /api/v1/cajas`<br>Auditoría ejecutiva global de todos los cajeros del negocio. |
| **CU-33: Auditar Discrepancias** | Admin *(Exclusivo)* | `/admin/caja/[id]`<br>`caja-detalle-sheet.tsx` (`ResponsiveSheet`) | `GET /api/v1/cajas/:id`<br>Auditoría de descalces de efectivo (faltantes/sobrantes). |

---

## 4. Especificación del Front-End (Vistas y Componentes UX)

### 1. Panel Dashboard de Caja (`/admin/caja`)
*   Tarjetas KPI de estado en vivo con badges visuales de arqueo (Verde: exacto / Rojo: faltante / Azul: sobrante).

### 2. Formulario y Detalle en `ResponsiveSheet`
> [!IMPORTANT]
> Los detalles del turno de caja (`caja-detalle-sheet.tsx`) y modales de cierre se despliegan mediante `ResponsiveSheet` (`src/shared/ui/overlays/responsive-sheet.tsx`), ofreciendo `SideSheet` en Desktop y `BottomSheet` en Móvil.

---

## 5. Reglas de Negocio, Contratos API y Códigos HTTP

### Contratos de Datos JSON

#### A. Obtener Caja Actual (`GET /api/v1/cajas/actual`)
```json
{
  "status": "success",
  "message": null,
  "data": {
    "id": 14,
    "montoInicial": 5000.00,
    "estado": "ABIERTA",
    "totalIngresosEfectivo": 10000.00,
    "totalEgresosEfectivo": 2000.00,
    "efectivoEsperadoEnVivo": 13000.00
  }
}
```

#### B. Cerrar Caja con Arqueo (`POST /api/v1/cajas/:id/cerrar`)
```json
{
  "efectivoReal": 12800.00
}
```
*   **Respuesta (HTTP 200 OK):**
```json
{
  "status": "success",
  "message": "Caja cerrada exitosamente",
  "data": {
    "id": 14,
    "estado": "CERRADA",
    "efectivoEsperado": 13000.00,
    "efectivoReal": 12800.00,
    "diferenciaEfectivo": -200.00
  }
}
```

---

### Diagnóstico de Códigos de Respuesta HTTP

| Código HTTP | Significado Contable / Operativo | Ejemplo de Causa |
| :---: | :--- | :--- |
| **200 OK** | Operación realizada con éxito | Consulta de caja actual o arqueo exitoso. |
| **201 Created** | Turno de caja abierto exitosamente | Creación de registro en `Caja`. |
| **400 Bad Request** | Error de validación o unicidad de turno | Intentar abrir una segunda caja teniendo ya un turno activo. |
| **401 Unauthorized** | Token ausente o expirado | Sesión de usuario no válida. |
| **404 Not Found** | Caja no encontrada | ID de caja inexistente o ya cerrada. |
