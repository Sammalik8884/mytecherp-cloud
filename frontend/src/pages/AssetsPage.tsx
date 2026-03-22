import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Loader2, Search, Box } from "lucide-react";
import { assetService } from "../services/assetService";
import { AssetDto, CreateAssetDto } from "../types/field";
import { ConfirmModal } from "../components/common/ConfirmModal";
import { toast } from "react-hot-toast";
import { apiClient } from "../services/apiClient";

export const AssetsPage = () => {
    const [assets, setAssets] = useState<AssetDto[]>([]);
    const [sites, setSites] = useState<{ id: number; name: string; Id?: number; Name?: string }[]>([]);
    const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [importing, setImporting] = useState(false);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formLoading, setFormLoading] = useState(false);
    const [editingAsset, setEditingAsset] = useState<AssetDto | null>(null);
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
    const [formData, setFormData] = useState<CreateAssetDto>({
        name: "",
        serialNumber: "",
        assetTypeId: 1,
        status: "Active",
        location: "",
        floor: "",
        room: "",
        brand: "",
        expiryDate: new Date().toISOString().split('T')[0],
        siteId: 0,
        categoryId: 0
    });

    const fetchAssetsAndSites = async () => {
        try {
            setLoading(true);
            const [assetsData, sitesData, catsData] = await Promise.all([
                assetService.getAll(),
                apiClient.get("/Sites").then(res => res.data),
                apiClient.get("/Categories").then(res => res.data).catch(() => [])
            ]);
            setAssets(assetsData);
            setSites((sitesData as any[]).map((s: any) => ({ id: s.id ?? s.Id, name: s.name ?? s.Name })));
            setCategories((catsData as any[]).map((c: any) => ({ id: c.id ?? c.Id, name: c.name ?? c.Name })));
        } catch (error) {
            toast.error("Failed to load assets or sites.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAssetsAndSites();
    }, []);

    const filteredAssets = assets.filter(a =>
        a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.serialNumber.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleOpenModal = (asset?: AssetDto) => {
        if (asset) {
            setEditingAsset(asset);
            setFormData({
                name: asset.name,
                serialNumber: asset.serialNumber,
                assetTypeId: asset.assetTypeId,
                status: asset.status,
                location: asset.location,
                floor: asset.floor,
                room: asset.room,
                brand: asset.brand,
                expiryDate: asset.expiryDate ? asset.expiryDate.split('T')[0] : new Date().toISOString().split('T')[0],
                siteId: (asset as any).siteId || 0,
                categoryId: (asset as any).categoryId || 0
            });
        } else {
            setEditingAsset(null);
            setFormData({
                name: "", serialNumber: "", assetTypeId: 1, status: "Active",
                location: "", floor: "", room: "", brand: "",
                expiryDate: new Date().toISOString().split('T')[0], siteId: 0, categoryId: 0
            });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormLoading(true);
        // Map frontend form values to backend schema
        // AssetType enum: 1=FireExtinguisher ... 6=SprinklerHead (matches assetTypeId directly)
        // AssetStatus enum: Active=1, UnderMaintenance=2, Decommissioned=3, InStorage=4
        const statusMap: Record<string, number> = {
            Active: 1,
            UnderMaintenance: 2,
            Decommissioned: 3,
            InStorage: 4
        };
        const payload = {
            name: formData.name,
            serialNumber: formData.serialNumber,
            assetType: formData.assetTypeId,
            status: statusMap[formData.status] ?? 1,
            location: formData.location,
            floor: formData.floor,
            room: formData.room,
            brand: formData.brand,
            siteId: formData.siteId,
            categoryId: formData.categoryId,
        };
        try {
            if (editingAsset) {
                await assetService.update(editingAsset.id, { ...payload, id: editingAsset.id } as any);
                toast.success("Asset updated successfully");
            } else {
                await assetService.create(payload as any);
                toast.success("Asset created successfully");
            }
            setIsModalOpen(false);
            fetchAssetsAndSites();
        } catch (error: any) {
            toast.error(error.response?.data?.Error || error.response?.data?.Message || "Error saving asset");
        } finally {
            setFormLoading(false);
        }
    };

    const handleDelete = (id: number) => {
        confirmAction("Delete Asset", "Are you sure you want to delete this asset? This action cannot be undone.", "danger", "Delete", async () => {
            try {
                await assetService.delete(id);
                toast.success("Asset deleted successfully");
                fetchAssetsAndSites();
            } catch (error: any) {
                toast.error(error.response?.data?.Error || error.response?.data?.Message || "Failed to delete asset.");
            }
        });
    };

    return (
        <div className="p-8 animate-in fade-in duration-500">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent flex items-center gap-3">
                        <Box className="h-8 w-8 text-primary" />
                        Assets Directory
                    </h1>
                    <p className="text-muted-foreground mt-1 text-sm">Manage physical equipment and installed hardware.</p>
                    <div className="mt-3 p-3 bg-secondary/50 border border-primary/20 rounded-lg text-xs text-muted-foreground max-w-xl">
                        <strong className="text-primary">Note regarding imports:</strong> The system now enforces a strict file format. You must download the template first and fill it exactly as-is. Files with missing columns or different headers will be rejected.
                    </div>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => {
                            const headers = ["Name", "SerialNumber", "AssetType", "Status", "SiteId", "Location", "Floor", "Room", "Brand", "Model", "ManufacturingDate"];
                            const csvContent = "data:text/csv;charset=utf-8," + headers.join(",");
                            const encodedUri = encodeURI(csvContent);
                            const link = document.createElement("a");
                            link.setAttribute("href", encodedUri);
                            link.setAttribute("download", "Asset_Import_Template.csv");
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                        }}
                        className="bg-secondary/40 border border-border text-foreground px-4 py-2 rounded-lg font-medium hover:bg-secondary/60 transition-all cursor-pointer flex items-center space-x-2"
                        title="Download the required template format"
                    >
                        <Box className="h-5 w-5" />
                        <span>Download Template</span>
                    </button>
                    <label className="bg-secondary/40 border border-border text-foreground px-4 py-2 rounded-lg font-medium hover:bg-secondary/60 transition-all cursor-pointer flex items-center space-x-2" title="File must exactly match the template format">
                        {importing ? <Loader2 className="h-5 w-5 animate-spin" /> : <Box className="h-5 w-5" />}
                        <span>{importing ? "Importing..." : "Import File"}</span>
                        <input
                            type="file"
                            accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                            className="hidden"
                            onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                setImporting(true);
                                try {
                                    await assetService.import(file);
                                    toast.success("Assets imported successfully");
                                    fetchAssetsAndSites();
                                } catch (error: any) {
                                    toast.error(error.response?.data?.Error || error.response?.data?.Message || "Error importing assets. Ensure you used the Template format.");
                                } finally {
                                    setImporting(false);
                                    e.target.value = ''; // Reset file input
                                }
                            }}
                            disabled={importing}
                        />
                    </label>
                    <button
                        onClick={() => handleOpenModal()}
                        className="bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium hover:-translate-y-0.5 transition-all shadow-lg hover:shadow-primary/25 flex items-center space-x-2"
                    >
                        <Plus className="h-5 w-5" />
                        <span>Add Asset</span>
                    </button>
                </div>
            </div>

            <div className="bg-secondary/30 border border-border/50 rounded-2xl overflow-hidden backdrop-blur-sm shadow-xl">
                <div className="p-4 border-b border-border/40 flex justify-between items-center">
                    <div className="relative w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Search by name or serial..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-background/50 border border-border text-sm rounded-lg pl-9 pr-4 py-2 w-full focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-muted-foreground uppercase bg-secondary/50 border-b border-border/40">
                            <tr>
                                <th className="px-6 py-4 font-medium">Name & Serial</th>
                                <th className="px-6 py-4 font-medium">Brand</th>
                                <th className="px-6 py-4 font-medium">Location</th>
                                <th className="px-6 py-4 font-medium">Status</th>
                                <th className="px-6 py-4 font-medium text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/30">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center">
                                        <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary opacity-50" />
                                    </td>
                                </tr>
                            ) : filteredAssets.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                                        No assets found.
                                    </td>
                                </tr>
                            ) : (
                                filteredAssets.map((asset) => (
                                    <tr key={asset.id} className="hover:bg-secondary/50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-foreground">{asset.name}</div>
                                            <div className="text-xs text-muted-foreground font-mono">{asset.serialNumber}</div>
                                        </td>
                                        <td className="px-6 py-4 text-muted-foreground">
                                            {asset.brand || "-"}
                                        </td>
                                        <td className="px-6 py-4 text-muted-foreground">
                                            {asset.siteName || "No Site"} <br />
                                            <span className="text-xs">{asset.location} {asset.floor} {asset.room}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                                                {asset.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end space-x-2">
                                                <button
                                                    onClick={() => handleOpenModal(asset)}
                                                    className="p-2 border border-primary/30 text-primary hover:bg-primary/20 hover:text-primary rounded-lg transition-colors flex items-center space-x-1 font-medium bg-primary/10"
                                                >
                                                    <Edit className="h-4 w-4" />
                                                    <span className="text-xs">Edit</span>
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(asset.id)}
                                                    className="p-2 border border-destructive/30 text-destructive hover:bg-destructive/20 hover:text-destructive rounded-lg transition-colors flex items-center space-x-1 font-medium bg-destructive/10"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                    <span className="text-xs">Delete</span>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-secondary border border-border rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden relative">
                        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-primary to-accent" />

                        <div className="p-6">
                            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                                <Box className="h-5 w-5 text-primary" />
                                {editingAsset ? "Edit Asset" : "Add New Asset"}
                            </h2>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-semibold text-muted-foreground mb-1 block">Asset Name *</label>
                                        <input
                                            type="text" required
                                            value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-muted-foreground mb-1 block">Serial Number *</label>
                                        <input
                                            type="text" required
                                            value={formData.serialNumber} onChange={e => setFormData({ ...formData, serialNumber: e.target.value })}
                                            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary font-mono"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-muted-foreground mb-1 block">Brand</label>
                                        <input
                                            type="text"
                                            value={formData.brand} onChange={e => setFormData({ ...formData, brand: e.target.value })}
                                            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-muted-foreground mb-1 block">Status</label>
                                        <select
                                            value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}
                                            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                                        >
                                            <option value="Active">Active</option>
                                            <option value="UnderMaintenance">Under Maintenance</option>
                                            <option value="Decommissioned">Decommissioned</option>
                                            <option value="InStorage">In Storage</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-muted-foreground mb-1 block">Asset Type</label>
                                        <select
                                            value={formData.assetTypeId}
                                            onChange={e => setFormData({ ...formData, assetTypeId: Number(e.target.value) })}
                                            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                                        >
                                            <option value={1}>Fire Extinguisher</option>
                                            <option value={2}>Fire Hose Reel</option>
                                            <option value={3}>Fire Hydrant</option>
                                            <option value={4}>Smoke Detector</option>
                                            <option value={5}>Emergency Light</option>
                                            <option value={6}>Sprinkler Head</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-muted-foreground mb-1 block">
                                            Inspection Category <span className="text-yellow-400">(required for checklist)</span>
                                        </label>
                                        <select
                                            required
                                            value={formData.categoryId}
                                            onChange={e => setFormData({ ...formData, categoryId: Number(e.target.value) })}
                                            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                                        >
                                            <option value={0} disabled>Select inspection category</option>
                                            {categories.map(c => (
                                                <option key={c.id} value={c.id}>{c.name}</option>
                                            ))}
                                            {categories.length === 0 && <option value={0} disabled>No categories — create one in Checklist Builder</option>}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-muted-foreground mb-1 block">Assigned Site *</label>
                                        <select
                                            required
                                            value={formData.siteId}
                                            onChange={e => setFormData({ ...formData, siteId: Number(e.target.value) })}
                                            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                                        >
                                            <option value={0} disabled>Select a valid site</option>
                                            {sites.map(s => (
                                                <option key={s.id} value={s.id}>{s.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-muted-foreground mb-1 block">Location / Building</label>
                                        <input
                                            type="text"
                                            value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })}
                                            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                                        />
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        <div>
                                            <label className="text-xs font-semibold text-muted-foreground mb-1 block">Floor</label>
                                            <input
                                                type="text"
                                                value={formData.floor} onChange={e => setFormData({ ...formData, floor: e.target.value })}
                                                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-semibold text-muted-foreground mb-1 block">Room</label>
                                            <input
                                                type="text"
                                                value={formData.room} onChange={e => setFormData({ ...formData, room: e.target.value })}
                                                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                                            />
                                        </div>
                                    </div>

                                </div>

                                <div className="flex justify-end space-x-3 pt-4 mt-6 border-t border-border/50">
                                    <button
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        className="px-4 py-2 text-sm font-medium hover:bg-secondary/50 rounded-lg transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={formLoading}
                                        className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:-translate-y-0.5 transition-transform flex items-center space-x-2"
                                    >
                                        {formLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                                        <span>Save Asset</span>
                                    </button>
                                </div>
                            </form>
                        </div>
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
