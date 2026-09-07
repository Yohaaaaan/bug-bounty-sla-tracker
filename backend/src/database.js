const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbDir = path.resolve(__dirname, '../db');
// A fresh clone ships no db/ directory, and sqlite3 does not create the parent
// of the file it is asked to open: without this, the very first `node src/server.js`
// fails with SQLITE_CANTOPEN before a single table is created.
fs.mkdirSync(dbDir, { recursive: true });

const dbPath = path.join(dbDir, 'database.sqlite');

// SQLite has no ADD COLUMN IF NOT EXISTS. Adding a column that is already there is
// the normal case on an existing deployment, so that one error is expected, not a fault.
function addColumnIfMissing(db, table, column, definition) {
    db.run(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`, (err) => {
        if (err && !/duplicate column name/i.test(err.message)) {
            console.error(`Error adding ${table}.${column}`, err);
        }
    });
}

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database', err);
    } else {
        console.log('Database connected.');

        // node-sqlite3 is parallelised by default: without this, the ALTER TABLEs
        // below race the CREATE TABLE they depend on and fail with "no such table"
        // on the very first boot.
        db.serialize(() => {
        db.run(`CREATE TABLE IF NOT EXISTS reports (
            id TEXT PRIMARY KEY,
            bounty_category TEXT,
            platform TEXT,
            company_name TEXT,
            issue_type TEXT,
            severity TEXT,
            submission_date TEXT,
            context TEXT,
            proof_url TEXT,
            expected_bounty INTEGER,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            flag_count INTEGER DEFAULT 0,
            status TEXT DEFAULT 'En Attente',
            is_hidden BOOLEAN DEFAULT 0
        )`);

        // The mirror of `reports`: what a program did right, on the same axes.
        // `submission_date` -> `resolution_date` is the pair the breach side never
        // has to close, and it is what makes a compliment falsifiable: elapsed_days
        // is derived from it server-side, never taken from the client.
        db.run(`CREATE TABLE IF NOT EXISTS kudos (
            id TEXT PRIMARY KEY,
            bounty_category TEXT,
            platform TEXT,
            company_name TEXT,
            highlight_type TEXT,
            severity TEXT,
            submission_date TEXT,
            resolution_date TEXT,
            elapsed_days INTEGER,
            context TEXT,
            proof_url TEXT,
            awarded_bounty INTEGER,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            flag_count INTEGER DEFAULT 0,
            status TEXT DEFAULT 'Published',
            is_hidden BOOLEAN DEFAULT 0
        )`);

        db.run(`CREATE TABLE IF NOT EXISTS pow_challenges (
            challenge TEXT PRIMARY KEY,
            expires_at DATETIME,
            is_used BOOLEAN DEFAULT 0
        )`);

    db.run(`CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        name TEXT,
        company TEXT,
        email TEXT,
        content TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
    

        db.run(`CREATE TABLE IF NOT EXISTS analytics (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            path TEXT,
            visitor_hash TEXT,
            device_id TEXT,
            session_id TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // /api/track writes here; the table was never declared, so every telemetry
        // event was silently dropped into an error log on a fresh database.
        db.run(`CREATE TABLE IF NOT EXISTS action_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            visitor_hash TEXT,
            device_id TEXT,
            session_id TEXT,
            action_type TEXT,
            action_detail TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // Same two columns on databases created before they existed.
        addColumnIfMissing(db, 'analytics', 'device_id', 'TEXT');
        addColumnIfMissing(db, 'analytics', 'session_id', 'TEXT');
        });
    }
});

module.exports = db;
