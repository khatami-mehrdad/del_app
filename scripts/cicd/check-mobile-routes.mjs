import { readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const tabsDir = path.join(repoRoot, "apps/mobile/app/(tabs)");
const allowedEntries = new Set(["_layout.tsx", "index.tsx", "messages.tsx", "journey.tsx"]);

const entries = await readdir(tabsDir, { withFileTypes: true });
const unexpected = entries
  .filter((entry) => !allowedEntries.has(entry.name))
  .map((entry) => `${entry.name}${entry.isDirectory() ? "/" : ""}`);

if (unexpected.length > 0) {
  console.error("Unexpected Expo Router entries under apps/mobile/app/(tabs):");
  for (const entry of unexpected) {
    console.error(`- ${entry}`);
  }
  console.error(
    "Move helper components outside app/(tabs), e.g. to apps/mobile/components/."
  );
  process.exit(1);
}

console.log("Mobile tab route check passed.");
