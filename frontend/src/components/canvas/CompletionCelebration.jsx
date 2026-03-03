import { memo, useEffect, useState } from 'react'

const CELEBRATION_MESSAGES = [
    { emoji: '🎉', title: 'Flow Complete!', subtitle: 'You crushed it!' },
    { emoji: '🏆', title: 'Victory!', subtitle: 'Every task conquered!' },
    { emoji: '🌟', title: 'Brilliant!', subtitle: 'Another flow mastered!' },
    { emoji: '🚀', title: 'Launched!', subtitle: 'All tasks are done!' },
    { emoji: '💪', title: 'Beast Mode!', subtitle: 'Nothing can stop you!' },
]

const formatDuration = (minutes) => {
    if (minutes < 60) return `${minutes}m`
    const h = Math.floor(minutes / 60)
    const m = minutes % 60
    return m > 0 ? `${h}h ${m}m` : `${h}h`
}

const formatTime = (date) => {
    if (!date) return '--:--'
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })
}

const CompletionCelebration = ({ show, completedCount, totalXP, flowBonus, schedule, streakCount, trend, onDismiss }) => {
    const [visible, setVisible] = useState(false)
    const [message] = useState(() =>
        CELEBRATION_MESSAGES[Math.floor(Math.random() * CELEBRATION_MESSAGES.length)]
    )

    useEffect(() => {
        if (show) {
            requestAnimationFrame(() => setVisible(true))
        } else {
            setVisible(false)
        }
    }, [show])

    if (!show) return null

    const displayXP = (totalXP || 0) + (flowBonus?.bonusXP || 0)

    // Derive stats from schedule
    const stats = schedule && schedule.length > 0 ? (() => {
        const completed = schedule.filter(i => i.status === 'completed').length
        const failed = schedule.filter(i => i.status === 'failed').length
        const skipped = schedule.filter(i => i.status === 'skipped').length
        const totalPlannedMin = schedule.reduce((sum, i) => sum + i.duration, 0)

        // Calculate actual total from tasks that have both actualStart and actualEnd
        let totalActualMin = 0
        schedule.forEach(item => {
            if (item.actualStart && item.actualEnd) {
                totalActualMin += Math.round((new Date(item.actualEnd) - new Date(item.actualStart)) / 60000)
            }
        })

        const timeDiffMin = totalActualMin - totalPlannedMin

        return { completed, failed, skipped, totalPlannedMin, totalActualMin, timeDiffMin }
    })() : null

    return (
        <div className={`celebration-overlay ${visible ? 'visible' : ''}`} onClick={onDismiss}>
            <div className="celebration-content report-card" onClick={(e) => e.stopPropagation()}>
                <div className="celebration-confetti">
                    {Array.from({ length: 20 }).map((_, i) => (
                        <div
                            key={i}
                            className="confetti-piece"
                            style={{
                                '--delay': `${Math.random() * 2}s`,
                                '--x': `${Math.random() * 100 - 50}vw`,
                                '--rot': `${Math.random() * 720 - 360}deg`,
                                '--color': ['#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff', '#ff6bd6'][i % 5]
                            }}
                        />
                    ))}
                </div>

                <div className="celebration-emoji">{message.emoji}</div>
                <h2 className="celebration-title">{message.title}</h2>
                <p className="celebration-subtitle">{message.subtitle}</p>

                {flowBonus?.bonusLabel && (
                    <div className="celebration-flow-bonus">
                        <span className="flow-bonus-badge">{flowBonus.bonusLabel}</span>
                        <span className="flow-bonus-xp">+{flowBonus.bonusXP} XP</span>
                    </div>
                )}

                {/* Stats Grid */}
                <div className="report-stats-grid">
                    <div className="report-stat-card completed">
                        <span className="report-stat-value">{stats ? stats.completed : completedCount}</span>
                        <span className="report-stat-label">✅ Completed</span>
                    </div>
                    {stats && stats.failed > 0 && (
                        <div className="report-stat-card failed">
                            <span className="report-stat-value">{stats.failed}</span>
                            <span className="report-stat-label">❌ Failed</span>
                        </div>
                    )}
                    {stats && stats.skipped > 0 && (
                        <div className="report-stat-card skipped">
                            <span className="report-stat-value">{stats.skipped}</span>
                            <span className="report-stat-label">⏭️ Skipped</span>
                        </div>
                    )}
                    <div className="report-stat-card xp">
                        <span className="report-stat-value">⭐ {displayXP}</span>
                        <span className="report-stat-label">XP Earned</span>
                    </div>
                    {streakCount >= 2 && (
                        <div className="report-stat-card streak">
                            <span className="report-stat-value">🔥 {streakCount}</span>
                            <span className="report-stat-label">Best Streak</span>
                        </div>
                    )}
                </div>

                {/* Time Comparison */}
                {stats && stats.totalActualMin > 0 && (
                    <div className="report-time-comparison">
                        <div className="report-time-row">
                            <span className="report-time-label">⏱ Planned</span>
                            <span className="report-time-value">{formatDuration(stats.totalPlannedMin)}</span>
                        </div>
                        <div className="report-time-row">
                            <span className="report-time-label">⏱ Actual</span>
                            <span className="report-time-value">{formatDuration(stats.totalActualMin)}</span>
                        </div>
                        <div className={`report-time-diff ${stats.timeDiffMin > 0 ? 'behind' : 'ahead'}`}>
                            {stats.timeDiffMin > 0
                                ? `+${stats.timeDiffMin}m over`
                                : stats.timeDiffMin < 0
                                    ? `${Math.abs(stats.timeDiffMin)}m ahead 🚀`
                                    : 'Right on time ✨'
                            }
                        </div>
                    </div>
                )}

                {/* Performance Trend */}
                {trend && (
                    <div className="report-trend">
                        {trend.percent > 0
                            ? `📈 ${trend.percent}% faster than estimated — nice pacing!`
                            : trend.percent < 0
                                ? `📉 ${Math.abs(trend.percent)}% slower than estimated — room to improve!`
                                : '✨ Right on schedule — perfect!'
                        }
                    </div>
                )}

                {/* Individual Task Results */}
                {schedule && schedule.length > 0 && (
                    <div className="report-task-list">
                        {schedule.map(item => (
                            <div key={item.nodeId} className={`report-task-item ${item.status}`}>
                                <span className="report-task-icon">
                                    {item.status === 'completed' ? '✅' :
                                        item.status === 'failed' ? '❌' :
                                            item.status === 'skipped' ? '⏭️' : '⏳'}
                                </span>
                                <span className="report-task-name">{item.title}</span>
                                <span className="report-task-time">
                                    {formatTime(item.actualStart)} — {formatTime(item.actualEnd)}
                                </span>
                            </div>
                        ))}
                    </div>
                )}

                <button className="celebration-dismiss-btn" onClick={onDismiss}>
                    Continue 🚀
                </button>
            </div>
        </div>
    )
}

export default memo(CompletionCelebration)
