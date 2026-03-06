/**
 * Session Modes — Theme configurations for the Focus Overlay.
 *
 * Each mode defines the visual theme (gradient, accent, ring color),
 * an audio key for ambient sound, and curated motivational quotes.
 */

const SESSION_MODES = {
    focus: {
        id: 'focus',
        emoji: '🎯',
        label: 'Focus',
        gradient: ['#1a1a2e', '#16213e'],
        ring: '#6366f1',
        accent: '#818cf8',
        audio: 'lofi',
        quotes: [
            'Deep focus is a superpower. You have it.',
            'One task at a time. One breath at a time.',
            'The secret of getting ahead is getting started.',
            'Block out the noise. You know what to do.',
            "Discipline is choosing what you want most over what you want now.",
            'Your future self will thank you for this.',
            'Stay in the zone. The results will follow.',
            'Focus on progress, not perfection.'
        ]
    },
    grind: {
        id: 'grind',
        emoji: '🏋️',
        label: 'Grind',
        gradient: ['#2d1b2e', '#4a0e0e'],
        ring: '#ef4444',
        accent: '#f87171',
        audio: 'upbeat',
        quotes: [
            "Pain is temporary. Quitting lasts forever.",
            "No excuses. Just results.",
            "Push harder than yesterday.",
            "You didn't come this far to only come this far.",
            "Sweat now, shine later.",
            "Beast mode: activated.",
            "Your only limit is you.",
            "Grind in silence. Let success make the noise."
        ]
    },
    zen: {
        id: 'zen',
        emoji: '🧘',
        label: 'Zen',
        gradient: ['#1a2e1a', '#0e3b2e'],
        ring: '#22c55e',
        accent: '#4ade80',
        audio: 'nature',
        quotes: [
            'Breathe in calm, breathe out tension.',
            'Be where you are, not where you think you should be.',
            'Slow progress is still progress.',
            'Let go of what you cannot control.',
            'Peace comes from within. Do not seek it without.',
            'The present moment is all you ever have.',
            'Be gentle with yourself. You are doing your best.',
            'Stillness is where creativity and solutions are found.'
        ]
    },
    sprint: {
        id: 'sprint',
        emoji: '🚀',
        label: 'Sprint',
        gradient: ['#0f0f23', '#1a0533'],
        ring: '#f59e0b',
        accent: '#fbbf24',
        audio: 'clock',
        quotes: [
            "Time is ticking. Make every second count!",
            "Move fast. Break records.",
            "Speed is nothing without direction. You have both.",
            "Race the clock. Beat it.",
            "Urgency creates momentum. Momentum creates results.",
            "Sprint now, rest later.",
            "The countdown is on. Show what you've got!",
            "Faster, stronger, sharper. Let's go!"
        ]
    },
    chill: {
        id: 'chill',
        emoji: '☕',
        label: 'Chill',
        gradient: ['#2e2418', '#1a1510'],
        ring: '#d97706',
        accent: '#fbbf24',
        audio: 'cafe',
        quotes: [
            'Take it easy. Good things take time.',
            "There's beauty in simplicity.",
            'Enjoy the process, not just the outcome.',
            'Slow and steady wins the race.',
            "Relax. You've got this.",
            'A calm mind solves the hardest problems.',
            'Sip your coffee. Do your thing.',
            'Not every session needs to be intense.'
        ]
    }
}

// Default mode mapping for templates
const TEMPLATE_DEFAULT_MODES = {
    study: 'focus',
    practice: 'focus',
    review: 'zen',
    exercise: 'grind',
    project: 'sprint',
    custom: 'chill',
    decision: null
}

export { SESSION_MODES, TEMPLATE_DEFAULT_MODES }
export default SESSION_MODES
