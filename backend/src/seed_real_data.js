const db = require('./database');
const { v4: uuidv4 } = require('uuid');

const today = new Date().toISOString();
function daysAgo(days) {
    const d = new Date();
    d.setDate(d.getDate() - days);
    return d.toISOString().split('T')[0];
}

const realReports = [
    { company: 'SSV', issue: 'Ghosting (No response at all)', category: 'Smart Contract / Blockchain', sev: 'N/A', subDate: daysAgo(60) }, // "its been 2 months"
    { company: 'Sky', issue: 'Ghosting (No response at all)', category: 'Smart Contract / Blockchain', sev: 'Critical', subDate: daysAgo(49) }, // "#84578 - 49 days"
    { company: 'Project #85532', issue: 'Ghosting (No response at all)', category: 'Smart Contract / Blockchain', sev: 'Critical', subDate: daysAgo(30) }, // "about a month now without reply"
    { company: 'Project #86307', issue: 'SLA Resolution Delay (Fix/Payout)', category: 'Smart Contract / Blockchain', sev: 'High', subDate: daysAgo(35) }, // "last update from a month ago"
    { company: 'Project #87873', issue: 'SLA Response Delay (Triage)', category: 'Smart Contract / Blockchain', sev: 'Critical', subDate: daysAgo(22) }, // "22 days since i reported this Critical"
    { company: 'Project #86712', issue: 'SLA Resolution Delay (Fix/Payout)', category: 'Smart Contract / Blockchain', sev: 'N/A', subDate: daysAgo(30) }, // "a full month unable to reach a verdict"
    { company: 'Project #86638', issue: 'Ghosting (No response at all)', category: 'Smart Contract / Blockchain', sev: 'N/A', subDate: daysAgo(20) }, // "silence that's troubling"
    { company: 'Project #91263', issue: 'Unjustified Payment Refusal', category: 'Smart Contract / Blockchain', sev: 'Medium', subDate: daysAgo(10) }, // "closed for PKI... counted as invalid"
    { company: 'Project #70285', issue: 'Unjustified Payment Refusal', category: 'Smart Contract / Blockchain', sev: 'High', subDate: daysAgo(15) }, // "legit and proven by PoC but project won't accept"
    { company: 'Project #84070', issue: 'SLA Resolution Delay (Fix/Payout)', category: 'Smart Contract / Blockchain', sev: 'N/A', subDate: daysAgo(18) }, // "project didnt yet provide any update"
    { company: 'Project #85792', issue: 'SLA Response Delay (Triage)', category: 'Smart Contract / Blockchain', sev: 'N/A', subDate: daysAgo(14) }, // "duplicate dispute taking forever"
    { company: 'Project #87993', issue: 'SLA Response Delay (Triage)', category: 'Smart Contract / Blockchain', sev: 'N/A', subDate: daysAgo(12) }, // "When first reply for mediation?"
    { company: 'Project #85103', issue: 'SLA Resolution Delay (Fix/Payout)', category: 'Smart Contract / Blockchain', sev: 'N/A', subDate: daysAgo(25) }, // "behaving badly"
    { company: 'Project #87789', issue: 'Unjustified Payment Refusal', category: 'Smart Contract / Blockchain', sev: 'N/A', subDate: daysAgo(10) }, // "Mediation team agree with dispute reason, but it was not reopened"
    { company: 'Project #87790', issue: 'SLA Response Delay (Triage)', category: 'Smart Contract / Blockchain', sev: 'N/A', subDate: daysAgo(10) }, // Pinged by jayjoshix
    { company: 'Project #12073', issue: 'SLA Resolution Delay (Fix/Payout)', category: 'Smart Contract / Blockchain', sev: 'N/A', subDate: daysAgo(20) } // heisenberg92
];

setTimeout(() => {
    db.serialize(() => {
        db.run("DELETE FROM reports"); // Clear fake data
        
        const stmt = db.prepare(`INSERT INTO reports (id, bounty_category, platform, company_name, issue_type, severity, submission_date, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
        
        for(let r of realReports) {
            stmt.run([uuidv4(), r.category, 'Immunefi', r.company, r.issue, r.sev, r.subDate, today]);
        }
        stmt.finalize();
    });
    console.log(`Seeded ${realReports.length} real authentic reports from Discord logs.`);
}, 1000);
