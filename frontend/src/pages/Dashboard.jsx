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
                        <button className="btn-card" onClick={() => setShowCreateTask(true)}>+ Create Task</button>
                    </div>

                    <div className="dashboard-card">
                        <h3>Recent Flows</h3>
                        {loading ? <p>Loading...</p> : (
                            recentFlows.length > 0 ? (
                                <ul className="dashboard-list">
                                    {recentFlows.map(flow => (
                                        <li
                                            key={flow._id}
                                            className="list-item"
                                            style={{ cursor: 'pointer' }}
                                            onClick={() => navigate(`/flow/${flow._id}`)}
                                            title="Open in Canvas Editor"
                                        >
                                            <span className="item-title">{flow.title || 'Untitled Flow'}</span>
                                            <span className={`status-badge ${flow.status || 'draft'}`}>{flow.status || 'Draft'}</span>
                                        </li>
                                    ))}
                                </ul>
                            ) : <p className="empty-text">No flows found. Create one to get started!</p>
                        )}
                    </div>
                </div>
            </main>

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
