import express from "express";
import cors from "cors";

const app = express();

app.use(cors());
app.use(express.json());

// Base Route
app.get("/", (req, res) => {
    res.json({ message: "SaaS Laundry API - Fresh Start" });
});

// Centralized error handler stub
app.use((err, req, res, next) => {
    console.error(err);
    res.status(err.status || 500).json({ error: err.message || "Internal Server Error" });
});

export default app;
