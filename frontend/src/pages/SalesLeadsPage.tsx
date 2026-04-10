import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { 
    Plus, MapPin, Building, User, Target, CalendarDays, 
    CheckCircle2, Folder, Eye, CheckCircle, FileText, X, Camera, Clock
} from "lucide-react";
import toast from "react-hot-toast";
import { salesService } from "../services/salesService";
import { SalesLeadDto, SiteVisitDto } from "../types/sales";
import { useAuth } from "../auth/AuthContext";
import { useNavigate } from "react-router-dom";

export const SalesLeadsPage = () => {
    const { hasRole } = useAuth();
    const navigate = useNavigate();
    const [leads, setLeads] = useState<SalesLeadDto[]>([]);
    const [loading, setLoading] = useState(true);
    
    // View Details
    const [selectedLead, setSelectedLead] = useState<SalesLeadDto | null>(null);
    const [visits, setVisits] = useState<SiteVisitDto[]>([]);
    const [visitsLoading, setVisitsLoading] = useState(false);

    // Convert
    // 'converting' removed as navigate doesn't require async wait

    useEffect(() => {
        fetchLeads();
    }, []);

    const fetchLeads = async () => {
        setLoading(true);
        try {
            const data = await salesService.getLeads();
            setLeads(data);
        } catch (error: any) {
            toast.error(error.message || "Failed to fetch sales leads");
        } finally {
            setLoading(false);
        }
    };

    const handleViewDetails = async (lead: SalesLeadDto) => {
        setSelectedLead(lead);
        setVisitsLoading(true);
        try {
            const visitData = await salesService.getVisits(lead.id);
            setVisits(visitData);
        } catch (error: any) {
            toast.error("Failed to fetch visits for lead");
        } finally {
            setVisitsLoading(false);
        }
    };

    const handleConvertToQuotation = (leadId: number) => {
        navigate(`/quotations/new?leadId=${leadId}`);
    };

    const StatusBadge = ({ status }: { status: string }) => {
        switch (status) {
            case "New": return <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">New</span>;
            case "InProgress": return <span className="px-2 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-medium">In Progress</span>;
            case "Closed": return <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">Closed (BOQ Ready)</span>;
            case "ConvertedToQuotation": return <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">Converted</span>;
            default: return <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">{status}</span>;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-card p-6 rounded-2xl shadow-sm border border-border">
                <div>
                    <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
                        Sales Management
                    </h1>
                    <p className="text-muted-foreground mt-1">Manage sales leads, view salesman activity and evidence.</p>
                </div>
                {hasRole(["Salesman"]) && (
                    <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all flex items-center space-x-2">
                        <Plus className="h-4 w-4" />
                        <span>This view is mainly for Admins, use Dashboard instead.</span>
                    </button>
                )}
            </div>

            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            ) : (
                <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-muted/50 border-b border-border">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase">Lead #</th>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase">Customer / Site</th>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase">Salesman</th>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase">Status</th>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase">Visits</th>
                                    <th className="px-6 py-4 text-right text-xs font-medium text-muted-foreground uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {leads.map((lead) => (
                                    <tr key={lead.id} className="hover:bg-muted/30 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center space-x-2">
                                                <Target className="h-4 w-4 text-primary" />
                                                <span className="font-medium">{lead.leadNumber}</span>
                                            </div>
                                            <div className="text-xs text-muted-foreground mt-1 flex items-center">
                                                <CalendarDays className="h-3 w-3 mr-1" />
                                                {new Date(lead.createdAt).toLocaleDateString()}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-foreground">{lead.customerName}</div>
                                            <div className="text-sm text-muted-foreground flex items-center mt-1">
                                                <MapPin className="h-3 w-3 mr-1" />
                                                {lead.siteName}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center space-x-2">
                                                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                                    <User className="h-4 w-4 text-primary" />
                                                </div>
                                                <span className="text-sm">{lead.salesmanName}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <StatusBadge status={lead.status} />
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center space-x-1 text-sm font-medium">
                                                <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                                                <span>{lead.visitCount}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => handleViewDetails(lead)}
                                                className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                                            >
                                                <Eye className="h-4 w-4 mx-auto" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {leads.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                                            <Folder className="h-10 w-10 mx-auto text-muted-foreground/30 mb-2" />
                                            No sales leads found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Visit Details Modal side panel */}
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
                                    {selectedLead.customerName} - {selectedLead.siteName}
                                </p>
                            </div>
                            <button onClick={() => setSelectedLead(null)} className="p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive rounded-lg transition-colors shrink-0 ml-2">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                            
                            {/* Lead Info */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 rounded-xl bg-secondary/30 border border-border">
                                    <div className="text-sm text-muted-foreground mb-1">Status</div>
                                    <StatusBadge status={selectedLead.status} />
                                </div>
                                <div className="p-4 rounded-xl bg-secondary/30 border border-border">
                                    <div className="text-sm text-muted-foreground mb-1">Salesman</div>
                                    <div className="font-medium flex items-center space-x-2">
                                        <User className="h-4 w-4 text-primary" />
                                        <span>{selectedLead.salesmanName}</span>
                                    </div>
                                </div>
                            </div>

                            {/* BOQ / Drawing Evidence */}
                            {(selectedLead.boqFileUrl || selectedLead.drawingsFileUrl) && (
                                <div>
                                    <h3 className="text-lg font-semibold mb-3 border-b border-border pb-2 flex items-center">
                                        <Folder className="h-4 w-4 mr-2 text-primary" /> Required Documents (Lead Closed)
                                    </h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        {selectedLead.boqFileUrl && (
                                            <a href={selectedLead.boqFileUrl} target="_blank" rel="noreferrer" className="flex items-center space-x-3 p-4 border border-border rounded-xl hover:bg-secondary/30 transition-colors">
                                                <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                                                    <FileText className="h-5 w-5" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="font-medium text-sm truncate">BOQ Document</div>
                                                    <div className="text-xs text-muted-foreground">Click to view</div>
                                                </div>
                                            </a>
                                        )}
                                        {selectedLead.drawingsFileUrl && (
                                            <a href={selectedLead.drawingsFileUrl} target="_blank" rel="noreferrer" className="flex items-center space-x-3 p-4 border border-border rounded-xl hover:bg-secondary/30 transition-colors">
                                                <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                                                    <Building className="h-5 w-5" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="font-medium text-sm truncate">Drawings/Plans</div>
                                                    <div className="text-xs text-muted-foreground">Click to view</div>
                                                </div>
                                            </a>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Action Buttons for Admins */}
                            {selectedLead.status === "Closed" && !selectedLead.quotationId && hasRole(["Admin", "Manager", "Estimation"]) && (
                                <div className="p-6 bg-primary/5 border border-primary/20 rounded-xl relative overflow-hidden">
                                    <div className="absolute right-0 top-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
                                    <h3 className="text-lg font-semibold mb-2">Convert to Quotation</h3>
                                    <p className="text-sm text-muted-foreground mb-4">
                                        This lead has been successfully closed and BOQ/drawings have been requested. 
                                        You can now convert it into a Quotation draft.
                                    </p>
                                    <button 
                                        onClick={() => handleConvertToQuotation(selectedLead.id)}
                                        className="px-6 py-2 bg-primary text-primary-foreground font-medium rounded-lg shadow-sm hover:bg-primary/90 transition-all flex items-center space-x-2"
                                    >
                                        <CheckCircle className="h-4 w-4" />
                                        <span>Generate Quotation Draft</span>
                                    </button>
                                </div>
                            )}


                            {/* Visit Timeline */}
                            <div>
                                <h3 className="text-lg font-semibold mb-4 flex items-center">
                                    <MapPin className="h-4 w-4 mr-2 text-primary" /> Visit History Tracker
                                </h3>
                                
                                {visitsLoading ? (
                                    <div className="flex justify-center p-8">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                                    </div>
                                ) : visits.length === 0 ? (
                                    <div className="p-8 text-center border-2 border-dashed border-border rounded-xl text-muted-foreground">
                                        No site visits recorded yet.
                                    </div>
                                ) : (
                                    <div className="space-y-4 relative pl-8 before:absolute before:left-[15px] before:top-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-primary/50 before:via-border before:to-transparent">
                                        {visits.map((visit, idx) => (
                                            <div key={visit.id} className="relative">
                                                {/* Timeline dot */}
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

                                                    {/* Time range */}
                                                    {visit.startTime && (
                                                        <div className="text-xs text-muted-foreground flex items-center space-x-3 mb-2">
                                                            <span className="flex items-center"><Clock className="h-3 w-3 mr-1" /> In: {new Date(visit.startTime).toLocaleTimeString()}</span>
                                                            {visit.endTime && <span className="flex items-center"><Clock className="h-3 w-3 mr-1" /> Out: {new Date(visit.endTime).toLocaleTimeString()}</span>}
                                                        </div>
                                                    )}

                                                    <p className="text-sm text-muted-foreground break-words">
                                                        {visit.meetingNotes || <span className="italic text-muted-foreground/50">No meeting notes provided.</span>}
                                                    </p>

                                                    {/* GPS Data */}
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

                                                    {/* Photos Evidence */}
                                                    {visit.photos && visit.photos.length > 0 && (
                                                        <div className="mt-3">
                                                            <div className="text-xs font-semibold text-muted-foreground mb-2 flex items-center">
                                                                <Camera className="h-3 w-3 mr-1" /> Evidence Photos ({visit.photos.length})
                                                            </div>
                                                            <div className="flex overflow-x-auto space-x-2 pb-1 custom-scrollbar">
                                                                {visit.photos.map(p => (
                                                                    <div key={p.id} className="relative flex-none w-20 h-20 rounded-lg overflow-hidden border border-border group/photo cursor-pointer">
                                                                        <img src={p.photoUrl} alt="Evidence" className="w-full h-full object-cover transition-transform duration-300 group-hover/photo:scale-110" />
                                                                        {p.caption && (
                                                                            <div className="absolute bottom-0 inset-x-0 bg-background/80 backdrop-blur text-[8px] p-0.5 truncate text-center">
                                                                                {p.caption}
                                                                            </div>
                                                                        )}
                                                                        <a href={p.photoUrl} target="_blank" rel="noreferrer" className="absolute inset-0 z-10"></a>
                                                                    </div>
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
