const fs = require('fs');
const path = require('path');

const pagePath = path.join(__dirname, 'frontend', 'src', 'pages', 'ProjectDocumentsPage.tsx');
let content = fs.readFileSync(pagePath, 'utf8');

const oldCardRegex = /\{\/\* DPR Card \*\/\}\s*<div\s*onClick=\{[\s\S]*?className=\{`group relative overflow-hidden rounded-xl bg-card border \$\{showDprDetails \? 'border-primary shadow-md' : 'border-border'\} p-6 transition-all hover:shadow-md hover:border-primary cursor-pointer`\}\s*>\s*<div className="absolute top-0 right-0 p-4">\s*<button[\s\S]*?<\/div>\s*<div className="flex flex-col items-center mt-2">\s*<div className="h-16 w-16 bg-blue-100 dark:bg-blue-900\/40 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">\s*<FileCheck className="h-8 w-8" \/>\s*<\/div>\s*<h3 className="text-xl font-semibold mb-2 text-foreground group-hover:text-primary transition-colors text-center">DPR \(Daily progress report\)<\/h3>\s*<p className="text-sm text-muted-foreground text-center">Daily site progress report\.<\/p>\s*<\/div>\s*<\/div>/;

const newCard = `{/* DPR Card */}
                <button 
                    onClick={() => window.dispatchEvent(new CustomEvent('OPEN_DPR_MODAL'))}
                    className="flex flex-col items-center justify-center p-8 bg-card border border-border rounded-xl hover:border-primary/50 hover:shadow-md transition-all group"
                >
                    <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <FileCheck className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2 text-foreground group-hover:text-primary transition-colors text-center">DPR (Daily progress report)</h3>
                    <p className="text-sm text-muted-foreground text-center">Daily site progress report.</p>
                </button>`;

content = content.replace(oldCardRegex, newCard);

fs.writeFileSync(pagePath, content);
console.log("DPR Card patched successfully and safely!");
