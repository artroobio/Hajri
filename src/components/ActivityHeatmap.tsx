import { useEffect, useState } from 'react'
import { supabase } from '@/utils/supabase/client'

interface ActivityHeatmapProps {
    memberId: string
}

export default function ActivityHeatmap({ memberId }: ActivityHeatmapProps) {
    const [heatmapData, setHeatmapData] = useState<Record<string, number>>({})
    const [totalCheckins, setTotalCheckins] = useState(0)
    const [streak, setStreak] = useState(0)

    useEffect(() => {
        async function fetchAttendance() {
            const oneYearAgo = new Date()
            oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)

            const { data } = await supabase
                .from('attendance')
                .select('date')
                .eq('member_id', memberId)
                .gte('date', oneYearAgo.toISOString())

            if (data) {
                const counts: Record<string, number> = {}
                data.forEach((record: { date: string }) => {
                    const d = record.date // YYYY-MM-DD
                    counts[d] = (counts[d] || 0) + 1
                })
                setHeatmapData(counts)
                setTotalCheckins(data.length)

                // Calculate current streak (naive)
                let currentStreak = 0
                const today = new Date()
                for (let i = 0; i < 365; i++) {
                    const d = new Date(today)
                    d.setDate(d.getDate() - i)
                    const dateStr = d.toISOString().split('T')[0]!
                    const count = counts[dateStr]
                    if (count && count > 0) {
                        currentStreak++
                    } else if (i === 0 && !count) {
                        // If today is missed, check yesterday before breaking
                        continue
                    } else {
                        if (i > 1) break // allow 1 day gap for today
                        if (i === 1 && !count) break
                    }
                }
                setStreak(currentStreak)
            }
        }
        fetchAttendance()
    }, [memberId])

    // Generate last 365 days
    const generateYearData = () => {
        const days = []
        const today = new Date()
        for (let i = 364; i >= 0; i--) {
            const d = new Date(today)
            d.setDate(d.getDate() - i)
            const dateStr = d.toISOString().split('T')[0]!
            days.push({
                date: dateStr,
                count: heatmapData[dateStr] || 0,
                fullDate: d
            })
        }
        return days
    }

    const yearData = generateYearData()

    // Color scale similar to GitHub
    const getColor = (count: number) => {
        if (count === 0) return 'bg-gray-100'
        if (count === 1) return 'bg-green-200'
        if (count === 2) return 'bg-green-400'
        if (count === 3) return 'bg-green-600'
        return 'bg-green-800'
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="text-base font-bold text-gray-900">Consistency</h3>
                    <p className="text-xs text-gray-500">Last 365 Days</p>
                </div>
                <div className="flex gap-4">
                    <div className="text-center">
                        <p className="text-[10px] text-gray-500 uppercase tracking-wide">Total</p>
                        <p className="text-lg font-bold text-gray-900">{totalCheckins}</p>
                    </div>
                    <div className="text-center">
                        <p className="text-[10px] text-gray-500 uppercase tracking-wide">Streak</p>
                        <p className="text-lg font-bold text-orange-500">{streak} 🔥</p>
                    </div>
                </div>
            </div>

            <div className="flex flex-wrap gap-0.5 justify-center max-w-full overflow-hidden">
                {/* Visualizing 52 weeks roughly */}
                {yearData.map((day) => (
                    <div
                        key={day.date}
                        title={`${day.date}: ${day.count} check-ins`}
                        className={`w-2.5 h-2.5 rounded-sm ${getColor(day.count)} hover:ring-1 hover:ring-gray-400 transition-all cursor-alias`}
                    ></div>
                ))}
            </div>

            <div className="flex items-center gap-2 text-xs text-gray-400 mt-4 justify-end">
                <span>Less</span>
                <div className="w-3 h-3 bg-gray-100 rounded-sm"></div>
                <div className="w-3 h-3 bg-green-200 rounded-sm"></div>
                <div className="w-3 h-3 bg-green-400 rounded-sm"></div>
                <div className="w-3 h-3 bg-green-600 rounded-sm"></div>
                <div className="w-3 h-3 bg-green-800 rounded-sm"></div>
                <span>More</span>
            </div>
        </div>
    )
}
