import { memo, useCallback, useRef } from 'react'

const DIFFICULTY_CONFIG = {
    easy: { emoji: '🟢', label: 'Easy' },
    medium: { emoji: '🟡', label: 'Medium' },
    hard: { emoji: '🔴', label: 'Hard' }
}

const STATUS_EMOJI = {
    'pending': '⏳',
    'in-progress': '🔄',
    'completed': '✅',
    'failed': '❌'
}

const CanvasNode = ({
    node,
    isSelected,
    onSelect,
    onDragStart,
    onConnectionStart,
    onStatusCycle,
    runnerState,
    zoom
}) => {
    const nodeRef = useRef(null)
    const nodeType = node.data?.nodeType || 'task'

    const handleMouseDown = useCallback((e) => {
        if (e.button !== 0) return
        if (e.target.classList.contains('node-handle')) return
        if (e.target.closest('.status-cycle-btn')) return
        e.stopPropagation()
        onSelect(node.id)
        onDragStart(node.id, e)
    }, [node.id, onSelect, onDragStart])

    const handleOutputMouseDown = useCallback((e) => {
        e.stopPropagation()
        e.preventDefault()
        onConnectionStart(node.id, e)
    }, [node.id, onConnectionStart])

    const handleStatusClick = useCallback((e) => {
        e.stopPropagation()
        e.preventDefault()
        if (onStatusCycle && nodeType === 'task') {
            onStatusCycle(node.id)
        }
    }, [node.id, onStatusCycle, nodeType])

    // Determine shape based on nodeType
    const getShapeClass = () => {
        if (nodeType === 'start' || nodeType === 'end') return 'shape-rounded'
        if (nodeType === 'decision') return 'shape-diamond'
        // Regular task
        return node.shape === 'diamond' ? 'shape-diamond'
            : node.shape === 'rounded' ? 'shape-rounded'
                : 'shape-rectangle'
    }

    const status = node.data?.status || 'pending'
    const difficulty = node.data?.difficulty || 'medium'
    const diffConfig = DIFFICULTY_CONFIG[difficulty]
    const isCompleted = status === 'completed'
    const isActive = runnerState?.activeNodeId === node.id

    // Render based on node type
    const renderNodeContent = () => {
        if (nodeType === 'start') {
            return (
                <div className="node-inner special-node start-node-inner">
                    <span className="special-node-icon">▶</span>
                    <span className="special-node-label">Start</span>
                </div>
            )
        }

        if (nodeType === 'end') {
            return (
                <div className="node-inner special-node end-node-inner">
                    <span className="special-node-icon">🏁</span>
                    <span className="special-node-label">End</span>
                </div>
            )
        }

        if (nodeType === 'decision') {
            return (
                <div className="node-inner decision-node-inner">
                    <span className="decision-icon">❓</span>
                    <span className="node-title decision-title">{node.data?.title || 'Decision'}</span>
                </div>
            )
        }

        // Default: task node
        return (
            <div className="node-inner">
                <div className="node-header">
                    <button
                        className="status-cycle-btn"
                        onClick={handleStatusClick}
                        title={`Status: ${status} (click to change)`}
                    >
                        {STATUS_EMOJI[status]}
                    </button>
                    <span className="node-title">{node.data?.title || 'New Task'}</span>
                </div>
                <div className="node-meta">
                    <span className={`meta-item difficulty ${difficulty}`} title={diffConfig.label}>
                        {diffConfig.emoji} {diffConfig.label}
                    </span>
                    {node.data?.duration && (
                        <span className="meta-item duration">
                            ⏱ {node.data.duration}m
                        </span>
                    )}
                    <span className="meta-item points">
                        ⭐ {node.data?.pointsReward ?? 50}
                    </span>
                    <span className="meta-item energy">
                        ⚡ {node.data?.energyCost ?? 10}
                    </span>
                </div>
                {isActive && runnerState?.timeRemaining != null && (
                    <div className="node-countdown-overlay">
                        {formatTime(runnerState.timeRemaining)}
                    </div>
                )}
            </div>
        )
    }

    return (
        <div
            ref={nodeRef}
            className={[
                'canvas-node',
                getShapeClass(),
                isSelected ? 'selected' : '',
                `nodetype-${nodeType}`,
                nodeType === 'task' ? `status-${status}` : '',
                isCompleted ? 'node-completed' : '',
                isActive ? 'node-active-running' : ''
            ].filter(Boolean).join(' ')}
            style={{
                transform: `translate(${node.position.x}px, ${node.position.y}px)`,
            }}
            onMouseDown={handleMouseDown}
            data-node-id={node.id}
        >
            {/* Input Handle */}
            {nodeType !== 'start' && (
                <div
                    className="node-handle input"
                    data-handle-type="input"
                    data-node-id={node.id}
                />
            )}

            <div className="node-body">
                {renderNodeContent()}
            </div>

            {/* Output Handle */}
            {nodeType !== 'end' && (
                <div
                    className="node-handle output"
                    onMouseDown={handleOutputMouseDown}
                    data-handle-type="output"
                    data-node-id={node.id}
                />
            )}
        </div>
    )
}

function formatTime(seconds) {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
}

export default memo(CanvasNode)
