/**
 * Script de migración: Agrega la columna anchoPapel a la tabla "negocios"
 * Ejecutar con: node src/migrations/add_ancho_papel.js
 */
import { Sequelize, QueryTypes } from "sequelize";
import dotenv from "dotenv";
dotenv.config();

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
    console.error("❌ DATABASE_URL no está definida en .env");
    process.exit(1);
}

const sequelize = new Sequelize(dbUrl, {
    dialect: "postgres",
    logging: false,
    dialectOptions: {
        ssl: { require: true, rejectUnauthorized: false },
    },
});

async function migrate() {
    try {
        await sequelize.authenticate();
        console.log("✅ Conectado exitosamente a Neon PostgreSQL");

        const tableInfo = await sequelize.query(
            `SELECT column_name FROM information_schema.columns 
             WHERE table_name = 'negocios' AND column_name = 'anchoPapel'`,
            { type: QueryTypes.SELECT }
        );

        if (tableInfo.length === 0) {
            await sequelize.query(
                `ALTER TABLE "negocios" ADD COLUMN "anchoPapel" VARCHAR(255) DEFAULT '80mm';`
            );
            console.log("✅ Columna 'anchoPapel' agregada a la tabla 'negocios'");
        } else {
            console.log("ℹ️ Columna 'anchoPapel' ya existe en la tabla 'negocios'");
        }

        console.log("🎉 Migración completada exitosamente");
    } catch (error) {
        console.error("❌ Error en la migración:", error.message);
    } finally {
        await sequelize.close();
    }
}

migrate();
