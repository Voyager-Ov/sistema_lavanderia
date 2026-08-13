import { Sequelize, DataTypes } from "sequelize";

import NegocioModel from "./Negocio.js";
import UsuarioModel from "./Usuario.js";
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

        this.centralModels = this._initModels(this.centralDb);
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
                
                if (forceSync) {
                    await this.centralDb.query(`CREATE SCHEMA IF NOT EXISTS ${schemaName};`);
                }

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

            // Insertar un Negocio dummy para satisfacer las Foreign Keys locales si no existe
            try {
                await tenantModels.Negocio.findOrCreate({
                    where: { id: negocioId },
                    defaults: { id: negocioId, nombre: "Tenant Virtual", estadoSuscripcion: "ACTIVA" }
                });
            } catch (e) {
                // Si el negocio ya existe o en concurrencia
            }
            
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
