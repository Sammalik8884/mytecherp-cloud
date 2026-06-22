import { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { employeeInfoService } from "../../services/hr/employeeInfoService";
import { CreateEmployeeInfo } from "../../types/hr/employeeInfo";
import { toast } from "react-hot-toast";
import { ArrowLeft, UserCheck, UserPlus, Save, List } from "lucide-react";
import { useAuth } from "../../auth/AuthContext";

export default function EmployeeInfoFormPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { hasRole } = useAuth();
    const isEditing = !!id;

    const [isLoading, setIsLoading] = useState(isEditing);
    const [isSaving, setIsSaving] = useState(false);
    const isSiteSupervisorOnly = hasRole(["Site Supervisor"]) && !hasRole(["Admin", "Manager", "Accounts Head"]);
    
    // Form State
    const [formData, setFormData] = useState<CreateEmployeeInfo>({
        employmentType: "",
        employeeNumber: "", employeeName: "", mailingAddress: "", mothersMaidenName: "",
        grossSalary: "", designation: "", accountBranchCode: "", officePhoneNo: "",
        mobileNetwork: "", mobileNumber: "", placeOfBirth: "", emailAddress: "",
        employeeCnicNumber: "", fatherHusbandName: "", gender: "", dateOfBirth: "",
        dateOfIssue: "", expiryDate: "", presentAddress: "", paDistrictCity: "",
        permanentAddress: "", kinFullName: "", kinCnicNumber: "", kinRelationship: "",
        kinMobileNumber: ""
    });

    useEffect(() => {
        if (isEditing && id) {
            employeeInfoService.getById(Number(id)).then(data => {
                setFormData(data as unknown as CreateEmployeeInfo);
                setIsLoading(false);
            }).catch(() => {
                toast.error("Failed to load employee data");
                navigate("/hr/employees");
            });
        }
    }, [id, isEditing, navigate]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            if (isEditing && id) {
                await employeeInfoService.update(Number(id), formData);
                toast.success("Employee record updated!");
            } else {
                await employeeInfoService.create(formData);
                toast.success("Employee record created!");
            }
            if (isSiteSupervisorOnly) {
                navigate("/dashboard");
            } else {
                navigate("/hr/employees");
            }
        } catch (error) {
            toast.error("Failed to save record.");
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) return <div className="p-10 text-center">Loading...</div>;

    // Step 1: Ask for Employment Type if not selected
    if (!formData.employmentType) {
        return (
            <div className="p-6 max-w-4xl mx-auto min-h-[70vh] flex flex-col items-center justify-center">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold tracking-tight mb-3">Employee Information Form</h1>
                    <p className="text-muted-foreground text-lg">Please select the employment type to proceed with data collection.</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl">
                    <button 
                        onClick={() => setFormData({ ...formData, employmentType: "Temporary Employee" })}
                        className="flex flex-col items-center justify-center p-10 bg-card border-2 border-dashed border-border rounded-xl hover:border-primary hover:bg-primary/5 transition-all group"
                    >
                        <div className="h-16 w-16 bg-amber-100 dark:bg-amber-900/30 text-amber-600 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <UserCheck size={32} />
                        </div>
                        <h2 className="text-xl font-bold">Temporary Employee</h2>
                        <p className="text-sm text-muted-foreground mt-2 text-center">For contract or temporary staff</p>
                    </button>

                    <button 
                        onClick={() => setFormData({ ...formData, employmentType: "Permanent Employee" })}
                        className="flex flex-col items-center justify-center p-10 bg-card border-2 border-dashed border-border rounded-xl hover:border-primary hover:bg-primary/5 transition-all group"
                    >
                        <div className="h-16 w-16 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <UserPlus size={32} />
                        </div>
                        <h2 className="text-xl font-bold">Permanent Employee</h2>
                        <p className="text-sm text-muted-foreground mt-2 text-center">For full-time regular staff</p>
                    </button>
                </div>

                {!isSiteSupervisorOnly && (
                    <div className="mt-12 text-center">
                        <Link to="/hr/employees" className="text-primary hover:underline flex items-center justify-center gap-2">
                            <List size={16} /> View Employee Details / Directory
                        </Link>
                    </div>
                )}
            </div>
        );
    }

    // Input renderer helper
    const renderInput = (label: string, name: keyof CreateEmployeeInfo, type = "text", options?: string[]) => (
        <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground">{label}</label>
            {options ? (
                <select 
                    name={name} value={(formData[name] as string) || ""} onChange={handleInputChange}
                    className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-primary/50"
                >
                    <option value="">-- Select --</option>
                    {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
            ) : (
                <input 
                    type={type} name={name} value={(formData[name] as string) || ""} onChange={handleInputChange}
                    className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-primary/50"
                />
            )}
        </div>
    );

    return (
        <div className="p-6 max-w-5xl mx-auto pb-20">
            <div className="flex items-center gap-4 mb-6">
                <button className="p-2 border rounded-md hover:bg-gray-100" onClick={() => {
                    if (isEditing) navigate("/hr/employees");
                    else setFormData({ ...formData, employmentType: "" }); // Go back to selection
                }}>
                    <ArrowLeft className="h-4 w-4" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">{isEditing ? "Edit" : "New"} Employee Info</h1>
                    <p className="text-muted-foreground">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium mr-2 ${formData.employmentType === 'Permanent Employee' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
                            {formData.employmentType}
                        </span>
                        Please fill in the details below.
                    </p>
                </div>
                <div className="ml-auto">
                    <button onClick={handleSave} disabled={isSaving} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50">
                        <Save size={16} /> {isSaving ? "Saving..." : "Save Record"}
                    </button>
                </div>
            </div>

            <div className="space-y-8 bg-card border rounded-xl p-6">
                {/* 1. Employee Details */}
                <section>
                    <h2 className="text-lg font-semibold border-b pb-2 mb-4 text-blue-600">1. Employee Details</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {renderInput("Employee Number", "employeeNumber")}
                        {renderInput("Employee Name (As per CNIC)", "employeeName")}
                        {renderInput("Designation", "designation")}
                        {renderInput("Gross Salary", "grossSalary")}
                        {renderInput("Mother's Maiden Name", "mothersMaidenName")}
                        {renderInput("Place of Birth", "placeOfBirth")}
                        {renderInput("Email Address", "emailAddress", "email")}
                        {renderInput("Office Phone No", "officePhoneNo")}
                        {renderInput("Mobile Network", "mobileNetwork", "text", ["Mobilink", "Telenor", "Ufone", "Zong"])}
                        {renderInput("Mobile Number", "mobileNumber")}
                        <div className="md:col-span-2">{renderInput("Mailing Address", "mailingAddress")}</div>
                        {renderInput("Account Branch Code", "accountBranchCode")}
                    </div>
                </section>

                {/* 2. CNIC Details */}
                <section>
                    <h2 className="text-lg font-semibold border-b pb-2 mb-4 text-blue-600">2. CNIC Details</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {renderInput("Employee CNIC Number", "employeeCnicNumber")}
                        {renderInput("Father / Husband Name", "fatherHusbandName")}
                        {renderInput("Gender", "gender", "text", ["Male", "Female", "Other"])}
                        {renderInput("Date of Birth", "dateOfBirth", "date")}
                        {renderInput("Date of Issue", "dateOfIssue", "date")}
                        {renderInput("Expiry Date", "expiryDate", "date")}
                        <div className="md:col-span-2">{renderInput("Present Address", "presentAddress")}</div>
                        {renderInput("PA District City", "paDistrictCity")}
                        <div className="md:col-span-3">{renderInput("Permanent Address", "permanentAddress")}</div>
                    </div>
                </section>

                {/* 3. Next of KIN */}
                <section>
                    <h2 className="text-lg font-semibold border-b pb-2 mb-4 text-blue-600">3. Next of KIN</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {renderInput("Full Name", "kinFullName")}
                        {renderInput("CNIC Number", "kinCnicNumber")}
                        {renderInput("Relationship", "kinRelationship")}
                        {renderInput("Mobile Number", "kinMobileNumber")}
                    </div>
                </section>
            </div>

            <div className="mt-8 flex justify-between items-center border-t pt-6">
                <Link to="/hr/employees" className="text-blue-600 hover:underline flex items-center gap-2">
                    <List size={16} /> Go to Employee Details List
                </Link>
                <button onClick={handleSave} disabled={isSaving} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50">
                    {isSaving ? "Saving..." : "Save Record"}
                </button>
            </div>
        </div>
    );
}
