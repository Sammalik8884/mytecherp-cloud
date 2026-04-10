import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
    MapPin, Camera, Play, Square, ArrowLeft, FileCheck, Info, FileText, X, RefreshCw, DownloadCloud
} from "lucide-react";
import toast from "react-hot-toast";
import { salesService } from "../services/salesService";
import { quotationService } from "../services/quotationService";
import { SalesLeadDto, SiteVisitDto, LeadQuoteDto } from "../types/sales";

export const extractApiError = (error: any, defaultMsg: string) => {
    if (error.response?.status === 403) return "Permission denied (403). Contact your administrator.";
    if (error.response?.status >= 500) return "Server encountered an internal error processing the photo. Support has been notified.";
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

export const SiteVisitPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [lead, setLead] = useState<SalesLeadDto | null>(null);
    const [, setVisits] = useState<SiteVisitDto[]>([]);
    
    // Active visit tracking
    const [activeVisitId, setActiveVisitId] = useState<number | null>(null);
    const [meetingNotes, setMeetingNotes] = useState("");
    const [photos, setPhotos] = useState<{file: File, url: string}[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const cardInputRef = useRef<HTMLInputElement>(null);

    // Closure state
    const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
    const [boqFile, setBoqFile] = useState<File | null>(null);
    const [drawingFile, setDrawingFile] = useState<File | null>(null);
    const [closing, setClosing] = useState(false);

    // Revision state
    const [isReviseModalOpen, setIsReviseModalOpen] = useState(false);
    const [revBoqFile, setRevBoqFile] = useState<File | null>(null);
    const [revDrawingFile, setRevDrawingFile] = useState<File | null>(null);
    const [revNotes, setRevNotes] = useState("");
    const [revising, setRevising] = useState(false);

    // Quotes state
    const [quotes, setQuotes] = useState<LeadQuoteDto[]>([]);
    const [showQuotes, setShowQuotes] = useState(false);

    // Reopen state
    const [isReopenModalOpen, setIsReopenModalOpen] = useState(false);
    const [isReopening, setIsReopening] = useState(false);

    useEffect(() => {
        if (id) {
            fetchData();
        }
    }, [id]);

    const fetchData = async () => {
        try {
            const [leadData, visitData] = await Promise.all([
                salesService.getLead(Number(id)),
                salesService.getVisits(Number(id))
            ]);
            setLead(leadData);
            setVisits(visitData);
            
            // Reattach to an ongoing visit if end time is missing (just basic check)
            const ongoing = visitData.find(v => !v.endTime);
            if (ongoing) {
                setActiveVisitId(ongoing.id);
                setMeetingNotes(prev => prev || ongoing.meetingNotes || "");
            }
        } catch (error: any) {
            toast.error(extractApiError(error, "Failed to load visit data"));
            navigate("/sales/leads");
        }
    };

    const fetchQuotes = async () => {
        try {
            const data = await salesService.getLeadQuotes(Number(id));
            setQuotes(data);
            setShowQuotes(true);
        } catch {
            toast.error("Failed to load quotations.");
        }
    };

    const handleDownloadPdf = async (id: number, quoteNumber: string) => {
        try {
            toast.loading("Generating PDF...", { id: `pdf-${id}` });
            const blob = await quotationService.downloadPdf(id);
            
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

    const handleReviseBoq = async () => {
        if (!revBoqFile && !revDrawingFile) {
            return toast.error("Please provide at least a BOQ or Drawing file.");
        }
        setRevising(true);
        try {
            await salesService.reviseBoq(Number(id), revBoqFile || undefined, revDrawingFile || undefined, revNotes || undefined);
            toast.success("BOQ/Drawings revised and re-uploaded!");
            setIsReviseModalOpen(false);
            setRevBoqFile(null);
            setRevDrawingFile(null);
            setRevNotes("");
            fetchData();
        } catch (error: any) {
            toast.error(extractApiError(error, "Failed to revise BOQ."));
        } finally {
            setRevising(false);
        }
    };

    const handleReopenLead = async () => {
        setIsReopening(true);
        try {
            await salesService.reopenLead(Number(id));
            toast.success("Lead reopened successfully!");
            setIsReopenModalOpen(false);
            fetchData();
        } catch (error: any) {
            toast.error(extractApiError(error, "Failed to reopen lead"));
        } finally {
            setIsReopening(false);
        }
    };

    const getGPSCoordinates = (): Promise<{lat: number, lng: number}> => {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error("Geolocation is not supported by your browser"));
            } else {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        resolve({
                            lat: position.coords.latitude,
                            lng: position.coords.longitude
                        });
                    },
                    () => {
                        reject(new Error("Unable to retrieve your location"));
                    }
                );
            }
        });
    };

    const handleStartVisit = async () => {
        try {
            toast.loading("Acquiring GPS Signal...", { id: "gps" });
            const coords = await getGPSCoordinates();
            toast.success("Location acquired!", { id: "gps" });
            
            const res = await salesService.startVisit(Number(id), {
                startLatitude: coords.lat,
                startLongitude: coords.lng
            });
            setActiveVisitId(res.visitId);
            setMeetingNotes("");
            toast.success("Visit started successfully! Recording time and location.");
            fetchData();
        } catch (error: any) {
            toast.error(extractApiError(error, "Failed to start visit"), { id: "gps" });
        }
    };

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || !e.target.files.length) return;
        if (!activeVisitId) return toast.error("Start the visit first to upload photos");

        const file = e.target.files[0];
        toast.loading("Uploading photo...", { id: "photoUpload" });
        try {
            const res = await salesService.uploadVisitPhoto(activeVisitId, file, "Site Evidence");
            toast.success("Photo uploaded layout-saved!", { id: "photoUpload" });
            setPhotos(prev => [...prev, { file, url: res.photoUrl }]);
            fetchData();
        } catch (error: any) {
            toast.error(extractApiError(error, "Failed to upload photo"), { id: "photoUpload" });
        }
    };

    const handleCardUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || !e.target.files.length) return;
        if (!activeVisitId) return toast.error("Start the visit first to upload photos");

        const file = e.target.files[0];
        toast.loading("Uploading visiting card...", { id: "cardUpload" });
        try {
            const res = await salesService.uploadVisitPhoto(activeVisitId, file, "Visiting Card");
            toast.success("Visiting card uploaded successfully!", { id: "cardUpload" });
            setPhotos(prev => [...prev, { file, url: res.photoUrl }]);
            fetchData();
        } catch (error: any) {
            toast.error(extractApiError(error, "Failed to upload visiting card"), { id: "cardUpload" });
        }
    };

    const handleEndVisit = async () => {
        if (!activeVisitId) return;
        try {
            toast.loading("Acquiring checkout GPS Signal...", { id: "gpsEnd" });
            const coords = await getGPSCoordinates();
            toast.success("Checkout location acquired!", { id: "gpsEnd" });

            await salesService.endVisit(activeVisitId, {
                endLatitude: coords.lat,
                endLongitude: coords.lng,
                meetingNotes: meetingNotes
            });
            toast.success("Visit ended successfully.");
            setActiveVisitId(null);
            setPhotos([]);
            fetchData();
        } catch (error: any) {
            toast.error(extractApiError(error, "Failed to end visit"), { id: "gpsEnd" });
        }
    };

    const handleCloseLead = async () => {
        if (!boqFile && !drawingFile) {
            return toast.error("Please provide at least a BOQ or Drawing file to close the lead.");
        }
        setClosing(true);
        try {
            await salesService.closeLead(Number(id), boqFile || undefined, drawingFile || undefined);
            toast.success("Lead successfully closed with documents.");
            setIsCloseModalOpen(false);
            fetchData();
        } catch (error: any) {
            toast.error(extractApiError(error, "Failed to close lead and upload files."));
        } finally {
            setClosing(false);
        }
    };

    if (!lead) {
        return (
            <div className="flex justify-center items-center h-full pt-20">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    const isActive = activeVisitId !== null;

    return (
        <div className="w-full max-w-4xl mx-auto space-y-6 animate-fade-in relative pb-20">
            {/* Header */}
            <div className="flex items-center space-x-4 mb-8 text-muted-foreground">
                <button onClick={() => navigate(-1)} className="p-2 bg-secondary rounded-lg hover:bg-secondary/70 transition-colors">
                    <ArrowLeft className="h-5 w-5" />
                </button>
                <div className="text-xl font-bold text-foreground">Visit Console Dashboard</div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Lead Info Pane */}
                <div className="bg-card border border-border p-6 rounded-2xl shadow-sm text-center md:col-span-1 flex flex-col justify-center">
                    <div className="inline-block px-3 py-1 bg-primary/10 text-primary rounded-full font-mono text-sm font-bold mb-4 mx-auto">
                        {lead.leadNumber}
                    </div>
                    <h2 className="text-xl font-bold mb-1">{lead.customerName}</h2>
                    <p className="text-muted-foreground flex items-center justify-center text-sm mb-4">
                        <MapPin className="h-3 w-3 mr-1" /> {lead.siteName}
                    </p>
                    
                    {lead.status !== "Closed" && lead.status !== "ConvertedToQuotation" ? (
                        <button 
                            onClick={() => setIsCloseModalOpen(true)}
                            className="w-full py-3 bg-secondary text-foreground font-semibold rounded-xl mt-4 hover:bg-secondary/70 transition-all border border-border flex items-center justify-center space-x-2"
                        >
                            <FileCheck className="h-4 w-4 text-green-500" />
                            <span>Close Lead with BOQ</span>
                        </button>
                    ) : (
                        <div className="w-full p-4 bg-green-100 text-green-800 rounded-xl mt-4 text-center text-sm font-bold border border-green-200">
                            Lead Finished & Closed
                        </div>
                    )}

                    {/* Revise BOQ Button */}
                    {(lead.status === "Closed" || lead.status === "ConvertedToQuotation" || lead.status === "RevisedBOQ") && (
                        <button
                            onClick={() => setIsReviseModalOpen(true)}
                            className="w-full py-3 bg-indigo-100 text-indigo-800 font-semibold rounded-xl mt-2 hover:bg-indigo-200 transition-all border border-indigo-200 flex items-center justify-center space-x-2"
                        >
                            <FileText className="h-4 w-4" />
                            <span>Revise / Re-upload BOQ</span>
                        </button>
                    )}

                    {/* View Quotations Button */}
                    {(lead.status === "Closed" || lead.status === "ConvertedToQuotation" || lead.status === "RevisedBOQ") && (
                        <button
                            onClick={fetchQuotes}
                            className="w-full py-3 bg-purple-100 text-purple-800 font-semibold rounded-xl mt-2 hover:bg-purple-200 transition-all border border-purple-200 flex items-center justify-center space-x-2"
                        >
                            <FileText className="h-4 w-4" />
                            <span>View Quotations</span>
                        </button>
                    )}

                    {/* Reopen Lead Button */}
                    {(lead.status === "Closed" || lead.status === "ConvertedToQuotation" || lead.status === "RevisedBOQ") && (
                        <button
                            onClick={() => setIsReopenModalOpen(true)}
                            className="w-full py-3 bg-orange-100 text-orange-800 font-semibold rounded-xl mt-4 hover:bg-orange-200 transition-all border border-orange-200 flex items-center justify-center space-x-2"
                        >
                            <RefreshCw className="h-4 w-4" />
                            <span>Reopen Lead (Log New Visits)</span>
                        </button>
                    )}
                </div>

                {/* Visit Control Panel */}
                <div className="md:col-span-2 bg-card border border-border rounded-2xl shadow-lg shadow-primary/5 p-6 relative overflow-hidden">
                    <div className={`absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/2 transition-colors duration-1000 ${isActive ? 'bg-amber-500/10' : 'bg-primary/5'}`} />
                    
                    <h3 className="text-lg font-bold mb-6">Execution Panel</h3>

                    {lead.status === "Closed" || lead.status === "ConvertedToQuotation" ? (
                        <div className="p-8 text-center text-muted-foreground bg-secondary/30 rounded-xl border-2 border-dashed border-border flex flex-col items-center">
                            <Info className="h-12 w-12 text-primary/40 mb-3" />
                            <p className="font-medium text-foreground">This lead has been archived.</p>
                            <p className="text-sm">You can no longer execute site visits for this lead as it is already closed or converted.</p>
                        </div>
                    ) : !isActive ? (
                        <div className="space-y-4">
                            <button 
                                onClick={handleStartVisit}
                                className="w-full h-16 bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white rounded-xl shadow-md text-lg font-bold flex items-center justify-center space-x-3 transition-transform active:scale-95"
                            >
                                <Play className="h-6 w-6" />
                                <span>Initiate Site Visit (Log GPS)</span>
                            </button>
                            <p className="text-xs text-center text-muted-foreground">This action requires browser location permissions.</p>
                        </div>
                    ) : (
                        <div className="space-y-6 animate-in slide-in-from-bottom-[20px] duration-500">
                            <div className="bg-amber-500/10 border border-amber-500/20 text-amber-700 p-4 rounded-xl flex items-center space-x-3">
                                <span className="relative flex h-3 w-3">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                                </span>
                                <span className="font-bold border-l border-amber-500/20 pl-3">Visit In Progress (GPS Active)</span>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold mb-2 flex items-center">
                                    <FileText className="h-4 w-4 mr-1 text-primary"/> Meeting Information & Notes
                                </label>
                                <textarea
                                    className="w-full flex min-h-[140px] rounded-xl border border-input bg-secondary/30 px-4 py-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary shadow-inner"
                                    placeholder="Write your findings here... (met with contact, inspected site parameters, etc.)"
                                    value={meetingNotes}
                                    onChange={(e) => setMeetingNotes(e.target.value)}
                                />
                            </div>

                            <div>
                                <input 
                                    type="file" 
                                    accept="image/*" 
                                    capture="environment" 
                                    className="hidden" 
                                    ref={fileInputRef} 
                                    onChange={handlePhotoUpload}
                                />
                                <input 
                                    type="file" 
                                    accept="image/*" 
                                    capture="environment" 
                                    className="hidden" 
                                    ref={cardInputRef} 
                                    onChange={handleCardUpload}
                                />
                                
                                <div className="flex flex-col sm:flex-row gap-3">
                                    <button 
                                        onClick={() => fileInputRef.current?.click()}
                                        className="w-full py-4 border-2 border-dashed border-primary/50 text-primary font-bold rounded-xl hover:bg-primary/5 transition-colors flex items-center justify-center space-x-2"
                                    >
                                        <Camera className="h-5 w-5" />
                                        <span>Capture Evidence Photo</span>
                                    </button>

                                    <button 
                                        onClick={() => cardInputRef.current?.click()}
                                        className="w-full py-4 border-2 border-dashed border-teal-500/50 text-teal-600 font-bold rounded-xl hover:bg-teal-50 transition-colors flex items-center justify-center space-x-2"
                                    >
                                        <FileText className="h-5 w-5" />
                                        <span>Visiting Card Photo (Optional)</span>
                                    </button>
                                </div>

                                {/* Preview Grid */}
                                {photos.length > 0 && (
                                    <div className="mt-4 grid grid-cols-4 gap-2">
                                        {photos.map((p, i) => (
                                            <div key={i} className="aspect-square bg-secondary rounded-lg overflow-hidden border border-border shadow-sm">
                                                <img src={p.url} className="w-full h-full object-cover" alt="Upload placeholder" />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <button 
                                onClick={handleEndVisit}
                                className="w-full py-4 bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl font-bold flex items-center justify-center space-x-2 shadow-lg transition-transform active:scale-95"
                            >
                                <Square className="h-5 w-5 fill-current" />
                                <span>End Visit & Sync Securely</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Close Modal */}
            {isCloseModalOpen && (
                <div className="fixed inset-0 z-50 flex justify-center items-center">
                    <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setIsCloseModalOpen(false)} />
                    <div className="bg-card w-full max-w-md p-6 rounded-2xl border border-border relative z-10 shadow-2xl animate-in zoom-in-95">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold">Submit Final Files</h2>
                            <button onClick={() => setIsCloseModalOpen(false)}><X className="h-5 w-5 text-muted-foreground" /></button>
                        </div>
                        <p className="text-sm text-muted-foreground mb-6">
                            To close this lead and pass it to the quotation desk, you must upload the BOQ file and/or the design drawings.
                        </p>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold mb-1">Requirement (BOQ)</label>
                                <input 
                                    type="file" 
                                    className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                                    onChange={(e) => setBoqFile(e.target.files?.[0] || null)}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold mb-1">Architectural Drawings (Optional)</label>
                                <input 
                                    type="file" 
                                    className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-secondary file:text-secondary-foreground hover:file:bg-secondary/80"
                                    onChange={(e) => setDrawingFile(e.target.files?.[0] || null)}
                                />
                            </div>
                        </div>

                        <button 
                            onClick={handleCloseLead}
                            disabled={closing}
                            className="w-full mt-8 py-3 bg-primary text-primary-foreground font-bold rounded-xl active:scale-95 transition-all disabled:opacity-50"
                        >
                            {closing ? "Uploading Data..." : "Finalize & Seal Lead"}
                        </button>
                    </div>
                </div>
            )}

            {/* Revise BOQ Modal */}
            {isReviseModalOpen && (
                <div className="fixed inset-0 z-50 flex justify-center items-center">
                    <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setIsReviseModalOpen(false)} />
                    <div className="bg-card w-full max-w-md p-6 rounded-2xl border border-border relative z-10 shadow-2xl animate-in zoom-in-95">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold">Revise BOQ / Drawings</h2>
                            <button onClick={() => setIsReviseModalOpen(false)}><X className="h-5 w-5 text-muted-foreground" /></button>
                        </div>
                        <p className="text-sm text-muted-foreground mb-6">
                            Upload revised BOQ or drawing files. This will update the lead status and notify the estimation team.
                        </p>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold mb-1">Revised BOQ File</label>
                                <input 
                                    type="file" 
                                    className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                                    onChange={(e) => setRevBoqFile(e.target.files?.[0] || null)}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold mb-1">Revised Drawings (Optional)</label>
                                <input 
                                    type="file" 
                                    className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-secondary file:text-secondary-foreground hover:file:bg-secondary/80"
                                    onChange={(e) => setRevDrawingFile(e.target.files?.[0] || null)}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold mb-1">Revision Notes</label>
                                <textarea 
                                    className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                                    placeholder="Describe what changed..."
                                    value={revNotes}
                                    onChange={(e) => setRevNotes(e.target.value)}
                                />
                            </div>
                        </div>
                        <button 
                            onClick={handleReviseBoq}
                            disabled={revising}
                            className="w-full mt-6 py-3 bg-indigo-600 text-white font-bold rounded-xl active:scale-95 transition-all disabled:opacity-50"
                        >
                            {revising ? "Uploading Revision..." : "Submit Revision"}
                        </button>
                    </div>
                </div>
            )}

            {/* Quotations Panel */}
            {showQuotes && (
                <div className="fixed inset-0 z-50 flex justify-center items-center">
                    <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setShowQuotes(false)} />
                    <div className="bg-card w-full max-w-lg p-6 rounded-2xl border border-border relative z-10 shadow-2xl animate-in zoom-in-95 max-h-[80vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold">Linked Quotations</h2>
                            <button onClick={() => setShowQuotes(false)}><X className="h-5 w-5 text-muted-foreground" /></button>
                        </div>
                        {quotes.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                <FileText className="h-10 w-10 mx-auto mb-2 opacity-30" />
                                <p>No quotations linked to this lead yet.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {quotes.map(q => (
                                    <div key={q.id} className="bg-secondary/30 border border-border rounded-xl p-4">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <div className="font-mono text-sm font-bold text-primary flex items-center">
                                                    {q.quoteNumber}
                                                    <button 
                                                        onClick={() => handleDownloadPdf(q.id, q.quoteNumber)} 
                                                        title="Download PDF" 
                                                        className="ml-3 p-1.5 text-blue-500 hover:text-white hover:bg-blue-500 rounded-md transition-colors"
                                                    >
                                                        <DownloadCloud className="h-4 w-4" />
                                                    </button>
                                                </div>
                                                <div className="text-xs text-muted-foreground mt-1">Issued: {new Date(q.issueDate).toLocaleDateString()}</div>
                                            </div>
                                            <div className={`px-3 py-1 rounded-full text-xs font-bold border ${
                                                q.status === 'Approved' ? 'bg-green-100 text-green-800 border-green-200' :
                                                q.status === 'Rejected' ? 'bg-red-100 text-red-800 border-red-200' :
                                                'bg-blue-100 text-blue-800 border-blue-200'
                                            }`}>{q.status}</div>
                                        </div>
                                        <div className="text-sm font-bold mt-2">Total: PKR {q.grandTotal?.toLocaleString()}</div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Reopen Modal */}
            {isReopenModalOpen && (
                <div className="fixed inset-0 z-50 flex justify-center items-center">
                    <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setIsReopenModalOpen(false)} />
                    <div className="bg-card w-full max-w-md p-6 rounded-2xl border border-border relative z-10 shadow-2xl animate-in zoom-in-95">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-orange-600 flex items-center"><RefreshCw className="h-5 w-5 mr-2" /> Reopen Lead</h2>
                            <button onClick={() => setIsReopenModalOpen(false)}><X className="h-5 w-5 text-muted-foreground" /></button>
                        </div>
                        <p className="text-sm text-muted-foreground mb-6">
                            Are you sure you want to reopen this lead? It will revert back to the In-Progress state, allowing you to log new site visits and upload more photos.
                        </p>
                        
                        <div className="flex space-x-3 w-full mt-8">
                            <button 
                                onClick={() => setIsReopenModalOpen(false)}
                                disabled={isReopening}
                                className="w-1/2 py-3 bg-secondary text-foreground font-bold rounded-xl hover:bg-secondary/70 transition-all disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleReopenLead}
                                disabled={isReopening}
                                className="w-1/2 py-3 bg-orange-500 text-white font-bold rounded-xl hover:bg-orange-600 shadow-md active:scale-95 transition-all disabled:opacity-50 flex justify-center items-center"
                            >
                                {isReopening ? (
                                    <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></span>
                                ) : (
                                    "Yes, Reopen Lead"
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
