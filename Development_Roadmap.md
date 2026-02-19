# 🎮 Development Roadmap

> Implementation plan and build order for The Existential Choreography Planner.
> For a full catalog of what each feature does, see [Feature_List.md](./Feature_List.md).
> For gamification system details, see [GAMIFICATION_SYSTEM.md](./GAMIFICATION_SYSTEM.md).

---

## Phase 1 — Canvas UX Improvements ✅

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

### Special Node Types

#### 🟢 Start Node (Rounded)
- Entry point of the flow — **"▶ Start Flow"** begins execution here
- A flow **must have exactly one Start node** to be runnable
- Auto-created when a new flow is first opened (if no Start exists)
- Stores the **flow start time** for schedule view
- No timer or task data — just a trigger point

#### 🔴 End Node (Rounded)
- Marks flow completion — when the runner reaches this, it triggers:
  - **Celebration screen** / confetti burst
  - **End-of-day report card** (Phase 5)
  - **Completion bonus XP** from the flow
- A flow **must have exactly one End node**
- Auto-created alongside Start node

#### 🔷 Decision Node (Diamond)
- **Branching point** — pauses the flow and asks the user a question
- The node title becomes the **question** (e.g., *"Did you understand the material?"*)
- Each outgoing edge is a **labeled path** (e.g., "Yes" / "No" / custom)
- When the runner reaches a decision:
  1. Shows a **popup with the question + options** (one button per outgoing edge)
  2. User picks an answer
  3. Runner follows that edge to the next node
- Enables **loops** (e.g., "Didn't get it?" → go back to Study) and **branches**
- No timer, points, or energy — purely a routing mechanism

#### Example Flow
```
🟢 Start → 📖 Study Math → 🔷 "Got it?" 
                               ├─ ✅ Yes → ✍️ Practice → 🔴 End
                               └─ ❌ No  → 📝 Re-read Notes → 📖 Study Math (loop)
```

### Edge Labels
- Edges from Decision nodes have **text labels** ("Yes", "No", or custom)
- Labels are editable by clicking the edge or from the Decision node's edit panel
- Regular task→task edges remain unlabeled

---

### Timer on Nodes
- Each task has a `duration` field (quick presets: 15m / 30m / 45m / 1hr / Custom)
- Live countdown displayed directly on the node during execution
- Circular progress ring around the active node

### Flow Execution Engine
- **"▶ Start Flow"** button in the toolbar
- Finds the **Start node** and follows edges in dependency order
- At **task nodes**: runs the timer, then moves to the next
- At **decision nodes**: pauses and shows choice popup
- At **End node**: triggers completion
- States: `idle → running → paused → completed` ✅
- Ability to **pause**, **resume**, **skip**, and **stop** the flow ✅
- Progress bar + live timer in toolbar ✅
- Space key to toggle pause/resume ✅

### Session Modes 🎭 *(Currently hardcoded — will become fully DB-driven in Phase 7)*
- Each task has a **session mode** that controls the focus overlay experience
- Mode is set **per task node** in the edit panel, with defaults per template
- When running, click **"Enter Focus"** to open the full-screen overlay:
  - Background (gradient or YouTube video, based on mode config)
  - Big circular countdown ring (SVG animation)
  - Rotating motivational quotes (interval configurable per mode)
  - Ambient audio with volume control (built-in files or YouTube playlist)
  - Pause/Resume/Skip controls
  - Smooth crossfade when transitioning between tasks with different modes
- See **Phase 7** for the full dynamic session modes system

### Browser Notifications
- 🔔 **Task start**: *"⚡ Starting: Study Math"*
- 🔔 **Timer end**: *"⏰ Time's up for Study Math!"*
- Permission requested on first flow run
- Works even when tab is minimized

---

## Phase 3 — Gamification Core & Review 📋

> 📘 Full design reference: [GAMIFICATION_SYSTEM.md](./GAMIFICATION_SYSTEM.md)

