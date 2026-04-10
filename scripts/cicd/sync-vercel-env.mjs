const [, , target] = process.argv;

if (!target || !["preview", "production", "development"].includes(target)) {
  console.error(
    "Usage: node scripts/cicd/sync-vercel-env.mjs <preview|production|development>"
  );
  process.exit(1);
}

const requiredProcessEnv = ["VERCEL_TOKEN", "VERCEL_PROJECT_ID"];
const optionalTeamId = process.env.VERCEL_ORG_ID;

const requiredVercelVariables = [
  { key: "NEXT_PUBLIC_SITE_URL", type: "plain" },
  { key: "NEXT_PUBLIC_SUPABASE_URL", type: "plain" },
  { key: "NEXT_PUBLIC_SUPABASE_ANON_KEY", type: "plain" },
  { key: "SUPABASE_SERVICE_ROLE_KEY", type: "encrypted" },
];

const optionalVercelVariables = [
  { key: "APPLE_APP_SITE_ASSOCIATION_APP_IDS", type: "plain" },
  { key: "ANDROID_SHA256_CERT_FINGERPRINTS", type: "plain" },
  { key: "NEXT_PUBLIC_ACCOUNT_DELETION_EMAIL", type: "plain" },
];

const missingProcessEnv = requiredProcessEnv.filter((key) => !process.env[key]);
const missingVariables = requiredVercelVariables
  .map(({ key }) => key)
  .filter((key) => !process.env[key]);

if (missingProcessEnv.length > 0 || missingVariables.length > 0) {
  const missing = [...missingProcessEnv, ...missingVariables];
  console.error(`Missing required values for Vercel env sync: ${missing.join(", ")}`);
  process.exit(1);
}

const vercelVariables = [
  ...requiredVercelVariables,
  ...optionalVercelVariables.filter(({ key }) => Boolean(process.env[key])),
];

const query = new URLSearchParams({ upsert: "true" });
if (optionalTeamId) {
  query.set("teamId", optionalTeamId);
}

const response = await fetch(
  `https://api.vercel.com/v10/projects/${process.env.VERCEL_PROJECT_ID}/env?${query}`,
  {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.VERCEL_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(
      vercelVariables.map(({ key, type }) => ({
        key,
        value: process.env[key],
        type,
        target: [target],
        comment: `Synced from GitHub Actions ${target} environment`,
      }))
    ),
  }
);

const body = await response.json().catch(() => null);

if (!response.ok) {
  console.error("Failed to sync Vercel environment variables.");
  console.error(JSON.stringify(body, null, 2));
  process.exit(1);
}

const failed = Array.isArray(body?.failed) ? body.failed : [];
if (failed.length > 0) {
  console.error("Some Vercel environment variables failed to sync.");
  console.error(JSON.stringify(failed, null, 2));
  process.exit(1);
}

const created = Array.isArray(body?.created) ? body.created : [body?.created].filter(Boolean);
console.log(`Synced ${created.length} Vercel environment variables for ${target}.`);
