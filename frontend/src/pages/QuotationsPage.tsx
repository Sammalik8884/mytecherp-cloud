import { useState, useEffect } from "react";
import { Loader2, Search, Plus, FileText, DownloadCloud, Send, Edit, Trash2, FilePlus2, Briefcase, CheckCircle, XCircle, FileSignature, Activity, AlertTriangle } from "lucide-react";
import { StatCard } from "../components/dashboard/StatCard";
import { quotationService, QuotationDto } from "../services/quotationService";
import { invoiceService } from "../services/invoiceService";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { ConfirmModal } from "../components/common/ConfirmModal";
import { PromptModal } from "../components/common/PromptModal";

const extractApiError = (error: any, fallback: string) => {
    if (!error || !error.response || !error.response.data) {
        return error?.message || fallback;
    }
    const d = error.response.data;
    if (typeof d === 'string') return d;
    return d.error || d.Error || d.message || d.Message || d.detail || d.title || fallback;
};

export const QuotationsPage = () => {
    const navigate = useNavigate();
    const { hasRole } = useAuth();
    const isAdminOrManager = hasRole(["Admin"]) || hasRole(["Manager"]);
    const [quotations, setQuotations] = useState<QuotationDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; title: string; message: string; type: 'info'|'warning'|'danger'; onConfirm: () => void }>({ isOpen: false, title: "", message: "", type: "info", onConfirm: () => {} });
    const [promptModal, setPromptModal] = useState<{ isOpen: boolean; title: string; message: string; onConfirm: (val: string) => void }>({ isOpen: false, title: "", message: "", onConfirm: () => {} });

    const totalQuotations = quotations.length;
    const pendingQuotes = quotations.filter(q => ['draft', 'pendingapproval'].includes(q.status.toLowerCase())).length;
    const pipelineValue = quotations.reduce((sum, q) => sum + q.grandTotal, 0);

    const fmt = (n: number) =>
        n >= 1_000_000
            ? `$${(n / 1_000_000).toFixed(1)}M`
            : n >= 1_000
            ? `$${(n / 1_000).toFixed(1)}K`
            : `$${n.toFixed(0)}`;

    const fetchData = async () => {
        try {
            setLoading(true);
            const data = await quotationService.getAllQuotations();
            setQuotations(data);
        } catch (error) {
            toast.error("Failed to load quotations");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const filteredQuotations = quotations.filter(q =>
        q.quoteNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.status.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleDownloadPdf = async (id: number, quoteNumber: string) => {
        try {
            toast.loading("Generating PDF...", { id: `pdf-${id}` });
            const blob = await quotationService.downloadPdf(id);
            
            // Check if we actually got a PDF
            if (blob.type !== 'application/pdf') {
                const text = await blob.text();
                let errorMsg = "Failed to generate PDF";
                try {
                    const errorJson = JSON.parse(text);
                    errorMsg = errorJson.Error || errorJson.error || errorJson.Message || errorMsg;
                } catch(e) {}
                
                toast.error(errorMsg, { id: `pdf-${id}` });
                return;
            }

            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `${quoteNumber}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            toast.success("PDF Downloaded", { id: `pdf-${id}` });
        } catch (error) {
            toast.error("Failed to download PDF", { id: `pdf-${id}` });
        }
    };

    const confirmAction = (title: string, message: string, type: 'info' | 'warning' | 'danger', action: () => Promise<void>) => {
        setConfirmModal({
            isOpen: true, title, message, type,
            onConfirm: async () => {
                setConfirmModal(prev => ({ ...prev, isOpen: false }));
                await action();
            }
        });
    };

    const handleSendEmail = (id: number) => {
        confirmAction("Send Email", "Send this quotation to the customer via email?", "info", async () => {
            try {
                toast.loading("Sending email...", { id: `email-${id}` });
                await quotationService.sendEmail(id);
                toast.success("Email sent successfully", { id: `email-${id}` });
                fetchData();
            } catch (error: any) {
                toast.error(extractApiError(error, "Failed to send email"), { id: `email-${id}` });
            }
        });
    };

    const handleGenerateInvoice = (id: number) => {
        confirmAction("Generate Invoice", "Generate an invoice from this quotation?", "info", async () => {
            try {
                toast.loading("Generating Invoice...", { id: `inv-${id}` });
                const result = await invoiceService.generateFromQuote(id);
                toast.success(`Invoice ${result.invoiceNumber} Generated Successfully`, { id: `inv-${id}` });
            } catch (error: any) {
                toast.error(extractApiError(error, "Failed to generate invoice"), { id: `inv-${id}` });
            }
        });
    };

    const handleConvertToWorkOrder = (id: number) => {
        confirmAction("Convert to Work Order", "Convert this quotation to a Work Order?", "info", async () => {
            try {
                toast.loading("Converting...", { id: `wo-${id}` });
                const result = await quotationService.convertToWorkOrder(id);
                toast.success(result.message, { id: `wo-${id}` });
            } catch (error: any) {
                toast.error(extractApiError(error, "Failed to convert to work order"), { id: `wo-${id}` });
            }
        });
    };

    const handleApprove = (id: number) => {
        confirmAction("Approve Quotation", "Approve this quotation?", "info", async () => {
            try {
                toast.loading("Approving...", { id: `approve-${id}` });
                await quotationService.approve(id);
                toast.success("Quotation Approved", { id: `approve-${id}` });
                fetchData();
            } catch (error: any) {
                toast.error(extractApiError(error, "Failed to approve quotation"), { id: `approve-${id}` });
            }
        });
    };

    const handleSubmitForApproval = (id: number) => {
        confirmAction("Submit for Approval", "Submit this quotation for approval?", "info", async () => {
            try {
                toast.loading("Submitting...", { id: `submit-${id}` });
                await quotationService.submitForApproval(id);
                toast.success("Quotation Submitted for Approval", { id: `submit-${id}` });
                fetchData();
            } catch (error: any) {
                toast.error(extractApiError(error, "Failed to submit quotation"), { id: `submit-${id}` });
            }
        });
    };

    const handleReject = (id: number) => {
        setPromptModal({
            isOpen: true,
            title: "Reject Quotation",
            message: "Reason for rejection:",
            onConfirm: async (comment) => {
                setPromptModal(prev => ({ ...prev, isOpen: false }));
                try {
                    toast.loading("Rejecting...", { id: `reject-${id}` });
                    await quotationService.reject(id, comment);
                    toast.success("Quotation Rejected", { id: `reject-${id}` });
                    fetchData();
                } catch (error: any) {
                    toast.error(extractApiError(error, "Failed to reject quotation"), { id: `reject-${id}` });
                }
            }
        });
    };

    const handleConvertToContract = (id: number) => {
        confirmAction("Convert to Contract", "Convert this quotation to an AMC Contract?", "info", async () => {
            try {
                toast.loading("Converting...", { id: `contract-${id}` });
                const result = await quotationService.convertToContract(id);
                toast.success(result.message, { id: `contract-${id}` });
            } catch (error: any) {
                toast.error(extractApiError(error, "Failed to convert to contract"), { id: `contract-${id}` });
            }
        });
    };

    const handleDeleteQuote = (id: number) => {
        confirmAction("Delete Quotation", "Are you sure you want to delete this quotation? This action cannot be undone.", "danger", async () => {
            try {
                await quotationService.deleteQuotation(id);
                toast.success("Quotation deleted successfully.");
                fetchData();
            } catch (error: any) {
                toast.error(extractApiError(error, "Failed to delete quotation"));
            }
        });
    };

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'draft': return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
            case 'senttocustomer': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
            case 'approved': return 'bg-green-500/20 text-green-400 border-green-500/30';
            case 'rejected': return 'bg-red-500/20 text-red-400 border-red-500/30';
            default: return 'bg-primary/20 text-primary border-primary/30';
        }
    };

    return (
        <div className="p-8 animate-in fade-in duration-500">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">Quotations</h1>
                    <p className="text-muted-foreground mt-1 text-sm">Manage your sales pipeline and generate invoices.</p>
                </div>
                <button
                    onClick={() => navigate('/quotations/new')}
                    className="bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium hover:-translate-y-0.5 transition-all shadow-lg hover:shadow-primary/25 flex items-center space-x-2"
                >
                    <Plus className="h-5 w-5" />
                    <span>Create Quotation</span>
                </button>
            </div>

            <div className="mb-8 grid gap-4 grid-cols-1 md:grid-cols-3 lg:grid-cols-4">
                <StatCard
                    title="Total Quotations"
                    value={totalQuotations}
                    subtitle="All time quotes issued"
                    icon={FileText}
                    href="#"
                    accentColor="orange"
                />
                <StatCard
                    title="Pipeline Value"
                    value={fmt(pipelineValue)}
                    subtitle="Total value of all quotes"
                    icon={Activity}
                    href="#"
                    accentColor="emerald"
                    trend="up"
                    trendLabel="Potential revenue"
                />
                <StatCard
                    title="Pending Quotes"
                    value={pendingQuotes}
                    subtitle="Draft or awaiting approval"
                    icon={AlertTriangle}
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
                            placeholder="Search quotes..."
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
                                <th className="px-6 py-4 font-medium">Quote #</th>
                                <th className="px-6 py-4 font-medium">Customer</th>
                                <th className="px-6 py-4 font-medium">Amount</th>
                                <th className="px-6 py-4 font-medium">Valid Until</th>
                                <th className="px-6 py-4 font-medium">Status</th>
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
                            ) : filteredQuotations.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                                        No quotations found.
                                    </td>
                                </tr>
                            ) : (
                                filteredQuotations.map((quote) => (
                                    <tr key={quote.id} className="hover:bg-secondary/50 transition-colors group">
                                        <td className="px-6 py-4 font-medium text-foreground flex items-center space-x-2">
                                            <FileText className="h-4 w-4 text-primary/70" />
                                            <span>{quote.quoteNumber}</span>
                                        </td>
                                        <td className="px-6 py-4 font-medium text-primary">
                                            {quote.customerName}
                                            {quote.siteName && <span className="text-xs text-muted-foreground block font-normal">{quote.siteName}</span>}
                                        </td>
                                        <td className="px-6 py-4 text-foreground font-semibold">
                                            {quote.grandTotal.toLocaleString()} <span className="text-xs text-muted-foreground font-normal">{quote.currency}</span>
                                        </td>
                                        <td className="px-6 py-4 text-muted-foreground">
                                            {new Date(quote.validUntil).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getStatusColor(quote.status)}`}>
                                                {quote.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end items-center space-x-2">
                                                <button onClick={() => handleDownloadPdf(quote.id, quote.quoteNumber)} title="Download PDF" className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors">
                                                    <DownloadCloud className="h-4 w-4" />
                                                </button>
                                                <button onClick={() => handleSendEmail(quote.id)} title="Send Email" className="p-2 text-muted-foreground hover:text-blue-400 hover:bg-blue-400/10 rounded-lg transition-colors">
                                                    <Send className="h-4 w-4" />
                                                </button>
                                                <button onClick={() => navigate(`/quotations/edit/${quote.id}`)} title="Edit" className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors">
                                                    <Edit className="h-4 w-4" />
                                                </button>
                                                {quote.status.toLowerCase() === 'draft' && (
                                                    <button onClick={() => handleSubmitForApproval(quote.id)} title="Submit for Approval" className="p-2 text-muted-foreground hover:text-yellow-500 hover:bg-yellow-500/10 rounded-lg transition-colors">
                                                        <Send className="h-4 w-4" />
                                                    </button>
                                                )}
                                                {quote.status.toLowerCase() === 'pendingapproval' && isAdminOrManager && (
                                                    <>
                                                        <button onClick={() => handleApprove(quote.id)} title="Approve" className="p-2 text-muted-foreground hover:text-green-500 hover:bg-green-500/10 rounded-lg transition-colors">
                                                            <CheckCircle className="h-4 w-4" />
                                                        </button>
                                                        <button onClick={() => handleReject(quote.id)} title="Reject" className="p-2 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors">
                                                            <XCircle className="h-4 w-4" />
                                                        </button>
                                                    </>
                                                )}
                                                {!['draft', 'pendingapproval', 'rejected'].includes(quote.status.toLowerCase()) && (
                                                    <>
                                                        <button onClick={() => handleGenerateInvoice(quote.id)} title="Generate Invoice" className="p-2 text-muted-foreground hover:text-green-500 hover:bg-green-500/10 rounded-lg transition-colors">
                                                            <FilePlus2 className="h-4 w-4" />
                                                        </button>
                                                        <button onClick={() => handleConvertToWorkOrder(quote.id)} title="Convert to Work Order" className="p-2 text-muted-foreground hover:text-blue-500 hover:bg-blue-500/10 rounded-lg transition-colors">
                                                            <Briefcase className="h-4 w-4" />
                                                        </button>
                                                        <button onClick={() => handleConvertToContract(quote.id)} title="Convert to AMC Contract" className="p-2 text-muted-foreground hover:text-purple-500 hover:bg-purple-500/10 rounded-lg transition-colors">
                                                            <FileSignature className="h-4 w-4" />
                                                        </button>
                                                    </>
                                                )}
                                                <button onClick={() => handleDeleteQuote(quote.id)} title="Delete" className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors">
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

            <ConfirmModal
                isOpen={confirmModal.isOpen}
                title={confirmModal.title}
                message={confirmModal.message}
                type={confirmModal.type}
                onConfirm={confirmModal.onConfirm}
                onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
            />

            <PromptModal
                isOpen={promptModal.isOpen}
                title={promptModal.title}
                message={promptModal.message}
                onConfirm={promptModal.onConfirm}
                onCancel={() => setPromptModal(prev => ({ ...prev, isOpen: false }))}
            />
        </div>
    );
};
