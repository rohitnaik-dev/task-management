import "dotenv/config";
import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL;

if(!connectionString) {
    throw new Error("DATABASE_URL is missing from the environment");
}

export const pool = new Pool({
    connectionString,
    ssl: {
        rejectUnauthorized: false,
    },
});