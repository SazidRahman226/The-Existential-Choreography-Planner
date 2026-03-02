/**
 * scheduleValidation.js — Utility functions for scheduled/pinned node validation.
 *
 * All time values are stored as "HH:mm" strings (24-hour format).
 * These are pure functions with no React dependencies.
 */

/**
 * Parse a "HH:mm" time string into minutes since midnight.
 * Accepts both 24h ("14:30") and returns an integer (870).
 * Returns null if the input is invalid.
 */
export function parseScheduledTime(timeStr) {
    if (!timeStr || typeof timeStr !== 'string') return null
    const match = timeStr.match(/^(\d{1,2}):(\d{2})$/)
    if (!match) return null
    const hours = parseInt(match[1], 10)
    const minutes = parseInt(match[2], 10)
    if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null
    return hours * 60 + minutes
}

/**
 * Format minutes-since-midnight back to a display string.
 * Returns "10:00 AM" style string.
 */
export function formatScheduledTime(timeStr) {
    const mins = parseScheduledTime(timeStr)
    if (mins === null) return '--:--'
    const h24 = Math.floor(mins / 60)
    const m = mins % 60
    const period = h24 >= 12 ? 'PM' : 'AM'
    const h12 = h24 === 0 ? 12 : h24 > 12 ? h24 - 12 : h24
    return `${h12}:${m.toString().padStart(2, '0')} ${period}`
}

/**
 * Compute the scheduled end time string given a start time and duration.
 * @param {string} startTimeStr - "HH:mm" start time
 * @param {number} durationMinutes - duration in minutes
 * @returns {string|null} "HH:mm" end time, or null if invalid
 */
export function computeScheduledEnd(startTimeStr, durationMinutes) {
    const startMins = parseScheduledTime(startTimeStr)
    if (startMins === null || !durationMinutes) return null
    const endMins = startMins + durationMinutes
    // Clamp to 24h (1440 minutes)
    const clamped = endMins % 1440
    const h = Math.floor(clamped / 60)
    const m = clamped % 60
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
}

/**
 * Check if an edge from sourceNode to targetNode respects chronological order.
 * Only relevant when BOTH nodes are pinned.
 *
 * @param {object} sourceNode - React Flow node object
 * @param {object} targetNode - React Flow node object
 * @returns {{ valid: boolean, message: string|null }}
 */
export function isChronologicalEdge(sourceNode, targetNode) {
    const srcPinned = sourceNode?.data?.isPinned
    const tgtPinned = targetNode?.data?.isPinned
    if (!srcPinned || !tgtPinned) {
        return { valid: true, message: null }
    }

    const srcTime = parseScheduledTime(sourceNode.data.scheduledStart)
    const tgtTime = parseScheduledTime(targetNode.data.scheduledStart)
    if (srcTime === null || tgtTime === null) {
        return { valid: true, message: null }
    }

    // Source's scheduled end must be <= target's scheduled start
    const srcDuration = sourceNode.data.duration || 0
    const srcEnd = srcTime + srcDuration

    if (srcEnd > tgtTime) {
        const srcTitle = sourceNode.data.title || 'Source'
        const tgtTitle = targetNode.data.title || 'Target'
        const srcDisplay = formatScheduledTime(sourceNode.data.scheduledStart)
        const tgtDisplay = formatScheduledTime(targetNode.data.scheduledStart)
        return {
            valid: false,
            message: `Can't connect — "${srcTitle}" (${srcDisplay}) finishes after "${tgtTitle}" (${tgtDisplay}) starts`
        }
    }

    return { valid: true, message: null }
}

/**
 * Find overlapping pinned nodes in a list of nodes.
 *
 * @param {Array} nodes - All React Flow nodes
 * @returns {Array<{ nodeA: object, nodeB: object, overlapMinutes: number }>}
 */
export function findOverlaps(nodes) {
    const pinned = nodes
        .filter(n => n.data?.isPinned && n.data?.scheduledStart && (n.data?.nodeType || 'task') === 'task')
        .map(n => {
            const start = parseScheduledTime(n.data.scheduledStart)
            const end = start + (n.data.duration || 0)
            return { node: n, start, end }
        })
        .filter(p => p.start !== null)
        .sort((a, b) => a.start - b.start)

    const overlaps = []
    for (let i = 0; i < pinned.length - 1; i++) {
        for (let j = i + 1; j < pinned.length; j++) {
            if (pinned[i].end > pinned[j].start) {
                overlaps.push({
                    nodeA: pinned[i].node,
                    nodeB: pinned[j].node,
                    overlapMinutes: pinned[i].end - pinned[j].start
                })
            }
        }
    }
    return overlaps
}

/**
 * Convert a Date object to today's wall-clock Date for a given "HH:mm" time string.
 * Useful for the flow runner to compare against Date.now().
 *
 * @param {string} timeStr - "HH:mm" scheduled start
 * @returns {Date|null}
 */
export function scheduledTimeToDate(timeStr) {
    const mins = parseScheduledTime(timeStr)
    if (mins === null) return null
    const now = new Date()
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    d.setMinutes(mins)
    return d
}
