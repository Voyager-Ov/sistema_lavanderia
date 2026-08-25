import { Sequelize, DataTypes } from "sequelize";

import NegocioModel from "./Negocio.js";
import UsuarioModel from "./Usuario.js";
import SolicitudNegocioModel from "./SolicitudNegocio.js";
import ClienteModel from "./Cliente.js";
import PedidoModel from "./Pedido.js";
import MetodoPagoModel from "./MetodoPago.js";
import GastoModel from "./Gasto.js";
import CajaModel from "./Caja.js";
import CategoriaGastoModel from "./CategoriaGasto.js";
import EmpleadoModel from "./Empleado.js";
import RolModel from "./Rol.js";
import SesionModel from "./Sesion.js";
import CategoriaServicioModel from "./CategoriaServicio.js";
import ServicioModel from "./Servicio.js";
import DetallePedidoModel from "./DetallePedido.js";
import CambioEstadoPedidoModel from "./CambioEstadoPedido.js";
import EstadoModel from "./Estado.js";
import CuentaCorrienteModel from "./CuentaCorriente.js";
import MovimientoCuentaModel from "./MovimientoCuenta.js";
import MovimientoCajaModel from "./MovimientoCaja.js";
import CobroModel from "./Cobro.js";
import FacturaModel from "./Factura.js";
import MotivoCancelacionModel from "./MotivoCancelacion.js";
import HistorialPrecioServicioModel from "./HistorialPrecioServicio.js";
import MensajeSistemaModel from "./MensajeSistema.js";
import AlertaSeguridadModel from "./AlertaSeguridad.js";

class ConnectionManager {
    constructor() {
        this.centralDb = null;
        this.centralModels = {};
        this.tenantDbs = new Map();
        this.tenantDbPromises = new Map();
    }

    // Inicializa la conexión a la base de datos central
    async initCentral() {
        const isTest = process.env.NODE_ENV === "test";
        
        if (isTest) {
            this.centralDb = new Sequelize({
                dialect: "sqlite",
                storage: ":memory:",
                logging: false,
            });
        } else {
            const dbUrl = process.env.DATABASE_URL;
            if (!dbUrl) throw new Error("DATABASE_URL no está definida en .env");
            this.centralDb = new Sequelize(dbUrl, {
                dialect: "postgres",
                logging: false,
                dialectOptions: {
                    ssl: { require: true, rejectUnauthorized: false } // Para Neon
                }
            });
        }

        // Solo cargar modelos centrales en la conexión central
        const getModel = (modelFunc) => {
            const m = modelFunc(this.centralDb, DataTypes);
            return isTest ? m : m.schema('public');
        };

        this.centralModels = {
            Usuario: getModel(UsuarioModel),
            Negocio: getModel(NegocioModel),
            Rol: getModel(RolModel),
            SolicitudNegocio: getModel(SolicitudNegocioModel),
            MensajeSistema: getModel(MensajeSistemaModel),
            AlertaSeguridad: getModel(AlertaSeguridadModel)
        };
        
        // Asociar modelos centrales
        Object.values(this.centralModels).forEach((model) => {
            if (typeof model.associate === "function") {
                model.associate(this.centralModels);
            }
        });

        await this.centralDb.query(`
            ALTER TABLE IF EXISTS public.negocios ADD COLUMN IF NOT EXISTS activo boolean DEFAULT true;
            ALTER TABLE IF EXISTS public.negocios ADD COLUMN IF NOT EXISTS "estadoSuscripcion" varchar(50) DEFAULT 'ACTIVA';
            ALTER TABLE IF EXISTS public.negocios ADD COLUMN IF NOT EXISTS "maxImagenes" integer DEFAULT 50;
            ALTER TABLE IF EXISTS public.negocios ADD COLUMN IF NOT EXISTS "maxStorageGB" double precision DEFAULT 1.0;
            ALTER TABLE IF EXISTS public.usuarios ADD COLUMN IF NOT EXISTS "negocioId" integer;
        `).catch(() => {});
        await this.centralDb.sync();
        console.log("🟢 Base de Datos Central conectada y sincronizada.");
    }

