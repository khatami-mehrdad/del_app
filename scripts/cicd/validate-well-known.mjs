function normalizeBaseUrl(rawUrl) {
  const baseUrl = rawUrl?.replace(/\/$/, "");
  if (!baseUrl || !/^https?:\/\//.test(baseUrl)) {
    throw new Error(`Expected an absolute base URL, received: ${rawUrl ?? "<empty>"}`);
  }
  return baseUrl;
}

function parseCsv(rawValue) {
  return (rawValue ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

const [, , rawBaseUrl] = process.argv;
const baseUrl = normalizeBaseUrl(rawBaseUrl);
const expectedAppIds = parseCsv(process.env.APPLE_APP_SITE_ASSOCIATION_APP_IDS);
const expectedFingerprints = parseCsv(process.env.ANDROID_SHA256_CERT_FINGERPRINTS);
const expectedPackageName = process.env.ANDROID_PACKAGE_NAME ?? "com.saharshams.del";

async function getJson(pathname) {
  const response = await fetch(`${baseUrl}${pathname}`);
  if (!response.ok) {
    throw new Error(`Request failed for ${pathname}: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

const appleAssociation = await getJson("/.well-known/apple-app-site-association");
const androidAssetLinks = await getJson("/.well-known/assetlinks.json");

if (!Array.isArray(appleAssociation?.applinks?.details)) {
  throw new Error("apple-app-site-association is missing applinks.details.");
}

if (expectedAppIds.length > 0) {
  const actualAppIds = appleAssociation.applinks.details.map((detail) => detail.appID);
  for (const appId of expectedAppIds) {
    if (!actualAppIds.includes(appId)) {
      throw new Error(`apple-app-site-association is missing expected appID ${appId}.`);
    }
  }
}

for (const detail of appleAssociation.applinks.details) {
  const paths = Array.isArray(detail.paths) ? detail.paths : [];
  if (!paths.includes("/client-invite") || !paths.includes("/client-invite/*")) {
    throw new Error(
      `apple-app-site-association entry ${detail.appID ?? "<unknown>"} is missing /client-invite paths.`
    );
  }
}

if (!Array.isArray(androidAssetLinks)) {
  throw new Error("assetlinks.json must be an array.");
}

if (expectedFingerprints.length > 0) {
  const matchingAndroidTarget = androidAssetLinks.find((entry) => {
    const relation = Array.isArray(entry?.relation) ? entry.relation : [];
    return (
      relation.includes("delegate_permission/common.handle_all_urls") &&
      entry?.target?.package_name === expectedPackageName
    );
  });

  if (!matchingAndroidTarget) {
    throw new Error(`assetlinks.json is missing package ${expectedPackageName}.`);
  }

  const actualFingerprints = Array.isArray(matchingAndroidTarget.target.sha256_cert_fingerprints)
    ? matchingAndroidTarget.target.sha256_cert_fingerprints
    : [];
  for (const fingerprint of expectedFingerprints) {
    if (!actualFingerprints.includes(fingerprint)) {
      throw new Error(`assetlinks.json is missing fingerprint ${fingerprint}.`);
    }
  }
}

console.log(`Validated Apple and Android well-known files at ${baseUrl}.`);
