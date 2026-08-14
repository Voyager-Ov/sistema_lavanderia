import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { Sequelize } from "sequelize";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../.env") });

async function listTables() {
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
            WHERE table_schema = 'public'
            ORDER BY table_name;
        `);

        console.log("Tablas en public:");
        results.forEach(row => console.log(`- ${row.table_name}`));
        process.exit(0);
    } catch (error) {
        console.error("Error:", error);
        process.exit(1);
    }
}

listTables();
