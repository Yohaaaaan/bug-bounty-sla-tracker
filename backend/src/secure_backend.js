const fs = require('fs');

let serverCode = fs.readFileSync('/mnt/data/bug-bounty-sla-tracker/backend/src/server.js', 'utf-8');

// 1. Restore rate limit (30 requests per 15min is safe for testing)
serverCode = serverCode.replace(/max: 1000,/, 'max: 30,');

// 2. Add sanitize function and secure POST /api/reports
const securePost = `
const escapeHTML = (str) => {
    if (!str) return '';
    return str.toString().substring(0, 150).replace(/[&<>'"]/g, 
        tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag] || tag)
    );
};

// Endpoint pour soumettre un rapport
app.post('/api/reports', (req, res) => {
    const { 
        website_url, pow_challenge, pow_nonce 
    } = req.body;

    // Honeypot
    if (website_url) return res.status(200).json({ message: 'Rapport soumis avec succès (bot détecté).' });

    if (!pow_challenge || !pow_nonce) return res.status(400).json({ error: 'Preuve de travail (PoW) manquante.' });

    // Sanitize and limit inputs against XSS and buffer overflow
    const bounty_category = escapeHTML(req.body.bounty_category);
    const platform = escapeHTML(req.body.platform);
    const company_name = escapeHTML(req.body.company_name);
    const issue_type = escapeHTML(req.body.issue_type);
    const severity = escapeHTML(req.body.severity);
    const submission_date = escapeHTML(req.body.submission_date);

    if(!company_name || !platform || !issue_type) {
        return res.status(400).json({ error: 'Champs obligatoires manquants.' });
    }

    db.get(\`SELECT * FROM pow_challenges WHERE challenge = ? AND is_used = 0 AND expires_at > CURRENT_TIMESTAMP\`, [pow_challenge], (err, row) => {
        if (err || !row) return res.status(400).json({ error: 'Challenge PoW invalide ou expiré.' });
        if (!verifyPoW(pow_challenge, pow_nonce)) return res.status(400).json({ error: 'Preuve de travail incorrecte.' });

        db.run(\`UPDATE pow_challenges SET is_used = 1 WHERE challenge = ?\`, [pow_challenge]);

        const id = uuidv4();
        const query = \`
            INSERT INTO reports (id, bounty_category, platform, company_name, issue_type, severity, submission_date)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        \`;
        db.run(query, [id, bounty_category, platform, company_name, issue_type, severity, submission_date], function(err) {
            if (err) return res.status(500).json({ error: 'Erreur.' });
            res.status(201).json({ message: 'Success', id });
        });
    });
});
`;

serverCode = serverCode.replace(/\/\/ Endpoint pour soumettre un rapport[\s\S]*?(?=\/\/ Endpoint public pour lister)/, securePost + '\n');
fs.writeFileSync('/mnt/data/bug-bounty-sla-tracker/backend/src/server.js', serverCode);
console.log('Backend secured!');
