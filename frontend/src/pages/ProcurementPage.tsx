import { useState, useEffect } from "react";
import { Loader2, Search, ShoppingCart, Plus, Download, CheckCircle2, Trash2, Pencil } from "lucide-react";
import { procurementService } from "../services/procurementService";
import { PurchaseOrderDto, VendorDto } from "../types/procurement";
import { ProductDto } from "../types/product";
import { productService } from "../services/productService";
import { warehouseService } from "../services/warehouseService";
import { WarehouseDto } from "../types/inventory";
import { ConfirmModal } from "../components/common/ConfirmModal";
import { toast } from "react-hot-toast";

export const ProcurementPage = () => {
    const [activeTab, setActiveTab] = useState<"POs" | "Vendors">("POs");

    const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; title: string; message: string; type: 'info'|'warning'|'danger'; confirmText: string; onConfirm: () => void }>({ isOpen: false, title: "", message: "", type: "info", confirmText: "Confirm", onConfirm: () => {} });

    const confirmAction = (title: string, message: string, type: 'info' | 'warning' | 'danger', confirmText: string, action: () => Promise<void>) => {
        setConfirmModal({
            isOpen: true, title, message, type, confirmText,
            onConfirm: async () => {
                setConfirmModal(prev => ({ ...prev, isOpen: false }));
                await action();
            }
        });
    };

    // State
    const [pos, setPos] = useState<PurchaseOrderDto[]>([]);
    const [vendors, setVendors] = useState<VendorDto[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [processingId, setProcessingId] = useState<number | null>(null);
    const [products, setProducts] = useState<ProductDto[]>([]);
    const [warehouses, setWarehouses] = useState<WarehouseDto[]>([]);

    // Modals state
    const [showVendorModal, setShowVendorModal] = useState(false);
    const [isSubmittingVendor, setIsSubmittingVendor] = useState(false);
    const [vendorForm, setVendorForm] = useState({ name: "", contactPerson: "", email: "", phone: "" });

    const [showPOModal, setShowPOModal] = useState(false);
    const [isSubmittingPO, setIsSubmittingPO] = useState(false);
    const [poForm, setPoForm] = useState<{
        vendorId: number | "";
        targetWarehouseId: number | "";
        expectedDeliveryDate: string;
        notes: string;
        items: { productId: number | ""; quantity: number; unitCost: number; searchQuery?: string }[];
    }>({
        vendorId: "",
        targetWarehouseId: "",
        expectedDeliveryDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
        notes: "",
        items: []
    });

    const [editingVendor, setEditingVendor] = useState<VendorDto | null>(null);
    const [editingPO, setEditingPO] = useState<PurchaseOrderDto | null>(null);

    const fetchData = async () => {
        try {
            setLoading(true);
            // Fetch sequentially to prevent overwhelming the backend DbContext connection pool
            // which was causing silent network hangs from Concurrent requests.
            const fetchedPos = await procurementService.getAllPOs();
            const fetchedVendors = await procurementService.getAllVendors();
            const fetchedProducts = await productService.getAll();
            const fetchedWarehouses = await warehouseService.getAll();
            
            setPos(fetchedPos);
            setVendors(fetchedVendors);
            setProducts(fetchedProducts);
            setWarehouses(fetchedWarehouses);
        } catch (error) {
            toast.error("Failed to load procurement data.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const filteredPOs = pos.filter(po =>
        po.poNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (po.vendorName && po.vendorName.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const filteredVendors = vendors.filter(v =>
        v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.contactPerson.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleReceivePO = (id: number) => {
        confirmAction("Receive Purchase Order", "Are you sure you want to mark this PO as Received? This will automatically update your Inventory stock levels.", "warning", "Receive", async () => {
            try {
                setProcessingId(id);
                await procurementService.receivePO(id);
                toast.success("PO Received! Inventory has been restocked.");
                fetchData();
            } catch (error: any) {
                toast.error(error.response?.data?.Error || "Failed to receive PO.");
            } finally {
                setProcessingId(null);
            }
        });
    };

    const handleCreateVendor = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setIsSubmittingVendor(true);
            if (editingVendor) {
                await procurementService.updateVendor(editingVendor.id, vendorForm);
                toast.success("Vendor updated successfully!");
            } else {
                const created = await procurementService.createVendor(vendorForm);
                setVendors([...vendors, created]);
                toast.success("Vendor created successfully!");
            }
            setShowVendorModal(false);
            setEditingVendor(null);
            setVendorForm({ name: "", contactPerson: "", email: "", phone: "" });
            fetchData();
        } catch (error: any) {
            toast.error(error.response?.data?.Error || error.response?.data?.Message || "Failed to save vendor.");
        } finally {
            setIsSubmittingVendor(false);
        }
    };

    const handleDeleteVendor = (id: number) => {
        confirmAction("Delete Vendor", "Are you sure you want to delete this vendor? This action cannot be undone.", "danger", "Delete", async () => {
            try {
                setProcessingId(id);
                await procurementService.deleteVendor(id);
                toast.success("Vendor deleted successfully!");
                fetchData();
            } catch (error: any) {
                toast.error(error.response?.data?.Error || "Failed to delete vendor.");
            } finally {
                setProcessingId(null);
            }
        });
    };

    const handleCreatePO = async (e: React.FormEvent) => {
        e.preventDefault();
        if (poForm.items.length === 0) {
            toast.error("Please add at least one item to the PO.");
            return;
        }
        if (!poForm.targetWarehouseId) {
            toast.error("Please select a target warehouse.");
            return;
        }
        if (poForm.items.some(i => !i.productId || i.quantity <= 0 || i.unitCost <= 0)) {
            toast.error("Please fill all item fields properly.");
            return;
        }
        try {
            setIsSubmittingPO(true);
            const payload = {
                vendorId: Number(poForm.vendorId),
                targetWarehouseId: Number(poForm.targetWarehouseId),
                expectedDeliveryDate: poForm.expectedDeliveryDate,
                items: poForm.items.map(i => ({
                    productId: Number(i.productId),
                    quantity: i.quantity,
                    unitCost: i.unitCost
                }))
            };

            if (editingPO) {
                await procurementService.updatePO(editingPO.id, payload);
                toast.success("Purchase Order updated successfully!");
            } else {
                await procurementService.createPO(payload);
                toast.success("Purchase Order created successfully!");
            }

            setShowPOModal(false);
            setEditingPO(null);
            setPoForm(prev => ({ ...prev, items: [], vendorId: "", targetWarehouseId: "", notes: "" }));
            fetchData();
        } catch (error: any) {
            toast.error(error.response?.data?.Error || error.response?.data?.Message || "Failed to save PO.");
        } finally {
            setIsSubmittingPO(false);
        }
    };

    const handleDeletePO = (id: number) => {
        confirmAction("Delete Purchase Order", "Are you sure you want to delete this Purchase Order? This action cannot be undone.", "danger", "Delete", async () => {
            try {
                setProcessingId(id);
                await procurementService.deletePO(id);
                toast.success("Purchase Order deleted successfully!");
                fetchData();
            } catch (error: any) {
                toast.error(error.response?.data?.Error || "Failed to delete PO.");
            } finally {
                setProcessingId(null);
            }
        });
    };

    const handleMarkAsSent = async (id: number) => {
        try {
            setProcessingId(id);
            await procurementService.markAsSent(id);
            toast.success("PO marked as Sent. It is now awaiting receipt.");
            fetchData();
        } catch (error: any) {
            toast.error(error.response?.data?.Error || "Failed to mark PO as sent.");
        } finally {
            setProcessingId(null);
        }
    };

    const handleDownloadPdf = async (id: number) => {
        try {
            setProcessingId(id);
            await procurementService.downloadPdf(id);
            toast.success("PDF downloaded successfully!");
        } catch (error) {
            toast.error("Failed to generate or download the PO PDF.");
        } finally {
            setProcessingId(null);
        }
    };

    const handleSendPO = async (id: number) => {
        try {
            setProcessingId(id);
            toast.loading("Generating PDF and emailing vendor...", { id: "sendPO" });
            const response = await procurementService.sendPOToVendor(id);
            toast.success(response.message || "PO sent successfully!", { id: "sendPO" });
            fetchData();
        } catch (error: any) {
            toast.error(error.response?.data?.Error || "Failed to send PO to vendor.", { id: "sendPO" });
        } finally {
            setProcessingId(null);
        }
    };

    const getStatusStyles = (status: number) => {
        switch (status) {
            case 0: return "bg-gray-500/10 text-gray-500 border-gray-500/20"; // Draft
            case 1: return "bg-blue-500/10 text-blue-500 border-blue-500/20"; // Sent
            case 2: return "bg-purple-500/10 text-purple-500 border-purple-500/20"; // Partially Received
            case 3: return "bg-green-500/10 text-green-500 border-green-500/20"; // Received
            case 4: return "bg-red-500/10 text-red-500 border-red-500/20"; // Cancelled
            default: return "bg-primary/10 text-primary border-primary/20";
        }
    };

    const getStatusText = (status: number) => {
        switch (status) {
            case 0: return "Draft";
            case 1: return "Sent";
            case 2: return "Partial";
            case 3: return "Received";
            case 4: return "Cancelled";
            default: return "Unknown";
        }
    };

    return (
        <div className="p-8 animate-in fade-in duration-500">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent flex items-center gap-3">
                        <ShoppingCart className="h-8 w-8 text-primary" />
                        Procurement
                    </h1>
                    <p className="text-muted-foreground mt-1 text-sm">Manage vendors and issue Purchase Orders to restock inventory.</p>
                </div>
                <div className="flex space-x-3">
                    <button
                        className="bg-secondary text-foreground px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-secondary/80 transition-all font-medium border border-border"
                        onClick={() => setShowVendorModal(true)}
                    >
                        <Plus className="h-4 w-4" />
                        <span className="hidden sm:inline">Add Vendor</span>
                    </button>
                    <button
                        className="bg-primary text-primary-foreground px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-primary/90 transition-all font-medium border border-primary hover:shadow-lg hover:shadow-primary/20 active:scale-95"
                        onClick={() => setShowPOModal(true)}
                    >
                        <ShoppingCart className="h-4 w-4" />
                        <span className="hidden sm:inline">Create PO</span>
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex space-x-1 border-b border-border mb-6">
                <button
                    onClick={() => setActiveTab("POs")}
                    className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${activeTab === "POs" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                        }`}
                >
                    Purchase Orders
                </button>
                <button
                    onClick={() => setActiveTab("Vendors")}
                    className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${activeTab === "Vendors" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                        }`}
                >
                    Vendors
                </button>
            </div>

            <div className="bg-secondary/30 border border-border/50 rounded-2xl overflow-hidden backdrop-blur-sm shadow-xl">
                <div className="p-4 border-b border-border/40 flex justify-between items-center">
                    <h2 className="font-semibold px-2">{activeTab === "POs" ? "Active Purchase Orders" : "Vendor Directory"}</h2>
                    <div className="relative w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder={activeTab === "POs" ? "Search PO# or Vendor..." : "Search vendors..."}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-background/50 border border-border text-sm rounded-lg pl-9 pr-4 py-1.5 w-full focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    {activeTab === "POs" ? (
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-muted-foreground uppercase bg-secondary/50 border-b border-border/40">
                                <tr>
                                    <th className="px-6 py-4 font-medium">PO Number</th>
                                    <th className="px-6 py-4 font-medium">Vendor</th>
                                    <th className="px-6 py-4 font-medium">Order Date</th>
                                    <th className="px-6 py-4 font-medium">Expected Delivery</th>
                                    <th className="px-6 py-4 font-medium">Amount</th>
                                    <th className="px-6 py-4 font-medium">Status</th>
                                    <th className="px-6 py-4 font-medium text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/30">
                                {loading ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-12 text-center">
                                            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary opacity-50" />
                                        </td>
                                    </tr>
                                ) : filteredPOs.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground">
                                            No purchase orders found.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredPOs.map((po) => (
                                        <tr key={po.id} className="hover:bg-secondary/50 transition-colors group">
                                            <td className="px-6 py-4 font-medium text-foreground">
                                                {po.poNumber}
                                            </td>
                                            <td className="px-6 py-4 font-medium">
                                                {po.vendorName || `Vendor #${po.vendorId}`}
                                            </td>
                                            <td className="px-6 py-4 text-muted-foreground">
                                                {new Date(po.orderDate).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 text-muted-foreground">
                                                {new Date(po.expectedDeliveryDate).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 font-bold">
                                                ${po.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border ${getStatusStyles(po.status)}`}>
                                                    {getStatusText(po.status)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end space-x-2">
                                                    <button
                                                        onClick={() => handleDownloadPdf(po.id)}
                                                        disabled={processingId === po.id}
                                                        className="p-1.5 border border-primary/30 text-primary hover:bg-primary/20 rounded-lg transition-colors flex items-center font-medium bg-primary/10 disabled:opacity-50"
                                                        title="Download PO PDF"
                                                    >
                                                        {processingId === po.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                                                    </button>

                                                    {/* Email Vendor: allow in Draft (0) or Sent (1) */}
                                                    {po.status <= 1 && (
                                                        <button
                                                            onClick={() => handleSendPO(po.id)}
                                                            disabled={processingId === po.id}
                                                            className="p-1.5 border border-amber-500/30 text-amber-500 hover:bg-amber-500/20 rounded-lg transition-colors flex items-center space-x-1 font-medium bg-amber-500/10 disabled:opacity-50"
                                                            title="Email PO Document to Vendor"
                                                        >
                                                            {processingId === po.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <svg xmlns="http://www.0000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-send"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>}
                                                            <span className="text-xs px-1">Email Vendor</span>
                                                        </button>
                                                    )}

                                                    {/* Mark as Sent: only allow in Draft (0) */}
                                                    {po.status === 0 && (
                                                        <button
                                                            onClick={() => handleMarkAsSent(po.id)}
                                                            disabled={processingId === po.id}
                                                            className="p-1.5 border border-blue-500/30 text-blue-500 hover:bg-blue-500/20 rounded-lg transition-colors flex items-center space-x-1 font-medium bg-blue-500/10 disabled:opacity-50"
                                                            title="Mark PO as Sent without Emailing"
                                                        >
                                                            {processingId === po.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                                                            <span className="text-xs px-1">Mark Sent</span>
                                                        </button>
                                                    )}

                                                    {/* If status is Sent, allow receiving */}
                                                    {po.status === 1 && (
                                                        <button
                                                            onClick={() => handleReceivePO(po.id)}
                                                            disabled={processingId === po.id}
                                                            className="p-1.5 border border-green-500/30 text-green-500 hover:bg-green-500/20 rounded-lg transition-colors flex items-center space-x-1 font-medium bg-green-500/10 disabled:opacity-50"
                                                            title="Receive Items & Update Stock"
                                                        >
                                                            {processingId === po.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                                                            <span className="text-xs px-1">Receive</span>
                                                        </button>
                                                    )}

                                                    {/* Edit/Delete for Drafts */}
                                                    {po.status === 0 && (
                                                        <>
                                                            <button
                                                                onClick={() => {
                                                                    setEditingPO(po);
                                                                    setPoForm({
                                                                        vendorId: po.vendorId,
                                                                        targetWarehouseId: po.targetWarehouseId,
                                                                        expectedDeliveryDate: new Date(po.expectedDeliveryDate).toISOString().split('T')[0],
                                                                        notes: "", // Notes not currently in DTO/Entity but can be added later if needed
                                                                        items: po.items.map(i => ({
                                                                            productId: i.productId,
                                                                            quantity: i.quantityOrdered,
                                                                            unitCost: i.unitCost,
                                                                            searchQuery: i.productName // Assuming we want to show the name in the search field
                                                                        }))
                                                                    });
                                                                    setShowPOModal(true);
                                                                }}
                                                                disabled={processingId === po.id}
                                                                className="p-1.5 border border-blue-400/30 text-blue-400 hover:bg-blue-400/20 rounded-lg transition-colors flex items-center font-medium bg-blue-400/10 disabled:opacity-50"
                                                                title="Edit PO"
                                                            >
                                                                <Pencil className="h-4 w-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeletePO(po.id)}
                                                                disabled={processingId === po.id}
                                                                className="p-1.5 border border-red-500/30 text-red-500 hover:bg-red-500/20 rounded-lg transition-colors flex items-center font-medium bg-red-500/10 disabled:opacity-50"
                                                                title="Delete PO"
                                                            >
                                                                {processingId === po.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    ) : (
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-muted-foreground uppercase bg-secondary/50 border-b border-border/40">
                                <tr>
                                    <th className="px-6 py-4 font-medium">Vendor Name</th>
                                    <th className="px-6 py-4 font-medium">Contact Person</th>
                                    <th className="px-6 py-4 font-medium">Email</th>
                                    <th className="px-6 py-4 font-medium">Phone</th>
                                    <th className="px-6 py-4 font-medium text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/30">
                                {loading ? (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-12 text-center">
                                            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary opacity-50" />
                                        </td>
                                    </tr>
                                ) : filteredVendors.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground">
                                            No vendors found.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredVendors.map((v) => (
                                        <tr key={v.id} className="hover:bg-secondary/50 transition-colors">
                                            <td className="px-6 py-4 font-medium text-foreground">
                                                {v.name}
                                            </td>
                                            <td className="px-6 py-4">
                                                {v.contactPerson}
                                            </td>
                                            <td className="px-6 py-4 text-muted-foreground">
                                                {v.email}
                                            </td>
                                            <td className="px-6 py-4 text-muted-foreground">
                                                {v.phone}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end space-x-2">
                                                    <button
                                                        onClick={() => {
                                                            setEditingVendor(v);
                                                            setVendorForm({
                                                                name: v.name,
                                                                contactPerson: v.contactPerson,
                                                                email: v.email,
                                                                phone: v.phone
                                                            });
                                                            setShowVendorModal(true);
                                                        }}
                                                        disabled={processingId === v.id}
                                                        className="p-1.5 border border-primary/30 text-primary hover:bg-primary/20 rounded-lg transition-colors flex items-center font-medium bg-primary/10 disabled:opacity-50"
                                                        title="Edit Vendor"
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteVendor(v.id)}
                                                        disabled={processingId === v.id}
                                                        className="p-1.5 border border-red-500/30 text-red-500 hover:bg-red-500/20 rounded-lg transition-colors flex items-center font-medium bg-red-500/10 disabled:opacity-50"
                                                        title="Delete Vendor"
                                                    >
                                                        {processingId === v.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Create Vendor Modal */}
            {showVendorModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !isSubmittingVendor && setShowVendorModal(false)} />
                    <div className="bg-secondary/95 border border-primary/20 p-8 rounded-2xl w-full max-w-md relative z-10 shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold flex items-center gap-2">
                                <Plus className={`text-primary h-6 w-6 ${editingVendor ? 'rotate-45' : ''}`} /> {editingVendor ? "Edit Vendor" : "Add Vendor"}
                            </h2>
                            <button onClick={() => { setShowVendorModal(false); setEditingVendor(null); setVendorForm({ name: "", contactPerson: "", email: "", phone: "" }); }} className="text-muted-foreground hover:text-foreground">✕</button>
                        </div>

                        <form onSubmit={handleCreateVendor} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Vendor Name</label>
                                <input
                                    type="text" required
                                    className="w-full bg-background/50 border border-border rounded-lg px-4 py-2 focus:ring-1 focus:ring-primary"
                                    value={vendorForm.name}
                                    onChange={(e) => setVendorForm({ ...vendorForm, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Contact Person</label>
                                <input
                                    type="text" required
                                    className="w-full bg-background/50 border border-border rounded-lg px-4 py-2 focus:ring-1 focus:ring-primary"
                                    value={vendorForm.contactPerson}
                                    onChange={(e) => setVendorForm({ ...vendorForm, contactPerson: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Email</label>
                                <input
                                    type="email" required
                                    className="w-full bg-background/50 border border-border rounded-lg px-4 py-2 focus:ring-1 focus:ring-primary"
                                    value={vendorForm.email}
                                    onChange={(e) => setVendorForm({ ...vendorForm, email: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Phone</label>
                                <input
                                    type="tel" required
                                    className="w-full bg-background/50 border border-border rounded-lg px-4 py-2 focus:ring-1 focus:ring-primary"
                                    value={vendorForm.phone}
                                    onChange={(e) => setVendorForm({ ...vendorForm, phone: e.target.value })}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmittingVendor}
                                className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-medium hover:bg-primary/90 transition-all flex justify-center items-center mt-6 disabled:opacity-50"
                            >
                                {isSubmittingVendor ? <><Loader2 className="animate-spin h-5 w-5 mr-2" /> Processing...</> : (editingVendor ? "Update Vendor" : "Create Vendor")}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Create PO Modal */}
            {showPOModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !isSubmittingPO && setShowPOModal(false)} />
                    <div className="bg-secondary/95 border border-primary/20 p-8 rounded-2xl w-full max-w-2xl relative z-10 shadow-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold flex items-center gap-2">
                                <ShoppingCart className="text-primary h-6 w-6" /> {editingPO ? "Edit Purchase Order" : "Create Purchase Order"}
                            </h2>
                            <button onClick={() => { setShowPOModal(false); setEditingPO(null); setPoForm({ vendorId: "", targetWarehouseId: "", expectedDeliveryDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0], notes: "", items: [] }); }} className="text-muted-foreground hover:text-foreground">✕</button>
                        </div>

                        <form onSubmit={handleCreatePO} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Vendor</label>
                                    <select
                                        required
                                        className="w-full bg-background/50 border border-border rounded-lg px-4 py-2 focus:ring-1 focus:ring-primary"
                                        value={poForm.vendorId}
                                        onChange={(e) => setPoForm({ ...poForm, vendorId: Number(e.target.value) })}
                                    >
                                        <option value="" disabled>Select Vendor</option>
                                        {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Target Warehouse</label>
                                    <select
                                        required
                                        className="w-full bg-background/50 border border-border rounded-lg px-4 py-2 focus:ring-1 focus:ring-primary"
                                        value={poForm.targetWarehouseId}
                                        onChange={(e) => setPoForm({ ...poForm, targetWarehouseId: Number(e.target.value) })}
                                    >
                                        <option value="" disabled>Select Warehouse</option>
                                        {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Expected Delivery</label>
                                    <input
                                        type="date"
                                        required
                                        className="w-full bg-background/50 border border-border rounded-lg px-4 py-2 focus:ring-1 focus:ring-primary"
                                        value={poForm.expectedDeliveryDate}
                                        onChange={(e) => setPoForm({ ...poForm, expectedDeliveryDate: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Notes</label>
                                <textarea
                                    className="w-full bg-background/50 border border-border rounded-lg px-4 py-2 focus:ring-1 focus:ring-primary"
                                    value={poForm.notes}
                                    placeholder="Optional notes or instructions..."
                                    rows={2}
                                    onChange={(e) => setPoForm({ ...poForm, notes: e.target.value })}
                                />
                            </div>

                            <div className="mt-6 border-t border-border/50 pt-4">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="font-semibold">Order Items</h3>
                                    <button
                                        type="button"
                                        onClick={() => setPoForm(prev => ({ ...prev, items: [...prev.items, { productId: "", quantity: 1, unitCost: 0, searchQuery: "" }] }))}
                                        className="text-primary text-sm font-medium flex items-center hover:underline"
                                    >
                                        <Plus className="h-4 w-4 mr-1" /> Add Row
                                    </button>
                                </div>

                                {poForm.items.map((item, index) => (
                                    <div key={index} className="flex gap-2 items-center mb-2">
                                        <div className="relative flex-1">
                                            <input
                                                type="text"
                                                placeholder="Search product..."
                                                className="w-full bg-background/50 border border-border rounded-lg px-3 py-2 text-sm"
                                                value={item.searchQuery || ""}
                                                onChange={(e) => {
                                                    const updatedItems = [...poForm.items];
                                                    updatedItems[index].searchQuery = e.target.value;
                                                    setPoForm({ ...poForm, items: updatedItems });
                                                }}
                                                list={`products-list-${index}`}
                                                required={!item.productId}
                                            />
                                            <datalist id={`products-list-${index}`}>
                                                {products.map(p => (
                                                    <option key={p.id} value={p.name} />
                                                ))}
                                            </datalist>
                                            {/* Hidden effect to match text to Product ID */}
                                            {item.searchQuery && products.find(p => p.name === item.searchQuery) && (() => {
                                                 const product = products.find(p => p.name === item.searchQuery);
                                                 if (product && item.productId !== product.id) {
                                                     setTimeout(() => {
                                                         const updatedItems = [...poForm.items];
                                                         updatedItems[index].productId = product.id;
                                                         if (updatedItems[index].unitCost === 0) {
                                                            updatedItems[index].unitCost = product.price || 0;
                                                         }
                                                         setPoForm({ ...poForm, items: updatedItems });
                                                     }, 0);
                                                 }
                                                 return null;
                                            })()}
                                        </div>
                                        <input
                                            type="number" min="1" step="1" required
                                            placeholder="Qty"
                                            className="w-24 bg-background/50 border border-border rounded-lg px-3 py-2 text-sm text-center"
                                            value={item.quantity}
                                            onChange={(e) => {
                                                const updatedItems = [...poForm.items];
                                                updatedItems[index].quantity = Number(e.target.value);
                                                setPoForm({ ...poForm, items: updatedItems });
                                            }}
                                        />
                                        <input
                                            type="number" min="0" step="0.01" required
                                            placeholder="Unit Cost"
                                            className="w-32 bg-background/50 border border-border rounded-lg px-3 py-2 text-sm text-right"
                                            value={item.unitCost}
                                            onChange={(e) => {
                                                const updatedItems = [...poForm.items];
                                                updatedItems[index].unitCost = Number(e.target.value);
                                                setPoForm({ ...poForm, items: updatedItems });
                                            }}
                                        />
                                        <button
                                            type="button"
                                            className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                                            onClick={() => {
                                                const updatedItems = [...poForm.items];
                                                updatedItems.splice(index, 1);
                                                setPoForm({ ...poForm, items: updatedItems });
                                            }}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                ))}

                                {poForm.items.length > 0 && (
                                    <div className="text-right mt-4 font-bold text-lg">
                                        Total: ${poForm.items.reduce((sum, item) => sum + (item.quantity * item.unitCost), 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </div>
                                )}
                            </div>                            <button
                                type="submit"
                                disabled={isSubmittingPO}
                                className="w-full bg-primary text-primary-foreground py-4 rounded-xl font-bold hover:bg-primary/90 transition-all shadow-lg hover:shadow-primary/25 flex justify-center items-center mt-6 disabled:opacity-50"
                            >
                                {isSubmittingPO ? <><Loader2 className="animate-spin h-5 w-5 mr-2" /> Processing...</> : (editingPO ? "Update Purchase Order" : "Create Purchase Order")}
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
                confirmText={confirmModal.confirmText}
                onConfirm={confirmModal.onConfirm}
                onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
            />
        </div>
    );
};
