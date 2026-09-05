const fs = require('fs');

const indexHtml = `<!DOCTYPE html>
<html lang="en" class="dark">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SLAScan</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        tailwind.config = {
            darkMode: 'class',
            theme: {
                extend: {
                    colors: { alertRed: '#ff4d4d', alertOrange: '#ff9900', alertGreen: '#00cc66' },
                    fontFamily: { sans: ['Inter', 'sans-serif'] }
                }
            }
        }
    </script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>body { font-family: 'Inter', sans-serif; }</style>
</head>
<body class="bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-[#0a0a0a] to-black text-gray-100 min-h-screen flex flex-col antialiased">
    
    <!-- Navbar -->
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
                    <a href="about.html" class="text-gray-400 hover:text-white text-sm font-medium transition">About</a>
                    <a href="submit.html" class="bg-white/10 hover:bg-white/20 border border-white/10 text-white px-4 py-2 rounded-lg text-sm font-medium transition shadow-lg backdrop-blur-sm">Submit Report</a>
                </div>
            </div>
        </div>
    </nav>

    <!-- Main Content -->
    <main class="flex-grow max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full">
        <!-- Hero Section -->
        <div class="text-center mb-16 relative">
            <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-alertOrange/20 blur-[100px] rounded-full pointer-events-none"></div>
            <h1 class="text-5xl sm:text-6xl font-extrabold mb-6 tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-500">Transparency in Bug Bounty</h1>
            <p class="text-lg text-gray-400 max-w-2xl mx-auto font-light leading-relaxed">Anonymous tracking of unresolved SLAs, ghosting, and payment issues. Driven by the community, secured by Proof-of-Work.</p>
        </div>

        <!-- Search & Grid -->
        <div class="space-y-6 relative z-10">
            <div class="flex flex-col sm:flex-row justify-between items-end sm:items-center border-b border-white/10 pb-4 mb-8 gap-4">
                <h2 class="text-xl font-semibold text-gray-200">Latest Community Reports</h2>
                <div class="relative w-full sm:w-80">
                    <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                    </div>
                    <input type="text" id="searchInput" placeholder="Search by company..." class="w-full bg-black/40 border border-white/10 rounded-lg py-2 pl-10 pr-3 text-sm text-white focus:outline-none focus:border-alertOrange focus:ring-1 focus:ring-alertOrange transition backdrop-blur-sm">
                </div>
            </div>
            
            <div id="reportsGrid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div class="col-span-full text-center py-10 text-gray-500">Loading reports...</div>
            </div>
        </div>
    </main>

    <script>
        function timeAgo(dateString) {
            const date = new Date(dateString);
            const seconds = Math.floor((new Date() - date) / 1000);
            let interval = seconds / 31536000;
            if (interval > 1) return Math.floor(interval) + " years ago";
            interval = seconds / 2592000;
            if (interval > 1) return Math.floor(interval) + " months ago";
            interval = seconds / 86400;
            if (interval > 1) return Math.floor(interval) + " days ago";
            interval = seconds / 3600;
            if (interval > 1) return Math.floor(interval) + " hours ago";
            interval = seconds / 60;
            if (interval > 1) return Math.floor(interval) + " minutes ago";
            return "Just now";
        }

        function getSeverityColor(sev) {
            if (sev === 'P1') return 'text-alertRed bg-alertRed/10 border-alertRed/20';
            if (sev === 'P2') return 'text-alertOrange bg-alertOrange/10 border-alertOrange/20';
            return 'text-gray-300 bg-white/5 border-white/10';
        }

        async function fetchReports(query = '') {
            try {
                const res = await fetch(\`/api/reports?search=\${encodeURIComponent(query)}\`);
                const reports = await res.json();
                const grid = document.getElementById('reportsGrid');
                grid.innerHTML = '';
                
                if (reports.length === 0) {
                    grid.innerHTML = '<div class="col-span-full text-center py-10 text-gray-500">No reports found.</div>';
                    return;
                }

                reports.forEach(r => {
                    // Decide accent color based on issue type
                    let accentColor = 'bg-gray-600';
                    let titleColor = 'text-gray-300';
                    
                    if (r.issue_type.includes('Refusal') || r.issue_type.includes('Ghosting')) {
                        accentColor = 'bg-alertRed shadow-[0_0_10px_rgba(255,77,77,0.5)]';
                        titleColor = 'text-alertRed';
                    } else if (r.issue_type.includes('Downgrade') || r.issue_type.includes('Delay')) {
                        accentColor = 'bg-alertOrange shadow-[0_0_10px_rgba(255,153,0,0.5)]';
                        titleColor = 'text-alertOrange';
                    }

                    grid.innerHTML += \`
                        <div class="bg-white/[0.02] border border-white/10 rounded-xl p-6 hover:bg-white/[0.04] transition duration-300 relative overflow-hidden group">
                            <div class="absolute top-0 left-0 w-1 h-full \${accentColor} opacity-70 group-hover:opacity-100 transition"></div>
                            <div class="flex justify-between items-start mb-4">
                                <span class="bg-black/50 text-[10px] uppercase tracking-wider font-semibold px-2.5 py-1 rounded-md text-gray-400 border border-white/5">\${r.platform || 'Unknown Platform'}</span>
                                <span class="text-xs text-gray-500 font-medium">\${timeAgo(r.created_at)}</span>
                            </div>
                            <h3 class="text-xl font-bold mb-1 text-white">\${r.company_name}</h3>
                            <p class="\${titleColor} font-medium text-sm mb-5">\${r.issue_type}</p>
                            
                            <div class="flex justify-between items-center text-sm border-t border-white/10 pt-4">
                                <span class="px-2 py-1 rounded text-xs font-semibold border \${getSeverityColor(r.severity)}">\${r.severity || 'N/A'}</span>
                                <span class="flex items-center gap-1.5 text-gray-400 text-xs font-medium uppercase tracking-wider">
                                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                    \${r.status}
                                </span>
                            </div>
                        </div>
                    \`;
                });
            } catch (e) {
                console.error(e);
            }
        }

        document.getElementById('searchInput').addEventListener('input', (e) => {
            fetchReports(e.target.value);
        });

        // Init
        fetchReports();
    </script>
</body>
</html>`;

