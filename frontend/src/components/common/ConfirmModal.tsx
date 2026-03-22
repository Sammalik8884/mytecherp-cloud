import React from 'react';
import { AlertTriangle, Info, X } from 'lucide-react';

interface ConfirmModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    type?: 'danger' | 'warning' | 'info';
    onConfirm: () => void;
    onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
    isOpen,
    title,
    message,
    confirmText = "Confirm",
    cancelText = "Cancel",
    type = 'info',
    onConfirm,
    onCancel
}) => {
    if (!isOpen) return null;

    const icons = {
        danger: <AlertTriangle className="h-6 w-6 text-destructive" />,
        warning: <AlertTriangle className="h-6 w-6 text-yellow-500" />,
        info: <Info className="h-6 w-6 text-primary" />
    };

    const confirmColors = {
        danger: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        warning: "bg-yellow-500 text-white hover:bg-yellow-600",
        info: "bg-primary text-primary-foreground hover:bg-primary/90"
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-card w-full max-w-md rounded-2xl shadow-xl border border-border overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-6">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                            <div className={`p-2 rounded-full ${type === 'danger' ? 'bg-destructive/10' : type === 'warning' ? 'bg-yellow-500/10' : 'bg-primary/10'}`}>
                                {icons[type]}
                            </div>
                            <h2 className="text-xl font-bold text-foreground">{title}</h2>
                        </div>
                        <button onClick={onCancel} className="text-muted-foreground hover:text-foreground transition-colors p-1">
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                    <div className="mt-4 text-muted-foreground">
                        {message}
                    </div>
                </div>
                <div className="p-4 bg-secondary/50 border-t border-border flex justify-end space-x-3">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${confirmColors[type]}`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};
