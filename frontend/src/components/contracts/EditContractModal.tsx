// frontend/src/components/contracts/EditContractModal.tsx
import React, { useState, useEffect } from "react";
import { X, Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";
import { UpdateContractDto, ContractDto } from "../../types/contract";
import { contractService } from "../../services/contractService";

interface EditContractModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    contract: ContractDto | null;
}

export const EditContractModal: React.FC<EditContractModalProps> = ({
    isOpen,
    onClose,
    onSuccess,
    contract
}) => {
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState<UpdateContractDto>({
        id: 0,
        title: "",
        startDate: "",
        endDate: "",
        visitFrequencyMonths: 1,
        contractValue: 0,
        isActive: true
    });

    useEffect(() => {
        if (isOpen && contract) {
            setFormData({
                id: contract.id,
                title: contract.description || "",
                startDate: contract.startDate.split('T')[0],
                endDate: contract.endDate.split('T')[0],
                visitFrequencyMonths: 1,
                contractValue: contract.value || 0,
                isActive: contract.status === 1 || contract.status === 0
            });
        }
    }, [isOpen, contract]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        if (name === "isActive") {
            setFormData((prev) => ({ ...prev, isActive: value === "true" }));
        } else {
            setFormData((prev) => ({
                ...prev,
                [name]: name === "contractValue" ? Number(value) : value,
            }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!contract) return;

        if (!formData.title || formData.contractValue <= 0) {
            toast.error("Please fill in all required fields.");
            return;
        }

        try {
            setLoading(true);
            await contractService.update(contract.id, formData);
            toast.success("AMC updated successfully!");
            onSuccess();
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to update AMC.");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen || !contract) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-background border border-border rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center p-6 border-b border-border/50">
                    <h2 className="text-xl font-semibold">Edit AMC (Contract #{contract.id})</h2>
                    <button
                        onClick={onClose}
                        className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md hover:bg-secondary"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Customer</label>
                        <input
                            type="text"
                            disabled
                            value={contract.customerName || `Customer #${contract.customerId}`}
                            className="w-full bg-secondary/30 border border-border/50 rounded-lg px-4 py-2 text-sm text-muted-foreground cursor-not-allowed cursor-not-allowed"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Contract Title / Description <span className="text-red-500">*</span></label>
                        <input
                            type="text"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            className="w-full bg-secondary/50 border border-border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Start Date <span className="text-red-500">*</span></label>
                            <input
                                type="date"
                                name="startDate"
                                value={formData.startDate}
                                onChange={handleChange}
                                className="w-full bg-secondary/50 border border-border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">End Date <span className="text-red-500">*</span></label>
                            <input
                                type="date"
                                name="endDate"
                                value={formData.endDate}
                                onChange={handleChange}
                                className="w-full bg-secondary/50 border border-border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                required
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Contract Value ($) <span className="text-red-500">*</span></label>
                            <input
                                type="number"
                                name="contractValue"
                                value={formData.contractValue || ""}
                                onChange={handleChange}
                                step="0.01"
                                min="0"
                                className="w-full bg-secondary/50 border border-border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Status <span className="text-red-500">*</span></label>
                            <select
                                name="isActive"
                                value={formData.isActive ? "true" : "false"}
                                onChange={handleChange}
                                className="w-full bg-secondary/50 border border-border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                required
                            >
                                <option value="true">Active</option>
                                <option value="false">Inactive / Expired</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium hover:bg-secondary/80 rounded-lg transition-colors"
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-all flex items-center justify-center min-w-[120px]"
                        >
                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Changes"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
