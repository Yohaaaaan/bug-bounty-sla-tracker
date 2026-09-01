process.env.NODE_ENV = 'production';
require('dotenv').config({ path: __dirname + '/../../.env' });
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const multer = require('multer');
const db = require('./database');

const app = express();
app.set('trust proxy', 'loopback');
const PORT = process.env.PORT || 3000;

app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.tailwindcss.com", "https://cdnjs.cloudflare.com"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdn.tailwindcss.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            connectSrc: ["'self'"]
        }
    }
}));
// Removing global CORS to restrict to same-origin.

app.use(express.json());
const path = require('path');
app.use(express.static(path.join(__dirname, '../../frontend')));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '../uploads/'))
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
        const ext = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + ext)
    }
});
const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) cb(null, true);
        else cb(new Error('Only images are allowed'));
    }
});


// Rate limiting strict par IP
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 30, // limiter chaque IP à 10 requêtes par fenêtre
    message: 'Trop de requêtes, veuillez réessayer plus tard.'
});
app.use('/api/', limiter);

// Fonction pour vérifier le PoW
function verifyPoW(challenge, nonce, difficulty = 4) {
    const hash = crypto.createHash('sha256').update(challenge + nonce).digest('hex');
    return hash.startsWith('0'.repeat(difficulty));
}

