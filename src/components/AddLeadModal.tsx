
import { useState } from 'react'
import { supabase } from '@/utils/supabase/client'
import toast from 'react-hot-toast'

interface AddLeadModalProps {
    isOpen: boolean
    onClose: () => void
    onSuccess: () => void
}

export default function AddLeadModal({ isOpen, onClose, onSuccess }: AddLeadModalProps) {
    const [name, setName] = useState('')
    const [phone, setPhone] = useState('')
    const [source, setSource] = useState('Walk-in')
    const [enquiryDate, setEnquiryDate] = useState(new Date().toISOString().split('T')[0]!)
    const [notes, setNotes] = useState('')
    const [loading, setLoading] = useState(false)

    if (!isOpen) return null

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const { error } = await supabase
                .from('enquiries')
                .insert([{
                    name,
                    phone,
                    source,
                    notes,
                    status: 'new',
                    created_at: new Date(enquiryDate).toISOString()
                }])

            if (error) throw error

            setName('')
            setPhone('')
            setSource('Walk-in')
            setEnquiryDate(new Date().toISOString().split('T')[0]!)
            setNotes('')
            onSuccess()
            onClose()
            toast.success('Lead Added successfully!')
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error'
            console.error('Error adding lead:', error)
            toast.error('Failed to add lead: ' + errorMessage)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <h3 className="text-lg font-semibold text-gray-900">Add New Lead</h3>
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
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                        <input
                            type="text"
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                            placeholder="John Doe"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                        <input
                            type="tel"
                            required
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                            placeholder="+91 99999 00000"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Source</label>
                        <select
                            value={source}
                            onChange={(e) => setSource(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white"
                        >
                            <option value="Walk-in">Walk-in</option>
                            <option value="Instagram">Instagram</option>
                            <option value="Google">Google</option>
                            <option value="Referral">Referral</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                        <div className="flex gap-2">
                            {/* Day */}
                            <select
                                value={new Date(enquiryDate).getDate()}
                                onChange={(e) => {
                                    const d = new Date(enquiryDate)
                                    d.setDate(parseInt(e.target.value))
                                    setEnquiryDate(d.toISOString().split('T')[0]!)
                                }}
                                className="w-1/3 appearance-none bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all cursor-pointer"
                            >
                                {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                                    <option key={day} value={day}>{day}</option>
                                ))}
                            </select>

                            {/* Month */}
                            <select
                                value={new Date(enquiryDate).getMonth()}
                                onChange={(e) => {
                                    const d = new Date(enquiryDate)
                                    d.setMonth(parseInt(e.target.value))
                                    setEnquiryDate(d.toISOString().split('T')[0]!)
                                }}
                                className="w-1/3 appearance-none bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all cursor-pointer"
                            >
                                {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((month, index) => (
                                    <option key={month} value={index}>{month}</option>
                                ))}
                            </select>

                            {/* Year */}
                            <select
                                value={new Date(enquiryDate).getFullYear()}
                                onChange={(e) => {
                                    const d = new Date(enquiryDate)
                                    d.setFullYear(parseInt(e.target.value))
                                    setEnquiryDate(d.toISOString().split('T')[0]!)
                                }}
                                className="w-1/3 appearance-none bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all cursor-pointer"
                            >
                                {Array.from({ length: 7 }, (_, i) => 2024 + i).map(year => (
                                    <option key={year} value={year}>{year}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                        <textarea
                            rows={3}
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                            placeholder="Interests, goals, etc."
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
                            {loading ? 'Adding...' : 'Add Lead'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
