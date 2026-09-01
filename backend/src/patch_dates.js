const fs = require('fs');

// 1. Patch Backend (server.js)
let serverCode = fs.readFileSync('/mnt/data/bug-bounty-sla-tracker/backend/src/server.js', 'utf-8');

const dateLogic = `
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

    db.get(\`SELECT * FROM pow_challenges`;

serverCode = serverCode.replace(/db\.get\(\`SELECT \* FROM pow_challenges/, dateLogic);
fs.writeFileSync('/mnt/data/bug-bounty-sla-tracker/backend/src/server.js', serverCode);

// 2. Patch Frontend (submit.html)
let submitHtml = fs.readFileSync('/mnt/data/bug-bounty-sla-tracker/frontend/submit.html', 'utf-8');

// Update labels
submitHtml = submitHtml.replace(/<span class="text-gray-500 text-xs ml-1">\(Taking too long to triage\/first reply\)<\/span>/, '<span class="text-gray-500 text-xs ml-1">(> 7 days without triage)</span>');
submitHtml = submitHtml.replace(/<span class="text-gray-500 text-xs ml-1">\(Bug accepted, but fix\/payout takes forever\)<\/span>/, '<span class="text-gray-500 text-xs ml-1">(> 30 days without fix/payout)</span>');
submitHtml = submitHtml.replace(/<span class="text-alertRed\/60 text-xs ml-1">\(Complete silence from team\)<\/span>/, '<span class="text-alertRed/60 text-xs ml-1">(> 14 days of complete silence)</span>');

// Update JS Logic
const jsLogic = `
                const issueType = formData.get('issue_type');
                const subDate = new Date(formData.get('submission_date'));
                const daysDiff = (new Date() - subDate) / (1000 * 60 * 60 * 24);

                if (issueType.includes('Ghosting') && daysDiff < 14) {
                    alert('Error: For "Ghosting", the initial submission date must be at least 14 days ago.');
                    btn.disabled = false; btn.innerText = 'Submit Report'; return;
                }
                if (issueType.includes('Response Delay') && daysDiff < 7) {
                    alert('Error: For a "Response Delay", the submission must be at least 7 days old.');
                    btn.disabled = false; btn.innerText = 'Submit Report'; return;
                }
                if (issueType.includes('Resolution Delay') && daysDiff < 30) {
                    alert('Error: For a "Resolution Delay", the submission must be at least 30 days old.');
                    btn.disabled = false; btn.innerText = 'Submit Report'; return;
                }

                const resChallenge`;

submitHtml = submitHtml.replace(/const resChallenge/, jsLogic);
fs.writeFileSync('/mnt/data/bug-bounty-sla-tracker/frontend/submit.html', submitHtml);

console.log('Date validation patched successfully.');
