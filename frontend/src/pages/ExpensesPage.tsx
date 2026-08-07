import React, { useEffect, useState, useMemo } from "react";
import { createPortal } from "react-dom";
import { expenseApi, ExpenseDto } from "../api/expenseApi";
import { amountRequestApi } from "../api/amountRequestApi";

import { useAuth } from "../auth/AuthContext";
import { ChevronDown, ChevronRight, Plus, Receipt, CheckCircle, XCircle, ExternalLink, X, Download, Trash2, Search, ChevronLeft } from "lucide-react";
import dayjs from "dayjs";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { ConfirmModal } from "../components/common/ConfirmModal";

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
    const [isDeleting, setIsDeleting] = useState(false);
    
    const [historyModalOpen, setHistoryModalOpen] = useState(false);
    const [historyExpense, setHistoryExpense] = useState<ExpenseDto | null>(null);

    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [selectedExpenses, setSelectedExpenses] = useState<Set<number>>(new Set());
    const [confirmModalState, setConfirmModalState] = useState<{isOpen: boolean; mode: 'single' | 'bulk'; expenseId?: number}>({ isOpen: false, mode: 'single' });

    const [searchQuery, setSearchQuery] = useState("");
    const [pageSize, setPageSize] = useState<number>(10);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [deleteAssociatedArf, setDeleteAssociatedArf] = useState<boolean>(false);

    const currentUserRoles = user?.roles || [];
    const isAdmin = currentUserRoles.includes("Admin") || currentUserRoles.includes("CEO") || user?.email === "munawar.hasan@mytecheng.com";
    const isMajeed = user?.email?.toLowerCase() === "abdul.majeed@mytecheng.com";
    const canReview = !isMajeed && (isAdmin || currentUserRoles.includes("Accounts Assistant") || currentUserRoles.includes("Accounts Head") || currentUserRoles.includes("Accounts") || user?.email === "asma@mytecheng.com" || user?.email === "shahbaz.ali@mytecheng.com" || user?.email === "faisal.ghani@mytecheng.com");

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
                    if (e.status !== "Rejected") {
                        totals[arfId] = (totals[arfId] || 0) + (Number(e.totalExpenseAmount) || 0) + excessItemsAmount;
                    }
                    
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

    const executeDelete = async () => {
        try {
            setIsDeleting(true);
            if (confirmModalState.mode === 'single' && confirmModalState.expenseId) {
                await expenseApi.delete(confirmModalState.expenseId, deleteAssociatedArf);
                toast.success("Expense deleted successfully");
            } else if (confirmModalState.mode === 'bulk') {
                await Promise.all(Array.from(selectedExpenses).map(id => expenseApi.delete(id, deleteAssociatedArf)));
                toast.success(`${selectedExpenses.size} expenses deleted successfully`);
                setSelectedExpenses(new Set());
            }
            loadExpenses();
        } catch (error: any) {
            toast.error(error.response?.data || "Failed to delete expense(s)");
        } finally {
            setIsDeleting(false);
            setConfirmModalState({ isOpen: false, mode: 'single' });
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

    const filteredGroups = useMemo(() => {
        let result = groupedExpenses;
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            result = result.filter(group => {
                return group.expenses.some(exp => 
                    `exp-${exp.id.toString().padStart(4, '0')}`.includes(query) ||
                    exp.id.toString() === query ||
                    (exp.arfNumber && exp.arfNumber.toLowerCase().includes(query))
                );
            });
        }
        return result;
    }, [groupedExpenses, searchQuery]);

    const paginatedGroups = useMemo(() => {
        const startIndex = (currentPage - 1) * pageSize;
        return filteredGroups.slice(startIndex, startIndex + pageSize);
    }, [filteredGroups, currentPage, pageSize]);
    
    const totalPages = Math.max(1, Math.ceil(filteredGroups.length / pageSize));

    if (loading) return <div className="p-6">Loading expenses...</div>;

    return (
        <>
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Expenses</h1>
                    <p className="text-muted-foreground">Manage and track project expenses</p>
                </div>
                <div className="flex items-center space-x-3">
                    {isAdmin && selectedExpenses.size > 0 && (
                        <button
                            onClick={() => setConfirmModalState({ isOpen: true, mode: 'bulk' })}
                            className="flex items-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors shadow-sm font-medium"
                        >
                            <Trash2 className="h-4 w-4" />
                            <span>Delete Selected ({selectedExpenses.size})</span>
                        </button>
                    )}
                    <button
                        onClick={() => navigate("/expenses/new")}
                        className="flex items-center space-x-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors shadow-sm font-medium"
                    >
                        <Plus className="h-4 w-4" />
                        <span>Add Expense</span>
                    </button>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-card p-4 rounded-xl border border-border shadow-sm">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <div className="relative flex-1 sm:w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Search by ID (e.g. EXP-0054) or ARF..."
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="pl-9 pr-4 py-2 w-full rounded-lg border border-input bg-background focus:ring-1 focus:ring-primary focus:outline-none text-sm"
                        />
                    </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>Show:</span>
                    <select
                        value={pageSize}
                        onChange={(e) => {
                            setPageSize(Number(e.target.value));
                            setCurrentPage(1);
                        }}
                        className="p-1 rounded border border-input bg-background focus:ring-1 focus:ring-primary focus:outline-none"
                    >
                        <option value={10}>10</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                        <option value={500}>500</option>
                    </select>
                </div>
            </div>

            <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-muted text-muted-foreground border-b border-border">
                            <tr>
                                {isAdmin && (
                                    <th className="px-4 py-3 font-medium w-10">
                                        <input 
                                            type="checkbox"
                                            className="rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                                            checked={expenses.length > 0 && selectedExpenses.size === expenses.length}
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    setSelectedExpenses(new Set(expenses.map(exp => exp.id)));
                                                } else {
                                                    setSelectedExpenses(new Set());
                                                }
                                            }}
                                        />
                                    </th>
                                )}
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
                            {paginatedGroups.map((group) => {
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
                                            {isAdmin && (
                                                <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                                                    <input 
                                                        type="checkbox"
                                                        className="rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                                                        checked={selectedExpenses.has(expense.id)}
                                                        onChange={(e) => {
                                                            const newSet = new Set(selectedExpenses);
                                                            if (e.target.checked) newSet.add(expense.id);
                                                            else newSet.delete(expense.id);
                                                            setSelectedExpenses(newSet);
                                                        }}
                                                    />
                                                </td>
                                            )}
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
                                            <td className={`px-4 py-3 font-medium ${expense.status === "Rejected" ? "text-red-500 line-through" : expense.status === "Accepted" ? "text-emerald-600" : "text-amber-600"}`}>
                                                Rs {expense.totalExpenseAmount?.toLocaleString()}
                                                {excessItemsAmount > 0 && (
                                                    <div className={`text-xs mt-0.5 ${expense.status === "Rejected" ? "text-red-400" : "text-amber-600"}`}>
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
                                                        className="text-primary hover:text-primary/80 font-medium text-sm mr-3"
                                                    >
                                                        Review
                                                    </button>
                                                )}
                                                {canReview && (expense.status === "Accepted" || expense.status === "Rejected") && (
                                                    <>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setHistoryExpense(expense);
                                                                setHistoryModalOpen(true);
                                                            }}
                                                            className="text-gray-600 hover:text-gray-900 font-medium text-sm mr-3"
                                                        >
                                                            History
                                                        </button>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setReviewingExpense(expense);
                                                                setReviewComments(expense.reviewerComments || "");
                                                                setReviewModalOpen(true);
                                                            }}
                                                            className="text-primary hover:text-primary/80 font-medium text-sm mr-3"
                                                        >
                                                            Update
                                                        </button>
                                                    </>
                                                )}
                                                {(expense.status === "Rejected" && (expense.createdByEmail === user?.email || isAdmin)) && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            navigate(`/expenses/edit/${expense.id}`);
                                                        }}
                                                        className="text-blue-600 hover:text-blue-800 font-medium text-sm mr-3"
                                                    >
                                                        Resubmit
                                                    </button>
                                                )}
                                                {isAdmin && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setConfirmModalState({ isOpen: true, mode: 'single', expenseId: expense.id });
                                                        }}
                                                        disabled={isDeleting}
                                                        className="text-red-600 hover:text-red-800 font-medium text-sm disabled:opacity-50"
                                                    >
                                                        Delete
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
                            {paginatedGroups.length === 0 && (
                                <tr>
                                    <td colSpan={isAdmin ? 9 : 8} className="px-4 py-8 text-center text-muted-foreground">
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

            {totalPages > 1 && (
                <div className="flex items-center justify-between bg-card p-4 rounded-xl border border-border shadow-sm">
                    <div className="text-sm text-muted-foreground">
                        Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, filteredGroups.length)} of {filteredGroups.length} expenses
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="p-2 rounded-lg hover:bg-muted disabled:opacity-50 transition-colors border border-border bg-background"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </button>
                        <span className="text-sm font-medium px-2">
                            Page {currentPage} of {totalPages}
                        </span>
                        <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="p-2 rounded-lg hover:bg-muted disabled:opacity-50 transition-colors border border-border bg-background"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            )}
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
                                                    <button type="button" onClick={(e) => {
                                                        e.preventDefault();
                                                        if (/\.(jpeg|jpg|gif|png|webp|bmp)(\?.*)?$/i.test(item.fileUrl)) {
                                                            setSelectedImage(item.fileUrl);
                                                        } else {
                                                            window.open(item.fileUrl, '_blank');
                                                        }
                                                    }} className="text-primary hover:underline flex items-center bg-primary/5 px-2 py-1 rounded">
                                                        <ExternalLink className="h-3 w-3 mr-1" /> File 1
                                                    </button>
                                                )}
                                                {item.attachments?.map((url: string, attIdx: number) => (
                                                    <button type="button" key={attIdx} onClick={(e) => {
                                                        e.preventDefault();
                                                        if (/\.(jpeg|jpg|gif|png|webp|bmp)(\?.*)?$/i.test(url)) {
                                                            setSelectedImage(url);
                                                        } else {
                                                            window.open(url, '_blank');
                                                        }
                                                    }} className="text-primary hover:underline flex items-center bg-primary/5 px-2 py-1 rounded">
                                                        <ExternalLink className="h-3 w-3 mr-1" /> Att {attIdx + 1}
                                                    </button>
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

        {historyModalOpen && historyExpense && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
                <div className="bg-background rounded-xl shadow-xl w-full max-w-md p-6 flex flex-col">
                    <h3 className="text-lg font-bold mb-4">Expense History</h3>
                    <div className="space-y-4 text-sm">
                        <div>
                            <p className="text-muted-foreground">Status</p>
                            <p className="font-semibold capitalize">{historyExpense.status}</p>
                        </div>
                        <div>
                            <p className="text-muted-foreground">Reviewed By</p>
                            <p className="font-medium">{historyExpense.reviewedByEmail || "Unknown"}</p>
                        </div>
                        {historyExpense.reviewedAt && (
                            <div>
                                <p className="text-muted-foreground">Reviewed Date</p>
                                <p className="font-medium">{dayjs(historyExpense.reviewedAt).format("DD MMM YYYY, hh:mm A")}</p>
                            </div>
                        )}
                        <div>
                            <p className="text-muted-foreground">Comments</p>
                            <div className="mt-1 p-3 bg-muted rounded border border-border min-h-[60px]">
                                {historyExpense.reviewerComments || <span className="italic text-muted-foreground">No comments provided.</span>}
                            </div>
                        </div>
                    </div>
                    <div className="mt-6 flex justify-end">
                        <button 
                            onClick={() => setHistoryModalOpen(false)}
                            className="px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded font-medium"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        )}

        {selectedImage && (
            createPortal(
                <div 
                    className="fixed inset-0 z-[9999] bg-black/90 flex items-center justify-center p-4"
                    onClick={() => setSelectedImage(null)}
                >
                    <div 
                        className="relative max-w-7xl max-h-[90vh] w-full flex items-center justify-center bg-black rounded-lg overflow-hidden group"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={() => setSelectedImage(null)}
                            className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/80 text-white rounded-full transition-colors z-10"
                        >
                            <X className="h-6 w-6" />
                        </button>
                        
                        <a
                            href={selectedImage}
                            download
                            target="_blank"
                            rel="noopener noreferrer"
                            className="absolute top-4 right-16 p-2 bg-black/50 hover:bg-black/80 text-white rounded-full transition-colors z-10 flex items-center gap-2 px-4"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <Download className="h-4 w-4" />
                            <span className="text-sm font-medium">Download</span>
                        </a>

                        <img 
                            src={selectedImage} 
                            alt="Expense Evidence Preview" 
                            className="max-w-full max-h-[90vh] object-contain"
                        />
                    </div>
                </div>,
                document.body
            )
        )}

        <ConfirmModal
            isOpen={confirmModalState.isOpen}
            title={confirmModalState.mode === 'bulk' ? "Delete Multiple Expenses" : "Delete Expense"}
            message={confirmModalState.mode === 'bulk' 
                ? `Are you sure you want to delete ${selectedExpenses.size} selected expenses? This action cannot be undone.` 
                : "Are you sure you want to delete this expense? This action cannot be undone."}
            confirmText={isDeleting ? "Deleting..." : "Delete"}
            type="danger"
            onConfirm={executeDelete}
            onCancel={() => !isDeleting && setConfirmModalState({ isOpen: false, mode: 'single' })}
        >
            <div className="mt-4 flex items-center space-x-2">
                <input 
                    type="checkbox" 
                    id="deleteArfCheckbox" 
                    checked={deleteAssociatedArf} 
                    onChange={(e) => setDeleteAssociatedArf(e.target.checked)} 
                    className="h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500 cursor-pointer"
                />
                <label htmlFor="deleteArfCheckbox" className="text-sm font-medium text-foreground cursor-pointer select-none">
                    Also delete associated Amount Request Form(s)
                </label>
            </div>
        </ConfirmModal>
        </>
    );
};
