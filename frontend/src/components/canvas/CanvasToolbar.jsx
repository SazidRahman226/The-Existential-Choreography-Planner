import { useState, useRef, useEffect } from 'react'

const TASK_TEMPLATES = [
    { id: 'study', emoji: '📖', label: 'Study Session', difficulty: 'medium', pointsReward: 50, energyCost: 10, duration: 45, nodeType: 'task', sessionMode: 'focus' },
    { id: 'practice', emoji: '✍️', label: 'Practice', difficulty: 'easy', pointsReward: 25, energyCost: 5, duration: 30, nodeType: 'task', sessionMode: 'focus' },
    { id: 'review', emoji: '📝', label: 'Review', difficulty: 'easy', pointsReward: 15, energyCost: 3, duration: 15, nodeType: 'task', sessionMode: 'zen' },
    { id: 'exercise', emoji: '🏋️', label: 'Exercise', difficulty: 'hard', pointsReward: 75, energyCost: 15, duration: 60, nodeType: 'task', sessionMode: 'grind' },
    { id: 'project', emoji: '🚀', label: 'Project Work', difficulty: 'hard', pointsReward: 100, energyCost: 20, duration: 90, nodeType: 'task', sessionMode: 'sprint' },
    { id: 'decision', emoji: '❓', label: 'Decision', difficulty: 'medium', pointsReward: 0, energyCost: 0, duration: 0, nodeType: 'decision' },
    { id: 'custom', emoji: '🎯', label: 'Custom Task', difficulty: 'medium', pointsReward: 50, energyCost: 10, duration: 30, nodeType: 'task', sessionMode: 'chill' },
]

function formatTime(seconds) {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
}

const CanvasToolbar = ({
    flowTitle,
    zoom,
    saveStatus,
    onAddNode,
    onZoomIn,
    onZoomOut,
    onFitView,
    onSave,
    onBack,
    // Runner props
    runner,
    // Focus mode
    onToggleFocus,
    isFocusActive
}) => {
    const [showTemplates, setShowTemplates] = useState(false)
    const dropdownRef = useRef(null)

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

    const isFlowRunning = runner && !runner.isIdle

    return (
        <div className="canvas-toolbar">
            <button className="toolbar-btn back" onClick={onBack} title="Back to Dashboard">
                ←
            </button>

            <div className="toolbar-title">
                <span>📐</span>
                <span className="flow-name">{flowTitle || 'Untitled Flow'}</span>
            </div>

            {/* Template dropdown — only when idle */}
            {!isFlowRunning && (
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
                                    className={`template-option ${t.nodeType === 'decision' ? 'template-decision' : ''}`}
                                    onClick={() => handleTemplateSelect(t)}
                                >
                                    <span className="template-emoji">{t.emoji}</span>
                                    <div className="template-info">
                                        <span className="template-name">{t.label}</span>
                                        <span className="template-stats">
                                            {t.nodeType === 'decision'
                                                ? 'Branching point'
                                                : `⭐${t.pointsReward} ⚡${t.energyCost} ⏱${t.duration}m`
                                            }
                                        </span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* ---- Runner Controls ---- */}
            {runner && (
                <div className="toolbar-group runner-controls">
                    {runner.isIdle && (
                        <button
                            className="toolbar-btn runner-start"
                            onClick={runner.startFlow}
                            title="Start Flow"
                        >
                            ▶ Run
                        </button>
                    )}

                    {runner.isRunning && (
                        <>
                            <button
                                className="toolbar-btn runner-pause"
                                onClick={runner.pauseFlow}
                                title="Pause"
                            >
                                ⏸ Pause
                            </button>
                            <button
                                className="toolbar-btn runner-skip"
                                onClick={runner.skipTask}
                                title="Skip current task"
                            >
                                ⏭ Skip
                            </button>
                        </>
                    )}

                    {runner.isPaused && (
                        <button
                            className="toolbar-btn runner-resume"
                            onClick={runner.resumeFlow}
                            title="Resume"
                        >
                            ▶ Resume
                        </button>
                    )}

                    {(runner.isRunning || runner.isPaused) && (
                        <button
                            className="toolbar-btn runner-stop"
                            onClick={runner.stopFlow}
                            title="Stop flow"
                        >
                            ⏹ Stop
                        </button>
                    )}

                    {runner.isCompleted && (
                        <button
                            className="toolbar-btn runner-start"
                            onClick={runner.startFlow}
                            title="Restart Flow"
                        >
                            🔁 Restart
                        </button>
                    )}

                    {/* Focus Mode button — visible when a task is active */}
                    {(runner.isRunning || runner.isPaused) && runner.activeNodeId && (
                        <button
                            className={`toolbar-btn focus-enter-btn ${isFocusActive ? 'active' : ''}`}
                            onClick={onToggleFocus}
                            title={isFocusActive ? 'Exit Focus Mode' : 'Enter Focus Mode'}
                        >
                            🎯 {isFocusActive ? 'Exit Focus' : 'Focus'}
                        </button>
                    )}

                    {/* Timer display */}
                    {(runner.isRunning || runner.isPaused) && runner.timeRemaining > 0 && (
                        <div className={`runner-timer ${runner.isPaused ? 'paused' : ''}`}>
                            ⏱ {formatTime(runner.timeRemaining)}
                        </div>
                    )}

                    {/* Progress bar */}
                    {isFlowRunning && (
                        <div className="runner-progress-bar" title={`${runner.progress}% complete`}>
                            <div
                                className="runner-progress-fill"
                                style={{ width: `${runner.progress}%` }}
                            />
                            <span className="runner-progress-label">{runner.progress}%</span>
                        </div>
                    )}
                </div>
            )}

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
