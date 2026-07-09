import dotenv from "dotenv";
dotenv.config();

import { enviarCodigoVerificacion } from "./src/services/email.service.js";

async function test() {
    console.log("Probando el servicio de correos...");
    try {
        await enviarCodigoVerificacion("tu-email-de-prueba@gmail.com", "Prueba Usuario", "123456");
        console.log("¡Prueba finalizada! Revisa la consola o tu bandeja de entrada (si configuraste las credenciales).");
    } catch (error) {
        console.error("Falló la prueba:", error);
    }
}

test();
