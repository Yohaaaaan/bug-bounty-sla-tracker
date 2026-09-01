const fs = require('fs');

const legalHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Legal & Privacy - BB SLA Tracker</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>body { font-family: 'Inter', sans-serif; }</style>
</head>
<body class="bg-gray-50 text-gray-900 min-h-screen flex flex-col antialiased">
    <nav class="bg-white/80 backdrop-blur-md border-b border-gray-200 shadow-sm sticky top-0 z-50">
        <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex items-center justify-between h-16">
                <div class="flex items-center gap-3">
                    <span class="font-bold text-lg tracking-wide">BB SLA Tracker</span>
                </div>
                <div class="flex items-center space-x-6">
                    <a href="index.html" class="text-gray-600 hover:text-gray-900 text-sm font-medium transition">Home</a>
                </div>
            </div>
        </div>
    </nav>
    <main class="flex-grow max-w-4xl mx-auto px-4 py-16 w-full">
        <h1 class="text-3xl font-black mb-8">Privacy Policy & Terms of Use</h1>
        
        <div class="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 space-y-6">
            <section>
                <h2 class="text-xl font-bold mb-3">1. Anonymous Data Collection</h2>
                <p class="text-gray-600 leading-relaxed">BB SLA Tracker is designed with absolute privacy in mind. We do <strong>not</strong> collect, store, or track IP addresses, browser fingerprints, or user accounts. All submissions are entirely anonymous. We do not use tracking cookies.</p>
            </section>
            <section>
                <h2 class="text-xl font-bold mb-3">2. Content & Responsibility</h2>
                <p class="text-gray-600 leading-relaxed">This platform is a community-driven aggregator of purely factual SLA (Service Level Agreement) metadata. Users are strictly prohibited from submitting sensitive vulnerability data, technical details, or personally identifiable information (PII). Any such data will be immediately purged.</p>
            </section>
            <section>
                <h2 class="text-xl font-bold mb-3">3. Anti-Spam (Proof-of-Work)</h2>
                <p class="text-gray-600 leading-relaxed">To prevent automated abuse without using invasive captchas (like reCAPTCHA), we utilize a client-side cryptographic Proof-of-Work (PoW). Your device computes a hash to validate the submission.</p>
            </section>
            <section>
                <h2 class="text-xl font-bold mb-3">4. Community Moderation</h2>
                <p class="text-gray-600 leading-relaxed">Reports are self-moderated by the community. Any report receiving a threshold of downvotes is automatically quarantined and hidden from the public feed.</p>
            </section>
            <section>
                <h2 class="text-xl font-bold mb-3">5. Open Source & Liability</h2>
                <p class="text-gray-600 leading-relaxed">This tool is provided "as is", without warranty of any kind. We are not affiliated with any bug bounty platforms or companies listed in the database.</p>
            </section>
        </div>
    </main>
</body>
</html>`;

fs.writeFileSync('/mnt/data/bug-bounty-sla-tracker/frontend/legal.html', legalHtml);

// Add footer to all pages
const footerHtml = `
    <footer class="border-t border-gray-200 bg-white py-6 mt-10">
        <div class="max-w-6xl mx-auto px-4 text-center">
            <p class="text-gray-500 text-sm">BB SLA Tracker &copy; 2026. Community Driven.</p>
            <div class="mt-2 space-x-4">
                <a href="legal.html" class="text-xs text-gray-400 hover:text-gray-600">Privacy Policy & Terms</a>
            </div>
        </div>
    </footer>
</body>`;

const files = ['index.html', 'submit.html', 'about.html', 'stats.html'];
for (const file of files) {
    const path = '/mnt/data/bug-bounty-sla-tracker/frontend/' + file;
    let content = fs.readFileSync(path, 'utf-8');
    if (!content.includes('footer>')) {
        content = content.replace(/<\/body>/, footerHtml);
        fs.writeFileSync(path, content);
    }
}
console.log('Legal page added and footers injected.');
