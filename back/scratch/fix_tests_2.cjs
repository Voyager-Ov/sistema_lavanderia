const fs = require('fs');
const path = require('path');

const testsDir = path.resolve('d:/github desktop/sistema_lavanderia/sistema_lavanderia/back/src/tests');
const files = fs.readdirSync(testsDir).filter(f => f.endsWith('.test.js') && f !== 'auth.test.js');

for (const file of files) {
    const fullPath = path.join(testsDir, file);
    let content = fs.readFileSync(fullPath, 'utf8');

    content = content.replace(/await (Pedido|PedidoItem|HistorialPedido|RegistroAsistencia|CategoriaProducto)\.create/g, "await models.$1.create");
    content = content.replace(/await (Pedido|PedidoItem|HistorialPedido|RegistroAsistencia|CategoriaProducto)\.bulkCreate/g, "await models.$1.bulkCreate");

    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`Updated ${file}`);
}
