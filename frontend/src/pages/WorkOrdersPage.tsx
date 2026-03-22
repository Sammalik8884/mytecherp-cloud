import { useState, useEffect } from "react";
import { Loader2, Search, BriefcaseBusiness, CheckCircle, XCircle, Receipt, PlayCircle, Trash2, Edit, Briefcase, PlusCircle, X } from "lucide-react";
import { StatCard } from "../components/dashboard/StatCard";
import { ConfirmModal } from "../components/common/ConfirmModal";
import { workOrderService } from "../services/workOrderService";
import { invoiceService } from "../services/invoiceService";
import { contractService } from "../services/contractService";
import { WorkOrderDto, UpdateWorkOrderDto, AssetDto, CreateWorkOrderDto } from "../types/field";
import { ContractDto } from "../types/contract";
import { toast } from "react-hot-toast";
import { authService } from "../services/authService";
import { apiClient } from "../services/apiClient";

const extractApiError = (error: any, fallback: string) => {
    if (!error || !error.response || !error.response.data) {
        return error?.message || fallback;
    }
    const d = error.response.data;
    if (typeof d === 'string') return d;
    return d.error || d.Error || d.message || d.Message || d.detail || d.title || fallback;
};

export const WorkOrdersPage = () => {
    const [workOrders, setWorkOrders] = useState<WorkOrderDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [processingId, setProcessingId] = useState<number | null>(null);

    const activeWorkOrders = workOrders.filter(w => ['InProgress', 'Assigned', 'Initialized', 'PendingApproval'].includes(w.status)).length;
    const now = new Date();
    const completedThisMonth = workOrders.filter(w => {
        if (w.status !== 'Completed' || !w.completedDate) return false;
        const d = new Date(w.completedDate);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;

    const [technicians, setTechnicians] = useState<any[]>([]);
    const [assets, setAssets] = useState<AssetDto[]>([]);
    const [contracts, setContracts] = useState<ContractDto[]>([]);

    // Create modal state
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [createForm, setCreateForm] = useState<CreateWorkOrderDto>({
        description: "",
        contractId: 0,
        scheduledDate: new Date().toISOString().split('T')[0],
        technicianId: null,
        assetId: undefined
    });

    // Delete modal state
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [jobToDelete, setJobToDelete] = useState<WorkOrderDto | null>(null);

    // Edit modal state
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingJob, setEditingJob] = useState<WorkOrderDto | null>(null);
    const [formData, setFormData] = useState<UpdateWorkOrderDto>({
        id: 0,
        description: "",
        status: "",
        scheduledDate: "",
        technicianId: "",
        assetId: null
    });


    const fetchData = async () => {
        try {
            setLoading(true);
            const [woData, usersData, assetData, contractData] = await Promise.all([
                workOrderService.getAll(),
                authService.getUsers().catch(() => []),
                apiClient.get<AssetDto[]>("/Assets").then(r => r.data).catch(() => []),
                contractService.getAll().catch(() => [])
            ]);
            setWorkOrders(woData);
            setTechnicians(usersData.filter((u: any) => u.roles && (u.roles.includes("Tech") || u.roles.includes("Worker") || u.roles.includes("Technician"))));
            setAssets(Array.isArray(assetData) ? assetData : []);
            setContracts(Array.isArray(contractData) ? contractData : []);
        } catch (error) {
            toast.error("Failed to load work orders.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const filteredWorkOrders = workOrders.filter(wo =>
        wo.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        wo.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        wo.status.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleDeleteWO = async (id: number) => {
        const wo = workOrders.find(w => w.id === id);
        if (wo) {
            setJobToDelete(wo);
            setIsDeleteModalOpen(true);
        }
    };

    const confirmDeleteJob = async () => {
        if (!jobToDelete) return;
        try {
            await workOrderService.delete(jobToDelete.id);
            toast.success("Work Order deleted.");
            setIsDeleteModalOpen(false);
            setJobToDelete(null);
            fetchData();
        } catch (error: any) {
            toast.error(extractApiError(error, "Failed to delete item."));
            setIsDeleteModalOpen(false);
            setJobToDelete(null);
        }
    };

    const handleApproveReject = async (id: number, isApproved: boolean) => {
        confirmAction(
            isApproved ? "Approve Job" : "Reject Job", 
            `Are you sure you want to ${isApproved ? 'approve' : 'reject'} this job?`, 
            isApproved ? "info" : "warning", 
            async () => {
                try {
                    setProcessingId(id);
                    await workOrderService.approveJob(id, isApproved);
                    toast.success(`Job ${isApproved ? 'approved' : 'rejected'} successfully.`);
                    fetchData();
                } catch (error: any) {
                    toast.error(extractApiError(error, "Failed to process job."));
                } finally {
                    setProcessingId(null);
                }
            }
        );
    };

    const handleInitialize = async (id: number) => {
        confirmAction(
            "Initialize Work Order", 
            "Initialize this work order? This will set up the inspection checklist and mark it as In Progress.", 
            "info", 
            async () => {
                try {
                    setProcessingId(id);
                    const result = await workOrderService.initialize(id);
                    toast.success(result?.message || "Work order initialized successfully!");
                    fetchData();
                } catch (error: any) {
                    toast.error(extractApiError(error, "Failed to initialize work order."));
                } finally {
                    setProcessingId(null);
                }
            }
        );
    };

    const handleGenerateInvoice = async (id: number) => {
        try {
            setProcessingId(id);
            await invoiceService.generateFromJob(id);
            toast.success("Invoice generated successfully!");
        } catch (error: any) {
            toast.error(extractApiError(error, "Failed to generate invoice."));
        } finally {
            setProcessingId(null);
        }
    };


    const handleCreateSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!createForm.contractId) { toast.error("Please select a Contract."); return; }
        try {
            setProcessingId(-10);
            await workOrderService.create({
                description: createForm.description,
                contractId: createForm.contractId,
                scheduledDate: new Date(createForm.scheduledDate).toISOString(),
                technicianId: createForm.technicianId || null,
                assetId: createForm.assetId || undefined
            });
            toast.success("Work Order created successfully!");
            setIsCreateModalOpen(false);
            setCreateForm({ description: "", contractId: 0, scheduledDate: new Date().toISOString().split('T')[0], technicianId: null, assetId: undefined });
            fetchData();
        } catch (error: any) {
            toast.error(extractApiError(error, "Failed to create work order."));
        } finally {
            setProcessingId(null);
        }
    };

    const handleOpenEdit = (wo: WorkOrderDto) => {
        setEditingJob(wo);
        setFormData({
            id: wo.id,
            description: wo.description,
            status: wo.status,
            scheduledDate: wo.scheduledDate.split('T')[0],
            technicianId: "",
            assetId: (wo as any).assetId || null
        });
        setIsEditModalOpen(true);
    };

    const handleSaveEdit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.technicianId) {
            toast.error("Please select a Technician before assigning.");
            return;
        }

        if (!formData.assetId) {
            toast.error("Please select an Asset before saving the assignment.");
            return;
        }

        try {
            if (formData.technicianId !== undefined && formData.technicianId !== editingJob?.technicianId) {
                if (formData.technicianId === "") {
                    // They selected "Unassigned". In a real system, we'd have an unassign endpoint.
                    // For now, if string is empty, we must ensure UpdateWorkOrderDto accepts null or empty to clear it.
                    formData.technicianId = null;
                } else {
                    // Call assign endpoint for a valid technician
                    await workOrderService.assignTechnician(formData.id, formData.technicianId as string);
                }
            }

            // Only send expected fields to standard Update endpoint
            const updatePayload: any = {
                id: formData.id,
                description: formData.description,
                status: formData.status,
                // Ensure technicianId is null if empty string, or the selected value
                technicianId: formData.technicianId === "" ? null : formData.technicianId,
                // Ensure assetId is null if 0 or null, or the selected value
                assetId: formData.assetId === 0 ? null : formData.assetId
            };

            if (formData.scheduledDate && formData.scheduledDate.trim() !== "") {
                updatePayload.scheduledDate = formData.scheduledDate;
            }

            await workOrderService.update(editingJob!.id, updatePayload);
            toast.success("Work Order updated successfully.");
            setIsEditModalOpen(false);
            fetchData();
        } catch (error: any) {
            console.error("Update error:", error.response?.data || error.message);
            toast.error(extractApiError(error, "Failed to update job."));
        }
    };

    return (
        <div className="p-8 animate-in fade-in duration-500">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent flex items-center gap-3">
                        <BriefcaseBusiness className="h-8 w-8 text-primary" />
                        Work Orders
                    </h1>
                    <p className="text-muted-foreground mt-1 text-sm">Dispatch overview and job status tracking.</p>
                </div>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground px-5 py-2.5 rounded-xl flex items-center gap-2 font-semibold transition-all hover:-translate-y-0.5 active:scale-95 shadow-lg shadow-primary/25"
                >
                    <PlusCircle className="h-5 w-5" />
                    New Work Order
                </button>
            </div>

            <div className="mb-8 grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    title="Active Work Orders"
                    value={activeWorkOrders}
                    subtitle="In progress, assigned, or pending"
                    icon={Briefcase}
                    href="#"
                    accentColor="blue"
                />
                <StatCard
                    title="Completed This Month"
                    value={completedThisMonth}
                    subtitle="Work orders wrapped up MTD"
                    icon={CheckCircle}
                    href="#"
                    accentColor="cyan"
                    trend={completedThisMonth > 0 ? 'up' : 'neutral'}
                    trendLabel="This month"
                />
            </div>

            <div className="bg-secondary/30 border border-border/50 rounded-2xl overflow-hidden backdrop-blur-sm shadow-xl">
                <div className="p-4 border-b border-border/40 flex justify-between items-center">
                    <div className="relative w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Search jobs or customers..."
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
                                <th className="px-6 py-4 font-medium">Job Details</th>
                                <th className="px-6 py-4 font-medium">Customer & Site</th>
                                <th className="px-6 py-4 font-medium">Status</th>
                                <th className="px-6 py-4 font-medium">Result</th>
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
                            ) : filteredWorkOrders.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                                        No work orders found.
                                    </td>
                                </tr>
                            ) : (
                                filteredWorkOrders.map((wo) => (
                                    <tr key={wo.id} className="hover:bg-secondary/50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-foreground">WO-{wo.id.toString().padStart(4, '0')}</div>
                                            <div className="text-xs text-muted-foreground overflow-hidden text-ellipsis whitespace-nowrap max-w-[200px]" title={wo.description}>
                                                {wo.description}
                                            </div>
                                            <div className="text-xs text-primary mt-1">Tech: {wo.technicianName || 'Unassigned'}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-medium">{wo.customerName}</div>
                                            <div className="text-xs text-muted-foreground">{wo.siteName}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border ${wo.status === 'PendingApproval' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' :
                                                wo.status === 'Completed' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                                                    wo.status === 'InProgress' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                                                        wo.status === 'Approved' ? 'bg-purple-500/10 text-purple-500 border-purple-500/20' :
                                                            wo.status === 'Initialized' ? 'bg-teal-500/10 text-teal-500 border-teal-500/20' :
                                                                wo.status === 'Assigned' ? 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20' :
                                                                    wo.status === 'Rejected' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                                                                        'bg-muted/30 text-muted-foreground border-border/50'
                                                }`}>
                                                {wo.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-medium">{wo.result || '-'}</div>
                                            {wo.completedDate && <div className="text-xs text-muted-foreground">{new Date(wo.completedDate).toLocaleDateString()}</div>}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {wo.status === 'PendingApproval' && (
                                                <div className="flex justify-end space-x-2">
                                                    <button
                                                        onClick={() => handleApproveReject(wo.id, true)}
                                                        disabled={processingId === wo.id}
                                                        className="p-2 border border-green-500/30 text-green-500 hover:bg-green-500/20 hover:text-green-500 rounded-lg transition-colors flex items-center space-x-1 font-medium bg-green-500/10 disabled:opacity-50"
                                                    >
                                                        {processingId === wo.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                                                        <span className="text-xs">Approve</span>
                                                    </button>
                                                    <button
                                                        onClick={() => handleApproveReject(wo.id, false)}
                                                        disabled={processingId === wo.id}
                                                        className="p-2 border border-destructive/30 text-destructive hover:bg-destructive/20 hover:text-destructive rounded-lg transition-colors flex items-center space-x-1 font-medium bg-destructive/10 disabled:opacity-50"
                                                    >
                                                        {processingId === wo.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                                                        <span className="text-xs">Reject</span>
                                                    </button>
                                                </div>
                                            )}
                                            {wo.status === 'Approved' && (
                                                <div className="flex justify-end space-x-2">
                                                    <button
                                                        onClick={() => handleGenerateInvoice(wo.id)}
                                                        disabled={processingId === wo.id}
                                                        className="p-2 border border-blue-500/30 text-blue-500 hover:bg-blue-500/20 hover:text-blue-500 rounded-lg transition-colors flex items-center space-x-1 font-medium bg-blue-500/10 disabled:opacity-50"
                                                    >
                                                        {processingId === wo.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Receipt className="h-4 w-4" />}
                                                        <span className="text-xs">Generate Invoice</span>
                                                    </button>
                                                </div>
                                            )}

                                            {wo.status === 'Assigned' && (
                                                <div className="flex justify-end space-x-2">
                                                    <button
                                                        onClick={() => handleInitialize(wo.id)}
                                                        disabled={processingId === wo.id}
                                                        className="p-2 border border-primary/30 text-primary hover:bg-primary/20 rounded-lg transition-colors flex items-center space-x-1 font-medium bg-primary/10 disabled:opacity-50"
                                                    >
                                                        {processingId === wo.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlayCircle className="h-4 w-4" />}
                                                        <span className="text-xs">Initialize</span>
                                                    </button>
                                                </div>
                                            )}
                                            {(wo.status === 'Assigned' || wo.status === 'Initialized') && (
                                                <div className="flex justify-end mt-2 border-t border-border/20 pt-2 text-[11px] text-muted-foreground italic items-center gap-1">
                                                    <Loader2 className="h-3 w-3 animate-spin" /> Waiting for Technician
                                                </div>
                                            )}
                                            {wo.status === 'InProgress' && (
                                                <div className="flex justify-end mt-2 border-t border-border/20 pt-2 text-[11px] text-blue-500 italic items-center gap-1">
                                                    <Loader2 className="h-3 w-3 animate-spin" /> Job in Progress
                                                </div>
                                            )}
                                            <div className="flex justify-end space-x-2 mt-2">
                                                <button onClick={() => handleOpenEdit(wo)} title="Edit" className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors">
                                                    <Edit className="h-4 w-4" />
                                                </button>
                                                <button onClick={() => handleDeleteWO(wo.id)} title="Delete" className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors">
                                                    <Trash2 className="h-4 w-4" />
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


            {/* Edit Modal / Assign Modal */}
            {isEditModalOpen && editingJob && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-secondary border border-border rounded-2xl w-full max-w-md shadow-2xl overflow-hidden relative">
                        <div className="p-6">
                            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                                <BriefcaseBusiness className="h-5 w-5 text-primary" />
                                Edit Work Order: WO-{editingJob.id.toString().padStart(4, '0')}
                            </h2>
                            <form onSubmit={handleSaveEdit} className="space-y-4">
                                <div>
                                    <label className="text-xs font-semibold text-muted-foreground mb-1 block">Description / Notes</label>
                                    <textarea
                                        value={formData.description}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                        className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                                        rows={3}
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-muted-foreground mb-1 block">Status</label>
                                    <select
                                        value={formData.status}
                                        onChange={e => setFormData({ ...formData, status: e.target.value })}
                                        className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                                    >
                                        <option value="Created">Created</option>
                                        <option value="Assigned">Assigned</option>
                                        <option value="Initialized">Initialized</option>
                                        <option value="InProgress">InProgress</option>
                                        <option value="PendingApproval">Pending Approval</option>
                                        <option value="Approved">Approved</option>
                                        <option value="Completed">Completed</option>
                                        <option value="Rejected">Rejected</option>
                                        <option value="Cancelled">Cancelled</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-muted-foreground mb-1 block">Scheduled Date</label>
                                    <input
                                        type="date"
                                        value={formData.scheduledDate}
                                        onChange={e => setFormData({ ...formData, scheduledDate: e.target.value })}
                                        className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-muted-foreground mb-1 flex items-center gap-1 block">
                                        Linked Asset
                                        <span className="text-yellow-400 text-[10px] font-normal">(required for Initialize)</span>
                                    </label>
                                    <select
                                        value={formData.assetId || 0}
                                        onChange={e => setFormData({ ...formData, assetId: Number(e.target.value) || null })}
                                        className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                                    >
                                        <option value={0}>-- No Asset --</option>
                                        {assets.map(a => (
                                            <option key={a.id} value={a.id}>
                                                [{a.assetType}] {a.name} — S/N: {a.serialNumber}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-muted-foreground mb-1 block">Assign Technician</label>
                                    <select
                                        value={formData.technicianId || ""}
                                        onChange={e => setFormData({ ...formData, technicianId: e.target.value })}
                                        className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                                    >
                                        <option value="">-- Unassigned --</option>
                                        {technicians.map(t => (
                                            <option key={t.id} value={t.id}>{t.fullName}</option>
                                        ))}
                                        {technicians.length === 0 && <option value="" disabled>No technicians found.</option>}
                                    </select>
                                </div>

                                <div className="flex justify-end space-x-3 pt-4 border-t border-border/50">
                                    <button
                                        type="button"
                                        onClick={() => setIsEditModalOpen(false)}
                                        className="px-4 py-2 text-sm font-medium hover:bg-secondary/50 rounded-lg transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:-translate-y-0.5 transition-transform"
                                    >
                                        Save Changes
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Create Work Order Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-card border border-border rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden relative">
                        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-primary to-accent" />
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-bold flex items-center gap-2 text-foreground">
                                    <PlusCircle className="h-5 w-5 text-primary" />
                                    Create Work Order
                                </h2>
                                <button onClick={() => setIsCreateModalOpen(false)} className="p-2 hover:bg-secondary/50 rounded-full transition-colors text-muted-foreground">
                                    <X className="h-5 w-5" />
                                </button>
                            </div>
                            <form onSubmit={handleCreateSubmit} className="space-y-4">
                                <div>
                                    <label className="text-xs font-semibold text-muted-foreground mb-1 block">Contract *</label>
                                    <select
                                        required
                                        value={createForm.contractId || 0}
                                        onChange={e => setCreateForm({ ...createForm, contractId: Number(e.target.value) })}
                                        className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 text-foreground"
                                    >
                                        <option value={0} disabled>-- Select Contract --</option>
                                        {contracts.map(c => (
                                            <option key={c.id} value={c.id}>{c.description} — {c.customerName}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-muted-foreground mb-1 block">Description *</label>
                                    <textarea
                                        required
                                        value={createForm.description}
                                        onChange={e => setCreateForm({ ...createForm, description: e.target.value })}
                                        className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 text-foreground"
                                        rows={3}
                                        placeholder="Describe the work to be done..."
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-semibold text-muted-foreground mb-1 block">Scheduled Date</label>
                                        <input
                                            type="date"
                                            value={createForm.scheduledDate}
                                            onChange={e => setCreateForm({ ...createForm, scheduledDate: e.target.value })}
                                            className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 text-foreground"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-muted-foreground mb-1 block">Asset</label>
                                        <select
                                            value={createForm.assetId || 0}
                                            onChange={e => setCreateForm({ ...createForm, assetId: Number(e.target.value) || undefined })}
                                            className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 text-foreground"
                                        >
                                            <option value={0}>-- No Asset --</option>
                                            {assets.map(a => (
                                                <option key={a.id} value={a.id}>[{a.assetType}] {a.name} — S/N: {a.serialNumber}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-muted-foreground mb-1 block">Assign Technician</label>
                                    <select
                                        value={createForm.technicianId || ""}
                                        onChange={e => setCreateForm({ ...createForm, technicianId: e.target.value || null })}
                                        className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 text-foreground"
                                    >
                                        <option value="">-- Unassigned --</option>
                                        {technicians.map(t => (
                                            <option key={t.id} value={t.id}>{t.fullName}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="flex justify-end space-x-3 pt-4 border-t border-border/50">
                                    <button
                                        type="button"
                                        onClick={() => setIsCreateModalOpen(false)}
                                        className="px-4 py-2 text-sm font-medium hover:bg-secondary/50 rounded-lg transition-colors text-muted-foreground"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={processingId === -10}
                                        className="px-5 py-2 text-sm font-semibold bg-primary text-primary-foreground rounded-lg hover:-translate-y-0.5 transition-all disabled:opacity-50 flex items-center gap-2"
                                    >
                                        {processingId === -10 ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlusCircle className="h-4 w-4" />}
                                        Create Work Order
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            <ConfirmModal
                isOpen={isDeleteModalOpen}
                onCancel={() => {
                    setIsDeleteModalOpen(false);
                    setJobToDelete(null);
                }}
                onConfirm={confirmDeleteJob}
                title="Delete Work Order"
                message={`Are you sure you want to delete WO-${jobToDelete?.id.toString().padStart(4, '0')}? This action cannot be undone.`}
                confirmText="Delete Job"
                type="danger"
            />
        </div>
    );
};
