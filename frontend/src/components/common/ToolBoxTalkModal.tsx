import { useState, useEffect } from 'react';
import { X, Plus, Trash2, Loader2, Save } from 'lucide-react';
import { siteService } from '../../services/siteService';
import { toolBoxTalkService } from '../../services/toolBoxTalkService';
import { toast } from 'react-hot-toast';

const tbtTopics = [
    "Safe Handling of Fire Extinguishers",
    "Proper Use of PPE",
    "Cylinder Storage and Handling",
    "Hot Work Safety",
    "Daily Tool Inspections",
    "Manual Lifting Techniques",
    "Emergency Evacuation Plan",
    "Lockout/Tagout (LOTO)",
    "Fall Protection Awareness",
    "Noise Hazards on Site",
    "Working Near Live Circuits",
    "Electrical Shock Prevention",
    "Preventing Slips, Trips, and Falls",
    "Ladder Safety",
    "Scaffold Safety",
    "Struck-By Hazard Awareness",
    "Fire Alarm Testing Precautions",
    "Chemical Safety Basics",
    "Compressed Gas Safety"
];

interface ToolBoxTalkModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
    editId?: number; // Optional ID if editing an entire form
}

export default function ToolBoxTalkModal({ isOpen, onClose, onSuccess, editId }: ToolBoxTalkModalProps) {
    const [sites, setSites] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const [formData, setFormData] = useState({
        documentNo: '',
        formNo: '',
        date: new Date().toISOString().split('T')[0],
        time: '',
        siteId: 0,
        tbtPerformedBy: '',
        subject: '',
        jobSupervisorName: '',
        qehsName: '',
        projectManagerName: ''
    });

    const [attendees, setAttendees] = useState<any[]>([
        { id: Date.now(), employeeName: '', status: 'Present', dbId: 0 }
    ]);
    const [selectedTopics, setSelectedTopics] = useState<string[]>([]);

    useEffect(() => {
        if (isOpen) {
            fetchSites();
            if (editId) {
                fetchExistingData(editId);
            } else {
                resetForm();
            }
        }
    }, [isOpen, editId]);

    const fetchSites = async () => {
        try {
            const data = await siteService.getAll();
            setSites(data);
        } catch (error) {
            console.error("Failed to load sites", error);
        }
    };

    const fetchExistingData = async (id: number) => {
        setIsLoading(true);
        try {
            const data = await toolBoxTalkService.getById(id);
            setFormData({
                documentNo: data.documentNo,
                formNo: data.formNo,
                date: new Date(data.date).toISOString().split('T')[0],
                time: data.time,
                siteId: data.siteId,
                tbtPerformedBy: data.tbtPerformedBy,
                subject: data.subject,
                jobSupervisorName: data.jobSupervisorName,
                qehsName: data.qehsName,
                projectManagerName: data.projectManagerName
            });
            setSelectedTopics(JSON.parse(data.selectedTopics || "[]"));
            if (data.attendees && data.attendees.length > 0) {
                setAttendees(data.attendees.map(a => ({
                    id: Date.now() + Math.random(),
                    employeeName: a.employeeName,
                    status: a.status,
                    dbId: a.id
                })));
            }
        } catch (error) {
            toast.error("Failed to load Tool Box Talk data");
            onClose();
        } finally {
            setIsLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({
            documentNo: '',
            formNo: '',
            date: new Date().toISOString().split('T')[0],
            time: '',
            siteId: 0,
            tbtPerformedBy: '',
            subject: '',
            jobSupervisorName: '',
            qehsName: '',
            projectManagerName: ''
        });
        setAttendees([{ id: Date.now(), employeeName: '', status: 'Present', dbId: 0 }]);
        setSelectedTopics([]);
    };

    const handleAddAttendee = () => {
        setAttendees([...attendees, { id: Date.now(), employeeName: '', status: 'Present', dbId: 0 }]);
    };

    const handleRemoveAttendee = (id: number) => {
        setAttendees(attendees.filter(a => a.id !== id));
    };

    const handleAttendeeChange = (id: number, field: string, value: string) => {
        setAttendees(attendees.map(a => a.id === id ? { ...a, [field]: value } : a));
    };

    const handleTopicToggle = (topic: string) => {
        if (selectedTopics.includes(topic)) {
            setSelectedTopics(selectedTopics.filter(t => t !== topic));
        } else {
            setSelectedTopics([...selectedTopics, topic]);
        }
    };

    const handleSubmit = async () => {
        if (!formData.siteId) {
            toast.error("Please select a site");
            return;
        }

        setIsSaving(true);
        try {
            const payload = {
                ...formData,
                selectedTopics: JSON.stringify(selectedTopics),
                attendees: attendees.map(a => ({
                    id: a.dbId,
                    employeeName: a.employeeName,
                    status: a.status
                }))
            };

            if (editId) {
                await toolBoxTalkService.update(editId, payload);
                toast.success("Tool Box Talk updated successfully!");
            } else {
                await toolBoxTalkService.create(payload);
                toast.success("Tool Box Talk created successfully!");
            }
            if (onSuccess) onSuccess();
            onClose();
        } catch (error) {
            toast.error("Failed to save Tool Box Talk");
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="bg-background rounded-xl shadow-2xl w-full max-w-5xl border border-border flex flex-col max-h-[90vh]">
                
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-border bg-muted/30 sticky top-0 z-10">
                    <h2 className="text-2xl font-bold text-foreground">
                        {editId ? 'Edit Tool Box Talk' : 'Tool Box Talk'}
                    </h2>
                    <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors p-2 hover:bg-muted rounded-full">
                        <X className="h-6 w-6" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto space-y-8 flex-1">
                    {isLoading ? (
                        <div className="flex justify-center items-center py-20">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : (
                        <>
                            {/* Top Info */}
                            <div className="flex flex-wrap gap-6 items-center">
                                <div className="flex items-center gap-2">
                                    <label className="font-semibold text-sm">Document No:</label>
                                    <input 
                                        type="text" 
                                        value={formData.documentNo}
                                        onChange={(e) => setFormData({...formData, documentNo: e.target.value})}
                                        className="border border-border rounded px-3 py-1.5 focus:ring-2 focus:ring-primary/20 outline-none w-48 bg-card"
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    <label className="font-semibold text-sm">Form No:</label>
                                    <input 
                                        type="text" 
                                        value={formData.formNo}
                                        onChange={(e) => setFormData({...formData, formNo: e.target.value})}
                                        className="border border-border rounded px-3 py-1.5 focus:ring-2 focus:ring-primary/20 outline-none w-48 bg-card"
                                    />
                                </div>
                            </div>

                            {/* Middle Info */}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 bg-muted/20 p-4 rounded-lg border border-border/50">
                                <div className="flex items-center gap-2">
                                    <label className="font-semibold text-sm whitespace-nowrap">Date:</label>
                                    <input 
                                        type="date" 
                                        value={formData.date}
                                        onChange={(e) => setFormData({...formData, date: e.target.value})}
                                        className="border border-border rounded px-3 py-1.5 focus:ring-2 focus:ring-primary/20 outline-none w-full bg-card"
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    <label className="font-semibold text-sm whitespace-nowrap">Time:</label>
                                    <input 
                                        type="time" 
                                        value={formData.time}
                                        onChange={(e) => setFormData({...formData, time: e.target.value})}
                                        className="border border-border rounded px-3 py-1.5 focus:ring-2 focus:ring-primary/20 outline-none w-full bg-card"
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    <label className="font-semibold text-sm whitespace-nowrap">Site Location:</label>
                                    <select 
                                        value={formData.siteId}
                                        onChange={(e) => setFormData({...formData, siteId: Number(e.target.value)})}
                                        className="border border-border rounded px-3 py-1.5 focus:ring-2 focus:ring-primary/20 outline-none w-full bg-card"
                                    >
                                        <option value={0}>Select Site</option>
                                        {sites.map(site => (
                                            <option key={site.id} value={site.id}>{site.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="flex items-center gap-2">
                                    <label className="font-semibold text-sm whitespace-nowrap">TBT Performed by:</label>
                                    <input 
                                        type="text" 
                                        value={formData.tbtPerformedBy}
                                        onChange={(e) => setFormData({...formData, tbtPerformedBy: e.target.value})}
                                        className="border border-border rounded px-3 py-1.5 focus:ring-2 focus:ring-primary/20 outline-none w-full bg-card"
                                    />
                                </div>
                            </div>

                            {/* Dynamic Attendees Table */}
                            <div className="bg-card rounded-lg border border-border overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-muted text-muted-foreground border-b border-border">
                                            <tr>
                                                <th className="px-4 py-3 font-semibold text-center w-16">No.</th>
                                                <th className="px-4 py-3 font-semibold">Name</th>
                                                <th className="px-4 py-3 font-semibold w-48">Status</th>
                                                <th className="px-4 py-3 font-semibold w-16 text-center">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border">
                                            {attendees.map((attendee, index) => (
                                                <tr key={attendee.id} className="hover:bg-muted/10">
                                                    <td className="px-4 py-3 text-center">{index + 1}</td>
                                                    <td className="px-4 py-3">
                                                        <input 
                                                            type="text" 
                                                            placeholder="Employee Name"
                                                            value={attendee.employeeName}
                                                            onChange={(e) => handleAttendeeChange(attendee.id, 'employeeName', e.target.value)}
                                                            className="w-full border border-border rounded px-3 py-1.5 focus:ring-2 focus:ring-primary/20 outline-none bg-background"
                                                        />
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <select 
                                                            value={attendee.status}
                                                            onChange={(e) => handleAttendeeChange(attendee.id, 'status', e.target.value)}
                                                            className="w-full border border-border rounded px-3 py-1.5 focus:ring-2 focus:ring-primary/20 outline-none bg-background"
                                                        >
                                                            <option value="Present">Present</option>
                                                            <option value="Absent">Absent</option>
                                                        </select>
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        <button 
                                                            onClick={() => handleRemoveAttendee(attendee.id)}
                                                            className="text-red-500 hover:text-red-600 hover:bg-red-50 p-1.5 rounded transition-colors"
                                                            title="Remove Attendee"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                <div className="p-3 bg-muted/10 border-t border-border flex justify-end">
                                    <button 
                                        onClick={handleAddAttendee}
                                        className="flex items-center gap-1 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                                    >
                                        <Plus className="h-4 w-4" /> Add Row
                                    </button>
                                </div>
                            </div>

                            {/* Subject & Names */}
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold mb-2">Subject of Tool-box Talk / Details of Discussions:</label>
                                    <textarea 
                                        rows={3}
                                        value={formData.subject}
                                        onChange={(e) => setFormData({...formData, subject: e.target.value})}
                                        className="w-full border border-border rounded-lg p-3 focus:ring-2 focus:ring-primary/20 outline-none bg-card resize-y"
                                    />
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="bg-muted/20 p-4 rounded-lg border border-border text-center">
                                        <div className="font-semibold mb-3 bg-muted py-1 rounded">Job Supervisor</div>
                                        <div className="text-left">
                                            <label className="text-xs font-semibold text-muted-foreground block mb-1">Name</label>
                                            <input 
                                                type="text" 
                                                value={formData.jobSupervisorName}
                                                onChange={(e) => setFormData({...formData, jobSupervisorName: e.target.value})}
                                                className="w-full border border-border rounded px-3 py-2 focus:ring-2 focus:ring-primary/20 outline-none bg-card"
                                            />
                                        </div>
                                    </div>
                                    <div className="bg-muted/20 p-4 rounded-lg border border-border text-center">
                                        <div className="font-semibold mb-3 bg-muted py-1 rounded">QEHS</div>
                                        <div className="text-left">
                                            <label className="text-xs font-semibold text-muted-foreground block mb-1">Name</label>
                                            <input 
                                                type="text" 
                                                value={formData.qehsName}
                                                onChange={(e) => setFormData({...formData, qehsName: e.target.value})}
                                                className="w-full border border-border rounded px-3 py-2 focus:ring-2 focus:ring-primary/20 outline-none bg-card"
                                            />
                                        </div>
                                    </div>
                                    <div className="bg-muted/20 p-4 rounded-lg border border-border text-center">
                                        <div className="font-semibold mb-3 bg-muted py-1 rounded">Project Manager</div>
                                        <div className="text-left">
                                            <label className="text-xs font-semibold text-muted-foreground block mb-1">Name</label>
                                            <input 
                                                type="text" 
                                                value={formData.projectManagerName}
                                                onChange={(e) => setFormData({...formData, projectManagerName: e.target.value})}
                                                className="w-full border border-border rounded px-3 py-2 focus:ring-2 focus:ring-primary/20 outline-none bg-card"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Checkboxes Grid */}
                            <div className="bg-muted/10 p-5 rounded-lg border border-border">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-3 gap-x-8">
                                    {tbtTopics.map(topic => (
                                        <label key={topic} className="flex items-center gap-3 cursor-pointer group">
                                            <div className="relative flex items-center justify-center">
                                                <input 
                                                    type="checkbox" 
                                                    checked={selectedTopics.includes(topic)}
                                                    onChange={() => handleTopicToggle(topic)}
                                                    className="w-5 h-5 rounded border-border text-primary focus:ring-primary/30 transition-all cursor-pointer"
                                                />
                                            </div>
                                            <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">{topic}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-border bg-muted/30 flex justify-end gap-3 sticky bottom-0 z-10 rounded-b-xl">
                    <button 
                        onClick={onClose}
                        className="px-6 py-2 border border-border text-foreground rounded-lg hover:bg-muted transition-colors font-medium"
                        disabled={isSaving}
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={handleSubmit}
                        disabled={isSaving}
                        className="px-6 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors font-medium flex items-center shadow-sm disabled:opacity-70"
                    >
                        {isSaving ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Save className="h-5 w-5 mr-2" />}
                        Submit
                    </button>
                </div>
            </div>
        </div>
    );
}
