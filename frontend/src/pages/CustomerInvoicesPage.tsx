import { useState, useEffect } from "react";
import { Loader2, Receipt, Eye, CreditCard, Search } from "lucide-react";
import { customerPortalService } from "../services/customerPortalService";
import { paymentService } from "../services/paymentService";
import { InvoiceDto } from "../types/finance";
import { useAuth } from "../auth/AuthContext";
import { toast } from "react-hot-toast";

export const CustomerInvoicesPage = () => {
    const { user } = useAuth();
    const [invoices, setInvoices] = useState<InvoiceDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<number | null>(null);
    const [search, setSearch] = useState("");

    useEffect(() => {
        customerPortalService.getMyInvoices()
            .then(setInvoices)
            .catch(() => toast.error("Failed to load your invoices."))
            .finally(() => setLoading(false));
    }, []);

    const filtered = invoices.filter(inv =>
        inv.invoiceNumber.toLowerCase().includes(search.toLowerCase())
    );

    const handlePayNow = async (invoice: InvoiceDto) => {
        try {
            setProcessingId(invoice.id);
            const res = await paymentService.initiateStripeCheckout({
                invoiceId: invoice.id,
                amount: invoice.totalAmount - invoice.amountPaid,
                customerEmail: user?.email || "",
                description: `Payment for ${invoice.invoiceNumber}`
            });
            if (res.isSuccess && res.checkoutUrl) {
                window.location.href = res.checkoutUrl;
            } else {
                toast.error(res.errorMessage || "Failed to initiate payment.");
            }
        } catch {
            toast.error("Payment error. Please try again.");
        } finally {
            setProcessingId(null);
        }
    };

    const handleViewPdf = async (id: number) => {
        try {
            setProcessingId(id);
            const blob = await customerPortalService.downloadPdf(id);
            const url = window.URL.createObjectURL(blob);
            window.open(url, "_blank");
        } catch {
            toast.error("Failed to open invoice PDF.");
        } finally {
            setProcessingId(null);
        }
    };

    const getStatusBadge = (status: number) => {
        switch (status) {
            case 0: return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-500/20 text-muted-foreground border border-gray-500/30">Draft</span>;
            case 1: return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-400 border border-blue-500/30">Issued</span>;
            case 2: return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-green-500/20 text-green-400 border border-green-500/30">✓ Paid</span>;
            case 3: return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-red-500/20 text-red-400 border border-red-500/30">⚠ Overdue</span>;
            default: return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-500/20 text-gray-500 border border-gray-500/30">Voided</span>;
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                        <Receipt className="h-7 w-7 text-primary" />
                        My Invoices
                    </h1>
                    <p className="text-muted-foreground text-sm mt-0.5">View and pay your invoices from FiretechERP.</p>
                </div>
            </div>

            {/* Search */}
            <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <input
                    type="text"
                    placeholder="Search invoice #..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full bg-white/5 border border-border rounded-lg pl-10 pr-4 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50"
                />
            </div>

            {/* Invoice Table */}
            <div className="bg-white/5 border border-border rounded-2xl overflow-hidden shadow-xl">
                <table className="w-full text-sm">
                    <thead className="bg-secondary/80 border-b border-border text-muted-foreground text-xs uppercase">
                        <tr>
                            <th className="px-6 py-4 text-left font-medium">Invoice #</th>
                            <th className="px-6 py-4 text-left font-medium">Issue Date</th>
                            <th className="px-6 py-4 text-left font-medium">Due Date</th>
                            <th className="px-6 py-4 text-left font-medium">Amount</th>
                            <th className="px-6 py-4 text-left font-medium">Status</th>
                            <th className="px-6 py-4 text-right font-medium">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {loading ? (
                            <tr>
                                <td colSpan={6} className="py-12 text-center">
                                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary opacity-50" />
                                </td>
                            </tr>
                        ) : filtered.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="py-12 text-center text-gray-500">
                                    No invoices found.
                                </td>
                            </tr>
                        ) : (
                            filtered.map(inv => (
                                <tr key={inv.id} className="hover:bg-secondary/50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <span className="font-semibold text-foreground group-hover:text-primary transition-colors">{inv.invoiceNumber}</span>
                                    </td>
                                    <td className="px-6 py-4 text-muted-foreground">
                                        {new Date(inv.issueDate).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={inv.status === 3 ? "text-red-400 font-medium" : "text-gray-400"}>
                                            {new Date(inv.dueDate).toLocaleDateString()}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-foreground">${inv.totalAmount.toFixed(2)}</div>
                                        {inv.status === 2 && inv.amountPaid > 0 && (
                                            <div className="text-xs text-green-400">Paid: ${inv.amountPaid.toFixed(2)}</div>
                                        )}
                                        {(inv.status === 1 || inv.status === 3) && (
                                            <div className="text-xs text-red-400">Due: ${(inv.totalAmount - inv.amountPaid).toFixed(2)}</div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">{getStatusBadge(inv.status)}</td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end space-x-2">
                                            {/* View PDF */}
                                            <button
                                                onClick={() => handleViewPdf(inv.id)}
                                                disabled={processingId === inv.id}
                                                title="View Invoice PDF"
                                                className="p-2 rounded-lg text-gray-400 hover:text-primary hover:bg-primary/10 transition-colors border border-transparent hover:border-primary/20 disabled:opacity-50"
                                            >
                                                {processingId === inv.id
                                                    ? <Loader2 className="h-4 w-4 animate-spin" />
                                                    : <Eye className="h-4 w-4" />
                                                }
                                            </button>

                                            {/* Pay Now (only for Issued or Overdue) */}
                                            {(inv.status === 1 || inv.status === 3) && (
                                                <button
                                                    onClick={() => handlePayNow(inv)}
                                                    disabled={processingId === inv.id}
                                                    className="flex items-center space-x-1.5 px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
                                                >
                                                    <CreditCard className="h-3.5 w-3.5" />
                                                    <span>Pay Now</span>
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
    );
};
