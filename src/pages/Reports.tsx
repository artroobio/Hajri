
import { useEffect, useState } from 'react'
import { supabase } from '@/utils/supabase/client'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'

interface FinancialData {
    income: number
    expenses: number
    profit: number
    expenseBreakdown: { name: string; value: number }[]
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d']

export default function Reports() {
    const [data, setData] = useState<FinancialData>({
        income: 0,
        expenses: 0,
        profit: 0,
        expenseBreakdown: []
    })
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchData() {
            try {
                setLoading(true)
                const now = new Date()
                const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
                const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
                endOfMonth.setHours(23, 59, 59, 999)

                const startStr = startOfMonth.toISOString()
                const endStr = endOfMonth.toISOString()

                // Fetch Income (Payments)
                const { data: payments } = await supabase
                    .from('payments')
                    .select('amount')
                    .gte('payment_date', startStr)
                    .lte('payment_date', endStr)

                // Fetch Expenses
                const { data: expenses } = await supabase
                    .from('expenses')
                    .select('amount, category')
                    .gte('date', startStr)
                    .lte('date', endStr)

                // Calculate Totals
                const totalIncome = payments?.reduce((sum, p) => sum + (Number(p.amount) || 0), 0) || 0
                const totalExpenses = expenses?.reduce((sum, e) => sum + (Number(e.amount) || 0), 0) || 0
                const netProfit = totalIncome - totalExpenses

                // Calculate Expense Breakdown
                const breakdownMap = expenses?.reduce((acc: any, curr) => {
                    const category = curr.category.charAt(0).toUpperCase() + curr.category.slice(1) // Capitalize
                    acc[category] = (acc[category] || 0) + (Number(curr.amount) || 0)
                    return acc
                }, {}) || {}

                const expenseBreakdown = Object.keys(breakdownMap).map(key => ({
                    name: key,
                    value: breakdownMap[key]
                }))

                setData({
                    income: totalIncome,
                    expenses: totalExpenses,
                    profit: netProfit,
                    expenseBreakdown
                })

            } catch (error) {
                console.error('Error fetching report data:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [])

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        )
    }

    return (
        <div className="min-h-screen p-6 md:p-8">
            <div className="max-w-7xl mx-auto space-y-8">
                <header>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Monthly Financial Report</h1>
                    <p className="text-gray-500 mt-2">
                        Overview for {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}
                    </p>
                </header>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Income Card */}
                    <div className="backdrop-blur-[20px] bg-white/70 rounded-xl shadow-sm border border-white/40 p-6">
                        <p className="text-sm font-medium text-gray-500 mb-1">Total Income</p>
                        <h3 className="text-3xl font-bold text-green-600">₹{data.income.toLocaleString()}</h3>
                    </div>

                    {/* Expenses Card */}
                    <div className="backdrop-blur-[20px] bg-white/70 rounded-xl shadow-sm border border-white/40 p-6">
                        <p className="text-sm font-medium text-gray-500 mb-1">Total Expenses</p>
                        <h3 className="text-3xl font-bold text-red-600">₹{data.expenses.toLocaleString()}</h3>
                    </div>

                    {/* Profit Card */}
                    <div className="backdrop-blur-[20px] bg-white/70 rounded-xl shadow-sm border border-white/40 p-6">
                        <p className="text-sm font-medium text-gray-500 mb-1">Net Profit</p>
                        <h3 className={`text-3xl font-bold ${data.profit >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                            {data.profit >= 0 ? '+' : ''}₹{data.profit.toLocaleString()}
                        </h3>
                    </div>
                </div>

                {/* Charts Area */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Expense Breakdown Chart */}
                    <div className="backdrop-blur-[20px] bg-white/70 rounded-xl shadow-sm border border-white/40 p-6 h-[400px]">
                        <h3 className="text-lg font-bold text-gray-900 mb-6">Expense Breakdown</h3>
                        {data.expenseBreakdown.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={data.expenseBreakdown}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        outerRadius={120}
                                        fill="#8884d8"
                                        dataKey="value"
                                    >
                                        {data.expenseBreakdown.map((_, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        formatter={(value: any) => [`₹${value.toLocaleString()}`, 'Amount']}
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                    />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex items-center justify-center h-full text-gray-400">
                                No expense data available for this month.
                            </div>
                        )}
                    </div>

                    {/* Placeholder for future Income Trends or other charts */}
                    <div className="backdrop-blur-[20px] bg-white/70 rounded-xl shadow-sm border border-white/40 p-6 flex flex-col justify-center items-center text-center h-[400px]">
                        <div className="p-4 bg-gray-50 rounded-full mb-4">
                            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-medium text-gray-900">More Insights Coming Soon</h3>
                        <p className="text-gray-500 max-w-xs mt-2">
                            Add more data to unlock deeper analysis of your business performance.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
