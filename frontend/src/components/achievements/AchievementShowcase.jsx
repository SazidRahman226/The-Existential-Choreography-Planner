import { useState, useEffect, memo } from 'react'
import api from '../../services/api'

/**
 * AchievementShowcase — Displays all achievements grouped by category
 * with progress bars and unlock status.
 */
const AchievementShowcase = () => {
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState('all') // category key or 'all'

    useEffect(() => {
        const fetchAchievements = async () => {
            try {
                const res = await api.get('/auth/achievements')
                setData(res.data)
            } catch (err) {
                console.error('Failed to fetch achievements:', err)
            } finally {
                setLoading(false)
            }
        }
        fetchAchievements()
    }, [])

    if (loading) {
        return (
            <div className="achievements-loading">
                <div className="achievements-spinner">🏅</div>
                <p>Loading achievements...</p>
            </div>
        )
    }

    if (!data) return null

    const { achievements, categories, totalUnlocked, totalAchievements } = data

    const filtered = filter === 'all'
        ? achievements
        : achievements.filter(a => a.category === filter)

    return (
        <div className="achievements-showcase">
            {/* Header */}
            <div className="achievements-header">
                <div className="achievements-title">
                    <h3>🏅 Badges & Achievements</h3>
                    <span className="achievements-count">
                        {totalUnlocked} / {totalAchievements} Unlocked
                    </span>
                </div>
                {/* Overall progress */}
                <div className="achievements-overall-bar">
                    <div
                        className="achievements-overall-fill"
                        style={{ width: `${Math.round((totalUnlocked / totalAchievements) * 100)}%` }}
                    />
                </div>
            </div>

            {/* Category Filters */}
            <div className="achievements-filters">
                <button
                    className={`ach-filter-btn ${filter === 'all' ? 'active' : ''}`}
                    onClick={() => setFilter('all')}
                >
                    All
                </button>
                {Object.entries(categories).map(([key, cat]) => (
                    <button
                        key={key}
                        className={`ach-filter-btn ${filter === key ? 'active' : ''}`}
                        onClick={() => setFilter(key)}
                    >
                        {cat.emoji} {cat.label}
                    </button>
                ))}
            </div>

            {/* Achievement Grid */}
            <div className="achievements-grid">
                {filtered.map(ach => (
                    <div
                        key={ach.key}
                        className={`ach-card ${ach.unlocked ? 'unlocked' : 'locked'}`}
                    >
                        <div className="ach-card-emoji">
                            {ach.emoji}
                        </div>
                        <div className="ach-card-info">
                            <span className="ach-card-name">{ach.name}</span>
                            <span className="ach-card-desc">{ach.description}</span>
                            {ach.unlocked ? (
                                <span className="ach-card-unlocked-date">
                                    ✅ {new Date(ach.unlockedAt).toLocaleDateString()}
                                </span>
                            ) : (
                                <div className="ach-card-progress">
                                    <div className="ach-progress-bar">
                                        <div
                                            className="ach-progress-fill"
                                            style={{ width: `${ach.progress?.percent || 0}%` }}
                                        />
                                    </div>
                                    <span className="ach-progress-text">
                                        {ach.progress?.current || 0} / {ach.progress?.target || '?'}
                                    </span>
                                </div>
                            )}
                        </div>
                        <div className="ach-card-xp">
                            +{ach.xpBonus} XP
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

export default memo(AchievementShowcase)
