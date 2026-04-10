import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Loader2, Search, Users } from "lucide-react";
import { StatCard } from "../components/dashboard/StatCard";
import { customerService } from "../services/customerService";
import { CustomerDto, CreateCustomerDto } from "../types/customer";
import { ConfirmModal } from "../components/common/ConfirmModal";
import { toast } from "react-hot-toast";

export const CustomersPage = () => {
    const [customers, setCustomers] = useState<CustomerDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeTab, setActiveTab] = useState<"Clients" | "Customers">("Clients");

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formLoading, setFormLoading] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState<CustomerDto | null>(null);
    const [formData, setFormData] = useState<CreateCustomerDto>({
        name: "",
        email: "",
        phone: "",
        address: "",
        taxNumber: ""
    });

    const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; title: string; message: string; type: 'info' | 'warning' | 'danger'; onConfirm: () => void }>({ isOpen: false, title: "", message: "", type: "info", onConfirm: () => { } });

    const confirmAction = (title: string, message: string, type: 'info' | 'warning' | 'danger', action: () => Promise<void>) => {
        setConfirmModal({
            isOpen: true, title, message, type,
            onConfirm: async () => {
                setConfirmModal(prev => ({ ...prev, isOpen: false }));
                await action();
            }
        });
    };

    const fetchCustomers = async () => {
        try {
            setLoading(true);
            const data = await customerService.getAll();
            setCustomers(data);
        } catch (error) {
            toast.error("Failed to load customers.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCustomers();
    }, []);

    const filteredCustomers = customers.filter(c =>
        (c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.email.toLowerCase().includes(searchQuery.toLowerCase())) &&
        (activeTab === "Clients" ? c.isProspect : !c.isProspect)
    );

    const handleOpenModal = (customer?: CustomerDto) => {
        if (customer) {
            setEditingCustomer(customer);
            // Fetch missing details if any, or just use list data (taxNumber not returned in list)
            setFormData({
                name: customer.name,
                email: customer.email,
                phone: customer.phone || "",
                address: customer.address || "",
                taxNumber: "" // Would need getById to populate if necessary, leaving blank for edit modal simplicity
            });
        } else {
            setEditingCustomer(null);
            setFormData({ name: "", email: "", phone: "", address: "", taxNumber: "" });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormLoading(true);
        try {
            if (editingCustomer) {
                await customerService.update(editingCustomer.id, formData);
                toast.success("Customer updated successfully");
            } else {
                await customerService.create(formData);
                toast.success("Customer created successfully");
            }
            setIsModalOpen(false);
            fetchCustomers();
        } catch (error: any) {
            toast.error(error.response?.data?.Error || error.response?.data?.Message || "Error saving customer");
        } finally {
            setFormLoading(false);
        }
    };

    const handleDelete = (id: number) => {
        confirmAction("Delete Customer", "Are you sure you want to delete this customer? This action cannot be undone.", "danger", async () => {
            try {
                await customerService.delete(id);
                toast.success("Customer deleted successfully");
                fetchCustomers();
            } catch (error: any) {
                // Removed unused variable
                const bodyStr = typeof error.response?.data === 'object' ? JSON.stringify(error.response?.data) : error.response?.data;
                const errorMsg = error.response?.data?.Error || error.response?.data?.error || bodyStr || error.message;
                toast.error(errorMsg);
            }
        });
    };

    return (
        <div className="p-8 animate-in fade-in duration-500">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">Customers</h1>
                    <p className="text-muted-foreground mt-1 text-sm">Manage your client base and contacts.</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium hover:-translate-y-0.5 transition-all shadow-lg hover:shadow-primary/25 flex items-center space-x-2"
                >
                    <Plus className="h-5 w-5" />
                    <span>Add {activeTab === "Clients" ? "Client" : "Customer"}</span>
                </button>
            </div>

            <div className="mb-8 grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-2">
                <StatCard
                    title="Total Clients (Prospects)"
                    value={customers.filter(c => c.isProspect).length}
                    subtitle="Active prospects"
                    icon={Users}
                    href="#"
                    accentColor="blue"
                />
                <StatCard
                    title="Total Finalized Customers"
                    value={customers.filter(c => !c.isProspect).length}
                    subtitle="Converted accounts"
                    icon={Users}
                    href="#"
                    accentColor="emerald"
                />
            </div>

            <div className="flex space-x-4 mb-6 border-b border-border/40">
                <button
                    onClick={() => setActiveTab("Clients")}
                    className={`pb-3 px-2 text-sm font-medium transition-colors border-b-2 ${
                        activeTab === "Clients" 
                            ? "border-primary text-primary" 
                            : "border-transparent text-muted-foreground hover:text-foreground"
                    }`}
                >
                    Clients (Prospects)
                </button>
                <button
                    onClick={() => setActiveTab("Customers")}
                    className={`pb-3 px-2 text-sm font-medium transition-colors border-b-2 ${
                        activeTab === "Customers" 
                            ? "border-primary text-primary" 
                            : "border-transparent text-muted-foreground hover:text-foreground"
                    }`}
                >
                    Finalized Customers
                </button>
            </div>

            <div className="bg-secondary/30 border border-border/50 rounded-2xl overflow-hidden backdrop-blur-sm shadow-xl">
                <div className="p-4 border-b border-border/40 flex justify-between items-center">
                    <div className="relative w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Search customers..."
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
                                <th className="px-6 py-4 font-medium">Name</th>
                                <th className="px-6 py-4 font-medium">Email</th>
                                <th className="px-6 py-4 font-medium">Phone</th>
                                <th className="px-6 py-4 font-medium">Status</th>
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
                            ) : filteredCustomers.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground">
                                        No customers found.
                                    </td>
                                </tr>
                            ) : (
                                filteredCustomers.map((customer) => (
                                    <tr key={customer.id} className="hover:bg-secondary/50 transition-colors group">
                                        <td className="px-6 py-4 font-medium text-foreground">
                                            {customer.name}
                                        </td>
                                        <td className="px-6 py-4 text-muted-foreground">
                                            {customer.email}
                                        </td>
                                        <td className="px-6 py-4 text-muted-foreground">
                                            {customer.phone || "-"}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                customer.isProspect
                                                    ? "bg-blue-100 text-blue-800 border border-blue-200"
                                                    : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                            }`}>
                                                {customer.isProspect ? "Client" : "Customer"}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end space-x-2">
                                                <button
                                                    onClick={() => handleOpenModal(customer)}
                                                    className="p-2 border border-primary/30 text-primary hover:bg-primary/20 hover:text-primary rounded-lg transition-colors flex items-center space-x-1 font-medium bg-primary/10"
                                                >
                                                    <Edit className="h-4 w-4" />
                                                    <span className="text-xs">Edit</span>
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(customer.id)}
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
                            <h2 className="text-xl font-bold mb-4">
                                {editingCustomer ? "Edit Customer" : "Add New Customer"}
                            </h2>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="text-xs font-semibold text-muted-foreground mb-1 block">Name *</label>
                                    <input
                                        type="text" required
                                        value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                                    />
                                </div>

                                <div>
                                    <label className="text-xs font-semibold text-muted-foreground mb-1 block">Email *</label>
                                    <input
                                        type="email" required
                                        value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                                    />
                                </div>

                                <div>
                                    <label className="text-xs font-semibold text-muted-foreground mb-1 block">Phone</label>
                                    <input
                                        type="text"
                                        value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                        className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                                    />
                                </div>

                                <div>
                                    <label className="text-xs font-semibold text-muted-foreground mb-1 block">Address</label>
                                    <input
                                        type="text"
                                        value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })}
                                        className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                                    />
                                </div>

                                <div>
                                    <label className="text-xs font-semibold text-muted-foreground mb-1 block">Tax Number</label>
                                    <input
                                        type="text"
                                        value={formData.taxNumber} onChange={e => setFormData({ ...formData, taxNumber: e.target.value })}
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
                                        <span>Save Customer</span>
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
