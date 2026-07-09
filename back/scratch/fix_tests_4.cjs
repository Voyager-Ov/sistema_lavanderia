const fs = require('fs');
const path = require('path');

const testsDir = path.resolve('d:/github desktop/sistema_lavanderia/sistema_lavanderia/back/src/tests');
const files = fs.readdirSync(testsDir).filter(f => f.endsWith('.test.js') && f !== 'auth.test.js');

for (const file of files) {
    const fullPath = path.join(testsDir, file);
    let content = fs.readFileSync(fullPath, 'utf8');

    // Fix Usuario creation in tests
    content = content.replace(/tenantModels\.Usuario\.create/g, 'connectionManager.centralModels.Usuario.create');
    content = content.replace(/tenantModels\.Usuario\.bulkCreate/g, 'connectionManager.centralModels.Usuario.bulkCreate');
    
    // Fix findOne if they use it
    content = content.replace(/tenantModels\.Usuario\.findOne/g, 'connectionManager.centralModels.Usuario.findOne');

    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`Updated ${file}`);
}
