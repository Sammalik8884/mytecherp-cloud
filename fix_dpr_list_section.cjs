const fs = require('fs');
const path = require('path');

const pagePath = path.join(__dirname, 'frontend', 'src', 'pages', 'ProjectDocumentsPage.tsx');
let content = fs.readFileSync(pagePath, 'utf8');

const startListMarker = "{/* DPR List Section */}";
const endListMarker = "{/* Project Tool Site / Material Receiving List Section */}";

const startIndex = content.indexOf(startListMarker);
const endIndex = content.indexOf(endListMarker);

if (startIndex !== -1 && endIndex !== -1) {
    const newListSection = `{/* DPR List Section */}
            <div className="mt-12 bg-card border border-border rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold tracking-tight text-primary">Daily Site Progress Report List</h2>
                    <div className="flex items-center space-x-4">
                        <button 
                            onClick={() => window.dispatchEvent(new CustomEvent('OPEN_DPR_MODAL'))}
                            className="flex items-center space-x-1 text-sm font-medium text-primary hover:underline bg-primary/10 px-3 py-1.5 rounded-md transition-colors"
                        >
                            <Plus className="h-4 w-4" />
                            <span>Create DPR</span>
                        </button>
                        <button 
                            onClick={() => setShowDprDetails(!showDprDetails)}
                            className="text-sm font-medium text-primary hover:underline"
                        >
                            {showDprDetails ? "Hide Details" : "Show Details"}
                        </button>
                    </div>
                </div>

                {showDprDetails && (
                    <div className="space-y-6 pt-4 border-t border-border">
                        <div>
                            <p className="text-sm text-muted-foreground mb-3">Select a site to view the daily progress reports:</p>
                            <select 
                                value={selectedSiteId} 
                                onChange={(e) => handleDprSiteSelect(Number(e.target.value) || "")}
                                className="w-full md:w-1/3 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                            >
                                <option value="">-- Select Site --</option>
                                {sites.map(site => (
                                    <option key={site.id} value={site.id}>{site.name}</option>
                                ))}
                            </select>
                        </div>

                        {selectedSiteId && (
                            <div>
                                <h3 className="font-semibold text-lg mb-4">Daily Site Progress Reports</h3>
                                {isLoadingDpr ? (
                                    <div className="flex justify-center items-center py-12">
                                        <Loader2 className="h-8 w-8 animate-spin text-primary/60" />
                                    </div>
                                ) : dprLists.length === 0 ? (
                                    <div className="text-center py-12 bg-secondary/10 rounded-lg border border-dashed border-border">
                                        <p className="text-muted-foreground">No reports found for this site.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {dprLists.map((report) => (
                                            <div key={report.id} className="bg-card border border-border rounded-lg p-5 shadow-sm">
                                                <div className="flex justify-between items-start mb-4">
                                                    <div>
                                                        <h4 className="font-semibold text-lg">{report.siteName} - {new Date(report.date).toLocaleDateString()}</h4>
                                                        <p className="text-sm text-muted-foreground mt-1">In-charge: <span className="font-medium text-foreground">{report.siteInCharge}</span></p>
                                                    </div>
                                                    <div className="flex space-x-2">
                                                        <button onClick={() => handleDeleteDpr(report.id)} className="text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 px-3 py-1.5 rounded text-sm font-medium transition-colors">
                                                            Delete
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                                                    <div>
                                                        <p className="text-muted-foreground mb-1">Total Workers</p>
                                                        <p className="font-medium">{report.totalWorkers}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-muted-foreground mb-1">Opening Time</p>
                                                        <p className="font-medium">{report.siteOpeningTime}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-muted-foreground mb-1">Closing Time</p>
                                                        <p className="font-medium">{report.siteClosingTime}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-muted-foreground mb-1">Activities</p>
                                                        <p className="font-medium">{report.activities.length}</p>
                                                    </div>
                                                </div>
                                                
                                                {report.attachments && report.attachments.length > 0 && (
                                                    <div className="mt-4 pt-4 border-t border-border">
                                                        <p className="text-sm font-medium mb-2">Attachments ({report.attachments.length}):</p>
                                                        <div className="flex flex-wrap gap-2">
                                                            {report.attachments.map((att: any) => (
                                                                <a 
                                                                    key={att.id} 
                                                                    href={att.fileUrl} 
                                                                    target="_blank" 
                                                                    rel="noreferrer"
                                                                    className="text-xs flex items-center space-x-1 bg-secondary hover:bg-secondary/80 px-2 py-1 rounded text-foreground transition-colors"
                                                                >
                                                                    <Download className="h-3 w-3" />
                                                                    <span>{att.fileName}</span>
                                                                </a>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>

            `;
    const newContent = content.substring(0, startIndex) + newListSection + content.substring(endIndex);
    fs.writeFileSync(pagePath, newContent);
    console.log("Replaced entire DPR List Section safely!");
}
