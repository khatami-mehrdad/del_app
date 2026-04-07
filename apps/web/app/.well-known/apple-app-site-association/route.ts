import { NextResponse } from "next/server";

function getAppIds() {
  // Configure TEAMID.bundleId values in APPLE_APP_SITE_ASSOCIATION_APP_IDS (comma-separated).
  return (process.env.APPLE_APP_SITE_ASSOCIATION_APP_IDS ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

export function GET() {
  const appIds = getAppIds();

  return NextResponse.json({
    applinks: {
      apps: [],
      details: appIds.map((appID) => ({
        appID,
        paths: ["/client-invite", "/client-invite/*"],
      })),
    },
  });
}
