import { useState, useCallback, useRef, useEffect } from 'react'

/**
 * useFlowRunner — State machine for running a flow.
 *
 * States: idle → running → (paused ↔ running) → completed
 *
 * The runner walks the graph from the Start node, executing
 * each task node's timer, handling decision branches via popup,
 * showing a post-task review on timer completion,
 * and celebrating when the End node is reached.
 */

const RUNNER_STATES = {
    IDLE: 'idle',
    RUNNING: 'running',
    PAUSED: 'paused',
    COMPLETED: 'completed'
}

export default function useFlowRunner(nodes, edges, setNodes) {
    const [runnerState, setRunnerState] = useState(RUNNER_STATES.IDLE)
    const [activeNodeId, setActiveNodeId] = useState(null)
    const [timeRemaining, setTimeRemaining] = useState(0)
    const [completedNodeIds, setCompletedNodeIds] = useState([])
    const [decisionPending, setDecisionPending] = useState(null)
    const [showCelebration, setShowCelebration] = useState(false)
    const [progress, setProgress] = useState(0)

    // Post-Task Review state
    const [reviewPending, setReviewPending] = useState(null)
    // { nodeId, taskTitle, taskDifficulty, taskId, totalDuration, timeRemainingPercent, actualTimeSpent }

    // Streak tracking (resets per flow run, increments on completed/early, resets on late/failed/skipped)
    const [streakCount, setStreakCount] = useState(0)
    const [onTimeCount, setOnTimeCount] = useState(0)

    // Countdown buffer before task timer starts
    const [countdownSeconds, setCountdownSeconds] = useState(-1) // -1 = inactive, 5..0 = counting
    const [waitingForReflection, setWaitingForReflection] = useState(false)

    const timerRef = useRef(null)
    const countdownRef = useRef(null)
    const runnerStateRef = useRef(runnerState)
    const taskStartTimeRef = useRef(null) // when the current task started (ms)

    // Keep ref in sync
    useEffect(() => {
        runnerStateRef.current = runnerState
    }, [runnerState])

    // Count total task nodes for progress
    const totalTaskNodes = nodes.filter(n => (n.data?.nodeType || 'task') === 'task').length

    // Active node object (not just ID)
    const activeNode = activeNodeId ? nodes.find(n => n.id === activeNodeId) : null

    // -- Find Start node --
    const findStartNode = useCallback(() => {
        return nodes.find(n => n.data?.nodeType === 'start')
    }, [nodes])

    // -- Get outgoing edges from a node --
    const getOutgoingEdges = useCallback((nodeId) => {
        return edges.filter(e => e.source === nodeId)
    }, [edges])

    // -- Get node by ID --
    const getNode = useCallback((nodeId) => {
        return nodes.find(n => n.id === nodeId)
    }, [nodes])

    // -- Update progress --
    const updateProgress = useCallback((completedIds) => {
        if (totalTaskNodes === 0) {
            setProgress(100)
            return
        }
        setProgress(Math.round((completedIds.length / totalTaskNodes) * 100))
    }, [totalTaskNodes])

    // -- Mark a node as completed --
    const markNodeCompleted = useCallback((nodeId) => {
        setNodes(prev => prev.map(n =>
            n.id === nodeId && (n.data?.nodeType || 'task') === 'task'
                ? { ...n, data: { ...n.data, status: 'completed' } }
                : n
        ))
        setCompletedNodeIds(prev => {
            const updated = [...prev, nodeId]
            updateProgress(updated)
            return updated
        })
    }, [setNodes, updateProgress])

    // -- Mark a node as failed --
    const markNodeFailed = useCallback((nodeId) => {
        setNodes(prev => prev.map(n =>
            n.id === nodeId && (n.data?.nodeType || 'task') === 'task'
                ? { ...n, data: { ...n.data, status: 'failed' } }
                : n
        ))
    }, [setNodes])

    // -- Mark a node as in-progress --
    const markNodeActive = useCallback((nodeId) => {
        setNodes(prev => prev.map(n =>
            n.id === nodeId && (n.data?.nodeType || 'task') === 'task'
                ? { ...n, data: { ...n.data, status: 'in-progress' } }
                : n
        ))
    }, [setNodes])

    // -- Browser notification helper --
    const sendNotification = useCallback((title, body) => {
        if ('Notification' in window && Notification.permission === 'granted') {
            try {
                new Notification(title, { body, icon: '/vite.svg' })
            } catch (e) {
                // Fallback for environments that don't support Notification constructor
            }
        }
    }, [])

    // -- Advance to next node --
    const advanceToNode = useCallback((nodeId) => {
        const node = getNode(nodeId)
        if (!node) return

        const nodeType = node.data?.nodeType || 'task'

        // END NODE — flow is complete!
        if (nodeType === 'end') {
            setActiveNodeId(null)
            setRunnerState(RUNNER_STATES.COMPLETED)
            setShowCelebration(true)
            setProgress(100)
            return
        }

        // DECISION NODE — show popup
        if (nodeType === 'decision') {
            setActiveNodeId(nodeId)
            const outEdges = getOutgoingEdges(nodeId)
            const defaultLabels = ['Yes', 'No', 'Maybe']
            const choices = outEdges.map((e, idx) => {
                const targetNode = getNode(e.target)
                const targetName = targetNode?.data?.title || 'Next'
                return {
                    edgeId: e.id,
                    label: e.label || defaultLabels[idx] || `Option ${idx + 1}`,
                    targetId: e.target,
                    targetName
                }
            })
            setDecisionPending({
                nodeId,
                question: node.data?.title || 'Choose a path',
                description: node.data?.description || '',
                choices
            })
            return
        }

        // TASK NODE — activate the node but DON'T start the timer yet
        // The flow is: activate node → FlowEditor checks history → shows ReflectionCard
        // → user clicks Start → confirmTaskStart() → 5-4-3-2-1 countdown → timer begins
        setActiveNodeId(nodeId)
        markNodeActive(nodeId)
        setWaitingForReflection(true) // tells FlowEditor we're waiting

        // Notify user that task is coming up
        sendNotification('⚡ Up Next', `Preparing: ${node.data?.title || 'Task'}`)
    }, [getNode, getOutgoingEdges, markNodeActive, sendNotification])

    // -- Move to next node after current one finishes --
    const moveToNext = useCallback((fromNodeId) => {
        const outEdges = getOutgoingEdges(fromNodeId)

        if (outEdges.length === 0) {
            // Dead end — complete the flow
            setActiveNodeId(null)
            setRunnerState(RUNNER_STATES.COMPLETED)
            setShowCelebration(true)
            setProgress(100)
            return
        }

        // Take the first edge (for linear flows) or the only edge
        const nextNodeId = outEdges[0].target
        advanceToNode(nextNodeId)
    }, [getOutgoingEdges, advanceToNode])

    // -- Countdown tick (5→0 before task timer starts) --
    useEffect(() => {
        if (countdownSeconds <= 0) return

        countdownRef.current = setInterval(() => {
            setCountdownSeconds(prev => {
                if (prev <= 1) {
                    clearInterval(countdownRef.current)
                    // Countdown done — NOW start the actual task timer
                    const taskNode = nodes.find(n => n.id === activeNodeId)
                    const durationMinutes = taskNode?.data?.duration || 1
                    const durationSeconds = durationMinutes * 60
                    taskStartTimeRef.current = Date.now()
                    setTimeRemaining(durationSeconds)
                    setCountdownSeconds(0) // 0 = countdown done, timer active
                    sendNotification('⚡ Go!', `Starting: ${taskNode?.data?.title || 'Task'}`)
                    return 0
                }
                return prev - 1
            })
        }, 1000)

        return () => {
            if (countdownRef.current) clearInterval(countdownRef.current)
        }
    }, [countdownSeconds > 0 ? 'counting' : 'idle', activeNodeId, sendNotification])

    // -- Timer tick (only runs after countdown is done) --
    useEffect(() => {
        if (runnerState !== RUNNER_STATES.RUNNING || !activeNodeId || timeRemaining <= 0 || countdownSeconds !== 0) {
            return
        }

        timerRef.current = setInterval(() => {
            if (runnerStateRef.current !== RUNNER_STATES.RUNNING) return

            setTimeRemaining(prev => {
                if (prev <= 1) {
                    // Timer done! Show post-task review instead of auto-completing
                    clearInterval(timerRef.current)

                    const taskNode = nodes.find(n => n.id === activeNodeId)
                    const totalDurationSec = (taskNode?.data?.duration || 1) * 60
                    const actualTimeSpent = taskStartTimeRef.current
                        ? Math.round((Date.now() - taskStartTimeRef.current) / 1000)
                        : totalDurationSec

                    sendNotification('⏰ Time\'s Up!', `${taskNode?.data?.title || 'Task'} — time to review!`)

                    // Set review pending — the UI will show the PostTaskReview popup
                    setTimeout(() => {
                        setReviewPending({
                            nodeId: activeNodeId,
                            taskTitle: taskNode?.data?.title || 'Task',
                            taskDifficulty: taskNode?.data?.difficulty || 'medium',
                            taskId: taskNode?.data?.taskId || null,
                            totalDuration: totalDurationSec,
                            timeRemainingPercent: 0,  // timer ran out
                            actualTimeSpent
                        })
                        setRunnerState(RUNNER_STATES.PAUSED)
                    }, 200)

                    return 0
                }
                return prev - 1
            })
        }, 1000)

        return () => {
            if (timerRef.current) clearInterval(timerRef.current)
        }
    }, [runnerState, activeNodeId, timeRemaining > 0 ? 'ticking' : 'stopped', countdownSeconds, moveToNext, sendNotification])

    // ---- PUBLIC API ----

    // Start the flow
    const startFlow = useCallback(() => {
        const startNode = findStartNode()
        if (!startNode) {
            alert('No Start node found! Add one to run the flow.')
            return
        }

        // Reset all task nodes to pending
        setNodes(prev => prev.map(n =>
            (n.data?.nodeType || 'task') === 'task'
                ? { ...n, data: { ...n.data, status: 'pending' } }
                : n
        ))

        // Request notification permission on first run
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission()
        }

        setCompletedNodeIds([])
        setProgress(0)
        setShowCelebration(false)
        setStreakCount(0)
        setOnTimeCount(0)
        setReviewPending(null)
        setCountdownSeconds(-1)
        setWaitingForReflection(false)
        setRunnerState(RUNNER_STATES.RUNNING)

        // Move from Start to its first connected node
        moveToNext(startNode.id)
    }, [findStartNode, setNodes, moveToNext])

    // Pause
    const pauseFlow = useCallback(() => {
        setRunnerState(RUNNER_STATES.PAUSED)
        if (timerRef.current) clearInterval(timerRef.current)
    }, [])

    // Resume
    const resumeFlow = useCallback(() => {
        // Don't resume if there's a pending review
        if (reviewPending) return
        setRunnerState(RUNNER_STATES.RUNNING)
    }, [reviewPending])

    // Stop (reset to idle)
    const stopFlow = useCallback(() => {
        setRunnerState(RUNNER_STATES.IDLE)
        setActiveNodeId(null)
        setTimeRemaining(0)
        setCompletedNodeIds([])
        setDecisionPending(null)
        setShowCelebration(false)
        setProgress(0)
        setStreakCount(0)
        setOnTimeCount(0)
        setReviewPending(null)
        setCountdownSeconds(-1)
        setWaitingForReflection(false)
        if (timerRef.current) clearInterval(timerRef.current)
        if (countdownRef.current) clearInterval(countdownRef.current)

        // Reset all task nodes to pending
        setNodes(prev => prev.map(n =>
            (n.data?.nodeType || 'task') === 'task'
                ? { ...n, data: { ...n.data, status: 'pending' } }
                : n
        ))
    }, [setNodes])

    // Skip current task — triggers review with 'skipped' outcome data
    const skipTask = useCallback(() => {
        if (!activeNodeId) return
        if (timerRef.current) clearInterval(timerRef.current)

        const taskNode = nodes.find(n => n.id === activeNodeId)
        const totalDurationSec = (taskNode?.data?.duration || 1) * 60
        const actualTimeSpent = taskStartTimeRef.current
            ? Math.round((Date.now() - taskStartTimeRef.current) / 1000)
            : 0
        const timeRemainingPct = Math.round((timeRemaining / totalDurationSec) * 100)

        setReviewPending({
            nodeId: activeNodeId,
            taskTitle: taskNode?.data?.title || 'Task',
            taskDifficulty: taskNode?.data?.difficulty || 'medium',
            taskId: taskNode?.data?.taskId || null,
            totalDuration: totalDurationSec,
            timeRemainingPercent: timeRemainingPct,
            actualTimeSpent,
            skipped: true
        })
        setRunnerState(RUNNER_STATES.PAUSED)
    }, [activeNodeId, nodes, timeRemaining])

    // Resolve review — called from FlowEditor after PostTaskReview completes
    const resolveReview = useCallback((outcome, xpResult) => {
        if (!reviewPending) return

        const nodeId = reviewPending.nodeId

        // Update streak
        if (outcome === 'completed') {
            setStreakCount(prev => prev + 1)
            setOnTimeCount(prev => prev + 1)
            markNodeCompleted(nodeId)
        } else {
            setStreakCount(0)
            if (outcome === 'failed' || outcome === 'skipped') {
                markNodeFailed(nodeId)
            } else {
                // completed_late still counts as completed
                markNodeCompleted(nodeId)
            }
        }

        setReviewPending(null)
        setRunnerState(RUNNER_STATES.RUNNING)

        // Advance to next node
        setTimeout(() => moveToNext(nodeId), 300)
    }, [reviewPending, markNodeCompleted, markNodeFailed, moveToNext])

    // Handle decision choice
    const makeDecision = useCallback((targetNodeId) => {
        setDecisionPending(null)
        advanceToNode(targetNodeId)
    }, [advanceToNode])

    // Confirm task start (called by FlowEditor after reflection is dismissed)
    // This starts the 5-second countdown
    const confirmTaskStart = useCallback(() => {
        setWaitingForReflection(false)
        setCountdownSeconds(5)
    }, [])

    // Dismiss celebration
    const dismissCelebration = useCallback(() => {
        setShowCelebration(false)
    }, [])

    return {
        // State
        runnerState,
        activeNodeId,
        activeNode,
        timeRemaining,
        progress,
        decisionPending,
        showCelebration,
        completedNodeIds,
        isRunning: runnerState === RUNNER_STATES.RUNNING,
        isPaused: runnerState === RUNNER_STATES.PAUSED,
        isIdle: runnerState === RUNNER_STATES.IDLE,
        isCompleted: runnerState === RUNNER_STATES.COMPLETED,

        // Review state
        reviewPending,
        onTimeCount,
        totalTaskNodes,
        streakCount,

        // Countdown / reflection state
        countdownSeconds,
        waitingForReflection,

        // Actions
        startFlow,
        pauseFlow,
        resumeFlow,
        stopFlow,
        skipTask,
        makeDecision,
        dismissCelebration,
        resolveReview,
        confirmTaskStart
    }
}

export { RUNNER_STATES }

