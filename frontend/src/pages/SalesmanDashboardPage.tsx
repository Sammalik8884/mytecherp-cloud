import React, { useState, useEffect } from "react";
import { 
    Plus, Target, Building, Calendar, ArrowRight, Activity, X,
    MapPin, Clock, ChevronDown, ChevronUp, Camera, FileText, Edit
} from "lucide-react";
import toast from "react-hot-toast";
import { salesService } from "../services/salesService";
import { SalesLeadDto, SiteVisitDto, CreateInitialClientVisitDto } from "../types/sales";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export const extractApiError = (error: any, defaultMsg: string) => {
    if (error.response?.status === 403) return "Permission denied (403). Contact your administrator.";
    const data = error.response?.data;
    if (data?.error) return data.error;
    if (data?.Error) return data.Error;
    if (data?.message) return data.message;
    if (data?.Message) return data.Message;
    if (data?.title && data?.errors) {
        return Object.values(data.errors).flat().join(", ");
    }
    return error.message || defaultMsg;
};

const VisitHistoryPanel = ({ leadId, isOpen }: { leadId: number; isOpen: boolean }) => {
    const [visits, setVisits] = useState<SiteVisitDto[]>([]);
    const [loading, setLoading] = useState(false);
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        if (isOpen && !loaded) {
            setLoading(true);
            salesService.getVisits(leadId)
                .then((data) => { setVisits(data); setLoaded(true); })
                .catch(() => toast.error("Failed to load visit history"))
                .finally(() => setLoading(false));
        }
    }, [isOpen, leadId, loaded]);

    if (!isOpen) return null;

    if (loading) {
        return (
            <div className="px-5 pb-5 pt-2">
                <div className="flex justify-center py-6">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                </div>
            </div>
        );
    }

    if (visits.length === 0) {
        return (
            <div className="px-5 pb-5 pt-2">
                <div className="text-center py-6 text-sm text-muted-foreground border-2 border-dashed border-border rounded-xl">
                    <MapPin className="h-6 w-6 mx-auto mb-2 opacity-30" />
                    No site visits recorded yet.
                </div>
            </div>
        );
    }

    return (
        <div className="px-5 pb-5 pt-2 space-y-3">
            <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center">
                <Clock className="h-3.5 w-3.5 mr-1.5" /> Visit Timeline ({visits.length})
            </div>
            {visits.map((visit) => (
                <div key={visit.id} className="bg-secondary/40 border border-border rounded-xl p-4 space-y-2">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                            <div className="h-7 w-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                                #{visit.visitNumber}
                            </div>
                            <span className="text-sm font-semibold text-foreground">Visit {visit.visitNumber}</span>
                        </div>
                        <span className="text-[11px] font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                            {new Date(visit.createdAt).toLocaleDateString()}
                        </span>
                    </div>

                    {visit.startTime && (
                        <div className="text-xs text-muted-foreground flex items-center space-x-3">
                            <span className="flex items-center"><Clock className="h-3 w-3 mr-1" /> In: {new Date(visit.startTime).toLocaleTimeString()}</span>
                            {visit.endTime && <span className="flex items-center"><Clock className="h-3 w-3 mr-1" /> Out: {new Date(visit.endTime).toLocaleTimeString()}</span>}
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-2 text-xs mt-2">
                        <div className="bg-background/50 p-2 rounded-lg">
                            <div className="font-semibold text-muted-foreground mb-0.5">Check-in Location</div>
                            {visit.startLatitude ? (
                                <a href={`https://maps.google.com/?q=${visit.startLatitude},${visit.startLongitude}`} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline flex items-center">
                                    <MapPin className="h-3 w-3 mr-1" /> View Map
                                </a>
                            ) : <span className="text-muted-foreground/50">N/A</span>}
                        </div>
                        <div className="bg-background/50 p-2 rounded-lg">
                            <div className="font-semibold text-muted-foreground mb-0.5">Check-out Location</div>
                            {visit.endLatitude ? (
                                <a href={`https://maps.google.com/?q=${visit.endLatitude},${visit.endLongitude}`} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline flex items-center">
                                    <MapPin className="h-3 w-3 mr-1" /> View Map
                                </a>
                            ) : <span className="text-muted-foreground/50">N/A</span>}
                        </div>
                    </div>

                    {visit.meetingNotes && (
                        <div className="text-xs text-muted-foreground mt-1 bg-background/50 p-2 rounded-lg">
                            <span className="font-semibold text-foreground/70 flex items-center mb-0.5"><FileText className="h-3 w-3 mr-1" /> Notes:</span>
                            <p className="break-words">{visit.meetingNotes}</p>
                        </div>
                    )}

                    {visit.photos && visit.photos.length > 0 && (
                        <div className="mt-1">
                            <div className="text-xs font-semibold text-muted-foreground mb-1.5 flex items-center">
                                <Camera className="h-3 w-3 mr-1" /> Evidence ({visit.photos.length})
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
            ))}
        </div>
    );
};

export const SalesmanDashboardPage = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    
    const [leads, setLeads] = useState<SalesLeadDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedLeadId, setExpandedLeadId] = useState<number | null>(null);

    const [isClientModalOpen, setIsClientModalOpen] = useState(false);
    const [clientFormLoading, setClientFormLoading] = useState(false);
    const [isLeadByCall, setIsLeadByCall] = useState(false);
    
    // Track if we are editing an existing lead
    const [editingLeadId, setEditingLeadId] = useState<number | null>(null);
    
    const [clientForm, setClientForm] = useState<CreateInitialClientVisitDto>({
        name: "", email: "", phone: "", taxNumber: "", address: "",
        contactPersonName: "", hasVisitingCard: false, contractorCompanyName: "", furtherDetails: "",
        siteName: "", siteCity: "", siteAddress: "", projectStatus: "Building", remarks: "",
        salespersonSignatureName: user?.id || ""
    });
    const [clientContacts, setClientContacts] = useState<{ contactNumber: string, designation: string }[]>([]);
    const [clientAttachments, setClientAttachments] = useState<File[]>([]);
    const [visitingCardPhoto, setVisitingCardPhoto] = useState<File | null>(null);

    const openCreateModal = () => {
        setEditingLeadId(null);
        setClientForm({
            name: "", email: "", phone: "", taxNumber: "", address: "",
            contactPersonName: "", hasVisitingCard: false, contractorCompanyName: "", furtherDetails: "",
            siteName: "", siteCity: "", siteAddress: "", projectStatus: "Building", remarks: "",
            salespersonSignatureName: user?.id || ""
        });
        setClientContacts([]);
        setClientAttachments([]);
        setVisitingCardPhoto(null);
        setIsLeadByCall(false);
        setIsClientModalOpen(true);
    };

    const openLeadByCallModal = () => {
        setEditingLeadId(null);
        setClientForm({
            name: "", email: "", phone: "", taxNumber: "", address: "",
            contactPersonName: "", hasVisitingCard: false, contractorCompanyName: "", furtherDetails: "",
            siteName: "", siteCity: "", siteAddress: "", projectStatus: "Building", remarks: "",
            salespersonSignatureName: user?.id || ""
        });
        setClientContacts([]);
        setClientAttachments([]);
        setVisitingCardPhoto(null);
        setIsLeadByCall(true);
        setIsClientModalOpen(true);
    };

    const handleEditClient = async (leadId: number) => {
        try {
            setClientFormLoading(true);
            const data = await salesService.getInitialClientData(leadId);
            setClientForm({ 
                name: data.name || "",
                email: data.email || "",
                phone: data.phone || "",
                taxNumber: data.taxNumber || "",
                address: data.address || "",
                contactPersonName: data.contactPersonName || "",
                hasVisitingCard: data.hasVisitingCard || false,
                contractorCompanyName: data.contractorCompanyName || "",
                furtherDetails: data.furtherDetails || "",
                siteName: data.siteName || "",
                siteCity: data.siteCity || "",
                siteAddress: data.siteAddress || "",
                latitude: data.latitude,
                longitude: data.longitude,
                projectStatus: data.projectStatus || "Building",
                remarks: data.remarks || "",
                salespersonSignatureName: data.salespersonSignatureName || user?.id || ""
            });
            try {
                const parsedContacts = data.additionalContactsJson ? JSON.parse(data.additionalContactsJson) : [];
                setClientContacts(Array.isArray(parsedContacts) ? parsedContacts : []);
            } catch { setClientContacts([]); }
            
            setClientAttachments([]);
            setEditingLeadId(leadId);
            setIsLeadByCall(false);
            setIsClientModalOpen(true);
        } catch (error) {
            toast.error("Failed to load client details");
        } finally {
            setClientFormLoading(false);
        }
    };

    useEffect(() => {
        fetchLeads();
    }, []);

    const fetchLeads = async () => {
        setLoading(true);
        try {
            const data = await salesService.getLeads(true);
            setLeads(data);
        } catch (error: any) {
            toast.error(extractApiError(error, "Failed to fetch your leads"));
        } finally {
            setLoading(false);
        }
    };

    const getGPSCoordinates = (): Promise<{lat: number, lng: number}> => {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error("Geolocation not supported"));
            } else {
                navigator.geolocation.getCurrentPosition(
                    pos => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
                    err => reject(err)
                );
            }
        });
    };

    const fetchLocation = async () => {
        toast.loading("Fetching GPS coordinates...", { id: "gps" });
        try {
            const coords = await getGPSCoordinates();
            setClientForm(prev => ({ ...prev, latitude: coords.lat, longitude: coords.lng }));
            toast.success("Location acquired successfully!", { id: "gps" });
        } catch (error: any) {
            toast.error("Failed to acquire location. Please ensure location services are enabled.", { id: "gps" });
        }
    };

    const handleSaveClientModal = async (e: React.FormEvent) => {
        e.preventDefault();
        setClientFormLoading(true);
        try {
            const dataToSubmit = { ...clientForm };
            if (!dataToSubmit.salespersonSignatureName) {
                dataToSubmit.salespersonSignatureName = user?.id || "";
            }

            // Proof attachments are optional — no blocking required

            if (clientContacts.length > 0) {
                dataToSubmit.additionalContactsJson = JSON.stringify(clientContacts);
            }
            if (clientAttachments.length > 0) {
                dataToSubmit.attachments = clientAttachments;
            }

            if (editingLeadId) {
                if (visitingCardPhoto) {
                    dataToSubmit.visitingCardPhoto = visitingCardPhoto;
                }
                await salesService.updateInitialClientData(editingLeadId, dataToSubmit);
                toast.success("Client profile and project data successfully updated!");
            } else {
                if (visitingCardPhoto) {
                    dataToSubmit.visitingCardPhoto = visitingCardPhoto;
                }
                await salesService.createInitialClientVisit(dataToSubmit);
                toast.success("Client registered and initial visit securely logged!");
            }
            
            setIsClientModalOpen(false);
            setClientAttachments([]);
            setVisitingCardPhoto(null);
            fetchLeads();
        } catch (error: any) {
            toast.error(extractApiError(error, "Failed to save client data."));
        } finally {
            setClientFormLoading(false);
        }
    };

    const toggleExpand = (leadId: number) => {
        setExpandedLeadId(prev => prev === leadId ? null : leadId);
    };

    const StatusWidget = ({ status }: { status: string }) => {
        const conf: any = {
            "New": "bg-blue-100 text-blue-800 border-blue-200",
            "InProgress": "bg-amber-100 text-amber-800 border-amber-200",
            "Closed": "bg-green-100 text-green-800 border-green-200",
            "RevisedBOQ": "bg-indigo-100 text-indigo-800 border-indigo-200",
            "ConvertedToQuotation": "bg-purple-100 text-purple-800 border-purple-200"
        };
        const colorClass = conf[status] || "bg-gray-100 text-gray-800 border-gray-200";
        return <div className={`px-3 py-1 rounded-full text-xs font-bold border ${colorClass}`}>{status}</div>;
    };

    return (
        <div className="space-y-4 md:space-y-6 max-w-6xl mx-auto">
            {/* Header */}
            <div className="bg-gradient-to-br from-primary to-accent text-white p-5 sm:p-7 md:p-8 rounded-2xl md:rounded-3xl shadow-xl relative overflow-hidden">
                <div className="absolute right-0 top-0 w-[400px] h-[400px] bg-white opacity-10 rounded-full blur-3xl translate-x-1/3 -translate-y-1/3" />
                <div className="relative z-10 flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-1 sm:mb-2">My Clients & Visits</h1>
                        <p className="text-white/80 font-medium text-sm sm:text-base">Register clients to automatically log your first visit, and track subsequent visits.</p>
                    </div>
                    <div className="shrink-0 flex flex-col sm:flex-row gap-2">
                        {(!user?.roles?.includes("Salesman")) && (
                            <button 
                                onClick={openLeadByCallModal}
                                className="w-full sm:w-auto px-5 py-3 bg-white/20 hover:bg-white/30 text-white rounded-xl font-bold transition-all shadow-lg active:scale-95 flex items-center justify-center space-x-2 text-sm sm:text-base border border-white/40"
                            >
                                <Target className="h-5 w-5" />
                                <span>Lead by Call</span>
                            </button>
                        )}
                        <button 
                            onClick={openCreateModal}
                            className="w-full sm:w-auto px-5 py-3 bg-white text-primary rounded-xl font-bold hover:bg-gray-100 transition-all shadow-lg active:scale-95 flex items-center justify-center space-x-2 text-sm sm:text-base"
                        >
                            <Plus className="h-5 w-5" />
                            <span>Add Client & Start Visit</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Leads Grid */}
            {loading ? (
                <div className="flex justify-center p-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            ) : leads.length === 0 ? (
                <div className="bg-card p-12 rounded-3xl border border-border text-center shadow-sm">
                    <Target className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
                    <h3 className="text-xl font-bold text-foreground">No records found.</h3>
                    <p className="text-muted-foreground mt-2">Start your journey by adding your first client.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 items-start">
                    {leads.map(lead => (
                        <div key={lead.id} className="bg-card rounded-2xl border border-border shadow-sm hover:shadow-md transition-all flex flex-col relative overflow-hidden group">
                            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-primary to-accent opacity-0 group-hover:opacity-100 transition-opacity" />
                            
                            <div className="p-4 sm:p-6 flex-1">
                                <div className="flex justify-between items-start mb-3 sm:mb-4">
                                    <div className="flex items-center space-x-2 min-w-0 mr-2">
                                        <div className="bg-primary/10 text-primary px-2 py-1 rounded text-xs font-mono font-bold tracking-wider truncate max-w-[90px]">
                                            {lead.leadNumber}
                                        </div>
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); handleEditClient(lead.id); }}
                                            className="p-1 text-muted-foreground hover:text-primary transition-colors bg-secondary/50 rounded-md shrink-0"
                                            title="Edit Client Information"
                                        >
                                            <Edit className="h-4 w-4" />
                                        </button>
                                    </div>
                                    <StatusWidget status={lead.status} />
                                </div>
                                <h3 className="text-base sm:text-lg font-bold text-foreground mb-1 line-clamp-1">{lead.customerName}</h3>
                                <div className="flex items-center text-sm text-muted-foreground mb-3 sm:mb-4">
                                    <Building className="h-4 w-4 mr-2 text-primary shrink-0" />
                                    <span className="truncate">{lead.siteName}</span>
                                </div>
                                
                                <div className="flex flex-wrap gap-2 text-xs font-medium text-muted-foreground/80 mt-auto bg-secondary/50 p-2.5 sm:p-3 rounded-xl border border-border">
                                    <div className="flex items-center">
                                        <Calendar className="mr-1.5 h-3.5 w-3.5 text-foreground/50" />
                                        {new Date(lead.createdAt).toLocaleDateString()}
                                    </div>
                                    <div className="flex items-center">
                                        <Activity className="mr-1.5 h-3.5 w-3.5 text-foreground/50" />
                                        {lead.visitCount} visits
                                    </div>
                                </div>
                            </div>

                            {/* Visit History Toggle */}
                            {lead.visitCount > 0 && (
                                <button
                                    onClick={() => toggleExpand(lead.id)}
                                    className="w-full px-5 py-2.5 text-xs font-bold text-primary bg-primary/5 hover:bg-primary/10 border-t border-border flex items-center justify-center space-x-1.5 transition-colors"
                                >
                                    <Clock className="h-3.5 w-3.5" />
                                    <span>{expandedLeadId === lead.id ? "Hide" : "Show"} Visit History ({lead.visitCount})</span>
                                    {expandedLeadId === lead.id ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                                </button>
                            )}

                            {/* Expandable Visit History */}
                            <VisitHistoryPanel leadId={lead.id} isOpen={expandedLeadId === lead.id} />
                            
                            {lead.status === "New" || lead.status === "InProgress" ? (
                                <button 
                                    onClick={() => navigate(`/sales/visit/${lead.id}`)}
                                    className="w-full bg-primary text-primary-foreground p-4 text-sm font-bold flex items-center justify-center space-x-2 hover:bg-primary/90 transition-colors"
                                >
                                    <span>Start Site Visit</span>
                                    <ArrowRight className="h-4 w-4" />
                                </button>
                            ) : (
                                <button 
                                    onClick={() => navigate(`/sales/visit/${lead.id}`)}
                                    className="w-full bg-secondary text-secondary-foreground p-4 text-sm font-bold flex items-center justify-center space-x-2 transition-colors"
                                >
                                    <span>View Progress Log</span>
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Create Client Modal (Now acts as Client + Site + Lead + First Visit combo) */}
            {isClientModalOpen && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
                    <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setIsClientModalOpen(false)} />
                    <div className="bg-card w-full sm:max-w-3xl rounded-t-2xl sm:rounded-2xl shadow-xl border border-border relative z-10 animate-in slide-in-from-bottom sm:zoom-in-95 duration-200 overflow-hidden flex flex-col max-h-[93dvh] sm:max-h-[90vh]">
                        <div className="p-4 sm:p-6 border-b border-border flex justify-between items-start gap-3 bg-muted/30 shrink-0">
                            <div className="min-w-0">
                                <h2 className="text-lg sm:text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent leading-tight">
                                    {isLeadByCall ? "Register Lead by Call" : (editingLeadId ? "Edit Client & Project Data" : "Register New Client & Initial Visit")}
                                </h2>
                                <p className="text-xs text-muted-foreground mt-1 hidden sm:block">
                                    {isLeadByCall ? "Fill in the details from the call. Most fields are optional." : (editingLeadId ? "Update your previously entered details as needed." : "Completing this form will automatically generate the client profile and log your first visit.")}
                                </p>
                            </div>
                            <button onClick={() => setIsClientModalOpen(false)} className="text-muted-foreground hover:text-foreground shrink-0 mt-0.5">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <div className="overflow-y-auto flex-1 p-4 sm:p-6">
                            <form id="createClientForm" onSubmit={handleSaveClientModal} className="space-y-8">
                                <div className="space-y-4">
                                    <h3 className="text-sm font-bold text-primary uppercase tracking-wider border-b border-border/50 pb-2">Client Details</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="md:col-span-2">
                                            <label className="block text-xs font-semibold text-muted-foreground mb-1">Company / Organization / Client Name {!isLeadByCall && "*"}</label>
                                            <input required={!isLeadByCall} value={clientForm.name} onChange={e => setClientForm({...clientForm, name: e.target.value})} className="w-full text-sm rounded-md border border-input px-3 py-2 bg-background" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-muted-foreground mb-1">Contact Person Name</label>
                                            <input value={clientForm.contactPersonName} onChange={e => setClientForm({...clientForm, contactPersonName: e.target.value})} className="w-full text-sm rounded-md border border-input px-3 py-2 bg-background" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-muted-foreground mb-1">Contact Number</label>
                                            <input value={clientForm.phone} onChange={e => setClientForm({...clientForm, phone: e.target.value})} className="w-full text-sm rounded-md border border-input px-3 py-2 bg-background" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-muted-foreground mb-1">Email</label>
                                            <input type="email" value={clientForm.email} onChange={e => setClientForm({...clientForm, email: e.target.value})} className="w-full text-sm rounded-md border border-input px-3 py-2 bg-background" />
                                        </div>
                                        <div className="md:col-span-2 space-y-3 mt-2 bg-secondary/20 p-3 rounded-lg border border-border/50">
                                            <div className="flex items-center justify-between">
                                                <label className="block text-xs font-semibold text-foreground">Additional Contacts</label>
                                                <button type="button" onClick={() => setClientContacts([...clientContacts, { contactNumber: "", designation: "" }])} className="text-xs text-primary font-bold flex items-center hover:bg-primary/10 px-2 py-1 rounded transition-colors">
                                                    <Plus className="h-3 w-3 mr-1" /> Add Contact Number
                                                </button>
                                            </div>
                                            {clientContacts.length === 0 && <p className="text-xs text-muted-foreground italic">No additional contacts added.</p>}
                                            {clientContacts.map((contact, idx) => (
                                                <div key={idx} className="flex items-center space-x-2 animate-in fade-in zoom-in duration-200">
                                                    <input placeholder="Designation (e.g. Manager)" value={contact.designation} onChange={e => { const newC = [...clientContacts]; newC[idx].designation = e.target.value; setClientContacts(newC); }} className="w-1/3 text-sm rounded-md border border-input px-3 py-2 bg-background focus:border-primary transition-colors" />
                                                    <input placeholder="Contact Number" value={contact.contactNumber} onChange={e => { const newC = [...clientContacts]; newC[idx].contactNumber = e.target.value; setClientContacts(newC); }} className="flex-1 text-sm rounded-md border border-input px-3 py-2 bg-background focus:border-primary transition-colors" />
                                                    <button type="button" onClick={() => { const newC = [...clientContacts]; newC.splice(idx, 1); setClientContacts(newC); }} className="text-destructive p-2 hover:bg-destructive/10 rounded-lg transition-colors">
                                                        <X className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="flex flex-col space-y-2 pt-5 md:col-span-2">
                                            <div className="flex items-center space-x-2">
                                                <input type="checkbox" id="visitingCard" checked={clientForm.hasVisitingCard} onChange={e => setClientForm({...clientForm, hasVisitingCard: e.target.checked})} className="rounded text-primary focus:ring-primary h-4 w-4" />
                                                <label htmlFor="visitingCard" className="text-xs font-semibold text-muted-foreground">Visiting Card Received?</label>
                                            </div>
                                            {clientForm.hasVisitingCard && (
                                                <div className="pl-6 animate-in slide-in-from-top-2 fade-in duration-300">
                                                    <label className="block text-xs font-semibold text-muted-foreground mb-1">Upload Card Photo (Optional)</label>
                                                    <div className="flex items-center space-x-3">
                                                        <input 
                                                            type="file" 
                                                            accept="image/*" 
                                                            capture="environment" 
                                                            className="hidden" 
                                                            id="visitingCardUpload"
                                                            onChange={e => {
                                                                if (e.target.files && e.target.files.length > 0) {
                                                                    setVisitingCardPhoto(e.target.files[0]);
                                                                }
                                                            }}
                                                        />
                                                        <button 
                                                            type="button" 
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                document.getElementById('visitingCardUpload')?.click();
                                                            }} 
                                                            className="text-xs font-bold border-2 border-dashed border-teal-500/50 text-teal-600 px-4 py-2 rounded-xl hover:bg-teal-50 transition-colors flex items-center"
                                                        >
                                                            <Camera className="h-4 w-4 mr-2" /> 
                                                            {visitingCardPhoto ? "Change Card Photo" : "Upload Visiting Card Picture"}
                                                        </button>
                                                        {visitingCardPhoto && (
                                                            <button 
                                                                type="button" 
                                                                onClick={(e) => {
                                                                    e.preventDefault();
                                                                    setVisitingCardPhoto(null);
                                                                    const el = document.getElementById('visitingCardUpload') as HTMLInputElement;
                                                                    if(el) el.value = "";
                                                                }} 
                                                                className="text-xs text-destructive hover:text-destructive/80 font-bold px-2"
                                                            >
                                                                Remove
                                                            </button>
                                                        )}
                                                    </div>
                                                    {visitingCardPhoto && <span className="text-xs text-muted-foreground font-mono truncate max-w-[200px] mt-1 block px-2">{visitingCardPhoto.name}</span>}
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-muted-foreground mb-1">Contractor Company Name (Optional)</label>
                                            <input value={clientForm.contractorCompanyName} onChange={e => setClientForm({...clientForm, contractorCompanyName: e.target.value})} className="w-full text-sm rounded-md border border-input px-3 py-2 bg-background" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-muted-foreground mb-1">Further Details (Optional)</label>
                                            <input value={clientForm.furtherDetails} onChange={e => setClientForm({...clientForm, furtherDetails: e.target.value})} className="w-full text-sm rounded-md border border-input px-3 py-2 bg-background" />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h3 className="text-sm font-bold text-emerald-500 uppercase tracking-wider border-b border-border/50 pb-2 mt-4">Site & GPS Location Details</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-semibold text-muted-foreground mb-1">Project Status</label>
                                            <select value={clientForm.projectStatus} onChange={e => setClientForm({...clientForm, projectStatus: e.target.value})} className="w-full text-sm rounded-md border border-input px-3 py-2 bg-background">
                                                <option value="Building">Building / Under Construction</option>
                                                <option value="Land">Empty Land</option>
                                                <option value="Renovation">Renovation</option>
                                                <option value="Completed">Completed Structure</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-muted-foreground mb-1">Site Nickname / Name {!isLeadByCall && "*"}</label>
                                            <input required={!isLeadByCall} value={clientForm.siteName} onChange={e => setClientForm({...clientForm, siteName: e.target.value})} className="w-full text-sm rounded-md border border-input px-3 py-2 bg-background" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-muted-foreground mb-1">City {!isLeadByCall && "*"}</label>
                                            <input required={!isLeadByCall} value={clientForm.siteCity} onChange={e => setClientForm({...clientForm, siteCity: e.target.value})} className="w-full text-sm rounded-md border border-input px-3 py-2 bg-background" />
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="block text-xs font-semibold text-muted-foreground mb-1">Complete Site Address {!isLeadByCall && "*"}</label>
                                            <input required={!isLeadByCall} value={clientForm.siteAddress} onChange={e => setClientForm({...clientForm, siteAddress: e.target.value})} className="w-full text-sm rounded-md border border-input px-3 py-2 bg-background" />
                                        </div>
                                        <div className="md:col-span-2 bg-secondary/30 p-3 sm:p-4 rounded-xl border border-border flex flex-col sm:flex-row sm:items-center gap-3">
                                            <div className="text-xs text-muted-foreground flex-1">
                                                <strong>GPS Coordinates:</strong><br />
                                                {clientForm.latitude && clientForm.longitude 
                                                    ? <span className="text-primary font-mono break-all">{clientForm.latitude.toFixed(6)}, {clientForm.longitude.toFixed(6)}</span>
                                                    : "Not acquired yet"}
                                            </div>
                                            <button type="button" onClick={fetchLocation} className="text-xs font-bold bg-primary text-primary-foreground px-4 py-2.5 rounded-lg flex items-center justify-center w-full sm:w-auto">
                                                <MapPin className="h-3.5 w-3.5 mr-1" /> Fetch Live Location
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h3 className="text-sm font-bold text-indigo-500 uppercase tracking-wider border-b border-border/50 pb-2 mt-4">Initial Visit Execution</h3>
                                    <div className="grid grid-cols-1 gap-4">
                                        <div>
                                            <label className="block text-xs font-semibold text-muted-foreground mb-1 flex items-center">Remarks / Notes {!isLeadByCall && !editingLeadId && <span className="text-destructive ml-1">*</span>}</label>
                                            <textarea 
                                                required={!isLeadByCall && !editingLeadId}
                                                value={clientForm.remarks} 
                                                onChange={e => setClientForm({...clientForm, remarks: e.target.value})} 
                                                className="w-full text-sm rounded-md border border-input px-3 py-2 bg-background min-h-[100px] resize-y" 
                                                placeholder="Write your meeting details, findings, and remarks here..."
                                            />
                                        </div>
                                        <div>
                                             <label className="block text-xs font-semibold text-muted-foreground mb-1">Proof / Evidence (Photos, Documents) <span className="text-muted-foreground/60 font-normal">(Optional)</span></label>
                                                 <div className="flex flex-col space-y-3">
                                                     <div className="flex flex-wrap items-center gap-2">
                                                         {/* label+htmlFor is the ONLY reliable cross-browser file trigger */}
                                                         <label
                                                             htmlFor="proofFileInput"
                                                             className="text-xs font-bold border-2 border-dashed border-primary/50 text-primary px-4 py-3 rounded-xl hover:bg-primary/5 transition-colors flex items-center cursor-pointer select-none"
                                                         >
                                                             <Plus className="h-4 w-4 mr-2" />
                                                             Add Files / Photos
                                                         </label>
                                                         <input
                                                             id="proofFileInput"
                                                             type="file"
                                                             multiple
                                                             accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx"
                                                             className="hidden"
                                                             onChange={e => {
                                                                 if (e.target.files && e.target.files.length > 0) {
                                                                     setClientAttachments(prev => [...prev, ...Array.from(e.target.files!)]);
                                                                 }
                                                                 if (e.target) e.target.value = '';
                                                             }}
                                                         />
                                                         <label
                                                             htmlFor="cameraCaptureInput"
                                                             className="text-xs font-bold border-2 border-dashed border-emerald-500/50 text-emerald-600 px-4 py-3 rounded-xl hover:bg-emerald-50 transition-colors flex items-center cursor-pointer select-none"
                                                         >
                                                             <Camera className="h-4 w-4 mr-2" />
                                                             Take Photo
                                                         </label>
                                                         <input
                                                             id="cameraCaptureInput"
                                                             type="file"
                                                             accept="image/*"
                                                             capture="environment"
                                                             className="hidden"
                                                             onChange={e => {
                                                                 if (e.target.files && e.target.files.length > 0) {
                                                                     setClientAttachments(prev => [...prev, ...Array.from(e.target.files!)]);
                                                                 }
                                                                 if (e.target) (e.target as HTMLInputElement).value = '';
                                                             }}
                                                         />
                                                     </div>
                                                     {clientAttachments.length > 0 ? (
                                                         <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-1">
                                                             {clientAttachments.map((file, idx) => (
                                                                 <div key={idx} className="relative border border-border rounded-xl overflow-hidden bg-secondary/20 group">
                                                                     {file.type.startsWith('image/') ? (
                                                                         <img
                                                                             src={URL.createObjectURL(file)}
                                                                             alt={file.name}
                                                                             className="w-full h-20 object-cover"
                                                                         />
                                                                     ) : (
                                                                         <div className="w-full h-20 flex items-center justify-center bg-secondary/40">
                                                                             <FileText className="h-8 w-8 text-muted-foreground/50" />
                                                                         </div>
                                                                     )}
                                                                     <div className="px-1.5 py-1 flex items-center justify-between gap-1">
                                                                         <span className="text-[10px] text-muted-foreground font-mono truncate flex-1" title={file.name}>{file.name}</span>
                                                                         <button
                                                                             type="button"
                                                                             onClick={() => setClientAttachments(prev => prev.filter((_, i) => i !== idx))}
                                                                             className="text-destructive hover:bg-destructive/10 p-1 rounded transition-colors flex-none"
                                                                         >
                                                                             <X className="h-3 w-3" />
                                                                         </button>
                                                                     </div>
                                                                 </div>
                                                             ))}
                                                         </div>
                                                     ) : (
                                                         <p className="text-xs text-muted-foreground/60 italic">No files added yet. Uploading proof is optional.</p>
                                                     )}
                                                 </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-muted-foreground mb-1">Salesperson Signature (Auto-Stampted)</label>
                                            <input disabled value={clientForm.salespersonSignatureName || user?.id || ""} className="w-full text-sm rounded-md border border-input px-3 py-2 bg-muted/50 cursor-not-allowed font-medium" />
                                        </div>
                                    </div>
                                </div>
                            </form>
                        </div>
                        <div className="p-4 sm:p-6 border-t border-border shrink-0 bg-background">
                            <button
                                type="submit"
                                form="createClientForm"
                                disabled={clientFormLoading}
                                className="w-full h-12 bg-primary text-primary-foreground hover:bg-primary/90 font-bold rounded-xl transition-colors flex items-center justify-center disabled:opacity-50 text-sm shadow-lg shadow-primary/20 active:scale-[0.99]"
                            >
                                {clientFormLoading ? (
                                    <span className="flex items-center"><Activity className="animate-spin h-5 w-5 mr-2" /> Saving Everything...</span>
                                ) : (
                                    editingLeadId ? "Update Client Profile" : "Save & Log Initial Visit"
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
