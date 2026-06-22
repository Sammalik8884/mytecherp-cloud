import { useState, useEffect } from "react";
import { ClipboardList, Plus } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

interface DailyLog {
    id: number;
    siteId: number;
    siteName: string;
    date: string;
    timeOut: string;
    timeIn: string | null;
    items: any[];
}

export function DailyLogsPage() {
    const [logs, setLogs] = useState<DailyLog[]>([]);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        fetchLogs();
    }, []);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/StoreDailyLogs', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setLogs(data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <ClipboardList className="w-6 h-6" /> Daily Store Logs
                </h1>
                <Link
                    to="/store/logs/new"
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors"
                >
                    <Plus className="w-5 h-5" /> New Tool Checkout
                </Link>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center text-gray-500">Loading logs...</div>
                ) : (
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4 font-medium text-gray-600">ID</th>
                                <th className="px-6 py-4 font-medium text-gray-600">Site</th>
                                <th className="px-6 py-4 font-medium text-gray-600">Date</th>
                                <th className="px-6 py-4 font-medium text-gray-600">Time Out</th>
                                <th className="px-6 py-4 font-medium text-gray-600">Time In</th>
                                <th className="px-6 py-4 font-medium text-gray-600">Status</th>
                                <th className="px-6 py-4 font-medium text-gray-600 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {logs.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                                        No daily logs found.
                                    </td>
                                </tr>
                            ) : (
                                logs.map(log => (
                                    <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4 text-gray-500">#{log.id}</td>
                                        <td className="px-6 py-4 font-medium text-gray-900">{log.siteName}</td>
                                        <td className="px-6 py-4 text-gray-600">
                                            {new Date(log.date).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 text-gray-600">
                                            {new Date(log.timeOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </td>
                                        <td className="px-6 py-4 text-gray-600">
                                            {log.timeIn ? new Date(log.timeIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                                        </td>
                                        <td className="px-6 py-4">
                                            {log.timeIn ? (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                                    Checked In
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
                                                    Checked Out
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button 
                                                onClick={() => navigate(`/store/logs/checkin`, { state: { log } })}
                                                className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                                            >
                                                {log.timeIn ? 'View Details' : 'Process Check-in'}
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
