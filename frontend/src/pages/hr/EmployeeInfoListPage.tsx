import { useState, useEffect } from "react";
import { Plus, Search, Edit, Trash2, X, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { employeeInfoService } from "../../services/hr/employeeInfoService";
import { EmployeeInfo } from "../../types/hr/employeeInfo";
import { toast } from "react-hot-toast";

export default function EmployeeInfoListPage() {
    const [employees, setEmployees] = useState<EmployeeInfo[]>([]);
    const [search, setSearch] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [filterType, setFilterType] = useState<"All" | "Permanent Employee" | "Temporary Employee">("All");
    const [statusFilter, setStatusFilter] = useState<"All" | "Active" | "Inactive">("Active");
    const [selectedEmployee, setSelectedEmployee] = useState<EmployeeInfo | null>(null);
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

    const filteredEmployees = employees.filter(emp => {
        let matchesType = filterType === "All" || emp.employmentType === filterType;
        let matchesStatus = true;
        if (statusFilter === "Active") matchesStatus = emp.isActive;
        if (statusFilter === "Inactive") matchesStatus = !emp.isActive;
        return matchesType && matchesStatus;
    });

    const EmployeeModal = () => {
        if (!selectedEmployee) return null;
        
        const InfoRow = ({ label, value }: { label: string, value?: string }) => (
            <div className="flex flex-col mb-3">
                <span className="text-xs font-semibold text-gray-500 uppercase">{label}</span>
                <span className="text-sm">{value || '-'}</span>
            </div>
        );

        return (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                <div className="bg-white dark:bg-gray-900 rounded-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl relative">
                    <div className="sticky top-0 bg-white dark:bg-gray-900 border-b p-4 flex justify-between items-center z-10">
                        <h2 className="text-xl font-bold">Employee Information</h2>
                        <button onClick={() => setSelectedEmployee(null)} className="p-2 hover:bg-gray-100 rounded-full">
                            <X size={20} />
                        </button>
                    </div>
                    <div className="p-6">
                        <div className="mb-6 flex items-center gap-3 border-b pb-4">
                            <div className="h-16 w-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xl font-bold">
                                {selectedEmployee.employeeName?.charAt(0) || '?'}
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold">{selectedEmployee.employeeName || 'Unknown'}</h3>
                                <p className="text-gray-500">{selectedEmployee.designation || 'No Designation'}</p>
                                <span className={`inline-block mt-1 px-2 py-0.5 rounded text-xs font-medium ${selectedEmployee.employmentType === 'Permanent Employee' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
                                    {selectedEmployee.employmentType}
                                </span>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <h4 className="font-bold text-blue-600 border-b pb-1 mb-3">Personal Details</h4>
                                <div className="grid grid-cols-2 gap-2">
                                    <InfoRow label="Employee No" value={selectedEmployee.employeeNumber} />
                                    <InfoRow label="CNIC" value={selectedEmployee.employeeCnicNumber} />
                                    <InfoRow label="Father/Husband" value={selectedEmployee.fatherHusbandName} />
                                    <InfoRow label="Gender" value={selectedEmployee.gender} />
                                    <InfoRow label="Date of Birth" value={selectedEmployee.dateOfBirth} />
                                    <InfoRow label="Place of Birth" value={selectedEmployee.placeOfBirth} />
                                </div>
                            </div>
                            
                            <div>
                                <h4 className="font-bold text-blue-600 border-b pb-1 mb-3">Contact & Bank</h4>
                                <div className="grid grid-cols-2 gap-2">
                                    <InfoRow label="Mobile" value={selectedEmployee.mobileNumber} />
                                    <InfoRow label="Email" value={selectedEmployee.emailAddress} />
                                    <InfoRow label="Office Phone" value={selectedEmployee.officePhoneNo} />
                                    <InfoRow label="Gross Salary" value={selectedEmployee.grossSalary} />
                                    <InfoRow label="Branch Code" value={selectedEmployee.accountBranchCode} />
                                </div>
                            </div>
                            
                            <div className="md:col-span-2">
                                <h4 className="font-bold text-blue-600 border-b pb-1 mb-3">Address Information</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    <InfoRow label="Present Address" value={selectedEmployee.presentAddress} />
                                    <InfoRow label="Permanent Address" value={selectedEmployee.permanentAddress} />
                                    <InfoRow label="Mailing Address" value={selectedEmployee.mailingAddress} />
                                </div>
                            </div>

                            <div className="md:col-span-2">
                                <h4 className="font-bold text-blue-600 border-b pb-1 mb-3">Next of KIN</h4>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                    <InfoRow label="Name" value={selectedEmployee.kinFullName} />
                                    <InfoRow label="Relationship" value={selectedEmployee.kinRelationship} />
                                    <InfoRow label="CNIC" value={selectedEmployee.kinCnicNumber} />
                                    <InfoRow label="Mobile" value={selectedEmployee.kinMobileNumber} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <EmployeeModal />
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Employee Directory</h1>
                    <p className="text-muted-foreground">Manage temporary and permanent employee information records.</p>
                </div>
                <button onClick={() => navigate("/hr/employees/new")} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                    <Plus className="h-4 w-4" /> Add Employee
                </button>
            </div>

            <div className="mb-6 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                <div className="flex gap-2">
                    <div className="relative w-full max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Search by name, CNIC..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && fetchEmployees()}
                            className="w-[300px] pl-10 pr-4 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                        />
                    </div>
                    <button onClick={fetchEmployees} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Search</button>
                </div>

                <div className="flex gap-4">
                    <div className="flex bg-gray-100 p-1 rounded-md">
                        {(["All", "Permanent Employee", "Temporary Employee"] as const).map(type => (
                            <button
                                key={type}
                                onClick={() => setFilterType(type)}
                                className={`px-4 py-1.5 text-sm font-medium rounded ${filterType === type ? 'bg-white shadow text-blue-600' : 'text-gray-600 hover:text-gray-900'}`}
                            >
                                {type === "All" ? "All" : type.split(" ")[0]}
                            </button>
                        ))}
                    </div>
                    <div className="flex bg-gray-100 p-1 rounded-md">
                        {(["All", "Active", "Inactive"] as const).map(status => (
                            <button
                                key={status}
                                onClick={() => setStatusFilter(status)}
                                className={`px-4 py-1.5 text-sm font-medium rounded ${statusFilter === status ? 'bg-white shadow text-blue-600' : 'text-gray-600 hover:text-gray-900'}`}
                            >
                                {status}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {isLoading ? (
                <div className="text-center py-10">Loading employees...</div>
            ) : filteredEmployees.length === 0 ? (
                <div className="text-center py-10 bg-card border rounded-lg text-muted-foreground">
                    No employees found.
                </div>
            ) : (
                <div className="bg-card border rounded-lg overflow-hidden">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-muted/50 text-muted-foreground border-b">
                            <tr>
                                <th className="px-4 py-3 font-medium">Employee No</th>
                                <th className="px-4 py-3 font-medium">Name</th>
                                <th className="px-4 py-3 font-medium">Type</th>
                                <th className="px-4 py-3 font-medium">Status</th>
                                <th className="px-4 py-3 font-medium">Designation</th>
                                <th className="px-4 py-3 font-medium">CNIC</th>
                                <th className="px-4 py-3 font-medium text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {filteredEmployees.map(emp => (
                                <tr key={emp.id} className="hover:bg-muted/30 transition-colors cursor-pointer group" onClick={() => setSelectedEmployee(emp)}>
                                    <td className="px-4 py-3 font-medium">{emp.employeeNumber || '-'}</td>
                                    <td className="px-4 py-3 font-medium text-blue-600 group-hover:underline">{emp.employeeName || '-'}</td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${emp.employmentType === 'Permanent Employee' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
                                            {emp.employmentType}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${emp.isActive ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'}`}>
                                            {emp.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">{emp.designation || '-'}</td>
                                    <td className="px-4 py-3">{emp.employeeCnicNumber || '-'}</td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="flex justify-end gap-2" onClick={e => e.stopPropagation()}>
                                            <button className="p-2 hover:bg-blue-50 rounded-full" onClick={() => setSelectedEmployee(emp)} title="View Info">
                                                <Eye className="h-4 w-4 text-blue-500" />
                                            </button>
                                            <button className="p-2 hover:bg-gray-100 rounded-full" onClick={() => navigate(`/hr/employees/${emp.id}/edit`)} title="Edit Info">
                                                <Edit className="h-4 w-4 text-gray-500" />
                                            </button>
                                            <button className="p-2 hover:bg-red-50 rounded-full" onClick={() => handleDelete(emp.id)} title="Delete Record">
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
