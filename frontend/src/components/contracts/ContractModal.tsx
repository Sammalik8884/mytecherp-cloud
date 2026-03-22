// frontend/src/components/contracts/ContractModal.tsx
import React, { useState, useEffect } from "react";
import { X, Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";
import { CreateContractDto } from "../../types/contract";
import { apiClient } from "../../services/apiClient";
import { CustomerDto } from "../../types/customer";

interface ContractModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export const ContractModal: React.FC<ContractModalProps> = ({
    isOpen,
    onClose,
    onSuccess,
}) => {
    const [loading, setLoading] = useState(false);
    const [customers, setCustomers] = useState<CustomerDto[]>([]);

    const [formData, setFormData] = useState<CreateContractDto>({
        customerId: 0,
        description: "",
        startDate: new Date().toISOString().split("T")[0],
        endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split("T")[0],
        value: 0,
    });

    useEffect(() => {
        if (isOpen) {
            fetchCustomers();
            // Reset form
            setFormData({
                customerId: 0,
                description: "",
                startDate: new Date().toISOString().split("T")[0],
                endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split("T")[0],
                value: 0,
            });
        }
    }, [isOpen]);

    const fetchCustomers = async () => {
        try {
            const response = await apiClient.get<CustomerDto[]>("/Customers");
            setCustomers(response.data);
        } catch (error) {
            toast.error("Failed to load customers.");
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: name === "customerId" || name === "value" ? Number(value) : value,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.customerId || !formData.description || formData.value <= 0) {
            toast.error("Please fill in all required fields with valid data.");
            return;
        }

        if (new Date(formData.endDate) <= new Date(formData.startDate)) {
            toast.error("End Date must be after Start Date.");
            return;
        }

        try {
            setLoading(true);
            await apiClient.post("/Contracts", {
                ...formData,
                title: formData.description, // Sending both to ensure api accepts it
                visitFrequencyMonths: 1, // Required by backend validation
            });
            toast.success("AMC created successfully!");
            onSuccess();
        } catch (error: any) {
            const errorData = error.response?.data;
            let errorMessage = errorData?.message || errorData?.title || "Failed to create AMC.";
            if (errorData?.errors) {
                // Get the first specific validation error message
                const firstError = Object.values(errorData.errors)[0] as string[];
                if (firstError && firstError.length > 0) errorMessage = firstError[0];
            }
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-background border border-border rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center p-6 border-b border-border/50">
                    <h2 className="text-xl font-semibold">Create New AMC</h2>
                    <button
                        onClick={onClose}
                        className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md hover:bg-secondary"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Customer <span className="text-red-500">*</span></label>
                        <select
                            name="customerId"
                            value={formData.customerId}
                            onChange={handleChange}
                            className="w-full bg-secondary/50 border border-border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                            required
                        >
                            <option value={0}>Select a Customer</option>
                            {customers.map((c) => (
                                <option key={c.id} value={c.id}>
                                    {c.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Contract Description / Title <span className="text-red-500">*</span></label>
                        <input
                            type="text"
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            placeholder="e.g., Annual Maintenance Contract 2024"
                            className="w-full bg-secondary/50 border border-border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
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

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Contract Value ($) <span className="text-red-500">*</span></label>
                        <input
                            type="number"
                            name="value"
                            value={formData.value || ""}
                            onChange={handleChange}
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                            className="w-full bg-secondary/50 border border-border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                            required
                        />
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
                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create AMC"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
