import React, { useState, useEffect } from 'react'

const UsersTab = () => {
    const [users, setUsers] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [error, setError] = useState(null)

    // Status Modal state
    const [statusModal, setStatusModal] = useState({ show: false, type: 'success', message: '' })

    const fetchUsers = async () => {
        try {
            const res = await fetch('http://localhost:3000/api/auth/users', {
                credentials: 'include'
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.message || 'Failed to fetch users')
            setUsers(data.users)
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchUsers()
    }, [])

    const handleRoleChange = async (userId, newRole) => {
        try {
            const res = await fetch(`http://localhost:3000/api/auth/users/${userId}/role`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ role: newRole }),
                credentials: 'include'
            })
            const data = await res.json()

            if (!res.ok) throw new Error(data.message)

            // Update local state
            setUsers(users.map(u => u._id === userId ? { ...u, role: newRole } : u))
            setStatusModal({ show: true, type: 'success', message: `User role updated to ${newRole}` })

        } catch (err) {
            setStatusModal({ show: true, type: 'error', message: err.message })
        }
    }

    const handleStatusChange = async (userId, newStatus) => {
        try {
            const res = await fetch(`http://localhost:3000/api/auth/users/${userId}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isActive: newStatus }),
                credentials: 'include'
            })
            const data = await res.json()

            if (!res.ok) throw new Error(data.message)

            // Update local state
            setUsers(users.map(u => u._id === userId ? { ...u, isActive: newStatus } : u))
            setStatusModal({ show: true, type: 'success', message: `User ${newStatus ? 'activated' : 'deactivated'}` })

        } catch (err) {
            setStatusModal({ show: true, type: 'error', message: err.message })
        }
    }

    const filteredUsers = users.filter(user =>
        user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.username.toLowerCase().includes(searchTerm.toLowerCase())
    )

    if (loading) return <div className="dashboard-card">Loading users...</div>
    if (error) return <div className="dashboard-card error-message">{error}</div>

    return (
        <div className="users-container">
            {/* Status Modal */}
            {statusModal.show && (
                <div className="modal-overlay">
                    <div className={`modal-content ${statusModal.type}`}>
                        <h3>{statusModal.type === 'success' ? 'Success' : 'Error'}</h3>
                        <p>{statusModal.message}</p>
                        <button className="btn-primary" onClick={() => setStatusModal({ ...statusModal, show: false })}>Close</button>
                    </div>
                </div>
            )}

            <div className="dashboard-card">
                <div className="card-header">
                    <h3>User Management</h3>
                    <input
                        type="text"
                        placeholder="Search users..."
                        className="search-input"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="table-responsive">
                    <table className="users-table">
                        <thead>
                            <tr>
                                <th>User</th>
                                <th>Role</th>
                                <th>Status</th>
                                <th>Joined</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUsers.map(user => (
                                <tr key={user._id}>
                                    <td>
                                        <div className="user-cell">
                                            <div className="avatar-small">
                                                {user.avatar ? <img src={user.avatar} alt="avatar" /> : user.fullName.charAt(0)}
                                            </div>
                                            <div className="user-details">
                                                <span className="user-name">{user.fullName}</span>
                                                <span className="user-email">@{user.username}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`role-badge ${user.role}`}>{user.role}</span>
                                    </td>
                                    <td>
                                        <span className={`status-indicator ${user.isActive ? 'active' : 'inactive'}`}>
                                            {user.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                                    <td>
                                        <div className="action-buttons">
                                            <select
                                                value={user.role}
                                                onChange={(e) => handleRoleChange(user._id, e.target.value)}
                                                className="role-select"
                                            >
                                                <option value="user">User</option>
                                                <option value="admin">Admin</option>
                                            </select>

                                            <button
                                                className={`btn-toggle ${user.isActive ? 'btn-danger' : 'btn-success'}`}
                                                onClick={() => handleStatusChange(user._id, !user.isActive)}
                                            >
                                                {user.isActive ? 'Deactivate' : 'Activate'}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}

export default UsersTab
