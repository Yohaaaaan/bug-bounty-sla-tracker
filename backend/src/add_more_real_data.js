const db = require('./database');
const { v4: uuidv4 } = require('uuid');

const today = new Date().toISOString();
function daysAgo(days) {
    const d = new Date();
    d.setDate(d.getDate() - days);
    return d.toISOString().split('T')[0];
}

// Extraction based strictly on named protocols from the new log:
const newReports = [
    // SuperiorSkink33408 - "Sky, diamond-pau: #84265 and #84400 ... 1+ month past the 14-day resolution SLA"
    { company: 'Sky', issue: 'SLA Resolution Delay (Fix/Payout)', category: 'Smart Contract / Blockchain', sev: 'High', subDate: daysAgo(45) },
    { company: 'Sky', issue: 'SLA Resolution Delay (Fix/Payout)', category: 'Smart Contract / Blockchain', sev: 'High', subDate: daysAgo(45) },
    
    // adam alis - "Xterio ... escalated directly to the project on August 21, 2026"
    { company: 'Xterio', issue: 'SLA Response Delay (Triage)', category: 'Smart Contract / Blockchain', sev: 'N/A', subDate: daysAgo(10) },
    
    // 0 - "ENS audit submissions under apps/portal ... bot flags the scope ... Nobody can demonstrate the bug without it being out-of-scope"
    // Report IDs: #90896, #90894, #90255, #90245
    { company: 'ENS', issue: 'Unjustified Payment Refusal', category: 'Smart Contract / Blockchain', sev: 'N/A', subDate: daysAgo(10) },
    { company: 'ENS', issue: 'Unjustified Payment Refusal', category: 'Smart Contract / Blockchain', sev: 'N/A', subDate: daysAgo(10) },
    { company: 'ENS', issue: 'Unjustified Payment Refusal', category: 'Smart Contract / Blockchain', sev: 'N/A', subDate: daysAgo(10) },
    { company: 'ENS', issue: 'Unjustified Payment Refusal', category: 'Smart Contract / Blockchain', sev: 'N/A', subDate: daysAgo(10) }
];

setTimeout(() => {
    db.serialize(() => {
        const stmt = db.prepare(`INSERT INTO reports (id, bounty_category, platform, company_name, issue_type, severity, submission_date, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
        
        for(let r of newReports) {
            stmt.run([uuidv4(), r.category, 'Immunefi', r.company, r.issue, r.sev, r.subDate, today]);
        }
        stmt.finalize();
    });
    console.log(`Added ${newReports.length} newly named reports from Discord logs.`);
}, 1000);
