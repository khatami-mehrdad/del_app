# Universal links & client invite (mobile-first checklist)

Canonical web hostname **for now**: `https://del.saharshams.com`

Use this exact host everywhere below (no trailing slash in env vars that expect a URL; hostname-only where noted).

### Do I need a custom domain first?

**No.** Universal Links and App Links only need a **stable, public HTTPS hostname** that you control and that serves the `/.well-known` files. Your branded domain `del.saharshams.com` is now that canonical host. What fails is using **changing** preview URLs as the canonical invite host. When you later change domains again, update web + Supabase env/redirects, set `EXPO_PUBLIC_WEB_APP_HOST` to the new hostname, and ship **new** store builds (associated domains are embedded in the app).

---

## Why this matters

Coach invites send clients to **`/client-invite`** on the web with `token_hash` and `type=invite`. On a phone with the companion app installed, **iOS (Associated Domains)** and **Android (App Links)** can open the **native app** from that HTTPS URL instead of only the browser.

The web app serves:

- `/.well-known/apple-app-site-association`
- `/.well-known/assetlinks.json`

Native config lives in `apps/mobile/app.config.ts` (driven by `EXPO_PUBLIC_WEB_APP_HOST`).

---

## Phase A — Mobile apps first

Do these before or in parallel with web env tuning; you need **new store/TestFlight builds** after native config changes.

### A1. EAS / local env for the mobile project

Set **hostname only** (no `https://`):

```bash
EXPO_PUBLIC_WEB_APP_HOST=del.saharshams.com
```

- **GitHub Environments**: add this as the `EXPO_PUBLIC_WEB_APP_HOST` variable on both `preview` and `production`. The workflow syncs it into the matching EAS environment before each build.
- **Local**: copy `apps/mobile/.env.example` to `apps/mobile/.env` and set the same value.

This must match the host in `NEXT_PUBLIC_SITE_URL` on Vercel (`del.saharshams.com`).

### A2. Build and install real binaries

- Run **`eas build`** for iOS and Android with the env from A1 applied.
- Install on physical devices (TestFlight / internal APK or Play internal track).

Universal links **do not** apply to Expo Go in the same way as dev client/production builds; test **installed** builds.

### A3. Smoke test (after Phase B is deployed)

On each platform, open an invite **HTTPS** link (from email or pasted in Notes/Messages):

`https://del.saharshams.com/client-invite?token_hash=…&type=invite`

- **Expected**: app opens on the client invite flow with those query params.
- **Fallback**: web `ClientInviteScreen` offers **“Open with app link instead”** (`del-companion://…`) if HTTPS handoff fails.

---

## Phase B — Web (Vercel) & association files

Deploy the web app with the following so `/.well-known/*` returns valid JSON for Apple and Google.

### B1. `NEXT_PUBLIC_SITE_URL`

Set in the matching **GitHub Environment** as `NEXT_PUBLIC_SITE_URL`. The web deploy workflow will sync it into Vercel before build/deploy:

```bash
NEXT_PUBLIC_SITE_URL=https://del.saharshams.com
```

This drives invite `redirectTo` in `apps/web/app/api/add-client/route.ts` and HTTPS links on the client-invite page.

### B2. Apple — `APPLE_APP_SITE_ASSOCIATION_APP_IDS`

Add this as a GitHub Environment variable, then let the deploy workflow sync it to Vercel. It should be a comma-separated list of **`TeamID.bundleId`** values, e.g.:

```bash
APPLE_APP_SITE_ASSOCIATION_APP_IDS=YOUR_TEAM_ID.com.saharshams.del
```

- **Team ID**: [Apple Developer](https://developer.apple.com/account) → Membership.
- **Bundle ID**: `com.saharshams.del` (see `app.config.ts`).

After deploy, verify:

`https://del.saharshams.com/.well-known/apple-app-site-association`

You can also use Apple’s [app search API validation tool](https://search.developer.apple.com/appsearch-validation-tool/) for your domain.

### B3. Android — `ANDROID_SHA256_CERT_FINGERPRINTS`

Add this as a GitHub Environment variable, then let the deploy workflow sync it to Vercel. Use comma-separated **SHA-256** certificate fingerprints for the **signing key of the build users install** (EAS credentials or Play App Signing).

```bash
ANDROID_SHA256_CERT_FINGERPRINTS=AA:BB:…,CC:DD:…
```

After deploy, verify:

`https://del.saharshams.com/.well-known/assetlinks.json`

On a device with the app installed, you can check verification with:

```bash
adb shell pm get-app-links com.saharshams.del
```

---

## Phase C — Supabase Auth URLs

In the Supabase dashboard (**Authentication → URL configuration**):

- **Site URL** should align with how you send users (`https://del.saharshams.com`).
- **Redirect URLs** must include:

  `https://del.saharshams.com/client-invite`

Paste the **Invite user** email template from `supabase/templates/del-invite-user.html` if you maintain templates in the dashboard.

---

## Consistency rule (avoid subtle bugs)

These must refer to the **same hostname**:

| Place | Value |
|--------|--------|
| Vercel `NEXT_PUBLIC_SITE_URL` | `https://del.saharshams.com` |
| EAS / mobile `EXPO_PUBLIC_WEB_APP_HOST` | `del.saharshams.com` |
| iOS `associatedDomains` / Android `intentFilters` | Derived from `EXPO_PUBLIC_WEB_APP_HOST` in `app.config.ts` |
| Supabase redirect allow list | `https://del.saharshams.com/client-invite` |

---

## When you add a custom domain later

1. Point DNS to Vercel and assign the domain to the web project.
2. Set `NEXT_PUBLIC_SITE_URL` and Supabase redirects to the new origin.
3. Set `EXPO_PUBLIC_WEB_APP_HOST` to the new hostname (hostname only).
4. Rebuild mobile apps with EAS (native entitlements/filters embed the host).
5. Update `APPLE_APP_SITE_ASSOCIATION_APP_IDS` / fingerprints if bundle or signing changes; redeploy web.

---

## Automation (GitHub Actions)

This repo now supports **GitHub-first CI/CD**:

- `CI` validates web + mobile changes
- `Deploy web` syncs GitHub Environment values into Vercel and validates `/.well-known/*`
- `EAS mobile build` syncs GitHub Environment values into EAS and waits for the build result
- `Release mobile` builds + submits from GitHub

See [github-actions-automation.md](./github-actions-automation.md) for the exact GitHub variables, secrets, and workflow behavior.

---

## Code references

- Web well-known routes: `apps/web/app/.well-known/`
- Web invite UI: `apps/web/app/client-invite/ClientInviteScreen.tsx`
- Invite API redirect: `apps/web/app/api/add-client/route.ts`
- Native config: `apps/mobile/app.config.ts`
- Email template notes: `supabase/templates/del-invite-user.html`
