# GĪTĀ JOURNEY — The Path of 700 Verses

A Krishna-conscious, gamified Bhagavad-gītā reading and learning web application built around *Bhagavad-gītā As It Is* by His Divine Grace A.C. Bhaktivedanta Swami Śrīla Prabhupāda.

## Scripture Integrity & Licensing Policy
- **Canonical Reference**: Structured across all **18 chapters** and **700 verses** (`46, 72, 43, 42, 29, 47, 30, 28, 34, 42, 55, 20, 35, 27, 20, 24, 28, 78`), verified against `https://vedabase.io/en/library/bg/`.
- **Source-Linked Default**: Until written permission or an authorized license from Bhaktivedanta Book Trust International is imported via the Admin Content Import Pipeline, verses link directly to their verified Vedabase.io pages and never fabricate or paraphrase scripture as original text.
- **Authorized Content Import**: Content Editors and System Administrators can import licensed translations, Devanāgarī, transliteration, and purports with explicit edition, source attribution, licensing status, and editorial verification metadata.

## Architecture & Stack
- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Lucide icons, Vite 8 + `vite-plugin-pwa`
- **Themes**: Three full design-token devotional themes (*Krishna*, *Radha-Shyamasundara*, *Gauranga*) plus Light / Sepia / Dark reader modes
- **Backend**: Node.js, Express, Zod validation, `scrypt` password hashing, SHA-256 `HttpOnly` session cookies, CSRF origin protection, sliding-window rate limiting
- **Database**: Cloud SQL (PostgreSQL) with Drizzle ORM (`24` normalized tables in `src/db/schema.ts`)
- **Authentication**: Email/Password registration & login + Google Sign-In via Firebase Auth (`firebase` + `firebase-admin`), plus Guest Exploration with automatic progress migration

## Setup & Development
1. **Install dependencies**:
   ```bash
   npm install
   ```
2. **Environment variables** (see `.env.example`):
   - `SQL_HOST`, `SQL_DB_NAME`, `SQL_USER`, `SQL_PASSWORD`, `SQL_ADMIN_USER`, `SQL_ADMIN_PASSWORD` (provisioned by Cloud SQL)
   - `ADMIN_EMAILS`: comma-separated admin email addresses
   - Optional notification providers: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `RESEND_API_KEY`, `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`
3. **Run development server** (port `3000`):
   ```bash
   npm run dev
   ```
4. **Type-check & build**:
   ```bash
   npm run lint
   npm run build
   ```
5. **Run unit tests**:
   ```bash
   npm test
   npx --yes tsx --test src/lib/security.test.ts
   ```
6. **Production start**:
   ```bash
   npm run build && npm start
   ```

## Security & Privacy Controls
- Passwords hashed with `crypto.scrypt` + 16-byte random salt and verified with `crypto.timingSafeEqual`.
- Sessions stored as SHA-256 digests in PostgreSQL (`sessions` table) and transmitted via `HttpOnly; SameSite=Lax` cookies.
- Server-side idempotent transactions (`reading_progress` and `xp_transactions` unique indexes) prevent duplicate verse completion, duplicate XP, and out-of-order chapter unlocking.
- Role-based Admin access (`content_editor` vs `system_admin`) with immutable `admin_audit_logs`; administrators cannot silently rewrite user reading histories.
- Users can export all personal data as JSON (`GET /api/auth/export`) and permanently delete their account (`DELETE /api/auth/account`).
