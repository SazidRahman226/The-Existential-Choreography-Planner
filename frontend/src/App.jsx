import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Account from './pages/Account'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import PrivateRoute from './routes/PrivateRoute'
import PublicRoute from './routes/PublicRoute'
import { Navbar } from './components'
import { AuthProvider, PopupProvider } from './providers'

function App() {
    return (
        <AuthProvider>
            <PopupProvider>
                <Router>
                    {/* Common Navbar - appears on all pages */}
                    <Navbar />

                    <Routes>
                        {/* Public routes - accessible to everyone */}
                        <Route path="/" element={<LandingPage />} />

                        {/* Public-only routes - redirects to dashboard if already authenticated */}
                        <Route element={<PublicRoute />}>
                            <Route path="/login" element={<Login />} />
                            <Route path="/register" element={<Register />} />
                            <Route path="/forgot-password" element={<ForgotPassword />} />
                            <Route path="/reset-password/:token" element={<ResetPassword />} />
                        </Route>

                        {/* Private routes - requires authentication */}
                        <Route element={<PrivateRoute />}>
                            <Route path="/dashboard" element={<Dashboard />} />
                            <Route path="/account" element={<Account />} />
                        </Route>
                    </Routes>
                </Router>
            </PopupProvider>
        </AuthProvider>
    )
}

export default App
