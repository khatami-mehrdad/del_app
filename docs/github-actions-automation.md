# GitHub-first CI/CD runbook

This repo now treats **GitHub Actions + GitHub Environments** as the operational source of truth.

- **GitHub** stores deploy/release inputs.
- **Vercel** remains the web hosting backend.
- **Expo / EAS** remains the mobile build + submission backend.
- **Apple / Google / Supabase** still require some one-time manual setup.

The workflows added in this repo are:

- [`.github/workflows/ci.yml`](../.github/workflows/ci.yml)
- [`.github/workflows/deploy-web.yml`](../.github/workflows/deploy-web.yml)
- [`.github/workflows/eas-mobile-build.yml`](../.github/workflows/eas-mobile-build.yml)
- [`.github/workflows/release-mobile.yml`](../.github/workflows/release-mobile.yml)

---

## GitHub environments

Create these **GitHub Environments**:

- `preview`
- `production`

Recommended protection:

- Add **required reviewers** to `production`
- Keep `preview` unprotected for fast internal testing

The workflows select one of these environments and read environment-scoped values from it.

---

## Repository variables

Add these as **Repository variables** in GitHub:

| Variable | Why it exists |
|----------|----------------|
| `VERCEL_ORG_ID` | Vercel CLI/API scope for deploy + env sync |
| `VERCEL_PROJECT_ID` | Target Vercel project for web deploys |
| `APP_STORE_CONNECT_APP_ID` | Required by `eas submit` for iOS uploads |
| `APP_STORE_CONNECT_KEY_ID` | App Store Connect API key ID |
| `APP_STORE_CONNECT_ISSUER_ID` | App Store Connect API issuer ID |
| `EXPO_APPLE_TEAM_ID` | Recommended for Apple-related Expo/EAS auth flows |

These are not highly sensitive, so variables are usually enough.

---

## Repository secrets

Add these as **Repository secrets** in GitHub:

| Secret | Why it exists |
|--------|----------------|
| `VERCEL_TOKEN` | Lets Actions deploy to Vercel and sync env values |
| `EXPO_TOKEN` | Lets Actions call EAS build / submit |
| `APP_STORE_CONNECT_PRIVATE_KEY` | The raw `.p8` contents for App Store Connect API auth |
| `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON` | Google Play service account JSON for Android submission |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob read/write token used by `eas-mobile-build` to publish the preview Android APK |

Notes:

- `APP_STORE_CONNECT_PRIVATE_KEY` should be pasted as the **raw private key contents**.
- `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON` should be pasted as the **entire JSON document**.

---

## Environment variables (preview + production)

Add these as **Environment variables** on both `preview` and `production`.

### Web-facing variables

| Variable | Example |
|----------|---------|
| `NEXT_PUBLIC_SITE_URL` | `https://del.saharshams.com` |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://your-project-ref.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `your-public-anon-key` |
| `APPLE_APP_SITE_ASSOCIATION_APP_IDS` | `TEAMID.com.saharshams.del` |
| `ANDROID_SHA256_CERT_FINGERPRINTS` | `AA:BB:CC:...` |

### Mobile build variables

| Variable | Example |
|----------|---------|
| `EXPO_PUBLIC_WEB_APP_HOST` | `del.saharshams.com` |
| `EXPO_PUBLIC_SUPABASE_URL` | `https://your-project-ref.supabase.co` |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | `your-public-anon-key` |

If preview and production share the same backend right now, you can set the same values in both environments and split them later.

---

## Environment secrets (preview + production)

Add this as an **Environment secret** on both `preview` and `production`:

| Secret | Why it exists |
|--------|----------------|
| `SUPABASE_SERVICE_ROLE_KEY` | Required by the web API route that sends client invites |

This is intentionally environment-scoped so preview and production can diverge later without changing workflow code.

---

## What each workflow does

### `ci.yml`

- Runs on PRs and pushes to `main`
- Detects whether web or mobile areas changed
- Runs:
  - web lint + build + Playwright smoke tests for the public login flow
  - mobile typecheck + Expo dependency compatibility check + Android JS export
  - mobile route guard that fails if helper components appear under `apps/mobile/app/(tabs)`
