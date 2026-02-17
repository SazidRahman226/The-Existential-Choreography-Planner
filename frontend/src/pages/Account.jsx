import React, { useState, useEffect } from 'react'
import { useAuth } from '../providers'
import Sidebar from '../components/dashboard/Sidebar'
import '../styles/auth.css'

const Account = () => {
    const { user, checkAuth } = useAuth()
    const [isEditing, setIsEditing] = useState(false)
    const [formData, setFormData] = useState({
        fullName: '',
        username: '',
        bio: ''
    })
    const [loading, setLoading] = useState(false)
    const [usernameStatus, setUsernameStatus] = useState(null) // null, 'checking', 'available', 'unavailable'
    const [avatarFile, setAvatarFile] = useState(null)
    const [avatarPreview, setAvatarPreview] = useState(null)

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

    const energyPercent = user ? Math.min(100, Math.max(0, user.energy || 0)) : 0

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
            if (user && value === user.username) {
                setUsernameStatus(null)
                return
            }

            // Debounce check
            const timeoutId = setTimeout(() => checkUsernameAvailability(value), 500)
            return () => clearTimeout(timeoutId)
        }
    }

    const handleFileChange = (e) => {
        const file = e.target.files[0]
        if (file) {
            setAvatarFile(file)
            setAvatarPreview(URL.createObjectURL(file))
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

        try {
            const formDataToSend = new FormData()
            formDataToSend.append('fullName', formData.fullName)
            formDataToSend.append('username', formData.username)
            formDataToSend.append('bio', formData.bio)
            if (avatarFile) {
                formDataToSend.append('avatar', avatarFile)
            }

            const res = await fetch('http://localhost:3000/api/auth/profile', {
                method: 'PUT',
                body: formDataToSend,
                credentials: 'include'
            })

            const data = await res.json()

            if (!res.ok) throw new Error(data.message || 'Update failed')

            setStatusModal({ show: true, type: 'success', message: 'Profile updated successfully!' })
            setIsEditing(false)
            setAvatarFile(null)
            setAvatarPreview(null)

            if (checkAuth) checkAuth()

        } catch (err) {
            setStatusModal({ show: true, type: 'error', message: err.message })
        } finally {
            setLoading(false)
        }
    }

    if (!user) return <div className="dashboard-layout">Loading...</div>

    return (
        <div className="dashboard-layout">
            <Sidebar />

            <main className="dashboard-main">
                <header className="content-header">
                    <h1>Account Settings</h1>
                </header>

                <div className="content-body">
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
                                {!isEditing && (
                                    <div className="profile-avatar-large">
                                        {user.avatar ? (
                                            <img src={user.avatar} alt={user.fullName} />
                                        ) : (
                                            <span>{user.fullName?.charAt(0)}</span>
                                        )}
                                    </div>
                                )}

                                {isEditing ? (
                                    <form onSubmit={handleInitialSubmit} className="profile-edit-form">
                                        <div className="form-group avatar-upload-group">
                                            <div
                                                className="profile-avatar-large avatar-upload-container"
                                                onClick={() => document.getElementById('avatar-input').click()}
                                            >
                                                {avatarPreview ? (
                                                    <img src={avatarPreview} alt="Preview" />
                                                ) : user.avatar ? (
                                                    <img src={user.avatar} alt={user.fullName} />
                                                ) : (
                                                    <span>{user.fullName?.charAt(0)}</span>
                                                )}
                                                <div className="avatar-overlay">
                                                    <span>📷</span>
                                                </div>
                                            </div>
                                            <input
                                                type="file"
                                                id="avatar-input"
                                                accept="image/*"
                                                onChange={handleFileChange}
                                                style={{ display: 'none' }}
                                            />
                                            <p className="avatar-help-text">Click avatar to change</p>
                                        </div>
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
                </div>
            </main>
        </div>
    )
}

export default Account
