const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'ProjectDocumentsPage.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add imports
content = content.replace(
    'import { FileSignature, Plus, Wrench, Search, Loader2 } from "lucide-react";',
    'import { FileSignature, Plus, Wrench, Search, Loader2, FileCheck } from "lucide-react";'
);

// 2. Add State
content = content.replace(
    /(\/\/ Letters State[\s\S]*?const \[isLoadingLetters, setIsLoadingLetters\] = useState\(false\);)/,
    `$1\n\n    // Material Approvals State\n    const [showMaterialApprovalsList, setShowMaterialApprovalsList] = useState(false);\n    const [materialApprovalsList, setMaterialApprovalsList] = useState<any[]>([]);\n    const [isLoadingMaterialApprovals, setIsLoadingMaterialApprovals] = useState(false);`
);

// 3. Update fetchDocuments
content = content.replace(
    /const fetchLetters = async \(\) => \{[\s\S]*?setIsLoadingLetters\(false\);\n        \}\n    \};\n\n    useEffect\(\(\) => \{\n        if \(showLettersList\) \{\n            fetchLetters\(\);\n        \}\n    \}, \[showLettersList\]\);\n\n    useEffect\(\(\) => \{\n        const handleRefreshDocs = \(\) => \{\n            if \(showLettersList\) fetchLetters\(\);\n        \};\n        window\.addEventListener\('REFRESH_PROJECT_DOCUMENTS', handleRefreshDocs\);\n        return \(\) => window\.removeEventListener\('REFRESH_PROJECT_DOCUMENTS', handleRefreshDocs\);\n    \}, \[showLettersList\]\);/,
    `const fetchDocuments = async () => {
        setIsLoadingLetters(true);
        setIsLoadingMaterialApprovals(true);
        try {
            const data = await siteDocumentService.getAllDocuments();
            
            // Letters/Communication By Mytech
            const letters = data.filter(d => d.documentType === 'Letters/Communication By Mytech')
                                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            
            const groupedLetters: any[] = [];
            letters.forEach(doc => {
                const group = groupedLetters.find(g => 
                    g.siteId === doc.siteId && 
                    g.customerId === doc.customerId && 
                    g.secondaryCustomerId === doc.secondaryCustomerId &&
                    Math.abs(new Date(g.createdAt).getTime() - new Date(doc.createdAt).getTime()) < 60000
                );
                if (group) { group.documents.push(doc); } 
                else { groupedLetters.push({ id: groupedLetters.length + 1, siteId: doc.siteId, siteName: doc.siteName, customerId: doc.customerId, customerName: doc.customerName, secondaryCustomerId: doc.secondaryCustomerId, secondaryCustomerName: doc.secondaryCustomerName, createdAt: doc.createdAt, documents: [doc] }); }
            });
            setLettersList(groupedLetters);

            // Material Approvals
            const approvals = data.filter(d => d.documentType === 'Material Approvals')
                                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            
            const groupedApprovals: any[] = [];
            approvals.forEach(doc => {
                const group = groupedApprovals.find(g => 
                    g.siteId === doc.siteId && 
                    g.customerId === doc.customerId && 
                    g.secondaryCustomerId === doc.secondaryCustomerId &&
                    Math.abs(new Date(g.createdAt).getTime() - new Date(doc.createdAt).getTime()) < 60000
                );
                if (group) { group.documents.push(doc); } 
                else { groupedApprovals.push({ id: groupedApprovals.length + 1, siteId: doc.siteId, siteName: doc.siteName, customerId: doc.customerId, customerName: doc.customerName, secondaryCustomerId: doc.secondaryCustomerId, secondaryCustomerName: doc.secondaryCustomerName, createdAt: doc.createdAt, documents: [doc] }); }
            });
            setMaterialApprovalsList(groupedApprovals);

        } catch (error) {
            console.error("Failed to load documents list", error);
        } finally {
            setIsLoadingLetters(false);
            setIsLoadingMaterialApprovals(false);
        }
    };

    useEffect(() => {
        if (showLettersList || showMaterialApprovalsList) {
            fetchDocuments();
        }
    }, [showLettersList, showMaterialApprovalsList]);

    useEffect(() => {
        const handleRefreshDocs = () => {
            if (showLettersList || showMaterialApprovalsList) fetchDocuments();
        };
        window.addEventListener('REFRESH_PROJECT_DOCUMENTS', handleRefreshDocs);
        return () => window.removeEventListener('REFRESH_PROJECT_DOCUMENTS', handleRefreshDocs);
    }, [showLettersList, showMaterialApprovalsList]);`
);

