import { memo } from 'react'

/**
 * ReflectionCard — shown before a task starts if it has past history.
 * Displays last 2 history entries with outcomes and notes.
 * User must click "Start Task" to begin the 5-second countdown.
 */
const ReflectionCard = ({ history, bestTime, suggestedDuration, taskTitle, onStart, onEdit }) => {
    if (!history || history.length === 0) return null

    const successCount = history.filter(h => h.outcome === 'completed').length
    const totalAttempts = history.length
    const last2 = history.slice(0, 2)

    // Format seconds to readable time
    const formatTime = (seconds) => {
        if (!seconds) return '—'
        const m = Math.floor(seconds / 60)
        const s = seconds % 60
        return m > 0 ? `${m}m${s > 0 ? ` ${s}s` : ''}` : `${s}s`
    }

    // Outcome styling
    const outcomeStyles = {
        completed: { emoji: '✅', label: 'Completed', className: 'outcome-completed' },
        completed_late: { emoji: '⏰', label: 'Late', className: 'outcome-late' },
        failed: { emoji: '❌', label: 'Failed', className: 'outcome-failed' },
        skipped: { emoji: '⏭️', label: 'Skipped', className: 'outcome-skipped' }
    }

    return (
        <div className="reflection-card-overlay visible">
            <div className="reflection-card" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="reflection-header">
                    <span className="reflection-emoji">📋</span>
                    <h3 className="reflection-headline">{taskTitle}</h3>
                    <p className="reflection-subline">
                        {successCount}/{totalAttempts} past attempts successful
                    </p>
                </div>

                {/* Last 2 history entries */}
                <div className="reflection-history-list">
                    {last2.map((entry, i) => {
                        const style = outcomeStyles[entry.outcome] || outcomeStyles.completed
                        const dateStr = new Date(entry.date).toLocaleDateString('en-US', {
                            month: 'short', day: 'numeric'
                        })
                        return (
                            <div key={i} className={`reflection-history-entry ${style.className}`}>
                                <div className="reflection-entry-top">
                                    <span className="reflection-entry-emoji">{style.emoji}</span>
                                    <span className="reflection-entry-label">{style.label}</span>
                                    <span className="reflection-entry-date">{dateStr}</span>
                                    <span className="reflection-entry-time">
                                        {formatTime(entry.actualTime)}
                                    </span>
                                </div>
                                {entry.note && (
                                    <p className="reflection-entry-note">
                                        💬 "{entry.note}"
                                    </p>
                                )}
                                {entry.reason && (
                                    <p className="reflection-entry-note">
                                        📝 Reason: {entry.reason}
                                    </p>
                                )}
                                {entry.earnedXP > 0 && (
                                    <span className="reflection-entry-xp">+{entry.earnedXP} XP</span>
                                )}
                            </div>
                        )
                    })}
                </div>

                {/* Best time and suggested duration */}
                <div className="reflection-meta-row">
                    {bestTime && (
                        <div className="reflection-meta-item">
                            🏆 Best: <strong>{formatTime(bestTime)}</strong>
                        </div>
                    )}
                    {suggestedDuration > 0 && (
                        <div className="reflection-meta-item reflection-suggested">
                            💡 Suggested: <strong>{suggestedDuration} min</strong>
                        </div>
                    )}
                </div>

                {/* Success rate bar */}
                <div className="reflection-progress-bar">
                    <div
                        className="reflection-progress-fill"
                        style={{ width: `${totalAttempts > 0 ? (successCount / totalAttempts) * 100 : 0}%` }}
                    />
                </div>

                {/* Action buttons */}
                <p className="reflection-hint">Timer starts when you press Start</p>
                <div className="reflection-actions">
                    <button className="reflection-start-btn" onClick={onStart}>
                        Start Task 🚀
                    </button>
                    {onEdit && (
                        <button className="reflection-edit-btn" onClick={onEdit}>
                            Edit Node ✏️
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}

export default memo(ReflectionCard)
