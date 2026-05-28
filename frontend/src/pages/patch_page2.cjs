const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'ProjectDocumentsPage.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add Imports
content = content.replace(
    'import { ToolsListModal } from "../components/common/ToolsListModal";',
    'import { ToolsListModal } from "../components/common/ToolsListModal";\nimport { MaterialReceivingModal } from "../components/common/MaterialReceivingModal";\nimport { siteService } from "../services/siteService";\nimport { SiteDto } from "../types/site";'
);

// 2. Add Material Receiving State
content = content.replace(
    '// MOM State',
    `// Material Receiving State
    const [sites, setSites] = useState<SiteDto[]>([]);
    const [selectedSiteId, setSelectedSiteId] = useState<number | "">("");
    const [materialReceivingLists, setMaterialReceivingLists] = useState<MaterialReceivingFormDto[]>([]);
    const [isLoadingMaterialReceiving, setIsLoadingMaterialReceiving] = useState(false);
    const [showMaterialReceivingDetails, setShowMaterialReceivingDetails] = useState(false);

    useEffect(() => {
        if (showMaterialReceivingDetails) {
            siteService.getAll().then(setSites).catch(console.error);
        }
    }, [showMaterialReceivingDetails]);

    useEffect(() => {
        const handleRefresh = () => {
            if (selectedSiteId) {
                fetchMaterialReceivingLists(Number(selectedSiteId));
            }
        };
        window.addEventListener("REFRESH_MATERIAL_RECEIVING_LIST", handleRefresh);
        return () => window.removeEventListener("REFRESH_MATERIAL_RECEIVING_LIST", handleRefresh);
    }, [selectedSiteId]);

    const fetchMaterialReceivingLists = async (siteId: number) => {
        setIsLoadingMaterialReceiving(true);
        try {
            const data = await materialReceivingService.getFormsBySiteId(siteId);
            setMaterialReceivingLists(data);
        } catch (error) {
            console.error("Failed to load material receiving lists", error);
        } finally {
            setIsLoadingMaterialReceiving(false);
        }
    };

    const handleSiteSelect = (siteId: number | "") => {
        setSelectedSiteId(siteId);
        if (siteId) fetchMaterialReceivingLists(Number(siteId));
    };

    // MOM State`
);

// 3. Add Project Tool Site Card
content = content.replace(
    /\{\/\* Future Document Cards can be added here \*\/\}/,
    `{/* Project Tool Site (Material Receiving) Card */}
                <button 
                    onClick={() => window.dispatchEvent(new CustomEvent('OPEN_MATERIAL_RECEIVING_MODAL'))}
                    className="flex flex-col items-center justify-center p-8 bg-card border border-border rounded-xl hover:border-emerald-500/50 hover:shadow-md transition-all group"
                >
                    <div className="h-16 w-16 bg-emerald-500/10 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <Wrench className="h-8 w-8 text-emerald-500" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2 text-foreground group-hover:text-emerald-500 transition-colors text-center">Project Tool Site</h3>
                    <p className="text-sm text-muted-foreground text-center">Fill out the project tool site list.</p>
                </button>

                {/* Future Document Cards can be added here */}`
);

// 4. Add Material Receiving List Footer Section
content = content.replace(
    /\{\/\* Tools List Details Section \(Footer\) \*\/\}/,
    `{/* Project Tool Site / Material Receiving List Section */}
            <div className="mt-12 bg-card border border-border rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold tracking-tight text-emerald-600 dark:text-emerald-500">Material Receiving List</h2>
                    <button 
                        onClick={() => setShowMaterialReceivingDetails(!showMaterialReceivingDetails)}
                        className="text-sm font-medium text-emerald-600 hover:underline dark:text-emerald-500"
                    >
                        {showMaterialReceivingDetails ? "Hide Details" : "Show Details"}
                    </button>
                </div>

                {showMaterialReceivingDetails && (
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
                                
                                {isLoadingMaterialReceiving ? (
                                    <div className="flex justify-center p-8">
                                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                    </div>
                                ) : materialReceivingLists.length > 0 ? (
                                    <div className="space-y-6">
                                        {materialReceivingLists.map((list) => (
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

            {/* Tools List Details Section (Footer) */}`
);

// 5. Make sure the modal is rendered at the bottom
content = content.replace(
    '<ToolsListModal />',
    '<ToolsListModal />\n            <MaterialReceivingModal />'
);

fs.writeFileSync(filePath, content);
console.log('Successfully patched ProjectDocumentsPage.tsx with separate MaterialReceiving list');
