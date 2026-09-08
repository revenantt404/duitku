import fs from "node:fs";
import path from "node:path";

// tsx tidak load .env* otomatis (seperti `next dev`), jadi load manual.
// Prioritas: env proses > .env.local > .env. Nilai TIDAK pernah di-print.
function loadEnvFile(file: string) {
  let text: string;
  try {
    text = fs.readFileSync(path.join(process.cwd(), file), "utf8");
  } catch {
    return;
  }
  for (const line of text.split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq < 0) continue;
    const key = t.slice(0, eq).trim();
    if (!key || process.env[key] !== undefined) continue;
    let val = t.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    process.env[key] = val;
  }
}

loadEnvFile(".env.local");
loadEnvFile(".env");

async function main() {
  const { prisma } = await import("../lib/prisma");
  try {
    await prisma.$queryRawUnsafe("SELECT 1");
    console.log("DB OK");
  } catch (e: any) {
    console.log("DB FAIL", e?.code ?? e?.name ?? "unknown");
    console.log(String(e?.message ?? e).split("\n")[0]);
  } finally {
    await prisma.$disconnect();
  }
}

void main();
