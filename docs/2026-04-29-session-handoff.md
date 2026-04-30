# 2026-04-29 — Auth hang + voice notes + prod migration drift

Handoff doc to resume mid-debug.

---

## Symptoms reported

1. **Coach login hangs ~15s, then shows "Sign-in is taking longer than expected".**
2. **Voice messages broken on web:** preview shows correct duration (e.g. 6s), after sending shows `0:00 / 0:00` and won't play on either side.
3. **Mobile chat doesn't update in real time** — closing and reopening the app shows new messages.
4. **Console flooded with 400 errors** on `…/rest/v1/checkins?…&coach_read_at=is.null`.

---

## Root causes found

### 1. Auth hang (fixed)
`packages/data/src/auth/useSupabaseAuth.ts` passed an async callback to `supabase.auth.onAuthStateChange`. supabase-js v2 awaits the returned Promise inside the auth lock during `_notifyAllSubscribers('SIGNED_IN', …)`. The callback was calling `hydrate(session)` → `fetchProfile` + `recoverMissingProfile` (POST `/api/ensure-profile`), so `signInWithPassword` couldn't return until all of that finished — hence the 15s timeout firing. The previous "fix" commits only added a timeout error wrapper; they didn't address the actual lock contention.

### 2. WebM duration metadata (fixed)
`MediaRecorder` produces WebM without the duration field in EBML metadata. The `<audio controls preload="metadata">` element therefore showed `0:00 / 0:00`. Native controls also became unreliable. Mobile sidesteps this with a custom `VoiceNotePlayer`; web didn't.

### 3. `voice-notes` bucket was private on prod (fixed manually)
`supabase.storage.from('voice-notes').getPublicUrl(...)` returns a URL, but if the bucket is private, that URL 400s. Migration `004_issue_report_fixes.sql` flips it public — that migration had not been applied to the live project.

### 4. Migration drift between repo and live DB
None of `supabase/migrations/*` were tracked on the live project's `supabase_migrations.schema_migrations`. `001` and `002` were already applied to the schema (likely via dashboard before CLI was wired up), but `003` and `004` had never run. That's why the `coach_read_at` column was missing → `?coach_read_at=is.null` returned 400.

---

## What's done in this session

### Code changes (uncommitted)
- `packages/data/src/auth/useSupabaseAuth.ts` — `onAuthStateChange` callback no longer returns the Promise. Now `(_event, session) => { void hydrate(session); }`. Lock releases immediately; profile hydration runs in the background.
- `apps/web/lib/auth-context.tsx` — removed the 15s `withAuthTimeout` wrapper and the timeout error string from commit `2196f85`. `signIn` / `signUp` / `resetPassword` are back to the original one-liners.
- `apps/web/components/MessageThread.tsx` — replaced `<audio controls>` for received messages with a custom `VoiceNotePlayer` that drives play/pause via `HTMLAudioElement` and displays `voice_note_duration_sec` from the DB. Preview audio (local blob) is unchanged.
- `supabase/migrations/005_push_secret_api_key.sql` and `006_push_settings_table.sql` — push triggers now call Edge Functions with Supabase's modern `sb_secret_*` key in the `apikey` header. Runtime push settings live in locked `app_settings` so they can be updated via API.
- `supabase/functions/send-push/index.ts` and `supabase/config.toml` — `send-push` is deployed with `verify_jwt = false`, validates the incoming `apikey`, and uses Supabase secret API keys for admin reads.
- `packages/data/src/queries/messages.ts` and `apps/mobile/lib/hooks/useMessages.ts` — malformed realtime message payloads now refetch the inserted row by id and de-dupe before appending, so voice-note rows do not disappear until app reopen.
- `apps/mobile/app.config.ts` and `apps/mobile/lib/use-push-registration.ts` — Android now declares `POST_NOTIFICATIONS`; push registration logs explicit skip reasons and retries when the app returns active.