const submitHtml = `<!DOCTYPE html>
<html lang="en" class="dark">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Submit a Report - BB SLA Tracker</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        tailwind.config = {
            darkMode: 'class',
            theme: {
                extend: {
                    colors: { alertRed: '#ff4d4d', alertOrange: '#ff9900' },
                    fontFamily: { sans: ['Inter', 'sans-serif'] }
                }
            }
        }
    </script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet">
    <style>body { font-family: 'Inter', sans-serif; }</style>
</head>
<body class="bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-[#0a0a0a] to-black text-gray-100 min-h-screen flex flex-col antialiased">

    <nav class="bg-black/50 backdrop-blur-md border-b border-white/10 sticky top-0 z-50">
        <div class="max-w-3xl mx-auto px-4 py-4 flex justify-between items-center">
            <a href="index.html" class="flex items-center gap-2 text-gray-400 hover:text-white text-sm font-medium transition">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                Back to Feed
            </a>
            <span class="font-semibold text-alertOrange text-sm tracking-wide uppercase">Secure Submission</span>
        </div>
    </nav>

    <main class="flex-grow max-w-3xl mx-auto px-4 py-12 w-full">
        
        <div class="mb-10 text-center">
            <h1 class="text-3xl font-bold mb-3 text-white">Report an Issue</h1>
            <p class="text-sm text-gray-400 leading-relaxed max-w-xl mx-auto">This form is 100% anonymous. <strong class="text-gray-200">Do not include technical details about vulnerabilities.</strong> Your browser will perform a Proof-of-Work to prevent spam.</p>
        </div>

        <form id="reportForm" class="bg-white/[0.02] border border-white/10 backdrop-blur-md rounded-2xl p-6 sm:p-10 shadow-2xl space-y-8 relative overflow-hidden">
            <div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-alertOrange to-alertRed"></div>
            
            <div class="hidden" aria-hidden="true">
                <label for="website_url">Honeypot</label>
                <input type="text" id="website_url" name="website_url" tabindex="-1" autocomplete="off">
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                    <label class="block text-sm font-medium text-gray-300 mb-2">1. Category</label>
                    <select name="bounty_category" required class="w-full bg-black/40 border border-white/10 rounded-lg py-3 px-4 text-sm text-white focus:outline-none focus:border-alertOrange focus:ring-1 focus:ring-alertOrange appearance-none">
                        <option value="" disabled selected>Select...</option>
                        <option value="Web / API">Web / API</option>
                        <option value="Smart Contract / Blockchain">Smart Contract / Blockchain</option>
                        <option value="Mobile App">Mobile App</option>
                        <option value="Hardware / IoT">Hardware / IoT</option>
                    </select>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-300 mb-2">2. Platform</label>
                    <input type="text" name="platform" list="platforms-list" required placeholder="e.g. Immunefi, HackerOne..." autocomplete="off" class="w-full bg-black/40 border border-white/10 rounded-lg py-3 px-4 text-sm text-white focus:outline-none focus:border-alertOrange focus:ring-1 focus:ring-alertOrange">
                    <datalist id="platforms-list">
                        <option value="Immunefi"></option>
                        <option value="Sherlock"></option>
                        <option value="Code4rena"></option>
                        <option value="Cantina"></option>
                        <option value="HackerOne"></option>
                        <option value="Bugcrowd"></option>
                        <option value="Direct Program"></option>
                    </datalist>
                </div>
            </div>

            <div>
                <label class="block text-sm font-medium text-gray-300 mb-2">3. Target Company or Protocol</label>
                <input type="text" name="company_name" id="company_name" required list="companies-list" placeholder="e.g. Acme Corp, DeFi Swap..." autocomplete="off" class="w-full bg-black/40 border border-white/10 rounded-lg py-3 px-4 text-sm text-white focus:outline-none focus:border-alertOrange focus:ring-1 focus:ring-alertOrange">
                <datalist id="companies-list">
                    <!-- Populated by JS -->
                </datalist>
                <p class="text-xs text-gray-500 mt-2">Type to search existing companies or enter a new one.</p>
            </div>

            <div>
                <label class="block text-sm font-medium text-gray-300 mb-3">4. Issue Type</label>
                <div class="space-y-3">
                    <label class="flex items-center p-4 border border-white/10 bg-black/20 rounded-lg cursor-pointer hover:bg-white/5 transition">
                        <input type="radio" name="issue_type" value="SLA Response Delay (Triage)" required class="w-4 h-4 text-alertOrange focus:ring-alertOrange bg-black border-gray-600">
                        <span class="ml-3 text-sm text-gray-200"><strong>SLA Response Delay</strong> <span class="text-gray-500 text-xs ml-1">(Taking too long to triage/first reply)</span></span>
                    </label>
                    <label class="flex items-center p-4 border border-white/10 bg-black/20 rounded-lg cursor-pointer hover:bg-white/5 transition">
                        <input type="radio" name="issue_type" value="SLA Resolution Delay (Fix/Payout)" class="w-4 h-4 text-alertOrange focus:ring-alertOrange bg-black border-gray-600">
                        <span class="ml-3 text-sm text-gray-200"><strong>SLA Resolution Delay</strong> <span class="text-gray-500 text-xs ml-1">(Bug accepted, but fix/payout takes forever)</span></span>
                    </label>
                    <label class="flex items-center p-4 border border-alertOrange/30 bg-alertOrange/5 rounded-lg cursor-pointer hover:bg-alertOrange/10 transition">
                        <input type="radio" name="issue_type" value="Unjustified Severity Downgrade" class="w-4 h-4 text-alertOrange focus:ring-alertOrange bg-black border-alertOrange">
                        <span class="ml-3 text-sm text-alertOrange font-medium">Unjustified Severity Downgrade</span>
                    </label>
                    <label class="flex items-center p-4 border border-alertRed/30 bg-alertRed/5 rounded-lg cursor-pointer hover:bg-alertRed/10 transition">
                        <input type="radio" name="issue_type" value="Unjustified Payment Refusal" class="w-4 h-4 text-alertRed focus:ring-alertRed bg-black border-alertRed">
                        <span class="ml-3 text-sm text-alertRed font-medium">Unjustified Payment Refusal</span>
                    </label>
                    <label class="flex items-center p-4 border border-alertRed/30 bg-alertRed/5 rounded-lg cursor-pointer hover:bg-alertRed/10 transition">
                        <input type="radio" name="issue_type" value="Ghosting (No response at all)" class="w-4 h-4 text-alertRed focus:ring-alertRed bg-black border-alertRed">
                        <span class="ml-3 text-sm text-alertRed font-medium">Ghosting <span class="text-alertRed/60 text-xs ml-1">(Complete silence from team)</span></span>
                    </label>
                </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-white/10 pt-8">
                <div>
                    <label class="block text-sm font-medium text-gray-300 mb-3">5. Severity</label>
                    <div class="flex gap-6">
                        <label class="flex items-center cursor-pointer"><input type="radio" name="severity" value="P1" required class="mr-2 text-alertOrange focus:ring-alertOrange bg-black border-gray-600"> <span class="text-sm font-medium">P1</span></label>
                        <label class="flex items-center cursor-pointer"><input type="radio" name="severity" value="P2" class="mr-2 text-alertOrange focus:ring-alertOrange bg-black border-gray-600"> <span class="text-sm font-medium">P2</span></label>
                        <label class="flex items-center cursor-pointer"><input type="radio" name="severity" value="P3" class="mr-2 text-alertOrange focus:ring-alertOrange bg-black border-gray-600"> <span class="text-sm font-medium">P3</span></label>
                        <label class="flex items-center cursor-pointer"><input type="radio" name="severity" value="P4" class="mr-2 text-alertOrange focus:ring-alertOrange bg-black border-gray-600"> <span class="text-sm font-medium">P4</span></label>
                        <label class="flex items-center cursor-pointer"><input type="radio" name="severity" value="N/A" class="mr-2 text-gray-400 focus:ring-gray-400 bg-black border-gray-600"> <span class="text-sm font-medium text-gray-400">N/A</span></label>
                    </div>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-300 mb-2">6. Initial Submission Date</label>
                    <input type="date" name="submission_date" required class="w-full bg-black/40 border border-white/10 rounded-lg py-2.5 px-4 text-sm text-white focus:outline-none focus:border-alertOrange focus:ring-1 focus:ring-alertOrange color-scheme-dark" style="color-scheme: dark;">
                </div>
            </div>

            <div class="pt-6 flex justify-between items-center">
                <span class="text-xs text-gray-500 flex items-center gap-1">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                    PoW Check on Submit
                </span>
                <button type="submit" id="submitBtn" class="bg-white/10 hover:bg-white/20 border border-white/20 text-white px-8 py-3 rounded-lg font-semibold transition duration-300 shadow-lg backdrop-blur-sm disabled:opacity-50">
                    Submit Report
                </button>
            </div>
        </form>
    </main>

    <script>
        // Populate companies list
        async function loadCompanies() {
            try {
                const res = await fetch('/api/companies');
                const companies = await res.json();
                const datalist = document.getElementById('companies-list');
                // Seed test companies if empty
                if (!companies.includes('Ostium')) datalist.innerHTML += '<option value="Ostium"></option>';
                if (!companies.includes('Livepeer')) datalist.innerHTML += '<option value="Livepeer"></option>';
                
                companies.forEach(c => {
                    if(c !== 'Ostium' && c !== 'Livepeer') datalist.innerHTML += \`<option value="\${c}"></option>\`;
                });
            } catch (e) { console.error(e); }
        }
        loadCompanies();

        // Form submission with PoW
        document.getElementById('reportForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = document.getElementById('submitBtn');
            btn.disabled = true;
            btn.innerText = 'Verifying PoW...';

            try {
                const resChallenge = await fetch('/api/pow-challenge');
                const { challenge, difficulty } = await resChallenge.json();

                let nonce = 0;
                const prefix = '0'.repeat(difficulty);
                const encoder = new TextEncoder();
                
                // Keep UI somewhat responsive
                const computeBatch = async () => {
                    for(let i=0; i<20000; i++) {
                        const data = encoder.encode(challenge + nonce);
                        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
                        const hashArray = Array.from(new Uint8Array(hashBuffer));
                        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
                        if (hashHex.startsWith(prefix)) return nonce;
                        nonce++;
                    }
                    return new Promise(resolve => setTimeout(() => resolve(computeBatch()), 0));
                };

                btn.innerText = 'Calculating Proof of Work...';
                const foundNonce = await computeBatch();

                btn.innerText = 'Submitting...';
                const formData = new FormData(e.target);
                const payload = Object.fromEntries(formData.entries());
                payload.pow_challenge = challenge;
                payload.pow_nonce = foundNonce;

                const resSubmit = await fetch('/api/reports', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                if (resSubmit.ok) {
                    window.location.href = 'index.html';
                } else {
                    const err = await resSubmit.json();
                    alert('Error: ' + (err.error || 'Submission failed'));
                }
            } catch (err) {
                console.error(err);
                alert('Connection error. Is the backend running?');
            } finally {
                btn.disabled = false;
                btn.innerText = 'Submit Report';
            }
        });
    </script>
</body>
</html>`;

