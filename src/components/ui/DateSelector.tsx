import { useEffect, useState } from 'react'

interface DateSelectorProps {
    label?: string
    value: string
    onChange: (value: string) => void
    yearRange?: 'past' | 'future'
}

export default function DateSelector({ label, value, onChange, yearRange = 'past' }: DateSelectorProps) {
    const [day, setDay] = useState('')
    const [month, setMonth] = useState('')
    const [year, setYear] = useState('')

    // Initialize local state from value prop
    useEffect(() => {
        if (value) {
            const date = new Date(value)
            // Use UTC to avoid timezone shifts
            if (!isNaN(date.getTime())) {
                setDay(date.getUTCDate().toString())
                setMonth(date.getUTCMonth().toString())
                setYear(date.getUTCFullYear().toString())
            }
        } else {
            setDay('')
            setMonth('')
            setYear('')
        }
    }, [value])

    const handleChange = (type: 'day' | 'month' | 'year', val: string) => {
        let d = day
        let m = month
        let y = year

        if (type === 'day') { setDay(val); d = val; }
        if (type === 'month') { setMonth(val); m = val; }
        if (type === 'year') { setYear(val); y = val; }

        if (d && m && y) {
            const date = new Date(Date.UTC(parseInt(y), parseInt(m), parseInt(d)))
            onChange(date.toISOString().split('T')[0])
        }
    }

    const currentYear = new Date().getFullYear()
    const years = yearRange === 'past'
        ? Array.from({ length: currentYear - 1950 + 1 }, (_, i) => currentYear - i) // 2024 to 1950
        : Array.from({ length: 11 }, (_, i) => currentYear + i) // 2024 to 2034

    return (
        <div className="flex flex-col">
            {label && <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}
            <div className="flex gap-2">
                <select
                    value={day}
                    onChange={(e) => handleChange('day', e.target.value)}
                    className="w-1/3 p-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                    <option value="">Day</option>
                    {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                        <option key={d} value={d}>{d}</option>
                    ))}
                </select>
                <select
                    value={month}
                    onChange={(e) => handleChange('month', e.target.value)}
                    className="w-1/3 p-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                    <option value="">Month</option>
                    {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map((m, i) => (
                        <option key={m} value={i}>{m}</option>
                    ))}
                </select>
                <select
                    value={year}
                    onChange={(e) => handleChange('year', e.target.value)}
                    className="w-1/3 p-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                    <option value="">Year</option>
                    {years.map(y => (
                        <option key={y} value={y}>{y}</option>
                    ))}
                </select>
            </div>
        </div>
    )
}
