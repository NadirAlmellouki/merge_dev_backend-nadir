import "dotenv/config";
import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const BASE = `http://localhost:${process.env.PORT || 3000}`;

const log = (icon, msg) => console.log(`${icon} ${msg}`);

const runStep = async (name, fn) => {
  try {
    await fn();
    log("✓", name);
    return true;
  } catch (err) {
    log("✗", `${name} — ${err.message}`);
    return false;
  }
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const fetchJson = async (url) => {
  const res = await fetch(url);
  const body = await res.json();
  if (!res.ok) throw new Error(`${res.status} — ${body.message || JSON.stringify(body)}`);
  return body;
};

// ── 1. Imports ─────────────────────────────────────────────
let ok = true;
ok = (await runStep("Imports des modèles", async () => {
  const { setupAssociations } = await import("../src/models/associations.js");
  setupAssociations();
})) && ok;

// ── 2. BDD ─────────────────────────────────────────────────
ok =
  (await runStep("Connexion BDD + comptage des tables", async () => {
    const { default: pg } = await import("pg");
    const client = new pg.Client({
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      ssl: { rejectUnauthorized: false },
    });
    await client.connect();

    const expected = {
      users: 13,
      study_sessions: 9,
      messages: 17,
      ratings: 6,
      reports: 5,
      admin_actions: 7,
    };

    const { rows } = await client.query(`
      SELECT 'users' AS t, COUNT(*)::int AS c FROM users
      UNION ALL SELECT 'study_sessions', COUNT(*)::int FROM study_sessions
      UNION ALL SELECT 'messages', COUNT(*)::int FROM messages
      UNION ALL SELECT 'ratings', COUNT(*)::int FROM ratings
      UNION ALL SELECT 'reports', COUNT(*)::int FROM reports
      UNION ALL SELECT 'admin_actions', COUNT(*)::int FROM admin_actions;
    `);

    for (const { t, c } of rows) {
      if (c !== expected[t]) {
        throw new Error(`${t}: ${c} lignes (attendu ${expected[t]}) — lancez npm run db:setup`);
      }
    }
    await client.end();
    console.log("   Données:", Object.fromEntries(rows.map((r) => [r.t, r.c])));
  })) && ok;

if (!ok) {
  console.log("\n→ Corrigez la BDD puis relancez : npm run db:setup && npm run test:all");
  process.exit(1);
}

// ── 3. Serveur HTTP ────────────────────────────────────────
const server = spawn("node", ["src/server.js"], {
  cwd: root,
  stdio: ["ignore", "pipe", "pipe"],
  env: process.env,
});

let serverReady = false;
server.stdout.on("data", (d) => {
  const s = d.toString();
  if (s.includes("Server running")) serverReady = true;
});

await sleep(4000);

ok =
  (await runStep(`GET ${BASE}/`, async () => {
    const res = await fetch(`${BASE}/`);
    if (!res.ok) throw new Error(`status ${res.status}`);
    const text = await res.text();
    if (!text.includes("StudySync")) throw new Error("réponse inattendue");
  })) && ok;

ok =
  (await runStep(`GET ${BASE}/api/health`, async () => {
    const body = await fetchJson(`${BASE}/api/health`);
    if (!body.success) throw new Error(body.message);
    console.log("   BDD via API:", body.database);
  })) && ok;

server.kill();
process.exit(ok ? 0 : 1);
