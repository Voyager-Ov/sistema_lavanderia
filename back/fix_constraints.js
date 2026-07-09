import fs from 'fs';
import path from 'path';

const modelsDir = path.join(process.cwd(), 'src', 'models');
const files = fs.readdirSync(modelsDir).filter(f => f.endsWith('.js') && f !== 'index.js' && f !== 'connectionManager.js');

files.forEach(file => {
    const filePath = path.join(modelsDir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Fix belongsTo(models.Negocio)
    const negocioRegex = /\.belongsTo\(\s*models\.Negocio\s*,\s*\{\s*foreignKey:\s*["']negocioId["']\s*,\s*as:\s*["']negocio["']\s*(?!,\s*constraints:\s*false)\}\)/g;
    if (negocioRegex.test(content)) {
        content = content.replace(negocioRegex, `.belongsTo(models.Negocio, { foreignKey: "negocioId", as: "negocio", constraints: false })`);
        modified = true;
    }

    // Fix belongsTo(models.Usuario) in Caja, HistorialPedido, etc
    const usuarioRegex = /\.belongsTo\(\s*models\.Usuario\s*,\s*\{\s*foreignKey:\s*["']([^"']+)["']\s*,\s*as:\s*["']([^"']+)["']\s*(?!,\s*constraints:\s*false)\}\)/g;
    if (usuarioRegex.test(content)) {
        content = content.replace(usuarioRegex, `.belongsTo(models.Usuario, { foreignKey: "$1", as: "$2", constraints: false })`);
        modified = true;
    }

    if (modified) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Updated ${file}`);
    }
});
