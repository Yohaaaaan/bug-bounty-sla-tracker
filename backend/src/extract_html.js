const fs = require('fs');
const md = fs.readFileSync('/home/opc/.gemini/antigravity-cli/brain/3790fd66-7af9-45a1-8484-f228c668aa72/frontend_design.md', 'utf-8');

const indexMatch = md.match(/```html\n([\s\S]*?)```/g)[0].replace(/```html\n|```/g, '');
const submitMatch = md.match(/```html\n([\s\S]*?)```/g)[1].replace(/```html\n|```/g, '');

fs.writeFileSync('/mnt/data/bug-bounty-sla-tracker/frontend/index.html', indexMatch);
fs.writeFileSync('/mnt/data/bug-bounty-sla-tracker/frontend/submit.html', submitMatch);
console.log('HTML files extracted.');