### Partition 3A — Post-Task Review & XP Engine
- When timer ends, show **review popup** instead of auto-advancing:
  - ✅ "Yes, nailed it!" → full XP (×1.0 to ×1.3 if early)
  - ⚠️ "Mostly, need more time" → late XP (×0.7 base, −2% per overtime min, min ×0.3)
  - ❌ "No, got distracted" → 0 XP + reason logged
  - ⏭ Skipped → 0 XP + energy penalty (−5 ⚡)
- **Failure reasons**: `distracted` / `too_hard` / `took_longer` / `emergency` / `skipped` + optional free-text note
- **Backend endpoint** `PATCH /tasks/:id/complete` — calculates XP using:
  ```
  outcome  = baseMultiplier - max(0, overtimeMinutes × 0.02)   // clamp at 0.3
  energy   = userEnergy >= 20 ? 1.0 : userEnergy >= 1 ? 0.5 : 0.0
  earnedXP = floor(baseXP × outcome × energy × (1 + streakBonus) × (1 + focusBonus))
           + dailyBonus + personalRecordBonus
  ```
  - Updates `user.points`, `user.energy`, recalculates `user.level`
  - Returns `{ earnedXP, newEnergy, newLevel, levelUp, title }`
- **Energy brackets** (never blocks, just reduces rewards):
  - ≥ 20 ⚡ = full XP | 10–19 ⚡ = warning | 1–9 ⚡ = XP halved | 0 ⚡ = 0 XP
- **Energy recovery**: Zen tasks +5 ⚡, first flow/day +10 ⚡, 8+ hrs away = full recharge
- **Bonus XP**: First flow/day +50 XP, personal record +25 XP, focus overlay active +15%
- **Flow completion bonus**: all on time = +100 XP "🏆 Perfect Run", ≥80% = +50 XP "🔥 Great Run"
- Runner calls the API after each task review

### Partition 3B — Level System & Dashboard Stats
- **Level formula**: `level = floor(0.5 + sqrt(1 + 8 × totalXP / 100) / 2)`
- **Titles** every 5 levels: 🌱 Seedling → ⚡ Apprentice → 🔥 Focused → 💎 Disciplined → 🏆 Master → 👑 Grandmaster → 🌟 Legendary
- **Dashboard stats bar** at the top:
  - Level + title + XP progress bar
  - Energy bar with regen timer ("Full in 3h 40m")
  - Today's stats: tasks done, XP earned, current streak

### Partition 3C — Task History & Reflection
- Each task stores a `history[]` of past attempts:
  - `{ date, outcome, reason, actualTime, estimatedTime }`
- **Before each task runs**, show a reflection card:
  - On failure: *"⚠️ Last time: Failed — 'Got distracted'. Let's nail it today!"*
  - On success: *"🔥 Last time: Completed in 38/45 min! Can you beat your record?"*
- After several runs, **auto-suggest better durations**: *"Based on history, this takes ~40 min"**

---

## Phase 4 — Streaks, Animations & Rewards 🎰

### Partition 4A — Streak System
- Track **consecutive on-time completions** within a flow run
- Escalating bonuses:
  - 2 in a row → +10% XP "Double Kill 🔥"
  - 3 in a row → +20% XP "Unstoppable 🔥🔥"
  - 5 in a row → +30% XP "On Fire 🔥🔥🔥"
  - 10 in a row → +50% XP "GODLIKE 💀🔥"
- Streak breaks on: fail, skip, or late completion
- Streak counter visible in toolbar during runs
- Breaking streak shows: *"Streak lost 💔 — Start fresh!"*

### Partition 4B — Level-Up & XP Animations
- Floating "+50 XP" rises from completed nodes (already partially exists)
- **Level-up celebration** when XP threshold is crossed
  - Full-screen flash + *"LEVEL UP! 🔥 Focused"*
  - New title revealed with animation
- Sound effects (optional, toggleable)

### Partition 4C — Reward Roulette (Optional)
- Triggered when task is completed **ahead of schedule**
- Mini spin wheel with prizes:
  - +25 bonus XP
  - Energy refill (+20 ⚡)
  - "Golden Hour" — next task gives 2x points
  - Cosmetic unlock — new node color / theme / border style

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
  - ⭐ XP earned + flow completion bonus
  - 🔥 Streak status
  - 📈 Trend: *"You're 20% faster than last week!"*

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

