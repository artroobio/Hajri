
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from '@/context/AuthContext'
import { ThemeProvider } from '@/context/ThemeContext'
import { ProjectProvider } from '@/context/ProjectContext'
import SidebarLayout from './layouts/SidebarLayout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Workers from './pages/Workers'
import WorkerProfile from './pages/WorkerProfile'
import DailyEntry from './pages/DailyEntry'
import Expenses from './pages/Expenses'
import Reports from './pages/Reports'
import Billing from './pages/Billing'
import Settings from './pages/Settings'
import EditMember from './pages/EditMember'
import BalancePayments from './pages/BalancePayments'

import Estimates from './pages/Estimates'
import Materials from './pages/Materials'
import ClientLedger from './pages/ClientLedger'
import Projects from './pages/Projects'

function App() {
    return (
        <>
            <Toaster
                position="top-right"
                toastOptions={{
                    duration: 3000,
                    style: {
                        background: '#1e293b',
                        color: '#fff',
                        borderRadius: '0.5rem',
                        padding: '16px',
                    },
                    success: {
                        iconTheme: {
                            primary: '#10b981',
                            secondary: '#fff',
                        },
                    },
                    error: {
                        iconTheme: {
                            primary: '#ef4444',
                            secondary: '#fff',
                        },
                    },
                }}
            />
            <ThemeProvider>
                <AuthProvider>
                    <ProjectProvider>
                        <BrowserRouter>
                            <Routes>
                                {/* Public Route */}
                                <Route path="/login" element={<Login />} />

                                {/* Protected Routes (Wrapped in Layout) */}
                                <Route element={<SidebarLayout />}>
                                    <Route index element={<Dashboard />} />
                                    <Route path="workers" element={<Workers />} />
                                    <Route path="workers/:id" element={<WorkerProfile />} />
                                    <Route path="workers/:id/edit" element={<EditMember />} />

                                    <Route path="daily-entry" element={<DailyEntry />} />
                                    <Route path="estimates" element={<Estimates />} />
                                    <Route path="client-ledger" element={<ClientLedger />} />
                                    <Route path="payroll" element={<Billing />} />

                                    <Route path="materials" element={<Materials />} />

                                    <Route path="expenses" element={<Expenses />} />
                                    <Route path="reports" element={<Reports />} />
                                    <Route path="settings" element={<Settings />} />
                                    <Route path="projects" element={<Projects />} />
                                    <Route path="payroll/balances" element={<BalancePayments />} />
                                </Route>
                            </Routes>
                        </BrowserRouter>
                    </ProjectProvider>
                </AuthProvider>
            </ThemeProvider>
        </>
    )
}

export default App
