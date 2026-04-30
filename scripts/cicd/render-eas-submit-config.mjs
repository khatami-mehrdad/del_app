import { readFile, writeFile } from "node:fs/promises";

const easJsonPath = new URL("../../apps/mobile/eas.json", import.meta.url);
const easJson = JSON.parse(await readFile(easJsonPath, "utf8"));

const ascAppId = process.env.APP_STORE_CONNECT_APP_ID;
const googleServiceAccountPath =
  process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_PATH ?? "./.secrets/google-play-service-account.json";

const nextSubmit = {
  ...(easJson.submit ?? {}),
  preview: {
    ...(easJson.submit?.preview ?? {}),
  },
  internal: {
    ...(easJson.submit?.internal ?? {}),
  },
  production: {
    ...(easJson.submit?.production ?? {}),
  },
};

if (ascAppId) {
  nextSubmit.preview.ios = {
    ...(nextSubmit.preview.ios ?? {}),
    ascAppId,
  };
  nextSubmit.internal.ios = {
    ...(nextSubmit.internal.ios ?? {}),
    ascAppId,
  };
  nextSubmit.production.ios = {
    ...(nextSubmit.production.ios ?? {}),
    ascAppId,
  };
}

if (process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_JSON) {
  nextSubmit.preview.android = {
    ...(nextSubmit.preview.android ?? {}),
    serviceAccountKeyPath: googleServiceAccountPath,
    track: "internal",
    changesNotSentForReview: true,
  };
  nextSubmit.internal.android = {
    ...(nextSubmit.internal.android ?? {}),
    serviceAccountKeyPath: googleServiceAccountPath,
    track: "internal",
    changesNotSentForReview: true,
  };
  nextSubmit.production.android = {
    ...(nextSubmit.production.android ?? {}),
    serviceAccountKeyPath: googleServiceAccountPath,
    track: "production",
    releaseStatus: "completed",
  };
}

easJson.submit = nextSubmit;

await writeFile(easJsonPath, `${JSON.stringify(easJson, null, 2)}\n`, "utf8");

console.log("Updated apps/mobile/eas.json submit profiles for CI.");
