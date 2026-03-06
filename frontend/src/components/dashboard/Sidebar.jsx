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
                        to="/admin"
                        className={`nav-item ${currentPath === '/admin' ? 'active' : ''}`}
                    >
                        <span>🛡️</span> Admin Panel
                    </Link>
                )}

                <Link
                    to="/explore"
                    className={`nav-item ${currentPath === '/explore' ? 'active' : ''}`}
                >
                    <span>🌍</span> Explore
                </Link>

                <Link
                    to="/leaderboard"
                    className={`nav-item ${currentPath === '/leaderboard' ? 'active' : ''}`}
                >
                    <span>🏆</span> Leaderboard
                </Link>

                {/* 
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
