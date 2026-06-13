import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { officeApi, OfficeDto } from "../api/officeApi";
import { amountRequestApi, AmountRequestFormDto } from "../api/amountRequestApi";
import { expenseApi, ExpenseDto } from "../api/expenseApi";
import { Building2, MapPin, DollarSign, Receipt, ArrowLeft } from "lucide-react";
import dayjs from "dayjs";

export const OfficeDetailsPage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [office, setOffice] = useState<OfficeDto | null>(null);
    const [arfs, setArfs] = useState<AmountRequestFormDto[]>([]);
    const [expenses, setExpenses] = useState<ExpenseDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'arfs' | 'expenses'>('arfs');

    useEffect(() => {
        if (id) {
            loadData(Number(id));
        }
    }, [id]);

    const loadData = async (officeId: number) => {
        try {
            setLoading(true);
            const [officeData, arfsData, expensesData] = await Promise.all([
                officeApi.getById(officeId),
                amountRequestApi.getAll().then(res => res.data.filter(a => a.officeId === officeId)),
                expenseApi.getAll().then(data => data.filter(e => e.officeId === officeId))
            ]);
            setOffice(officeData);
            setArfs(arfsData);
            setExpenses(expensesData);
        } catch (error) {
            console.error("Failed to load office details", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-6">Loading office details...</div>;
    if (!office) return <div className="p-6">Office not found</div>;

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <button 
                onClick={() => navigate('/offices')}
                className="flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to Offices
            </button>

            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                <div className="flex justify-between items-start">
                    <div className="flex items-center space-x-4">
                        <div className="p-3 bg-primary/10 text-primary rounded-xl">
                            <Building2 className="h-8 w-8" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight">{office.name}</h1>
                            <div className="flex items-center space-x-4 mt-2 text-sm text-muted-foreground">
                                <span className="flex items-center">
                                    <MapPin className="h-4 w-4 mr-1" />
                                    {office.city || "No City specified"}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                <div className="flex space-x-1 bg-muted p-1 rounded-xl w-fit">
                    <button
                        onClick={() => setActiveTab('arfs')}
                        className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'arfs' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-background/50'}`}
                    >
                        <DollarSign className="h-4 w-4" />
                        <span>ARFs ({arfs.length})</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('expenses')}
                        className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'expenses' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-background/50'}`}
                    >
                        <Receipt className="h-4 w-4" />
                        <span>Expenses ({expenses.length})</span>
                    </button>
                </div>

                {activeTab === 'arfs' && (
                     <div className="bg-card border border-border rounded-xl overflow-hidden">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-muted text-muted-foreground">
                                <tr>
                                    <th className="px-4 py-3">ARF Number</th>
                                    <th className="px-4 py-3">Employee</th>
                                    <th className="px-4 py-3">Requested</th>
                                    <th className="px-4 py-3">Released</th>
                                    <th className="px-4 py-3">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {arfs.length === 0 ? (
                                    <tr><td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">No ARFs found for this office.</td></tr>
                                ) : arfs.map(arf => (
                                    <tr key={arf.id} className="hover:bg-muted/50">
                                        <td className="px-4 py-3 font-medium">{arf.arfNumber || `ARF-${arf.id}`}</td>
                                        <td className="px-4 py-3">{arf.employeeName}</td>
                                        <td className="px-4 py-3">Rs {arf.advanceRequested?.toLocaleString()}</td>
                                        <td className="px-4 py-3">Rs {arf.accountsReleasedAmount?.toLocaleString()}</td>
                                        <td className="px-4 py-3">{arf.status}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {activeTab === 'expenses' && (
                     <div className="bg-card border border-border rounded-xl overflow-hidden">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-muted text-muted-foreground">
                                <tr>
                                    <th className="px-4 py-3">ID</th>
                                    <th className="px-4 py-3">ARF Number</th>
                                    <th className="px-4 py-3">Total Expense</th>
                                    <th className="px-4 py-3">Date</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {expenses.length === 0 ? (
                                    <tr><td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">No expenses found for this office.</td></tr>
                                ) : expenses.map(exp => (
                                    <tr key={exp.id} className="hover:bg-muted/50">
                                        <td className="px-4 py-3">EXP-{exp.id.toString().padStart(4, '0')}</td>
                                        <td className="px-4 py-3">{exp.arfNumber || "N/A"}</td>
                                        <td className="px-4 py-3 font-medium text-emerald-600">Rs {exp.totalExpenseAmount?.toLocaleString()}</td>
                                        <td className="px-4 py-3">{dayjs(exp.createdAt).format("DD MMM YYYY")}</td>
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
