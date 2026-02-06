import { useEffect, useState } from 'react'
import { supabase } from '@/utils/supabase/client'
import { Project } from '@/types'
import { FolderKanban, Plus, MapPin, Phone, Calendar, ChevronRight, User } from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'
import AddProjectModal from '@/components/AddProjectModal'
import { format } from 'date-fns'

export default function Projects() {
    const [projects, setProjects] = useState<Project[]>([])
    const [loading, setLoading] = useState(true)
    const [isAddModalOpen, setIsAddModalOpen] = useState(false)
    const [expandedProject, setExpandedProject] = useState<string | null>(null)

    useEffect(() => {
        fetchProjects()
    }, [])

    const fetchProjects = async () => {
        setLoading(true)
        try {
            const { data, error } = await supabase
                .from('projects')
                .select('*')
                .order('created_at', { ascending: false })

            if (error) throw error
            setProjects(data || [])
        } catch (error) {
            console.error('Error fetching projects:', error)
            toast.error('Failed to load projects')
        } finally {
            setLoading(false)
        }
    }

    const toggleExpand = (projectId: string) => {
        setExpandedProject(expandedProject === projectId ? null : projectId)
    }

    return (
        <div className="min-h-screen bg-slate-50/50 pb-20">
            <Toaster position="top-right" />

            {/* Header */}
            <div className="bg-white/80 backdrop-blur-md sticky top-0 z-30 border-b border-slate-200 px-6 py-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                            <FolderKanban className="text-blue-600" size={28} />
                            Projects
                        </h1>
                        <p className="text-sm text-slate-500 mt-1">Manage all your construction projects</p>
                    </div>
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-sm hover:shadow-md"
                    >
                        <Plus size={20} />
                        New Project
                    </button>
                </div>
            </div>

            {/* Projects Grid */}
            <div className="max-w-7xl mx-auto px-6 py-8">
                {loading ? (
                    <div className="flex items-center justify-center p-12">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
                    </div>
                ) : projects.length === 0 ? (
                    <div className="text-center py-16">
                        <div className="inline-flex items-center justify-center w-20 h-20 bg-slate-100 rounded-full mb-4">
                            <FolderKanban size={40} className="text-slate-400" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-700 mb-2">No projects yet</h3>
                        <p className="text-slate-500 mb-6">Create your first project to get started</p>
                        <button
                            onClick={() => setIsAddModalOpen(true)}
                            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                        >
                            <Plus size={20} />
                            Create Project
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {projects.map((project) => {
                            const isExpanded = expandedProject === project.id
                            return (
                                <div
                                    key={project.id}
                                    className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-all"
                                >
                                    {/* Card Header */}
                                    <div
                                        className="p-6 cursor-pointer"
                                        onClick={() => toggleExpand(project.id)}
                                    >
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-blue-100 rounded-lg">
                                                    <FolderKanban size={24} className="text-blue-600" />
                                                </div>
                                                <div>
                                                    <h3 className="text-lg font-bold text-slate-900 line-clamp-1">
                                                        {project.name || 'Unnamed Project'}
                                                    </h3>
                                                    {project.client_name && (
                                                        <p className="text-sm text-slate-500 flex items-center gap-1">
                                                            <User size={12} />
                                                            {project.client_name}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                            <ChevronRight
                                                size={20}
                                                className={`text-slate-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                                            />
                                        </div>

                                        {/* Quick Info */}
                                        <div className="space-y-2 text-sm text-slate-600">
                                            {project.site_address && (
                                                <div className="flex items-start gap-2">
                                                    <MapPin size={14} className="text-slate-400 mt-0.5 flex-shrink-0" />
                                                    <span className="line-clamp-2">{project.site_address}</span>
                                                </div>
                                            )}
                                            {project.created_at && (
                                                <div className="flex items-center gap-2 text-xs text-slate-400">
                                                    <Calendar size={12} />
                                                    Created {format(new Date(project.created_at), 'MMM dd, yyyy')}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Expanded Details */}
                                    {isExpanded && (
                                        <div className="px-6 pb-6 pt-0 border-t border-slate-100 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                                            {project.phone && (
                                                <div className="flex items-center gap-2 text-sm">
                                                    <Phone size={14} className="text-slate-400" />
                                                    <span className="text-slate-700">{project.phone}</span>
                                                </div>
                                            )}
                                            {project.gst_number && (
                                                <div className="text-sm">
                                                    <span className="font-semibold text-slate-600">GST:</span>{' '}
                                                    <span className="text-slate-700">{project.gst_number}</span>
                                                </div>
                                            )}
                                            {project.architect_name && (
                                                <div className="text-sm">
                                                    <span className="font-semibold text-slate-600">Architect:</span>{' '}
                                                    <span className="text-slate-700">{project.architect_name}</span>
                                                </div>
                                            )}
                                            {project.engineer_name && (
                                                <div className="text-sm">
                                                    <span className="font-semibold text-slate-600">Engineer:</span>{' '}
                                                    <span className="text-slate-700">{project.engineer_name}</span>
                                                </div>
                                            )}
                                            {project.project_start_date && (
                                                <div className="text-sm">
                                                    <span className="font-semibold text-slate-600">Start Date:</span>{' '}
                                                    <span className="text-slate-700">
                                                        {format(new Date(project.project_start_date), 'MMM dd, yyyy')}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>

            {/* Add Project Modal */}
            <AddProjectModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onSuccess={fetchProjects}
            />
        </div>
    )
}
