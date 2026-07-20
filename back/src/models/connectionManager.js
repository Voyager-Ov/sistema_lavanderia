import { Sequelize, DataTypes } from "sequelize";

import NegocioModel from "./Negocio.js";
import UsuarioModel from "./Usuario.js";
import ClienteModel from "./Cliente.js";
import ProductoModel from "./Producto.js";
import PedidoModel from "./Pedido.js";
import PedidoItemModel from "./PedidoItem.js";
import HistorialPedidoModel from "./HistorialPedido.js";
import PagoModel from "./Pago.js";
import MetodoPagoModel from "./MetodoPago.js";
import CategoriaProductoModel from "./CategoriaProducto.js";
import GastoModel from "./Gasto.js";
import RegistroAsistenciaModel from "./RegistroAsistencia.js";
import CajaModel from "./Caja.js";
import MicroFrontendModel from "./MicroFrontend.js";
import ConfiguracionNegocioModel from "./ConfiguracionNegocio.js";
import TicketModel from "./Ticket.js";
import MovimientoCuentaCorrienteModel from "./MovimientoCuentaCorriente.js";
import HistorialPrecioProductoModel from "./HistorialPrecioProducto.js";
import CategoriaGastoModel from "./CategoriaGasto.js";

class ConnectionManager {
    constructor() {
        this.centralDb = null;
        this.centralModels = {};
        this.tenantDbs = new Map();
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

    // Obtiene o crea la conexión para un Tenant (Negocio) específico
    async getTenantDb(negocioId, forceSync = false) {
        if (!negocioId) throw new Error("negocioId es requerido para obtener la BD del tenant");

        if (this.tenantDbs.has(negocioId)) {
            return this.tenantDbs.get(negocioId);
        }

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
            
            // Si estamos forzando la creacion del schema (ej. en el registro de la app), lo creamos.
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

        // Solo sincronizamos las tablas y creamos dummy data en Tests o cuando registramos al usuario
        if (isTest || forceSync) {
            await tenantDb.sync();
            
            if (isTest) {
                await tenantDb.query("PRAGMA foreign_keys = OFF;");
            }

            // Insertar un Negocio dummy para satisfacer las Foreign Keys locales
            await tenantModels.Negocio.findOrCreate({
                where: { id: negocioId },
                defaults: { id: negocioId, nombre: "Tenant Virtual", estadoSuscripcion: "ACTIVA" }
            });
            
            console.log(`🔵 Base de Datos Tenant conectada y sincronizada (Negocio ID: ${negocioId}).`);
        }

        const tenantContext = { sequelize: tenantDb, models: tenantModels };
        this.tenantDbs.set(negocioId, tenantContext);
        
        return tenantContext;
    }

    // Función auxiliar para inicializar modelos y asociaciones
    _initModels(sequelizeInstance, schemaName = null) {
        let models = {
            Negocio: NegocioModel(sequelizeInstance, DataTypes),
            Usuario: UsuarioModel(sequelizeInstance, DataTypes),
            Cliente: ClienteModel(sequelizeInstance, DataTypes),
            Producto: ProductoModel(sequelizeInstance, DataTypes),
            Pedido: PedidoModel(sequelizeInstance, DataTypes),
            PedidoItem: PedidoItemModel(sequelizeInstance, DataTypes),
            HistorialPedido: HistorialPedidoModel(sequelizeInstance, DataTypes),
            Pago: PagoModel(sequelizeInstance, DataTypes),
            MetodoPago: MetodoPagoModel(sequelizeInstance, DataTypes),
            CategoriaProducto: CategoriaProductoModel(sequelizeInstance, DataTypes),
            Gasto: GastoModel(sequelizeInstance, DataTypes),
            RegistroAsistencia: RegistroAsistenciaModel(sequelizeInstance, DataTypes),
            Caja: CajaModel(sequelizeInstance, DataTypes),
            MicroFrontend: MicroFrontendModel(sequelizeInstance, DataTypes),
            ConfiguracionNegocio: ConfiguracionNegocioModel(sequelizeInstance, DataTypes),
            Ticket: TicketModel(sequelizeInstance, DataTypes),
            MovimientoCuentaCorriente: MovimientoCuentaCorrienteModel(sequelizeInstance, DataTypes),
            HistorialPrecioProducto: HistorialPrecioProductoModel(sequelizeInstance, DataTypes),
            CategoriaGasto: CategoriaGastoModel(sequelizeInstance, DataTypes),
        };

        // En Postgres, debemos indicar a cada modelo a qué esquema pertenece ANTES de asociar
        if (schemaName) {
            Object.keys(models).forEach(modelName => {
                const model = models[modelName];
                // Estos modelos siempre viven en el esquema central (public)
                if (['Usuario', 'Negocio', 'MicroFrontend', 'ConfiguracionNegocio'].includes(model.name)) {
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
