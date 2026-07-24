import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { enUS } from 'date-fns/locale/en-US';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { getMeetings, createMeeting, updateMeeting, deleteMeeting, SalesMeetingReminderDto } from '../services/salesMeetingService';
import toast from 'react-hot-toast';

const locales = {
  'en-US': enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

export const SalesmanCalendarPage: React.FC = () => {
    const [events, setEvents] = useState<any[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [siteName, setSiteName] = useState('');
    const [timeStr, setTimeStr] = useState('');
    const [selectedEvent, setSelectedEvent] = useState<any>(null);
    const [editingMeetingId, setEditingMeetingId] = useState<number | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    const fetchMeetings = async () => {
        try {
            const data = await getMeetings();
            const formattedEvents = data.map((m: SalesMeetingReminderDto) => {
                const start = new Date(m.meetingDate);
                // Assume 1 hour meeting for display
                const end = new Date(start.getTime() + 60 * 60 * 1000);
                
                return {
                    id: m.id,
                    title: `${m.salesmanName} - ${m.siteName}`,
                    start: start,
                    end: end,
                    allDay: !m.isTimeIncluded,
                };
            });
            setEvents(formattedEvents);
        } catch (error) {
            toast.error("Failed to load meetings");
        }
    };

    useEffect(() => {
        fetchMeetings();
    }, []);

    const handleSelectSlot = ({ start }: { start: Date }) => {
        setSelectedDate(start);
        setSiteName('');
        setTimeStr('');
        setEditingMeetingId(null);
        setIsModalOpen(true);
    };

    const handleSelectEvent = (event: any) => {
        setSelectedEvent(event);
    };

    const handleSaveMeeting = async () => {
        if (!siteName) {
            toast.error("Site name is required");
            return;
        }

        if (!selectedDate) return;

        setIsSaving(true);
        let finalDate = new Date(selectedDate);
        let isTimeIncluded = false;

        if (timeStr) {
            const [hours, minutes] = timeStr.split(':');
            finalDate.setHours(parseInt(hours, 10));
            finalDate.setMinutes(parseInt(minutes, 10));
            isTimeIncluded = true;
        }

        try {
            if (editingMeetingId) {
                await updateMeeting(editingMeetingId, {
                    siteName,
                    meetingDate: finalDate.toISOString(),
                    isTimeIncluded
                });
                toast.success("Meeting updated successfully");
            } else {
                await createMeeting({
                    siteName,
                    meetingDate: finalDate.toISOString(),
                    isTimeIncluded
                });
                toast.success("Meeting scheduled successfully");
            }
            setIsModalOpen(false);
            setEditingMeetingId(null);
            fetchMeetings();
        } catch (error) {
            toast.error("Failed to save meeting");
        } finally {
            setIsSaving(false);
        }
    };

    const handleEditEvent = () => {
        if (!selectedEvent) return;
        setEditingMeetingId(selectedEvent.id);
        setSelectedDate(selectedEvent.start);
        const originalName = selectedEvent.title.split(' - ').slice(1).join(' - ');
        setSiteName(originalName || selectedEvent.title);
        if (!selectedEvent.allDay) {
            setTimeStr(format(selectedEvent.start, 'HH:mm'));
        } else {
            setTimeStr('');
        }
        setSelectedEvent(null);
        setIsModalOpen(true);
    };

    const handleDeleteEvent = async () => {
        if (!selectedEvent) return;
        if (window.confirm("Are you sure you want to delete this meeting?")) {
            try {
                await deleteMeeting(selectedEvent.id);
                toast.success("Meeting deleted");
                setSelectedEvent(null);
                fetchMeetings();
            } catch (error) {
                toast.error("Failed to delete meeting");
            }
        }
    };

    return (
        <div className="p-4 sm:p-6 h-full flex flex-col bg-white">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                <h1 className="text-xl sm:text-2xl font-bold">Salesman Calendar</h1>
                <button
                    onClick={() => {
                        setSelectedDate(new Date());
                        setSiteName('');
                        setTimeStr('');
                        setEditingMeetingId(null);
                        setIsModalOpen(true);
                    }}
                    className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-semibold shadow-sm"
                >
                    + Schedule Meeting
                </button>
            </div>
            <div className="flex-1 mt-2 border border-gray-200 rounded-lg overflow-x-auto shadow-sm bg-white">
                <div style={{ minWidth: '700px', height: '700px' }}>
                    <Calendar
                        localizer={localizer}
                        events={events}
                        startAccessor="start"
                        endAccessor="end"
                        style={{ height: '100%' }}
                        selectable
                        onSelectSlot={handleSelectSlot}
                        onSelectEvent={handleSelectEvent}
                        views={['month', 'week', 'day']}
                        defaultView="month"
                    />
                </div>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h2 className="text-xl font-semibold mb-4">Schedule Meeting</h2>
                        
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                            <input 
                                type="date" 
                                className="w-full border rounded p-2" 
                                value={selectedDate ? format(selectedDate, 'yyyy-MM-dd') : ''} 
                                onChange={(e) => {
                                    if (e.target.value) {
                                        setSelectedDate(new Date(e.target.value));
                                    }
                                }}
                            />
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Time (Optional)</label>
                            <input 
                                type="time" 
                                className="w-full border rounded p-2" 
                                value={timeStr} 
                                onChange={(e) => setTimeStr(e.target.value)} 
                            />
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Site Name *</label>
                            <input 
                                type="text" 
                                className="w-full border rounded p-2" 
                                placeholder="Enter site name"
                                value={siteName} 
                                onChange={(e) => setSiteName(e.target.value)} 
                            />
                        </div>

                        <div className="flex justify-end space-x-2 mt-6">
                            <button 
                                className="px-4 py-2 border rounded text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                                onClick={() => setIsModalOpen(false)}
                                disabled={isSaving}
                            >
                                Cancel
                            </button>
                            <button 
                                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                                onClick={handleSaveMeeting}
                                disabled={isSaving}
                            >
                                {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                                Save Meeting
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {selectedEvent && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
                        <h2 className="text-xl font-semibold mb-4 text-primary border-b pb-2">Meeting Details</h2>
                        
                        <div className="space-y-3">
                            <div>
                                <span className="text-sm text-gray-500 block">Title</span>
                                <span className="font-medium">{selectedEvent.title}</span>
                            </div>
                            <div>
                                <span className="text-sm text-gray-500 block">Date</span>
                                <span className="font-medium">{format(selectedEvent.start, 'PPP')}</span>
                            </div>
                            {!selectedEvent.allDay && (
                                <div>
                                    <span className="text-sm text-gray-500 block">Time</span>
                                    <span className="font-medium">{format(selectedEvent.start, 'p')}</span>
                                </div>
                            )}
                        </div>

                        <div className="mt-6 flex justify-between">
                            <div className="space-x-2">
                                <button
                                    onClick={handleEditEvent}
                                    className="px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded font-semibold transition-colors"
                                >
                                    Edit
                                </button>
                                <button
                                    onClick={handleDeleteEvent}
                                    className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-800 rounded font-semibold transition-colors"
                                >
                                    Delete
                                </button>
                            </div>
                            <button
                                onClick={() => setSelectedEvent(null)}
                                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded font-semibold transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
