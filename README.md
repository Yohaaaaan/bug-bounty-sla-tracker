# 🚨 SLAScan

Welcome to the **Resistance**.

The **SLAScan** is a community-driven, public ledger designed to bring transparency to the Bug Bounty ecosystem. Far too often, security researchers are met with ghosting, unjustified severity downgrades, and endless payout delays from major platforms and companies. 

We believe that our only weapon against these practices is **public visibility**. This platform tracks, aggregates, and shames bad actors based on community-submitted proofs.

---

## 💥 Features

- **🏆 Wall of Shame**: A dynamic, gamified podium highlighting the worst offenders of the week based on community reports.
- **⭐ Hall of Fame**: The same ledger run in the other direction. Programs that triaged fast, judged fairly and paid what they published, each entry dated so anyone can contradict it. See [The inverse ledger](#-the-inverse-ledger).
- **⚖️ Net Reputation**: Both registers on one line per company. Four credits and one breach does not read like a single credit, and neither wall shows you that on its own.
- **🙈 Undisclosed Amounts**: On both forms the bounty figure is optional. Some NDAs forbid it and some payouts identify the researcher on their own; the entry is recorded either way, and the totals say plainly when they are a floor rather than a sum.
- **🛡️ Proof-of-Work Anti-Spam**: To prevent malicious bots from skewing the stats, report submissions and upvotes require client-side Proof-of-Work (PoW) computation.
- **⚡ Gamified Wizard**: A fluid, multi-step frontend wizard to submit SLA breaches, making reporting fast and frustration-free.
- **🐦 Viral X (Twitter) Sharing**: Native, adblocker-friendly sharing features to spread the word about bad actors and hold them accountable in public.
- **🔍 Comprehensive Search & Stats**: Dive deep into which platforms and categories are the most notorious for ghosting and delayed payouts.

---

## ⭐ The inverse ledger

A wall of shame is a one-way instrument. It tells a researcher who to avoid; it never tells them
where a month of work is worth spending. The Hall of Fame answers that half, on the same axes, at
the same anti-spam cost, in the same app: one server, one database, one navigation, one shared
company list. The home feed carries both registers behind a single toggle.

Every credit is the mirror of an issue type the breach ledger already accepts, and its gate is the
mirror of that issue's gate. Where the breach side needs enough time to have **passed**, the fame
side needs the case to have **closed** inside that same window:

| Breach (`/api/ledger`)              | Credit (`/api/kudos`)         | Gate                          |
| ----------------------------------- | ----------------------------- | ----------------------------- |
| SLA Response Delay (Triage), > 7d   | Fast Triage                   | closed within **7 days**      |
| SLA Resolution Delay (Fix/Payout), > 30d | Fast Resolution / Payout | closed within **30 days**     |
| Ghosting (no response at all), > 14d | Consistent Communication     | closed within **14 days**     |
| Unjustified Severity Downgrade      | Fair Severity Assessment      | no window                     |
| Unjustified Payment Refusal         | Bounty Paid As Scoped         | no window                     |

The submitter gives two dates; the elapsed time is derived server-side and never taken from the
client, so a compliment here is a dated claim rather than an opinion. The highlight list is closed:
an unrecognised value is refused rather than stored as free text.

**Endpoints**: `GET|POST /api/kudos`, `POST /api/kudos/:id/flag`, `GET /api/hall-of-fame`,
`GET /api/reputation`. `GET /api/companies` returns the union of both registers, so one entity keeps
one spelling on both walls.

**Pages**: `hall-of-fame.html` (podium, stats, feed, net reputation table) and `praise.html`
(the submission wizard).

---

## 🛠️ Tech Stack

This project is built to be fast, lightweight, and easy to deploy:

- **Frontend**: Vanilla HTML5, JavaScript, and [Tailwind CSS](https://tailwindcss.com/) (CDN) for rapid, responsive UI development.
- **Backend**: [Node.js](https://nodejs.org/) & Express.
- **Database**: [SQLite 3](https://www.sqlite.org/) for portable, zero-configuration data storage.
- **Security**: Client-side cryptography via CryptoJS for PoW challenges.

---

## 🚀 Local Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Yohaaaaan/bug-bounty-sla-tracker.git
   cd bug-bounty-sla-tracker
   ```

2. **Install backend dependencies:**
   ```bash
   cd backend
   npm install
   ```

3. **Run the tests:**
   ```bash
   npm test
   ```

4. **Start the backend server:**
   ```bash
   node src/server.js
   ```
   *The server will start on \`http://localhost:3000\` and automatically initialize the SQLite database, creating `backend/db/` if it does not exist yet.*

5. **Serve the frontend:**
   The frontend uses relative paths to communicate with the backend. You can either serve the `frontend` folder using NGINX (with a reverse proxy to port `3000` for `/api`), or use a lightweight development server like Live Server or `serve`.

---

## 🤝 Contributing

This platform was built by hackers, for hackers. We have no corporate sponsors and zero censorship. The code is entirely Open Source.

Contributions are highly encouraged! Whether you want to improve the UI, add new statistics algorithms, or tighten the anti-spam measures:
1. Fork the project.
2. Create your feature branch (\`git checkout -b feature/AmazingFeature\`).
3. Commit your changes (\`git commit -m 'Add some AmazingFeature'\`).
4. Push to the branch (\`git push origin feature/AmazingFeature\`).
5. Open a Pull Request.

---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.
