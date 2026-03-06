import { useState, useEffect } from 'react'
import sessionService from '../../services/session.service'

const EMOJI_OPTIONS = ['🎯', '🧘', '🏋️', '🚀', '☕', '🎵', '🌊', '🌙', '⚡', '🔥', '💎', '🎮', '📚', '🎨']

const MySessions = () => {
    const [sessions, setSessions] = useState([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [editingSession, setEditingSession] = useState(null)
    const [deleteConfirm, setDeleteConfirm] = useState(null)

    // Form state
    const [formName, setFormName] = useState('')
    const [formEmoji, setFormEmoji] = useState('🎵')
    const [formYoutubeUrl, setFormYoutubeUrl] = useState('')
    const [formQuotes, setFormQuotes] = useState('')
    const [formInterval, setFormInterval] = useState(20)

    useEffect(() => {
        fetchSessions()
    }, [])

    const fetchSessions = async () => {
        try {
            const data = await sessionService.getAll()
            // Only show user's personal sessions
            setSessions(data.filter(s => s.type === 'user'))
        } catch (err) {
            console.error('Fetch sessions error:', err)
        } finally {
            setLoading(false)
        }
    }

    const openCreateModal = () => {
        setEditingSession(null)
        setFormName('')
        setFormEmoji('🎵')
        setFormYoutubeUrl('')
        setFormQuotes('')
        setFormInterval(20)
        setShowModal(true)
    }

    const openEditModal = (session) => {
        setEditingSession(session)
        setFormName(session.name)
        setFormEmoji(session.emoji)
        setFormYoutubeUrl(session.youtubePlaylistUrl || '')
        setFormQuotes((session.quotes || []).join('\n'))
        setFormInterval(session.quoteInterval || 20)
        setShowModal(true)
    }

    const handleSubmit = async () => {
        if (!formName.trim()) return alert('Session name is required')

        const data = {
            name: formName.trim(),
            emoji: formEmoji,
            youtubePlaylistUrl: formYoutubeUrl.trim(),
            quotes: formQuotes.split('\n').map(q => q.trim()).filter(Boolean),
            quoteInterval: formInterval
        }

        try {
            if (editingSession) {
                await sessionService.update(editingSession._id, data)
            } else {
                await sessionService.create(data)
            }
            setShowModal(false)
            fetchSessions()
        } catch (err) {
            console.error('Save session error:', err)
            alert('Failed to save session')
        }
    }

    const handleDelete = async (id) => {
        try {
            await sessionService.delete(id)
            setDeleteConfirm(null)
            fetchSessions()
        } catch (err) {
            console.error('Delete session error:', err)
            alert('Failed to delete session')
        }
    }

    return (
        <div className="dashboard-card my-sessions-section">
            <div className="session-editor-header">
                <div>
                    <h3>🎵 My Sessions</h3>
                    <p className="session-editor-desc">
                        Create your own sessions with custom YouTube playlists. Your sessions will override admin defaults when assigned to tasks.
                    </p>
                </div>
                <button className="btn-primary btn-sm" onClick={openCreateModal}>+ Add</button>
            </div>

            {loading ? <p className="empty-text">Loading...</p> : (
                sessions.length === 0 ? (
                    <p className="empty-text">No custom sessions yet. Add one to personalize your focus experience!</p>
                ) : (
                    <div className="session-grid">
                        {sessions.map(session => (
                            <div key={session._id} className="session-card session-card-compact">
                                <div className="session-card-header">
                                    <span className="session-card-emoji">{session.emoji}</span>
                                    <h4 className="session-card-name">{session.name}</h4>
                                </div>
                                {session.youtubePlaylistUrl && (
                                    <div className="session-card-url">🎬 Playlist linked</div>
                                )}
                                <div className="session-card-meta">
                                    <span>💬 {session.quotes?.length || 0} quotes</span>
                                </div>
                                <div className="session-card-actions">
                                    <button className="btn-secondary btn-sm" onClick={() => openEditModal(session)}>✏️</button>
                                    <button className="btn-danger btn-sm" onClick={() => setDeleteConfirm(session._id)}>🗑️</button>
                                </div>
                            </div>
                        ))}
                    </div>
                )
            )}

            {/* Create/Edit Modal */}
            {showModal && (
                <div className="modal-overlay">
                    <div className="session-modal">
                        <div className="session-modal-header">
                            <h3>{editingSession ? 'Edit Session' : 'Create Session'}</h3>
                            <button className="modal-close-btn" onClick={() => setShowModal(false)}>×</button>
                        </div>

                        <div className="session-form">
                            <label>Session Name</label>
                            <input
                                type="text"
                                value={formName}
                                onChange={e => setFormName(e.target.value)}
                                placeholder="e.g. My Study Playlist"
                                className="session-input"
                            />

                            <label>Emoji</label>
                            <div className="session-emoji-picker">
                                {EMOJI_OPTIONS.map(e => (
                                    <button
                                        key={e}
                                        className={`emoji-option ${formEmoji === e ? 'selected' : ''}`}
                                        onClick={() => setFormEmoji(e)}
                                    >
                                        {e}
                                    </button>
                                ))}
                            </div>

                            <label>YouTube Playlist URL</label>
                            <input
                                type="url"
                                value={formYoutubeUrl}
                                onChange={e => setFormYoutubeUrl(e.target.value)}
                                placeholder="https://www.youtube.com/playlist?list=..."
                                className="session-input"
                            />

                            <label>Motivational Quotes (one per line)</label>
                            <textarea
                                value={formQuotes}
                                onChange={e => setFormQuotes(e.target.value)}
                                placeholder="Stay focused!&#10;You got this!"
                                className="session-textarea"
                                rows={4}
                            />

                            <label>Quote Rotation: {formInterval}s</label>
                            <input
                                type="range"
                                min={5}
                                max={120}
                                step={5}
                                value={formInterval}
                                onChange={e => setFormInterval(Number(e.target.value))}
                                className="session-slider"
                            />
                        </div>

                        <div className="session-modal-actions">
                            <button className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                            <button className="btn-primary" onClick={handleSubmit}>
                                {editingSession ? 'Save' : 'Create'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation */}
            {deleteConfirm && (
                <div className="modal-overlay">
                    <div className="delete-confirm-modal">
                        <h3>🗑️ Delete Session?</h3>
                        <p>This will permanently remove this session.</p>
                        <div className="delete-confirm-actions">
                            <button className="btn-secondary" onClick={() => setDeleteConfirm(null)}>Cancel</button>
                            <button className="btn-danger" onClick={() => handleDelete(deleteConfirm)}>Delete</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default MySessions
