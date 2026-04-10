import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

const [, , outputPath, ...keys] = process.argv;

if (!outputPath || keys.length === 0) {
  console.error("Usage: node scripts/cicd/write-dotenv.mjs <output-path> <ENV_KEY> [ENV_KEY...]");
  process.exit(1);
}

const missingKeys = keys.filter((key) => !process.env[key]);

if (missingKeys.length > 0) {
  console.error(`Missing required environment values: ${missingKeys.join(", ")}`);
  process.exit(1);
}

const lines = keys.map((key) => `${key}=${JSON.stringify(process.env[key])}`);

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${lines.join("\n")}\n`, "utf8");

console.log(`Wrote ${keys.length} values to ${outputPath}`);
