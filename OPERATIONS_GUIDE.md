# 📘 System Operations Guide

> High-level overview of how to use **The Existential Choreography Planner** — a gamified task management platform with flow-based planning, timed execution, and competitive features.

---

## 1. 🔐 Account & Authentication

| Action | How |
|--------|-----|
| **Register** | Go to `/register` → fill name, username, email, password → Submit |
| **Login** | Go to `/login` → enter email + password → Submit |
| **Forgot Password** | Login page → "Forgot Password" → enter email → check inbox for reset link |
| **Edit Profile** | Sidebar → 👤 Account → click "Edit" → update name, username, bio, avatar → Save |

### ✅ Test Cases
1. Register a new account → verify redirect to Dashboard
2. Logout → Login with credentials → verify Dashboard loads
3. Try registering with an existing username → should show error
4. Update avatar and bio → verify changes persist after refresh

---

## 2. 📊 Dashboard

| Element | Description |
|---------|-------------|
| **Stats Bar** | Shows your Level, XP progress, and Energy bar |
| **+ Create Flow** | Opens modal to create a new flow with title/description/tags |
| **+ Create Task** | Opens modal to create a standalone task |
| **Recent Flows** | Lists your flows with status badges (🔒 Private / ⏳ Pending / 🌍 Public / ❌ Rejected) |
| **Delete Flow** | Hover over any flow → click 🗑️ → confirm deletion |

### ✅ Test Cases
1. Create a new flow → verify it appears in "Recent Flows"
2. Hover a flow row → verify 🗑️ icon appears → delete with confirmation
3. Check that status badge reflects correct sharing state

---

## 3. 🎨 Flow Editor (Canvas)

### Building a Flow
| Action | How |
|--------|-----|
| **Add Task Node** | Double-click canvas OR use toolbar "Add Node" |
| **Add Special Nodes** | Toolbar → "Start", "End", "Decision" buttons |
| **Edit Node** | Click node → edit panel opens on right (title, duration, difficulty, session mode) |
| **Connect Nodes** | Drag from one node's handle to another to create an edge |
| **Delete Node** | Select node → Edit Panel → "Delete" button |
| **Templates** | When adding a node, choose from: 📖 Study, ✍️ Practice, 📝 Review, 🏋️ Exercise, 🎯 Custom |
| **Difficulty** | Easy (🟢 25XP) / Medium (🟡 50XP) / Hard (🔴 100XP) — auto-sets energy & points |
| **Duration** | Quick presets: 15m, 30m, 45m, 1hr — or type custom |
| **Scheduled Tasks** | Toggle 📌 "Pin to time" → set a specific clock time for the task |

### Decision Nodes
- Add a Decision (diamond) node → set the question as the title
- Connect outgoing edges → label each edge (e.g., "Yes" / "No")
- During flow runs, a popup shows the question + choice buttons

### ✅ Test Cases
1. Create a flow: Start → Task1 → Task2 → End
2. Add a Decision node between tasks → label edges "Yes" and "No"
3. Pin a task to a time → verify the 📌 badge and time display
4. Connect tasks → verify edge arrows render correctly
5. Try connecting a later-pinned node to an earlier one → should show warning

---

## 4. ▶️ Flow Runner (Execution)

| Control | Description |
|---------|-------------|
| **▶ Start Flow** | Toolbar button — begins execution from the Start node |
| **⏸ Pause / ▶ Resume** | Pause/resume the active timer (also: Space key) |
| **⏭ Skip** | Skip the current task (0 XP, energy penalty) |
| **✓ Done** | Mark task as finished early (may trigger bonus roulette) |
| **🔴 Stop** | Stop the entire flow run |
| **📊 Schedule** | Toggle the schedule timeline sidebar |

### Task Review (after each task)
When a task timer ends, a review popup appears:
- ✅ **"Nailed it!"** → full XP awarded
- ⚠️ **"Mostly did it"** → partial XP
- ❌ **"Got distracted"** → 0 XP + reason logged
- ⏭ **Skipped** → 0 XP + energy penalty

### Focus Mode
- Click **"Enter Focus"** during a running task
- Full-screen overlay with: countdown ring, motivational quotes, YouTube background (if session has playlist)
- Toggle 🎬 (video) and 🔊 (audio) independently
- When both off → default gradient background

### Flow Completion
- When the End node is reached: celebration screen + flow bonus XP
- **Perfect Run** (all tasks on time): +100 XP
- **Great Run** (≥80% on time): +50 XP

### ✅ Test Cases
1. Create a simple flow (Start → Task → End) → Start Flow → let timer run → review → verify XP popup
2. Complete a task early → verify Reward Roulette spins
3. Enter Focus Mode → verify overlay shows countdown + quotes
4. Pause flow with Space → verify "PAUSED" label → resume
5. Skip a task → verify 0 XP and energy penalty
6. Complete all tasks on time → verify "Perfect Run" bonus

---

## 5. 🎮 Gamification

### XP & Leveling
- XP earned from completing tasks (modified by difficulty, energy, streaks, focus mode)
- Level formula: higher levels require progressively more XP
- Titles every 5 levels: 🌱 Seedling → ⚡ Apprentice → 🔥 Focused → 💎 Disciplined → 🏆 Master → 👑 Grandmaster → 🌟 Legendary

### Energy System
- Max 100 ⚡ — regenerates over time (10/hr)
- Low energy reduces XP rewards (not blocked, just reduced)
- Zen tasks restore +5 ⚡, first flow of the day +10 ⚡

