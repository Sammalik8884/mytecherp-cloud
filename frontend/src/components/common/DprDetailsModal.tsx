import { X, Download } from "lucide-react";
import { createPortal } from "react-dom";

export type DprViewMode = 'activities' | 'items' | 'employees' | 'attachments' | null;

interface DprDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    report: any | null;
    viewMode: DprViewMode;
}

export const DprDetailsModal = ({ isOpen, onClose, report, viewMode }: DprDetailsModalProps) => {
    if (!isOpen || !report || !viewMode) return null;

    let title = "";
    if (viewMode === 'activities') title = "All Activities";
    if (viewMode === 'items') title = "Material Items";
    if (viewMode === 'employees') title = "Employee List";
    if (viewMode === 'attachments') title = "Attachments";

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
            <div className="bg-card w-full max-w-3xl rounded-xl shadow-2xl border border-border flex flex-col max-h-[85vh]">
                <div className="flex items-center justify-between p-6 border-b border-border bg-slate-100 dark:bg-slate-800/50">
                    <div>
                        <h2 className="text-xl font-bold">{title}</h2>
                        <p className="text-sm text-muted-foreground mt-1">
                            {report.siteName} - {new Date(report.date).toLocaleDateString()}
                        </p>
                    </div>
                    <button onClick={onClose} className="text-muted-foreground hover:bg-secondary p-2 rounded-full transition-colors">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto flex-1">
                    {viewMode === 'activities' && (
                        <div className="border border-border rounded-lg overflow-hidden">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-secondary/50 border-b border-border">
                                    <tr>
                                        <th className="px-4 py-3 w-16 text-center border-r border-border">No.</th>
                                        <th className="px-4 py-3">Activity</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {report.activities && report.activities.length > 0 ? report.activities.map((act: any, idx: number) => (
                                        <tr key={act.id || idx} className="border-b border-border last:border-0">
                                            <td className="px-4 py-3 text-center border-r border-border">{idx + 1}</td>
                                            <td className="px-4 py-3">{act.activityName || act}</td>
                                        </tr>
                                    )) : (
                                        <tr><td colSpan={2} className="px-4 py-8 text-center text-muted-foreground">No activities found.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {viewMode === 'items' && (
                        <div className="border border-border rounded-lg overflow-hidden">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-secondary/50 border-b border-border">
                                    <tr>
                                        <th className="px-4 py-3 w-16 text-center border-r border-border">No.</th>
                                        <th className="px-4 py-3 border-r border-border">Item</th>
                                        <th className="px-4 py-3 border-r border-border text-center">Quantity</th>
                                        <th className="px-4 py-3">Remarks</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {report.materials && report.materials.length > 0 ? report.materials.map((mat: any, idx: number) => (
                                        <tr key={mat.id || idx} className="border-b border-border last:border-0">
                                            <td className="px-4 py-3 text-center border-r border-border">{idx + 1}</td>
                                            <td className="px-4 py-3 border-r border-border">{mat.item}</td>
                                            <td className="px-4 py-3 text-center border-r border-border">{mat.quantity}</td>
                                            <td className="px-4 py-3">{mat.remarks}</td>
                                        </tr>
                                    )) : (
                                        <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">No items found.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {viewMode === 'employees' && (
                        <div className="border border-border rounded-lg overflow-hidden">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-secondary/50 border-b border-border">
                                    <tr>
                                        <th className="px-4 py-3 w-16 text-center border-r border-border">No.</th>
                                        <th className="px-4 py-3 border-r border-border">Employee Name</th>
                                        <th className="px-4 py-3 border-r border-border text-center">In Time</th>
                                        <th className="px-4 py-3 border-r border-border text-center">Out Time</th>
                                        <th className="px-4 py-3 text-center">Over Time</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {report.employees && report.employees.length > 0 ? report.employees.map((emp: any, idx: number) => (
                                        <tr key={emp.id || idx} className="border-b border-border last:border-0">
                                            <td className="px-4 py-3 text-center border-r border-border">{idx + 1}</td>
                                            <td className="px-4 py-3 border-r border-border">{emp.employeeName}</td>
                                            <td className="px-4 py-3 text-center border-r border-border">{emp.inTime || '-'}</td>
                                            <td className="px-4 py-3 text-center border-r border-border">{emp.outTime || '-'}</td>
                                            <td className="px-4 py-3 text-center">{emp.overTime || '-'}</td>
                                        </tr>
                                    )) : (
                                        <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No employees found.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {viewMode === 'attachments' && (
                        <div className="space-y-4">
                            {report.attachments && report.attachments.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {report.attachments.map((att: any) => (
                                        <a 
                                            key={att.id} 
                                            href={att.fileUrl} 
                                            target="_blank" 
                                            rel="noreferrer"
                                            className="flex items-center space-x-3 p-4 border border-border rounded-lg hover:bg-secondary/50 transition-colors group"
                                        >
                                            <div className="bg-primary/10 p-2 rounded-full text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                                                <Download className="h-5 w-5" />
                                            </div>
                                            <span className="font-medium truncate text-sm">{att.fileName}</span>
                                        </a>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12 border border-dashed border-border rounded-lg text-muted-foreground">
                                    No attachments for this report.
                                </div>
                            )}
                        </div>
                    )}
                </div>
                <div className="p-4 border-t border-border flex justify-end bg-secondary/20">
                    <button onClick={onClose} className="px-6 py-2 bg-secondary text-foreground rounded hover:bg-secondary/80 transition-colors font-medium text-sm">
                        Close
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};
