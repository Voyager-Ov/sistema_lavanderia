import dotenv from 'dotenv';
dotenv.config();

import { connectionManager } from '../src/models/connectionManager.js';

async function migrateAllTenants() {
    console.log("Iniciando migración DDL de Cuenta Corriente y Saldos a Favor...");
    await connectionManager.initCentral();

    const [schemas] = await connectionManager.centralDb.query(
        "SELECT schema_name FROM information_schema.schemata WHERE schema_name LIKE 'tenant_%' OR schema_name = 'public';"
    );

    console.log(`Esquemas de tenants encontrados (${schemas.length}):`, schemas.map(s => s.schema_name));

    for (const { schema_name: schemaName } of schemas) {
        console.log(`\nMigrando esquema: ${schemaName}...`);
        try {
            // 1. Agregar columnas a pagos
            await connectionManager.centralDb.query(`
                ALTER TABLE "${schemaName}"."pagos" 
                ADD COLUMN IF NOT EXISTS "montoEfectivoTarjeta" DECIMAL(10, 2) NOT NULL DEFAULT 0;
                
                ALTER TABLE "${schemaName}"."pagos" 
                ADD COLUMN IF NOT EXISTS "montoCreditoAplicado" DECIMAL(10, 2) NOT NULL DEFAULT 0;
                
                ALTER TABLE "${schemaName}"."pagos" 
                ADD COLUMN IF NOT EXISTS "montoAFavorGenerado" DECIMAL(10, 2) NOT NULL DEFAULT 0;
                
                ALTER TABLE "${schemaName}"."pagos" 
                ADD COLUMN IF NOT EXISTS "saldoAFavorDisponible" DECIMAL(10, 2) NOT NULL DEFAULT 0;
                
                ALTER TABLE "${schemaName}"."pagos" 
                ALTER COLUMN "metodoPagoId" DROP NOT NULL;
            `);

            // Backfill pagos existentes
            await connectionManager.centralDb.query(`
                UPDATE "${schemaName}"."pagos" 
                SET "montoEfectivoTarjeta" = "monto" 
                WHERE "montoEfectivoTarjeta" = 0 AND "monto" > 0 AND "montoCreditoAplicado" = 0;
            `);

            // 2. Crear tabla creditos_cliente
            await connectionManager.centralDb.query(`
                CREATE TABLE IF NOT EXISTS "${schemaName}"."creditos_cliente" (
                    "id" SERIAL PRIMARY KEY,
                    "negocioId" INTEGER NOT NULL,
                    "clienteId" INTEGER NOT NULL,
                    "pedidoOrigenId" INTEGER,
                    "montoOriginal" DECIMAL(10, 2) NOT NULL,
                    "montoDisponible" DECIMAL(10, 2) NOT NULL,
                    "tipoOrigen" VARCHAR(50) NOT NULL,
                    "estado" VARCHAR(50) NOT NULL DEFAULT 'DISPONIBLE',
                    "motivo" TEXT,
                    "creadoPorId" INTEGER,
                    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
                    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
                );

                CREATE INDEX IF NOT EXISTS "creditos_cliente_cliente_idx" ON "${schemaName}"."creditos_cliente" ("clienteId");
                CREATE INDEX IF NOT EXISTS "creditos_cliente_estado_idx" ON "${schemaName}"."creditos_cliente" ("estado");
            `);

            // 3. Crear tabla aplicaciones_credito
            await connectionManager.centralDb.query(`
                CREATE TABLE IF NOT EXISTS "${schemaName}"."aplicaciones_credito" (
                    "id" SERIAL PRIMARY KEY,
                    "negocioId" INTEGER NOT NULL,
                    "creditoId" INTEGER NOT NULL,
                    "pagoDestinoId" INTEGER NOT NULL,
                    "pedidoDestinoId" INTEGER NOT NULL,
                    "montoAplicado" DECIMAL(10, 2) NOT NULL,
                    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
                );

                CREATE INDEX IF NOT EXISTS "aplicaciones_credito_credito_idx" ON "${schemaName}"."aplicaciones_credito" ("creditoId");
                CREATE INDEX IF NOT EXISTS "aplicaciones_credito_pago_idx" ON "${schemaName}"."aplicaciones_credito" ("pagoDestinoId");
            `);

            console.log(`✅ ${schemaName} migrado correctamente.`);
        } catch (err) {
            console.error(`❌ Error al migrar ${schemaName}:`, err.message);
        }
    }

    console.log("\n==========================================");
    console.log("Migración completada exitosamente en todos los esquemas.");
    console.log("==========================================");
    process.exit(0);
}

migrateAllTenants().catch(err => {
    console.error("Error fatal en migración:", err);
    process.exit(1);
});
