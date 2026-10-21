import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { pool } from "./pool.js";

async function migrate() {
    const migrationsDir = path.resolve(
        process.cwd(),
        "src/db/migrations"
    );


const files = (await readdir(migrationsDir))
    .filter((file) => file.endsWith(".sql"))
    .sort();

const client = await pool.connect();

try {
    await client.query(`
        CREATE TABLE IF NOT EXISTS public.schema_migrations (
            version TEXT PRIMARY KEY,
            applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
    `);

    for(const file of files) {
        await client.query("BEGIN");

        try{
            const result = await client.query(
                `SELECT 1
                 FROM public.schema_migrations
                 WHERE version = $1`,
                 [file]
            );

            if(result.rowCount && result.rowCount > 0) {
                console.log(`skipping ${file} (already applied)`);
                await client.query("COMMIT");
                continue;
            }

            const sql = await readFile(
                path.join(migrationsDir, file),
                "utf8" 
            );

            console.log(`Appliying ${file}...`);

            await client.query(sql);

            await client.query(
                `INSERT INTO public.schema_migrations (version)
                VALUES ($1)
                ON CONFLICT (version) DO NOTHING`,
                [file]
            );

            await client.query("COMMIT");
            console.log(`Applied ${file} successfully`);
        } catch (error) {
            await client.query("ROLLBACK");
            throw error;
        }
    }

    console.log("All migrations are up to date.");
} finally {
    client.release();
    await pool.end();
}
};

migrate().catch((error) => {
  console.error("Migration failed:", error);
  process.exitCode = 1;
});