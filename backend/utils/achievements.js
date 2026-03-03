/**
 * Achievements & Badges — Static Definitions + Evaluation
 * 
 * All achievements defined here. Checked at task/flow completion.
 * Each badge awards a one-time XP bonus when unlocked.
 */

// ---- Achievement Categories ----
export const CATEGORIES = {
    milestone: { label: 'Milestones', emoji: '🏆' },
    streak: { label: 'Streak & Consistency', emoji: '🔥' },
    performance: { label: 'Performance', emoji: '⚡' },
    mastery: { label: 'Flow Mastery', emoji: '🎯' },
    special: { label: 'Special', emoji: '🌟' }
}

// ---- Achievement Definitions ----
export const ACHIEVEMENTS = [
    // === Milestones ===
    {
        key: 'first_steps', name: 'First Steps', emoji: '🐣', category: 'milestone',
        description: 'Complete your first task', xpBonus: 25,
        check: (stats) => stats.tasksCompleted >= 1, target: 1, stat: 'tasksCompleted'
    },

    {
        key: 'getting_started', name: 'Getting Started', emoji: '🚀', category: 'milestone',
        description: 'Complete 10 tasks', xpBonus: 50,
        check: (stats) => stats.tasksCompleted >= 10, target: 10, stat: 'tasksCompleted'
    },

    {
        key: 'century', name: 'Century', emoji: '💯', category: 'milestone',
        description: 'Complete 100 tasks', xpBonus: 200,
        check: (stats) => stats.tasksCompleted >= 100, target: 100, stat: 'tasksCompleted'
    },

    {
        key: 'thousand_club', name: 'Thousand Club', emoji: '🏛️', category: 'milestone',
        description: 'Complete 1,000 tasks', xpBonus: 500,
        check: (stats) => stats.tasksCompleted >= 1000, target: 1000, stat: 'tasksCompleted'
    },

    {
        key: 'xp_collector', name: 'XP Collector', emoji: '💰', category: 'milestone',
        description: 'Earn 1,000 total XP', xpBonus: 50,
        check: (stats, user) => user.points >= 1000, target: 1000, stat: 'totalXP'
    },

    {
        key: 'xp_hoarder', name: 'XP Hoarder', emoji: '🏦', category: 'milestone',
        description: 'Earn 10,000 total XP', xpBonus: 200,
        check: (stats, user) => user.points >= 10000, target: 10000, stat: 'totalXP'
    },

    // === Streak & Consistency ===
    {
        key: 'double_kill', name: 'Double Kill', emoji: '🔥', category: 'streak',
        description: 'Reach a 2 streak in any flow', xpBonus: 25,
        check: (stats) => stats.bestStreak >= 2, target: 2, stat: 'bestStreak'
    },

    {
        key: 'on_fire', name: 'On Fire', emoji: '🔥🔥🔥', category: 'streak',
        description: 'Reach a 5 streak in any flow', xpBonus: 75,
        check: (stats) => stats.bestStreak >= 5, target: 5, stat: 'bestStreak'
    },

    {
        key: 'godlike', name: 'GODLIKE', emoji: '💀', category: 'streak',
        description: 'Reach a 10 streak in any flow', xpBonus: 200,
        check: (stats) => stats.bestStreak >= 10, target: 10, stat: 'bestStreak'
    },

    {
        key: 'daily_devotee', name: 'Daily Devotee', emoji: '📅', category: 'streak',
        description: 'Complete flows on 7 consecutive days', xpBonus: 100,
        check: (stats) => stats.consecutiveDays >= 7, target: 7, stat: 'consecutiveDays'
    },

    {
        key: 'monthly_master', name: 'Monthly Master', emoji: '🗓️', category: 'streak',
        description: 'Complete flows on 30 consecutive days', xpBonus: 300,
        check: (stats) => stats.consecutiveDays >= 30, target: 30, stat: 'consecutiveDays'
    },

    // === Performance ===
    {
        key: 'speed_demon', name: 'Speed Demon', emoji: '⚡', category: 'performance',
        description: 'Finish 5 tasks with ≥30% time remaining', xpBonus: 75,
        check: (stats) => stats.earlyFinishes >= 5, target: 5, stat: 'earlyFinishes'
    },

    {
        key: 'perfect_run', name: 'Perfect Run', emoji: '🏆', category: 'performance',
        description: 'Complete a flow with all tasks on time', xpBonus: 100,
        check: (stats) => stats.perfectRuns >= 1, target: 1, stat: 'perfectRuns'
    },

    {
        key: 'personal_best', name: 'Personal Best', emoji: '🥇', category: 'performance',
        description: 'Set 10 personal records', xpBonus: 100,
        check: (stats) => stats.personalRecords >= 10, target: 10, stat: 'personalRecords'
    },

    {
        key: 'focus_monk', name: 'Focus Monk', emoji: '🧘', category: 'performance',
        description: 'Complete 20 tasks using Focus Overlay', xpBonus: 75,
        check: (stats) => stats.focusTasks >= 20, target: 20, stat: 'focusTasks'
    },

    {
        key: 'night_owl', name: 'Night Owl', emoji: '🦉', category: 'performance',
        description: 'Complete a task after 11 PM', xpBonus: 25,
        check: (stats) => stats.nightTasks >= 1, target: 1, stat: 'nightTasks'
    },

    {
        key: 'early_bird', name: 'Early Bird', emoji: '🐦', category: 'performance',
        description: 'Complete a task before 7 AM', xpBonus: 25,
        check: (stats) => stats.earlyTasks >= 1, target: 1, stat: 'earlyTasks'
    },

    // === Flow Mastery ===
    {
        key: 'flow_architect', name: 'Flow Architect', emoji: '📐', category: 'mastery',
        description: 'Create 10 flows', xpBonus: 50,
        check: (stats) => stats.flowsCreated >= 10, target: 10, stat: 'flowsCreated'
    },

    {
        key: 'zen_master', name: 'Zen Master', emoji: '☯️', category: 'mastery',
        description: 'Complete 10 tasks in Zen mode', xpBonus: 75,
        check: (stats) => stats.zenTasks >= 10, target: 10, stat: 'zenTasks'
    },

    {
        key: 'pinned_planner', name: 'Pinned Planner', emoji: '📌', category: 'mastery',
        description: 'Use scheduled nodes in 5 flows', xpBonus: 50,
        check: (stats) => stats.pinnedFlows >= 5, target: 5, stat: 'pinnedFlows'
    },

    {
        key: 'lucky_spinner', name: 'Lucky Spinner', emoji: '🎰', category: 'mastery',
        description: 'Win 10 roulette prizes', xpBonus: 50,
        check: (stats) => stats.rouletteWins >= 10, target: 10, stat: 'rouletteWins'
    },

    // === Special ===
    {
        key: 'level_10', name: 'Level 10', emoji: '⭐', category: 'special',
        description: 'Reach Level 10', xpBonus: 100,
        check: (stats, user) => user.level >= 10, target: 10, stat: 'level'
    },

    {
        key: 'level_25', name: 'Level 25', emoji: '💎', category: 'special',
        description: 'Reach Level 25', xpBonus: 250,
        check: (stats, user) => user.level >= 25, target: 25, stat: 'level'
    },

    {
        key: 'level_50', name: 'Level 50', emoji: '👑', category: 'special',
        description: 'Reach Level 50', xpBonus: 500,
        check: (stats, user) => user.level >= 50, target: 50, stat: 'level'
    },

    {
        key: 'comeback_kid', name: 'Comeback Kid', emoji: '💪', category: 'special',
        description: 'Complete task on-time after 3 consecutive fails', xpBonus: 50,
        check: (stats) => stats.comebacks >= 1, target: 1, stat: 'comebacks'
    }
]