    // Obtiene o crea la conexión para un Tenant (Negocio) específico de forma concurrente y segura
    async getTenantDb(negocioId, forceSync = false) {
        if (!negocioId) throw new Error("negocioId es requerido para obtener la BD del tenant");

        if (this.tenantDbs.has(negocioId)) {
            return this.tenantDbs.get(negocioId);
        }

        if (this.tenantDbPromises.has(negocioId)) {
            return await this.tenantDbPromises.get(negocioId);
        }

        const initPromise = (async () => {
            const isTest = process.env.NODE_ENV === "test";
            let tenantDb;

            if (isTest) {
                tenantDb = new Sequelize({
                    dialect: "sqlite",
                    storage: ":memory:",
                    logging: false,
                    dialectOptions: { pragmas: { foreign_keys: 0 } }
                });
            } else {
                const dbUrl = process.env.DATABASE_URL;
                const schemaName = `tenant_${negocioId}`;
                
                await this.centralDb.query(`CREATE SCHEMA IF NOT EXISTS "${schemaName}";`).catch((err) => {
                    console.warn(`⚠️ [ConnectionManager] No se pudo auto-crear esquema ${schemaName}:`, err.message);
                });

                tenantDb = new Sequelize(dbUrl, {
                    dialect: "postgres",
                    logging: false,
                    schema: schemaName,
                    searchPath: schemaName,
                    dialectOptions: {
                        ssl: { require: true, rejectUnauthorized: false }
                    }
                });
            }

            const schemaNameArg = !isTest ? `tenant_${negocioId}` : null;
            const tenantModels = this._initModels(tenantDb, schemaNameArg);

            // Sincronizar esquemas de tenant
            if (isTest || forceSync) {
                await tenantDb.sync(isTest ? {} : { alter: true });
                if (isTest) {
                    await tenantDb.query("PRAGMA foreign_keys = OFF;");
                }
            } else {
                await tenantDb.sync();
            }

            // ─── AUTO-MIGRACIÓN DE COLUMNAS NUEVAS EN TENANTS EXISTENTES ───
            if (!isTest && schemaNameArg) {
                try {
                    await tenantDb.query(`ALTER TABLE "${schemaNameArg}"."pedidos" ADD COLUMN IF NOT EXISTS "fechaHoraPedido" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;`);
                    await tenantDb.query(`ALTER TABLE "${schemaNameArg}"."clientes" ADD COLUMN IF NOT EXISTS "activo" BOOLEAN DEFAULT true;`);
                    await tenantDb.query(`ALTER TABLE "${schemaNameArg}"."movimientos_caja" ADD COLUMN IF NOT EXISTS "metodoPagoId" INTEGER;`);
                } catch (colErr) {
                    console.warn(`[Auto-Migration] Error asegurando columnas en ${schemaNameArg}:`, colErr.message);
                }
            }

            // Insertar un Negocio dummy para satisfacer las Foreign Keys locales si no existe
            try {
                await tenantModels.Negocio.findOrCreate({
                    where: { id: negocioId },
                    defaults: { id: negocioId, nombre: "Tenant Virtual", estadoSuscripcion: "ACTIVA" }
                });
            } catch (e) {
                // Si el negocio ya existe o en concurrencia
            }

            // ─── SIEMBRA DE MÉTODO DE PAGO FIJO (EFECTIVO) ───
            try {
                await tenantModels.MetodoPago.findOrCreate({
                    where: { esFijo: true },
                    defaults: {
                        nombre: "Efectivo",
                        icono: "Banknote",
                        activo: true,
                        esFijo: true,
                        requiereIntegracion: false,
                        negocioId
                    }
                });
            } catch (e) {}

            // ─── SIEMBRA DE ESTADOS DEL SISTEMA ───
            try {
                const estadosBase = [
                    { nombre: "PENDIENTE", descripcion: "Pedido recepcionado, a la espera de procesar", ambito: "Pedido" },
                    { nombre: "EN_PROCESO", descripcion: "Pedido en proceso de lavado, secado o planchado", ambito: "Pedido" },
                    { nombre: "LISTO_PARA_RETIRAR", descripcion: "Pedido finalizado, listo para entregar o retirar", ambito: "Pedido" },
                    { nombre: "ENTREGADO", descripcion: "Pedido entregado al cliente", ambito: "Pedido" },
                    { nombre: "CANCELADO", descripcion: "Pedido cancelado", ambito: "Pedido" }
                ];
                for (const est of estadosBase) {
                    await tenantModels.Estado.findOrCreate({
                        where: { nombre: est.nombre },
                        defaults: est
                    });
                }
            } catch (e) {}

            // ─── SIEMBRA DE MOTIVOS DE CANCELACIÓN INICIALES ───
            try {
                const motivosBase = [
                    { motivo: "Cliente solicitó cancelación", descripcion: "El cliente solicitó cancelar el pedido", esFijo: true },
                    { motivo: "Falta de insumos / imposibilidad técnica", descripcion: "Incapacidad técnica o falta de insumos", esFijo: true },
                    { motivo: "Duplicado / Error de carga", descripcion: "Pedido ingresado por error o duplicado", esFijo: true },
                    { motivo: "Exceso de demora", descripcion: "Superó el tiempo límite estimado", esFijo: false },
                    { motivo: "Sin retiro tras vencimiento", descripcion: "No retiró el pedido finalizado", esFijo: false }
                ];
                for (const mot of motivosBase) {
                    await tenantModels.MotivoCancelacion.findOrCreate({
                        where: { motivo: mot.motivo },
                        defaults: mot
                    });
                }
            } catch (e) {}

            console.log(`🔵 Base de Datos Tenant conectada y sincronizada (Negocio ID: ${negocioId}).`);

            const tenantContext = { sequelize: tenantDb, models: tenantModels };
            this.tenantDbs.set(negocioId, tenantContext);
            return tenantContext;
        })();

        this.tenantDbPromises.set(negocioId, initPromise);

        try {
            return await initPromise;
        } finally {
            this.tenantDbPromises.delete(negocioId);
        }
    }

