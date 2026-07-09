import { AsyncLocalStorage } from "async_hooks";
import { connectionManager } from "./connectionManager.js";

// Creamos un almacenamiento local asíncrono para mantener el contexto del Tenant por cada petición HTTP.
export const tenantContext = new AsyncLocalStorage();

// Proxy mágico para 'models'. 
// Cualquier servicio que importe 'models' y haga 'models.Cliente', 
// en realidad estará accediendo al modelo 'Cliente' de la base de datos de SU TENANT.
const modelsProxy = new Proxy({}, {
    get: (target, prop) => {
        const store = tenantContext.getStore();
        if (store && store.models && store.models[prop]) {
            return store.models[prop];
        }
        // Fallback a central models si no hay contexto de tenant (ej. login, register, comandos CLI)
        if (connectionManager.centralModels[prop]) {
            return connectionManager.centralModels[prop];
        }
        throw new Error(`Modelo ${prop} no encontrado en el contexto actual.`);
    }
});

// Proxy mágico para 'sequelize' (usado en transacciones).
const sequelizeProxy = new Proxy({}, {
    get: (target, prop) => {
        const store = tenantContext.getStore();
        if (store && store.sequelize && typeof store.sequelize[prop] === 'function') {
            return store.sequelize[prop].bind(store.sequelize);
        }
        if (store && store.sequelize && prop in store.sequelize) {
            return store.sequelize[prop];
        }
        // Fallback a centralDb
        if (connectionManager.centralDb && typeof connectionManager.centralDb[prop] === 'function') {
            return connectionManager.centralDb[prop].bind(connectionManager.centralDb);
        }
        if (connectionManager.centralDb && prop in connectionManager.centralDb) {
            return connectionManager.centralDb[prop];
        }
        throw new Error(`Propiedad o método ${prop} no encontrado en sequelize.`);
    }
});

export const models = modelsProxy;
export const sequelize = sequelizeProxy;
export { connectionManager };
export default models;
