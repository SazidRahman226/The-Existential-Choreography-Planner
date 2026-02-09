import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../providers'
import '../../styles/auth.css'

const Sidebar = () => {
    const { user, logout } = useAuth()
    const location = useLocation()
    const currentPath = location.pathname

    const isAdmin = user?.role === 'admin'

    return (
        <aside className="dashboard-sidebar">
            <div className="sidebar-header">
                <h2>Choreography</h2>
                <span className="version">v1.0</span>
            </div>

            <nav className="sidebar-nav">
                <Link
                    to="/dashboard"
                    className={`nav-item ${currentPath === '/dashboard' ? 'active' : ''}`}
                >
                    <span>🏠</span> Dashboard
                </Link>
                <Link
                    to="/account"
                    className={`nav-item ${currentPath === '/account' ? 'active' : ''}`}
                >
                    <span>👤</span> Account
                </Link>

                {/* Placeholder links for Flows and Tasks if they become separate pages later */}
                {/* 
                <Link
                    to="/flows"
                    className={`nav-item ${currentPath === '/flows' ? 'active' : ''}`}
                >
                    <span>🌊</span> Flows
                </Link>
                <Link
                    to="/tasks"
                    className={`nav-item ${currentPath === '/tasks' ? 'active' : ''}`}
                >
                    <span>📝</span> Tasks
                </Link> 
                */}

                {isAdmin && (
                    <>
                        <div className="nav-divider">Admin</div>
                        {/* Example admin links if needed */}
                    </>
                )}
            </nav>

            <div className="sidebar-footer">
                <div className="user-mini">
                    <div className="avatar-circle">{user?.fullName?.charAt(0)}</div>
                    <div className="user-info">
                        <span className="name">{user?.fullName}</span>
                        <button className="btn-text-small" onClick={logout}>Logout</button>
                    </div>
                </div>
            </div>
        </aside>
    )
}

export default Sidebar
