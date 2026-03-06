import { useState, useCallback, useEffect, useRef, memo } from 'react'

/**
 * RewardRoulette — A visual spin wheel triggered on early task completion.
 *
 * Shows a prize wheel with 6 segments. The user taps "Spin!" and the wheel
 * rotates to a random prize. Prizes include bonus XP, energy, golden hour, etc.
 *
 * Props:
 *   onClaim(prize)  — called with the won prize object when user claims
 */

const PRIZES = [
    { id: 'xp25', label: '+25 XP', emoji: '⭐', color: '#fbbf24', weight: 30 },
    { id: 'xp50', label: '+50 XP', emoji: '🌟', color: '#f59e0b', weight: 15 },
    { id: 'energy', label: '+20 Energy', emoji: '⚡', color: '#22d3ee', weight: 20 },
    { id: 'golden', label: 'Golden Hour', emoji: '👑', color: '#a855f7', weight: 10 },
    { id: 'xp10', label: '+10 XP', emoji: '✨', color: '#4ade80', weight: 35 },
    { id: 'streak', label: 'Streak Shield', emoji: '🛡️', color: '#3b82f6', weight: 10 },
]

// Weighted random selection
function pickPrize() {
    const totalWeight = PRIZES.reduce((s, p) => s + p.weight, 0)
    let r = Math.random() * totalWeight
    for (const prize of PRIZES) {
        r -= prize.weight
        if (r <= 0) return prize
    }
    return PRIZES[0]
}

const SEGMENT_ANGLE = 360 / PRIZES.length // 60° per segment

const RewardRoulette = ({ onClaim }) => {
    const [phase, setPhase] = useState('ready') // 'ready' | 'spinning' | 'won'
    const [prize, setPrize] = useState(null)
    const [rotation, setRotation] = useState(0)
    const wheelRef = useRef(null)

    const spin = useCallback(() => {
        if (phase !== 'ready') return

        const wonPrize = pickPrize()
        const prizeIndex = PRIZES.findIndex(p => p.id === wonPrize.id)

        // Calculate target rotation:
        // We want the prize to land at the top (pointer position)
        // Each segment is 60°. Prize 0 starts at 0°, prize 1 at 60°, etc.
        const targetSegmentAngle = prizeIndex * SEGMENT_ANGLE + SEGMENT_ANGLE / 2
        // Spin multiple full rotations + land on the prize
        const fullSpins = 5 + Math.floor(Math.random() * 3) // 5-7 full rotations
        const targetRotation = fullSpins * 360 + (360 - targetSegmentAngle)

        setPrize(wonPrize)
        setPhase('spinning')
        setRotation(targetRotation)

        // After spin animation completes (4s), show won state
        setTimeout(() => {
            setPhase('won')
        }, 4200)
    }, [phase])

    // Confetti burst effect for winning
    const [confettiPieces, setConfettiPieces] = useState([])
    useEffect(() => {
        if (phase === 'won') {
            setConfettiPieces(
                Array.from({ length: 16 }).map((_, i) => ({
                    id: i,
                    x: Math.random() * 200 - 100,
                    y: -(Math.random() * 150 + 50),
                    rot: Math.random() * 720 - 360,
                    color: PRIZES[i % PRIZES.length].color,
                    delay: Math.random() * 0.5
                }))
            )
        }
    }, [phase])

    return (
        <div className="roulette-container">
            {phase === 'ready' && (
                <div className="roulette-intro">
                    <span className="roulette-intro-emoji">🎰</span>
                    <span className="roulette-intro-text">You finished early! Spin for a bonus!</span>
                </div>
            )}

            {/* Wheel */}
            <div className="roulette-wheel-wrapper">
                {/* Pointer / indicator */}
                <div className="roulette-pointer">▼</div>

                <div
                    ref={wheelRef}
                    className="roulette-wheel"
                    style={{
                        transform: `rotate(${rotation}deg)`,
                        transition: phase === 'spinning'
                            ? 'transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)'
                            : 'none'
                    }}
                >
                    {/* Labels positioned over the conic-gradient segments */}
                    {PRIZES.map((p, i) => {
                        // Place each label at the midpoint of its segment
                        const midAngle = i * SEGMENT_ANGLE + SEGMENT_ANGLE / 2
                        return (
                            <div
                                key={p.id}
                                className="roulette-label"
                                style={{
                                    transform: `rotate(${midAngle}deg) translateY(-52px)`
                                }}
                            >
                                <span className="roulette-label-inner" style={{ transform: `rotate(-${midAngle}deg)` }}>
                                    <span className="roulette-label-emoji">{p.emoji}</span>
                                    <span className="roulette-label-text">{p.label}</span>
                                </span>
                            </div>
                        )
                    })}
                    {/* Center dot */}
                    <div className="roulette-center-dot" />
                </div>
            </div>

            {/* Spin button */}
            {phase === 'ready' && (
                <button className="roulette-spin-btn" onClick={spin}>
                    🎰 Spin!
                </button>
            )}

            {/* Spinning state */}
            {phase === 'spinning' && (
                <div className="roulette-spinning-label">Spinning...</div>
            )}

            {/* Won state */}
            {phase === 'won' && prize && (
                <div className="roulette-won">
                    {/* Mini confetti */}
                    <div className="roulette-confetti">
                        {confettiPieces.map(c => (
                            <div
                                key={c.id}
                                className="roulette-confetti-piece"
                                style={{
                                    '--x': `${c.x}px`,
                                    '--y': `${c.y}px`,
                                    '--rot': `${c.rot}deg`,
                                    '--color': c.color,
                                    '--delay': `${c.delay}s`
                                }}
                            />
                        ))}
                    </div>
                    <div className="roulette-won-prize">
                        <span className="roulette-won-emoji">{prize.emoji}</span>
                        <span className="roulette-won-label">{prize.label}</span>
                    </div>
                    <button className="roulette-claim-btn" onClick={() => onClaim(prize)}>
                        Claim Reward! 🎉
                    </button>
                </div>
            )}
        </div>
    )
}

export default memo(RewardRoulette)
