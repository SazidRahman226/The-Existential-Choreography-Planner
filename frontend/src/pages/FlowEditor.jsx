import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import flowService from '../services/flow.service'
import taskService from '../services/task.service'
import SESSION_MODES from '../config/sessionModes'
import FlowCanvas from '../components/canvas/FlowCanvas'
import CanvasToolbar from '../components/canvas/CanvasToolbar'
import NodeEditPanel from '../components/canvas/NodeEditPanel'
import XPPopup from '../components/canvas/XPPopup'
import DecisionPopup from '../components/canvas/DecisionPopup'
import CompletionCelebration from '../components/canvas/CompletionCelebration'
import PostTaskReview from '../components/canvas/PostTaskReview'
import ReflectionCard from '../components/canvas/ReflectionCard'
import FocusOverlay from '../components/canvas/FocusOverlay'
import useFlowRunner from '../hooks/useFlowRunner'
import useAmbientAudio from '../hooks/useAmbientAudio'
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
    const [sessionEarnedXP, setSessionEarnedXP] = useState(0)
    const [flowBonus, setFlowBonus] = useState(null)
    const [reflectionData, setReflectionData] = useState(null)

    const [selectedNodeId, setSelectedNodeId] = useState(null)
    const [selectedEdgeId, setSelectedEdgeId] = useState(null)

    const selectedNode = nodes.find(n => n.id === selectedNodeId) || null

    // ---- Flow Runner ----
    const runner = useFlowRunner(nodes, edges, setNodes)

    // ---- Focus Mode & Audio ----
    const [isFocusActive, setIsFocusActive] = useState(false)
    const ambientAudio = useAmbientAudio()

    // Start/switch audio when focus is active and active node changes
    useEffect(() => {
        if (isFocusActive && runner.activeNode) {
            const modeKey = runner.activeNode.data?.sessionMode || 'focus'
            const mode = SESSION_MODES[modeKey]
            if (mode?.audio) {
                ambientAudio.play(mode.audio)
            }
        } else if (!isFocusActive) {
            ambientAudio.stop()
        }
    }, [isFocusActive, runner.activeNodeId])

    // Exit focus mode when runner stops or completes
    useEffect(() => {
        if (runner.isIdle || runner.isCompleted) {
            setIsFocusActive(false)
            ambientAudio.stop()
        }
    }, [runner.isIdle, runner.isCompleted])

    const toggleFocus = useCallback(() => {
        setIsFocusActive(prev => !prev)
    }, [])

    // ---- Load Flow ----
    useEffect(() => {
        const fetchFlow = async () => {
            try {
                const data = await flowService.getById(id)
                setFlow(data)
                const flowData = data.flowData || { nodes: [], edges: [] }
                let loadedNodes = flowData.nodes || []
                let loadedEdges = flowData.edges || []

                // Auto-create Start/End nodes if missing
                const hasStart = loadedNodes.some(n => n.data?.nodeType === 'start')
                const hasEnd = loadedNodes.some(n => n.data?.nodeType === 'end')

                if (!hasStart) {
                    loadedNodes = [{
                        id: `node_start_${Date.now()}`,
                        position: { x: 100, y: 300 },
                        shape: 'rounded',
                        data: { nodeType: 'start', title: 'Start' }
                    }, ...loadedNodes]
                }

                if (!hasEnd) {
                    const maxX = loadedNodes.reduce((max, n) => Math.max(max, n.position?.x || 0), 0)
                    loadedNodes = [...loadedNodes, {
                        id: `node_end_${Date.now()}`,
                        position: { x: Math.max(maxX + 300, 700), y: 300 },
                        shape: 'rounded',
                        data: { nodeType: 'end', title: 'End' }
                    }]
                }

                setNodes(loadedNodes)
                setEdges(loadedEdges)
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
        setNodes(prev => typeof updater === 'function' ? updater(prev) : updater)
        markUnsaved()
    }, [markUnsaved])

    const handleEdgesChange = useCallback((updater) => {
        setEdges(prev => typeof updater === 'function' ? updater(prev) : updater)
        markUnsaved()
    }, [markUnsaved])

    // ---- Generate unique node ID ----
    const genNodeId = () => `node_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`

    // ---- Add Node (from template) ----
    const handleAddNode = useCallback((template) => {
        const vp = canvasRef.current?.getViewport?.() || { x: 0, y: 0, zoom: 1 }
        const centerX = (400 - vp.x) / vp.zoom
        const centerY = (300 - vp.y) / vp.zoom
        const offset = nodes.length * 40

        const nodeType = template?.nodeType || 'task'

        const newNode = {
            id: genNodeId(),
            position: { x: centerX + offset, y: centerY + offset },
            shape: nodeType === 'decision' ? 'diamond' : nodeType === 'start' || nodeType === 'end' ? 'rounded' : 'rectangle',
            data: {
                nodeType,
                title: template?.label || `Task ${nodes.length + 1}`,
                description: '',
                difficulty: template?.difficulty || 'medium',
                pointsReward: template?.pointsReward ?? 50,
                energyCost: template?.energyCost ?? 10,
                duration: template?.duration ?? 30,
                sessionMode: template?.sessionMode || 'focus',
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
        if (!runner.isIdle) return // Don't add nodes while running

        const newNode = {
            id: genNodeId(),
            position: { x: canvasX - 100, y: canvasY - 30 },
            shape: 'rectangle',
            data: {
                nodeType: 'task',
                title: `Task ${nodes.length + 1}`,
                description: '',
                difficulty: 'medium',
                pointsReward: 50,
                energyCost: 10,
                duration: 30,
                status: 'pending'
            }
        }

        setNodes(prev => [...prev, newNode])
        setSelectedNodeId(newNode.id)
        setSelectedEdgeId(null)
        markUnsaved()
    }, [nodes.length, markUnsaved, runner.isIdle])

    // ---- Status cycling (only when runner is idle) ----
    const handleStatusCycle = useCallback((nodeId) => {
        if (!runner.isIdle) return // Don't manually cycle during a run

        setNodes(prev => {
            return prev.map(n => {
                if (n.id !== nodeId) return n
                if (n.data?.nodeType !== 'task') return n

                const currentStatus = n.data?.status || 'pending'
                const currentIdx = STATUS_CYCLE.indexOf(currentStatus)
                const nextIdx = (currentIdx + 1) % STATUS_CYCLE.length
                const nextStatus = STATUS_CYCLE[nextIdx]

                if (nextStatus === 'completed') {
                    const xp = n.data?.pointsReward || 50
                    setXpPopups(prev => [...prev, {
                        id: `xp_${Date.now()}`,
                        x: n.position.x + 100,
                        y: n.position.y - 20,
                        xp
                    }])
                }

                return { ...n, data: { ...n.data, status: nextStatus } }
            })
        })
        markUnsaved()
    }, [markUnsaved, runner.isIdle])

    // ---- Remove XP popup ----
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

    // ---- Update Edge (for labels) ----
    const handleEdgeUpdate = useCallback((edgeId, updates) => {
        setEdges(prev => prev.map(e =>
            e.id === edgeId ? { ...e, ...updates } : e
        ))
        markUnsaved()
    }, [markUnsaved])

    // ---- Delete Node (prevent Start/End deletion) ----
    const handleNodeDelete = useCallback((nodeId) => {
        const node = nodes.find(n => n.id === nodeId)
        if (node?.data?.nodeType === 'start' || node?.data?.nodeType === 'end') {
            alert(`Cannot delete the ${node.data.nodeType} node — every flow needs one!`)
            return
        }
        setNodes(prev => prev.filter(n => n.id !== nodeId))
        setEdges(prev => prev.filter(e => e.source !== nodeId && e.target !== nodeId))
        setSelectedNodeId(null)
        markUnsaved()
    }, [nodes, markUnsaved])

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
            // Build a mutable copy so we can patch in taskIds before saving flowData
            let updatedNodes = [...nodes]

            // 1. Sync task nodes to backend FIRST, collecting any new taskIds
            const taskNodes = updatedNodes.filter(n => n.data?.nodeType === 'task' || !n.data?.nodeType)

            for (const node of taskNodes) {
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
                            const srcNode = updatedNodes.find(n => n.id === e.source)
                            return srcNode?.data?.taskId
                        })
                        .filter(Boolean)
                }

                if (node.data?.taskId) {
                    await taskService.update(node.data.taskId, taskData)
                } else {
                    const created = await taskService.create(taskData)
                    // Patch the taskId into our local copy
                    updatedNodes = updatedNodes.map(n =>
                        n.id === node.id
                            ? { ...n, data: { ...n.data, taskId: created._id } }
                            : n
                    )
                }
            }

            // 2. Save flowData WITH the taskIds baked in
            await flowService.update(id, {
                flowData: { nodes: updatedNodes, edges }
            })

            // 3. Update React state with the taskId-enriched nodes
            setNodes(updatedNodes)
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

            // Don't allow delete while running
            if (!runner.isIdle && (e.key === 'Delete' || e.key === 'Backspace')) return

            if (e.key === 'Delete' || e.key === 'Backspace') {
                if (selectedEdgeId) {
                    handleEdgeDelete(selectedEdgeId)
                } else if (selectedNodeId) {
                    handleNodeDelete(selectedNodeId)
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

            // Space to pause/resume
            if (e.key === ' ' && !runner.isIdle) {
                e.preventDefault()
                if (runner.isRunning) runner.pauseFlow()
                else if (runner.isPaused) runner.resumeFlow()
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [selectedNodeId, selectedEdgeId, handleEdgeDelete, handleNodeDelete, handleSave, runner])

    // ---- Handle Review Complete ----
    const handleReviewComplete = (outcome, xpResult) => {
        if (xpResult?.earnedXP > 0) {
            setSessionEarnedXP(prev => prev + xpResult.earnedXP)

            // Show popup near the active node
            const node = nodes.find(n => n.id === runner.activeNodeId)
            if (node) {
                const id = Date.now()
                setXpPopups(prev => [...prev, {
                    id,
                    amount: xpResult.earnedXP,
                    x: node.position.x + 100,
                    y: node.position.y
                }])
                // Auto remove after 2s
                setTimeout(() => {
                    setXpPopups(prev => prev.filter(p => p.id !== id))
                }, 2000)
            }
        }
        runner.resolveReview(outcome, xpResult)
    }

    // ---- Call Flow Completion API when celebration shows ----
    useEffect(() => {
        if (runner.showCelebration && id) {
            flowService.completeFlow(id, {
                completedOnTime: runner.onTimeCount,
                totalTasks: runner.totalTaskNodes
            }).then(result => {
                setFlowBonus(result)
                if (result.bonusXP > 0) {
                    setSessionEarnedXP(prev => prev + result.bonusXP)
                }
            }).catch(err => {
                console.error('Flow completion bonus error:', err)
            })
        } else if (!runner.showCelebration) {
            setFlowBonus(null)
        }
    }, [runner.showCelebration])

    // ---- Fetch task history for reflection when runner waits for it ----
    useEffect(() => {
        if (!runner.waitingForReflection || !runner.activeNode) return

        const taskId = runner.activeNode.data?.taskId
        const nodeType = runner.activeNode.data?.nodeType || 'task'

        if (taskId && nodeType === 'task') {
            taskService.getHistory(taskId).then(data => {
                if (data.history && data.history.length > 0) {
                    setReflectionData({
                        ...data,
                        taskTitle: runner.activeNode.data?.title || 'Task'
                    })
                } else {
                    // No history — skip reflection, go straight to countdown
                    runner.confirmTaskStart()
                }
            }).catch(() => {
                // API failed — skip reflection, go straight to countdown
                runner.confirmTaskStart()
            })
        } else {
            // No taskId — skip reflection, go straight to countdown
            runner.confirmTaskStart()
        }
    }, [runner.waitingForReflection, runner.activeNodeId])

    // ---- Handle reflection Start button ----
    const handleReflectionStart = useCallback(() => {
        setReflectionData(null)
        runner.confirmTaskStart()
    }, [runner])

    // ---- Handle reflection Edit button ----
    const handleReflectionEdit = useCallback(() => {
        if (runner.activeNodeId) {
            setSelectedNodeId(runner.activeNodeId)
        }
        setReflectionData(null)
        runner.confirmTaskStart()
    }, [runner])


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
                runner={runner}
                onToggleFocus={toggleFocus}
                isFocusActive={isFocusActive}
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
                    runnerState={runner.isIdle ? null : {
                        activeNodeId: runner.activeNodeId,
                        timeRemaining: runner.timeRemaining
                    }}
                />

                {/* Node Edit Panel — only when idle */}
                {selectedNode && runner.isIdle && (
                    <NodeEditPanel
                        node={selectedNode}
                        edges={edges}
                        nodes={nodes}
                        onUpdate={handleNodeUpdate}
                        onUpdateEdge={handleEdgeUpdate}
                        onDelete={handleNodeDelete}
                        onClose={() => setSelectedNodeId(null)}
                    />
                )}

                {/* XP Popups */}
                <XPPopup popups={xpPopups} onRemove={removeXpPopup} />

                {/* Pre-Task Reflection Card */}
                {reflectionData && runner.waitingForReflection && (
                    <ReflectionCard
                        history={reflectionData.history}
                        bestTime={reflectionData.bestTime}
                        suggestedDuration={reflectionData.suggestedDuration}
                        taskTitle={reflectionData.taskTitle}
                        onStart={handleReflectionStart}
                        onEdit={handleReflectionEdit}
                    />
                )}

                {/* Countdown Buffer */}
                {runner.countdownSeconds > 0 && (
                    <div className="countdown-overlay">
                        <div className="countdown-content">
                            <p className="countdown-label">Starting in</p>
                            <div className="countdown-number">{runner.countdownSeconds}</div>
                            <p className="countdown-task-name">{runner.activeNode?.data?.title || 'Task'}</p>
                        </div>
                    </div>
                )}

                {/* Post-Task Review Popup */}
                {runner.reviewPending && (
                    <PostTaskReview
                        taskTitle={runner.reviewPending.taskTitle}
                        taskDifficulty={runner.reviewPending.taskDifficulty}
                        taskId={runner.reviewPending.taskId}
                        timeRemainingPercent={runner.reviewPending.timeRemainingPercent}
                        totalDuration={runner.reviewPending.totalDuration}
                        actualTimeSpent={runner.reviewPending.actualTimeSpent}
                        streakCount={runner.streakCount}
                        usedFocusOverlay={isFocusActive}
                        sessionMode={runner.activeNode?.data?.sessionMode || 'focus'}
                        onComplete={handleReviewComplete}
                    />
                )}

                {/* Decision Popup */}
                <DecisionPopup
                    decision={runner.decisionPending}
                    onChoose={runner.makeDecision}
                />

                {/* Completion Celebration */}
                <CompletionCelebration
                    show={runner.showCelebration}
                    completedCount={runner.completedNodeIds.length}
                    totalXP={sessionEarnedXP}
                    flowBonus={flowBonus}
                    onDismiss={runner.dismissCelebration}
                />

                {/* Focus Overlay */}
                {isFocusActive && runner.activeNode && (
                    <FocusOverlay
                        activeNode={runner.activeNode}
                        timeRemaining={runner.timeRemaining}
                        totalDuration={(runner.activeNode.data?.duration || 1) * 60}
                        isRunning={runner.isRunning}
                        isPaused={runner.isPaused}
                        onPause={runner.pauseFlow}
                        onResume={runner.resumeFlow}
                        onSkip={runner.skipTask}
                        onExit={() => setIsFocusActive(false)}
                        audioVolume={ambientAudio.volume}
                        onVolumeChange={ambientAudio.setVolume}
                        isAudioPlaying={ambientAudio.isPlaying}
                    />
                )}
            </div>
        </div>
    )
}

export default FlowEditor
