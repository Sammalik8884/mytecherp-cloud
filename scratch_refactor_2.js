const fs = require('fs');
const path = 'g:/mytecherp/MytechERP/frontend/src/pages/QuotationFormPage.tsx';
let content = fs.readFileSync(path, 'utf8');

// The original SERVICES section starts around line 1074:
// "{/* ── SERVICES SECTION ── */}"
// We want to duplicate it to Imported Services and Local Services.

// First, extract the services section block.
const servicesStart = content.indexOf('{/* ── SERVICES SECTION ── */}');
const taxesStart = content.indexOf('{/* ── TAXES AND TOTALS ── */}');

if (servicesStart !== -1 && taxesStart !== -1) {
    const servicesBlock = content.substring(servicesStart, taxesStart);
    
    // Create Imported Services block
    let importedServicesBlock = servicesBlock
        .replace(/{showServices && \(/, '{showImportedServices && (')
        .replace(/Services<\/h3>/, 'Imported Services</h3>')
        .replace(/handleAddService/g, 'handleAddImportedService')
        .replace(/serviceItems/g, 'importedServiceItems')
        .replace(/setServiceItems/g, 'setImportedServiceItems')
        .replace(/list="service"/g, 'list="importedService"')
        .replace(/SERVICES SECTION/g, 'IMPORTED SERVICES SECTION');
        
    // Create Local Services block
    let localServicesBlock = servicesBlock
        .replace(/{showServices && \(/, '{showLocalServices && (')
        .replace(/bg-purple-500/g, 'bg-orange-500')
        .replace(/text-purple-500/g, 'text-orange-500')
        .replace(/dark:text-purple-400/g, 'dark:text-orange-400')
        .replace(/Services<\/h3>/, 'Local Services</h3>')
        .replace(/handleAddService/g, 'handleAddLocalService')
        .replace(/serviceItems/g, 'localServiceItems')
        .replace(/setServiceItems/g, 'setLocalServiceItems')
        .replace(/list="service"/g, 'list="localService"')
        .replace(/SERVICES SECTION/g, 'LOCAL SERVICES SECTION');

    content = content.replace(servicesBlock, importedServicesBlock + '\n                ' + localServicesBlock);
}

fs.writeFileSync(path, content, 'utf8');
console.log("Done part 2.");
