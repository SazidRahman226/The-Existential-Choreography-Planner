import { useState } from 'react'
import taskService from '../../services/task.service'

const FAILURE_REASONS = [
    { key: 'distracted', label: '📱 Got distracted' },
    { key: 'too_hard', label: '🧠 Too hard / confusing' },
    { key: 'took_longer', label: '⏰ Needed more time' },
    { key: 'emergency', label: '🚨 Emergency / interrupted' },
    { key: 'skipped', label: '⏭️ Decided to skip' }
]

const PostTaskReview = ({
    taskTitle,
    taskDifficulty,
    taskId,
    timeRemainingPercent,
    totalDuration,
    actualTimeSpent,
    streakCount,
    usedFocusOverlay,
    sessionMode,
    onComplete  // called with (outcome, xpResult) after API responds
}) => {
    const [step, setStep] = useState('outcome') // 'outcome' | 'failure' | 'result'
    const [outcome, setOutcome] = useState(null)
    const [reason, setReason] = useState('')
    const [note, setNote] = useState('')
    const [overtimeMinutes, setOvertimeMinutes] = useState(0)
    const [xpResult, setXpResult] = useState(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)

    const handleOutcomeSelect = async (selectedOutcome) => {
        setOutcome(selectedOutcome)

        if (selectedOutcome === 'failed') {
            setStep('failure')
            return
        }

        if (selectedOutcome === 'completed_late') {
            setStep('late')
            return
        }

        // For 'completed' — submit immediately
        await submitReview(selectedOutcome)
    }

    const handleLateSubmit = async () => {
        await submitReview('completed_late')
    }

    const handleFailureSubmit = async () => {
        await submitReview('failed')
    }

    const submitReview = async (finalOutcome) => {
        setLoading(true)
        setError(null)

        try {
            // Guard: skip API call if taskId is missing or not a valid ObjectId
            if (!taskId || !/^[a-f\d]{24}$/i.test(taskId)) {
                console.warn('PostTaskReview: missing or invalid taskId, skipping API call')
                setError('Task not saved yet — save your flow before running!')
                setXpResult({ earnedXP: 0, levelUp: false })
                setStep('result')
                setLoading(false)
                return
            }

            const data = {
                outcome: finalOutcome,
                overtimeMinutes: finalOutcome === 'completed_late' ? overtimeMinutes : 0,
                timeRemainingPercent: finalOutcome === 'completed' ? timeRemainingPercent : 0,
                reason: finalOutcome === 'failed' ? reason : undefined,
                note: note || undefined,
                actualTime: actualTimeSpent,
                usedFocusOverlay,
                streakCount,
                sessionMode
            }

            const result = await taskService.completeTask(taskId, data)
            setXpResult(result)
            setStep('result')
        } catch (err) {
            console.error('Review submission error:', err)
            setError(err.response?.data?.message || 'Failed to submit review')
            // Still allow continuing even on error
            setXpResult({ earnedXP: 0, levelUp: false })
            setStep('result')
        } finally {
            setLoading(false)
        }
    }

    const handleContinue = () => {
        onComplete(outcome, xpResult)
    }

    return (
        <div className="post-review-overlay">
            <div className="post-review-card">
                {/* Header */}
                <div className="post-review-header">
                    <span className="post-review-icon">⏰</span>
                    <h3>Time's Up!</h3>
                    <p className="post-review-task-title">{taskTitle}</p>
                </div>

                {/* Step: Outcome Selection */}
                {step === 'outcome' && (
                    <div className="post-review-body">
                        <p className="post-review-question">Did you finish this task?</p>
                        <div className="post-review-outcomes">
                            <button
                                className="outcome-btn outcome-success"
                                onClick={() => handleOutcomeSelect('completed')}
                                disabled={loading}
                            >
                                <span className="outcome-emoji">✅</span>
                                <span className="outcome-label">Yes, nailed it!</span>
                                <span className="outcome-hint">Full XP earned</span>
                            </button>
                            <button
                                className="outcome-btn outcome-late"
                                onClick={() => handleOutcomeSelect('completed_late')}
                                disabled={loading}
                            >
                                <span className="outcome-emoji">⚠️</span>
                                <span className="outcome-label">Mostly, need more time</span>
                                <span className="outcome-hint">Reduced XP</span>
                            </button>
                            <button
                                className="outcome-btn outcome-fail"
                                onClick={() => handleOutcomeSelect('failed')}
                                disabled={loading}
                            >
                                <span className="outcome-emoji">❌</span>
                                <span className="outcome-label">No, got distracted</span>
                                <span className="outcome-hint">0 XP</span>
                            </button>
                        </div>
                    </div>
                )}

                {/* Step: Late details */}
                {step === 'late' && (
                    <div className="post-review-body">
                        <p className="post-review-question">How much extra time did you need?</p>
                        <div className="post-review-late-input">
                            <input
                                type="number"
                                min="1"
                                max="120"
                                value={overtimeMinutes}
                                onChange={(e) => setOvertimeMinutes(Number(e.target.value))}
                                className="overtime-input"
                            />
                            <span className="overtime-label">extra minutes</span>
                        </div>
                        <div className="post-review-note-group">
                            <textarea
                                placeholder="Optional note..."
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                maxLength={200}
                                className="review-note"
                            />
                        </div>
                        <button
                            className="post-review-submit"
                            onClick={handleLateSubmit}
                            disabled={loading || overtimeMinutes < 1}
                        >
                            {loading ? 'Submitting...' : 'Submit'}
                        </button>
                    </div>
                )}

                {/* Step: Failure details */}
                {step === 'failure' && (
                    <div className="post-review-body">
                        <p className="post-review-question">What happened?</p>
                        <div className="post-review-reasons">
                            {FAILURE_REASONS.map(r => (
                                <button
                                    key={r.key}
                                    className={`reason-btn ${reason === r.key ? 'active' : ''}`}
                                    onClick={() => setReason(r.key)}
                                >
                                    {r.label}
                                </button>
                            ))}
                        </div>
                        <div className="post-review-note-group">
                            <textarea
                                placeholder="Optional note..."
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                maxLength={200}
                                className="review-note"
                            />
                        </div>
                        <button
                            className="post-review-submit"
                            onClick={handleFailureSubmit}
                            disabled={loading || !reason}
                        >
                            {loading ? 'Submitting...' : 'Submit'}
                        </button>
                    </div>
                )}

                {/* Step: XP Result */}
                {step === 'result' && xpResult && (
                    <div className="post-review-body post-review-result">
                        <div className={`xp-earned-display ${xpResult.earnedXP > 0 ? 'has-xp' : 'no-xp'}`}>
                            <span className="xp-amount">
                                {xpResult.earnedXP > 0 ? `+${xpResult.earnedXP}` : '0'} XP
                            </span>
                            {xpResult.breakdown?.streakBadge && (
                                <span className="streak-badge">{xpResult.breakdown.streakBadge}</span>
                            )}
                        </div>

                        {xpResult.levelUp && (
                            <div className="level-up-banner">
                                <span className="level-up-icon">🎉</span>
                                <span>Level Up! → {xpResult.title?.emoji} Level {xpResult.newLevel} — {xpResult.title?.label}</span>
                            </div>
                        )}

                        {xpResult.energyWarning && (
                            <div className="energy-warning">{xpResult.energyWarning}</div>
                        )}

                        {xpResult.breakdown && xpResult.earnedXP > 0 && (
                            <div className="xp-breakdown">
                                <div className="breakdown-row">
                                    <span>Base</span>
                                    <span>{xpResult.breakdown.baseXP} XP</span>
                                </div>
                                <div className="breakdown-row">
                                    <span>Outcome</span>
                                    <span>×{xpResult.breakdown.outcomeMultiplier}</span>
                                </div>
                                {xpResult.breakdown.streakBonus > 0 && (
                                    <div className="breakdown-row bonus">
                                        <span>Streak</span>
                                        <span>+{Math.round(xpResult.breakdown.streakBonus * 100)}%</span>
                                    </div>
                                )}
                                {xpResult.breakdown.focusBonus > 0 && (
                                    <div className="breakdown-row bonus">
                                        <span>Focus</span>
                                        <span>+15%</span>
                                    </div>
                                )}
                                {xpResult.breakdown.dailyBonus > 0 && (
                                    <div className="breakdown-row bonus">
                                        <span>Daily Bonus</span>
                                        <span>+{xpResult.breakdown.dailyBonus} XP</span>
                                    </div>
                                )}
                            </div>
                        )}

                        {error && (
                            <div className="review-error">{error}</div>
                        )}

                        <button className="post-review-continue" onClick={handleContinue}>
                            Continue →
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}

export default PostTaskReview