### Live Supabase (prod) changes
- `voice-notes` bucket flipped to public via dashboard. File-size limit 10 MB, MIME types `audio/webm,audio/mp4` (recommended; user may have set or deferred).
- Supabase CLI installed and linked: project ref `zqvxstbkrybtiyyufhyx`.
- Migration history repaired: `001` and `002` marked applied (already on schema). `003`, `004`, `005`, and `006` pushed via `supabase db push`.
- `send-push` redeployed with `supabase functions deploy send-push --no-verify-jwt`.
- GitHub environment secret `SUPABASE_SERVICE_ROLE_KEY` updated in both `Preview` and `Production` with the modern `sb_secret_*` value.
- Live `app_settings` verified: `edge_function_url = true`, `edge_function_api_key = true`.

---

## What's pending

### A. Push notifications still not shown on device
`notify_push()` and `send-push` are now wired. Recent `net._http_response` rows show HTTP 200 responses from the function, but the content is `{"skipped":"no push tokens"}`.

Evidence:
```sql
SELECT COUNT(*) AS push_token_count FROM push_tokens; -- 0
SELECT left(content, 300), status_code, created
FROM net._http_response
ORDER BY created DESC
LIMIT 10;
```

Next step:
- Rebuild/reinstall the mobile app after the `POST_NOTIFICATIONS` permission change. Existing Android binaries will not gain the new manifest permission.
- Launch the app on a physical device, sign in as the client, accept the notification permission prompt, and confirm `push_tokens` gets one row.

### B. Mobile voice messages realtime
Text messages arrive immediately, but voice-note rows only showed after app restart. A fallback was added so if `MessageSchema.parse(payload.new)` fails for a realtime payload, the app refetches the inserted message by id and appends it after validation.

Next step:
- Re-test after installing the new mobile build. If voice notes still do not append immediately, temporarily log the realtime callback payload and parse error in `packages/data/src/queries/messages.ts`.

### C. Commit pending work
Current uncommitted files (from this session):
- `packages/data/src/auth/useSupabaseAuth.ts`
- `apps/web/lib/auth-context.tsx`
- `apps/web/components/MessageThread.tsx`
- `packages/data/src/queries/messages.ts`
- `apps/mobile/lib/hooks/useMessages.ts`
- `apps/mobile/lib/use-push-registration.ts`
- `apps/mobile/app.config.ts`
- `supabase/config.toml`
- `supabase/functions/send-push/index.ts`
- `supabase/migrations/005_push_secret_api_key.sql`
- `supabase/migrations/006_push_settings_table.sql`

Suggested commit message:
> fix(web): unblock auth lock and play voice notes reliably
>
> - Don't return a Promise from onAuthStateChange — supabase-js awaits subscribers inside the auth lock, which made signInWithPassword wait on profile hydration.
> - Drop the 15s timeout wrapper (was masking the lock contention, not fixing it).
> - Custom VoiceNotePlayer for received messages — uses DB-stored duration so WebM's missing metadata doesn't break play/pause UI.

---

## Quick sanity checks for the next session

| Check | Expected | If it fails |
|---|---|---|
| Sign in as coach on web | Loads dashboard within ~1s | Re-investigate auth lock |
| Send voice note → play it | Duration matches, plays cleanly | Check public URL response in Network tab |
| Open `/clients/<id>` console | No 400s on `coach_read_at` | Re-run `supabase migration list`, ensure 003 applied |
| Send message from web | Mobile app updates without reopen | See section B |
| Send message from web | Client receives push notification | See section A |

---

## Reference: keys / IDs

- Supabase project ref: `zqvxstbkrybtiyyufhyx`
- Edge Function URL: `https://zqvxstbkrybtiyyufhyx.supabase.co/functions/v1/send-push`
- Web env: `apps/web/.env.local` (open in IDE during session)
- CLI installed via Homebrew: `supabase 2.95.4`
