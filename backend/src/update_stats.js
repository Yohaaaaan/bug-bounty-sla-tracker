const fs = require('fs');

// 1. Update server.js
let serverCode = fs.readFileSync('/mnt/data/bug-bounty-sla-tracker/backend/src/server.js', 'utf-8');
const statsEndpoint = `// Endpoint pour les statistiques globales
app.get('/api/stats', (req, res) => {
    db.all(\`SELECT (SELECT COUNT(*) FROM reports WHERE is_hidden=0) as totalReports, (SELECT COUNT(DISTINCT company_name) FROM reports WHERE is_hidden=0) as totalCompanies\`, (err, totals) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        db.all(\`SELECT company_name, COUNT(*) as count FROM reports WHERE is_hidden=0 GROUP BY company_name ORDER BY count DESC LIMIT 10\`, (err, companyStats) => {
            db.all(\`SELECT platform, COUNT(*) as count FROM reports WHERE is_hidden=0 GROUP BY platform ORDER BY count DESC\`, (err, platformStats) => {
                db.all(\`SELECT issue_type, COUNT(*) as count FROM reports WHERE is_hidden=0 GROUP BY issue_type ORDER BY count DESC\`, (err, issueStats) => {
                    res.json({
                        totals: totals[0],
                        companyStats,
                        platformStats,
                        issueStats
                    });
                });
            });
        });
    });
});`;
serverCode = serverCode.replace(/\/\/ Endpoint pour les statistiques globales[\s\S]*?(?=\/\/ Endpoint pour signaler un rapport)/, statsEndpoint + '\n\n');
fs.writeFileSync('/mnt/data/bug-bounty-sla-tracker/backend/src/server.js', serverCode);