const aboutHtml = `<!DOCTYPE html>
<html lang="en" class="dark">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>About - BB SLA Tracker</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        tailwind.config = {
            darkMode: 'class',
            theme: {
                extend: {
                    colors: { alertOrange: '#ff9900' },
                    fontFamily: { sans: ['Inter', 'sans-serif'] }
                }
            }
        }
    </script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>body { font-family: 'Inter', sans-serif; }</style>
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
                    <a href="index.html" class="text-gray-400 hover:text-white text-sm font-medium transition">Home</a>
                    <a href="about.html" class="text-gray-300 hover:text-white text-sm font-medium transition">About</a>
                    <a href="submit.html" class="bg-white/10 hover:bg-white/20 border border-white/10 text-white px-4 py-2 rounded-lg text-sm font-medium transition shadow-lg backdrop-blur-sm">Submit Report</a>
                </div>
            </div>
        </div>
    </nav>

    <main class="flex-grow max-w-3xl mx-auto px-4 py-16 w-full text-center">
        <h1 class="text-4xl font-extrabold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-500">About This Project</h1>
        
        <div class="bg-white/[0.02] border border-white/10 rounded-2xl p-8 sm:p-12 text-left shadow-2xl backdrop-blur-sm mb-8 space-y-6">
            <h2 class="text-2xl font-semibold text-white">100% Free & Community-Driven</h2>
            <p class="text-gray-400 leading-relaxed">
                The Bug Bounty ecosystem thrives on trust. Unfortunately, delayed payouts, ghosting, and ignored Service Level Agreements (SLAs) harm researchers. This tracker is built to bring transparency. 
            </p>
            <p class="text-gray-400 leading-relaxed">
                It is <strong>completely free</strong>, open to everyone, and relies entirely on community reports. No accounts, no tracing, no corporate oversight. Just raw, factual data to help researchers decide where to invest their time.
            </p>

            <h2 class="text-2xl font-semibold text-white mt-8">How it works</h2>
            <ul class="list-disc pl-5 text-gray-400 space-y-2">
                <li><strong>Anonymous:</strong> We don't track IPs or ask for logins.</li>
                <li><strong>Anti-Spam:</strong> Every submission requires your browser to solve a cryptographic puzzle (Proof of Work) before the server accepts it.</li>
                <li><strong>Self-Moderated:</strong> If a report is abusive, the community can downvote it. After enough downvotes, it is automatically hidden.</li>
            </ul>
        </div>

        <button onclick="shareSite()" class="inline-flex items-center gap-2 bg-gradient-to-r from-alertOrange to-red-600 hover:from-orange-400 hover:to-red-500 text-white px-8 py-4 rounded-xl font-bold transition shadow-[0_0_20px_rgba(255,153,0,0.4)]">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"></path></svg>
            Share the Tracker
        </button>
    </main>

    <script>
        function shareSite() {
            if (navigator.share) {
                navigator.share({
                    title: 'SLAScan',
                    text: 'Check out this community-driven tracker for Bug Bounty SLA delays and payment issues.',
                    url: window.location.origin
                }).catch(console.error);
            } else {
                navigator.clipboard.writeText(window.location.origin);
                alert('Link copied to clipboard!');
            }
        }
    </script>
</body>
</html>`;

fs.writeFileSync('/mnt/data/bug-bounty-sla-tracker/frontend/index.html', indexHtml);
fs.writeFileSync('/mnt/data/bug-bounty-sla-tracker/frontend/submit.html', submitHtml);
fs.writeFileSync('/mnt/data/bug-bounty-sla-tracker/frontend/about.html', aboutHtml);
console.log('Frontend built.');
