import type { ExpoConfig } from "expo/config";

/**
 * Hostname of the web app that serves /client-invite and /.well-known/* (no scheme, no path).
 * Must match NEXT_PUBLIC_SITE_URL on Vercel so universal / app links verify.
 * @example del.saharshams.com or app.yourdomain.com
 */
const webAppHost =
  process.env.EXPO_PUBLIC_WEB_APP_HOST?.replace(/^https?:\/\//, "").split("/")[0] ||
  "del.saharshams.com";
const googleServicesFile = process.env.GOOGLE_SERVICES_JSON;

const config: ExpoConfig = {
  name: "Del",
  slug: "del-companion",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  scheme: "del-companion",
  userInterfaceStyle: "automatic",
  newArchEnabled: false,
  splash: {
    image: "./assets/images/splash-icon.png",
    resizeMode: "contain",
    backgroundColor: "#1C1410",
  },
  ios: {
    supportsTablet: false,
    bundleIdentifier: "com.saharshams.del",
    associatedDomains: [`applinks:${webAppHost}`],
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
    },
  },
  android: {
    package: "com.saharshams.del",
    ...(googleServicesFile ? { googleServicesFile } : {}),
    adaptiveIcon: {
      foregroundImage: "./assets/images/adaptive-icon.png",
      backgroundColor: "#1C1410",
    },
    edgeToEdgeEnabled: true,
    predictiveBackGestureEnabled: false,
    permissions: [
      "RECORD_AUDIO",
      "android.permission.RECORD_AUDIO",
      "android.permission.MODIFY_AUDIO_SETTINGS",
      "android.permission.POST_NOTIFICATIONS",
      "android.permission.RECEIVE_BOOT_COMPLETED",
    ],
    intentFilters: [
      {
        action: "VIEW",
        autoVerify: true,
        data: [
          {
            scheme: "https",
            host: webAppHost,
            pathPrefix: "/client-invite",
          },
        ],
        category: ["BROWSABLE", "DEFAULT"],
      },
    ],
  },
  web: {
    bundler: "metro",
    output: "static",
    favicon: "./assets/images/favicon.png",
  },
  plugins: [
    "expo-router",
    "expo-secure-store",
    [
      "expo-av",
      {
        microphonePermission:
          "Del needs access to your microphone to record voice notes.",
      },
    ],
    [
      "expo-notifications",
      {
        sounds: [],
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    router: {},
    eas: {
      projectId: "98aace21-656f-487b-ace3-1d93a2536371",
    },
  },
};

export default config;
