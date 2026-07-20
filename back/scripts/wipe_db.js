import dotenv from 'dotenv';
dotenv.config();
import { connectionManager } from '../src/models/connectionManager.js';

async function run() {
    try {
        console.log("Initializing database connection...");
        await connectionManager.initCentral();
        
        console.log("Wiping all schemas...");
        const wipeQuery = `
            DO $$ 
            DECLARE 
                r record;
            BEGIN 
                FOR r IN (SELECT schema_name FROM information_schema.schemata WHERE schema_name = 'public' OR schema_name LIKE 'tenant_%') 
                LOOP 
                    EXECUTE 'DROP SCHEMA IF EXISTS ' || quote_ident(r.schema_name) || ' CASCADE'; 
                END LOOP; 
            END $$;
        `;
        await connectionManager.centralDb.query(wipeQuery);
        console.log("All schemas wiped. Recreating public schema...");
        
        await connectionManager.centralDb.query('CREATE SCHEMA public;');
        console.log("Database wiped and public schema recreated!");
    } catch (error) {
        console.error("Error wiping database:", error);
        process.exit(1);
    } 
    process.exit(0);
}

run();
