const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, '../db/database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database', err);
    } else {
        console.log('Database connected.');
        db.run(`CREATE TABLE IF NOT EXISTS reports (
            id TEXT PRIMARY KEY,
            bounty_category TEXT,
            platform TEXT,
            company_name TEXT,
            issue_type TEXT,
            severity TEXT,
            submission_date TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            flag_count INTEGER DEFAULT 0,
            status TEXT DEFAULT 'En Attente',
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
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);
    }
});

module.exports = db;
