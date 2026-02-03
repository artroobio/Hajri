'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/utils/supabase/client'

import Link from 'next/link'

interface Payment {
    id: string
    amount: number
    payment_method: string
    payment_type: string
    payment_date: string
    created_at: string
    members: {
        full_name: string
    } | null
}

export default function BillingPage() {
    const [payments, setPayments] = useState<Payment[]>([])
    const [loading, setLoading] = useState(true)
    const [filterPeriod, setFilterPeriod] = useState('month') // today, week, month, all

    // Stats States
    const [todayRevenue, setTodayRevenue] = useState(0)
    const [monthRevenue, setMonthRevenue] = useState(0)
    const [activeMembers, setActiveMembers] = useState(0)


    const fetchStats = useCallback(async () => {
        try {
            const today = new Date()
            const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString()
            const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString()

            // 1. Today's Revenue
            const { data: todayData } = await supabase
                .from('payments')
                .select('amount')
                .gte('payment_date', startOfDay)

            const todaySum = todayData?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0
            setTodayRevenue(todaySum)

            // 2. Monthly Revenue
            const { data: monthData } = await supabase
                .from('payments')
                .select('amount')
                .gte('payment_date', startOfMonth)

            const monthSum = monthData?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0
            setMonthRevenue(monthSum)

            // 3. Active Members
            // Logic: Status is 'active' OR End Date is in the future
            const todayISO = today.toISOString().split('T')[0]
            const { count } = await supabase
                .from('members')
                .select('*', { count: 'exact', head: true })
                .or(`status.eq.active,end_date.gte.${todayISO}`)

            setActiveMembers(count || 0)

        } catch (error) {
            console.error('Error fetching stats:', error)
        }
    }, [])

    const fetchPayments = useCallback(async () => {
        try {
            setLoading(true)

            let query = supabase
                .from('payments')
                .select('*, members(full_name)')
                .order('created_at', { ascending: false })

            // Apply Filter
            const today = new Date()
            if (filterPeriod === 'today') {
                const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString()
                query = query.gte('payment_date', startOfDay)
            } else if (filterPeriod === 'week') {
                const startOfWeek = new Date(today.setDate(today.getDate() - 7)).toISOString()
                query = query.gte('payment_date', startOfWeek)
            } else if (filterPeriod === 'month') {
                const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString()
                query = query.gte('payment_date', startOfMonth)
            }
            // 'all' = no filter

            const { data, error } = await query

            if (error) {
                console.error('Error fetching payments:', error)
            } else {
                setPayments(data as Payment[] || [])
            }
        } catch (error) {
            console.error('Unexpected error:', error)
        } finally {
            setLoading(false)
        }
    }, [filterPeriod])

    useEffect(() => {
        fetchStats()
        fetchPayments()
    }, [fetchStats, fetchPayments])


    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-8">
            <div className="max-w-7xl mx-auto">
                <header className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Revenue Dashboard</h1>
                    <p className="text-gray-500 mt-2">Financial overview and transaction history.</p>
                </header>

                {/* STATS CARDS */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    {/* Today's Revenue */}
                    <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-6 text-white shadow-lg transform hover:scale-105 transition-transform duration-200">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-green-100 font-medium">Today's Revenue</h3>
                            <svg className="w-8 h-8 text-green-200 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </div>
                        <p className="text-4xl font-bold tracking-tight">₹ {todayRevenue.toLocaleString()}</p>
                        <p className="text-sm text-green-100 mt-2 flex items-center gap-1">
                            <span className="bg-white/20 px-1.5 rounded text-xs">Today</span>
                        </p>
                    </div>

                    {/* Monthly Revenue */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:border-blue-200 transition-colors">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-gray-500 font-medium">Monthly Revenue</h3>
                            <svg className="w-8 h-8 text-blue-500 bg-blue-50 p-1.5 rounded-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                        </div>
                        <p className="text-3xl font-bold text-gray-900">₹ {monthRevenue.toLocaleString()}</p>
                        <p className="text-sm text-gray-500 mt-1">Current Month</p>
                    </div>

                    {/* Active Members */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:border-purple-200 transition-colors">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-gray-500 font-medium">Active Members</h3>
                            <svg className="w-8 h-8 text-purple-500 bg-purple-50 p-1.5 rounded-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                        </div>
                        <p className="text-3xl font-bold text-gray-900">{activeMembers}</p>
                        <p className="text-sm text-gray-500 mt-1">Valid Memberships</p>
                    </div>
                </div>


                {/* TRANSACTIONS TABLE */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <h2 className="text-lg font-bold text-gray-900">Recent Transactions</h2>

                        {/* Filter Dropdown */}
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500">Filter:</span>
                            <select
                                value={filterPeriod}
                                onChange={(e) => setFilterPeriod(e.target.value)}
                                className="bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2 outline-none"
                            >
                                <option value="today">Today</option>
                                <option value="week">This Week</option>
                                <option value="month">This Month</option>
                                <option value="all">All Time</option>
                            </select>
                        </div>
                    </div>

                    {loading ? (
                        <div className="p-12 text-center">
                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
                            <p className="text-gray-500">Loading transactions...</p>
                        </div>
                    ) : payments.length === 0 ? (
                        <div className="p-12 text-center text-gray-500">
                            No payments found for this period.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50/50 border-b border-gray-200">
                                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Date</th>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Member Name</th>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Type</th>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Method</th>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Amount</th>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {payments.map((payment) => (
                                        <tr key={payment.id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-6 py-4 text-gray-600 text-sm whitespace-nowrap">
                                                {new Date(payment.payment_date).toLocaleDateString('en-IN', {
                                                    day: 'numeric',
                                                    month: 'short',
                                                    year: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-semibold text-gray-900">
                                                    {payment.members?.full_name || 'Unknown Member'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600">
                                                {payment.payment_type}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${payment.payment_method === 'Cash'
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-blue-100 text-blue-800'
                                                    }`}>
                                                    {payment.payment_method}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <span className="font-mono text-gray-900 font-bold">₹ {payment.amount.toFixed(2)}</span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <Link
                                                    href={`/invoices/${payment.id}`}
                                                    target="_blank"
                                                    className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-blue-700 bg-blue-100 hover:bg-blue-200 transition-colors"
                                                    title="View Receipt"
                                                >
                                                    View Receipt
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
