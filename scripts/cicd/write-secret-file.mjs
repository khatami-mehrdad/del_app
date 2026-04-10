import { chmod, mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

const [, , outputPath, envKey] = process.argv;

if (!outputPath || !envKey) {
  console.error(
    "Usage: node scripts/cicd/write-secret-file.mjs <output-path> <ENV_KEY>"
  );
  process.exit(1);
}

const value = process.env[envKey];

if (!value) {
  console.error(`Missing required secret value: ${envKey}`);
  process.exit(1);
}

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, value.endsWith("\n") ? value : `${value}\n`, "utf8");
await chmod(outputPath, 0o600);

console.log(`Wrote ${envKey} to ${outputPath}`);
