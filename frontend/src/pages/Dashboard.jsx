import { useState } from 'react'
import { useAuth } from '../providers'
import { useNavigate } from 'react-router-dom'
import '../styles/auth.css'

import ProfileTab from '../components/dashboard/ProfileTab'
import UsersTab from '../components/dashboard/UsersTab'

const Dashboard = () => {
    const { user, logout, checkAuth } = useAuth()
    const navigate = useNavigate()
    const [activeTab, setActiveTab] = useState('profile')

    const handleLogout = async () => {
        await logout()
        navigate('/login')
    }

    const isAdmin = user?.role === 'admin'

    const renderContent = () => {
        switch (activeTab) {
            case 'profile':
                return <ProfileTab user={user} refreshUser={checkAuth} />
            case 'tasks':
                return (
                    <div className="dashboard-card">
                        <h3>My Tasks</h3>
                        <p>No tasks assigned yet.</p>
                        <button className="btn-card">Create New Task</button>
                    </div>
                )
            case 'users':
                return <UsersTab />
            case 'settings':
                return (
                    <div className="dashboard-card admin-card">
                        <h3>System Settings</h3>
                        <p>Configure global application preferences.</p>
                        <button className="btn-card btn-admin">Edit Configuration</button>
                    </div>
                )
            default:
                return <div>Select an option</div>
        }
    }

    return (
        <div className="dashboard-layout">
            {/* Sidebar */}
            <aside className="dashboard-sidebar">
                <div className="sidebar-header">
                    <h2>Choreography</h2>
                    <span className="version">v1.0</span>
                </div>

                <nav className="sidebar-nav">
                    <button
                        className={`nav-item ${activeTab === 'profile' ? 'active' : ''}`}
                        onClick={() => setActiveTab('profile')}
                    >
                        <span>👤</span> Profile
                    </button>
                    <button
                        className={`nav-item ${activeTab === 'tasks' ? 'active' : ''}`}
                        onClick={() => setActiveTab('tasks')}
                    >
                        <span>📝</span> Tasks
                    </button>

                    {isAdmin && (
                        <>
                            <div className="nav-divider">Admin</div>
                            <button
                                className={`nav-item admin ${activeTab === 'users' ? 'active' : ''}`}
                                onClick={() => setActiveTab('users')}
                            >
                                <span>👥</span> Users
                            </button>
                            <button
                                className={`nav-item admin ${activeTab === 'settings' ? 'active' : ''}`}
                                onClick={() => setActiveTab('settings')}
                            >
                                <span>⚙️</span> Settings
                            </button>
                        </>
                    )}
                </nav>

                <div className="sidebar-footer">
                    <div className="user-mini">
                        <div className="avatar-circle">{user?.fullName?.charAt(0)}</div>
                        <div className="user-info">
                            <span className="name">{user?.fullName}</span>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="dashboard-main">
                <header className="content-header">
                    <h1>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</h1>
                    <div className="header-actions">
                        <button className="btn-icon">🔔</button>
                    </div>
                </header>

                <div className="content-body">
                    {renderContent()}
                </div>
            </main>
        </div>
    )
}

export default Dashboard
