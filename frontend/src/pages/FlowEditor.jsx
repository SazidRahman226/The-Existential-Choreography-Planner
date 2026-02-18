import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import flowService from '../services/flow.service'
import taskService from '../services/task.service'
import FlowCanvas from '../components/canvas/FlowCanvas'
import CanvasToolbar from '../components/canvas/CanvasToolbar'
import NodeEditPanel from '../components/canvas/NodeEditPanel'
import XPPopup from '../components/canvas/XPPopup'
import '../styles/canvas.css'

const STATUS_CYCLE = ['pending', 'in-progress', 'completed']

const FlowEditor = () => {
    const { id } = useParams()
    const navigate = useNavigate()
    const canvasRef = useRef(null)

    const [flow, setFlow] = useState(null)
    const [nodes, setNodes] = useState([])
    const [edges, setEdges] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [saveStatus, setSaveStatus] = useState('saved')
    const [xpPopups, setXpPopups] = useState([])

    const [selectedNodeId, setSelectedNodeId] = useState(null)
    const [selectedEdgeId, setSelectedEdgeId] = useState(null)

    const selectedNode = nodes.find(n => n.id === selectedNodeId) || null

    // ---- Load Flow ----
    useEffect(() => {
        const fetchFlow = async () => {
            try {
                const data = await flowService.getById(id)
                setFlow(data)
                const flowData = data.flowData || { nodes: [], edges: [] }
                setNodes(flowData.nodes || [])
                setEdges(flowData.edges || [])
            } catch (err) {
                setError(err.response?.data?.message || 'Failed to load flow')
            } finally {
                setLoading(false)
            }
        }
        fetchFlow()
    }, [id])

    // ---- Track unsaved changes ----
    const markUnsaved = useCallback(() => {
        setSaveStatus('unsaved')
    }, [])

    const handleNodesChange = useCallback((updater) => {
        setNodes(prev => {
            const updated = typeof updater === 'function' ? updater(prev) : updater
            return updated
        })
        markUnsaved()
    }, [markUnsaved])

    const handleEdgesChange = useCallback((updater) => {
        setEdges(prev => {
            const updated = typeof updater === 'function' ? updater(prev) : updater
            return updated
        })
        markUnsaved()
    }, [markUnsaved])

    // ---- Generate unique node ID ----
    const genNodeId = () => `node_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`

    // ---- Add Node (from template or custom) ----
    const handleAddNode = useCallback((template) => {
        const vp = canvasRef.current?.getViewport?.() || { x: 0, y: 0, zoom: 1 }
        const centerX = (400 - vp.x) / vp.zoom
        const centerY = (300 - vp.y) / vp.zoom
        const offset = nodes.length * 40

        const newNode = {
            id: genNodeId(),
            position: { x: centerX + offset, y: centerY + offset },
            shape: 'rectangle',
            data: {
                title: template?.label || `Task ${nodes.length + 1}`,
                description: '',
                difficulty: template?.difficulty || 'medium',
                pointsReward: template?.pointsReward ?? 50,
                energyCost: template?.energyCost ?? 10,
                status: 'pending',
                templateId: template?.id || null
            }
        }

        setNodes(prev => [...prev, newNode])
        setSelectedNodeId(newNode.id)
        setSelectedEdgeId(null)
        markUnsaved()
    }, [nodes.length, markUnsaved])

    // ---- Double-click to add node at position ----
    const handleDoubleClickAdd = useCallback((canvasX, canvasY) => {
        const newNode = {
            id: genNodeId(),
            position: { x: canvasX - 100, y: canvasY - 30 },
            shape: 'rectangle',
            data: {
                title: `Task ${nodes.length + 1}`,
                description: '',
                difficulty: 'medium',
                pointsReward: 50,
                energyCost: 10,
                status: 'pending'
            }
        }

        setNodes(prev => [...prev, newNode])
        setSelectedNodeId(newNode.id)
        setSelectedEdgeId(null)
        markUnsaved()
    }, [nodes.length, markUnsaved])

    // ---- Status cycling ----
    const handleStatusCycle = useCallback((nodeId) => {
        setNodes(prev => {
            return prev.map(n => {
                if (n.id !== nodeId) return n

                const currentStatus = n.data?.status || 'pending'
                const currentIdx = STATUS_CYCLE.indexOf(currentStatus)
                const nextIdx = (currentIdx + 1) % STATUS_CYCLE.length
                const nextStatus = STATUS_CYCLE[nextIdx]

                // Trigger XP popup on completion
                if (nextStatus === 'completed') {
                    const xp = n.data?.pointsReward || 50
                    setXpPopups(prev => [...prev, {
                        id: `xp_${Date.now()}`,
                        x: n.position.x + 100,
                        y: n.position.y - 20,
                        xp
                    }])
                }

                return {
                    ...n,
                    data: { ...n.data, status: nextStatus }
                }
            })
        })
        markUnsaved()
    }, [markUnsaved])

    // ---- Remove XP popup after animation ----
    const removeXpPopup = useCallback((popupId) => {
        setXpPopups(prev => prev.filter(p => p.id !== popupId))
    }, [])

    // ---- Node Selection ----
    const handleNodeSelect = useCallback((nodeId) => {
        setSelectedNodeId(nodeId)
        setSelectedEdgeId(null)
    }, [])

    // ---- Edge Selection ----
    const handleEdgeSelect = useCallback((edgeId) => {
        setSelectedEdgeId(edgeId)
        setSelectedNodeId(null)
    }, [])

    // ---- Update Node ----
    const handleNodeUpdate = useCallback((nodeId, updates) => {
        setNodes(prev => prev.map(n =>
            n.id === nodeId
                ? {
                    ...n,
                    shape: updates.shape !== undefined ? updates.shape : n.shape,
                    data: updates.data !== undefined ? { ...n.data, ...updates.data } : n.data
                }
                : n
        ))
        markUnsaved()
    }, [markUnsaved])

    // ---- Delete Node ----
    const handleNodeDelete = useCallback((nodeId) => {
        setNodes(prev => prev.filter(n => n.id !== nodeId))
        setEdges(prev => prev.filter(e => e.source !== nodeId && e.target !== nodeId))
        setSelectedNodeId(null)
        markUnsaved()
    }, [markUnsaved])

    // ---- Delete Edge ----
    const handleEdgeDelete = useCallback((edgeId) => {
        setEdges(prev => prev.filter(e => e.id !== edgeId))
        setSelectedEdgeId(null)
        markUnsaved()
    }, [markUnsaved])

    // ---- Save ----
    const handleSave = useCallback(async () => {
        setSaveStatus('saving')
        try {
            await flowService.update(id, {
                flowData: { nodes, edges }
            })

            for (const node of nodes) {
                const taskData = {
                    title: node.data.title || 'Untitled Task',
                    description: node.data.description || '',
                    workflowId: id,
                    nodeId: node.id,
                    difficulty: node.data.difficulty || 'medium',
                    pointsReward: node.data.pointsReward || 0,
                    energyCost: node.data.energyCost || 0,
                    status: node.data.status || 'pending',
                    prerequisites: edges
                        .filter(e => e.target === node.id)
                        .map(e => {
                            const srcNode = nodes.find(n => n.id === e.source)
                            return srcNode?.data?.taskId
                        })
                        .filter(Boolean)
                }

                if (node.data?.taskId) {
                    await taskService.update(node.data.taskId, taskData)
                } else {
                    const created = await taskService.create(taskData)
                    setNodes(prev => prev.map(n =>
                        n.id === node.id
                            ? { ...n, data: { ...n.data, taskId: created._id } }
                            : n
                    ))
                }
            }

            setSaveStatus('saved')
        } catch (err) {
            console.error('Save failed:', err)
            setSaveStatus('unsaved')
            alert('Failed to save: ' + (err.response?.data?.message || err.message))
        }
    }, [id, nodes, edges])

    // ---- Zoom Controls ----
    const zoomIn = () => canvasRef.current?.zoomIn?.()
    const zoomOut = () => canvasRef.current?.zoomOut?.()
    const fitView = () => canvasRef.current?.fitView?.()
    const currentZoom = canvasRef.current?.getZoom?.() || 1

    // ---- Keyboard shortcuts ----
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return

            if (e.key === 'Delete' || e.key === 'Backspace') {
                if (selectedEdgeId) {
                    handleEdgeDelete(selectedEdgeId)
                } else if (selectedNodeId) {
                    if (confirm('Delete this node and all its connections?')) {
                        handleNodeDelete(selectedNodeId)
                    }
                }
            }

            if (e.key === 'Escape') {
                setSelectedNodeId(null)
                setSelectedEdgeId(null)
            }

            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault()
                handleSave()
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [selectedNodeId, selectedEdgeId, handleEdgeDelete, handleNodeDelete, handleSave])

    if (loading) {
        return (
            <div className="flow-editor-page">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
                    <p>Loading flow...</p>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="flow-editor-page">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, flexDirection: 'column', gap: '1rem' }}>
                    <p className="error-message">{error}</p>
                    <button className="btn-primary" onClick={() => navigate('/dashboard')}>Back to Dashboard</button>
                </div>
            </div>
        )
    }

    return (
        <div className="flow-editor-page">
            <CanvasToolbar
                flowTitle={flow?.title}
                zoom={currentZoom}
                saveStatus={saveStatus}
                onAddNode={handleAddNode}
                onZoomIn={zoomIn}
                onZoomOut={zoomOut}
                onFitView={fitView}
                onSave={handleSave}
                onBack={() => navigate('/dashboard')}
            />

            <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
                <FlowCanvas
                    nodes={nodes}
                    edges={edges}
                    selectedNodeId={selectedNodeId}
                    selectedEdgeId={selectedEdgeId}
                    onNodesChange={handleNodesChange}
                    onEdgesChange={handleEdgesChange}
                    onNodeSelect={handleNodeSelect}
                    onEdgeSelect={handleEdgeSelect}
                    onEdgeDelete={handleEdgeDelete}
                    onDoubleClickAdd={handleDoubleClickAdd}
                    onStatusCycle={handleStatusCycle}
                    containerRef={canvasRef}
                />

                {selectedNode && (
                    <NodeEditPanel
                        node={selectedNode}
                        onUpdate={handleNodeUpdate}
                        onDelete={handleNodeDelete}
                        onClose={() => setSelectedNodeId(null)}
                    />
                )}

                {/* XP Popups rendered in viewport coordinates */}
                <XPPopup popups={xpPopups} onRemove={removeXpPopup} />
            </div>
        </div>
    )
}

export default FlowEditor
