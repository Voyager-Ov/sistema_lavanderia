import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { Sequelize } from "sequelize";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../.env") });

async function cleanup() {
    console.log("Iniciando limpieza de la base de datos en Neon...");
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
        console.error("DATABASE_URL no definida");
        process.exit(1);
    }

    const sequelize = new Sequelize(dbUrl, {
        dialect: "postgres",
        logging: false,
        dialectOptions: {
            ssl: { require: true, rejectUnauthorized: false }
        }
    });

    try {
        await sequelize.authenticate();
        console.log("Conectado a Neon.");

        // Obtener todos los esquemas que empiezan con 'tenant_'
        const [results] = await sequelize.query(`
            SELECT schema_name 
            FROM information_schema.schemata 
            WHERE schema_name LIKE 'tenant_%';
        `);

        for (const row of results) {
            const schema = row.schema_name;
            console.log(`Eliminando esquema: ${schema}`);
            await sequelize.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE;`);
        }

        // Limpiar tablas del esquema central (public)
        console.log("Limpiando tablas centrales en public...");
        await sequelize.query(`
            TRUNCATE TABLE public.usuarios CASCADE;
            TRUNCATE TABLE public.negocios CASCADE;
            TRUNCATE TABLE public.roles CASCADE;
            TRUNCATE TABLE public.super_admins CASCADE;
        `);

        console.log("¡Limpieza completada exitosamente!");
        process.exit(0);
    } catch (error) {
        console.error("Error durante la limpieza:", error);
        process.exit(1);
    }
}

cleanup();
