import React, { useState } from 'react'
import Sidebar from '../components/dashboard/Sidebar'
import UsersTab from '../components/dashboard/UsersTab'
import PendingFlowsReview from '../components/admin/PendingFlowsReview'
import SessionEditor from '../components/admin/SessionEditor'
import '../styles/auth.css'

const AdminDashboard = () => {
    const [activeTab, setActiveTab] = useState('flows')

    return (
        <div className="dashboard-layout">
            <Sidebar />

            <main className="dashboard-main">
                <header className="content-header">
                    <h1>🛡️ Admin Panel</h1>
                </header>

                <div className="content-body">
                    <div className="admin-tabs">
                        <button
                            className={`admin-tab-btn ${activeTab === 'flows' ? 'active' : ''}`}
                            onClick={() => setActiveTab('flows')}
                        >
                            📋 Pending Flows
                        </button>
                        <button
                            className={`admin-tab-btn ${activeTab === 'users' ? 'active' : ''}`}
                            onClick={() => setActiveTab('users')}
                        >
                            👥 User Management
                        </button>
                        <button
                            className={`admin-tab-btn ${activeTab === 'sessions' ? 'active' : ''}`}
                            onClick={() => setActiveTab('sessions')}
                        >
                            🎭 Sessions
                        </button>
                    </div>

                    <div className="admin-tab-content">
                        {activeTab === 'flows' && <PendingFlowsReview />}
                        {activeTab === 'users' && <UsersTab />}
                        {activeTab === 'sessions' && <SessionEditor />}
                    </div>
                </div>
            </main>
        </div>
    )
}

export default AdminDashboard
