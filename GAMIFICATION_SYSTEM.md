# 🎮 Gamification System — Design Reference

> **Purpose**: This document defines how XP, levels, energy, and streaks work across the application.
> It is the single source of truth for scoring logic and should be consulted when implementing any gamification feature.

---

## 1. XP — The Core Currency

XP is earned by completing tasks. It's permanent — you never lose it.

### Base XP (from difficulty)

| Difficulty | Base XP | Energy Cost |
|-----------|---------|-------------|
| 🟢 Easy | 25 XP | 5 ⚡ |
| 🟡 Medium | 50 XP | 10 ⚡ |
| 🔴 Hard | 100 XP | 20 ⚡ |

### Outcome Multipliers

| Outcome | Multiplier | Example (50 base) |
|---------|-----------|-------------------|
| ✅ Finished on time | **×1.0** | 50 XP |
| ⚡ Finished early (≥20% time left) | **×1.3** | 65 XP |
| ⏰ Finished late (ran over timer) | **×0.7** base, then **−2% per extra minute** (min ×0.3) | 35→30 XP |
| ❌ Failed (user says "didn't finish") | **×0.0** | 0 XP |
| ⏭ Skipped | **×0.0** + energy penalty (−5 ⚡) | 0 XP |

### Bonus XP Sources

| Source | Bonus | When |
|--------|-------|------|
| 🔥 Streak bonus | +10% per consecutive on-time task | During a flow run |
| 🌅 First flow of the day | +50 XP flat | First flow completion today |
| 📈 Personal record | +25 XP | Beating your best time on a task |
| 🎯 Full focus bonus | +15% | Completed while Focus Overlay was active |

### XP Formula

```
outcome  = baseMultiplier - max(0, overtimeMinutes × 0.02)   // clamp at 0.3
energy   = userEnergy >= 20 ? 1.0 : userEnergy >= 1 ? 0.5 : 0.0
earnedXP = floor(baseXP × outcome × energy × (1 + streakBonus) × (1 + focusBonus))
         + dailyBonus + personalRecordBonus
```

### Flow Completion Bonus

When a flow reaches the End node, a **flat bonus** is awarded based on flow performance:

| Condition | Bonus |
|-----------|-------|
| All tasks on time | +100 XP "Perfect Run 🏆" |
| ≥80% on time | +50 XP "Great Run 🔥" |
| < 80% on time | +0 XP (no bonus) |

---

## 2. Levels — Visible Progress

### Level Formula

```
level = floor(0.5 + sqrt(1 + 8 × totalXP / 100) / 2)
```

Triangular progression — each level takes slightly more XP:

| Level | Total XP Needed | XP for This Level |
|-------|----------------|-------------------|
| 1 | 0 | — |
| 2 | 100 | 100 |
| 3 | 300 | 200 |
| 4 | 600 | 300 |
| 5 | 1,000 | 400 |
| 10 | 4,500 | 900 |
| 15 | 10,500 | 1,400 |
| 20 | 19,000 | 1,900 |
| 50 | 122,500 | 4,900 |

### Titles (Unlocked by Level)

| Level | Title |
|-------|-------|
| 1 | 🌱 Seedling |
| 5 | ⚡ Apprentice |
| 10 | 🔥 Focused |
| 15 | 💎 Disciplined |
| 20 | 🏆 Master |
| 30 | 👑 Grandmaster |
| 50 | 🌟 Legendary |

---

## 3. Energy — The Pacing System

Energy prevents infinite grinding and encourages balanced daily usage.

### Rules

- **Max energy: 100 ⚡**
- **Regen: 10 ⚡ per hour** (passively, even offline)
- **Consumed on task completion**, not on start
- Full recharge = ~10 hours (covers sleeping)

### Energy Brackets

| Energy Level | Effect |
|-------------|--------|
| ≥ 20 ⚡ | Normal — full XP |
| 10–19 ⚡ | ⚠️ "Running low!" warning in UI |
| 1–9 ⚡ | 🟡 Tasks still work, but XP earned is halved |
| 0 ⚡ | 🔴 "Rest mode" — tasks work but earn 0 XP |

> **Design philosophy**: Energy should never BLOCK the user. It just reduces rewards.

