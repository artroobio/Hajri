import { useState, useEffect } from 'react'
import { supabase } from '@/utils/supabase/client'
import * as XLSX from 'xlsx'
import { Upload, FileSpreadsheet, ArrowRight, Save, CheckCircle, ChevronDown, ChevronRight, AlertCircle, FileText, X, Plus, Trash2, Search } from 'lucide-react'
import { Estimate, EstimateItem } from '@/types'
import MagicEstimate from '@/components/MagicEstimate';

export default function Estimates() {
    // --- State ---
    const [savedEstimates, setSavedEstimates] = useState<Estimate[]>([])
    const [itemsMap, setItemsMap] = useState<Record<string, EstimateItem[]>>({})
    const [selectedEstimateId, setSelectedEstimateId] = useState<string | null>(null)
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

        if (data) {
            setSavedEstimates(data)
            // Auto-select first if none selected
            if (!selectedEstimateId && data.length > 0) {
                // Optional: Auto select recent? Let's leave it to user or blank.
            }
        }
    }

    const fetchItems = async (estimateId: string) => {
        const { data, error } = await supabase
            .from('estimate_items')
            .select('*')
            .eq('estimate_id', estimateId)

        if (data) {
            setItemsMap(prev => ({ ...prev, [estimateId]: data }))
        }
    }

    // When selection changes, fetch items
    useEffect(() => {
        if (selectedEstimateId) {
            fetchItems(selectedEstimateId)
        }
    }, [selectedEstimateId])

    const handleDelete = async (estimateId: string) => {
        if (!confirm('Are you sure you want to delete this estimate?')) return

        setLoading(true)
        try {
            const { error } = await supabase.from('estimates').delete().eq('id', estimateId)
            if (error) throw error

            setSavedEstimates(prev => prev.filter(e => e.id !== estimateId))
            if (selectedEstimateId === estimateId) setSelectedEstimateId(null)

            const newMap = { ...itemsMap }
            delete newMap[estimateId]
            setItemsMap(newMap)

        } catch (error: any) {
            console.error(error)
            alert('Failed to delete estimate')
        } finally {
            setLoading(false)
        }
    }

    // Manual Entry State
    const [manualDescription, setManualDescription] = useState('')
    const [manualAmount, setManualAmount] = useState('')

    const handleManualAdd = async () => {
        if (!selectedEstimateId || !manualDescription || !manualAmount) return

        setLoading(true)
        try {
            const amountVal = parseFloat(manualAmount)
            const { error } = await supabase.from('estimate_items').insert({
                estimate_id: selectedEstimateId,
                description: manualDescription,
                unit: 'LS', // Lump Sum
                quantity: 1,
                rate: amountVal,
                amount: amountVal,
                category: 'Manual'
            })

            if (error) throw error

            setManualDescription('')
            setManualAmount('')
            fetchItems(selectedEstimateId)
            // alert('Item added successfully!') 
        } catch (error: any) {
            alert('Error adding item: ' + error.message)
        } finally {
            setLoading(false)
        }
    }

    const handleCreateEmpty = async () => {
        setLoading(true)
        try {
            const { data, error } = await supabase
                .from('estimates')
                .insert([{ name: 'Estimate ' + new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString() }])
                .select()
                .single()

            if (error) throw error

            setSavedEstimates(prev => [data, ...prev])
            setItemsMap(prev => ({ ...prev, [data.id]: [] }))
            setSelectedEstimateId(data.id) // Auto Select

        } catch (error: any) {
            console.error(error)
            alert('Failed to create estimate')
        } finally {
            setLoading(false)
        }
    }

    // --- Handlers ---
    const handleNewEstimateCreated = (newId?: string) => {
        fetchEstimates();
        if (newId) setSelectedEstimateId(newId);
    };


    // --- Render ---
    return (
        <div className="min-h-screen space-y-6 pb-20 p-4 md:p-8 bg-slate-50/50">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Estimates & BOQ</h1>
                    <p className="text-slate-500 mt-1">Manage Bill of Quantities and Estimates.</p>
                </div>
                <button
                    onClick={handleCreateEmpty}
                    className="bg-blue-600 text-white px-5 py-2.5 rounded-lg font-bold hover:bg-blue-700 shadow-md flex items-center gap-2"
                >
                    <Plus size={20} />
                    New Estimate
                </button>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start h-[calc(100vh-200px)]">
                {/* LEFT SIDEBAR: LIST */}
                <div className="lg:col-span-1 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full">
                    <div className="p-4 border-b border-slate-100 bg-slate-50">
                        <h2 className="font-bold text-slate-700 flex items-center gap-2">
                            Saved Estimates
                        </h2>
                    </div>
                    <div className="overflow-y-auto flex-1 p-2 space-y-2">
                        {savedEstimates.length === 0 ? (
                            <div className="text-center p-8 text-slate-400 text-sm">
                                No estimates yet. Create one!
                            </div>
                        ) : (
                            savedEstimates.map(est => (
                                <div
                                    key={est.id}
                                    onClick={() => setSelectedEstimateId(est.id)}
                                    className={`p-3 rounded-lg cursor-pointer transition-all border ${selectedEstimateId === est.id
                                        ? 'bg-blue-50 border-blue-200 shadow-sm'
                                        : 'hover:bg-slate-50 border-transparent'
                                        }`}
                                >
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className={`font-semibold text-sm ${selectedEstimateId === est.id ? 'text-blue-900' : 'text-slate-700'}`}>
                                                {est.name}
                                            </h3>
                                            <p className="text-xs text-slate-400 mt-1">
                                                {new Date(est.created_at).toLocaleDateString()}
                                            </p>
                                        </div>
                                        {selectedEstimateId === est.id && (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleDelete(est.id); }}
                                                className="text-red-400 hover:text-red-600 hover:bg-red-50 p-1 rounded"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* RIGHT MAIN AREA: WORKSPACE */}
                <div className="lg:col-span-3 h-full flex flex-col">
                    {/* If no selection, show Create New via Magic Estimate */}
                    {!selectedEstimateId ? (
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 flex flex-col items-center justify-center h-full text-center">
                            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4 text-blue-600">
                                <FileText size={32} />
                            </div>
                            <h2 className="text-xl font-bold text-slate-900">Create New Estimate</h2>
                            <p className="text-slate-500 max-w-md mt-2 mb-8">
                                Use the Magic Box below to create a new estimate from text, image, PDF, or Excel.
                            </p>

                            <div className="w-full max-w-2xl text-left">
                                <MagicEstimate onSuccess={handleNewEstimateCreated} />
                            </div>
                        </div>
                    ) : (
                        // ACTIVE WORKSPACE
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col h-full overflow-hidden">
                            {/* Header */}
                            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                <div>
                                    <h2 className="text-xl font-bold text-slate-900">
                                        {savedEstimates.find(e => e.id === selectedEstimateId)?.name}
                                    </h2>
                                    <p className="text-xs text-slate-500">
                                        {itemsMap[selectedEstimateId]?.length || 0} items
                                    </p>
                                </div>
                                <button className="text-slate-400 hover:text-slate-600" onClick={() => setSelectedEstimateId(null)}><X size={20} /></button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6">
                                {/* MAGIC ESTIMATE BOX - ALWAYS VISIBLE HERE */}
                                <div className="mb-8">
                                    <MagicEstimate
                                        estimateId={selectedEstimateId}
                                        onSuccess={() => fetchItems(selectedEstimateId)}
                                    />
                                </div>

                                {/* ITEMS TABLE */}
                                <div className="border border-slate-200 rounded-lg overflow-hidden">
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
                                            <tr>
                                                <th className="px-4 py-3">Description</th>
                                                <th className="px-4 py-3 text-center">Unit</th>
                                                <th className="px-4 py-3 text-center">Qty</th>
                                                <th className="px-4 py-3 text-right">Rate</th>
                                                <th className="px-4 py-3 text-right">Amount</th>
                                                <th className="px-4 py-3">Category</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {itemsMap[selectedEstimateId]?.map(item => (
                                                <tr key={item.id} className="hover:bg-slate-50">
                                                    <td className="px-4 py-3 font-medium text-slate-700">{item.description}</td>
                                                    <td className="px-4 py-3 text-center text-slate-500">{item.unit}</td>
                                                    <td className="px-4 py-3 text-center font-mono">{item.quantity}</td>
                                                    <td className="px-4 py-3 text-right font-mono text-slate-600">₹{item.rate}</td>
                                                    <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">
                                                        ₹{(item.amount || 0).toLocaleString()}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className="px-2 py-1 bg-slate-100 rounded text-xs text-slate-600">{item.category}</span>
                                                    </td>
                                                </tr>
                                            ))}
                                            {(!itemsMap[selectedEstimateId] || itemsMap[selectedEstimateId].length === 0) && (
                                                <tr>
                                                    <td colSpan={6} className="p-8 text-center text-slate-400 italic">
                                                        No items yet. Use the Magic Estimate box above to add some!
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                                {/* MANUAL ENTRY SECTION */}
                                <div className="mt-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
                                    <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                                        <Plus size={16} />
                                        Add Manual / Lump Sum Item
                                    </h3>
                                    <div className="flex gap-3 items-end">
                                        <div className="flex-1">
                                            <label className="block text-xs font-medium text-slate-500 mb-1">Description</label>
                                            <input
                                                type="text"
                                                placeholder="e.g. Miscellaneous Expenses"
                                                value={manualDescription}
                                                onChange={e => setManualDescription(e.target.value)}
                                                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                        <div className="w-40">
                                            <label className="block text-xs font-medium text-slate-500 mb-1">Amount (₹)</label>
                                            <input
                                                type="number"
                                                placeholder="0.00"
                                                value={manualAmount}
                                                onChange={e => setManualAmount(e.target.value)}
                                                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                                            />
                                        </div>
                                        <button
                                            onClick={handleManualAdd}
                                            disabled={loading || !manualDescription || !manualAmount}
                                            className="px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-md hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        >
                                            Add Item
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
