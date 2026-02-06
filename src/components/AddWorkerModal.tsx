
import { useState } from 'react'
import { supabase } from '@/utils/supabase/client'
import { Plus, X, Upload } from 'lucide-react'
import toast from 'react-hot-toast'
import { createPortal } from 'react-dom'

interface AddWorkerModalProps {
    isOpen: boolean
    onClose: () => void
    onSuccess: () => void
}

export default function AddWorkerModal({ isOpen, onClose, onSuccess }: AddWorkerModalProps) {
    const [name, setName] = useState('')
    const [phone, setPhone] = useState('')
    const [skillType, setSkillType] = useState('Laborer') // Default Laborer
    const [dailyWage, setDailyWage] = useState('')

    // KYC Fields
    const [gender, setGender] = useState('Male')
    const [age, setAge] = useState('')
    const [address, setAddress] = useState('')
    const [alternatePhone, setAlternatePhone] = useState('')
    const [aadhaar, setAadhaar] = useState('')
    const [selectedFile, setSelectedFile] = useState<File | null>(null)

    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            let idDocUrl = null

            // 1. Handle File Upload if exists
            if (selectedFile) {
                const fileExt = selectedFile.name.split('.').pop()
                const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`
                const filePath = `${fileName}`

                const { error: uploadError } = await supabase.storage
                    .from('worker-docs')
                    .upload(filePath, selectedFile)

                if (uploadError) {
                    throw new Error('Image upload failed: ' + uploadError.message)
                }

                const { data } = supabase.storage
                    .from('worker-docs')
                    .getPublicUrl(filePath)

                idDocUrl = data.publicUrl
            }

            // DB expects 'name' and 'phone', but our internal variable is name/phone
            const { error } = await supabase
                .from('workers')
                .insert([{
                    full_name: name,
                    phone_number: phone || null,
                    skill_type: skillType,
                    daily_wage: dailyWage ? parseFloat(dailyWage) : 0,
                    status: 'active',
                    // KYC Fields
                    gender: gender,
                    age: age ? parseInt(age) : null,
                    address: address || null,
                    alternate_phone: alternatePhone || null,
                    aadhaar_number: aadhaar || null,
                    id_document_url: idDocUrl,
                }])

            if (error) throw error

            // Update list immediately
            await onSuccess()

            // Reset form
            setName('')
            setPhone('')
            setSkillType('Laborer')
            setDailyWage('')
            // Reset KYC
            setGender('Male')
            setAge('')
            setAddress('')
            setAlternatePhone('')
            setAadhaar('')
            setSelectedFile(null)

            onClose()
        } catch (error: any) {
            console.error('Error adding worker:', error)
            toast.error('Failed to add worker: ' + error.message)
        } finally {
            setLoading(false)
        }
    }

    if (!isOpen) return null

    return createPortal(
        <div className="fixed inset-0 bg-black/50 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md flex flex-col max-h-[85vh] animate-in fade-in zoom-in duration-200">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <h3 className="text-lg font-semibold text-gray-900">Add New Worker</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-500 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="overflow-y-auto p-6">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                            <input
                                type="text"
                                required
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 outline-none transition-all"
                                placeholder="Enter name"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                                <select
                                    value={gender}
                                    onChange={(e) => setGender(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 outline-none transition-all bg-white"
                                >
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
                                <input
                                    type="number"
                                    value={age}
                                    onChange={(e) => setAge(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 outline-none transition-all"
                                    placeholder="Age"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                            <textarea
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                                rows={2}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 outline-none transition-all resize-none"
                                placeholder="Full Address"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                            <input
                                type="tel"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 outline-none transition-all"
                                placeholder="9876543210"
                            />
                        </div>



                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Upload Photo ID / Aadhaar Card</label>
                            <div className="relative">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => {
                                        if (e.target.files && e.target.files[0]) {
                                            setSelectedFile(e.target.files[0])
                                        }
                                    }}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 outline-none transition-all file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-slate-50 file:text-slate-700 hover:file:bg-slate-100"
                                />
                                {!selectedFile && (
                                    <div className="absolute right-3 top-2.5 pointer-events-none text-slate-400">
                                        <Upload size={20} />
                                    </div>
                                )}
                            </div>
                            <p className="text-xs text-slate-500 mt-1">Supported formats: JPEG, PNG</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Alternate Phone</label>
                                <input
                                    type="tel"
                                    value={alternatePhone}
                                    onChange={(e) => setAlternatePhone(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 outline-none transition-all"
                                    placeholder="Optional"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Aadhaar Number</label>
                                <input
                                    type="text"
                                    maxLength={12}
                                    value={aadhaar}
                                    onChange={(e) => setAadhaar(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 outline-none transition-all"
                                    placeholder="12-digit ID"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Skill Type</label>
                                <select
                                    value={skillType}
                                    onChange={(e) => setSkillType(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 outline-none transition-all bg-white"
                                >
                                    <option value="Laborer">Laborer</option>
                                    <option value="Mason">Mason</option>
                                    <option value="Carpenter">Carpenter</option>
                                    <option value="Electrician">Electrician</option>
                                    <option value="Plumber">Plumber</option>
                                    <option value="Supervisor">Supervisor</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Daily Wage (₹)</label>
                                <input
                                    type="number"
                                    required
                                    value={dailyWage}
                                    onChange={(e) => setDailyWage(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 outline-none transition-all"
                                    placeholder="e.g. 500"
                                />
                            </div>
                        </div>

                        <div className="pt-4 flex gap-3 justify-end">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex items-center gap-2 px-6 py-2 text-sm font-medium text-white bg-slate-800 rounded-lg hover:bg-slate-900 disabled:opacity-50 transition-colors"
                            >
                                {loading ? 'Adding...' : <><Plus size={16} /> Add Worker</>}
                            </button>
                        </div>
                    </form>
                </div>
            </div >
        </div>,
        document.body
    )
}

