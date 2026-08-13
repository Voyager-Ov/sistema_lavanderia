# Especificación del Módulo de Configuración SaaS y Parámetros del Negocio (Configuración)

Este documento detalla la lógica operativa, contratos de API, flujos de datos, modelos de base de datos y diseño técnico del **Módulo de Configuración SaaS (`configuracion`)** para la plataforma de lavandería Multi-Tenant.

---

## 1. Alcance y Objetivos del Módulo

El módulo de Configuración gobierna la parametrización operativa, comercial y visual del tenant (lavandería): personalización de marca blanca (`logoUrl`, colores corporativos `colorPrincipal` y `colorSecundario`), datos fiscales para emisión de tickets, horarios de atención, política de vencimientos de retiración y modalidades de cobro configurables.

### Casos de Uso del Módulo:
*   **CU-37: Consultar Configuración del Negocio** (AP: Empleado Operativo, Administrador). Carga de marca y parámetros operativos.
*   **CU-38: Actualizar Marca y Parámetros del Negocio** (AP: Administrador de Negocio). Edición de estética visual y datos de contacto.
*   **CU-39: Configurar Métodos de Pago Habilitados** (AP: Administrador de Negocio). Alta/Baja de canales de cobro (Efectivo, MercadoPago, Transferencia).

---

## 2. Modelos de Base de Datos Vinculados

El módulo interactúa con la entidad `Negocio` en el esquema central (`public`) y los parámetros del tenant.

### A. Modelo `Negocio` (Esquema Central `public`)
*   `id` (DataTypes.INTEGER, **PK**, autoIncrement): Identificador único del tenant SaaS.
*   `razonSocial` (DataTypes.STRING, allowNull: false): Nombre comercial o razón social.
*   `cuit` (DataTypes.STRING, allowNull: false, unique: true): CUIT fiscal (11 dígitos).
*   `direccion` (DataTypes.STRING, allowNull: true): Dirección fiscal/comercial.
*   `telefono` (DataTypes.STRING, allowNull: true): Teléfono oficial de la lavandería.
*   `logoUrl` (DataTypes.STRING, allowNull: true): URL o path del logotipo.
*   `colorPrincipal` (DataTypes.STRING, defaultValue: "#3b82f6"): Color primario hexadecimal para marca blanca en frontend.
*   `colorSecundario` (DataTypes.STRING, defaultValue: "#1e40af"): Color secundario de acento.
*   `facturacionHabilitada` (DataTypes.BOOLEAN, defaultValue: false): Habilitación de emisión fiscal AFIP/Facturas.
*   `activo` (DataTypes.BOOLEAN, defaultValue: true): Estado de la suscripción del tenant.

---

## 3. Contratos de API (JSON Payloads)

### 1. Consultar Configuración Visual y Parámetros
*   **Endpoint:** `GET /api/v1/configuracion`
*   **Headers:** `Authorization: Bearer <token_jwt>`
*   **Responses:**
    *   `200 OK` ➔ Retorna configuración de marca y negocio.
        ```json
        {
          "status": "success",
          "message": null,
          "data": {
            "id": 1,
            "razonSocial": "Lavandería Burbujas Express",
            "cuit": "20304567892",
            "logoUrl": "https://cdn.saas.com/logos/tenant-1.png",
            "colorPrincipal": "#2563eb",
            "colorSecundario": "#1d4ed8",
            "facturacionHabilitada": true
          }
        }
        ```

---

### 2. Actualizar Parámetros de Marca y Negocio
*   **Endpoint:** `PUT /api/v1/configuracion`
*   **Headers:** `Authorization: Bearer <token_jwt>`
*   **Roles Permitidos:** `admin` *(Exclusivo)*
*   **Request Body:**
    ```json
    {
      "razonSocial": "Lavandería Burbujas Express",
      "telefono": "+543519998877",
      "direccion": "Av. Colón 456, Córdoba",
      "colorPrincipal": "#16a34a",
      "colorSecundario": "#15803d"
    }
    ```
*   **Responses:**
    *   `200 OK` ➔ Parámetros actualizados y reflejados dinámicamente en el portal.
    *   `403 Forbidden` ➔ Acción no permitida para el rol `empleado`.

---

## 4. Algoritmos de Negocio y Lógica en los Servicios

### Inyección Dinámica de Marca Blanca (Multi-Tenant Theme Engine)

```javascript
export const obtenerConfiguracionTenant = async (negocioId) => {
    const negocio = await centralModels.Negocio.findByPk(negocioId, {
        attributes: [
            "id", "razonSocial", "cuit", "direccion", "telefono", 
            "logoUrl", "colorPrincipal", "colorSecundario", "facturacionHabilitada"
        ]
    });

    if (!negocio) throw new AppError("Configuración de negocio no encontrada", 404);

    return negocio;
};
```

---

## 5. Middlewares y Filtros de Seguridad Involucrados

### `verificarRol(["admin"])`
*   Protección exclusiva de la edición de parámetros organizacionales y fiscales.
