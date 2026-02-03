import { useState, useEffect } from 'react'
import { Minus, Plus } from 'lucide-react'

interface HajriStepperProps {
    baseWage: number
    initialValue: number
    onChange: (value: number) => void
}

export default function HajriStepper({ baseWage, initialValue, onChange }: HajriStepperProps) {
    const [hajriCount, setHajriCount] = useState(initialValue)

    // Sync state with props (critical for parent-driven updates like Status Dropdown)
    useEffect(() => {
        setHajriCount(initialValue)
    }, [initialValue])

    const updateValue = (newValue: number) => {
        // Ensure accurate floating point arithmetic for 0.25 steps
        const val = Math.max(0, parseFloat(newValue.toFixed(2)))
        setHajriCount(val)
        onChange(val)
    }

    const getTraditionalHajri = (value: number): string => {
        if (value === 0) return '-'

        const whole = Math.floor(value)
        const decimal = value - whole

        let pStr = ''
        if (whole > 0) {
            pStr = 'P'.repeat(whole)
        }

        // Handle fractions
        let fracStr = ''
        if (decimal > 0.1 && decimal < 0.4) fracStr = '¼'       // ~0.25
        else if (decimal >= 0.4 && decimal < 0.6) fracStr = '½' // ~0.50
        else if (decimal > 0.6 && decimal < 0.9) fracStr = '¾' // ~0.75

        return (pStr + ' ' + fracStr).trim() || '½' // Fallback for 0.x cases if P logic misses
    }

    const getBadgeStyles = (value: number) => {
        if (value > 3) return "bg-red-100 text-red-800 border-red-200"
        if (value > 2) return "bg-orange-100 text-orange-800 border-orange-200"
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
    }

    return (
        <div className="flex flex-col items-center gap-1.5">
            {/* Traditional 'P' Badge */}
            <div className={`${getBadgeStyles(hajriCount)} font-mono font-bold text-sm px-3 py-1 rounded-md mb-1 shadow-sm border min-w-[3rem] text-center`}>
                {getTraditionalHajri(hajriCount)}
            </div>

            <div className="flex items-center gap-2 p-1 bg-white rounded-xl border border-slate-200 shadow-sm">
                <button
                    onClick={() => updateValue(hajriCount - 0.25)}
                    className="p-2 bg-slate-50 hover:bg-slate-100 active:scale-95 rounded-lg text-slate-600 hover:text-red-600 transition-all border border-slate-100"
                    type="button"
                >
                    <Minus size={16} strokeWidth={2.5} />
                </button>

                <input
                    type="number"
                    value={hajriCount}
                    onChange={(e) => updateValue(parseFloat(e.target.value) || 0)}
                    className="w-16 text-center font-mono font-bold text-lg text-slate-800 outline-none bg-transparent"
                    step="0.25"
                />

                <button
                    onClick={() => updateValue(hajriCount + 0.25)}
                    className="p-2 bg-slate-50 hover:bg-slate-100 active:scale-95 rounded-lg text-slate-600 hover:text-green-600 transition-all border border-slate-100"
                    type="button"
                >
                    <Plus size={16} strokeWidth={2.5} />
                </button>
            </div>

            <div className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                ₹{(baseWage * hajriCount).toFixed(0)}
            </div>
        </div>
    )
}
