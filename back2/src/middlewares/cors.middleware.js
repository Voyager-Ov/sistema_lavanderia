import cors from "cors";

// CORS configured to support standard headers and all origins for clean start
export const dynamicCors = cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-tenant-id"]
});
