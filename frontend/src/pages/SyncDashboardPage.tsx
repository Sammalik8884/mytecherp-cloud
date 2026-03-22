import React, { useEffect, useState } from 'react';
import { apiClient } from '../services/apiClient';
import { format } from 'date-fns';
import { ShieldAlert, History, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface SyncLog {
    id: number;
    userId: string;
    role: string;
    itemsPushed: number;
    itemsPulled: number;
    conflictsResolved: number;
    errorsEncountered: number;
    syncTime: string;
}

interface SyncConflict {
    id: number;
    entityType: string;
    serverId: number;
    localMobileId: string;
    serverPayloadJson: string;
    clientPayloadJson: string;
    resolutionStrategy: string;
    conflictTime: string;
}

export const SyncDashboardPage: React.FC = () => {
    const [logs, setLogs] = useState<SyncLog[]>([]);
    const [conflicts, setConflicts] = useState<SyncConflict[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [logsRes, confRes] = await Promise.all([
                apiClient.get('/Sync/logs'),
                apiClient.get('/Sync/conflicts'),
            ]);
            setLogs(logsRes.data);
            setConflicts(confRes.data);
        } catch (error) {
            toast.error("Failed to load sync dashboard data");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    if (loading) return <div className="p-8">Loading Sync Intelligence...</div>;

    return (
        <div className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-foreground">Global Sync Command Center</h1>
                <p className="text-muted-foreground mt-2">Monitor offline-first synchronization activities and conflict resolutions across the entire tenant.</p>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                {/* Sync Logs Table */}
                <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden flex flex-col">
                    <div className="p-5 border-b border-border bg-muted/30 flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                            <History className="text-primary" size={20} />
                            <h2 className="text-lg font-semibold text-card-foreground">Recent Sync Activity</h2>
                        </div>
                        <div className="text-sm text-muted-foreground font-medium">{logs.length} records</div>
                    </div>
                    <div className="overflow-x-auto flex-1 p-0">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border">
                                <tr>
                                    <th className="px-6 py-4 font-semibold">User Role</th>
                                    <th className="px-6 py-4 font-semibold">Status</th>
                                    <th className="px-6 py-4 font-semibold whitespace-nowrap">Metrics (Push / Pull)</th>
                                    <th className="px-6 py-4 font-semibold text-right">Timestamp</th>
                                </tr>
                            </thead>
                            <tbody>
                                {logs.map(log => (
                                    <tr key={log.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                                        <td className="px-6 py-4 border-r border-border/50 font-medium">
                                            {log.role}
                                            <div className="text-xs text-muted-foreground font-mono mt-1 w-24 truncate" title={log.userId}>{log.userId}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {log.errorsEncountered > 0 ? (
                                                <span className="inline-flex items-center px-2 py-1 bg-red-500/10 text-red-600 rounded-md text-xs font-semibold">
                                                    {log.errorsEncountered} Errors
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-2 py-1 bg-emerald-500/10 text-emerald-600 rounded-md text-xs font-semibold">
                                                    <CheckCircle size={12} className="mr-1" /> Perfect
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center space-x-3 text-xs font-medium">
                                                <span className="text-blue-600 bg-blue-500/10 px-2 py-1 rounded">↑ {log.itemsPushed}</span>
                                                <span className="text-purple-600 bg-purple-500/10 px-2 py-1 rounded">↓ {log.itemsPulled}</span>
                                                {log.conflictsResolved > 0 && <span className="text-amber-600 bg-amber-500/10 px-2 py-1 rounded">⚠ {log.conflictsResolved}</span>}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right text-muted-foreground whitespace-nowrap">
                                            {format(new Date(log.syncTime), 'MMM dd, HH:mm:ss')}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {logs.length === 0 && <div className="p-8 text-center text-muted-foreground">No sync history yet.</div>}
                    </div>
                </div>

                {/* Conflicts Table */}
                <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden flex flex-col">
                    <div className="p-5 border-b border-border bg-amber-500/5 flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                            <ShieldAlert className="text-amber-500" size={20} />
                            <h2 className="text-lg font-semibold text-card-foreground">Data Override Conflicts</h2>
                        </div>
                        <div className="text-sm text-muted-foreground font-medium">{conflicts.length} incidents</div>
                    </div>
                    <div className="overflow-x-auto flex-1 p-0">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border">
                                <tr>
                                    <th className="px-6 py-4 font-semibold">Entity</th>
                                    <th className="px-6 py-4 font-semibold">Strategy Taken</th>
                                    <th className="px-6 py-4 font-semibold text-right">Time</th>
                                </tr>
                            </thead>
                            <tbody>
                                {conflicts.map(c => (
                                    <tr key={c.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-semibold text-foreground">{c.entityType}</div>
                                            <div className="text-xs text-muted-foreground font-mono mt-1">ID: {c.serverId}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center px-2.5 py-1 bg-amber-500/10 text-amber-600 rounded-md text-xs font-semibold">
                                                {c.resolutionStrategy}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right text-muted-foreground whitespace-nowrap">
                                            {format(new Date(c.conflictTime), 'MMM dd, HH:mm')}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {conflicts.length === 0 && <div className="p-8 text-center text-muted-foreground">Amazing! No synchronization conflicts detected.</div>}
                    </div>
                </div>
            </div>
        </div>
    );
};
