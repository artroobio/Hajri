import { useEffect, useState, useMemo, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '@/utils/supabase/client'
import { Worker, AttendanceRecord } from '@/types'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, getDaysInMonth } from 'date-fns'
import { ChevronLeft, ChevronRight, Phone, Coins, Calendar, ArrowLeft, Loader2, MapPin, User, FileText, ExternalLink } from 'lucide-react'

export default function WorkerProfile() {
    const { id } = useParams()
    const navigate = useNavigate()
    const [worker, setWorker] = useState<Worker | null>(null)
    const [attendance, setAttendance] = useState<AttendanceRecord[]>([])
    const [currentMonth, setCurrentMonth] = useState(new Date())
    const [loading, setLoading] = useState(true)

    // --- Data Fetching ---
    const fetchData = useCallback(async () => {
        if (!id) return
        setLoading(true)
        try {
            // 1. Fetch Worker Details
            const { data: workerData, error: workerError } = await supabase
                .from('workers')
                .select('*')
                .eq('id', id)
                .single()

            if (workerError) throw workerError
            setWorker(workerData as unknown as Worker)

            // 2. Fetch Attendance for Current Month
            const start = format(startOfMonth(currentMonth), 'yyyy-MM-dd')
            const end = format(endOfMonth(currentMonth), 'yyyy-MM-dd')

            const { data: attData, error: attError } = await supabase
                .from('attendance')
                .select('*')
                .eq('worker_id', id)
                .gte('date', start)
                .lte('date', end)
                .order('date')

            if (attError) throw attError
            setAttendance(attData as AttendanceRecord[])

        } catch (error) {
            console.error('Error fetching worker profile:', error)
        } finally {
            setLoading(false)
        }
    }, [id, currentMonth])

    useEffect(() => {
        fetchData()
    }, [fetchData])

    // --- Computed Values ---

    // 1. Financial Summary
    const summary = useMemo(() => {
        if (!worker) return { totalHajris: 0, totalKharchi: 0, netPayable: 0 }

        const totalHajris = attendance.reduce((sum: number, record) => sum + record.hajri_count, 0)
        const totalKharchi = attendance.reduce((sum: number, record) => sum + (record.kharchi_amount || 0), 0)
        const netPayable = (totalHajris * worker.daily_wage) - totalKharchi

        return { totalHajris, totalKharchi, netPayable }
    }, [attendance, worker])

    // 2. Attendance Grid (The Yellow Card)
    const attendanceGrid = useMemo(() => {
        if (!worker) return []

        const daysInMonth = eachDayOfInterval({
            start: startOfMonth(currentMonth),
            end: endOfMonth(currentMonth)
        })

        return daysInMonth.map(date => {
            const dateStr = format(date, 'yyyy-MM-dd')
            const record = attendance.find(r => r.date === dateStr)

            // Default values if no record exists
            const hajriCount = record?.hajri_count ?? 0
            const kharchi = record?.kharchi_amount ?? 0
            const dailyWage = worker.daily_wage
            const dailyEarning = (hajriCount * dailyWage) - kharchi

            // Traditional Hajri Display Logic
            let hajriDisplay = '-'
            if (hajriCount === 1) hajriDisplay = 'P' // Present
            else if (hajriCount === 0.5) hajriDisplay = 'P ½' // Half Day
            else if (hajriCount === 0) hajriDisplay = 'A' // Absent (Explicit 0) or No Record

            // If no record exists at all, we show it as Absent/Blank depending on preference.
            // Requirement says: "If no attendance record exists for a date, show "Absent" (or "-")"
            if (!record) hajriDisplay = '-'

            return {
                date: date,
                hajriNumeric: hajriCount,
                hajriDisplay,
                kharchi,
                dailyEarning
            }
        })
    }, [currentMonth, attendance, worker])


    if (loading && !worker) {
        return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-slate-400" /></div>
    }

    if (!worker) {
        return <div className="p-8 text-center text-red-500">Worker not found</div>
    }

    return (
        <div className="space-y-8 pb-20">
            {/* Unified Profile Header Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="h-32 bg-gradient-to-r from-slate-900 to-slate-800 relative">
                    <button
                        onClick={() => navigate('/workers')}
                        className="absolute top-4 left-4 text-white/80 hover:text-white flex items-center gap-1 bg-white/10 px-3 py-1.5 rounded-lg backdrop-blur-sm transition-colors text-sm font-medium"
                    >
                        <ArrowLeft size={16} /> Back
                    </button>
                    <button
                        onClick={() => navigate(`/workers/${id}/edit`)}
                        className="absolute top-4 right-4 text-white/80 hover:text-white flex items-center gap-1 bg-white/10 px-3 py-1.5 rounded-lg backdrop-blur-sm transition-colors text-sm font-medium"
                    >
                        Edit Profile
                    </button>
                </div>

                <div className="px-6 pb-6">
                    <div className="flex flex-col md:flex-row gap-6 relative">
                        {/* Profile Image / Document */}
                        <div className="-mt-12 flex-shrink-0">
                            <div className="w-32 h-32 md:w-40 md:h-40 rounded-xl bg-white p-1 shadow-lg pointer-events-auto">
                                {worker.id_document_url ? (
                                    <a
                                        href={worker.id_document_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="block w-full h-full rounded-lg overflow-hidden relative group"
                                    >
                                        <img
                                            src={worker.id_document_url}
                                            alt="Profile"
                                            className="w-full h-full object-cover"
                                        />
                                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <ExternalLink className="text-white" size={20} />
                                        </div>
                                    </a>
                                ) : (
                                    <div className="w-full h-full bg-slate-100 rounded-lg flex items-center justify-center text-slate-300">
                                        <User size={48} />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Details Section */}
                        <div className="pt-2 flex-1 flex flex-col md:flex-row justify-between gap-4">
                            <div>
                                <div className="flex items-center gap-3 mb-1">
                                    <h1 className="text-2xl md:text-3xl font-bold text-slate-900">{worker.full_name}</h1>
                                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide border
                                        ${worker.skill_type === 'Mason'
                                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                                            : 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                                        {worker.skill_type}
                                    </span>
                                </div>

                                <div className="flex flex-col gap-1.5 text-slate-600 text-sm">
                                    <div className="flex items-center gap-4">
                                        <span className="flex items-center gap-1.5 font-medium">
                                            <Phone size={15} className="text-slate-400" />
                                            {worker.phone_number || 'No Phone'}
                                        </span>
                                        {worker.alternate_phone && (
                                            <span className="text-slate-400">/ {worker.alternate_phone}</span>
                                        )}
                                    </div>
                                    {worker.address && (
                                        <span className="flex items-center gap-1.5">
                                            <MapPin size={15} className="text-slate-400" />
                                            {worker.address}
                                        </span>
                                    )}
                                    <div className="flex items-center gap-4 text-xs text-slate-500 mt-1">
                                        {(worker.age || worker.gender) && (
                                            <span className="flex items-center gap-1">
                                                {worker.gender} {worker.age ? `• ${worker.age} yrs` : ''}
                                            </span>
                                        )}
                                        {worker.aadhaar_number && (
                                            <span className="flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded">
                                                Aadhaar: {worker.aadhaar_number}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Wage Card (Right Side) */}
                            <div className="flex-shrink-0">
                                <div className="bg-emerald-50 border border-emerald-100 px-5 py-3 rounded-xl flex items-center gap-3">
                                    <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
                                        <Coins size={20} />
                                    </div>
                                    <div>
                                        <p className="text-xs text-emerald-600 font-bold uppercase tracking-wider">Daily Wage</p>
                                        <p className="text-xl font-extrabold text-emerald-900">₹{worker.daily_wage}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Month Controller */}
            <div className="flex items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                <button
                    onClick={() => setCurrentMonth(prev => subMonths(prev, 1))}
                    className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-800 transition-colors"
                >
                    <ChevronLeft size={24} />
                </button>
                <div className="text-center">
                    <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <Calendar size={20} className="text-slate-400" />
                        Attendance Record - <span className="text-blue-600">[{format(currentMonth, 'MMMM yyyy')}]</span>
                    </h2>
                </div>
                <button
                    onClick={() => setCurrentMonth(prev => addMonths(prev, 1))}
                    className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-800 transition-colors"
                >
                    <ChevronRight size={24} />
                </button>
            </div>

            {/* Financial Summary Cards (Hisaab) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <p className="text-slate-500 text-sm font-medium uppercase tracking-wider">Total Hajris</p>
                    <p className="text-3xl font-bold text-slate-900 mt-1">{summary.totalHajris}</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <p className="text-slate-500 text-sm font-medium uppercase tracking-wider">Total Kharchi</p>
                    <p className="text-3xl font-bold text-red-600 mt-1">₹{summary.totalKharchi.toLocaleString()}</p>
                </div>
                <div className="bg-emerald-50 p-6 rounded-xl shadow-sm border border-emerald-100">
                    <p className="text-emerald-600 text-sm font-bold uppercase tracking-wider">Net Payable</p>
                    <p className="text-3xl font-extrabold text-emerald-700 mt-1">₹{summary.netPayable.toLocaleString()}</p>
                </div>
            </div>

            {/* The "Yellow Card" Grid */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 uppercase text-xs font-semibold tracking-wider">
                            <tr>
                                <th className="px-6 py-4 w-1/4">Date</th>
                                <th className="px-6 py-4 w-1/4 text-center">Hajri</th>
                                <th className="px-6 py-4 w-1/4 text-center">Kharchi</th>
                                <th className="px-6 py-4 w-1/4 text-right">Daily Earning</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {attendanceGrid.map((row) => (
                                <tr key={row.date.toString()} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-3 font-medium text-slate-700">
                                        {format(row.date, 'dd MMM (EEE)')}
                                    </td>
                                    <td className="px-6 py-3 text-center">
                                        <div className="flex flex-col items-center">
                                            <span className={`font-bold text-lg ${row.hajriDisplay === 'P' ? 'text-green-600' :
                                                row.hajriDisplay === 'P ½' ? 'text-yellow-600' :
                                                    row.hajriDisplay === 'A' ? 'text-red-400' : 'text-slate-300'
                                                }`}>
                                                {row.hajriDisplay}
                                            </span>
                                            {row.hajriNumeric > 0 && (
                                                <span className="text-[10px] text-slate-400 font-mono">({row.hajriNumeric})</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-3 text-center font-medium text-red-600">
                                        {row.kharchi > 0 ? `₹${row.kharchi}` : '-'}
                                    </td>
                                    <td className="px-6 py-3 text-right font-bold text-slate-800">
                                        ₹{row.dailyEarning.toLocaleString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div >
    )
}
