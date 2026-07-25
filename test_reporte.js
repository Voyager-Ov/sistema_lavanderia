import { getServiciosReportData } from './back/src/services/reportes/reportes.service.js';
import { tenantContext, connectionManager } from './back/src/models/index.js';

async function test() {
    await connectionManager.initCentral();
    // Assuming there is a Tenant model
    const tenants = await connectionManager.centralModels.Tenant.findAll();
    if (tenants.length === 0) { console.log('No tenants'); process.exit(0); }
    const tenant = tenants[0];
    const tenantDb = await connectionManager.getTenantDb(tenant.schema_name);
    
    tenantContext.run({ models: tenantDb.models, sequelize: tenantDb.sequelize }, async () => {
        try {
            const data = await getServiciosReportData(tenant.id, null, null);
            console.log('Success:', Object.keys(data));
        } catch(e) {
            console.error('ERROR IN CONTEXT:', e);
        }
        process.exit(0);
    });
}
test();
