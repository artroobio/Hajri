import { useEffect, useState, useCallback, useMemo } from 'react'
import { supabase } from '@/utils/supabase/client'
import AddWorkerModal from '@/components/AddWorkerModal'
import { Worker, AttendanceRecord } from '@/types'
import { Search, Plus, Trash2, Phone, Coins, AlertTriangle, X, Banknote } from 'lucide-react'
import ExportButton from '@/components/ExportButton'
import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import StatusDropdown from '@/components/attendance/StatusDropdown'
import HajriStepper from '@/components/attendance/HajriStepper'

export default function Workers() {
    const [workers, setWorkers] = useState<Worker[]>([])
    const [loading, setLoading] = useState(true)
    const [isAddModalOpen, setIsAddModalOpen] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [attendanceMap, setAttendanceMap] = useState<Record<string, AttendanceRecord>>({})
    const [savingMap, setSavingMap] = useState<Record<string, boolean>>({})
    const [monthlyStats, setMonthlyStats] = useState<{ month: string, amount: number }[]>([])

    // Delete Modal State
    const [workerToDelete, setWorkerToDelete] = useState<Worker | null>(null)
    const [deleteConfirmationName, setDeleteConfirmationName] = useState('')
    const [isDeleteLoading, setIsDeleteLoading] = useState(false)

    const dateStr = useMemo(() => format(new Date(), 'yyyy-MM-dd'), [])

    const fetchData = useCallback(async () => {
        try {
            setLoading(true)

            const [workersRes, attendanceRes] = await Promise.all([
                supabase
                    .from('workers')
                    .select('id, full_name, phone_number, skill_type, daily_wage, status, created_at')
                    .order('created_at', { ascending: false }),

                supabase
                    .from('attendance')
                    .select('*')
                    .eq('date', dateStr)
            ])

            if (workersRes.error) throw workersRes.error
            setWorkers(workersRes.data as unknown as Worker[])

            const map: Record<string, AttendanceRecord> = {}
            if (attendanceRes.data) {
                attendanceRes.data.forEach((record: AttendanceRecord) => {
                    map[record.worker_id] = record
                })
            }
            setAttendanceMap(map)

            // --- Process Monthly Stats ---
            // 1. Fetch ALL attendance for aggregation
            // We do a separate fetch here to avoid breaking the existing logic which relies on exact date match for the UI
            // Optimally this could be requested in the Promise.all above, but for clarity/safety adding it here or modifying above.
            // Let's modify the Promise.all logic in next iteration if needed, but here:
            const { data: allAttendance } = await supabase
                .from('attendance')
                .select('worker_id, hajri_count, date')

            if (allAttendance) {
                const wageMap = new Map((workersRes.data as unknown as Worker[]).map(w => [w.id, w.daily_wage]))
                const statsMap: Record<string, number> = {}

                allAttendance.forEach((record: any) => {
                    const monthKey = format(new Date(record.date), 'MMMM yyyy')
                    const wage = wageMap.get(record.worker_id) || 0
                    const cost = (record.hajri_count || 0) * wage

                    statsMap[monthKey] = (statsMap[monthKey] || 0) + cost
                })

                // Convert to array and sort (Newest First)
                const statsArray = Object.entries(statsMap)
                    .map(([month, amount]) => ({ month, amount }))
                    .sort((a, b) => new Date(b.month).getTime() - new Date(a.month).getTime())

                setMonthlyStats(statsArray)
            }

        } catch (error) {
            console.error('Error fetching data:', error)
        } finally {
            setLoading(false)
        }
    }, [dateStr])

    useEffect(() => {
        fetchData()
    }, [fetchData])

    const handleUpdate = async (workerId: string, field: 'hajri_count' | 'status', value: number | string) => {
        // Optimistic Update
        const currentRecord = attendanceMap[workerId]
        const worker = workers.find(w => w.id === workerId)

        let newHajri = currentRecord?.hajri_count ?? 0
        // Kharchi not editable here to keep it simple, or we can add it if needed. User asked for "hajris".
        const newKharchi = currentRecord?.kharchi_amount ?? 0
        let newStatus = currentRecord?.status || (newHajri > 0 ? 'Present' : 'Absent')

        if (field === 'hajri_count') {
            newHajri = value as number
            newStatus = newHajri > 0 ? 'Present' : 'Absent'
        } else if (field === 'status') {
            newStatus = value as 'Present' | 'Absent'
            if (newStatus === 'Absent') newHajri = 0
            else if (newStatus === 'Present' && newHajri === 0) newHajri = 1
        }

        const mergedRecord = {
            ...currentRecord,
            worker_id: workerId,
            date: dateStr,
            hajri_count: newHajri,
            kharchi_amount: newKharchi,
            status: newStatus,
            id: currentRecord?.id || `temp-${workerId}`
        } as AttendanceRecord

        setAttendanceMap(prev => ({ ...prev, [workerId]: mergedRecord }))
        setSavingMap(prev => ({ ...prev, [workerId]: true }))

        try {
            const payload = {
                worker_id: workerId,
                date: dateStr,
                hajri_count: newHajri,
                kharchi_amount: newKharchi,
                status: newStatus
            }

            let result
            if (currentRecord?.id && !currentRecord.id.startsWith('temp')) {
                result = await supabase.from('attendance').update(payload).eq('id', currentRecord.id).select().single()
            } else {
                const { data: existing } = await supabase.from('attendance').select('id').eq('worker_id', workerId).eq('date', dateStr).single()
                if (existing) result = await supabase.from('attendance').update(payload).eq('id', existing.id).select().single()
                else result = await supabase.from('attendance').insert(payload).select().single()
            }

            if (result.error) throw result.error
            setAttendanceMap(prev => ({ ...prev, [workerId]: result.data as AttendanceRecord }))

            // --- Real-time Monthly Stats Update ---
            const costDeference = (newHajri - (currentRecord?.hajri_count || 0)) * (worker?.daily_wage || 0)
            if (costDeference !== 0) {
                const currentMonthKey = format(new Date(dateStr), 'MMMM yyyy')
                setMonthlyStats(prev => {
                    const newStats = [...prev]
                    const existingMonthIndex = newStats.findIndex(s => s.month === currentMonthKey)

                    if (existingMonthIndex >= 0) {
                        newStats[existingMonthIndex] = {
                            ...newStats[existingMonthIndex],
                            amount: newStats[existingMonthIndex].amount + costDeference
                        }
                    } else {
                        // If month doesn't exist yet (first entry for a new month), add it
                        newStats.unshift({ month: currentMonthKey, amount: costDeference })
                    }
                    return newStats
                })
            }
        } catch (error) {
            console.error('Error saving attendance:', error)
            alert('Failed to save attendance')
        } finally {
            setSavingMap(prev => ({ ...prev, [workerId]: false }))
        }
    }


    const handleDeleteClick = (worker: Worker) => {
        setWorkerToDelete(worker)
        setDeleteConfirmationName('')
    }

    const confirmDelete = async () => {
        if (!workerToDelete) return
        if (deleteConfirmationName !== workerToDelete.full_name) return

        setIsDeleteLoading(true)
        try {
            const { error } = await supabase.from('workers').delete().eq('id', workerToDelete.id)
            if (error) throw error

            setWorkers(prev => prev.filter(w => w.id !== workerToDelete.id))
            setWorkerToDelete(null)
        } catch (err: any) {
            alert('Error deleting: ' + err.message)
        } finally {
            setIsDeleteLoading(false)
        }
    }

    const filteredWorkers = workers.filter(worker =>
        worker.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (worker.phone_number && worker.phone_number.includes(searchQuery))
    )

    return (
        <div className="min-h-screen space-y-6">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Workers</h1>
                    <p className="text-slate-500 mt-1">Manage your construction site workforce.</p>
                </div>

                <div className="flex gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search workers..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-white rounded-lg border border-slate-200 focus:ring-2 focus:ring-slate-500 focus:border-slate-500 outline-none transition-all shadow-sm"
                        />
                    </div>
                    <ExportButton
                        data={filteredWorkers.map(w => {
                            const record = attendanceMap[w.id]
                            return {
                                Name: w.full_name,
                                Phone: w.phone_number || 'N/A',
                                Skill: w.skill_type,
                                Wage: w.daily_wage,
                                Status: record?.status || (record?.hajri_count ? 'Present' : 'Absent'),
                                Hajri: record?.hajri_count ?? 0,
                                Kharchi: record?.kharchi_amount ?? 0
                            }
                        })}
                        fileName={`Workers_List_${dateStr}`}
                    />
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white font-medium rounded-lg hover:bg-slate-800 transition-colors shadow-sm whitespace-nowrap"
                    >
                        <Plus size={18} />
                        Add Worker
                    </button>
                </div>
            </header>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                {loading ? (
                    <div className="p-12 text-center text-slate-500">Loading workforce...</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 border-b border-slate-100">
                                <tr>
                                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Name</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Skill Type</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Daily Wage</th>
                                    {/* Added Columns */}
                                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">Today's Status</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">Hajri</th>

                                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filteredWorkers.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                                            {searchQuery ? 'No matching workers found.' : 'No workers added yet.'}
                                        </td>
                                    </tr>
                                ) : (
                                    filteredWorkers.map((worker) => {
                                        const record = attendanceMap[worker.id]
                                        const hajriCount = record?.hajri_count ?? 0.0
                                        const status = record?.status || (hajriCount > 0 ? 'Present' : 'Absent')
                                        return (
                                            <tr key={worker.id} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-sm ring-1 ring-slate-200">
                                                            {worker.full_name.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <Link to={`/workers/${worker.id}`} className="font-medium text-slate-900 hover:text-blue-600 hover:underline">
                                                                {worker.full_name}
                                                            </Link>
                                                            <div className="text-xs text-slate-500 flex items-center gap-1">
                                                                <Phone size={12} /> {worker.phone_number || 'N/A'}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium 
                                                    ${worker.skill_type === 'Mason' ? 'bg-orange-100 text-orange-800' :
                                                            worker.skill_type === 'Laborer' ? 'bg-blue-100 text-blue-800' :
                                                                'bg-slate-100 text-slate-800'}`}>
                                                        {worker.skill_type}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                                                        <Coins size={16} className="text-slate-400" />
                                                        ₹{worker.daily_wage}
                                                    </div>
                                                </td>

                                                {/* New Columns */}
                                                <td className="px-6 py-4 text-center">
                                                    <div className="flex justify-center">
                                                        <StatusDropdown
                                                            status={status}
                                                            onChange={(val) => handleUpdate(worker.id, 'status', val)}
                                                        />
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <div className="flex justify-center">
                                                        <HajriStepper
                                                            initialValue={hajriCount}
                                                            baseWage={worker.daily_wage}
                                                            onChange={(val) => handleUpdate(worker.id, 'hajri_count', val)}
                                                        />
                                                    </div>
                                                </td>

                                                <td className="px-6 py-4 text-right">
                                                    <button
                                                        onClick={() => handleDeleteClick(worker)}
                                                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                        title="Delete"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </td>
                                            </tr>
                                        )
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* --- Monthly Labour Payment History --- */}
            <div className="pt-8 pb-12">
                <div className="flex items-center gap-2 mb-6">
                    <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                        <Banknote size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-900">Monthly Labour Payment History</h2>
                        <p className="text-slate-500 text-sm">Total wages paid grouped by month.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {monthlyStats.length === 0 ? (
                        <div className="col-span-full py-8 text-center text-slate-400 bg-slate-50 rounded-xl border border-slate-100 border-dashed">
                            No payment history available.
                        </div>
                    ) : (
                        monthlyStats.map((stat, index) => (
                            <div key={index} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col relative overflow-hidden group hover:border-indigo-300 transition-colors">
                                <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">{stat.month}</p>
                                <h3 className="text-3xl font-extrabold text-indigo-600">
                                    ₹{stat.amount.toLocaleString()}
                                </h3>
                                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity text-indigo-600">
                                    <Banknote size={48} />
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            <AddWorkerModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onSuccess={fetchData}
            />

            {/* Delete Confirmation Modal */}
            {workerToDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 relative animate-in zoom-in-95 duration-200">
                        <button
                            onClick={() => setWorkerToDelete(null)}
                            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
                        >
                            <X size={20} />
                        </button>

                        <div className="flex flex-col items-center text-center">
                            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
                                <AlertTriangle size={24} />
                            </div>

                            <h3 className="text-xl font-bold text-slate-900">Delete {workerToDelete.full_name}?</h3>
                            <p className="text-slate-500 mt-2 text-sm">
                                This action is permanent and cannot be undone. All attendance records and payments for this worker will be wiped.
                            </p>

                            <div className="w-full mt-6 text-left">
                                <label className="block text-xs font-medium text-slate-700 mb-1.5 uppercase tracking-wide">
                                    Type <span className="font-bold select-all">"{workerToDelete.full_name}"</span> to confirm
                                </label>
                                <input
                                    type="text"
                                    value={deleteConfirmationName}
                                    onChange={(e) => setDeleteConfirmationName(e.target.value)}
                                    placeholder="Type name here"
                                    className="w-full p-2.5 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                    autoFocus
                                />
                            </div>

                            <div className="flex gap-3 w-full mt-6">
                                <button
                                    onClick={() => setWorkerToDelete(null)}
                                    className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmDelete}
                                    disabled={deleteConfirmationName !== workerToDelete.full_name || isDeleteLoading}
                                    className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors shadow-sm"
                                >
                                    {isDeleteLoading ? 'Deleting...' : 'Delete Worker'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