/**
 * Check all achievements and return newly unlocked ones.
 * 
 * @param {Object} user — Mongoose user document (with stats, badges, points, level)
 * @param {Object} context — Extra context from the current event
 * @returns {Array} — Array of newly unlocked achievement objects
 */
export function checkAchievements(user, context = {}) {
    const earnedKeys = new Set((user.badges || []).map(b => b.key))
    const stats = user.stats || {}
    const newlyUnlocked = []

    for (const achievement of ACHIEVEMENTS) {
        // Skip already earned
        if (earnedKeys.has(achievement.key)) continue

        // Check if condition is met
        try {
            if (achievement.check(stats, user)) {
                newlyUnlocked.push(achievement)
            }
        } catch (e) {
            // Silently skip broken checks
        }
    }

    return newlyUnlocked
}

/**
 * Get progress for a specific achievement.
 * 
 * @param {Object} achievement — Achievement definition
 * @param {Object} stats — User stats object
 * @param {Object} user — User document
 * @returns {Object} — { current, target, percent }
 */
export function getProgress(achievement, stats, user) {
    let current = 0
    const target = achievement.target || 1

    switch (achievement.stat) {
        case 'totalXP': current = user?.points || 0; break
        case 'level': current = user?.level || 1; break
        default: current = stats?.[achievement.stat] || 0
    }

    return {
        current: Math.min(current, target),
        target,
        percent: Math.min(100, Math.round((current / target) * 100))
    }
}
