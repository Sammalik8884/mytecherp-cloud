import React, { useState, useEffect } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { enUS } from 'date-fns/locale/en-US';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { getMeetings, createMeeting, SalesMeetingReminderDto } from '../services/salesMeetingService';
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
        setIsModalOpen(true);
    };

    const handleSaveMeeting = async () => {
        if (!siteName) {
            toast.error("Site name is required");
            return;
        }

        if (!selectedDate) return;

        let finalDate = new Date(selectedDate);
        let isTimeIncluded = false;

        if (timeStr) {
            const [hours, minutes] = timeStr.split(':');
            finalDate.setHours(parseInt(hours, 10));
            finalDate.setMinutes(parseInt(minutes, 10));
            isTimeIncluded = true;
        }

        try {
            await createMeeting({
                siteName,
                meetingDate: finalDate.toISOString(),
                isTimeIncluded
            });
            toast.success("Meeting scheduled successfully");
            setIsModalOpen(false);
            fetchMeetings();
        } catch (error) {
            toast.error("Failed to schedule meeting");
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
                                className="px-4 py-2 border rounded text-gray-600 hover:bg-gray-50"
                                onClick={() => setIsModalOpen(false)}
                            >
                                Cancel
                            </button>
                            <button 
                                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                                onClick={handleSaveMeeting}
                            >
                                Save Meeting
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
