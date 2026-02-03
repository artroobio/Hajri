

interface YesNoRowProps {
    label: string
    value: boolean | undefined
    onChange: (val: boolean) => void
}

export default function YesNoRow({ label, value, onChange }: YesNoRowProps) {
    return (
        <div className="flex items-center justify-between border-b border-gray-50 pb-3 last:border-0 last:pb-0 hover:bg-gray-50 transition-colors px-2 -mx-2 rounded-lg">
            <p className="text-gray-700 text-sm font-medium pr-4">{label}</p>
            <div className="flex gap-3">
                <button
                    type="button"
                    onClick={() => onChange(true)}
                    className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all shadow-sm ${value === true
                        ? 'bg-red-600 text-white ring-2 ring-red-200'
                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        }`}
                >
                    Yes
                </button>

                <button
                    type="button"
                    onClick={() => onChange(false)}
                    className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all shadow-sm ${value === false
                        ? 'bg-green-600 text-white ring-2 ring-green-200'
                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        }`}
                >
                    No
                </button>
            </div>
        </div>
    )
}
