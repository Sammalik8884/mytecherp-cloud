import React, { useState, useEffect } from "react";
import { PackagePlus, Search, Trash2, CheckCircle, ArrowLeft, Warehouse } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { apiClient } from "../../services/apiClient";

export function StoreInventoryPage() {
    const [searchParams] = useSearchParams();

    const [sites, setSites] = useState<any[]>([]);
    const [siteId, setSiteId] = useState(searchParams.get('siteId') || "");
    const [siteStock, setSiteStock] = useState<any[]>([]);
    const [loadingStock, setLoadingStock] = useState(false);

    // Receive stock form state
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [receiveItems, setReceiveItems] = useState<any[]>([]);
    const [saving, setSaving] = useState(false);
    const [successMsg, setSuccessMsg] = useState("");

    useEffect(() => {
        fetchSites();
    }, []);

    useEffect(() => {
        if (siteId) fetchSiteStock(parseInt(siteId));
        else setSiteStock([]);
    }, [siteId]);

    const fetchSites = async () => {
        try {
            const res = await apiClient.get('/Sites');
            if (res.data) setSites(res.data);
        } catch (e) { console.error(e); }
    };

    const fetchSiteStock = async (id: number) => {
        setLoadingStock(true);
        try {
            const res = await apiClient.get(`/SiteToolStocks/site/${id}`);
            setSiteStock(res.data || []);
        } catch (e) {
            console.error(e);
            setSiteStock([]);
        } finally {
            setLoadingStock(false);
        }
    };

    const handleSearch = async (query: string) => {
        setSearchQuery(query);
        if (query.length < 2) { setSearchResults([]); return; }
        setIsSearching(true);
        try {
            // Search global tools list (not site-specific)
            const res = await apiClient.get(`/StoreTools/search?q=${encodeURIComponent(query)}`);
            setSearchResults(res.data || []);
        } catch (e) { console.error(e); }
        finally { setIsSearching(false); }
    };

    const addToReceiveList = (tool: any) => {
        if (receiveItems.some(i => i.storeToolId === tool.id)) {
            alert("Already added. Adjust quantity below.");
            return;
        }
        setReceiveItems([...receiveItems, {
            storeToolId: tool.id,
            description: tool.description,
            quantity: 1
        }]);
        setSearchQuery("");
        setSearchResults([]);
    };

    const removeReceiveItem = (index: number) => {
        setReceiveItems(receiveItems.filter((_, i) => i !== index));
    };

    const updateQuantity = (index: number, qty: number) => {
        const updated = [...receiveItems];
        updated[index].quantity = qty;
        setReceiveItems(updated);
    };

    const handleReceiveSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!siteId) { alert("Select a site first."); return; }
        if (receiveItems.length === 0) { alert("Add at least one tool."); return; }

        setSaving(true);
        try {
            await apiClient.post('/SiteToolStocks/receive', {
                siteId: parseInt(siteId),
                items: receiveItems.map(i => ({
                    storeToolId: i.storeToolId,
                    quantity: i.quantity
                }))
            });
            setSuccessMsg(`✅ Stock added successfully for ${sites.find(s => s.id.toString() === siteId)?.name || 'site'}!`);
            setReceiveItems([]);
            fetchSiteStock(parseInt(siteId)); // refresh
            setTimeout(() => setSuccessMsg(""), 4000);
        } catch (error: any) {
            alert(`Error: ${error.response?.data?.detail || error.message}`);
        } finally {
            setSaving(false);
        }
    };

    const selectedSiteName = sites.find(s => s.id.toString() === siteId)?.name || "";

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <Warehouse className="w-6 h-6 text-blue-600" />
                    Site Inventory Management
                </h1>
                <Link to="/store/tools" className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1">
                    <ArrowLeft className="w-4 h-4" /> Back to Tools
                </Link>
            </div>

            {/* Site Selector */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Site</label>
                <select
                    value={siteId}
                    onChange={(e) => { setSiteId(e.target.value); setReceiveItems([]); }}
                    className="w-full max-w-xs px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500"
                >
                    <option value="">— Choose a site —</option>
                    {sites.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                </select>
            </div>

            {siteId && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* LEFT: Receive Stock Form */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-4">
                        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                            <PackagePlus className="w-5 h-5 text-green-600" />
                            Receive Stock — {selectedSiteName}
                        </h2>
                        <p className="text-sm text-gray-500">
                            Search tools and enter quantities received (from procurement or manual stock-in).
                        </p>

                        {successMsg && (
                            <div className="flex items-center gap-2 bg-green-50 text-green-700 px-4 py-3 rounded-lg text-sm font-medium">
                                <CheckCircle className="w-4 h-4" /> {successMsg}
                            </div>
                        )}

                        <form onSubmit={handleReceiveSubmit} className="space-y-4">
                            {/* Tool search */}
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <input
                                    type="text"
                                    placeholder="Search tool to add (e.g. drill, wrench)..."
                                    value={searchQuery}
                                    onChange={(e) => handleSearch(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500"
                                />
                                {searchResults.length > 0 && (
                                    <div className="absolute z-10 w-full mt-1 bg-white rounded-lg shadow-lg border border-gray-100 max-h-48 overflow-y-auto">
                                        {searchResults.map(tool => (
                                            <div
                                                key={tool.id}
                                                onClick={() => addToReceiveList(tool)}
                                                className="px-4 py-2.5 hover:bg-blue-50 cursor-pointer flex justify-between items-center border-b border-gray-50 last:border-0"
                                            >
                                                <span className="font-medium text-sm text-gray-900">{tool.description}</span>
                                                <span className="text-xs text-gray-400">Total qty: {tool.totalQuantity}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {searchQuery.length > 1 && searchResults.length === 0 && !isSearching && (
                                    <div className="absolute z-10 w-full mt-1 bg-white rounded-lg shadow-lg border border-gray-100 p-3 text-center text-gray-500 text-sm">
                                        No tools found. <Link to="/store/tools" className="text-blue-600 hover:underline">Add a new tool</Link>
                                    </div>
                                )}
                            </div>

                            {/* Items to receive */}
                            {receiveItems.length > 0 && (
                                <div className="space-y-2">
                                    {receiveItems.map((item, idx) => (
                                        <div key={idx} className="flex items-center gap-3 bg-gray-50 px-3 py-2 rounded-lg">
                                            <span className="flex-1 text-sm font-medium text-gray-900">{item.description}</span>
                                            <div className="flex items-center gap-2">
                                                <label className="text-xs text-gray-500">Qty:</label>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    value={item.quantity}
                                                    onChange={(e) => updateQuantity(idx, parseInt(e.target.value) || 1)}
                                                    className="w-20 px-2 py-1 text-sm border border-gray-200 rounded focus:ring-2 focus:ring-blue-500"
                                                />
                                            </div>
                                            <button type="button" onClick={() => removeReceiveItem(idx)}
                                                className="text-red-400 hover:text-red-600 p-1">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={receiveItems.length === 0 || saving}
                                className="w-full py-2.5 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                <PackagePlus className="w-4 h-4" />
                                {saving ? "Saving..." : "Add Stock to Site"}
                            </button>
                        </form>
                    </div>

                    {/* RIGHT: Current Site Stock */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">
                            Current Stock — {selectedSiteName}
                        </h2>

                        {loadingStock ? (
                            <div className="text-center py-8 text-gray-400">Loading stock...</div>
                        ) : siteStock.length === 0 ? (
                            <div className="text-center py-8 text-gray-400">
                                <Warehouse className="w-12 h-12 mx-auto mb-2 opacity-30" />
                                <p>No stock received for this site yet.</p>
                                <p className="text-sm mt-1">Use the form on the left to add stock.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-gray-50 border-y border-gray-100">
                                        <tr>
                                            <th className="px-3 py-2 font-medium text-gray-600">Tool</th>
                                            <th className="px-3 py-2 font-medium text-gray-600 text-center">Available</th>
                                            <th className="px-3 py-2 font-medium text-gray-600 text-center">Total (Global)</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {siteStock.map(stock => (
                                            <tr key={stock.id} className="hover:bg-gray-50">
                                                <td className="px-3 py-2 font-medium text-gray-900">{stock.description}</td>
                                                <td className="px-3 py-2 text-center">
                                                    <span className={`font-semibold ${stock.availableQuantity === 0 ? 'text-red-600' : 'text-green-600'}`}>
                                                        {stock.availableQuantity}
                                                    </span>
                                                </td>
                                                <td className="px-3 py-2 text-center text-gray-400">{stock.totalQuantity}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
