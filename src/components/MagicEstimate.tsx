import { useState } from 'react';
import { useRef } from 'react';
import { Sparkles, Save, Play, Loader2, AlertCircle, Camera, X, FileText, FileSpreadsheet } from 'lucide-react';
import { parseEstimateCommand, ParsedEstimateItem } from '@/utils/aiHelper';
import { extractTextFromPdf, extractTextFromDocx, extractTextFromExcel } from '@/utils/fileParsers';
import { supabase } from '@/utils/supabase/client';

interface MagicEstimateProps {
    estimateId?: string;
    onSuccess: (newEstimateId?: string) => void;
}

export default function MagicEstimate({ estimateId, onSuccess }: MagicEstimateProps) {
    const [input, setInput] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [previewData, setPreviewData] = useState<ParsedEstimateItem[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<{ name: string, type: 'pdf' | 'word' | 'excel' | 'image' } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleProcess = async () => {
        if (!input.trim()) return;
        setIsProcessing(true);
        setError(null);
        setPreviewData([]);

        try {
            // Pass image if selected
            const rawData = await parseEstimateCommand(input, selectedImage || undefined);


            if (rawData.length === 0) {
                setError("AI could not extract any items. Please try describing them differently.");
            } else {
                setPreviewData(rawData);
            }
        } catch (err: any) {
            console.error("Process error:", err);
            setError(err.message || "Failed to process command. Please check your API Key and try again.");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setError(null);
        setSelectedImage(null);
        setSelectedFile(null);

        const ext = file.name.split('.').pop()?.toLowerCase();

        if (['jpg', 'jpeg', 'png', 'webp'].includes(ext || '')) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setSelectedImage(reader.result as string);
                setSelectedFile({ name: file.name, type: 'image' });
            };
            reader.readAsDataURL(file);
        } else if (ext === 'pdf') {
            setIsProcessing(true);
            try {
                const text = await extractTextFromPdf(file);
                setInput(prev => (prev ? prev + '\n\n' : '') + `[Extracted from ${file.name}]:\n` + text);
                setSelectedFile({ name: file.name, type: 'pdf' });
            } catch (err: any) {
                setError("Failed to read PDF: " + err.message);
            } finally {
                setIsProcessing(false);
            }
        } else if (['doc', 'docx'].includes(ext || '')) {
            setIsProcessing(true);
            try {
                const text = await extractTextFromDocx(file);
                setInput(prev => (prev ? prev + '\n\n' : '') + `[Extracted from ${file.name}]:\n` + text);
                setSelectedFile({ name: file.name, type: 'word' });
            } catch (err: any) {
                setError("Failed to read Word file: " + err.message);
            } finally {
                setIsProcessing(false);
            }
        } else if (['xls', 'xlsx', 'csv'].includes(ext || '')) {
            setIsProcessing(true);
            try {
                const text = await extractTextFromExcel(file);
                setInput(prev => (prev ? prev + '\n\n' : '') + `[Extracted from ${file.name}]:\n` + text);
                setSelectedFile({ name: file.name, type: 'excel' });
            } catch (err: any) {
                setError("Failed to read Excel file: " + err.message);
            } finally {
                setIsProcessing(false);
            }
        } else {
            setError("Unsupported file type.");
        }

        // Reset input to allow re-selecting same file
        e.target.value = '';
    };

    const handleSave = async () => {
        if (previewData.length === 0) return;
        setIsSaving(true);
        setError(null);

        try {
            let targetEstimateId = estimateId;

            // If no estimate ID, create a new one first
            if (!targetEstimateId) {
                const { data: newEst, error: createError } = await supabase
                    .from('estimates')
                    .insert([{ name: 'Estimate ' + new Date().toLocaleString() }])
                    .select()
                    .single();

                if (createError) throw createError;
                targetEstimateId = newEst.id;
            }

            const itemsToInsert = previewData.map(item => ({
                estimate_id: targetEstimateId,
                description: item.description,
                unit: item.unit,
                quantity: item.quantity || 0,
                rate: item.rate || 0,
                amount: (item.quantity || 0) * (item.rate || 0),
                category: 'Material'
            }));

            const { error: dbError } = await supabase
                .from('estimate_items')
                .insert(itemsToInsert);

            if (dbError) throw dbError;

            setInput('');
            setPreviewData([]);
            onSuccess(targetEstimateId);
            alert(`Successfully added ${itemsToInsert.length} items!`);

        } catch (err: any) {
            console.error(err);
            setError(err.message || "Failed to save items to database.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-100 mb-8 shadow-sm">
            <div className="flex items-center gap-2 mb-4 text-blue-900">
                <Sparkles className="text-blue-600" size={24} />
                <h2 className="text-lg font-bold">Magic Estimate (AI Powered)</h2>
            </div>

            <p className="text-sm text-slate-600 mb-3 flex items-center gap-1">
                Paste your BOQ text or
                <button
                    onClick={() => fileInputRef.current?.click()}
                    className="font-bold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer inline-flex items-center gap-1"
                >
                    upload a file
                </button>
                (Image, PDF, Word, Excel).
            </p>

            <div className="space-y-4">
                <div className="relative">
                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Describe items or upload an image..."
                        className="w-full p-4 pr-12 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-400 focus:border-transparent min-h-[100px] bg-white text-slate-900"
                    />
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute top-3 right-3 p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors z-10 bg-white/50 backdrop-blur-sm"
                        title="Upload File"
                    >
                        <Camera size={20} />
                    </button>
                    <input
                        type="file"
                        accept="image/*, .pdf, .doc, .docx, .xls, .xlsx, .csv"
                        ref={fileInputRef}
                        className="hidden"
                        onChange={handleFileSelect}
                    />
                </div>

                {selectedImage && (
                    <div className="relative inline-block border border-slate-200 rounded-lg overflow-hidden group mt-3">
                        <img src={selectedImage} alt="Selected" className="h-32 object-contain bg-slate-50" />
                        <button
                            onClick={() => { setSelectedImage(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                            className="absolute top-1 right-1 bg-black/50 hover:bg-black/70 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <X size={14} />
                        </button>
                    </div>
                )}

                {selectedFile && selectedFile.type !== 'image' && (
                    <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-100 rounded-lg text-blue-700">
                        {selectedFile.type === 'pdf' ? <FileText size={20} /> : <FileSpreadsheet size={20} />}
                        <span className="text-sm font-semibold truncate">{selectedFile.name}</span>
                        <span className="text-xs bg-blue-100 px-2 py-0.5 rounded-full uppercase">{selectedFile.type}</span>
                        <button
                            onClick={() => { setSelectedFile(null); setInput(''); }}
                            className="ml-auto text-blue-400 hover:text-blue-600"
                        >
                            <X size={16} />
                        </button>
                    </div>
                )}

                <div className="flex gap-3">
                    <button
                        onClick={handleProcess}
                        disabled={isProcessing || (!input.trim() && !selectedImage)}
                        className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 transition-all"
                    >
                        {isProcessing ? <Loader2 className="animate-spin" size={18} /> : <Play size={18} />}
                        Step 1: Process Text
                    </button>

                    {previewData.length > 0 && (
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 disabled:opacity-50 transition-all ml-auto"
                        >
                            {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                            Step 2: {estimateId ? "Add to Estimate" : "Create & Add Items"}
                        </button>
                    )}
                </div>

                {error && (
                    <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg text-sm border border-red-100">
                        <AlertCircle size={16} />
                        {error}
                    </div>
                )}

                {previewData.length > 0 && (
                    <div className="mt-6 bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                                <tr>
                                    <th className="p-3">Description</th>
                                    <th className="p-3">Unit</th>
                                    <th className="p-3 text-right">Qty</th>
                                    <th className="p-3 text-right">Rate</th>
                                    <th className="p-3 text-right">Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {previewData.map((item, idx) => (
                                    <tr key={idx}>
                                        <td className="p-3 font-medium text-slate-900">{item.description}</td>
                                        <td className="p-3 text-slate-500">{item.unit}</td>
                                        <td className="p-3 text-right font-mono">{item.quantity}</td>
                                        <td className="p-3 text-right font-mono">{item.rate || '-'}</td>
                                        <td className="p-3 text-right font-mono font-bold text-slate-900">
                                            {((item.quantity || 0) * (item.rate || 0)).toLocaleString()}
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
