const fs = require('fs');
const path = require('path');

const pagePath = path.join(__dirname, 'frontend', 'src', 'pages', 'ProjectDetailsPage.tsx');
let content = fs.readFileSync(pagePath, 'utf8');

// Add imports
if (!content.includes('DprDetailsModal')) {
    content = content.replace(
        'import { DailyProgressReportModal } from "../components/common/DailyProgressReportModal";',
        `import { DailyProgressReportModal } from "../components/common/DailyProgressReportModal";\nimport { DprDetailsModal, DprViewMode } from "../components/common/DprDetailsModal";`
    );
}

// Add state for modal
if (!content.includes('selectedReportForDetails')) {
    content = content.replace(
        'const [selectedMom, setSelectedMom] = useState<any>(null);',
        `const [selectedMom, setSelectedMom] = useState<any>(null);\n    const [selectedReportForDetails, setSelectedReportForDetails] = useState<any>(null);\n    const [dprViewMode, setDprViewMode] = useState<DprViewMode>(null);`
    );
}

// Replace the DPR list cards with the table
const oldListRegex = /<div className="space-y-4">\s*\{dprs\.map\(\(report\) => \([\s\S]*?<\/div>\s*\)\}\s*<\/div>/;

const newTable = `<div className="overflow-x-auto border border-border rounded-lg bg-card mt-4">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-secondary/50 border-b border-border">
                                        <tr>
                                            <th className="px-4 py-3 text-center border-r border-border">No.</th>
                                            <th className="px-4 py-3 border-r border-border">Project Name</th>
                                            <th className="px-4 py-3 border-r border-border">Site In-charge</th>
                                            <th className="px-4 py-3 text-center border-r border-border">Total workers</th>
                                            <th className="px-4 py-3 border-r border-border">Date</th>
                                            <th className="px-4 py-3 border-r border-border">Site Opening Time</th>
                                            <th className="px-4 py-3 border-r border-border">Site Closing Time</th>
                                            <th className="px-4 py-3 text-center border-r border-border">All Activities</th>
                                            <th className="px-4 py-3 text-center border-r border-border">All Items</th>
                                            <th className="px-4 py-3 text-center border-r border-border">Employee Lists</th>
                                            <th className="px-4 py-3 text-center border-r border-border">Attachments</th>
                                            <th className="px-4 py-3 text-center">View</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {dprs.map((report, idx) => (
                                            <tr key={report.id} className="border-b border-border last:border-0 hover:bg-secondary/20 transition-colors">
                                                <td className="px-4 py-3 text-center border-r border-border">{idx + 1}</td>
                                                <td className="px-4 py-3 border-r border-border">{project?.name}</td>
                                                <td className="px-4 py-3 border-r border-border">{report.siteInCharge}</td>
                                                <td className="px-4 py-3 text-center border-r border-border">{report.totalWorkers}</td>
                                                <td className="px-4 py-3 border-r border-border">
                                                    {new Date(report.date).toLocaleDateString()}<br />
                                                    <span className="text-xs text-muted-foreground">{new Date(report.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                                </td>
                                                <td className="px-4 py-3 border-r border-border">{report.siteOpeningTime}</td>
                                                <td className="px-4 py-3 border-r border-border">{report.siteClosingTime}</td>
                                                <td className="px-4 py-3 text-center border-r border-border">
                                                    <button onClick={() => {setSelectedReportForDetails({...report, siteName: project?.name}); setDprViewMode('activities');}} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded text-xs font-medium transition-colors">All Activities</button>
                                                </td>
                                                <td className="px-4 py-3 text-center border-r border-border">
                                                    <button onClick={() => {setSelectedReportForDetails({...report, siteName: project?.name}); setDprViewMode('items');}} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded text-xs font-medium transition-colors">All Items</button>
                                                </td>
                                                <td className="px-4 py-3 text-center border-r border-border">
                                                    <button onClick={() => {setSelectedReportForDetails({...report, siteName: project?.name}); setDprViewMode('employees');}} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded text-xs font-medium transition-colors">All Employee</button>
                                                </td>
                                                <td className="px-4 py-3 text-center border-r border-border">
                                                    <button onClick={() => {setSelectedReportForDetails({...report, siteName: project?.name}); setDprViewMode('attachments');}} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded text-xs font-medium transition-colors">View</button>
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <div className="flex flex-col space-y-1">
                                                        <button onClick={() => window.open(\`/dpr/\${report.id}/print\`, '_blank')} className="bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded text-xs font-medium transition-colors">PDF</button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>`;

content = content.replace(oldListRegex, newTable);

// Add modal component render at the end
if (!content.includes('<DprDetailsModal')) {
    content = content.replace(
        '<DailyProgressReportModal />',
        `<DailyProgressReportModal />\n            <DprDetailsModal isOpen={!!dprViewMode} onClose={() => setDprViewMode(null)} report={selectedReportForDetails} viewMode={dprViewMode} />`
    );
}

fs.writeFileSync(pagePath, content);
console.log("ProjectDetailsPage patched successfully!");
