import { describe, it, expect, beforeAll, beforeEach } from "@jest/globals";
import { connectionManager } from "../../models/connectionManager.js";
import { authService, registerService } from "../../modules/auth/services/auth.service.js";
import { setupEmailMock, emailStore } from "../helpers/email.mock.js";
import { generateUniqueEmail, createTestUser } from "../helpers/auth.helper.js";

describe("CU-AUTH-01: Registro de Solicitud de Negocio", () => {
    beforeAll(async () => {
        process.env.NODE_ENV = "test";
        await connectionManager.initCentral();
    });

    beforeEach(() => {
        setupEmailMock();
    });

    it("1. Debe registrar exitosamente una SolicitudNegocio en estado PENDIENTE y notificar al SuperAdmin", async () => {
        const email = generateUniqueEmail("solicitante");
        const payload = {
            email,
            password: "PasswordSegura123!",
            usuarioNombre: "María Lopez",
            negocioNombre: "Tintorería Express",
            cuit: "27334455661",
            subdominio: "tintoreria-express",
            telefono: "+5491122334455"
        };

        const res = await authService.register(payload);

        expect(res).toBeDefined();
        expect(res.solicitud).toBeDefined();
        expect(res.solicitud.email).toBe(email);
        expect(res.solicitud.nombreNegocio).toBe("Tintorería Express");
        expect(res.solicitud.estado).toBe("PENDIENTE");

        // Validar que se haya guardado en PostgreSQL central
        const { SolicitudNegocio } = connectionManager.centralModels;
        const solicitudDb = await SolicitudNegocio.findByPk(res.solicitud.id);
        expect(solicitudDb).not.toBeNull();
        expect(solicitudDb.nombreSolicitante).toBe("María Lopez");
        expect(solicitudDb.estado).toBe("PENDIENTE");

        // Validar que se haya interceptado el email al SuperAdmin
        const adminEmail = emailStore.getLast();
        expect(adminEmail).not.toBeNull();
        expect(adminEmail.type).toBe("SUPERADMIN_NEW_REQUEST");
        expect(adminEmail.solicitud.emailSolicitante).toBe(email);
    });

    it("2. Debe fallar rápido (Fail-Fast) si falta 'usuarioNombre' o 'negocioNombre' sin usar fallbacks", async () => {
        const email = generateUniqueEmail("failfast");

        // Sin usuarioNombre
        await expect(authService.register({
            email,
            password: "PasswordSegura123!",
            negocioNombre: "Lavandería Sin Dueño"
        })).rejects.toThrow("usuarioNombre");

        // Sin negocioNombre
        await expect(authService.register({
            email,
            password: "PasswordSegura123!",
            usuarioNombre: "Pedro Perez"
        })).rejects.toThrow("negocioNombre");
    });

    it("3. Debe fallar rápido si falta 'email' o 'password'", async () => {
        await expect(authService.register({
            password: "PasswordSegura123!",
            usuarioNombre: "Pedro",
            negocioNombre: "Negocio"
        })).rejects.toThrow("email");

        await expect(authService.register({
            email: generateUniqueEmail("nopass"),
            usuarioNombre: "Pedro",
            negocioNombre: "Negocio"
        })).rejects.toThrow("password");
    });

    it("4. Debe retornar 409 CONFLICT si el email ya existe como Usuario activo", async () => {
        const email = generateUniqueEmail("existing");
        await createTestUser({ email });

        await expect(authService.register({
            email,
            password: "PasswordSegura123!",
            usuarioNombre: "Juan Existente",
            negocioNombre: "Lavandería Duplicada"
        })).rejects.toThrow("ya se encuentra registrado");
    });

    it("5. Debe retornar 409 CONFLICT si el email ya tiene una solicitud PENDIENTE", async () => {
        const email = generateUniqueEmail("pendingdup");
        await authService.register({
            email,
            password: "PasswordSegura123!",
            usuarioNombre: "Ana Primera",
            negocioNombre: "Lavandería Ana"
        });

        await expect(authService.register({
            email,
            password: "PasswordSegura123!",
            usuarioNombre: "Ana Segunda",
            negocioNombre: "Lavandería Ana 2"
        })).rejects.toThrow("solicitud de registro pendiente");
    });

    it("6. El SuperAdmin puede aprobar la solicitud, creando el Tenant, primer Empleado y Usuario", async () => {
        const email = generateUniqueEmail("aprobar");
        const regRes = await authService.register({
            email,
            password: "PasswordAdmin123!",
            usuarioNombre: "Martín Bossi",
            negocioNombre: "Lavandería Bossi"
        });

        const solicitudId = regRes.solicitud.id;
        const sustanciacion = await registerService.sustanciarAprobacionNegocio(solicitudId);

        expect(sustanciacion).toBeDefined();
        expect(sustanciacion.usuario.email).toBe(email);
        expect(sustanciacion.usuario.nombre).toBe("Martín Bossi");
        expect(sustanciacion.negocio.nombre).toBe("Lavandería Bossi");

        // Comprobar que el usuario fue creado en base central con email confirmado
        const { Usuario } = connectionManager.centralModels;
        const usuarioDb = await Usuario.findByPk(email);
        expect(usuarioDb.activo).toBe(true);
        expect(usuarioDb.emailConfirmado).toBe(true);

        // Comprobar que se notificó por email al solicitante
        const resultadoEmail = emailStore.getLastByRecipient(email);
        expect(resultadoEmail).not.toBeNull();
        expect(resultadoEmail.type).toBe("REQUEST_RESULT");
        expect(resultadoEmail.estado).toBe("APROBADO");
    });
});
