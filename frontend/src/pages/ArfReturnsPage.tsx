import React, { useState, useEffect } from "react";
import { amountRequestApi, AmountRequestFormDto } from "../api/amountRequestApi";
import { arfReturnApi, ArfReturnDto } from "../api/arfReturnApi";
import { useAuth } from "../auth/AuthContext";
import { toast } from "react-hot-toast";
import { Plus, CheckCircle, XCircle } from "lucide-react";

const ArfReturnsPage = () => {
    const { user, hasRole } = useAuth();
    const [returns, setReturns] = useState<ArfReturnDto[]>([]);
    const [arfs, setArfs] = useState<AmountRequestFormDto[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedArfId, setSelectedArfId] = useState<number | "">("");
    const [returnAmount, setReturnAmount] = useState<number | "">("");
    const [details, setDetails] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [debtBalance, setDebtBalance] = useState<number>(0);

    const isAuditor = hasRole(["Admin", "CEO", "Manager", "Accounts Head"]) || 
                      ["munawar.hasan@mytecheng.com", "faisal.ghani@mytecheng.com", "abdul.majeed@mytecheng.com", "asma@mytecheng.com"].includes(user?.email?.toLowerCase() || "");

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setIsLoading(true);
            const [returnsRes, arfsRes, debtRes] = await Promise.all([
                arfReturnApi.getAll(),
                amountRequestApi.getAll(),
                arfReturnApi.getDebtBalance()
            ]);
            setReturns(returnsRes.data);
            setArfs(arfsRes.data);
            setDebtBalance(debtRes.data);
        } catch (error: any) {
            toast.error(error.response?.data || "Failed to fetch data");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedArfId || !returnAmount || !details) {
            toast.error("All fields are mandatory");
            return;
        }

        setIsSubmitting(true);
        try {
            await arfReturnApi.create({
                amountRequestFormId: Number(selectedArfId),
                returnAmount: Number(returnAmount),
                details
            });
            toast.success("ARF Return submitted successfully");
            setIsFormOpen(false);
            setSelectedArfId("");
            setReturnAmount("");
            setDetails("");
            fetchData();
        } catch (error: any) {
            toast.error(error.response?.data || "Failed to submit return");
        } finally {
            setIsSubmitting(false);
        }
    };

    const selectedArf = arfs.find(a => a.id === Number(selectedArfId));
    
    // We calculate the maximum returnable amount
    // AdvanceRequested - sum of already returned amounts for this ARF
    const existingReturnsForArf = returns.filter(r => r.amountRequestFormId === Number(selectedArfId)).reduce((sum, r) => sum + r.returnAmount, 0);
    const maxReturnable = selectedArf ? (selectedArf.advanceRequested - existingReturnsForArf) : 0;

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold">ARF Returns</h1>
                    <p className="text-muted-foreground">Manage and view returned ARF funds</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="bg-red-50 text-red-700 px-4 py-2 rounded-md border border-red-200">
                        <span className="font-semibold">Your Current Debt Balance: </span>
                        <span>Rs {debtBalance.toLocaleString()}</span>
                    </div>
                    <button 
                        onClick={() => setIsFormOpen(true)}
                        className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        New ARF Return
                    </button>
                </div>
            </div>

            {isFormOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-background rounded-lg shadow-xl w-full max-w-md p-6">
                        <h2 className="text-xl font-bold mb-4">Create ARF Return</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Select ARF *</label>
                                <select 
                                    value={selectedArfId}
                                    onChange={(e) => setSelectedArfId(e.target.value ? Number(e.target.value) : "")}
                                    className="w-full border rounded-md p-2 bg-background"
                                    required
                                >
                                    <option value="">Select an ARF</option>
                                    {arfs.filter(a => a.status !== "Rejected by CEO" && a.status !== "Rejected by Director").map(arf => (
                                        <option key={arf.id} value={arf.id}>
                                            {arf.arfNumber} - Rs {arf.advanceRequested} ({arf.status})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {selectedArf && (
                                <div className="bg-blue-50 text-blue-700 p-3 rounded-md text-sm">
                                    <strong>Max Returnable Amount:</strong> Rs {maxReturnable.toLocaleString()}
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium mb-1">Return Amount *</label>
                                <input 
                                    type="number" 
                                    value={returnAmount}
                                    onChange={(e) => setReturnAmount(e.target.value ? Number(e.target.value) : "")}
                                    max={maxReturnable > 0 ? maxReturnable : undefined}
                                    className="w-full border rounded-md p-2 bg-background"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Details *</label>
                                <textarea 
                                    value={details}
                                    onChange={(e) => setDetails(e.target.value)}
                                    className="w-full border rounded-md p-2 bg-background"
                                    rows={3}
                                    required
                                />
                            </div>

                            <div className="flex gap-2 justify-end mt-6">
                                <button 
                                    type="button" 
                                    onClick={() => setIsFormOpen(false)}
                                    className="px-4 py-2 border rounded-md hover:bg-muted"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit" 
                                    disabled={isSubmitting || (selectedArf && Number(returnAmount) > maxReturnable)}
                                    className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
                                >
                                    {isSubmitting ? "Submitting..." : "Submit Return"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="bg-card border rounded-lg shadow-sm overflow-hidden">
                {isLoading ? (
                    <div className="p-8 text-center">Loading returns...</div>
                ) : returns.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">No ARF returns found</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-muted/50 text-left text-sm">
                                <tr>
                                    <th className="p-4">Date</th>
                                    <th className="p-4">ARF Number</th>
                                    <th className="p-4">Returned By</th>
                                    <th className="p-4">Amount</th>
                                    <th className="p-4">Details</th>
                                    <th className="p-4">Debt Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {returns.map(r => (
                                    <tr key={r.id} className="hover:bg-muted/20">
                                        <td className="p-4">{new Date(r.returnDate).toLocaleDateString()}</td>
                                        <td className="p-4 font-medium">{r.arfNumber}</td>
                                        <td className="p-4">{r.returnedByEmail}</td>
                                        <td className="p-4 font-semibold text-red-600">Rs {r.returnAmount.toLocaleString()}</td>
                                        <td className="p-4 max-w-xs truncate" title={r.details}>{r.details}</td>
                                        <td className="p-4">
                                            {r.isDebt ? (
                                                <span className="inline-flex items-center gap-1 text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">
                                                    <XCircle className="w-3 h-3" /> Added to Debt
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                                                    <CheckCircle className="w-3 h-3" /> Reduced from ARF
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ArfReturnsPage;


