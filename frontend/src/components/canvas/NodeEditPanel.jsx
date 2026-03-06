import { useState, useEffect } from 'react'
import { formatScheduledTime, computeScheduledEnd } from '../../utils/scheduleValidation'

const DIFFICULTY_PRESETS = {
    easy: { pointsReward: 25, energyCost: 5, label: 'Easy', emoji: '🟢' },
    medium: { pointsReward: 50, energyCost: 10, label: 'Medium', emoji: '🟡' },
    hard: { pointsReward: 100, energyCost: 20, label: 'Hard', emoji: '🔴' }
}

const DURATION_PRESETS = [15, 30, 45, 60]

const NodeEditPanel = ({ node, edges, nodes, onUpdate, onUpdateEdge, onDelete, onClose, sessions }) => {
    const nodeType = node?.data?.nodeType || 'task'

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        difficulty: 'medium',
        pointsReward: 50,
        energyCost: 10,
        duration: 30,
        sessionMode: 'focus',
        shape: 'rectangle',
        showAdvanced: false,
        isPinned: false,
        scheduledStart: null
    })

    useEffect(() => {
        if (node) {
            setFormData({
                title: node.data?.title || '',
                description: node.data?.description || '',
                difficulty: node.data?.difficulty || 'medium',
                pointsReward: node.data?.pointsReward ?? 50,
                energyCost: node.data?.energyCost ?? 10,
                duration: node.data?.duration ?? 30,
                sessionMode: node.data?.sessionMode || 'focus',
                shape: node.shape || 'rectangle',
                showAdvanced: false,
                isPinned: node.data?.isPinned || false,
                scheduledStart: node.data?.scheduledStart || null
            })
        }
    }, [node])

    if (!node) return null

    const pushUpdate = (updates) => {
        onUpdate(node.id, {
            shape: updates.shape !== undefined ? updates.shape : formData.shape,
            data: {
                ...node.data,
                title: updates.title !== undefined ? updates.title : formData.title,
                description: updates.description !== undefined ? updates.description : formData.description,
                difficulty: updates.difficulty !== undefined ? updates.difficulty : formData.difficulty,
                pointsReward: parseInt(updates.pointsReward !== undefined ? updates.pointsReward : formData.pointsReward) || 0,
                energyCost: parseInt(updates.energyCost !== undefined ? updates.energyCost : formData.energyCost) || 0,
                duration: parseInt(updates.duration !== undefined ? updates.duration : formData.duration) || 30,
                sessionMode: updates.sessionMode !== undefined ? updates.sessionMode : formData.sessionMode,
                status: node.data?.status || 'pending',
                isPinned: updates.isPinned !== undefined ? updates.isPinned : formData.isPinned,
                scheduledStart: updates.scheduledStart !== undefined ? updates.scheduledStart : formData.scheduledStart
            }
        })
    }

    const handleChange = (e) => {
        const { name, value } = e.target
        const newData = { ...formData, [name]: value }
        setFormData(newData)
        pushUpdate({ [name]: value })
    }

    const handleDifficultyChange = (difficulty) => {
        const preset = DIFFICULTY_PRESETS[difficulty]
        const newData = {
            ...formData,
            difficulty,
            pointsReward: preset.pointsReward,
            energyCost: preset.energyCost
        }
        setFormData(newData)
        pushUpdate({
            difficulty,
            pointsReward: preset.pointsReward,
            energyCost: preset.energyCost
        })
    }

    const handleDurationPreset = (mins) => {
        setFormData(prev => ({ ...prev, duration: mins }))
        pushUpdate({ duration: mins })
    }

    const handleShapeChange = (shape) => {
        setFormData(prev => ({ ...prev, shape }))
        onUpdate(node.id, { shape, data: { ...node.data } })
    }

    const handleEdgeLabelChange = (edgeId, label) => {
        if (onUpdateEdge) onUpdateEdge(edgeId, { label })
    }

    // Get outgoing edges from this node (for decision edge labels)
    const outgoingEdges = (edges || []).filter(e => e.source === node.id)

    // -- START / END NODES --
    if (nodeType === 'start' || nodeType === 'end') {
        return (
            <div className="node-edit-panel">
                <div className="edit-panel-header">
                    <h3>{nodeType === 'start' ? '▶ Start Node' : '🏁 End Node'}</h3>
                    <button className="edit-panel-close" onClick={onClose}>✕</button>
                </div>
                <div className="edit-panel-body">
                    <div className="special-node-info">
                        <p>{nodeType === 'start'
                            ? 'This is the flow\'s entry point. The runner begins here when you start the flow.'
                            : 'This marks the end of the flow. When the runner reaches here, the flow is complete!'
                        }</p>
                    </div>
                </div>
            </div>
        )
    }

    // -- DECISION NODE --
    if (nodeType === 'decision') {
        return (
            <div className="node-edit-panel">
                <div className="edit-panel-header">
                    <h3>❓ Decision Node</h3>
                    <button className="edit-panel-close" onClick={onClose}>✕</button>
                </div>
                <div className="edit-panel-body">
                    <div className="form-group">
                        <label>Question</label>
                        <input
                            type="text"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            placeholder="e.g. Did you understand the material?"
                        />
                    </div>

                    <div className="form-group">
                        <label>Description (optional)</label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            placeholder="Additional context for this decision..."
                        />
                    </div>

                    {outgoingEdges.length > 0 && (
                        <div className="form-group">
                            <label>Edge Labels</label>
                            <div className="edge-label-list">
                                {outgoingEdges.map((edge, idx) => {
                                    const targetNode = (nodes || []).find(n => n.id === edge.target)
                                    const targetName = targetNode?.data?.title || targetNode?.data?.nodeType || 'Node'
                                    return (
                                        <div key={edge.id} className="edge-label-row">
                                            <span className="edge-label-target">→ {targetName}</span>
                                            <input
                                                type="text"
                                                value={edge.label || ''}
                                                onChange={(e) => handleEdgeLabelChange(edge.id, e.target.value)}
                                                placeholder={`Path ${idx + 1}`}
                                                className="edge-label-input"
                                            />
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )}
                </div>
                <div className="edit-panel-footer">
                    <button
                        className="btn-delete-node"
                        onClick={() => {
                            if (confirm('Delete this decision node and all its connections?')) {
                                onDelete(node.id)
                            }
                        }}
                    >
                        🗑️ Delete Node
                    </button>
                </div>
            </div>
        )
    }

    // -- TASK NODE --
    return (
        <div className="node-edit-panel">
            <div className="edit-panel-header">
                <h3>Edit Task Node</h3>
                <button className="edit-panel-close" onClick={onClose}>✕</button>
            </div>

            <div className="edit-panel-body">
                <div className="form-group">
                    <label>Title</label>
                    <input
                        type="text"
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        placeholder="Task name..."
                    />
                </div>

                <div className="form-group">
                    <label>Description</label>
                    <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        placeholder="What does this task involve?"
                    />
                </div>

                <div className="form-group">
                    <label>Duration</label>
                    <div className="duration-picker">
                        {DURATION_PRESETS.map(mins => (
                            <button
                                key={mins}
                                className={`duration-option ${formData.duration === mins ? 'active' : ''}`}
                                onClick={() => handleDurationPreset(mins)}
                            >
                                {mins}m
                            </button>
                        ))}
                        <div className={`duration-custom-wrapper ${!DURATION_PRESETS.includes(Number(formData.duration)) ? 'active' : ''}`}>
                            <input
                                type="number"
                                name="duration"
                                value={formData.duration}
                                onChange={handleChange}
                                min="1"
                                max="480"
                                className="duration-custom"
                                title="Custom duration in minutes"
                            />
                            <span className="duration-unit">min</span>
                        </div>
                    </div>
                </div>

                <div className="form-group pin-schedule-group">
                    <label className="pin-toggle-label">
                        <input
                            type="checkbox"
                            checked={formData.isPinned}
                            onChange={(e) => {
                                const pinned = e.target.checked
                                const updates = { isPinned: pinned }
                                if (!pinned) updates.scheduledStart = null
                                setFormData(prev => ({ ...prev, ...updates }))
                                pushUpdate(updates)
                            }}
                        />
                        <span>📌 Pin to a specific time</span>
                    </label>

                    {formData.isPinned && (
                        <div className="time-picker-row">
                            <div className="time-picker">
                                <label className="time-picker-sublabel">Start Time</label>
                                <div className="time-picker-inputs">
                                    <select
                                        value={formData.scheduledStart ? (() => {
                                            const [h] = (formData.scheduledStart || '12:00').split(':')
                                            const h24 = parseInt(h, 10)
                                            return h24 === 0 ? 12 : h24 > 12 ? h24 - 12 : h24
                                        })() : 9}
                                        onChange={(e) => {
                                            const h12 = parseInt(e.target.value, 10)
                                            const currentParts = (formData.scheduledStart || '09:00').split(':')
                                            const currentH24 = parseInt(currentParts[0], 10)
                                            const isPM = currentH24 >= 12
                                            let h24 = isPM ? (h12 === 12 ? 12 : h12 + 12) : (h12 === 12 ? 0 : h12)
                                            const m = currentParts[1] || '00'
                                            const newTime = `${h24.toString().padStart(2, '0')}:${m}`
                                            setFormData(prev => ({ ...prev, scheduledStart: newTime }))
                                            pushUpdate({ scheduledStart: newTime })
                                        }}
                                        className="time-select"
                                    >
                                        {[12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(h => (
                                            <option key={h} value={h}>{h}</option>
                                        ))}
                                    </select>
                                    <span className="time-colon">:</span>
                                    <select
                                        value={formData.scheduledStart ? formData.scheduledStart.split(':')[1] : '00'}
                                        onChange={(e) => {
                                            const currentParts = (formData.scheduledStart || '09:00').split(':')
                                            const newTime = `${currentParts[0]}:${e.target.value}`
                                            setFormData(prev => ({ ...prev, scheduledStart: newTime }))
                                            pushUpdate({ scheduledStart: newTime })
                                        }}
                                        className="time-select"
                                    >
                                        {['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'].map(m => (
                                            <option key={m} value={m}>{m}</option>
                                        ))}
                                    </select>
                                    <select
                                        value={formData.scheduledStart ? (parseInt(formData.scheduledStart.split(':')[0], 10) >= 12 ? 'PM' : 'AM') : 'AM'}
                                        onChange={(e) => {
                                            const currentParts = (formData.scheduledStart || '09:00').split(':')
                                            let h24 = parseInt(currentParts[0], 10)
                                            const wasPM = h24 >= 12
                                            const isPM = e.target.value === 'PM'
                                            if (wasPM && !isPM) h24 -= 12
                                            else if (!wasPM && isPM) h24 += 12
                                            const newTime = `${h24.toString().padStart(2, '0')}:${currentParts[1]}`
                                            setFormData(prev => ({ ...prev, scheduledStart: newTime }))
                                            pushUpdate({ scheduledStart: newTime })
                                        }}
                                        className="time-select ampm-select"
                                    >
                                        <option value="AM">AM</option>
                                        <option value="PM">PM</option>
                                    </select>
                                </div>
                            </div>
                            {formData.scheduledStart && (
                                <div className="scheduled-end-display">
                                    <span className="end-label">Ends at</span>
                                    <span className="end-time">
                                        {formatScheduledTime(computeScheduledEnd(formData.scheduledStart, formData.duration))}
                                    </span>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="form-group">
                    <label>Difficulty</label>
                    <div className="difficulty-selector">
                        {Object.entries(DIFFICULTY_PRESETS).map(([key, preset]) => (
                            <button
                                key={key}
                                className={`difficulty-option ${key} ${formData.difficulty === key ? 'active' : ''}`}
                                onClick={() => handleDifficultyChange(key)}
                            >
                                <span className="difficulty-emoji">{preset.emoji}</span>
                                <span className="difficulty-label">{preset.label}</span>
                                <span className="difficulty-stats">⭐{preset.pointsReward} ⚡{preset.energyCost}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="form-group">
                    <label>Session Mode</label>
                    <div className="mode-selector">
                        {(sessions || []).map(s => (
                            <button
                                key={s._id}
                                className={`mode-option ${formData.sessionMode === s._id ? 'active' : ''}`}
                                onClick={() => {
                                    setFormData(prev => ({ ...prev, sessionMode: s._id }))
                                    pushUpdate({ sessionMode: s._id })
                                }}
                                style={formData.sessionMode === s._id ? { borderColor: '#6366f1', background: '#6366f118' } : {}}
                                title={s.name}
                            >
                                <span className="mode-emoji">{s.emoji}</span>
                                <span className="mode-label">{s.name}</span>
                            </button>
                        ))}
                        {(!sessions || sessions.length === 0) && (
                            <p className="empty-text" style={{ fontSize: '0.75rem' }}>No sessions available. Admin can create them in the Admin Panel.</p>
                        )}
                    </div>
                </div>

                <div className="form-group">
                    <label>Shape</label>
                    <div className="shape-selector">
                        <button
                            className={`shape-option rectangle ${formData.shape === 'rectangle' ? 'active' : ''}`}
                            onClick={() => handleShapeChange('rectangle')}
                        >
                            <div className="shape-preview" />
                            Task
                        </button>
                        <button
                            className={`shape-option rounded ${formData.shape === 'rounded' ? 'active' : ''}`}
                            onClick={() => handleShapeChange('rounded')}
                        >
                            <div className="shape-preview" />
                            Rounded
                        </button>
                    </div>
                </div>

                <button
                    className="advanced-toggle"
                    onClick={() => setFormData(prev => ({ ...prev, showAdvanced: !prev.showAdvanced }))}
                >
                    {formData.showAdvanced ? '▾ Hide Advanced' : '▸ Custom Values'}
                </button>

                {formData.showAdvanced && (
                    <>
                        <div className="form-group">
                            <label>Points Reward ⭐</label>
                            <input
                                type="number"
                                name="pointsReward"
                                value={formData.pointsReward}
                                onChange={handleChange}
                                min="0"
                            />
                        </div>

                        <div className="form-group">
                            <label>Energy Cost ⚡</label>
                            <input
                                type="number"
                                name="energyCost"
                                value={formData.energyCost}
                                onChange={handleChange}
                                min="0"
                            />
                        </div>
                    </>
                )}
            </div>

            <div className="edit-panel-footer">
                <button
                    className="btn-delete-node"
                    onClick={() => {
                        if (confirm('Delete this node and all its connections?')) {
                            onDelete(node.id)
                        }
                    }}
                >
                    🗑️ Delete Node
                </button>
            </div>
        </div>
    )
}

export default NodeEditPanel
