import React, { useEffect, useState } from 'react';
import { getPendingAlerts, acknowledgePopup, SalesMeetingReminderDto } from '../../services/salesMeetingService';
import { format } from 'date-fns';
import { X, Calendar as CalendarIcon, MapPin, Clock } from 'lucide-react';

export const MeetingAlertModal: React.FC = () => {
    const [alerts, setAlerts] = useState<SalesMeetingReminderDto[]>([]);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const fetchAlerts = async () => {
            try {
                const data = await getPendingAlerts();
                if (data && data.length > 0) {
                    setAlerts(data);
                    setIsVisible(true);
                }
            } catch (error) {
                console.error("Failed to fetch pending meeting alerts", error);
            }
        };

        fetchAlerts();

        // Also check every 15 minutes while the app is open
        const interval = setInterval(fetchAlerts, 15 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    const handleAcknowledge = async () => {
        setIsVisible(false);
        for (const alert of alerts) {
            try {
                await acknowledgePopup(alert.id);
            } catch (error) {
                console.error(`Failed to acknowledge alert ${alert.id}`, error);
            }
        }
        setAlerts([]);
    };

    if (!isVisible || alerts.length === 0) return null;

    return (
        <div 
            className="fixed inset-0 bg-blue-900/80 backdrop-blur-sm flex items-center justify-center z-[100] cursor-pointer"
            onClick={handleAcknowledge}
        >
            <div 
                className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full mx-4 relative transform transition-all cursor-default"
                onClick={(e) => e.stopPropagation()}
            >
                <button 
                    onClick={handleAcknowledge}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                >
                    <X size={32} />
                </button>

                <div className="text-center mb-8">
                    <div className="bg-blue-100 text-blue-600 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CalendarIcon size={40} />
                    </div>
                    <h2 className="text-4xl font-bold text-gray-900 mb-2">Upcoming Meetings!</h2>
                    <p className="text-xl text-gray-500">You have {alerts.length} meeting(s) scheduled for tomorrow.</p>
                </div>

                <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2">
                    {alerts.map((alert) => (
                        <div key={alert.id} className="bg-blue-50 border border-blue-100 rounded-xl p-6 flex items-start space-x-4">
                            <div className="bg-white p-3 rounded-lg shadow-sm">
                                <MapPin className="text-blue-500" size={24} />
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold text-gray-900">{alert.siteName}</h3>
                                <div className="flex items-center text-gray-600 mt-2 text-lg">
                                    <Clock size={20} className="mr-2" />
                                    <span>
                                        {format(new Date(alert.meetingDate), 'MMMM dd, yyyy')}
                                        {alert.isTimeIncluded ? ` at ${format(new Date(alert.meetingDate), 'h:mm a')}` : ' (Any time)'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-8 text-center">
                    <button 
                        onClick={handleAcknowledge}
                        className="bg-blue-600 text-white font-semibold text-lg px-8 py-4 rounded-full shadow-lg hover:bg-blue-700 hover:shadow-xl transition-all transform hover:-translate-y-1"
                    >
                        Got it, thanks!
                    </button>
                    <p className="text-gray-400 text-sm mt-4">You can also click anywhere outside to close this.</p>
                </div>
            </div>
        </div>
    );
};
