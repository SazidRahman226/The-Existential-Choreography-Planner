import { memo } from 'react'

const CanvasEdge = ({ edge, sourcePos, targetPos, isSelected, onSelect }) => {
    if (!sourcePos || !targetPos) return null

    const dx = targetPos.x - sourcePos.x
    const controlOffset = Math.max(Math.abs(dx) * 0.5, 60)

    // Bézier curve control points
    const path = `M ${sourcePos.x} ${sourcePos.y} 
                  C ${sourcePos.x + controlOffset} ${sourcePos.y}, 
                    ${targetPos.x - controlOffset} ${targetPos.y}, 
                    ${targetPos.x} ${targetPos.y}`

    // Midpoint for label and arrow
    const midX = (sourcePos.x + targetPos.x) / 2
    const midY = (sourcePos.y + targetPos.y) / 2

    return (
        <g>
            {/* Invisible wider path for easier clicking */}
            <path
                d={path}
                fill="none"
                stroke="transparent"
                strokeWidth="16"
                style={{ cursor: 'pointer', pointerEvents: 'stroke' }}
                onClick={(e) => {
                    e.stopPropagation()
                    onSelect(edge.id)
                }}
            />
            {/* Visible path */}
            <path
                d={path}
                className={`edge-path ${isSelected ? 'selected' : ''} edge-animated`}
                onClick={(e) => {
                    e.stopPropagation()
                    onSelect(edge.id)
                }}
            />
            {/* Small circle at midpoint */}
            <circle
                cx={midX}
                cy={midY}
                r="4"
                className="edge-arrow"
            />
            {/* Edge label (for decision edges) */}
            {edge.label && (
                <g>
                    <rect
                        x={midX - (edge.label.length * 4 + 8)}
                        y={midY - 22}
                        width={edge.label.length * 8 + 16}
                        height={20}
                        rx="10"
                        ry="10"
                        className="edge-label-bg"
                    />
                    <text
                        x={midX}
                        y={midY - 9}
                        className="edge-label-text"
                        textAnchor="middle"
                    >
                        {edge.label}
                    </text>
                </g>
            )}
        </g>
    )
}

export default memo(CanvasEdge)
