# Módulo de Pedidos: Máquina de Estados y Motivos de Cancelación

## 1. Visión General

El sistema de gestión de lavandería implementa una **Máquina de Estados Finita (FSM)** para controlar el ciclo de vida de cada pedido, garantizando que únicamente se ejecuten transiciones válidas y auditando cada cambio con marcas de tiempo (`fechaHoraInicio`, `fechaHoraFin`).

Adicionalmente, se incluye una **gestión dinámica de Motivos de Cancelación** para los administradores y usuarios del tenant.

---

## 2. Estados por Defecto del Sistema

Al inicializar un negocio (tenant), el sistema auto-siembra (*seed*) 5 estados base en la tabla `estados`:

| Nombre Estado | Descripción | Ámbito |
| :--- | :--- | :--- |
| `PENDIENTE` | Pedido recepcionado en sistema, a la espera de ser procesado | Pedido |
| `EN_PROCESO` | Pedido en proceso de lavado, secado o planchado | Pedido |
| `LISTO_PARA_RETIRAR` | Pedido finalizado, listo para ser entregado al cliente | Pedido |
| `ENTREGADO` | Pedido entregado al cliente final | Pedido |
| `CANCELADO` | Pedido cancelado | Pedido |

---

## 3. Máquina de Estados (Order State Machine)

### Diagrama de Transiciones Permitidas

```
  [ PENDIENTE ] ──────────► [ EN_PROCESO ] ──────────► [ LISTO_PARA_RETIRAR ] ──────────► [ ENTREGADO ]
        │                        │                             │                                 │
        ▼                        ▼                             ▼                                 ▼
   [ CANCELADO ]            [ CANCELADO ]                 [ CANCELADO ]                    (Estado Final)
```

### Tabla de Reglas de Transición

| Estado Actual | Transiciones Permitidas | Restricciones / Reglas |
| :--- | :--- | :--- |
| **`PENDIENTE`** | `EN_PROCESO`, `CANCELADO` | Estado inicial predeterminado. |
| **`EN_PROCESO`** | `LISTO_PARA_RETIRAR`, `PENDIENTE`, `CANCELADO` | Permite retroceder a `PENDIENTE` si requirió re-trabajo. |
| **`LISTO_PARA_RETIRAR`** | `ENTREGADO`, `EN_PROCESO`, `CANCELADO` | Permite avanzar a `ENTREGADO` tras el retiro. |
| **`ENTREGADO`** | *(Ninguna)* | **Estado Terminal**. No se puede cancelar ni cambiar de estado tras la entrega física. |
| **`CANCELADO`** | *(Ninguna)* | **Estado Terminal**. Imposible revertir una cancelación realizada. |

Si un usuario intenta forzar una transición no válida (ej. de `ENTREGADO` a `EN_PROCESO`), el backend responde con un error HTTP 400:
`INVALID_STATE_TRANSITION`: *"Transición de estado no permitida: no se puede cambiar de ENTREGADO a EN_PROCESO."*

---

## 4. Gestión de Motivos de Cancelación

Al crear o inicializar un tenant, la base de datos registra automáticamente 5 motivos de cancelación generales. Los administradores pueden añadir nuevos motivos dinámicos desde la configuración.

### Motivos Sembrados por Defecto

1. **`Cliente solicitó cancelación`** (*Fijo: Si*)
2. **`Falta de insumos / imposibilidad técnica`** (*Fijo: Si*)
3. **`Duplicado / Error de carga`** (*Fijo: Si*)
4. **`Exceso de demora`** (*Fijo: No*)
5. **`Sin retiro tras vencimiento`** (*Fijo: No*)

*Los motivos marcados como `esFijo = true` son protegidos por el sistema y no pueden ser eliminados.*

---

## 5. Endpoints de la API

### Cambiar Estado de un Pedido
`PATCH /api/pedidos/:id/estado`
```json
{
  "estado": "EN_PROCESO"
}
```

### Cancelar Pedido con Motivo y Tratamiento de Dinero
`PATCH /api/pedidos/:id/estado`
```json
{
  "estado": "CANCELADO",
  "motivoCancelacion": "Cliente solicitó cancelación",
  "descripcionCancelacion": "El cliente tuvo que viajar",
  "accionDinero": "SALDO_A_FAVOR" // Opciones: "SALDO_A_FAVOR" o "DEVOLVER"
}
```

### Listar Motivos de Cancelación
`GET /api/configuracion/motivos-cancelacion`

### Crear Nuevo Motivo Personalizado
`POST /api/configuracion/motivos-cancelacion`
```json
{
  "motivo": "Falla eléctrica prolongada",
  "descripcion": "Corte de luz extenso en la zona"
}
```

### Eliminar Motivo Personalizado
`DELETE /api/configuracion/motivos-cancelacion/:id`
