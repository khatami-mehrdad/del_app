# Del App — Issues Report

**Date:** 2026-04-29
**Scope:** Full repo audit — web app, mobile app, shared packages, data layer, Supabase schema, CI/CD
**Status:** Fixed in the current working tree on 2026-04-29; retained as the historical audit checklist.

---

## Summary

| Severity | Count |
|----------|-------|
| Critical | 2 |
| High | 6 |
| Medium | 12 |
| Low | 7 |
| **Total** | **27** |

---

## Critical

### C1. Coach messaging — SEND button stops working after any error

**Files:**
- `apps/web/components/MessageThread.tsx:57-65`
- `apps/web/app/(dashboard)/clients/[id]/page.tsx:72-74`
- `apps/web/lib/hooks/mutations.ts:13-42`

**What happens:** When a coach types a message and clicks SEND, `handleSend()` sets `sending = true` and awaits `onSend()`. If the Supabase insert fails (RLS error, network timeout, constraint violation, etc.), the promise rejects, the `catch` is never reached (there is no try-catch), `setSending(false)` never runs, and the button stays permanently disabled. The coach sees no error message and cannot retry.

Additionally, `sendMessage()` returns `{ error }` but the caller in `page.tsx:73` ignores the return value — so even non-throwing failures are silently swallowed.

**Fix:** Wrap the await in try/finally in `handleSend`, and check the returned error to show feedback.

---

### C2. Dead code calls admin API from browser client

**File:** `apps/web/lib/hooks/mutations.ts:50-53`

**What happens:** `inviteClient()` calls `supabase.auth.admin.inviteUserByEmail()` using the browser-side Supabase client (anon key). The `admin` namespace requires the service role key and will always fail from the client. This function is currently unused (the actual invite flow goes through `/api/add-client`), but if anyone calls it, it will silently fail. More importantly, if the service role key were ever bundled into the client build, it would be a critical secret exposure.

**Fix:** Remove `inviteClient()` from the client-side mutations file entirely. The API route handles this correctly.

---

## High

### H1. No middleware — dashboard routes unprotected at the server level

**Missing:** `apps/web/middleware.ts`

**What happens:** Route protection is handled entirely client-side via `AuthProvider` + `DashboardGuard`. On initial page load (or hard refresh), the server renders the dashboard page before the auth context loads. This causes a brief flash of dashboard content for unauthenticated visitors before the client-side redirect kicks in. Server-side middleware would block unauthenticated requests before any HTML is sent.

**Fix:** Add `middleware.ts` that checks the Supabase auth cookie and redirects unauthenticated users to `/login` for all `/(dashboard)` routes.

---

### H2. Add-client API — orphaned user on program insert failure

**File:** `apps/web/app/api/add-client/route.ts:26-54`

**What happens:** The route first creates an auth user via `inviteUserByEmail`, then inserts a program row. If the program insert fails (e.g., duplicate coach-client constraint), the auth user is already created but has no program. On retry, the email is now taken, so the coach gets "User already exists" and cannot add the client.

**Fix:** If the program insert fails, clean up by deleting the just-created auth user before returning the error.

---

### H3. Realtime subscription skips schema validation

**File:** `packages/data/src/queries/messages.ts:38`

**What happens:** `fetchMessages()` correctly validates rows with `MessageSchema.parse(row)`, but `subscribeToMessages()` casts `payload.new as Message` without validation. If the realtime payload shape ever diverges from the expected schema (column rename, migration, partial replication), malformed data enters the UI without error.

**Fix:** Replace the cast with `MessageSchema.parse(payload.new)` wrapped in try-catch.

---

### H4. Checkin update RLS policy missing program participant check

**File:** `supabase/migrations/001_initial_schema.sql:188-189`

**What happens:** The `"Clients can update their checkins"` policy (001_initial_schema.sql) only checks `client_id = auth.uid()`. Unlike the message-update policy (line 199) and the later coach-update policy added in 003_checkin_coach_read.sql (which correctly uses `EXISTS (... programs.coach_id = auth.uid())`), the client policy does not verify `is_program_participant(program_id)`. If a client is removed from a program, they can still update their old checkins.

**Fix:** Add `AND is_program_participant(program_id)` to the USING clause.

---

### H5. Voice-note storage bucket is private but getPublicUrl is called

**Files:**
- `supabase/migrations/001_initial_schema.sql:223-224` — bucket created with `public = false`
- `apps/web/lib/hooks/mutations.ts:29` — calls `getPublicUrl(fileName)`

**What happens:** The `voice-notes` bucket is created as private (`public = false`), but the code uses `getPublicUrl()` to generate a URL. Public URLs for private buckets return 400/403. Voice notes sent by coaches will fail to play on the client's mobile app (and vice versa).

