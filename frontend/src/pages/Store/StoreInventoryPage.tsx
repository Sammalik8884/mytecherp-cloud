import React, { useState, useEffect, useCallback } from "react";
import { CheckCircle, Warehouse, Save, Search } from "lucide-react";
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

    const dirtyCount = rows.filter(r => r.dirty).length;
    const selectedSiteName = sites.find(s => s.id?.toString() === siteId)?.name || "";

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <Warehouse className="w-6 h-6 text-blue-600" />
                    Site Inventory
                </h1>
                {dirtyCount > 0 && (
                    <button
                        onClick={saveAll}
                        disabled={savingAll}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium disabled:opacity-60"
                    >
                        <Save className="w-4 h-4" />
                        {savingAll ? "Saving..." : `Save All (${dirtyCount} changes)`}
                    </button>
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
                                            {row.saving ? (
                                                <span className="text-xs text-gray-400">Saving...</span>
                                            ) : row.saved ? (
                                                <span className="text-xs text-green-600 flex items-center gap-1 justify-end">
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
        </div>
    );
}
