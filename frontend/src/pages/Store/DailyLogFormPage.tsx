import React, { useState, useEffect } from "react";
import { ArrowLeft, Save, Search, Trash2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { apiClient } from "../../services/apiClient";

export function DailyLogFormPage() {
    const navigate = useNavigate();
    const [sites, setSites] = useState<any[]>([]);
    const [siteId, setSiteId] = useState("");
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [timeOut, setTimeOut] = useState(new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }));
    
    const [items, setItems] = useState<any[]>([]);
    
    // Tool Search State
    const [searchQuery, setSearchQuery] = useState("");
    const [toolSearchResults, setToolSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    
    useEffect(() => {
        fetchSites();
    }, []);

    const fetchSites = async () => {
        try {
            const res = await apiClient.get('/Sites');
            if (res.data) {
                setSites(res.data);
            }
        } catch (error) {
            console.error(error);
        }
    };

    // Intelligent Search implemented via API
    const handleSearchTool = async (query: string) => {
        setSearchQuery(query);
        if (query.length < 2) {
            setToolSearchResults([]);
            return;
        }

        setIsSearching(true);
        try {
            const res = await apiClient.get(`/StoreTools/search?q=${encodeURIComponent(query)}`);
            if (res.data) {
                // Filter out tools with 0 current quantity
                setToolSearchResults(res.data.filter((t: any) => t.currentQuantity > 0));
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsSearching(false);
        }
    };

    const addTool = (tool: any) => {
        // Prevent adding same tool multiple times, unless custom description differs (for simplicity, just add)
        if (items.some(i => i.storeToolId === tool.id)) {
            alert("Tool already added. Please update the quantity instead.");
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
        setSearchQuery("");
        setToolSearchResults([]);
    };

    const removeItem = (index: number) => {
        const newItems = [...items];
        newItems.splice(index, 1);
        setItems(newItems);
    };

    const updateItem = (index: number, field: string, value: any) => {
        const newItems = [...items];
        newItems[index] = { ...newItems[index], [field]: value };
        setItems(newItems);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Time validation (cannot be before current time) -> "Time Out"
        const now = new Date();
        const selectedDate = new Date(date);
        const [hours, minutes] = timeOut.split(':').map(Number);
        selectedDate.setHours(hours, minutes, 0, 0);

        if (selectedDate > now) {
            alert("Checkout time cannot be in the future.");
            return;
        }

        // Must have items
        if (items.length === 0) {
            alert("Please add at least one tool.");
            return;
        }

        // Validate quantities
        for (const item of items) {
            if (item.quantityOut < 1) {
                alert(`Invalid quantity for ${item.description}`);
                return;
            }
            if (item.quantityOut > item.maxAvailable) {
                alert(`Requested quantity for ${item.description} exceeds available stock (${item.maxAvailable}).`);
                return;
            }
        }

        try {
            const res = await apiClient.post('/StoreDailyLogs/checkout', {
                siteId: parseInt(siteId),
                date: selectedDate.toISOString(),
                timeOut: selectedDate.toISOString(),
                items: items.map(i => ({
                    storeToolId: i.storeToolId,
                    customDescription: i.customDescription || null,
                    quantityOut: i.quantityOut
                }))
            });

            if (res.status === 200 || res.status === 201) {
                navigate('/store/logs');
            }
        } catch (error: any) {
            console.error(error);
            alert(`Error: ${error.response?.data || error.message || "An error occurred while saving."}`);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-24">
            <div className="flex items-center gap-4">
                <Link to="/store/logs" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                    <ArrowLeft className="w-6 h-6 text-gray-600" />
                </Link>
                <h1 className="text-2xl font-bold text-gray-900">New Tool Checkout (Time Out)</h1>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-6">
                    <h2 className="text-lg font-semibold text-gray-900">General Information</h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Site</label>
                            <select
                                required
                                value={siteId}
                                onChange={(e) => setSiteId(e.target.value)}
                                className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="">Select a Site</option>
                                {sites.map((site) => (
                                    <option key={site.id} value={site.id}>{site.name}</option>
                                ))}
                            </select>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                                <input
                                    type="date"
                                    required
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Time Out</label>
                                <input
                                    type="time"
                                    required
                                    value={timeOut}
                                    onChange={(e) => setTimeOut(e.target.value)}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-6">
                    <h2 className="text-lg font-semibold text-gray-900">Add Tools</h2>
                    
                    <div className="relative">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                placeholder="Search tool by name (e.g. pipe, wrench)..."
                                value={searchQuery}
                                onChange={(e) => handleSearchTool(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                        
                        {toolSearchResults.length > 0 && (
                            <div className="absolute z-10 w-full mt-1 bg-white rounded-lg shadow-lg border border-gray-100 max-h-60 overflow-y-auto">
                                {toolSearchResults.map((tool) => (
                                    <div 
                                        key={tool.id}
                                        onClick={() => addTool(tool)}
                                        className="px-4 py-3 hover:bg-blue-50 cursor-pointer flex justify-between items-center border-b border-gray-50 last:border-0"
                                    >
                                        <span className="font-medium text-gray-900">{tool.description}</span>
                                        <span className="text-sm text-gray-500">Available: {tool.currentQuantity}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                        {searchQuery.length > 1 && toolSearchResults.length === 0 && !isSearching && (
                            <div className="absolute z-10 w-full mt-1 bg-white rounded-lg shadow-lg border border-gray-100 p-4 text-center text-gray-500">
                                No tools found with available stock.
                            </div>
                        )}
                    </div>

                    {items.length > 0 && (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 border-y border-gray-100">
                                    <tr>
                                        <th className="px-4 py-3 font-medium text-gray-600">Tool</th>
                                        <th className="px-4 py-3 font-medium text-gray-600">Custom Details (Optional)</th>
                                        <th className="px-4 py-3 font-medium text-gray-600 w-32">Qty Out</th>
                                        <th className="px-4 py-3 w-16"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {items.map((item, index) => (
                                        <tr key={index}>
                                            <td className="px-4 py-3">
                                                <div className="font-medium text-gray-900">{item.description}</div>
                                                <div className="text-xs text-gray-500">Available: {item.maxAvailable}</div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <input
                                                    type="text"
                                                    placeholder="e.g. Serial # or note"
                                                    value={item.customDescription}
                                                    onChange={(e) => updateItem(index, 'customDescription', e.target.value)}
                                                    className="w-full px-3 py-1.5 rounded border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                />
                                            </td>
                                            <td className="px-4 py-3">
                                                <input
                                                    type="number"
                                                    required
                                                    min="1"
                                                    max={item.maxAvailable}
                                                    value={item.quantityOut}
                                                    onChange={(e) => updateItem(index, 'quantityOut', parseInt(e.target.value))}
                                                    className="w-full px-3 py-1.5 rounded border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                />
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <button
                                                    type="button"
                                                    onClick={() => removeItem(index)}
                                                    className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
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

                <div className="flex justify-end gap-4">
                    <Link
                        to="/store/logs"
                        className="px-6 py-2.5 text-gray-700 font-medium bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        Cancel
                    </Link>
                    <button
                        type="submit"
                        className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm"
                    >
                        <Save className="w-5 h-5" />
                        Save Checkout Log
                    </button>
                </div>
            </form>
        </div>
    );
}
