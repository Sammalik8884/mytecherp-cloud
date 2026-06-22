import React, { useState, useEffect } from "react";
import { Plus, Search, AlertCircle, Package } from "lucide-react";
import { apiClient } from "../../services/apiClient";

interface StoreTool {
    id: number;
    description: string;
    totalQuantity: number;
    currentQuantity: number;
}

export function StoreToolsPage() {
    const [tools, setTools] = useState<StoreTool[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [showAddForm, setShowAddForm] = useState(false);
    
    const [newTool, setNewTool] = useState({ description: "", totalQuantity: 1 });

    useEffect(() => {
        fetchTools();
    }, []);

    const fetchTools = async () => {
        setLoading(true);
        try {
            const res = await apiClient.get('/StoreTools');
            if (res.data) {
                setTools(res.data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async () => {
        if (!searchQuery) {
            fetchTools();
            return;
        }
        
        setLoading(true);
        try {
            const res = await apiClient.get(`/StoreTools/search?q=${encodeURIComponent(searchQuery)}`);
            if (res.data) {
                setTools(res.data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddTool = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await apiClient.post('/StoreTools', newTool);
            if (res.status === 200 || res.status === 201) {
                setShowAddForm(false);
                setNewTool({ description: "", totalQuantity: 1 });
                fetchTools();
            }
        } catch (error) {
            console.error(error);
        }
    };

    const filteredTools = tools; // We already search on backend

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <Package className="w-6 h-6" /> Tools Inventory
                </h1>
                <button
                    onClick={() => setShowAddForm(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors"
                >
                    <Plus className="w-5 h-5" /> Add Tool
                </button>
            </div>

            {showAddForm && (
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-6">
                    <h2 className="text-lg font-semibold mb-4">Add New Tool</h2>
                    <form onSubmit={handleAddTool} className="flex gap-4 items-end">
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                            <input
                                type="text"
                                required
                                value={newTool.description}
                                onChange={e => setNewTool({ ...newTool, description: e.target.value })}
                                className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                        <div className="w-32">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Total Quantity</label>
                            <input
                                type="number"
                                required
                                min="1"
                                value={newTool.totalQuantity}
                                onChange={e => setNewTool({ ...newTool, totalQuantity: parseInt(e.target.value) })}
                                className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => setShowAddForm(false)}
                                className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                Save
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex gap-4">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Search tools... (Press Enter to search)"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>
                <button
                    onClick={handleSearch}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                >
                    Search
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center text-gray-500">Loading tools...</div>
                ) : (
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4 font-medium text-gray-600">ID</th>
                                <th className="px-6 py-4 font-medium text-gray-600">Description</th>
                                <th className="px-6 py-4 font-medium text-gray-600 text-right">Total Quantity</th>
                                <th className="px-6 py-4 font-medium text-gray-600 text-right">Current Available</th>
                                <th className="px-6 py-4 font-medium text-gray-600">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredTools.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                                        No tools found.
                                    </td>
                                </tr>
                            ) : (
                                filteredTools.map(tool => (
                                    <tr key={tool.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4 text-gray-500">#{tool.id}</td>
                                        <td className="px-6 py-4 font-medium text-gray-900">{tool.description}</td>
                                        <td className="px-6 py-4 text-right text-gray-600">{tool.totalQuantity}</td>
                                        <td className="px-6 py-4 text-right font-medium">
                                            <span className={tool.currentQuantity === 0 ? "text-red-600" : tool.currentQuantity < tool.totalQuantity ? "text-orange-600" : "text-green-600"}>
                                                {tool.currentQuantity}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {tool.currentQuantity === 0 ? (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                                                    <AlertCircle className="w-3 h-3" /> Out of Stock
                                                </span>
                                            ) : tool.currentQuantity < tool.totalQuantity ? (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
                                                    In Use
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                                    Available
                                                </span>
                                            )}
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
