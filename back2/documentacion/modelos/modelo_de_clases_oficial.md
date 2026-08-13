# Modelo de Clases Oficial (SaaS Multi-Negocio)

Este documento especifica la estructura y relaciones del **Modelo de Clases Oficial (UML 2.0)** establecido para el sistema de lavandería SaaS.

---

## 1. Diagrama de Clases UML 2.0 (Vista Estructural)

```mermaid
classDiagram
    class Negocio {
        +Integer id (PK)
        +String razonSocial
        +String cuit
        +String direccion
        +String telefonoContacto
        +String colorPrincipal
        +String colorSecundario
        +String logoUrl
        +String simboloMoneda
        +String zonaHoraria
        +String mensajeTicket
        +Boolean imprimirTicketAutomatico
        +Boolean mostrarQrTicket
        +Boolean facturacionHabilitada
        +Boolean afipActivo
        +String afipModoFacturacion
        +Integer afipPuntoVenta
        +String certificadoAfipPath
        +String llaveAfipPath
        +Boolean whatsappActivo
        +String whatsappEstadoConexion
        +String whatsappMensajeListo
        +String whatsappMensajeManual
        +String tokenMercadoPago
        +String mercadopagoPublicKey
        +String mpModoCobro
        +String aliasMp
    }

    class Empleado {
        +Integer legajo
        +String nombre
        +String apellido
        +String telefono
        +Date fechaAlta
    }

    class Usuario {
        +String email (PK)
        +String password
        +String googleId
        +String tokenConfirmacion
        +Boolean emailConfirmado
        +Boolean activo
    }

    class Rol {
        +String nombre
        +String descripcion
    }

    class Sesion {
        +DateTime fechaHoraInicio
        +DateTime fechaHoraFin
    }

    class CategoriaServicio {
        +String nombre
        +String descripcion
    }

    class Servicio {
        +String nombre
        +String descripcion
        +String imagenUrl
        +Double costo
        +Double precio
        +Boolean disponible
    }

    class Pedido {
        +Integer numeroPedido
        +DateTime fechaHoraCreacion
        +DateTime fechaHoraEntregaEstimada
        +String observaciones
        +String origen
        +String nombreClienteFactura
        +String cuitClienteFactura
        +String direccionEntrega
        +Double costoEnvio
        +Boolean ticketImpreso
        +calcularTotal() Double
        +cancelar(motivo: String)
        +iniciarLavado()
        +marcarListo()
        +entregar()
    }

    class DetallePedido {
        +Integer cantidad
        +Double precioHistorico
        +calcularSubtotal() Double
    }

    class CambioEstadoPedido {
        +DateTime fechaHoraInicio
        +DateTime fechaHoraFin
        +calcularDuracion() Double
    }

    class Estado {
        +String nombre
        +String descripcion
        +String ambito
    }

    class Cliente {
        +String nombre
        +String apellido
        +String telefono
        +String email
        +String direccion
        +Date fechaAlta
    }

    class CuentaCorriente {
        +Date fechaCreacion
        +calcularSaldo() Double
    }

    class MovimientoCuenta {
        +DateTime fechaHora
        +Double monto
        +String tipoMovimiento
        +String descripcion
    }

    class Caja {
        +Integer idCaja (PK)
        +DateTime fechaHoraApertura
        +DateTime fechaHoraCierre
        +Double montoInicialEfectivo
        +Double montoFinalEfectivoReal
        +String observacionApertura
        +String observacionCierre
        +String estadoCaja
    }

    class MovimientoCaja {
        +DateTime fechaHora
        +Double monto
        +String tipoMovimiento
        +String observacion
    }

    class MetodoPago {
        +String nombre
        +Boolean requiereIntegracion
    }

    class Cobro {
        +DateTime fechaHora
        +Double montoAbonado
        +Double montoRecibidoEfectivo
        +Double vueltoEntregado
    }

    class Gasto {
        +DateTime fechaHora
        +String descripcion
        +Double montoTotal
        +String proveedor
        +String nroComprobante
        +Double desgloseNeto
        +Double impuestos
        +Double percepciones
        +String estadoGasto
    }

    class CategoriaGasto {
        +String nombre
        +String descripcion
    }

    class Factura {
        +String numeroFactura
        +DateTime fechaHoraEmision
        +String tipoFactura
        +String cae
        +Date fechaVencimientoCae
        +Double ivaDiscriminadoTotal
        +Double baseImponibleTotal
    }

    %% Relaciones del Módulo 1 (SaaS)
    Negocio "1" --> "0..*" Cliente : clientes
    Negocio "1" --> "0..*" Empleado : empleados
    Negocio "1" --> "0..*" Servicio : servicios
    Negocio "1" --> "0..*" Caja : cajas
    Negocio "1" --> "0..*" Pedido : pedidos
    Negocio "1" --> "0..*" Gasto : gastos

    %% Relaciones del Módulo 2 (Seguridad/RRHH)
    Usuario "0..1" --> "1" Empleado : personaFisica
    Usuario "*" --> "1..*" Rol : roles
    Sesion "*" --> "1" Usuario : credencial

    %% Relaciones del Módulo 3 (Catálogo)
    Servicio "*" --> "1" CategoriaServicio : categoria

    %% Relaciones del Módulo 4 (Pedidos)
    Pedido "*" --> "1" Cliente : cliente
    Pedido "1" *-- "1..*" DetallePedido : detalles
    Pedido "1" --> "1..*" CambioEstadoPedido : historialEstados
    DetallePedido "*" --> "1" Servicio : servicio
    CambioEstadoPedido "*" --> "1" Estado : definicionEstado

    %% Relaciones del Módulo 5 (Cuenta Corriente)
    Cliente "1" *-- "1" CuentaCorriente : cc
    CuentaCorriente "1" *-- "0..*" MovimientoCuenta : movimientos

    %% Relaciones del Módulo 6 (Finanzas & AFIP)
    Caja "0..*" --> "1" Empleado : cajero
    Caja "1" *-- "0..*" MovimientoCaja : movimientos
    Cobro "*" --> "1" Pedido : pedido
    Cobro "*" --> "1" MetodoPago : metodoPago
    Cobro "1" --> "1" MovimientoCaja : ingresoCaja
    Gasto "*" --> "1" CategoriaGasto : categoria
    Gasto "*" --> "1" MetodoPago : metodoPago
    Gasto "1" --> "1" MovimientoCaja : egresoCaja
    Factura "0..1" --> "1" Pedido : pedido
