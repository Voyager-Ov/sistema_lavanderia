import "dotenv/config";
import pg from "pg";

const { Client } = pg;

async function run() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        
        // Find all tenant schemas
        const res = await client.query(`
            SELECT schema_name 
            FROM information_schema.schemata 
            WHERE schema_name LIKE 'tenant_%'
        `);

        for (const row of res.rows) {
            const schemaName = row.schema_name;
            console.log(`Migrating schema: ${schemaName}`);
            try {
                await client.query(`ALTER TABLE "${schemaName}".productos ADD COLUMN "imagenUrl" VARCHAR(255);`);
                console.log(`Successfully added imagenUrl to ${schemaName}.productos`);
            } catch (err) {
                if (err.code === '42701') {
                    console.log(`Column imagenUrl already exists in ${schemaName}.productos`);
                } else {
                    console.error(`Failed to alter table in ${schemaName}:`, err.message);
                }
            }
        }
        
    } catch (err) {
        console.error("Connection error", err);
    } finally {
        await client.end();
        process.exit(0);
    }
}

run();
