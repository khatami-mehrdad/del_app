# del App Context

## What this repo is

`del_app` is a monorepo for the del companion product:

- `apps/mobile`: client mobile app (Expo / React Native)
- `apps/web`: coach dashboard built with Next.js App Router
- `packages/shared` (`@del/shared`): shared product types, schemas, constants
- `packages/supabase-client` (`@del/supabase`): Supabase client factory and generated DB types
- `packages/data` (`@del/data`): shared queries/mutations/auth hooks used by both web and mobile
- `supabase`: schema, edge functions, and local Supabase config
- `docs/SPEC.md`: product/design spec

## Current web app shape

The web app is a coach dashboard, not a marketing site.

Main routes today:

- `/`: dashboard home for authenticated coach users
- `/clients/[id]`: client detail dashboard
- `/login`, `/forgot-password`, `/reset-password`: auth screens
- `/auth/callback`: Supabase auth callback handler
- `/client-invite`: invite landing page (also target of iOS Universal Links / Android App Links)
- `/privacy`: privacy policy page
- `/delete-account`: account deletion contact page
- `/.well-known/apple-app-site-association` and `/.well-known/assetlinks.json`: universal/app link association files served from env
- `/api/add-client`: creates a client user + program, sends invite
- `/api/ensure-profile`: repairs a missing profile row for an authenticated user when auth metadata has a valid role
- `/api/client-status`, `/api/resend-invite`, `/api/delete-client`: client management endpoints

There is no public landing page yet.

## Auth and data flow

- Client auth state is managed in `apps/web/lib/auth-context.tsx`
- Browser Supabase client is created in `apps/web/lib/supabase.ts` with Supabase SSR
  cookie storage so Next proxy can read authenticated sessions
- `apps/web/proxy.ts` redirects unauthenticated `/` and `/clients/*` requests to `/login`
- Dashboard pages are wrapped by `apps/web/app/(dashboard)/layout.tsx`
- The dashboard guard redirects unauthenticated users to `/login`

Important behavior:

- The redirect from `/` or `/clients/*` to `/login` now happens in middleware before dashboard HTML is served
- `DashboardGuard` remains as a client-side role/profile guard after the middleware session check

This supersedes the older blank-root behavior described below.

## Vercel finding on 2026-04-07

Observed behavior on `https://del-app-web.vercel.app`:

- `GET /` returned `200`
- The page initially rendered as a blank shell
- After ~2 seconds, the app redirected to `/login`
- `/login` rendered normally
- No browser console errors were observed during that redirect

Historical conclusion:

- The deployment is up
- The blank screen at the root was caused by client-side redirect timing, not a failed deploy
- Current code now redirects logged-out dashboard requests in middleware

## Environment dependencies

The web app depends on these environment variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server-only)
- `NEXT_PUBLIC_SITE_URL` (canonical HTTPS origin used by invite `redirectTo` and smoke checks)
- `APPLE_APP_SITE_ASSOCIATION_APP_IDS` (comma-separated `TEAMID.bundleId`, served from `/.well-known/apple-app-site-association`)
- `ANDROID_SHA256_CERT_FINGERPRINTS` (comma-separated SHA-256, served from `/.well-known/assetlinks.json`)
- `NEXT_PUBLIC_APK_DOWNLOAD_URL` (APK link shown on the client-invite page; currently points at Vercel Blob)
- `NEXT_PUBLIC_ACCOUNT_DELETION_EMAIL` (inbox shown on `/delete-account`)

Where they are used:

- `apps/web/lib/supabase.ts`: browser client
- `apps/web/proxy.ts`: dashboard route auth check
- `apps/web/lib/supabase-server.ts`: server-side client helper
- `apps/web/app/api/add-client/route.ts`: admin client for creating users/programs, uses `NEXT_PUBLIC_SITE_URL` for invite redirects
- `apps/web/app/api/ensure-profile/route.ts`: admin client for repairing missing profile rows after auth sign-in
- `apps/web/app/.well-known/apple-app-site-association/route.ts` and `assetlinks.json/route.ts`: read the universal/app link env vars
- `apps/web/app/client-invite/ClientInviteScreen.tsx`: reads `NEXT_PUBLIC_APK_DOWNLOAD_URL`
- `apps/web/app/delete-account/page.tsx`: reads `NEXT_PUBLIC_ACCOUNT_DELETION_EMAIL`

