import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/utils/supabase/client'
import { Project } from '@/types'
import ProjectMetadata from '@/components/ProjectMetadata'
import { Settings, ArrowLeft } from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'

export default function ProjectDetails() {
    const [project, setProject] = useState<Project | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchProject()
    }, [])

    const fetchProject = async () => {
        setLoading(true)
        try {
            // Fetch the first project found (acting as the "active" project for now)
            const { data, error } = await supabase
                .from('projects')
                .select('*')
                .limit(1)
                .single()

            if (error && error.code !== 'PGRST116') { // PGRST116 is "Row not found" which is fine initially
                console.error('Error fetching project:', error)
                toast.error('Failed to load project details')
            }

            if (data) {
                setProject(data)
            }
        } catch (error) {
            console.error('Error:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleSave = async (updatedData: Partial<Project>) => {
        try {
            if (project?.id) {
                // Update existing
                const { error } = await supabase
                    .from('projects')
                    .update(updatedData)
                    .eq('id', project.id)

                if (error) throw error
                toast.success('Project details updated!')
            } else {
                // Create new
                const { error } = await supabase
                    .from('projects')
                    .insert([updatedData])

                if (error) throw error
                toast.success('Project details created!')
                fetchProject() // Reload to get the new ID
            }
        } catch (error) {
            console.error('Error saving project:', error)
            toast.error('Failed to save project details')
        }
    }

    return (
        <div className="min-h-screen bg-slate-50/50 pb-20">
            <Toaster position="top-right" />

            {/* Header */}
            <div className="bg-white/80 backdrop-blur-md sticky top-0 z-30 border-b border-slate-200 px-6 py-4">
                <div className="flex items-center gap-4">
                    <Link to="/" className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors">
                        <ArrowLeft size={20} />
                    </Link>
                    <div>
                        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                            <Settings className="text-blue-600" size={24} />
                            Project Details
                        </h1>
                        <p className="text-xs text-slate-500">Manage site settings and scope</p>
                    </div>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-6 py-8">
                {loading ? (
                    <div className="flex items-center justify-center p-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                ) : (
                    <ProjectMetadata project={project} onSave={handleSave} />
                )}
            </div>
        </div>
    )
}
