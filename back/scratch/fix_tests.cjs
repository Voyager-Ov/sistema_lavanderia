const fs = require('fs');
const path = require('path');

const testsDir = path.resolve('d:/github desktop/sistema_lavanderia/sistema_lavanderia/back/src/tests');

const files = fs.readdirSync(testsDir).filter(f => f.endsWith('.test.js') && f !== 'auth.test.js');

for (const file of files) {
    const fullPath = path.join(testsDir, file);
    let content = fs.readFileSync(fullPath, 'utf8');

    // Add connectionManager to imports if not present
    if (!content.includes('connectionManager')) {
        content = content.replace("import { sequelize, models } from '../models/index.js';", "import { sequelize, models, connectionManager } from '../models/index.js';");
    }

    // Remove top-level destructuring of models
    content = content.replace(/const { [^}]+ } = models;\n?/g, '');

    // Replace beforeAll setup
    const beforeAllRegex = /beforeAll\(async \(\) => {[\s\S]*?await sequelize\.sync\(\{ force: true \}\);[\s\S]*?const negocio = await Negocio\.create\(\{([\s\S]*?)\}\);/m;
    
    content = content.replace(beforeAllRegex, (match, p1) => {
        return `beforeAll(async () => {
        await connectionManager.initCentral();
        await connectionManager.centralDb.sync({ force: true });
        
        const negocio = await connectionManager.centralModels.Negocio.create({${p1}});
        
        // Inicializar Tenant DB
        await connectionManager.getTenantDb(negocio.id);`;
    });

    // Replace model creation in beforeAll.
    // E.g. `await Usuario.create(` -> `await models.Usuario.create(`
    content = content.replace(/await (Usuario|Cliente|Producto|Caja|MetodoPago)\.create/g, "await models.$1.create");
    content = content.replace(/await (Usuario|Cliente|Producto|Caja|MetodoPago)\.bulkCreate/g, "await models.$1.bulkCreate");

    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`Updated ${file}`);
}
