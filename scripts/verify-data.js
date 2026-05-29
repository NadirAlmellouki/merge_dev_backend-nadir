import "dotenv/config";
import pg from "pg";

const client = new pg.Client({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: { rejectUnauthorized: false },
});

const EXPECTED = {
  users: 13,
  study_sessions: 9,
  messages: 17,
  ratings: 6,
  reports: 5,
  admin_actions: 7,
};

const run = async () => {
  await client.connect();
  console.log("✓ Connexion BDD OK\n");

  const { rows } = await client.query(`
    SELECT 'users' AS table_name, COUNT(*)::int AS count FROM users
    UNION ALL SELECT 'study_sessions', COUNT(*)::int FROM study_sessions
    UNION ALL SELECT 'messages', COUNT(*)::int FROM messages
    UNION ALL SELECT 'ratings', COUNT(*)::int FROM ratings
    UNION ALL SELECT 'reports', COUNT(*)::int FROM reports
    UNION ALL SELECT 'admin_actions', COUNT(*)::int FROM admin_actions
    ORDER BY table_name;
  `);

  let allOk = true;
  console.log("Table              | Count | Attendu | Status");
  console.log("-------------------|-------|---------|--------");

  for (const row of rows) {
    const expected = EXPECTED[row.table_name];
    const ok = row.count === expected;
    if (!ok) allOk = false;
    const status = ok ? "OK" : "ECHEC";
    console.log(
      `${row.table_name.padEnd(18)} | ${String(row.count).padStart(5)} | ${String(expected).padStart(7)} | ${status}`,
    );
  }

  const { rows: sample } = await client.query(`
    SELECT r.id, r.reason, r.status, u.first_name AS reporter
    FROM reports r
    JOIN users u ON u.id = r.reporter_id
    LIMIT 2;
  `);

  console.log("\nÉchantillon reports:", sample);
  await client.end();

  process.exit(allOk ? 0 : 1);
};

run().catch((err) => {
  console.error("✗ Erreur:", err.message);
  process.exit(1);
});
