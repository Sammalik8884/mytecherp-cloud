const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

function getAllFiles(dirPath, arrayOfFiles) {
    const files = fs.readdirSync(dirPath);
    arrayOfFiles = arrayOfFiles || [];
    files.forEach(function (file) {
        if (fs.statSync(dirPath + "/" + file).isDirectory()) {
            arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles);
        } else {
            if (file.endsWith('.tsx') || file.endsWith('.ts')) {
                arrayOfFiles.push(path.join(__dirname, path.relative(__dirname, dirPath + "/" + file)));
            }
        }
    });
    return arrayOfFiles;
}

const files = getAllFiles(srcDir, []);
let changedFileCount = 0;

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let originalContent = content;

    // === SIMPLE GLOBAL STRING REPLACEMENTS (outside of className context) ===
    
    // Borders
    content = content.replace(/\bborder-white\/5\b/g, 'border-border/50');
    content = content.replace(/\bborder-white\/10\b/g, 'border-border');
    content = content.replace(/\bborder-white\/20\b/g, 'border-border');

    // Backgrounds (safe global replaces)
    content = content.replace(/\bbg-\[#111\]/g, 'bg-card');
    content = content.replace(/\bbg-\[#1a1a1a\]/g, 'bg-card');
    content = content.replace(/\bbg-black\/20\b/g, 'bg-secondary/50');
    content = content.replace(/\bbg-black\/30\b/g, 'bg-secondary/80');
    content = content.replace(/\bbg-black\/40\b/g, 'bg-secondary');
    content = content.replace(/\bbg-black\/10\b/g, 'bg-secondary/30');

    // Hover backgrounds (white/5 is invisible in light mode)
    content = content.replace(/\bhover:bg-white\/5\b/g, 'hover:bg-secondary/50');
    content = content.replace(/\bhover:bg-white\/10\b/g, 'hover:bg-secondary/50');

    // Hover text (hover:text-white is bad in light mode unless on colored bg)
    // We only replace hover:text-white when it's NOT in a colored-bg context
    // This is trickier - we'll do a safer per-className approach below

    // === PER-CLASSNAME CONTEXT-AWARE REPLACEMENTS ===
    const classNameRegex = /className=(?:\{`|["'])([\s\S]*?)(?:`\}|["'])/g;

    const trulyDarkBgs = [
        'bg-primary', 'bg-emerald-500', 'bg-emerald-600',
        'bg-indigo-500', 'bg-indigo-600', 'bg-blue-500', 'bg-blue-600',
        'bg-rose-500', 'bg-rose-600', 'bg-red-500', 'bg-red-600',
        'bg-amber-500', 'bg-amber-600', 'from-primary', 'from-accent',
        'from-emerald-', 'from-indigo-', 'bg-violet-950', 'bg-indigo-950'
    ];

    content = content.replace(classNameRegex, (match, classList) => {
        let newClassList = classList;
        const hasActuallyDarkBg = trulyDarkBgs.some(bg => classList.includes(bg));

        if (!hasActuallyDarkBg) {
            newClassList = newClassList.replace(/\btext-white\b/g, 'text-foreground');
            newClassList = newClassList.replace(/\btext-gray-100\b/g, 'text-foreground/90');
            newClassList = newClassList.replace(/\btext-gray-200\b/g, 'text-foreground/80');
            newClassList = newClassList.replace(/\btext-gray-300\b/g, 'text-muted-foreground');
            newClassList = newClassList.replace(/\btext-gray-400\b/g, 'text-muted-foreground');
            newClassList = newClassList.replace(/\bhover:text-white\b/g, 'hover:text-foreground');
        }

        return match.replace(classList, newClassList);
    });

    if (content !== originalContent) {
        fs.writeFileSync(file, content, 'utf8');
        changedFileCount++;
        console.log(`Updated: ${path.basename(file)}`);
    }
});

console.log(`\nPremium theme script completed. Modified ${changedFileCount} files.`);
