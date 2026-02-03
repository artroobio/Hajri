
import { useEffect, useState } from 'react'
import { supabase } from '@/utils/supabase/client'
import { Link } from 'react-router-dom'

interface Member {
    id: string
    full_name: string
    phone: string
    balance: number
    status: string
}

export default function BalancePayments() {
    const [members, setMembers] = useState<Member[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')

    useEffect(() => {
        const fetchMembers = async () => {
            try {
                const { data, error } = await supabase
                    .from('members')
                    .select('id, full_name, phone, balance, status')
                    .gt('balance', 0)
                    .order('balance', { ascending: false })

                if (error) throw error
                setMembers(data || [])
            } catch (error) {
                console.error('Error fetching balance members:', error)
            } finally {
                setLoading(false)
            }
        }
        fetchMembers()
    }, [])

    const filteredMembers = members.filter(member =>
        member.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.phone.includes(searchQuery)
    )

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-7xl mx-auto">
                <header className="mb-8">
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                        <Link to="/" className="hover:text-gray-900">Dashboard</Link>
                        <span>/</span>
                        <span>Billing</span>
                    </div>
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Balance Payments</h1>
                            <p className="text-gray-500 mt-2">Clients with outstanding dues.</p>
                        </div>
                        <div className="relative w-full md:w-64">
                            <input
                                type="text"
                                placeholder="Search members..."
                                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            <svg className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                    </div>
                </header>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    {loading ? (
                        <div className="p-12 text-center">
                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mb-4"></div>
                            <p className="text-gray-500">Loading...</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-gray-50 border-b border-gray-100">
                                    <tr>
                                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Name</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Phone</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Balance Amount</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {filteredMembers.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                                                {searchQuery ? 'No members match your search.' : 'No pending balances found.'}
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredMembers.map((member) => (
                                            <tr key={member.id} className="hover:bg-gray-50/50">
                                                <td className="px-6 py-4 font-medium text-gray-900">
                                                    <Link to={`/members/${member.id}`} className="hover:underline hover:text-blue-600">
                                                        {member.full_name}
                                                    </Link>
                                                </td>
                                                <td className="px-6 py-4 text-gray-600 font-mono text-sm">{member.phone}</td>
                                                <td className="px-6 py-4 text-red-600 font-bold text-sm">
                                                    ₹ {member.balance.toLocaleString()}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <Link
                                                        to={`/members/${member.id}`}
                                                        className="inline-flex items-center px-4 py-1.5 bg-yellow-400 text-yellow-900 text-sm font-bold rounded-md hover:bg-yellow-500 transition-colors"
                                                    >
                                                        Settle
                                                    </Link>
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
        </div>
    )
}