**Fix:** Either make the bucket public (`public = true`) since authenticated-read RLS is already in place, or switch to `createSignedUrl()` for time-limited access.

---

### H6. Dashboard home auto-redirect runs on every client list change

**File:** `apps/web/app/(dashboard)/page.tsx:13-17`

**What happens:** The useEffect depends on `[clients, loading, router]`. Every time the `clients` array reference changes (refetch, add, delete), the effect re-runs and redirects to `clients[0]`. If a coach deletes the first client, they get redirected to the next first client instead of staying on the current view. If only one client existed and is deleted, they redirect to a now-invalid page.

**Fix:** Only auto-redirect on initial load (use a ref to track if initial redirect has happened).

---

## Medium

### M1. `markMessagesRead` and `markCheckinsRead` silently ignore errors

**Files:**
- `packages/data/src/mutations/messages.ts:3-14`
- `packages/data/src/mutations/checkins.ts` (same pattern)

**What happens:** Both functions return `Promise<void>` and don't check the Supabase response `error`. If the update fails, the UI still shows messages as read. The coach might miss unread messages.

**Fix:** Return `{ error: string | null }` and handle in callers.

---

### M2. Missing database indexes for common queries

**File:** `supabase/migrations/001_initial_schema.sql`

**What's missing:**
- `checkins(program_id, checkin_date)` — used by `fetchWeekCheckins`
- `journey_entries(program_id, week_number)` — used by `fetchJourneyEntries`
- `practices(program_id, week_number)` — used by `fetchPractice`

Only `messages(program_id, created_at)` is indexed (line 67). As data grows, these queries will do full table scans.

**Fix:** Add a migration with the missing indexes.

---

### M3. `weekStartDate()` timezone mismatch

**File:** `packages/data/src/queries/checkins.ts:6-11`

**What happens:** Uses the client's local time to calculate Monday, then converts to ISO date string. If a client is in UTC-8 and it's Monday 1 AM local time, `new Date()` gives Monday local, but after timezone conversion the ISO string could be Sunday. The database stores dates in UTC, so the query fetches the wrong week.

**Fix:** Use UTC methods consistently, or let the server calculate week boundaries.

---

### M4. `DeleteClientDialog` uses `window.location.href` instead of router

**File:** `apps/web/app/(dashboard)/clients/[id]/DeleteClientDialog.tsx:20`

**What happens:** After successful deletion, `window.location.href = "/"` triggers a full page reload, losing all React state. The `ClientsProvider` context, auth state, and sidebar selection all reset.

**Fix:** Use `router.replace("/")` from Next.js for client-side navigation.

---

### M5. `onMarkRead` in useEffect causes excessive calls

**File:** `apps/web/components/MessageThread.tsx:49-51`

**What happens:** `onMarkRead` is an async function prop passed from the parent. Since it's recreated on every render (not memoized), the useEffect fires on every render, calling `markMessagesRead` repeatedly.

**Fix:** Memoize `onMarkRead` with `useCallback` in the parent, or remove it from the dependency array with a ref.

---

### M6. Add-client form allows double submission

**File:** `apps/web/components/AddClientModal.tsx:25-58`

**What happens:** The `submitting` flag disables the button, but a fast double-click or Enter key press while the first request is in-flight can trigger a second `handleSubmit` before `setSubmitting(true)` takes effect in the next render. This could create duplicate clients.

**Fix:** Add a guard ref (`const submitted = useRef(false)`) checked at the top of `handleSubmit`.

---

### M7. No security headers configured

**File:** `apps/web/next.config.ts`

**What's missing:** The config is empty — no `headers()` function. The app has no `X-Frame-Options`, `Content-Security-Policy`, or `X-Content-Type-Options` headers. The site can be embedded in iframes (clickjacking risk).

**Fix:** Add security headers in `next.config.ts` or via Vercel's `vercel.json`/`vercel.ts` configuration.

---

### M8. Auth callback polling may time out on slow networks

**File:** `apps/web/app/(auth)/auth/callback/page.tsx`

**What happens:** The callback page polls for a session up to 12 times at 150ms intervals (1.8s total). On slow connections or when Supabase is under load, this may not be enough time. The user sees "This sign-in link is invalid or has expired" even though the link is fine — just slow.

**Fix:** Increase retry count or add exponential backoff.

---

### M9. Reset password page has no session validation

**File:** `apps/web/app/(auth)/reset-password/page.tsx`

**What happens:** The page calls `supabase.auth.updateUser({ password })` without first verifying that a valid session exists (from the reset token in the URL hash). If the token is expired or the URL is visited directly, the error message is not user-friendly.

**Fix:** Check `supabase.auth.getSession()` first and show a clear "link expired" message.

---

### M10. Push notification trigger silently fails if API key is not configured

**File:** `supabase/migrations/002_push_notification_triggers.sql:24,38`

