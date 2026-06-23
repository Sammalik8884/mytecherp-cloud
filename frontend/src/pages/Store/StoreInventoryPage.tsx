import { useState, useEffect } from "react";
import { CheckCircle, Warehouse, Save, Search, PackagePlus, X, Trash2 } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { apiClient } from "../../services/apiClient";

interface StockRow {
    id: number;
    storeToolId: number;
    description: string;
    totalQuantity: number;
    availableQuantity: number;
    editValue: number;
    dirty: boolean;
    saving: boolean;
    saved: boolean;
}

export function StoreInventoryPage() {
    const [searchParams] = useSearchParams();
    const [sites, setSites] = useState<any[]>([]);
    const [siteId, setSiteId] = useState(searchParams.get('siteId') || "");
    const [rows, setRows] = useState<StockRow[]>([]);
    const [filteredRows, setFilteredRows] = useState<StockRow[]>([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState("");
    const [savingAll, setSavingAll] = useState(false);
    const [savedAllMsg, setSavedAllMsg] = useState("");
    
    // Add stock modal state
    const [showAddModal, setShowAddModal] = useState(false);
    const [searchGlobal, setSearchGlobal] = useState("");
    const [globalTools, setGlobalTools] = useState<any[]>([]);
    const [isSearchingGlobal, setIsSearchingGlobal] = useState(false);
    const [selectedGlobalTool, setSelectedGlobalTool] = useState<any>(null);
    const [addQuantity, setAddQuantity] = useState(1);
    const [isAddingStock, setIsAddingStock] = useState(false);

    useEffect(() => { fetchSites(); }, []);

    useEffect(() => {
        if (siteId) fetchStock(parseInt(siteId));
        else { setRows([]); setFilteredRows([]); }
    }, [siteId]);

    useEffect(() => {
        if (!search.trim()) {
            setFilteredRows(rows);
        } else {
            const q = search.toLowerCase();
            setFilteredRows(rows.filter(r => r.description.toLowerCase().includes(q)));
        }
    }, [search, rows]);

    const fetchSites = async () => {
        try {
            const res = await apiClient.get('/Sites');
            setSites(res.data || []);
        } catch (e) { console.error(e); }
    };

    const fetchStock = async (id: number) => {
        setLoading(true);
        setSearch("");
        try {
            const res = await apiClient.get(`/SiteToolStocks/site/${id}`);
            const data: StockRow[] = (res.data || []).map((s: any) => ({
                id: s.id,
                storeToolId: s.storeToolId,
                description: s.description,
                totalQuantity: s.totalQuantity,
                availableQuantity: s.availableQuantity,
                editValue: s.availableQuantity,
                dirty: false,
                saving: false,
                saved: false,
            }));
            setRows(data);
            setFilteredRows(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (id: number, val: string) => {
        const num = parseInt(val) || 0;
        setRows(prev => prev.map(r =>
            r.id === id ? { ...r, editValue: num < 0 ? 0 : num, dirty: true, saved: false } : r
        ));
    };

    const saveRow = async (row: StockRow) => {
        setRows(prev => prev.map(r => r.id === row.id ? { ...r, saving: true } : r));
        try {
            await apiClient.put(`/SiteToolStocks/${row.id}`, { quantity: row.editValue });
            setRows(prev => prev.map(r =>
                r.id === row.id
                    ? { ...r, availableQuantity: r.editValue, saving: false, dirty: false, saved: true }
                    : r
            ));
            setTimeout(() => {
                setRows(prev => prev.map(r => r.id === row.id ? { ...r, saved: false } : r));
            }, 2000);
        } catch (e: any) {
            alert(`Error saving: ${e.response?.data || e.message}`);
            setRows(prev => prev.map(r => r.id === row.id ? { ...r, saving: false } : r));
        }
    };

    const saveAll = async () => {
        const dirtyRows = rows.filter(r => r.dirty);
        if (dirtyRows.length === 0) return;
        setSavingAll(true);
        try {
            await Promise.all(dirtyRows.map(row =>
                apiClient.put(`/SiteToolStocks/${row.id}`, { quantity: row.editValue })
            ));
            setRows(prev => prev.map(r =>
                r.dirty ? { ...r, availableQuantity: r.editValue, dirty: false, saved: true } : r
            ));
            setSavedAllMsg(`✅ ${dirtyRows.length} item(s) updated successfully!`);
            setTimeout(() => {
                setSavedAllMsg("");
                setRows(prev => prev.map(r => ({ ...r, saved: false })));
            }, 3000);
        } catch (e: any) {
            alert(`Error: ${e.response?.data || e.message}`);
        } finally {
            setSavingAll(false);
        }
    };

    const handleDeleteRow = async (id: number) => {
        if (!confirm("Are you sure you want to remove this tool from the site inventory?")) return;
        try {
            await apiClient.delete(`/SiteToolStocks/${id}`);
            setRows(prev => prev.filter(r => r.id !== id));
        } catch (e: any) {
            alert(`Error deleting row: ${e.response?.data || e.message}`);
        }
    };

    const dirtyCount = rows.filter(r => r.dirty).length;

    const handleSearchGlobal = async (q: string) => {
        setSearchGlobal(q);
        if (q.length < 2) {
            setGlobalTools([]);
            return;
        }
        setIsSearchingGlobal(true);
        try {
            const res = await apiClient.get(`/StoreTools/search?q=${encodeURIComponent(q)}`);
            // User requested to see tools even if they are in inventory to add more stock
            setGlobalTools(res.data || []);
        } catch (error) {
            console.error("Error searching global tools", error);
        } finally {
            setIsSearchingGlobal(false);
        }
    };

    const handleReceiveStock = async () => {
        if (!siteId || !selectedGlobalTool) return;
        setIsAddingStock(true);
        try {
            await apiClient.post('/SiteToolStocks/receive', {
                siteId: parseInt(siteId),
                items: [{
                    storeToolId: selectedGlobalTool.id,
                    quantity: addQuantity
                }]
            });
            setShowAddModal(false);
            setSelectedGlobalTool(null);
            setAddQuantity(1);
            setSearchGlobal("");
            setSavedAllMsg(`Successfully received ${addQuantity} of ${selectedGlobalTool.description}`);
            fetchStock(parseInt(siteId));
            setTimeout(() => setSavedAllMsg(""), 3000);
        } catch (error: any) {
            alert(`Error receiving stock: ${error.response?.data || error.message}`);
        } finally {
            setIsAddingStock(false);
        }
    };


    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <Warehouse className="w-6 h-6 text-blue-600" />
                    Site Inventory
                </h1>
                {siteId && (
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 font-medium transition-colors border border-blue-200"
                        >
                            <PackagePlus className="w-4 h-4" />
                            Receive Stock
                        </button>
                        {dirtyCount > 0 && (
                            <button
                                onClick={saveAll}
                                disabled={savingAll}
                                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium disabled:opacity-60 transition-colors"
                            >
                                <Save className="w-4 h-4" />
                                {savingAll ? "Saving..." : `Save All (${dirtyCount})`}
                            </button>
                        )}
                    </div>
                )}
            </div>

            {savedAllMsg && (
                <div className="flex items-center gap-2 bg-green-50 text-green-700 px-4 py-3 rounded-lg font-medium">
                    <CheckCircle className="w-4 h-4" /> {savedAllMsg}
                </div>
            )}

            {/* Site Selector */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-wrap items-center gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Select Site</label>
                    <select
                        value={siteId}
                        onChange={(e) => { setSiteId(e.target.value); setRows([]); }}
                        className="px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 min-w-[220px]"
                    >
                        <option value="">— Choose a site —</option>
                        {sites.map(s => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                    </select>
                </div>

                {siteId && rows.length > 0 && (
                    <div className="flex-1 min-w-[200px]">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Search Tools</label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input
                                type="text"
                                placeholder="Filter by tool name..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-9 pr-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 w-full text-sm"
                            />
                        </div>
                    </div>
                )}

                {siteId && (
                    <div className="text-sm text-gray-500 mt-4">
                        {rows.length} tools · {rows.filter(r => r.availableQuantity > 0).length} with stock
                    </div>
                )}
            </div>

            {/* Inventory Table */}
            {siteId && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    {loading ? (
                        <div className="p-10 text-center text-gray-400">Loading inventory...</div>
                    ) : filteredRows.length === 0 ? (
                        <div className="p-10 text-center text-gray-400">
                            <Warehouse className="w-12 h-12 mx-auto mb-2 opacity-20" />
                            {search ? "No tools match your search." : "No tools found for this site."}
                        </div>
                    ) : (
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 border-b border-gray-100 sticky top-0">
                                <tr>
                                    <th className="px-4 py-3 font-medium text-gray-600">Tool Description</th>
                                    <th className="px-4 py-3 font-medium text-gray-600 text-center w-32">Total (Global)</th>
                                    <th className="px-4 py-3 font-medium text-gray-600 text-center w-40">Available at Site</th>
                                    <th className="px-4 py-3 w-24"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filteredRows.map((row) => (
                                    <tr key={row.id} className={`hover:bg-gray-50 transition-colors ${row.dirty ? 'bg-amber-50/60' : ''}`}>
                                        <td className="px-4 py-2.5 font-medium text-gray-900">{row.description}</td>
                                        <td className="px-4 py-2.5 text-center text-gray-400">{row.totalQuantity}</td>
                                        <td className="px-4 py-2.5 text-center">
                                            <input
                                                type="number"
                                                min="0"
                                                value={row.editValue}
                                                onChange={(e) => handleChange(row.id, e.target.value)}
                                                className={`w-24 px-3 py-1.5 text-center text-sm rounded-lg border font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors
                                                    ${row.dirty
                                                        ? 'border-amber-400 bg-amber-50 text-amber-800'
                                                        : row.availableQuantity > 0
                                                            ? 'border-green-200 bg-green-50 text-green-700'
                                                            : 'border-gray-200 text-gray-500'
                                                    }`}
                                            />
                                        </td>
                                        <td className="px-4 py-2.5 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                {row.saving ? (
                                                    <span className="text-xs text-gray-400">Saving...</span>
                                                ) : row.saved ? (
                                                    <span className="text-xs text-green-600 flex items-center gap-1">
                                                        <CheckCircle className="w-3 h-3" /> Saved
                                                    </span>
                                                ) : row.dirty ? (
                                                    <button
                                                        onClick={() => saveRow(row)}
                                                        className="text-xs px-2.5 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                                                    >
                                                        Save
                                                    </button>
                                                ) : null}
                                                <button
                                                    onClick={() => handleDeleteRow(row.id)}
                                                    className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Remove from Site Inventory"
                                                >
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
            )}

            {!siteId && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center text-gray-400">
                    <Warehouse className="w-14 h-14 mx-auto mb-3 opacity-20" />
                    <p className="font-medium">Select a site to manage its tool inventory</p>
                    <p className="text-sm mt-1">You can update quantities directly in the table</p>
                </div>
            )}

            {/* Receive Stock Modal */}
            {showAddModal && siteId && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-xl max-w-lg w-full overflow-hidden">
                        <div className="flex justify-between items-center p-6 border-b border-gray-100">
                            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                <PackagePlus className="w-5 h-5 text-blue-600" />
                                Receive New Stock
                            </h2>
                            <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 space-y-6">
                            {!selectedGlobalTool ? (
                                <div className="space-y-4">
                                    <label className="block text-sm font-medium text-gray-700">Search Global Tools</label>
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                                        <input
                                            type="text"
                                            autoFocus
                                            placeholder="Type tool name..."
                                            value={searchGlobal}
                                            onChange={(e) => handleSearchGlobal(e.target.value)}
                                            className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div className="max-h-60 overflow-y-auto rounded-lg border border-gray-100">
                                        {isSearchingGlobal ? (
                                            <div className="p-4 text-center text-gray-500 text-sm">Searching...</div>
                                        ) : globalTools.length > 0 ? (
                                            globalTools.map(tool => {
                                                const existingStock = rows.find(r => r.storeToolId === tool.id);
                                                return (
                                                    <div
                                                        key={tool.id}
                                                        onClick={() => setSelectedGlobalTool(tool)}
                                                        className="p-3 hover:bg-blue-50 cursor-pointer flex justify-between items-center border-b border-gray-50 last:border-0"
                                                    >
                                                        <div className="flex flex-col">
                                                            <span className="font-medium text-gray-900">{tool.description}</span>
                                                            {existingStock && (
                                                                <span className="text-xs text-blue-600 font-semibold bg-blue-100 w-fit px-2 py-0.5 rounded-full mt-1">
                                                                    Already in Inventory: {existingStock.availableQuantity}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <span className="text-sm text-gray-500 whitespace-nowrap ml-4">Global Qty: {tool.totalQuantity}</span>
                                                    </div>
                                                );
                                            })
                                        ) : searchGlobal.length >= 2 ? (
                                            <div className="p-4 text-center text-sm text-gray-500">
                                                No matching tools found.
                                            </div>
                                        ) : null}
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <div className="bg-blue-50 p-4 rounded-lg flex justify-between items-center border border-blue-100">
                                        <div>
                                            <div className="text-sm text-blue-600 font-medium mb-1">Selected Tool</div>
                                            <div className="font-bold text-gray-900">{selectedGlobalTool.description}</div>
                                            {rows.find(r => r.storeToolId === selectedGlobalTool.id) && (
                                                <div className="text-xs text-blue-700 mt-1">
                                                    Note: This will add to your existing inventory of {rows.find(r => r.storeToolId === selectedGlobalTool.id)?.availableQuantity}.
                                                </div>
                                            )}
                                        </div>
                                        <button
                                            onClick={() => setSelectedGlobalTool(null)}
                                            className="text-sm text-blue-600 hover:text-blue-800 shrink-0 ml-4"
                                        >
                                            Change
                                        </button>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Initial Quantity Received</label>
                                        <input
                                            type="number"
                                            min="1"
                                            value={addQuantity}
                                            onChange={(e) => setAddQuantity(parseInt(e.target.value) || 0)}
                                            className="w-full px-4 py-3 text-lg rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 text-center font-bold"
                                        />
                                    </div>

                                    <button
                                        onClick={handleReceiveStock}
                                        disabled={isAddingStock || addQuantity < 1}
                                        className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
                                    >
                                        {isAddingStock ? "Receiving..." : "Confirm & Receive Stock"}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
