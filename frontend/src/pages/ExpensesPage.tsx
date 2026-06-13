import { useEffect, useState } from "react";
import { expenseApi, ExpenseDto } from "../api/expenseApi";
import { amountRequestApi, AmountRequestFormDto } from "../api/amountRequestApi";
import { Plus, Receipt } from "lucide-react";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";


export const ExpensesPage = () => {
    const [expenses, setExpenses] = useState<ExpenseDto[]>([]);
    const [arfs, setArfs] = useState<AmountRequestFormDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [arfTotals, setArfTotals] = useState<Record<number, number>>({});
    const navigate = useNavigate();

    useEffect(() => {
        loadExpenses();
    }, []);

    const loadExpenses = async () => {
        try {
            setLoading(true);
            const [data, arfData] = await Promise.all([
                expenseApi.getAll(),
                amountRequestApi.getAll().then(r => r.data)
            ]);
            setExpenses(data);
            setArfs(arfData);
            
            // Calculate totals per ARF
            const totals: Record<number, number> = {};

            data.forEach((e: ExpenseDto) => {
                if (e.amountRequestFormId) {
                    const arfId = e.amountRequestFormId;
                    totals[arfId] = (totals[arfId] || 0) + e.totalExpenseAmount;
                }
            });
            setArfTotals(totals);
        } catch (error) {
            console.error("Failed to load expenses", error);
        } finally {
            setLoading(false);
        }
    };

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
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {expenses.map((expense) => {
                                const totalForThisArf = expense.amountRequestFormId ? (arfTotals[expense.amountRequestFormId] || 0) : 0;
                                const excessItemsAmount = expense.items?.filter(i => i.isExcessItem).reduce((sum, item) => sum + item.amount, 0) || 0;

                                // Determine ARF number badge style based on total consumed amount vs released
                                let arfElement: React.ReactNode;
                                if (expense.arfReleasedAmount > 0) {
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
                                </tr>
                                );
                            })}
                            {expenses.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
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

        </>
    );
};
