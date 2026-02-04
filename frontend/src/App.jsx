import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { LandingPage, Login, Register, Dashboard } from './pages'
import { PrivateRoute, PublicRoute } from './routes'
import { Navbar } from './components'
import { AuthProvider } from './providers'

function App() {
    return (
        <AuthProvider>
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
                    </Route>

                    {/* Private routes - requires authentication */}
                    <Route element={<PrivateRoute />}>
                        <Route path="/dashboard" element={<Dashboard />} />
                        {/* Add more private routes here */}
                    </Route>
                </Routes>
            </Router>
        </AuthProvider>
    )
}

export default App
