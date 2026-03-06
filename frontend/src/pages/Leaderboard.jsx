import { useState, useEffect } from 'react'
import { useAuth } from '../providers'
import Sidebar from '../components/dashboard/Sidebar'
import api from '../services/api'
import '../styles/auth.css'

const Leaderboard = () => {
    const { user } = useAuth()
    const [leaders, setLeaders] = useState([])
    const [period, setPeriod] = useState('alltime')
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchLeaderboard = async () => {
            setLoading(true)
            try {
                const res = await api.get(`/auth/leaderboard?period=${period}`)
                setLeaders(res.data)
            } catch (err) {
                console.error('Leaderboard fetch error:', err)
            } finally {
                setLoading(false)
            }
        }
        fetchLeaderboard()
    }, [period])

    const podiumOrder = [1, 0, 2] // silver, gold, bronze display order
    const top3 = leaders.slice(0, 3)
    const rest = leaders.slice(3)

    const getRankMedal = (rank) => {
        if (rank === 1) return '🥇'
        if (rank === 2) return '🥈'
        if (rank === 3) return '🥉'
        return `#${rank}`
    }

    const getPodiumClass = (rank) => {
        if (rank === 1) return 'podium-gold'
        if (rank === 2) return 'podium-silver'
        if (rank === 3) return 'podium-bronze'
        return ''
    }

    return (
        <div className="dashboard-layout">
            <Sidebar />

            <main className="dashboard-main">
                <header className="content-header">
                    <h1>🏆 Leaderboard</h1>
                </header>

                <div className="content-body">
                    {/* Period Toggle */}
                    <div className="lb-period-toggle">
                        <button
                            className={`lb-period-btn ${period === 'alltime' ? 'active' : ''}`}
                            onClick={() => setPeriod('alltime')}
                        >
                            🌟 All Time
                        </button>
                        <button
                            className={`lb-period-btn ${period === 'weekly' ? 'active' : ''}`}
                            onClick={() => setPeriod('weekly')}
                        >
                            📅 This Week
                        </button>
                    </div>

                    {loading ? (
                        <div className="lb-loading">Loading leaderboard...</div>
                    ) : leaders.length === 0 ? (
                        <div className="lb-empty">No players found for this period.</div>
                    ) : (
                        <>
                            {/* Podium — Top 3 */}
                            {top3.length >= 3 && (
                                <div className="lb-podium">
                                    {podiumOrder.map(idx => {
                                        const entry = top3[idx]
                                        if (!entry) return null
                                        return (
                                            <div key={entry._id} className={`lb-podium-card ${getPodiumClass(entry.rank)} ${entry._id === user?._id ? 'is-me' : ''}`}>
                                                <div className="lb-podium-medal">{getRankMedal(entry.rank)}</div>
                                                <div className="lb-podium-avatar">
                                                    {entry.avatar ? (
                                                        <img src={entry.avatar} alt={entry.username} />
                                                    ) : (
                                                        <div className="lb-avatar-placeholder">{entry.fullName?.charAt(0) || '?'}</div>
                                                    )}
                                                </div>
                                                <div className="lb-podium-name">{entry.fullName}</div>
                                                <div className="lb-podium-title">{entry.titleEmoji} {entry.title}</div>
                                                <div className="lb-podium-xp">{entry.totalXP.toLocaleString()} XP</div>
                                                <div className="lb-podium-stats">
                                                    <span>Lv.{entry.level}</span>
                                                    <span>🏅 {entry.badgeCount}</span>
                                                    <span>🔥 {entry.bestStreak}</span>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}

                            {/* Full Table */}
                            <div className="lb-table-wrap">
                                <table className="lb-table">
                                    <thead>
                                        <tr>
                                            <th>Rank</th>
                                            <th>Player</th>
                                            <th>Level</th>
                                            <th>XP</th>
                                            <th>Tasks</th>
                                            <th>Badges</th>
                                            <th>Streak</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {leaders.map(entry => (
                                            <tr key={entry._id} className={entry._id === user?._id ? 'lb-row-me' : ''}>
                                                <td className="lb-rank-cell">
                                                    <span className={`lb-rank ${entry.rank <= 3 ? 'top' : ''}`}>
                                                        {getRankMedal(entry.rank)}
                                                    </span>
                                                </td>
                                                <td className="lb-player-cell">
                                                    <div className="lb-player-info">
                                                        {entry.avatar ? (
                                                            <img src={entry.avatar} alt="" className="lb-table-avatar" />
                                                        ) : (
                                                            <div className="lb-table-avatar-placeholder">{entry.fullName?.charAt(0) || '?'}</div>
                                                        )}
                                                        <div>
                                                            <div className="lb-player-name">{entry.fullName}</div>
                                                            <div className="lb-player-title">{entry.titleEmoji} {entry.title}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>{entry.level}</td>
                                                <td className="lb-xp-cell">{entry.totalXP.toLocaleString()}</td>
                                                <td>{entry.tasksCompleted}</td>
                                                <td>🏅 {entry.badgeCount}</td>
                                                <td>🔥 {entry.bestStreak}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}
                </div>
            </main>
        </div>
    )
}

export default Leaderboard
