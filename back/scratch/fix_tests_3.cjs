const fs = require('fs');
const path = require('path');

const testsDir = path.resolve('d:/github desktop/sistema_lavanderia/sistema_lavanderia/back/src/tests');
const files = fs.readdirSync(testsDir).filter(f => f.endsWith('.test.js') && f !== 'auth.test.js');

for (const file of files) {
    const fullPath = path.join(testsDir, file);
    let content = fs.readFileSync(fullPath, 'utf8');

    // 1. Declare `let tenantModels;` near let adminToken...
    if (!content.includes('let tenantModels;')) {
        content = content.replace(/let adminToken/, 'let tenantModels, adminToken');
    }

    // 2. Assign `tenantModels = tenantDb.models;` inside beforeAll
    const beforeAllRegex = /(await connectionManager\.getTenantDb\(negocio\.id\);)/;
    if (!content.includes('tenantModels = (await connectionManager.getTenantDb(negocio.id)).models;')) {
        content = content.replace(beforeAllRegex, (match) => {
            return `${match}
        tenantModels = (await connectionManager.getTenantDb(negocio.id)).models;`;
        });
    }

    // 3. Replace `models.X` with `tenantModels.X` EVERYWHERE except in the imports
    content = content.replace(/ models\./g, ' tenantModels.');
    content = content.replace(/ await models\./g, ' await tenantModels.');

    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`Updated ${file}`);
}
