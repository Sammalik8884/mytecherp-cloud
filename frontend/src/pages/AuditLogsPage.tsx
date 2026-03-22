import { useState, useEffect } from "react";
import { Loader2, Search, History, Activity } from "lucide-react";
import { auditService } from "../services/auditService";
import { AuditLogDto } from "../types/system";
import { toast } from "react-hot-toast";

export const AuditLogsPage = () => {
    const [searchTerm, setSearchTerm] = useState<string>("");
    const [allLogs, setAllLogs] = useState<AuditLogDto[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRecentLogs = async () => {
            try {
                setLoading(true);
                const data = await auditService.getRecentLogs();
                setAllLogs(data);
            } catch (error) {
                toast.error("Failed to fetch recent audit logs.");
                setAllLogs([]);
            } finally {
                setLoading(false);
            }
        };

        fetchRecentLogs();
    }, []);

    const filteredLogs = allLogs.filter(log => {
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        return (
            log.action.toLowerCase().includes(term) ||
            log.details.toLowerCase().includes(term) ||
            (log.entityName && log.entityName.toLowerCase().includes(term)) ||
            (log.entityId && log.entityId.toString().includes(term)) ||
            (log.changedBy && log.changedBy.toLowerCase().includes(term)) ||
            (log.oldValue && log.oldValue.toLowerCase().includes(term)) ||
            (log.newValue && log.newValue.toLowerCase().includes(term))
        );
    });


    return (
        <div className="p-8 animate-in fade-in duration-500">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent flex items-center gap-3">
                        <Activity className="h-8 w-8 text-primary" />
                        Audit Trail & Logs
                    </h1>
                    <p className="text-muted-foreground mt-1 text-sm">Review system-wide changes, value modifications, and access history.</p>
                </div>
            </div>

            <div className="bg-secondary/30 border border-border/50 rounded-2xl overflow-hidden backdrop-blur-sm shadow-xl mt-6">
                <div className="p-4 border-b border-border/40 flex justify-between items-center bg-secondary/30">
                    <h2 className="font-semibold px-2">Recent System Activity (Top 100)</h2>
                    <div className="relative w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Filter by ID, User, Entity..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="bg-background/50 border border-border text-sm rounded-lg pl-9 pr-4 py-2 w-full focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto min-h-[400px]">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-muted-foreground uppercase bg-black/5 border-b border-border/40">
                            <tr>
                                <th className="px-6 py-4 font-medium">Timestamp</th>
                                <th className="px-6 py-4 font-medium">Entity</th>
                                <th className="px-6 py-4 font-medium">Action</th>
                                <th className="px-6 py-4 font-medium">Details</th>
                                <th className="px-6 py-4 font-medium">Prior Value</th>
                                <th className="px-6 py-4 font-medium">New Value</th>
                                <th className="px-6 py-4 font-medium">User ID</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/30">
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center">
                                        <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary opacity-50" />
                                    </td>
                                </tr>
                            ) : filteredLogs.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-16 text-center text-muted-foreground">
                                        <History className="h-10 w-10 mx-auto opacity-20 mb-3" />
                                        {searchTerm ? "No logs match your filter." : "No recent activity found."}
                                    </td>
                                </tr>
                            ) : (
                                filteredLogs.map((log) => (
                                    <tr key={log.id} className="hover:bg-secondary/50 transition-colors">
                                        <td className="px-6 py-4 text-muted-foreground whitespace-nowrap font-mono text-xs">
                                            {new Date(log.date).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="font-semibold text-foreground">{log.entityName}</span>
                                            {log.entityId && <span className="ml-2 text-xs font-mono text-muted-foreground bg-white/5 px-2 py-0.5 rounded border border-border">#{log.entityId}</span>}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider border ${log.action.toLowerCase().includes('delete') || log.action.toLowerCase().includes('remove') ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' : log.action.toLowerCase().includes('update') ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : log.action.toLowerCase().includes('create') || log.action.toLowerCase().includes('add') ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-primary/10 text-primary border-primary/20'}`}>
                                                {log.action}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 font-medium text-muted-foreground">
                                            {log.details}
                                        </td>
                                        <td className="px-6 py-4 font-mono text-xs text-rose-400 opacity-80 break-all max-w-[150px]">
                                            {log.oldValue || "-"}
                                        </td>
                                        <td className="px-6 py-4 font-mono text-xs text-emerald-400 opacity-80 break-all max-w-[150px]">
                                            {log.newValue || "-"}
                                        </td>
                                        <td className="px-6 py-4 text-muted-foreground font-mono text-xs max-w-[200px] truncate" title={`${log.changedByName || 'System'} (${log.changedBy})`}>
                                            <span className="font-semibold text-foreground block">{log.changedByName || 'System'}</span>
                                            <span className="opacity-70 text-[10px]">{log.changedBy}</span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
