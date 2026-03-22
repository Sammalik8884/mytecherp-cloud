import { useState, useEffect } from "react";
import {
    Loader2, ClipboardList, Plus, Save, Tags,
    ChevronRight, CheckSquare, AlignLeft, List, Camera,
    Star, BookOpen, AlertCircle
} from "lucide-react";
import { apiClient } from "../services/apiClient";
import { toast } from "react-hot-toast";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CategoryDto {
    id: number;
    name: string;
    description?: string;
}

interface QuestionConfig {
    Type?: string;
    Options?: string[];
    Standard?: string;
}

interface ChecklistQuestion {
    id: number;
    text: string;
    categoryName: string;
    configJson: string;
    version: string;
    _parsed?: QuestionConfig;
}

interface NewQuestionForm {
    categoryId: number;
    text: string;
    type: string;
    standardRef: string;
    options: string[];
    optionsRaw: string; // comma-separated UI input
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const parseConfig = (configJson: string): QuestionConfig => {
    try { return configJson ? JSON.parse(configJson) : {}; }
    catch { return {}; }
};

const TYPE_META: Record<string, { label: string; icon: React.ComponentType<any>; color: string }> = {
    Boolean: { label: "Pass / Fail", icon: CheckSquare, color: "text-green-400" },
    Text: { label: "Text Input", icon: AlignLeft, color: "text-blue-400" },
    Dropdown: { label: "Dropdown", icon: List, color: "text-purple-400" },
    Rating: { label: "Rating (1–5)", icon: Star, color: "text-yellow-400" },
    Photo: { label: "Photo Evidence", icon: Camera, color: "text-orange-400" },
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export const ChecklistBuilderPage = () => {
    const [categories, setCategories] = useState<CategoryDto[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<CategoryDto | null>(null);
    const [questions, setQuestions] = useState<ChecklistQuestion[]>([]);
    const [loadingCats, setLoadingCats] = useState(true);
    const [loadingQs, setLoadingQs] = useState(false);
    const [showNewQuestion, setShowNewQuestion] = useState(false);
    const [saving, setSaving] = useState(false);

    const emptyForm = (catId: number): NewQuestionForm => ({
        categoryId: catId,
        text: "",
        type: "Boolean",
        standardRef: "",
        options: [],
        optionsRaw: ""
    });

    const [form, setForm] = useState<NewQuestionForm>(emptyForm(0));

    // ── Fetch categories on mount ──────────────────────────────────────────
    useEffect(() => {
        const fetchCats = async () => {
            try {
                setLoadingCats(true);
                const res = await apiClient.get<CategoryDto[]>("/Categories");
                const cats = Array.isArray(res.data) ? res.data : [];
                setCategories(cats);
                if (cats.length > 0) {
                    setSelectedCategory(cats[0]);
                    setForm(emptyForm(cats[0].id));
                }
            } catch {
                toast.error("Failed to load categories.");
            } finally {
                setLoadingCats(false);
            }
        };
        fetchCats();
    }, []);

    // ── Fetch questions when category changes ─────────────────────────────
    useEffect(() => {
        if (!selectedCategory) return;
        const fetchQs = async () => {
            try {
                setLoadingQs(true);
                setShowNewQuestion(false);
                const res = await apiClient.get<ChecklistQuestion[]>(`/Checklists/category/${selectedCategory.id}`);
                const raw: any[] = Array.isArray(res.data) ? res.data : [];
                setQuestions(raw.map(q => ({
                    ...q,
                    text: q.text || q.Text || "",
                    _parsed: parseConfig(q.configJson || q.ConfigJson || "")
                })));
            } catch {
                setQuestions([]);
            } finally {
                setLoadingQs(false);
            }
        };
        fetchQs();
    }, [selectedCategory]);

    const handleSelectCategory = (cat: CategoryDto) => {
        setSelectedCategory(cat);
        setForm(emptyForm(cat.id));
    };

    const handleSaveQuestion = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.text.trim()) { toast.error("Question text is required."); return; }
        try {
            setSaving(true);
            const payload = {
                Text: form.text.trim(),
                CategoryId: form.categoryId,
                Type: form.type,
                StandardRef: form.standardRef.trim(),
                Options: form.type === "Dropdown" ? form.options : []
            };
            await apiClient.post("/Checklists", payload);
            toast.success("Question added to template!");
            // Re-fetch questions
            const res = await apiClient.get<any[]>(`/Checklists/category/${form.categoryId}`);
            const raw: any[] = Array.isArray(res.data) ? res.data : [];
            setQuestions(raw.map(q => ({ ...q, text: q.text || q.Text || "", _parsed: parseConfig(q.configJson || q.ConfigJson || "") })));
            setForm(emptyForm(form.categoryId));
            setShowNewQuestion(false);
        } catch (err: any) {
            toast.error(err.response?.data?.error || err.response?.data?.Error || "Failed to save question.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="p-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex justify-between items-start mb-8">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent flex items-center gap-3">
                        <ClipboardList className="h-8 w-8 text-primary" />
                        Checklist Template Builder
                    </h1>
                    <p className="text-muted-foreground mt-1 text-sm">
                        Design inspection templates per asset category. Technicians fill these when a Work Order is initialized.
                    </p>
                </div>
                <div className="flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-xl px-4 py-2 text-sm text-primary">
                    <BookOpen className="h-4 w-4" />
                    <span>Questions auto-load when WO is initialized</span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* ── Sidebar: Categories ──────────────────────────────── */}
                <div className="col-span-1 border border-border/50 rounded-2xl bg-secondary/30 backdrop-blur-sm overflow-hidden flex flex-col shadow-lg" style={{ height: "calc(100vh - 250px)" }}>
                    <div className="p-4 border-b border-border/40 bg-secondary/50 font-medium flex items-center gap-2 text-sm">
                        <Tags className="h-4 w-4 text-muted-foreground" />
                        Asset Categories
                    </div>
                    <div className="flex-1 overflow-y-auto p-3 space-y-1">
                        {loadingCats ? (
                            <div className="flex justify-center pt-8">
                                <Loader2 className="h-6 w-6 animate-spin text-primary opacity-50" />
                            </div>
                        ) : categories.length === 0 ? (
                            <div className="text-center pt-8 px-4 text-muted-foreground text-xs">
                                <AlertCircle className="h-6 w-6 mx-auto mb-2 opacity-40" />
                                No categories found.<br />Create categories first.
                            </div>
                        ) : (
                            categories.map(cat => (
                                <button
                                    key={cat.id}
                                    onClick={() => handleSelectCategory(cat)}
                                    className={`w-full text-left px-3 py-2.5 rounded-xl text-sm transition-all flex items-center justify-between group border ${selectedCategory?.id === cat.id
                                        ? "bg-primary/10 border-primary/30 text-primary font-medium"
                                        : "border-transparent text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                                        }`}
                                >
                                    <span className="truncate">{cat.name}</span>
                                    <ChevronRight className={`h-3.5 w-3.5 flex-shrink-0 transition-transform ${selectedCategory?.id === cat.id ? "rotate-90" : "opacity-0 group-hover:opacity-50"}`} />
                                </button>
                            ))
                        )}
                    </div>
                    {/* Category info footer */}
                    {selectedCategory?.description && (
                        <div className="p-3 border-t border-border/40 text-xs text-muted-foreground">
                            {selectedCategory.description}
                        </div>
                    )}
                </div>

                {/* ── Main Builder Area ──────────────────────────────────── */}
                <div className="col-span-3 flex flex-col" style={{ height: "calc(100vh - 250px)" }}>
                    <div className="border border-border/50 rounded-2xl bg-secondary/30 backdrop-blur-sm overflow-hidden flex-1 flex flex-col shadow-lg">
                        {/* Builder toolbar */}
                        <div className="p-4 border-b border-border/40 flex justify-between items-center bg-secondary/30">
                            <div>
                                <h2 className="font-semibold text-foreground">
                                    {selectedCategory
                                        ? <>Questions for: <span className="text-primary">{selectedCategory.name}</span></>
                                        : "Select a category"}
                                </h2>
                                {!loadingQs && selectedCategory && (
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        {questions.length} question{questions.length !== 1 ? "s" : ""} in template
                                    </p>
                                )}
                            </div>
                            {selectedCategory && (
                                <button
                                    onClick={() => { setShowNewQuestion(!showNewQuestion); setForm(emptyForm(selectedCategory.id)); }}
                                    className="bg-primary/10 text-primary border border-primary/20 px-3 py-1.5 rounded-lg flex items-center gap-2 hover:bg-primary/20 transition-all font-medium text-sm"
                                >
                                    <Plus className="h-4 w-4" />
                                    Add Question
                                </button>
                            )}
                        </div>

                        {/* Questions list */}
                        <div className="flex-1 overflow-auto p-6 space-y-3">
                            {!selectedCategory ? (
                                <div className="text-center py-16 text-muted-foreground text-sm">
                                    <Tags className="h-10 w-10 mx-auto mb-3 opacity-30" />
                                    Select a category from the left to view or build its checklist.
                                </div>
                            ) : loadingQs ? (
                                <div className="flex justify-center py-12">
                                    <Loader2 className="h-8 w-8 animate-spin text-primary opacity-50" />
                                </div>
                            ) : questions.length === 0 && !showNewQuestion ? (
                                <div className="text-center py-16 px-4">
                                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 mb-4">
                                        <ClipboardList className="h-7 w-7 text-primary" />
                                    </div>
                                    <h3 className="text-base font-medium text-foreground mb-1">No Questions Yet</h3>
                                    <p className="text-muted-foreground text-sm max-w-sm mx-auto mb-6">
                                        Technicians won't be given a checklist for <strong>{selectedCategory.name}</strong> assets until you add questions here.
                                    </p>
                                    <button
                                        onClick={() => setShowNewQuestion(true)}
                                        className="bg-primary text-primary-foreground px-4 py-2 rounded-lg inline-flex items-center gap-2 hover:bg-primary/90 transition-all font-medium border border-primary text-sm"
                                    >
                                        <Plus className="h-4 w-4" /> Start Building Template
                                    </button>
                                </div>
                            ) : (
                                <>
                                    {/* Existing questions */}
                                    {questions.map((q, idx) => {
                                        const config = q._parsed || {};
                                        const type = config.Type || "Boolean";
                                        const meta = TYPE_META[type] || TYPE_META["Boolean"];
                                        const Icon = meta.icon;
                                        return (
                                            <div key={q.id} className="bg-background/40 border border-border/50 rounded-xl p-5 relative group hover:border-border transition-all">
                                                {/* Type badge */}
                                                <div className={`absolute top-3 right-3 flex items-center gap-1.5 text-xs font-medium ${meta.color} bg-secondary/50 px-2.5 py-1 rounded-full`}>
                                                    <Icon className="h-3 w-3" />
                                                    {meta.label}
                                                </div>

                                                {/* Question text */}
                                                <p className="font-medium text-foreground pr-32">
                                                    <span className="text-muted-foreground mr-2 text-sm">{idx + 1}.</span>
                                                    {q.text}
                                                </p>

                                                {/* Standard ref */}
                                                {config.Standard && (
                                                    <p className="text-xs text-muted-foreground mt-1 pl-5">
                                                        📋 Standard: <span className="text-foreground/70">{config.Standard}</span>
                                                    </p>
                                                )}

                                                {/* Preview */}
                                                <div className="mt-3 pl-5 opacity-50 pointer-events-none">
                                                    {type === "Boolean" && (
                                                        <div className="flex gap-4 text-sm">
                                                            <label className="flex items-center gap-2"><input type="radio" readOnly /> Pass ✓</label>
                                                            <label className="flex items-center gap-2"><input type="radio" readOnly /> Fail ✗</label>
                                                        </div>
                                                    )}
                                                    {type === "Text" && (
                                                        <input type="text" placeholder="Technician writes answer here…" className="w-full max-w-md bg-transparent border border-border rounded-md px-3 py-1.5 text-sm italic" readOnly />
                                                    )}
                                                    {type === "Rating" && (
                                                        <div className="flex gap-1 text-yellow-400">
                                                            {[1, 2, 3, 4, 5].map(n => <Star key={n} className="h-4 w-4" />)}
                                                        </div>
                                                    )}
                                                    {type === "Photo" && (
                                                        <div className="border border-dashed border-border rounded-md px-4 py-2 text-center max-w-xs text-xs italic text-muted-foreground">
                                                            📷 Technician uploads photo
                                                        </div>
                                                    )}
                                                    {type === "Dropdown" && config.Options && config.Options.length > 0 && (
                                                        <select className="max-w-xs bg-transparent border border-border rounded-md px-3 py-1.5 text-sm" disabled>
                                                            {config.Options.map((opt, i) => <option key={i}>{opt}</option>)}
                                                        </select>
                                                    )}
                                                </div>

                                                {/* Version tag */}
                                                <span className="absolute bottom-3 left-5 text-[10px] text-muted-foreground/50 font-mono">
                                                    v{q.version}
                                                </span>
                                            </div>
                                        );
                                    })}

                                    {/* New Question Form */}
                                    {showNewQuestion && (
                                        <div className="bg-primary/5 border border-primary/30 rounded-xl p-5 animate-in slide-in-from-bottom-4 relative">
                                            <div className="absolute -top-3 left-4 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                                                NEW QUESTION
                                            </div>
                                            <form onSubmit={handleSaveQuestion} className="space-y-4 pt-2">
                                                {/* Question text */}
                                                <div>
                                                    <label className="block text-sm font-medium mb-1">
                                                        Question / Inspection Check <span className="text-red-400">*</span>
                                                    </label>
                                                    <input
                                                        type="text"
                                                        required
                                                        placeholder="e.g. Is the pressure gauge in the green zone?"
                                                        className="w-full bg-background/80 border border-primary/30 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                                                        value={form.text}
                                                        onChange={e => setForm({ ...form, text: e.target.value })}
                                                    />
                                                </div>

                                                <div className="grid grid-cols-2 gap-4">
                                                    {/* Answer type */}
                                                    <div>
                                                        <label className="block text-sm font-medium mb-1">Answer Type</label>
                                                        <select
                                                            className="w-full bg-background/80 border border-border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                                                            value={form.type}
                                                            onChange={e => setForm({ ...form, type: e.target.value, options: [], optionsRaw: "" })}
                                                        >
                                                            <option value="Boolean">✓ Pass / Fail (Boolean)</option>
                                                            <option value="Text">💬 Text Input</option>
                                                            <option value="Dropdown">📋 Dropdown Options</option>
                                                            <option value="Rating">⭐ Rating (1–5)</option>
                                                            <option value="Photo">📷 Photo Evidence</option>
                                                        </select>
                                                    </div>

                                                    {/* Standard Reference */}
                                                    <div>
                                                        <label className="block text-sm font-medium mb-1">Standard Reference <span className="text-muted-foreground font-normal">(optional)</span></label>
                                                        <input
                                                            type="text"
                                                            placeholder="e.g. NFPA 72, ISO 9001"
                                                            className="w-full bg-background/80 border border-border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                                                            value={form.standardRef}
                                                            onChange={e => setForm({ ...form, standardRef: e.target.value })}
                                                        />
                                                    </div>
                                                </div>

                                                {/* Dropdown options input */}
                                                {form.type === "Dropdown" && (
                                                    <div>
                                                        <label className="block text-sm font-medium mb-1">
                                                            Dropdown Options <span className="text-muted-foreground font-normal">(comma-separated)</span>
                                                        </label>
                                                        <input
                                                            type="text"
                                                            placeholder="Good, Fair, Poor, N/A"
                                                            className="w-full bg-background/80 border border-border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                                                            value={form.optionsRaw}
                                                            onChange={e => {
                                                                const raw = e.target.value;
                                                                const opts = raw.split(",").map(s => s.trim()).filter(Boolean);
                                                                setForm({ ...form, optionsRaw: raw, options: opts });
                                                            }}
                                                        />
                                                        {form.options.length > 0 && (
                                                            <div className="flex flex-wrap gap-1 mt-2">
                                                                {form.options.map((o, i) => (
                                                                    <span key={i} className="bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full border border-primary/20">{o}</span>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                <div className="flex justify-end gap-3 pt-3 border-t border-primary/10">
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowNewQuestion(false)}
                                                        className="px-4 py-2 border border-border rounded-lg text-sm font-medium hover:bg-secondary/50 transition-colors"
                                                    >
                                                        Cancel
                                                    </button>
                                                    <button
                                                        type="submit"
                                                        disabled={saving}
                                                        className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-50"
                                                    >
                                                        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                                        Save to Template
                                                    </button>
                                                </div>
                                            </form>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
