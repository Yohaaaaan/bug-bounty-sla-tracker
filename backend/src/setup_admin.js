const fs = require('fs');
const path = require('path');

const frontendPath = '/mnt/data/bug-bounty-sla-tracker/frontend';
const backendPath = '/mnt/data/bug-bounty-sla-tracker/backend';

// 1. Update Database Schema
let dbCode = fs.readFileSync(path.join(backendPath, 'src/database.js'), 'utf-8');
if (!dbCode.includes('CREATE TABLE IF NOT EXISTS messages')) {
    const messagesTable = `
    db.run(\`CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        name TEXT,
        company TEXT,
        email TEXT,
        content TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )\`);
    `;
    dbCode = dbCode.replace(/db\.run\(\`CREATE TABLE IF NOT EXISTS pow_challenges[\s\S]*?\)\`\);/, match => match + '\n' + messagesTable);
    fs.writeFileSync(path.join(backendPath, 'src/database.js'), dbCode);
}

// 2. Add API Endpoints in server.js
let serverCode = fs.readFileSync(path.join(backendPath, 'src/server.js'), 'utf-8');
if (!serverCode.includes('/api/contact')) {
    const contactApi = `
// Endpoint pour le formulaire de contact (Option 1)
app.post('/api/contact', (req, res) => {
    const { name, company, email, content, pow_challenge, pow_nonce } = req.body;
    
    if (!pow_challenge || !pow_nonce) return res.status(400).json({ error: 'PoW manquant.' });
    if (!name || !email || !content) return res.status(400).json({ error: 'Champs obligatoires manquants.' });

    db.get(\`SELECT * FROM pow_challenges WHERE challenge = ? AND is_used = 0 AND expires_at > CURRENT_TIMESTAMP\`, [pow_challenge], (err, row) => {
        if (err || !row) return res.status(400).json({ error: 'Challenge invalide.' });
        
        const difficulty = 4;
        const hash = crypto.createHash('sha256').update(pow_challenge + pow_nonce).digest('hex');
        if (!hash.startsWith('0'.repeat(difficulty))) return res.status(400).json({ error: 'PoW incorrect.' });

        db.run(\`UPDATE pow_challenges SET is_used = 1 WHERE challenge = ?\`, [pow_challenge]);

        const id = uuidv4();
        db.run(\`INSERT INTO messages (id, name, company, email, content) VALUES (?, ?, ?, ?, ?)\`, 
            [id, escapeHTML(name), escapeHTML(company), escapeHTML(email), escapeHTML(content)], 
            function(err) {
                if (err) return res.status(500).json({ error: 'Erreur.' });
                res.status(201).json({ message: 'Message envoyé.' });
        });
    });
});

// Endpoint Admin Secret
app.get('/api/admin/messages', (req, res) => {
    const auth = req.headers.authorization;
    if (auth !== 'Bearer ' + ((process.env.ADMIN_PASSWORD || 'UNSET_PASSWORD_LOCKED') )) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    db.all(\`SELECT * FROM messages ORDER BY created_at DESC\`, (err, rows) => {
        if (err) return res.status(500).json({ error: 'Erreur DB' });
        res.json(rows);
    });
});
app.delete('/api/admin/messages/:id', (req, res) => {
    const auth = req.headers.authorization;
    if (auth !== 'Bearer ' + ((process.env.ADMIN_PASSWORD || 'UNSET_PASSWORD_LOCKED') )) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    db.run(\`DELETE FROM messages WHERE id = ?\`, [req.params.id], function(err) {
        if (err) return res.status(500).json({ error: 'Erreur DB' });
        res.json({ message: 'Deleted' });
    });
});
`;
    serverCode = serverCode.replace(/\/\/ Endpoint public pour lister les rapports/, contactApi + '\n\n// Endpoint public pour lister les rapports');
    fs.writeFileSync(path.join(backendPath, 'src/server.js'), serverCode);
}

// 3. Update legal.html
let legalHtml = fs.readFileSync(path.join(frontendPath, 'legal.html'), 'utf-8');
legalHtml = legalHtml.replace(/<a href="mailto:agence\.novasite@gmail\.com"[^>]*>agence\.novasite@gmail\.com<\/a>/, '<a href="contact.html" class="text-alertOrange font-bold hover:underline">Secure Contact Form</a>');
fs.writeFileSync(path.join(frontendPath, 'legal.html'), legalHtml);

// 4. Create contact.html
const contactHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Contact - BB SLA Tracker</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <script>tailwind.config = { theme: { extend: { colors: { alertRed: '#ff4d4d', alertOrange: '#ff9900' }, fontFamily: { sans: ['Inter', 'sans-serif'] } } } }</script>
</head>
<body class="bg-gray-50 text-gray-900 min-h-screen flex flex-col antialiased">
    <nav class="bg-white/80 backdrop-blur-md border-b border-gray-200 shadow-sm sticky top-0 z-50">
        <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex items-center justify-between h-16">
                <div class="flex items-center gap-3">
                    <span class="font-bold text-lg tracking-wide">BB SLA Tracker</span>
                </div>
                <div class="flex items-center space-x-6">
                    <a href="index.html" class="text-gray-600 hover:text-gray-900 text-sm font-medium transition">Home</a>
                    <a href="search.html" class="text-gray-600 hover:text-gray-900 text-sm font-medium transition">Search</a>
                    <a href="stats.html" class="text-gray-600 hover:text-gray-900 text-sm font-medium transition">Stats</a>
                    <a href="legal.html" class="text-gray-600 hover:text-gray-900 text-sm font-medium transition">Legal</a>
                    <a href="submit.html" class="bg-gray-900 hover:bg-gray-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition shadow-lg backdrop-blur-sm">Submit Report</a>
                </div>
            </div>
        </div>
    </nav>
    <main class="flex-grow max-w-2xl mx-auto px-4 py-16 w-full">
        <h1 class="text-3xl font-black mb-8">Takedown & Contact Request</h1>
        <form id="contactForm" class="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 space-y-6">
            <p class="text-sm text-gray-500 mb-4">Use this form to contest a demonstrably false report. Messages are stored securely and no emails are exposed.</p>
            <div>
                <label class="block text-sm font-bold text-gray-700 mb-1">Your Name</label>
                <input type="text" name="name" required class="w-full bg-gray-50 border border-gray-300 rounded-lg p-3">
            </div>
            <div>
                <label class="block text-sm font-bold text-gray-700 mb-1">Company / Protocol (Optional)</label>
                <input type="text" name="company" class="w-full bg-gray-50 border border-gray-300 rounded-lg p-3">
            </div>
            <div>
                <label class="block text-sm font-bold text-gray-700 mb-1">Contact Email</label>
                <input type="email" name="email" required class="w-full bg-gray-50 border border-gray-300 rounded-lg p-3">
            </div>
            <div>
                <label class="block text-sm font-bold text-gray-700 mb-1">Message / Takedown Reasoning</label>
                <textarea name="content" required rows="5" class="w-full bg-gray-50 border border-gray-300 rounded-lg p-3"></textarea>
            </div>
            <button type="submit" id="submitBtn" class="w-full bg-gray-900 hover:bg-gray-800 text-white font-bold py-3 px-4 rounded-lg transition shadow-lg">Send Message (Requires PoW)</button>
        </form>
    </main>
    <script>
        document.getElementById('contactForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = document.getElementById('submitBtn');
            btn.disabled = true; btn.innerText = 'Calculating PoW...';
            
            try {
                const resChallenge = await fetch('/api/pow-challenge');
                const { challenge, difficulty } = await resChallenge.json();
                
                let nonce = 0;
                const prefix = '0'.repeat(difficulty);
                const encoder = new TextEncoder();
                
                const compute = async () => {
                    for(let i=0; i<30000; i++) {
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
                btn.innerText = 'Sending...';

                const formData = new FormData(e.target);
                const payload = Object.fromEntries(formData.entries());
                payload.pow_challenge = challenge;
                payload.pow_nonce = foundNonce;

                const res = await fetch('/api/contact', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                
                if(res.ok) {
                    alert('Message securely sent to the administrators.');
                    window.location.href = 'index.html';
                } else {
                    alert('Failed to send.');
                    btn.disabled = false; btn.innerText = 'Send Message (Requires PoW)';
                }
            } catch(err) {
                console.error(err);
                alert('An error occurred.');
                btn.disabled = false; btn.innerText = 'Send Message (Requires PoW)';
            }
        });
    </script>
</body>
</html>`;
fs.writeFileSync(path.join(frontendPath, 'contact.html'), contactHtml);

// 5. Create admin.html
const adminHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin - BB SLA Tracker</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-50 text-gray-900 p-8">
    <div class="max-w-4xl mx-auto">
        <h1 class="text-2xl font-bold mb-6">Secret Admin Panel - Messages</h1>
        
        <div id="loginSection" class="bg-white p-6 rounded shadow-sm border border-gray-200 mb-6">
            <input type="password" id="adminPwd" placeholder="Enter Admin Password" class="border p-2 rounded mr-2">
            <button onclick="loadMessages()" class="bg-blue-600 text-white px-4 py-2 rounded">Login</button>
        </div>

        <div id="messagesGrid" class="space-y-4 hidden"></div>
    </div>
    <script>
        let pwd = '';
        async function loadMessages() {
            pwd = document.getElementById('adminPwd').value;
            const res = await fetch('/api/admin/messages', {
                headers: { 'Authorization': 'Bearer ' + pwd }
            });
            if (!res.ok) return alert('Bad password');
            
            document.getElementById('loginSection').classList.add('hidden');
            document.getElementById('messagesGrid').classList.remove('hidden');
            
            const msgs = await res.json();
            const grid = document.getElementById('messagesGrid');
            grid.innerHTML = '';
            msgs.forEach(m => {
                grid.innerHTML += \`
                    <div class="bg-white p-6 rounded shadow-sm border border-gray-200">
                        <div class="flex justify-between items-start mb-4 border-b pb-4">
                            <div>
                                <h3 class="font-bold">\${m.name} (\${m.company})</h3>
                                <a href="mailto:\${m.email}" class="text-blue-500 text-sm">\${m.email}</a>
                            </div>
                            <span class="text-xs text-gray-400">\${new Date(m.created_at).toLocaleString()}</span>
                        </div>
                        <p class="text-gray-700 whitespace-pre-wrap">\${m.content}</p>
                        <button onclick="del('\${m.id}')" class="mt-4 text-red-500 text-sm">Delete Message</button>
                    </div>
                \`;
            });
        }
        
        async function del(id) {
            if(!confirm('Delete this message?')) return;
            await fetch('/api/admin/messages/' + id, {
                method: 'DELETE',
                headers: { 'Authorization': 'Bearer ' + pwd }
            });
            loadMessages();
        }
    </script>
</body>
</html>`;
fs.writeFileSync(path.join(frontendPath, 'admin-secret.html'), adminHtml);

// 6. Append password to .env
let envFile = fs.readFileSync(path.join(backendPath, '.env'), 'utf-8');
if (!envFile.includes('ADMIN_PASSWORD')) {
    fs.writeFileSync(path.join(backendPath, '.env'), envFile + 'ADMIN_PASSWORD=REDACTED\n');
}

console.log('Admin system and DB Contact setup complete.');
