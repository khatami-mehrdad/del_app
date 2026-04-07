import { NextResponse } from "next/server";

const packageName = "com.saharshams.del";

function getFingerprints() {
  // Configure release fingerprints in ANDROID_SHA256_CERT_FINGERPRINTS (comma-separated).
  return (process.env.ANDROID_SHA256_CERT_FINGERPRINTS ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

export function GET() {
  const fingerprints = getFingerprints();

  if (fingerprints.length === 0) {
    return NextResponse.json([]);
  }

  return NextResponse.json([
    {
      relation: ["delegate_permission/common.handle_all_urls"],
      target: {
        namespace: "android_app",
        package_name: packageName,
        sha256_cert_fingerprints: fingerprints,
      },
    },
  ]);
}