## Phase 7 — Dynamic Session Modes 🎭

> Replaces the current hardcoded `sessionModes.js` with a fully DB-driven, admin-configurable, user-customizable system.

### Partition 7A — SessionMode Model & API
- Create `SessionMode` MongoDB model with fields:
  - `type` (`system` | `admin` | `user`), `createdBy`, `forkedFrom`
  - `slug`, `emoji`, `label`, `description`
  - `backgroundType` (`gradient` | `video`), `gradient[]`, `videoUrl`
  - `ring`, `accent` (colors)
  - `audioSource` (`builtin` | `youtube_playlist`), `audioKey`, `youtubePlaylistId`
  - `quotes[]`, `quoteIntervalSeconds`
  - `isPublished`, `isDefault`
- Seed script inserts the current 5 modes as `type: 'system'` on first run
- API endpoints:
  - `GET /session-modes` — list all available (system + admin published + user's own)
  - `GET /session-modes/:id` — get single mode
  - `POST /session-modes` — create (admin → published, user → personal)
  - `PUT /session-modes/:id` — update (own modes only)
  - `DELETE /session-modes/:id` — delete (own modes only, admins can delete any)
  - `POST /session-modes/:id/fork` — clone into user's personal collection
- Remove hardcoded `sessionModes.js` — frontend fetches all modes from API
- `FocusOverlay`, `NodeEditPanel`, `FlowEditor` consume modes from a context/store

### Partition 7B — Admin Mode Builder
- Admin-only page: **Mode Builder**
  - Emoji picker, label, description
  - Background: gradient editor (two-color picker) **or** YouTube video URL (with preview)
  - Ring & accent color pickers
  - Audio: built-in file selector **or** YouTube playlist URL
  - Quotes: list editor (add/remove/reorder) + rotation interval slider
  - **Live preview** panel showing Focus Overlay appearance
  - Publish toggle
- CRUD operations for admin-curated modes

### Partition 7C — User Preferences Tab
- New **Preferences** page in user settings/dashboard:
  - **Browse Modes** — gallery of system + admin-published modes as cards
  - **Try Mode** — preview button to see/hear mode in action
  - **Use As-Is** — quick-select for tasks
  - **Fork & Customize** — clone any mode, tweak colors/audio/quotes/background
  - **Create from Scratch** — blank Mode Builder scoped to user
  - **My Modes** — personal collection with edit/delete

### Partition 7D — YouTube Integration
- **Video backgrounds**: YouTube IFrame API renders a muted, looping video behind the Focus Overlay when `backgroundType === 'video'`
- **Audio playlists**: Hidden YouTube player streams audio from a linked playlist when `audioSource === 'youtube_playlist'`
- Graceful fallback if YouTube is unreachable (show gradient, play silence)

---

## Build Order

| Priority | Phase | Status |
|----------|-------|--------|
| ✅ Done | Phase 1 — Canvas UX | Complete |
| ✅ Done | Phase 2 — Special Nodes, Timers, Flow Runner | Complete (Partitions A–D) |
| ✅ Done | Phase 3A — Post-Task Review & XP Engine | Complete |
| ✅ Done | Phase 3B — Level System & Dashboard Stats | Complete |
| ✅ Done | Phase 3C — Task History & Reflection | Complete |
| 🔴 Now | Phase 4A — Streak System | Next up |
| 🟡 Next | Phase 4B — Level-Up & XP Animations | After 4A |
| 🟢 Later | Phase 4C — Reward Roulette | Optional polish |
| 🟢 Later | Phase 5 — Schedule & Summary | Not started |
| ⚪ Future | Phase 6 — Polish & Social | Not started |
| ⚪ Future | Phase 7A — SessionMode Model & API | Not started |
| ⚪ Future | Phase 7B — Admin Mode Builder | Not started |
| ⚪ Future | Phase 7C — User Preferences Tab | Not started |
| ⚪ Future | Phase 7D — YouTube Integration | Not started |
