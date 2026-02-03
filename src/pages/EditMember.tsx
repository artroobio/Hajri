import { useEffect, useState } from 'react'
import { supabase } from '@/utils/supabase/client'
import { useParams, useNavigate } from 'react-router-dom'
import { Worker } from '@/types'
import { Save, User, Phone, MapPin, CreditCard, Award, FileText } from 'lucide-react'

export default function EditMember() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [formData, setFormData] = useState<Partial<Worker>>({})

    useEffect(() => {
        async function fetchWorker() {
            if (!id) return
            try {
                const { data, error } = await supabase
                    .from('workers')
                    .select('*')
                    .eq('id', id)
                    .single()

                if (error) throw error
                setFormData(data)
            } catch (error) {
                console.error('Error fetching worker:', error)
                alert('Failed to load worker data.')
                navigate('/workers')
            } finally {
                setLoading(false)
            }
        }
        fetchWorker()
    }, [id, navigate])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)
        try {
            const { error } = await supabase
                .from('workers')
                .update({
                    full_name: formData.full_name,
                    phone_number: formData.phone_number,
                    skill_type: formData.skill_type,
                    daily_wage: Number(formData.daily_wage),
                    address: formData.address,
                    aadhaar_number: formData.aadhaar_number,
                    status: formData.status
                })
                .eq('id', id)

            if (error) throw error

            alert('Worker Profile Updated')
            navigate(`/workers/${id}`)
        } catch (error: any) {
            console.error('Error updating worker:', error)
            alert('Failed to update: ' + error.message)
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-slate-50 p-4 md:p-8">
            <div className="max-w-2xl mx-auto">
                <header className="mb-6 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Edit Worker</h1>
                        <p className="text-slate-500">Update details for {formData.full_name}</p>
                    </div>
                    <button
                        type="button"
                        onClick={() => navigate(-1)}
                        className="text-slate-500 hover:text-slate-700 font-medium px-4 py-2 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-slate-200"
                    >
                        Cancel
                    </button>
                </header>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Core Info */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
                        <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
                            <User className="text-emerald-600" size={20} />
                            <h2 className="font-semibold text-slate-800">Personal Details</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                                <input
                                    name="full_name"
                                    value={formData.full_name || ''}
                                    onChange={handleChange}
                                    className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                    <input
                                        name="phone_number"
                                        value={formData.phone_number || ''}
                                        onChange={handleChange}
                                        className="w-full pl-9 p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
                            <div className="relative">
                                <MapPin className="absolute left-3 top-3 text-slate-400" size={16} />
                                <textarea
                                    name="address"
                                    value={formData.address || ''}
                                    onChange={handleChange}
                                    rows={2}
                                    className="w-full pl-9 p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none resize-none"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Job Details */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
                        <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
                            <Award className="text-emerald-600" size={20} />
                            <h2 className="font-semibold text-slate-800">Job & Payment</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Skill Type</label>
                                <select
                                    name="skill_type"
                                    value={formData.skill_type || ''}
                                    onChange={handleChange}
                                    className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none bg-white"
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
                                <label className="block text-sm font-medium text-slate-700 mb-1">Daily Wage (₹)</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold">₹</span>
                                    <input
                                        type="number"
                                        name="daily_wage"
                                        value={formData.daily_wage || ''}
                                        onChange={handleChange}
                                        className="w-full pl-8 p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none font-medium"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Aadhaar Number</label>
                            <div className="relative">
                                <FileText className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                <input
                                    name="aadhaar_number"
                                    value={formData.aadhaar_number || ''}
                                    onChange={handleChange}
                                    className="w-full pl-9 p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                                    placeholder="XXXX XXXX XXXX"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                            <select
                                name="status"
                                value={formData.status || 'active'}
                                onChange={handleChange}
                                className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none bg-white"
                            >
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-4">
                        <button
                            type="button"
                            onClick={() => navigate(-1)}
                            className="px-6 py-2.5 border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="px-6 py-2.5 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 shadow-lg shadow-emerald-600/20 flex items-center gap-2"
                        >
                            <Save size={18} />
                            {saving ? 'Saving Changes...' : 'Save Changes'}
                        </button>
                    </div>

                </form>
            </div>
        </div>
    )
}
