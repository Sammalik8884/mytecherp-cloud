import { useState, useEffect } from "react";
import { X, Loader2, Search, FileText } from "lucide-react";
import { quotationService, QuotationDto } from "../../services/quotationService";

interface QuoteSelectorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (quote: QuotationDto) => void;
}

export const QuoteSelectorModal = ({ isOpen, onClose, onSelect }: QuoteSelectorModalProps) => {
    const [quotes, setQuotes] = useState<QuotationDto[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        if (isOpen) {
            const fetchQuotes = async () => {
                setLoading(true);
                try {
                    const data = await quotationService.getAllQuotations();
                    // Filter for finalized quotes only (Approved, SentToCustomer, etc - NOT draft or rejected)
                    const finalized = data.filter(q => 
                        ['approved', 'senttocustomer', 'accepted', 'converted'].includes(q.status.toLowerCase())
                    );
                    setQuotes(finalized);
                } catch (error) {
                    console.error("Failed to load quotes for selector", error);
                } finally {
                    setLoading(false);
                }
            };
            fetchQuotes();
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const filtered = quotes.filter(q => 
        q.quoteNumber.toLowerCase().includes(searchQuery.toLowerCase()) || 
        q.customerName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-card w-full max-w-2xl max-h-[85vh] flex flex-col border border-border rounded-2xl shadow-xl">
                <div className="flex justify-between items-center p-6 border-b border-border shrink-0">
                    <h2 className="text-xl font-semibold text-foreground">Select Finalized Quote</h2>
                    <button onClick={onClose} className="p-2 text-muted-foreground hover:bg-secondary hover:text-foreground rounded-full transition-colors">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="p-4 border-b border-border/40 bg-secondary/30">
                    <div className="relative w-full relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Search by quote # or customer..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-background border border-border rounded-lg pl-9 pr-4 py-2 text-sm w-full focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                    </div>
                </div>

                <div className="p-2 overflow-y-auto custom-scrollbar flex-1">
                    {loading ? (
                        <div className="py-12 flex justify-center">
                            <Loader2 className="h-8 w-8 animate-spin text-primary opacity-50" />
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="py-12 text-center text-muted-foreground">
                            No finalized quotes found matching your search.
                        </div>
                    ) : (
                        <div className="space-y-2 p-2">
                            {filtered.map(q => (
                                <div 
                                    key={q.id} 
                                    onClick={() => onSelect(q)}
                                    className="flex justify-between items-center p-4 rounded-xl border border-border bg-card hover:border-primary/50 hover:bg-primary/5 cursor-pointer transition-all duration-200 group"
                                >
                                    <div className="flex items-center space-x-4">
                                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                            <FileText className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <h4 className="font-medium text-foreground group-hover:text-primary transition-colors">{q.quoteNumber}</h4>
                                            <div className="text-xs text-muted-foreground mt-0.5">{q.customerName}</div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-semibold text-foreground">${q.grandTotal.toLocaleString()}</div>
                                        <div className="text-[10px] uppercase font-bold text-primary/80 mt-1">{q.status}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
