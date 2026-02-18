import { useState, useRef, useEffect } from 'react'

const TASK_TEMPLATES = [
    { id: 'study', emoji: '📖', label: 'Study Session', difficulty: 'medium', pointsReward: 50, energyCost: 10 },
    { id: 'practice', emoji: '✍️', label: 'Practice', difficulty: 'easy', pointsReward: 25, energyCost: 5 },
    { id: 'review', emoji: '📝', label: 'Review', difficulty: 'easy', pointsReward: 15, energyCost: 3 },
    { id: 'exercise', emoji: '🏋️', label: 'Exercise', difficulty: 'hard', pointsReward: 75, energyCost: 15 },
    { id: 'project', emoji: '🚀', label: 'Project Work', difficulty: 'hard', pointsReward: 100, energyCost: 20 },
    { id: 'custom', emoji: '🎯', label: 'Custom Task', difficulty: 'medium', pointsReward: 50, energyCost: 10 },
]

const CanvasToolbar = ({
    flowTitle,
    zoom,
    saveStatus,
    onAddNode,
    onZoomIn,
    onZoomOut,
    onFitView,
    onSave,
    onBack
}) => {
    const [showTemplates, setShowTemplates] = useState(false)
    const dropdownRef = useRef(null)

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setShowTemplates(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const handleTemplateSelect = (template) => {
        onAddNode(template)
        setShowTemplates(false)
    }

    return (
        <div className="canvas-toolbar">
            <button className="toolbar-btn back" onClick={onBack} title="Back to Dashboard">
                ←
            </button>

            <div className="toolbar-title">
                <span>📐</span>
                <span className="flow-name">{flowTitle || 'Untitled Flow'}</span>
            </div>

            <div className="toolbar-group" ref={dropdownRef}>
                <button
                    className="toolbar-btn primary"
                    onClick={() => setShowTemplates(!showTemplates)}
                >
                    + Task ▾
                </button>
                {showTemplates && (
                    <div className="template-dropdown">
                        <div className="template-dropdown-header">Choose Template</div>
                        {TASK_TEMPLATES.map(t => (
                            <button
                                key={t.id}
                                className="template-option"
                                onClick={() => handleTemplateSelect(t)}
                            >
                                <span className="template-emoji">{t.emoji}</span>
                                <div className="template-info">
                                    <span className="template-name">{t.label}</span>
                                    <span className="template-stats">
                                        ⭐{t.pointsReward} ⚡{t.energyCost}
                                    </span>
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            <div className="toolbar-group">
                <button className="toolbar-btn" onClick={onZoomOut} title="Zoom Out">−</button>
                <span className="zoom-display">{Math.round(zoom * 100)}%</span>
                <button className="toolbar-btn" onClick={onZoomIn} title="Zoom In">+</button>
                <button className="toolbar-btn" onClick={onFitView} title="Fit to View">⊞</button>
            </div>

            <div className="toolbar-group">
                <div className={`save-indicator ${saveStatus}`}>
                    {saveStatus === 'saved' && '✓ Saved'}
                    {saveStatus === 'unsaved' && '● Unsaved'}
                    {saveStatus === 'saving' && '↻ Saving...'}
                </div>
                <button className="toolbar-btn save" onClick={onSave}>
                    Save
                </button>
            </div>
        </div>
    )
}

export { TASK_TEMPLATES }
export default CanvasToolbar
