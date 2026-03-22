import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSync } from '../../contexts/SyncContext';
import { Cloud, CloudOff, RefreshCw, CheckCircle } from 'lucide-react';

const SyncStatusWidget: React.FC = () => {
    const { isOnline, pendingCount, isSyncing, forceSync } = useSync();

    const isIdleOnline = isOnline && pendingCount === 0 && !isSyncing;
    const isPending = isOnline && pendingCount > 0 && !isSyncing;
    
    // We only show the widget heavily when offline, syncing, or pending. 
    // If completely idle and online, we can show a minimalist green dot or hide it.
    // Let's make it a small pill that expands on hover, but always visible if offline/pending.

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end space-y-2 pointer-events-none">
            <AnimatePresence>
                {!isOnline && (
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        className="bg-red-500 text-white px-4 py-3 rounded-xl shadow-lg flex items-center space-x-3 pointer-events-auto"
                    >
                        <CloudOff className="animate-pulse" size={20} />
                        <div>
                            <p className="font-semibold text-sm">You are Offline</p>
                            <p className="text-xs opacity-90">Changes will be saved locally.</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.button
                layout
                onClick={forceSync}
                disabled={!isOnline || isSyncing || (isIdleOnline && pendingCount === 0)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-full shadow-lg font-medium text-sm transition-all pointer-events-auto
                    ${isSyncing ? 'bg-blue-500 text-white cursor-wait' : ''}
                    ${isPending ? 'bg-amber-500 hover:bg-amber-400 text-white cursor-pointer' : ''}
                    ${!isOnline ? 'bg-gray-800 text-gray-300 cursor-not-allowed opacity-50' : ''}
                    ${isIdleOnline ? 'bg-white/80 backdrop-blur text-gray-700 hover:bg-white border border-gray-200 cursor-default' : ''}
                `}
                whileHover={(!isIdleOnline && isOnline && !isSyncing) ? { scale: 1.05 } : {}}
                whileTap={(!isIdleOnline && isOnline && !isSyncing) ? { scale: 0.95 } : {}}
            >
                {isSyncing ? (
                    <RefreshCw size={16} className="animate-spin" />
                ) : !isOnline ? (
                    <CloudOff size={16} />
                ) : pendingCount > 0 ? (
                    <Cloud size={16} />
                ) : (
                    <CheckCircle size={16} className="text-emerald-500" />
                )}

                <span>
                    {isSyncing ? 'Syncing...' : 
                     !isOnline ? `Queued: ${pendingCount}` : 
                     pendingCount > 0 ? `Sync ${pendingCount} items` : 
                     'Up to date'}
                </span>
            </motion.button>
        </div>
    );
};

export default SyncStatusWidget;
