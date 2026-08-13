# Requerimientos Funcionales (Especificación de Funcionalidades)

Este documento detalla todas las funcionalidades operativas del sistema de lavandería SaaS multi-negocio, organizadas por módulo de negocio.

---

## MÓDULO 1: SaaS y Onboarding de Negocio

El sistema permite el registro de nuevos negocios (lavanderías) bajo un modelo multi-inquilino (multi-tenant) con base de datos aislada por esquemas y personalización de marca.

*   **RF-1.1: Registro de Cuenta de Negocio (Onboarding):**
    *   Permite a un nuevo dueño de lavandería registrar su local (Razón Social y CUIT) y su usuario administrador inicial (Nombre, Apellido, Email y Password).
    *   Desencadena de forma automatizada la creación física del esquema (`tenant_{id}`) en PostgreSQL Neon, ejecuta la estructura de tablas y siembra los roles y estados base.
*   **RF-1.2: Configuración de Branding Visual:**
    *   Permite al Administrador definir y modificar la identidad del negocio: Razón Social, CUIT, Color Principal y Color Secundario.
    *   Aplica dinámicamente estos colores y el logo en las pantallas del portal del negocio correspondiente.
*   **RF-1.3: Configuración de Facturación AFIP:**
    *   Permite subir el certificado digital (.crt) y la llave privada (.key) de homologación de la AFIP.
    *   Permite activar/desactivar la emisión de facturas electrónicas legales.
*   **RF-1.4: Configuración de Integración Mercado Pago:**
    *   Permite ingresar el Access Token de Mercado Pago Developers.
    *   Valida síncronamente contra las APIs de Mercado Pago la conexión antes de persistir las credenciales.

---

## MÓDULO 2: Seguridad, Accesos y RRHH

Gobierna las credenciales de acceso, la verificación de identidad, auditorías de sesión activa y la gestión operativa del personal de la lavandería.

*   **RF-2.1: Autenticación de Usuario Local:**
    *   Permite a usuarios locales (Administradores y Empleados) iniciar sesión ingresando su Email y Contraseña.
    *   Exige verificación humana invisible reCAPTCHA del lado del cliente.
*   **RF-2.2: Autenticación Social (Google OAuth):**
    *   Permite iniciar sesión utilizando cuentas de Google (vinculación implícita por email o directa por googleId).
*   **RF-2.3: Confirmación de Cuenta de Correo:**
    *   Exige que las cuentas locales registren un código numérico de 6 dígitos enviado por email antes de habilitar su inicio de sesión local.
*   **RF-2.4: Recuperación y Restablecimiento de Contraseña:**
    *   Envía de forma segura un token temporal de restablecimiento por correo SMTP en caso de olvido.
    *   Permite ingresar una nueva contraseña validando dicho token.
*   **RF-2.5: Gestión de Perfil de Usuario:**
    *   Permite al usuario activo cambiar su contraseña o vincular/desvincular su cuenta de Google de su perfil de acceso.
*   **RF-2.6: Gestión de Empleados:**
    *   Permite al Administrador dar de alta, modificar y dar de baja lógica (soft delete) a empleados (legajo, nombre, apellido, teléfono, fecha de alta).
*   **RF-2.7: Control de Asistencia (RRHH Fichajes):**
    *   Permite a los empleados registrar su fichaje de entrada y salida laboral.
*   **RF-2.8: Reportes de Asistencia:**
    *   Permite al Administrador consultar el registro de asistencia del personal agrupado cronológicamente y calcular las horas operativas trabajadas por empleado.

---

## MÓDULO 3: Catálogo de Servicios

Resuelve la parametrización de las prestaciones que el local ofrece a sus clientes.

*   **RF-3.1: Gestión de Categorías de Servicio:**
    *   Permite crear, modificar, listar y eliminar categorías de servicios (ej: "Lavado Seco", "Planchado", "Tintorería").
*   **RF-3.2: Gestión de Servicios:**
    *   Permite administrar los servicios específicos: Nombre, Descripción, Imagen ilustrativa, Costo (interno), Precio (al público) y Disponibilidad (activo/inactivo).
    *   Vincula obligatoriamente cada servicio con una categoría.

