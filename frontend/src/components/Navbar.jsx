import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../providers'
import './Navbar.css'

const Navbar = () => {
    const navigate = useNavigate()
    const { user, isAuthenticated, logout } = useAuth()

    const handleLogout = async () => {
        await logout()
        navigate('/login')
    }

    return (
        <nav className="navbar">
            <div className="navbar-container">
                {/* Logo / Brand */}
                <Link to="/" className="navbar-brand">
                    <span className="text-gradient">Choreography Planner</span>
                </Link>

                {/* Navigation Links */}
                <div className="navbar-center">
                    <Link to="/" className="nav-link">Home</Link>
                    <Link to="#features" className="nav-link">Features</Link>
                    <Link to="#how-it-works" className="nav-link">How It Works</Link>
                </div>

                {/* Auth Section */}
                <div className="navbar-right">
                    {isAuthenticated ? (
                        <div className="user-menu">
                            <button
                                className="avatar-button"
                                onClick={() => navigate('/dashboard')}
                                title={user?.fullName}
                            >
                                {user?.avatar ? (
                                    <img
                                        src={user.avatar}
                                        alt={user.fullName}
                                        className="user-avatar"
                                    />
                                ) : (
                                    <div className="avatar-placeholder">
                                        {user?.fullName?.charAt(0).toUpperCase() || 'U'}
                                    </div>
                                )}
                            </button>
                            <button
                                className="btn-logout-nav"
                                onClick={handleLogout}
                            >
                                Logout
                            </button>
                        </div>
                    ) : (
                        <div className="auth-buttons">
                            <Link to="/login" className="btn-nav btn-login">
                                Login
                            </Link>
                            <Link to="/register" className="btn-nav btn-register">
                                Register
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    )
}

export default Navbar
