import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface ProjectContextType {
    selectedProjectId: string | null
    setSelectedProjectId: (id: string | null) => void
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined)

export function ProjectProvider({ children }: { children: ReactNode }) {
    const [selectedProjectId, setSelectedProjectId] = useState<string | null>(() => {
        // Load from localStorage on initial mount
        const stored = localStorage.getItem('selectedProjectId')
        return stored || null
    })

    // Persist to localStorage whenever it changes
    useEffect(() => {
        if (selectedProjectId) {
            localStorage.setItem('selectedProjectId', selectedProjectId)
        } else {
            localStorage.removeItem('selectedProjectId')
        }
    }, [selectedProjectId])

    return (
        <ProjectContext.Provider value={{ selectedProjectId, setSelectedProjectId }}>
            {children}
        </ProjectContext.Provider>
    )
}

export function useProject() {
    const context = useContext(ProjectContext)
    if (context === undefined) {
        throw new Error('useProject must be used within a ProjectProvider')
    }
    return context
}
