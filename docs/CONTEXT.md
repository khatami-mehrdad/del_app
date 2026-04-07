# del App Context

## What this repo is

`del_app` is a monorepo for the del companion product:

- `apps/mobile`: client mobile app
- `apps/web`: coach dashboard built with Next.js App Router
- `packages/shared`: shared types/models
- `packages/supabase-client`: shared Supabase client factory and generated DB types
- `supabase`: schema and local Supabase config
- `docs/SPEC.md`: product/design spec

## Current web app shape

The web app is a coach dashboard, not a marketing site.

Main routes today:

- `/`: dashboard home for authenticated coach users
- `/clients/[id]`: client detail dashboard
- `/login`: auth screen
- `/api/add-client`: server route that creates a client user and program

There is no public landing page yet.

## Auth and data flow

- Client auth state is managed in `apps/web/lib/auth-context.tsx`
- Browser Supabase client is created in `apps/web/lib/supabase.ts`
- Dashboard pages are wrapped by `apps/web/app/(dashboard)/layout.tsx`
- The dashboard guard redirects unauthenticated users to `/login`

Important behavior:

- The redirect from `/` to `/login` is client-side, not server-side
- In `DashboardGuard`, once auth loading finishes and there is no user, the component keeps rendering a loading/redirect state and triggers `router.replace("/login")`
- Result: the current repo no longer renders a blank `null` state for logged-out dashboard visits, but it still relies on a client-side redirect rather than a server-side one

This likely explains the blank Vercel preview/screenshot at the site root.

## Vercel finding on 2026-04-07

Observed behavior on `https://del-app-web.vercel.app`:

- `GET /` returned `200`
- The page initially rendered as a blank shell
- After ~2 seconds, the app redirected to `/login`
- `/login` rendered normally
- No browser console errors were observed during that redirect

Conclusion:

- The deployment is up
- The blank screen at the root is currently expected behavior for logged-out users because the redirect happens on the client
- This is a UX/routing issue, not a failed deploy

## Environment dependencies

The web app depends on these environment variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Where they are used:

- `apps/web/lib/supabase.ts`: browser client
- `apps/web/lib/supabase-server.ts`: server-side client helper
- `apps/web/app/api/add-client/route.ts`: admin client for creating users/programs

Notes:

- Local production build succeeds when `apps/web/.env.local` is present
- `SUPABASE_SERVICE_ROLE_KEY` is required for `/api/add-client`
- Missing public Supabase vars would break auth/data access in the browser

The mobile app depends on these environment variables:

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`

Notes:

- These must be present both for local Expo runs and for EAS Android/iOS builds
- Do not put `SUPABASE_SERVICE_ROLE_KEY` into the mobile app build environment
- A checked-in template now exists at `apps/mobile/.env.example`

## Supabase model summary

Defined in `supabase/migrations/001_initial_schema.sql`.

Core tables:

- `profiles`
- `programs`
- `practices`
- `checkins`
- `messages`
- `journey_entries`
- `push_tokens`

The schema enables RLS and includes an auth trigger that creates a `profiles` row for new users.

## Known product/code mismatches

- `docs/SPEC.md` mentions `del.saharshams.com/dashboard`, but the current web app uses `/` as the dashboard root
- There is no explicit server-side redirect from `/` to `/login`
- The repo does not currently include a checked-in env example file for the web app

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
- Set `newArchEnabled` to `false` in `apps/mobile/app.json`
- Removed unused Expo starter files and the unnecessary `expo-web-browser` dependency
- Removed unused `react-native-reanimated` and `react-native-worklets` because they forced Android new architecture during release builds
- Added `apps/mobile/.env.example`

Next rebuild checklist:

1. Ensure `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` are configured for the EAS build profile/environment
2. Rebuild the Android app; previously downloaded APKs will still contain the old startup behavior
3. If it still closes on launch, collect Android device logs from `adb logcat` or Play Console crash reporting for the new build

## Suggested next debugging/fix steps

If the blank root experience should be removed, the next thing to implement is:

1. Redirect unauthenticated requests at the route level or server level instead of waiting for client auth state
2. Optionally add an `apps/web/.env.example` documenting required variables
3. Optionally add a small deployment note for Vercel project settings

## Rules alignment note on 2026-04-07

The repo was partially brought into alignment with `.cursor/rules`:

- Web reusable components were converted from default exports to named exports
- The mobile Expo starter leftovers were removed
- The mobile `Colors` constant now uses a named export
- `apps/web/app/(auth)/layout.tsx` no longer uses `"use client"`
- The web dashboard no longer renders a blank `null` state for logged-out users

Remaining known gap:

- The web dashboard auth redirect still happens on the client rather than the server
