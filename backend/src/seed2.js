const db = require('./database');
const { v4: uuidv4 } = require('uuid');

const web3Companies = ['Ostium', 'Livepeer', 'MakerDAO', 'Lido', 'Aave', 'Uniswap', 'Chainlink', 'Polygon', 'Arbitrum', 'Optimism', 'Synthetix', 'Curve', 'Balancer', 'Compound', 'Yearn', 'GMX', 'dYdX', '1inch', 'Pancakeswap', 'SushiSwap', 'Euler', 'LayerZero', 'ZkSync', 'Starknet', 'Celestia'];
const otherCompanies = ['Acme Corp', 'Tech Corp Inc', 'E-commerce SAS', 'BankApp', 'CloudNet'];
const platforms = ['Immunefi', 'Immunefi', 'Immunefi', 'HackerOne', 'Bugcrowd', 'Cantina', 'Sherlock', 'Code4rena']; // Immunefi weighted heavier
const issueTypes = ['SLA Response Delay (Triage)', 'SLA Resolution Delay (Fix/Payout)', 'Unjustified Severity Downgrade', 'Unjustified Payment Refusal', 'Ghosting (No response at all)'];
const severities = ['P1', 'P2', 'P3', 'P4', 'N/A'];
const categories = ['Web / API', 'Smart Contract / Blockchain', 'Mobile App'];

setTimeout(() => {
    db.serialize(() => {
        db.run("DELETE FROM reports"); // Clear existing
        for(let i = 0; i < 150; i++) {
            const id = uuidv4();
            const plat = platforms[Math.floor(Math.random() * platforms.length)];
            
            let comp = '';
            let cat = '';
            if (plat === 'Immunefi' || plat === 'Sherlock' || plat === 'Code4rena' || plat === 'Cantina') {
                comp = web3Companies[Math.floor(Math.random() * web3Companies.length)];
                cat = 'Smart Contract / Blockchain';
            } else {
                comp = (Math.random() > 0.3) ? web3Companies[Math.floor(Math.random() * web3Companies.length)] : otherCompanies[Math.floor(Math.random() * otherCompanies.length)];
                cat = categories[Math.floor(Math.random() * categories.length)];
            }
            
            const iss = issueTypes[Math.floor(Math.random() * issueTypes.length)];
            const sev = severities[Math.floor(Math.random() * severities.length)];
            const dateOffset = Math.floor(Math.random() * 180) * 24 * 60 * 60 * 1000;
            const date = new Date(Date.now() - dateOffset).toISOString().split('T')[0];
            
            db.run(`INSERT INTO reports (id, bounty_category, platform, company_name, issue_type, severity, submission_date) VALUES (?, ?, ?, ?, ?, ?, ?)`, 
                [id, cat, plat, comp, iss, sev, date]);
        }
    });
    console.log('Seeded 150 Web3-heavy fake reports!');
}, 500);
