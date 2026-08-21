import "dotenv/config";

process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "desarrollo_secret_key_lavanderia";

if (typeof jest !== "undefined") {
    jest.setTimeout(60000);
}