**What happens:** The original `notify_push()` read the legacy service role key via `current_setting('app.settings.service_role_key', true)`. The `true` parameter meant it returned NULL silently if the setting didn't exist. The Authorization header became `Bearer ` (empty token), and the Edge Function call returned 401. Push notifications failed with no error logged — coaches and clients never got notified of new messages, practices, or journey entries.

**Fix:** `supabase/migrations/004_issue_report_fixes.sql` added warning guards, and `supabase/migrations/005_push_secret_api_key.sql` moves the trigger to `app.settings.edge_function_api_key` with Supabase's modern `sb_secret_*` key sent via the `apikey` header.

---

### M11. Push notification trigger hardcodes Supabase project URL

**File:** `supabase/migrations/002_push_notification_triggers.sql:21`

**What happens:** The Edge Function URL `https://zqvxstbkrybtiyyufhyx.supabase.co/functions/v1/send-push` is hardcoded. If the project is migrated, forked, or a staging environment is set up, push notifications will hit the wrong (or non-existent) endpoint.

**Fix:** Move the URL to a database setting like `app.settings.edge_function_url` similar to the service key pattern.

---

### M12. Voice note fields not paired in database constraints

**File:** `supabase/migrations/001_initial_schema.sql:47-49, 61-62`

**What happens:** `voice_note_url` and `voice_note_duration_sec` can be set independently. It's possible to have a URL with no duration (or vice versa), which would cause the UI to display broken voice note players.

**Fix:** Add a CHECK constraint: `(voice_note_url IS NULL) = (voice_note_duration_sec IS NULL)`.

---

## Low

### L1. Mobile app hardcodes coach name as "Sahar"

**Files:** `apps/mobile/app/(tabs)/messages.tsx`, `apps/mobile/app/(tabs)/journey.tsx`, `apps/mobile/components/home/DailyCheckinCard.tsx`

**What happens:** The coach name is hardcoded in ~8 places. If a different coach uses the platform, clients see "Sahar" everywhere.

**Fix:** Load coach name from the program's coach profile relationship.

---

### L2. Mobile voice upload uses empty string as FormData key

**File:** `apps/mobile/lib/hooks/mutations.ts:17-22`

**What happens:** `formData.append('', { uri, type, name } as unknown as Blob)` uses an empty string key. This works in practice with Supabase but is non-standard and could break with server changes.

**Fix:** Use a descriptive key like `'file'`.

---

### L3. Mobile `use-voice-note.ts` timer not cleaned on unmount

**File:** `apps/mobile/lib/use-voice-note.ts`

**What happens:** The recording interval timer relies on state cleanup but doesn't explicitly clear on component unmount. If the component unmounts while recording, the interval leaks.

**Fix:** Track the interval ref and clear it in a useEffect cleanup.

---

### L4. `LoginScreen` missing password autocomplete attribute

**File:** `apps/web/components/LoginScreen.tsx`

**What happens:** Password input has no `autoComplete="current-password"` attribute, so password managers may not auto-fill.

**Fix:** Add `autoComplete="current-password"` to the password input.

---

### L5. Sidebar gradient index could fail on empty array

**File:** `apps/web/components/Sidebar.tsx`

**What happens:** `GRADIENTS[i % GRADIENTS.length]` would divide by zero if the array were empty. This is defensive — the array is a constant — but a runtime guard is cheap insurance.

**Fix:** Add a fallback: `GRADIENTS[i % GRADIENTS.length] ?? GRADIENTS[0]` or static assert the array is non-empty.

---

### L6. `PracticeModal` and `JourneyEditor` don't trim inputs

**Files:** `apps/web/components/PracticeModal.tsx`, `apps/web/components/JourneyEditor.tsx`

**What happens:** Title and description/body are submitted without trimming. A user could submit whitespace-only text that passes the `required` attribute.

**Fix:** Trim inputs before submission.

---

### L7. CI lint/build steps have minimal error context

**File:** `.github/workflows/ci.yml`

**What happens:** When lint or build fails, the output is bare. Developers must dig through logs to find the actual error.

**Fix:** Add verbose output flags or `tee` build output to a log artifact.

---

## Priority Recommendations

**Immediate (blocking users):**
1. C1 — Fix send button try/finally (this is the bug from the screenshot)
2. H5 — Fix voice note public URL vs private bucket mismatch

**This week:**
3. H1 — Add middleware.ts for server-side route protection
4. H2 — Clean up orphaned users on program insert failure
5. H3 — Validate realtime subscription payloads
6. C2 — Remove dead admin API code from client bundle

**Soon:**
7. M1–M10 — Error handling, indexes, timezone, security headers
8. H4 — Tighten checkin RLS policy
9. H6 — Fix dashboard auto-redirect behavior

**Backlog:**
10. L1–L7 — Hardcoded names, input trimming, autocomplete, CI improvements
