const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'ProjectDetailsPage.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add Imports
if (!content.includes('MaterialReceivingFormDto')) {
    content = content.replace(
        'import { siteDocumentService, SiteDocumentDto } from "../services/siteDocumentService";',
        'import { siteDocumentService, SiteDocumentDto } from "../services/siteDocumentService";\nimport { materialReceivingService, MaterialReceivingFormDto } from "../services/materialReceivingService";\nimport { Wrench } from "lucide-react";'
    );
}

// 2. Add State
if (!content.includes('const [materialReceiving, setMaterialReceiving]')) {
    content = content.replace(
        'const [documents, setDocuments] = useState<SiteDocumentDto[]>([]);',
        'const [documents, setDocuments] = useState<SiteDocumentDto[]>([]);\n    const [materialReceiving, setMaterialReceiving] = useState<MaterialReceivingFormDto[]>([]);'
    );
}

// 3. Add to Promise.all
if (!content.includes('materialReceivingService.getFormsBySiteId(siteId)')) {
    content = content.replace(
        'documentData\n            ] = await Promise.all([',
        'documentData,\n                materialReceivingData\n            ] = await Promise.all(['
    );
    
    content = content.replace(
        'siteDocumentService.getDocumentsBySiteId(siteId).catch(err => {\n                    console.error("Failed to load documents", err);\n                    return [];\n                })\n            ]);',
        'siteDocumentService.getDocumentsBySiteId(siteId).catch(err => {\n                    console.error("Failed to load documents", err);\n                    return [];\n                }),\n                materialReceivingService.getFormsBySiteId(siteId).catch(err => {\n                    console.error("Failed to load material receiving forms", err);\n                    return [];\n                })\n            ]);'
    );

    content = content.replace(
        'setDocuments(documentData);',
        'setDocuments(documentData);\n            setMaterialReceiving(materialReceivingData);'
    );
}

// 4. Add Tab Button
if (!content.includes('setActiveTab(\'material_receiving\')')) {
    content = content.replace(
        '<button onClick={() => setActiveTab(\'documents\')}',
        '<button onClick={() => setActiveTab(\'material_receiving\')} className={`px-4 py-2 text-sm font-medium rounded-md flex items-center space-x-2 ${activeTab === \'material_receiving\' ? \'bg-background shadow-sm\' : \'text-muted-foreground hover:bg-muted/50\'}`}><Wrench className="h-4 w-4" /> <span>Material Receiving ({materialReceiving.length})</span></button>\n                    <button onClick={() => setActiveTab(\'documents\')}'
    );
}

// 5. Add Tab Content
if (!content.includes('activeTab === \'material_receiving\'')) {
    const tabContent = `
                {activeTab === 'material_receiving' && (
                    <div className="bg-card border border-border rounded-xl p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-semibold text-lg">Material Receiving List</h3>
                            <button 
                                onClick={() => {
                                    window.dispatchEvent(new CustomEvent('OPEN_MATERIAL_RECEIVING_MODAL'));
                                }}
                                className="bg-emerald-600 text-white px-4 py-2 rounded text-sm hover:bg-emerald-700 transition-colors"
                            >
                                + Add Form
                            </button>
                        </div>
                        {materialReceiving.length === 0 ? (
                            <div className="text-center p-8 text-muted-foreground border border-dashed border-border rounded-lg">
                                No material receiving forms found for this site.
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {materialReceiving.map((list) => (
                                    <div key={list.id} className="bg-background border border-border rounded-lg overflow-hidden shadow-sm">
                                        <div className="bg-secondary/50 px-4 py-3 border-b border-border flex justify-between items-center">
                                            <div>
                                                <span className="font-medium">Form #{list.id}</span>
                                                <span className="text-xs text-muted-foreground ml-2">Created by: {list.createdByUserName || "System"}</span>
                                            </div>
                                            <span className="text-xs text-muted-foreground">
                                                {new Date(list.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <div className="p-0 overflow-x-auto">
                                            <table className="w-full text-sm text-left">
                                                <thead className="bg-muted/30 text-muted-foreground border-b border-border">
                                                    <tr>
                                                        <th className="px-4 py-3 font-semibold w-16">No.</th>
                                                        <th className="px-4 py-3 font-semibold">Items</th>
                                                        <th className="px-4 py-3 font-semibold">Delivered</th>
                                                        <th className="px-4 py-3 font-semibold">Received</th>
                                                        <th className="px-4 py-3 font-semibold">Remarks</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-border">
                                                    {list.items.map((item, idx) => (
                                                        <tr key={idx} className="hover:bg-muted/10 transition-colors">
                                                            <td className="px-4 py-3 text-muted-foreground">{idx + 1}:</td>
                                                            <td className="px-4 py-3 font-medium">{item.itemName}</td>
                                                            <td className="px-4 py-3">{item.locationValue || "-"}</td>
                                                            <td className="px-4 py-3">{item.received || "-"}</td>
                                                            <td className="px-4 py-3 text-muted-foreground">{item.remarks || "-"}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
`;
    content = content.replace(
        '{activeTab === \'documents\' && (',
        tabContent + '\n                {activeTab === \'documents\' && ('
    );
}

// 6. Listen for refresh
if (!content.includes('REFRESH_MATERIAL_RECEIVING_LIST')) {
    content = content.replace(
        'siteDocumentService.getDocumentsBySiteId(siteId).then(setDocuments);\n            }',
        'siteDocumentService.getDocumentsBySiteId(siteId).then(setDocuments);\n            }\n        };\n        const handleRefreshMaterial = (e: any) => {\n            materialReceivingService.getFormsBySiteId(siteId).then(setMaterialReceiving);\n        };'
    );
    content = content.replace(
        'window.addEventListener(\'REFRESH_PROJECT_DOCUMENTS\', handleRefresh);',
        'window.addEventListener(\'REFRESH_PROJECT_DOCUMENTS\', handleRefresh);\n        window.addEventListener(\'REFRESH_MATERIAL_RECEIVING_LIST\', handleRefreshMaterial);'
    );
    content = content.replace(
        'return () => window.removeEventListener(\'REFRESH_PROJECT_DOCUMENTS\', handleRefresh);',
        'return () => {\n            window.removeEventListener(\'REFRESH_PROJECT_DOCUMENTS\', handleRefresh);\n            window.removeEventListener(\'REFRESH_MATERIAL_RECEIVING_LIST\', handleRefreshMaterial);\n        };'
    );
}

fs.writeFileSync(filePath, content);
console.log('Successfully patched ProjectDetailsPage.tsx with Material Receiving tab');
