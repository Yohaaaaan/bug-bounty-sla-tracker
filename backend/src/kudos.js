// ---------------------------------------------------------------------------
// Wall of Fame - the inverse ledger.
//
// The breach side of this project only ever records what a program failed to do.
// That makes it a one-way instrument: a researcher can learn who to avoid, never
// who is worth a week of work. `kudos` is the same ledger run in the other
// direction, on the same axes, at the same anti-spam cost.
//
// Every highlight is the mirror of an issue_type accepted by /api/ledger, and its
// gate is the mirror of that issue's gate. Where the breach side asks for enough
// time to have PASSED (ghosting needs 14 days of silence), the fame side asks for
// the case to have CLOSED inside that same window. A compliment here is a dated
// claim someone else can contradict, not an opinion.
// ---------------------------------------------------------------------------

const HIGHLIGHT_RULES = {
    'Fast Triage': {
        maxDays: 7,
        mirrors: 'SLA Response Delay (Triage)',
        error: '"Fast Triage" requires the report to have been triaged within 7 days.'
    },
    'Fast Resolution / Payout': {
        maxDays: 30,
        mirrors: 'SLA Resolution Delay (Fix/Payout)',
        error: '"Fast Resolution / Payout" requires the case to have closed within 30 days.'
    },
    'Consistent Communication': {
        maxDays: 14,
        mirrors: 'Ghosting (No response at all)',
        error: '"Consistent Communication" requires a closing date within 14 days of submission.'
    },
    'Fair Severity Assessment': {
        maxDays: null,
        mirrors: 'Unjustified Severity Downgrade',
        error: null
    },
    'Bounty Paid As Scoped': {
        maxDays: null,
        mirrors: 'Unjustified Payment Refusal',
        error: null
    }
};

const MS_PER_DAY = 1000 * 60 * 60 * 24;

// Parses YYYY-MM-DD as UTC midnight, so a report dated today is never read as
// "tomorrow" from a timezone west of Greenwich.
function parseDay(value) {
    if (!value) return null;
    const d = new Date(value + 'T00:00:00Z');
    return isNaN(d.getTime()) ? null : d;
}

// Runs the gate on one submission and returns either { error } or { elapsed_days }.
// Exported so the rules can be tested without an HTTP server in front of them.
function gradeSubmission({ highlight_type, submission_date, resolution_date, now }) {
    const rule = HIGHLIGHT_RULES[highlight_type];
    if (!rule) return { error: 'Type de retour inconnu.' };

    const submitted = parseDay(submission_date);
    const resolved = parseDay(resolution_date);
    if (!submitted || !resolved) {
        return { error: 'Both the submission and the closing date are required.' };
    }

    const today = now == null ? Date.now() : now;
    if (submitted.getTime() > today || resolved.getTime() > today) {
        return { error: 'Dates cannot be in the future.' };
    }
    if (resolved.getTime() < submitted.getTime()) {
        return { error: 'The closing date cannot precede the submission date.' };
    }

    const elapsed_days = Math.floor((resolved.getTime() - submitted.getTime()) / MS_PER_DAY);
    if (rule.maxDays !== null && elapsed_days > rule.maxDays) {
        return { error: rule.error };
    }

    return { elapsed_days };
}

