import { useState } from 'react'
import { supabase } from '@/utils/supabase/client'
import { X } from 'lucide-react'
import toast from 'react-hot-toast'

interface AddProjectModalProps {
    isOpen: boolean
    onClose: () => void
    onSuccess: () => void
}

export default function AddProjectModal({ isOpen, onClose, onSuccess }: AddProjectModalProps) {
    const [saving, setSaving] = useState(false)
    const [formData, setFormData] = useState({
        name: '',
        client_name: '',
        site_address: '',
        phone: '',
        gst_number: '',
        architect_name: '',
        engineer_name: '',
        project_start_date: ''
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!formData.name.trim()) {
            toast.error('Project name is required')
            return
        }

        setSaving(true)
        try {
            const { data, error } = await supabase
                .from('projects')
                .insert([{
                    name: formData.name,
                    client_name: formData.client_name || null,
                    site_address: formData.site_address || null,
                    phone: formData.phone || null,
                    gst_number: formData.gst_number || null,
                    architect_name: formData.architect_name || null,
                    engineer_name: formData.engineer_name || null,
                    project_start_date: formData.project_start_date || null
                }])
                .select()

            if (error) {
                console.error('Supabase error details:', error)
                console.error('Error message:', error.message)
                console.error('Error code:', error.code)
                console.error('Error details:', error.details)
                throw error
            }

            console.log('Project created successfully:', data)
            toast.success('Project created successfully!')
            setFormData({
                name: '',
                client_name: '',
                site_address: '',
                phone: '',
                gst_number: '',
                architect_name: '',
                engineer_name: '',
                project_start_date: ''
            })
            onSuccess()
            onClose()
        } catch (error: any) {
            console.error('Error creating project:', error)
            const errorMessage = error?.message || 'Failed to create project'
            toast.error(`Failed to create project: ${errorMessage}`)
        } finally {
            setSaving(false)
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900">New Project</h2>
                        <p className="text-sm text-slate-500 mt-1">Create a new construction project</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                    >
                        <X size={20} className="text-slate-500" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Project Name */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                            Project Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                            placeholder="e.g., Residential Complex - Phase 2"
                            required
                        />
                    </div>

                    {/* Client Name */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                            Client Name
                        </label>
                        <input
                            type="text"
                            value={formData.client_name}
                            onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                            placeholder="Client or company name"
                        />
                    </div>

                    {/* Site Address */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                            Site Address
                        </label>
                        <textarea
                            value={formData.site_address}
                            onChange={(e) => setFormData({ ...formData, site_address: e.target.value })}
                            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none"
                            rows={3}
                            placeholder="Construction site address"
                        />
                    </div>

                    {/* Phone & GST Number */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                Phone Number
                            </label>
                            <input
                                type="tel"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                placeholder="Contact number"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                GST Number
                            </label>
                            <input
                                type="text"
                                value={formData.gst_number}
                                onChange={(e) => setFormData({ ...formData, gst_number: e.target.value })}
                                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                placeholder="GST number"
                            />
                        </div>
                    </div>

                    {/* Architect & Engineer */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                Architect Name
                            </label>
                            <input
                                type="text"
                                value={formData.architect_name}
                                onChange={(e) => setFormData({ ...formData, architect_name: e.target.value })}
                                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                placeholder="Project architect"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                Engineer Name
                            </label>
                            <input
                                type="text"
                                value={formData.engineer_name}
                                onChange={(e) => setFormData({ ...formData, engineer_name: e.target.value })}
                                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                placeholder="Project engineer"
                            />
                        </div>
                    </div>

                    {/* Project Start Date */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                            Project Start Date
                        </label>
                        <input
                            type="date"
                            value={formData.project_start_date}
                            onChange={(e) => setFormData({ ...formData, project_start_date: e.target.value })}
                            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-4 border-t border-slate-200">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={saving}
                            className="flex-1 px-6 py-3 border border-slate-300 text-slate-700 rounded-lg font-semibold hover:bg-slate-50 transition-colors disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {saving ? 'Creating...' : 'Create Project'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
