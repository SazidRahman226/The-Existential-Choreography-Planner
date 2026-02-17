import React from 'react'
import Sidebar from '../components/dashboard/Sidebar'
import UsersTab from '../components/dashboard/UsersTab'
import '../styles/auth.css'

const Users = () => {
    return (
        <div className="dashboard-layout">
            <Sidebar />

            <main className="dashboard-main">
                <header className="content-header">
                    <h1>User Management</h1>
                </header>

                <div className="content-body">
                    <UsersTab />
                </div>
            </main>
        </div>
    )
}

export default Users
