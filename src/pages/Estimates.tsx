import { useState, useEffect } from 'react'
import { supabase } from '@/utils/supabase/client'
import * as XLSX from 'xlsx'
import { Upload, FileSpreadsheet, ArrowRight, Save, CheckCircle, ChevronDown, ChevronRight, AlertCircle, FileText, X } from 'lucide-react'
import { Estimate, EstimateItem } from '@/types'

export default function Estimates() {
    // --- State ---
    const [step, setStep] = useState<'upload' | 'mapping' | 'preview'>('upload')
    const [fileData, setFileData] = useState<any[]>([])
    const [headers, setHeaders] = useState<string[]>([])
    const [fileName, setFileName] = useState('')

    // Mapping State: Keys are DB columns, Values are CSV headers
    const [mapping, setMapping] = useState({
        description: '',
        unit: '',
        quantity: '',
        rate: '',
        category: ''
    })
    const [selectedExtraColumns, setSelectedExtraColumns] = useState<string[]>([])

    // Existing Estimates (for the list view)
    const [savedEstimates, setSavedEstimates] = useState<Estimate[]>([])
    const [itemsMap, setItemsMap] = useState<Record<string, EstimateItem[]>>({}) // estimate_id -> items[]
    const [expandedEstimateId, setExpandedEstimateId] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)

    // --- Effects ---
    useEffect(() => {
        fetchEstimates()
    }, [])

    const fetchEstimates = async () => {
        const { data, error } = await supabase
            .from('estimates')
            .select('*')
            .order('created_at', { ascending: false })

        if (data) setSavedEstimates(data)
    }

    const fetchItems = async (estimateId: string) => {
        if (itemsMap[estimateId]) {
            setExpandedEstimateId(expandedEstimateId === estimateId ? null : estimateId)
            return
        }

        const { data, error } = await supabase
            .from('estimate_items')
            .select('*')
            .eq('estimate_id', estimateId)

        if (data) {
            setItemsMap(prev => ({ ...prev, [estimateId]: data }))
            setExpandedEstimateId(estimateId)
        }
    }

    const handleDelete = async (estimateId: string) => {
        if (!confirm('Are you sure you want to delete this estimate? This action cannot be undone.')) return

        setLoading(true)
        try {
            // Delete dependent items first (if no cascade) or just estimate
            const { error } = await supabase
                .from('estimates')
                .delete()
                .eq('id', estimateId)

            if (error) throw error

            setSavedEstimates(prev => prev.filter(e => e.id !== estimateId))
            if (expandedEstimateId === estimateId) setExpandedEstimateId(null)

            // Clean up items map
            const newMap = { ...itemsMap }
            delete newMap[estimateId]
            setItemsMap(newMap)

        } catch (error: any) {
            console.error('Error deleting estimate:', error)
            alert('Failed to delete estimate')
        } finally {
            setLoading(false)
        }
    }

    // --- Handlers ---

    // Step 1: File Upload
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setFileName(file.name)
        const reader = new FileReader()
        reader.onload = (evt) => {
            const bstr = evt.target?.result
            const wb = XLSX.read(bstr, { type: 'binary' })
            const wsname = wb.SheetNames[0]
            const ws = wb.Sheets[wsname]
            const data = XLSX.utils.sheet_to_json(ws, { header: 1 }) // Array of arrays

            if (data.length > 0) {
                const hdrs = data[0] as string[]
                // Re-reading as objects
                const dataObjects = XLSX.utils.sheet_to_json(ws) as any[]

                setHeaders(hdrs)
                setFileData(dataObjects)
                setStep('mapping')
            }
        }
        reader.readAsBinaryString(file)
    }

    // Step 2: Auto-Map (Simple heuristic)
    useEffect(() => {
        if (step === 'mapping' && headers.length > 0) {
            const newMapping = { ...mapping }
            headers.forEach(h => {
                const lower = h.toLowerCase()
                if (lower.includes('desc') || lower.includes('item')) newMapping.description = h
                if (lower.includes('unit')) newMapping.unit = h
                if (lower.includes('qty') || lower.includes('quantity')) newMapping.quantity = h
                if (lower.includes('rate') || lower.includes('price')) newMapping.rate = h
                if (lower.includes('cat') || lower.includes('group')) newMapping.category = h
            })
            setMapping(newMapping)

            // Auto-select remaining headers as extra columns
            const mappedValues = Object.values(newMapping)
            const extras = headers.filter(h => !mappedValues.includes(h))
            setSelectedExtraColumns(extras)
        }
    }, [step, headers])

    // Step 3: Save
    const handleSave = async () => {
        setLoading(true)
        try {
            // 1. Create Estimate Record
            const { data: estData, error: estError } = await supabase
                .from('estimates')
                .insert([{ name: fileName.split('.')[0] }]) // Remove extension
                .select()
                .single()

            if (estError) throw estError
            const estimateId = estData.id

            // 2. Process Items
            const itemsToInsert = fileData.map((row: any) => {
                // Sanitize helper
                const cleanNumber = (val: any) => {
                    if (typeof val === 'number') return val
                    if (typeof val === 'string') return parseFloat(val.replace(/[^0-9.-]+/g, ''))
                    return 0
                }

                const qty = cleanNumber(row[mapping.quantity])
                const rate = cleanNumber(row[mapping.rate])

                // Pack extra data
                const extraData: Record<string, any> = {}
                selectedExtraColumns.forEach(col => {
                    if (row[col] !== undefined) {
                        extraData[col] = row[col]
                    }
                })

                return {
                    estimate_id: estimateId,
                    description: row[mapping.description] || 'Unknown Item',
                    unit: row[mapping.unit] || 'Nos',
                    quantity: qty,
                    rate: rate,
                    // amount is generated by DB
                    category: row[mapping.category] || 'General',
                    extra_data: extraData
                }
            })

            const { error: itemsError } = await supabase
                .from('estimate_items')
                .insert(itemsToInsert)

            if (itemsError) throw itemsError

            alert('Estimate imported successfully!')
            setStep('upload')
            setFileData([])
            setFileName('')
            setMapping({ description: '', unit: '', quantity: '', rate: '', category: '' })
            setSelectedExtraColumns([])
            fetchEstimates() // Refresh list

        } catch (error: any) {
            console.error(error)
            alert('Failed to save estimate: ' + error.message)
        } finally {
            setLoading(false)
        }
    }

    const handleSetActive = async (estimateId: string) => {
        setLoading(true)
        try {
            // 1. Reset all others
            await supabase.from('estimates').update({ is_active: false }).neq('id', '00000000-0000-0000-0000-000000000000') // safer update all

            // 2. Set active
            const { error } = await supabase
                .from('estimates')
                .update({ is_active: true })
                .eq('id', estimateId)

            if (error) throw error

            // 3. Update local state
            setSavedEstimates(prev => prev.map(e => ({
                ...e,
                is_active: e.id === estimateId
            })))

        } catch (error: any) {
            console.error('Error setting active estimate:', error)
            alert('Failed to set active estimate')
        } finally {
            setLoading(false)
        }
    }

    const handleDeactivate = async (estimateId: string) => {
        setLoading(true)
        try {
            const { error } = await supabase
                .from('estimates')
                .update({ is_active: false })
                .eq('id', estimateId)

            if (error) throw error

            setSavedEstimates(prev => prev.map(e => ({
                ...e,
                is_active: e.id === estimateId ? false : e.is_active
            })))

        } catch (error: any) {
            console.error('Error deactivating estimate:', error)
            alert('Failed to deactivate estimate')
        } finally {
            setLoading(false)
        }
    }

    // --- Render ---

    return (
        <div className="min-h-screen space-y-8 pb-20">
            <header>
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Estimates & BOQ</h1>
                <p className="text-slate-500 mt-1">Import and manage Bill of Quantities (BOQ) from Excel.</p>
            </header>

            {/* WIZARD CARD */}
            <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
                {/* Wizard Steps Header */}
                <div className="bg-slate-50 border-b border-slate-100 p-4 flex items-center gap-2 text-sm font-medium text-slate-500">
                    <span className={`flex items-center gap-2 ${step === 'upload' ? 'text-blue-600 font-bold' : ''}`}>
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center border ${step === 'upload' ? 'border-blue-600 bg-blue-50 text-blue-600' : 'border-slate-300'}`}>1</div>
                        Upload
                    </span>
                    <ChevronRight size={16} />
                    <span className={`flex items-center gap-2 ${step === 'mapping' ? 'text-blue-600 font-bold' : ''}`}>
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center border ${step === 'mapping' ? 'border-blue-600 bg-blue-50 text-blue-600' : 'border-slate-300'}`}>2</div>
                        Map Columns
                    </span>
                    <ChevronRight size={16} />
                    <span className={`flex items-center gap-2 ${step === 'preview' ? 'text-blue-600 font-bold' : ''}`}>
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center border ${step === 'preview' ? 'border-blue-600 bg-blue-50 text-blue-600' : 'border-slate-300'}`}>3</div>
                        Review & Save
                    </span>
                </div>

                <div className="p-8">
                    {/* STEP 1: UPLOAD */}
                    {step === 'upload' && (
                        <div className="border-2 border-dashed border-slate-300 rounded-xl p-12 flex flex-col items-center justify-center text-center hover:bg-slate-50 transition-colors relative cursor-pointer group">
                            <input
                                type="file"
                                accept=".xlsx, .xls, .csv"
                                onChange={handleFileUpload}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                            <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <FileSpreadsheet size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900">Drag & Drop Excel or CSV (Recommended)</h3>
                            <p className="text-slate-500 mt-2">or click to browse (.xlsx, .csv)</p>
                            <p className="text-sm text-slate-600 mt-3 font-medium bg-yellow-50 px-4 py-2 rounded-lg border border-yellow-100 text-center max-w-md mx-auto">
                                Have a Word or PDF file? Please <strong>'Save As Excel'</strong> before uploading to ensure 100% accuracy.
                            </p>
                            <p className="text-xs text-slate-400 mt-4">Required Cols: Description, Unit, Qty, Rate</p>
                        </div>
                    )}

                    {/* STEP 2: MAPPING */}
                    {step === 'mapping' && (
                        <div className="space-y-6">
                            <div className="bg-blue-50 p-4 rounded-lg flex items-start gap-3 border border-blue-100">
                                <AlertCircle className="text-blue-600 mt-0.5" size={20} />
                                <div>
                                    <h4 className="font-bold text-blue-900">Map your Excel headers</h4>
                                    <p className="text-sm text-blue-700">Select which column from your file corresponds to the HAJRI fields.</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {Object.keys(mapping).map((field) => (
                                    <div key={field}>
                                        <label className="block text-sm font-medium text-slate-700 mb-2 capitalize">
                                            {field} {field === 'category' ? '(Optional)' : '<span className="text-red-500">*</span>'}
                                        </label>
                                        <select
                                            value={(mapping as any)[field]}
                                            onChange={(e) => setMapping(prev => ({ ...prev, [field]: e.target.value }))}
                                            className="w-full p-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                        >
                                            <option value="">-- Select Column --</option>
                                            {headers.map(h => (
                                                <option key={h} value={h}>{h}</option>
                                            ))}
                                        </select>
                                    </div>
                                ))}
                            </div>

                            {/* Additional Columns Selection */}
                            <div className="pt-6 border-t border-slate-100">
                                <h4 className="font-bold text-slate-900 mb-3 text-sm uppercase tracking-wide">Additional Data to Keep</h4>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                    {headers.filter(h => !Object.values(mapping).includes(h)).map(h => (
                                        <label key={h} className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={selectedExtraColumns.includes(h)}
                                                onChange={(e) => {
                                                    if (e.target.checked) setSelectedExtraColumns(prev => [...prev, h])
                                                    else setSelectedExtraColumns(prev => prev.filter(c => c !== h))
                                                }}
                                                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                            />
                                            {h}
                                        </label>
                                    ))}
                                    {headers.filter(h => !Object.values(mapping).includes(h)).length === 0 && (
                                        <p className="text-slate-400 text-sm col-span-full">All columns are mapped.</p>
                                    )}
                                </div>
                            </div>

                            <div className="flex justify-end pt-4">
                                <button
                                    onClick={() => setStep('preview')}
                                    disabled={!mapping.description || !mapping.quantity || !mapping.rate}
                                    className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-lg font-bold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    Next: Preview <ArrowRight size={18} />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* STEP 3: PREVIEW */}
                    {step === 'preview' && (
                        <div className="space-y-6">
                            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                                <h4 className="font-bold text-slate-900 mb-2">Import Summary</h4>
                                <ul className="text-sm text-slate-600 space-y-1">
                                    <li>• File: <strong>{fileName}</strong></li>
                                    <li>• Total Rows: <strong>{fileData.length}</strong></li>
                                    <li>• Category Column: <strong>{mapping.category || 'Defaulting to "General"'}</strong></li>
                                    <li>• Extra Columns: <strong>{selectedExtraColumns.length > 0 ? selectedExtraColumns.join(', ') : 'None'}</strong></li>
                                </ul>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                                <button
                                    onClick={() => setStep('mapping')}
                                    className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50"
                                >
                                    Back
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={loading}
                                    className="flex items-center gap-2 bg-green-600 text-white px-6 py-2.5 rounded-lg font-bold hover:bg-green-700 disabled:opacity-50 transition-colors"
                                >
                                    {loading ? 'Importing...' : 'Confirm & Import'} <Save size={18} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* SAVED ESTIMATES LIST */}
            <div>
                <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <FileText size={20} className="text-slate-500" />
                    Saved Estimates
                </h2>

                <div className="space-y-4">
                    {savedEstimates.length === 0 ? (
                        <p className="text-slate-500 italic">No estimates imported yet.</p>
                    ) : (
                        savedEstimates.map(est => (
                            <div key={est.id} className={`bg-white rounded-xl border overflow-hidden shadow-sm transition-all ${est.is_active ? 'border-green-500 ring-1 ring-green-500' : 'border-slate-200'}`}>
                                <div
                                    className="p-4 bg-slate-50 flex justify-between items-center cursor-pointer hover:bg-slate-100 transition-colors"
                                    onClick={() => fetchItems(est.id)}
                                >
                                    <div className="flex items-center gap-3">
                                        {expandedEstimateId === est.id ? <ChevronDown size={20} className="text-slate-400" /> : <ChevronRight size={20} className="text-slate-400" />}
                                        <div className="flex flex-col">
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-slate-800">{est.name}</span>
                                                {est.is_active && (
                                                    <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                                                        <CheckCircle size={12} /> Active
                                                    </span>
                                                )}
                                            </div>
                                            <span className="text-xs text-slate-400 mt-0.5">
                                                {new Date(est.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {est.is_active ? (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    handleDeactivate(est.id)
                                                }}
                                                className="text-xs font-semibold text-slate-500 hover:bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 transition-colors"
                                            >
                                                Deactivate
                                            </button>
                                        ) : (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    handleSetActive(est.id)
                                                }}
                                                className="text-xs font-semibold text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200 transition-colors"
                                            >
                                                Set Active
                                            </button>
                                        )}
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                handleDelete(est.id)
                                            }}
                                            className="text-xs text-red-500 hover:underline px-2"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>

                                {/* ITEMS TABLE (Collapsible) */}
                                {expandedEstimateId === est.id && itemsMap[est.id] && (
                                    <div className="p-0 border-t border-slate-200">
                                        <div className="overflow-x-auto">
                                            {(() => {
                                                // Calculate dynamic columns based on first item
                                                const firstItem = itemsMap[est.id].length > 0 ? itemsMap[est.id][0] : null
                                                const extraKeys = firstItem?.extra_data ? Object.keys(firstItem.extra_data) : []

                                                return (
                                                    <table className="w-full text-left text-sm">
                                                        <thead className="bg-white text-slate-500 font-medium border-b border-slate-100">
                                                            <tr>
                                                                <th className="px-6 py-3">Description</th>
                                                                <th className="px-6 py-3 text-center">Unit</th>
                                                                <th className="px-6 py-3 text-center">Qty</th>
                                                                <th className="px-6 py-3 text-right">Rate</th>
                                                                <th className="px-6 py-3 text-right">Amount</th>
                                                                <th className="px-6 py-3">Category</th>
                                                                {/* Dynamic Attributes Header */}
                                                                {extraKeys.map(key => (
                                                                    <th key={key} className="px-6 py-3 whitespace-nowrap capitalize">{key}</th>
                                                                ))}
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-slate-50 bg-white">
                                                            {itemsMap[est.id].map(item => {
                                                                const amount = item.amount ?? ((item.quantity || 0) * (item.rate || 0)) ?? 0
                                                                return (
                                                                    <tr key={item.id} className="hover:bg-slate-50/50">
                                                                        <td className="px-6 py-3 text-slate-700">{item.description || '-'}</td>
                                                                        <td className="px-6 py-3 text-center text-slate-500">{item.unit || '-'}</td>
                                                                        <td className="px-6 py-3 text-center font-mono">{item.quantity}</td>
                                                                        <td className="px-6 py-3 text-right font-mono text-slate-600">₹{item.rate}</td>
                                                                        <td className="px-6 py-3 text-right font-mono font-bold text-slate-900">₹{amount.toLocaleString()}</td>
                                                                        <td className="px-6 py-3">
                                                                            <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-xs border border-slate-200">
                                                                                {item.category || 'General'}
                                                                            </span>
                                                                        </td>
                                                                        {/* Dynamic Attributes Data - Aligned to Header */}
                                                                        {extraKeys.map(key => (
                                                                            <td key={key} className="px-6 py-3 text-slate-500 text-xs">
                                                                                {item.extra_data ? String(item.extra_data[key] ?? '-') : '-'}
                                                                            </td>
                                                                        ))}
                                                                    </tr>
                                                                )
                                                            })}
                                                        </tbody>
                                                    </table>
                                                )
                                            })()}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    )
}
