import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../providers'

const PrivateRoute = () => {
    const { isAuthenticated, loading } = useAuth()

    // Show loading while checking auth status
    if (loading) {
        return <div>Loading...</div>
    }

    return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />
}

export default PrivateRoute
