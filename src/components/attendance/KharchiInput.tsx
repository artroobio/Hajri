import { useState, useEffect, useRef } from 'react'

interface KharchiInputProps {
    initialValue: number
    onSave: (value: number) => void
    isSaving?: boolean
}

export default function KharchiInput({ initialValue, onSave, isSaving }: KharchiInputProps) {
    const [value, setValue] = useState<string>(initialValue === 0 ? '' : initialValue.toString())
    const debouncedValueRef = useRef<string>(value)

    // Sync with external initialValue changes (unless we are currently typing/focused?) 
    // Actually, for optimistic updates, we generally trust local state, but if initialValue changes drastically from outside, we might want to sync.
    // However, usually initialValue only changes on mount or re-fetch.
    useEffect(() => {
        setValue(initialValue === 0 ? '' : initialValue.toString())
    }, [initialValue])

    useEffect(() => {
        const handler = setTimeout(() => {
            // Only trigger save if value actually changed from what we last thought it was
            if (value !== debouncedValueRef.current) {
                const numValue = parseFloat(value) || 0
                onSave(numValue)
                debouncedValueRef.current = value
            }
        }, 500)

        return () => {
            clearTimeout(handler)
        }
    }, [value, onSave])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setValue(e.target.value)
    }

    return (
        <div className="relative w-24">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-rose-500 font-medium select-none text-sm">₹</span>
            <input
                type="number"
                min="0"
                placeholder="0"
                value={value}
                onChange={handleChange}
                disabled={isSaving}
                className={`w-full pl-6 pr-2 py-1.5 text-center font-bold text-rose-600 bg-rose-50/50 border border-rose-100 rounded-lg focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none transition-all placeholder:text-rose-300 placeholder:font-normal text-sm ${isSaving ? 'opacity-70 cursor-wait' : ''}`}
            />
        </div>
    )
}
