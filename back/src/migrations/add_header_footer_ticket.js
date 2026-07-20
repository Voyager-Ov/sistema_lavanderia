/**
 * Script de migración: Agrega columnas headerMessage y footerMessage
 * a la tabla ConfiguracionNegocios si no existen.
 * 
 * Ejecutar con: node src/migrations/add_header_footer_ticket.js
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
        console.log("✅ Conectado a la base de datos");

        // Verificar si la columna headerMessage ya existe
        const tableInfo = await sequelize.query(
            `SELECT column_name FROM information_schema.columns 
             WHERE table_name = 'configuraciones_negocio' AND column_name IN ('headerMessage', 'footerMessage')`,
            { type: QueryTypes.SELECT }
        );

        const existingCols = tableInfo.map(r => r.column_name);

        if (!existingCols.includes("headerMessage")) {
            await sequelize.query(
                `ALTER TABLE "configuraciones_negocio" ADD COLUMN "headerMessage" VARCHAR(255) DEFAULT NULL`
            );
            console.log("✅ Columna headerMessage agregada");
        } else {
            console.log("ℹ️  Columna headerMessage ya existe");
        }

        if (!existingCols.includes("footerMessage")) {
            await sequelize.query(
                `ALTER TABLE "configuraciones_negocio" ADD COLUMN "footerMessage" VARCHAR(255) DEFAULT '¡Gracias por su confianza!'`
            );
            console.log("✅ Columna footerMessage agregada");
        } else {
            console.log("ℹ️  Columna footerMessage ya existe");
        }

        console.log("🎉 Migración completada exitosamente");
    } catch (error) {
        console.error("❌ Error en la migración:", error.message);
    } finally {
        await sequelize.close();
    }
}

migrate();
