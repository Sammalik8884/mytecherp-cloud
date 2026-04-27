const fs = require('fs');
const path = 'g:/mytecherp/MytechERP/frontend/src/pages/QuotationFormPage.tsx';
// Read as buffer to detect encoding
const buf = fs.readFileSync(path);
let content;

// Check for UTF-16 LE BOM (FF FE) or UTF-16 BE BOM (FE FF)
if (buf[0] === 0xFF && buf[1] === 0xFE) {
    console.log('Detected UTF-16 LE BOM - converting to UTF-8');
    content = buf.slice(2).toString('utf16le');
} else if (buf[0] === 0xFE && buf[1] === 0xFF) {
    console.log('Detected UTF-16 BE BOM - converting to UTF-8');
    content = buf.slice(2).swap16().toString('utf16le');
} else if (buf[0] === 0xEF && buf[1] === 0xBB && buf[2] === 0xBF) {
    console.log('Detected UTF-8 BOM - removing BOM');
    content = buf.slice(3).toString('utf8');
} else {
    console.log('File appears UTF-8 without BOM - file byte count:', buf.length);
    content = buf.toString('utf8');
}

// Count braces (simplified, ignoring strings)
let depth = 0;
for (const ch of content) {
    if (ch === '{') depth++;
    else if (ch === '}') depth--;
}
console.log('Brace depth after reading:', depth);
console.log('Content length:', content.length);
console.log('Last 50 chars:', JSON.stringify(content.slice(-50)));

// Write back as UTF-8 without BOM
fs.writeFileSync(path, content, { encoding: 'utf8' });
console.log('Re-saved as UTF-8 without BOM');