// 4. Add Material Approvals Card
content = content.replace(
    /(<h3 className="text-xl font-semibold mb-2 text-foreground group-hover:text-primary transition-colors text-center">Letters\/Communication By Mytech<\/h3>\s*<p className="text-sm text-muted-foreground text-center">Upload letter and communication documents and link them to a site and customer\.<\/p>\s*<div className="mt-4 flex items-center text-sm font-medium text-primary">\s*<Plus className="h-4 w-4 mr-1" \/> Create Document\s*<\/div>\s*<\/button>)/,
    `$1

                {/* Material Approvals Card */}
                <button 
                    onClick={() => window.dispatchEvent(new CustomEvent('OPEN_PROJECT_DOCUMENT_MODAL', { detail: { documentType: 'Material Approvals' } }))}
                    className="flex flex-col items-center justify-center p-8 bg-card border border-border rounded-xl hover:border-primary/50 hover:shadow-md transition-all group"
                >
                    <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <FileCheck className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2 text-foreground group-hover:text-primary transition-colors text-center">Material Approvals</h3>
                    <p className="text-sm text-muted-foreground text-center">Upload material approval documents and link them to a site and customer.</p>
                    <div className="mt-4 flex items-center text-sm font-medium text-primary">
                        <Plus className="h-4 w-4 mr-1" /> Create Document
                    </div>
                </button>`
);

// 5. Add Material Approvals List
content = content.replace(
    /(<\/div>\s*)\(\s*<div className="text-center p-8 text-muted-foreground bg-card border border-dashed border-border rounded-lg">\s*<p>No letters or communication documents found\.<\/p>\s*<\/div>\s*\)\}\s*<\/div>\s*\)\}\s*<\/div>)/,
    `$1$2

            {/* Material Approvals List Section */}
            <div className="mt-6 bg-card border border-border rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold tracking-tight text-primary">Material Approvals</h2>
                    <button 
                        onClick={() => setShowMaterialApprovalsList(!showMaterialApprovalsList)}
                        className="text-sm font-medium text-primary hover:underline"
                    >
                        {showMaterialApprovalsList ? "Hide Details" : "Show Details"}
                    </button>
                </div>

                {showMaterialApprovalsList && (
                    <div className="pt-4 border-t border-border">
                        {isLoadingMaterialApprovals ? (
                            <div className="flex justify-center p-8">
                                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                            </div>
                        ) : materialApprovalsList.length > 0 ? (
                            <div className="overflow-x-auto bg-card rounded-lg border border-border">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-muted/30 text-center text-muted-foreground border-b border-border">
                                        <tr>
                                            <th className="px-4 py-3 font-semibold">ID</th>
                                            <th className="px-4 py-3 font-semibold">Filename</th>
                                            <th className="px-4 py-3 font-semibold">Date Time</th>
                                            <th className="px-4 py-3 font-semibold">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border text-center">
                                        {materialApprovalsList.map((group) => (
                                            <tr key={group.id} className="hover:bg-muted/10 transition-colors">
                                                <td className="px-4 py-4 align-top">{group.id}</td>
                                                <td className="px-4 py-4 text-left align-top">
                                                    <div className="flex flex-col gap-3">
                                                        {group.documents.map((d: any) => (
                                                            <a key={d.id} href={d.fileUrl} target="_blank" rel="noopener noreferrer" className="hover:underline font-medium text-primary flex items-center gap-1">
                                                                <FileCheck className="h-4 w-4 shrink-0" /> <span className="truncate">{d.fileName}</span>
                                                            </a>
                                                        ))}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4 align-top">{new Date(group.createdAt).toLocaleString()}</td>
                                                <td className="px-4 py-4 align-top">
                                                    <div className="flex flex-col gap-3">
                                                        {group.documents.map((d: any) => (
                                                            <div key={d.id} className="flex justify-center gap-3">
                                                                <a href={d.fileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-600 transition-colors" title="View">
                                                                    <Eye className="h-4 w-4" />
                                                                </a>
                                                                <a href={d.downloadUrl} className="text-emerald-500 hover:text-emerald-600 transition-colors" title="Download">
                                                                    <Download className="h-4 w-4" />
                                                                </a>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="text-center p-8 text-muted-foreground bg-card border border-dashed border-border rounded-lg">
                                <p>No material approvals found.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>`
);

fs.writeFileSync(filePath, content);
console.log('Successfully updated ProjectDocumentsPage.tsx');
