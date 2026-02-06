

import { useState } from 'react'
import { supabase } from '@/utils/supabase/client'
import { useProject } from '@/context/ProjectContext'
import toast from 'react-hot-toast'

interface AddMemberModalProps {
    isOpen: boolean
    onClose: () => void
    onSuccess: () => void
}

export default function AddMemberModal({ isOpen, onClose, onSuccess }: AddMemberModalProps) {
    const { selectedProjectId } = useProject()
    const [name, setName] = useState('')
    const [phone, setPhone] = useState('')
    const [skillType, setSkillType] = useState('Helper')
    const [dailyWage, setDailyWage] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        // Validation: require a project to be selected
        if (!selectedProjectId) {
            toast.error('Please select a project from the dashboard before adding workers')
            return
        }

        setLoading(true)

        try {
            const { error } = await supabase
                .from('workers')
                .insert([{
                    name,
                    phone: phone || null,
                    skill_type: skillType,
                    daily_wage: dailyWage ? parseFloat(dailyWage) : 0,
                    project_id: selectedProjectId
                }])

            if (error) throw error

            // Reset
            setName('')
            setPhone('')
            setSkillType('Helper')
            setDailyWage('')
            onSuccess()
            onClose()
        } catch (error: any) {
            console.error('Error adding worker:', error)
            toast.error('Failed to add worker: ' + error.message)
        } finally {
            setLoading(false)
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <h3 className="text-lg font-semibold text-gray-900">Add New Worker</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-500 transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Worker Name</label>
                        <input
                            type="text"
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 outline-none transition-all"
                            placeholder="Enter name"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number (Optional)</label>
                        <input
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 outline-none transition-all"
                            placeholder="9876543210"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Skill Type</label>
                            <select
                                value={skillType}
                                onChange={(e) => setSkillType(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 outline-none transition-all bg-white"
                            >
                                <option value="Helper">Helper</option>
                                <option value="Mason">Mason</option>
                                <option value="Carpenter">Carpenter</option>
                                <option value="Painter">Painter</option>
                                <option value="Plumber">Plumber</option>
                                <option value="Electrician">Electrician</option>
                                <option value="Supervisor">Supervisor</option>
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
                            className="px-6 py-2 text-sm font-medium text-white bg-slate-800 rounded-lg hover:bg-slate-900 disabled:opacity-50 transition-colors"
                        >
                            {loading ? 'Adding...' : 'Add Worker'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
