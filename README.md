# Marginalia

A production-grade social blogging platform built with Astro, React islands, MongoDB/Mongoose, and Cloudinary. Users write and publish blogs, follow and block other users, like and comment, get notified, and search the platform. `/` is the public discovery landing page; `/feed` is a dedicated, auth-gated page showing only blogs from people you follow. A separate `/admin` dashboard gives moderators full control over users, content, reports, and homepage curation.

## Stack

- **Astro 7** (server output, `@astrojs/vercel` adapter) — pages are server-rendered by default; React is only used where a page needs client interactivity ("islands").
- **React 19** + **TypeScript** for interactive islands (forms, editor, comments, admin tables).
- **Tailwind CSS v4** (via `@tailwindcss/vite`) for styling.
- **MongoDB + Mongoose** for persistence, with compound/unique indexes for likes, follows, blocks, and full-text search indexes on blogs/users.
- **Cloudinary** for image upload, optimization, and delivery.
- **Custom session auth** — no Clerk/Auth.js/Supabase/Firebase. Opaque, hashed, revocable session tokens in an `HttpOnly` + `Secure` + `SameSite=Lax` cookie, plus Google OAuth 2.0 / OIDC.
- **Zod** for validation at every API boundary.
- **Framer Motion** for React component transitions (menus, modals, notifications) and light use of animation throughout; all respects `prefers-reduced-motion`.

## Getting started

```bash
npm install
cp .env.example .env   # fill in real values
npm run dev
```

The app expects a MongoDB Atlas (or self-hosted) connection string, a Cloudinary account, and a Google OAuth 2.0 client (redirect URI: `<site>/api/auth/google/callback`). In development, if `SMTP_HOST` is left blank, transactional emails (verification, password reset) are logged to the console instead of being sent.

Per this repo's `CLAUDE.md`, start the dev server in the background so it survives across sessions:

```bash
astro dev --background
astro dev status
astro dev logs
astro dev stop
```

### Cloudinary uploads returning 403

If image uploads fail with `Request forbidden due to missing permissions (actions=["create"])`, the API key in `.env` has a restricted scope in the Cloudinary dashboard. Fix it under Settings → API Keys (broaden the key's permissions or generate a new unrestricted pair) — this can't be worked around in application code.

### Required environment variables

See `.env.example` for the full list. At minimum you need `MONGODB_URI` and `SESSION_SECRET` to run the app; Google sign-in and image uploads degrade gracefully (Google button will error until configured; uploads will fail with a clear message) if their variables are missing.

### First admin account

Set `ADMIN_NAME`, `ADMIN_USERNAME`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD` in `.env`, then run:

```bash
npm run bootstrap-admin
```

This creates the account if it doesn't exist, or promotes/resets it if it does. It's safe to re-run any time you want to reset the admin password. There's no in-app UI for this on purpose — it's a deliberate out-of-band step so the first admin can't be created through the public API.

Alternatively, promote any existing account directly in the database:

```js
db.users.updateOne({ usernameLower: "your-username" }, { $set: { role: "admin" } })
```

## Project structure

```
src/
  components/     Astro + React components, grouped by domain (auth, blog, dashboard, admin, profile, ui, home)
  layouts/        BaseLayout, DashboardShell, AdminShell
  lib/            db connection, auth/session/crypto helpers, validation schemas, Cloudinary, rate limiting
  models/         Mongoose schemas (User, Session, Blog, Comment, Like, Follow, Block, Notification, Report, Category, Tag, HomeFeature)
  pages/          file-based routing — public pages, /feed, /dashboard, /admin, and /api/* server endpoints
  scripts/        client-side GSAP/ScrollTrigger animation modules, loaded per-component via <script src>
  middleware.ts   attaches the current user to every request; gates /dashboard and /admin at the page level
```

Every API route re-checks authentication and authorization itself — page-level middleware is a UX convenience, not the security boundary.

## Design system

`src/styles/global.css` defines the full theme as CSS custom properties — surfaces, ink/text, borders, brand accents, and semantic colors (success/warning/error/info) — each with a light value on `:root` and a dark override under both `prefers-color-scheme: dark` and an explicit `data-theme="dark"` toggle. Every component reads colors through these tokens (`var(--color-surface)`, `var(--color-ink-strong)`, etc.) rather than hardcoding `white`/`black`, so the whole app stays correct in both themes. `src/components/ui/Select.tsx` is a themed, portal-rendered dropdown used everywhere in place of the native `<select>`.

Scroll-driven animation (GSAP + ScrollTrigger) is centralized in `src/scripts/gsap-setup.ts`, which every other animation script imports from to avoid duplicate plugin registration, and is gated behind `prefers-reduced-motion`.

## Security notes

- Passwords hashed with bcrypt (12 rounds); session tokens are random 256-bit values, stored only as a SHA-256 hash, revocable, and expire after 30 days.
- All user-supplied identifiers (`userId`, `authorId`, `role`, counts, etc.) are resolved server-side from the session — never trusted from the client.
- Blog content is sanitized with DOMPurify before being rendered as HTML.
- Blocking is enforced server-side in the feed, search, profile, comments, and likes queries — not just hidden in the UI.
- Best-effort in-memory rate limiting on auth, comments, uploads, and reports (swap for a Redis-backed limiter such as Upstash before scaling past a single region/instance).

## Deploying

The app is set up for Vercel (`@astrojs/vercel` adapter, `output: 'server'`). Set all variables from `.env.example` in the Vercel project's environment settings — do not commit `.env`.