- Captures command output with `tee` and uploads `web-ci-logs` / `mobile-ci-logs`
  artifacts on failed CI jobs, so lint/build/export failures have downloadable logs.

### `deploy-web.yml`

- Deploys the web app from GitHub Actions to **Vercel**
- Uses GitHub Environment values as the source of truth
- Syncs these values into Vercel before deploy via the Vercel API
- Builds and deploys with the Vercel CLI
- Verifies:
  - `/.well-known/apple-app-site-association`
  - `/.well-known/assetlinks.json`

### `eas-mobile-build.yml`

- Manual workflow and reusable workflow
- Pushes the GitHub mobile env values into the matching **EAS environment**
- Waits for EAS builds to finish
- Uploads build metadata as a workflow artifact
- When `publish_android_prerelease: true` is passed on the `preview` environment, uploads the built APK to the `apk-downloads` Vercel Blob store using `BLOB_READ_WRITE_TOKEN` so the public APK URL is always fresh (see [`apk-hosting-blob.md`](./apk-hosting-blob.md))

### `release-mobile.yml`

- Calls the reusable mobile build workflow
- Uploads iOS builds to **App Store Connect / TestFlight**
- Uploads Android builds to **Google Play**

The `environment_name` input picks the release target:

| `environment_name` | EAS build profile | Android artifact | Play track | iOS | GitHub Environment | GitHub Release / Blob APK |
|---|---|---|---|---|---|---|
| `preview` | `preview` | APK | — (no Play upload) | — (no TestFlight upload) | `preview` | yes (GitHub Release + Vercel Blob) |
| `internal` | `internal` | AAB | `internal` | TestFlight | `preview` | no |
| `production` | `production` | AAB | `production` | TestFlight | `production` | no |

`internal` is the normal iteration loop once the app is in Play Console — it builds an AAB, uploads it straight to the Internal testing track via the Play Developer API, and bumps your testers' build over-the-air. No Console clicks.

Notes:

- `internal` and `preview` both use the `preview` GitHub Environment (same Supabase backend, same `EXPO_PUBLIC_*` values), so you do not need a third environment set.
- `internal` and `production` profiles both `autoIncrement` the Android `versionCode`, otherwise Play rejects the upload as a duplicate.

---

## One-time manual steps that still remain

These are normal and should not be automated first:

1. Create the Vercel project and connect it to the correct root if you have not already.
2. Disable or disconnect **Vercel Git auto-deploys** once the GitHub-driven deploy workflow is working, otherwise you will get duplicate deployments.
3. Create the app records in **App Store Connect** and **Google Play Console**.
4. Set up initial **EAS credentials** for iOS and Android if not already present.
5. Set the **Supabase redirect allow list** for `/client-invite`.
6. Copy the Apple Team ID, App Store Connect App ID, and Play signing fingerprint into GitHub.

---

## Important caveats

- **GitHub runner env is not enough for EAS builds.** The workflow explicitly syncs `EXPO_PUBLIC_*` values into EAS before building.
- **iOS final App Store release is not fully automatic through EAS Submit.** The workflow uploads the build to App Store Connect / TestFlight, but app review / release state still finishes in Apple’s systems.
- **Android production automation works only after the first manual store setup.**
- **Changing `EXPO_PUBLIC_WEB_APP_HOST` requires new mobile binaries**, because universal/app-link entitlements are embedded in the app.

---

## Recommended setup order

1. Add the repository variables and secrets.
2. Add `preview` and `production` environment variables/secrets.
3. Run `CI` on a branch and confirm it passes.
4. Run `Deploy web` for `preview`, then `production`.
5. Run `EAS mobile build` for `preview`.
6. Run `Release mobile` once store credentials and app records are ready.

---

## Quick checklist

- GitHub Environment `preview` created
- GitHub Environment `production` created with reviewers
- Repo variables added
- Repo secrets added
- Environment variables added for both envs
- Environment secret `SUPABASE_SERVICE_ROLE_KEY` added for both envs
- Vercel auto Git deploy disabled after CLI deploy works
