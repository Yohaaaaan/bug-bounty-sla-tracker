const db = require('./database');
const { v4: uuidv4 } = require('uuid');

const today = new Date().toISOString();
function daysAgo(days) {
    const d = new Date();
    d.setDate(d.getDate() - days);
    return d.toISOString().split('T')[0];
}

const batch4Reports = [
    // Tristan Barry - Sei - #86436
    { company: 'Sei', issue: 'Unjustified Payment Refusal', category: 'Smart Contract / Blockchain', sev: 'N/A', subDate: daysAgo(5) },
    
    // 0xImladri - 1inch - #85640
    { company: '1inch', issue: 'Ghosting (No response at all)', category: 'Smart Contract / Blockchain', sev: 'N/A', subDate: daysAgo(38) },
    
    // 0xImladri - Sky - #85827
    { company: 'Sky', issue: 'Ghosting (No response at all)', category: 'Smart Contract / Blockchain', sev: 'N/A', subDate: daysAgo(38) },
    
    // ur4ndom - ENS - #90225
    { company: 'ENS', issue: 'Unjustified Payment Refusal', category: 'Smart Contract / Blockchain', sev: 'N/A', subDate: daysAgo(7) },
    
    // viktor - Rootstock
    { company: 'Rootstock', issue: 'Unjustified Payment Refusal', category: 'Smart Contract / Blockchain', sev: 'N/A', subDate: daysAgo(7) }
];

setTimeout(() => {
    db.serialize(() => {
        const stmt = db.prepare(`INSERT INTO reports (id, bounty_category, platform, company_name, issue_type, severity, submission_date, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
        
        for(let r of batch4Reports) {
            stmt.run([uuidv4(), r.category, 'Immunefi', r.company, r.issue, r.sev, r.subDate, today]);
        }
        stmt.finalize();
    });
    console.log(`Added 5 explicitly named reports from Batch 4.`);
}, 1000);
