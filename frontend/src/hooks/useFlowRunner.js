import { useState, useCallback, useRef, useEffect } from 'react'
import { scheduledTimeToDate, parseScheduledTime } from '../utils/scheduleValidation'

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

    // Streak feedback message: { text, type: 'break' | 'milestone' } or null
    const [streakMessage, setStreakMessage] = useState(null)
    const streakMessageTimerRef = useRef(null)

    // Schedule timeline: [{ nodeId, title, duration, plannedStart, plannedEnd, status, actualStart, actualEnd }]
    const [schedule, setSchedule] = useState([])

    // Countdown buffer before task timer starts
    const [countdownSeconds, setCountdownSeconds] = useState(-1) // -1 = inactive, 5..0 = counting
    const [waitingForReflection, setWaitingForReflection] = useState(false)

    // Waiting state for pinned nodes (waiting until scheduled time)
    const [isWaiting, setIsWaiting] = useState(false)
    const [waitingUntil, setWaitingUntil] = useState(null) // Date object
    const [waitingCountdown, setWaitingCountdown] = useState('') // display string

    const timerRef = useRef(null)
    const countdownRef = useRef(null)
    const waitingTimerRef = useRef(null)
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

    // -- Update a schedule item --
    const updateScheduleItem = useCallback((nodeId, updates) => {
        setSchedule(prev => prev.map(item =>
            item.nodeId === nodeId ? { ...item, ...updates } : item
        ))
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

        // Reset countdown/timer state from previous task to prevent spillover
        setCountdownSeconds(-1) // -1 = inactive (NOT 0 which means "countdown done")
        setTimeRemaining(0)
        setIsWaiting(false)
        setWaitingUntil(null)
        if (timerRef.current) clearInterval(timerRef.current)
        if (countdownRef.current) clearInterval(countdownRef.current)
        if (waitingTimerRef.current) clearInterval(waitingTimerRef.current)

        setActiveNodeId(nodeId)
        markNodeActive(nodeId)

        // Check if this is a pinned node that needs to wait
        if (node.data?.isPinned && node.data?.scheduledStart) {
            const targetTime = scheduledTimeToDate(node.data.scheduledStart)
            if (targetTime && targetTime.getTime() > Date.now()) {
                // Future time — enter waiting state
                setIsWaiting(true)
                setWaitingUntil(targetTime)
                updateScheduleItem(nodeId, { status: 'active' })
                sendNotification('⏳ Waiting', `"${node.data?.title || 'Task'}" scheduled at ${node.data.scheduledStart}`)
                return
            } else if (targetTime) {
                // Past time — start immediately, mark as late
                sendNotification('⚠️ Running Late', `"${node.data?.title || 'Task'}" was scheduled for ${node.data.scheduledStart}`)
            }
        }

        setWaitingForReflection(true) // tells FlowEditor we're waiting

        // Update schedule: mark this task as active
        updateScheduleItem(nodeId, { status: 'active', actualStart: new Date() })

        // Notify user that task is coming up
        sendNotification('⚡ Up Next', `Preparing: ${node.data?.title || 'Task'}`)
    }, [getNode, getOutgoingEdges, markNodeActive, sendNotification, updateScheduleItem])

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

    // -- Waiting timer for pinned nodes --
    useEffect(() => {
        if (!isWaiting || !waitingUntil) return

        const tick = () => {
            const diff = waitingUntil.getTime() - Date.now()
            if (diff <= 0) {
                // Time has arrived — transition to reflection/countdown
                clearInterval(waitingTimerRef.current)
                setIsWaiting(false)
                setWaitingUntil(null)
                setWaitingCountdown('')
                setWaitingForReflection(true)
                updateScheduleItem(activeNodeId, { actualStart: new Date() })
                sendNotification('⚡ Time!', `Starting: ${nodes.find(n => n.id === activeNodeId)?.data?.title || 'Task'}`)
                return
            }
            const totalSec = Math.ceil(diff / 1000)
            const min = Math.floor(totalSec / 60)
            const sec = totalSec % 60
            setWaitingCountdown(`${min}:${sec.toString().padStart(2, '0')}`)
        }

        tick() // immediately
        waitingTimerRef.current = setInterval(tick, 1000)

        return () => {
            if (waitingTimerRef.current) clearInterval(waitingTimerRef.current)
        }
    }, [isWaiting, waitingUntil, activeNodeId, sendNotification, updateScheduleItem])

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

    // Build schedule by walking the graph from Start node --
    // Supports pinned nodes (fixed times) mixed with flexible nodes (stacked in gaps)
    const buildSchedule = useCallback(() => {
        const startNode = findStartNode()
        if (!startNode) return []

        // Walk graph to collect task nodes in traversal order
        const taskNodes = []
        const visited = new Set()
        let currentId = startNode.id
        while (currentId && !visited.has(currentId)) {
            visited.add(currentId)
            const node = getNode(currentId)
            if (!node) break
            const nodeType = node.data?.nodeType || 'task'
            if (nodeType === 'task') taskNodes.push(node)
            if (nodeType === 'end') break
            const outEdges = getOutgoingEdges(currentId)
            currentId = outEdges.length > 0 ? outEdges[0].target : null
        }

        if (taskNodes.length === 0) return []

        // Check if any nodes are pinned
        const hasPinned = taskNodes.some(n => n.data?.isPinned && n.data?.scheduledStart)

        if (!hasPinned) {
            // No pinned nodes — current behavior: stack from now
            let cursor = new Date()
            return taskNodes.map(node => {
                const durationMin = node.data?.duration || 1
                const plannedStart = new Date(cursor)
                const plannedEnd = new Date(cursor.getTime() + durationMin * 60 * 1000)
                const item = {
                    nodeId: node.id,
                    title: node.data?.title || 'Task',
                    duration: durationMin,
                    plannedStart,
                    plannedEnd,
                    status: 'pending',
                    actualStart: null,
                    actualEnd: null,
                    isPinned: false
                }
                cursor = new Date(plannedEnd.getTime() + 60 * 1000)
                return item
            })
        }

        // Mixed pinned + flexible: build smart schedule
        const items = []
        let cursor = new Date()

        for (const node of taskNodes) {
            const durationMin = node.data?.duration || 1
            const pinned = node.data?.isPinned && node.data?.scheduledStart

            if (pinned) {
                const targetDate = scheduledTimeToDate(node.data.scheduledStart)
                if (targetDate && targetDate.getTime() > cursor.getTime()) {
                    cursor = targetDate
                }
                const plannedStart = new Date(cursor)
                const plannedEnd = new Date(cursor.getTime() + durationMin * 60 * 1000)
                items.push({
                    nodeId: node.id,
                    title: node.data?.title || 'Task',
                    duration: durationMin,
                    plannedStart,
                    plannedEnd,
                    status: 'pending',
                    actualStart: null,
                    actualEnd: null,
                    isPinned: true
                })
                cursor = new Date(plannedEnd.getTime() + 60 * 1000)
            } else {
                // Flexible: runs immediately when reached
                const plannedStart = new Date(cursor)
                const plannedEnd = new Date(cursor.getTime() + durationMin * 60 * 1000)
                items.push({
                    nodeId: node.id,
                    title: node.data?.title || 'Task',
                    duration: durationMin,
                    plannedStart,
                    plannedEnd,
                    status: 'pending',
                    actualStart: null,
                    actualEnd: null,
                    isPinned: false
                })
                cursor = new Date(plannedEnd.getTime() + 60 * 1000)
            }
        }

        return items
    }, [findStartNode, getNode, getOutgoingEdges])

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

        // Build schedule timeline
        setSchedule(buildSchedule())

        setCompletedNodeIds([])
        setProgress(0)
        setShowCelebration(false)
        setStreakCount(0)
        setOnTimeCount(0)
        setReviewPending(null)
        setStreakMessage(null)
        if (streakMessageTimerRef.current) clearTimeout(streakMessageTimerRef.current)
        setCountdownSeconds(-1)
        setWaitingForReflection(false)
        setIsWaiting(false)
        setWaitingUntil(null)
        setWaitingCountdown('')
        if (waitingTimerRef.current) clearInterval(waitingTimerRef.current)
        setRunnerState(RUNNER_STATES.RUNNING)

        // Move from Start to its first connected node
        moveToNext(startNode.id)
    }, [findStartNode, setNodes, moveToNext, buildSchedule])

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
        setIsWaiting(false)
        setWaitingUntil(null)
        setWaitingCountdown('')
        if (timerRef.current) clearInterval(timerRef.current)
        if (countdownRef.current) clearInterval(countdownRef.current)
        if (waitingTimerRef.current) clearInterval(waitingTimerRef.current)

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

    // Complete task early — user finished before timer ran out, award full XP
    const completeTaskEarly = useCallback(() => {
        if (!activeNodeId) return
        if (timerRef.current) clearInterval(timerRef.current)

        const taskNode = nodes.find(n => n.id === activeNodeId)
        const totalDurationSec = (taskNode?.data?.duration || 1) * 60
        const actualTimeSpent = taskStartTimeRef.current
            ? Math.round((Date.now() - taskStartTimeRef.current) / 1000)
            : 0
        const timeRemainingPct = Math.round((timeRemaining / totalDurationSec) * 100)

        sendNotification('✅ Done!', `${taskNode?.data?.title || 'Task'} — completed early! 🎉`)

        setReviewPending({
            nodeId: activeNodeId,
            taskTitle: taskNode?.data?.title || 'Task',
            taskDifficulty: taskNode?.data?.difficulty || 'medium',
            taskId: taskNode?.data?.taskId || null,
            totalDuration: totalDurationSec,
            timeRemainingPercent: timeRemainingPct,
            actualTimeSpent,
            earlyComplete: true
        })
        setRunnerState(RUNNER_STATES.PAUSED)
    }, [activeNodeId, nodes, timeRemaining, sendNotification])

    // Helper: show a streak message that auto-clears after 3s
    const showStreakMessage = useCallback((text, type) => {
        if (streakMessageTimerRef.current) clearTimeout(streakMessageTimerRef.current)
        setStreakMessage({ text, type })
        streakMessageTimerRef.current = setTimeout(() => {
            setStreakMessage(null)
        }, 3000)
    }, [])

    // Streak thresholds (mirrored from backend gamification.js)
    const STREAK_MILESTONES = [
        { count: 10, badge: 'GODLIKE 💀🔥' },
        { count: 5, badge: 'On Fire 🔥🔥🔥' },
        { count: 3, badge: 'Unstoppable 🔥🔥' },
        { count: 2, badge: 'Double Kill 🔥' }
    ]

    // Resolve review — called from FlowEditor after PostTaskReview completes
    const resolveReview = useCallback((outcome, xpResult) => {
        if (!reviewPending) return

        const nodeId = reviewPending.nodeId

        // Map outcome to schedule status
        const scheduleStatus =
            outcome === 'completed' ? 'completed' :
                outcome === 'completed_late' ? 'completed' :
                    outcome === 'skipped' ? 'skipped' : 'failed'

        // Update schedule timeline
        updateScheduleItem(nodeId, { status: scheduleStatus, actualEnd: new Date() })

        // Update streak
        if (outcome === 'completed') {
            setStreakCount(prev => {
                const newStreak = prev + 1
                // Check if we crossed a milestone threshold
                for (const m of STREAK_MILESTONES) {
                    if (newStreak === m.count) {
                        showStreakMessage(m.badge, 'milestone')
                        break
                    }
                }
                return newStreak
            })
            setOnTimeCount(prev => prev + 1)
            markNodeCompleted(nodeId)
        } else {
            setStreakCount(prev => {
                if (prev >= 2) {
                    showStreakMessage('Streak lost 💔 — Start fresh!', 'break')
                }
                return 0
            })
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
    }, [reviewPending, markNodeCompleted, markNodeFailed, moveToNext, showStreakMessage, updateScheduleItem])

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

    // Start Now — override for pinned nodes that are in waiting state
    const startNow = useCallback(() => {
        if (!isWaiting) return
        if (waitingTimerRef.current) clearInterval(waitingTimerRef.current)
        setIsWaiting(false)
        setWaitingUntil(null)
        setWaitingCountdown('')
        setWaitingForReflection(true)
        updateScheduleItem(activeNodeId, { actualStart: new Date() })
        sendNotification('▶ Starting Now', `Overriding schedule for: ${nodes.find(n => n.id === activeNodeId)?.data?.title || 'Task'}`)
    }, [isWaiting, activeNodeId, updateScheduleItem, sendNotification, nodes])

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
        streakMessage,
        totalTaskNodes,
        streakCount,

        // Schedule timeline
        schedule,

        // Countdown / reflection state
        countdownSeconds,
        waitingForReflection,

        // Waiting state for pinned nodes
        isWaiting,
        waitingUntil,
        waitingCountdown,

        // Actions
        startFlow,
        pauseFlow,
        resumeFlow,
        stopFlow,
        skipTask,
        completeTaskEarly,
        makeDecision,
        dismissCelebration,
        resolveReview,
        confirmTaskStart,
        startNow
    }
}

export { RUNNER_STATES }

