import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../providers'

const PublicRoute = () => {
    const { isAuthenticated, loading } = useAuth()

    // Show loading while checking auth status
    if (loading) {
        return <div>Loading...</div>
    }

    // If authenticated, redirect to dashboard (prevents accessing login when already logged in)
    return isAuthenticated ? <Navigate to="/dashboard" replace /> : <Outlet />
}

export default PublicRoute
