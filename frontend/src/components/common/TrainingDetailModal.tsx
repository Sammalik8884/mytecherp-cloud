import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Plus, Trash2, Loader2, Save } from 'lucide-react';
import { siteService } from '../../services/siteService';
import { trainingDetailService } from '../../services/trainingDetailService';
import { toast } from 'react-hot-toast';

interface TrainingDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
    editId?: number; // Optional ID if editing an entire form
}

export default function TrainingDetailModal({ isOpen, onClose, onSuccess, editId }: TrainingDetailModalProps) {
    const [sites, setSites] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const [formData, setFormData] = useState({
        trainerName: '',
        fromTime: '',
        toTime: '',
        date: new Date().toISOString().split('T')[0],
        location: '',
        trainingType: ''
    });

    const [participants, setParticipants] = useState<any[]>([
        { id: Date.now(), participantName: '', employeeId: '', department: '', designation: '', contactDetails: '', employeeStatus: 'Present', dbId: 0 }
    ]);

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
            const data = await trainingDetailService.getById(id);
            setFormData({
                trainerName: data.trainerName,
                fromTime: data.fromTime,
                toTime: data.toTime,
                date: new Date(data.date).toISOString().split('T')[0],
                location: data.location,
                trainingType: data.trainingType
            });
            if (data.participants && data.participants.length > 0) {
                setParticipants(data.participants.map((p: any) => ({
                    id: Date.now() + Math.random(),
                    participantName: p.participantName,
                    employeeId: p.employeeId,
                    department: p.department,
                    designation: p.designation,
                    contactDetails: p.contactDetails,
                    employeeStatus: p.employeeStatus,
                    dbId: p.id
                })));
            } else {
                setParticipants([{ id: Date.now(), participantName: '', employeeId: '', department: '', designation: '', contactDetails: '', employeeStatus: 'Present', dbId: 0 }]);
            }
        } catch (error) {
            toast.error("Failed to load Training Detail data");
            onClose();
        } finally {
            setIsLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({
            trainerName: '',
            fromTime: '',
            toTime: '',
            date: new Date().toISOString().split('T')[0],
            location: '',
            trainingType: ''
        });
        setParticipants([{ id: Date.now(), participantName: '', employeeId: '', department: '', designation: '', contactDetails: '', employeeStatus: 'Present', dbId: 0 }]);
    };

    const handleAddParticipant = () => {
        setParticipants([...participants, { id: Date.now(), participantName: '', employeeId: '', department: '', designation: '', contactDetails: '', employeeStatus: 'Present', dbId: 0 }]);
    };

    const handleRemoveParticipant = (id: number) => {
        setParticipants(participants.filter(p => p.id !== id));
    };

    const handleParticipantChange = (id: number, field: string, value: string) => {
        setParticipants(participants.map(p => p.id === id ? { ...p, [field]: value } : p));
    };

    const handleSubmit = async () => {
        if (!formData.trainerName) {
            toast.error("Please enter a trainer name");
            return;
        }

        setIsSaving(true);
        try {
            const payload = {
                ...formData,
                participants: participants.map(p => ({
                    id: p.dbId,
                    participantName: p.participantName,
                    employeeId: p.employeeId,
                    department: p.department,
                    designation: p.designation,
                    contactDetails: p.contactDetails,
                    employeeStatus: p.employeeStatus
                }))
            };

            if (editId) {
                await trainingDetailService.update(editId, payload);
                toast.success("Training Detail updated successfully!");
            } else {
                await trainingDetailService.create(payload);
                toast.success("Training Detail created successfully!");
            }
            if (onSuccess) onSuccess();
            onClose();
        } catch (error) {
            toast.error("Failed to save Training Detail");
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="bg-background rounded-xl shadow-2xl w-full max-w-6xl border border-border flex flex-col max-h-[90vh]">
                
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-border bg-muted/30 sticky top-0 z-10">
                    <h2 className="text-2xl font-bold text-foreground">
                        {editId ? 'Edit Training Details' : 'Training Details'}
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
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 bg-muted/20 p-5 rounded-xl border border-border/50">
                                <div>
                                    <label className="font-semibold text-sm block mb-1">Trainer Name:</label>
                                    <input 
                                        type="text" 
                                        value={formData.trainerName}
                                        onChange={(e) => setFormData({...formData, trainerName: e.target.value})}
                                        className="border border-border rounded px-3 py-2 focus:ring-2 focus:ring-primary/20 outline-none w-full bg-card"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="font-semibold text-sm block mb-1">From Time:</label>
                                        <input 
                                            type="time" 
                                            value={formData.fromTime}
                                            onChange={(e) => setFormData({...formData, fromTime: e.target.value})}
                                            className="border border-border rounded px-3 py-2 focus:ring-2 focus:ring-primary/20 outline-none w-full bg-card"
                                        />
                                    </div>
                                    <div>
                                        <label className="font-semibold text-sm block mb-1">To Time:</label>
                                        <input 
                                            type="time" 
                                            value={formData.toTime}
                                            onChange={(e) => setFormData({...formData, toTime: e.target.value})}
                                            className="border border-border rounded px-3 py-2 focus:ring-2 focus:ring-primary/20 outline-none w-full bg-card"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="font-semibold text-sm block mb-1">Date:</label>
                                    <input 
                                        type="date" 
                                        value={formData.date}
                                        onChange={(e) => setFormData({...formData, date: e.target.value})}
                                        className="border border-border rounded px-3 py-2 focus:ring-2 focus:ring-primary/20 outline-none w-full bg-card"
                                    />
                                </div>
                                <div>
                                    <label className="font-semibold text-sm block mb-1">Location:</label>
                                    <input 
                                        list="site-locations"
                                        value={formData.location}
                                        onChange={(e) => setFormData({...formData, location: e.target.value})}
                                        placeholder="Select or enter location"
                                        className="border border-border rounded px-3 py-2 focus:ring-2 focus:ring-primary/20 outline-none w-full bg-card"
                                    />
                                    <datalist id="site-locations">
                                        {sites.map(site => (
                                            <option key={site.id} value={site.name} />
                                        ))}
                                    </datalist>
                                </div>
                                <div>
                                    <label className="font-semibold text-sm block mb-1">Training Type:</label>
                                    <select 
                                        value={formData.trainingType}
                                        onChange={(e) => setFormData({...formData, trainingType: e.target.value})}
                                        className="border border-border rounded px-3 py-2 focus:ring-2 focus:ring-primary/20 outline-none w-full bg-card"
                                    >
                                        <option value="">Select Training Type</option>
                                        <option value="Safety">Safety</option>
                                        <option value="Technical">Technical</option>
                                        <option value="Compliance">Compliance</option>
                                        <option value="Induction">Induction</option>
                                    </select>
                                </div>
                            </div>

                            {/* Participant Information */}
                            <div>
                                <h3 className="text-xl font-bold mb-4 bg-muted/50 inline-block px-4 py-2 rounded-lg text-primary">Participant Information</h3>
                                <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm text-left whitespace-nowrap">
                                            <thead className="bg-muted text-muted-foreground border-b border-border">
                                                <tr>
                                                    <th className="px-3 py-3 font-semibold text-center w-12">S#</th>
                                                    <th className="px-3 py-3 font-semibold">Participant Name</th>
                                                    <th className="px-3 py-3 font-semibold w-32">Employee Id</th>
                                                    <th className="px-3 py-3 font-semibold w-32">Department</th>
                                                    <th className="px-3 py-3 font-semibold w-40">Designation</th>
                                                    <th className="px-3 py-3 font-semibold w-40">Contact Details</th>
                                                    <th className="px-3 py-3 font-semibold w-32">Employee Status</th>
                                                    <th className="px-3 py-3 font-semibold w-12 text-center"></th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-border">
                                                {participants.map((p, index) => (
                                                    <tr key={p.id} className="hover:bg-muted/10">
                                                        <td className="px-3 py-3 text-center text-muted-foreground">{index + 1}:</td>
                                                        <td className="px-3 py-3">
                                                            <input 
                                                                type="text" 
                                                                value={p.participantName}
                                                                onChange={(e) => handleParticipantChange(p.id, 'participantName', e.target.value)}
                                                                className="w-full border border-border rounded px-2 py-1.5 focus:ring-2 focus:ring-primary/20 outline-none bg-background"
                                                            />
                                                        </td>
                                                        <td className="px-3 py-3">
                                                            <input 
                                                                type="text" 
                                                                value={p.employeeId}
                                                                onChange={(e) => handleParticipantChange(p.id, 'employeeId', e.target.value)}
                                                                className="w-full border border-border rounded px-2 py-1.5 focus:ring-2 focus:ring-primary/20 outline-none bg-background"
                                                            />
                                                        </td>
                                                        <td className="px-3 py-3">
                                                            <input 
                                                                type="text" 
                                                                value={p.department}
                                                                onChange={(e) => handleParticipantChange(p.id, 'department', e.target.value)}
                                                                className="w-full border border-border rounded px-2 py-1.5 focus:ring-2 focus:ring-primary/20 outline-none bg-background"
                                                            />
                                                        </td>
                                                        <td className="px-3 py-3">
                                                            <input 
                                                                type="text" 
                                                                value={p.designation}
                                                                onChange={(e) => handleParticipantChange(p.id, 'designation', e.target.value)}
                                                                className="w-full border border-border rounded px-2 py-1.5 focus:ring-2 focus:ring-primary/20 outline-none bg-background"
                                                            />
                                                        </td>
                                                        <td className="px-3 py-3">
                                                            <input 
                                                                type="text" 
                                                                value={p.contactDetails}
                                                                onChange={(e) => handleParticipantChange(p.id, 'contactDetails', e.target.value)}
                                                                className="w-full border border-border rounded px-2 py-1.5 focus:ring-2 focus:ring-primary/20 outline-none bg-background"
                                                            />
                                                        </td>
                                                        <td className="px-3 py-3">
                                                            <select 
                                                                value={p.employeeStatus}
                                                                onChange={(e) => handleParticipantChange(p.id, 'employeeStatus', e.target.value)}
                                                                className="w-full border border-border rounded px-2 py-1.5 focus:ring-2 focus:ring-primary/20 outline-none bg-background"
                                                            >
                                                                <option value="Present">Present</option>
                                                                <option value="Absent">Absent</option>
                                                                <option value="Excused">Excused</option>
                                                            </select>
                                                        </td>
                                                        <td className="px-3 py-3 text-center">
                                                            <button 
                                                                onClick={() => handleRemoveParticipant(p.id)}
                                                                className="text-red-500 hover:text-red-600 hover:bg-red-50 p-1.5 rounded transition-colors"
                                                                title="Remove Participant"
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
                                            onClick={handleAddParticipant}
                                            className="flex items-center gap-1 text-sm font-medium text-primary hover:text-primary/80 transition-colors bg-primary/10 px-4 py-1.5 rounded-md"
                                        >
                                            <Plus className="h-4 w-4" /> Add Row
                                        </button>
                                    </div>
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
        </div>,
        document.body
    );
}
