import { useState, useEffect } from 'react'
import api from '../../services/api'

const StatsBar = () => {
    const [stats, setStats] = useState(null)
    const [loading, setLoading] = useState(true)

    const fetchStats = async () => {
        try {
            const res = await api.get('/auth/stats')
            setStats(res.data)
        } catch (err) {
            console.error('Failed to fetch stats:', err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchStats()
        // Poll every 60s to update energy regen
        const interval = setInterval(fetchStats, 60000)
        return () => clearInterval(interval)
    }, [])

    if (loading || !stats) {
        return (
            <div className="stats-bar stats-bar-loading">
                <div className="stat-skeleton" />
                <div className="stat-skeleton" />
                <div className="stat-skeleton" />
                <div className="stat-skeleton" />
            </div>
        )
    }

    return (
        <div className="stats-bar">
            {/* Level & Title */}
            <div className="stat-card stat-level">
                <div className="stat-icon">{stats.title?.emoji || '🌱'}</div>
                <div className="stat-content">
                    <span className="stat-label">Level {stats.level}</span>
                    <span className="stat-value">{stats.title?.label || 'Seedling'}</span>
                </div>
            </div>

            {/* XP Progress */}
            <div className="stat-card stat-xp">
                <div className="stat-icon">✨</div>
                <div className="stat-content">
                    <span className="stat-label">{stats.totalXP?.toLocaleString()} XP</span>
                    <div className="xp-bar-wrapper">
                        <div
                            className="xp-bar-fill"
                            style={{ width: `${stats.xpProgress?.percent || 0}%` }}
                        />
                    </div>
                    <span className="stat-sublabel">
                        {stats.xpProgress?.current} / {stats.xpProgress?.needed} to next level
                    </span>
                </div>
            </div>

            {/* Energy */}
            <div className={`stat-card stat-energy ${stats.energy < 20 ? 'low' : ''}`}>
                <div className="stat-icon">⚡</div>
                <div className="stat-content">
                    <span className="stat-label">Energy</span>
                    <div className="energy-bar-wrapper">
                        <div
                            className="energy-bar-fill"
                            style={{ width: `${stats.energy}%` }}
                        />
                        <span className="energy-text">{stats.energy} / {stats.maxEnergy}</span>
                    </div>
                    {stats.energyRegenETA && (
                        <span className="stat-sublabel">Full in {stats.energyRegenETA}</span>
                    )}
                </div>
            </div>

            {/* Energy Warning */}
            {stats.energyWarning && (
                <div className="stat-card stat-warning">
                    <span className="stat-warning-text">{stats.energyWarning}</span>
                </div>
            )}
        </div>
    )
}

export default StatsBar
