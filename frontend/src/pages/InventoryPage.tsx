import { useState, useEffect } from "react";
import { Loader2, Search, Package, ArrowRightLeft, Plus, Edit2, Trash2, PlusCircle } from "lucide-react";
import { inventoryService } from "../services/inventoryService";
import { StockLevelDto, WarehouseDto } from "../types/inventory";
import { ConfirmModal } from "../components/common/ConfirmModal";
import { toast } from "react-hot-toast";

import { productService } from "../services/productService";
import { warehouseService } from "../services/warehouseService";
import { ProductDto } from "../types/product";
import { useSync } from "../contexts/SyncContext";

export const InventoryPage = () => {
    const [products, setProducts] = useState<ProductDto[]>([]);
    const [warehouses, setWarehouses] = useState<WarehouseDto[]>([]);
    const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
    const [stockLevels, setStockLevels] = useState<StockLevelDto[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [productSearchQuery, setProductSearchQuery] = useState("");
    const [page, setPage] = useState(1);

    const [activeTab, setActiveTab] = useState<"stock" | "warehouses">("stock");

    // Modal states
    const [showTransferModal, setShowTransferModal] = useState(false);
    const [showAddStockModal, setShowAddStockModal] = useState(false);
    const [showCreateWarehouseModal, setShowCreateWarehouseModal] = useState(false);
    const [showEditWarehouseModal, setShowEditWarehouseModal] = useState(false);
    const [editingWarehouseId, setEditingWarehouseId] = useState<number | null>(null);
    const [warehouseForm, setWarehouseForm] = useState({ name: "", location: "", isMobile: false });
    const [creatingWarehouse, setCreatingWarehouse] = useState(false);
    const [updatingWarehouse, setUpdatingWarehouse] = useState(false);

    const { isOnline, enqueueSyncItem } = useSync();

    const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; title: string; message: string; type: 'info'|'warning'|'danger'; onConfirm: () => void }>({ isOpen: false, title: "", message: "", type: "info", onConfirm: () => {} });

    const confirmAction = (title: string, message: string, type: 'info' | 'warning' | 'danger', action: () => Promise<void>) => {
        setConfirmModal({
            isOpen: true, title, message, type,
            onConfirm: async () => {
                setConfirmModal(prev => ({ ...prev, isOpen: false }));
                await action();
            }
        });
    };

    // Initial Data Fetch & Products Search
    const fetchProducts = async () => {
        try {
            const prods = await productService.getAll(page, 50, productSearchQuery);
            setProducts(prods);
            if (prods.length > 0 && !selectedProductId) {
                setSelectedProductId(prods[0].id);
            }
        } catch (error) {
            toast.error("Failed to load products.");
        }
    };

    useEffect(() => {
        fetchProducts();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page]);

    useEffect(() => {
        const fetchWarehouses = async () => {
            try {
                const whses = await warehouseService.getAll();
                setWarehouses(whses);
            } catch (error) {
                toast.error("Failed to load warehouses.");
            }
        };
        fetchWarehouses();
    }, []);

    const handleProductSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(1);
        fetchProducts();
    };

    // Transfer form state
    const [transferForm, setTransferForm] = useState({
        fromWarehouseId: 1,
        toWarehouseId: 2,
        quantity: 1,
        notes: ""
    });
    const [submittingTransfer, setSubmittingTransfer] = useState(false);

    // Add stock form state
    const [addStockForm, setAddStockForm] = useState({
        warehouseId: 1,
        quantity: 1
    });
    const [submittingAddStock, setSubmittingAddStock] = useState(false);

    // Edit stock form state
    const [showEditStockModal, setShowEditStockModal] = useState(false);
    const [editStockForm, setEditStockForm] = useState({ warehouseId: 1, quantity: 1, warehouseName: "" });
    const [submittingEditStock, setSubmittingEditStock] = useState(false);

    const fetchStock = async (productId: number) => {
        try {
            setLoading(true);
            const data = await inventoryService.getStockLevels(productId);
            setStockLevels(data);
        } catch (error) {
            toast.error("Failed to load inventory for product.");
            // Because backend is empty right now, mock it if it errors out to show the UI
            setStockLevels([
                { warehouseId: 1, warehouseName: "Main Warehouse", quantity: 150, binLocation: "A1-Rack1" },
                { warehouseId: 2, warehouseName: "Van - Tech J.Smith", quantity: 5, binLocation: "Van Storage" }
            ]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (selectedProductId) {
            fetchStock(selectedProductId);
        }
    }, [selectedProductId]);

    const filteredStock = stockLevels.filter(stock => {
        const wName = stock.warehouseName || (stock as any).WarehouseName || "";
        return wName.toLowerCase().includes(searchQuery.toLowerCase());
    });

    const handleTransferSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setSubmittingTransfer(true);
            
            if (!isOnline) {
                const localId = crypto.randomUUID();
                await enqueueSyncItem({
                    id: localId,
                    entityType: 'StockTransfer',
                    operation: 'Create',
                    mobileUpdatedAt: new Date().toISOString(),
                    payload: {
                        fromWarehouseId: transferForm.fromWarehouseId,
                        toWarehouseId: transferForm.toWarehouseId,
                        notes: transferForm.notes,
                        items: [{ productId: selectedProductId!, quantity: Number(transferForm.quantity) }]
                    }
                });
                toast.success("Transfer saved to sync queue (Offline)");
                setShowTransferModal(false);
                return;
            }

            await inventoryService.transferStock({
                fromWarehouseId: transferForm.fromWarehouseId,
                toWarehouseId: transferForm.toWarehouseId,
                notes: transferForm.notes,
                items: [{ productId: selectedProductId!, quantity: Number(transferForm.quantity) }]
            });
            toast.success("Stock transferred successfully!");
            setShowTransferModal(false);
            if (selectedProductId) fetchStock(selectedProductId); // Refresh
        } catch (error: any) {
            toast.error(error.response?.data?.Error || error.response?.data?.Message || "Failed to transfer stock.");
        } finally {
            setSubmittingTransfer(false);
        }
    };

    const handleAddStockSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setSubmittingAddStock(true);
            
            if (!isOnline) {
                const localId = crypto.randomUUID();
                await enqueueSyncItem({
                    id: localId,
                    entityType: 'StockAdjustment',
                    operation: 'Create',
                    mobileUpdatedAt: new Date().toISOString(),
                    payload: {
                        productId: selectedProductId!,
                        warehouseId: addStockForm.warehouseId,
                        quantity: Number(addStockForm.quantity),
                        reason: "Manual Addition (Offline Sync)"
                    }
                });
                toast.success("Stock addition saved to sync queue (Offline)");
                setShowAddStockModal(false);
                return;
            }

            await inventoryService.addStock({
                productId: selectedProductId!,
                warehouseId: addStockForm.warehouseId,
                quantity: Number(addStockForm.quantity)
            });
            toast.success("Stock added successfully!");
            setShowAddStockModal(false);
            if (selectedProductId) fetchStock(selectedProductId); // Refresh
        } catch (error: any) {
            toast.error(error.response?.data?.Error || error.response?.data?.Message || "Failed to add stock.");
        } finally {
            setSubmittingAddStock(false);
        }
    };

    const handleEditStockSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedProductId) return;
        try {
            setSubmittingEditStock(true);
            await inventoryService.updateStock({
                productId: selectedProductId,
                warehouseId: editStockForm.warehouseId,
                quantity: editStockForm.quantity
            });
            toast.success("Stock updated successfully");
            setShowEditStockModal(false);
            fetchStock(selectedProductId);
        } catch (error: any) {
            toast.error(error.response?.data?.Error || error.response?.data?.Message || "Failed to update stock");
        } finally {
            setSubmittingEditStock(false);
        }
    };

    const handleDeleteStock = (warehouseId: number) => {
        if (!selectedProductId) return;
        confirmAction("Delete Stock Record", "Are you sure you want to delete this stock record entirely?", "danger", async () => {
            try {
                await inventoryService.deleteStock(selectedProductId, warehouseId);
                toast.success("Stock deleted successfully");
                fetchStock(selectedProductId);
            } catch (error: any) {
                toast.error(error.response?.data?.Error || error.response?.data?.Message || "Failed to delete stock");
            }
        });
    };

    const handleCreateWarehouse = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setCreatingWarehouse(true);
            
            if (!isOnline) {
                const localId = crypto.randomUUID();
                await enqueueSyncItem({
                    id: localId,
                    entityType: 'Warehouse',
                    operation: 'Create',
                    mobileUpdatedAt: new Date().toISOString(),
                    payload: { ...warehouseForm }
                });
                
                toast.success("Warehouse saved to sync queue (Offline)");
                // Optimistically add to local state
                setWarehouses([...warehouses, { id: 0, ...warehouseForm }]);
                setShowCreateWarehouseModal(false);
                setWarehouseForm({ name: "", location: "", isMobile: false });
                return;
            }

            const created = await warehouseService.create(warehouseForm);
            setWarehouses([...warehouses, created]);
            toast.success("Warehouse created successfully!");
            setShowCreateWarehouseModal(false);
            setWarehouseForm({ name: "", location: "", isMobile: false });
        } catch (error: any) {
            toast.error(error.response?.data?.Error || error.response?.data?.Message || "Failed to create warehouse.");
        } finally {
            setCreatingWarehouse(false);
        }
    };

    const handleEditWarehouse = (warehouse: WarehouseDto) => {
        setEditingWarehouseId(warehouse.id);
        setWarehouseForm({ name: warehouse.name, location: warehouse.location || "", isMobile: warehouse.isMobile });
        setShowEditWarehouseModal(true);
    };

    const handleUpdateWarehouse = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingWarehouseId) return;
        try {
            setUpdatingWarehouse(true);
            await warehouseService.update(editingWarehouseId, warehouseForm);
            setWarehouses(warehouses.map(w => w.id === editingWarehouseId ? { ...w, ...warehouseForm } : w));
            toast.success("Warehouse updated successfully!");
            setShowEditWarehouseModal(false);
        } catch (error: any) {
            toast.error(error.response?.data?.Error || error.response?.data?.Message || "Failed to update warehouse.");
        } finally {
            setUpdatingWarehouse(false);
        }
    };

    const handleDeleteWarehouse = (id: number) => {
        confirmAction("Delete Warehouse", "Are you sure you want to delete this warehouse? This action cannot be undone.", "danger", async () => {
            try {
                await warehouseService.delete(id);
                setWarehouses(warehouses.filter(w => w.id !== id));
                toast.success("Warehouse deleted successfully!");
            } catch (error: any) {
                toast.error(error.response?.data?.Error || error.response?.data?.Message || "Failed to delete warehouse.");
            }
        });
    };

    return (
        <div className="p-8 animate-in fade-in duration-500">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent flex items-center gap-3">
                        <Package className="h-8 w-8 text-primary" />
                        Inventory & Distribution
                    </h1>
                    <p className="text-muted-foreground mt-1 text-sm">Manage parts across main warehouses and technician vehicles.</p>
                </div>
                <div className="flex space-x-3">
                    <button
                        onClick={() => {
                            setWarehouseForm({ name: "", location: "", isMobile: false });
                            setShowCreateWarehouseModal(true);
                        }}
                        className="bg-secondary text-foreground px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-secondary/80 transition-all font-medium border border-border"
                    >
                        <Plus className="h-4 w-4" />
                        <span className="hidden sm:inline">Add Warehouse</span>
                    </button>
                    <button
                        onClick={() => setShowAddStockModal(true)}
                        className="bg-green-600 text-foreground px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-500 transition-all font-medium hover:shadow-lg hover:shadow-green-500/20 active:scale-95"
                    >
                        <PlusCircle className="h-4 w-4" />
                        <span className="hidden sm:inline">Add Stock</span>
                    </button>
                    <button
                        onClick={() => setShowTransferModal(true)}
                        className="bg-primary text-primary-foreground px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-primary/90 transition-all font-medium border border-primary hover:shadow-lg hover:shadow-primary/20 active:scale-95"
                    >
                        <ArrowRightLeft className="h-4 w-4" />
                        <span className="hidden sm:inline">Transfer Stock</span>
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex space-x-4 mb-6 border-b border-border/40">
                <button
                    onClick={() => setActiveTab("stock")}
                    className={`pb-2 px-1 font-medium transition-colors ${activeTab === "stock" ? "border-b-2 border-primary text-primary" : "text-muted-foreground hover:text-foreground"}`}
                >
                    Stock Distribution
                </button>
                <button
                    onClick={() => setActiveTab("warehouses")}
                    className={`pb-2 px-1 font-medium transition-colors ${activeTab === "warehouses" ? "border-b-2 border-primary text-primary" : "text-muted-foreground hover:text-foreground"}`}
                >
                    Warehouses Setup
                </button>
            </div>

            {activeTab === "stock" && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {/* Product Sidebar List */}
                    <div className="col-span-1 border border-border/50 rounded-2xl bg-secondary/30 backdrop-blur-sm overflow-hidden flex flex-col h-[calc(100vh-250px)]">
                        <div className="p-4 border-b border-border/40 bg-secondary/50 font-medium space-y-3">
                            <div>Select Product</div>
                            <form onSubmit={handleProductSearch} className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <input
                                    type="text"
                                    placeholder="Search products... (Press Enter)"
                                    value={productSearchQuery}
                                    onChange={(e) => setProductSearchQuery(e.target.value)}
                                    className="bg-background/50 border border-border text-sm rounded-lg pl-9 pr-4 py-1.5 w-full focus:outline-none focus:ring-1 focus:ring-primary"
                                />
                            </form>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-2">
                            {products.map(prod => (
                                <button
                                    key={prod.id}
                                    onClick={() => setSelectedProductId(prod.id)}
                                    className={`w-full text-left px-4 py-3 rounded-lg text-sm transition-colors border flex flex-col ${selectedProductId === prod.id
                                        ? "bg-primary/10 border-primary/30 text-primary font-medium"
                                        : "border-transparent text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                                        }`}
                                >
                                    <span>{prod.name}</span>
                                    {prod.itemCode && <span className="text-xs opacity-70 mt-1">{prod.itemCode}</span>}
                                </button>
                            ))}
                            {products.length === 0 && (
                                <div className="text-center text-muted-foreground text-sm pt-4">No products found</div>
                            )}
                        </div>
                        <div className="p-2 border-t border-border/40 flex justify-between items-center text-xs text-muted-foreground bg-secondary/50">
                            <button
                                disabled={page === 1}
                                onClick={() => setPage(p => p - 1)}
                                className="px-2 py-1 rounded border border-border disabled:opacity-50 hover:bg-secondary/50"
                            >
                                Prev
                            </button>
                            <span>Page {page}</span>
                            <button
                                disabled={products.length < 50}
                                onClick={() => setPage(p => p + 1)}
                                className="px-2 py-1 rounded border border-border disabled:opacity-50 hover:bg-secondary/50"
                            >
                                Next
                            </button>
                        </div>
                    </div>

                    {/* Main Stock Table */}
                    <div className="col-span-3 border border-border/50 rounded-2xl bg-secondary/30 backdrop-blur-sm overflow-hidden flex flex-col h-[calc(100vh-250px)]">
                        <div className="p-4 border-b border-border/40 flex justify-between items-center">
                            <div className="font-medium">
                                Stock Distribution: {products.find(p => p.id === selectedProductId)?.name || "Select a Product"}
                            </div>
                            <div className="relative w-64">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <input
                                    type="text"
                                    placeholder="Search location..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="bg-background/50 border border-border text-sm rounded-lg pl-9 pr-4 py-1.5 w-full focus:outline-none focus:ring-1 focus:ring-primary"
                                />
                            </div>
                        </div>

                        <div className="flex-1 overflow-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-muted-foreground uppercase bg-secondary/50 border-b border-border/40">
                                    <tr>
                                        <th className="px-6 py-4 font-medium">Warehouse / Van Name</th>
                                        <th className="px-6 py-4 font-medium">Bin Location</th>
                                        <th className="px-6 py-4 font-medium text-right">Quantity On Hand</th>
                                        <th className="px-6 py-4 font-medium text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/30">
                                    {loading ? (
                                        <tr>
                                            <td colSpan={3} className="px-6 py-12 text-center">
                                                <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary opacity-50" />
                                            </td>
                                        </tr>
                                    ) : filteredStock.length === 0 ? (
                                        <tr>
                                            <td colSpan={3} className="px-6 py-12 text-center text-muted-foreground">
                                                No stock found for this item.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredStock.map((stock, i) => {
                                            const wName = stock.warehouseName || (stock as any).WarehouseName || "Unknown";
                                            const binLoc = stock.binLocation || (stock as any).BinLocation || "Unassigned";
                                            const qty = stock.quantity !== undefined ? stock.quantity : ((stock as any).Quantity || 0);

                                            return (
                                                <tr key={i} className="hover:bg-secondary/50 transition-colors">
                                                    <td className="px-6 py-4 font-medium text-foreground">
                                                        {wName}
                                                    </td>
                                                    <td className="px-6 py-4 text-muted-foreground">
                                                        {binLoc}
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <span className={`inline-flex px-3 py-1 rounded-full font-bold ${qty > 10 ? "bg-green-500/10 text-green-500" :
                                                            qty > 0 ? "bg-yellow-500/10 text-yellow-500" :
                                                                "bg-red-500/10 text-red-500"
                                                            }`}>
                                                            {qty}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <div className="flex justify-end gap-2">
                                                            <button
                                                                onClick={() => {
                                                                    setEditStockForm({ warehouseId: stock.warehouseId || (stock as any).WarehouseId || 0, quantity: qty, warehouseName: wName });
                                                                    setShowEditStockModal(true);
                                                                }}
                                                                className="p-1 rounded bg-blue-500/10 text-blue-500 hover:bg-blue-500/20"
                                                                title="Edit Stock"
                                                            >
                                                                <Edit2 className="h-4 w-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteStock(stock.warehouseId || (stock as any).WarehouseId || 0)}
                                                                className="p-1 rounded bg-red-500/10 text-red-500 hover:bg-red-500/20"
                                                                title="Delete Stock"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === "warehouses" && (
                <div className="border border-border/50 rounded-2xl bg-secondary/30 backdrop-blur-sm overflow-hidden">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-muted-foreground uppercase bg-secondary/50 border-b border-border/40">
                            <tr>
                                <th className="px-6 py-4 font-medium">Name</th>
                                <th className="px-6 py-4 font-medium">Location</th>
                                <th className="px-6 py-4 font-medium">Type</th>
                                <th className="px-6 py-4 font-medium text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/30">
                            {warehouses.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground">
                                        No warehouses created yet.
                                    </td>
                                </tr>
                            ) : (
                                warehouses.map((w) => (
                                    <tr key={w.id} className="hover:bg-secondary/50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-foreground">
                                            {w.name}
                                        </td>
                                        <td className="px-6 py-4 text-muted-foreground">
                                            {w.location || "N/A"}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${w.isMobile ? "bg-blue-500/10 text-blue-500" : "bg-zinc-500/10 text-zinc-400"}`}>
                                                {w.isMobile ? "Mobile Van" : "Warehouse"}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => handleEditWarehouse(w)}
                                                className="text-blue-500 hover:text-blue-400 p-2 transition-colors"
                                                title="Edit"
                                            >
                                                <Edit2 className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteWarehouse(w.id)}
                                                className="text-red-500 hover:text-red-400 p-2 transition-colors ml-2"
                                                title="Delete"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Transfer Modal */}
            {showTransferModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !submittingTransfer && setShowTransferModal(false)} />
                    <div className="bg-secondary/95 border border-primary/20 p-8 rounded-2xl w-full max-w-md relative z-10 shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold flex items-center gap-2">
                                <ArrowRightLeft className="text-primary h-6 w-6" /> Transfer Stock
                            </h2>
                            <button onClick={() => setShowTransferModal(false)} className="text-muted-foreground hover:text-foreground">✕</button>
                        </div>

                        <form onSubmit={handleTransferSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Product</label>
                                <input
                                    type="text"
                                    readOnly
                                    className="w-full bg-background/50 border border-border rounded-lg px-4 py-2 cursor-not-allowed opacity-70"
                                    value={products.find(p => p.id === selectedProductId)?.name || "Select a Product"}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">From (Whse)</label>
                                    <select
                                        required
                                        className="w-full bg-background/50 border border-border rounded-lg px-4 py-2 focus:ring-1 focus:ring-primary"
                                        value={transferForm.fromWarehouseId}
                                        onChange={(e) => setTransferForm({ ...transferForm, fromWarehouseId: Number(e.target.value) })}
                                    >
                                        <option value="" disabled>Select Source</option>
                                        {warehouses.map(w => (
                                            <option key={w.id} value={w.id}>{w.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">To (Whse)</label>
                                    <select
                                        required
                                        className="w-full bg-background/50 border border-border rounded-lg px-4 py-2 focus:ring-1 focus:ring-primary"
                                        value={transferForm.toWarehouseId}
                                        onChange={(e) => setTransferForm({ ...transferForm, toWarehouseId: Number(e.target.value) })}
                                    >
                                        <option value="" disabled>Select Destination</option>
                                        {warehouses.map(w => (
                                            <option key={w.id} value={w.id}>{w.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1 text-primary">Quantity to Move</label>
                                <input
                                    type="number"
                                    required
                                    min="1"
                                    className="w-full bg-background/50 border border-primary/50 rounded-lg px-4 py-3 text-lg font-bold focus:ring-1 focus:ring-primary text-center"
                                    value={transferForm.quantity}
                                    onChange={(e) => setTransferForm({ ...transferForm, quantity: Number(e.target.value) })}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={submittingTransfer}
                                className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-medium hover:bg-primary/90 transition-all flex justify-center items-center mt-6 disabled:opacity-50"
                            >
                                {submittingTransfer ? (
                                    <><Loader2 className="animate-spin h-5 w-5 mr-2" /> Processing...</>
                                ) : (
                                    "Execute Transfer"
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Add Stock Modal */}
            {showAddStockModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !submittingAddStock && setShowAddStockModal(false)} />
                    <div className="bg-secondary/95 border border-primary/20 p-8 rounded-2xl w-full max-w-md relative z-10 shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold flex items-center gap-2 text-green-500">
                                <PlusCircle className="h-6 w-6" /> Add Stock
                            </h2>
                            <button onClick={() => setShowAddStockModal(false)} className="text-muted-foreground hover:text-foreground">✕</button>
                        </div>

                        <form onSubmit={handleAddStockSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Product</label>
                                <input
                                    type="text"
                                    readOnly
                                    className="w-full bg-background/50 border border-border rounded-lg px-4 py-2 cursor-not-allowed opacity-70"
                                    value={products.find(p => p.id === selectedProductId)?.name || "Select a Product"}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Target Warehouse / Van</label>
                                <select
                                    required
                                    className="w-full bg-background/50 border border-border rounded-lg px-4 py-2 focus:ring-1 focus:ring-green-500"
                                    value={addStockForm.warehouseId}
                                    onChange={(e) => setAddStockForm({ ...addStockForm, warehouseId: Number(e.target.value) })}
                                >
                                    <option value="" disabled>Select Destination</option>
                                    {warehouses.map(w => (
                                        <option key={w.id} value={w.id}>{w.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1 text-green-500">Quantity to Add</label>
                                <input
                                    type="number"
                                    required
                                    min="1"
                                    className="w-full bg-background/50 border border-green-500/50 rounded-lg px-4 py-3 text-lg font-bold focus:ring-1 focus:ring-green-500 text-center"
                                    value={addStockForm.quantity}
                                    onChange={(e) => setAddStockForm({ ...addStockForm, quantity: Number(e.target.value) })}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={submittingAddStock || !selectedProductId}
                                className="w-full bg-green-600 text-foreground py-3 rounded-xl font-medium hover:bg-green-500 transition-all flex justify-center items-center mt-6 disabled:opacity-50"
                            >
                                {submittingAddStock ? (
                                    <><Loader2 className="animate-spin h-5 w-5 mr-2" /> Processing...</>
                                ) : (
                                    "Add Inventory"
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Create Warehouse Modal */}
            {showCreateWarehouseModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !creatingWarehouse && setShowCreateWarehouseModal(false)} />
                    <div className="bg-secondary/95 border border-primary/20 p-8 rounded-2xl w-full max-w-md relative z-10 shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold flex items-center gap-2">
                                <Plus className="text-primary h-6 w-6" /> Add Warehouse
                            </h2>
                            <button onClick={() => setShowCreateWarehouseModal(false)} className="text-muted-foreground hover:text-foreground">✕</button>
                        </div>

                        <form onSubmit={handleCreateWarehouse} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Warehouse Name *</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. Downtown Hub"
                                    className="w-full bg-background/50 border border-border rounded-lg px-4 py-2 focus:ring-1 focus:ring-primary"
                                    value={warehouseForm.name}
                                    onChange={(e) => setWarehouseForm({ ...warehouseForm, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Location Details</label>
                                <input
                                    type="text"
                                    placeholder="e.g. 123 Main St"
                                    className="w-full bg-background/50 border border-border rounded-lg px-4 py-2 focus:ring-1 focus:ring-primary"
                                    value={warehouseForm.location}
                                    onChange={(e) => setWarehouseForm({ ...warehouseForm, location: e.target.value })}
                                />
                            </div>
                            <div className="flex items-center space-x-2 pt-2">
                                <input
                                    type="checkbox"
                                    id="isMobile"
                                    className="rounded border-border bg-background text-primary focus:ring-primary h-4 w-4"
                                    checked={warehouseForm.isMobile}
                                    onChange={(e) => setWarehouseForm({ ...warehouseForm, isMobile: e.target.checked })}
                                />
                                <label htmlFor="isMobile" className="text-sm font-medium cursor-pointer">
                                    Is Mobile (Van/Truck)
                                </label>
                            </div>

                            <button
                                type="submit"
                                disabled={creatingWarehouse || !warehouseForm.name.trim()}
                                className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-medium hover:bg-primary/90 transition-all flex justify-center items-center mt-6 disabled:opacity-50"
                            >
                                {creatingWarehouse ? (
                                    <><Loader2 className="animate-spin h-5 w-5 mr-2" /> Creating...</>
                                ) : (
                                    "Create Warehouse"
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Warehouse Modal */}
            {showEditWarehouseModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !updatingWarehouse && setShowEditWarehouseModal(false)} />
                    <div className="bg-secondary/95 border border-primary/20 p-8 rounded-2xl w-full max-w-md relative z-10 shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold flex items-center gap-2">
                                <Edit2 className="text-primary h-6 w-6" /> Edit Warehouse
                            </h2>
                            <button onClick={() => setShowEditWarehouseModal(false)} className="text-muted-foreground hover:text-foreground">✕</button>
                        </div>

                        <form onSubmit={handleUpdateWarehouse} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Warehouse Name *</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full bg-background/50 border border-border rounded-lg px-4 py-2 focus:ring-1 focus:ring-primary"
                                    value={warehouseForm.name}
                                    onChange={(e) => setWarehouseForm({ ...warehouseForm, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Location Details</label>
                                <input
                                    type="text"
                                    className="w-full bg-background/50 border border-border rounded-lg px-4 py-2 focus:ring-1 focus:ring-primary"
                                    value={warehouseForm.location}
                                    onChange={(e) => setWarehouseForm({ ...warehouseForm, location: e.target.value })}
                                />
                            </div>
                            <div className="flex items-center space-x-2 pt-2">
                                <input
                                    type="checkbox"
                                    id="isMobileEdit"
                                    className="rounded border-border bg-background text-primary focus:ring-primary h-4 w-4"
                                    checked={warehouseForm.isMobile}
                                    onChange={(e) => setWarehouseForm({ ...warehouseForm, isMobile: e.target.checked })}
                                />
                                <label htmlFor="isMobileEdit" className="text-sm font-medium cursor-pointer">
                                    Is Mobile (Van/Truck)
                                </label>
                            </div>

                            <button
                                type="submit"
                                disabled={updatingWarehouse || !warehouseForm.name.trim()}
                                className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-medium hover:bg-primary/90 transition-all flex justify-center items-center mt-6 disabled:opacity-50"
                            >
                                {updatingWarehouse ? (
                                    <><Loader2 className="animate-spin h-5 w-5 mr-2" /> Updating...</>
                                ) : (
                                    "Save Changes"
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Stock Modal */}
            {showEditStockModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !submittingEditStock && setShowEditStockModal(false)} />
                    <div className="bg-secondary/95 border border-primary/20 p-8 rounded-2xl w-full max-w-md relative z-10 shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold flex items-center gap-2">
                                <Edit2 className="text-primary h-6 w-6" /> Edit Stock
                            </h2>
                            <button onClick={() => setShowEditStockModal(false)} className="text-muted-foreground hover:text-foreground">✕</button>
                        </div>

                        <form onSubmit={handleEditStockSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Warehouse / Van Name</label>
                                <input
                                    type="text"
                                    disabled
                                    className="w-full bg-background/50 border border-border rounded-lg px-4 py-2 opacity-70 cursor-not-allowed"
                                    value={editStockForm.warehouseName}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Quantity</label>
                                <input
                                    type="number"
                                    required
                                    min="0"
                                    className="w-full bg-background/50 border border-border rounded-lg px-4 py-2 focus:ring-1 focus:ring-primary"
                                    value={editStockForm.quantity}
                                    onChange={(e) => setEditStockForm({ ...editStockForm, quantity: Number(e.target.value) })}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={submittingEditStock}
                                className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-medium hover:bg-primary/90 transition-all flex justify-center items-center mt-6 disabled:opacity-50"
                            >
                                {submittingEditStock ? (
                                    <><Loader2 className="animate-spin h-5 w-5 mr-2" /> Saving...</>
                                ) : (
                                    "Save Changes"
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            <ConfirmModal
                isOpen={confirmModal.isOpen}
                title={confirmModal.title}
                message={confirmModal.message}
                type={confirmModal.type}
                confirmText="Delete"
                onConfirm={confirmModal.onConfirm}
                onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
            />
        </div>
    );
};
