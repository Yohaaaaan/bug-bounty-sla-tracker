const fs = require('fs');
const path = require('path');

const frontendPath = '/mnt/data/bug-bounty-sla-tracker/frontend';
const backendPath = '/mnt/data/bug-bounty-sla-tracker/backend';

// ---------------------------------------------------------
// 1. DOCKER & ENV SETUP
// ---------------------------------------------------------
const dockerfile = `FROM node:20-alpine
WORKDIR /app
COPY backend/package*.json ./
RUN npm ci --only=production
COPY backend/ ./
COPY frontend/ /frontend/
ENV PORT=3000
EXPOSE 3000
CMD ["node", "src/server.js"]
`;
fs.writeFileSync(path.join(backendPath, '../Dockerfile'), dockerfile);

const dockerCompose = `version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    volumes:
      - ./backend/db:/app/db
    restart: always
    env_file:
      - .env
`;
fs.writeFileSync(path.join(backendPath, '../docker-compose.yml'), dockerCompose);

const dotEnv = `PORT=3000
POW_DIFFICULTY_SUBMIT=4
POW_DIFFICULTY_FLAG=4
FLAG_HIDE_THRESHOLD=5
`;
fs.writeFileSync(path.join(backendPath, '../.env'), dotEnv);
fs.writeFileSync(path.join(backendPath, '.env'), dotEnv); // also in backend

// ---------------------------------------------------------
// 2. LEGAL UPDATE (legal.html)
// ---------------------------------------------------------
let legalHtml = fs.readFileSync(path.join(frontendPath, 'legal.html'), 'utf-8');
const newLegalContent = `
            <section>
                <h2 class="text-xl font-bold mb-3">2. Content & Safe Harbor</h2>
                <p class="text-gray-600 leading-relaxed mb-3">This platform is a community-driven aggregator of purely factual SLA (Service Level Agreement) metadata. We act strictly as a hosting provider (Safe Harbor) and do not editorialize or create the content submitted by users.</p>
                <p class="text-gray-600 leading-relaxed"><strong>Takedown Policy & Contact:</strong> If you represent an organization and believe a report is demonstrably false, defamatory, or contains sensitive PII/vulnerability details, you can request a manual review and takedown by contacting us at: <a href="mailto:mayomichau@gmail.com" class="text-alertOrange font-bold hover:underline">mayomichau@gmail.com</a>.</p>
            </section>
`;
legalHtml = legalHtml.replace(/<section>[\s\S]*?2\. Content & Responsibility[\s\S]*?<\/section>/, newLegalContent);
fs.writeFileSync(path.join(frontendPath, 'legal.html'), legalHtml);


