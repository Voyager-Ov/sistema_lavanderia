import dotenv from "dotenv";
dotenv.config();

import { connectionManager } from "../src/models/connectionManager.js";
import bcrypt from "bcryptjs";

const seedSuperAdmin = async () => {
    try {
        await connectionManager.initCentral();

        const email = process.env.SUPERADMIN_EMAIL || "superadmin@sistema.com";
        const password = process.env.SUPERADMIN_PASSWORD || "SuperSecretPassword123!";
        const nombre = "Administrador Global";

        const { Usuario, Rol } = connectionManager.centralModels;
        const existingAdmin = await Usuario.findOne({ where: { email } });

        if (existingAdmin) {
            console.log(`ℹ️ El SuperAdmin (Usuario) ${email} ya existe en la base de datos central.`);
            process.exit(0);
        }

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        const superAdminUser = await Usuario.create({
            email,
            password: passwordHash,
            emailConfirmado: true, // SuperAdmins bypass email verification
            activo: true,
            empleadoId: null // No pertenece a ningún tenant
        });

        const [superAdminRol] = await Rol.findOrCreate({
            where: { nombre: "SUPER_ADMIN" },
            defaults: { nombre: "SUPER_ADMIN", descripcion: "Rol de Administrador Global" }
        });

        await superAdminUser.addRole(superAdminRol);

        console.log(`✅ SuperAdmin ${email} creado exitosamente con contraseña: ${password}`);
        process.exit(0);
    } catch (error) {
        console.error("❌ Error al crear SuperAdmin:", error);
        process.exit(1);
    }
};

seedSuperAdmin();
