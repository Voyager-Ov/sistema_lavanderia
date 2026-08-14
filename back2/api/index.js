import app from "../src/app.js";
import { connectionManager } from "../src/models/connectionManager.js";
import * as pg from 'pg';

// Vercel Serverless Function entry point
let isInitialized = false;

export default async function handler(req, res) {
  // Ensure the central DB connection is initialized once per serverless instance
  if (!isInitialized) {
    try {
      await connectionManager.initCentral();
      isInitialized = true;
      console.log("Central DB initialized in serverless handler (back2).");
    } catch (err) {
      console.error("Failed to initialize Central DB:", err);
      res.status(500).json({ error: "Database connection failed", details: err.message });
      return;
    }
  }

  // Forward the request to the Express app
  return app(req, res);
}
