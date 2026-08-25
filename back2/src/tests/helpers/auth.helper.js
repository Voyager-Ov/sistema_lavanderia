import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { jest } from "@jest/globals";
import { OAuth2Client } from "google-auth-library";
import { connectionManager } from "../../models/connectionManager.js";
import { getJwtSecret } from "../../config/env.config.js";

export const generateUniqueEmail = (prefix = "test") => {
    return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 10000)}@lavanderia.test`;
};

export const buildValidJwt = ({ email, negocioId = 1, empleadoId = 1, rol = "ADMIN" }) => {
    const secret = getJwtSecret();
    return jwt.sign(
        { email, negocioId, empleadoId, rol },
        secret,
        { expiresIn: "8h" }
    );
};

export const createTestUser = async ({
    email,
    password = "Password123!",
    activo = true,
    emailConfirmado = true,
    rol = "ADMIN",
    googleId = null,
    negocioId = 1
}) => {
    if (!connectionManager.centralDb) {
        await connectionManager.initCentral();
    }
    const { Usuario, Rol } = connectionManager.centralModels;
    const salt = await bcrypt.genSalt(10);
    const passwordHash = password ? await bcrypt.hash(password, salt) : null;

    const [usuario] = await Usuario.findOrCreate({
        where: { email: email.toLowerCase().trim() },
        defaults: {
            email: email.toLowerCase().trim(),
            password: passwordHash,
            activo,
            emailConfirmado,
            googleId,
            negocioId
        }
    });

    if (rol) {
        const [rolRecord] = await Rol.findOrCreate({
            where: { nombre: rol.toUpperCase() },
            defaults: { nombre: rol.toUpperCase(), descripcion: `Rol ${rol}` }
        });
        await usuario.addRole(rolRecord);
    }

    return usuario;
};

export const createTestTenantWithAdmin = async ({
    email,
    password = "Password123!",
    nombre = "Admin Test",
    negocioNombre = "Lavanderia Test",
    rol = "ADMIN",
    activo = true
}) => {
    if (!connectionManager.centralDb) {
        await connectionManager.initCentral();
    }
    const { Negocio, Usuario, Rol } = connectionManager.centralModels;

    const userEmail = email || generateUniqueEmail("admin");
    const subdominio = `test-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const negocio = await Negocio.create({
        nombre: negocioNombre,
        razonSocial: negocioNombre,
        subdominio,
        activo,
        estadoSuscripcion: "PRUEBA"
    });

    const tenantDb = await connectionManager.getTenantDb(negocio.id, true);

    const [nombrePila, ...resto] = nombre.split(" ");
    const apellidoPila = resto.join(" ") || "Test";

    const empleado = await tenantDb.models.Empleado.create({
        legajo: 1,
        nombre: nombrePila,
        apellido: apellidoPila,
        email: userEmail,
        fechaAlta: new Date(),
        negocioId: negocio.id,
        rol: rol.toLowerCase(),
        activo: true
    });

    const passwordHash = password ? await bcrypt.hash(password, await bcrypt.genSalt(10)) : null;

    const usuario = await Usuario.create({
        email: userEmail,
        password: passwordHash,
        activo: true,
        emailConfirmado: true,
        empleadoId: empleado.id,
        negocioId: negocio.id
    });

    const [rolRecord] = await Rol.findOrCreate({
        where: { nombre: rol.toUpperCase() },
        defaults: { nombre: rol.toUpperCase(), descripcion: `Rol ${rol}` }
    });
    await usuario.addRole(rolRecord);

    const token = buildValidJwt({
        email: userEmail,
        negocioId: negocio.id,
        empleadoId: empleado.id,
        rol: rol.toUpperCase()
    });

    return {
        negocio,
        empleado,
        usuario,
        token,
        email: userEmail,
        password
    };
};

export const setupGoogleOAuthMock = () => {
    return jest.spyOn(OAuth2Client.prototype, "verifyIdToken").mockImplementation(async ({ idToken }) => {
        if (!idToken || idToken === "invalid-token" || idToken === "expired-token") {
            throw new Error("Invalid token signature or expired token");
        }

        if (idToken.startsWith("valid-google-token:")) {
            const email = idToken.split(":")[1];
            return {
                getPayload: () => ({
                    email: email.toLowerCase(),
                    sub: `google_id_${email}`,
                    name: "Google User",
                    email_verified: true
                })
            };
        }

        return {
            getPayload: () => ({
                email: "google.default@test.com",
                sub: "google_id_default_123",
                name: "Google Default",
                email_verified: true
            })
        };
    });
};
