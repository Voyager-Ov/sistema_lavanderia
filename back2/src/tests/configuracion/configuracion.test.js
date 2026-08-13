import { describe, it, expect, beforeAll } from "@jest/globals";
import { connectionManager } from "../../models/connectionManager.js";
import { configuracionService } from "../../modules/configuracion/services/configuracion.service.js";

describe("Módulo de Configuración (Multi-Tenant Branding & Settings)", () => {
    const negocioId = 1;

    beforeAll(async () => {
        process.env.NODE_ENV = "test";
        await connectionManager.initCentral();
    });

    it("1. Debe obtener la configuración por defecto del negocio", async () => {
        const config = await configuracionService.getConfiguracion(negocioId);

        expect(config).toBeDefined();
        expect(config.id).toBe(negocioId);
        expect(config.colorPrincipal).toBe("#2563eb");
        expect(config.simboloMoneda).toBe("$");
    });

    it("2. Debe actualizar la información del negocio y branding visual", async () => {
        const updated = await configuracionService.actualizarConfiguracion(negocioId, {
            razonSocial: "Lavandería Las Burbujas SRL",
            cuit: "30-71112223-8",
            direccion: "Av. Corrientes 1234",
            telefonoContacto: "+541144556677",
            colorPrincipal: "#4f46e5",
            colorSecundario: "#10b981",
            simboloMoneda: "$"
        });

        expect(updated.razonSocial).toBe("Lavandería Las Burbujas SRL");
        expect(updated.cuit).toBe("30-71112223-8");
        expect(updated.colorPrincipal).toBe("#4f46e5");
        expect(updated.colorSecundario).toBe("#10b981");
    });

    it("3. Debe actualizar la configuración de AFIP y facturación", async () => {
        const updated = await configuracionService.actualizarConfiguracion(negocioId, {
            afipActivo: true,
            afipModoFacturacion: "AUTOMATICO",
            afipPuntoVenta: 2
        });

        expect(updated.afipActivo).toBe(true);
        expect(updated.afipModoFacturacion).toBe("AUTOMATICO");
        expect(updated.afipPuntoVenta).toBe(2);
    });

    it("4. Debe guardar las rutas de los certificados de AFIP", async () => {
        const certPath = "/uploads/certs/afip-test.crt";
        const keyPath = "/uploads/certs/afip-test.key";

        const updated = await configuracionService.guardarCertificadosAfip(negocioId, certPath, keyPath);

        expect(updated.afipCertificado).toBe(certPath);
        expect(updated.afipLlavePrivada).toBe(keyPath);
        expect(updated.afipActivo).toBe(true);
    });

    it("5. Debe actualizar la configuración de Mercado Pago", async () => {
        const updated = await configuracionService.actualizarConfiguracion(negocioId, {
            mercadopagoAccessToken: "APP_USR-123456789-TEST",
            mercadopagoPublicKey: "APP_USR-PUBLIC-TEST",
            aliasMp: "burbujas.mp"
        });

        expect(updated.mercadopagoAccessToken).toBe("APP_USR-123456789-TEST");
        expect(updated.mercadopagoPublicKey).toBe("APP_USR-PUBLIC-TEST");
        expect(updated.aliasMp).toBe("burbujas.mp");
    });
});
