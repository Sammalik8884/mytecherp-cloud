import { useState, useEffect } from "react";
import { Loader2, Search, Plus, FileText, DownloadCloud, Send, Edit, Trash2, FilePlus2, Briefcase, CheckCircle, XCircle, FileSignature, Activity, AlertTriangle, Copy, Pin } from "lucide-react";
import { StatCard } from "../components/dashboard/StatCard";
import { quotationService, QuotationDto } from "../services/quotationService";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { ConfirmModal } from "../components/common/ConfirmModal";
import { PromptModal } from "../components/common/PromptModal";
import { GenerateInvoiceFromQuoteModal } from "../components/common/GenerateInvoiceFromQuoteModal";

const extractApiError = (error: any, fallback: string) => {
    if (!error || !error.response || !error.response.data) {
        return error?.message || fallback;
    }
    const d = error.response.data;
    if (typeof d === 'string') return d;
    return d.error || d.Error || d.message || d.Message || d.detail || d.title || fallback;
};

type TabKey = 'all' | 'pending' | 'draft' | 'pendingapproval' | 'approved' | 'senttocustomer' | 'rejected';

export const QuotationsPage = () => {
    const navigate = useNavigate();
    const { hasRole, user } = useAuth();
    const [quotations, setQuotations] = useState<QuotationDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeTab, setActiveTab] = useState<TabKey>('all');
    const isHuzefa = user?.email?.toLowerCase() === 'm.huzefa@mytecheng.com';

    const TABS: { key: TabKey; label: string }[] = isHuzefa 
        ? [
            { key: 'all',             label: 'All' },
            { key: 'draft',           label: 'Draft' },
            { key: 'pendingapproval', label: 'Pending Approval' },
            { key: 'approved',        label: 'Approved' },
            { key: 'senttocustomer',  label: 'Sent' },
            { key: 'rejected',        label: 'Rejected' },
        ]
        : [
            { key: 'all',             label: 'All' },
            { key: 'pending',         label: 'Pending' },
            { key: 'approved',        label: 'Approved' },
            { key: 'senttocustomer',  label: 'Sent' },
            { key: 'rejected',        label: 'Rejected' },
        ];

    const [pinnedQuotes, setPinnedQuotes] = useState<number[]>(() => {
        const saved = localStorage.getItem('pinnedQuotes');
        return saved ? JSON.parse(saved) : [];
    });

    const togglePin = (id: number) => {
        setPinnedQuotes(prev => {
            const newPins = prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id];
            localStorage.setItem('pinnedQuotes', JSON.stringify(newPins));
            return newPins;
        });
    };

    const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; title: string; message: string; type: 'info'|'warning'|'danger'; onConfirm: () => void }>({ isOpen: false, title: "", message: "", type: "info", onConfirm: () => {} });
    const [promptModal, setPromptModal] = useState<{ isOpen: boolean; title: string; message: string; onConfirm: (val: string) => void }>({ isOpen: false, title: "", message: "", onConfirm: () => {} });
    const [quoteInvoiceModal, setQuoteInvoiceModal] = useState<{isOpen: boolean, quote: QuotationDto | null}>({ isOpen: false, quote: null });

    const totalQuotations = quotations.length;
    const pendingQuotes = quotations.filter(q => ['draft', 'pendingapproval'].includes(q.status.toLowerCase())).length;
    const pipelineValue = quotations.reduce((sum, q) => sum + q.grandTotal, 0);

    const fmt = (n: number) =>
        n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(1)}M`
        : n >= 1_000 ? `$${(n / 1_000).toFixed(1)}K`
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
        window.scrollTo(0, 0);
    }, []);

    const normalizeStatus = (s: string) => s.toLowerCase().replace(/\s/g, '');

    const tabFilteredQuotations = activeTab === 'all'
        ? quotations
        : activeTab === 'pending'
        ? quotations.filter(q => ['draft', 'pendingapproval'].includes(normalizeStatus(q.status)))
        : quotations.filter(q => normalizeStatus(q.status) === activeTab);

    const filteredQuotations = tabFilteredQuotations.filter(q =>
        q.quoteNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.status.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const sortedFilteredQuotations = [...filteredQuotations].sort((a, b) => {
        const aPinned = pinnedQuotes.includes(a.id);
        const bPinned = pinnedQuotes.includes(b.id);
        if (aPinned && !bPinned) return -1;
        if (!aPinned && bPinned) return 1;
        return b.id - a.id; // Newest first
    });

    const tabCounts = TABS.reduce((acc, tab) => {
        if (tab.key === 'all') acc[tab.key] = quotations.length;
        else if (tab.key === 'pending') acc[tab.key] = quotations.filter(q => ['draft', 'pendingapproval'].includes(normalizeStatus(q.status))).length;
        else acc[tab.key] = quotations.filter(q => normalizeStatus(q.status) === tab.key).length;
        return acc;
    }, {} as Record<TabKey, number>);

    const handleDownloadPdf = async (id: number, quoteNumber: string) => {
        try {
            toast.loading("Generating PDF...", { id: `pdf-${id}` });
            const blob = await quotationService.downloadPdf(id);
            if (blob.type !== 'application/pdf') {
                const text = await blob.text();
                let errorMsg = "Failed to generate PDF";
                try { const j = JSON.parse(text); errorMsg = j.Error || j.error || j.Message || errorMsg; } catch(e) {}
                toast.error(errorMsg, { id: `pdf-${id}` }); return;
            }
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url; a.download = `${quoteNumber}.pdf`;
            document.body.appendChild(a); a.click();
            window.URL.revokeObjectURL(url);
            toast.success("PDF Downloaded", { id: `pdf-${id}` });
        } catch (error) { toast.error("Failed to download PDF", { id: `pdf-${id}` }); }
    };

    const confirmAction = (title: string, message: string, type: 'info' | 'warning' | 'danger', action: () => Promise<void>) => {
        setConfirmModal({ isOpen: true, title, message, type, onConfirm: async () => { setConfirmModal(prev => ({ ...prev, isOpen: false })); await action(); } });
    };

    const handleSendEmail = (id: number) => confirmAction("Send Email", "Send this quotation to the customer via email?", "info", async () => {
        try { toast.loading("Sending...", { id: `email-${id}` }); await quotationService.sendEmail(id); toast.success("Email sent", { id: `email-${id}` }); fetchData(); }
        catch (error: any) { toast.error(extractApiError(error, "Failed to send email"), { id: `email-${id}` }); }
    });

    const handleGenerateInvoice = (id: number) => { const quote = quotations.find(q => q.id === id); if (quote) setQuoteInvoiceModal({ isOpen: true, quote }); };

    const handleConvertToWorkOrder = (id: number) => confirmAction("Convert to Work Order", "Convert this quotation to a Work Order?", "info", async () => {
        try { toast.loading("Converting...", { id: `wo-${id}` }); const r = await quotationService.convertToWorkOrder(id); toast.success(r.message, { id: `wo-${id}` }); }
        catch (error: any) { toast.error(extractApiError(error, "Failed to convert"), { id: `wo-${id}` }); }
    });

    const handleApprove = (id: number) => confirmAction("Approve Quotation", "Approve this quotation?", "info", async () => {
        try { toast.loading("Approving...", { id: `approve-${id}` }); await quotationService.approve(id); toast.success("Quotation Approved", { id: `approve-${id}` }); fetchData(); }
        catch (error: any) { toast.error(extractApiError(error, "Failed to approve"), { id: `approve-${id}` }); }
    });

    const handleSubmitForApproval = (id: number) => confirmAction("Submit for Approval", "Submit this quotation for approval?", "info", async () => {
        try { toast.loading("Submitting...", { id: `submit-${id}` }); await quotationService.submitForApproval(id); toast.success("Quotation Submitted for Approval", { id: `submit-${id}` }); fetchData(); }
        catch (error: any) { toast.error(extractApiError(error, "Failed to submit"), { id: `submit-${id}` }); }
    });

    const handleReject = (id: number) => setPromptModal({ isOpen: true, title: "Reject Quotation", message: "Reason for rejection:", onConfirm: async (comment) => {
        setPromptModal(prev => ({ ...prev, isOpen: false }));
        try { toast.loading("Rejecting...", { id: `reject-${id}` }); await quotationService.reject(id, comment); toast.success("Quotation Rejected", { id: `reject-${id}` }); fetchData(); }
        catch (error: any) { toast.error(extractApiError(error, "Failed to reject"), { id: `reject-${id}` }); }
    }});

    const handleConvertToContract = (id: number) => confirmAction("Convert to Contract", "Convert this quotation to an AMC Contract?", "info", async () => {
        try { toast.loading("Converting...", { id: `contract-${id}` }); const r = await quotationService.convertToContract(id); toast.success(r.message, { id: `contract-${id}` }); }
        catch (error: any) { toast.error(extractApiError(error, "Failed to convert"), { id: `contract-${id}` }); }
    });

    const handleDeleteQuote = (id: number) => confirmAction("Delete Quotation", "Are you sure you want to delete this quotation? This action cannot be undone.", "danger", async () => {
        try { await quotationService.deleteQuotation(id); toast.success("Quotation deleted."); fetchData(); }
        catch (error: any) { toast.error(extractApiError(error, "Failed to delete quotation")); }
    });

    const getStatusColor = (status: string) => {
        switch (normalizeStatus(status)) {
            case 'draft': return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
            case 'senttocustomer': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
            case 'approved': return 'bg-green-500/20 text-green-400 border-green-500/30';
            case 'rejected': return 'bg-red-500/20 text-red-400 border-red-500/30';
            case 'pendingapproval': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
            default: return 'bg-primary/20 text-primary border-primary/30';
        }
    };

    const getStatusLabel = (status: string) => {
        if (normalizeStatus(status) === 'pendingapproval') return 'Pending';
        if (normalizeStatus(status) === 'senttocustomer') return 'Sent';
        return status;
    };

    return (
        <div className="p-8 animate-in fade-in duration-500">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">Quotations</h1>
                    <p className="text-muted-foreground mt-1 text-sm">Manage your sales pipeline and generate invoices.</p>
                </div>
                <button onClick={() => navigate('/quotations/new')} className="bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium hover:-translate-y-0.5 transition-all shadow-lg hover:shadow-primary/25 flex items-center space-x-2">
                    <Plus className="h-5 w-5" /><span>Create Quotation</span>
                </button>
            </div>

            <div className="mb-8 grid gap-4 grid-cols-1 md:grid-cols-3 lg:grid-cols-4">
                <StatCard title="Total Quotations" value={totalQuotations} subtitle="All time quotes issued" icon={FileText} href="#" accentColor="orange" />
                <StatCard title="Pipeline Value" value={fmt(pipelineValue)} subtitle="Total value of all quotes" icon={Activity} href="#" accentColor="emerald" trend="up" trendLabel="Potential revenue" />
                <StatCard title="Pending Quotes" value={pendingQuotes} subtitle="Draft or awaiting approval" icon={AlertTriangle} href="#" accentColor="amber" />
            </div>

            <div className="bg-secondary/30 border border-border/50 rounded-2xl overflow-hidden backdrop-blur-sm shadow-xl">
                {/* Status Tabs */}
                <div className="border-b border-border/40 px-4 pt-4 flex gap-1 overflow-x-auto">
                    {TABS.map(tab => (
                        <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-all flex items-center gap-2 whitespace-nowrap ${
                                activeTab === tab.key
                                    ? 'bg-background border border-border/60 border-b-background -mb-px text-foreground'
                                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                            }`}
                        >
                            {tab.label}
                            {tabCounts[tab.key] > 0 && (
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${activeTab === tab.key ? 'bg-primary/20 text-primary' : 'bg-secondary/80 text-muted-foreground'}`}>
                                    {tabCounts[tab.key]}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                <div className="p-4 border-b border-border/40">
                    <div className="relative w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <input type="text" placeholder="Search quotes..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-background/50 border border-border text-sm rounded-lg pl-9 pr-4 py-2 w-full focus:outline-none focus:ring-1 focus:ring-primary" />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-muted-foreground uppercase bg-secondary/50 border-b border-border/40">
                            <tr>
                                <th className="px-6 py-4 font-medium">Quote #</th>
                                <th className="px-6 py-4 font-medium">Customer</th>
                                <th className="px-6 py-4 font-medium">Details</th>
                                <th className="px-6 py-4 font-medium">Amount</th>
                                <th className="px-6 py-4 font-medium">Valid Until</th>
                                <th className="px-6 py-4 font-medium">Status</th>
                                <th className="px-6 py-4 font-medium text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/30">
                            {loading ? (
                                <tr><td colSpan={7} className="px-6 py-12 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto text-primary opacity-50" /></td></tr>
                            ) : sortedFilteredQuotations.length === 0 ? (
                                <tr><td colSpan={7} className="px-6 py-12 text-center text-muted-foreground">
                                    No {activeTab !== 'all' ? `"${TABS.find(t => t.key === activeTab)?.label}" ` : ''}quotations found.
                                </td></tr>
                            ) : (
                                (() => {
                                    const renderedRows: React.ReactNode[] = [];
                                    const processedIds = new Set<number>();

                                    const renderQuoteRow = (quote: any, level: number = 0) => (
                                        <tr key={`quote-${quote.id}`} className={`hover:bg-secondary/50 transition-colors group ${level > 0 ? 'bg-secondary/10' : ''}`}>
                                            <td className="px-6 py-4 font-medium text-foreground">
                                                <div className="flex items-center space-x-2" style={{ paddingLeft: `${level * 1.5}rem` }}>
                                                    {level > 0 && <span className="text-muted-foreground">↳</span>}
                                                    <FileText className="h-4 w-4 text-primary/70" />
                                                    <span>{quote.quoteNumber}</span>
                                                    {level > 0 && <span className="ml-2 px-1.5 py-0.5 rounded text-[9px] font-bold bg-primary/20 text-primary uppercase tracking-wider">Revision</span>}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 font-medium text-primary">
                                                {quote.customerName}
                                                {quote.siteName && <span className="text-xs text-muted-foreground block font-normal">{quote.siteName}</span>}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex gap-1 flex-wrap">
                                                    {quote.quoteMode ? quote.quoteMode.split(',').map((mode: string, idx: number) => (
                                                        <span key={idx} className="px-2 py-0.5 rounded text-[10px] bg-secondary text-muted-foreground border border-border">{mode.trim()}</span>
                                                    )) : (
                                                        <span className="px-2 py-0.5 rounded text-[10px] bg-secondary text-muted-foreground border border-border">Local</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-foreground font-semibold">
                                                {quote.grandTotal.toLocaleString()} <span className="text-xs text-muted-foreground font-normal">{quote.currency}</span>
                                            </td>
                                            <td className="px-6 py-4 text-muted-foreground">{new Date(quote.validUntil).toLocaleDateString()}</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getStatusColor(quote.status)}`}>
                                                    {getStatusLabel(quote.status)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end items-center space-x-1">
                                                    <button onClick={() => togglePin(quote.id)} title={pinnedQuotes.includes(quote.id) ? "Unpin" : "Pin"} className={`p-2 rounded-lg transition-colors ${pinnedQuotes.includes(quote.id) ? 'text-primary bg-primary/10 hover:bg-primary/20' : 'text-muted-foreground hover:text-primary hover:bg-primary/10'}`}>
                                                        <Pin className={`h-4 w-4 ${pinnedQuotes.includes(quote.id) ? 'fill-current' : ''}`} />
                                                    </button>
                                                    <button onClick={() => handleDownloadPdf(quote.id, quote.quoteNumber)} title="Download PDF" className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"><DownloadCloud className="h-4 w-4" /></button>
                                                    {!hasRole(["Estimation"]) && (
                                                        <button onClick={() => handleSendEmail(quote.id)} title="Send Email" className="p-2 text-muted-foreground hover:text-blue-400 hover:bg-blue-400/10 rounded-lg transition-colors"><Send className="h-4 w-4" /></button>
                                                    )}
                                                    <button onClick={() => navigate(`/quotations/edit/${quote.id}`)} title="Edit" className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"><Edit className="h-4 w-4" /></button>
                                                    <button onClick={() => navigate(`/quotations/revise/${quote.id}`)} title="Revise" className="p-2 text-muted-foreground hover:text-indigo-500 hover:bg-indigo-500/10 rounded-lg transition-colors"><Copy className="h-4 w-4" /></button>
                                                    {normalizeStatus(quote.status) === 'draft' && (
                                                        <button onClick={() => handleSubmitForApproval(quote.id)} title="Submit for Approval" className="p-2 text-muted-foreground hover:text-yellow-500 hover:bg-yellow-500/10 rounded-lg transition-colors"><Send className="h-4 w-4" /></button>
                                                    )}
                                                    {normalizeStatus(quote.status) === 'pendingapproval' && isHuzefa && (
                                                        <>
                                                            <button onClick={() => handleApprove(quote.id)} title="Approve" className="p-2 text-muted-foreground hover:text-green-500 hover:bg-green-500/10 rounded-lg transition-colors"><CheckCircle className="h-4 w-4" /></button>
                                                            <button onClick={() => handleReject(quote.id)} title="Reject" className="p-2 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"><XCircle className="h-4 w-4" /></button>
                                                        </>
                                                    )}
                                                    {!['draft', 'pendingapproval', 'rejected'].includes(normalizeStatus(quote.status)) && (
                                                        <>
                                                            <button onClick={() => handleGenerateInvoice(quote.id)} title="Generate Invoice" className="p-2 text-muted-foreground hover:text-green-500 hover:bg-green-500/10 rounded-lg transition-colors"><FilePlus2 className="h-4 w-4" /></button>
                                                            <button onClick={() => handleConvertToWorkOrder(quote.id)} title="Convert to Work Order" className="p-2 text-muted-foreground hover:text-blue-500 hover:bg-blue-500/10 rounded-lg transition-colors"><Briefcase className="h-4 w-4" /></button>
                                                            <button onClick={() => handleConvertToContract(quote.id)} title="Convert to AMC Contract" className="p-2 text-muted-foreground hover:text-purple-500 hover:bg-purple-500/10 rounded-lg transition-colors"><FileSignature className="h-4 w-4" /></button>
                                                        </>
                                                    )}
                                                    <button onClick={() => handleDeleteQuote(quote.id)} title="Delete" className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors"><Trash2 className="h-4 w-4" /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    );

                                    sortedFilteredQuotations.forEach(quote => {
                                        if (processedIds.has(quote.id)) return;
                                        
                                        // Skip if parent is in the same view, we'll render it as a child
                                        if (quote.parentQuoteId) {
                                            const parentInList = sortedFilteredQuotations.some(q => q.id === quote.parentQuoteId);
                                            if (parentInList) return;
                                        }

                                        renderedRows.push(renderQuoteRow(quote, 0));
                                        processedIds.add(quote.id);

                                        const renderChildren = (parentId: number, currentLevel: number) => {
                                            const children = sortedFilteredQuotations.filter(q => q.parentQuoteId === parentId);
                                            children.sort((a,b) => a.id - b.id);
                                            children.forEach(child => {
                                                if (processedIds.has(child.id)) return;
                                                renderedRows.push(renderQuoteRow(child, currentLevel + 1));
                                                processedIds.add(child.id);
                                                renderChildren(child.id, currentLevel + 1);
                                            });
                                        };
                                        renderChildren(quote.id, 0);
                                    });

                                    return renderedRows;
                                })()
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <ConfirmModal isOpen={confirmModal.isOpen} title={confirmModal.title} message={confirmModal.message} type={confirmModal.type} onConfirm={confirmModal.onConfirm} onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))} />
            <PromptModal isOpen={promptModal.isOpen} title={promptModal.title} message={promptModal.message} onConfirm={promptModal.onConfirm} onCancel={() => setPromptModal(prev => ({ ...prev, isOpen: false }))} />
            {quoteInvoiceModal.quote && (
                <GenerateInvoiceFromQuoteModal isOpen={quoteInvoiceModal.isOpen} onClose={() => setQuoteInvoiceModal({ isOpen: false, quote: null })} onSuccess={() => { setQuoteInvoiceModal({ isOpen: false, quote: null }); fetchData(); }} quotation={quoteInvoiceModal.quote} />
            )}
        </div>
    );
};
