import React, { useState, useEffect } from "react";
import { ArrowLeft, CheckCircle, AlertTriangle } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { apiClient } from "../../services/apiClient";

export function DailyLogCheckInPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const [log, setLog] = useState<any>(null);
    
    const [timeIn, setTimeIn] = useState(new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }));
    const [items, setItems] = useState<any[]>([]);

    useEffect(() => {
        if (location.state?.log) {
            setLog(location.state.log);
            setItems(location.state.log.items.map((i: any) => ({
                ...i,
                quantityIn: i.quantityOut // Default check-in quantity to checked-out quantity
            })));
        } else {
            navigate('/store/logs'); // fallback
        }
    }, [location, navigate]);

    if (!log) return null;

    const updateItem = (index: number, value: number) => {
        const newItems = [...items];
        newItems[index].quantityIn = value;
        setItems(newItems);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            // Re-construct the timeIn string using the original date
            const logDate = new Date(log.date);
            const [hours, minutes] = timeIn.split(':').map(Number);
            logDate.setHours(hours, minutes, 0, 0);

            const res = await apiClient.post(`/StoreDailyLogs/checkin/${log.id}`, {
                timeIn: logDate.toISOString(),
                items: items.map(i => ({
                    id: i.id, // ID of the StoreDailyLogItem
                    quantityIn: i.quantityIn
                }))
            });

            if (res.status === 200 || res.status === 204) {
                navigate('/store/logs');
            }
        } catch (error: any) {
            console.error(error);
            alert(`Error: ${error.response?.data || error.message}`);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-24">
            <div className="flex items-center gap-4">
                <Link to="/store/logs" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                    <ArrowLeft className="w-6 h-6 text-gray-600" />
                </Link>
                <h1 className="text-2xl font-bold text-gray-900">Process Check-in</h1>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <p className="text-sm text-gray-500 mb-1">Site</p>
                        <p className="font-medium text-gray-900">{log.siteName}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 mb-1">Date</p>
                        <p className="font-medium text-gray-900">{new Date(log.date).toLocaleDateString()}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 mb-1">Time Out</p>
                        <p className="font-medium text-gray-900">
                            {new Date(log.timeOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-6">
                    <div className="flex justify-between items-center">
                        <h2 className="text-lg font-semibold text-gray-900">Return Items</h2>
                        <div className="w-48">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Time In</label>
                            <input
                                type="time"
                                required
                                value={timeIn}
                                onChange={(e) => setTimeIn(e.target.value)}
                                className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 border-y border-gray-100">
                                <tr>
                                    <th className="px-4 py-3 font-medium text-gray-600">Tool</th>
                                    <th className="px-4 py-3 font-medium text-gray-600">Custom Details</th>
                                    <th className="px-4 py-3 font-medium text-gray-600 text-center">Qty Out</th>
                                    <th className="px-4 py-3 font-medium text-gray-600 w-32">Qty In</th>
                                    <th className="px-4 py-3 font-medium text-gray-600 text-right">Difference</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {items.map((item, index) => {
                                    const diff = item.quantityIn - item.quantityOut;
                                    return (
                                        <tr key={index}>
                                            <td className="px-4 py-4 font-medium text-gray-900">
                                                {item.storeTool.description}
                                            </td>
                                            <td className="px-4 py-4 text-gray-500 text-sm">
                                                {item.customDescription || '-'}
                                            </td>
                                            <td className="px-4 py-4 text-center text-gray-600 font-medium">
                                                {item.quantityOut}
                                            </td>
                                            <td className="px-4 py-3">
                                                <input
                                                    type="number"
                                                    required
                                                    min="0"
                                                    max={item.quantityOut} // assuming they cannot return more than they took
                                                    value={item.quantityIn}
                                                    onChange={(e) => updateItem(index, parseInt(e.target.value))}
                                                    className="w-full px-3 py-1.5 rounded border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                />
                                            </td>
                                            <td className="px-4 py-4 text-right">
                                                {diff < 0 ? (
                                                    <span className="inline-flex items-center gap-1 text-red-600 font-medium bg-red-50 px-2 py-1 rounded">
                                                        <AlertTriangle className="w-4 h-4" /> {diff} (Lost)
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 text-green-600 font-medium">
                                                        <CheckCircle className="w-4 h-4" /> Balanced
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="flex justify-end gap-4">
                    <Link
                        to="/store/logs"
                        className="px-6 py-2.5 text-gray-700 font-medium bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        Cancel
                    </Link>
                    <button
                        type="submit"
                        className="px-6 py-2.5 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 shadow-sm"
                    >
                        <CheckCircle className="w-5 h-5" />
                        Complete Check-in
                    </button>
                </div>
            </form>
        </div>
    );
}
