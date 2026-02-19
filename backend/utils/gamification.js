/**
 * Gamification Utility Functions
 * 
 * Single source of truth: GAMIFICATION_SYSTEM.md
 * Pure functions — no DB access, fully testable.
 */

// --- Base XP by difficulty ---
const BASE_XP = {
    easy: 25,
    medium: 50,
    hard: 100
}

// --- Energy cost by difficulty ---
const ENERGY_COST = {
    easy: 5,
    medium: 10,
    hard: 20
}

// --- Level titles ---
const TITLES = [
    { minLevel: 50, emoji: '🌟', label: 'Legendary' },
    { minLevel: 30, emoji: '👑', label: 'Grandmaster' },
    { minLevel: 20, emoji: '🏆', label: 'Master' },
    { minLevel: 15, emoji: '💎', label: 'Disciplined' },
    { minLevel: 10, emoji: '🔥', label: 'Focused' },
    { minLevel: 5, emoji: '⚡', label: 'Apprentice' },
    { minLevel: 1, emoji: '🌱', label: 'Seedling' }
]

// --- Streak bonus thresholds ---
const STREAK_THRESHOLDS = [
    { count: 10, bonus: 0.50, badge: 'GODLIKE 💀🔥' },
    { count: 5, bonus: 0.30, badge: 'On Fire 🔥🔥🔥' },
    { count: 3, bonus: 0.20, badge: 'Unstoppable 🔥🔥' },
    { count: 2, bonus: 0.10, badge: 'Double Kill 🔥' }
]

/**
 * Calculate level from total XP.
 * Formula: level = floor(0.5 + sqrt(1 + 8 * totalXP / 100) / 2)
 */
export function calculateLevel(totalXP) {
    if (totalXP <= 0) return 1
    return Math.floor(0.5 + Math.sqrt(1 + 8 * totalXP / 100) / 2)
}

/**
 * Calculate the total XP needed to reach a given level.
 * Inverse of the level formula: xpNeeded = level * (level - 1) * 100 / 2
 */
export function xpForLevel(level) {
    if (level <= 1) return 0
    return (level * (level - 1) * 100) / 2
}

/**
 * Get title for a given level.
 */
export function getTitleForLevel(level) {
    for (const t of TITLES) {
        if (level >= t.minLevel) {
            return { emoji: t.emoji, label: t.label }
        }
    }
    return { emoji: '🌱', label: 'Seedling' }
}

/**
 * Get streak bonus multiplier and badge text.
 */
export function getStreakBonus(streakCount) {
    for (const s of STREAK_THRESHOLDS) {
        if (streakCount >= s.count) {
            return { bonus: s.bonus, badge: s.badge }
        }
    }
    return { bonus: 0, badge: null }
}

/**
 * Get energy multiplier based on current energy level.
 * >= 20 → 1.0 | 1-19 → 0.5 | 0 → 0.0
 */
export function getEnergyMultiplier(energy) {
    if (energy >= 20) return 1.0
    if (energy >= 1) return 0.5
    return 0.0
}

/**
 * Get energy warning message.
 */
export function getEnergyWarning(energy) {
    if (energy >= 20) return null
    if (energy >= 10) return '⚠️ Running low on energy!'
    if (energy >= 1) return '🟡 Low energy — XP halved'
    return '🔴 Rest mode — 0 XP earned'
}

/**
 * Calculate the outcome multiplier.
 * 
 * - completed: 1.0 (or 1.3 if early — ≥20% time remaining)
 * - completed_late: 0.7 base, decays -2% per overtime minute, min 0.3
 * - failed / skipped: 0.0
 */
export function getOutcomeMultiplier(outcome, overtimeMinutes = 0, timeRemainingPercent = 0) {
    switch (outcome) {
        case 'completed':
            // Early finish bonus: >=20% time remaining → ×1.3
            return timeRemainingPercent >= 20 ? 1.3 : 1.0
        case 'completed_late':
            return Math.max(0.3, 0.7 - (overtimeMinutes * 0.02))
        case 'failed':
        case 'skipped':
            return 0.0
        default:
            return 0.0
    }
}

/**
 * Calculate earned XP for a task completion.
 * Implements the formula from GAMIFICATION_SYSTEM.md §1.
 * 
 * earnedXP = floor(baseXP × outcome × energy × (1 + streakBonus) × (1 + focusBonus))
 *          + dailyBonus + personalRecordBonus
 */
export function calculateXP({
    difficulty = 'medium',
    outcome = 'completed',
    overtimeMinutes = 0,
    timeRemainingPercent = 0,
    userEnergy = 100,
    streakCount = 0,
    usedFocusOverlay = false,
    isFirstFlowToday = false,
    isPersonalRecord = false
}) {
    const baseXP = BASE_XP[difficulty] || 50
    const outcomeMultiplier = getOutcomeMultiplier(outcome, overtimeMinutes, timeRemainingPercent)
    const energyMultiplier = getEnergyMultiplier(userEnergy)
    const { bonus: streakBonus, badge: streakBadge } = getStreakBonus(streakCount)
    const focusBonus = usedFocusOverlay ? 0.15 : 0

    // Core XP calculation
    const coreXP = Math.floor(
        baseXP * outcomeMultiplier * energyMultiplier * (1 + streakBonus) * (1 + focusBonus)
    )

    // Flat bonuses (only if outcome succeeded)
    const dailyBonus = (isFirstFlowToday && outcomeMultiplier > 0) ? 50 : 0
    const personalRecordBonus = (isPersonalRecord && outcomeMultiplier > 0) ? 25 : 0

    const totalXP = coreXP + dailyBonus + personalRecordBonus

    return {
        earnedXP: totalXP,
        breakdown: {
            baseXP,
            outcomeMultiplier: Math.round(outcomeMultiplier * 100) / 100,
            energyMultiplier,
            streakBonus,
            streakBadge,
            focusBonus,
            coreXP,
            dailyBonus,
            personalRecordBonus
        }
    }
}

/**
 * Determine energy cost for a given difficulty.
 */
export function getEnergyCost(difficulty) {
    return ENERGY_COST[difficulty] || 10
}

/**
 * Check if this is the user's first session today.
 */
export function isFirstSessionToday(lastSessionDate) {
    if (!lastSessionDate) return true
    const now = new Date()
    const last = new Date(lastSessionDate)
    return now.toDateString() !== last.toDateString()
}

/**
 * Check if user qualifies for full recharge (8+ hours since last session).
 */
export function shouldFullRecharge(lastSessionDate) {
    if (!lastSessionDate) return false
    const now = new Date()
    const last = new Date(lastSessionDate)
    const hoursSinceLast = (now - last) / (1000 * 60 * 60)
    return hoursSinceLast >= 8
}
