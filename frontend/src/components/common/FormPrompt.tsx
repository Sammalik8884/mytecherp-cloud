import React, { useEffect } from 'react';
import { useBlocker } from 'react-router-dom';

interface FormPromptProps {
    isDirty: boolean;
}

export const FormPrompt: React.FC<FormPromptProps> = ({ isDirty }) => {
    // Block navigation within React Router
    const blocker = useBlocker(
        ({ currentLocation, nextLocation }) =>
            isDirty && currentLocation.pathname !== nextLocation.pathname
    );

    // Block native browser navigation (refresh/close)
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (isDirty) {
                e.preventDefault();
                e.returnValue = ''; // Required for Chrome
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [isDirty]);

    if (blocker.state === 'blocked') {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                <div className="bg-background rounded-xl p-6 shadow-2xl max-w-sm w-full border border-border animate-in fade-in zoom-in duration-200">
                    <h3 className="text-xl font-bold text-foreground mb-2">Unsaved Changes</h3>
                    <p className="text-muted-foreground mb-6">
                        You have unsaved changes. Are you sure you want to leave this page? Your data will be lost.
                    </p>
                    <div className="flex justify-end gap-3">
                        <button
                            onClick={() => blocker.reset()}
                            className="px-4 py-2 rounded-lg text-sm font-medium border border-border hover:bg-secondary/80 transition-colors"
                        >
                            Stay on Page
                        </button>
                        <button
                            onClick={() => blocker.proceed()}
                            className="px-4 py-2 rounded-lg text-sm font-medium bg-red-600 text-white hover:bg-red-700 transition-colors"
                        >
                            Leave Page
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return null;
};