function registerKudosRoutes({ app, db, crypto, uuidv4, upload, escapeHTML }) {

    // Burns a PoW challenge and checks the nonce. Same contract as the inline
    // copies in server.js: it answers on `res` itself, and calls `done` only when
    // the challenge was fresh and the nonce holds.
    function spendChallenge(req, res, difficulty, done) {
        const { pow_challenge, pow_nonce } = req.body;
        if (!pow_challenge || pow_nonce == null) {
            return res.status(400).json({ error: 'Preuve de travail (PoW) manquante.' });
        }
        db.run(
            `UPDATE pow_challenges SET is_used = 1 WHERE challenge = ? AND is_used = 0 AND CAST(expires_at AS INTEGER) > ?`,
            [pow_challenge, Date.now()],
            function (err) {
                if (err || this.changes === 0) {
                    return res.status(400).json({ error: 'Challenge PoW invalide, expire ou rejoue.' });
                }
                const hash = crypto.createHash('sha256').update(pow_challenge + String(pow_nonce)).digest('hex');
                if (!hash.startsWith('0'.repeat(difficulty))) {
                    return res.status(400).json({ error: 'PoW incorrect.' });
                }
                done();
            }
        );
    }

    // Endpoint pour soumettre un retour positif
    app.post('/api/kudos', upload.single('proof_image'), (req, res) => {
        // Honeypot
        if (req.body.website_url) {
            return res.status(200).json({ message: 'Retour soumis avec succes (bot detecte).' });
        }

        const bounty_category = escapeHTML(req.body.bounty_category);
        const platform = escapeHTML(req.body.platform);
        const company_name = escapeHTML(req.body.company_name);
        
        let raw_highlight = req.body.highlight_type;
        if (!raw_highlight) return res.status(400).json({ error: 'Champs obligatoires manquants.' });
        // Handle array before escapeHTML destroys it
        if (Array.isArray(raw_highlight)) raw_highlight = raw_highlight.join(',');
        
        const highlight_type = escapeHTML(raw_highlight);
        const severity = escapeHTML(req.body.severity);
        const submission_date = escapeHTML(req.body.submission_date);
        const resolution_date = escapeHTML(req.body.resolution_date);

        if (!company_name || !platform || !highlight_type) {
            return res.status(400).json({ error: 'Champs obligatoires manquants.' });
        }

        const graded = gradeSubmission({ highlight_type, submission_date, resolution_date });
        if (graded.error) return res.status(400).json({ error: graded.error });
        // override highlight_type with the nicely formatted joined string
        const final_highlight_type = graded.valid_types;

        let awarded_bounty = null;
        if (req.body.awarded_bounty !== undefined && req.body.awarded_bounty !== '') {
            awarded_bounty = parseInt(req.body.awarded_bounty, 10);
            if (!Number.isFinite(awarded_bounty) || awarded_bounty < 0) {
                return res.status(400).json({ error: 'Awarded bounty must be a positive number.' });
            }
        }

        spendChallenge(req, res, 4, () => {
            const id = uuidv4();
            const context = req.body.context ? escapeHTML(req.body.context) : null;
            const proof_url = req.file ? '/uploads/' + req.file.filename : null;

            const query = `
                INSERT INTO kudos (id, bounty_category, platform, company_name, highlight_type, severity, submission_date, resolution_date, elapsed_days, context, proof_url, awarded_bounty)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;
            db.run(query, [id, bounty_category, platform, company_name, final_highlight_type, severity, submission_date, resolution_date, graded.elapsed_days, context, proof_url, awarded_bounty], function (err) {
                if (err) return res.status(500).json({ error: 'Erreur.' });
                res.status(201).json({ message: 'Success', id, elapsed_days: graded.elapsed_days });
            });
        });
    });

    // Endpoint public pour lister les retours positifs
    app.get('/api/kudos', (req, res) => {
        const searchQuery = req.query.search;
        let query = `SELECT * FROM kudos WHERE is_hidden = 0`;
        const params = [];

        if (searchQuery) {
            query += ` AND company_name LIKE ?`;
            params.push(`%${searchQuery}%`);
        }

        query += ` ORDER BY created_at DESC LIMIT 1000`;

        db.all(query, params, (err, rows) => {
            if (err) return res.status(500).json({ error: 'Database error' });

            // Safari/Firefox compat
            rows = rows.map(r => {
                if (r.created_at && r.created_at.includes(' ') && !r.created_at.includes('T')) {
                    r.created_at = r.created_at.replace(' ', 'T') + 'Z';
                }
                return r;
            });

            res.json(rows);
        });
    });

    // Endpoint pour les statistiques du Wall of Fame
    app.get('/api/hall-of-fame', (req, res) => {
        db.all(`SELECT (SELECT COUNT(*) FROM kudos WHERE is_hidden=0) as totalKudos, (SELECT COUNT(DISTINCT company_name) FROM kudos WHERE is_hidden=0) as totalCompanies, (SELECT COALESCE(SUM(awarded_bounty), 0) FROM kudos WHERE is_hidden=0) as totalAwarded, (SELECT ROUND(AVG(elapsed_days), 1) FROM kudos WHERE is_hidden=0) as avgDays, (SELECT COUNT(*) FROM kudos WHERE is_hidden=0 AND awarded_bounty IS NULL) as undisclosed`, (err, totals) => {
            if (err) return res.status(500).json({ error: 'Database error' });
            db.all(`SELECT company_name, COUNT(*) as count, ROUND(AVG(elapsed_days), 1) as avg_days, COALESCE(SUM(awarded_bounty), 0) as awarded FROM kudos WHERE is_hidden=0 GROUP BY company_name ORDER BY count DESC LIMIT 10`, (err, companyStats) => {
                db.all(`SELECT platform, COUNT(*) as count, ROUND(AVG(elapsed_days), 1) as avg_days FROM kudos WHERE is_hidden=0 GROUP BY platform ORDER BY count DESC`, (err, platformStats) => {
                    db.all(`SELECT highlight_type, COUNT(*) as count FROM kudos WHERE is_hidden=0 GROUP BY highlight_type ORDER BY count DESC`, (err, highlightStats) => {
                        db.all(`SELECT company_name, COUNT(*) as count FROM kudos WHERE is_hidden=0 AND created_at >= datetime('now', '-7 days') GROUP BY company_name ORDER BY count DESC LIMIT 3`, (err, weeklyCompanyStats) => {
                            res.json({
                                totals: totals[0],
                                companyStats: companyStats || [],
                                platformStats: platformStats || [],
                                highlightStats: highlightStats || [],
                                weeklyCompanyStats: weeklyCompanyStats || []
                            });
                        });
                    });
                });
            });
        });
    });

    // Endpoint de reputation nette: les deux registres sur une seule ligne par
    // entite. C'est le seul endroit ou un chasseur lit "3 retours positifs, 1
    // manquement" au lieu d'une seule moitie de l'histoire.
    app.get('/api/reputation', (req, res) => {
        const query = `
            SELECT company_name,
                   SUM(breach_count) as breach_count,
                   SUM(praise_count) as praise_count,
                   SUM(praise_count) - SUM(breach_count) as net,
                   MAX(last_activity) as last_activity
            FROM (
                SELECT company_name, COUNT(*) as breach_count, 0 as praise_count, MAX(created_at) as last_activity
                FROM reports WHERE is_hidden = 0 AND company_name IS NOT NULL GROUP BY company_name
                UNION ALL
                SELECT company_name, 0 as breach_count, COUNT(*) as praise_count, MAX(created_at) as last_activity
                FROM kudos WHERE is_hidden = 0 AND company_name IS NOT NULL GROUP BY company_name
            )
            GROUP BY company_name
            ORDER BY net DESC, praise_count DESC
            LIMIT 500
        `;
        db.all(query, [], (err, rows) => {
            if (err) return res.status(500).json({ error: 'Database error' });
            res.json(rows);
        });
    });

    // Endpoint pour signaler un retour positif (meme cout PoW que cote manquement)
    app.post('/api/kudos/:id/flag', (req, res) => {
        const difficulty = parseInt(process.env.POW_DIFFICULTY_FLAG || 4);
        spendChallenge(req, res, difficulty, () => {
            db.run(`UPDATE kudos SET flag_count = flag_count + 1 WHERE id = ?`, [req.params.id], function (err) {
                if (err) return res.status(500).json({ error: 'Erreur.' });
                res.json({ message: 'Signalement enregistre.' });
            });
        });
    });
}

module.exports = registerKudosRoutes;
module.exports.HIGHLIGHT_RULES = HIGHLIGHT_RULES;
module.exports.gradeSubmission = gradeSubmission;
