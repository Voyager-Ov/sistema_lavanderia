# Módulo de Servicios y Catálogo (Portal Admin & POS)

Este documento especifica los endpoints, modelos y lógica de negocio del módulo de Servicios en `back2`.

---

## 1. Modelo de Datos

### Modelo `HistorialPrecioServicio`
Representa el registro auditado de cambios de precio de un servicio a lo largo del tiempo.
- `id`: Identificador único (INTEGER, PK).
- `servicioId`: FK del Servicio.
- `precio`: Precio configurado (DECIMAL 10,2).
- `fechaDesde`: Fecha y hora en la que entró en vigencia el precio.
- `fechaHasta`: Fecha y hora en la que dejó de estar vigente el precio (`null` indica el precio actual activo).
- `motivo`: Motivo del cambio ("Precio Inicial", "Edición de precio", "Ajuste Masivo de Precios").
- `negocioId`: Inquilino/Negocio al que pertenece.

---

## 2. Endpoints

### A. Listar Servicios
- **Ruta:** `GET /api/productos` o `GET /api/servicios`
- **Autenticación:** Requerida (Bearer Token JWT)
- **Query Params:** `page`, `limit`, `search`, `categoriaId`, `disponible`, `sortBy`, `sortOrder`.
- **Respuesta (200 OK):**
```json
{
  "status": "success",
  "data": {
    "items": [ ...servicios... ],
    "meta": {
      "totalItems": 12,
      "totalPages": 2,
      "currentPage": 1,
      "itemsPerPage": 10
    }
  }
}
```

---

### B. Estadísticas Rápidas
- **Ruta:** `GET /api/productos/stats`
- **Respuesta (200 OK):**
```json
{
  "status": "success",
  "data": {
    "total": 15,
    "activos": 12,
    "categorias": 4,
    "masSolicitado": "Lavado por Kilo"
  }
}
```

---

### C. Cambiar Disponibilidad Individual
- **Ruta:** `PATCH /api/productos/:id/disponibilidad`
- **Body:** `{ "disponible": true }`
- **Respuesta (200 OK):** Servicio actualizado.

---

### D. Ajuste Masivo de Precios
- **Ruta:** `PUT /api/productos/bulk/precios`
- **Body:**
```json
{
  "updates": [
    { "id": 1, "precioActual": 1800.00 },
    { "id": 2, "precioActual": 2500.00 }
  ]
}
```
- **Lógica:** Cierra el registro previo en `HistorialPrecioServicio` (`fechaHasta = NOW`) para cada servicio y genera una nueva entrada activa (`fechaHasta = null`, `motivo: "Ajuste Masivo de Precios"`).

---

### E. Ajuste Masivo de Disponibilidad
- **Ruta:** `PATCH /api/productos/bulk/disponibilidad` o `PUT /api/productos/bulk/disponibilidad`
- **Body:** `{ "ids": [1, 2, 3], "disponible": false }`
- **Respuesta (200 OK):** Cantidad de registros modificados.

---

### F. Historial de Precios de un Servicio
- **Ruta:** `GET /api/productos/:id/historial`
- **Respuesta (200 OK):**
```json
{
  "status": "success",
  "data": [
    {
      "id": 1,
      "precio": 1500.00,
      "fechaCambio": "2026-08-01T10:00:00.000Z",
      "fechaHasta": "2026-08-14T19:00:00.000Z",
      "motivo": "Precio Inicial"
    },
    {
      "id": 2,
      "precio": 1800.00,
      "fechaCambio": "2026-08-14T19:00:00.000Z",
      "fechaHasta": null,
      "motivo": "Ajuste Masivo de Precios"
    }
  ]
}
```
