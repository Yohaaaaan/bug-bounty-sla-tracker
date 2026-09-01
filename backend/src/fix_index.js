const fs = require('fs');

let index = fs.readFileSync('/mnt/data/bug-bounty-sla-tracker/frontend/index.html', 'utf-8');

// 1. Fix Search Links in all files
const files = ['index.html', 'submit.html', 'about.html', 'stats.html', 'legal.html'];
for (const file of files) {
    const path = '/mnt/data/bug-bounty-sla-tracker/frontend/' + file;
    let content = fs.readFileSync(path, 'utf-8');
    
    // Catch all variations of the search link
    content = content.replace(/<a href="index\.html#search"[^>]*>Search<\/a>/g, 
        '<a href="search.html" class="text-gray-600 hover:text-gray-900 text-sm font-medium transition">Search</a>');
    
    fs.writeFileSync(path, content);
}

// 2. Fix the Card template in index.html to be compacted
const compactCardTemplate = `\`
    <div class="bg-white shadow-sm border border-gray-100 rounded-lg p-3 sm:p-4 hover:shadow-md transition duration-200 relative overflow-hidden group flex flex-col justify-between">
        <div class="absolute top-0 left-0 w-1 h-full \${accentColor} opacity-70 group-hover:opacity-100 transition"></div>
        
        <div class="pl-2 w-full">
            <div class="flex justify-between items-start mb-1 gap-2">
                <h3 class="text-base sm:text-lg font-bold text-gray-900 leading-tight truncate" title="\${r.company_name}">\${r.company_name}</h3>
                <span class="text-[10px] text-gray-400 font-medium whitespace-nowrap pt-1">\${timeAgo(r.created_at)}</span>
            </div>
            
            <p class="\${titleColor} font-semibold text-[12px] mb-3 leading-snug line-clamp-1" title="\${r.issue_type}">\${r.issue_type}</p>
            
            <div class="flex justify-between items-center text-xs pt-3 border-t border-gray-100">
                <span class="px-2 py-0.5 rounded font-bold border \${getSeverityColor(r.severity)} text-[10px]">\${r.severity || 'N/A'}</span>
                <span class="bg-gray-50 text-gray-500 border border-gray-200 px-2 py-0.5 rounded uppercase tracking-wider font-bold text-[9px] truncate max-w-[100px] text-right" title="\${r.platform || 'Unknown'}">\${r.platform || 'Unknown'}</span>
            </div>
        </div>
    </div>
\`;`;

// Find the old innerHTML injection string and replace it
index = fs.readFileSync('/mnt/data/bug-bounty-sla-tracker/frontend/index.html', 'utf-8');
const regexCard = /grid\.innerHTML \+= \`[\s\S]*?<\/div>\n\s*\`;/m;
index = index.replace(regexCard, 'grid.innerHTML += ' + compactCardTemplate);

fs.writeFileSync('/mnt/data/bug-bounty-sla-tracker/frontend/index.html', index);

console.log('Fixed cards and links.');
