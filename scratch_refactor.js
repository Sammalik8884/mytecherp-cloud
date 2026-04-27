const fs = require('fs');
const path = 'g:/mytecherp/MytechERP/frontend/src/pages/QuotationFormPage.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. States
content = content.replace(
    'const [showServices, setShowServices] = useState(false);',
    'const [showImportedServices, setShowImportedServices] = useState(false);\n    const [showLocalServices, setShowLocalServices] = useState(false);'
);

content = content.replace(
    'const [serviceItems, setServiceItems] = useState<UiItem[]>([]);',
    'const [importedServiceItems, setImportedServiceItems] = useState<UiItem[]>([]);\n    const [localServiceItems, setLocalServiceItems] = useState<UiItem[]>([]);'
);

// 2. handleCustomProductNameBlur
content = content.replace(
    /const handleCustomProductNameBlur = \([^)]+\) => \{[\s\S]*?\};\s*\n/,
    `const handleCustomProductNameBlur = (name: string | undefined, quantity: number, listType: 'imported' | 'local') => {
        if (!name || name.trim() === "") return;
        
        if (listType === 'imported') {
            setShowImportedServices(true);
            setImportedServiceItems(prev => {
                if (prev.some(s => s.serviceName === name)) return prev;
                const blankIdx = prev.findIndex(s => !s.serviceName || s.serviceName.trim() === "");
                if (blankIdx !== -1) {
                    const updated = [...prev];
                    updated[blankIdx] = { ...updated[blankIdx], serviceName: name, quantity: quantity };
                    return updated;
                }
                return [...prev, { ...makeEmptyRow("ImportedService"), serviceName: name, quantity: quantity }];
            });
        } else {
            setShowLocalServices(true);
            setLocalServiceItems(prev => {
                if (prev.some(s => s.serviceName === name)) return prev;
                const blankIdx = prev.findIndex(s => !s.serviceName || s.serviceName.trim() === "");
                if (blankIdx !== -1) {
                    const updated = [...prev];
                    updated[blankIdx] = { ...updated[blankIdx], serviceName: name, quantity: quantity };
                    return updated;
                }
                return [...prev, { ...makeEmptyRow("LocalService"), serviceName: name, quantity: quantity }];
            });
        }
    };\n`
);

// 3. handleAddService -> split
content = content.replace(
    /const handleAddService = \(\) => \{\s*setServiceItems\(\[\.\.\.serviceItems, makeEmptyRow\("Service"\)\]\);\s*\};\s*\n/,
    `const handleAddImportedService = () => {
        setImportedServiceItems([...importedServiceItems, makeEmptyRow("ImportedService")]);
    };
    
    const handleAddLocalService = () => {
        setLocalServiceItems([...localServiceItems, makeEmptyRow("LocalService")]);
    };\n`
);

// 4. UseEffect for loading quotes
content = content.replace(
    'setShowServices(quote.items.some(i => i.itemType === "Service"));',
    'setShowImportedServices(quote.items.some(i => i.itemType === "ImportedService"));\n                    setShowLocalServices(quote.items.some(i => i.itemType === "LocalService" || i.itemType === "Service"));'
);

content = content.replace(
    'const srv: UiItem[] = [];',
    'const impSrv: UiItem[] = [];\n                    const locSrv: UiItem[] = [];'
);

content = content.replace(
    /else srv\.push\(uiItem\);/g,
    'else if (i.itemType === "ImportedService") impSrv.push(uiItem);\n                        else locSrv.push(uiItem);'
);

content = content.replace(
    /setServiceItems\(srv\);/g,
    'setImportedServiceItems(impSrv);\n                    setLocalServiceItems(locSrv);'
);

// 5. Total calculations
content = content.replace(
    /if \(showServices\) subTotal \+= serviceItems\.reduce\(\(acc, i\) => acc \+ i\.lineTotal, 0\);/g,
    `if (showImportedServices) subTotal += importedServiceItems.reduce((acc, i) => acc + i.lineTotal, 0);
        if (showLocalServices) subTotal += localServiceItems.reduce((acc, i) => acc + i.lineTotal, 0);`
);

// 6. Saving payload
content = content.replace(
    /if \(showServices\) \{[\s\S]*?payloadItems\.push\(\.\.\.valid\.map\(i => \(\{ quantity: i\.quantity, itemType: "Service"[\s\S]*?\}\)\)\);\s*\}/,
    `if (showImportedServices) {
             const valid = importedServiceItems.filter(i => i.serviceName && i.serviceName.trim() !== "");
             payloadItems.push(...valid.map(i => ({ quantity: i.quantity, itemType: "ImportedService", serviceName: i.serviceName, servicePrice: i.servicePrice, unit: resolveUnit(i), unitQty: i.unitQty || 0 })));
        }
        if (showLocalServices) {
             const valid = localServiceItems.filter(i => i.serviceName && i.serviceName.trim() !== "");
             payloadItems.push(...valid.map(i => ({ quantity: i.quantity, itemType: "LocalService", serviceName: i.serviceName, servicePrice: i.servicePrice, unit: resolveUnit(i), unitQty: i.unitQty || 0 })));
        }`
);

content = content.replace(
    /if \(showServices\) modes\.push\("Services"\);/,
    `if (showImportedServices) modes.push("Imported Services");\n        if (showLocalServices) modes.push("Local Services");`
);

// 7. Render UI checkboxes
content = content.replace(
    /\{ label: "Services", checked: showServices, onChange: setShowServices, color: "purple" \}/,
    `{ label: "Imported Services", checked: showImportedServices, onChange: setShowImportedServices, color: "purple" },
                           { label: "Local Services", checked: showLocalServices, onChange: setShowLocalServices, color: "orange" }`
);

// 8. ServiceNameDisplay
content = content.replace(
    /const setItems = list === "imported" \? setImportedItems : list === "local" \? setLocalItems : setServiceItems;/g,
    'const setItems = list === "imported" ? setImportedItems : list === "local" ? setLocalItems : list === "importedService" ? setImportedServiceItems : setLocalServiceItems;'
);
content = content.replace(
    /const items = list === "imported" \? importedItems : list === "local" \? localItems : serviceItems;/g,
    'const items = list === "imported" ? importedItems : list === "local" ? localItems : list === "importedService" ? importedServiceItems : localServiceItems;'
);

// 9. Fix handleCustomProductNameBlur usage
content = content.replace(
    /onBlur=\{e => handleCustomProductNameBlur\(e\.target\.value, item\.quantity\)\}/g,
    'onBlur={e => handleCustomProductNameBlur(e.target.value, item.quantity, "imported")}'
);

// Oh wait, for local items we need to pass 'local'
let parts = content.split('/* ── LOCAL SECTION ── */');
if(parts.length > 1) {
   parts[1] = parts[1].replace(
       /onBlur=\{e => handleCustomProductNameBlur\(e\.target\.value, item\.quantity, "imported"\)\}/g,
       'onBlur={e => handleCustomProductNameBlur(e.target.value, item.quantity, "local")}'
   );
   content = parts.join('/* ── LOCAL SECTION ── */');
}

// 10. Update productModalTarget to also trigger services
content = content.replace(
    /setShowServices\(true\);\s*setServiceItems\(prev => \{/g,
    `setShowImportedServices(true);
                        setImportedServiceItems(prev => {`
);
// Above replaces all setShowServices. Wait, local ones should trigger localServices. We'll fix it manually if needed.

// 11. Render the two service sections.
// I'll leave this to manual replacement after I run the script.

fs.writeFileSync(path, content, 'utf8');
console.log("Refactored script executed.");
