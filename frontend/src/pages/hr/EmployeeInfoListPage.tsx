import { useState, useEffect } from "react";
import { Plus, Search, Edit, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { employeeInfoService } from "../../services/hr/employeeInfoService";
import { EmployeeInfo } from "../../types/hr/employeeInfo";
import { toast } from "react-hot-toast";

export default function EmployeeInfoListPage() {
    const [employees, setEmployees] = useState<EmployeeInfo[]>([]);
    const [search, setSearch] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();

    const fetchEmployees = async () => {
        setIsLoading(true);
        try {
            const data = await employeeInfoService.getAll(search);
            setEmployees(data);
        } catch (error) {
            toast.error("Failed to load employees");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchEmployees();
    }, []);

    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure you want to delete this employee record?")) return;
        try {
            await employeeInfoService.delete(id);
            toast.success("Employee deleted successfully");
            fetchEmployees();
        } catch (error) {
            toast.error("Failed to delete employee");
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Employee Directory</h1>
                    <p className="text-muted-foreground">Manage temporary and permanent employee information records.</p>
                </div>
                <button onClick={() => navigate("/hr/employees/new")} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                    <Plus className="h-4 w-4" /> Add Employee
                </button>
            </div>

            <div className="mb-6 flex gap-2">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Search by name, CNIC, or Employee Number..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && fetchEmployees()}
                        className="w-full pl-10 pr-4 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    />
                </div>
                <button onClick={fetchEmployees} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Search</button>
            </div>

            {isLoading ? (
                <div className="text-center py-10">Loading employees...</div>
            ) : employees.length === 0 ? (
                <div className="text-center py-10 bg-card border rounded-lg text-muted-foreground">
                    No employees found.
                </div>
            ) : (
                <div className="bg-card border rounded-lg overflow-hidden">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-muted/50 text-muted-foreground">
                            <tr>
                                <th className="px-4 py-3 font-medium">Employee No</th>
                                <th className="px-4 py-3 font-medium">Name</th>
                                <th className="px-4 py-3 font-medium">Type</th>
                                <th className="px-4 py-3 font-medium">Designation</th>
                                <th className="px-4 py-3 font-medium">CNIC</th>
                                <th className="px-4 py-3 font-medium text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {employees.map(emp => (
                                <tr key={emp.id} className="hover:bg-muted/30 transition-colors">
                                    <td className="px-4 py-3 font-medium">{emp.employeeNumber || '-'}</td>
                                    <td className="px-4 py-3">{emp.employeeName || '-'}</td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${emp.employmentType === 'Permanent Employee' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'}`}>
                                            {emp.employmentType}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">{emp.designation || '-'}</td>
                                    <td className="px-4 py-3">{emp.employeeCnicNumber || '-'}</td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button className="p-2 hover:bg-gray-100 rounded-full" onClick={() => navigate(`/hr/employees/${emp.id}/edit`)}>
                                                <Edit className="h-4 w-4 text-blue-500" />
                                            </button>
                                            <button className="p-2 hover:bg-red-50 rounded-full" onClick={() => handleDelete(emp.id)}>
                                                <Trash2 className="h-4 w-4 text-red-500" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
