

import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from '@/context/AuthContext'
import { ThemeProvider } from '@/context/ThemeContext'
import SidebarLayout from './layouts/SidebarLayout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Workers from './pages/Workers'
import WorkerProfile from './pages/WorkerProfile'
import DailyEntry from './pages/DailyEntry'
import Expenses from './pages/Expenses'
import Reports from './pages/Reports'
import Billing from './pages/Billing' // Keep Billing/Payroll if it exists
import Settings from './pages/Settings'
import EditMember from './pages/EditMember' // Need to check if this should be renamed/refactored
import BalancePayments from './pages/BalancePayments'

import Estimates from './pages/Estimates'
import Materials from './pages/Materials'
import ClientLedger from './pages/ClientLedger'
import ProjectDetails from './pages/ProjectDetails'

function App() {
    return (
        <ThemeProvider>
            <AuthProvider>
                <BrowserRouter>
                    <Routes>
                        {/* Public Route */}
                        <Route path="/login" element={<Login />} />

                        {/* Protected Routes (Wrapped in Layout) */}
                        <Route element={<SidebarLayout />}>
                            <Route index element={<Dashboard />} />
                            <Route path="workers" element={<Workers />} /> {/* Refactored Workers page */}
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
                            <Route path="project-details" element={<ProjectDetails />} />
                            <Route path="payroll/balances" element={<BalancePayments />} />
                        </Route>
                    </Routes>
                </BrowserRouter>
            </AuthProvider>
        </ThemeProvider>
    )
}

export default App
