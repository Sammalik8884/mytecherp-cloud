import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X } from 'lucide-react';

interface PromptModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    placeholder?: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: (val: string) => void;
    onCancel: () => void;
}

export const PromptModal: React.FC<PromptModalProps> = ({
    isOpen,
    title,
    message,
    placeholder = "Type here...",
    confirmText = "Submit",
    cancelText = "Cancel",
    onConfirm,
    onCancel
}) => {
    const [inputValue, setInputValue] = useState("");
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            setInputValue("");
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onConfirm(inputValue);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-card w-full max-w-md rounded-2xl shadow-xl border border-border overflow-hidden animate-in zoom-in-95 duration-200">
                <form onSubmit={handleSubmit}>
                    <div className="p-6">
                        <div className="flex items-start justify-between">
                            <div className="flex items-center space-x-3">
                                <div className="p-2 rounded-full bg-primary/10">
                                    <MessageSquare className="h-6 w-6 text-primary" />
                                </div>
                                <h2 className="text-xl font-bold text-foreground">{title}</h2>
                            </div>
                            <button type="button" onClick={onCancel} className="text-muted-foreground hover:text-foreground transition-colors p-1">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <div className="mt-4 text-muted-foreground mb-4">
                            {message}
                        </div>
                        <input
                            ref={inputRef}
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            placeholder={placeholder}
                            required
                            className="w-full bg-background border border-border rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-primary"
                        />
                    </div>
                    <div className="p-4 bg-secondary/50 border-t border-border flex justify-end space-x-3">
                        <button
                            type="button"
                            onClick={onCancel}
                            className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors"
                        >
                            {cancelText}
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg transition-colors"
                        >
                            {confirmText}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
