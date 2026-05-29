import "dotenv/config";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import pg from "pg";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sqlPath = path.resolve(__dirname, "..", "studysync_database.sql");

const client = new pg.Client({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: { rejectUnauthorized: false },
});

const run = async () => {
  const sql = fs.readFileSync(sqlPath, "utf8");

  console.log("Connecting to database...");
  await client.connect();
  console.log("Executing studysync_database.sql (this may take a minute)...");

  await client.query(sql);

  console.log("SQL script executed successfully.");

  const { rows } = await client.query(`
    SELECT 'users' AS table_name, COUNT(*)::int AS count FROM users
    UNION ALL SELECT 'study_sessions', COUNT(*)::int FROM study_sessions
    UNION ALL SELECT 'messages', COUNT(*)::int FROM messages
    UNION ALL SELECT 'ratings', COUNT(*)::int FROM ratings
    UNION ALL SELECT 'reports', COUNT(*)::int FROM reports
    UNION ALL SELECT 'admin_actions', COUNT(*)::int FROM admin_actions
    ORDER BY table_name;
  `);

  console.table(rows);
  await client.end();
};

run().catch((err) => {
  console.error("SQL execution failed:", err.message);
  process.exit(1);
});
