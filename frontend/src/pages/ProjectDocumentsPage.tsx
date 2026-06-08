import { useState, useEffect } from "react";
import { Users, Download, Eye, FileSignature, Plus, Wrench, Search, Loader2, FileCheck, FileText, Trash2 } from "lucide-react";
import { ProjectScopeModal } from "../components/common/ProjectScopeModal";
import { ToolsListModal } from "../components/common/ToolsListModal";
import { MaterialReceivingModal } from "../components/common/MaterialReceivingModal";
import { DailyProgressReportModal } from "../components/common/DailyProgressReportModal";
import { dprService, DailyProgressReportDto } from "../services/dprService";
import { DprDetailsModal, DprViewMode } from "../components/common/DprDetailsModal";
import { ConfirmModal } from "../components/common/ConfirmModal";
import { siteService } from "../services/siteService";
import { SiteDto } from "../types/site";
import { materialReceivingService, MaterialReceivingFormDto } from "../services/materialReceivingService";
import MomMeetingModal from "../components/MomMeetingModal";
import momMeetingService, { MomMeetingDto } from "../services/momMeetingService";
import MeetingMinutesExecutionModal from "../components/MeetingMinutesExecutionModal";
import meetingMinutesExecutionService, { MeetingMinutesExecutionDto } from "../services/meetingMinutesExecutionService";
import { itemProcurementService, ItemProcurementDto } from "../services/itemProcurementService";
import { ItemProcurementModal } from "../components/common/ItemProcurementModal";
import { ItemProcurementDetailsModal } from "../components/common/ItemProcurementDetailsModal";
import { siteDocumentService } from "../services/siteDocumentService";
// redundant import removed
import { toast } from "react-hot-toast";
import { ProjectTechnicalHandoverModal } from "../components/common/ProjectTechnicalHandoverModal";
import projectTechnicalHandoverService, { ProjectTechnicalHandoverDto } from "../services/projectTechnicalHandoverService";

import { ErrorBoundary } from '../components/common/ErrorBoundary';
import ToolBoxTalkModal from '../components/common/ToolBoxTalkModal';
import TrainingDetailModal from '../components/common/TrainingDetailModal';
import { ProjectSpotCheckModal } from '../components/common/ProjectSpotCheckModal';
import { toolBoxTalkService, ToolBoxTalkDto } from "../services/toolBoxTalkService";
import { trainingDetailService, TrainingDetailDto } from "../services/trainingDetailService";
import { getProjectSpotChecks, deleteProjectSpotCheck, ProjectSpotCheck } from "../services/projectSpotCheckService";

const LOCATIONS = ["Lahore", "Karachi", "Islamabad", "Peshawar", "Balochistan"];

