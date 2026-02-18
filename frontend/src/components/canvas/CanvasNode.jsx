import { memo, useCallback, useRef } from 'react'

const DIFFICULTY_CONFIG = {
    easy: { emoji: '🟢', label: 'Easy' },
    medium: { emoji: '🟡', label: 'Medium' },
    hard: { emoji: '🔴', label: 'Hard' }
}

const STATUS_CYCLE = ['pending', 'in-progress', 'completed']
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
    zoom
}) => {
    const nodeRef = useRef(null)

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
        if (onStatusCycle) {
            onStatusCycle(node.id)
        }
    }, [node.id, onStatusCycle])

    const shapeClass = node.shape === 'diamond' ? 'shape-diamond'
        : node.shape === 'rounded' ? 'shape-rounded'
            : 'shape-rectangle'

    const status = node.data?.status || 'pending'
    const difficulty = node.data?.difficulty || 'medium'
    const diffConfig = DIFFICULTY_CONFIG[difficulty]
    const isCompleted = status === 'completed'

    return (
        <div
            ref={nodeRef}
            className={`canvas-node ${shapeClass} ${isSelected ? 'selected' : ''} status-${status} ${isCompleted ? 'node-completed' : ''}`}
            style={{
                transform: `translate(${node.position.x}px, ${node.position.y}px)`,
            }}
            onMouseDown={handleMouseDown}
            data-node-id={node.id}
        >
            {/* Input Handle */}
            <div
                className="node-handle input"
                data-handle-type="input"
                data-node-id={node.id}
            />

            <div className="node-body">
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
                    {node.shape !== 'diamond' && (
                        <div className="node-meta">
                            <span className={`meta-item difficulty ${difficulty}`} title={diffConfig.label}>
                                {diffConfig.emoji} {diffConfig.label}
                            </span>
                            <span className="meta-item points">
                                ⭐ {node.data?.pointsReward ?? 50}
                            </span>
                            <span className="meta-item energy">
                                ⚡ {node.data?.energyCost ?? 10}
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* Output Handle */}
            <div
                className="node-handle output"
                onMouseDown={handleOutputMouseDown}
                data-handle-type="output"
                data-node-id={node.id}
            />
        </div>
    )
}

export default memo(CanvasNode)
