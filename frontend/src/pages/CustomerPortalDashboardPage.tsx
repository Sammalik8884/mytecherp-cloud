import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Loader2, Receipt, CheckCircle, AlertCircle, Clock, ArrowRight, CreditCard, Eye, FileText } from "lucide-react";
import { customerPortalService } from "../services/customerPortalService";
import { paymentService } from "../services/paymentService";
import { InvoiceDto } from "../types/finance";
import { useAuth } from "../auth/AuthContext";
import { toast } from "react-hot-toast";

export const CustomerPortalDashboardPage = () => {
    const { user } = useAuth();
    const [invoices, setInvoices] = useState<InvoiceDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<number | null>(null);

    useEffect(() => {
        customerPortalService.getMyInvoices()
            .then(setInvoices)
            .catch(() => toast.error("Failed to load your invoices."))
            .finally(() => setLoading(false));
    }, []);

    const outstanding = invoices.filter(i => i.status === 1 || i.status === 3);
    const paid = invoices.filter(i => i.status === 2);
    const outstandingBalance = outstanding.reduce((sum, i) => sum + (i.totalAmount - i.amountPaid), 0);
    const recentInvoices = invoices.slice(0, 5);

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
            case 0: return <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-500/20 text-muted-foreground border border-gray-500/30">Draft</span>;
            case 1: return <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-500/20 text-blue-400 border border-blue-500/30">Issued</span>;
            case 2: return <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/30">Paid</span>;
            case 3: return <span className="px-2 py-0.5 rounded text-xs font-medium bg-red-500/20 text-red-400 border border-red-500/30">Overdue</span>;
            case 4: return <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-500/20 text-gray-500 border border-gray-500/30">Voided</span>;
            default: return null;
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Welcome Banner */}
            <div className="rounded-2xl border border-border bg-gradient-to-r from-primary/10 via-transparent to-transparent p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
                <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                    Welcome back, {user?.fullName?.split(" ")[0] || "Customer"} 👋
                </h1>
                <p className="text-muted-foreground mt-1 text-sm">Here's an overview of your account with FiretechERP.</p>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white/5 border border-border rounded-2xl p-5 space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Outstanding Balance</span>
                        <div className="p-2 rounded-lg bg-red-500/10"><AlertCircle className="h-4 w-4 text-red-400" /></div>
                    </div>
                    <div className="text-2xl font-bold text-red-400">${outstandingBalance.toFixed(2)}</div>
                    <div className="text-xs text-gray-500">{outstanding.length} invoice(s) pending</div>
                </div>
                <div className="bg-white/5 border border-border rounded-2xl p-5 space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Total Paid</span>
                        <div className="p-2 rounded-lg bg-green-500/10"><CheckCircle className="h-4 w-4 text-green-400" /></div>
                    </div>
                    <div className="text-2xl font-bold text-green-400">
                        ${paid.reduce((s, i) => s + i.amountPaid, 0).toFixed(2)}
                    </div>
                    <div className="text-xs text-gray-500">{paid.length} invoice(s) settled</div>
                </div>
                <div className="bg-white/5 border border-border rounded-2xl p-5 space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Total Invoices</span>
                        <div className="p-2 rounded-lg bg-primary/10"><Receipt className="h-4 w-4 text-primary" /></div>
                    </div>
                    <div className="text-2xl font-bold text-foreground">{invoices.length}</div>
                    <div className="text-xs text-gray-500">All time issued</div>
                </div>
                <div className="bg-white/5 border border-border rounded-2xl p-5 space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Overdue</span>
                        <div className="p-2 rounded-lg bg-orange-500/10"><Clock className="h-4 w-4 text-orange-400" /></div>
                    </div>
                    <div className="text-2xl font-bold text-orange-400">
                        {invoices.filter(i => i.status === 3).length}
                    </div>
                    <div className="text-xs text-gray-500">Need immediate attention</div>
                </div>
            </div>

            {/* Pending Payment CTA */}
            {outstanding.length > 0 && (
                <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div>
                        <h3 className="text-foreground font-semibold">You have {outstanding.length} unpaid invoice(s)</h3>
                        <p className="text-muted-foreground text-sm mt-0.5">Total outstanding: <span className="text-red-400 font-medium">${outstandingBalance.toFixed(2)}</span></p>
                    </div>
                    <Link
                        to="/portal/invoices"
                        className="flex items-center space-x-2 bg-primary hover:bg-primary/90 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors shrink-0"
                    >
                        <CreditCard className="h-4 w-4" />
                        <span>Pay Now</span>
                        <ArrowRight className="h-4 w-4" />
                    </Link>
                </div>
            )}

            {/* Recent Invoices */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-foreground flex items-center space-x-2">
                        <FileText className="h-5 w-5 text-primary" />
                        <span>Recent Invoices</span>
                    </h2>
                    <Link to="/portal/invoices" className="text-sm text-primary hover:text-primary/80 flex items-center space-x-1 transition-colors">
                        <span>View All</span>
                        <ArrowRight className="h-3 w-3" />
                    </Link>
                </div>
                <div className="bg-white/5 border border-border rounded-2xl overflow-hidden">
                    {recentInvoices.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">No invoices found for your account.</div>
                    ) : (
                        <table className="w-full text-sm">
                            <thead className="bg-secondary/80 border-b border-border text-muted-foreground text-xs uppercase">
                                <tr>
                                    <th className="px-5 py-3 text-left font-medium">Invoice</th>
                                    <th className="px-5 py-3 text-left font-medium">Amount</th>
                                    <th className="px-5 py-3 text-left font-medium">Status</th>
                                    <th className="px-5 py-3 text-left font-medium">Due Date</th>
                                    <th className="px-5 py-3 text-right font-medium">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {recentInvoices.map(inv => (
                                    <tr key={inv.id} className="hover:bg-secondary/50 transition-colors">
                                        <td className="px-5 py-4 font-medium text-foreground">{inv.invoiceNumber}</td>
                                        <td className="px-5 py-4 text-foreground font-semibold">
                                            ${inv.totalAmount.toFixed(2)}
                                            {inv.status === 2 && <span className="text-xs text-green-400 ml-1">(Paid)</span>}
                                        </td>
                                        <td className="px-5 py-4">{getStatusBadge(inv.status)}</td>
                                        <td className="px-5 py-4 text-muted-foreground">{new Date(inv.dueDate).toLocaleDateString()}</td>
                                        <td className="px-5 py-4 text-right">
                                            <div className="flex items-center justify-end space-x-2">
                                                <button
                                                    onClick={() => handleViewPdf(inv.id)}
                                                    disabled={processingId === inv.id}
                                                    className="p-1.5 rounded-lg text-gray-400 hover:text-primary hover:bg-primary/10 transition-colors disabled:opacity-50"
                                                    title="View PDF"
                                                >
                                                    {processingId === inv.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
                                                </button>
                                                {(inv.status === 1 || inv.status === 3) && (
                                                    <button
                                                        onClick={() => handlePayNow(inv)}
                                                        disabled={processingId === inv.id}
                                                        className="flex items-center space-x-1 px-3 py-1.5 bg-primary/20 hover:bg-primary/30 text-primary rounded-lg text-xs font-medium transition-colors border border-primary/30 disabled:opacity-50"
                                                    >
                                                        <CreditCard className="h-3 w-3" />
                                                        <span>Pay</span>
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
};
