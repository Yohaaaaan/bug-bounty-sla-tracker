const db = require('./database');
const { v4: uuidv4 } = require('uuid');

const today = new Date().toISOString();
function daysAgo(days) {
    const d = new Date();
    d.setDate(d.getDate() - days);
    return d.toISOString().split('T')[0];
}

const trueReports = [
    // From Log 1
    { company: 'SSV', issue: 'Ghosting (No response at all)', category: 'Smart Contract / Blockchain', sev: 'N/A', subDate: daysAgo(60) },
    { company: 'Sky', issue: 'Ghosting (No response at all)', category: 'Smart Contract / Blockchain', sev: 'Critical', subDate: daysAgo(49) },
    
    // From Log 2
    { company: 'Sky', issue: 'SLA Resolution Delay (Fix/Payout)', category: 'Smart Contract / Blockchain', sev: 'High', subDate: daysAgo(45) },
    { company: 'Sky', issue: 'SLA Resolution Delay (Fix/Payout)', category: 'Smart Contract / Blockchain', sev: 'High', subDate: daysAgo(45) },
    { company: 'Aster', issue: 'Ghosting (No response at all)', category: 'Smart Contract / Blockchain', sev: 'N/A', subDate: daysAgo(25) }
];

setTimeout(() => {
    db.serialize(() => {
        db.run("DELETE FROM reports"); // Clean slate
        
        const stmt = db.prepare(`INSERT INTO reports (id, bounty_category, platform, company_name, issue_type, severity, submission_date, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
        
        for(let r of trueReports) {
            stmt.run([uuidv4(), r.category, 'Immunefi', r.company, r.issue, r.sev, r.subDate, today]);
        }
        stmt.finalize();
    });
    console.log(`Synced 5 strictly named real reports from logs.`);
}, 1000);
