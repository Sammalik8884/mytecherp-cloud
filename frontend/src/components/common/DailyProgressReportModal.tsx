import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Trash2, Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";
import { dprService } from "../../services/dprService";
import { siteService } from "../../services/siteService";
import { SiteDto } from "../../types/site";

export const DailyProgressReportModal = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [sites, setSites] = useState<SiteDto[]>([]);
    
    // Form fields
    const [siteId, setSiteId] = useState<number | "">("");
    const [date, setDate] = useState(new Date().toISOString().slice(0, 16));
    const [siteInCharge, setSiteInCharge] = useState("");
    const [siteOpeningTime, setSiteOpeningTime] = useState("");
    const [siteClosingTime, setSiteClosingTime] = useState("");
    const [totalWorkers, setTotalWorkers] = useState<number | "">("");
    const [nextDayActivityPlan, setNextDayActivityPlan] = useState("");

    // Dynamic Collections
    const [activities, setActivities] = useState<string[]>([]);
    const [employees, setEmployees] = useState([{ employeeName: "", inTime: "", outTime: "", overTime: "" }]);
    const [materials, setMaterials] = useState([{ item: "", quantity: "", remarks: "" }]);
    
    // Files
    const [files, setFiles] = useState<File[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const handleOpen = () => {
            setIsOpen(true);
            loadSites();
            resetForm();
        };
        window.addEventListener("OPEN_DPR_MODAL", handleOpen);
        return () => window.removeEventListener("OPEN_DPR_MODAL", handleOpen);
    }, []);

    const resetForm = () => {
        setSiteId("");
        setDate(new Date().toISOString().slice(0, 16));
        setSiteInCharge("");
        setSiteOpeningTime("");
        setSiteClosingTime("");
        setTotalWorkers("");
        setNextDayActivityPlan("");
        setActivities([]);
        setEmployees([]);
        setMaterials([]);
        setFiles([]);
    };

    const loadSites = async () => {
        try {
            const data = await siteService.getAll();
            setSites(data);
        } catch (error) {
            console.error("Failed to load sites", error);
        }
    };

    // Auto-generate rows based on number input
    const handleActivityCountChange = (count: number) => {
        const newActivities = [...activities];
        if (count > activities.length) {
            for (let i = activities.length; i < count; i++) newActivities.push("");
        } else if (count < activities.length && count >= 0) {
            newActivities.length = count;
        }
        setActivities(newActivities);
    };

    const handleEmployeeCountChange = (count: number) => {
        const newEmployees = [...employees];
        if (count > employees.length) {
            for (let i = employees.length; i < count; i++) {
                newEmployees.push({ employeeName: "", inTime: "", outTime: "", overTime: "" });
            }
        } else if (count < employees.length && count >= 0) {
            newEmployees.length = count;
        }
        setEmployees(newEmployees);
    };

    const handleMaterialCountChange = (count: number) => {
        const newMaterials = [...materials];
        if (count > materials.length) {
            for (let i = materials.length; i < count; i++) {
                newMaterials.push({ item: "", quantity: "", remarks: "" });
            }
        } else if (count < materials.length && count >= 0) {
            newMaterials.length = count;
        }
        setMaterials(newMaterials);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!siteId) {
            toast.error("Please select a Project Name.");
            return;
        }

        setIsSubmitting(true);
        try {
            const formData = new FormData();
            formData.append('SiteId', siteId.toString());
            formData.append('Date', date);
            formData.append('SiteInCharge', siteInCharge);
            formData.append('SiteOpeningTime', siteOpeningTime);
            formData.append('SiteClosingTime', siteClosingTime);
            formData.append('TotalWorkers', (totalWorkers || 0).toString());
            formData.append('NextDayActivityPlan', nextDayActivityPlan);

            activities.forEach((act, i) => {
                if (act.trim() !== '') formData.append(`Activities[${i}]`, act);
            });

            employees.filter(emp => emp.employeeName.trim() !== '').forEach((emp, i) => {
                formData.append(`Employees[${i}].EmployeeName`, emp.employeeName);
                formData.append(`Employees[${i}].InTime`, emp.inTime);
                formData.append(`Employees[${i}].OutTime`, emp.outTime);
                formData.append(`Employees[${i}].OverTime`, emp.overTime);
            });

            materials.filter(mat => mat.item.trim() !== '').forEach((mat, i) => {
                formData.append(`Materials[${i}].Item`, mat.item);
                formData.append(`Materials[${i}].Quantity`, mat.quantity);
                formData.append(`Materials[${i}].Remarks`, mat.remarks);
            });

            files.forEach(f => {
                formData.append('Files', f);
            });

            await dprService.create(formData);
            toast.success("Daily Progress Report saved successfully!");
            setIsOpen(false);
            window.dispatchEvent(new CustomEvent('REFRESH_DPR_LIST'));
        } catch (error: any) {
            toast.error(error?.response?.data?.message || "Failed to save Daily Progress Report");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
            <div className="bg-card w-full max-w-6xl rounded-xl shadow-2xl border border-border flex flex-col max-h-[95vh]">
                <div className="flex items-center justify-between p-6 border-b border-border bg-slate-200/50 dark:bg-slate-800/50">
                    <div className="flex-1 text-center relative">
                        <h2 className="text-2xl font-bold inline-block bg-slate-300/50 dark:bg-slate-700/50 text-slate-800 dark:text-slate-100 px-6 py-2 rounded-lg shadow-sm">Daily Site Progress Report</h2>
                        <button onClick={() => setIsOpen(false)} className="absolute right-0 top-1/2 -translate-y-1/2 text-muted-foreground hover:bg-secondary p-2 rounded-full">
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                </div>

                <div className="p-6 overflow-y-auto flex-1 space-y-8">
                    <form id="dpr-form" onSubmit={handleSubmit}>
                        {/* Top Section */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                            <div>
                                <label className="block text-sm font-medium mb-1">Project Name :</label>
                                <select value={siteId} onChange={(e) => setSiteId(Number(e.target.value))} required className="w-full rounded border border-input px-3 py-2 text-sm focus:outline-none focus:border-primary">
                                    <option value="">-- Select --</option>
                                    {sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Site In-charge :</label>
                                <input type="text" value={siteInCharge} onChange={e => setSiteInCharge(e.target.value)} className="w-full rounded border border-input px-3 py-2 text-sm focus:outline-none focus:border-primary" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Total workers :</label>
                                <input type="number" value={totalWorkers} onChange={e => setTotalWorkers(Number(e.target.value) || "")} className="w-full rounded border border-input px-3 py-2 text-sm focus:outline-none focus:border-primary" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Total Activity :</label>
                                <input type="number" value={activities.length || ""} onChange={e => handleActivityCountChange(parseInt(e.target.value) || 0)} className="w-full rounded border border-blue-400 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Date :</label>
                                <input type="datetime-local" value={date} onChange={e => setDate(e.target.value)} className="w-full rounded border border-input px-3 py-2 text-sm bg-muted/30 focus:outline-none focus:border-primary" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Site Opening Time :</label>
                                <input type="time" value={siteOpeningTime} onChange={e => setSiteOpeningTime(e.target.value)} className="w-full rounded border border-input px-3 py-2 text-sm focus:outline-none focus:border-primary" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Site Closing Time :</label>
                                <input type="time" value={siteClosingTime} onChange={e => setSiteClosingTime(e.target.value)} className="w-full rounded border border-input px-3 py-2 text-sm focus:outline-none focus:border-primary" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">File :</label>
                                <input type="file" multiple onChange={e => { if(e.target.files) setFiles(Array.from(e.target.files)) }} className="w-full text-sm file:mr-4 file:py-1.5 file:px-3 file:rounded file:border file:border-border file:bg-background file:text-foreground file:cursor-pointer hover:file:bg-muted" />
                            </div>
                        </div>

                        {/* Activities Table */}
                        <div className="border border-border mb-6">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-secondary/30 border-b border-border">
                                    <tr>
                                        <th className="px-4 py-2 w-16 text-center border-r border-border">No.</th>
                                        <th className="px-4 py-2 text-center">Activity done on Site</th>
                                        <th className="px-4 py-2 w-16"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {activities.map((act, idx) => (
                                        <tr key={idx} className="border-b border-border last:border-b-0">
                                            <td className="px-4 py-2 text-center border-r border-border">{idx + 1}:</td>
                                            <td className="px-4 py-2">
                                                <input type="text" value={act} onChange={e => { const newA = [...activities]; newA[idx] = e.target.value; setActivities(newA); }} className="w-full border border-input rounded px-2 py-1 focus:outline-none focus:border-primary" />
                                            </td>
                                            <td className="px-2 py-2 text-center">
                                                <button type="button" onClick={() => setActivities(activities.filter((_, i) => i !== idx))} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="mb-12">
                            <label className="block text-sm font-medium mb-1">Next Day Activity Plan :</label>
                            <input type="text" value={nextDayActivityPlan} onChange={e => setNextDayActivityPlan(e.target.value)} className="w-full rounded border border-input px-3 py-2 focus:outline-none focus:border-primary" />
                        </div>

                        {/* Employees Section */}
                        <div className="mb-12">
                            <div className="flex justify-between items-center mb-4">
                                <div className="text-center flex-1">
                                    <h3 className="inline-block bg-slate-200/50 px-6 py-2 rounded-lg font-medium">Add Employee In-Out Time</h3>
                                </div>
                                <div className="w-48 text-right">
                                    <label className="block text-sm font-medium mb-1">Total Employee :</label>
                                    <input type="number" value={employees.length || ""} onChange={e => handleEmployeeCountChange(parseInt(e.target.value) || 0)} className="w-full rounded border border-input px-3 py-2 text-sm focus:outline-none focus:border-primary" />
                                </div>
                            </div>
                            <div className="border border-border">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-secondary/30 border-b border-border">
                                        <tr>
                                            <th className="px-4 py-2 w-16 border-r border-border">No.</th>
                                            <th className="px-4 py-2 text-center border-r border-border">Employee Name</th>
                                            <th className="px-4 py-2 text-center border-r border-border">In Time</th>
                                            <th className="px-4 py-2 text-center border-r border-border">Out Time</th>
                                            <th className="px-4 py-2 text-center">Over-time</th>
                                            <th className="px-2 py-2 w-12"></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {employees.map((emp, idx) => (
                                            <tr key={idx} className="border-b border-border last:border-b-0">
                                                <td className="px-4 py-2 text-center border-r border-border">{idx + 1}:</td>
                                                <td className="px-2 py-2 border-r border-border"><input type="text" value={emp.employeeName} onChange={e => { const newE = [...employees]; newE[idx].employeeName = e.target.value; setEmployees(newE); }} className="w-full border border-input rounded px-2 py-1" /></td>
                                                <td className="px-2 py-2 border-r border-border"><input type="time" value={emp.inTime} onChange={e => { const newE = [...employees]; newE[idx].inTime = e.target.value; setEmployees(newE); }} className="w-full border border-input rounded px-2 py-1" /></td>
                                                <td className="px-2 py-2 border-r border-border"><input type="time" value={emp.outTime} onChange={e => { const newE = [...employees]; newE[idx].outTime = e.target.value; setEmployees(newE); }} className="w-full border border-input rounded px-2 py-1" /></td>
                                                <td className="px-2 py-2"><input type="text" value={emp.overTime} onChange={e => { const newE = [...employees]; newE[idx].overTime = e.target.value; setEmployees(newE); }} className="w-full border border-input rounded px-2 py-1" /></td>
                                                <td className="px-2 py-2 text-center"><button type="button" onClick={() => setEmployees(employees.filter((_, i) => i !== idx))} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <div className="mt-2 text-right">
                                <button type="button" onClick={() => handleEmployeeCountChange(employees.length + 1)} className="text-sm bg-secondary px-3 py-1 rounded hover:bg-secondary/80">+ Add Row</button>
                            </div>
                        </div>

                        {/* Materials Section */}
                        <div>
                            <div className="flex justify-between items-center mb-4">
                                <div className="text-center flex-1">
                                    <h3 className="inline-block bg-slate-200/50 px-6 py-2 rounded-lg font-medium">Material Required Next Activity</h3>
                                </div>
                                <div className="w-48 text-right">
                                    <label className="block text-sm font-medium mb-1">Total Items :</label>
                                    <input type="number" value={materials.length || ""} onChange={e => handleMaterialCountChange(parseInt(e.target.value) || 0)} className="w-full rounded border border-input px-3 py-2 text-sm focus:outline-none focus:border-primary" />
                                </div>
                            </div>
                            <div className="border border-border">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-secondary/30 border-b border-border">
                                        <tr>
                                            <th className="px-4 py-2 w-16 border-r border-border">No.</th>
                                            <th className="px-4 py-2 text-center border-r border-border">Item</th>
                                            <th className="px-4 py-2 text-center border-r border-border">Quantity</th>
                                            <th className="px-4 py-2 text-center">Remarks</th>
                                            <th className="px-2 py-2 w-12"></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {materials.map((mat, idx) => (
                                            <tr key={idx} className="border-b border-border last:border-b-0">
                                                <td className="px-4 py-2 text-center border-r border-border">{idx + 1}:</td>
                                                <td className="px-2 py-2 border-r border-border"><input type="text" value={mat.item} onChange={e => { const newM = [...materials]; newM[idx].item = e.target.value; setMaterials(newM); }} className="w-full border border-input rounded px-2 py-1" /></td>
                                                <td className="px-2 py-2 border-r border-border"><input type="text" value={mat.quantity} onChange={e => { const newM = [...materials]; newM[idx].quantity = e.target.value; setMaterials(newM); }} className="w-full border border-input rounded px-2 py-1" /></td>
                                                <td className="px-2 py-2"><input type="text" value={mat.remarks} onChange={e => { const newM = [...materials]; newM[idx].remarks = e.target.value; setMaterials(newM); }} className="w-full border border-input rounded px-2 py-1" /></td>
                                                <td className="px-2 py-2 text-center"><button type="button" onClick={() => setMaterials(materials.filter((_, i) => i !== idx))} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                             <div className="mt-2 text-right">
                                <button type="button" onClick={() => handleMaterialCountChange(materials.length + 1)} className="text-sm bg-secondary px-3 py-1 rounded hover:bg-secondary/80">+ Add Row</button>
                            </div>
                        </div>

                    </form>
                </div>

                <div className="p-6 border-t border-border flex justify-end space-x-3 bg-secondary/10">
                    <button type="submit" form="dpr-form" disabled={isSubmitting || !siteId} className="px-8 py-2.5 bg-green-500 text-white font-medium rounded hover:bg-green-600 transition-colors flex items-center space-x-2">
                        {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                        <span>Submit</span>
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};
