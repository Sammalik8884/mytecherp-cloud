import { useEffect, useState } from "react";
import { expenseApi, ExpenseDto } from "../api/expenseApi";
import { Plus, Receipt } from "lucide-react";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";

export const ExpensesPage = () => {
    const [expenses, setExpenses] = useState<ExpenseDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [arfTotals, setArfTotals] = useState<Record<number, number>>({});
    const [expenseExcessFlags, setExpenseExcessFlags] = useState<Record<number, number>>({});
    const navigate = useNavigate();

    useEffect(() => {
        loadExpenses();
    }, []);

    const loadExpenses = async () => {
        try {
            setLoading(true);
            const data = await expenseApi.getAll();
            setExpenses(data);
            
            // Calculate totals per ARF
            const totals: Record<number, number> = {};
            const runningSums: Record<number, number> = {};
            const flags: Record<number, number> = {};

            // Calculate running sum from oldest to newest to pinpoint which expense caused the excess
            [...data].reverse().forEach((e: ExpenseDto) => {
                if (e.amountRequestFormId && !e.isAllocatedExcess) {
                    const arfId = e.amountRequestFormId;
                    const previousSum = runningSums[arfId] || 0;
                    const newSum = previousSum + e.totalExpenseAmount;
                    runningSums[arfId] = newSum;
                    
                    if (newSum > e.arfReleasedAmount) {
                        flags[e.id] = previousSum >= e.arfReleasedAmount 
                                      ? e.totalExpenseAmount 
                                      : newSum - e.arfReleasedAmount;
                    }

                    totals[arfId] = (totals[arfId] || 0) + e.totalExpenseAmount;
                }
            });
            setArfTotals(totals);
            setExpenseExcessFlags(flags);
        } catch (error) {
            console.error("Failed to load expenses", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-6">Loading expenses...</div>;

    return (
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
                                <th className="px-4 py-3 font-medium">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {expenses.map((expense) => {
                                const totalForThisArf = expense.amountRequestFormId ? (arfTotals[expense.amountRequestFormId] || 0) : 0;
                                const excessForThisSpecificExpense = expenseExcessFlags[expense.id] || 0;

                                // Determine ARF number badge style based on total consumed amount vs released
                                let arfElement: React.ReactNode;
                                if (expense.isAllocatedExcess) {
                                    arfElement = (
                                        <span className="inline-flex items-center rounded-md bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-600/20">
                                            Excess from {expense.sourceArfNumber}
                                        </span>
                                    );
                                } else if (expense.arfReleasedAmount > 0) {
                                    if (totalForThisArf < expense.arfReleasedAmount) {
                                        arfElement = (
                                            <span className="inline-flex items-center rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/20">
                                                {expense.arfNumber || "N/A"}
                                            </span>
                                        );
                                    } else if (totalForThisArf === expense.arfReleasedAmount) {
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
                                    className="hover:bg-muted/50 transition-colors cursor-pointer"
                                >
                                    <td className="px-4 py-3 font-medium">EXP-{expense.id.toString().padStart(4, '0')}</td>
                                    <td className="px-4 py-3">{expense.siteName}</td>
                                    <td className="px-4 py-3">{arfElement}</td>
                                    <td className="px-4 py-3 font-medium text-emerald-600">
                                        Rs {expense.totalExpenseAmount?.toLocaleString()}
                                    </td>
                                    <td className="px-4 py-3">{dayjs(expense.createdAt).format("DD MMM YYYY")}</td>
                                    <td className="px-4 py-3">{expense.items?.length || 0}</td>
                                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                                        {excessForThisSpecificExpense > 0 && !expense.isAllocatedExcess && (
                                            <button
                                                onClick={() => navigate(`/amount-request?action=generateExcess&amount=${excessForThisSpecificExpense}&siteId=${expense.siteId}&expenseId=${expense.id}`)}
                                                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded text-xs font-medium transition-colors"
                                            >
                                                Generate ARF
                                            </button>
                                        )}
                                    </td>
                                </tr>
                                );
                            })}
                            {expenses.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
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
    );
};