---

## MÓDULO 4: Pedidos y Trazabilidad

Gestiona la recepción, producción, entrega y seguimiento de los pedidos de lavandería.

*   **RF-4.1: Registro de Pedido:**
    *   Permite dar de alta pedidos especificando: Cliente asociado, origen (mostrador/delivery), detalle de servicios (cantidades y precios históricos), costo de envío, dirección de entrega y observaciones.
*   **RF-4.2: Cálculo Automático del Total:**
    *   Calcula de forma automática la sumatoria de los subtotales del pedido (cantidad * precio de servicio) más el costo de envío.
*   **RF-4.3: Historial de Estados (Trazabilidad):**
    *   Registra cronológicamente cada cambio de estado de un pedido (CREADO ➔ EN_PROCESO ➔ LISTO ➔ ENTREGADO / CANCELADO) almacenando fecha, hora de inicio y fin para medir la duración de cada fase.
*   **RF-4.4: Consulta Pública de Tracking:**
    *   Permite a un cliente externo (sin necesidad de loguearse) consultar en tiempo real el estado actual de su ropa ingresando el número de pedido en un portal de tracking público.
*   **RF-4.5: Emisión de Ticket de Pedido:**
    *   Permite generar y registrar la impresión del ticket físico/digital con el detalle de recepción para control interno y del cliente.

---

## MÓDULO 5: Cuenta Corriente (Libro Mayor de Clientes)

Permite otorgar saldos a favor o facilidades de pago diferidas a clientes regulares.

*   **RF-5.1: Creación Automática de Cuenta Corriente:**
    *   Al registrar un nuevo cliente, se crea de forma obligatoria su Cuenta Corriente vacía en el sistema.
*   **RF-5.2: Libro Mayor de Cuenta Corriente (Movimientos):**
    *   Registra cronológicamente los movimientos financieros del cliente:
        *   **Débito:** Incrementa la deuda del cliente (ej. al entregar un pedido que se pagará luego).
        *   **Crédito:** Incrementa el saldo a favor o reduce la deuda (ej. al recibir un cobro o al registrar un vuelto a favor del cliente).
*   **RF-5.3: Ajuste Manual de Crédito:**
    *   Permite al Administrador ingresar créditos manuales para bonificar o compensar saldo a favor de un cliente.
*   **RF-5.4: Liquidación Masiva de Deudas (Cobro Masivo):**
    *   Permite liquidar el saldo total adeudado de un cliente cobrando múltiples pedidos impagos en una sola transacción.

---

## MÓDULO 6: Finanzas, Caja y AFIP

Administra el dinero físico del local, los métodos de pago habilitados y la emisión de facturas legales.

*   **RF-6.1: Gestión de Turnos de Caja (Arqueos):**
    *   Permite abrir una caja (monto inicial, observaciones) y cerrarla (monto real verificado en mano, observaciones, estado de caja).
*   **RF-6.2: Movimientos de Caja:**
    *   Registra de forma automática los ingresos por cobros de pedidos y egresos por gastos pagados en efectivo.
    *   Permite registrar ajustes de caja manuales (retiros de efectivo o ingresos manuales).
*   **RF-6.3: Gestión de Cobros:**
    *   Registra el abono de pedidos procesando el monto cobrado, método de pago (efectivo, tarjeta, transferencia, saldo a favor) y calcula automáticamente el vuelto entregado.
*   **RF-6.4: Registro de Gastos y Comprobantes:**
    *   Permite registrar egresos operativos del local especificando: Fecha, monto total, proveedor, nro de comprobante, desglose neto, impuestos (IVA), percepciones y método de pago.
*   **RF-6.5: Categorización de Gastos:**
    *   Administra las categorías de gastos (ej: "Servicios Públicos", "Insumos Químicos", "Mantenimiento").
*   **RF-6.6: Facturación AFIP Automatizada:**
    *   Si la facturación está activa, al cobrarse un pedido, el backend solicita de forma transparente un CAE (Código de Autorización Electrónico) y su vencimiento al WS de AFIP, discriminando montos e IVA y generando la Factura digital legal correspondiente (tipo A, B o C).
