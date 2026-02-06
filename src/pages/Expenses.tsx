
import { useEffect, useState } from 'react'
import { supabase } from '@/utils/supabase/client'
import AddExpenseModal from '@/components/AddExpenseModal'
import { Plus, TrendingDown, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'

interface Expense {
    id: string
    title: string
    category: string
    amount: number
    date: string
}

export default function Expenses() {
    const [expenses, setExpenses] = useState<Expense[]>([])
    const [loading, setLoading] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [totalThisMonth, setTotalThisMonth] = useState(0)

    const fetchExpenses = async () => {
        try {
            setLoading(true)
            const { data, error } = await supabase
                .from('expenses')
                .select('*')
                .order('date', { ascending: false })

            if (error) throw error

            setExpenses(data || [])
            calculateTotal(data || [])
        } catch (error) {
            console.error('Error fetching expenses:', error)
        } finally {
            setLoading(false)
        }
    }

    const calculateTotal = (data: Expense[]) => {
        const now = new Date()
        const currentMonth = now.getMonth()
        const currentYear = now.getFullYear()

        const total = data.reduce((sum, expense) => {
            const expDate = new Date(expense.date)
            if (expDate.getMonth() === currentMonth && expDate.getFullYear() === currentYear) {
                return sum + Number(expense.amount)
            }
            return sum
        }, 0)

        setTotalThisMonth(total)
    }

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this expense?')) return

        try {
            const { error } = await supabase.from('expenses').delete().eq('id', id)
            if (error) throw error

            const updated = expenses.filter(e => e.id !== id)
            setExpenses(updated)
            calculateTotal(updated)
        } catch (error) {
            console.error('Error deleting expense:', error)
            toast.error('Failed to delete expense.')
        }
    }

    useEffect(() => {
        fetchExpenses()
    }, [])

    return (
        <div className="min-h-screen p-6 md:p-8">
            <div className="max-w-7xl mx-auto">
                <header className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Expenses</h1>
                        <p className="text-gray-500 mt-2">Track your business spending.</p>
                    </div>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="inline-flex items-center px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors shadow-sm"
                    >
                        <Plus className="w-5 h-5 mr-2" />
                        Add Expense
                    </button>
                </header>

                {/* Stats Card */}
                <div className="backdrop-blur-[20px] bg-white/70 rounded-xl shadow-sm border border-white/40 p-6 mb-8 max-w-sm">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-medium text-gray-500">Total Expenses (This Month)</h3>
                        <div className="p-2 bg-red-50 rounded-lg">
                            <TrendingDown className="w-5 h-5 text-red-600" />
                        </div>
                    </div>
                    <p className="text-3xl font-bold text-gray-900">₹{totalThisMonth.toLocaleString()}</p>
                </div>

                {/* Expenses Table */}
                <div className="backdrop-blur-[20px] bg-white/70 rounded-xl shadow-sm border border-white/40 overflow-hidden">
                    {loading ? (
                        <div className="p-12 text-center">
                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mb-4"></div>
                            <p className="text-gray-500">Loading expenses...</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-white/50 text-gray-500 font-medium border-b border-white/40">
                                    <tr>
                                        <th className="px-6 py-4">Date</th>
                                        <th className="px-6 py-4">Title</th>
                                        <th className="px-6 py-4">Category</th>
                                        <th className="px-6 py-4 text-right">Amount</th>
                                        <th className="px-6 py-4 text-center">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {expenses.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                                                No expenses recorded yet.
                                            </td>
                                        </tr>
                                    ) : (
                                        expenses.map((expense) => (
                                            <tr key={expense.id} className="hover:bg-white/50 transition-colors">
                                                <td className="px-6 py-4 text-gray-900">
                                                    {new Date(expense.date).toLocaleDateString('en-US', {
                                                        year: 'numeric',
                                                        month: 'short',
                                                        day: 'numeric'
                                                    })}
                                                </td>
                                                <td className="px-6 py-4 text-gray-900 font-medium">{expense.title}</td>
                                                <td className="px-6 py-4">
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                                        {expense.category}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right font-medium text-red-600">
                                                    -₹{Number(expense.amount).toLocaleString()}
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <button
                                                        onClick={() => handleDelete(expense.id)}
                                                        className="p-1.5 hover:bg-red-50 text-red-400 hover:text-red-600 rounded-md transition-colors"
                                                        title="Delete Expense"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            <AddExpenseModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={fetchExpenses}
            />
        </div>
    )
}
