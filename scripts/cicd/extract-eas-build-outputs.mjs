import { appendFile, readFile } from "node:fs/promises";

const [, , inputPath] = process.argv;

if (!inputPath) {
  console.error("Usage: node scripts/cicd/extract-eas-build-outputs.mjs <eas-build.json>");
  process.exit(1);
}

const rawJson = await readFile(inputPath, "utf8");
const parsed = JSON.parse(rawJson);
const builds = Array.isArray(parsed) ? parsed : [parsed];

function getBuildUrl(build) {
  return (
    build?.buildUrl ??
    build?.artifacts?.buildUrl ??
    build?.artifacts?.applicationArchiveUrl ??
    ""
  );
}

const outputs = {
  build_count: String(builds.length),
  build_ids: JSON.stringify(builds.map((build) => build?.id).filter(Boolean)),
  ios_build_id: "",
  ios_build_url: "",
  android_build_id: "",
  android_build_url: "",
};

for (const build of builds) {
  if (build?.platform === "ios") {
    outputs.ios_build_id = build.id ?? "";
    outputs.ios_build_url = getBuildUrl(build);
  }

  if (build?.platform === "android") {
    outputs.android_build_id = build.id ?? "";
    outputs.android_build_url = getBuildUrl(build);
  }
}

const githubOutput = process.env.GITHUB_OUTPUT;
if (githubOutput) {
  const lines = Object.entries(outputs).map(([key, value]) => `${key}=${value}`);
  await appendFile(githubOutput, `${lines.join("\n")}\n`, "utf8");
}

const githubSummary = process.env.GITHUB_STEP_SUMMARY;
if (githubSummary) {
  const summary = [
    "## EAS build outputs",
    "",
    `- Total builds: ${outputs.build_count}`,
    `- iOS build ID: ${outputs.ios_build_id || "n/a"}`,
    `- Android build ID: ${outputs.android_build_id || "n/a"}`,
    `- iOS artifact URL: ${outputs.ios_build_url || "n/a"}`,
    `- Android artifact URL: ${outputs.android_build_url || "n/a"}`,
    "",
  ].join("\n");
  await appendFile(githubSummary, summary, "utf8");
}

console.log(JSON.stringify(outputs, null, 2));