### Streaks
- Consecutive on-time completions chain into streaks
- Bonuses: 2x → +10%, 3x → +20%, 5x → +30%, 10x → +50%
- Breaking streak shows "💔 Streak lost"

### Badges & Achievements
- Unlocked by milestones: tasks completed, streaks, perfect runs, etc.
- View all badges on Account page → Achievement Showcase
- Progress bars show how close you are to each badge

### Reward Roulette
- Triggered when a task is completed ahead of schedule
- Prizes: bonus XP, energy refill, cosmetic unlocks

### ✅ Test Cases
1. Complete 3 tasks in a row on time → verify streak counter shows 3
2. Check Dashboard stats bar → verify XP and level are updating
3. Go to Account → Achievement Showcase → verify badge unlock progress
4. Complete a task early → verify Roulette spins and reward is applied

---

## 6. 🌍 Flow Sharing & Explore

### Sharing a Flow
| Status | Badge | Meaning |
|--------|-------|---------|
| 🔒 Private | Default | Only you can see it |
| ⏳ Pending | Submitted | Waiting for admin review |
| 🌍 Public | Approved | Visible in Explore gallery |
| ❌ Rejected | Rejected | Admin rejected — you can revise & resubmit |

**User Workflow:**
1. Open your flow → click the share button (🔒 Private)
2. A modal explains the action → confirm to submit for review
3. Status changes to ⏳ Pending
4. Wait for admin approval
5. If approved → 🌍 Public. If rejected → ❌ Rejected with admin's note → you can revise and resubmit

### Explore Page
- Sidebar → 🌍 Explore
- Browse all approved public flows
- Clone any flow to your own collection

### ✅ Test Cases
1. Submit a private flow for review → verify status changes to ⏳ Pending
2. As admin, approve the flow → verify it becomes 🌍 Public
3. Go to Explore → find the published flow → Clone it → verify copy in your Dashboard
4. As admin, reject a flow with a note → verify user sees ❌ Rejected + note → user revises and resubmits

---

## 7. 🛡️ Admin Panel

Access: Sidebar → 🛡️ Admin Panel (visible only to admin users)

### Tabs

| Tab | Function |
|-----|----------|
| **📋 Pending Flows** | Review flows submitted for publishing — Approve / Reject (with note) / View Flow |
| **👥 User Management** | View all users, change roles (user ↔ admin), toggle active status |
| **🎭 Sessions** | Create/edit/delete session modes with YouTube playlists and motivational quotes |

### ✅ Test Cases
1. Go to Pending Flows → click "👁️ View Flow" → verify flow opens in editor
2. Approve a flow → verify it appears in Explore
3. Reject a flow with a note → verify the user sees the rejection
4. Create a new session with a YouTube playlist URL + quotes → verify it appears as a card
5. Edit a session → change the playlist → verify update saves
6. Delete a session → verify it's removed

---

## 8. 🎭 Session Modes

### Admin-Created (System Sessions)
- Admin Panel → 🎭 Sessions → "+ Add Session"
- Set: name, emoji, YouTube playlist URL, motivational quotes, rotation interval
- These sessions are available to **all users** when editing task nodes

### User-Created (Personal Sessions)
- Account page → 🎵 My Sessions → "+ Add"
- Create personal sessions with your own YouTube playlists
- Your custom sessions appear alongside admin sessions in the task node editor
- **Override rule**: If you assign your own session to a task, it overrides the admin default

### During Focus Mode
- The session's YouTube playlist plays as a **blurred video background** with audio
- Users can toggle **video** and **audio** independently
- Turning both off → default gradient background
- Quotes from the session rotate on a configurable timer

### ✅ Test Cases
1. Admin creates a session with YouTube playlist + quotes
2. User opens flow editor → clicks a task → selects the new session in "Session Mode"
3. Run the flow → Enter Focus Mode → verify blurred video + audio + rotating quotes
4. Toggle video off → verify gradient shows instead
5. Toggle audio off → verify audio stops
6. User creates personal session on Account page → verify it appears in node editor dropdown

---

## 9. 🏆 Leaderboard

- Sidebar → 🏆 Leaderboard
- Two views: **🌟 All Time** and **📅 This Week**
- Top 3 shown on a podium (🥇🥈🥉) with gradient cards
- Full ranking table: rank, player, level, XP, tasks, badges, streak
- Your own row is highlighted in green

### ✅ Test Cases
1. Visit Leaderboard → verify your user appears in the list
2. Toggle between "All Time" and "This Week" → verify data changes
3. Verify your row is highlighted green
4. Complete tasks to earn XP → refresh leaderboard → verify rank updates

---

## 10. ⏱ Schedule Timeline

- Visible during flow runs → click 📊 in toolbar
- Shows a timeline of all tasks with planned vs actual times
- Pinned tasks (📌) show at their fixed times
- Flexible tasks fill gaps between pinned tasks
- Each entry turns green (on time) or red (late) as you progress

### ✅ Test Cases
1. Create a flow with 3 tasks (one pinned to a specific time)
2. Start the flow → open Schedule Timeline
3. Verify pinned task shows at its scheduled time
4. Complete tasks → verify timeline entries update with actual times

---

## Navigation Reference

| Sidebar Link | Route | Description |
|-------------|-------|-------------|
| 🏠 Dashboard | `/dashboard` | Home — stats, create flows, recent flows |
| 🌍 Explore | `/explore` | Public flow gallery |
| 🏆 Leaderboard | `/leaderboard` | XP rankings |
| 👤 Account | `/account` | Profile, achievements, my sessions |
| 🛡️ Admin Panel | `/admin` | Admin only — flows review, users, sessions |

---

*Last Updated: March 2026*
