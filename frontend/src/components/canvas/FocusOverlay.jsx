import { useState, useEffect, useRef, memo } from 'react'
import SESSION_MODES from '../../config/sessionModes'

/**
 * FocusOverlay — Full-screen immersive overlay for task execution.
 *
 * Shows a large circular countdown ring, the task title,
 * rotating motivational quotes, and ambient audio controls.
 * Themed to the active task's session mode.
 */

function formatTime(seconds) {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
}

const RING_RADIUS = 130
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS

const FocusOverlay = ({
    activeNode,
    timeRemaining,
    totalDuration,
    isRunning,
    isPaused,
    onPause,
    onResume,
    onSkip,
    onExit,
    // Audio controls
    audioVolume,
    onVolumeChange,
    isAudioPlaying
}) => {
    const [quote, setQuote] = useState('')
    const [quoteVisible, setQuoteVisible] = useState(true)
    const quoteIntervalRef = useRef(null)

    const sessionMode = activeNode?.data?.sessionMode || 'focus'
    const mode = SESSION_MODES[sessionMode] || SESSION_MODES.focus

    // Rotate quotes every 20s
    useEffect(() => {
        const pickQuote = () => {
            const quotes = mode.quotes || []
            if (quotes.length === 0) return
            setQuoteVisible(false)
            setTimeout(() => {
                setQuote(quotes[Math.floor(Math.random() * quotes.length)])
                setQuoteVisible(true)
            }, 400) // Brief fade-out before switching
        }

        pickQuote() // Initial quote
        quoteIntervalRef.current = setInterval(pickQuote, 20000)

        return () => {
            if (quoteIntervalRef.current) clearInterval(quoteIntervalRef.current)
        }
    }, [mode])

    // Calculate ring progress
    const elapsed = totalDuration - timeRemaining
    const progress = totalDuration > 0 ? elapsed / totalDuration : 0
    const dashOffset = RING_CIRCUMFERENCE * (1 - progress)

    // Progress percentage text
    const progressPercent = Math.round(progress * 100)

    return (
        <div
            className="focus-overlay"
            style={{
                '--focus-grad-1': mode.gradient[0],
                '--focus-grad-2': mode.gradient[1],
                '--focus-ring': mode.ring,
                '--focus-accent': mode.accent
            }}
        >
            {/* Mode badge */}
            <div className="focus-mode-badge">
                <span>{mode.emoji}</span>
                <span>{mode.label} Mode</span>
            </div>

            {/* Main content */}
            <div className="focus-center">
                {/* Countdown Ring */}
                <div className="focus-ring-container">
                    <svg
                        className="focus-ring-svg"
                        width="300"
                        height="300"
                        viewBox="0 0 300 300"
                    >
                        {/* Background ring */}
                        <circle
                            cx="150"
                            cy="150"
                            r={RING_RADIUS}
                            fill="none"
                            stroke="rgba(255,255,255,0.08)"
                            strokeWidth="8"
                        />
                        {/* Progress ring */}
                        <circle
                            cx="150"
                            cy="150"
                            r={RING_RADIUS}
                            fill="none"
                            stroke={mode.ring}
                            strokeWidth="8"
                            strokeLinecap="round"
                            strokeDasharray={RING_CIRCUMFERENCE}
                            strokeDashoffset={dashOffset}
                            transform="rotate(-90 150 150)"
                            className={`focus-ring-progress ${isPaused ? 'paused' : ''}`}
                        />
                        {/* Glow ring */}
                        <circle
                            cx="150"
                            cy="150"
                            r={RING_RADIUS}
                            fill="none"
                            stroke={mode.ring}
                            strokeWidth="2"
                            strokeDasharray={RING_CIRCUMFERENCE}
                            strokeDashoffset={dashOffset}
                            transform="rotate(-90 150 150)"
                            opacity="0.3"
                            filter="blur(6px)"
                        />
                    </svg>

                    {/* Center content */}
                    <div className="focus-ring-inner">
                        <div className={`focus-timer ${isPaused ? 'paused' : ''}`}>
                            {formatTime(timeRemaining)}
                        </div>
                        <div className="focus-progress-pct">{progressPercent}%</div>
                    </div>
                </div>

                {/* Task info */}
                <h2 className="focus-task-title">{activeNode?.data?.title || 'Task'}</h2>
                {activeNode?.data?.description && (
                    <p className="focus-task-desc">{activeNode.data.description}</p>
                )}

                {/* Quote */}
                <div className={`focus-quote ${quoteVisible ? 'visible' : ''}`}>
                    "{quote}"
                </div>
            </div>

            {/* Bottom controls */}
            <div className="focus-controls">
                <div className="focus-controls-left">
                    {/* Volume slider */}
                    <div className="focus-volume">
                        <span className="focus-volume-icon" title="Audio">
                            {isAudioPlaying ? '🔊' : '🔇'}
                        </span>
                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.05"
                            value={audioVolume}
                            onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
                            className="focus-volume-slider"
                        />
                    </div>
                </div>

                <div className="focus-controls-center">
                    {isRunning && (
                        <button className="focus-btn pause" onClick={onPause} title="Pause">
                            ⏸
                        </button>
                    )}
                    {isPaused && (
                        <button className="focus-btn resume" onClick={onResume} title="Resume">
                            ▶
                        </button>
                    )}
                    <button className="focus-btn skip" onClick={onSkip} title="Skip Task">
                        ⏭
                    </button>
                </div>

                <div className="focus-controls-right">
                    <button className="focus-btn exit" onClick={onExit} title="Exit Focus Mode">
                        ✕ Exit
                    </button>
                </div>
            </div>

            {/* Paused overlay text */}
            {isPaused && (
                <div className="focus-paused-label">PAUSED</div>
            )}
        </div>
    )
}

export default memo(FocusOverlay)
