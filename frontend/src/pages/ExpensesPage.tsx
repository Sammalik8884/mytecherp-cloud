import { useEffect, useState } from "react";
import { expenseApi, ExpenseDto } from "../api/expenseApi";
import { Plus, Receipt } from "lucide-react";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";

export const ExpensesPage = () => {
    const [expenses, setExpenses] = useState<ExpenseDto[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        loadExpenses();
    }, []);

    const loadExpenses = async () => {
        try {
            setLoading(true);
            const data = await expenseApi.getAll();
            setExpenses(data);
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
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {expenses.map((expense) => {
                                let amountElement = <span className="font-medium text-emerald-600 dark:text-emerald-400">Rs {expense.totalExpenseAmount?.toLocaleString()}</span>;
                                
                                if (!expense.isAllocatedExcess && expense.arfReleasedAmount > 0) {
                                    if (expense.totalExpenseAmount < expense.arfReleasedAmount) {
                                        amountElement = <span className="inline-flex items-center rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/20">Rs {expense.totalExpenseAmount?.toLocaleString()}</span>;
                                    } else if (expense.totalExpenseAmount === expense.arfReleasedAmount) {
                                        amountElement = <span className="inline-flex items-center rounded-md bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20">Rs {expense.totalExpenseAmount?.toLocaleString()}</span>;
                                    } else {
                                        amountElement = <span className="font-medium">Rs {expense.totalExpenseAmount?.toLocaleString()}</span>;
                                    }
                                }

                                return (
                                <tr 
                                    key={expense.id} 
                                    onClick={() => navigate(`/expenses/edit/${expense.id}`)}
                                    className="hover:bg-muted/50 transition-colors cursor-pointer"
                                >
                                    <td className="px-4 py-3 font-medium">EXP-{expense.id.toString().padStart(4, '0')}</td>
                                    <td className="px-4 py-3">{expense.siteName}</td>
                                    <td className="px-4 py-3">
                                        {expense.isAllocatedExcess ? (
                                            <span className="inline-flex items-center rounded-md bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-600/20">
                                                Excess from {expense.sourceArfNumber}
                                            </span>
                                        ) : (
                                            expense.arfNumber || "N/A"
                                        )}
                                    </td>
                                    <td className="px-4 py-3">
                                        {amountElement}
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
    );
};
