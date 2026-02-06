import { useEffect, useState } from 'react'
import { supabase } from '@/utils/supabase/client'
import { Project } from '@/types'
import { ChevronDown, FolderKanban } from 'lucide-react'

interface ProjectSelectorProps {
    selectedProjectId: string | null
    onProjectChange: (projectId: string | null) => void
}

export default function ProjectSelector({ selectedProjectId, onProjectChange }: ProjectSelectorProps) {
    const [projects, setProjects] = useState<Project[]>([])
    const [isOpen, setIsOpen] = useState(false)
    const [loading, setLoading] = useState(true)

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

            // Auto-select first project if none selected and projects exist
            if (!selectedProjectId && data && data.length > 0) {
                onProjectChange(data[0].id)
            }
        } catch (error) {
            console.error('Error fetching projects:', error)
        } finally {
            setLoading(false)
        }
    }

    const selectedProject = projects.find(p => p.id === selectedProjectId)

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-3 px-4 py-2.5 bg-white rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 transition-all shadow-sm min-w-[280px]"
            >
                <div className="p-1.5 bg-blue-100 rounded-md">
                    <FolderKanban size={18} className="text-blue-600" />
                </div>
                <div className="flex-1 text-left">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Project</p>
                    {loading ? (
                        <p className="text-sm font-bold text-slate-700">Loading...</p>
                    ) : selectedProject ? (
                        <p className="text-sm font-bold text-slate-900 truncate">{selectedProject.name || 'Unnamed Project'}</p>
                    ) : (
                        <p className="text-sm font-bold text-slate-500">All Projects</p>
                    )}
                </div>
                <ChevronDown
                    size={16}
                    className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                />
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <>
                    {/* Overlay to close dropdown when clicking outside */}
                    <div
                        className="fixed inset-0 z-10"
                        onClick={() => setIsOpen(false)}
                    />

                    <div className="absolute top-full mt-2 left-0 bg-white rounded-lg border border-slate-200 shadow-xl min-w-[280px] z-20 overflow-hidden">
                        {/* All Projects Option */}
                        <button
                            onClick={() => {
                                onProjectChange(null)
                                setIsOpen(false)
                            }}
                            className={`w-full px-4 py-3 text-left hover:bg-slate-50 transition-colors flex items-center gap-3 ${selectedProjectId === null ? 'bg-blue-50 border-l-4 border-blue-600' : ''
                                }`}
                        >
                            <div className="flex-1">
                                <p className="text-sm font-bold text-slate-700">All Projects</p>
                                <p className="text-xs text-slate-400">View combined data</p>
                            </div>
                            {selectedProjectId === null && (
                                <div className="w-2 h-2 rounded-full bg-blue-600" />
                            )}
                        </button>

                        {/* Divider */}
                        {projects.length > 0 && <div className="border-t border-slate-100" />}

                        {/* Individual Projects */}
                        {projects.map((project) => (
                            <button
                                key={project.id}
                                onClick={() => {
                                    onProjectChange(project.id)
                                    setIsOpen(false)
                                }}
                                className={`w-full px-4 py-3 text-left hover:bg-slate-50 transition-colors flex items-center gap-3 ${selectedProjectId === project.id ? 'bg-blue-50 border-l-4 border-blue-600' : ''
                                    }`}
                            >
                                <FolderKanban size={16} className="text-slate-400" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-slate-900 truncate">
                                        {project.name || 'Unnamed Project'}
                                    </p>
                                    {project.client_name && (
                                        <p className="text-xs text-slate-400 truncate">{project.client_name}</p>
                                    )}
                                </div>
                                {selectedProjectId === project.id && (
                                    <div className="w-2 h-2 rounded-full bg-blue-600" />
                                )}
                            </button>
                        ))}

                        {/* No projects message */}
                        {projects.length === 0 && (
                            <div className="px-4 py-6 text-center text-slate-400 text-sm">
                                No projects found
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    )
}