export const ProjectDocumentsPage = () => {
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [confirmAction, setConfirmAction] = useState<{title: string, message: string, onConfirm: () => void} | null>(null);

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

    // MOM Execution State
    const [showMomExecutionModal, setShowMomExecutionModal] = useState(false);
    const [showMomExecutionList, setShowMomExecutionList] = useState(false);
    const [momExecutionMeetings, setMomExecutionMeetings] = useState<MeetingMinutesExecutionDto[]>([]);
    const [isLoadingMomExecution, setIsLoadingMomExecution] = useState(false);
    const [selectedMomExecution, setSelectedMomExecution] = useState<MeetingMinutesExecutionDto | null>(null);
    const [isMomExecutionViewOnly, setIsMomExecutionViewOnly] = useState(false);
    const [momExecutionToDelete, setMomExecutionToDelete] = useState<number | null>(null);

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
    const [dprToDelete, setDprToDelete] = useState<number | null>(null);

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

    const handleDeleteDpr = (id: number) => {
        setDprToDelete(id);
    };

    const confirmDeleteDpr = async () => {
        if (!dprToDelete) return;
        try {
            await dprService.delete(dprToDelete);
            toast.success("Report deleted successfully!");
            if (selectedSiteId) fetchDprLists(Number(selectedSiteId));
        } catch (error) {
            toast.error("Failed to delete report");
        } finally {
            setDprToDelete(null);
        }
    };

    // Material Approvals State
    const [showMaterialApprovalsList, setShowMaterialApprovalsList] = useState(false);
    const [materialApprovalsList, setMaterialApprovalsList] = useState<any[]>([]);
    const [isLoadingMaterialApprovals, setIsLoadingMaterialApprovals] = useState(false);

    // Approved Drawings State
    const [showApprovedDrawingsList, setShowApprovedDrawingsList] = useState(false);
    const [approvedDrawingsList, setApprovedDrawingsList] = useState<any[]>([]);
    const [isLoadingApprovedDrawings, setIsLoadingApprovedDrawings] = useState(false);

    // Risk Assessment State
    const [showRiskAssessmentList, setShowRiskAssessmentList] = useState(false);
    const [riskAssessmentList, setRiskAssessmentList] = useState<any[]>([]);
    const [isLoadingRiskAssessment, setIsLoadingRiskAssessment] = useState(false);

    // Tool Box Talk State
    const [showToolBoxTalkModal, setShowToolBoxTalkModal] = useState(false);
    const [showToolBoxTalkList, setShowToolBoxTalkList] = useState(false);
    const [toolBoxTalkList, setToolBoxTalkList] = useState<ToolBoxTalkDto[]>([]);
    const [isLoadingToolBoxTalk, setIsLoadingToolBoxTalk] = useState(false);
    const [toolBoxTalkEditId, setToolBoxTalkEditId] = useState<number | undefined>();

    // Project Spot Check State
    const [showSpotCheckModal, setShowSpotCheckModal] = useState(false);
    const [showSpotCheckList, setShowSpotCheckList] = useState(false);
    const [spotCheckList, setSpotCheckList] = useState<ProjectSpotCheck[]>([]);
    const [isLoadingSpotCheck, setIsLoadingSpotCheck] = useState(false);
    const [selectedSpotCheck, setSelectedSpotCheck] = useState<ProjectSpotCheck | null>(null);
    const [isSpotCheckViewOnly, setIsSpotCheckViewOnly] = useState(false);

    const fetchSpotChecks = async () => {
        setIsLoadingSpotCheck(true);
        try {
            const data = await getProjectSpotChecks();
            if (Array.isArray(data)) {
                setSpotCheckList(data);
            } else {
                console.error("Invalid data format for spot checks", data);
                setSpotCheckList([]);
            }
        } catch (error) {
            console.error("Error fetching spot checks", error);
            toast.error("Failed to load Project Spot Checks");
            setSpotCheckList([]);
        } finally {
            setIsLoadingSpotCheck(false);
        }
    };

    useEffect(() => {
        if (showSpotCheckList) {
            fetchSpotChecks();
        }
    }, [showSpotCheckList]);

    const confirmDeleteSpotCheck = async (id: number) => {
        try {
            await deleteProjectSpotCheck(id);
            toast.success("Spot Check deleted successfully");
            fetchSpotChecks();
        } catch (err) {
            toast.error("Failed to delete spot check");
        }
    };

    const fetchToolBoxTalks = async () => {
        setIsLoadingToolBoxTalk(true);
        try {
            const data = await toolBoxTalkService.getAll();
            setToolBoxTalkList(data);
        } catch (error) {
            console.error("Failed to load Tool Box Talks", error);
        } finally {
            setIsLoadingToolBoxTalk(false);
        }
    };

    // Training Details State
    const [showTrainingDetailModal, setShowTrainingDetailModal] = useState(false);
    const [showTrainingDetailList, setShowTrainingDetailList] = useState(false);
    const [trainingDetailList, setTrainingDetailList] = useState<TrainingDetailDto[]>([]);
    const [isLoadingTrainingDetail, setIsLoadingTrainingDetail] = useState(false);
    const [trainingDetailEditId, setTrainingDetailEditId] = useState<number | undefined>();

    const fetchTrainingDetails = async () => {
        setIsLoadingTrainingDetail(true);
        try {
            const data = await trainingDetailService.getAll();
            setTrainingDetailList(data);
        } catch (error) {
            console.error("Failed to load Training Details", error);
        } finally {
            setIsLoadingTrainingDetail(false);
        }
    };

    useEffect(() => {
        if (showToolBoxTalkList) {
            fetchToolBoxTalks();
        }
    }, [showToolBoxTalkList]);

    useEffect(() => {
        if (showTrainingDetailList) {
            fetchTrainingDetails();
        }
    }, [showTrainingDetailList]);

    const confirmDeleteAttendee = async (attendeeId: number) => {
        try {
            await toolBoxTalkService.deleteAttendee(attendeeId);
            toast.success("Attendee removed successfully!");
            fetchToolBoxTalks();
        } catch (error) {
            toast.error("Failed to remove attendee");
        }
    };

    const handleUpdateAttendeeStatus = async (attendeeId: number, name: string, status: string) => {
        try {
            await toolBoxTalkService.updateAttendee(attendeeId, { employeeName: name, status: status, id: attendeeId, toolBoxTalkId: 0 });
            toast.success("Attendee updated successfully!");
            fetchToolBoxTalks();
        } catch (error) {
            toast.error("Failed to update attendee");
        }
    };

    const confirmDeleteParticipant = async (participantId: number) => {
        try {
            await trainingDetailService.deleteParticipant(participantId);
            toast.success("Participant removed successfully!");
            fetchTrainingDetails();
        } catch (error) {
            toast.error("Failed to remove participant");
        }
    };

    const handleUpdateParticipantStatus = async (participantId: number, name: string, status: string) => {
        try {
            await trainingDetailService.updateParticipant(participantId, { name, status });
            toast.success("Participant status updated!");
            fetchTrainingDetails();
        } catch (error) {
            toast.error("Failed to update status");
        }
    };

    // Project Technical Handover State
    const [showHandoverModal, setShowHandoverModal] = useState(false);
    const [showHandoverList, setShowHandoverList] = useState(false);
    const [handoverList, setHandoverList] = useState<ProjectTechnicalHandoverDto[]>([]);
    const [isLoadingHandover, setIsLoadingHandover] = useState(false);
    const [selectedHandover, setSelectedHandover] = useState<ProjectTechnicalHandoverDto | null>(null);
    const [isHandoverViewOnly, setIsHandoverViewOnly] = useState(false);
    const [handoverToDelete, setHandoverToDelete] = useState<number | null>(null);

    const fetchHandovers = async () => {
        setIsLoadingHandover(true);
        try {
            const data = await projectTechnicalHandoverService.getAll();
            setHandoverList(data);
        } catch (error) {
            console.error("Failed to load Project Technical Handovers", error);
        } finally {
            setIsLoadingHandover(false);
        }
    };

    useEffect(() => {
        if (showHandoverList) {
            fetchHandovers();
        }
    }, [showHandoverList]);

    const confirmDeleteHandover = async () => {
        if (!handoverToDelete) return;
        try {
            await projectTechnicalHandoverService.delete(handoverToDelete);
            toast.success("Handover deleted successfully!");
            fetchHandovers();
        } catch (error) {
            toast.error("Failed to delete handover");
        } finally {
            setHandoverToDelete(null);
        }
    };

    // Item Procurement State
    const [showProcurementModal, setShowProcurementModal] = useState(false);
    const [showProcurementList, setShowProcurementList] = useState(false);
    const [procurementList, setProcurementList] = useState<ItemProcurementDto[]>([]);
    const [isLoadingProcurement, setIsLoadingProcurement] = useState(false);
    const [selectedProcurement, setSelectedProcurement] = useState<ItemProcurementDto | null>(null);
    const [showProcurementDetails, setShowProcurementDetails] = useState(false);
    const [procurementToDelete, setProcurementToDelete] = useState<number | null>(null);

    const fetchProcurements = async () => {
        setIsLoadingProcurement(true);
        try {
            const data = await itemProcurementService.getAll();
            setProcurementList(data);
        } catch (error) {
            console.error("Failed to load Item Procurements", error);
        } finally {
            setIsLoadingProcurement(false);
        }
    };

    useEffect(() => {
        if (showProcurementList) {
            fetchProcurements();
        }
    }, [showProcurementList]);

    const handleProcurementSubmit = async (data: any) => {
        try {
            if (selectedProcurement) {
                await itemProcurementService.update(selectedProcurement.id, data);
                toast.success("Item Procurement updated successfully!");
            } else {
                await itemProcurementService.create(data);
                toast.success("Item Procurement created successfully!");
            }
            setShowProcurementModal(false);
            if (showProcurementList) fetchProcurements();
        } catch (error: any) {
            console.error("Failed to save Item Procurement", error);
            toast.error("Failed to save Item Procurement.");
            throw error;
        }
    };

    const confirmDeleteProcurement = async () => {
        if (!procurementToDelete) return;
        try {
            await itemProcurementService.delete(procurementToDelete);
            toast.success("Procurement deleted successfully!");
            fetchProcurements();
        } catch (error) {
            toast.error("Failed to delete procurement");
        } finally {
            setProcurementToDelete(null);
        }
    };

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
        setIsLoadingApprovedDrawings(true);
        setIsLoadingRiskAssessment(true);
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

            // Approved Drawings
            const approvedDrawings = data.filter(d => d.documentType === 'Project Approved Project As built drawings')
                                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            
            const groupedApprovedDrawings: any[] = [];
            approvedDrawings.forEach(doc => {
                const group = groupedApprovedDrawings.find(g => 
                    g.siteId === doc.siteId && 
                    g.customerId === doc.customerId && 
                    g.secondaryCustomerId === doc.secondaryCustomerId &&
                    Math.abs(new Date(g.createdAt).getTime() - new Date(doc.createdAt).getTime()) < 60000
                );
                if (group) { group.documents.push(doc); } 
                else { groupedApprovedDrawings.push({ id: groupedApprovedDrawings.length + 1, siteId: doc.siteId, siteName: doc.siteName, customerId: doc.customerId, customerName: doc.customerName, secondaryCustomerId: doc.secondaryCustomerId, secondaryCustomerName: doc.secondaryCustomerName, createdAt: doc.createdAt, documents: [doc] }); }
            });
            setApprovedDrawingsList(groupedApprovedDrawings);

            // Risk Assessment Form
            const riskAssessment = data.filter(d => d.documentType === 'Project Risk Assessment Form')
                                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            
            const groupedRiskAssessment: any[] = [];
            riskAssessment.forEach(doc => {
                const group = groupedRiskAssessment.find(g => 
                    g.siteId === doc.siteId && 
                    g.customerId === doc.customerId && 
                    g.secondaryCustomerId === doc.secondaryCustomerId &&
                    Math.abs(new Date(g.createdAt).getTime() - new Date(doc.createdAt).getTime()) < 60000
                );
                if (group) { group.documents.push(doc); } 
                else { groupedRiskAssessment.push({ id: groupedRiskAssessment.length + 1, siteId: doc.siteId, siteName: doc.siteName, customerId: doc.customerId, customerName: doc.customerName, secondaryCustomerId: doc.secondaryCustomerId, secondaryCustomerName: doc.secondaryCustomerName, createdAt: doc.createdAt, documents: [doc] }); }
            });
            setRiskAssessmentList(groupedRiskAssessment);

        } catch (error) {
            console.error("Failed to load documents list", error);
        } finally {
            setIsLoadingLetters(false);
            setIsLoadingMaterialApprovals(false);
            setIsLoadingApprovedDrawings(false);
            setIsLoadingRiskAssessment(false);
        }
    };

    useEffect(() => {
        if (showLettersList || showMaterialApprovalsList || showApprovedDrawingsList || showRiskAssessmentList) {
            fetchDocuments();
        }
    }, [showLettersList, showMaterialApprovalsList, showApprovedDrawingsList, showRiskAssessmentList]);

    useEffect(() => {
        const handleRefreshDocs = () => {
            if (showLettersList || showMaterialApprovalsList || showApprovedDrawingsList || showRiskAssessmentList) fetchDocuments();
        };
        window.addEventListener('REFRESH_PROJECT_DOCUMENTS', handleRefreshDocs);
        return () => window.removeEventListener('REFRESH_PROJECT_DOCUMENTS', handleRefreshDocs);
    }, [showLettersList, showMaterialApprovalsList, showApprovedDrawingsList, showRiskAssessmentList]);

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

    const [momToDelete, setMomToDelete] = useState<number | null>(null);

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

    const handleDeleteMom = (id: number) => {
        setMomToDelete(id);
    };

    const confirmDeleteMom = async () => {
        if (!momToDelete) return;
        try {
            await momMeetingService.deleteMeeting(momToDelete);
            toast.success("Meeting deleted successfully!");
            fetchMomMeetings();
        } catch (error) {
            toast.error("Failed to delete meeting");
        } finally {
            setMomToDelete(null);
        }
    };

    const fetchMomExecutionMeetings = async () => {
        setIsLoadingMomExecution(true);
        try {
            const data = await meetingMinutesExecutionService.getAllMeetings();
            setMomExecutionMeetings(data);
        } catch (error) {
            console.error("Failed to load MOM Execution lists", error);
        } finally {
            setIsLoadingMomExecution(false);
        }
    };

    useEffect(() => {
        if (showMomExecutionList) {
            fetchMomExecutionMeetings();
        }
    }, [showMomExecutionList]);

    const handleMomExecutionSubmit = async (data: any) => {
        try {
            if (selectedMomExecution) {
                await meetingMinutesExecutionService.updateMeeting(selectedMomExecution.id, data);
                toast.success("Minutes of Execution Meeting updated successfully!");
            } else {
                await meetingMinutesExecutionService.createMeeting(data);
                toast.success("Minutes of Execution Meeting saved successfully!");
            }
            setShowMomExecutionModal(false);
            if (showMomExecutionList) fetchMomExecutionMeetings();
        } catch (error: any) {
            console.error("Failed to save MOM Execution", error);
            toast.error(error?.response?.data?.message || error?.response?.data?.detail || "Failed to save MOM Execution. Please try again.");
            throw error;
        }
    };

    const handleViewMomExecution = (meeting: MeetingMinutesExecutionDto) => {
        setSelectedMomExecution(meeting);
        setIsMomExecutionViewOnly(true);
        setShowMomExecutionModal(true);
    };

    const handleEditMomExecution = (meeting: MeetingMinutesExecutionDto) => {
        setSelectedMomExecution(meeting);
        setIsMomExecutionViewOnly(false);
        setShowMomExecutionModal(true);
    };

    const handleDeleteMomExecution = (id: number) => {
        setMomExecutionToDelete(id);
    };

    const confirmDeleteMomExecution = async () => {
        if (!momExecutionToDelete) return;
        try {
            await meetingMinutesExecutionService.deleteMeeting(momExecutionToDelete);
            toast.success("Meeting deleted successfully!");
            fetchMomExecutionMeetings();
        } catch (error) {
            toast.error("Failed to delete meeting");
        } finally {
            setMomExecutionToDelete(null);
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
                {/* Item Procurement Card */}
                <button 
                    onClick={() => {
                        setSelectedProcurement(null);
                        siteService.getAll().then(setSites).catch(console.error);
                        setShowProcurementModal(true);
                    }}
                    className="flex flex-col items-center justify-center p-8 bg-card border border-border rounded-xl hover:border-primary/50 hover:shadow-md transition-all group"
                >
                    <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <FileSignature className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2 text-foreground group-hover:text-primary transition-colors text-center">Item Procurement</h3>
                    <p className="text-sm text-muted-foreground text-center">Create and manage item procurement requests for sites.</p>
                    <div className="mt-4 flex items-center text-sm font-medium text-primary">
                        <Plus className="h-4 w-4 mr-1" /> Create Procurement
                    </div>
                </button>

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

                {/* Project Technical Handover Card */}
                <button 
                    onClick={() => {
                        setSelectedHandover(null);
                        setIsHandoverViewOnly(false);
                        setShowHandoverModal(true);
                    }}
                    className="flex flex-col items-center justify-center p-8 bg-card border border-border rounded-xl hover:border-primary/50 hover:shadow-md transition-all group"
                >
                    <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <FileText className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2 text-foreground group-hover:text-primary transition-colors text-center">Project Technical Handover</h3>
                    <p className="text-sm text-muted-foreground text-center">Create and manage technical handover documents with site and customer details.</p>
                    <div className="mt-4 flex items-center text-sm font-medium text-primary">
                        <Plus className="h-4 w-4 mr-1" /> Create Handover
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

                {/* Project Approved Project As built drawings Card */}
                <button 
                    onClick={() => window.dispatchEvent(new CustomEvent('OPEN_PROJECT_DOCUMENT_MODAL', { detail: { documentType: 'Project Approved Project As built drawings' } }))}
                    className="flex flex-col items-center justify-center p-8 bg-card border border-border rounded-xl hover:border-primary/50 hover:shadow-md transition-all group"
                >
                    <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <FileSignature className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2 text-foreground group-hover:text-primary transition-colors text-center">Project Approved Project As built drawings</h3>
                    <p className="text-sm text-muted-foreground text-center">Upload the approved as-built drawings and link it to a site and customer.</p>
                    <div className="mt-4 flex items-center text-sm font-medium text-primary">
                        <Plus className="h-4 w-4 mr-1" /> Create Document
                    </div>
                </button>

                {/* Project Risk Assessment Form Card */}
                <button 
                    onClick={() => window.dispatchEvent(new CustomEvent('OPEN_PROJECT_DOCUMENT_MODAL', { detail: { documentType: 'Project Risk Assessment Form' } }))}
                    className="flex flex-col items-center justify-center p-8 bg-card border border-border rounded-xl hover:border-primary/50 hover:shadow-md transition-all group"
                >
                    <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <FileSignature className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2 text-foreground group-hover:text-primary transition-colors text-center">Project Risk Assessment Form</h3>
                    <p className="text-sm text-muted-foreground text-center">Upload the project risk assessment form and link it to a site and customer.</p>
                    <div className="mt-4 flex items-center text-sm font-medium text-primary">
                        <Plus className="h-4 w-4 mr-1" /> Create Document
                    </div>
                </button>

                {/* Tool Box Talk Card */}
                <button 
                    onClick={() => {
                        setToolBoxTalkEditId(undefined);
                        setShowToolBoxTalkModal(true);
                    }}
                    className="flex flex-col items-center justify-center p-8 bg-card border border-border rounded-xl hover:border-primary/50 hover:shadow-md transition-all group"
                >
                    <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <FileSignature className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2 text-foreground group-hover:text-primary transition-colors text-center">Tool Box Talk</h3>
                    <p className="text-sm text-muted-foreground text-center">Create a tool box talk document with attendance.</p>
                    <div className="mt-4 flex items-center text-sm font-medium text-primary">
                        <Plus className="h-4 w-4 mr-1" /> Create Document
                    </div>
                </button>

                {/* Training Details Form Card */}
                <button 
                    onClick={() => {
                        setTrainingDetailEditId(undefined);
                        setShowTrainingDetailModal(true);
                    }}
                    className="flex flex-col items-center justify-center p-8 bg-card border border-border rounded-xl hover:border-primary/50 hover:shadow-md transition-all group"
                >
                    <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <FileSignature className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2 text-foreground group-hover:text-primary transition-colors text-center">Training Details Form</h3>
                    <p className="text-sm text-muted-foreground text-center">Fill out the Training Details document and link it to a site.</p>
                    <div className="mt-4 flex items-center text-sm font-medium text-primary">
                        <Plus className="h-4 w-4 mr-1" /> Create Form
                    </div>
                </button>

                {/* Project Spot Check Site Card */}
                <button 
                    onClick={() => {
                        setSelectedSpotCheck(null);
                        setIsSpotCheckViewOnly(false);
                        setShowSpotCheckModal(true);
                    }}
                    className="flex flex-col items-center justify-center p-8 bg-card border border-border rounded-xl hover:border-primary/50 hover:shadow-md transition-all group"
                >
                    <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <FileCheck className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2 text-foreground group-hover:text-primary transition-colors text-center">Project Spot Check Site</h3>
                    <p className="text-sm text-muted-foreground text-center">Create project spot checks and attach multiple files for the site.</p>
                    <div className="mt-4 flex items-center text-sm font-medium text-primary">
                        <Plus className="h-4 w-4 mr-1" /> Create Spot Check
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

                {/* MOM Execution Card */}
                <button 
                    onClick={() => {
                        setSelectedMomExecution(null);
                        setIsMomExecutionViewOnly(false);
                        setShowMomExecutionModal(true);
                    }}
                    className="flex flex-col items-center justify-center p-8 bg-card border border-border rounded-xl hover:border-primary/50 hover:shadow-md transition-all group"
                >
                    <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <Users className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2 text-foreground group-hover:text-primary transition-colors text-center">Minutes of Execution Meeting</h3>
                    <p className="text-sm text-muted-foreground text-center">Create and view minutes of execution meeting details.</p>
                    <div className="mt-4 flex items-center text-sm font-medium text-primary">
                        <Plus className="h-4 w-4 mr-1" /> Create MOM Execution
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
                        setShowApprovedDrawingsList(false);
                        setShowRiskAssessmentList(false);
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
                                                                <button onClick={() => dprService.downloadPdf(report.id)} className="bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded text-xs font-medium transition-colors">PDF</button>
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

            {/* Item Procurement List Section */}
            <div className="mt-12 bg-card border border-border rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold tracking-tight text-primary">Item Procurement List</h2>
                    <div className="flex items-center space-x-4">
                        <button 
                            onClick={() => {
                                setSelectedProcurement(null);
                                siteService.getAll().then(setSites).catch(console.error);
                                setShowProcurementModal(true);
                            }}
                            className="flex items-center space-x-1 text-sm font-medium text-primary hover:underline bg-primary/10 px-3 py-1.5 rounded-md transition-colors"
                        >
                            <Plus className="h-4 w-4" />
                            <span>Create Procurement</span>
                        </button>
                        <button 
                            onClick={() => setShowProcurementList(!showProcurementList)}
                            className="text-sm font-medium text-primary hover:underline"
                        >
                            {showProcurementList ? "Hide List" : "Show List"}
                        </button>
                    </div>
                </div>

                {showProcurementList && (
                    <div className="space-y-6 pt-4 border-t border-border">
                        {isLoadingProcurement ? (
                            <div className="flex justify-center items-center py-12">
                                <Loader2 className="h-8 w-8 animate-spin text-primary/60" />
                            </div>
                        ) : procurementList.length === 0 ? (
                            <div className="text-center py-12 bg-secondary/10 rounded-lg border border-dashed border-border">
                                <p className="text-muted-foreground">No procurements found.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto border border-border rounded-lg bg-card mt-4">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-secondary/50 border-b border-border">
                                        <tr>
                                            <th className="px-4 py-3 text-center border-r border-border">No.</th>
                                            <th className="px-4 py-3 border-r border-border">Site Name</th>
                                            <th className="px-4 py-3 border-r border-border">Date</th>
                                            <th className="px-4 py-3 border-r border-border">Prepared By</th>
                                            <th className="px-4 py-3 text-center border-r border-border">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {procurementList.map((proc, idx) => (
                                            <tr key={proc.id} className="border-b border-border last:border-0 hover:bg-secondary/20 transition-colors">
                                                <td className="px-4 py-3 text-center border-r border-border">{idx + 1}</td>
                                                <td className="px-4 py-3 border-r border-border">{proc.siteName}</td>
                                                <td className="px-4 py-3 border-r border-border">{new Date(proc.date).toLocaleDateString()}</td>
                                                <td className="px-4 py-3 border-r border-border">{proc.createdByUserName}</td>
                                                <td className="px-4 py-3 text-center border-r border-border">
                                                    <div className="flex flex-wrap items-center justify-center gap-2">
                                                        <button onClick={() => { setSelectedProcurement(proc); setShowProcurementDetails(true); }} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded text-xs font-medium transition-colors">View/Print</button>
                                                        <button onClick={() => itemProcurementService.downloadPdf(proc.id)} className="bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded text-xs font-medium transition-colors">PDF</button>
                                                        <button onClick={() => { siteService.getAll().then(setSites).catch(console.error); setSelectedProcurement(proc); setShowProcurementModal(true); }} className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1.5 rounded text-xs font-medium transition-colors">Edit</button>
                                                        <button onClick={() => setProcurementToDelete(proc.id)} className="text-red-500 hover:text-red-700 bg-red-50 px-3 py-1.5 rounded text-sm font-medium transition-colors">Delete</button>
                                                    </div>
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
                                                <div className="bg-secondary/50 px-4 py-2 border-t border-border flex justify-end gap-2">
                                                    <button 
                                                        className="bg-amber-500 hover:bg-amber-600 text-white px-3 py-1.5 rounded text-xs font-medium transition-colors"
                                                        onClick={() => window.dispatchEvent(new CustomEvent('OPEN_MATERIAL_RECEIVING_MODAL', { detail: list }))}
                                                    >
                                                        Edit
                                                    </button>
                                                    <button 
                                                        className="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded text-xs font-medium transition-colors"
                                                        onClick={() => {
                                                            setConfirmAction({
                                                                title: 'Delete Form',
                                                                message: 'Are you sure you want to delete this form?',
                                                                onConfirm: async () => {
                                                                    try {
                                                                        await materialReceivingService.deleteForm(list.id);
                                                                        toast.success('Form deleted successfully');
                                                                        if (selectedSiteId) fetchMaterialReceivingLists(Number(selectedSiteId));
                                                                    } catch (error) {
                                                                        toast.error('Failed to delete form');
                                                                    }
                                                                }
                                                            });
                                                            setIsConfirmModalOpen(true);
                                                        }}
                                                    >
                                                        Delete
                                                    </button>
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
                                                <div className="bg-secondary/50 px-4 py-2 border-t border-border flex justify-end gap-2">
                                                    <button 
                                                        className="bg-amber-500 hover:bg-amber-600 text-white px-3 py-1.5 rounded text-xs font-medium transition-colors"
                                                        onClick={() => window.dispatchEvent(new CustomEvent('OPEN_MATERIAL_RECEIVING_MODAL', { detail: list }))}
                                                    >
                                                        Edit
                                                    </button>
                                                    <button 
                                                        className="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded text-xs font-medium transition-colors"
                                                        onClick={() => {
                                                            setConfirmAction({
                                                                title: 'Delete List',
                                                                message: 'Are you sure you want to delete this list?',
                                                                onConfirm: async () => {
                                                                    try {
                                                                        await materialReceivingService.deleteForm(list.id);
                                                                        toast.success('List deleted successfully');
                                                                        handleLocationSelect(selectedLocation);
                                                                    } catch (error) {
                                                                        toast.error('Failed to delete list');
                                                                    }
                                                                }
                                                            });
                                                            setIsConfirmModalOpen(true);
                                                        }}
                                                    >
                                                        Delete
                                                    </button>
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

            {/* Project Spot Check List */}
            <div className="mt-8 bg-card rounded-xl border border-border overflow-hidden mb-6">
                <div className="p-4 flex items-center justify-between border-b border-border bg-muted/30">
                    <h3 className="text-lg font-semibold text-foreground">Project Spot Check Site List</h3>
                    <button
                        onClick={() => {
                            setShowSpotCheckList(!showSpotCheckList);
                        }}
                        className="text-sm text-primary hover:text-primary/80 font-medium transition-colors"
                    >
                        {showSpotCheckList ? "Hide Details" : "Show Details"}
                    </button>
                </div>
                {showSpotCheckList && (
                    <div className="p-4">
                        {isLoadingSpotCheck ? (
                            <div className="flex justify-center p-8">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            </div>
                        ) : spotCheckList.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs text-muted-foreground uppercase bg-muted/50">
                                        <tr>
                                            <th className="px-6 py-3 font-medium">ID</th>
                                            <th className="px-6 py-3 font-medium">Site</th>
                                            <th className="px-6 py-3 font-medium">Date Time</th>
                                            <th className="px-6 py-3 font-medium text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {Array.isArray(spotCheckList) && spotCheckList.map((spotCheck) => (
                                            <tr key={spotCheck.id} className="hover:bg-muted/30 transition-colors">
                                                <td className="px-6 py-4">#{spotCheck.id}</td>
                                                <td className="px-6 py-4 font-medium">{spotCheck.siteName}</td>
                                                <td className="px-6 py-4">{new Date(spotCheck.createdAt).toLocaleString()}</td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button 
                                                            onClick={() => {
                                                                setSelectedSpotCheck(spotCheck);
                                                                setIsSpotCheckViewOnly(true);
                                                                setShowSpotCheckModal(true);
                                                            }}
                                                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                            title="View"
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                        </button>
                                                        <button 
                                                            onClick={() => {
                                                                setConfirmAction({
                                                                    title: "Delete Spot Check",
                                                                    message: "Are you sure you want to delete this project spot check?",
                                                                    onConfirm: () => confirmDeleteSpotCheck(spotCheck.id)
                                                                });
                                                                setIsConfirmModalOpen(true);
                                                            }}
                                                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                            title="Delete"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="text-center py-8 text-muted-foreground">
                                No spot checks found.
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

            {/* Meeting Minutes Execution List Section (Footer) */}
            <div className="mt-6 bg-card border border-border rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold tracking-tight text-primary">Meeting Minutes Execution List</h2>
                    <button 
                        onClick={() => setShowMomExecutionList(!showMomExecutionList)}
                        className="text-sm font-medium text-primary hover:underline"
                    >
                        {showMomExecutionList ? "Hide Details" : "Show Details"}
                    </button>
                </div>

                {showMomExecutionList && (
                    <div className="pt-4 border-t border-border">
                        {isLoadingMomExecution ? (
                            <div className="flex justify-center p-8">
                                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                            </div>
                        ) : momExecutionMeetings.length > 0 ? (
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
                                        {momExecutionMeetings.map((m, idx) => {
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
                                                            <button className="text-blue-500 hover:underline" onClick={() => handleViewMomExecution(m)}>View</button>
                                                            <button className="text-amber-500 hover:underline" onClick={() => handleEditMomExecution(m)}>Edit</button>
                                                            <button className="text-red-500 hover:underline" onClick={() => handleDeleteMomExecution(m.id)}>Delete</button>
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
                                <p>No execution meetings found.</p>
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

            {/* Approved Project As built drawings List Section */}
            <div className="mt-6 bg-card border border-border rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold tracking-tight text-primary">Project Approved Project As built drawings List</h2>
                    <button 
                        onClick={() => setShowApprovedDrawingsList(!showApprovedDrawingsList)}
                        className="text-sm font-medium text-primary hover:underline"
                    >
                        {showApprovedDrawingsList ? "Hide Details" : "Show Details"}
                    </button>
                </div>

                {showApprovedDrawingsList && (
                    <div className="pt-4 border-t border-border">
                        {isLoadingApprovedDrawings ? (
                            <div className="flex justify-center p-8">
                                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                            </div>
                        ) : approvedDrawingsList.length > 0 ? (
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
                                        {approvedDrawingsList.map((group) => (
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
                                <p>No approved drawings found.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Project Risk Assessment Form List Section */}
            <div className="mt-6 bg-card border border-border rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold tracking-tight text-primary">Project Risk Assessment Form</h2>
                    <button 
                        onClick={() => setShowRiskAssessmentList(!showRiskAssessmentList)}
                        className="text-sm font-medium text-primary hover:underline"
                    >
                        {showRiskAssessmentList ? "Hide Details" : "Show Details"}
                    </button>
                </div>

                {showRiskAssessmentList && (
                    <div className="pt-4 border-t border-border">
                        {isLoadingRiskAssessment ? (
                            <div className="flex justify-center p-8">
                                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                            </div>
                        ) : riskAssessmentList.length > 0 ? (
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
                                        {riskAssessmentList.map((group) => (
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
                                <p>No project risk assessment forms found.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Tool Box Talk List Section */}
            <div className="mt-6 bg-card border border-border rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold tracking-tight text-primary">Tool Box Talk</h2>
                    <button 
                        onClick={() => {
                            setShowToolBoxTalkList(!showToolBoxTalkList);
                            if (!showToolBoxTalkList) fetchToolBoxTalks();
                        }}
                        className="text-sm font-medium text-primary hover:underline"
                    >
                        {showToolBoxTalkList ? "Hide Details" : "Show Details"}
                    </button>
                </div>

                {showToolBoxTalkList && (
                    <div className="pt-4 border-t border-border">
                        {isLoadingToolBoxTalk ? (
                            <div className="flex justify-center p-8">
                                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                            </div>
                        ) : toolBoxTalkList.length > 0 ? (
                            <div className="overflow-x-auto bg-card rounded-lg border border-border">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-muted/30 text-center text-muted-foreground border-b border-border">
                                        <tr>
                                            <th className="px-4 py-3 font-semibold">Emp No.</th>
                                            <th className="px-4 py-3 font-semibold">TBT Form No</th>
                                            <th className="px-4 py-3 font-semibold text-left">Name</th>
                                            <th className="px-4 py-3 font-semibold w-48">Status</th>
                                            <th className="px-4 py-3 font-semibold w-16 text-center">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {toolBoxTalkList.flatMap(tbt => tbt.attendees.map(attendee => (
                                            <tr key={attendee.id} className="hover:bg-muted/10 text-center">
                                                <td className="px-4 py-3 font-medium text-foreground">{attendee.id}</td>
                                                <td className="px-4 py-3 font-medium text-primary">{tbt.formNo}</td>
                                                <td className="px-4 py-3 text-left">
                                                    <input
                                                        type="text"
                                                        defaultValue={attendee.employeeName}
                                                        onBlur={(e) => {
                                                            if (e.target.value !== attendee.employeeName) {
                                                                handleUpdateAttendeeStatus(attendee.id, e.target.value, attendee.status);
                                                            }
                                                        }}
                                                        className="w-full bg-transparent outline-none focus:ring-1 focus:ring-primary rounded px-2 py-1"
                                                    />
                                                </td>
                                                <td className="px-4 py-3">
                                                    <select
                                                        value={attendee.status}
                                                        onChange={(e) => handleUpdateAttendeeStatus(attendee.id, attendee.employeeName, e.target.value)}
                                                        className="w-full border border-border rounded px-3 py-1.5 focus:ring-2 focus:ring-primary/20 outline-none bg-background text-center"
                                                    >
                                                        <option value="Present">Present</option>
                                                        <option value="Absent">Absent</option>
                                                    </select>
                                                </td>
                                                <td className="px-4 py-3 flex justify-center gap-2">
                                                    <button 
                                                        onClick={() => {
                                                            setToolBoxTalkEditId(tbt.id);
                                                            setShowToolBoxTalkModal(true);
                                                        }}
                                                        className="p-1.5 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors"
                                                        title="Edit TBT Form"
                                                    >
                                                        <Wrench className="h-4 w-4" />
                                                    </button>
                                                    <button 
                                                        onClick={() => {
                                                            setConfirmAction({
                                                                title: "Remove Attendee",
                                                                message: "Are you sure you want to remove this attendee?",
                                                                onConfirm: () => confirmDeleteAttendee(attendee.id)
                                                            });
                                                            setIsConfirmModalOpen(true);
                                                        }}
                                                        className="p-1.5 bg-red-50 text-red-600 rounded hover:bg-red-100 transition-colors"
                                                        title="Delete Attendee"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        )))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="text-center p-8 text-muted-foreground border border-dashed border-border rounded-lg bg-muted/10">
                                <FileText className="h-10 w-10 mx-auto mb-3 opacity-20" />
                                <p>No TBT records found.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Training Details List Section */}
            <div className="mt-6 bg-card border border-border rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold tracking-tight text-primary">Training Details Form</h2>
                    <button 
                        onClick={() => {
                            setShowTrainingDetailList(!showTrainingDetailList);
                            if (!showTrainingDetailList) fetchTrainingDetails();
                        }}
                        className="text-sm font-medium text-primary hover:underline"
                    >
                        {showTrainingDetailList ? "Hide Details" : "Show Details"}
                    </button>
                </div>

                {showTrainingDetailList && (
                    <div className="pt-4 border-t border-border">
                        {isLoadingTrainingDetail ? (
                            <div className="flex justify-center p-8">
                                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                            </div>
                        ) : trainingDetailList.length > 0 ? (
                            <div className="overflow-x-auto bg-card rounded-lg border border-border">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-muted/30 text-center text-muted-foreground border-b border-border">
                                        <tr>
                                            <th className="px-4 py-3 font-semibold">Emp Id</th>
                                            <th className="px-4 py-3 font-semibold text-left">Participant Name</th>
                                            <th className="px-4 py-3 font-semibold">Location</th>
                                            <th className="px-4 py-3 font-semibold">Training Type</th>
                                            <th className="px-4 py-3 font-semibold w-48">Status</th>
                                            <th className="px-4 py-3 font-semibold w-16 text-center">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {trainingDetailList.flatMap(td => td.participants.map(participant => (
                                            <tr key={participant.id} className="hover:bg-muted/10 text-center">
                                                <td className="px-4 py-3 font-medium text-foreground">{participant.employeeId}</td>
                                                <td className="px-4 py-3 text-left">
                                                    <input
                                                        type="text"
                                                        defaultValue={participant.participantName}
                                                        onBlur={(e) => {
                                                            if (e.target.value !== participant.participantName) {
                                                                handleUpdateParticipantStatus(participant.id, e.target.value, participant.employeeStatus);
                                                            }
                                                        }}
                                                        className="w-full bg-transparent outline-none focus:ring-1 focus:ring-primary rounded px-2 py-1"
                                                    />
                                                </td>
                                                <td className="px-4 py-3">{td.location}</td>
                                                <td className="px-4 py-3">{td.trainingType}</td>
                                                <td className="px-4 py-3">
                                                    <select
                                                        value={participant.employeeStatus}
                                                        onChange={(e) => handleUpdateParticipantStatus(participant.id, participant.participantName, e.target.value)}
                                                        className="w-full border border-border rounded px-3 py-1.5 focus:ring-2 focus:ring-primary/20 outline-none bg-background text-center"
                                                    >
                                                        <option value="Present">Present</option>
                                                        <option value="Absent">Absent</option>
                                                        <option value="Excused">Excused</option>
                                                    </select>
                                                </td>
                                                <td className="px-4 py-3 flex justify-center gap-2">
                                                    <button 
                                                        onClick={() => {
                                                            setTrainingDetailEditId(td.id);
                                                            setShowTrainingDetailModal(true);
                                                        }}
                                                        className="p-1.5 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors"
                                                        title="Edit Training Detail Form"
                                                    >
                                                        <Wrench className="h-4 w-4" />
                                                    </button>
                                                    <button 
                                                        onClick={() => {
                                                            setConfirmAction({
                                                                title: "Remove Participant",
                                                                message: "Are you sure you want to remove this participant?",
                                                                onConfirm: () => confirmDeleteParticipant(participant.id)
                                                            });
                                                            setIsConfirmModalOpen(true);
                                                        }}
                                                        className="p-1.5 bg-red-50 text-red-600 rounded hover:bg-red-100 transition-colors"
                                                        title="Delete Participant"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        )))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="text-center p-8 text-muted-foreground border border-dashed border-border rounded-lg bg-muted/10">
                                <FileText className="h-10 w-10 mx-auto mb-3 opacity-20" />
                                <p>No training details found.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Project Technical Handover List Section */}
            <div className="mt-6 bg-card border border-border rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold tracking-tight text-primary">Project Technical Handover List</h2>
                    <button 
                        onClick={() => {
                            setShowHandoverList(!showHandoverList);
                            if (!showHandoverList) fetchHandovers();
                        }}
                        className="text-sm font-medium text-primary hover:underline"
                    >
                        {showHandoverList ? "Hide Details" : "Show Details"}
                    </button>
                </div>

                {showHandoverList && (
                    <div className="pt-4 border-t border-border">
                        {isLoadingHandover ? (
                        <div className="flex justify-center items-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : handoverList.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground bg-secondary/30 rounded-lg border border-dashed border-border">
                            No technical handovers found.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-muted-foreground uppercase bg-secondary/50">
                                    <tr>
                                        <th className="px-4 py-3 rounded-tl-lg font-medium">ID</th>
                                        <th className="px-4 py-3 font-medium">Site</th>
                                        <th className="px-4 py-3 font-medium">Customer</th>
                                        <th className="px-4 py-3 font-medium">Secondary Customer</th>
                                        <th className="px-4 py-3 font-medium">Date</th>
                                        <th className="px-4 py-3 rounded-tr-lg font-medium text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {handoverList.map((h) => (
                                        <tr key={h.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                                            <td className="px-4 py-3 font-medium">TH-{h.id}</td>
                                            <td className="px-4 py-3">{h.siteName}</td>
                                            <td className="px-4 py-3">{h.customerName || '-'}</td>
                                            <td className="px-4 py-3">{h.secondaryCustomerName || '-'}</td>
                                            <td className="px-4 py-3">{new Date(h.createdAt).toLocaleString()}</td>
                                            <td className="px-4 py-3">
                                                <div className="flex justify-end space-x-2">
                                                    <button 
                                                        onClick={() => {
                                                            setSelectedHandover(h);
                                                            setIsHandoverViewOnly(true);
                                                            setShowHandoverModal(true);
                                                        }}
                                                        className="px-3 py-1.5 text-xs font-medium bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors"
                                                    >
                                                        View
                                                    </button>
                                                    <button 
                                                        onClick={() => {
                                                            setSelectedHandover(h);
                                                            setIsHandoverViewOnly(false);
                                                            setShowHandoverModal(true);
                                                        }}
                                                        className="px-3 py-1.5 text-xs font-medium bg-primary/10 text-primary rounded-md hover:bg-primary/20 transition-colors"
                                                    >
                                                        Edit
                                                    </button>
                                                    <button 
                                                        onClick={() => setHandoverToDelete(h.id)}
                                                        className="px-3 py-1.5 text-xs font-medium bg-destructive/10 text-destructive rounded-md hover:bg-destructive/20 transition-colors"
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
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

            <ProjectScopeModal />
            <ProjectTechnicalHandoverModal
                isOpen={showHandoverModal}
                onClose={() => setShowHandoverModal(false)}
                handoverData={selectedHandover}
                isViewOnly={isHandoverViewOnly}
                onSaveSuccess={() => {
                    if (showHandoverList) fetchHandovers();
                }}
            />

            <ToolBoxTalkModal
                isOpen={showToolBoxTalkModal}
                onClose={() => {
                    setShowToolBoxTalkModal(false);
                    if (showToolBoxTalkList) fetchToolBoxTalks();
                }}
                onSuccess={() => {
                    if (showToolBoxTalkList) fetchToolBoxTalks();
                }}
                editId={toolBoxTalkEditId}
            />

            <TrainingDetailModal
                isOpen={showTrainingDetailModal}
                onClose={() => {
                    setShowTrainingDetailModal(false);
                    if (showTrainingDetailList) fetchTrainingDetails();
                }}
                onSuccess={() => {
                    if (showTrainingDetailList) fetchTrainingDetails();
                }}
                editId={trainingDetailEditId}
            />

            <ConfirmModal 
                isOpen={handoverToDelete !== null}
                onCancel={() => setHandoverToDelete(null)}
                onConfirm={confirmDeleteHandover}
                title="Delete Technical Handover"
                message="Are you sure you want to delete this technical handover? This action cannot be undone."
                confirmText="Delete"
            />
            <ToolsListModal />
            <MaterialReceivingModal />
            <DailyProgressReportModal />
            {confirmAction && (
                <ConfirmModal 
                    isOpen={isConfirmModalOpen}
                    title={confirmAction.title}
                    message={confirmAction.message}
                    onConfirm={() => {
                        confirmAction.onConfirm();
                        setIsConfirmModalOpen(false);
                        setConfirmAction(null);
                    }}
                    onCancel={() => {
                        setIsConfirmModalOpen(false);
                        setConfirmAction(null);
                    }}
                    type="danger"
                    confirmText="Delete"
                />
            )}
            
            <ErrorBoundary>
                <ProjectSpotCheckModal 
                    isOpen={showSpotCheckModal}
                    onClose={() => setShowSpotCheckModal(false)}
                    spotCheck={selectedSpotCheck}
                    isViewOnly={isSpotCheckViewOnly}
                    onSuccess={fetchSpotChecks}
                />
            </ErrorBoundary>

            <DprDetailsModal isOpen={!!dprViewMode} onClose={() => setDprViewMode(null)} report={selectedReportForDetails} viewMode={dprViewMode} />
            
            <ConfirmModal 
                isOpen={!!dprToDelete}
                title="Delete Report"
                message="Are you sure you want to delete this report? This action cannot be undone."
                confirmText="Delete"
                cancelText="Cancel"
                type="danger"
                onConfirm={confirmDeleteDpr}
                onCancel={() => setDprToDelete(null)}
            />

            <ConfirmModal 
                isOpen={!!momToDelete}
                title="Delete Meeting"
                message="Are you sure you want to delete this meeting? This action cannot be undone."
                confirmText="Delete"
                cancelText="Cancel"
                type="danger"
                onConfirm={confirmDeleteMom}
                onCancel={() => setMomToDelete(null)}
            />

            {showMomModal && (
                <MomMeetingModal 
                    show={showMomModal} 
                    onHide={() => setShowMomModal(false)} 
                    onSubmit={handleMomSubmit}
                    meeting={selectedMom}
                    isViewOnly={isMomViewOnly}
                />
            )}

            <ItemProcurementModal 
                isOpen={showProcurementModal}
                onClose={() => setShowProcurementModal(false)}
                onSubmit={handleProcurementSubmit}
                sites={sites}
                initialData={selectedProcurement}
            />

            {selectedProcurement && showProcurementDetails && (
                <ItemProcurementDetailsModal 
                    isOpen={showProcurementDetails}
                    onClose={() => setShowProcurementDetails(false)}
                    procurement={selectedProcurement}
                />
            )}

            <ConfirmModal 
                isOpen={!!procurementToDelete}
                title="Delete Procurement"
                message="Are you sure you want to delete this procurement? This action cannot be undone."
                confirmText="Delete"
                cancelText="Cancel"
                type="danger"
                onConfirm={confirmDeleteProcurement}
                onCancel={() => setProcurementToDelete(null)}
            />

            <MeetingMinutesExecutionModal
                show={showMomExecutionModal}
                onHide={() => setShowMomExecutionModal(false)}
                onSubmit={handleMomExecutionSubmit}
                meeting={selectedMomExecution}
                isViewOnly={isMomExecutionViewOnly}
            />

            <ConfirmModal
                isOpen={momExecutionToDelete !== null}
                onCancel={() => setMomExecutionToDelete(null)}
                onConfirm={confirmDeleteMomExecution}
                title="Delete Execution Meeting"
                message="Are you sure you want to delete this meeting? This action cannot be undone."
                confirmText="Delete"
                cancelText="Cancel"
                type="danger"
            />
        </div>
    );
};
