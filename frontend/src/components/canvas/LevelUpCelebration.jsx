import { memo, useEffect, useState } from 'react'

/**
 * LevelUpCelebration — Full-screen celebration when the user levels up.
 *
 * Triggered after PostTaskReview dismisses when the API indicates levelUp.
 * Shows golden flash, confetti, level number, and new title.
 */

const CONFETTI_COLORS = ['#fbbf24', '#f59e0b', '#f97316', '#fb923c', '#fcd34d', '#fde68a']

const LevelUpCelebration = ({ show, newLevel, title, onDismiss }) => {
    const [visible, setVisible] = useState(false)

    useEffect(() => {
        if (show) {
            requestAnimationFrame(() => setVisible(true))

            // Auto-dismiss after 5s
            const timer = setTimeout(() => {
                onDismiss()
            }, 5000)
            return () => clearTimeout(timer)
        } else {
            setVisible(false)
        }
    }, [show, onDismiss])

    if (!show) return null

    return (
        <div className={`levelup-overlay ${visible ? 'visible' : ''}`} onClick={onDismiss}>
            {/* Golden flash */}
            <div className="levelup-flash" />

            {/* Confetti */}
            <div className="levelup-confetti">
                {Array.from({ length: 24 }).map((_, i) => (
                    <div
                        key={i}
                        className="levelup-confetti-piece"
                        style={{
                            '--delay': `${Math.random() * 1.5}s`,
                            '--x': `${Math.random() * 100 - 50}vw`,
                            '--rot': `${Math.random() * 720 - 360}deg`,
                            '--color': CONFETTI_COLORS[i % CONFETTI_COLORS.length],
                            '--size': `${6 + Math.random() * 6}px`
                        }}
                    />
                ))}
            </div>

            <div className="levelup-content" onClick={(e) => e.stopPropagation()}>
                <div className="levelup-label">LEVEL UP!</div>
                <div className="levelup-level">{newLevel}</div>
                <div className="levelup-title-reveal">
                    <span className="levelup-title-emoji">{title?.emoji || '⭐'}</span>
                    <span className="levelup-title-text">{title?.label || 'Adventurer'}</span>
                </div>

                <button className="levelup-dismiss-btn" onClick={onDismiss}>
                    Continue →
                </button>
            </div>
        </div>
    )
}

export default memo(LevelUpCelebration)
