# 🏅 Badges & Achievements System — Design Document

> Extends the gamification system defined in [GAMIFICATION_SYSTEM.md](file:///d:/Study/IUT%20-%205/The-Existential-Choreography-Planner/GAMIFICATION_SYSTEM.md).
> Uses the existing `Badge` model and `User.badges[]` array.

---

## Core Design

- **Achievements** = predefined goals tracked automatically
- **Badges** = visual rewards unlocked when an achievement triggers
- Badges are **permanent** — once earned, never lost
- Each badge awards a **one-time XP bonus** when unlocked
- Badges display in an **Achievement Showcase** on the Account page

---

## Achievement Categories & Definitions

### 🏆 Milestone Achievements

| Badge | Emoji | Condition | XP Bonus |
|-------|-------|-----------|----------|
| First Steps | 🐣 | Complete your first task | +25 |
| Getting Started | 🚀 | Complete 10 tasks total | +50 |
| Century | 💯 | Complete 100 tasks total | +200 |
| Thousand Club | 🏛️ | Complete 1,000 tasks total | +500 |
| XP Collector | 💰 | Earn 1,000 total XP | +50 |
| XP Hoarder | 🏦 | Earn 10,000 total XP | +200 |

### 🔥 Streak & Consistency

| Badge | Emoji | Condition | XP Bonus |
|-------|-------|-----------|----------|
| Double Kill | 🔥 | Reach a 2 streak in any flow | +25 |
| On Fire | 🔥🔥🔥 | Reach a 5 streak in any flow | +75 |
| GODLIKE | 💀 | Reach a 10 streak in any flow | +200 |
| Daily Devotee | 📅 | Complete flows on 7 consecutive days | +100 |
| Monthly Master | 🗓️ | Complete flows on 30 consecutive days | +300 |

### ⚡ Performance

| Badge | Emoji | Condition | XP Bonus |
|-------|-------|-----------|----------|
| Speed Demon | ⚡ | Finish 5 tasks with ≥30% time remaining | +75 |
| Perfect Run | 🏆 | Complete a flow with 100% on-time tasks | +100 |
| Personal Best | 🥇 | Set 10 personal records | +100 |
| Focus Monk | 🧘 | Complete 20 tasks using Focus Overlay | +75 |
| Night Owl | 🦉 | Complete a task after 11 PM | +25 |
| Early Bird | 🐦 | Complete a task before 7 AM | +25 |

### 🎯 Flow Mastery

| Badge | Emoji | Condition | XP Bonus |
|-------|-------|-----------|----------|
| Flow Architect | 📐 | Create 10 flows | +50 |
| Zen Master | ☯️ | Complete 10 tasks in Zen mode | +75 |
| Pinned Planner | 📌 | Use scheduled (pinned) nodes in 5 flows | +50 |
| Lucky Spinner | 🎰 | Win 10 roulette prizes | +50 |

### 🌟 Special / Hidden

| Badge | Emoji | Condition | XP Bonus |
|-------|-------|-----------|----------|
| Level 10 | ⭐ | Reach Level 10 | +100 |
| Level 25 | 💎 | Reach Level 25 | +250 |
| Level 50 | 👑 | Reach Level 50 | +500 |
| Comeback Kid | 💪 | Complete task on-time after 3 consecutive fails | +50 |

---

## How It Works

### Trigger Points

Achievements are checked **after specific events** (not polled):

| Event | Checked At | What's Evaluated |
|-------|-----------|-----------------|
| Task completion | `POST /tasks/:id/complete` response | Streaks, speed, focus, task count, XP milestones, personal records |
| Flow completion | `POST /flows/:id/complete` response | Perfect run, flow count, consecutive days |
| Level up | Inside `completeTask` | Level milestones |

### Data Sources (Already Tracked)

| Stat | Source |
|------|--------|
| Total tasks completed | `Task.find({ status: 'completed' })` or counter on User |
| Total XP | `User.points` |
| Current level | `User.level` |
| Streak count | Sent from frontend in `completeTask` body |
| Focus overlay usage | `usedFocusOverlay` in `completeTask` body |
| Personal records | `isPersonalRecord` in `completeTask` response |
| Session mode | `sessionMode` in `completeTask` body |
| Task time remaining | `timeRemainingPercent` in `completeTask` body |

### New Counters Needed on User Model

To avoid expensive queries, add lightweight counters:

```js
// Add to UserSchema (user.js)
stats: {
    tasksCompleted: { type: Number, default: 0 },
    personalRecords: { type: Number, default: 0 },
    focusTasks: { type: Number, default: 0 },
    earlyFinishes: { type: Number, default: 0 },
    zenTasks: { type: Number, default: 0 },
    rouletteWins: { type: Number, default: 0 },
    bestStreak: { type: Number, default: 0 },
    flowsCompleted: { type: Number, default: 0 },
    flowsCreated: { type: Number, default: 0 },
    consecutiveDays: { type: Number, default: 0 },
    lastActiveDate: { type: Date, default: null },
    pinnedFlows: { type: Number, default: 0 }
}
```

---

## Badge Model (Existing — Minor Tweak)

The existing `Badge` model at [backend/models/badge.js](file:///d:/Study/IUT%20-%205/The-Existential-Choreography-Planner/backend/models/badge.js) has:
- `name`, `iconUrl`, `criteria`, `threshold`

> [!IMPORTANT]
> Instead of storing badges in the DB as seeded documents (which adds deployment complexity), define achievements as a **static config** in a utility file. The User model stores earned badge **keys** (strings) instead of ObjectId refs.

### Proposed Change

```js
// User.badges changes from ObjectId[] to:
badges: [{
    key: String,           // e.g. 'first_steps'
    unlockedAt: Date
}]
```

### Achievement Definitions (New File)

```
backend/utils/achievements.js  — static definitions + check functions
```

---

## Backend API

### `GET /users/me/achievements`
Returns all achievements with unlock status:
```json
{
    "achievements": [
        { "key": "first_steps", "name": "First Steps", "emoji": "🐣",
          "description": "Complete your first task",
          "category": "milestone", "xpBonus": 25,
          "unlocked": true, "unlockedAt": "2026-03-01T..." },
        { "key": "century", "name": "Century", "emoji": "💯",
          "description": "Complete 100 tasks",
          "category": "milestone", "xpBonus": 200,
          "unlocked": false, "progress": { "current": 42, "target": 100 } }
    ]
}
```

### Achievement evaluation (in `completeTask`)
After XP calculation, call `checkAchievements(user, context)` → returns array of newly unlocked badges → include in response so frontend can show celebration.

---

## Frontend

### Achievement Showcase (Account Page)
- Grid of badge cards: locked (grayed out) vs unlocked (glowing)
- Each shows emoji, name, description, progress bar if not yet unlocked
- Unlocked badges show unlock date

### Unlock Notification (In Flow)
- When a badge unlocks during a flow, show a toast: `🏅 Achievement Unlocked: First Steps 🐣 +25 XP`
- Plays after the PostTaskReview XP result, before Continue

---

## Integration with Existing System

| Gamification Part | How Badges Interact |
|-------------------|---------------------|
| **XP** | Badge unlock awards one-time bonus XP (added to `user.points`) |
| **Levels** | Level-based badges (10, 25, 50) check `user.level` |
| **Streaks** | Streak badges check `context.streakCount` at task completion |
| **Energy** | No interaction — badges don't cost or grant energy |
| **Roulette** | "Lucky Spinner" badge counts roulette wins |
| **Scheduled Nodes** | "Pinned Planner" badge counts pinned-node flows |

---

## Implementation Phases

| Phase | Work |
|-------|------|
| **8A** | Badge definitions file, User.stats counters, schema migration |
| **8B** | `checkAchievements()` logic + wire into `completeTask` and `completeFlow` |
| **8C** | `GET /users/me/achievements` API endpoint |
| **8D** | Frontend: Achievement Showcase on Account page |
| **8E** | Frontend: Unlock toast notification during flows |
