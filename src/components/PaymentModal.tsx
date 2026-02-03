import { useState, useEffect } from 'react'
import { supabase } from '@/utils/supabase/client'

interface PaymentModalProps {
    isOpen: boolean
    onClose: () => void
    onSuccess: (paymentId?: string) => void
    memberId?: string
    memberName?: string
}

interface Plan {
    id: string
    name: string
    price: number
    discount_price?: number
}

export default function PaymentModal({ isOpen, onClose, onSuccess, memberId: initialMemberId, memberName: initialMemberName }: PaymentModalProps) {
    const [memberId, setMemberId] = useState(initialMemberId || '')
    const [memberName, setMemberName] = useState(initialMemberName || '')
    const [amount, setAmount] = useState('')
    const [method, setMethod] = useState('cash')
    const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0])
    const [loading, setLoading] = useState(false)

    // Search State
    const [searchQuery, setSearchQuery] = useState('')
    const [searchResults, setSearchResults] = useState<{ id: string, full_name: string }[]>([])

    // Plans State
    const [plans, setPlans] = useState<Plan[]>([])
    const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null)

    useEffect(() => {
        if (isOpen) {
            setMemberId(initialMemberId || '')
            setMemberName(initialMemberName || '')
            setSearchQuery('')
            setSearchResults([])
            setAmount('')
            setSelectedPlanId(null)
        }
    }, [isOpen, initialMemberId, initialMemberName])

    // Search Members
    useEffect(() => {
        const searchMembers = async () => {
            if (!searchQuery || memberId) return; // Don't search if already selected or empty

            try {
                const { data } = await supabase
                    .from('members')
                    .select('id, full_name')
                    .ilike('full_name', `%${searchQuery}%`)
                    .limit(5)

                setSearchResults(data || [])
            } catch (error) {
                console.error('Search error:', error)
            }
        }

        const timeoutId = setTimeout(searchMembers, 300)
        return () => clearTimeout(timeoutId)
    }, [searchQuery, memberId])

    // Fetch Plans
    useEffect(() => {
        const fetchPlans = async () => {
            const { data } = await supabase
                .from('plans')
                .select('id, name, price, discount_price')
                .eq('is_active', true)
                .order('price', { ascending: true })

            if (data) setPlans(data)
        }
        if (isOpen) fetchPlans()
    }, [isOpen])

    const handlePlanSelect = (plan: Plan) => {
        if (selectedPlanId === plan.id) {
            // Deselect
            setSelectedPlanId(null)
            setAmount('')
        } else {
            // Select
            setSelectedPlanId(plan.id)
            const finalPrice = plan.discount_price ?? plan.price
            setAmount(finalPrice.toString())
        }
    }

    if (!isOpen) return null

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!memberId) {
            alert('Please select a member first.')
            return
        }
        setLoading(true)

        try {
            const paymentPayload = {
                member_id: memberId,
                amount: parseFloat(amount), // Ensure float
                payment_method: method,     // Map dropdown 'method'
                payment_date: paymentDate   // Map date picker 'paymentDate'
            }

            console.log('Sending Payment:', paymentPayload)

            const { data, error } = await supabase
                .from('payments')
                .insert([paymentPayload])
                .select() // Select to get ID

            if (error) throw error

            const newPaymentId = data?.[0]?.id

            setAmount('')
            setMethod('cash')
            setPaymentDate(new Date().toISOString().split('T')[0])
            onSuccess(newPaymentId) // Pass ID back
            onClose()
            alert('Payment recorded successfully!')
        } catch (error) {
            console.error('Error recording payment:', error)
            alert('Failed to record payment: ' + (error as any).message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <h3 className="text-lg font-semibold text-gray-900">Record Payment</h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-500 transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Member Selection */}
                    {initialMemberId ? (
                        <div className="bg-blue-50 p-3 rounded-lg text-blue-800 text-sm font-medium mb-4">
                            Member: {memberName}
                        </div>
                    ) : (
                        <div className="relative">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Select Member</label>
                            {memberId ? (
                                <div className="flex items-center justify-between bg-blue-50 p-2 rounded-lg border border-blue-100">
                                    <span className="text-blue-800 font-medium">{memberName}</span>
                                    <button
                                        type="button"
                                        onClick={() => { setMemberId(''); setMemberName(''); setSearchQuery('') }}
                                        className="text-blue-400 hover:text-blue-600"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <input
                                        type="text"
                                        placeholder="Search member name..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                    />
                                    {searchResults.length > 0 && (
                                        <div className="absolute z-10 w-full bg-white mt-1 border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                                            {searchResults.map(result => (
                                                <button
                                                    key={result.id}
                                                    type="button"
                                                    onClick={() => {
                                                        setMemberId(result.id)
                                                        setMemberName(result.full_name)
                                                        setSearchResults([])
                                                    }}
                                                    className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm text-gray-700"
                                                >
                                                    {result.full_name}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    )}

                    {/* Plans Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Select a Plan (Optional)</label>
                        <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1">
                            {plans.map(plan => {
                                const price = plan.discount_price ?? plan.price
                                const isSelected = selectedPlanId === plan.id
                                return (
                                    <button
                                        key={plan.id}
                                        type="button"
                                        onClick={() => handlePlanSelect(plan)}
                                        className={`text-left p-2 rounded-lg border text-sm transition-all ${isSelected
                                            ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-500'
                                            : 'bg-white border-gray-200 hover:border-gray-300'
                                            }`}
                                    >
                                        <div className="font-medium text-gray-900 truncate" title={plan.name}>{plan.name}</div>
                                        <div className="text-gray-500 text-xs">₹{price}</div>
                                    </button>
                                )
                            })}
                            {plans.length === 0 && (
                                <p className="text-xs text-gray-400 col-span-2 text-center py-2">No active plans found.</p>
                            )}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                        <div className="relative">
                            <span className="absolute left-3 top-2 text-gray-500">₹</span>
                            <input
                                type="number"
                                required
                                min="0"
                                step="0.01"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                placeholder="0.00"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                        <select
                            value={method}
                            onChange={(e) => setMethod(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white"
                        >
                            <option value="cash">Cash</option>
                            <option value="upi">UPI</option>
                            <option value="card">Card</option>
                            <option value="other">Other</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Payment Date</label>
                        <input
                            type="date"
                            required
                            value={paymentDate}
                            onChange={(e) => setPaymentDate(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                        />
                    </div>

                    <div className="pt-4 flex gap-3 justify-end">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {loading ? 'Recording...' : 'Save Payment'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
