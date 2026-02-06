
import { useEffect, useState } from 'react'
import { supabase } from '@/utils/supabase/client'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '@/context/ThemeContext'
import { LogOut, Save, User, Building, Palette, Upload, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'

export default function Settings() {
    const navigate = useNavigate()
    const {
        bgType, setBgType,
        backgroundImage, setBackgroundImage,
        brandName, setBrandName,
        brandLogo, setBrandLogo
    } = useTheme()

    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [uploading, setUploading] = useState(false)

    // User Profile State
    const [profile, setProfile] = useState({
        email: '',
        full_name: ''
    })

    // Project Settings State
    const [settings, setSettings] = useState({
        id: '',
        gym_name: '', // Kept as gym_name in DB for now to avoid migration, mapped to Project Name UI
        address: '',
        phone: '',
        receipt_footer: ''
    })

    useEffect(() => {
        loadData()
    }, [])

    async function loadData() {
        try {
            setLoading(true)

            // 1. Load User Profile
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                setProfile({
                    email: user.email || '',
                    full_name: user.user_metadata?.full_name || ''
                })
            }

            // 2. Load Project Settings
            const { data: projectData } = await supabase
                .from('project_settings')
                .select('*')
                .limit(1)
                .single()

            if (projectData) {
                setSettings({
                    id: projectData.id,
                    gym_name: projectData.project_name || '', // Mapping project_name to our local state which is still gym_name for now
                    address: projectData.address || '',
                    phone: projectData.phone || '',
                    receipt_footer: projectData.receipt_footer || ''
                })
            }
        } catch (error) {
            console.error('Error loading settings:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)
        try {
            const { error } = await supabase.auth.updateUser({
                data: { full_name: profile.full_name }
            })
            if (error) throw error
            toast.success('Profile updated successfully!')
        } catch (error: any) {
            toast.error(error.message || 'Error updating profile')
        } finally {
            setSaving(false)
        }
    }

    const handleSaveProjectSettings = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)
        try {
            const { error } = await supabase
                .from('project_settings')
                .upsert({
                    id: settings.id || undefined,
                    project_name: settings.gym_name,
                    address: settings.address,
                    phone: settings.phone,
                    receipt_footer: settings.receipt_footer,
                    updated_at: new Date().toISOString()
                })

            if (error) throw error
            toast.success('Project settings saved!')
        } catch (error: any) {
            toast.error(error.message || 'Error saving settings')
        } finally {
            setSaving(false)
        }
    }

    const handleLogout = async () => {
        await supabase.auth.signOut()
        navigate('/login')
    }

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, setter: (val: string | null) => void) => {
        const file = e.target.files?.[0]
        if (!file) {

            return
        }



        // Validate file type
        if (!file.type.startsWith('image/')) {
            toast.error('Please select an image file')
            e.target.value = '' // Reset input
            return
        }

        if (file.size > 3 * 1024 * 1024) {
            toast.error('File is too large (Max 3MB)')
            e.target.value = '' // Reset input
            return
        }

        setUploading(true)
        const reader = new FileReader()
        reader.onloadend = () => {
            const dataUrl = reader.result as string
            setter(dataUrl)
            setUploading(false)
            e.target.value = '' // Reset input so same file can be selected again
        }
        reader.onerror = (error) => {
            console.error('Error reading file:', error)
            toast.error('Failed to read image file. Please try again.')
            setUploading(false)
            e.target.value = '' // Reset input
        }
        reader.readAsDataURL(file)
    }

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        )
    }

    return (
        <div className="min-h-screen p-4 md:p-8 max-w-4xl mx-auto space-y-8">

            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">App Configuration</h1>
                    <p className="text-gray-500 mt-1">Manage your profile, branding, and system preferences.</p>
                </div>
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors font-medium border border-red-100"
                >
                    <LogOut className="w-4 h-4" />
                    Logout
                </button>
            </div>

            {/* Profile Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex items-center gap-3">
                    <User className="w-5 h-5 text-gray-400" />
                    <h2 className="text-lg font-bold text-gray-900">User Profile</h2>
                </div>
                <form onSubmit={handleUpdateProfile} className="p-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                            <input
                                type="email"
                                value={profile.email}
                                disabled
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                            <input
                                type="text"
                                value={profile.full_name}
                                onChange={e => setProfile({ ...profile, full_name: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            />
                        </div>
                    </div>
                    <div className="flex justify-end">
                        <button
                            type="submit"
                            disabled={saving}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2 font-medium"
                        >
                            <Save className="w-4 h-4" />
                            Update Profile
                        </button>
                    </div>
                </form>
            </div>

            {/* Brand Identity */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex items-center gap-3">
                    <Palette className="w-5 h-5 text-gray-400" />
                    <h2 className="text-lg font-bold text-gray-900">Brand Identity</h2>
                </div>
                <div className="p-6 space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Brand Name (Sidebar)</label>
                        <input
                            type="text"
                            value={brandName}
                            onChange={(e) => setBrandName(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            placeholder="Enter Project or Company Name"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Logo</label>
                        <div className="flex items-start gap-4">
                            <div className="w-20 h-20 rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden">
                                {brandLogo ? (
                                    <img src={brandLogo} alt="Logo" className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-xs text-gray-400">No Logo</span>
                                )}
                            </div>
                            <div className="flex-1 space-y-2">
                                <label className={`flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 w-fit transition-colors ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                    <Upload className="w-4 h-4" />
                                    <span className="text-sm font-medium">{uploading ? 'Uploading...' : 'Upload Logo'}</span>
                                    <input
                                        type="file"
                                        className="hidden"
                                        accept="image/*"
                                        onChange={(e) => handleImageUpload(e, setBrandLogo)}
                                        disabled={uploading}
                                    />
                                </label>
                                {brandLogo && (
                                    <button
                                        onClick={() => setBrandLogo(null)}
                                        className="text-red-600 text-sm hover:text-red-700 flex items-center gap-1 mt-2"
                                    >
                                        <Trash2 className="w-3 h-3" /> Remove
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Appearance Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex items-center gap-3">
                    <Palette className="w-5 h-5 text-gray-400" />
                    <h2 className="text-lg font-bold text-gray-900">Appearance</h2>
                </div>
                <div className="p-6 space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Background Style</label>
                        <div className="flex items-center gap-4">
                            <button
                                type="button"
                                onClick={() => setBgType('default')}
                                className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${bgType === 'default'
                                    ? 'bg-slate-900 text-white border-slate-900 ring-2 ring-slate-900 ring-offset-2'
                                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                    }`}
                            >
                                Default
                            </button>
                            <button
                                type="button"
                                onClick={() => setBgType('white')}
                                className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${bgType === 'white'
                                    ? 'bg-slate-900 text-white border-slate-900 ring-2 ring-slate-900 ring-offset-2'
                                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                    }`}
                            >
                                White
                            </button>
                            <button
                                type="button"
                                onClick={() => setBgType('custom')}
                                className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${bgType === 'custom'
                                    ? 'bg-indigo-600 text-white border-indigo-600 ring-2 ring-indigo-600 ring-offset-2'
                                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                    }`}
                            >
                                Custom Image
                            </button>
                        </div>
                    </div>

                    {bgType === 'custom' && (
                        <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Upload Wallpaper</label>
                            <div className="flex items-center gap-4">
                                <label className={`flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 w-fit transition-colors ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                    <Upload className="w-4 h-4" />
                                    <span className="text-sm font-medium">{uploading ? 'Uploading...' : 'Upload Image'}</span>
                                    <input
                                        type="file"
                                        className="hidden"
                                        accept="image/*"
                                        onChange={(e) => handleImageUpload(e, setBackgroundImage)}
                                        disabled={uploading}
                                    />
                                </label>
                                {backgroundImage && (
                                    <button
                                        onClick={() => setBackgroundImage(null)}
                                        className="text-red-600 text-sm hover:text-red-700 flex items-center gap-1"
                                    >
                                        <Trash2 className="w-3 h-3" /> Remove
                                    </button>
                                )}
                            </div>
                            {backgroundImage && (
                                <div className="mt-4 relative h-32 w-full rounded-lg overflow-hidden border border-gray-200">
                                    <img src={backgroundImage} alt="Preview" className="w-full h-full object-cover" />
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Gym Details (Invoice Settings) */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex items-center gap-3">
                    <Building className="w-5 h-5 text-gray-400" />
                    <h2 className="text-lg font-bold text-gray-900">Business Details (For Invoices)</h2>
                </div>
                <form onSubmit={handleSaveProjectSettings} className="p-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Project / Company Name</label>
                            <input
                                type="text"
                                value={settings.gym_name}
                                onChange={e => setSettings({ ...settings, gym_name: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                            <input
                                type="text"
                                value={settings.phone}
                                onChange={e => setSettings({ ...settings, phone: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Site Office Address</label>
                            <textarea
                                value={settings.address}
                                onChange={e => setSettings({ ...settings, address: e.target.value })}
                                rows={3}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Receipt Footer</label>
                            <input
                                type="text"
                                value={settings.receipt_footer}
                                onChange={e => setSettings({ ...settings, receipt_footer: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            />
                        </div>
                    </div>
                    <div className="flex justify-end">
                        <button
                            type="submit"
                            disabled={saving}
                            className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center gap-2 font-medium"
                        >
                            <Save className="w-4 h-4" />
                            Save Configuration
                        </button>
                    </div>
                </form>
            </div>

        </div>
    )
}
