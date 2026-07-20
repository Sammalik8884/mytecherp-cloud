import React, { useEffect, useState, useMemo } from "react";
import { expenseApi, ExpenseDto } from "../api/expenseApi";
import { amountRequestApi } from "../api/amountRequestApi";

import { useAuth } from "../auth/AuthContext";
import { ChevronDown, ChevronRight, Plus, Receipt, CheckCircle, XCircle, ExternalLink } from "lucide-react";
import dayjs from "dayjs";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";

export const ExpensesPage = () => {
    const { user } = useAuth();
    const [expenses, setExpenses] = useState<ExpenseDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [arfTotals, setArfTotals] = useState<Record<number, number>>({});
    const [arfEffectiveReleased, setArfEffectiveReleased] = useState<Record<number, number>>({});
    const navigate = useNavigate();

    const [reviewModalOpen, setReviewModalOpen] = useState(false);
    const [reviewingExpense, setReviewingExpense] = useState<ExpenseDto | null>(null);
    const [reviewComments, setReviewComments] = useState("");
    const [isReviewing, setIsReviewing] = useState(false);

    const currentUserRoles = user?.roles || [];
    const canReview = currentUserRoles.includes("CEO") || currentUserRoles.includes("Accounts Assistant") || currentUserRoles.includes("Accounts Head") || currentUserRoles.includes("Accounts");

    useEffect(() => {
        loadExpenses();
    }, []);

    const handleReviewSubmit = async (status: string) => {
        if (!reviewingExpense) return;
        try {
            setIsReviewing(true);
            await expenseApi.review(reviewingExpense.id, { status, comments: reviewComments });
            toast.success(`Expense ${status} successfully`);
            setReviewModalOpen(false);
            loadExpenses();
        } catch (error) {
            toast.error("Failed to review expense");
        } finally {
            setIsReviewing(false);
        }
    };

    const loadExpenses = async () => {
        try {
            setLoading(true);
            const [data, arfsRes] = await Promise.all([
                expenseApi.getAll(),
                amountRequestApi.getAll()
            ]);
            setExpenses(data);
            
            // Calculate totals per ARF
            const totals: Record<number, number> = {};
            const effectiveReleased: Record<number, number> = {};

            data.forEach((e: ExpenseDto) => {
                if (e.amountRequestFormId) {
                    const arfId = e.amountRequestFormId;
                    const excessItemsAmount = e.items?.filter(i => i.isExcessItem).reduce((sum, item) => sum + (Number(item.amount) || 0), 0) || 0;
                    totals[arfId] = (totals[arfId] || 0) + (Number(e.totalExpenseAmount) || 0) + excessItemsAmount;
                    
                    if (e.arfNumber && !(arfId in effectiveReleased)) {
                        // Original ARF released amount
                        const originalReleased = Number(e.arfReleasedAmount) || 0;
                        
                        // Find any excess ARFs generated for this ARF
                        const excessReleased = arfsRes.data
                            .filter(a => a.purposeOfAdvance?.includes(e.arfNumber))
                            .reduce((sum, a) => sum + (Number(a.accountsReleasedAmount) || 0), 0);
                            
                        effectiveReleased[arfId] = originalReleased + excessReleased;
                    }
                }
            });
            setArfTotals(totals);
            setArfEffectiveReleased(effectiveReleased);
        } catch (error) {
            console.error("Failed to load expenses", error);
        } finally {
            setLoading(false);
        }
    };

    const [expandedGroups, setExpandedGroups] = useState<Set<number>>(new Set());

    const toggleGroup = (arfId: number, e: React.MouseEvent) => {
        e.stopPropagation();
        const newSet = new Set(expandedGroups);
        if (newSet.has(arfId)) newSet.delete(arfId);
        else newSet.add(arfId);
        setExpandedGroups(newSet);
    };

    const groupedExpenses = useMemo(() => {
        const groups: { arfId: number | null, expenses: ExpenseDto[] }[] = [];
        const arfMap: Record<number, ExpenseDto[]> = {};
        const noArf: ExpenseDto[] = [];

        expenses.forEach(e => {
            if (e.amountRequestFormId) {
                if (!arfMap[e.amountRequestFormId]) arfMap[e.amountRequestFormId] = [];
                arfMap[e.amountRequestFormId].push(e);
            } else {
                noArf.push(e);
            }
        });

        Object.entries(arfMap).forEach(([arfId, list]) => {
            list.sort((a, b) => a.id - b.id);
            groups.push({ arfId: Number(arfId), expenses: list });
        });

        noArf.forEach(e => groups.push({ arfId: null, expenses: [e] }));

        groups.sort((a, b) => {
            const latestA = Math.max(...a.expenses.map(x => new Date(x.createdAt).getTime()));
            const latestB = Math.max(...b.expenses.map(x => new Date(x.createdAt).getTime()));
            return latestB - latestA;
        });

        return groups;
    }, [expenses]);

    if (loading) return <div className="p-6">Loading expenses...</div>;

    return (
        <>
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Expenses</h1>
                    <p className="text-muted-foreground">Manage and track project expenses</p>
                </div>
                <button
                    onClick={() => navigate("/expenses/new")}
                    className="flex items-center space-x-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors shadow-sm font-medium"
                >
                    <Plus className="h-4 w-4" />
                    <span>Add Expense</span>
                </button>
            </div>

            <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-muted text-muted-foreground border-b border-border">
                            <tr>
                                <th className="px-4 py-3 font-medium">Expense ID</th>
                                <th className="px-4 py-3 font-medium">Site/Project</th>
                                <th className="px-4 py-3 font-medium">ARF Number</th>
                                <th className="px-4 py-3 font-medium">Total Amount</th>
                                <th className="px-4 py-3 font-medium">Created Date</th>
                                <th className="px-4 py-3 font-medium">Items</th>
                                <th className="px-4 py-3 font-medium">Status</th>
                                <th className="px-4 py-3 font-medium">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {groupedExpenses.map((group) => {
                                const mainExpense = group.expenses[0];
                                const hasMultiple = group.expenses.length > 1;
                                const isExpanded = group.arfId ? expandedGroups.has(group.arfId) : false;

                                const renderRow = (expense: ExpenseDto, isMain: boolean) => {
                                    const totalForThisArf = expense.amountRequestFormId ? (arfTotals[expense.amountRequestFormId] || 0) : 0;
                                    const effectiveReleasedAmount = expense.amountRequestFormId ? (arfEffectiveReleased[expense.amountRequestFormId] || Number(expense.arfReleasedAmount) || 0) : (Number(expense.arfReleasedAmount) || 0);
                                    const excessItemsAmount = expense.items?.filter(i => i.isExcessItem).reduce((sum, item) => sum + (Number(item.amount) || 0), 0) || 0;

                                    let arfElement: React.ReactNode;
                                    if (effectiveReleasedAmount > 0) {
                                        if (totalForThisArf < effectiveReleasedAmount) {
                                            arfElement = (
                                                <span className="inline-flex items-center rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/20">
                                                    {expense.arfNumber || "N/A"}
                                                </span>
                                            );
                                        } else if (totalForThisArf === effectiveReleasedAmount) {
                                            arfElement = (
                                                <span className="inline-flex items-center rounded-md bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                                                    {expense.arfNumber || "N/A"}
                                                </span>
                                            );
                                        } else {
                                            arfElement = (
                                                <span className="inline-flex items-center rounded-md bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-600/20">
                                                    {expense.arfNumber || "N/A"} (Excess)
                                                </span>
                                            );
                                        }
                                    } else {
                                        arfElement = <span>{expense.arfNumber || "N/A"}</span>;
                                    }

                                    return (
                                        <tr 
                                            key={expense.id} 
                                            onClick={() => navigate(`/expenses/edit/${expense.id}`)}
                                            className={`hover:bg-muted/50 transition-colors cursor-pointer ${!isMain ? 'bg-muted/30' : ''}`}
                                        >
                                            <td className="px-4 py-3 font-medium flex items-center gap-2">
                                                {isMain && hasMultiple ? (
                                                    <button 
                                                        onClick={(e) => toggleGroup(expense.amountRequestFormId!, e)}
                                                        className="p-1 hover:bg-muted rounded-md transition-colors"
                                                    >
                                                        {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                                    </button>
                                                ) : (
                                                    <div className="w-6" /> // Spacer for alignment
                                                )}
                                                EXP-{expense.id.toString().padStart(4, '0')}
                                            </td>
                                            <td className="px-4 py-3">{expense.officeId ? (expense.officeName || "Office") : (expense.siteName || "No Site")}</td>
                                            <td className="px-4 py-3">{arfElement}</td>
                                            <td className="px-4 py-3 font-medium text-emerald-600">
                                                Rs {expense.totalExpenseAmount?.toLocaleString()}
                                                {excessItemsAmount > 0 && (
                                                    <div className="text-xs text-amber-600 mt-0.5">
                                                        + Rs {excessItemsAmount.toLocaleString()} Excess
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">{dayjs(expense.createdAt).format("DD MMM YYYY")}</td>
                                            <td className="px-4 py-3">{expense.items?.length || 0}</td>
                                            <td className="px-4 py-3">
                                                <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${
                                                    expense.status === "Accepted" ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20" :
                                                    expense.status === "Rejected" ? "bg-red-50 text-red-700 ring-red-600/20" :
                                                    "bg-amber-50 text-amber-700 ring-amber-600/20"
                                                }`}>
                                                    {expense.status || "Pending"}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                {canReview && (!expense.status || expense.status === "Pending") && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setReviewingExpense(expense);
                                                            setReviewComments("");
                                                            setReviewModalOpen(true);
                                                        }}
                                                        className="text-primary hover:text-primary/80 font-medium text-sm"
                                                    >
                                                        Review
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                };

                                return (
                                    <React.Fragment key={`group-${group.arfId || 'no-arf'}-${mainExpense.id}`}>
                                        {renderRow(mainExpense, true)}
                                        {isExpanded && group.expenses.slice(1).map(exp => renderRow(exp, false))}
                                    </React.Fragment>
                                );
                            })}
                            {expenses.length === 0 && (
                                <tr>
                                    <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                                        <div className="flex flex-col items-center">
                                            <Receipt className="h-12 w-12 opacity-20 mb-3" />
                                            <p>No expenses found. Click 'Add Expense' to create one.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        {reviewModalOpen && reviewingExpense && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                <div className="bg-background rounded-xl shadow-xl w-full max-w-3xl p-6 flex flex-col max-h-[90vh]">
                    <h3 className="text-xl font-bold mb-4">Review Expense</h3>
                    <div className="mb-4 text-sm shrink-0">
                        <p className="font-semibold text-foreground">
                            EXP-{reviewingExpense.id.toString().padStart(4, '0')} 
                            <span className="ml-2 text-primary">(Rs {reviewingExpense.totalExpenseAmount?.toLocaleString()})</span>
                        </p>
                        <p className="text-muted-foreground">Submitted by: {reviewingExpense.createdByEmail}</p>
                        {reviewingExpense.reviewerComments && (
                            <div className="mt-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 rounded text-amber-800 dark:text-amber-200">
                                <span className="font-semibold block mb-1">Last Comments: </span>
                                {reviewingExpense.reviewerComments}
                            </div>
                        )}
                    </div>
                    
                    <div className="overflow-y-auto border border-border rounded mb-4 max-h-[40vh]">
                        <table className="w-full text-xs text-left">
                            <thead className="bg-muted sticky top-0 z-10 shadow-sm">
                                <tr>
                                    <th className="p-2 border-b">Type</th>
                                    <th className="p-2 border-b">Description</th>
                                    <th className="p-2 border-b">Amount</th>
                                    <th className="p-2 border-b">Attachments</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {reviewingExpense.items?.map((item: any, i: number) => (
                                    <tr key={i} className="hover:bg-muted/50">
                                        <td className="p-2 font-medium">{item.expenseType}</td>
                                        <td className="p-2">{item.descriptionItems}</td>
                                        <td className="p-2 font-semibold">Rs {item.amount?.toLocaleString()}</td>
                                        <td className="p-2">
                                            <div className="flex flex-wrap gap-2">
                                                {item.fileUrl && (
                                                    <a href={item.fileUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline flex items-center bg-primary/5 px-2 py-1 rounded">
                                                        <ExternalLink className="h-3 w-3 mr-1" /> File 1
                                                    </a>
                                                )}
                                                {item.attachments?.map((url: string, attIdx: number) => (
                                                    <a key={attIdx} href={url} target="_blank" rel="noreferrer" className="text-primary hover:underline flex items-center bg-primary/5 px-2 py-1 rounded">
                                                        <ExternalLink className="h-3 w-3 mr-1" /> Att {attIdx + 1}
                                                    </a>
                                                ))}
                                                {(!item.fileUrl && (!item.attachments || item.attachments.length === 0)) && (
                                                    <span className="text-muted-foreground italic">None</span>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="shrink-0">
                        <textarea 
                            value={reviewComments}
                            onChange={(e) => setReviewComments(e.target.value)}
                            placeholder="Add comments (optional)..."
                            className="w-full p-2 mb-4 rounded border border-input bg-background min-h-[100px] text-sm focus:ring-1 focus:ring-primary focus:outline-none"
                        />
                    </div>
                    <div className="flex justify-end space-x-2">
                        <button 
                            disabled={isReviewing}
                            onClick={() => setReviewModalOpen(false)}
                            className="px-4 py-2 text-muted-foreground hover:bg-muted rounded"
                        >
                            Cancel
                        </button>
                        <button 
                            disabled={isReviewing}
                            onClick={() => handleReviewSubmit("Rejected")}
                            className="px-4 py-2 bg-red-100 text-red-700 hover:bg-red-200 rounded font-medium flex items-center gap-1"
                        >
                            <XCircle className="w-4 h-4" /> Reject
                        </button>
                        <button 
                            disabled={isReviewing}
                            onClick={() => handleReviewSubmit("Accepted")}
                            className="px-4 py-2 bg-emerald-600 text-white hover:bg-emerald-700 rounded font-medium flex items-center gap-1"
                        >
                            <CheckCircle className="w-4 h-4" /> Accept
                        </button>
                    </div>
                </div>
            </div>
        )}
        </>
    );
};
