# 🎮 Flow Runner — Feature Roadmap

> A gamified task execution engine where users design flows on a visual canvas, then **run them live** with timers, notifications, accountability, and rewards.

---

## Phase 1 — Canvas UX Improvements ✏️

### Quick Interactions
- **Double-click canvas** to instantly add a new node (skip toolbar)
- **One-click status cycling** — Click a node to cycle: pending → in-progress → completed
- **Completion animation** — Confetti burst + floating "+50 XP ⭐" when a task completes

### Task Templates
- Pre-built templates instead of blank nodes:
  - 📖 Study Session (⚡10, ⭐50, 45 min)
  - ✍️ Practice (⚡5, ⭐25, 30 min)
  - 📝 Review (⚡3, ⭐15, 15 min)
  - 🏋️ Exercise (⚡15, ⭐75, 60 min)
  - 🎯 Custom

### Difficulty Selector
- Replace manual energy/points with a **Easy / Medium / Hard** toggle
- Auto-fills energy cost and point reward based on difficulty
- Users can still override manually if they want

---

## Phase 2 — Timed Tasks & Flow Runner ⏱️

### Timer on Nodes
- Each task has a `duration` field (quick presets: 15m / 30m / 45m / 1hr / Custom)
- Live countdown displayed directly on the node during execution
- Circular progress ring around the active node

### Flow Execution Engine
- **"▶ Start Flow"** button in the toolbar
- Executes tasks in dependency order (respects edge connections)
- States: `idle → running → paused → completed`
- Ability to **pause** and **resume** the flow

### Focus Mode
- When a task starts, the canvas dims and the active node expands into a centered **focus card**
- Big circular countdown animation
- Rotating motivational quotes: *"You're 60% through! Keep going 🔥"*
- Ambient sound selector in the corner (lo-fi / rain / silence / white noise)

### Browser Notifications
- 🔔 **Pre-task**: *"⚡ 'Study Math' starting in 5 minutes!"*
- 🔔 **Timer end**: *"⏰ Time's up for 'Study Math'!"*
- Works even when tab is minimized
- Later: add email notification support

---

## Phase 3 — Review & Accountability 📋

### Post-Task Review Popup
- When timer ends, popup asks: **"Did you finish?"**
  - ✅ **Yes** → Full XP awarded
  - ❌ **No** → "What happened?"
    - Dropdown: `Got distracted / Too hard / Took longer / Emergency / Skipped`
    - Optional: free-text note

### Scoring & Penalties
- ✅ Finished **on time** → Full XP + time bonus
- ✅ Finished **early** → Full XP + bonus + reward roulette spin
- ⚠️ Finished **late** → Partial XP (decays per overtime minute)
- ❌ **Failed** → Energy penalty + reason logged
- ❌ **Skipped** → Double penalty

### Task History & Reflection
- Each task stores a `history[]` of past attempts:
  - `{ date, outcome, reason, actualTime, estimatedTime }`
- **Before each task runs**, show a reflection card:
  - On failure: *"⚠️ Last time: Failed — 'Got distracted'. Let's nail it today!"*
  - On success: *"🔥 Last time: Completed in 38/45 min! Can you beat your record?"*
- After several runs, **auto-suggest better durations**: *"Based on history, this takes ~40 min"*

---

## Phase 4 — Combo System & Rewards 🎰

### Streak / Combo Multiplier
- Complete **3 tasks on time in a row** → **2x XP**
- Complete **5 in a row** → **3x XP + "Unstoppable!" badge**
- Break the streak → Multiplier resets: *"Streak lost 💔 — Start a new one!"*
- Visual: combo counter displayed on screen during flow execution

### Reward Roulette
- Triggered when task is completed **ahead of schedule**
- Mini spin wheel with prizes:
  - +25 bonus XP
  - Energy refill
  - "Golden Hour" — next task gives 2x points
  - Cosmetic unlock — new node color / theme / border style

### XP Animations
- Floating "+50 XP" rises from completed nodes
- Level-up celebration when XP threshold is crossed
- Sound effects (optional, toggleable)

---

## Phase 5 — Daily Schedule & Summary 🗓️

### Schedule View
- When starting a flow, tasks map to the **actual time of day**:
  ```
  9:00 ─── Study Math (45m) ─── 9:45
  9:50 ─── Practice Problems (30m) ─── 10:20
  10:30 ─── Review Notes (15m) ─── 10:45
  ```
- Each block shows live progress, turns green/red as you complete/miss
- Drag to reschedule tasks within the day

### End-of-Day Report Card
- Summary screen after all tasks in a flow complete:
  - ✅ Tasks completed vs ❌ failed
  - ⏱️ Total actual time vs estimated time
  - ⭐ XP earned + penalties
  - 🔥 Streak status
  - 📈 Trend: *"You're 20% faster than last week!"*

### Daily Energy System
- Energy refills daily (or over time)
- Adds urgency — can't do unlimited tasks
- Bonus energy earned through streaks

---

## Phase 6 — Polish & Social 🌟

### Visual Enhancements
- **Node glow effects** — Completed = green glow, In-progress = pulsing, Failed = red
- **Animated edge particles** — Dots flowing along edges to show dependency direction
- **Auto-layout** — One-click button to beautifully arrange all nodes
- **Canvas themes** — Dark mode, light mode, custom backgrounds

### Social (Future)
- Share flows publicly for others to clone
- Leaderboard — top streaks, most XP this week
- Challenge friends to complete the same flow

---

## Build Order

| Priority | Phase | Status |
|----------|-------|--------|
| � Done | Phase 1 — Canvas UX | ✅ Complete |
| 🔴 Now | Phase 2 — Timers & Flow Runner | Not started |
| 🟡 Next | Phase 3 — Review & Accountability | Not started |
| 🟢 Later | Phase 4 — Combos & Rewards | Not started |
| 🟢 Later | Phase 5 — Schedule & Summary | Not started |
| ⚪ Future | Phase 6 — Polish & Social | Not started |
