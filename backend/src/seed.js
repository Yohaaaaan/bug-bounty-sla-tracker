const db = require('./database');
const { v4: uuidv4 } = require('uuid');

const companies = ['Ostium', 'Livepeer', 'Acme Corp', 'DeFi Swap', 'Tech Corp Inc', 'E-commerce SAS', 'YieldFarm', 'NFT Marketplace', 'CryptoWallet X', 'Web3Auth', 'CloudNet', 'BankApp'];
const platforms = ['Immunefi', 'HackerOne', 'Bugcrowd', 'YesWeHack', 'Code4rena', 'Cantina', 'Sherlock'];
const issueTypes = ['SLA Response Delay (Triage)', 'SLA Resolution Delay (Fix/Payout)', 'Unjustified Severity Downgrade', 'Unjustified Payment Refusal', 'Ghosting (No response at all)'];
const severities = ['P1', 'P2', 'P3', 'P4', 'N/A'];
const categories = ['Web / API', 'Smart Contract / Blockchain', 'Mobile App'];

setTimeout(() => {
    db.serialize(() => {
        for(let i = 0; i < 50; i++) {
            const id = uuidv4();
            const cat = categories[Math.floor(Math.random() * categories.length)];
            const plat = platforms[Math.floor(Math.random() * platforms.length)];
            const comp = companies[Math.floor(Math.random() * companies.length)];
            const iss = issueTypes[Math.floor(Math.random() * issueTypes.length)];
            const sev = severities[Math.floor(Math.random() * severities.length)];
            const dateOffset = Math.floor(Math.random() * 180) * 24 * 60 * 60 * 1000;
            const date = new Date(Date.now() - dateOffset).toISOString().split('T')[0];
            
            db.run(`INSERT INTO reports (id, bounty_category, platform, company_name, issue_type, severity, submission_date) VALUES (?, ?, ?, ?, ?, ?, ?)`, 
                [id, cat, plat, comp, iss, sev, date]);
        }
    });
    console.log('Seeded 50 fake reports!');
}, 500);