Notes:

- Local production build succeeds when `apps/web/.env.local` is present
- `SUPABASE_SERVICE_ROLE_KEY` is required for `/api/add-client`
- Missing public Supabase vars would break auth/data access in the browser
- A checked-in template exists at `apps/web/.env.example`

The mobile app depends on these environment variables:

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- `EXPO_PUBLIC_WEB_APP_HOST` (hostname only; drives iOS `associatedDomains` and Android intent filters in `app.config.ts`)

Notes:

- These must be present both for local Expo runs and for EAS Android/iOS builds
- Do not put `SUPABASE_SERVICE_ROLE_KEY` into the mobile app build environment
- A checked-in template exists at `apps/mobile/.env.example`
- `EXPO_PUBLIC_WEB_APP_HOST` must match the hostname in `NEXT_PUBLIC_SITE_URL`; changing it requires new store builds

## Supabase model summary

Defined across these migrations:

- `supabase/migrations/001_initial_schema.sql`: core tables + RLS + auth trigger
- `supabase/migrations/002_push_notification_triggers.sql`: push notification triggers
- `supabase/migrations/003_checkin_coach_read.sql`: coach-read marker on check-ins
- `supabase/migrations/004_issue_report_fixes.sql`: issue-audit fixes for check-in RLS,
  voice-note storage visibility, read/query indexes, push trigger settings, and
  voice-note field pairing constraints

Core tables:

- `profiles`
- `programs`
- `practices`
- `checkins`
- `messages`
- `journey_entries`
- `push_tokens`

The schema enables RLS and includes an auth trigger that creates a `profiles` row for new users.

Edge functions:

- `supabase/functions/send-push`: sends push notifications via Expo push service

Email templates for Supabase Auth live in `supabase/templates/` (invite, confirm signup, reset password).

## Known product/code mismatches

- `docs/SPEC.md` mentions `del.saharshams.com/dashboard`, but the current web app uses `/` as the dashboard root

## Android release note on 2026-04-07

Observed symptom:

- The Android app APK installed successfully but closed immediately on launch

Relevant findings:

- Mobile startup depended on `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- If those values are missing at build time, the app could fail before rendering a screen
- The repo previously still contained leftover Expo starter files that pulled in `expo-web-browser`
- `apps/mobile/app.json` had `newArchEnabled: true`; this can be risky in Expo SDK 54 Android release builds

Changes made:

- Added a safer mobile startup path so missing public Supabase env no longer hard-crashes the app during initialization
- Added an in-app error screen for missing mobile Supabase env
- Set `newArchEnabled` to `false` in `apps/mobile/app.config.ts`
- Removed unused Expo starter files (`StyledText`, `Themed`, `useColorScheme`, `useClientOnlyValue`, starter `constants/Colors.ts`, `components/__tests__/StyledText-test.js`) and the unnecessary `expo-web-browser` dependency
- Rewrote `apps/mobile/app/+not-found.tsx` to use `lib/theme.ts` instead of the starter Themed wrapper
- Removed unused `react-native-reanimated` and `react-native-worklets` because they forced Android new architecture during release builds
- Added `apps/mobile/.env.example`

Next rebuild checklist:

1. Ensure `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` are configured for the EAS build profile/environment
2. Rebuild the Android app; previously downloaded APKs will still contain the old startup behavior
3. If it still closes on launch, collect Android device logs from `adb logcat` or Play Console crash reporting for the new build

## Rules alignment note on 2026-04-07

The repo was partially brought into alignment with `.cursor/rules`:

- Web reusable components were converted from default exports to named exports
- The mobile Expo starter leftovers were removed
- The mobile `Colors` constant now uses a named export
- `apps/web/app/(auth)/layout.tsx` no longer uses `"use client"`
- The web dashboard no longer renders a blank `null` state for logged-out users
