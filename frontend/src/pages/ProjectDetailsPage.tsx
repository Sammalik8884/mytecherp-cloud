import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { siteService } from "../services/siteService";
import { amountRequestApi, AmountRequestFormDto } from "../api/amountRequestApi";
import { expenseApi } from "../api/expenseApi";
import { quotationService } from "../services/quotationService";
import { invoiceService } from "../services/invoiceService";
import { salesService } from "../services/salesService";
import { siteDocumentService, SiteDocumentDto } from "../services/siteDocumentService";

import { SiteDto } from "../types/site";
import { ExpenseDto } from "../api/expenseApi";
import { QuotationDto } from "../services/quotationService";
import { InvoiceDto } from "../types/finance";
import { SalesLeadDto } from "../types/sales";

import { FileText, MapPin, Search, Plus, Loader2, Building, Calendar, DollarSign, Receipt, Briefcase, FileSignature, ArrowLeft, MoreVertical, Edit, Download, Eye, User, Target } from "lucide-react";
import dayjs from "dayjs";

export const ProjectDetailsPage = () => {
    const { id } = useParams<{ id: string }>();
    const siteId = Number(id);

    const [site, setSite] = useState<SiteDto | null>(null);
    const [expenses, setExpenses] = useState<ExpenseDto[]>([]);
    const [arfs, setArfs] = useState<AmountRequestFormDto[]>([]);
    const [quotations, setQuotations] = useState<QuotationDto[]>([]);
    const [invoices, setInvoices] = useState<InvoiceDto[]>([]);
    const [leads, setLeads] = useState<SalesLeadDto[]>([]);
    const [documents, setDocuments] = useState<SiteDocumentDto[]>([]);

    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("overview");

    useEffect(() => {
        loadData();
    }, [siteId]);

    useEffect(() => {
        const handleRefresh = (e: any) => {
            if (e.detail?.siteId === siteId) {
                siteDocumentService.getDocumentsBySiteId(siteId).then(setDocuments);
            }
        };
        window.addEventListener('REFRESH_PROJECT_DOCUMENTS', handleRefresh);
        return () => window.removeEventListener('REFRESH_PROJECT_DOCUMENTS', handleRefresh);
    }, [siteId]);

    const loadData = async () => {
        try {
            setLoading(true);
            const [
                siteData,
                expenseData,
                arfDataResp,
                quoteData,
                invoiceData,
                leadData,
                documentData
            ] = await Promise.all([
                siteService.getById(siteId),
                expenseApi.getBySiteId(siteId),
                amountRequestApi.getAll(),
                quotationService.getAllQuotations(),
                invoiceService.getAll(),
                salesService.getLeads(),
                siteDocumentService.getDocumentsBySiteId(siteId).catch(err => {
                    console.error("Failed to load documents", err);
                    return [];
                })
            ]);

            const arfData = arfDataResp.data;

            setSite(siteData);
            setExpenses(expenseData);
            setArfs(arfData.filter((a: any) => a.siteId === siteId));
            setQuotations(quoteData.filter((q: any) => q.siteId === siteId));
            // Invoices might not have siteId directly, they have customerId or quotationId.
            // For now, let's filter by checking if invoice's quotation is in this site
            const quoteIds = quoteData.filter((q: any) => q.siteId === siteId).map((q: any) => q.id);
            setInvoices(invoiceData.filter((i: any) => i.quotationId && quoteIds.includes(i.quotationId)));
            setLeads(leadData.filter((l: any) => l.siteId === siteId));
            setDocuments(documentData);
            
        } catch (error) {
            console.error("Failed to load project details", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-6">Loading project details...</div>;
    if (!site) return <div className="p-6">Project not found.</div>;

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight mb-2">{site.name}</h1>
                        <div className="flex items-center space-x-4 text-muted-foreground">
                            <span className="flex items-center"><MapPin className="h-4 w-4 mr-1" /> {site.address || "No Address"}, {site.city}</span>
                            <span className="flex items-center"><User className="h-4 w-4 mr-1" /> Client: {site.customerName || "N/A"}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="w-full">
                <div className="flex space-x-1 border-b border-border mb-4 bg-muted/20 p-1 rounded-lg">
                    <button onClick={() => setActiveTab('overview')} className={`px-4 py-2 text-sm font-medium rounded-md flex items-center space-x-2 ${activeTab === 'overview' ? 'bg-background shadow-sm' : 'text-muted-foreground hover:bg-muted/50'}`}>Overview</button>
                    <button onClick={() => setActiveTab('leads')} className={`px-4 py-2 text-sm font-medium rounded-md flex items-center space-x-2 ${activeTab === 'leads' ? 'bg-background shadow-sm' : 'text-muted-foreground hover:bg-muted/50'}`}><Target className="h-4 w-4" /> <span>Leads ({leads.length})</span></button>
                    <button onClick={() => setActiveTab('quotes')} className={`px-4 py-2 text-sm font-medium rounded-md flex items-center space-x-2 ${activeTab === 'quotes' ? 'bg-background shadow-sm' : 'text-muted-foreground hover:bg-muted/50'}`}><FileText className="h-4 w-4" /> <span>Quotes ({quotations.length})</span></button>
                    <button onClick={() => setActiveTab('documents')} className={`px-4 py-2 text-sm font-medium rounded-md flex items-center space-x-2 ${activeTab === 'documents' ? 'bg-background shadow-sm' : 'text-muted-foreground hover:bg-muted/50'}`}><FileText className="h-4 w-4" /> <span>Documents ({documents.length})</span></button>
                    <button onClick={() => setActiveTab('invoices')} className={`px-4 py-2 text-sm font-medium rounded-md flex items-center space-x-2 ${activeTab === 'invoices' ? 'bg-background shadow-sm' : 'text-muted-foreground hover:bg-muted/50'}`}><Receipt className="h-4 w-4" /> <span>Invoices ({invoices.length})</span></button>
                    <button onClick={() => setActiveTab('arfs')} className={`px-4 py-2 text-sm font-medium rounded-md flex items-center space-x-2 ${activeTab === 'arfs' ? 'bg-background shadow-sm' : 'text-muted-foreground hover:bg-muted/50'}`}><DollarSign className="h-4 w-4" /> <span>ARFs ({arfs.length})</span></button>
                    <button onClick={() => setActiveTab('expenses')} className={`px-4 py-2 text-sm font-medium rounded-md flex items-center space-x-2 ${activeTab === 'expenses' ? 'bg-background shadow-sm' : 'text-muted-foreground hover:bg-muted/50'}`}><Receipt className="h-4 w-4" /> <span>Expenses ({expenses.length})</span></button>
                </div>

                {activeTab === 'overview' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         {/* Overview Cards */}
                         <div className="bg-card border border-border rounded-xl p-5">
                             <h3 className="font-semibold mb-4 text-lg">Financial Summary</h3>
                             <div className="space-y-3">
                                 <div className="flex justify-between text-sm">
                                     <span className="text-muted-foreground">Total Quotes Value</span>
                                     <span className="font-medium">Rs {quotations.reduce((sum: number, q: any) => sum + (q.grandTotal || 0), 0).toLocaleString()}</span>
                                 </div>
                                 <div className="flex justify-between text-sm">
                                     <span className="text-muted-foreground">Total Invoiced</span>
                                     <span className="font-medium">Rs {invoices.reduce((sum, i) => sum + (i.totalAmount || 0), 0).toLocaleString()}</span>
                                 </div>
                                 <div className="flex justify-between text-sm">
                                     <span className="text-muted-foreground">Total ARF Released</span>
                                     <span className="font-medium">Rs {arfs.reduce((sum, a) => sum + (a.accountsReleasedAmount || 0), 0).toLocaleString()}</span>
                                 </div>
                                 <div className="flex justify-between text-sm">
                                     <span className="text-muted-foreground">Total Expenses</span>
                                     <span className="font-medium">Rs {expenses.reduce((sum, e) => sum + (e.totalExpenseAmount || 0), 0).toLocaleString()}</span>
                                 </div>
                             </div>
                         </div>
                    </div>
                )}

                {activeTab === 'leads' && (
                    <div className="bg-card border border-border rounded-xl overflow-hidden">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-muted text-muted-foreground">
                                <tr>
                                    <th className="px-4 py-3">Lead Number</th>
                                    <th className="px-4 py-3">Salesman</th>
                                    <th className="px-4 py-3">Status</th>
                                    <th className="px-4 py-3">Date</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {leads.map(lead => (
                                    <tr key={lead.id} className="hover:bg-muted/50">
                                        <td className="px-4 py-3">{lead.leadNumber || "N/A"}</td>
                                        <td className="px-4 py-3">{lead.salesmanName}</td>
                                        <td className="px-4 py-3">{lead.status}</td>
                                        <td className="px-4 py-3">{dayjs(lead.createdAt).format("DD MMM YYYY")}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {activeTab === 'quotes' && (
                    <div className="bg-card border border-border rounded-xl overflow-hidden">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-muted text-muted-foreground">
                                <tr>
                                    <th className="px-4 py-3">Quote #</th>
                                    <th className="px-4 py-3">Subject</th>
                                    <th className="px-4 py-3">Amount</th>
                                    <th className="px-4 py-3">Date</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {quotations.map(quote => (
                                    <tr key={quote.id} className="hover:bg-muted/50">
                                        <td className="px-4 py-3 font-medium">QT-{quote.id.toString().padStart(4, '0')}</td>
                                        <td className="px-4 py-3">{quote.quoteHeadline || "N/A"}</td>
                                        <td className="px-4 py-3">Rs {quote.grandTotal?.toLocaleString()}</td>
                                        <td className="px-4 py-3">{dayjs(quote.createdAt).format("DD MMM YYYY")}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {activeTab === 'documents' && (
                     <div className="bg-card border border-border rounded-xl overflow-hidden">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-muted text-muted-foreground">
                                <tr>
                                    <th className="px-4 py-3">Document Name</th>
                                    <th className="px-4 py-3">Type</th>
                                    <th className="px-4 py-3">Customer</th>
                                    <th className="px-4 py-3">Date</th>
                                    <th className="px-4 py-3">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {documents.length === 0 ? (
                                    <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No documents found.</td></tr>
                                ) : (
                                    documents.map(doc => (
                                        <tr key={doc.id} className="hover:bg-muted/50">
                                            <td className="px-4 py-3 font-medium flex items-center space-x-2">
                                                <FileText className="h-4 w-4 text-primary" />
                                                <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">{doc.fileName}</a>
                                            </td>
                                            <td className="px-4 py-3">{doc.documentType}</td>
                                            <td className="px-4 py-3">
                                                {doc.customerName ? <span className="block">{doc.customerName}</span> : null}
                                                {doc.secondaryCustomerName ? <span className="block text-xs text-muted-foreground">{doc.secondaryCustomerName}</span> : null}
                                            </td>
                                            <td className="px-4 py-3">{dayjs(doc.createdAt).format("DD MMM YYYY")}</td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center space-x-3">
                                                    <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80 flex items-center text-sm font-medium transition-colors" title="View in browser">
                                                        <Eye className="h-4 w-4 mr-1" /> View
                                                    </a>
                                                    <button 
                                                        onClick={async () => {
                                                            try {
                                                                const response = await fetch(doc.fileUrl);
                                                                const blob = await response.blob();
                                                                const url = window.URL.createObjectURL(blob);
                                                                const link = document.createElement('a');
                                                                link.href = url;
                                                                link.download = doc.fileName;
                                                                document.body.appendChild(link);
                                                                link.click();
                                                                link.remove();
                                                                window.URL.revokeObjectURL(url);
                                                            } catch (error) {
                                                                console.error("Download failed", error);
                                                                // Fallback to opening in new tab
                                                                window.open(doc.fileUrl, '_blank');
                                                            }
                                                        }} 
                                                        className="text-primary hover:text-primary/80 flex items-center text-sm font-medium transition-colors"
                                                        title="Download file"
                                                    >
                                                        <Download className="h-4 w-4 mr-1" /> Download
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {activeTab === 'invoices' && (
                     <div className="bg-card border border-border rounded-xl overflow-hidden">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-muted text-muted-foreground">
                                <tr>
                                    <th className="px-4 py-3">Invoice #</th>
                                    <th className="px-4 py-3">Amount</th>
                                    <th className="px-4 py-3">Paid</th>
                                    <th className="px-4 py-3">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {invoices.map(inv => (
                                    <tr key={inv.id} className="hover:bg-muted/50">
                                        <td className="px-4 py-3 font-medium">{inv.invoiceNumber}</td>
                                        <td className="px-4 py-3">Rs {inv.totalAmount?.toLocaleString()}</td>
                                        <td className="px-4 py-3">Rs {inv.amountPaid?.toLocaleString()}</td>
                                        <td className="px-4 py-3">{inv.statusString}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {activeTab === 'arfs' && (
                     <div className="bg-card border border-border rounded-xl overflow-hidden">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-muted text-muted-foreground">
                                <tr>
                                    <th className="px-4 py-3">ARF Number</th>
                                    <th className="px-4 py-3">Employee</th>
                                    <th className="px-4 py-3">Requested</th>
                                    <th className="px-4 py-3">Released</th>
                                    <th className="px-4 py-3">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {arfs.map(arf => (
                                    <tr key={arf.id} className="hover:bg-muted/50">
                                        <td className="px-4 py-3 font-medium">{arf.arfNumber || `ARF-${arf.id}`}</td>
                                        <td className="px-4 py-3">{arf.employeeName}</td>
                                        <td className="px-4 py-3">Rs {arf.advanceRequested?.toLocaleString()}</td>
                                        <td className="px-4 py-3">Rs {arf.accountsReleasedAmount?.toLocaleString()}</td>
                                        <td className="px-4 py-3">{arf.status}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {activeTab === 'expenses' && (
                     <div className="bg-card border border-border rounded-xl overflow-hidden">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-muted text-muted-foreground">
                                <tr>
                                    <th className="px-4 py-3">ID</th>
                                    <th className="px-4 py-3">ARF Number</th>
                                    <th className="px-4 py-3">Total Expense</th>
                                    <th className="px-4 py-3">Date</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {expenses.map(exp => {
                                    let arfElement: React.ReactNode;
                                    if (exp.isAllocatedExcess) {
                                        arfElement = (
                                            <span className="inline-flex items-center rounded-md bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-600/20">
                                                Excess from {exp.sourceArfNumber}
                                            </span>
                                        );
                                    } else if (exp.arfReleasedAmount > 0) {
                                        if (exp.totalExpenseAmount < exp.arfReleasedAmount) {
                                            arfElement = <span className="inline-flex items-center rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/20">{exp.arfNumber || "N/A"}</span>;
                                        } else if (exp.totalExpenseAmount === exp.arfReleasedAmount) {
                                            arfElement = <span className="inline-flex items-center rounded-md bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20">{exp.arfNumber || "N/A"}</span>;
                                        } else {
                                            arfElement = <span className="font-medium">{exp.arfNumber || "N/A"}</span>;
                                        }
                                    } else {
                                        arfElement = <span>{exp.arfNumber || "N/A"}</span>;
                                    }

                                    return (
                                    <tr key={exp.id} className="hover:bg-muted/50">
                                        <td className="px-4 py-3">EXP-{exp.id.toString().padStart(4, '0')}</td>
                                        <td className="px-4 py-3">{arfElement}</td>
                                        <td className="px-4 py-3 font-medium text-emerald-600">Rs {exp.totalExpenseAmount?.toLocaleString()}</td>
                                        <td className="px-4 py-3">{dayjs(exp.createdAt).format("DD MMM YYYY")}</td>
                                    </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

            </div>
        </div>
    );
};
