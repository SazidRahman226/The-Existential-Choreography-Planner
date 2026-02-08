import { useState, useEffect } from 'react'
import taskService from '../../services/task.service'
import flowService from '../../services/flow.service'

const CreateTaskModal = ({ onClose, onSuccess }) => {
    const [flows, setFlows] = useState([])
    const [loadingFlows, setLoadingFlows] = useState(true)

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        workflowId: '',
        pointsReward: 50,
        energyCost: 10,
        prerequisites: [] // Array of task IDs
    })
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)

    // Prerequisites logic
    const [availableTasks, setAvailableTasks] = useState([]) // All tasks
    const [flowTasks, setFlowTasks] = useState([]) // Tasks in selected flow

    useEffect(() => {
        const fetchFlowsAndTasks = async () => {
            try {
                // Fetch Flows
                const flowsData = await flowService.getAll()
                const flowList = Array.isArray(flowsData) ? flowsData : (flowsData.data || [])
                setFlows(flowList)

                // Fetch All Tasks (to filter for prerequisites)
                // Ideally backend provides endpoint to get tasks by flow, but filtering getAll works for now
                const tasksData = await taskService.getAll()
                const taskList = Array.isArray(tasksData) ? tasksData : (tasksData.data || [])
                setAvailableTasks(taskList)

                if (flowList.length > 0) {
                    setFormData(prev => ({ ...prev, workflowId: flowList[0]._id }))
                }
            } catch (err) {
                console.error("Failed to load data", err)
                setError("Could not load initial data.")
            } finally {
                setLoadingFlows(false)
            }
        }
        fetchFlowsAndTasks()
    }, [])

    // Filter tasks when workflowId changes
    useEffect(() => {
        if (formData.workflowId && availableTasks.length > 0) {
            // Filter tasks belonging to this flow (check if populated or direct ID)
            const filtered = availableTasks.filter(t => {
                const wId = t.workflowId?._id || t.workflowId // Handle populated or unpopulated
                return wId === formData.workflowId
            })
            setFlowTasks(filtered)
            // Reset prerequisites if flow changes
            setFormData(prev => ({ ...prev, prerequisites: [] }))
        } else {
            setFlowTasks([])
        }
    }, [formData.workflowId, availableTasks])

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const handlePrereqChange = (e) => {
        const options = e.target.options
        const selectedValues = []
        for (let i = 0; i < options.length; i++) {
            if (options[i].selected) {
                selectedValues.push(options[i].value)
            }
        }
        setFormData(prev => ({ ...prev, prerequisites: selectedValues }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!formData.workflowId) {
            setError("Please select a flow")
            return
        }

        setLoading(true)
        setError(null)

        try {
            // Generate a temporary nodeId since visual editor isn't ready
            const payload = {
                ...formData,
                nodeId: `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                status: 'pending'
            }

            await taskService.create(payload)
            onSuccess()
            onClose()
        } catch (err) {
            setError(err.response?.data?.message || err.message || 'Failed to create task')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="modal-header">
                    <h3>Create New Task</h3>
                    <button className="btn-close" onClick={onClose}>&times;</button>
                </div>

                {error && <div className="error-message">{error}</div>}

                {loadingFlows ? (
                    <p>Loading your flows...</p>
                ) : flows.length === 0 ? (
                    <div className="empty-state-modal">
                        <p>You need a Flow to create a Task.</p>
                        <button className="btn-card" onClick={onClose}>Close</button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label>Parent Flow</label>
                            <select
                                name="workflowId"
                                value={formData.workflowId}
                                onChange={handleChange}
                                required
                                className="select-input"
                            >
                                <option value="" disabled>Select a Flow</option>
                                {flows.map(flow => (
                                    <option key={flow._id} value={flow._id}>
                                        {flow.title}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Task Title</label>
                            <input
                                type="text"
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                placeholder="e.g. Read Chapter 1"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Points Reward</label>
                            <input
                                type="number"
                                name="pointsReward"
                                value={formData.pointsReward}
                                onChange={handleChange}
                                min="0"
                            />
                        </div>

                        <div className="form-group">
                            <label>Energy Cost</label>
                            <input
                                type="number"
                                name="energyCost"
                                value={formData.energyCost}
                                onChange={handleChange}
                                min="0"
                            />
                        </div>

                        <div className="form-group">
                            <label>Prerequisites (Hold Ctrl to select multiple)</label>
                            <select
                                name="prerequisites"
                                multiple
                                value={formData.prerequisites}
                                onChange={handlePrereqChange}
                                className="select-input"
                                style={{ height: '100px' }}
                            >
                                {flowTasks.length === 0 ? (
                                    <option disabled>No other tasks in this flow</option>
                                ) : (
                                    flowTasks.map(task => (
                                        <option key={task._id} value={task._id}>
                                            {task.title} ({task.status})
                                        </option>
                                    ))
                                )}
                            </select>
                            <p className="help-text" style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                                Tasks that must be completed before this one.
                            </p>
                        </div>

                        <div className="modal-actions">
                            <button type="button" className="btn-card" onClick={onClose}>Cancel</button>
                            <button type="submit" className="btn-primary" disabled={loading}>
                                {loading ? 'Create Task' : 'Create Task'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    )
}

export default CreateTaskModal