// ---------------------------------------------------------
// 3. GDPR COMPLIANCE (Remove Google Fonts)
// ---------------------------------------------------------
const htmlFiles = ['index.html', 'submit.html', 'about.html', 'stats.html', 'legal.html', 'search.html'];
for (const file of htmlFiles) {
    const fPath = path.join(frontendPath, file);
    if (fs.existsSync(fPath)) {
        let content = fs.readFileSync(fPath, 'utf-8');
        // Remove Google Fonts
        content = content.replace(/<link href="https:\/\/fonts\.googleapis\.com[^>]+>/g, '');
        // We will keep Tailwind CDN for now as downloading it fully requires build steps, but we remove the font.
        fs.writeFileSync(fPath, content);
    }
}

// ---------------------------------------------------------
// 4. BACKEND: ENV variables & PoW on Flags
// ---------------------------------------------------------
let serverJs = fs.readFileSync(path.join(backendPath, 'src/server.js'), 'utf-8');

// Inject dotenv
if (!serverJs.includes('dotenv')) {
    serverJs = "require('dotenv').config({ path: __dirname + '/../../.env' });\n" + serverJs;
}

// Rewrite the Flag endpoint to require PoW
const newFlagEndpoint = `
// Endpoint pour signaler un rapport (Downvote) avec PoW
app.post('/api/reports/:id/flag', (req, res) => {
    const { id } = req.params;
    const { pow_challenge, pow_nonce } = req.body;

    if (!pow_challenge || !pow_nonce) return res.status(400).json({ error: 'PoW manquant.' });

    db.get(\`SELECT * FROM pow_challenges WHERE challenge = ? AND is_used = 0 AND expires_at > CURRENT_TIMESTAMP\`, [pow_challenge], (err, row) => {
        if (err || !row) return res.status(400).json({ error: 'Challenge invalide.' });
        
        const difficulty = parseInt(process.env.POW_DIFFICULTY_FLAG || 4);
        const hash = crypto.createHash('sha256').update(pow_challenge + pow_nonce).digest('hex');
        if (!hash.startsWith('0'.repeat(difficulty))) return res.status(400).json({ error: 'PoW incorrect.' });

        db.run(\`UPDATE pow_challenges SET is_used = 1 WHERE challenge = ?\`, [pow_challenge]);

        db.run(\`UPDATE reports SET flag_count = flag_count + 1 WHERE id = ?\`, [id], function(err) {
            if (err) return res.status(500).json({ error: 'Erreur.' });
            
            const threshold = parseInt(process.env.FLAG_HIDE_THRESHOLD || 5);
            db.run(\`UPDATE reports SET is_hidden = 1 WHERE id = ? AND flag_count >= ?\`, [id, threshold]);
            
            res.json({ message: 'Signalement enregistré.' });
        });
    });
});
`;
serverJs = serverJs.replace(/\/\/ Endpoint pour signaler un rapport comme spam[\s\S]*?(?=\napp\.listen)/, newFlagEndpoint);
fs.writeFileSync(path.join(backendPath, 'src/server.js'), serverJs);

// ---------------------------------------------------------
// 5. FRONTEND: Add FLAG button & PoW Logic to index.html
// ---------------------------------------------------------
let indexHtml = fs.readFileSync(path.join(frontendPath, 'index.html'), 'utf-8');
const flagHtml = `
            <div class="flex justify-between items-center text-xs pt-3 border-t border-gray-100 pl-2">
                <div class="flex items-center gap-2">
                    <span class="px-2 py-0.5 rounded font-bold border \${getSeverityColor(r.severity)} text-[10px]">\${r.severity || 'N/A'}</span>
                    <button onclick="flagReport('\${r.id}')" title="Flag as fake/spam" class="text-gray-300 hover:text-red-500 transition">
                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9"></path></svg>
                    </button>
                </div>
                <span class="bg-gray-50 text-gray-500 border border-gray-200 px-2 py-0.5 rounded uppercase tracking-wider font-bold text-[9px] truncate max-w-[100px] text-right" title="\${r.platform || 'Unknown'}">\${r.platform || 'Unknown'}</span>
            </div>
`;
// We replace the bottom div of the card
indexHtml = indexHtml.replace(/<div class="flex justify-between items-center text-xs pt-3 border-t border-gray-100 pl-2">[\s\S]*?<\/div>/, flagHtml);

const flagJs = `
        async function flagReport(id) {
            if(!confirm('Report this as spam/fake? Your browser will perform a PoW calculation.')) return;
            try {
                const resChallenge = await fetch('/api/pow-challenge');
                const { challenge, difficulty } = await resChallenge.json();
                
                let nonce = 0;
                const prefix = '0'.repeat(difficulty);
                const encoder = new TextEncoder();
                
                const compute = async () => {
                    for(let i=0; i<20000; i++) {
                        const data = encoder.encode(challenge + nonce);
                        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
                        const hashArray = Array.from(new Uint8Array(hashBuffer));
                        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
                        if (hashHex.startsWith(prefix)) return nonce;
                        nonce++;
                    }
                    return new Promise(resolve => setTimeout(() => resolve(compute()), 0));
                };

                const foundNonce = await compute();
                
                const res = await fetch(\`/api/reports/\${id}/flag\`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ pow_challenge: challenge, pow_nonce: foundNonce })
                });
                
                if(res.ok) {
                    alert('Flag submitted.');
                    fetchReports(document.getElementById('searchInput').value);
                }
            } catch(e) {
                console.error(e);
                alert('Error flagging report.');
            }
        }
`;
indexHtml = indexHtml.replace(/<\/script>/, flagJs + '\n</script>');
fs.writeFileSync(path.join(frontendPath, 'index.html'), indexHtml);

console.log('Go-live preparations applied.');
