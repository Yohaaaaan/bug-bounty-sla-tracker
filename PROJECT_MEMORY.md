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
