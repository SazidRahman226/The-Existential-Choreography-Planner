import { useState, useEffect, useRef, memo } from 'react'

/**
 * FocusOverlay — Full-screen immersive overlay for task execution.
 *
 * Shows a large circular countdown ring, the task title,
 * rotating motivational quotes, and YouTube video/audio controls.
 * Themed by the active session from the database.
 */

function formatTime(seconds) {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
}

const RING_RADIUS = 130
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS

const DEFAULT_GRADIENT = ['#1a1a2e', '#16213e']
const DEFAULT_RING = '#6366f1'
const DEFAULT_ACCENT = '#818cf8'

function extractVideoId(url) {
    if (!url) return null
    try {
        const parsed = new URL(url)
        if (parsed.hostname.includes('youtu.be')) return parsed.pathname.slice(1)
        return parsed.searchParams.get('v') || null
    } catch {
        return null
    }
}

function extractPlaylistId(url) {
    if (!url) return null
    try {
        const parsed = new URL(url)
        return parsed.searchParams.get('list') || null
    } catch {
        return null
    }
}

const FocusOverlay = ({
    activeNode,
    timeRemaining,
    totalDuration,
    isRunning,
    isPaused,
    onPause,
    onResume,
    onSkip,
    onDone,
    onExit,
    // Audio controls
    audioVolume,
    onVolumeChange,
    isAudioPlaying,
    // Streak
    streakCount,
    // Session object from DB
    session
}) => {
    const [quote, setQuote] = useState('')
    const [quoteVisible, setQuoteVisible] = useState(true)
    const [videoEnabled, setVideoEnabled] = useState(true)
    const [audioEnabled, setAudioEnabled] = useState(true)
    const quoteIntervalRef = useRef(null)

    const sessionName = session?.name || 'Focus'
    const sessionEmoji = session?.emoji || '🎯'
    const quotes = session?.quotes || []
    const quoteInterval = (session?.quoteInterval || 20) * 1000
    const youtubeUrl = session?.youtubePlaylistUrl || ''

    const gradient = DEFAULT_GRADIENT
    const ring = DEFAULT_RING
    const accent = DEFAULT_ACCENT

    // Build YouTube embed URL for background video
    const playlistId = extractPlaylistId(youtubeUrl)
    const videoId = extractVideoId(youtubeUrl)
    let ytEmbedUrl = null
    if (youtubeUrl && videoEnabled) {
        const params = 'autoplay=1&mute=1&controls=0&loop=1&showinfo=0&rel=0&modestbranding=1&playsinline=1&disablekb=1'
        if (playlistId) {
            ytEmbedUrl = `https://www.youtube.com/embed?listType=playlist&list=${playlistId}&${params}`
        } else if (videoId) {
            ytEmbedUrl = `https://www.youtube.com/embed/${videoId}?${params}&playlist=${videoId}`
        }
    }

    // Rotate quotes
    useEffect(() => {
        if (quotes.length === 0) return

        const pickQuote = () => {
            setQuoteVisible(false)
            setTimeout(() => {
                setQuote(quotes[Math.floor(Math.random() * quotes.length)])
                setQuoteVisible(true)
            }, 400)
        }

        pickQuote()
        quoteIntervalRef.current = setInterval(pickQuote, quoteInterval)

        return () => {
            if (quoteIntervalRef.current) clearInterval(quoteIntervalRef.current)
        }
    }, [session?._id, quotes.length])

    // Calculate ring progress
    const elapsed = totalDuration - timeRemaining
    const progress = totalDuration > 0 ? elapsed / totalDuration : 0
    const dashOffset = RING_CIRCUMFERENCE * (1 - progress)
    const progressPercent = Math.round(progress * 100)

    return (
        <div
            className="focus-overlay"
            style={{
                '--focus-grad-1': gradient[0],
                '--focus-grad-2': gradient[1],
                '--focus-ring': ring,
                '--focus-accent': accent
            }}
        >
            {/* YouTube Video Background (blurred) */}
            {ytEmbedUrl && (
                <div className="focus-yt-bg">
                    <iframe
                        src={ytEmbedUrl}
                        title="Session Background"
                        allow="autoplay; encrypted-media"
                        frameBorder="0"
                        className="focus-yt-iframe"
                    />
                </div>
            )}

            {/* Mode badge */}
            <div className="focus-mode-badge">
                <span>{sessionEmoji}</span>
                <span>{sessionName} Mode</span>
            </div>

            {/* Streak badge */}
            {streakCount >= 2 && (
                <div className="focus-streak-badge">
                    🔥 {streakCount} streak
                </div>
            )}

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
                            stroke={ring}
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
                            stroke={ring}
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
                {quotes.length > 0 && (
                    <div className={`focus-quote ${quoteVisible ? 'visible' : ''}`}>
                        "{quote}"
                    </div>
                )}
            </div>

            {/* Bottom controls */}
            <div className="focus-controls">
                <div className="focus-controls-left">
                    {/* Media toggles */}
                    <div className="focus-media-toggles">
                        {youtubeUrl && (
                            <>
                                <button
                                    className={`focus-toggle-btn ${videoEnabled ? 'active' : ''}`}
                                    onClick={() => setVideoEnabled(!videoEnabled)}
                                    title={videoEnabled ? 'Turn off video' : 'Turn on video'}
                                >
                                    {videoEnabled ? '🎬' : '🚫'}
                                </button>
                                <button
                                    className={`focus-toggle-btn ${audioEnabled ? 'active' : ''}`}
                                    onClick={() => {
                                        setAudioEnabled(!audioEnabled)
                                        onVolumeChange(audioEnabled ? 0 : 0.5)
                                    }}
                                    title={audioEnabled ? 'Turn off audio' : 'Turn on audio'}
                                >
                                    {audioEnabled ? '🔊' : '🔇'}
                                </button>
                            </>
                        )}
                    </div>
                    {/* Volume slider */}
                    {audioEnabled && (
                        <div className="focus-volume">
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
                    )}
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
                    <button className="focus-btn done" onClick={onDone} title="Done — finished early!">
                        ✓
                    </button>
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
