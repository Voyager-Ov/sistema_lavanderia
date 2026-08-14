import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { Sequelize } from "sequelize";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../.env") });

async function dropExtraTables() {
    const dbUrl = process.env.DATABASE_URL;
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

        const [results] = await sequelize.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public';
        `);

        const validTables = ['usuarios', 'negocios', 'roles', 'UsuarioRoles'];

        for (const row of results) {
            const table = row.table_name;
            if (!validTables.includes(table)) {
                console.log(`Eliminando tabla sobrante en public: ${table}`);
                await sequelize.query(`DROP TABLE IF EXISTS public."${table}" CASCADE;`);
            }
        }

        console.log("Sincronización completada: Solo quedaron las tablas centrales en public.");
        process.exit(0);
    } catch (error) {
        console.error("Error:", error);
        process.exit(1);
    }
}

dropExtraTables();
