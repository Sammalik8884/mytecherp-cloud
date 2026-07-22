import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown } from 'lucide-react';

export interface SearchableObjectSelectProps {
    options: { label: string; value: string | number }[];
    value: string | number;
    onChange: (value: string | number) => void;
    placeholder?: string;
    disabled?: boolean;
    className?: string;
}

export const SearchableObjectSelect: React.FC<SearchableObjectSelectProps> = ({ options, value, onChange, placeholder = "Search & Select...", disabled = false, className = "" }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const filteredOptions = options.filter(opt => opt.label.toLowerCase().includes(searchTerm.toLowerCase()));
    const selectedOption = options.find(opt => String(opt.value) === String(value));

    return (
        <div ref={wrapperRef} className={`relative w-full text-sm ${className}`}>
            <div 
                onClick={() => !disabled && setIsOpen(!isOpen)}
                className={`w-full px-3 py-2 rounded-md border border-input bg-transparent focus-within:ring-1 focus-within:ring-primary flex justify-between items-center h-full min-h-[38px] ${disabled ? 'opacity-50 cursor-not-allowed bg-muted/50' : 'cursor-pointer'}`}
            >
                <span className={`block truncate ${selectedOption ? "text-foreground" : "text-muted-foreground"}`}>
                    {selectedOption ? selectedOption.label : placeholder}
                </span>
                <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0 ml-2" />
            </div>

            {isOpen && !disabled && (
                <div className="absolute z-50 w-full mt-1 bg-card border border-border rounded-md shadow-lg overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                    <div className="p-2 border-b border-border/50 flex items-center gap-2">
                        <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        <input
                            autoFocus
                            type="text"
                            className="w-full bg-transparent outline-none text-sm"
                            placeholder="Search..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="max-h-60 overflow-y-auto p-1">
                        <div 
                            onClick={() => { onChange(""); setIsOpen(false); setSearchTerm(""); }}
                            className={`p-2 text-sm rounded-md cursor-pointer transition-colors hover:bg-muted/50 ${!value ? "bg-primary/10 text-primary font-medium" : ""}`}
                        >
                            -- {placeholder.replace("...", "")} --
                        </div>
                        {filteredOptions.length === 0 ? (
                            <div className="p-3 text-sm text-center text-muted-foreground">No results found</div>
                        ) : (
                            filteredOptions.map((opt, idx) => (
                                <div 
                                    key={idx}
                                    onClick={() => { onChange(opt.value); setIsOpen(false); setSearchTerm(""); }}
                                    className={`p-2 text-sm rounded-md cursor-pointer transition-colors hover:bg-muted/50 ${String(value) === String(opt.value) ? "bg-primary/10 text-primary font-medium" : ""}`}
                                >
                                    {opt.label}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