### Energy Recovery Bonuses

| Action | Recovery |
|--------|----------|
| Complete a Zen mode task | +5 ⚡ bonus |
| First flow of the day | +10 ⚡ bonus |
| 8+ hours since last session | Full recharge to 100 ⚡ |

---

## 4. Streaks — Short-Term Momentum

Streaks track consecutive on-time completions **within a single flow run**.

| Streak Count | Bonus | Badge Flash |
|-------------|-------|------------|
| 2 in a row | +10% XP | "Double Kill 🔥" |
| 3 in a row | +20% XP | "Unstoppable 🔥🔥" |
| 5 in a row | +30% XP | "On Fire 🔥🔥🔥" |
| 10 in a row | +50% XP | "GODLIKE 💀🔥" |

- Streak breaks on: **fail**, **skip**, or **late completion**
- Streak counter shows in toolbar during flow runs
- Breaking a streak shows: *"Streak lost 💔 — Start fresh!"*

---

## 5. Post-Task Review — The Outcome Bridge

When a task timer ends, show a quick review popup instead of auto-advancing:

```
┌──────────────────────────────────┐
│   ✅ "Study Math" — Time's Up!   │
│                                  │
│   Did you finish?                │
│                                  │
│   [  ✅ Yes, nailed it!  ]       │
│   [  ⚠️ Mostly, need more time ] │
│   [  ❌ No, got distracted  ]    │
│                                  │
│   Optional: What happened?       │
│   [ Got distracted / Too hard /  │
│     Took longer / Emergency    ] │
│                                  │
│   Optional: Add a note           │
│   [ _________________________  ] │
└──────────────────────────────────┘
```

### Outcome Mapping

| User Response | Status | XP Multiplier | Streak |
|--------------|--------|--------------|--------|
| "Yes, nailed it!" | completed | ×1.0 – ×1.3 | ✅ Continues |
| "Mostly, need more time" | completed (late) | ×0.7 − 2%/min | ❌ Breaks |
| "No, got distracted" + reason | failed | ×0.0 | ❌ Breaks |

### Failure Reason Options

| Reason Key | Label | Stored as |
|-----------|-------|----------|
| `distracted` | 😵‍💫 Got distracted | reason: 'distracted' |
| `too_hard` | 😤 Too hard | reason: 'too_hard' |
| `took_longer` | ⏰ Took longer than expected | reason: 'took_longer' |
| `emergency` | 🚨 Emergency / interruption | reason: 'emergency' |
| `skipped` | ⏭ Deliberately skipped | reason: 'skipped' |

A free-text `note` field allows additional context (max 200 chars).

---

## 6. Dashboard Stats Bar

```
┌──────────────────────────────────────────────────────┐
│  🌟 Level 7 — "Focused"   ⚡ 63/100   🔥 3 streak   │
│  ████████████░░░░  1,200 / 2,800 XP to Level 8      │
└──────────────────────────────────────────────────────┘
```

Shows: level + title, XP progress bar, energy bar with regen ETA, today's stats, best streak.

---

## 7. Data Flow

```
Timer ends → Post-Task Review popup → User picks outcome
  → Calculate XP (base × multiplier × streak × focus)
  → PATCH /tasks/:id { status, outcome, actualTime }
  → Backend updates user (points, energy, level)
  → Response: { earnedXP, newEnergy, newLevel, levelUp? }
  → Frontend: XP popup, level-up animation if needed
  → Advance to next node
```

---

## 8. Implementation Phases

| Phase | What Gets Built | Gamification Parts |
|-------|-----------------|--------------------|
| **Phase 3A** | Post-Task Review popup, backend XP/energy endpoint | Outcome multipliers, XP calculation, energy deduction |
| **Phase 3B** | Dashboard stats bar, level system | Level formula, titles, XP progress bar, energy display |
| **Phase 3C** | Task history & reflection cards | Past outcomes stored, reflection before re-runs |
| **Phase 4A** | Streak system | Streak counter, bonus multipliers, streak UI |
| **Phase 4B** | Level-up & XP animations | Celebration effects, floating XP, sound FX |
| **Phase 4C** | Reward roulette (optional) | Spin wheel on early completion |
