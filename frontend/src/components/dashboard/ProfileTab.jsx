import React, { useState, useEffect } from 'react'
// import confetti from 'canvas-confetti' // Removed

const ProfileTab = ({ user, refreshUser }) => {
    const [isEditing, setIsEditing] = useState(false)
    const [formData, setFormData] = useState({
        fullName: '',
        username: '',
        bio: ''
    })
    const [loading, setLoading] = useState(false)
    // const [message, setMessage] = useState(null) // Replaced by Status Modal
    const [usernameStatus, setUsernameStatus] = useState(null) // null, 'checking', 'available', 'unavailable'

    // Modal States
    const [showConfirmModal, setShowConfirmModal] = useState(false)
    const [statusModal, setStatusModal] = useState({ show: false, type: 'success', message: '' })

    useEffect(() => {
        if (user) {
            setFormData({
                fullName: user.fullName || '',
                username: user.username || '',
                bio: user.bio || ''
            })
        }
    }, [user])

    if (!user) return <div className="dashboard-card">Loading profile...</div>

    // Calculate energy percentage
    const energyPercent = Math.min(100, Math.max(0, user.energy || 0))

    // Format dates
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A'
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })
    }

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))

        if (name === 'username') {
            if (value.length < 3) {
                setUsernameStatus(null)
                return
            }
            if (value === user.username) {
                setUsernameStatus(null)
                return
            }

            // Debounce check
            const timeoutId = setTimeout(() => checkUsernameAvailability(value), 500)
            return () => clearTimeout(timeoutId)
        }
    }

    const checkUsernameAvailability = async (username) => {
        setUsernameStatus('checking')
        try {
            const res = await fetch(`http://localhost:3000/api/auth/check-username/${username}`)
            const data = await res.json()
            if (data.available) {
                setUsernameStatus('available')
            } else {
                setUsernameStatus('unavailable')
            }
        } catch (err) {
            console.error(err)
            setUsernameStatus(null)
        }
    }

    const handleInitialSubmit = (e) => {
        e.preventDefault()
        setShowConfirmModal(true)
    }

    const confirmUpdate = async () => {
        setShowConfirmModal(false)
        setLoading(true)
        // setMessage(null)

        try {
            const res = await fetch('http://localhost:3000/api/auth/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData),
                credentials: 'include'
            })

            const data = await res.json()

            if (!res.ok) throw new Error(data.message || 'Update failed')

            // setMessage({ type: 'success', text: 'Profile updated successfully!' })
            setStatusModal({ show: true, type: 'success', message: 'Profile updated successfully!' })
            setIsEditing(false)

            if (refreshUser) refreshUser()

        } catch (err) {
            // setMessage({ type: 'error', text: err.message })
            setStatusModal({ show: true, type: 'error', message: err.message })
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="profile-container">
            {/* Confirmation Modal */}
            {showConfirmModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>Confirm Update</h3>
                        <p>Are you sure you want to update your profile?</p>
                        <div className="modal-actions">
                            <button className="btn-card" onClick={() => setShowConfirmModal(false)}>Cancel</button>
                            <button className="btn-primary" onClick={confirmUpdate}>Yes, Update</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Status Modal */}
            {statusModal.show && (
                <div className="modal-overlay">
                    <div className={`modal-content ${statusModal.type}`}>
                        <h3>{statusModal.type === 'success' ? 'Success!' : 'Error'}</h3>
                        <p>{statusModal.message}</p>
                        <div className="modal-actions">
                            <button className="btn-primary" onClick={() => setStatusModal({ ...statusModal, show: false })}>
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Identity Card */}
            <div className="dashboard-card profile-header-card">
                <div className="profile-header-content">
                    <div className="profile-avatar-large">
                        {user.avatar ? (
                            <img src={user.avatar} alt={user.fullName} />
                        ) : (
                            <span>{user.fullName?.charAt(0)}</span>
                        )}
                    </div>

                    {isEditing ? (
                        <form onSubmit={handleInitialSubmit} className="profile-edit-form">
                            <div className="form-group">
                                <label>Full Name</label>
                                <input
                                    type="text"
                                    name="fullName"
                                    value={formData.fullName}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Username</label>
                                <div className="username-input-wrapper">
                                    <input
                                        type="text"
                                        name="username"
                                        value={formData.username}
                                        onChange={handleChange}
                                        required
                                        className={usernameStatus === 'unavailable' ? 'input-error' : usernameStatus === 'available' ? 'input-success' : ''}
                                    />
                                    {usernameStatus === 'checking' && <span className="status-text">Checking...</span>}
                                    {usernameStatus === 'available' && <span className="status-text success">Available</span>}
                                    {usernameStatus === 'unavailable' && <span className="status-text error">Taken</span>}
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Bio</label>
                                <input
                                    type="text"
                                    name="bio"
                                    value={formData.bio}
                                    onChange={handleChange}
                                    placeholder="Tell us about yourself"
                                />
                            </div>

                            <div className="edit-actions">
                                <button type="button" className="btn-card" onClick={() => setIsEditing(false)}>Cancel</button>
                                <button type="submit" className="btn-primary" disabled={loading || usernameStatus === 'unavailable'}>
                                    {loading ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    ) : (
                        <div className="profile-identity">
                            <div className="profile-name-row">
                                <h2>{user.fullName}</h2>
                                {user.isVerified && (
                                    <span className="verified-badge" title="Verified User">✓</span>
                                )}
                                <span className={`role-badge ${user.role}`}>{user.role}</span>
                                <button className="btn-icon-small" onClick={() => setIsEditing(true)} title="Edit Profile">
                                    ✏️
                                </button>
                            </div>
                            <p className="profile-username">@{user.username}</p>
                            <p className="profile-bio">{user.bio || 'No bio yet.'}</p>

                            <div className="profile-meta">
                                <span>📅 Joined {formatDate(user.createdAt)}</span>
                                <span className={`status-indicator ${user.isActive ? 'active' : 'inactive'}`}>
                                    {user.isActive ? 'Active Account' : 'Inactive'}
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {!isEditing && (
                <div className="profile-grid">
                    {/* Gamification Stats */}
                    <div className="dashboard-card stats-card">
                        <h3>Character Stats</h3>
                        <div className="stats-grid">
                            <div className="stat-item level">
                                <span className="stat-label">Level</span>
                                <span className="stat-value">{user.level || 1}</span>
                            </div>
                            <div className="stat-item points">
                                <span className="stat-label">Points</span>
                                <span className="stat-value">{user.points || 0}</span>
                            </div>
                            <div className="stat-item energy-container">
                                <div className="energy-header">
                                    <span className="stat-label">Energy</span>
                                    <span className="energy-value">{user.energy || 0}/100</span>
                                </div>
                                <div className="energy-bar-bg">
                                    <div
                                        className="energy-bar-fill"
                                        style={{ width: `${energyPercent}%` }}
                                    ></div>
                                </div>
                                <p className="energy-hint">Regenerates over time</p>
                            </div>
                        </div>
                    </div>

                    {/* Account Details */}
                    <div className="dashboard-card details-card">
                        <h3>Account Details</h3>
                        <div className="details-list">
                            <div className="detail-row">
                                <span className="detail-label">Email</span>
                                <span className="detail-value">{user.email}</span>
                            </div>
                            <div className="detail-row">
                                <span className="detail-label">User ID</span>
                                <span className="detail-value mono">{user._id}</span>
                            </div>
                            <div className="detail-row">
                                <span className="detail-label">Last Updated</span>
                                <span className="detail-value">{formatDate(user.updatedAt)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {!isEditing && (
                /* Badges Section */
                <div className="dashboard-card badges-card">
                    <h3>Badges & Achievements</h3>
                    {user.badges && user.badges.length > 0 ? (
                        <div className="badges-grid">
                            {user.badges.map((badge, index) => (
                                <div key={index} className="badge-item">
                                    <div className="badge-icon">
                                        {badge.icon || '🏆'}
                                    </div>
                                    <span className="badge-name">{badge.name}</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="empty-state">
                            <span className="empty-icon">🛡️</span>
                            <p>No badges earned yet. Complete tasks to earn them!</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

export default ProfileTab
