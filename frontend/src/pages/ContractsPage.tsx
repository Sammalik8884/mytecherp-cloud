import { useState, useEffect } from "react";
import { Loader2, Search, FileSignature, Plus, Calendar, Download, Edit, Trash2 } from "lucide-react";
import { contractService } from "../services/contractService";
import { complianceService } from "../services/complianceService";
import { ContractDto } from "../types/contract";
import { ConfirmModal } from "../components/common/ConfirmModal";
import { toast } from "react-hot-toast";
import { ContractModal } from "../components/contracts/ContractModal";
import { EditContractModal } from "../components/contracts/EditContractModal";

export const ContractsPage = () => {
    const [contracts, setContracts] = useState<ContractDto[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [downloadingId, setDownloadingId] = useState<number | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedContract, setSelectedContract] = useState<ContractDto | null>(null);

    const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; title: string; message: string; type: 'info'|'warning'|'danger'; onConfirm: () => void }>({ isOpen: false, title: "", message: "", type: "info", onConfirm: () => {} });

    const confirmAction = (title: string, message: string, type: 'info' | 'warning' | 'danger', action: () => Promise<void>) => {
        setConfirmModal({
            isOpen: true, title, message, type,
            onConfirm: async () => {
                setConfirmModal(prev => ({ ...prev, isOpen: false }));
                await action();
            }
        });
    };
    const fetchContracts = async () => {
        try {
            setLoading(true);
            const data = await contractService.getAll();
            setContracts(data);
        } catch (error) {
            toast.error("Failed to load contracts data.");
            // Because there's no data locally, inject a mock if api fails
            setContracts([{
                id: 1,
                customerId: 101,
                customerName: "Acme Corp",
                description: "Annual Maintenance Contract - Fire Systems",
                startDate: "2023-01-01",
                endDate: "2024-01-01",
                value: 15000,
                status: 1,
                items: []
            }]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchContracts();
    }, []);

    const handleSuccess = () => {
        setIsModalOpen(false);
        setIsEditModalOpen(false);
        setSelectedContract(null);
        fetchContracts();
    };

    const handleEditClick = (contract: ContractDto) => {
        setSelectedContract(contract);
        setIsEditModalOpen(true);
    };

    const handleDelete = (id: number) => {
        confirmAction("Delete Contract", "Are you sure you want to delete this contract? This action cannot be undone.", "danger", async () => {
            try {
                await contractService.delete(id);
                toast.success("Contract deleted successfully.");
                fetchContracts();
            } catch (error: any) {
                toast.error(error.response?.data?.Error || error.response?.data?.Message || "Failed to delete the contract.");
            }
        });
    };

    const filteredContracts = contracts.filter(c =>
        c.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.customerName && c.customerName.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const handleDownloadDocument = async (contract: ContractDto) => {
        if (!contract.referenceQuotationId) {
            // Manual AMC: Download Contract PDF
            try {
                setDownloadingId(contract.id);
                toast.loading("Generating Contract PDF...", { id: `pdf-${contract.id}` });
                const blob = await contractService.downloadPdf(contract.id);
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `AMC-Contract-${contract.id}.pdf`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                toast.success("Contract PDF Downloaded", { id: `pdf-${contract.id}` });
            } catch (error: any) {
                let errorMessage = "Failed to download Contract PDF";
                if (error.response?.data instanceof Blob) {
                    try {
                        const text = await error.response.data.text();
                        const json = JSON.parse(text);
                        errorMessage = json.error || json.Error || errorMessage;
                    } catch (e) {
                        errorMessage = "Backend Error while downloading PDF.";
                    }
                }
                toast.error(errorMessage, { id: `pdf-${contract.id}` });
            } finally {
                setDownloadingId(null);
            }
            return;
        }

        // Auto AMC: Download Compliance Certificate
        try {
            setDownloadingId(contract.id);
            toast.loading("Generating certificate...", { id: `cert-${contract.id}` });
            await complianceService.downloadCertificate(contract.referenceQuotationId);
            toast.success("Certificate downloaded successfully", { id: `cert-${contract.id}` });
        } catch (error: any) {
            toast.error(error.response?.data || "Could not generate certificate. Ensure the related quote is digitally signed.", { id: `cert-${contract.id}` });
        } finally {
            setDownloadingId(null);
        }
    }



    const getStatusStyles = (status: number) => {
        switch (status) {
            case 0: return "bg-gray-500/10 text-gray-500 border-gray-500/20"; // Draft
            case 1: return "bg-green-500/10 text-green-500 border-green-500/20"; // Active
            case 2: return "bg-red-500/10 text-red-500 border-red-500/20"; // Expired
            case 3: return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"; // Cancelled
            default: return "bg-primary/10 text-primary border-primary/20";
        }
    };

    const getStatusText = (status: number) => {
        switch (status) {
            case 0: return "Draft";
            case 1: return "Active";
            case 2: return "Expired";
            case 3: return "Cancelled";
            default: return "Unknown";
        }
    };

    return (
        <div className="p-8 animate-in fade-in duration-500">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent flex items-center gap-3">
                        <FileSignature className="h-8 w-8 text-primary" />
                        Contracts & Compliance (AMCs)
                    </h1>
                    <p className="text-muted-foreground mt-1 text-sm">Manage recurring service contracts and download compliance certificates.</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-primary text-primary-foreground px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-primary/90 transition-all font-medium border border-primary hover:shadow-lg hover:shadow-primary/20 active:scale-95"
                >
                    <Plus className="h-4 w-4" />
                    <span className="hidden sm:inline">New AMC</span>
                </button>
            </div>

            <ContractModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={handleSuccess}
            />

            <EditContractModal
                isOpen={isEditModalOpen}
                onClose={() => {
                    setIsEditModalOpen(false);
                    setSelectedContract(null);
                }}
                onSuccess={handleSuccess}
                contract={selectedContract}
            />

            <div className="bg-secondary/30 border border-border/50 rounded-2xl overflow-hidden backdrop-blur-sm shadow-xl mt-6">
                <div className="p-4 border-b border-border/40 flex justify-between items-center">
                    <h2 className="font-semibold px-2">Active Service Contracts</h2>
                    <div className="relative w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Search contracts..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-background/50 border border-border text-sm rounded-lg pl-9 pr-4 py-1.5 w-full focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-muted-foreground uppercase bg-secondary/50 border-b border-border/40">
                            <tr>
                                <th className="px-6 py-4 font-medium">Customer</th>
                                <th className="px-6 py-4 font-medium">Contract Description</th>
                                <th className="px-6 py-4 font-medium">Value</th>
                                <th className="px-6 py-4 font-medium">Dates</th>
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
                            ) : filteredContracts.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                                        No active contracts found.
                                    </td>
                                </tr>
                            ) : (
                                filteredContracts.map((contract) => (
                                    <tr key={contract.id} className="hover:bg-secondary/50 transition-colors">
                                        <td className="px-6 py-4 font-medium">
                                            {contract.customerName || `Customer #${contract.customerId}`}
                                        </td>
                                        <td className="px-6 py-4 text-muted-foreground">
                                            {contract.description}
                                        </td>
                                        <td className="px-6 py-4 font-bold">
                                            ${contract.value.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                <Calendar className="h-3 w-3" />
                                                <span>{new Date(contract.startDate).toLocaleDateString()} - {new Date(contract.endDate).toLocaleDateString()}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex px-2 py-1 rounded-md text-xs font-medium border ${getStatusStyles(contract.status)}`}>
                                                {getStatusText(contract.status)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end items-center space-x-2">
                                                <button
                                                    onClick={() => handleDownloadDocument(contract)}
                                                    disabled={downloadingId === contract.id}
                                                    className={`p-1.5 border transition-colors flex items-center gap-1 font-medium border-primary/30 text-primary hover:bg-primary/20 bg-primary/10 rounded-lg`}
                                                    title={contract.referenceQuotationId ? "Download Compliance Certificate" : "Download Contract PDF"}
                                                >
                                                    {downloadingId === contract.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                                                    <span className="text-xs px-1">Cert</span>
                                                </button>
                                                <button
                                                    onClick={() => handleEditClick(contract)}
                                                    title="Edit Contract"
                                                    className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors border border-transparent"
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(contract.id)}
                                                    title="Delete Contract"
                                                    className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors border border-transparent"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <ConfirmModal
                isOpen={confirmModal.isOpen}
                title={confirmModal.title}
                message={confirmModal.message}
                type={confirmModal.type}
                confirmText="Delete"
                onConfirm={confirmModal.onConfirm}
                onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
            />
        </div >
    );
};
