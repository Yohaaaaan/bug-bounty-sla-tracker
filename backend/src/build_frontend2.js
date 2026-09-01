const fs = require('fs');

const navLinks = `
                    <a href="index.html" class="text-gray-300 hover:text-white text-sm font-medium transition">Home</a>
                    <a href="index.html#search" onclick="setTimeout(()=>document.getElementById('searchInput').focus(), 100)" class="text-gray-300 hover:text-white text-sm font-medium transition">Search</a>
                    <a href="stats.html" class="text-gray-300 hover:text-white text-sm font-medium transition">Stats</a>
                    <a href="about.html" class="text-gray-400 hover:text-white text-sm font-medium transition">About</a>
                    <a href="submit.html" class="bg-white/10 hover:bg-white/20 border border-white/10 text-white px-4 py-2 rounded-lg text-sm font-medium transition shadow-lg backdrop-blur-sm">Submit Report</a>
`;

// Simple update for existing files to inject new navbar links
let index = fs.readFileSync('/mnt/data/bug-bounty-sla-tracker/frontend/index.html', 'utf-8');
index = index.replace(/<div class="flex items-center space-x-6">[\s\S]*?<\/div>/, `<div class="flex items-center space-x-6">${navLinks}</div>`);
fs.writeFileSync('/mnt/data/bug-bounty-sla-tracker/frontend/index.html', index);

let about = fs.readFileSync('/mnt/data/bug-bounty-sla-tracker/frontend/about.html', 'utf-8');
about = about.replace(/<div class="flex items-center space-x-6">[\s\S]*?<\/div>/, `<div class="flex items-center space-x-6">${navLinks}</div>`);
fs.writeFileSync('/mnt/data/bug-bounty-sla-tracker/frontend/about.html', about);

// Build stats.html
const statsHtml = `<!DOCTYPE html>
<html lang="en" class="dark">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Global Stats - BB SLA Tracker</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        tailwind.config = { darkMode: 'class', theme: { extend: { colors: { alertRed: '#ff4d4d', alertOrange: '#ff9900' }, fontFamily: { sans: ['Inter', 'sans-serif'] } } } }
    </script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
</head>
<body class="bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-[#0a0a0a] to-black text-gray-100 min-h-screen flex flex-col antialiased">
    
    <nav class="sticky top-0 z-50 bg-black/50 backdrop-blur-md border-b border-white/10">
        <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex items-center justify-between h-16">
                <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-full bg-gradient-to-tr from-alertOrange to-red-500 flex items-center justify-center shadow-[0_0_15px_rgba(255,153,0,0.5)]">
                        <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                    </div>
                    <span class="font-bold text-lg tracking-wide text-white">BB SLA Tracker</span>
                </div>
                <div class="flex items-center space-x-6">
                    ${navLinks}
                </div>
            </div>
        </div>
    </nav>

    <main class="flex-grow max-w-5xl mx-auto px-4 py-16 w-full">
        <h1 class="text-4xl font-extrabold mb-10 text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-500 text-center">Global Statistics</h1>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
            <div class="bg-white/[0.02] border border-white/10 rounded-2xl p-8 text-center backdrop-blur-sm">
                <p class="text-gray-400 text-sm font-semibold uppercase tracking-wider mb-2">Total Reports</p>
                <p class="text-6xl font-black text-white" id="stat-total-reports">-</p>
            </div>
            <div class="bg-white/[0.02] border border-white/10 rounded-2xl p-8 text-center backdrop-blur-sm">
                <p class="text-gray-400 text-sm font-semibold uppercase tracking-wider mb-2">Companies Tracked</p>
                <p class="text-6xl font-black text-white" id="stat-total-companies">-</p>
            </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-10">
            <div>
                <h2 class="text-xl font-bold mb-6 text-gray-200 border-b border-white/10 pb-3">Top Delayed Platforms</h2>
                <div id="platform-stats" class="space-y-4">Loading...</div>
            </div>
            <div>
                <h2 class="text-xl font-bold mb-6 text-gray-200 border-b border-white/10 pb-3">Breakdown by Issue Type</h2>
                <div id="issue-stats" class="space-y-4">Loading...</div>
            </div>
        </div>
    </main>

    <script>
        async function loadStats() {
            try {
                const res = await fetch('/api/stats');
                const data = await res.json();
                
                document.getElementById('stat-total-reports').innerText = data.totals.totalReports;
                document.getElementById('stat-total-companies').innerText = data.totals.totalCompanies;
                
                const pDiv = document.getElementById('platform-stats');
                pDiv.innerHTML = '';
                data.platformStats.forEach(p => {
                    pDiv.innerHTML += \`<div class="flex justify-between items-center bg-black/40 p-4 rounded-lg border border-white/5"><span class="font-medium text-gray-300">\${p.platform}</span><span class="bg-alertOrange/20 text-alertOrange px-3 py-1 rounded-full text-sm font-bold">\${p.count} Reports</span></div>\`;
                });

                const iDiv = document.getElementById('issue-stats');
                iDiv.innerHTML = '';
                data.issueStats.forEach(i => {
                    iDiv.innerHTML += \`<div class="flex justify-between items-center bg-black/40 p-4 rounded-lg border border-white/5"><span class="font-medium text-gray-300">\${i.issue_type}</span><span class="text-white font-bold">\${i.count}</span></div>\`;
                });
            } catch (e) {
                console.error(e);
            }
        }
        loadStats();
    </script>
</body>
</html>`;

fs.writeFileSync('/mnt/data/bug-bounty-sla-tracker/frontend/stats.html', statsHtml);
console.log('Stats page added and navbars updated.');
