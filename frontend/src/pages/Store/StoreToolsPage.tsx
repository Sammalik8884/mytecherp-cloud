import React, { useState, useEffect } from "react";
import { Plus, Search, AlertCircle, Package, Edit, Trash2, X } from "lucide-react";
import { apiClient } from "../../services/apiClient";

interface StoreTool {
    id: number;
    description: string;
    totalQuantity: number;
    currentQuantity: number;
}

export function StoreToolsPage() {
    const [tools, setTools] = useState<StoreTool[]>([]);
    const [sites, setSites] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [showAddForm, setShowAddForm] = useState(false);
    
    const [newTool, setNewTool] = useState({ description: "", totalQuantity: 1, siteId: "" });
    const [editingToolId, setEditingToolId] = useState<number | null>(null);

    useEffect(() => {
        fetchTools();
        fetchSites();
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
            const payload = {
                description: newTool.description,
                totalQuantity: newTool.totalQuantity,
                siteId: newTool.siteId ? parseInt(newTool.siteId) : null
            };
            if (editingToolId) {
                const res = await apiClient.put(`/StoreTools/${editingToolId}`, payload);
                if (res.status === 200 || res.status === 201) {
                    setShowAddForm(false);
                    setNewTool({ description: "", totalQuantity: 1, siteId: "" });
                    setEditingToolId(null);
                    fetchTools();
                    alert("Tool updated successfully!");
                }
            } else {
                const res = await apiClient.post('/StoreTools', payload);
                if (res.status === 200 || res.status === 201) {
                    setShowAddForm(false);
                    setNewTool({ description: "", totalQuantity: 1, siteId: "" });
                    fetchTools();
                    alert("Tool added successfully! If you selected a site, it was seeded into that site's inventory with quantity 0.");
                }
            }
        } catch (error: any) {
            console.error(error);
            alert(`Error saving tool: ${error.response?.data || error.message}`);
        }
    };

    const handleEditClick = (tool: any) => {
        setEditingToolId(tool.id);
        setNewTool({
            description: tool.description,
            totalQuantity: tool.totalQuantity,
            siteId: "" // Not relevant for update
        });
        setShowAddForm(true);
    };

    const handleDeleteClick = async (id: number) => {
        if (!confirm("Are you sure you want to delete this tool from the catalog?")) return;
        try {
            await apiClient.delete(`/StoreTools/${id}`);
            fetchTools();
        } catch (error: any) {
            console.error(error);
            alert(`Error deleting tool: ${error.response?.data || error.message}`);
        }
    };

    const filteredTools = tools;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <Package className="w-6 h-6" /> Tools Catalog
                </h1>
                <button
                    onClick={() => {
                        setEditingToolId(null);
                        setNewTool({ description: "", totalQuantity: 1, siteId: "" });
                        setShowAddForm(true);
                    }}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors"
                >
                    <Plus className="w-5 h-5" /> New Global Tool
                </button>
            </div>

            {showAddForm && (
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-6">
                    <h2 className="text-xl font-bold mb-4">{editingToolId ? "Edit Tool" : "Add New Global Tool"}</h2>
                    <form onSubmit={handleAddTool} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                            <input
                                type="text"
                                required
                                value={newTool.description}
                                onChange={e => setNewTool({ ...newTool, description: e.target.value })}
                                className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Total Global Quantity</label>
                            <input
                                type="number"
                                required
                                min="0"
                                value={newTool.totalQuantity}
                                onChange={e => setNewTool({ ...newTool, totalQuantity: parseInt(e.target.value) || 0 })}
                                className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                        {!editingToolId && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Seed to Site (Optional)</label>
                                <select
                                    value={newTool.siteId}
                                    onChange={e => setNewTool({ ...newTool, siteId: e.target.value })}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="">None</option>
                                    {sites.map(s => (
                                        <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                        <div className="flex justify-end gap-3 mt-6">
                            <button
                                type="button"
                                onClick={() => {
                                    setShowAddForm(false);
                                    setEditingToolId(null);
                                    setNewTool({ description: "", totalQuantity: 1, siteId: "" });
                                }}
                                className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                {editingToolId ? "Save Changes" : "Create Tool"}
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
                        placeholder="Search global catalog... (Press Enter to search)"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>
                <button
                    onClick={handleSearch}
                    className="bg-gray-900 text-white px-6 py-2 rounded-lg hover:bg-gray-800 transition-colors"
                >
                    Search
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center text-gray-500">Loading catalog...</div>
                ) : filteredTools.length === 0 ? (
                    <div className="p-8 text-center text-gray-500 flex flex-col items-center">
                        <AlertCircle className="w-12 h-12 text-gray-300 mb-2" />
                        <p>No tools found in the catalog.</p>
                    </div>
                ) : (
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4 font-medium text-gray-600">ID</th>
                                <th className="px-6 py-4 font-medium text-gray-600">Description</th>
                                <th className="px-6 py-4 font-medium text-gray-600">Total Global Qty</th>
                                <th className="px-6 py-4 font-medium text-gray-600 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filteredTools.map((tool) => (
                                <tr key={tool.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 font-medium text-gray-900">#{tool.id}</td>
                                    <td className="px-6 py-4 text-gray-600 font-medium">{tool.description}</td>
                                    <td className="px-6 py-4">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                            {tool.totalQuantity} items
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button onClick={() => handleEditClick(tool)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg" title="Edit">
                                                <Edit className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => handleDeleteClick(tool.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg" title="Delete">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
