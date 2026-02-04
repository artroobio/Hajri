import { useState, useEffect } from 'react'
import { Project } from '@/types'
import { Save, Plus, Trash2, CheckSquare, Square } from 'lucide-react'

interface ProjectMetadataProps {
    project: Project | null
    onSave: (data: Partial<Project>) => Promise<void>
}

const CONSTRUCTION_TYPES = [
    "Civil",
    "Waterproofing",
    "Structural Repair",
    "Painting",
    "Tiling",
    "Plumbing",
    "Electrical",
    "Fabrication",
    "Interior"
]

export default function ProjectMetadata({ project, onSave }: ProjectMetadataProps) {
    const [formData, setFormData] = useState<Partial<Project>>({
        client_name: '',
        site_address: '',
        architect_name: '',
        engineer_name: '',
        construction_types: [],
        project_team: []
    })
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        if (project) {
            setFormData({
                client_name: project.client_name || '',
                site_address: project.site_address || '',
                gst_number: project.gst_number || '',
                phone: project.phone || '',
                project_start_date: project.project_start_date || '',
                architect_name: project.architect_name || '',
                engineer_name: project.engineer_name || '',
                construction_types: project.construction_types || [],
                project_team: project.project_team || []
            })
        }
    }, [project])

    const handleChange = (field: keyof Project, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }))
    }

    const toggleConstructionType = (type: string) => {
        const current = formData.construction_types || []
        if (current.includes(type)) {
            handleChange('construction_types', current.filter(t => t !== type))
        } else {
            handleChange('construction_types', [...current, type])
        }
    }

    const addTeamMember = () => {
        const current = formData.project_team || []
        handleChange('project_team', [...current, { name: '', role: '' }])
    }

    const removeTeamMember = (index: number) => {
        const current = formData.project_team || []
        handleChange('project_team', current.filter((_, i) => i !== index))
    }

    const updateTeamMember = (index: number, field: 'name' | 'role', value: string) => {
        const current = [...(formData.project_team || [])]
        current[index] = { ...current[index], [field]: value }
        handleChange('project_team', current)
    }

    const handleSubmit = async () => {
        setSaving(true)
        try {
            await onSave(formData)
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="space-y-8">
            {/* Section 1: General Info */}
            <div className="bg-white/80 backdrop-blur-lg rounded-xl shadow-lg border border-white/30 p-6">
                <h3 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">General Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-500 mb-1">Client Name</label>
                        <input
                            type="text"
                            value={formData.client_name}
                            onChange={(e) => handleChange('client_name', e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                            placeholder="e.g. Acme Corp"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-500 mb-1">Architect Name</label>
                        <input
                            type="text"
                            value={formData.architect_name}
                            onChange={(e) => handleChange('architect_name', e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                            placeholder="e.g. John Doe"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-500 mb-1">Site Address</label>
                        <textarea
                            value={formData.site_address}
                            onChange={(e) => handleChange('site_address', e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all min-h-[80px]"
                            placeholder="e.g. 123 Construction Ave..."
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-500 mb-1">GST Number</label>
                        <input
                            type="text"
                            value={formData.gst_number || ''}
                            onChange={(e) => handleChange('gst_number', e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                            placeholder="e.g. 29ABCDE1234F1Z5"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-500 mb-1">Phone Number</label>
                        <input
                            type="tel"
                            value={formData.phone || ''}
                            onChange={(e) => handleChange('phone', e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                            placeholder="e.g. +91 98765 43210"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-500 mb-1">Project Start Date</label>
                        <input
                            type="date"
                            value={formData.project_start_date || ''}
                            onChange={(e) => handleChange('project_start_date', e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-500 mb-1">Engineer Name</label>
                        <input
                            type="text"
                            value={formData.engineer_name}
                            onChange={(e) => handleChange('engineer_name', e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                            placeholder="e.g. Jane Smith"
                        />
                    </div>
                </div>
            </div>

            {/* Section 2: Scope of Work */}
            <div className="bg-white/80 backdrop-blur-lg rounded-xl shadow-lg border border-white/30 p-6">
                <h3 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">Scope of Work</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    {CONSTRUCTION_TYPES.map(type => {
                        const isSelected = formData.construction_types?.includes(type)
                        return (
                            <button
                                key={type}
                                onClick={() => toggleConstructionType(type)}
                                className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${isSelected
                                    ? 'bg-purple-50 border-purple-200 text-purple-700 shadow-sm'
                                    : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                                    }`}
                            >
                                {isSelected ? <CheckSquare size={18} className="text-purple-600" /> : <Square size={18} />}
                                <span className="text-sm font-medium">{type}</span>
                            </button>
                        )
                    })}
                </div>
            </div>

            {/* Section 3: Project Team */}
            <div className="bg-white/80 backdrop-blur-lg rounded-xl shadow-lg border border-white/30 p-6">
                <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-2">
                    <h3 className="text-lg font-bold text-slate-800">Project Team</h3>
                    <button
                        onClick={addTeamMember}
                        className="flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg transition-colors"
                    >
                        <Plus size={16} /> Add Person
                    </button>
                </div>

                <div className="space-y-3">
                    {formData.project_team?.map((member, index) => (
                        <div key={index} className="flex gap-4 items-start animate-fade-in-up">
                            <div className="flex-1">
                                <input
                                    type="text"
                                    value={member.name}
                                    onChange={(e) => updateTeamMember(index, 'name', e.target.value)}
                                    className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder:text-slate-300"
                                    placeholder="Name"
                                />
                            </div>
                            <div className="flex-1">
                                <input
                                    type="text"
                                    value={member.role}
                                    onChange={(e) => updateTeamMember(index, 'role', e.target.value)}
                                    className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder:text-slate-300"
                                    placeholder="Role (e.g. Safety Officer)"
                                />
                            </div>
                            <button
                                onClick={() => removeTeamMember(index)}
                                className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors mt-0.5"
                                title="Remove Person"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    ))}
                    {(!formData.project_team || formData.project_team.length === 0) && (
                        <div className="text-center py-8 text-slate-400 border-2 border-dashed border-slate-200 rounded-lg">
                            No team members added yet. Click "Add Person" to start.
                        </div>
                    )}
                </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end pt-4">
                <button
                    onClick={handleSubmit}
                    disabled={saving}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-xl shadow-lg shadow-blue-200 transition-all disabled:opacity-70 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95"
                >
                    <Save size={20} />
                    {saving ? 'Saving...' : 'Save Projects Details'}
                </button>
            </div>
        </div >
    )
}
