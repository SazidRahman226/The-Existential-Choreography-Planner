import { memo } from 'react'

/**
 * ScheduleTimeline — Collapsible sidebar showing tasks mapped to wall-clock times.
 *
 * Each task shows planned start/end times, duration, live status, and deviation.
 * Pinned tasks display a 📌 icon and their fixed scheduled times.
 */

const formatTime = (date) => {
    if (!date) return '--:--'
    const d = new Date(date)
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })
}

const formatDuration = (minutes) => {
    if (minutes < 60) return `${minutes}m`
    const h = Math.floor(minutes / 60)
    const m = minutes % 60
    return m > 0 ? `${h}h ${m}m` : `${h}h`
}

const getDeviation = (item) => {
    if (!item.actualEnd || !item.plannedEnd) return null
    const diffMs = new Date(item.actualEnd) - new Date(item.plannedEnd)
    const diffMin = Math.round(diffMs / 60000)
    if (Math.abs(diffMin) < 1) return null
    return diffMin > 0
        ? { text: `+${diffMin}m late`, className: 'behind' }
        : { text: `${diffMin}m early`, className: 'ahead' }
}

const getGapMinutes = (prevEnd, nextStart) => {
    if (!prevEnd || !nextStart) return 0
    const diff = new Date(nextStart) - new Date(prevEnd)
    return Math.round(diff / 60000)
}

const STATUS_ICONS = {
    pending: '⏳',
    active: '▶️',
    completed: '✅',
    failed: '❌',
    skipped: '⏭️'
}

const ScheduleTimeline = ({ schedule, isOpen, onToggle }) => {
    if (!schedule || schedule.length === 0) return null

    const completedCount = schedule.filter(i => i.status === 'completed').length
    const totalCount = schedule.length

    return (
        <div className={`schedule-timeline ${isOpen ? 'open' : 'collapsed'}`}>
            <button className="schedule-toggle" onClick={onToggle} title={isOpen ? 'Collapse schedule' : 'Show schedule'}>
                <span className="schedule-toggle-icon">📅</span>
                {!isOpen && (
                    <span className="schedule-toggle-count">{completedCount}/{totalCount}</span>
                )}
            </button>

            {isOpen && (
                <div className="schedule-body">
                    <div className="schedule-header">
                        <span className="schedule-title">Schedule</span>
                        <span className="schedule-progress">{completedCount}/{totalCount} done</span>
                    </div>

                    <div className="schedule-items">
                        {schedule.map((item, idx) => {
                            const deviation = getDeviation(item)
                            const prevItem = idx > 0 ? schedule[idx - 1] : null
                            const gapMinutes = prevItem ? getGapMinutes(prevItem.plannedEnd, item.plannedStart) : 0

                            return (
                                <div key={item.nodeId}>
                                    {/* Gap indicator between tasks */}
                                    {gapMinutes > 1 && (
                                        <div className="schedule-item-gap">
                                            ☕ {formatDuration(gapMinutes)} break
                                        </div>
                                    )}
                                    <div className={`schedule-item ${item.status}`}>
                                        <div className="schedule-item-status">
                                            {STATUS_ICONS[item.status] || '⏳'}
                                        </div>
                                        <div className="schedule-item-content">
                                            <div className="schedule-item-title">
                                                {item.title}
                                                {item.isPinned && <span className="schedule-item-pin">📌</span>}
                                            </div>
                                            <div className="schedule-item-time">
                                                <span>{formatTime(item.plannedStart)}</span>
                                                <span className="schedule-item-dash">—</span>
                                                <span>{formatTime(item.plannedEnd)}</span>
                                                <span className="schedule-item-duration">({formatDuration(item.duration)})</span>
                                            </div>
                                            {deviation && (
                                                <div className={`schedule-item-deviation ${deviation.className}`}>
                                                    {deviation.text}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}
        </div>
    )
}

export default memo(ScheduleTimeline)
