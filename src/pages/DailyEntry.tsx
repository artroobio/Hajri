import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/utils/supabase/client'
import HajriStepper from '@/components/attendance/HajriStepper'
import { Worker, AttendanceRecord } from '@/types'
import KharchiInput from '@/components/attendance/KharchiInput'
import { Calendar as CalendarIcon, Loader2, Save, ChevronLeft, ChevronRight } from 'lucide-react'
import { format, addDays, subDays, isSameDay } from 'date-fns'

export default function DailyEntry() {
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
    const [workers, setWorkers] = useState<Worker[]>([])
    const [attendanceMap, setAttendanceMap] = useState<Record<string, AttendanceRecord>>({})
    const [loading, setLoading] = useState(true)
    const [savingMap, setSavingMap] = useState<Record<string, boolean>>({})

    // Date Navigation Handlers
    const handlePrevDay = () => {
        const prev = subDays(new Date(selectedDate), 1)
        setSelectedDate(format(prev, 'yyyy-MM-dd'))
    }

    const handleNextDay = () => {
        const next = addDays(new Date(selectedDate), 1)
        setSelectedDate(format(next, 'yyyy-MM-dd'))
    }

    // Fetch Workers (Active)
    const fetchWorkers = useCallback(async () => {
        try {
            const { data, error } = await supabase
                .from('workers')
                .select('id, full_name, skill_type, daily_wage, status')
                .eq('status', 'active')
                .order('full_name')

            if (error) {
                // Fallback for legacy schema
                const { data: reliableData, error: reliableError } = await supabase
                    .from('workers')
                    .select('id, full_name:name, skill_type, daily_wage, status')
                    .eq('status', 'active')
                    .order('created_at', { ascending: false })

                if (reliableError) throw reliableError
                setWorkers(reliableData as unknown as Worker[])
            } else {
                setWorkers(data as unknown as Worker[])
            }
        } catch (error) {
            console.error('Error fetching workers:', error)
        }
    }, [])

    // Fetch Attendance for Selected Date
    const fetchAttendance = useCallback(async (date: string) => {
        try {
            setLoading(true)
            const { data, error } = await supabase
                .from('attendance')
                .select('*')
                .eq('date', date)

            if (error) throw error

            const map: Record<string, AttendanceRecord> = {}
            if (data) {
                data.forEach((record: AttendanceRecord) => {
                    map[record.worker_id] = record
                })
            }
            setAttendanceMap(map)
        } catch (error) {
            console.error('Error fetching attendance:', error)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchWorkers()
    }, [fetchWorkers])

    useEffect(() => {
        fetchAttendance(selectedDate)
    }, [selectedDate, fetchAttendance])

    const handleHajriChange = async (worker: Worker, newVal: number) => {
        // Optimistic Update
        const currentRecord = attendanceMap[worker.id]

        // Update local state immediately
        const optimisticRecord = {
            ...currentRecord,
            id: currentRecord?.id || `temp-${worker.id}`,
            worker_id: worker.id,
            date: selectedDate,
            hajri_count: newVal,
            status: newVal > 0 ? 'Present' : 'Absent'
        } as AttendanceRecord

        setAttendanceMap(prev => ({
            ...prev,
            [worker.id]: optimisticRecord
        }))

        setSavingMap(prev => ({ ...prev, [worker.id]: true }))

        try {
            // Prepare Payload
            const payload = {
                worker_id: worker.id,
                date: selectedDate,
                hajri_count: newVal,
                status: newVal > 0 ? 'Present' : 'Absent'
            }

            let result

            if (currentRecord?.id && !currentRecord.id.startsWith('temp')) {
                // Update existing record
                result = await supabase
                    .from('attendance')
                    .update(payload)
                    .eq('id', currentRecord.id)
                    .select()
                    .single()
            } else {
                // Upsert logic: Check if exists first to be safe (if no unique constraint)
                const { data: existing } = await supabase
                    .from('attendance')
                    .select('id')
                    .eq('worker_id', worker.id)
                    .eq('date', selectedDate)
                    .single()

                if (existing) {
                    result = await supabase
                        .from('attendance')
                        .update(payload)
                        .eq('id', existing.id)
                        .select()
                        .single()
                } else {
                    result = await supabase
                        .from('attendance')
                        .insert(payload)
                        .select()
                        .single()
                }
            }

            if (result.error) throw result.error

            // Update with real ID from DB
            setAttendanceMap(prev => ({
                ...prev,
                [worker.id]: result.data as AttendanceRecord
            }))

        } catch (error: any) {
            console.error('Error saving attendance:', error)
            // Revert on error? Or just show alert
        } finally {
            setSavingMap(prev => ({ ...prev, [worker.id]: false }))
        }
    }

    const handleKharchiChange = async (worker: Worker, newVal: number) => {
        // Optimistic Update
        const currentRecord = attendanceMap[worker.id]

        // Update local state immediately
        const optimisticRecord = {
            ...currentRecord,
            id: currentRecord?.id || `temp-${worker.id}`,
            worker_id: worker.id,
            date: selectedDate,
            kharchi_amount: newVal,
            // Keep existing status or default to present if hajri > 0 
            status: currentRecord?.status || (newVal > 0 && (!currentRecord || currentRecord.hajri_count === 0) ? 'Absent' : 'Present'),
            hajri_count: currentRecord?.hajri_count || 0
        } as AttendanceRecord

        setAttendanceMap(prev => ({
            ...prev,
            [worker.id]: optimisticRecord
        }))

        setSavingMap(prev => ({ ...prev, [worker.id]: true }))

        try {
            // Prepare Payload
            const payload = {
                worker_id: worker.id,
                date: selectedDate,
                kharchi_amount: newVal,
                // Ensure we don't overwrite hajri with 0 if it exists
                hajri_count: currentRecord?.hajri_count ?? 0,
                status: currentRecord?.status ?? 'Absent'
            }

            let result

            if (currentRecord?.id && !currentRecord.id.startsWith('temp')) {
                // Update existing record
                result = await supabase
                    .from('attendance')
                    .update(payload)
                    .eq('id', currentRecord.id)
                    .select()
                    .single()
            } else {
                // Upsert logic
                const { data: existing } = await supabase
                    .from('attendance')
                    .select('id')
                    .eq('worker_id', worker.id)
                    .eq('date', selectedDate)
                    .single()

                if (existing) {
                    result = await supabase
                        .from('attendance')
                        .update(payload)
                        .eq('id', existing.id)
                        .select()
                        .single()
                } else {
                    result = await supabase
                        .from('attendance')
                        .insert(payload)
                        .select()
                        .single()
                }
            }

            if (result.error) throw result.error

            // Update with real ID from DB
            setAttendanceMap(prev => ({
                ...prev,
                [worker.id]: result.data as AttendanceRecord
            }))

        } catch (error: any) {
            console.error('Error saving kharchi:', error)
        } finally {
            setSavingMap(prev => ({ ...prev, [worker.id]: false }))
        }
    }

    return (
        <div className="space-y-6 pb-20">
            {/* Centered Date Navigation Header */}
            <header className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-100 sticky top-0 z-10 transition-all">
                {/* Left: Title (Desktop) */}
                <div className="hidden md:block w-1/3">
                    <h1 className="text-xl font-bold text-slate-900 tracking-tight">Daily Attendance</h1>
                </div>

                {/* Center: Date Navigation */}
                <div className="flex items-center justify-center gap-4 w-full md:w-1/3">
                    <button
                        onClick={handlePrevDay}
                        className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
                        title="Previous Day"
                    >
                        <ChevronLeft size={24} />
                    </button>

                    <div className="flex flex-col items-center">
                        <div className="relative group cursor-pointer">
                            <div className="flex items-center gap-2 text-lg font-bold text-slate-800">
                                <CalendarIcon size={18} className="text-slate-400" />
                                <span>
                                    {isSameDay(new Date(selectedDate), new Date())
                                        ? 'Today'
                                        : isSameDay(new Date(selectedDate), subDays(new Date(), 1))
                                            ? 'Yesterday'
                                            : format(new Date(selectedDate), 'EEE, dd MMM')}
                                </span>
                            </div>
                            {/* Hidden actual date input for picker functionality */}
                            <input
                                type="date"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                            />
                            <p className="text-xs text-slate-400 font-medium text-center mt-0.5">
                                {format(new Date(selectedDate), 'yyyy')}
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={handleNextDay}
                        className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
                        title="Next Day"
                    >
                        <ChevronRight size={24} />
                    </button>
                </div>

                {/* Right: Spacer/Stats (Desktop) */}
                <div className="hidden md:block w-1/3 text-right">
                    {/* Placeholder for future stats */}
                </div>
            </header>

            {loading && workers.length === 0 ? (
                <div className="flex justify-center py-12">
                    <Loader2 className="animate-spin text-emerald-600" size={32} />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {workers.map((worker) => {
                        const record = attendanceMap[worker.id]
                        // Default to 1.0 if no record exists yet, typically standard attendance is 1
                        const initialVal = record ? record.hajri_count : 1.0
                        const isSaving = savingMap[worker.id]

                        return (
                            <div key={worker.id} className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow p-4 flex flex-col justify-between gap-4">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="font-semibold text-slate-900 text-lg">{worker.full_name}</h3>
                                        <p className="text-slate-500 text-sm">{worker.skill_type}</p>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-xs text-slate-400 font-medium uppercase tracking-wider">Daily Wage</div>
                                        <div className="font-mono font-medium text-slate-700">₹{worker.daily_wage}</div>
                                    </div>
                                </div>

                                <div className="border-t border-slate-100 pt-4 flex items-center justify-between">
                                    <HajriStepper
                                        baseWage={worker.daily_wage || 0}
                                        initialValue={initialVal}
                                        onChange={(val) => handleHajriChange(worker, val)}
                                    />

                                    {/* Kharchi Input */}
                                    <KharchiInput
                                        initialValue={record?.kharchi_amount || 0}
                                        onSave={(val) => handleKharchiChange(worker, val)}
                                        isSaving={isSaving}
                                    />

                                    <div className="flex items-center min-w-[70px] justify-end">
                                        {isSaving ? (
                                            <span className="inline-flex items-center text-xs text-slate-400 animate-pulse">
                                                <Loader2 size={14} className="animate-spin mr-1.5" /> Saving
                                            </span>
                                        ) : record ? (
                                            <span className="inline-flex items-center text-xs text-emerald-600 font-medium bg-emerald-50 px-2 py-1 rounded-full">
                                                <Save size={12} className="mr-1.5" /> Saved
                                            </span>
                                        ) : (
                                            <span className="text-xs text-slate-300 italic">Not set</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )
                    })}

                    {workers.length === 0 && !loading && (
                        <div className="col-span-full py-12 text-center text-slate-400">
                            No active workers found. Please add workers in the "Workers" section first.
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
