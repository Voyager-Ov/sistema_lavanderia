import fs from "fs";
import path from "path";

const servicesDir = path.join(process.cwd(), "src/services");

function getStatusCode(msg) {
    const lower = msg.toLowerCase();
    if (lower.includes("no encontrad") || lower.includes("no existe") || lower.includes("inválida o no encontrada")) return 404;
    if (lower.includes("permiso") || lower.includes("denegado") || lower.includes("credential")) return 403;
    if (lower.includes("invalid_credentials") || lower.includes("user_disabled") || lower.includes("jwt_secret")) return 401;
    return 400;
}

function processDirectory(directory) {
    const files = fs.readdirSync(directory);
    for (const file of files) {
        const fullPath = path.join(directory, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            processDirectory(fullPath);
        } else if (file.endsWith(".js")) {
            let content = fs.readFileSync(fullPath, "utf-8");
            
            // Si tiene errores para reemplazar
            if (content.includes("throw new Error(")) {
                
                // Asegurarse que se importe AppError
                if (!content.includes("AppError")) {
                    // Contar cuantos niveles subir. src/services = 2 niveles (../../) o 1 nivel (../) dependiendo del nesting
                    const relativePath = path.relative(path.dirname(fullPath), path.join(process.cwd(), "src/utils/errors.js"));
                    const importPath = relativePath.replace(/\\/g, '/');
                    content = `import { AppError } from "${importPath}";\n` + content;
                }

                const regex = /throw new Error\((`|")(.*?)\1\)/g;
                content = content.replace(regex, (match, quote, msg) => {
                    // Para template strings, msg puede tener interpolaciones. Usaremos getStatusCode en base al string plano.
                    const statusCode = getStatusCode(msg);
                    return `throw new AppError(${quote}${msg}${quote}, ${statusCode})`;
                });

                fs.writeFileSync(fullPath, content, "utf-8");
                console.log(`Updated ${fullPath}`);
            }
        }
    }
}

processDirectory(servicesDir);
console.log("Refactoring complete.");