// 2. Generate new stats.html
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
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;900&display=swap" rel="stylesheet">
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
                    <a href="index.html" class="text-gray-300 hover:text-white text-sm font-medium transition">Home</a>
                    <a href="index.html#search" class="text-gray-300 hover:text-white text-sm font-medium transition">Search</a>
                    <a href="stats.html" class="text-white text-sm font-medium transition border-b-2 border-alertOrange pb-1">Stats</a>
                    <a href="about.html" class="text-gray-400 hover:text-white text-sm font-medium transition">About</a>
                    <a href="submit.html" class="bg-white/10 hover:bg-white/20 border border-white/10 text-white px-4 py-2 rounded-lg text-sm font-medium transition shadow-lg backdrop-blur-sm">Submit Report</a>
                </div>
            </div>
        </div>
    </nav>

    <main class="flex-grow max-w-6xl mx-auto px-4 py-16 w-full">
        <div class="text-center mb-12">
            <h1 class="text-4xl font-black tracking-tight mb-2 text-white">Platform Intelligence</h1>
            <p class="text-gray-400">Data-driven insights on bug bounty program responsiveness.</p>
        </div>
        
        <!-- KPI Row -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div class="bg-gradient-to-br from-white/[0.05] to-transparent border border-white/10 rounded-2xl p-6 relative overflow-hidden backdrop-blur-md">
                <div class="absolute top-0 right-0 p-4 opacity-10"><svg class="w-16 h-16 text-white" fill="currentColor" viewBox="0 0 20 20"><path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"></path><path fill-rule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clip-rule="evenodd"></path></svg></div>
                <p class="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">Total Reports</p>
                <p class="text-5xl font-black text-white" id="stat-total-reports">-</p>
            </div>
            <div class="bg-gradient-to-br from-white/[0.05] to-transparent border border-white/10 rounded-2xl p-6 relative overflow-hidden backdrop-blur-md">
                <div class="absolute top-0 right-0 p-4 opacity-10"><svg class="w-16 h-16 text-white" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clip-rule="evenodd"></path></svg></div>
                <p class="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">Enterprises Tracked</p>
                <p class="text-5xl font-black text-white" id="stat-total-companies">-</p>
            </div>
            <div class="bg-gradient-to-br from-alertRed/10 to-transparent border border-alertRed/20 rounded-2xl p-6 relative overflow-hidden backdrop-blur-md">
                <div class="absolute top-0 right-0 p-4 opacity-10"><svg class="w-16 h-16 text-alertRed" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clip-rule="evenodd"></path></svg></div>
                <p class="text-alertRed text-xs font-bold uppercase tracking-widest mb-1">Most Reported Entity</p>
                <p class="text-3xl font-black text-white truncate mt-2" id="stat-top-entity">-</p>
            </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <!-- Leaderboard -->
            <div class="lg:col-span-2 bg-white/[0.02] border border-white/10 rounded-3xl p-8 backdrop-blur-sm">
                <div class="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
                    <h2 class="text-xl font-bold text-white">Top Delayed Enterprises</h2>
                    <span class="text-xs bg-alertRed/20 text-alertRed px-2 py-1 rounded font-bold uppercase">Hall of Shame</span>
                </div>
                <div id="company-stats" class="space-y-5">
                    <div class="animate-pulse flex space-x-4"><div class="flex-1 space-y-4 py-1"><div class="h-4 bg-white/10 rounded w-3/4"></div><div class="h-4 bg-white/10 rounded"></div></div></div>
                </div>
            </div>

            <!-- Breakdown -->
            <div class="space-y-8">
                <div class="bg-white/[0.02] border border-white/10 rounded-3xl p-8 backdrop-blur-sm">
                    <h2 class="text-lg font-bold text-white border-b border-white/10 pb-4 mb-6">Issues Breakdown</h2>
                    <div id="issue-stats" class="space-y-4">Loading...</div>
                </div>
                <div class="bg-white/[0.02] border border-white/10 rounded-3xl p-8 backdrop-blur-sm">
                    <h2 class="text-lg font-bold text-white border-b border-white/10 pb-4 mb-6">Platform Distribution</h2>
                    <div id="platform-stats" class="space-y-4">Loading...</div>
                </div>
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
                if(data.companyStats.length > 0) {
                    document.getElementById('stat-top-entity').innerText = data.companyStats[0].company_name;
                }
                
                // Companies Leaderboard
                const cDiv = document.getElementById('company-stats');
                cDiv.innerHTML = '';
                const maxReports = data.companyStats.length ? data.companyStats[0].count : 1;
                
                data.companyStats.forEach((c, index) => {
                    const pct = Math.max((c.count / maxReports) * 100, 5);
                    let rankStyle = 'text-gray-500 font-bold';
                    if (index === 0) rankStyle = 'text-alertRed font-black text-xl drop-shadow-[0_0_8px_rgba(255,77,77,0.8)]';
                    else if (index === 1) rankStyle = 'text-alertOrange font-black text-lg';
                    else if (index === 2) rankStyle = 'text-yellow-500 font-black';

                    cDiv.innerHTML += \`
                        <div class="relative group">
                            <div class="flex items-center justify-between mb-1">
                                <div class="flex items-center gap-3">
                                    <span class="w-6 text-center \${rankStyle}">#\${index + 1}</span>
                                    <span class="font-bold text-gray-200 text-lg">\${c.company_name}</span>
                                </div>
                                <span class="font-mono text-sm text-gray-400"><strong class="text-white">\${c.count}</strong> reports</span>
                            </div>
                            <div class="w-full bg-white/5 rounded-full h-2.5 ml-9 overflow-hidden">
                                <div class="bg-gradient-to-r from-alertOrange to-alertRed h-2.5 rounded-full" style="width: \${pct}%"></div>
                            </div>
                        </div>
                    \`;
                });

                // Issues Breakdown
                const iDiv = document.getElementById('issue-stats');
                iDiv.innerHTML = '';
                const totalIssues = data.totals.totalReports || 1;
                data.issueStats.forEach(i => {
                    const pct = ((i.count / totalIssues) * 100).toFixed(1);
                    iDiv.innerHTML += \`
                        <div>
                            <div class="flex justify-between text-xs font-semibold mb-1">
                                <span class="text-gray-300">\${i.issue_type}</span>
                                <span class="text-gray-400">\${pct}%</span>
                            </div>
                            <div class="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                                <div class="bg-gray-400 h-1.5 rounded-full" style="width: \${pct}%"></div>
                            </div>
                        </div>
                    \`;
                });

                // Platform Distribution
                const pDiv = document.getElementById('platform-stats');
                pDiv.innerHTML = '';
                data.platformStats.forEach(p => {
                    const pct = ((p.count / totalIssues) * 100).toFixed(1);
                    pDiv.innerHTML += \`
                        <div class="flex justify-between items-center bg-black/40 p-3 rounded-lg border border-white/5">
                            <span class="text-sm font-medium text-gray-300">\${p.platform}</span>
                            <span class="text-xs bg-white/10 px-2 py-1 rounded text-white font-mono">\${p.count}</span>
                        </div>
                    \`;
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
console.log('Update complete.');
