import { useState, useEffect } from "react";
import { MapPin, Plus, Edit, Trash2, Loader2, Search } from "lucide-react";
import { siteService } from "../services/siteService";
import { customerService } from "../services/customerService";
import { SiteDto, CreateSiteDto } from "../types/site";
import { CustomerDto } from "../types/customer";
import { ConfirmModal } from "../components/common/ConfirmModal";
import { toast } from "react-hot-toast";

export const SitesPage = () => {
    const [sites, setSites] = useState<SiteDto[]>([]);
    const [customers, setCustomers] = useState<CustomerDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formLoading, setFormLoading] = useState(false);
    const [editingSite, setEditingSite] = useState<SiteDto | null>(null);
    const [formData, setFormData] = useState<CreateSiteDto>({
        name: "",
        address: "",
        city: "",
        customerId: 0
    });

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

    const fetchData = async () => {
        try {
            setLoading(true);
            const [sitesData, customersData] = await Promise.all([
                siteService.getAll(),
                customerService.getAll()
            ]);
            setSites(sitesData);
            setCustomers(customersData);
        } catch (error) {
            toast.error("Failed to load data.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const filteredSites = sites.filter(s =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.city?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleOpenModal = (site?: SiteDto) => {
        if (site) {
            setEditingSite(site);
            setFormData({
                name: site.name,
                address: site.address || "",
                city: site.city || "",
                customerId: site.customerId
            });
        } else {
            setEditingSite(null);
            setFormData({ name: "", address: "", city: "", customerId: customers.length > 0 ? customers[0].id : 0 });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (formData.customerId === 0) {
            toast.error("Please select a valid customer.");
            return;
        }

        setFormLoading(true);
        try {
            if (editingSite) {
                await siteService.update(editingSite.id, formData);
                toast.success("Site updated successfully");
            } else {
                await siteService.create(formData);
                toast.success("Site created successfully");
            }
            setIsModalOpen(false);
            fetchData();
        } catch (error: any) {
            toast.error(error.response?.data?.Error || error.response?.data?.Message || "Error saving site");
        } finally {
            setFormLoading(false);
        }
    };

    const handleDelete = (id: number) => {
        confirmAction("Delete Site", "Are you sure you want to delete this site? This action cannot be undone.", "danger", async () => {
            try {
                await siteService.delete(id);
                toast.success("Site deleted successfully");
                fetchData();
            } catch (error: any) {
                toast.error(error.response?.data?.Error || error.response?.data?.error || "Failed to delete site. Please check server logs.");
            }
        });
    };

    return (
        <div className="p-8 animate-in fade-in duration-500">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">Sites / Locations</h1>
                    <p className="text-muted-foreground mt-1 text-sm">Manage physical locations tied to your customers.</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium hover:-translate-y-0.5 transition-all shadow-lg hover:shadow-primary/25 flex items-center space-x-2"
                >
                    <Plus className="h-5 w-5" />
                    <span>Add Site</span>
                </button>
            </div>

            <div className="bg-secondary/30 border border-border/50 rounded-2xl overflow-hidden backdrop-blur-sm shadow-xl">
                <div className="p-4 border-b border-border/40 flex justify-between items-center">
                    <div className="relative w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Search sites..."
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
                                <th className="px-6 py-4 font-medium">Site Name</th>
                                <th className="px-6 py-4 font-medium">Customer</th>
                                <th className="px-6 py-4 font-medium">Address</th>
                                <th className="px-6 py-4 font-medium">City</th>
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
                            ) : filteredSites.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                                        No sites found.
                                    </td>
                                </tr>
                            ) : (
                                filteredSites.map((site) => (
                                    <tr key={site.id} className="hover:bg-secondary/50 transition-colors group">
                                        <td className="px-6 py-4 font-medium text-foreground flex items-center space-x-2">
                                            <MapPin className="h-4 w-4 text-primary/70" />
                                            <span>{site.name}</span>
                                        </td>
                                        <td className="px-6 py-4 font-medium text-primary">
                                            {site.customerName}
                                        </td>
                                        <td className="px-6 py-4 text-muted-foreground">
                                            {site.address || "-"}
                                        </td>
                                        <td className="px-6 py-4 text-muted-foreground">
                                            {site.city || "-"}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end space-x-2">
                                                <button
                                                    onClick={() => handleOpenModal(site)}
                                                    className="p-2 border border-primary/30 text-primary hover:bg-primary/20 hover:text-primary rounded-lg transition-colors flex items-center space-x-1 font-medium bg-primary/10"
                                                >
                                                    <Edit className="h-4 w-4" />
                                                    <span className="text-xs">Edit</span>
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(site.id)}
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
                    <div className="bg-secondary border border-border rounded-2xl w-full max-w-md shadow-2xl overflow-hidden relative">
                        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-primary to-accent" />

                        <div className="p-6">
                            <h2 className="text-xl font-bold mb-4 flex items-center space-x-2">
                                <MapPin className="h-5 w-5 text-primary" />
                                <span>{editingSite ? "Edit Site Location" : "Add New Site"}</span>
                            </h2>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="text-xs font-semibold text-muted-foreground mb-1 block">Customer *</label>
                                    <select
                                        required
                                        value={formData.customerId}
                                        onChange={e => setFormData({ ...formData, customerId: Number(e.target.value) })}
                                        className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary appearance-none"
                                    >
                                        <option value={0} disabled>Select a customer...</option>
                                        {customers.map(c => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="text-xs font-semibold text-muted-foreground mb-1 block">Site Name *</label>
                                    <input
                                        type="text" required
                                        value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                                        placeholder="e.g. Headquarters, North Branch..."
                                    />
                                </div>

                                <div>
                                    <label className="text-xs font-semibold text-muted-foreground mb-1 block">Address *</label>
                                    <input
                                        type="text" required
                                        value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })}
                                        className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                                    />
                                </div>

                                <div>
                                    <label className="text-xs font-semibold text-muted-foreground mb-1 block">City</label>
                                    <input
                                        type="text"
                                        value={formData.city} onChange={e => setFormData({ ...formData, city: e.target.value })}
                                        className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                                    />
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
                                        <span>Save Site</span>
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
                confirmText="Delete"
                onConfirm={confirmModal.onConfirm}
                onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
            />
        </div>
    );
};
