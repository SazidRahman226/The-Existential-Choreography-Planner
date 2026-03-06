import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import flowService from '../../services/flow.service'

const PendingFlowsReview = () => {
    const [flows, setFlows] = useState([])
    const [loading, setLoading] = useState(true)
    const [actionLoading, setActionLoading] = useState(null)
    const [rejectNotes, setRejectNotes] = useState({})
    const navigate = useNavigate()

    const fetchPending = async () => {
        setLoading(true)
        try {
            const data = await flowService.getPendingFlows()
            setFlows(data || [])
        } catch (err) {
            console.error('Failed to fetch pending flows:', err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { fetchPending() }, [])

    const handleAction = async (flowId, action) => {
        setActionLoading(flowId)
        try {
            const note = action === 'reject' ? (rejectNotes[flowId] || '') : ''
            await flowService.reviewFlow(flowId, action, note)
            setFlows(prev => prev.filter(f => f._id !== flowId))
        } catch (err) {
            console.error(`Failed to ${action} flow:`, err)
        } finally {
            setActionLoading(null)
        }
    }

    const formatDate = (d) => new Date(d).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
    })

    if (loading) return <div className="pending-loading">Loading pending flows...</div>

    return (
        <div className="pending-review-section">
            <div className="pending-header">
                <h3>📋 Pending Flow Reviews</h3>
                <span className="pending-count">{flows.length} awaiting review</span>
            </div>

            {flows.length === 0 ? (
                <div className="pending-empty">
                    <span>✅</span> No pending flows to review
                </div>
            ) : (
                <div className="pending-list">
                    {flows.map(flow => (
                        <div key={flow._id} className="pending-card">
                            <div className="pending-card-info">
                                <div className="pending-card-top">
                                    <h4>{flow.title}</h4>
                                    {flow.tags?.length > 0 && (
                                        <div className="pending-tags">
                                            {flow.tags.map((t, i) => (
                                                <span key={i} className="gallery-tag">#{t}</span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                {flow.description && <p className="pending-desc">{flow.description}</p>}
                                <div className="pending-meta">
                                    <span>👤 {flow.userId?.fullName || 'Unknown'}</span>
                                    <span>🧩 {flow.nodeCount || 0} nodes</span>
                                    <span>📅 {formatDate(flow.createdAt)}</span>
                                </div>
                            </div>
                            <div className="pending-card-actions">
                                <input
                                    className="pending-reject-note"
                                    placeholder="Rejection reason (optional)"
                                    value={rejectNotes[flow._id] || ''}
                                    onChange={(e) => setRejectNotes(prev => ({ ...prev, [flow._id]: e.target.value }))}
                                />
                                <div className="pending-btns">
                                    <button
                                        className="pending-btn approve"
                                        onClick={() => handleAction(flow._id, 'approve')}
                                        disabled={actionLoading === flow._id}
                                    >
                                        ✅ Approve
                                    </button>
                                    <button
                                        className="pending-btn reject"
                                        onClick={() => handleAction(flow._id, 'reject')}
                                        disabled={actionLoading === flow._id}
                                    >
                                        ❌ Reject
                                    </button>
                                </div>
                                <button
                                    className="pending-btn view"
                                    onClick={() => navigate(`/flow/${flow._id}`)}
                                >
                                    👁️ View Flow
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

export default PendingFlowsReview
