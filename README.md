# 🚨 Bug Bounty SLA Tracker

Welcome to the **Resistance**.

The **Bug Bounty SLA Tracker** is a community-driven, public ledger designed to bring transparency to the Bug Bounty ecosystem. Far too often, security researchers are met with ghosting, unjustified severity downgrades, and endless payout delays from major platforms and companies. 

We believe that our only weapon against these practices is **public visibility**. This platform tracks, aggregates, and shames bad actors based on community-submitted proofs.

---

## 💥 Features

- **🏆 Wall of Shame**: A dynamic, gamified podium highlighting the worst offenders of the week based on community reports.
- **🛡️ Proof-of-Work Anti-Spam**: To prevent malicious bots from skewing the stats, report submissions and upvotes require client-side Proof-of-Work (PoW) computation.
- **⚡ Gamified Wizard**: A fluid, multi-step frontend wizard to submit SLA breaches, making reporting fast and frustration-free.
- **🐦 Viral X (Twitter) Sharing**: Native, adblocker-friendly sharing features to spread the word about bad actors and hold them accountable in public.
- **🔍 Comprehensive Search & Stats**: Dive deep into which platforms and categories are the most notorious for ghosting and delayed payouts.

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

3. **Start the backend server:**
   ```bash
   node src/server.js
   ```
   *The server will start on \`http://localhost:3000\` and automatically initialize the SQLite database.*

4. **Serve the frontend:**
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
