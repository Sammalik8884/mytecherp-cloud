const xlsx = require('xlsx');
const fs = require('fs');

const wb = xlsx.readFile('D:\\mytecherp\\MytechERP\\Store Data.xlsx');
const sheet = wb.Sheets[wb.SheetNames[0]];
const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });

const headerRowIndex = 3; // 4th row has S.N, ITEMS, SIZE OF ITEMS, QOUNTITY
const headerRow = data[headerRowIndex];

const itemsCols = [];
for (let i = 0; i < headerRow.length; i++) {
    if (typeof headerRow[i] === 'string' && headerRow[i].trim() === 'ITEMS') {
        itemsCols.push(i);
    }
}

console.log('Items columns found at indices:', itemsCols);

const tools = [];
for (let r = headerRowIndex + 2; r < data.length; r++) {
    const row = data[r];
    if (!row) continue;

    for (const c of itemsCols) {
        const item = row[c];
        const size = row[c + 1];
        const qty = row[c + 2];

        if (item && typeof item === 'string' && item.trim() !== '') {
            let desc = item.trim();
            if (size && size.toString().trim() !== '') {
                desc += ' - ' + size.toString().trim();
            }

            let quantity = 0;
            if (qty) {
                const parsed = parseInt(qty.toString().replace(/[^0-9-]/g, ''));
                if (!isNaN(parsed)) quantity = parsed;
            }

            tools.push({
                Description: desc,
                CurrentQuantity: quantity,
                TotalQuantity: quantity
            });
        }
    }
}

// Remove duplicates
const uniqueTools = [];
const seen = new Set();
for (const t of tools) {
    if (!seen.has(t.Description)) {
        seen.add(t.Description);
        uniqueTools.push(t);
    }
}

console.log(`Extracted ${uniqueTools.length} unique tools.`);
fs.writeFileSync('D:\\mytecherp\\MytechERP\\seed_tools.json', JSON.stringify(uniqueTools, null, 2));
