import React, { useState, useEffect } from "react";
import { ArrowLeft, Save, Search, Trash2, PackagePlus, AlertCircle } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { apiClient } from "../../services/apiClient";

export function DailyLogFormPage() {
    const navigate = useNavigate();
    const [sites, setSites] = useState<any[]>([]);
    const [siteId, setSiteId] = useState("");
    const [selectedDate, setSelectedDate] = useState(new Date());

    const [toolSearchQuery, setToolSearchQuery] = useState("");
    const [toolSearchResults, setToolSearchResults] = useState<any[]>([]);
    const [isSearchingTool, setIsSearchingTool] = useState(false);

    const [items, setItems] = useState<any[]>([]);
    const [saving, setSaving] = useState(false);
    
    // Custom error state
    const [errorMsg, setErrorMsg] = useState("");

    useEffect(() => {
        apiClient.get('/Sites').then(res => setSites(res.data)).catch(console.error);
    }, []);

    const handleSearchTool = async (query: string) => {
        setToolSearchQuery(query);
        if (query.length < 2) {
            setToolSearchResults([]);
            return;
        }
        setIsSearchingTool(true);
        try {
            // Search from the user's personal stock
            const res = await apiClient.get(`/UserToolStocks/search?q=${encodeURIComponent(query)}`);
            // Only show tools they actually have in their stock
            setToolSearchResults(res.data.filter((t: any) => t.currentQuantity > 0));
        } catch (error) {
            console.error("Error searching tools", error);
        } finally {
            setIsSearchingTool(false);
        }
    };

    const addTool = (tool: any) => {
        if (items.some(i => i.storeToolId === tool.id)) {
            setErrorMsg("This tool is already added to the list below. You can increase its quantity there.");
            setTimeout(() => setErrorMsg(""), 4000);
            return;
        }
        setItems([
            ...items,
            {
                storeToolId: tool.id,
                description: tool.description,
                customDescription: "",
                quantityOut: 1,
                maxAvailable: tool.currentQuantity
            }
        ]);
        setToolSearchQuery("");
        setToolSearchResults([]);
    };

    const removeItem = (index: number) => {
        setItems(items.filter((_, i) => i !== index));
    };

    const updateItem = (index: number, field: string, value: any) => {
        const newItems = [...items];
        if (field === "quantityOut") {
            const val = parseInt(value) || 1;
            const max = newItems[index].maxAvailable;
            if (val > max) {
                setErrorMsg(`You only have ${max} of '${newItems[index].description}' in your inventory.`);
                setTimeout(() => setErrorMsg(""), 4000);
                newItems[index][field] = max;
            } else {
                newItems[index][field] = val;
            }
        } else {
            newItems[index][field] = value;
        }
        setItems(newItems);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg("");

        if (!siteId) {
            setErrorMsg("Please select a destination site.");
            return;
        }
        if (items.length === 0) {
            setErrorMsg("Please add at least one tool.");
            return;
        }

        setSaving(true);
        try {
            await apiClient.post('/StoreDailyLogs/checkout', {
                siteId: parseInt(siteId),
                date: selectedDate.toISOString(),
                timeOut: selectedDate.toISOString(),
                items: items.map(i => ({
                    storeToolId: i.storeToolId,
                    customDescription: i.customDescription || null,
                    quantityOut: i.quantityOut
                }))
            });
            navigate('/store/logs');
        } catch (error: any) {
            console.error(error);
            setErrorMsg(`Checkout Failed: ${error.response?.data?.detail || error.response?.data || error.message}`);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center gap-4 mb-8">
                <Link to="/store/logs" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                    <ArrowLeft className="w-6 h-6 text-gray-600" />
                </Link>
                <h1 className="text-2xl font-bold text-gray-900">New Tool Checkout</h1>
            </div>

            {errorMsg && (
                <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2 border border-red-200">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <span className="font-medium text-sm">{errorMsg}</span>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-6">
                    <h2 className="text-lg font-semibold text-gray-900 border-b border-gray-100 pb-2">General Information</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Destination Site</label>
                            <select
                                required
                                value={siteId}
                                onChange={e => setSiteId(e.target.value)}
                                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 text-sm"
                            >
                                <option value="">Select a site...</option>
                                {sites.map(site => (
                                    <option key={site.id} value={site.id}>{site.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                            <input
                                type="date"
                                required
                                value={selectedDate.toISOString().split('T')[0]}
                                onChange={e => {
                                    const newDate = new Date(e.target.value);
                                    newDate.setHours(selectedDate.getHours(), selectedDate.getMinutes());
                                    setSelectedDate(newDate);
                                }}
                                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Time Out</label>
                            <input
                                type="time"
                                required
                                value={selectedDate.toTimeString().slice(0, 5)}
                                onChange={e => {
                                    const [hours, minutes] = e.target.value.split(':');
                                    const newDate = new Date(selectedDate);
                                    newDate.setHours(parseInt(hours), parseInt(minutes));
                                    setSelectedDate(newDate);
                                }}
                                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 text-sm"
                            />
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-6">
                    <h2 className="text-lg font-semibold text-gray-900 border-b border-gray-100 pb-2">Add Tools from Van Stock</h2>

                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Search your van stock (e.g. pipe, wrench)..."
                            value={toolSearchQuery}
                            onChange={(e) => handleSearchTool(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 text-sm"
                        />
                        {toolSearchResults.length > 0 && (
                            <div className="absolute z-10 w-full mt-1 bg-white rounded-lg shadow-lg border border-gray-100 max-h-60 overflow-y-auto">
                                {toolSearchResults.map(tool => (
                                    <div
                                        key={tool.id}
                                        onClick={() => addTool(tool)}
                                        className="px-4 py-3 hover:bg-blue-50 cursor-pointer flex justify-between items-center border-b border-gray-50 last:border-0"
                                    >
                                        <div>
                                            <div className="font-medium text-sm text-gray-900">{tool.description}</div>
                                            <div className="text-xs text-gray-500">Available in van: {tool.currentQuantity}</div>
                                        </div>
                                        <PackagePlus className="w-4 h-4 text-blue-600" />
                                    </div>
                                ))}
                            </div>
                        )}
                        {toolSearchQuery.length > 1 && toolSearchResults.length === 0 && !isSearchingTool && (
                            <div className="absolute z-10 w-full mt-1 bg-white rounded-lg shadow-lg border border-gray-100 p-4 text-center text-gray-500 text-sm">
                                You don't have this tool in your van stock. <Link to="/store/inventory" className="text-blue-600 hover:underline">Receive stock first</Link>
                            </div>
                        )}
                    </div>

                    {items.length > 0 && (
                        <div className="overflow-x-auto rounded-lg border border-gray-100">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-gray-50 border-b border-gray-100">
                                    <tr>
                                        <th className="px-4 py-3 font-medium text-gray-600">Tool</th>
                                        <th className="px-4 py-3 font-medium text-gray-600 w-1/3">Custom Details (Optional)</th>
                                        <th className="px-4 py-3 font-medium text-gray-600 w-24">Qty Out</th>
                                        <th className="px-4 py-3 w-12"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {items.map((item, index) => (
                                        <tr key={index} className="hover:bg-gray-50/50">
                                            <td className="px-4 py-3">
                                                <div className="font-medium text-gray-900">{item.description}</div>
                                                <div className="text-xs text-gray-500 mt-0.5">Available: {item.maxAvailable}</div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <input
                                                    type="text"
                                                    placeholder="e.g. Serial # or note"
                                                    value={item.customDescription}
                                                    onChange={e => updateItem(index, 'customDescription', e.target.value)}
                                                    className="w-full px-3 py-1.5 rounded border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500"
                                                />
                                            </td>
                                            <td className="px-4 py-3">
                                                <input
                                                    type="number"
                                                    min="1"
                                                    max={item.maxAvailable}
                                                    value={item.quantityOut}
                                                    onChange={e => updateItem(index, 'quantityOut', e.target.value)}
                                                    className="w-full px-3 py-1.5 rounded border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500 text-center"
                                                />
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <button
                                                    type="button"
                                                    onClick={() => removeItem(index)}
                                                    className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                    <button
                        type="button"
                        onClick={() => navigate('/store/logs')}
                        className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={saving}
                        className="px-6 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                        <Save className="w-4 h-4" />
                        {saving ? "Saving..." : "Save Checkout Log"}
                    </button>
                </div>
            </form>
        </div>
    );
}
