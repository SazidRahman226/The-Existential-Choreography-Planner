import { useState, useCallback, useRef, useEffect } from 'react'
import CanvasNode from './CanvasNode'
import CanvasEdge from './CanvasEdge'

const FlowCanvas = ({
    nodes,
    edges,
    selectedNodeId,
    selectedEdgeId,
    onNodesChange,
    onEdgesChange,
    onNodeSelect,
    onEdgeSelect,
    onEdgeDelete,
    onDoubleClickAdd,
    onStatusCycle,
    containerRef
}) => {
    const [viewport, setViewport] = useState({ x: 0, y: 0, zoom: 1 })
    const [isPanning, setIsPanning] = useState(false)
    const [panStart, setPanStart] = useState({ x: 0, y: 0 })

    // Dragging state
    const [dragNodeId, setDragNodeId] = useState(null)
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })

    // Connection drawing state
    const [connecting, setConnecting] = useState(null) // { sourceId, startX, startY, currentX, currentY }

    const viewportRef = useRef(null)

    // ---- Zoom ----
    const handleWheel = useCallback((e) => {
        e.preventDefault()
        const delta = e.deltaY > 0 ? 0.9 : 1.1
        setViewport(prev => {
            const newZoom = Math.min(Math.max(prev.zoom * delta, 0.2), 3)
            const rect = viewportRef.current.getBoundingClientRect()
            const mouseX = e.clientX - rect.left
            const mouseY = e.clientY - rect.top

            // Zoom towards mouse position
            const newX = mouseX - (mouseX - prev.x) * (newZoom / prev.zoom)
            const newY = mouseY - (mouseY - prev.y) * (newZoom / prev.zoom)

            return { x: newX, y: newY, zoom: newZoom }
        })
    }, [])

    useEffect(() => {
        const el = viewportRef.current
        if (!el) return
        el.addEventListener('wheel', handleWheel, { passive: false })
        return () => el.removeEventListener('wheel', handleWheel)
    }, [handleWheel])

    // Expose zoom controls
    useEffect(() => {
        if (containerRef) {
            containerRef.current = {
                getZoom: () => viewport.zoom,
                zoomIn: () => setViewport(prev => ({ ...prev, zoom: Math.min(prev.zoom * 1.2, 3) })),
                zoomOut: () => setViewport(prev => ({ ...prev, zoom: Math.max(prev.zoom * 0.8, 0.2) })),
                fitView: () => {
                    if (nodes.length === 0) {
                        setViewport({ x: 0, y: 0, zoom: 1 })
                        return
                    }
                    const rect = viewportRef.current?.getBoundingClientRect()
                    if (!rect) return
                    const xs = nodes.map(n => n.position.x)
                    const ys = nodes.map(n => n.position.y)
                    const minX = Math.min(...xs) - 100
                    const maxX = Math.max(...xs) + 300
                    const minY = Math.min(...ys) - 100
                    const maxY = Math.max(...ys) + 200
                    const contentW = maxX - minX
                    const contentH = maxY - minY
                    const zoom = Math.min(rect.width / contentW, rect.height / contentH, 1.5)
                    const x = (rect.width - contentW * zoom) / 2 - minX * zoom
                    const y = (rect.height - contentH * zoom) / 2 - minY * zoom
                    setViewport({ x, y, zoom })
                },
                getViewport: () => viewport
            }
        }
    }, [containerRef, viewport, nodes])

    // ---- Double-click to add node ----
    const handleDoubleClick = useCallback((e) => {
        if (e.target !== viewportRef.current) return
        const rect = viewportRef.current.getBoundingClientRect()
        const canvasX = (e.clientX - rect.left - viewport.x) / viewport.zoom
        const canvasY = (e.clientY - rect.top - viewport.y) / viewport.zoom
        if (onDoubleClickAdd) onDoubleClickAdd(canvasX, canvasY)
    }, [viewport, onDoubleClickAdd])

    // ---- Pan ----
    const handlePanStart = useCallback((e) => {
        // Middle mouse button or left click on empty canvas
        if (e.button === 1 || (e.button === 0 && e.target === viewportRef.current)) {
            e.preventDefault()
            setIsPanning(true)
            setPanStart({ x: e.clientX - viewport.x, y: e.clientY - viewport.y })

            // Deselect everything
            onNodeSelect(null)
            onEdgeSelect(null)
        }
    }, [viewport, onNodeSelect, onEdgeSelect])

    const handlePanMove = useCallback((e) => {
        if (isPanning) {
            setViewport(prev => ({
                ...prev,
                x: e.clientX - panStart.x,
                y: e.clientY - panStart.y
            }))
            return
        }

        // Handle node dragging
        if (dragNodeId) {
            const rect = viewportRef.current.getBoundingClientRect()
            const canvasX = (e.clientX - rect.left - viewport.x) / viewport.zoom
            const canvasY = (e.clientY - rect.top - viewport.y) / viewport.zoom

            onNodesChange(prevNodes => prevNodes.map(n =>
                n.id === dragNodeId
                    ? { ...n, position: { x: canvasX - dragOffset.x, y: canvasY - dragOffset.y } }
                    : n
            ))
            return
        }

        // Handle connection drawing
        if (connecting) {
            const rect = viewportRef.current.getBoundingClientRect()
            const canvasX = (e.clientX - rect.left - viewport.x) / viewport.zoom
            const canvasY = (e.clientY - rect.top - viewport.y) / viewport.zoom
            setConnecting(prev => ({ ...prev, currentX: canvasX, currentY: canvasY }))
        }
    }, [isPanning, panStart, dragNodeId, dragOffset, viewport, connecting, onNodesChange])

    const handlePanEnd = useCallback((e) => {
        setIsPanning(false)

        // Finish node drag
        if (dragNodeId) {
            setDragNodeId(null)
        }

        // Finish connection
        if (connecting) {
            // Check if we released on an input handle
            const targetEl = document.elementFromPoint(e.clientX, e.clientY)
            const handleType = targetEl?.dataset?.handleType
            const targetNodeId = targetEl?.dataset?.nodeId

            if (handleType === 'input' && targetNodeId && targetNodeId !== connecting.sourceId) {
                // Check if edge already exists
                const exists = edges.some(
                    edge => edge.source === connecting.sourceId && edge.target === targetNodeId
                )
                if (!exists) {
                    const newEdge = {
                        id: `edge_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                        source: connecting.sourceId,
                        target: targetNodeId,
                        animated: true
                    }
                    onEdgesChange(prev => [...prev, newEdge])
                }
            }
            setConnecting(null)
        }
    }, [dragNodeId, connecting, edges, onEdgesChange])

    // ---- Node Dragging ----
    const handleNodeDragStart = useCallback((nodeId, e) => {
        const rect = viewportRef.current.getBoundingClientRect()
        const canvasX = (e.clientX - rect.left - viewport.x) / viewport.zoom
        const canvasY = (e.clientY - rect.top - viewport.y) / viewport.zoom
        const node = nodes.find(n => n.id === nodeId)
        if (!node) return

        setDragNodeId(nodeId)
        setDragOffset({
            x: canvasX - node.position.x,
            y: canvasY - node.position.y
        })
    }, [viewport, nodes])

    // ---- Connection ----
    const handleConnectionStart = useCallback((nodeId, e) => {
        const rect = viewportRef.current.getBoundingClientRect()
        const canvasX = (e.clientX - rect.left - viewport.x) / viewport.zoom
        const canvasY = (e.clientY - rect.top - viewport.y) / viewport.zoom

        setConnecting({
            sourceId: nodeId,
            startX: canvasX,
            startY: canvasY,
            currentX: canvasX,
            currentY: canvasY
        })
    }, [viewport])

    // ---- Compute handle positions for edges ----
    const getHandlePos = useCallback((nodeId, handleType) => {
        const node = nodes.find(n => n.id === nodeId)
        if (!node) return null

        const nodeType = node.data?.nodeType || 'task'

        // Node dimensions by type
        let nodeWidth, nodeHeight
        if (nodeType === 'decision' || node.shape === 'diamond') {
            nodeWidth = 110
            nodeHeight = 110
        } else if (nodeType === 'start' || nodeType === 'end') {
            nodeWidth = 120
            nodeHeight = 50
        } else {
            nodeWidth = 200
            nodeHeight = 60
        }

        // Diamond nodes: handles at top/bottom center
        if (nodeType === 'decision' || node.shape === 'diamond') {
            if (handleType === 'output') {
                return { x: node.position.x + nodeWidth / 2, y: node.position.y + nodeHeight }
            } else {
                return { x: node.position.x + nodeWidth / 2, y: node.position.y }
            }
        }

        // All other nodes: handles at left/right center
        if (handleType === 'output') {
            return { x: node.position.x + nodeWidth, y: node.position.y + nodeHeight / 2 }
        } else {
            return { x: node.position.x, y: node.position.y + nodeHeight / 2 }
        }
    }, [nodes])

    return (
        <div
            ref={viewportRef}
            className={`canvas-viewport ${connecting ? 'connecting' : ''}`}
            onMouseDown={handlePanStart}
            onMouseMove={handlePanMove}
            onMouseUp={handlePanEnd}
            onMouseLeave={handlePanEnd}
            onDoubleClick={handleDoubleClick}
        >
            {nodes.length === 0 && !connecting && (
                <div className="canvas-empty-state">
                    <div className="empty-icon">📐</div>
                    <h3>Your canvas is empty</h3>
                    <p>Double-click anywhere or use "+ Task" to get started</p>
                </div>
            )}

            <div
                className="canvas-transform-layer"
                style={{
                    transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`
                }}
            >
                {/* SVG Edge Layer */}
                <svg className="canvas-edges-svg">
                    <defs>
                        <marker
                            id="arrowhead"
                            markerWidth="10"
                            markerHeight="7"
                            refX="9"
                            refY="3.5"
                            orient="auto"
                        >
                            <polygon points="0 0, 10 3.5, 0 7" fill="var(--border-color)" />
                        </marker>
                    </defs>

                    {/* Existing edges */}
                    {edges.map(edge => (
                        <CanvasEdge
                            key={edge.id}
                            edge={edge}
                            sourcePos={getHandlePos(edge.source, 'output')}
                            targetPos={getHandlePos(edge.target, 'input')}
                            isSelected={selectedEdgeId === edge.id}
                            onSelect={onEdgeSelect}
                        />
                    ))}

                    {/* Temp connection line while drawing */}
                    {connecting && (
                        <path
                            className="edge-temp"
                            d={`M ${connecting.startX} ${connecting.startY} 
                                C ${connecting.startX + 80} ${connecting.startY}, 
                                  ${connecting.currentX - 80} ${connecting.currentY}, 
                                  ${connecting.currentX} ${connecting.currentY}`}
                        />
                    )}
                </svg>

                {/* Nodes */}
                {nodes.map(node => (
                    <CanvasNode
                        key={node.id}
                        node={node}
                        isSelected={selectedNodeId === node.id}
                        onSelect={onNodeSelect}
                        onDragStart={handleNodeDragStart}
                        onConnectionStart={handleConnectionStart}
                        onStatusCycle={onStatusCycle}
                        zoom={viewport.zoom}
                    />
                ))}
            </div>

            {/* Edge Delete Button */}
            {selectedEdgeId && (() => {
                const edge = edges.find(e => e.id === selectedEdgeId)
                if (!edge) return null
                const srcPos = getHandlePos(edge.source, 'output')
                const tgtPos = getHandlePos(edge.target, 'input')
                if (!srcPos || !tgtPos) return null
                const midX = ((srcPos.x + tgtPos.x) / 2) * viewport.zoom + viewport.x
                const midY = ((srcPos.y + tgtPos.y) / 2) * viewport.zoom + viewport.y
                return (
                    <button
                        className="edge-delete-btn"
                        style={{ left: midX, top: midY }}
                        onClick={() => onEdgeDelete(selectedEdgeId)}
                        title="Delete connection"
                    >
                        ✕
                    </button>
                )
            })()}
        </div>
    )
}

export default FlowCanvas
