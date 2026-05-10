import React, { useEffect, useState } from 'react';
import { expenseApi, ExpenseDto } from '../../api/expenseApi';
import { toast } from 'react-hot-toast';
import { X, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '../../auth/AuthContext';

interface ArfAdjustmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    releasedAmount: number;
    newArfId: number;
    onSuccess: () => void;
}

interface OverconsumedArf {
    arfId: number;
    arfNumber: string;
    excessAmount: number;
    siteId: number;
}

export const ArfAdjustmentModal: React.FC<ArfAdjustmentModalProps> = ({
    isOpen,
    onClose,
    releasedAmount,
    newArfId,
    onSuccess
}) => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [overconsumedArfs, setOverconsumedArfs] = useState<OverconsumedArf[]>([]);
    const [adjustingId, setAdjustingId] = useState<number | null>(null);

    useEffect(() => {
        if (isOpen) {
            loadData();
        }
    }, [isOpen]);

    const loadData = async () => {
        try {
            setLoading(true);
            const expenses = await expenseApi.getAll();
            
            const arfTotals: Record<number, number> = {};
            const arfData: Record<number, { arfNumber: string, released: number, siteId: number }> = {};
            
            expenses.forEach((e: ExpenseDto) => {
                if (e.amountRequestFormId && !e.isAllocatedExcess) {
                    arfTotals[e.amountRequestFormId] = (arfTotals[e.amountRequestFormId] || 0) + e.totalExpenseAmount;
                    arfData[e.amountRequestFormId] = { 
                        arfNumber: e.arfNumber, 
                        released: e.arfReleasedAmount,
                        siteId: e.siteId
                    };
                }
            });

            const overconsumed = Object.entries(arfTotals)
                .map(([id, total]) => {
                    const data = arfData[Number(id)];
                    return {
                        arfId: Number(id),
                        arfNumber: data.arfNumber || 'Unknown',
                        excessAmount: total - data.released,
                        siteId: data.siteId
                    };
                })
                .filter(a => a.excessAmount > 0);

            setOverconsumedArfs(overconsumed);
        } catch (error) {
            toast.error("Failed to load ARFs for adjustment");
        } finally {
            setLoading(false);
        }
    };

    const handleAdjust = async (target: OverconsumedArf) => {
        try {
            setAdjustingId(target.arfId);
            const adjustAmount = Math.min(releasedAmount, target.excessAmount);

            // 1. Find the latest expense for targetArfId to reduce it
            const expenses = await expenseApi.getAll();
            const targetExpenses = expenses
                .filter(e => e.amountRequestFormId === target.arfId && !e.isAllocatedExcess)
                .sort((a, b) => b.id - a.id);
            
            if (targetExpenses.length === 0) {
                toast.error("No expenses found for this ARF to adjust");
                return;
            }

            const expenseToReduce = targetExpenses[0];
            const fullExpenseDetail = await expenseApi.getById(expenseToReduce.id);
            
            const updatedItems = [...fullExpenseDetail.items];
            let remainingToReduce = adjustAmount;
            
            for (let item of updatedItems) {
                if (remainingToReduce <= 0) break;
                if (item.amount > 0) {
                    const reduction = Math.min(item.amount, remainingToReduce);
                    item.amount -= reduction;
                    remainingToReduce -= reduction;
                }
            }
            
            const validItems = updatedItems.filter(i => i.amount > 0);
            
            // 2. Update or Delete the original expense
            if (validItems.length === 0) {
                await expenseApi.delete(expenseToReduce.id);
            } else {
                await expenseApi.update(expenseToReduce.id, {
                    siteId: fullExpenseDetail.siteId,
                    amountRequestFormId: fullExpenseDetail.amountRequestFormId,
                    isAllocatedExcess: false,
                    items: validItems
                });
            }

            // 3. Create a new AllocatedExcess expense linked to the NEW ARF
            await expenseApi.create({
                siteId: fullExpenseDetail.siteId,
                amountRequestFormId: newArfId,
                isAllocatedExcess: true,
                sourceArfNumber: target.arfNumber,
                items: [{
                     expenseDate: new Date().toISOString().split('T')[0],
                     employeeName: user?.fullName || "System",
                     employeeDesignation: "Accounts",
                     expenseType: "Auto-Adjustment",
                     descriptionItems: `Adjusted from ${target.arfNumber}`,
                     amount: adjustAmount,
                     remarks: `Auto-adjusted from over-consumed ARF ${target.arfNumber}`
                }]
            });

            toast.success(`Successfully adjusted Rs ${adjustAmount.toLocaleString()} against ${target.arfNumber}`);
            onSuccess();
            onClose();
        } catch (error) {
            console.error(error);
            toast.error("Adjustment failed");
        } finally {
            setAdjustingId(null);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-background rounded-xl shadow-xl w-full max-w-lg overflow-hidden border border-border">
                <div className="flex justify-between items-center p-6 border-b border-border bg-muted/30">
                    <div>
                        <h2 className="text-xl font-bold text-foreground">Adjust Released Amount</h2>
                        <p className="text-sm text-muted-foreground mt-1">
                            Rs {releasedAmount.toLocaleString()} released. Where do you want to adjust this?
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="p-6 max-h-[60vh] overflow-y-auto">
                    {loading ? (
                        <div className="py-8 text-center text-muted-foreground">Loading pending ARFs...</div>
                    ) : overconsumedArfs.length === 0 ? (
                        <div className="py-8 text-center text-muted-foreground flex flex-col items-center">
                            <CheckCircle className="h-12 w-12 text-emerald-500 mb-3 opacity-20" />
                            <p>No over-consumed ARFs found to adjust.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 mb-4 text-amber-600 bg-amber-50 p-3 rounded-lg text-sm border border-amber-100">
                                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                                <p>Select a pending ARF below to automatically adjust the excess expense and link it to your newly released ARF.</p>
                            </div>
                            
                            {overconsumedArfs.map((arf) => (
                                <div key={arf.arfId} className="flex items-center justify-between p-4 border border-border rounded-lg hover:border-primary/50 transition-colors bg-card">
                                    <div>
                                        <div className="font-semibold">{arf.arfNumber}</div>
                                        <div className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                                            <span className="text-red-600 font-medium">Excess: Rs {arf.excessAmount.toLocaleString()}</span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleAdjust(arf)}
                                        disabled={adjustingId !== null}
                                        className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm disabled:opacity-50"
                                    >
                                        {adjustingId === arf.arfId ? 'Adjusting...' : 'Adjust Here'}
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
