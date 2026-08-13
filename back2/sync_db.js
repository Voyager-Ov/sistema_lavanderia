import "dotenv/config";
import { connectionManager } from "./src/models/connectionManager.js";

async function syncAndSeed() {
    process.env.NODE_ENV = "development";
    console.log("⚡ Sincronizando modelos con la Base de Datos Neon (PostgreSQL)...");

    try {
        await connectionManager.initCentral();
        console.log("🟢 Conexión a Neon PostgreSQL autenticada exitosamente.");

        const { Rol } = connectionManager.centralModels;

        // Sembrar Roles base en el esquema central
        const rolesBase = [
            { nombre: "ADMIN", descripcion: "Administrador con control total del negocio" },
            { nombre: "EMPLEADO", descripcion: "Empleado operativo de lavandería" },
            { nombre: "CAJERO", descripcion: "Cajero responsable de caja y cobros" },
            { nombre: "SUPERADMIN", descripcion: "Administrador de la plataforma SaaS" }
        ];

        for (const r of rolesBase) {
            await Rol.findOrCreate({
                where: { nombre: r.nombre },
                defaults: r
            });
        }

        console.log("✅ Roles base sembrados exitosamente en la base central.");
        console.log("🎉 Sincronización completa. La base de datos está lista para operar.");
        process.exit(0);
    } catch (error) {
        console.error("🔴 Error al sincronizar con Neon:", error);
        process.exit(1);
    }
}

syncAndSeed();