    // Función auxiliar para inicializar modelos y asociaciones
    _initModels(sequelizeInstance, schemaName = null) {
        let models = {
            Negocio: NegocioModel(sequelizeInstance, DataTypes),
            Usuario: UsuarioModel(sequelizeInstance, DataTypes),
            Cliente: ClienteModel(sequelizeInstance, DataTypes),
            Pedido: PedidoModel(sequelizeInstance, DataTypes),
            MetodoPago: MetodoPagoModel(sequelizeInstance, DataTypes),
            Gasto: GastoModel(sequelizeInstance, DataTypes),
            Caja: CajaModel(sequelizeInstance, DataTypes),
            CategoriaGasto: CategoriaGastoModel(sequelizeInstance, DataTypes),
            Empleado: EmpleadoModel(sequelizeInstance, DataTypes),
            Rol: RolModel(sequelizeInstance, DataTypes),
            Sesion: SesionModel(sequelizeInstance, DataTypes),
            CategoriaServicio: CategoriaServicioModel(sequelizeInstance, DataTypes),
            Servicio: ServicioModel(sequelizeInstance, DataTypes),
            DetallePedido: DetallePedidoModel(sequelizeInstance, DataTypes),
            CambioEstadoPedido: CambioEstadoPedidoModel(sequelizeInstance, DataTypes),
            Estado: EstadoModel(sequelizeInstance, DataTypes),
            CuentaCorriente: CuentaCorrienteModel(sequelizeInstance, DataTypes),
            MovimientoCuenta: MovimientoCuentaModel(sequelizeInstance, DataTypes),
            MovimientoCaja: MovimientoCajaModel(sequelizeInstance, DataTypes),
            Cobro: CobroModel(sequelizeInstance, DataTypes),
            Factura: FacturaModel(sequelizeInstance, DataTypes),
            MotivoCancelacion: MotivoCancelacionModel(sequelizeInstance, DataTypes),
            HistorialPrecioServicio: HistorialPrecioServicioModel(sequelizeInstance, DataTypes),
        };

        // En Postgres, debemos indicar a cada modelo a qué esquema pertenece ANTES de asociar
        if (schemaName) {
            Object.keys(models).forEach(modelName => {
                const model = models[modelName];
                // Estos modelos siempre viven en el esquema central (public)
                if (['Usuario', 'Negocio', 'Rol'].includes(model.name)) {
                    models[modelName] = model.schema('public');
                } else {
                    models[modelName] = model.schema(schemaName);
                }
            });
        }

        Object.values(models).forEach((model) => {
            if (typeof model.associate === "function") {
                model.associate(models);
            }
        });

        return models;
    }
}

export const connectionManager = new ConnectionManager();
