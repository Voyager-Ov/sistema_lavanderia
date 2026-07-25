import dotenv from "dotenv";
dotenv.config();

import { connectionManager, models } from "../src/models/index.js";
import bcrypt from "bcryptjs";

const createSuperAdmin = async () => {
    try {
        await connectionManager.initCentral();
        
        const email = "octavio.velo2022@gmail.com";
        const password = "superadminpassword"; // El usuario deberá cambiarla
        const nombre = "Octavio (SuperAdmin)";

        const existingAdmin = await models.SuperAdmin.findOne({ where: { email } });
        
        if (existingAdmin) {
            console.log(`El SuperAdmin ${email} ya existe.`);
            process.exit(0);
        }

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        await models.SuperAdmin.create({
            email,
            passwordHash,
            nombre,
            activo: true
        });

        console.log(`✅ SuperAdmin ${email} creado exitosamente con contraseña: ${password}`);
        process.exit(0);
    } catch (error) {
        console.error("❌ Error al crear SuperAdmin:", error);
        process.exit(1);
    }
};

createSuperAdmin();
