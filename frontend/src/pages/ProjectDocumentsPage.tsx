import { useState, useEffect } from "react";
import { FileSignature, Plus, Wrench, Search, Loader2 } from "lucide-react";
import { ProjectScopeModal } from "../components/common/ProjectScopeModal";
import { ToolsListModal } from "../components/common/ToolsListModal";
import { materialReceivingService, MaterialReceivingFormDto } from "../services/materialReceivingService";
import MomMeetingModal from "../components/MomMeetingModal";
import momMeetingService, { MomMeetingDto } from "../services/momMeetingService";
import { Users } from "lucide-react";
import { toast } from "react-hot-toast";

const LOCATIONS = ["Lahore", "Karachi", "Islamabad", "Peshawar", "Balochistan"];

export const ProjectDocumentsPage = () => {
    const [selectedLocation, setSelectedLocation] = useState<string>("");
    const [toolsLists, setToolsLists] = useState<MaterialReceivingFormDto[]>([]);
    const [isLoadingTools, setIsLoadingTools] = useState(false);
    const [showToolsDetails, setShowToolsDetails] = useState(false);

    // MOM State
    const [showMomModal, setShowMomModal] = useState(false);
    const [showMomList, setShowMomList] = useState(false);
    const [momMeetings, setMomMeetings] = useState<MomMeetingDto[]>([]);
    const [isLoadingMom, setIsLoadingMom] = useState(false);
    const [selectedMom, setSelectedMom] = useState<MomMeetingDto | null>(null);
    const [isMomViewOnly, setIsMomViewOnly] = useState(false);

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

                {/* Future Document Cards can be added here */}
                <div className="flex flex-col items-center justify-center p-8 bg-muted/20 border border-dashed border-border rounded-xl text-muted-foreground">
                    <p className="text-sm">More document types coming soon...</p>
                </div>
            </div>

            {/* Tools List Details Section (Footer) */}
            <div className="mt-12 bg-card border border-border rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold tracking-tight">Tools List Details</h2>
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
                            <div className="overflow-x-auto bg-white rounded-lg border border-border">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-light text-center text-muted-foreground border-b border-border">
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

            <ProjectScopeModal />
            <ToolsListModal />
            
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
