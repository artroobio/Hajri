import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '@/utils/supabase/client'
import {
    Activity,
    Inbox,
    Users,
    FileText,
    ShoppingBag,
    CreditCard,
    BarChart2,
    Receipt,
    UserCog,
    Calendar,
    IndianRupee,
    Settings,
    Dumbbell,
    PanelLeftClose,
    PanelLeftOpen,
    LogOut,
    LucideIcon
} from 'lucide-react'
import { useTheme } from '@/context/ThemeContext'

interface NavItemProps {
    href: string
    icon: LucideIcon
    label: string
    active: boolean
    collapsed: boolean
}

// Helper Component for Navigation Items
const NavItem = ({ href, icon: Icon, label, active, collapsed }: NavItemProps) => (
    <Link
        to={href}
        className={`group flex items-center gap-4 px-3 py-2.5 mx-2 rounded-lg transition-all duration-200 relative w-auto
        ${active ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20' : 'hover:bg-white/50 text-slate-600 hover:text-slate-900'}`}
    >
        <Icon size={20} strokeWidth={2} className="transition-colors duration-200" />
        {!collapsed && (
            <span className="font-heading font-semibold text-sm tracking-wide transition-colors duration-200 whitespace-nowrap">
                {label}
            </span>
        )}
    </Link>
)

export default function Sidebar() {
    const location = useLocation()
    const pathname = location.pathname
    const navigate = useNavigate()
    const [sidebarOpen, setSidebarOpen] = useState(true)
    const { brandName, brandLogo } = useTheme()

    const handleLogout = async () => {
        await supabase.auth.signOut()
        navigate('/login')
    }

    const isActive = (path: string) => {
        if (path === '/' && pathname === '/') return true
        if (path !== '/' && pathname.startsWith(path)) return true
        return false
    }

    const navItems = [
        { name: 'Site Overview', path: '/', icon: Activity },
        { name: 'Workers', path: '/workers', icon: Users },
        { name: 'Projects', path: '/projects', icon: Settings }, // Updated to multi-project

        { name: 'Daily Entry', path: '/daily-entry', icon: Calendar },
        { name: 'Estimates / BOQ', path: '/estimates', icon: FileText },
        { name: 'Bills & Payments', path: '/client-ledger', icon: IndianRupee },
        { name: 'Payroll', path: '/payroll', icon: Receipt }, // Was Billing
        { name: 'Reports', path: '/reports', icon: BarChart2 },
        { name: 'Raw Materials', path: '/materials', icon: ShoppingBag },
        { name: 'Expenses', path: '/expenses', icon: CreditCard },
        { name: 'Settings', path: '/settings', icon: Settings },
    ]

    return (
        <aside className={`sticky top-0 h-screen transition-all duration-700 ease-[cubic-bezier(0.76,0,0.24,1)] 
            ${sidebarOpen ? 'w-72' : 'w-24'} 
            border-r border-white/40 bg-white/70 backdrop-blur-[20px] flex flex-col py-6 z-50 flex-shrink-0`}>

            {/* Brand Logo */}
            <div className="px-6 mb-2 flex items-center gap-3 overflow-hidden">
                <div className="min-w-8 h-8 rounded-lg flex items-center justify-center text-white shadow-lg shadow-indigo-500/30 flex-shrink-0 overflow-hidden bg-indigo-600">
                    {brandLogo ? (
                        <img src={brandLogo} alt="Logo" className="w-full h-full object-cover" />
                    ) : (
                        <Dumbbell size={18} />
                    )}
                </div>
                {sidebarOpen && (
                    <h1 className="font-heading text-2xl font-extrabold tracking-tight text-slate-900 uppercase italic whitespace-nowrap overflow-hidden text-ellipsis">
                        {brandName}
                    </h1>
                )}
            </div>

            {/* Navigation Links */}
            <nav className="flex-1 min-h-0 space-y-0.5 overflow-y-auto overflow-x-hidden [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
                {navItems.map((item) => (
                    <NavItem
                        key={item.path}
                        href={item.path}
                        icon={item.icon}
                        label={item.name}
                        active={isActive(item.path)}
                        collapsed={!sidebarOpen}
                    />
                ))}
            </nav>

            {/* Footer / User / System Toggle */}
            <div className="px-6 mt-4 mb-2">
                {/* User Profile */}
                <div className={`flex items-center gap-3 py-2 px-2 rounded-lg transition-all ${!sidebarOpen && 'justify-center'}`}>
                    <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold text-xs flex-shrink-0">
                        JD
                    </div>
                    {sidebarOpen && (
                        <div className="overflow-hidden">
                            <p className="font-bold text-slate-900 text-sm whitespace-nowrap">Admin User</p>
                            <p className="text-slate-500 text-xs whitespace-nowrap">admin@ironcore.com</p>
                        </div>
                    )}
                </div>

                <div className="border-t border-slate-200/50 my-2"></div>

                {/* Horizontal System Buttons (Collapse & Logout) */}
                <div className={`flex gap-2 mt-1 ${!sidebarOpen && 'flex-col'}`}>
                    {/* System / Collapse Toggle */}
                    <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="flex-1 flex items-center justify-center gap-2 text-slate-600 hover:text-slate-900 transition-colors py-1 bg-slate-50/50 hover:bg-slate-100 rounded-md"
                        title="Collapse Sidebar"
                    >
                        {sidebarOpen ? <PanelLeftClose size={16} /> : <PanelLeftOpen size={16} />}
                        {sidebarOpen && <span className="font-heading font-bold text-[10px] uppercase tracking-widest whitespace-nowrap">Collapse</span>}
                    </button>

                    {/* Logout */}
                    <button
                        onClick={handleLogout}
                        className="flex-1 flex items-center justify-center gap-2 text-red-600 hover:text-red-700 transition-colors py-1 bg-red-50/30 hover:bg-red-50 rounded-md"
                        title="Sign Out"
                    >
                        <LogOut size={16} />
                        {sidebarOpen && <span className="font-heading font-bold text-[10px] uppercase tracking-widest whitespace-nowrap">Exit</span>}
                    </button>
                </div>
            </div>
        </aside>
    )
}
