import dotenv from 'dotenv';
dotenv.config();

import { connectionManager } from '../src/models/connectionManager.js';

async function run() {
    try {
        console.log("Initializing database connection...");
        await connectionManager.initCentral();
        
        console.log("Syncing database with force: true...");
        await connectionManager.centralDb.sync({ force: true });
        
        console.log("Database synchronized successfully!");
    } catch (error) {
        console.error("Error syncing database:", error);
    } process.exit(0);
}

run();
