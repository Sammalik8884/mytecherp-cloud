const fs = require('fs');
const path = require('path');

const pagePath = path.join(__dirname, 'frontend', 'src', 'pages', 'ProjectDocumentsPage.tsx');
let content = fs.readFileSync(pagePath, 'utf8');

// 1. Replace the DPR Card
const oldCardRegex = /\{\/\* DPR Card \*\/\}\s*<div\s*onClick=\{[\s\S]*?className=\{`group relative overflow-hidden rounded-xl bg-card border \$\{showDprDetails \? 'border-primary shadow-md' : 'border-border'\} p-6 transition-all hover:shadow-md hover:border-primary cursor-pointer`\}\s*>\s*<div className="absolute top-0 right-0 p-4">\s*<button[\s\S]*?<\/div>\s*<div className="flex flex-col items-center mt-2">\s*<div className="h-16 w-16 bg-blue-100 dark:bg-blue-900\/40 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">\s*<FileCheck className="h-8 w-8" \/>\s*<\/div>\s*<h3 className="text-xl font-semibold mb-2 text-foreground group-hover:text-primary transition-colors text-center">DPR \(Daily progress report\)<\/h3>\s*<p className="text-sm text-muted-foreground text-center">Daily site progress report\.<\/p>\s*<\/div>\s*<\/div>/;

const newCard = `{/* DPR Card */}
                <button 
                    onClick={() => {
                        setShowToolsDetails(false);
                        setShowMaterialReceivingDetails(false);
                        setShowMomList(false);
                        setShowLettersList(false);
                        setShowMaterialApprovalsList(false);
                        setShowDprDetails(true);
                    }}
                    className="flex flex-col items-center justify-center p-8 bg-card border border-border rounded-xl hover:border-primary/50 hover:shadow-md transition-all group"
                >
                    <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <FileCheck className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2 text-foreground group-hover:text-primary transition-colors text-center">DPR (Daily progress report)</h3>
                    <p className="text-sm text-muted-foreground text-center">Daily site progress report.</p>
                </button>`;

content = content.replace(oldCardRegex, newCard);

// 2. Modify the DPR List Section
// Instead of it just being {showDprDetails && <div ...>}, it should have the same header as Project Tool Site List.
const oldListRegex = /\{\/\* DPR List Section \*\/\}\s*\{showDprDetails && \(\s*<div className="mt-8 bg-card rounded-xl border border-border shadow-sm p-6 animate-in fade-in slide-in-from-bottom-4">\s*<div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">\s*<h2 className="text-xl font-bold tracking-tight text-primary">Daily Site Progress Report List<\/h2>\s*<button\s*onClick=\{.*?\}\s*className="flex items-center space-x-2 bg-primary text-primary-foreground hover:bg-primary\/90 px-4 py-2 rounded-md transition-colors"\s*>\s*<Plus className="h-4 w-4" \/>\s*<span>Create DPR<\/span>\s*<\/button>\s*<\/div>/;

const newList = `{/* DPR List Section */}
            <div className="mt-12 bg-card border border-border rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold tracking-tight text-primary">Daily Site Progress Report List</h2>
                    <div className="flex items-center space-x-4">
                        <button 
                            onClick={() => window.dispatchEvent(new CustomEvent('OPEN_DPR_MODAL'))}
                            className="flex items-center space-x-1 text-sm font-medium text-primary hover:underline bg-primary/10 px-3 py-1.5 rounded-md transition-colors"
                        >
                            <Plus className="h-4 w-4" />
                            <span>Create DPR</span>
                        </button>
                        <button 
                            onClick={() => setShowDprDetails(!showDprDetails)}
                            className="text-sm font-medium text-primary hover:underline"
                        >
                            {showDprDetails ? "Hide Details" : "Show Details"}
                        </button>
                    </div>
                </div>

                {showDprDetails && (
                    <div className="space-y-6 pt-4 border-t border-border">`;

content = content.replace(oldListRegex, newList);

// Now I also need to close the `div` wrapper for the section properly. I'll just change the ending.
// The list ends with `</div>\n                    )}\n                </div>\n            )}\n\n            {/* Project Tool Site / Material Receiving List Section */}`
// It needs to end with `</div>\n                    )}\n                </div>\n\n            {/* Project Tool Site / Material Receiving List Section */}`
content = content.replace(/<\/div>\n\s*\)\}\n\s*<\/div>\n\s*\)\}\n\s*\{\/\* Project Tool Site/, "</div>\n                    )}\n                </div>\n\n            {/* Project Tool Site");

fs.writeFileSync(pagePath, content);
console.log("DPR Card and List patched successfully!");
