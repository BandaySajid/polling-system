import postgres from "postgres";
import path from "path";
import config from "../config.js";
import { fileURLToPath } from "node:url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const db = postgres({
  host: config.database.host,
  database: config.database.database,
  username: config.database.user,
  port: config.database.port,
  password: config.database.password,
  debug: function (_, query) {
    console.log("[EXECUTED QUERY]:", query);
  },
});

async function init() {
  await db.file(path.join(__dirname, "tables", "init.sql"));
}

export { db, init };