// Endpoint pour obtenir un challenge PoW
app.get('/api/pow-challenge', (req, res) => {
    const challenge = crypto.randomBytes(16).toString('hex');
    const expiresAt = Date.now() + 5 * 60000; // Expire dans 5 min

    db.run(`INSERT INTO pow_challenges (challenge, expires_at) VALUES (?, ?)`, [challenge, expiresAt], (err) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        res.json({ challenge, difficulty: 4 });
    });
});


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
app.post('/api/ledger', (req, res) => {
    const { 
        website_url, pow_challenge, pow_nonce 
    } = req.body;

    // Honeypot
    if (website_url) return res.status(200).json({ message: 'Rapport soumis avec succès (bot détecté).' });

    if (!pow_challenge || pow_nonce == null) return res.status(400).json({ error: 'Preuve de travail (PoW) manquante.' });

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

    
    const subDateObj = new Date(submission_date);
    const daysDiff = (new Date() - subDateObj) / (1000 * 60 * 60 * 24);

    if (issue_type.includes('Ghosting') && daysDiff < 14) {
        return res.status(400).json({ error: 'Ghosting requires at least 14 days since submission.' });
    }
    if (issue_type.includes('Response Delay') && daysDiff < 7) {
        return res.status(400).json({ error: 'Response Delay requires at least 7 days.' });
    }
    if (issue_type.includes('Resolution Delay') && daysDiff < 30) {
        return res.status(400).json({ error: 'Resolution Delay requires at least 30 days.' });
    }

    db.run(`UPDATE pow_challenges SET is_used = 1 WHERE challenge = ? AND is_used = 0 AND CAST(expires_at AS INTEGER) > ?`, [pow_challenge, Date.now()], function(err) {
        if (err || this.changes === 0) return res.status(400).json({ error: 'Challenge PoW invalide, expiré ou rejoué.' });
        
        const difficulty = 4;
        const hash = crypto.createHash('sha256').update(pow_challenge + String(pow_nonce)).digest('hex');
        if (!hash.startsWith('0'.repeat(difficulty))) return res.status(400).json({ error: 'PoW incorrect.' });
    

        const id = uuidv4();
        let context = req.body.context ? escapeHTML(req.body.context) : null;
        let expected_bounty = req.body.expected_bounty ? parseInt(req.body.expected_bounty) : null;
        let proof_url = null;
        if (req.file) {
            proof_url = '/uploads/' + req.file.filename;
        }

        const query = `
            INSERT INTO reports (id, bounty_category, platform, company_name, issue_type, severity, submission_date, context, proof_url, expected_bounty)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        db.run(query, [id, bounty_category, platform, company_name, issue_type, severity, submission_date, context, proof_url, expected_bounty], function(err) {
            if (err) return res.status(500).json({ error: 'Erreur.' });
            res.status(201).json({ message: 'Success', id });
        });
    });
});


// Endpoint pour le formulaire de contact (Option 1)
app.post('/api/contact', (req, res) => {
    const { name, company, email, content, pow_challenge, pow_nonce } = req.body;
    
    if (!pow_challenge || pow_nonce == null) return res.status(400).json({ error: 'PoW manquant.' });
    if (!name || !email || !content) return res.status(400).json({ error: 'Champs obligatoires manquants.' });

    db.run(`UPDATE pow_challenges SET is_used = 1 WHERE challenge = ? AND is_used = 0 AND CAST(expires_at AS INTEGER) > ?`, [pow_challenge, Date.now()], function(err) {
        if (err || this.changes === 0) return res.status(400).json({ error: 'Challenge PoW invalide, expiré ou rejoué.' });
        
        const difficulty = 4;
        const hash = crypto.createHash('sha256').update(pow_challenge + String(pow_nonce)).digest('hex');
        if (!hash.startsWith('0'.repeat(difficulty))) return res.status(400).json({ error: 'PoW incorrect.' });
    

        const id = uuidv4();
        db.run(`INSERT INTO messages (id, name, company, email, content) VALUES (?, ?, ?, ?, ?)`, 
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
    db.all(`SELECT * FROM messages ORDER BY created_at DESC`, (err, rows) => {
        if (err) return res.status(500).json({ error: 'Erreur DB' });
        res.json(rows);
    });
});
app.delete('/api/admin/messages/:id', (req, res) => {
    const auth = req.headers.authorization;
    if (auth !== 'Bearer ' + ((process.env.ADMIN_PASSWORD || 'UNSET_PASSWORD_LOCKED') )) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    db.run(`DELETE FROM messages WHERE id = ?`, [req.params.id], function(err) {
        if (err) return res.status(500).json({ error: 'Erreur DB' });
        res.json({ message: 'Deleted' });
    });
});


// Endpoint public pour lister les rapports (affichage immédiat + moteur de recherche)
app.get('/api/ledger', (req, res) => {
    const searchQuery = req.query.search;
    let query = `SELECT * FROM reports WHERE is_hidden = 0`;
    let params = [];

    if (searchQuery) {
        query += ` AND company_name LIKE ?`;
        params.push(`%${searchQuery}%`);
    }

    query += ` ORDER BY created_at DESC LIMIT 1000`;

    db.all(query, params, (err, rows) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        res.json(rows);
    });
});

// Endpoint pour récupérer la liste unique des entreprises (Autocomplétion crowdsourcée)
app.get('/api/companies', (req, res) => {
    db.all(`SELECT DISTINCT company_name FROM reports WHERE is_hidden = 0 AND company_name IS NOT NULL ORDER BY company_name ASC`, (err, rows) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        // Retourne un tableau de chaînes de caractères
        res.json(rows.map(row => row.company_name));
    });
});

// Endpoint pour les statistiques globales
app.get('/api/leaderboard', (req, res) => {
    db.all(`SELECT (SELECT COUNT(*) FROM reports WHERE is_hidden=0) as totalReports, (SELECT COUNT(DISTINCT company_name) FROM reports WHERE is_hidden=0) as totalCompanies`, (err, totals) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        db.all(`SELECT company_name, COUNT(*) as count FROM reports WHERE is_hidden=0 GROUP BY company_name ORDER BY count DESC LIMIT 10`, (err, companyStats) => {
            db.all(`SELECT platform, COUNT(*) as count FROM reports WHERE is_hidden=0 GROUP BY platform ORDER BY count DESC`, (err, platformStats) => {
                db.all(`SELECT issue_type, COUNT(*) as count FROM reports WHERE is_hidden=0 GROUP BY issue_type ORDER BY count DESC`, (err, issueStats) => {
                    db.all(`SELECT company_name, COUNT(*) as count FROM reports WHERE is_hidden=0 AND created_at >= datetime('now', '-7 days') GROUP BY company_name ORDER BY count DESC LIMIT 3`, (err, weeklyCompanyStats) => {
                        res.json({
                            totals: totals[0],
                            companyStats,
                            platformStats,
                            issueStats,
                            weeklyCompanyStats: weeklyCompanyStats || []
                        });
                    });
                });
            });
        });
    });
});


// Endpoint pour signaler un rapport (Downvote) avec PoW
app.post('/api/ledger/:id/flag', (req, res) => {
    const { id } = req.params;
    const { pow_challenge, pow_nonce } = req.body;

    if (!pow_challenge || pow_nonce == null) return res.status(400).json({ error: 'PoW manquant.' });

    db.run(`UPDATE pow_challenges SET is_used = 1 WHERE challenge = ? AND is_used = 0 AND CAST(expires_at AS INTEGER) > ?`, [pow_challenge, Date.now()], function(err) {
        if (err || this.changes === 0) return res.status(400).json({ error: 'Challenge PoW invalide, expiré ou rejoué.' });
        
        const difficulty = parseInt(process.env.POW_DIFFICULTY_FLAG || 4);
        const hash = crypto.createHash('sha256').update(pow_challenge + String(pow_nonce)).digest('hex');
        if (!hash.startsWith('0'.repeat(difficulty))) return res.status(400).json({ error: 'PoW incorrect.' });
    

        db.run(`UPDATE reports SET flag_count = flag_count + 1 WHERE id = ?`, [id], function(err) {
            if (err) return res.status(500).json({ error: 'Erreur.' });
            
            // Auto-hide deactivated pending authenticated moderation
            
            res.json({ message: 'Signalement enregistré.' });
        });
    });
});


// Privacy-respecting Analytics Ping
app.post('/api/ping', (req, res) => {
    const { path } = req.body;
    if (!path || typeof path !== 'string' || !path.startsWith('/') || path.length > 100) return res.status(400).send();
    const cleanPath = path.replace(/[^a-zA-Z0-9/.-]/g, ''); // Validate path against XSS
    const secret = process.env.ANALYTICS_SECRET || 'fallback-secret';
    const ip = req.ip || req.socket.remoteAddress;
    const salt = new Date().toISOString().slice(0, 10); 
    const visitor_hash = crypto.createHmac('sha256', secret).update(ip + salt).digest('hex').substring(0, 16);
    
    db.run('INSERT INTO analytics (path, visitor_hash) VALUES (?, ?)', [cleanPath, visitor_hash], (err) => {
        if (err) console.error(err);
        res.status(200).send();
    });
});

app.get('/api/admin/analytics', (req, res) => {
    // Return simple stats: total views, unique visitors today, popular pages
    db.all(`
        SELECT 
            path, 
            COUNT(*) as views, 
            COUNT(DISTINCT visitor_hash) as uniques 
        FROM analytics 
        GROUP BY path 
        ORDER BY views DESC
    `, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.listen(PORT, () => {
    console.log(`Serveur démarré sur http://localhost:${PORT}`);
});
