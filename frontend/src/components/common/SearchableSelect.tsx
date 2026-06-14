import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown } from 'lucide-react';

interface SearchableSelectProps {
    options: string[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
}

export const SearchableSelect: React.FC<SearchableSelectProps> = ({ options, value, onChange, placeholder = "Search & Select..." }) => {
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

    const filteredOptions = options.filter(opt => opt.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <div ref={wrapperRef} className="relative w-full">
            <div 
                onClick={() => setIsOpen(!isOpen)}
                className="w-full p-2.5 rounded-xl border border-input bg-background focus-within:ring-2 focus-within:ring-primary/20 flex justify-between items-center cursor-pointer"
            >
                <span className={`block truncate ${value ? "text-foreground" : "text-muted-foreground"}`}>{value || placeholder}</span>
                <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            </div>

            {isOpen && (
                <div className="absolute z-50 w-full mt-1 bg-card border border-border/50 rounded-xl shadow-lg overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                    <div className="p-2 border-b border-border/50 flex items-center gap-2">
                        <Search className="w-4 h-4 text-muted-foreground" />
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
                            className={`p-2 text-sm rounded-lg cursor-pointer transition-colors hover:bg-muted/50 ${!value ? "bg-primary/10 text-primary font-medium" : ""}`}
                        >
                            All
                        </div>
                        {filteredOptions.length === 0 ? (
                            <div className="p-3 text-sm text-center text-muted-foreground">No results found</div>
                        ) : (
                            filteredOptions.map((opt, idx) => (
                                <div 
                                    key={idx}
                                    onClick={() => { onChange(opt); setIsOpen(false); setSearchTerm(""); }}
                                    className={`p-2 text-sm rounded-lg cursor-pointer transition-colors hover:bg-muted/50 ${value === opt ? "bg-primary/10 text-primary font-medium" : ""}`}
                                >
                                    {opt}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
