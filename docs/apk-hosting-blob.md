# APK Hosting: Migrate from GitHub Releases to Vercel Blob

## Problem

The APK download (64.9 MB) from GitHub Releases stalls at 99% on Android Chrome.
This is a known issue with GitHub's multi-hop CDN redirect chain on mobile browsers.
The current download URL points to:

```
https://github.com/khatami-mehrdad/del_app/releases/download/preview-android-latest/del-preview-android-latest.apk
```

## Current State

- A Vercel Blob store named `apk-downloads` (`store_PdoxGtCASGFMFpb1`) was created
  but the `BLOB_READ_WRITE_TOKEN` was not properly linked to project environment variables.
- Several orphan stores were also created during troubleshooting:
  `del-apk`, `del-downloads`, `del-app-apk` — these can be deleted.

## Steps to Complete

### 1. Link the Blob store token to the project

Go to the [Vercel Dashboard](https://vercel.com) > `del-app-web` > Settings > Environment Variables.

Verify `BLOB_READ_WRITE_TOKEN` exists and is scoped to **Production, Preview, and Development**.
If missing, go to Storage > `apk-downloads` > Settings to find the read-write token and add it
manually as an environment variable.

### 2. Upload the APK to Vercel Blob

Once the token is available locally:

```bash
npx vercel env pull apps/web/.env.local --yes
source apps/web/.env.local

npx vercel blob put del-preview-android-latest.apk \
  --pathname del-preview-android-latest.apk \
  < /path/to/del-preview-android-latest.apk
```

Or download from GitHub first:

```bash
gh release download preview-android-latest -p "*.apk" -D /tmp
npx vercel blob put del-preview-android-latest.apk \
  --pathname del-preview-android-latest.apk \
  < /tmp/del-preview-android-latest.apk
```

The command will output a public URL like:
`https://<store-id>.public.blob.vercel-storage.com/del-preview-android-latest.apk`

### 3. Update the APK download URL

Update the `NEXT_PUBLIC_APK_DOWNLOAD_URL` environment variable in:

- **Vercel** (Production + Development):
  ```bash
  # Remove old value
  npx vercel env rm NEXT_PUBLIC_APK_DOWNLOAD_URL production --yes
  npx vercel env rm NEXT_PUBLIC_APK_DOWNLOAD_URL development --yes

  # Add new Blob URL
  npx vercel env add NEXT_PUBLIC_APK_DOWNLOAD_URL production --value "<blob-url>" --yes
  npx vercel env add NEXT_PUBLIC_APK_DOWNLOAD_URL development --value "<blob-url>" --yes
  ```

- **Local** (`apps/web/.env.local`): update `NEXT_PUBLIC_APK_DOWNLOAD_URL`

### 4. Automate APK upload in CI (optional)

Update `.github/workflows/eas-build.yml` to upload the APK to Vercel Blob after
the EAS build completes, so the Blob URL always has the latest APK. This replaces
the current GitHub Release upload step.

### 5. Clean up orphan Blob stores

```bash
npx vercel blob delete-store store_tUoMW7duMlGz3JzM  # del-apk
npx vercel blob delete-store store_j9Y0TIlG7VHKEHbA  # del-apk (duplicate)
npx vercel blob delete-store store_uN7wj10dzxRTt6eA  # del-downloads
npx vercel blob delete-store store_2loU6gT6D9YDzn1x  # del-app-apk
```

Keep only `store_PdoxGtCASGFMFpb1` (`apk-downloads`).

## Alternative: Proxy Route

If Blob setup remains blocked, a fallback is to add an API route at
`/api/download-apk` that streams the APK from GitHub, avoiding the redirect
chain. This adds latency and function execution time but works without Blob.

## When Play Store is Live

Replace `NEXT_PUBLIC_APK_DOWNLOAD_URL` with the Play Store link and remove
the Blob store. The QR code on the web invite page will automatically point
to the Play Store.
