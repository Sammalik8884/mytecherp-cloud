const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'ProjectDocumentsPage.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Replace imports
content = content.replace(
    'import { materialReceivingService, MaterialReceivingFormDto } from "../services/materialReceivingService";\nimport MomMeetingModal from "../components/MomMeetingModal";',
    'import { materialReceivingService, MaterialReceivingFormDto } from "../services/materialReceivingService";\nimport { siteService } from "../services/siteService";\nimport { SiteDto } from "../types/site";\nimport MomMeetingModal from "../components/MomMeetingModal";'
);

// Replace LOCATIONS
content = content.replace(
    /const LOCATIONS = \["Lahore", "Karachi", "Islamabad", "Peshawar", "Balochistan"\];\s*/g,
    ''
);

// Replace States
content = content.replace(
    /const \[selectedLocation, setSelectedLocation\] = useState<string>\(""\);\n    const \[toolsLists, setToolsLists\] = useState<MaterialReceivingFormDto\[\]>\(\[\]\);/g,
    `const [sites, setSites] = useState<SiteDto[]>([]);\n    const [selectedSiteId, setSelectedSiteId] = useState<number | "">("");\n    const [toolsLists, setToolsLists] = useState<MaterialReceivingFormDto[]>([]);`
);

// Replace fetchToolsList and useEffects
content = content.replace(
    /useEffect\(\(\) => \{\n        const handleRefresh = \(\) => \{\n            if \(selectedLocation\) \{\n                fetchToolsLists\(selectedLocation\);\n            \}\n        \};\n        window\.addEventListener\("REFRESH_TOOLS_LIST", handleRefresh\);\n        return \(\) => window\.removeEventListener\("REFRESH_TOOLS_LIST", handleRefresh\);\n    \}, \[selectedLocation\]\);\n\n    const fetchToolsLists = async \(location: string\) => \{\n        setIsLoadingTools\(true\);\n        try \{\n            const data = await materialReceivingService\.getFormsByLocation\(location\);\n            setToolsLists\(data\);\n        \} catch \(error\) \{\n            console\.error\("Failed to load tools lists", error\);\n        \} finally \{\n            setIsLoadingTools\(false\);\n        \}\n    \};\n\n    const handleLocationSelect = \(loc: string\) => \{\n        setSelectedLocation\(loc\);\n        fetchToolsLists\(loc\);\n    \};/g,
    `useEffect(() => {
        const handleRefresh = () => {
            if (selectedSiteId) {
                fetchToolsLists(Number(selectedSiteId));
            }
        };
        window.addEventListener("REFRESH_PROJECT_DOCUMENTS", handleRefresh);
        return () => window.removeEventListener("REFRESH_PROJECT_DOCUMENTS", handleRefresh);
    }, [selectedSiteId]);

    useEffect(() => {
        if (showToolsDetails) {
            siteService.getAll().then(setSites).catch(console.error);
        }
    }, [showToolsDetails]);

    const fetchToolsLists = async (siteId: number) => {
        setIsLoadingTools(true);
        try {
            const data = await materialReceivingService.getFormsBySiteId(siteId);
            setToolsLists(data);
        } catch (error) {
            console.error("Failed to load tools lists", error);
        } finally {
            setIsLoadingTools(false);
        }
    };

    const handleSiteSelect = (siteId: number | "") => {
        setSelectedSiteId(siteId);
        if (siteId) fetchToolsLists(Number(siteId));
    };`
);

// Replace card
content = content.replace(
    /<h3 className="text-xl font-semibold mb-2 text-foreground group-hover:text-primary transition-colors text-center">Tools List<\/h3>\n                    <p className="text-sm text-muted-foreground text-center">Fill out the dynamic tools list for your location\.<\/p>/g,
    `<h3 className="text-xl font-semibold mb-2 text-foreground group-hover:text-primary transition-colors text-center">Project Tool Site</h3>
                    <p className="text-sm text-muted-foreground text-center">Fill out the project tool site list.</p>`
);

// Replace Footer section
content = content.replace(
    /\{\/\* Tools List Details Section \(Footer\) \*\/\}[\s\S]*?(?=\{\/\* Meeting Closure List Section \(Footer\) \*\/\}|\{\/\* Letters\/Communication By Mytech List Section \(Footer\) \*\/\}|\{\/\* Material Approvals List Section \*\/\}|<!-- footer -->)/,
    `{/* Project Tool Site / Material Receiving List Section */}
            <div className="mt-12 bg-card border border-border rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold tracking-tight text-primary">Material Receiving List</h2>
                    <button 
                        onClick={() => setShowToolsDetails(!showToolsDetails)}
                        className="text-sm font-medium text-primary hover:underline"
                    >
                        {showToolsDetails ? "Hide Details" : "Show Details"}
                    </button>
                </div>

                {showToolsDetails && (
                    <div className="space-y-6 pt-4 border-t border-border">
                        <div>
                            <p className="text-sm text-muted-foreground mb-3">Select a site to view the material receiving lists:</p>
                            <select 
                                value={selectedSiteId} 
                                onChange={(e) => handleSiteSelect(e.target.value === "" ? "" : Number(e.target.value))}
                                className="w-full md:w-1/3 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                            >
                                <option value="">-- Select Site --</option>
                                {sites.map(site => (
                                    <option key={site.id} value={site.id}>{site.name}</option>
                                ))}
                            </select>
                        </div>

                        {selectedSiteId && (
                            <div className="bg-secondary/20 rounded-lg p-6 border border-border">
                                <h3 className="font-semibold text-lg mb-4">Material Receiving Lists</h3>
                                
                                {isLoadingTools ? (
                                    <div className="flex justify-center p-8">
                                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                    </div>
                                ) : toolsLists.length > 0 ? (
                                    <div className="space-y-6">
                                        {toolsLists.map((list) => (
                                            <div key={list.id} className="bg-card border border-border rounded-lg overflow-hidden shadow-sm">
                                                <div className="bg-secondary/50 px-4 py-3 border-b border-border flex justify-between items-center">
                                                    <div>
                                                        <span className="font-medium">Form #{list.id}</span>
                                                        <span className="text-xs text-muted-foreground ml-2">Created by: {list.createdByUserName || "System"}</span>
                                                    </div>
                                                    <span className="text-xs text-muted-foreground">
                                                        {new Date(list.createdAt).toLocaleDateString()}
                                                    </span>
                                                </div>
                                                <div className="p-0">
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
                                ) : (
                                    <div className="text-center p-8 text-muted-foreground bg-card border border-dashed border-border rounded-lg">
                                        <Search className="h-8 w-8 mx-auto mb-2 opacity-20" />
                                        <p>No lists found for this site</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>

            `
);

fs.writeFileSync(filePath, content);
console.log('Successfully patched ProjectDocumentsPage.tsx');
