const fs = require('fs');

const standardNav = `
<div class="flex items-center space-x-6">
    <a href="index.html" class="text-gray-600 hover:text-gray-900 text-sm font-medium transition">Home</a>
    <a href="search.html" class="text-gray-600 hover:text-gray-900 text-sm font-medium transition">Search</a>
    <a href="stats.html" class="text-gray-600 hover:text-gray-900 text-sm font-medium transition">Stats</a>
    <a href="legal.html" class="text-gray-600 hover:text-gray-900 text-sm font-medium transition">Legal</a>
    <a href="submit.html" class="bg-gray-900 hover:bg-gray-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition shadow-lg backdrop-blur-sm">Submit Report</a>
</div>`;

const files = ['index.html', 'submit.html', 'about.html', 'stats.html', 'legal.html', 'search.html'];

for (const file of files) {
    const path = '/mnt/data/bug-bounty-sla-tracker/frontend/' + file;
    if (fs.existsSync(path)) {
        let content = fs.readFileSync(path, 'utf-8');
        // We replace whatever is inside <div class="flex items-center space-x-6"> ... </div>
        content = content.replace(/<div class="flex items-center space-x-6">[\s\S]*?<\/div>/, standardNav);
        fs.writeFileSync(path, content);
    }
}
console.log('Navbars forcefully reset.');
