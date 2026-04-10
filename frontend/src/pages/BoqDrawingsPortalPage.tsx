import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
    Loader2, FileText, ChevronRight, Eye, X, MapPin,
    Clock, Camera, Target, Building, User, Folder, CheckCircle
} from "lucide-react";
import { salesService } from "../services/salesService";
import { SalesLeadDto, SiteVisitDto } from "../types/sales";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";


export const BoqDrawingsPortalPage = () => {
    const [leads, setLeads] = useState<SalesLeadDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedLead, setSelectedLead] = useState<SalesLeadDto | null>(null);
    const [visits, setVisits] = useState<SiteVisitDto[]>([]);
    const [visitsLoading, setVisitsLoading] = useState(false);
    const navigate = useNavigate();
    // auth context available via useAuth() if needed

    const fetchQueue = async () => {
        try {
            setLoading(true);
            const data = await salesService.getLeads();
            // Show leads that have BOQ or Drawings uploaded (Closed or ConvertedToQuotation)
            const queue = data.filter(l =>
                l.status === "Closed" || l.status === "ConvertedToQuotation"
            );
            setLeads(queue);
        } catch (error) {
            toast.error("Failed to load BOQ queue.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchQueue();
    }, []);

    const handleViewDetails = async (lead: SalesLeadDto) => {
        setSelectedLead(lead);
        setVisitsLoading(true);
        try {
            const data = await salesService.getVisits(lead.id);
            setVisits(data);
        } catch {
            setVisits([]);
        } finally {
            setVisitsLoading(false);
        }
    };

    const handleAcceptAndDraft = (leadId: number) => {
        navigate(`/quotations/new?leadId=${leadId}`);
    };

    const getStatusBadge = (lead: SalesLeadDto) => {
        if (lead.quotationId) {
            return (
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-500/20 text-purple-400 border border-purple-500/30">
                    Quote Generated
                </span>
            );
        }
        return (
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Ready for Quote
            </span>
        );
    };

    const pendingCount = leads.filter(l => !l.quotationId).length;
    const convertedCount = leads.filter(l => !!l.quotationId).length;

    return (
        <div className="p-8 animate-in fade-in duration-500">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">BOQ / Drawings Portal</h1>
                    <p className="text-muted-foreground mt-1 text-sm">View BOQ documents, drawings, and generate quotations from closed leads.</p>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-secondary/30 border border-border/50 rounded-xl p-4">
                    <div className="text-sm text-muted-foreground">Total Leads</div>
                    <div className="text-2xl font-bold text-foreground">{leads.length}</div>
                </div>
                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4">
                    <div className="text-sm text-emerald-400">Pending Quotation</div>
                    <div className="text-2xl font-bold text-emerald-400">{pendingCount}</div>
                </div>
                <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4">
                    <div className="text-sm text-purple-400">Quote Generated</div>
                    <div className="text-2xl font-bold text-purple-400">{convertedCount}</div>
                </div>
            </div>

            <div className="bg-secondary/30 border border-border/50 rounded-2xl overflow-hidden backdrop-blur-sm shadow-xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-muted-foreground uppercase bg-secondary/50 border-b border-border/40">
                            <tr>
                                <th className="px-6 py-4 font-medium">Lead Reference</th>
                                <th className="px-6 py-4 font-medium">Client / Site</th>
                                <th className="px-6 py-4 font-medium">Salesman</th>
                                <th className="px-6 py-4 font-medium">Documents</th>
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
                            ) : leads.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                                        No leads with BOQ/Drawings found.
                                    </td>
                                </tr>
                            ) : (
                                leads.map((lead) => (
                                    <tr key={lead.id} className="hover:bg-secondary/50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-foreground">
                                            <div className="font-mono text-sm">{lead.leadNumber}</div>
                                            <div className="text-xs text-muted-foreground mt-0.5">
                                                {new Date(lead.createdAt).toLocaleDateString()}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-medium">{lead.customerName}</div>
                                            <div className="text-xs text-muted-foreground mt-0.5 max-w-[200px] truncate">{lead.siteName}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center space-x-2">
                                                <div className="h-6 w-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold">
                                                    {lead.salesmanName?.charAt(0) || "?"}
                                                </div>
                                                <span className="text-sm font-medium">{lead.salesmanName}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col space-y-1.5">
                                                {lead.boqFileUrl ? (
                                                    <a href={lead.boqFileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center space-x-2 text-xs font-medium text-blue-500 hover:underline">
                                                        <FileText className="h-3.5 w-3.5" />
                                                        <span>BOQ Document</span>
                                                    </a>
                                                ) : <span className="text-xs text-muted-foreground/50">No BOQ</span>}
                                                {lead.drawingsFileUrl ? (
                                                    <a href={lead.drawingsFileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center space-x-2 text-xs font-medium text-purple-500 hover:underline">
                                                        <FileText className="h-3.5 w-3.5" />
                                                        <span>Drawings</span>
                                                    </a>
                                                ) : <span className="text-xs text-muted-foreground/50">No Drawings</span>}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {getStatusBadge(lead)}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end space-x-2">
                                                <button
                                                    onClick={() => handleViewDetails(lead)}
                                                    title="View Details & Visit History"
                                                    className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </button>
                                                {!lead.quotationId ? (
                                                    <button
                                                        onClick={() => handleAcceptAndDraft(lead.id)}
                                                        className="bg-primary text-primary-foreground px-3 py-1.5 flex items-center space-x-1.5 text-xs font-medium rounded-lg shadow hover:-translate-y-0.5 transition-all"
                                                    >
                                                        <span>Draft Quote</span>
                                                        <ChevronRight className="h-3.5 w-3.5" />
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => navigate(`/quotations/edit/${lead.quotationId}`)}
                                                        className="bg-purple-500/20 text-purple-400 border border-purple-500/30 px-3 py-1.5 flex items-center space-x-1.5 text-xs font-medium rounded-lg hover:bg-purple-500/30 transition-all"
                                                    >
                                                        <span>View Quotation</span>
                                                        <ChevronRight className="h-3.5 w-3.5" />
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

            {/* Detail Side Panel (Portal) */}
            {selectedLead && createPortal(
                <div className="fixed inset-0 z-[9999] flex justify-end">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setSelectedLead(null)} />
                    <div className="relative w-full max-w-2xl bg-card h-full border-l border-border shadow-2xl flex flex-col animate-in slide-in-from-right duration-300 overflow-hidden">
                        <div className="p-5 border-b border-border flex items-center justify-between bg-muted/30 shrink-0">
                            <div className="min-w-0">
                                <h2 className="text-lg font-bold flex items-center space-x-2">
                                    <Target className="h-5 w-5 text-primary shrink-0" />
                                    <span className="truncate">{selectedLead.leadNumber}</span>
                                </h2>
                                <p className="text-sm text-muted-foreground mt-0.5 truncate">
                                    {selectedLead.customerName} — {selectedLead.siteName}
                                </p>
                            </div>
                            <button onClick={() => setSelectedLead(null)} className="p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive rounded-lg transition-colors shrink-0 ml-2">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                            {/* Lead Info */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 rounded-xl bg-secondary/30 border border-border">
                                    <div className="text-xs text-muted-foreground mb-1">Status</div>
                                    {getStatusBadge(selectedLead)}
                                </div>
                                <div className="p-4 rounded-xl bg-secondary/30 border border-border">
                                    <div className="text-xs text-muted-foreground mb-1">Salesman</div>
                                    <div className="font-medium flex items-center space-x-2 text-sm">
                                        <User className="h-4 w-4 text-primary" />
                                        <span>{selectedLead.salesmanName}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Documents */}
                            <div>
                                <h3 className="text-sm font-semibold mb-3 border-b border-border pb-2 flex items-center uppercase tracking-wider text-muted-foreground">
                                    <Folder className="h-4 w-4 mr-2 text-primary" /> Lead Documents
                                </h3>
                                <div className="grid grid-cols-2 gap-3">
                                    {selectedLead.boqFileUrl ? (
                                        <a href={selectedLead.boqFileUrl} target="_blank" rel="noreferrer" className="flex items-center space-x-3 p-4 border border-border rounded-xl hover:bg-secondary/30 transition-colors">
                                            <div className="h-10 w-10 bg-blue-500/10 rounded-lg flex items-center justify-center text-blue-500">
                                                <FileText className="h-5 w-5" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="font-medium text-sm">BOQ Document</div>
                                                <div className="text-xs text-blue-500">Click to download</div>
                                            </div>
                                        </a>
                                    ) : (
                                        <div className="flex items-center space-x-3 p-4 border border-dashed border-border/50 rounded-xl opacity-40">
                                            <div className="h-10 w-10 bg-secondary/50 rounded-lg flex items-center justify-center text-muted-foreground">
                                                <FileText className="h-5 w-5" />
                                            </div>
                                            <div className="text-sm text-muted-foreground">No BOQ uploaded</div>
                                        </div>
                                    )}
                                    {selectedLead.drawingsFileUrl ? (
                                        <a href={selectedLead.drawingsFileUrl} target="_blank" rel="noreferrer" className="flex items-center space-x-3 p-4 border border-border rounded-xl hover:bg-secondary/30 transition-colors">
                                            <div className="h-10 w-10 bg-purple-500/10 rounded-lg flex items-center justify-center text-purple-500">
                                                <Building className="h-5 w-5" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="font-medium text-sm">Drawings / Plans</div>
                                                <div className="text-xs text-purple-500">Click to download</div>
                                            </div>
                                        </a>
                                    ) : (
                                        <div className="flex items-center space-x-3 p-4 border border-dashed border-border/50 rounded-xl opacity-40">
                                            <div className="h-10 w-10 bg-secondary/50 rounded-lg flex items-center justify-center text-muted-foreground">
                                                <Building className="h-5 w-5" />
                                            </div>
                                            <div className="text-sm text-muted-foreground">No drawings uploaded</div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Generate Quotation Action */}
                            {!selectedLead.quotationId && (
                                <div className="p-5 bg-primary/5 border border-primary/20 rounded-xl relative overflow-hidden">
                                    <div className="absolute right-0 top-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
                                    <h3 className="text-base font-semibold mb-1">Generate Quotation</h3>
                                    <p className="text-xs text-muted-foreground mb-3">
                                        Convert this lead into a quotation draft. BOQ and drawings references will be linked automatically.
                                    </p>
                                    <button
                                        onClick={() => handleAcceptAndDraft(selectedLead.id)}
                                        className="px-5 py-2 bg-primary text-primary-foreground font-medium rounded-lg shadow-sm hover:bg-primary/90 transition-all flex items-center space-x-2 text-sm"
                                    >
                                        <CheckCircle className="h-4 w-4" />
                                        <span>Draft Quote from this Lead</span>
                                    </button>
                                </div>
                            )}

                            {selectedLead.quotationId && (
                                <div className="p-5 bg-purple-500/5 border border-purple-500/20 rounded-xl">
                                    <h3 className="text-base font-semibold mb-1 text-purple-400">Quotation Already Generated</h3>
                                    <p className="text-xs text-muted-foreground mb-3">
                                        A quotation has already been drafted from this lead.
                                    </p>
                                    <button
                                        onClick={() => navigate(`/quotations/edit/${selectedLead.quotationId}`)}
                                        className="px-5 py-2 bg-purple-500/20 text-purple-400 border border-purple-500/30 font-medium rounded-lg hover:bg-purple-500/30 transition-all flex items-center space-x-2 text-sm"
                                    >
                                        <FileText className="h-4 w-4" />
                                        <span>Open Quotation</span>
                                    </button>
                                </div>
                            )}

                            {/* Visit History */}
                            <div>
                                <h3 className="text-sm font-semibold mb-3 border-b border-border pb-2 flex items-center uppercase tracking-wider text-muted-foreground">
                                    <MapPin className="h-4 w-4 mr-2 text-primary" /> Site Visit History
                                </h3>

                                {visitsLoading ? (
                                    <div className="flex justify-center py-8">
                                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                                    </div>
                                ) : visits.length === 0 ? (
                                    <div className="p-6 text-center border-2 border-dashed border-border rounded-xl text-muted-foreground text-sm">
                                        No site visits recorded.
                                    </div>
                                ) : (
                                    <div className="space-y-3 relative pl-8 before:absolute before:left-[15px] before:top-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-primary/50 before:via-border before:to-transparent">
                                        {visits.map((visit, idx) => (
                                            <div key={visit.id} className="relative">
                                                <div className="absolute -left-8 top-4 flex items-center justify-center w-7 h-7 rounded-full border-[3px] border-background bg-primary text-primary-foreground shadow z-10 font-bold text-[10px]">
                                                    {visit.visitNumber}
                                                </div>
                                                <div className="p-4 rounded-xl border border-border bg-card shadow-sm transition-all hover:border-primary/50">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <div className="font-bold text-foreground text-sm">Visit {idx + 1}</div>
                                                        <time className="text-[11px] font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                                                            {new Date(visit.createdAt).toLocaleDateString()}
                                                        </time>
                                                    </div>

                                                    {visit.startTime && (
                                                        <div className="text-xs text-muted-foreground flex items-center space-x-3 mb-2">
                                                            <span className="flex items-center"><Clock className="h-3 w-3 mr-1" /> In: {new Date(visit.startTime).toLocaleTimeString()}</span>
                                                            {visit.endTime && <span className="flex items-center"><Clock className="h-3 w-3 mr-1" /> Out: {new Date(visit.endTime).toLocaleTimeString()}</span>}
                                                        </div>
                                                    )}

                                                    <p className="text-sm text-muted-foreground break-words">
                                                        {visit.meetingNotes || <span className="italic text-muted-foreground/50">No meeting notes.</span>}
                                                    </p>

                                                    <div className="mt-3 pt-3 border-t border-border grid grid-cols-2 gap-2 text-xs">
                                                        <div className="bg-secondary/30 p-2 rounded-lg">
                                                            <div className="font-semibold text-muted-foreground mb-1">Check-in</div>
                                                            {visit.startLatitude ? (
                                                                <a href={`https://maps.google.com/?q=${visit.startLatitude},${visit.startLongitude}`} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline flex items-center">
                                                                    <MapPin className="h-3 w-3 mr-1" /> View Map
                                                                </a>
                                                            ) : "N/A"}
                                                        </div>
                                                        <div className="bg-secondary/30 p-2 rounded-lg">
                                                            <div className="font-semibold text-muted-foreground mb-1">Check-out</div>
                                                            {visit.endLatitude ? (
                                                                <a href={`https://maps.google.com/?q=${visit.endLatitude},${visit.endLongitude}`} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline flex items-center">
                                                                    <MapPin className="h-3 w-3 mr-1" /> View Map
                                                                </a>
                                                            ) : "N/A"}
                                                        </div>
                                                    </div>

                                                    {visit.photos && visit.photos.length > 0 && (
                                                        <div className="mt-3">
                                                            <div className="text-xs font-semibold text-muted-foreground mb-1.5 flex items-center">
                                                                <Camera className="h-3 w-3 mr-1" /> Photos ({visit.photos.length})
                                                            </div>
                                                            <div className="flex overflow-x-auto space-x-2 pb-1 custom-scrollbar">
                                                                {visit.photos.map(p => (
                                                                    <a key={p.id} href={p.photoUrl} target="_blank" rel="noreferrer" className="relative flex-none w-16 h-16 rounded-lg overflow-hidden border border-border hover:border-primary transition-colors">
                                                                        <img src={p.photoUrl} alt="Evidence" className="w-full h-full object-cover" />
                                                                    </a>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>, document.body
            )}
        </div>
    );
};
