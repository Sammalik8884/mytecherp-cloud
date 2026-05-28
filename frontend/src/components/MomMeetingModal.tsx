import React, { useState } from 'react';
import { MomMeetingDto, MomAttendeeDto } from '../services/momMeetingService';
import { X, Plus } from 'lucide-react';

interface MomMeetingModalProps {
    show: boolean;
    onHide: () => void;
    onSubmit: (data: any) => void;
    meeting?: MomMeetingDto | null;
    isViewOnly?: boolean;
}

const MEETING_TYPES = ['general', 'technical', 'financial', 'progress review', 'emergency', 'safety'];
const EMPLOYEE_STATUSES = ['present', 'absent', 'excused'];

const MomMeetingModal: React.FC<MomMeetingModalProps> = ({ show, onHide, onSubmit, meeting, isViewOnly }) => {
    const [meetingTitle, setMeetingTitle] = useState(meeting?.meetingTitle || '');
    const [meetingDate, setMeetingDate] = useState(meeting?.meetingDate ? meeting.meetingDate.substring(0, 10) : '');
    const [timeFrom, setTimeFrom] = useState(meeting?.timeFrom || '');
    const [timeTo, setTimeTo] = useState(meeting?.timeTo || '');
    const [location, setLocation] = useState(meeting?.location || '');
    const [organizer, setOrganizer] = useState(meeting?.organizer || '');
    const [meetingType, setMeetingType] = useState(meeting?.meetingType || '');

    const [agenda, setAgenda] = useState(meeting?.agenda || '');
    const [discussionPoints, setDiscussionPoints] = useState(meeting?.discussionPoints || '');
    const [decisionsMade, setDecisionsMade] = useState(meeting?.decisionsMade || '');
    const [actionItems, setActionItems] = useState(meeting?.actionItems || '');
    const [closingNotes, setClosingNotes] = useState(meeting?.closingNotes || '');

    const [attendees, setAttendees] = useState<MomAttendeeDto[]>(meeting?.attendees && meeting.attendees.length > 0 ? meeting.attendees : [
        { employeeIdStr: '', employeeName: '', employeeStatus: '' }
    ]);
    const [files, setFiles] = useState<File[]>([]);

    if (!show) return null;

    const handleAddAttendeeRow = () => {
        setAttendees([...attendees, { employeeIdStr: '', employeeName: '', employeeStatus: '' }]);
    };

    const handleAttendeeChange = (index: number, field: keyof MomAttendeeDto, value: string) => {
        const newAttendees = [...attendees];
        newAttendees[index] = { ...newAttendees[index], [field]: value };
        setAttendees(newAttendees);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setFiles(Array.from(e.target.files));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit({
            meetingTitle,
            meetingDate,
            timeFrom,
            timeTo,
            location,
            organizer,
            meetingType,
            agenda,
            discussionPoints,
            decisionsMade,
            actionItems,
            closingNotes,
            attendeesJson: JSON.stringify(attendees.filter(a => a.employeeName.trim() !== '')),
            files
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 overflow-y-auto pt-20 pb-10">
            <div className="bg-slate-100 rounded-lg shadow-xl w-full max-w-5xl overflow-hidden relative mt-10">
                <div className="flex justify-between items-center p-6 bg-white border-b border-gray-200">
                    <h2 className="text-xl font-bold">{isViewOnly ? 'View Minutes of Meeting' : 'Minutes of Meeting Details'}</h2>
                    <button onClick={onHide} className="text-gray-500 hover:text-gray-700">
                        <X className="h-6 w-6" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto max-h-[80vh]">
                    <form id="momForm" onSubmit={handleSubmit} className="space-y-6">
                        
                        {/* MEETING DETAILS */}
                        <div className="bg-slate-200/50 p-6 rounded-lg">
                            <h3 className="bg-slate-300 text-slate-800 px-4 py-2 rounded-md font-semibold inline-block mb-4">Meeting Details</h3>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                <div>
                                    <label className="block text-sm font-semibold mb-1">Meeting Title</label>
                                    <input type="text" className="w-full border border-gray-300 rounded-md p-2" value={meetingTitle} onChange={(e: any) => setMeetingTitle(e.target.value)} readOnly={isViewOnly} required />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold mb-1">Date</label>
                                    <input type="date" className="w-full border border-gray-300 rounded-md p-2" value={meetingDate} onChange={(e: any) => setMeetingDate(e.target.value)} readOnly={isViewOnly} required />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold mb-1">Time</label>
                                    <div className="flex gap-2 items-center">
                                        <div className="w-1/2">
                                            <span className="text-xs text-gray-500 block">From</span>
                                            <input type="time" className="w-full border border-gray-300 rounded-md p-2" value={timeFrom} onChange={(e: any) => setTimeFrom(e.target.value)} readOnly={isViewOnly} required />
                                        </div>
                                        <div className="w-1/2">
                                            <span className="text-xs text-gray-500 block">To</span>
                                            <input type="time" className="w-full border border-gray-300 rounded-md p-2" value={timeTo} onChange={(e: any) => setTimeTo(e.target.value)} readOnly={isViewOnly} required />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold mb-1">Location</label>
                                    <input type="text" className="w-full border border-gray-300 rounded-md p-2" value={location} onChange={(e: any) => setLocation(e.target.value)} readOnly={isViewOnly} required />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold mb-1">Organizer</label>
                                    <input type="text" className="w-full border border-gray-300 rounded-md p-2" value={organizer} onChange={(e: any) => setOrganizer(e.target.value)} readOnly={isViewOnly} required />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold mb-1">Meeting Type</label>
                                    <select className="w-full border border-gray-300 rounded-md p-2" value={meetingType} onChange={(e: any) => setMeetingType(e.target.value)} disabled={isViewOnly} required>
                                        <option value="">Open this select menu</option>
                                        {MEETING_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* ATTENDEE INFORMATION */}
                        <div className="bg-slate-200/50 p-6 rounded-lg">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="bg-slate-300 text-slate-800 px-4 py-2 rounded-md font-semibold inline-block">Attendee Information</h3>
                            </div>
                            
                            <table className="w-full bg-white border border-gray-300 text-sm text-left">
                                <thead className="bg-gray-100 border-b border-gray-300">
                                    <tr>
                                        <th className="p-2 border-r border-gray-300 w-16 text-center">S#</th>
                                        <th className="p-2 border-r border-gray-300">Employee Id</th>
                                        <th className="p-2 border-r border-gray-300">Employee Name</th>
                                        <th className="p-2">Employee Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {attendees.map((attendee, index) => (
                                        <tr key={index} className="border-b border-gray-200 last:border-b-0">
                                            <td className="p-2 border-r border-gray-300 text-center">{index + 1}:</td>
                                            <td className="p-2 border-r border-gray-300">
                                                <input type="text" className="w-full border border-gray-300 rounded px-2 py-1" value={attendee.employeeIdStr} onChange={(e: any) => handleAttendeeChange(index, 'employeeIdStr', e.target.value)} readOnly={isViewOnly} />
                                            </td>
                                            <td className="p-2 border-r border-gray-300">
                                                <input type="text" className="w-full border border-gray-300 rounded px-2 py-1" value={attendee.employeeName} onChange={(e: any) => handleAttendeeChange(index, 'employeeName', e.target.value)} readOnly={isViewOnly} />
                                            </td>
                                            <td className="p-2">
                                                <select className="w-full border border-gray-300 rounded px-2 py-1" value={attendee.employeeStatus} onChange={(e: any) => handleAttendeeChange(index, 'employeeStatus', e.target.value)} disabled={isViewOnly}>
                                                    <option value="">Open this select menu</option>
                                                    {EMPLOYEE_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                                                </select>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {!isViewOnly && (
                                <button type="button" onClick={handleAddAttendeeRow} className="mt-4 text-primary font-medium hover:underline flex items-center text-sm">
                                    <Plus className="h-4 w-4 mr-1" /> Add Row
                                </button>
                            )}
                        </div>

                        {/* OTHER DETAILS */}
                        <div className="bg-slate-200/50 p-6 rounded-lg space-y-4">
                            <div>
                                <label className="block text-sm font-bold mb-1">Agenda</label>
                                <textarea className="w-full border border-gray-300 rounded-md p-2" rows={2} value={agenda} onChange={(e: any) => setAgenda(e.target.value)} readOnly={isViewOnly}></textarea>
                            </div>
                            <div>
                                <label className="block text-sm font-bold mb-1">Discussion Points</label>
                                <textarea className="w-full border border-gray-300 rounded-md p-2" rows={3} value={discussionPoints} onChange={(e: any) => setDiscussionPoints(e.target.value)} readOnly={isViewOnly}></textarea>
                            </div>
                            <div>
                                <label className="block text-sm font-bold mb-1">Decisions Made</label>
                                <textarea className="w-full border border-gray-300 rounded-md p-2" rows={2} value={decisionsMade} onChange={(e: any) => setDecisionsMade(e.target.value)} readOnly={isViewOnly}></textarea>
                            </div>
                            <div>
                                <label className="block text-sm font-bold mb-1">Action Items</label>
                                <textarea className="w-full border border-gray-300 rounded-md p-2" rows={2} value={actionItems} onChange={(e: any) => setActionItems(e.target.value)} readOnly={isViewOnly}></textarea>
                            </div>
                            <div>
                                <label className="block text-sm font-bold mb-1">Closing Notes</label>
                                <textarea className="w-full border border-gray-300 rounded-md p-2" rows={2} value={closingNotes} onChange={(e: any) => setClosingNotes(e.target.value)} readOnly={isViewOnly}></textarea>
                            </div>

                            {!isViewOnly && (
                                <div>
                                    <label className="block text-sm font-bold mb-1">Attachments</label>
                                    <input type="file" multiple onChange={handleFileChange} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary/90" />
                                </div>
                            )}

                            {isViewOnly && meeting?.attachments && meeting.attachments.length > 0 && (
                                <div>
                                    <p className="block text-sm font-bold mb-2">Attachments:</p>
                                    <ul className="space-y-2">
                                        {meeting.attachments.map((att: any) => (
                                            <li key={att.id} className="flex gap-2 items-center">
                                                <a href={att.fileUrl} target="_blank" rel="noopener noreferrer" className="px-3 py-1 bg-gray-200 text-gray-800 text-sm rounded hover:bg-gray-300 transition-colors">View</a>
                                                <a href={att.downloadUrl} className="text-primary hover:underline text-sm">{att.fileName}</a>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>

                    </form>
                </div>
                
                <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
                    <button type="button" onClick={onHide} className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50">
                        Close
                    </button>
                    {!isViewOnly && (
                        <button type="submit" form="momForm" className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 font-medium">
                            Submit
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MomMeetingModal;
