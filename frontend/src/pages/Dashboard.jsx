import { useState, useEffect } from 'react'
import { useAuth } from '../providers'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/dashboard/Sidebar'
import StatsBar from '../components/dashboard/StatsBar'
import CreateFlowModal from '../components/dashboard/CreateFlowModal'
import CreateTaskModal from '../components/dashboard/CreateTaskModal'
import flowService from '../services/flow.service'
import taskService from '../services/task.service'
import '../styles/auth.css'

const Dashboard = () => {
    const { user } = useAuth()
    const navigate = useNavigate()
    const [recentFlows, setRecentFlows] = useState([])
    const [loading, setLoading] = useState(true)
    const { checkAuth } = useAuth()

    // Modal States
    const [showCreateFlow, setShowCreateFlow] = useState(false)
    const [showCreateTask, setShowCreateTask] = useState(false)

    useEffect(() => {
        const fetchData = async () => {
            try {
                const flowsData = await flowService.getAll()
                const flows = Array.isArray(flowsData) ? flowsData : (flowsData.data || [])
                setRecentFlows(flows.slice(0, 5))
            } catch (error) {
                console.error("Error fetching dashboard data:", error)
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [])

    const refreshData = async () => {
        try {
            const flowsData = await flowService.getAll()
            const flows = Array.isArray(flowsData) ? flowsData : (flowsData.data || [])
            setRecentFlows(flows.slice(0, 5))
            await checkAuth()
        } catch (error) {
            console.error("Error refreshing data:", error)
        }
    }

    const [deleteConfirm, setDeleteConfirm] = useState(null)

    const handleDeleteFlow = async (flowId) => {
        try {
            await flowService.delete(flowId)
            setRecentFlows(prev => prev.filter(f => f._id !== flowId))
            setDeleteConfirm(null)
        } catch (err) {
            console.error('Delete failed:', err)
            alert('Failed to delete flow')
        }
    }

    const getStatusBadge = (flow) => {
        const status = flow.publicStatus || 'private'
        const map = {
            private: { label: '🔒 Private', cls: 'private' },
            pending: { label: '⏳ Pending', cls: 'pending' },
            approved: { label: '🌍 Public', cls: 'approved' },
            rejected: { label: '❌ Rejected', cls: 'rejected' }
        }
        return map[status] || map.private
    }

    return (
        <div className="dashboard-layout">
            <Sidebar />

            <main className="dashboard-main">
                <header className="content-header">
                    <h1>Dashboard</h1>
                    <div className="header-actions">
                        <button className="btn-icon">🔔</button>
                    </div>
                </header>

                <div className="content-body">
                    <StatsBar />

                    <div className="dashboard-actions">
                        <button className="btn-primary" onClick={() => setShowCreateFlow(true)}>+ Create Flow</button>
                    </div>

                    <div className="dashboard-card">
                        <h3>Recent Flows</h3>
                        {loading ? <p>Loading...</p> : (
                            recentFlows.length > 0 ? (
                                <ul className="dashboard-list">
                                    {recentFlows.map(flow => {
                                        const badge = getStatusBadge(flow)
                                        return (
                                            <li
                                                key={flow._id}
                                                className="list-item"
                                                style={{ cursor: 'pointer' }}
                                            >
                                                <div className="flow-item-main" onClick={() => navigate(`/flow/${flow._id}`)} title="Open in Canvas Editor">
                                                    <span className="item-title">{flow.title || 'Untitled Flow'}</span>
                                                    <span className={`status-badge ${badge.cls}`}>{badge.label}</span>
                                                </div>
                                                <button
                                                    className="flow-delete-btn"
                                                    onClick={(e) => { e.stopPropagation(); setDeleteConfirm(flow._id) }}
                                                    title="Delete flow"
                                                >
                                                    🗑️
                                                </button>
                                            </li>
                                        )
                                    })}
                                </ul>
                            ) : <p className="empty-text">No flows found. Create one to get started!</p>
                        )}
                    </div>
                </div>
            </main>

            {/* Delete Confirmation Dialog */}
            {deleteConfirm && (
                <div className="modal-overlay">
                    <div className="delete-confirm-modal">
                        <h3>🗑️ Delete Flow?</h3>
                        <p>This action cannot be undone. All nodes, edges, and task data in this flow will be permanently deleted.</p>
                        <div className="delete-confirm-actions">
                            <button className="btn-secondary" onClick={() => setDeleteConfirm(null)}>Cancel</button>
                            <button className="btn-danger" onClick={() => handleDeleteFlow(deleteConfirm)}>Delete</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modals */}
            {showCreateFlow && (
                <CreateFlowModal
                    onClose={() => setShowCreateFlow(false)}
                    onSuccess={refreshData}
                />
            )}

            {showCreateTask && (
                <CreateTaskModal
                    onClose={() => setShowCreateTask(false)}
                    onSuccess={refreshData}
                />
            )}
        </div>
    )
}

export default Dashboard
