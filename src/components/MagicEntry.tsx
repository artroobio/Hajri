import { useState } from 'react';
import { Sparkles, ArrowRight, Save, Play, Loader2, AlertCircle, HardHat, Banknote } from 'lucide-react';
import { parseWorkerCommand, parseExpenseCommand, ParsedAttendance, ParsedExpense } from '@/utils/aiHelper';
import { Worker } from '@/types';
import { supabase } from '@/utils/supabase/client';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

interface MagicEntryProps {
    workers: Worker[];
    onSuccess: () => void;
    projectId: string | null;
}

type TabMode = 'Attendance' | 'Expenses';

export default function MagicEntry({ workers, onSuccess, projectId }: MagicEntryProps) {
    const [activeTab, setActiveTab] = useState<TabMode>('Attendance');
    const [input, setInput] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Privacy: State for Attendance
    const [attendancePreview, setAttendancePreview] = useState<(ParsedAttendance & { matchedWorkerId?: string, matchedWorkerName?: string })[]>([]);

    // Privacy: State for Expenses
    const [expensePreview, setExpensePreview] = useState<ParsedExpense[]>([]);

    const [error, setError] = useState<string | null>(null);

    const handleProcess = async () => {
        if (!input.trim()) return;
        setIsProcessing(true);
        setError(null);
        setAttendancePreview([]);
        setExpensePreview([]);

        try {
            if (activeTab === 'Attendance') {
                const rawData = await parseWorkerCommand(input);

                // Match workers
                const processed = rawData.map(item => {
                    // Simple case-insensitive exact string matched or partial match
                    const matchedWorker = workers.find(w =>
                        w.full_name.toLowerCase().includes(item.worker_name.toLowerCase()) ||
                        item.worker_name.toLowerCase().includes(w.full_name.toLowerCase())
                    );

                    return {
                        ...item,
                        matchedWorkerId: matchedWorker?.id,
                        matchedWorkerName: matchedWorker?.full_name
                    };
                });

                setAttendancePreview(processed);
                if (processed.length === 0) {
                    setError("AI could not understand or found no workers.");
                }
            } else {
                // Expense Mode
                const rawData = await parseExpenseCommand(input);
                setExpensePreview(rawData);
                if (rawData.length === 0) {
                    setError("AI could not extract any expenses.");
                }
            }

        } catch (err: any) {
            console.error("Process error:", err);
            setError(err.message || "Failed to process command. Please check your API Key and try again.");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        const dateStr = format(new Date(), 'yyyy-MM-dd');

        try {
            if (activeTab === 'Attendance') {
                if (attendancePreview.length === 0) return;
                const validRecords = attendancePreview.filter(d => d.matchedWorkerId);

                if (validRecords.length === 0) {
                    setError("No matched workers found to save.");
                    setIsSaving(false);
                    return;
                }

                for (const record of validRecords) {
                    const hajriCount = record.status === 'Present' ? (record.shift === 'Night' ? 1 : 1) : 0; // Defaulting both to 1 for now unless logic specifies otherwise

                    const payload = {
                        worker_id: record.matchedWorkerId,
                        date: dateStr,
                        hajri_count: hajriCount,
                        status: record.status,
                        shift: record.shift,
                        notes: record.notes,
                        project_id: projectId // Ensure attendance is linked to project
                    };

                    const { data: existing } = await supabase
                        .from('attendance')
                        .select('id')
                        .eq('worker_id', record.matchedWorkerId)
                        .eq('date', dateStr)
                        .single();

                    if (existing) {
                        await supabase.from('attendance').update(payload).eq('id', existing.id);
                    } else {
                        await supabase.from('attendance').insert(payload);
                    }
                }
                toast.success(`Successfully saved ${validRecords.length} attendance records!`);

            } else {
                // Save Expenses
                if (expensePreview.length === 0) return;

                const records = expensePreview.map(item => ({
                    description: item.item_name + (item.unit ? ` (${item.unit})` : ''),
                    amount: item.amount,
                    quantity: item.quantity,
                    rate: item.quantity > 0 ? (item.amount / item.quantity) : 0, // Inferred rate
                    category: item.category || 'Material',
                    date: dateStr,
                    created_at: new Date().toISOString()
                }));

                const { error } = await supabase.from('expenses').insert(records);
                if (error) throw error;

                toast.success(`Successfully saved ${records.length} expense records!`);
            }

            // Cleanup
            setInput('');
            setAttendancePreview([]);
            setExpensePreview([]);
            onSuccess();

        } catch (err: any) {
            console.error(err);
            setError(err.message || "Failed to save to database.");
        } finally {
            setIsSaving(false);
        }
    };

    const hasData = activeTab === 'Attendance' ? attendancePreview.length > 0 : expensePreview.length > 0;

    return (
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-6 rounded-xl border border-indigo-100 mb-8 shadow-sm transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-indigo-900">
                    <Sparkles className="text-purple-600" size={24} />
                    <h2 className="text-lg font-bold">Magic Entry</h2>
                </div>

                {/* Tabs */}
                <div className="flex bg-white/50 p-1 rounded-lg border border-indigo-100">
                    <button
                        onClick={() => setActiveTab('Attendance')}
                        className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-semibold transition-all ${activeTab === 'Attendance'
                            ? 'bg-white text-indigo-600 shadow-sm'
                            : 'text-slate-500 hover:text-indigo-600'
                            }`}
                    >
                        <HardHat size={16} />
                        Attendance
                    </button>
                    <button
                        onClick={() => setActiveTab('Expenses')}
                        className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-semibold transition-all ${activeTab === 'Expenses'
                            ? 'bg-white text-purple-600 shadow-sm'
                            : 'text-slate-500 hover:text-purple-600'
                            }`}
                    >
                        <Banknote size={16} />
                        Expenses
                    </button>
                </div>
            </div>

            <p className="text-sm text-slate-600 mb-3">
                {activeTab === 'Attendance' ? (
                    <>Type normally, e.g., <span className="italic font-mono text-purple-700">"Raju and Amit are present, but Ravi is absent"</span></>
                ) : (
                    <>enter expenses, e.g., <span className="italic font-mono text-purple-700">"Bought 50 bags of cement for 15000 and paid 200 for auto"</span></>
                )}
            </p>

            <div className="space-y-4">
                <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={activeTab === 'Attendance' ? "Describe today's attendance..." : "Describe expenses..."}
                    className="w-full p-4 rounded-lg border border-slate-200 focus:ring-2 focus:ring-purple-400 focus:border-transparent min-h-[100px] bg-white transition-all shadow-sm focus:shadow-md"
                />

                <div className="flex gap-3">
                    <button
                        onClick={handleProcess}
                        disabled={isProcessing || !input.trim()}
                        className={`flex items-center gap-2 px-6 py-2.5 text-white rounded-lg font-semibold disabled:opacity-50 transition-all shadow-md hover:shadow-lg ${activeTab === 'Attendance' ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-purple-600 hover:bg-purple-700'
                            }`}
                    >
                        {isProcessing ? <Loader2 className="animate-spin" size={18} /> : <Play size={18} />}
                        Process {activeTab}
                    </button>

                    {hasData && (
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 disabled:opacity-50 transition-all ml-auto shadow-md hover:shadow-lg"
                        >
                            {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                            Save to Database
                        </button>
                    )}
                </div>

                {error && (
                    <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg text-sm border border-red-100 animate-in fade-in slide-in-from-top-1">
                        <AlertCircle size={16} />
                        {error}
                    </div>
                )}

                {/* --- PREVIEW TABLES --- */}

                {/* ATTENDANCE PREVIEW */}
                {activeTab === 'Attendance' && attendancePreview.length > 0 && (
                    <div className="mt-6 bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm animate-in fade-in zoom-in-95">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                                <tr>
                                    <th className="p-3">Matched Worker</th>
                                    <th className="p-3">Status</th>
                                    <th className="p-3">Shift (Ref Only)</th>
                                    <th className="p-3">Notes (Ref Only)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {attendancePreview.map((item, idx) => (
                                    <tr key={idx} className={!item.matchedWorkerId ? "bg-red-50" : ""}>
                                        <td className="p-3 font-medium text-slate-900">
                                            {item.matchedWorkerName || (
                                                <span className="text-red-500 flex items-center gap-1">
                                                    <AlertCircle size={14} /> Not Found ({item.worker_name})
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-3">
                                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${item.status === 'Present'
                                                ? 'bg-green-100 text-green-700'
                                                : 'bg-red-100 text-red-700'
                                                }`}>
                                                {item.status}
                                            </span>
                                        </td>
                                        <td className="p-3 text-slate-500">{item.shift || '-'}</td>
                                        <td className="p-3 text-slate-500 italic truncate max-w-[200px]">{item.notes || '-'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <div className="p-2 bg-blue-50 text-xs text-blue-700 border-t border-blue-100 text-center">
                            Note: All fields will be saved to the database.
                        </div>
                    </div>
                )}

                {/* EXPENSE PREVIEW */}
                {activeTab === 'Expenses' && expensePreview.length > 0 && (
                    <div className="mt-6 bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm animate-in fade-in zoom-in-95">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-purple-50 text-purple-900 font-semibold border-b border-purple-100">
                                <tr>
                                    <th className="p-3">Item Name</th>
                                    <th className="p-3 text-center">Qty / Unit</th>
                                    <th className="p-3 text-right">Amount</th>
                                    <th className="p-3 text-center">Category</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-purple-50">
                                {expensePreview.map((item, idx) => (
                                    <tr key={idx}>
                                        <td className="p-3 font-medium text-slate-900">
                                            {item.item_name}
                                        </td>
                                        <td className="p-3 text-center text-slate-600">
                                            {item.quantity} {item.unit}
                                        </td>
                                        <td className="p-3 text-right font-bold text-slate-900">
                                            ₹{item.amount.toLocaleString()}
                                        </td>
                                        <td className="p-3 text-center">
                                            <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded-full text-xs">
                                                {item.category}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}


            </div>
        </div>
    );
}
