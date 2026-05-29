import { useState, useEffect } from "react";
import { FileSignature, Plus, Wrench, Search, Loader2, FileCheck } from "lucide-react";
import { ProjectScopeModal } from "../components/common/ProjectScopeModal";
import { ToolsListModal } from "../components/common/ToolsListModal";
import { MaterialReceivingModal } from "../components/common/MaterialReceivingModal";
import { DailyProgressReportModal } from "../components/common/DailyProgressReportModal";
import { dprService, DailyProgressReportDto } from "../services/dprService";
import { DprDetailsModal, DprViewMode } from "../components/common/DprDetailsModal";
import { siteService } from "../services/siteService";
import { SiteDto } from "../types/site";
import { materialReceivingService, MaterialReceivingFormDto } from "../services/materialReceivingService";
import MomMeetingModal from "../components/MomMeetingModal";
import momMeetingService, { MomMeetingDto } from "../services/momMeetingService";
import { siteDocumentService } from "../services/siteDocumentService";
import { Users, Download, Eye } from "lucide-react";
import { toast } from "react-hot-toast";

const LOCATIONS = ["Lahore", "Karachi", "Islamabad", "Peshawar", "Balochistan"];

export const ProjectDocumentsPage = () => {
    const [selectedLocation, setSelectedLocation] = useState<string>("");
    const [toolsLists, setToolsLists] = useState<MaterialReceivingFormDto[]>([]);
    const [isLoadingTools, setIsLoadingTools] = useState(false);
    const [showToolsDetails, setShowToolsDetails] = useState(false);

    // Material Receiving State
    const [sites, setSites] = useState<SiteDto[]>([]);
    const [selectedSiteId, setSelectedSiteId] = useState<number | "">("");
    const [materialReceivingLists, setMaterialReceivingLists] = useState<MaterialReceivingFormDto[]>([]);
    const [isLoadingMaterialReceiving, setIsLoadingMaterialReceiving] = useState(false);
    const [showMaterialReceivingDetails, setShowMaterialReceivingDetails] = useState(false);

    useEffect(() => {
        if (showMaterialReceivingDetails) {
            siteService.getAll().then(setSites).catch(console.error);
        }
    }, [showMaterialReceivingDetails]);

    useEffect(() => {
        const handleRefresh = () => {
            if (selectedSiteId) {
                fetchMaterialReceivingLists(Number(selectedSiteId));
            }
        };
        window.addEventListener("REFRESH_MATERIAL_RECEIVING_LIST", handleRefresh);
        return () => window.removeEventListener("REFRESH_MATERIAL_RECEIVING_LIST", handleRefresh);
    }, [selectedSiteId]);

    const fetchMaterialReceivingLists = async (siteId: number) => {
        setIsLoadingMaterialReceiving(true);
        try {
            const data = await materialReceivingService.getFormsBySiteId(siteId);
            setMaterialReceivingLists(data);
        } catch (error) {
            console.error("Failed to load material receiving lists", error);
        } finally {
            setIsLoadingMaterialReceiving(false);
        }
    };

    const handleSiteSelect = (siteId: number | "") => {
        setSelectedSiteId(siteId);
        if (siteId) fetchMaterialReceivingLists(Number(siteId));
    };

    // MOM State
    const [showMomModal, setShowMomModal] = useState(false);
    const [showMomList, setShowMomList] = useState(false);
    const [momMeetings, setMomMeetings] = useState<MomMeetingDto[]>([]);
    const [isLoadingMom, setIsLoadingMom] = useState(false);
    const [selectedMom, setSelectedMom] = useState<MomMeetingDto | null>(null);
    const [isMomViewOnly, setIsMomViewOnly] = useState(false);

    // Letters State
    const [showLettersList, setShowLettersList] = useState(false);
    const [lettersList, setLettersList] = useState<any[]>([]);
    const [isLoadingLetters, setIsLoadingLetters] = useState(false);

    
    // DPR State
    const [dprLists, setDprLists] = useState<DailyProgressReportDto[]>([]);
    const [isLoadingDpr, setIsLoadingDpr] = useState(false);
    const [showDprDetails, setShowDprDetails] = useState(false);
    const [selectedReportForDetails, setSelectedReportForDetails] = useState<any>(null);
    const [dprViewMode, setDprViewMode] = useState<DprViewMode>(null);

    useEffect(() => {
        if (showDprDetails) {
            siteService.getAll().then(setSites).catch(console.error);
        }
    }, [showDprDetails]);

    useEffect(() => {
        const handleRefresh = () => {
            if (selectedSiteId && showDprDetails) {
                fetchDprLists(Number(selectedSiteId));
            }
        };
        window.addEventListener("REFRESH_DPR_LIST", handleRefresh);
        return () => window.removeEventListener("REFRESH_DPR_LIST", handleRefresh);
    }, [selectedSiteId, showDprDetails]);

    const fetchDprLists = async (siteId: number) => {
        setIsLoadingDpr(true);
        try {
            const data = await dprService.getBySiteId(siteId);
            setDprLists(data);
        } catch (error) {
            console.error("Failed to load dpr lists", error);
        } finally {
            setIsLoadingDpr(false);
        }
    };

    const handleDprSiteSelect = (siteId: number | "") => {
        setSelectedSiteId(siteId);
        if (siteId) fetchDprLists(Number(siteId));
    };

    const handleDeleteDpr = async (id: number) => {
        if (window.confirm("Are you sure you want to delete this report?")) {
            try {
                await dprService.delete(id);
                toast.success("Report deleted successfully!");
                if (selectedSiteId) fetchDprLists(Number(selectedSiteId));
            } catch (error) {
                toast.error("Failed to delete report");
            }
        }
    };

    // Material Approvals State
    const [showMaterialApprovalsList, setShowMaterialApprovalsList] = useState(false);
    const [materialApprovalsList, setMaterialApprovalsList] = useState<any[]>([]);
    const [isLoadingMaterialApprovals, setIsLoadingMaterialApprovals] = useState(false);

    const fetchMomMeetings = async () => {
        setIsLoadingMom(true);
        try {
            // Fetch all meetings since there's no site context here yet.
            const data = await momMeetingService.getAllMeetings();
            setMomMeetings(data);
        } catch (error) {
            console.error("Failed to load MOM lists", error);
        } finally {
            setIsLoadingMom(false);
        }
    };

    useEffect(() => {
        if (showMomList) {
            fetchMomMeetings();
        }
    }, [showMomList]);

    const fetchDocuments = async () => {
        setIsLoadingLetters(true);
        setIsLoadingMaterialApprovals(true);
        try {
            const data = await siteDocumentService.getAllDocuments();
            
            // Letters/Communication By Mytech
            const letters = data.filter(d => d.documentType === 'Letters/Communication By Mytech')
                                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            
            const groupedLetters: any[] = [];
            letters.forEach(doc => {
                const group = groupedLetters.find(g => 
                    g.siteId === doc.siteId && 
                    g.customerId === doc.customerId && 
                    g.secondaryCustomerId === doc.secondaryCustomerId &&
                    Math.abs(new Date(g.createdAt).getTime() - new Date(doc.createdAt).getTime()) < 60000
                );
                if (group) { group.documents.push(doc); } 
                else { groupedLetters.push({ id: groupedLetters.length + 1, siteId: doc.siteId, siteName: doc.siteName, customerId: doc.customerId, customerName: doc.customerName, secondaryCustomerId: doc.secondaryCustomerId, secondaryCustomerName: doc.secondaryCustomerName, createdAt: doc.createdAt, documents: [doc] }); }
            });
            setLettersList(groupedLetters);

            // Material Approvals
            const approvals = data.filter(d => d.documentType === 'Material Approvals')
                                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            
            const groupedApprovals: any[] = [];
            approvals.forEach(doc => {
                const group = groupedApprovals.find(g => 
                    g.siteId === doc.siteId && 
                    g.customerId === doc.customerId && 
                    g.secondaryCustomerId === doc.secondaryCustomerId &&
                    Math.abs(new Date(g.createdAt).getTime() - new Date(doc.createdAt).getTime()) < 60000
                );
                if (group) { group.documents.push(doc); } 
                else { groupedApprovals.push({ id: groupedApprovals.length + 1, siteId: doc.siteId, siteName: doc.siteName, customerId: doc.customerId, customerName: doc.customerName, secondaryCustomerId: doc.secondaryCustomerId, secondaryCustomerName: doc.secondaryCustomerName, createdAt: doc.createdAt, documents: [doc] }); }
            });
            setMaterialApprovalsList(groupedApprovals);

        } catch (error) {
            console.error("Failed to load documents list", error);
        } finally {
            setIsLoadingLetters(false);
            setIsLoadingMaterialApprovals(false);
        }
    };

    useEffect(() => {
        if (showLettersList || showMaterialApprovalsList) {
            fetchDocuments();
        }
    }, [showLettersList, showMaterialApprovalsList]);

    useEffect(() => {
        const handleRefreshDocs = () => {
            if (showLettersList || showMaterialApprovalsList) fetchDocuments();
        };
        window.addEventListener('REFRESH_PROJECT_DOCUMENTS', handleRefreshDocs);
        return () => window.removeEventListener('REFRESH_PROJECT_DOCUMENTS', handleRefreshDocs);
    }, [showLettersList, showMaterialApprovalsList]);

    const handleMomSubmit = async (data: any) => {
        try {
            await momMeetingService.createMeeting(data);
            toast.success("Minutes of Meeting saved successfully!");
            setShowMomModal(false);
            if (showMomList) fetchMomMeetings();
        } catch (error: any) {
            console.error("Failed to create MOM", error);
            toast.error(error?.response?.data?.message || error?.response?.data?.detail || "Failed to create MOM. Please try again.");
            throw error; // Rethrow so the modal can stop its loading spinner
        }
    };

    const handleViewMom = (meeting: MomMeetingDto) => {
        setSelectedMom(meeting);
        setIsMomViewOnly(true);
        setShowMomModal(true);
    };

    const handleEditMom = (meeting: MomMeetingDto) => {
        setSelectedMom(meeting);
        setIsMomViewOnly(false);
        setShowMomModal(true);
    };

    const handleDeleteMom = async (id: number) => {
        if (window.confirm("Are you sure you want to delete this meeting?")) {
            try {
                await momMeetingService.deleteMeeting(id);
                toast.success("Meeting deleted successfully!");
                fetchMomMeetings();
            } catch (error) {
                toast.error("Failed to delete meeting");
            }
        }
    };

    useEffect(() => {
        const handleRefresh = () => {
            if (selectedLocation) {
                fetchToolsLists(selectedLocation);
            }
        };
        window.addEventListener("REFRESH_TOOLS_LIST", handleRefresh);
        return () => window.removeEventListener("REFRESH_TOOLS_LIST", handleRefresh);
    }, [selectedLocation]);

    const fetchToolsLists = async (location: string) => {
        setIsLoadingTools(true);
        try {
            const data = await materialReceivingService.getFormsByLocation(location);
            setToolsLists(data);
        } catch (error) {
            console.error("Failed to load tools lists", error);
        } finally {
            setIsLoadingTools(false);
        }
    };

    const handleLocationSelect = (loc: string) => {
        setSelectedLocation(loc);
        fetchToolsLists(loc);
    };
    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex justify-between items-center bg-card border border-border rounded-xl p-6 shadow-sm">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight mb-2">Project Documents</h1>
                    <p className="text-muted-foreground">Select a document type to create and fill out the form.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Project Scope Card */}
                <button 
                    onClick={() => window.dispatchEvent(new CustomEvent('OPEN_PROJECT_DOCUMENT_MODAL', { detail: { documentType: 'Project Scope' } }))}
                    className="flex flex-col items-center justify-center p-8 bg-card border border-border rounded-xl hover:border-primary/50 hover:shadow-md transition-all group"
                >
                    <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <FileSignature className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2 text-foreground group-hover:text-primary transition-colors">Project Scope</h3>
                    <p className="text-sm text-muted-foreground text-center">Fill out the project scope document and link it to a site and customer.</p>
                    <div className="mt-4 flex items-center text-sm font-medium text-primary">
                        <Plus className="h-4 w-4 mr-1" /> Create Document
                    </div>
                </button>
                {/* Project Drawings IFC Card */}
                <button 
                    onClick={() => window.dispatchEvent(new CustomEvent('OPEN_PROJECT_DOCUMENT_MODAL', { detail: { documentType: 'Project Drawings IFC' } }))}
                    className="flex flex-col items-center justify-center p-8 bg-card border border-border rounded-xl hover:border-primary/50 hover:shadow-md transition-all group"
                >
                    <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <FileSignature className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2 text-foreground group-hover:text-primary transition-colors">Project Drawings IFC</h3>
                    <p className="text-sm text-muted-foreground text-center">Fill out the project drawings document and link it to a site and customer.</p>
                    <div className="mt-4 flex items-center text-sm font-medium text-primary">
                        <Plus className="h-4 w-4 mr-1" /> Create Document
                    </div>
                </button>

                {/* Approved Project Drawings Shop Card */}
                <button 
                    onClick={() => window.dispatchEvent(new CustomEvent('OPEN_PROJECT_DOCUMENT_MODAL', { detail: { documentType: 'Approved Project Drawings Shop' } }))}
                    className="flex flex-col items-center justify-center p-8 bg-card border border-border rounded-xl hover:border-primary/50 hover:shadow-md transition-all group"
                >
                    <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <FileSignature className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2 text-foreground group-hover:text-primary transition-colors text-center">Approved Project Drawings Shop</h3>
                    <p className="text-sm text-muted-foreground text-center">Fill out the approved shop drawings document and link it to a site and customer.</p>
                    <div className="mt-4 flex items-center text-sm font-medium text-primary">
                        <Plus className="h-4 w-4 mr-1" /> Create Document
                    </div>
                </button>

                {/* Letters/Communication By Mytech Card */}
                <button 
                    onClick={() => window.dispatchEvent(new CustomEvent('OPEN_PROJECT_DOCUMENT_MODAL', { detail: { documentType: 'Letters/Communication By Mytech' } }))}
                    className="flex flex-col items-center justify-center p-8 bg-card border border-border rounded-xl hover:border-primary/50 hover:shadow-md transition-all group"
                >
                    <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <FileSignature className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2 text-foreground group-hover:text-primary transition-colors text-center">Letters/Communication By Mytech</h3>
                    <p className="text-sm text-muted-foreground text-center">Upload letter and communication documents and link them to a site and customer.</p>
                    <div className="mt-4 flex items-center text-sm font-medium text-primary">
                        <Plus className="h-4 w-4 mr-1" /> Create Document
                    </div>
                </button>

                {/* Material Approvals Card */}
                <button 
                    onClick={() => window.dispatchEvent(new CustomEvent('OPEN_PROJECT_DOCUMENT_MODAL', { detail: { documentType: 'Material Approvals' } }))}
                    className="flex flex-col items-center justify-center p-8 bg-card border border-border rounded-xl hover:border-primary/50 hover:shadow-md transition-all group"
                >
                    <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <FileCheck className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2 text-foreground group-hover:text-primary transition-colors text-center">Material Approvals</h3>
                    <p className="text-sm text-muted-foreground text-center">Upload material approval documents and link them to a site and customer.</p>
                    <div className="mt-4 flex items-center text-sm font-medium text-primary">
                        <Plus className="h-4 w-4 mr-1" /> Create Document
                    </div>
                </button>

                {/* Tools List Card */}
                <button 
                    onClick={() => window.dispatchEvent(new CustomEvent('OPEN_TOOLS_LIST_MODAL'))}
                    className="flex flex-col items-center justify-center p-8 bg-card border border-border rounded-xl hover:border-primary/50 hover:shadow-md transition-all group"
                >
                    <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <Wrench className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2 text-foreground group-hover:text-primary transition-colors text-center">Tools List</h3>
                    <p className="text-sm text-muted-foreground text-center">Fill out the dynamic tools list for your location.</p>
                    <div className="mt-4 flex items-center text-sm font-medium text-primary">
                        <Plus className="h-4 w-4 mr-1" /> Create Document
                    </div>
                </button>

                {/* MOM Card */}
                <button 
                    onClick={() => {
                        setSelectedMom(null);
                        setIsMomViewOnly(false);
                        setShowMomModal(true);
                    }}
                    className="flex flex-col items-center justify-center p-8 bg-card border border-border rounded-xl hover:border-primary/50 hover:shadow-md transition-all group"
                >
                    <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <Users className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2 text-foreground group-hover:text-primary transition-colors text-center">Minutes of Meeting</h3>
                    <p className="text-sm text-muted-foreground text-center">Create and view minutes of meeting details.</p>
                    <div className="mt-4 flex items-center text-sm font-medium text-primary">
                        <Plus className="h-4 w-4 mr-1" /> Create MOM
                    </div>
                </button>

                
                {/* DPR Card */}
                <button 
                    onClick={() => {
                        setShowToolsDetails(false);
                        setShowMaterialReceivingDetails(false);
                        setShowMomList(false);
                        setShowLettersList(false);
                        setShowMaterialApprovalsList(false);
                        window.dispatchEvent(new CustomEvent('OPEN_DPR_MODAL'));
                    }}
                    className="flex flex-col items-center justify-center p-8 bg-card border border-border rounded-xl hover:border-primary/50 hover:shadow-md transition-all group"
                >
                    <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <FileCheck className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2 text-foreground group-hover:text-primary transition-colors text-center">DPR (Daily progress report)</h3>
                    <p className="text-sm text-muted-foreground text-center">Daily site progress report.</p>
                </button>

                {/* Project Tool Site (Material Receiving) Card */}
                <button 
                    onClick={() => window.dispatchEvent(new CustomEvent('OPEN_MATERIAL_RECEIVING_MODAL'))}
                    className="flex flex-col items-center justify-center p-8 bg-card border border-border rounded-xl hover:border-primary/50 hover:shadow-md transition-all group"
                >
                    <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <Wrench className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2 text-foreground group-hover:text-primary transition-colors text-center">Project Tool Site</h3>
                    <p className="text-sm text-muted-foreground text-center">Fill out the project tool site list.</p>
                </button>

                {/* Project BOQ Card */}
                <button 
                    onClick={() => window.dispatchEvent(new CustomEvent('OPEN_PROJECT_DOCUMENT_MODAL', { detail: { documentType: 'Project BOQ' } }))}
                    className="flex flex-col items-center justify-center p-8 bg-card border border-border rounded-xl hover:border-primary/50 hover:shadow-md transition-all group"
                >
                    <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <FileSignature className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2 text-foreground group-hover:text-primary transition-colors text-center">Project BOQ</h3>
                    <p className="text-sm text-muted-foreground text-center">Upload project BOQ documents and link them to a site and customer.</p>
                    <div className="mt-4 flex items-center text-sm font-medium text-primary">
                        <Plus className="h-4 w-4 mr-1" /> Create Document
                    </div>
                </button>

                {/* Future Document Cards can be added here */}
                <div className="flex flex-col items-center justify-center p-8 bg-muted/20 border border-dashed border-border rounded-xl text-muted-foreground">
                    <p className="text-sm">More document types coming soon...</p>
                </div>
            </div>

            
            {/* DPR List Section */}
            <div className="mt-12 bg-card border border-border rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold tracking-tight text-primary">Daily Site Progress Report List</h2>
                    <div className="flex items-center space-x-4">
                        <button 
                            onClick={() => window.dispatchEvent(new CustomEvent('OPEN_DPR_MODAL'))}
                            className="flex items-center space-x-1 text-sm font-medium text-primary hover:underline bg-primary/10 px-3 py-1.5 rounded-md transition-colors"
                        >
                            <Plus className="h-4 w-4" />
                            <span>Create DPR</span>
                        </button>
                        <button 
                            onClick={() => setShowDprDetails(!showDprDetails)}
                            className="text-sm font-medium text-primary hover:underline"
                        >
                            {showDprDetails ? "Hide Details" : "Show Details"}
                        </button>
                    </div>
                </div>

                {showDprDetails && (
                    <div className="space-y-6 pt-4 border-t border-border">
                        <div>
                            <p className="text-sm text-muted-foreground mb-3">Select a site to view the daily progress reports:</p>
                            <select 
                                value={selectedSiteId} 
                                onChange={(e) => handleDprSiteSelect(Number(e.target.value) || "")}
                                className="w-full md:w-1/3 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                            >
                                <option value="">-- Select Site --</option>
                                {sites.map(site => (
                                    <option key={site.id} value={site.id}>{site.name}</option>
                                ))}
                            </select>
                        </div>

                        {selectedSiteId && (
                            <div>
                                <h3 className="font-semibold text-lg mb-4">Daily Site Progress Reports</h3>
                                {isLoadingDpr ? (
                                    <div className="flex justify-center items-center py-12">
                                        <Loader2 className="h-8 w-8 animate-spin text-primary/60" />
                                    </div>
                                ) : dprLists.length === 0 ? (
                                    <div className="text-center py-12 bg-secondary/10 rounded-lg border border-dashed border-border">
                                        <p className="text-muted-foreground">No reports found for this site.</p>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto border border-border rounded-lg bg-card mt-4">
                                        <table className="w-full text-sm text-left">
                                            <thead className="bg-secondary/50 border-b border-border">
                                                <tr>
                                                    <th className="px-4 py-3 text-center border-r border-border">No.</th>
                                                    <th className="px-4 py-3 border-r border-border">Project Name</th>
                                                    <th className="px-4 py-3 border-r border-border">Site In-charge</th>
                                                    <th className="px-4 py-3 text-center border-r border-border">Total workers</th>
                                                    <th className="px-4 py-3 border-r border-border">Date</th>
                                                    <th className="px-4 py-3 border-r border-border">Site Opening Time</th>
                                                    <th className="px-4 py-3 border-r border-border">Site Closing Time</th>
                                                    <th className="px-4 py-3 text-center border-r border-border">All Activities</th>
                                                    <th className="px-4 py-3 text-center border-r border-border">All Items</th>
                                                    <th className="px-4 py-3 text-center border-r border-border">Employee Lists</th>
                                                    <th className="px-4 py-3 text-center border-r border-border">Attachments</th>
                                                    <th className="px-4 py-3 text-center">View</th>
                                                    <th className="px-4 py-3 text-center">Action</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {dprLists.map((report, idx) => (
                                                    <tr key={report.id} className="border-b border-border last:border-0 hover:bg-secondary/20 transition-colors">
                                                        <td className="px-4 py-3 text-center border-r border-border">{idx + 1}</td>
                                                        <td className="px-4 py-3 border-r border-border">{report.siteName}</td>
                                                        <td className="px-4 py-3 border-r border-border">{report.siteInCharge}</td>
                                                        <td className="px-4 py-3 text-center border-r border-border">{report.totalWorkers}</td>
                                                        <td className="px-4 py-3 border-r border-border">
                                                            {new Date(report.date).toLocaleDateString()}<br />
                                                            <span className="text-xs text-muted-foreground">{new Date(report.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                                        </td>
                                                        <td className="px-4 py-3 border-r border-border">{report.siteOpeningTime}</td>
                                                        <td className="px-4 py-3 border-r border-border">{report.siteClosingTime}</td>
                                                        <td className="px-4 py-3 text-center border-r border-border">
                                                            <button onClick={() => {setSelectedReportForDetails(report); setDprViewMode('activities');}} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded text-xs font-medium transition-colors">All Activities</button>
                                                        </td>
                                                        <td className="px-4 py-3 text-center border-r border-border">
                                                            <button onClick={() => {setSelectedReportForDetails(report); setDprViewMode('items');}} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded text-xs font-medium transition-colors">All Items</button>
                                                        </td>
                                                        <td className="px-4 py-3 text-center border-r border-border">
                                                            <button onClick={() => {setSelectedReportForDetails(report); setDprViewMode('employees');}} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded text-xs font-medium transition-colors">All Employee</button>
                                                        </td>
                                                        <td className="px-4 py-3 text-center border-r border-border">
                                                            <button onClick={() => {setSelectedReportForDetails(report); setDprViewMode('attachments');}} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded text-xs font-medium transition-colors">View</button>
                                                        </td>
                                                        <td className="px-4 py-3 text-center border-r border-border">
                                                            <div className="flex flex-col space-y-1">
                                                                <button onClick={() => window.open(`/dpr/${report.id}/print?siteId=${selectedSiteId}`, '_blank')} className="bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded text-xs font-medium transition-colors">PDF</button>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3 text-center">
                                                            <button onClick={() => handleDeleteDpr(report.id)} className="text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 px-3 py-1.5 rounded text-sm font-medium transition-colors">
                                                                Delete
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Project Tool Site / Material Receiving List Section */}
            <div className="mt-12 bg-card border border-border rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold tracking-tight text-primary">Project Tool Site List</h2>
                    <button 
                        onClick={() => setShowMaterialReceivingDetails(!showMaterialReceivingDetails)}
                        className="text-sm font-medium text-primary hover:underline"
                    >
                        {showMaterialReceivingDetails ? "Hide Details" : "Show Details"}
                    </button>
                </div>

                {showMaterialReceivingDetails && (
                    <div className="space-y-6 pt-4 border-t border-border">
                        <div>
                            <p className="text-sm text-muted-foreground mb-3">Select a site to view the project tool site lists:</p>
                            <select 
                                value={selectedSiteId} 
                                onChange={(e) => handleSiteSelect(e.target.value === "" ? "" : Number(e.target.value))}
                                className="w-full md:w-1/3 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                            >
                                <option value="">-- Select Site --</option>
                                {sites.map(site => (
                                    <option key={site.id} value={site.id}>{site.name}</option>
                                ))}
                            </select>
                        </div>

                        {selectedSiteId && (
                            <div className="bg-secondary/20 rounded-lg p-6 border border-border">
                                <h3 className="font-semibold text-lg mb-4">Project Tool Site Lists</h3>
                                
                                {isLoadingMaterialReceiving ? (
                                    <div className="flex justify-center p-8">
                                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                    </div>
                                ) : materialReceivingLists.length > 0 ? (
                                    <div className="space-y-6">
                                        {materialReceivingLists.map((list) => (
                                            <div key={list.id} className="bg-card border border-border rounded-lg overflow-hidden shadow-sm">
                                                <div className="bg-secondary/50 px-4 py-3 border-b border-border flex justify-between items-center">
                                                    <div>
                                                        <span className="font-medium">Form #{list.id}</span>
                                                        <span className="text-xs text-muted-foreground ml-2">Created by: {list.createdByUserName || "System"}</span>
                                                    </div>
                                                    <span className="text-xs text-muted-foreground">
                                                        {new Date(list.createdAt).toLocaleDateString()}
                                                    </span>
                                                </div>
                                                <div className="p-0">
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
                                ) : (
                                    <div className="text-center p-8 text-muted-foreground bg-card border border-dashed border-border rounded-lg">
                                        <Search className="h-8 w-8 mx-auto mb-2 opacity-20" />
                                        <p>No lists found for this site</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Tools List Details Section (Footer) */}
            <div className="mt-12 bg-card border border-border rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold tracking-tight text-primary">Tools List Details</h2>
                    <button 
                        onClick={() => setShowToolsDetails(!showToolsDetails)}
                        className="text-sm font-medium text-primary hover:underline"
                    >
                        {showToolsDetails ? "Hide Details" : "Show Details"}
                    </button>
                </div>

                {showToolsDetails && (
                    <div className="space-y-6 pt-4 border-t border-border">
                        <div>
                            <p className="text-sm text-muted-foreground mb-3">Select a city to view the tools list details:</p>
                            <div className="flex flex-wrap gap-2">
                                {LOCATIONS.map(loc => (
                                    <button
                                        key={loc}
                                        onClick={() => handleLocationSelect(loc)}
                                        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                                            selectedLocation === loc 
                                            ? "bg-primary text-primary-foreground" 
                                            : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                                        }`}
                                    >
                                        {loc}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {selectedLocation && (
                            <div className="bg-secondary/20 rounded-lg p-6 border border-border">
                                <h3 className="font-semibold text-lg mb-4">Tools for {selectedLocation}</h3>
                                
                                {isLoadingTools ? (
                                    <div className="flex justify-center p-8">
                                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                    </div>
                                ) : toolsLists.length > 0 ? (
                                    <div className="space-y-6">
                                        {toolsLists.map((list) => (
                                            <div key={list.id} className="bg-card border border-border rounded-lg overflow-hidden shadow-sm">
                                                <div className="bg-secondary/50 px-4 py-3 border-b border-border flex justify-between items-center">
                                                    <div>
                                                        <span className="font-medium">List #{list.id}</span>
                                                        <span className="text-xs text-muted-foreground ml-2">Created by: {list.createdByUserName || "System"}</span>
                                                    </div>
                                                    <span className="text-xs text-muted-foreground">
                                                        {new Date(list.createdAt).toLocaleDateString()}
                                                    </span>
                                                </div>
                                                <div className="p-0">
                                                    <table className="w-full text-sm text-left">
                                                        <thead className="bg-muted/30 text-muted-foreground">
                                                            <tr>
                                                                <th className="px-4 py-2 font-medium">Item Name</th>
                                                                <th className="px-4 py-2 font-medium">Received</th>
                                                                <th className="px-4 py-2 font-medium">Remarks</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-border">
                                                            {list.items.map((item, idx) => (
                                                                <tr key={idx} className="hover:bg-muted/10 transition-colors">
                                                                    <td className="px-4 py-2 font-medium">{item.itemName}</td>
                                                                    <td className="px-4 py-2">{item.received || "-"}</td>
                                                                    <td className="px-4 py-2 text-muted-foreground">{item.remarks || "-"}</td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center p-8 text-muted-foreground bg-card border border-dashed border-border rounded-lg">
                                        <Search className="h-8 w-8 mx-auto mb-2 opacity-20" />
                                        <p>No tools lists found for {selectedLocation}</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Meeting Closure List Section (Footer) */}
            <div className="mt-6 bg-card border border-border rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold tracking-tight text-primary">Meeting Closure List</h2>
                    <button 
                        onClick={() => setShowMomList(!showMomList)}
                        className="text-sm font-medium text-primary hover:underline"
                    >
                        {showMomList ? "Hide Details" : "Show Details"}
                    </button>
                </div>

                {showMomList && (
                    <div className="pt-4 border-t border-border">
                        {isLoadingMom ? (
                            <div className="flex justify-center p-8">
                                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                            </div>
                        ) : momMeetings.length > 0 ? (
                            <div className="overflow-x-auto bg-card rounded-lg border border-border">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-muted/30 text-center text-muted-foreground border-b border-border">
                                        <tr>
                                            <th className="px-4 py-3 font-semibold">No.</th>
                                            <th className="px-4 py-3 font-semibold">Meeting Title</th>
                                            <th className="px-4 py-3 font-semibold">Date</th>
                                            <th className="px-4 py-3 font-semibold">Time</th>
                                            <th className="px-4 py-3 font-semibold">Organizer</th>
                                            <th className="px-4 py-3 font-semibold">Present Employees</th>
                                            <th className="px-4 py-3 font-semibold">Absent Employees</th>
                                            <th className="px-4 py-3 font-semibold">All Employees</th>
                                            <th className="px-4 py-3 font-semibold">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border text-center">
                                        {momMeetings.map((m, idx) => {
                                            const present = m.attendees.filter(a => a.employeeStatus?.toLowerCase() === 'present').length;
                                            const absent = m.attendees.filter(a => a.employeeStatus?.toLowerCase() === 'absent').length;
                                            const total = m.attendees.length;
                                            
                                            return (
                                                <tr key={m.id} className="hover:bg-muted/10 transition-colors">
                                                    <td className="px-4 py-3">{idx + 1}</td>
                                                    <td className="px-4 py-3">{m.meetingTitle}</td>
                                                    <td className="px-4 py-3">{new Date(m.meetingDate).toLocaleDateString()}</td>
                                                    <td className="px-4 py-3">{m.timeFrom} - {m.timeTo}</td>
                                                    <td className="px-4 py-3">{m.organizer}</td>
                                                    <td className="px-4 py-3">{present}</td>
                                                    <td className="px-4 py-3">{absent}</td>
                                                    <td className="px-4 py-3">{total}</td>
                                                    <td className="px-4 py-3">
                                                        <div className="flex justify-center gap-2">
                                                            <button className="text-blue-500 hover:underline" onClick={() => handleViewMom(m)}>View</button>
                                                            <button className="text-amber-500 hover:underline" onClick={() => handleEditMom(m)}>Edit</button>
                                                            <button className="text-red-500 hover:underline" onClick={() => handleDeleteMom(m.id)}>Delete</button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="text-center p-8 text-muted-foreground bg-card border border-dashed border-border rounded-lg">
                                <p>No meetings found.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Letters/Communication By Mytech List Section (Footer) */}
            <div className="mt-6 bg-card border border-border rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold tracking-tight text-primary">Letters/Communication By Mytech List</h2>
                    <button 
                        onClick={() => setShowLettersList(!showLettersList)}
                        className="text-sm font-medium text-primary hover:underline"
                    >
                        {showLettersList ? "Hide Details" : "Show Details"}
                    </button>
                </div>

                {showLettersList && (
                    <div className="pt-4 border-t border-border">
                        {isLoadingLetters ? (
                            <div className="flex justify-center p-8">
                                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                            </div>
                        ) : lettersList.length > 0 ? (
                            <div className="overflow-x-auto bg-card rounded-lg border border-border">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-muted/30 text-center text-muted-foreground border-b border-border">
                                        <tr>
                                            <th className="px-4 py-3 font-semibold">ID</th>
                                            <th className="px-4 py-3 font-semibold">Site/Project</th>
                                            <th className="px-4 py-3 font-semibold">Customer</th>
                                            <th className="px-4 py-3 font-semibold">Filename</th>
                                            <th className="px-4 py-3 font-semibold">Date Time</th>
                                            <th className="px-4 py-3 font-semibold">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border text-center">
                                        {lettersList.map((group) => (
                                            <tr key={group.id} className="hover:bg-muted/10 transition-colors">
                                                <td className="px-4 py-4 align-top">{group.id}</td>
                                                <td className="px-4 py-4 align-top">{group.siteName}</td>
                                                <td className="px-4 py-4 align-top">
                                                    {group.customerName || "-"}
                                                    {group.secondaryCustomerName ? <span className="block text-xs text-muted-foreground mt-1">Sec: {group.secondaryCustomerName}</span> : null}
                                                </td>
                                                <td className="px-4 py-4 text-left align-top">
                                                    <div className="flex flex-col gap-3">
                                                        {group.documents.map((d: any) => (
                                                            <a key={d.id} href={d.fileUrl} target="_blank" rel="noopener noreferrer" className="hover:underline font-medium text-primary flex items-center gap-1">
                                                                <FileSignature className="h-4 w-4 shrink-0" /> <span className="truncate">{d.fileName}</span>
                                                            </a>
                                                        ))}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4 align-top">{new Date(group.createdAt).toLocaleString()}</td>
                                                <td className="px-4 py-4 align-top">
                                                    <div className="flex flex-col gap-3">
                                                        {group.documents.map((d: any) => (
                                                            <div key={d.id} className="flex justify-center gap-3">
                                                                <a href={d.fileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-600 transition-colors" title="View">
                                                                    <Eye className="h-4 w-4" />
                                                                </a>
                                                                <a href={d.downloadUrl} className="text-emerald-500 hover:text-emerald-600 transition-colors" title="Download">
                                                                    <Download className="h-4 w-4" />
                                                                </a>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="text-center p-8 text-muted-foreground bg-card border border-dashed border-border rounded-lg">
                                <p>No letters or communication documents found.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Material Approvals List Section */}
            <div className="mt-6 bg-card border border-border rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold tracking-tight text-primary">Material Approvals</h2>
                    <button 
                        onClick={() => setShowMaterialApprovalsList(!showMaterialApprovalsList)}
                        className="text-sm font-medium text-primary hover:underline"
                    >
                        {showMaterialApprovalsList ? "Hide Details" : "Show Details"}
                    </button>
                </div>

                {showMaterialApprovalsList && (
                    <div className="pt-4 border-t border-border">
                        {isLoadingMaterialApprovals ? (
                            <div className="flex justify-center p-8">
                                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                            </div>
                        ) : materialApprovalsList.length > 0 ? (
                            <div className="overflow-x-auto bg-card rounded-lg border border-border">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-muted/30 text-center text-muted-foreground border-b border-border">
                                        <tr>
                                            <th className="px-4 py-3 font-semibold">ID</th>
                                            <th className="px-4 py-3 font-semibold">Filename</th>
                                            <th className="px-4 py-3 font-semibold">Date Time</th>
                                            <th className="px-4 py-3 font-semibold">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border text-center">
                                        {materialApprovalsList.map((group) => (
                                            <tr key={group.id} className="hover:bg-muted/10 transition-colors">
                                                <td className="px-4 py-4 align-top">{group.id}</td>
                                                <td className="px-4 py-4 text-left align-top">
                                                    <div className="flex flex-col gap-3">
                                                        {group.documents.map((d: any) => (
                                                            <a key={d.id} href={d.fileUrl} target="_blank" rel="noopener noreferrer" className="hover:underline font-medium text-primary flex items-center gap-1">
                                                                <FileCheck className="h-4 w-4 shrink-0" /> <span className="truncate">{d.fileName}</span>
                                                            </a>
                                                        ))}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4 align-top">{new Date(group.createdAt).toLocaleString()}</td>
                                                <td className="px-4 py-4 align-top">
                                                    <div className="flex flex-col gap-3">
                                                        {group.documents.map((d: any) => (
                                                            <div key={d.id} className="flex justify-center gap-3">
                                                                <a href={d.fileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-600 transition-colors" title="View">
                                                                    <Eye className="h-4 w-4" />
                                                                </a>
                                                                <a href={d.downloadUrl} className="text-emerald-500 hover:text-emerald-600 transition-colors" title="Download">
                                                                    <Download className="h-4 w-4" />
                                                                </a>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="text-center p-8 text-muted-foreground bg-card border border-dashed border-border rounded-lg">
                                <p>No material approvals found.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <ProjectScopeModal />
            <ToolsListModal />
            <MaterialReceivingModal />
            <DailyProgressReportModal />
            <DprDetailsModal isOpen={!!dprViewMode} onClose={() => setDprViewMode(null)} report={selectedReportForDetails} viewMode={dprViewMode} />
            
            {showMomModal && (
                <MomMeetingModal 
                    show={showMomModal} 
                    onHide={() => setShowMomModal(false)} 
                    onSubmit={handleMomSubmit}
                    meeting={selectedMom}
                    isViewOnly={isMomViewOnly}
                />
            )}
        </div>
    );
};
