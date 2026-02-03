import { Outlet, Navigate } from 'react-router-dom'
import Sidebar from '@/components/Sidebar'
import { useAuth } from '@/context/AuthContext'
import { useTheme } from '@/context/ThemeContext'

export default function SidebarLayout() {
    const { user, loading } = useAuth()
    const { bgType, backgroundImage } = useTheme()

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
        )
    }

    if (!user) {
        return <Navigate to="/login" replace />
    }

    // Determine background image URL
    let activeBgUrl = null;
    if (bgType === 'white') {
        activeBgUrl = "https://images.unsplash.com/photo-1517175146947-a54394398b10?q=80&w=2694&auto=format&fit=crop";
    } else if (bgType === 'custom' && backgroundImage) {
        activeBgUrl = backgroundImage;
    } else {
        activeBgUrl = "https://ik.imagekit.io/artroobeo/modern-office-space-with-futuristic-decor-furniture.webp";
    }

    return (
        <div
            className={`flex min-h-screen bg-cover bg-fixed transition-all duration-500 relative ${bgType === 'white' ? 'bg-gray-50' : ''}`}
            style={{
                backgroundImage: activeBgUrl ? `url('${activeBgUrl}')` : 'none'
            }}
        >
            <Sidebar />

            {/* Main Content Wrapper - Matching Next.js structure */}
            <div className="flex-1 relative overflow-x-hidden">
                <div className="relative z-10 p-4 md:p-8">
                    <Outlet />
                </div>
            </div>
        </div>
    )
}
