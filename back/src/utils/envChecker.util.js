/**
 * Valida que todas las variables de entorno críticas existan antes de que arranque la aplicación.
 * Previene errores misteriosos en tiempo de ejecución (Fail-Fast).
 */
export const checkEnvVariables = () => {
    const requiredVars = [
        "DATABASE_URL",
        "JWT_SECRET",
        "EMAIL_USER",
        "EMAIL_PASS"
    ];

    const missingVars = requiredVars.filter(envVar => !process.env[envVar]);

    if (missingVars.length > 0) {
        console.error("=====================================================");
        console.error("🚨 ERROR CRÍTICO AL INICIAR EL SERVIDOR");
        console.error("Faltan las siguientes variables de entorno obligatorias:");
        missingVars.forEach(v => console.error(`   ❌ ${v}`));
        console.error("Por favor, agrégalas a tu archivo .env y vuelve a iniciar.");
        console.error("=====================================================");
        process.exit(1);
    }
};
