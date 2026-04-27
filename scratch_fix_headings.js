const fs = require('fs');
const path = 'g:/mytecherp/MytechERP/frontend/src/pages/QuotationFormPage.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
    'bg-purple-500 animate-pulse" />\n                                 Services\n',
    'bg-purple-500 animate-pulse" />\n                                 Imported Services\n'
);
content = content.replace(
    'bg-orange-500 animate-pulse" />\n                                 Services\n',
    'bg-orange-500 animate-pulse" />\n                                 Local Services\n'
);

fs.writeFileSync(path, content, 'utf8');

const count1 = (content.match(/Imported Services/g) || []).length;
const count2 = (content.match(/Local Services/g) || []).length;
console.log(`Imported Services: ${count1}, Local Services: ${count2}`);
