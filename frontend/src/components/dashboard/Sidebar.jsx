import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../providers'
import '../../styles/auth.css'

const Sidebar = () => {
    const { user } = useAuth()
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

                {isAdmin && (
                    <Link
                        to="/users"
                        className={`nav-item ${currentPath === '/users' ? 'active' : ''}`}
                    >
                        <span>👥</span> Users
                    </Link>
                )}

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


            </nav>


        </aside>
    )
}

export default Sidebar
