import dotenv from "dotenv";
dotenv.config();

import { connectionManager } from "../src/models/connectionManager.js";
import bcrypt from "bcryptjs";

const seedSuperAdmin = async () => {
    try {
        await connectionManager.initCentral();

        const emailsToEnsure = [
            (process.env.SUPERADMIN_EMAIL || "").toLowerCase().trim(),
            "octavio.velo22@gmail.com",
            "octavio.velo2022@gmail.com"
        ].filter(Boolean);

        const defaultPassword = process.env.SUPERADMIN_PASSWORD || "SuperSecretPassword123!";
        const { Usuario, Rol } = connectionManager.centralModels;

        const [superAdminRol] = await Rol.findOrCreate({
            where: { nombre: "SUPER_ADMIN" },
            defaults: { nombre: "SUPER_ADMIN", descripcion: "Rol de Administrador Global" }
        });

        for (const email of emailsToEnsure) {
            let user = await Usuario.findOne({ where: { email } });
            if (!user) {
                const salt = await bcrypt.genSalt(10);
                const passwordHash = await bcrypt.hash(defaultPassword, salt);
                user = await Usuario.create({
                    email,
                    password: passwordHash,
                    emailConfirmado: true,
                    activo: true,
                    empleadoId: null
                });
                console.log(`✅ SuperAdmin ${email} creado exitosamente con contraseña temporal.`);
            } else {
                user.activo = true;
                user.emailConfirmado = true;
                await user.save();
                console.log(`ℹ️ El SuperAdmin (Usuario) ${email} ya existe en la base de datos central.`);
            }

            await user.addRole(superAdminRol);
        }

        console.log("🎉 Proceso de Seeding de SuperAdmin finalizado correctamente.");
        process.exit(0);
    } catch (error) {
        console.error("❌ Error al crear SuperAdmin:", error);
        process.exit(1);
    }
};

seedSuperAdmin();
