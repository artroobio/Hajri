import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Check } from 'lucide-react'

interface StatusDropdownProps {
    status: 'Present' | 'Absent'
    onChange: (status: 'Present' | 'Absent') => void
}

export default function StatusDropdown({ status, onChange }: StatusDropdownProps) {
    const [isOpen, setIsOpen] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const handleSelect = (val: 'Present' | 'Absent') => {
        onChange(val)
        setIsOpen(false)
    }

    return (
        <div className="relative inline-block w-32" ref={dropdownRef}>
            {/* Trigger Pill */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full flex items-center justify-between px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wide transition-all shadow-sm outline-none ring-offset-2 focus:ring-2 
                ${status === 'Present'
                        ? 'bg-green-100 text-green-700 hover:bg-green-200 focus:ring-green-500'
                        : 'bg-red-50 text-red-600 hover:bg-red-100 focus:ring-red-500'}`}
            >
                <span className="flex-1 text-center">{status}</span>
                <ChevronDown size={14} className={`shrink-0 ml-1 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Custom Dropdown Menu */}
            {isOpen && (
                <div className="absolute top-full left-0 mt-2 w-full bg-white rounded-xl shadow-xl border border-slate-100 py-1 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                    <button
                        onClick={() => handleSelect('Absent')}
                        className={`w-full text-left px-4 py-2 text-xs font-bold uppercase flex items-center justify-between hover:bg-slate-50 transition-colors
                        ${status === 'Absent' ? 'text-red-600' : 'text-slate-600'}`}
                    >
                        Absent
                        {status === 'Absent' && <Check size={12} />}
                    </button>
                    <button
                        onClick={() => handleSelect('Present')}
                        className={`w-full text-left px-4 py-2 text-xs font-bold uppercase flex items-center justify-between hover:bg-slate-50 transition-colors
                        ${status === 'Present' ? 'text-green-700' : 'text-slate-600'}`}
                    >
                        Present
                        {status === 'Present' && <Check size={12} />}
                    </button>
                </div>
            )}
        </div>
    )
}
