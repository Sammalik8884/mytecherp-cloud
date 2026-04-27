const fs = require('fs');
const path = 'g:/mytecherp/MytechERP/frontend/src/pages/QuotationFormPage.tsx';
let content = fs.readFileSync(path, 'utf8');

// Find the exact spot after line 151 (the `}` closing the else block)
// and insert `    };` before the blank line and the comment
const target = '            });\n        }\n\n    // Auto-add first row when section is toggled on';
const replacement = '            });\n        }\n    };\n\n    // Auto-add first row when section is toggled on';

if (content.includes(target)) {
    content = content.replace(target, replacement);
    fs.writeFileSync(path, content, 'utf8');
    console.log('Fixed: added missing }; for handleCustomProductNameBlur');
} else {
    // Try with \r\n line endings
    const target2 = '            });\r\n        }\r\n\r\n    // Auto-add first row when section is toggled on';
    if (content.includes(target2)) {
        const replacement2 = '            });\r\n        }\r\n    };\r\n\r\n    // Auto-add first row when section is toggled on';
        content = content.replace(target2, replacement2);
        fs.writeFileSync(path, content, 'utf8');
        console.log('Fixed (CRLF): added missing }; for handleCustomProductNameBlur');
    } else {
        // Show the area around the target
        const idx = content.indexOf('        }\n\n    // Auto-add');
        if (idx !== -1) {
            console.log('Found area at char:', idx);
            console.log(JSON.stringify(content.substring(idx - 50, idx + 100)));
        } else {
            console.log('Could not find target. Showing lines around "Auto-add":');
            const idx2 = content.indexOf('Auto-add first row');
            console.log(JSON.stringify(content.substring(idx2 - 200, idx2 + 50)));
        }
    }
}
