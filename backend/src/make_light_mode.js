const fs = require('fs');

// 1. Fix Server.js (Trust proxy & disable strict rate limiting for testing)
let serverCode = fs.readFileSync('/mnt/data/bug-bounty-sla-tracker/backend/src/server.js', 'utf-8');
// Replace rate limit max from 10 to 1000 to bypass proxy issues
serverCode = serverCode.replace(/max: \d+,/, 'max: 1000,');
// Add trust proxy if not there
if(!serverCode.includes('trust proxy')) {
    serverCode = serverCode.replace(/const app = express\(\);/, "const app = express();\napp.set('trust proxy', 1);");
}
fs.writeFileSync('/mnt/data/bug-bounty-sla-tracker/backend/src/server.js', serverCode);

// 2. Light Theme CSS Replacements helper
function toLight(html) {
    // Basic body
    html = html.replace(/<html lang="en" class="dark">/, '<html lang="en">');
    html = html.replace(/bg-\[radial-gradient[^"\]]+\] from-slate-900 via-\[\#0a0a0a\] to-black text-gray-100/, 'bg-gray-50 text-gray-900');
    // Navbar
    html = html.replace(/bg-black\/50 backdrop-blur-md border-b border-white\/10/, 'bg-white/80 backdrop-blur-md border-b border-gray-200 shadow-sm');
    // Typography
    html = html.replace(/text-gray-300 hover:text-white/g, 'text-gray-600 hover:text-gray-900');
    html = html.replace(/text-gray-400 hover:text-white/g, 'text-gray-500 hover:text-gray-900');
    html = html.replace(/text-gray-200/g, 'text-gray-800');
    html = html.replace(/text-white/g, 'text-gray-900');
    html = html.replace(/text-gray-400/g, 'text-gray-500');
    html = html.replace(/text-gray-300/g, 'text-gray-600');
    html = html.replace(/text-gray-500/g, 'text-gray-500');
    html = html.replace(/bg-white\/10 hover:bg-white\/20 border border-white\/10 text-white/g, 'bg-gray-900 hover:bg-gray-800 text-white border border-transparent');
    
    // Cards & Elements
    html = html.replace(/bg-white\/\[0\.02\]/g, 'bg-white shadow-md');
    html = html.replace(/border-white\/10/g, 'border-gray-200');
    html = html.replace(/border-white\/5/g, 'border-gray-100');
    html = html.replace(/bg-black\/40/g, 'bg-gray-50');
    html = html.replace(/bg-black\/20/g, 'bg-gray-50');
    html = html.replace(/bg-black/g, 'bg-white');
    html = html.replace(/hover:bg-white\/\[0\.04\]/g, 'hover:shadow-lg');
    html = html.replace(/shadow-\[0_0_15px_rgba\(255,153,0,0\.5\)\]/g, 'shadow-md');
    html = html.replace(/shadow-\[0_0_10px_rgba[^\]]+\]/g, 'shadow-sm');
    
    // Inputs
    html = html.replace(/focus:border-alertOrange/g, 'focus:border-alertOrange');
    
    // Fix gradients
    html = html.replace(/bg-gradient-to-r from-white to-gray-500/g, 'bg-gradient-to-r from-gray-900 to-gray-600');
    html = html.replace(/bg-gradient-to-br from-white\/\[0\.05\] to-transparent/g, 'bg-white shadow-sm');
    
    return html;
}

// 3. Process index.html
let index = fs.readFileSync('/mnt/data/bug-bounty-sla-tracker/frontend/index.html', 'utf-8');
index = toLight(index);
fs.writeFileSync('/mnt/data/bug-bounty-sla-tracker/frontend/index.html', index);

// 4. Process about.html
let about = fs.readFileSync('/mnt/data/bug-bounty-sla-tracker/frontend/about.html', 'utf-8');
about = toLight(about);
fs.writeFileSync('/mnt/data/bug-bounty-sla-tracker/frontend/about.html', about);

// 5. Process submit.html
let submit = fs.readFileSync('/mnt/data/bug-bounty-sla-tracker/frontend/submit.html', 'utf-8');
submit = toLight(submit);
// form inputs special fix
submit = submit.replace(/color-scheme:\s*dark/g, 'color-scheme: light');
fs.writeFileSync('/mnt/data/bug-bounty-sla-tracker/frontend/submit.html', submit);

// 6. Process stats.html & FIX Progress Bar overflow
let stats = fs.readFileSync('/mnt/data/bug-bounty-sla-tracker/frontend/stats.html', 'utf-8');
stats = toLight(stats);
// Progress Bar fix: change `w-full bg-white/5 rounded-full h-2.5 ml-9 overflow-hidden`
// to something that doesn't push it out. Easiest is wrap the top row in a flex col or just margin top.
stats = stats.replace(/<div class="w-full bg-white\/5 rounded-full h-2\.5 ml-9 overflow-hidden">/g, 
                     '<div class="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden mt-1">');
// Also fix empty backgrounds in stats
stats = stats.replace(/bg-white\/5/g, 'bg-gray-200');
stats = stats.replace(/text-white/g, 'text-gray-900'); // final catch

fs.writeFileSync('/mnt/data/bug-bounty-sla-tracker/frontend/stats.html', stats);

console.log('Light theme applied, progress bars fixed, and API limits bumped.');
