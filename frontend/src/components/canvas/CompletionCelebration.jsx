import { memo, useEffect, useState } from 'react'

const CELEBRATION_MESSAGES = [
    { emoji: '🎉', title: 'Flow Complete!', subtitle: 'You crushed it!' },
    { emoji: '🏆', title: 'Victory!', subtitle: 'Every task conquered!' },
    { emoji: '🌟', title: 'Brilliant!', subtitle: 'Another flow mastered!' },
    { emoji: '🚀', title: 'Launched!', subtitle: 'All tasks are done!' },
    { emoji: '💪', title: 'Beast Mode!', subtitle: 'Nothing can stop you!' },
]

const CompletionCelebration = ({ show, completedCount, totalXP, flowBonus, onDismiss }) => {
    const [visible, setVisible] = useState(false)
    const [message] = useState(() =>
        CELEBRATION_MESSAGES[Math.floor(Math.random() * CELEBRATION_MESSAGES.length)]
    )

    useEffect(() => {
        if (show) {
            // Small delay for the animation to mount properly
            requestAnimationFrame(() => setVisible(true))
        } else {
            setVisible(false)
        }
    }, [show])

    if (!show) return null

    const displayXP = (totalXP || 0) + (flowBonus?.bonusXP || 0)

    return (
        <div className={`celebration-overlay ${visible ? 'visible' : ''}`} onClick={onDismiss}>
            <div className="celebration-content" onClick={(e) => e.stopPropagation()}>
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

                <div className="celebration-stats">
                    <div className="celebration-stat">
                        <span className="stat-value">{completedCount}</span>
                        <span className="stat-label">Tasks Done</span>
                    </div>
                    <div className="celebration-stat">
                        <span className="stat-value">⭐ {displayXP}</span>
                        <span className="stat-label">Total XP Earned</span>
                    </div>
                </div>

                <button className="celebration-dismiss-btn" onClick={onDismiss}>
                    Continue 🚀
                </button>
            </div>
        </div>
    )
}

export default memo(CompletionCelebration)
