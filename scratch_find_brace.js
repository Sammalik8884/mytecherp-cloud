const fs = require('fs');
const lines = fs.readFileSync('g:/mytecherp/MytechERP/frontend/src/pages/QuotationFormPage.tsx', 'utf8').split('\n');
let depth = 0;
for (let i = 0; i < lines.length; i++) {
    const prevDepth = depth;
    for (const ch of lines[i]) {
        if (ch === '{') depth++;
        else if (ch === '}') depth--;
    }
    // Show lines where depth is 1 (inside the module but outside the component)
    if (depth === 1 && i > 49 && i < 750) {
        console.log(`L${i+1} [${prevDepth}→${depth}]: ${lines[i].trim().substring(0,100)}`);
    }
}
