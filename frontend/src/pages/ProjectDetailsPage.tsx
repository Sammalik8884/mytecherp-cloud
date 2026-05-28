import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { siteService } from "../services/siteService";
import { amountRequestApi, AmountRequestFormDto } from "../api/amountRequestApi";
import { expenseApi } from "../api/expenseApi";
import { quotationService } from "../services/quotationService";
import { invoiceService } from "../services/invoiceService";
import { salesService } from "../services/salesService";
import { siteDocumentService, SiteDocumentDto } from "../services/siteDocumentService";
import { materialReceivingService, MaterialReceivingFormDto } from "../services/materialReceivingService";
import { Wrench } from "lucide-react";

import { SiteDto } from "../types/site";
import { ExpenseDto } from "../api/expenseApi";
import { QuotationDto } from "../services/quotationService";
import { InvoiceDto } from "../types/finance";
import { SalesLeadDto } from "../types/sales";

import { FileText, MapPin, DollarSign, Receipt, Download, Eye, User, Target } from "lucide-react";
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
    const [materialReceiving, setMaterialReceiving] = useState<MaterialReceivingFormDto[]>([]);

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
        const handleRefreshMaterial = () => {
            materialReceivingService.getFormsBySiteId(siteId).then(setMaterialReceiving);
        };
        window.addEventListener('REFRESH_PROJECT_DOCUMENTS', handleRefresh);
        window.addEventListener('REFRESH_MATERIAL_RECEIVING_LIST', handleRefreshMaterial);
        return () => {
            window.removeEventListener('REFRESH_PROJECT_DOCUMENTS', handleRefresh);
            window.removeEventListener('REFRESH_MATERIAL_RECEIVING_LIST', handleRefreshMaterial);
        };
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
                documentData,
                materialReceivingData
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
                }),
                materialReceivingService.getFormsBySiteId(siteId).catch(err => {
                    console.error("Failed to load material receiving forms", err);
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
            setMaterialReceiving(materialReceivingData);
            
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
                    <button onClick={() => setActiveTab('material_receiving')} className={`px-4 py-2 text-sm font-medium rounded-md flex items-center space-x-2 ${activeTab === 'material_receiving' ? 'bg-background shadow-sm' : 'text-muted-foreground hover:bg-muted/50'}`}><Wrench className="h-4 w-4" /> <span>Project Tool Site ({materialReceiving.length})</span></button>
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

                {activeTab === 'material_receiving' && (
                    <div className="bg-card border border-border rounded-xl p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-semibold text-lg">Project Tool Site List</h3>
                            <button 
                                onClick={() => {
                                    window.dispatchEvent(new CustomEvent('OPEN_MATERIAL_RECEIVING_MODAL'));
                                }}
                                className="bg-emerald-600 text-white px-4 py-2 rounded text-sm hover:bg-emerald-700 transition-colors"
                            >
                                + Add Form
                            </button>
                        </div>
                        {materialReceiving.length === 0 ? (
                            <div className="text-center p-8 text-muted-foreground border border-dashed border-border rounded-lg">
                                No project tool site forms found for this site.
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {materialReceiving.map((list) => (
                                    <div key={list.id} className="bg-background border border-border rounded-lg overflow-hidden shadow-sm">
                                        <div className="bg-secondary/50 px-4 py-3 border-b border-border flex justify-between items-center">
                                            <div>
                                                <span className="font-medium">Form #{list.id}</span>
                                                <span className="text-xs text-muted-foreground ml-2">Created by: {list.createdByUserName || "System"}</span>
                                            </div>
                                            <span className="text-xs text-muted-foreground">
                                                {new Date(list.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <div className="p-0 overflow-x-auto">
                                            <table className="w-full text-sm text-left">
                                                <thead className="bg-muted/30 text-muted-foreground border-b border-border">
                                                    <tr>
                                                        <th className="px-4 py-3 font-semibold w-16">No.</th>
                                                        <th className="px-4 py-3 font-semibold">Items</th>
                                                        <th className="px-4 py-3 font-semibold">Delivered</th>
                                                        <th className="px-4 py-3 font-semibold">Received</th>
                                                        <th className="px-4 py-3 font-semibold">Remarks</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-border">
                                                    {list.items.map((item, idx) => (
                                                        <tr key={idx} className="hover:bg-muted/10 transition-colors">
                                                            <td className="px-4 py-3 text-muted-foreground">{idx + 1}:</td>
                                                            <td className="px-4 py-3 font-medium">{item.itemName}</td>
                                                            <td className="px-4 py-3">{item.locationValue || "-"}</td>
                                                            <td className="px-4 py-3">{item.received || "-"}</td>
                                                            <td className="px-4 py-3 text-muted-foreground">{item.remarks || "-"}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
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
                                                    <a 
                                                        href={doc.downloadUrl} 
                                                        className="text-primary hover:text-primary/80 flex items-center text-sm font-medium transition-colors"
                                                        title="Download file"
                                                    >
                                                        <Download className="h-4 w-4 mr-1" /> Download
                                                    </a>
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
