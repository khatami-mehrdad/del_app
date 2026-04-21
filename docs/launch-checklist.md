# Launch checklist

This is the shortest path from the current repo state to working web + mobile releases.

## Already done in the repo

- GitHub Actions CI/CD workflows are in place:
  - `.github/workflows/ci.yml`
  - `.github/workflows/deploy-web.yml`
  - `.github/workflows/eas-mobile-build.yml`
  - `.github/workflows/release-mobile.yml`
- GitHub environment values already point to:
  - `NEXT_PUBLIC_SITE_URL=https://del.saharshams.com`
  - `EXPO_PUBLIC_WEB_APP_HOST=del.saharshams.com`
- Local env files and app defaults were updated to the custom domain.
- `del.saharshams.com` has been connected to Vercel DNS.

## Do next

### 1. Supabase URL configuration

In Supabase:

1. Open `Authentication` -> `URL Configuration`
2. Set `Site URL` to:
   - `https://del.saharshams.com`
3. Add this redirect URL:
   - `https://del.saharshams.com/client-invite`

Why:

- invite links and auth redirects must match the domain now used by the web app and the mobile universal links.

### 2. Add the remaining GitHub values

Still missing in GitHub:

#### Repository secret

- `VERCEL_TOKEN`

#### Environment variables (`Preview` and `Production`)

- `APPLE_APP_SITE_ASSOCIATION_APP_IDS`
- `ANDROID_SHA256_CERT_FINGERPRINTS`

#### Repository variables

- `APP_STORE_CONNECT_APP_ID`
- `APP_STORE_CONNECT_KEY_ID`
- `APP_STORE_CONNECT_ISSUER_ID`
- `EXPO_APPLE_TEAM_ID`

#### Repository secrets

- `APP_STORE_CONNECT_PRIVATE_KEY`
- `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON`

### 3. Deploy the web app from GitHub

In GitHub Actions:

1. Run `Deploy web`
2. First run it for `Preview`
3. Then run it for `Production`

After production deploy, verify:

- `https://del.saharshams.com/.well-known/apple-app-site-association`
- `https://del.saharshams.com/.well-known/assetlinks.json`
- `https://del.saharshams.com/client-invite`

### 4. Put a privacy policy live

This is needed for Play Console and is likely your next blocker.

The web app already serves the page shells; what's missing is the finalized copy:

- `apps/web/app/privacy/page.tsx` → `https://del.saharshams.com/privacy`
- `apps/web/app/delete-account/page.tsx` → `https://del.saharshams.com/delete-account`

Set `NEXT_PUBLIC_ACCOUNT_DELETION_EMAIL` in Vercel (and GitHub env if you sync from there) so the page shows the correct inbox.

What the privacy copy needs to cover:

- account information
- invite-based sign-in
- messages between coach and client
- check-ins and journal-like text
- voice notes / audio uploads
- how users can contact you

Give me the contact email and legal entity name you want on the privacy page and I can fill in the copy.

### 5. Finish the Play Console declarations

Use these answers unless you know a section should be different for business reasons.

#### App access

- choose: `Some or all functionality is restricted`
- reason: invited clients must sign in to use the app

Suggested explanation:

`The app is for invited clients only. A coach invites the client, the client creates a password, and then signs in to access check-ins, messaging, and voice notes.`

#### Ads

- `No`

#### Target audience

- safest answer: `18+`

#### Government apps

- `No`

#### Financial features

- `No`

#### Health

- `No`

This product currently looks like coaching / wellness support, not a regulated medical app.

#### Category

- recommended: `Health & Fitness`

#### Contact details

- use a real email you monitor

#### Data safety

Disclose collection of:

- name / email / account identifiers
- messages
- check-in text
- voice notes / audio files
- user-generated content

Do not claim features you do not actually support, such as self-service deletion, data portability, or end-to-end encryption.

### 6. Set up Google Play API access

In Play Console:

1. Go to `Users and permissions` -> `API access`
2. Link a Google Cloud project
3. Create a service account
4. Grant that service account access to this app
5. Create and download a JSON key

That JSON becomes:

- GitHub repository secret: `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON`

### 7. Get the Android signing fingerprint

In Play Console:

1. Go to `Test and release` -> `App integrity`
2. Copy the `App signing key certificate` SHA-256 fingerprint

That value becomes:

- GitHub environment variable: `ANDROID_SHA256_CERT_FINGERPRINTS`

Important:

- use the app signing fingerprint, not the upload key

If the signing fingerprint is not visible yet:

1. do the first internal testing upload
2. let Play finish signing setup
3. return to `App integrity`

### 8. Start Android testing

Because new personal Play accounts require testing before production:

1. Create an `Internal testing` release first
2. Upload the first Android build
3. Then create a `Closed testing` track
4. Add at least `12` testers
5. Keep them opted in for at least `14` consecutive days

Only after that can you apply for production access.

### 9. Trigger mobile builds from GitHub

After Play + Apple credentials are in place:

1. Run `EAS mobile build` for `preview`
2. Leave `publish_android_prerelease` enabled when you want the latest Android preview APK to be uploaded to GitHub Releases automatically
3. Share the stable prerelease page `preview-android-latest` or its direct APK asset URL
4. Run `Release mobile` when you want store submission

What that does:

- iOS: uploads to App Store Connect / TestFlight
- Android: submits to Google Play
- Preview Android builds can also refresh a stable GitHub prerelease APK for direct side-loading outside the stores

### 10. iOS values you still need to collect

From Apple:

- `APP_STORE_CONNECT_APP_ID`
- `APP_STORE_CONNECT_KEY_ID`
- `APP_STORE_CONNECT_ISSUER_ID`
- `APP_STORE_CONNECT_PRIVATE_KEY`
- `EXPO_APPLE_TEAM_ID`

These are needed before the iOS GitHub release flow can work end to end.

## Best order from here

1. Update Supabase URLs
2. Add `VERCEL_TOKEN`
3. Run `Deploy web`
4. Put privacy policy live
5. Finish Play Console declarations
6. Create Play service account + download JSON
7. Copy Play signing SHA-256
8. Give those values to GitHub
9. Run Android internal testing
10. Collect the Apple values and finish the iOS side

## When to come back to me

Come back with any of these and I can continue the setup for you:

- `VERCEL_TOKEN`
- `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON`
- `ANDROID_SHA256_CERT_FINGERPRINTS`
- Apple App Store Connect values
- the contact email / legal entity name you want on the privacy policy page
