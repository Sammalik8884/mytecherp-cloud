import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
    Loader2, FileText, ChevronRight, Eye, X, MapPin,
    Clock, Camera, Target, Building, User, Folder, CheckCircle, Search
} from "lucide-react";
import { salesService } from "../services/salesService";
import { SalesLeadDto, SiteVisitDto } from "../types/sales";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { authService } from "../services/authService";
import { UserDto } from "../types/auth";


type TabKey = 'all' | 'pending' | 'generated';
const TABS: { key: TabKey; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'pending', label: 'Pending Quotation' },
    { key: 'generated', label: 'Quote Generated' },
];

export const BoqDrawingsPortalPage = () => {
    const [activeTab, setActiveTab] = useState<TabKey>('all');
    const [leads, setLeads] = useState<SalesLeadDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedLead, setSelectedLead] = useState<SalesLeadDto | null>(null);
    const [visits, setVisits] = useState<SiteVisitDto[]>([]);
    const [visitsLoading, setVisitsLoading] = useState(false);
    const navigate = useNavigate();
    const { user, hasRole } = useAuth();
    
    // Check if user is the super assigner (CEO or Admin)
    const isSuperAssigner = hasRole(['CEO', 'Project Director']);
    const isRegularAssigner = user?.email?.toLowerCase() === 'm.huzefa@mytecheng.com' || user?.email?.toLowerCase() === 'ali.azeem@mytecheng.com';
    const isAssigner = isSuperAssigner || isRegularAssigner;

    // Assignment Modal State
    const [assignModalOpen, setAssignModalOpen] = useState(false);
    const [estimators, setEstimators] = useState<UserDto[]>([]);
    const [searchEstimator, setSearchEstimator] = useState("");
    const [assigningLead, setAssigningLead] = useState<SalesLeadDto | null>(null);
    const [estimatorsLoading, setEstimatorsLoading] = useState(false);

    // Photo lightbox
    const [selectedImage, setSelectedImage] = useState<string | null>(null);


    const fetchQueue = async () => {
        try {
            setLoading(true);
            const [data, allUsers] = await Promise.all([
                salesService.getLeads(),
                authService.getUsers().catch(() => []) // Fallback to empty if fails
            ]);
            
            const myUser = allUsers.find(u => u.email === user?.email);
            const myUserId = myUser?.id;

            // Filter leads based on role
            const queue = data.filter(l => {
                const isValidStatus = l.status === "Closed" || l.status === "ConvertedToQuotation";
                if (!isValidStatus) return false;
                
                if (isSuperAssigner) return true;
                
                // Huzefa can see all BOQ leads to assign and track them
                if (user?.email?.toLowerCase() === 'm.huzefa@mytecheng.com') {
                    return true;
                }
                
                // If regular assigner (Ali), only see leads they created or leads assigned to them
                if (isRegularAssigner && myUserId) {
                    if (l.salesmanUserId === myUserId || l.assignedEstimatorId === myUserId) return true;
                }
                
                // For anyone else (like other estimators), only see if assigned to them
                if (!isSuperAssigner && !isRegularAssigner && myUserId && l.assignedEstimatorId === myUserId) return true;
                
                return false;
            });
            
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

    const handleOpenAssignModal = async (lead: SalesLeadDto) => {
        setAssigningLead(lead);
        setAssignModalOpen(true);
        setEstimatorsLoading(true);
        try {
            const users = await authService.getUsers();
            // Filter to only Estimation or Managers
            const eligibleUsers = users.filter((u: any) => {
                const isEstOrDir = u.roles?.includes('Estimation') || u.roles?.includes('Project Director');
                const currentUserEmail = user?.email?.toLowerCase();
                
                // Huzefa can assign to Ali and Riffat, but NOT himself (and hide Shahbaz)
                if (currentUserEmail === 'm.huzefa@mytecheng.com') {
                    const email = u.email?.toLowerCase();
                    if (email === 'm.huzefa@mytecheng.com' || email === 'shahbaz.ali@mytecheng.com') {
                        return false;
                    }
                }
                
                // Ali can ONLY assign to Riffat or himself
                if (currentUserEmail === 'ali.azeem@mytecheng.com') {
                    const email = u.email?.toLowerCase();
                    if (email !== 'riffat.nazir@mytecheng.com' && email !== 'ali.azeem@mytecheng.com') {
                        return false;
                    }
                }
                
                return isEstOrDir;
            });
            setEstimators(eligibleUsers);
        } catch (error) {
            toast.error("Failed to load estimators.");
        } finally {
            setEstimatorsLoading(false);
        }
    };

    const handleAssignEstimator = async (estimatorId: string) => {
        if (!assigningLead) return;
        try {
            await salesService.assignEstimator(assigningLead.id, estimatorId);
            toast.success("Estimator assigned successfully.");
            setAssignModalOpen(false);
            fetchQueue();
        } catch (error) {
            toast.error("Failed to assign estimator.");
        }
    };

    const getStatusBadge = (lead: SalesLeadDto) => {
        if (lead.quotationId) {
            return (
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-500/20 text-purple-400 border border-purple-500/30">
                    Quote Generated
                </span>
            );
        }
        if (lead.assignedEstimatorName) {
            const shortName = lead.assignedEstimatorName.split(' ')[0].toLowerCase();
            return (
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-500/20 text-blue-400 border border-blue-500/30">
                    At {shortName}
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

    const tabCounts = {
        all: leads.length,
        pending: pendingCount,
        generated: convertedCount
    };

    const filteredLeads = leads.filter(lead => {
        if (activeTab === 'pending') return !lead.quotationId;
        if (activeTab === 'generated') return !!lead.quotationId;
        return true;
    });

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
                                        No {activeTab !== 'all' ? `"${TABS.find(t => t.key === activeTab)?.label}" ` : ''}leads found.
                                    </td>
                                </tr>
                            ) : (
                                filteredLeads.map((lead) => (
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
                                                {lead.drawingsFileUrls && lead.drawingsFileUrls.length > 0 ? (
                                                    lead.drawingsFileUrls.map((url, i) => (
                                                        <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="flex items-center space-x-2 text-xs font-medium text-purple-500 hover:underline">
                                                            <FileText className="h-3.5 w-3.5" />
                                                            <span>Drawings {lead.drawingsFileUrls!.length > 1 ? i + 1 : ''}</span>
                                                        </a>
                                                    ))
                                                ) : lead.drawingsFileUrl ? (
                                                    <a href={lead.drawingsFileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center space-x-2 text-xs font-medium text-purple-500 hover:underline">
                                                        <FileText className="h-3.5 w-3.5" />
                                                        <span>Drawings</span>
                                                    </a>
                                                ) : <span className="text-xs text-muted-foreground/50">No Drawings</span>}
                                                {lead.extraFileUrls && lead.extraFileUrls.length > 0 && lead.extraFileUrls.map((url, i) => (
                                                    <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="flex items-center space-x-2 text-xs font-medium text-amber-500 hover:underline">
                                                        <FileText className="h-3.5 w-3.5" />
                                                        <span>Extra Doc {i + 1}</span>
                                                    </a>
                                                ))}
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
                                                    lead.assignedEstimatorId ? (
                                                        // Lead is assigned — show badge + re-assign button for Huzefa
                                                        <div className="flex items-center gap-2">
                                                            <div className="flex items-center gap-1.5 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-medium px-2.5 py-1 rounded-lg">
                                                                <User className="h-3 w-3" />
                                                                <span>{lead.assignedEstimatorName || 'Assigned'}</span>
                                                            </div>
                                                            {isAssigner && (
                                                                <button
                                                                    onClick={() => handleOpenAssignModal(lead)}
                                                                    className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                                                                    title="Re-assign estimator"
                                                                >
                                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                                                                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                                                    </svg>
                                                                </button>
                                                            )}
                                                            <button
                                                                onClick={() => handleAcceptAndDraft(lead.id)}
                                                                className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-1.5 flex items-center space-x-1.5 text-xs font-medium rounded-lg hover:bg-emerald-500/30 transition-all"
                                                            >
                                                                <span>Draft Quote</span>
                                                                <ChevronRight className="h-3.5 w-3.5" />
                                                            </button>
                                                        </div>
                                                    ) : isAssigner ? (
                                                        <button
                                                            onClick={() => handleOpenAssignModal(lead)}
                                                            className="bg-primary text-primary-foreground px-3 py-1.5 flex items-center space-x-1.5 text-xs font-medium rounded-lg shadow hover:-translate-y-0.5 transition-all"
                                                        >
                                                            <span>Assign Estimator</span>
                                                            <ChevronRight className="h-3.5 w-3.5" />
                                                        </button>
                                                    ) : (
                                                        <span className="text-xs text-muted-foreground italic">Awaiting assignment</span>
                                                    )
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
                    <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" onClick={() => setSelectedLead(null)} />
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
                                    {selectedLead.drawingsFileUrls && selectedLead.drawingsFileUrls.length > 0 ? (
                                        <div className="space-y-3">
                                            {selectedLead.drawingsFileUrls.map((url, i) => (
                                                <a key={i} href={url} target="_blank" rel="noreferrer" className="flex items-center space-x-3 p-4 border border-border rounded-xl hover:bg-secondary/30 transition-colors">
                                                    <div className="h-10 w-10 bg-purple-500/10 rounded-lg flex items-center justify-center text-purple-500">
                                                        <Building className="h-5 w-5" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="font-medium text-sm">Drawings / Plans {selectedLead.drawingsFileUrls!.length > 1 ? `(${i + 1})` : ''}</div>
                                                        <div className="text-xs text-purple-500">Click to download</div>
                                                    </div>
                                                </a>
                                            ))}
                                        </div>
                                    ) : selectedLead.drawingsFileUrl ? (
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
                                {/* Extra / Additional Files */}
                                {selectedLead.extraFileUrls && selectedLead.extraFileUrls.length > 0 && (
                                    <div className="mt-3">
                                        <div className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Additional Documents ({selectedLead.extraFileUrls.length})</div>
                                        <div className="grid grid-cols-1 gap-2">
                                            {selectedLead.extraFileUrls.map((url, i) => {
                                                const filename = url.split('/').pop()?.split('?')[0] || `Document ${i + 1}`;
                                                return (
                                                    <a key={i} href={url} target="_blank" rel="noreferrer" className="flex items-center space-x-3 p-3 border border-amber-500/30 bg-amber-500/5 rounded-xl hover:bg-amber-500/10 transition-colors">
                                                        <div className="h-8 w-8 bg-amber-500/10 rounded-lg flex items-center justify-center text-amber-500 shrink-0">
                                                            <FileText className="h-4 w-4" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="font-medium text-sm truncate">{filename}</div>
                                                            <div className="text-xs text-amber-500">Additional Doc {i + 1} · Click to open</div>
                                                        </div>
                                                    </a>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
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
                                                                <Camera className="h-3 w-3 mr-1" /> Evidence Photos ({visit.photos.length})
                                                            </div>
                                                            {/* First photo — prominent */}
                                                            <button
                                                                type="button"
                                                                onClick={() => setSelectedImage(visit.photos[0].photoUrl)}
                                                                className="w-full rounded-xl overflow-hidden border border-border mb-2 focus:outline-none hover:border-primary transition-colors"
                                                            >
                                                                <img
                                                                    src={visit.photos[0].photoUrl}
                                                                    alt="Evidence"
                                                                    className="w-full h-48 object-cover"
                                                                />
                                                            </button>
                                                            {/* Remaining photos as thumbnails */}
                                                            {visit.photos.length > 1 && (
                                                                <div className="flex overflow-x-auto space-x-2 pb-1 custom-scrollbar">
                                                                    {visit.photos.slice(1).map(p => (
                                                                        <button
                                                                            key={p.id}
                                                                            type="button"
                                                                            onClick={() => setSelectedImage(p.photoUrl)}
                                                                            className="relative flex-none w-16 h-16 rounded-lg overflow-hidden border border-border hover:border-primary transition-colors focus:outline-none"
                                                                        >
                                                                            <img src={p.photoUrl} alt="Evidence" className="w-full h-full object-cover" />
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            )}
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

            {/* Assign Estimator Modal */}
            {assignModalOpen && assigningLead && createPortal(
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" onClick={() => setAssignModalOpen(false)} />
                    <div className="relative w-full max-w-md bg-card rounded-2xl border border-border shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-5 border-b border-border flex items-center justify-between bg-muted/30">
                            <div>
                                <h2 className="text-lg font-bold">Assign Estimator</h2>
                                <p className="text-xs text-muted-foreground mt-0.5">Select a member to assign this BOQ.</p>
                            </div>
                            <button onClick={() => setAssignModalOpen(false)} className="p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive rounded-lg transition-colors">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <div className="p-5">
                            <div className="relative mb-4">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <input
                                    type="text"
                                    placeholder="Search members..."
                                    value={searchEstimator}
                                    onChange={(e) => setSearchEstimator(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2 bg-secondary/50 border border-border rounded-xl text-sm focus:outline-none focus:border-primary/50"
                                />
                            </div>
                            
                            <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar">
                                {estimatorsLoading ? (
                                    <div className="flex justify-center py-6">
                                        <Loader2 className="h-6 w-6 animate-spin text-primary opacity-50" />
                                    </div>
                                ) : (
                                    estimators
                                        .filter(e => (e.fullName || '').toLowerCase().includes(searchEstimator.toLowerCase()))
                                        .map(estimator => (
                                            <button
                                                key={estimator.id}
                                                onClick={() => handleAssignEstimator(estimator.id!)}
                                                className="w-full flex items-center space-x-3 p-3 rounded-xl border border-border/50 bg-secondary/20 hover:bg-primary/10 hover:border-primary/30 transition-all text-left"
                                            >
                                                <div className="h-10 w-10 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-sm shrink-0">
                                                    {(estimator.fullName || estimator.email).charAt(0).toUpperCase()}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="font-semibold text-sm truncate">{estimator.fullName || estimator.email}</div>
                                                    <div className="text-xs text-muted-foreground truncate">{estimator.designation || estimator.roles?.join(', ')}</div>
                                                </div>
                                            </button>
                                        ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>, document.body
            )}

            {selectedImage && createPortal(
                <div className="fixed inset-0 flex items-center justify-center animate-in fade-in duration-200" style={{ zIndex: 99999 }}>
                    <div className="absolute inset-0 bg-black/85 backdrop-blur-sm cursor-pointer" onClick={() => setSelectedImage(null)} />
                    <button
                        onClick={() => setSelectedImage(null)}
                        className="absolute top-4 right-4 text-white hover:text-gray-300 bg-white/10 hover:bg-white/20 rounded-full p-2 transition-colors z-10"
                    >
                        <X className="h-6 w-6" />
                    </button>
                    <img
                        src={selectedImage}
                        alt="Full view"
                        className="relative z-10 max-w-full max-h-full object-contain rounded-xl shadow-2xl"
                        style={{ maxHeight: '90vh', maxWidth: '90vw' }}
                    />
                </div>,
                document.body
            )}
        </div>
    );
};
