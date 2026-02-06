import { useState, useEffect, useMemo } from 'react'
import { supabase } from '@/utils/supabase/client'
import { Plus, Download, FileText, IndianRupee, Trash2, Calendar } from 'lucide-react'
import { format } from 'date-fns'
import ExportButton from '@/components/ExportButton'
import toast from 'react-hot-toast'

interface LedgerEntry {
    id: string
    date: string
    description: string
    bill_amount: number
    payment_received: number
    created_at: string
}

export default function ClientLedger() {
    const [entries, setEntries] = useState<LedgerEntry[]>([])
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)

    // Form State
    const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'))
    const [description, setDescription] = useState('')
    const [billAmount, setBillAmount] = useState<string>('')
    const [paymentReceived, setPaymentReceived] = useState<string>('')

    // Fetch Data
    const fetchLedger = async () => {
        setLoading(true)
        const { data, error } = await supabase
            .from('client_ledger')
            .select('*')
            .order('date', { ascending: true })
            .order('created_at', { ascending: true }) // Secondary sort for stability

        if (error) {
            console.error('Error fetching ledger:', error)
        } else {
            setEntries(data || [])
        }
        setLoading(false)
    }

    useEffect(() => {
        fetchLedger()
    }, [])

    // Add Entry
    const handleAddEntry = async (e: React.FormEvent) => {
        e.preventDefault()

        const bill = parseFloat(billAmount) || 0
        const pay = parseFloat(paymentReceived) || 0

        if (bill === 0 && pay === 0) {
            toast.error('Please enter either a Bill Amount or Payment Received.')
            return
        }

        if (!description.trim()) {
            toast.error('Please enter a description (e.g., Bill No or Payment details).')
            return
        }

        setSubmitting(true)
        const { error } = await supabase
            .from('client_ledger')
            .insert([{
                date,
                description,
                bill_amount: bill,
                payment_received: pay
            }])

        if (error) {
            console.error('Error adding entry:', error)
            toast.error('Failed to add entry')
        } else {
            // Reset form
            setDescription('')
            setBillAmount('')
            setPaymentReceived('')
            // Refresh
            fetchLedger()
        }
        setSubmitting(false)
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this entry?')) return

        const { error } = await supabase
            .from('client_ledger')
            .delete()
            .eq('id', id)

        if (error) {
            toast.error('Failed to delete')
        } else {
            setEntries(prev => prev.filter(e => e.id !== id))
        }
    }

    // Computed Data
    const processedData = useMemo(() => {
        let runningBalance = 0
        return entries.map(entry => {
            runningBalance = runningBalance + (entry.bill_amount - entry.payment_received)
            return {
                ...entry,
                runningBalance
            }
        })
    }, [entries])

    const totals = useMemo(() => {
        const totalBilled = entries.reduce((sum, e) => sum + (e.bill_amount || 0), 0)
        const totalReceived = entries.reduce((sum, e) => sum + (e.payment_received || 0), 0)
        const netDue = totalBilled - totalReceived
        return { totalBilled, totalReceived, netDue }
    }, [entries])

    return (
        <div className="space-y-6 pb-32"> {/* Increased padding for sticky footer */}
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Client Billing & Payments</h1>
                    <p className="text-slate-500 mt-1">Track project billing, payments received, and net outstanding balance.</p>
                </div>
                <ExportButton
                    data={processedData.map(entry => ({
                        Date: format(new Date(entry.date), 'dd MMM yyyy'),
                        Description: entry.description,
                        'Bill Amount': entry.bill_amount,
                        'Received': entry.payment_received,
                        'Balance': entry.runningBalance
                    }))}
                    fileName={`Client_Ledger_${format(new Date(), 'yyyy-MM-dd')} `}
                />
            </header>

            {/* INPUT FORM */}
            <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-6">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-4">Add New Entry</h3>
                <form onSubmit={handleAddEntry} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">

                    {/* Date */}
                    <div className="md:col-span-2">
                        <label className="block text-xs font-semibold text-slate-500 mb-1">Date</label>
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            required
                        />
                    </div>

                    {/* Description */}
                    <div className="md:col-span-4">
                        <label className="block text-xs font-semibold text-slate-500 mb-1">Bill No / Description</label>
                        <input
                            type="text"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="e.g. Bill #001 or Advance Payment"
                            className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>

                    {/* Bill Amount */}
                    <div className="md:col-span-2">
                        <label className="block text-xs font-semibold text-slate-500 mb-1">Bill Amount (₹)</label>
                        <input
                            type="number"
                            value={billAmount}
                            onChange={(e) => setBillAmount(e.target.value)}
                            placeholder="0"
                            min="0"
                            step="any"
                            className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none font-mono text-blue-600 font-bold"
                        />
                    </div>

                    {/* Payment Received */}
                    <div className="md:col-span-2">
                        <label className="block text-xs font-semibold text-slate-500 mb-1">Received (₹)</label>
                        <input
                            type="number"
                            value={paymentReceived}
                            onChange={(e) => setPaymentReceived(e.target.value)}
                            placeholder="0"
                            min="0"
                            step="any"
                            className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none font-mono text-green-600 font-bold"
                        />
                    </div>

                    {/* Action */}
                    <div className="md:col-span-2">
                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full bg-slate-900 hover:bg-slate-800 text-white p-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                        >
                            {submitting ? 'Adding...' : <><Plus size={16} /> Add Entry</>}
                        </button>
                    </div>
                </form>
            </div>

            {/* LEDGER TABLE */}
            <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4 font-bold text-slate-700 w-32">Date</th>
                                <th className="px-6 py-4 font-bold text-slate-700">Description / Bill No</th>
                                <th className="px-6 py-4 font-bold text-slate-700 text-right text-blue-700">Bill Amount (Dr)</th>
                                <th className="px-6 py-4 font-bold text-slate-700 text-right text-green-700">Received (Cr)</th>
                                <th className="px-6 py-4 font-bold text-slate-900 text-right bg-slate-100">Balance</th>
                                <th className="px-4 py-4 w-10"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-slate-500">Loading ledger...</td>
                                </tr>
                            ) : processedData.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-slate-500 italic">No entries found. Start by adding a bill or payment.</td>
                                </tr>
                            ) : (
                                processedData.map((entry) => (
                                    <tr key={entry.id} className="hover:bg-slate-50/80 transition-colors group">
                                        <td className="px-6 py-3 font-mono text-slate-600">
                                            {format(new Date(entry.date), 'dd MMM yyyy')}
                                        </td>
                                        <td className="px-6 py-3 font-medium text-slate-800">
                                            {entry.description}
                                        </td>
                                        <td className="px-6 py-3 text-right font-mono font-medium text-blue-600">
                                            {entry.bill_amount > 0 ? `₹${entry.bill_amount.toLocaleString()} ` : '-'}
                                        </td>
                                        <td className="px-6 py-3 text-right font-mono font-medium text-green-600">
                                            {entry.payment_received > 0 ? `₹${entry.payment_received.toLocaleString()} ` : '-'}
                                        </td>
                                        <td className={`px - 6 py - 3 text - right font - mono font - bold bg - slate - 50 / 50 ${entry.runningBalance >= 0 ? 'text-slate-900' : 'text-red-500'} `}>
                                            ₹{entry.runningBalance.toLocaleString()}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <button
                                                onClick={() => handleDelete(entry.id)}
                                                className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-1"
                                                title="Delete Entry"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* STICKY FOOTER SUMMARY */}
            <div className="fixed bottom-0 left-0 right-0 md:pl-72 z-40 transition-[padding] duration-700"> {/* md:pl-72 matches sidebar width */}
                <div className="bg-white/90 backdrop-blur-md border-t border-slate-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] p-4 md:px-8">
                    <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-slate-100 rounded-lg text-slate-500">
                                <FileText size={20} />
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 uppercase font-bold">Total Billed</p>
                                <p className="text-lg font-bold text-blue-600">₹{totals.totalBilled.toLocaleString()}</p>
                            </div>
                        </div>

                        <div className="h-8 w-px bg-slate-200 hidden md:block"></div>

                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-slate-100 rounded-lg text-slate-500">
                                <IndianRupee size={20} />
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 uppercase font-bold">Total Received</p>
                                <p className="text-lg font-bold text-green-600">₹{totals.totalReceived.toLocaleString()}</p>
                            </div>
                        </div>

                        <div className="h-8 w-px bg-slate-200 hidden md:block"></div>

                        <div className="flex items-center gap-3 bg-slate-900 text-white px-5 py-2 rounded-xl shadow-lg shadow-slate-900/20">
                            <div className="text-right">
                                <p className="text-xs text-slate-400 uppercase font-bold">Net Due Amount</p>
                                <p className="text-xl font-bold">₹{totals.netDue.toLocaleString()}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    )
}
