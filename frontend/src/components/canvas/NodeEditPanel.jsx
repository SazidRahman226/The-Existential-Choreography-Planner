import { useState, useEffect } from 'react'

const DIFFICULTY_PRESETS = {
    easy: { pointsReward: 25, energyCost: 5, label: 'Easy', emoji: '🟢' },
    medium: { pointsReward: 50, energyCost: 10, label: 'Medium', emoji: '🟡' },
    hard: { pointsReward: 100, energyCost: 20, label: 'Hard', emoji: '🔴' }
}

const NodeEditPanel = ({ node, onUpdate, onDelete, onClose }) => {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        difficulty: 'medium',
        pointsReward: 50,
        energyCost: 10,
        shape: 'rectangle',
        showAdvanced: false
    })

    useEffect(() => {
        if (node) {
            setFormData({
                title: node.data?.title || '',
                description: node.data?.description || '',
                difficulty: node.data?.difficulty || 'medium',
                pointsReward: node.data?.pointsReward ?? 50,
                energyCost: node.data?.energyCost ?? 10,
                shape: node.shape || 'rectangle',
                showAdvanced: false
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
                status: node.data?.status || 'pending'
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

    const handleShapeChange = (shape) => {
        setFormData(prev => ({ ...prev, shape }))
        onUpdate(node.id, { shape, data: { ...node.data } })
    }

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
                            className={`shape-option diamond ${formData.shape === 'diamond' ? 'active' : ''}`}
                            onClick={() => handleShapeChange('diamond')}
                        >
                            <div className="shape-preview" />
                            Decision
                        </button>
                        <button
                            className={`shape-option rounded ${formData.shape === 'rounded' ? 'active' : ''}`}
                            onClick={() => handleShapeChange('rounded')}
                        >
                            <div className="shape-preview" />
                            Start/End
                        </button>
                    </div>
                </div>

                {/* Advanced toggle for manual energy/points override */}
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
