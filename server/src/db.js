require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });

let pool = null;
const isDbConfigured = Boolean(process.env.DATABASE_URL);

if (isDbConfigured) {
    const { Pool } = require("pg");
    pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });
}

async function query(text, params) {
    if (!pool) {
        throw new Error("Database not configured. Set DATABASE_URL in server/.env");
    }
    return pool.query(text, params);
}

module.exports = {
    query: query,
    isDbConfigured: isDbConfigured,
    pool: pool
};
