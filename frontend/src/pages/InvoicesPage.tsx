import { useState, useEffect } from "react";
import { Loader2, Search, Receipt, Eye, Send, Plus, Copy, DollarSign, AlertTriangle, FileText } from "lucide-react";
import { StatCard } from "../components/dashboard/StatCard";
import { invoiceService } from "../services/invoiceService";
import { InvoiceDto } from "../types/finance";
import { CreateInvoiceModal } from "../components/CreateInvoiceModal";
import { ConfirmModal } from "../components/common/ConfirmModal";
import { toast } from "react-hot-toast";

export const InvoicesPage = () => {
    const [invoices, setInvoices] = useState<InvoiceDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [processingId, setProcessingId] = useState<number | null>(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

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

    const totalRevenue = invoices.filter(i => i.status === 2).reduce((sum, i) => sum + i.totalAmount, 0);
    const outstandingBalance = invoices.filter(i => i.status === 1 || i.status === 3).reduce((sum, i) => sum + (i.totalAmount - i.amountPaid), 0);
    const pendingInvoicesCount = invoices.filter(i => i.status === 1 || i.status === 3).length;

    const fmt = (n: number) =>
        n >= 1_000_000
            ? `$${(n / 1_000_000).toFixed(1)}M`
            : n >= 1_000
            ? `$${(n / 1_000).toFixed(1)}K`
            : `$${n.toFixed(0)}`;

    const fetchInvoices = async () => {
        try {
            setLoading(true);
            const data = await invoiceService.getAll();
            setInvoices(data);
        } catch (error) {
            toast.error("Failed to load invoices.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInvoices();
    }, []);

    const filteredInvoices = invoices.filter(inv =>
        inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (inv.customerName && inv.customerName.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const handlePublishInvoice = (id: number) => {
        confirmAction("Issue Invoice", "Are you sure you want to officially issue this invoice? It will become payable.", "warning", "Issue", async () => {
            try {
                setProcessingId(id);
                await invoiceService.markAsIssued(id);
                toast.success("Invoice officially issued!");
                fetchInvoices();
            } catch (error) {
                toast.error((error as any).response?.data?.Error || (error as any).response?.data?.Message || "Failed to issue invoice.");
            } finally {
                setProcessingId(null);
            }
        });
    };

    const handleMarkAsPaid = async (id: number) => {
        try {
            setProcessingId(id);
            await invoiceService.markAsPaid(id);
            toast.success("Invoice marked as paid!");
            fetchInvoices();
        } catch (error) {
            toast.error((error as any).response?.data?.Error || (error as any).response?.data?.Message || "Failed to mark invoice as paid.");
        } finally {
            setProcessingId(null);
        }
    };

    const handleCopyPortalLink = (invoice: InvoiceDto) => {
        const portalUrl = `${window.location.origin}/portal/invoices`;
        navigator.clipboard.writeText(portalUrl)
            .then(() => toast.success(`Portal link copied! Share with ${invoice.customerName || 'customer'} to pay invoice ${invoice.invoiceNumber}.`))
            .catch(() => toast.error("Failed to copy link."));
    };

    const handleViewPdf = async (id: number) => {
        try {
            setProcessingId(id);
            const blob = await invoiceService.downloadPdf(id);
            const url = window.URL.createObjectURL(blob);
            window.open(url, '_blank');
            // We intentionally don't revoke here immediately so the new tab has time to load it. 
        } catch (error) {
            toast.error((error as any).response?.data?.Error || (error as any).response?.data?.Message || "Failed to load invoice PDF.");
        } finally {
            setProcessingId(null);
        }
    };

    const getStatusStyles = (status: number) => {
        switch (status) {
            case 0: return "bg-gray-500/10 text-gray-500 border-gray-500/20"; // Draft
            case 1: return "bg-blue-500/10 text-blue-500 border-blue-500/20"; // Issued
            case 2: return "bg-green-500/10 text-green-500 border-green-500/20"; // Paid
            case 3: return "bg-red-500/10 text-red-500 border-red-500/20"; // Overdue
            default: return "bg-primary/10 text-primary border-primary/20";
        }
    };

    const getStatusText = (status: number) => {
        switch (status) {
            case 0: return "Draft";
            case 1: return "Issued";
            case 2: return "Paid";
            case 3: return "Overdue";
            case 4: return "Voided";
            default: return "Unknown";
        }
    };

    return (
        <div className="p-8 animate-in fade-in duration-500">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent flex items-center gap-3">
                        <Receipt className="h-8 w-8 text-primary" />
                        Invoices & Billing
                    </h1>
                    <p className="text-muted-foreground mt-1 text-sm">Manage receivables and process payments.</p>
                </div>
            </div>

            <div className="mb-8 grid gap-4 grid-cols-1 md:grid-cols-3 lg:grid-cols-4">
                <StatCard
                    title="Total Revenue Collected"
                    value={fmt(totalRevenue)}
                    subtitle="Paid invoices across all time"
                    icon={DollarSign}
                    href="#"
                    accentColor="emerald"
                    trend="up"
                    trendLabel="All time"
                />
                <StatCard
                    title="Outstanding Balance"
                    value={fmt(outstandingBalance)}
                    subtitle="Issued + overdue invoices"
                    icon={AlertTriangle}
                    href="#"
                    accentColor="rose"
                    trend={outstandingBalance > 0 ? 'down' : 'neutral'}
                    trendLabel={outstandingBalance > 0 ? 'Needs collection' : 'All cleared'}
                />
                <StatCard
                    title="Pending Invoices"
                    value={pendingInvoicesCount}
                    subtitle="Awaiting customer payment"
                    icon={FileText}
                    href="#"
                    accentColor="amber"
                />
            </div>

            <div className="bg-secondary/30 border border-border/50 rounded-2xl overflow-hidden backdrop-blur-sm shadow-xl">
                <div className="p-4 border-b border-border/40 flex justify-between items-center">
                    <div className="relative w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Search invoice # or customer..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-background/50 border border-border text-sm rounded-lg pl-9 pr-4 py-2 w-full focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                    </div>
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2"
                    >
                        <Plus className="h-4 w-4" />
                        <span>Create Invoice</span>
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-muted-foreground uppercase bg-secondary/50 border-b border-border/40">
                            <tr>
                                <th className="px-6 py-4 font-medium">Invoice Number</th>
                                <th className="px-6 py-4 font-medium">Customer</th>
                                <th className="px-6 py-4 font-medium">Amount</th>
                                <th className="px-6 py-4 font-medium">Status</th>
                                <th className="px-6 py-4 font-medium">Due Date</th>
                                <th className="px-6 py-4 font-medium text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/30">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center">
                                        <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary opacity-50" />
                                    </td>
                                </tr>
                            ) : filteredInvoices.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                                        No invoices found.
                                    </td>
                                </tr>
                            ) : (
                                filteredInvoices.map((inv) => (
                                    <tr key={inv.id} className="hover:bg-secondary/50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-foreground">{inv.invoiceNumber}</div>
                                            <div className="text-xs text-muted-foreground">
                                                {inv.workOrderId ? `From WO-${inv.workOrderId}` : inv.quotationId ? `From Quote-${inv.quotationId}` : 'Manual'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 font-medium">
                                            {inv.customerName || `Customer ID: ${inv.customerId}`}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-foreground">${inv.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                                            {inv.status === 2 && (
                                                <div className="text-xs text-green-500 mt-0.5">Paid: ${inv.amountPaid.toLocaleString()}</div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border ${getStatusStyles(inv.status)}`}>
                                                {getStatusText(inv.status)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-muted-foreground">
                                            {new Date(inv.dueDate).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end space-x-2">
                                                {/* Download/View PDF Button (Placeholder for now) */}
                                                <button
                                                    onClick={() => handleViewPdf(inv.id)}
                                                    disabled={processingId === inv.id}
                                                    className="p-2 border border-primary/30 text-primary hover:bg-primary/20 hover:text-primary rounded-lg transition-colors flex items-center space-x-1 font-medium bg-primary/10 disabled:opacity-50"
                                                    title="View PDF"
                                                >
                                                    {processingId === inv.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
                                                </button>

                                                {/* If Draft, allow Issuing */}
                                                {inv.status === 0 && (
                                                    <button
                                                        onClick={() => handlePublishInvoice(inv.id)}
                                                        disabled={processingId === inv.id}
                                                        className="p-2 border border-blue-500/30 text-blue-500 hover:bg-blue-500/20 rounded-lg transition-colors flex items-center space-x-1 font-medium bg-blue-500/10 disabled:opacity-50"
                                                        title="Issue Invoice"
                                                    >
                                                        {processingId === inv.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                                                    </button>
                                                )}

                                                {/* If Issued, allow Copy Portal Link so customer can pay */}
                                                {inv.status === 1 && (
                                                    <button
                                                        onClick={() => handleCopyPortalLink(inv)}
                                                        className="p-2 border border-teal-500/30 text-teal-400 hover:bg-teal-500/20 rounded-lg transition-colors flex items-center space-x-1 font-medium bg-teal-500/10"
                                                        title="Copy Customer Portal Link"
                                                    >
                                                        <Copy className="h-4 w-4" />
                                                        <span className="text-xs hidden md:inline">Copy Link</span>
                                                    </button>
                                                )}

                                                {/* If Issued, allow Admin to Mark As Paid completely */}
                                                {inv.status === 1 && (
                                                    <button
                                                        onClick={() => handleMarkAsPaid(inv.id)}
                                                        disabled={processingId === inv.id}
                                                        className="p-2 border border-green-500/30 text-green-500 hover:bg-green-500/20 rounded-lg transition-colors flex items-center space-x-1 font-medium bg-green-500/10 disabled:opacity-50"
                                                        title="Mark as Paid"
                                                    >
                                                        {processingId === inv.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <DollarSign className="h-4 w-4" />}
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <CreateInvoiceModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSuccess={fetchInvoices}
            />

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
