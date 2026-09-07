# SLAScan - Project Memory

## Architecture & Tech Stack
- **Frontend**: HTML5, TailwindCSS (via CDN), vanilla Javascript. Responsive UI with custom interactive CSS (e.g. Tailwind `peer` pseudo-classes for the severity cards).
- **Backend**: Node.js, Express.js.
- **Database**: SQLite3 (`/mnt/data/bug-bounty-sla-tracker/backend/db/database.sqlite`).
- **Security / Anti-Spam**: Custom Proof of Work (PoW) on form submissions (SHA-256 via CryptoJS in the browser) and report flagging.
- **Deployment**: Running on an Oracle Cloud VPS via a `start_loop.sh` bash script on port 3000. Public access is mapped from port 80 to 3000 using `iptables` (`sudo iptables -t nat -A PREROUTING -p tcp --dport 80 -j REDIRECT --to-port 3000`).
- **Domain**: `http://bb-reports.duckdns.org` (points to `79.72.24.207`).
- **Environment**: Managed using PM2/Bash loops, `.env` file exists in the backend directory.

## Core Functionality
- **SLA Tracker**: Tracks protocols that ignore bug bounty reports or break SLA timelines.
- **Data Source**: Initially seeded with 134 real reports parsed from a 5.3MB Discord export (`aextraire.html` -> `filtered_reports.txt`), strictly filtered against an exhaustive list of 57 platforms and 143+ crypto protocols.
- **Form Submission**: Users can manually submit SLA breaches via `submit.html`. The backend validates the timeline (e.g., Ghosting requires >14 days of silence).
- **Admin Panel**: A secret route (`/admin-secret.html`) exists to read contact form messages from the SQLite `messages` table without relying on SMTP emails. Password is stored in backend/.env.
- **Interactivity**: Dynamic filtering on the Search page, Accordion-style layout on the Stats page.

## Key Incidents & Fixes
- **Layout Bugs**: Flexbox issues on `stats.html` were fixed by replacing `grid` stretch behavior with independent `flex-col md:flex-row` wrappers.
- **PoW Crypto Error**: Browsers blocked `crypto.subtle` over HTTP, breaking form submissions. Fixed by migrating the frontend hashing logic to `CryptoJS` via CDN.
- **False Positives**: Eliminated false-positive protocol matches in the extraction script for common English words (Exactly, Vault, Threshold, Aera, Spark, Parallel, etc.).
- **Server Reboots**: When the OS reboots, the site goes down because `iptables` is flushed and `start_loop.sh` is killed. Fix by re-running the Node backend and re-applying the `iptables` NAT PREROUTING rule.

## Known Limits & Next Steps
- **HTTPS/SSL**: The domain is currently `http://`. A TLS certificate (Certbot/Let's Encrypt) would enable native browser WebCrypto and secure access.
- **Git**: The project is not initialized as a git repository (`fatal: not a git repository`).

## Extraction Rules (Discord Backfilling)
- **Submission Date Logic**: When extracting reports from Discord dumps, calculate the `submission_date` using the formula: `[Date of the Discord message] - [Number of days specified in the message since the problem started]`. 
- **Missing Data**: If the user does not specify how long the problem has been ongoing, DO NOT estimate or fallback to the current date. Set `submission_date` to `NULL` (or leave it out) so the frontend does not display "Unresolved for 0 days".

## Wall of Fame (inverse ledger)
- **Why**: the breach ledger is one-way. It says who to avoid and never where a month of work is worth spending. The Hall of Fame answers that half **inside the same app**: one server, one SQLite file, one navbar, one shared company list, one Proof-of-Work cost. It is not a second site.
- **Table**: `kudos`, mirroring `reports`. `submission_date` gains a paired `resolution_date`, and `elapsed_days` is derived **server-side** from the two, never taken from the client. `expected_bounty` becomes `awarded_bounty`.
- **Closed list**: `highlight_type` is validated against `HIGHLIGHT_RULES` in `backend/src/kudos.js`. An unrecognised value is refused, not stored as free text, so the aggregate stays countable.
- **Mirrored gates**: Fast Triage <= 7d, Consistent Communication <= 14d, Fast Resolution / Payout <= 30d, mirroring the 7/14/30 day thresholds the breach form enforces in the other direction. Fair Severity Assessment and Bounty Paid As Scoped carry no window.
- **Routes**: mounted from `server.js` via `require('./kudos')({ app, db, crypto, uuidv4, upload, escapeHTML })`, after `upload` and `escapeHTML` exist. `GET|POST /api/kudos`, `POST /api/kudos/:id/flag`, `GET /api/hall-of-fame`, `GET /api/reputation`.
- **`/api/companies` is now a UNION** of both registers. Without it the two forms create two spellings of the same entity.
- **Pages**: `hall-of-fame.html` and `praise.html`. `index.html` carries a Breaches/Credits toggle over the same feed and search box, plus a Wall of Fame sidebar card.
- **Undisclosed amounts**: the bounty field is optional on *both* forms via a "Do not disclose" checkbox that **disables** the input, so it is omitted from `FormData` and stored as NULL rather than a 0 the aggregate would read as "paid nothing". The Hall of Fame states "Floor only: N credits withheld the amount" whenever any are.
- **Tests**: `backend/test/kudos.test.js`, run with `npm test` (`node --test`, no dependencies). The clock is frozen at 2026-09-07 so the future-date rule does not drift with the calendar.

## Fresh-clone fixes carried by the same change
- `backend/db/` is **not** in the repo and sqlite3 will not create the parent of the file it opens: `database.js` now `mkdirSync`s it, otherwise the first `node src/server.js` dies on SQLITE_CANTOPEN.
- `server.js` writes `analytics.device_id` / `analytics.session_id` and inserts into `action_logs`, none of which the schema declared. All telemetry was being dropped into an error log. Both are now created, and the two columns are added to pre-existing databases by an idempotent ALTER.
- **node-sqlite3 is parallelised by default.** The schema bootstrap is wrapped in `db.serialize()`; without it those ALTERs race the CREATE TABLE they depend on and fail with "no such table: analytics" on the first boot.
