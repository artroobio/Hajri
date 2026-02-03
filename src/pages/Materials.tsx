import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/utils/supabase/client'
import { MaterialType, Expense } from '@/types'
import { Plus, X, Camera, Upload, Coins, ClipboardList, Clock, BrickWall, Hammer, PaintBucket, Box, Shovel, Info, Trash2 } from 'lucide-react'
import { useTheme } from '@/context/ThemeContext'
import { format } from 'date-fns'

// Helper to get icon based on name (simple heuristic)
const getMaterialIcon = (name: string) => {
    const lower = name.toLowerCase()
    if (lower.includes('brick')) return <BrickWall size={32} />
    if (lower.includes('cement') || lower.includes('concrete')) return <Box size={32} /> // Approximation
    if (lower.includes('sand') || lower.includes('soil')) return <Shovel size={32} />
    if (lower.includes('paint')) return <PaintBucket size={32} />
    if (lower.includes('steel') || lower.includes('iron')) return <Hammer size={32} />
    return <Box size={32} />
}

export default function Materials() {
    const [materials, setMaterials] = useState<MaterialType[]>([])
    const [recentExpenses, setRecentExpenses] = useState<Expense[]>([])
    const [loading, setLoading] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    // Modal State
    const [selectedMaterial, setSelectedMaterial] = useState<MaterialType | null>(null)
    const [showAddMaterialModal, setShowAddMaterialModal] = useState(false)

    // Form inputs for Bill
    const [amount, setAmount] = useState('')
    const [vendor, setVendor] = useState('')
    const [billPhoto, setBillPhoto] = useState<File | null>(null)
    const [photoPreview, setPhotoPreview] = useState<string | null>(null)

    // Form inputs for New Material
    const [newMaterialName, setNewMaterialName] = useState('')

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        // Fetch Material Types
        const { data: mats } = await supabase
            .from('material_types')
            .select('*')
            .order('name')
        if (mats) setMaterials(mats)

        // Fetch Recent Expenses
        const { data: exps } = await supabase
            .from('expenses')
            .select('*, material_types(name)')
            .order('created_at', { ascending: false })
            .limit(5)

        if (exps) setRecentExpenses(exps as unknown as Expense[])
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this bill?')) return

        loading || setLoading(true) // Optional UI feedback
        try {
            const { error } = await supabase.from('expenses').delete().eq('id', id)
            if (error) throw error

            // Optimistic update
            setRecentExpenses(prev => prev.filter(e => e.id !== id))
        } catch (error) {
            console.error('Error deleting bill:', error)
            alert('Failed to delete bill')
        } finally {
            setLoading(false)
        }
    }

    const resetBillForm = () => {
        setAmount('')
        setVendor('')
        setBillPhoto(null)
        setPhotoPreview(null)
        setSelectedMaterial(null)
    }

    const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            setBillPhoto(file)
            const reader = new FileReader()
            reader.onloadend = () => setPhotoPreview(reader.result as string)
            reader.readAsDataURL(file)
        }
    }

    const handleSaveBill = async () => {
        if (!selectedMaterial || !amount) {
            alert('Please enter amount')
            return
        }

        setLoading(true)
        try {
            let photoUrl = null

            // 1. Upload Photo if exists
            if (billPhoto) {
                const fileName = `${Date.now()}-${billPhoto.name}`
                const { data: uploadData, error: uploadError } = await supabase.storage
                    .from('bills')
                    .upload(`${fileName}`, billPhoto)

                if (uploadError) {
                    // Try to proceed without photo if bucket fails (common user issue)
                    console.error('Photo upload failed (Bucket "bills" likely missing):', uploadError)
                    if (!confirm('Photo upload failed. Save bill without photo?')) return
                } else if (uploadData) {
                    // Get public url
                    const { data: publicData } = supabase.storage.from('bills').getPublicUrl(uploadData.path)
                    photoUrl = publicData.publicUrl
                }
            }

            // 2. Insert Expense
            const { error } = await supabase.from('expenses').insert([{
                material_id: selectedMaterial.id,
                category: 'Material',
                amount: parseFloat(amount),
                description: vendor || 'Quick Entry',
                photo_url: photoUrl,
                date: new Date().toISOString().split('T')[0]
            }])

            if (error) throw error

            resetBillForm()
            fetchData() // Refresh list
            // alert('Bill saved!') // Optional: maybe too annoying?

        } catch (error: any) {
            console.error(error)
            alert('Failed to save bill')
        } finally {
            setLoading(false)
        }
    }

    const handleCreateMaterial = async () => {
        if (!newMaterialName) return
        setLoading(true)
        try {
            const { error } = await supabase.from('material_types').insert([{ name: newMaterialName }])
            if (error) throw error
            setNewMaterialName('')
            setShowAddMaterialModal(false)
            fetchData()
        } catch (error) {
            alert('Failed to create material')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen pb-24 space-y-6">
            <header>
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Expense & Bill Logger</h1>
                <p className="text-slate-500 mt-1">Quickly ensure all material bills are recorded.</p>
            </header>

            {/* MATERIAL GRID */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {materials.map(mat => (
                    <button
                        key={mat.id}
                        onClick={() => setSelectedMaterial(mat)}
                        className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md hover:border-blue-300 transition-all flex flex-col items-center justify-center gap-3 group active:scale-95"
                    >
                        <div className="w-16 h-16 rounded-full bg-slate-50 text-slate-600 flex items-center justify-center group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                            {getMaterialIcon(mat.name)}
                        </div>
                        <span className="font-bold text-slate-700 text-lg text-center leading-tight">{mat.name}</span>
                    </button>
                ))}

                {/* Add New Card */}
                <button
                    onClick={() => setShowAddMaterialModal(true)}
                    className="bg-slate-50 p-6 rounded-2xl border-2 border-dashed border-slate-300 hover:border-slate-400 hover:bg-slate-100 transition-all flex flex-col items-center justify-center gap-3 text-slate-400 hover:text-slate-600"
                >
                    <div className="w-16 h-16 rounded-full border-2 border-current flex items-center justify-center">
                        <Plus size={32} />
                    </div>
                    <span className="font-bold text-sm uppercase tracking-wider">Add New Type</span>
                </button>
            </div>

            {/* RECENT BILLS LIST */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center gap-2">
                    <Clock size={16} className="text-slate-400" />
                    <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wide">Recent Bills</h3>
                </div>
                <div className="divide-y divide-slate-50">
                    {recentExpenses.length === 0 ? (
                        <div className="p-8 text-center text-slate-400 text-sm">No bills recorded yet.</div>
                    ) : (
                        recentExpenses.map(exp => (
                            <div key={exp.id} className="p-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-lg bg-slate-100 flex-shrink-0 flex items-center justify-center overflow-hidden border border-slate-200">
                                        {(exp as any).photo_url ? (
                                            /* eslint-disable-next-line @next/next/no-img-element */
                                            <img src={(exp as any).photo_url} alt="Bill" className="w-full h-full object-cover" />
                                        ) : (
                                            <ClipboardList size={20} className="text-slate-400" />
                                        )}
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-900">{(exp as any).material_types?.name || 'Material'}</p>
                                        <p className="text-xs text-slate-500">
                                            {format(new Date(exp.created_at), 'dd MMM')} • {exp.description || 'No desc'}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="font-mono font-bold text-slate-900">₹{exp.amount.toLocaleString()}</span>
                                    <button
                                        onClick={() => handleDelete(exp.id)}
                                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                        title="Delete Bill"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* BILL ENTRY MODAL (Bottom Sheet style on Mobile) */}
            {
                selectedMaterial && (
                    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                        <div className="bg-white w-full max-w-md rounded-t-2xl md:rounded-2xl shadow-2xl p-6 space-y-6 animate-in slide-in-from-bottom-10 duration-300">
                            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                        {getMaterialIcon(selectedMaterial.name)}
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-slate-900 leading-none">{selectedMaterial.name} Bill</h2>
                                        <p className="text-sm text-slate-500 mt-1">Enter details below</p>
                                    </div>
                                </div>
                                <button onClick={resetBillForm} className="text-slate-400 hover:text-slate-600 p-2"><X size={24} /></button>
                            </div>

                            <div className="space-y-4">
                                {/* Amount Input */}
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Bill Amount (₹)</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-slate-300">₹</span>
                                        <input
                                            type="number"
                                            placeholder="0"
                                            autoFocus
                                            className="w-full pl-10 pr-4 py-4 text-3xl font-bold text-slate-900 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-0 outline-none transition-colors placeholder:text-slate-300"
                                            value={amount}
                                            onChange={e => setAmount(e.target.value)}
                                        />
                                    </div>
                                </div>

                                {/* Vendor / Description */}
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Vendor / Notes (Optional)</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Ramesh Hardware"
                                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:border-blue-500 outline-none"
                                        value={vendor}
                                        onChange={e => setVendor(e.target.value)}
                                    />
                                </div>

                                {/* Photo Upload */}
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Bill Photo</label>
                                    <div
                                        onClick={() => fileInputRef.current?.click()}
                                        className={`relative h-32 border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden ${photoPreview ? 'border-blue-500 bg-blue-50' : 'border-slate-300 hover:bg-slate-50 hover:border-slate-400'}`}
                                    >
                                        {photoPreview ? (
                                            <img src={photoPreview} alt="Preview" className="absolute inset-0 w-full h-full object-cover opacity-80" />
                                        ) : (
                                            <div className="text-slate-400 flex flex-col items-center gap-2">
                                                <Camera size={24} />
                                                <span className="text-sm font-medium">Tap to snap photo</span>
                                            </div>
                                        )}
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            className="hidden"
                                            accept="image/*"
                                            capture="environment" // Mobile camera trigger
                                            onChange={handlePhotoSelect}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="pt-2">
                                <button
                                    onClick={handleSaveBill}
                                    disabled={loading || !amount}
                                    className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold text-lg hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-slate-900/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                                >
                                    {loading ? 'Saving...' : 'Save Bill'}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* ADD NEW MATERIAL MODAL */}
            {
                showAddMaterialModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
                        <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl p-6 space-y-4">
                            <div className="flex justify-between items-center">
                                <h3 className="font-bold text-lg text-slate-900">Add New Category</h3>
                                <button onClick={() => setShowAddMaterialModal(false)}><X size={20} className="text-slate-400" /></button>
                            </div>
                            <input
                                placeholder="Category Name (e.g. Chai)"
                                autoFocus
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                                value={newMaterialName}
                                onChange={e => setNewMaterialName(e.target.value)}
                            />
                            <button
                                onClick={handleCreateMaterial}
                                disabled={!newMaterialName || loading}
                                className="w-full bg-blue-600 text-white py-2 rounded-lg font-bold hover:bg-blue-700 disabled:opacity-50"
                            >
                                Create
                            </button>
                        </div>
                    </div>
                )
            }
        </div >
    )
}
