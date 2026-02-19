# 📋 Feature List — The Existential Choreography Planner

> A comprehensive catalog of all features in the application.
> This is a living document — new features are added as they are designed or implemented.

---

## 🔐 Authentication & User Management

### User Registration
- **Purpose**: Allow new users to create accounts
- **How it works**: Users provide full name, username, email, and password. Backend validates uniqueness, hashes the password with bcrypt, and creates a User document in MongoDB. JWT access + refresh tokens are returned on success.

### User Login
- **Purpose**: Authenticate returning users
- **How it works**: Passport.js Local strategy verifies email/password. On success, generates a JWT access token (15m) and refresh token (7d). Tokens are stored in httpOnly cookies.

### Token Refresh
- **Purpose**: Maintain session without re-login
- **How it works**: When the access token expires, the frontend interceptor automatically calls `/auth/refresh` with the refresh token to get a new access token.

### Forgot / Reset Password
- **Purpose**: Account recovery when password is forgotten
- **How it works**: User enters email → backend generates a crypto token, stores it with a 10-minute expiry, and sends a reset link via email (Nodemailer). Reset page validates the token and allows setting a new password.

### User Profile & Account Settings
- **Purpose**: Let users manage their profile information
- **How it works**: Account page displays avatar (with upload), full name, username, email, and bio. Avatar uploads are handled via Multer on the backend.

### Admin User Management
- **Purpose**: Allow admins to view and manage all users
- **How it works**: Admin-only Users page lists all registered users with controls for role changes (user ↔ admin) and account activation/deactivation.

---

## 📊 Dashboard

### Flow List
- **Purpose**: Central hub for managing all flows
- **How it works**: Dashboard fetches the user's flows from the backend and displays them as cards. Each card shows the flow name and provides a link to the Flow Editor.

### Create Flow Modal
- **Purpose**: Quickly create a new flow
- **How it works**: Modal form collects flow name and optional description, then calls `POST /flows` to create it in the database. User is navigated to the new flow's editor.

### Create Task Modal
- **Purpose**: Create standalone tasks (outside flows)
- **How it works**: Modal form with fields for title, description, difficulty, points reward, energy cost, and duration. Submitted via `POST /tasks`.

---

## 🎨 Visual Canvas

### Interactive Node Canvas
- **Purpose**: Visual workspace for designing task flows
- **How it works**: Built on React Flow. Users drag-and-drop nodes, connect them with edges, and arrange them freely on an infinite canvas. Supports zoom, pan, and keyboard shortcuts.

### Node Types
- **Purpose**: Different node shapes serve different roles in a flow
- **How it works**:
  - 🟢 **Start Node** — Flow entry point (rounded, green). Auto-created with new flows.
  - 🔴 **End Node** — Flow completion marker (rounded, red). Auto-created with new flows.
  - 🔷 **Decision Node** — Diamond-shaped branching point. Asks a question and routes to different paths based on the answer.
  - 📋 **Task Node** — Rectangle-shaped work unit with title, description, duration, difficulty, and session mode.

### Task Templates
- **Purpose**: Speed up flow creation with pre-configured task types
- **How it works**: Toolbar offers templates like Study Session, Practice, Review, Exercise, Project Work, and Custom. Each pre-fills difficulty, energy cost, points, duration, and session mode.

### Double-Click to Add
- **Purpose**: Quick node creation
- **How it works**: Double-clicking anywhere on the canvas creates a new task node at that position.

### One-Click Status Cycling
- **Purpose**: Quick status changes without opening edit panel
- **How it works**: Clicking a task node cycles its status: pending → in-progress → completed. Triggers confetti + XP popup on completion.

### Node Edit Panel
- **Purpose**: Detailed configuration of individual nodes
- **How it works**: Side panel appears when a node is selected. Shows fields for title, description, difficulty (Easy/Medium/Hard presets), duration, session mode, and shape. Changes are live-synced to the node.

### Edge Labels
- **Purpose**: Label paths from Decision nodes
- **How it works**: Edges leaving a Decision node display text labels ("Yes", "No", or custom). Labels are editable from the Decision node's edit panel or by clicking the edge.

### Completion Animation
- **Purpose**: Satisfying visual feedback on task completion
- **How it works**: When a task's status is set to "completed", a confetti burst plays and a floating "+XP ⭐" popup rises from the node.

### Keyboard Shortcuts
- **Purpose**: Power-user efficiency
- **How it works**: `Ctrl+S` to save, `Space` to pause/resume flow, `Delete` to remove selected node.

---

## ⏱️ Flow Runner (Execution Engine)

### Flow Execution
- **Purpose**: Run flows live with timed task execution
- **How it works**: "▶ Start Flow" finds the Start node and traverses the graph in dependency order. At each task node, a countdown timer runs. At Decision nodes, a popup asks the user to choose a path. At the End node, a completion celebration triggers. States: `idle → running → paused → completed`.

### Timer System
- **Purpose**: Track time spent on each task
- **How it works**: Each task has a `duration` field (in minutes). During execution, a countdown timer ticks every second. The active node displays the remaining time with a circular progress ring. The toolbar shows a live timer and progress bar.

### Pause / Resume / Skip / Stop
- **Purpose**: Give users control during flow execution
- **How it works**: Toolbar buttons and Space key allow pausing, resuming, skipping ahead to the next task, or stopping the flow entirely.

### Decision Popup
- **Purpose**: Handle branching logic during execution
- **How it works**: When the runner reaches a Decision node, a modal popup displays the node's title as a question with buttons for each outgoing edge label. The user's choice determines which path the runner follows.

### Completion Celebration
- **Purpose**: Reward feeling when a flow finishes
- **How it works**: Full-screen celebration overlay with confetti animation, total XP earned, tasks completed count, and a dismiss button. Triggers when the runner reaches the End node.

### Browser Notifications
- **Purpose**: Alert users even when the tab is minimized
- **How it works**: Uses the Browser Notification API. Permission is requested on first flow run. Notifications fire on task start ("⚡ Starting: ...") and timer end ("⏰ Time's Up!").

---

## 🎭 Session Modes & Focus Overlay

### Dynamic Session Modes (DB-Driven)
- **Purpose**: Fully customizable focus experience — no hardcoded modes. All modes live in the database.
- **How it works**: A `SessionMode` model in MongoDB stores all mode configurations. Modes are organized into three tiers:
  - **System modes** — The initial 5 modes (Focus, Grind, Zen, Sprint, Chill) are seeded into the DB on first setup. They serve as defaults but are editable/deletable by admins.
  - **Admin-curated modes** — Admins create and publish new modes via the Mode Builder. Published modes are discoverable by all users.
  - **User custom modes** — Users create personal modes from scratch or fork (clone + customize) any system/admin mode.
- Each mode stores: emoji, label, description, background config, ring/accent colors, audio source config, quotes list, and quote rotation interval.
- Mode is set per task node in the edit panel. Template defaults map to system modes.

### Admin Mode Builder
- **Purpose**: Allow admins to create, edit, and publish session modes for all users
- **How it works**: Admin-only page with a visual mode editor:
  - **Identity** — Emoji picker, label, description
  - **Background** — Gradient editor (two-color picker) **or** YouTube video URL (rendered as a looping background)
  - **Colors** — Ring color and accent color pickers
  - **Audio** — Built-in audio file selector **or** YouTube playlist URL (plays as background audio)
  - **Quotes** — List editor to add/remove/reorder motivational quotes + configurable rotation interval (in seconds)
  - **Live Preview** — Real-time preview of how the Focus Overlay will look and feel
  - **Publish toggle** — Controls whether the mode is visible to all users

### User Preferences (Mode Customization)
- **Purpose**: Let users explore, customize, and create their own session modes
- **How it works**: A "Preferences" tab accessible from the user's settings/dashboard:
  - **Browse Modes** — Gallery of all system + admin-published modes, shown as cards with mini-previews (gradient, emoji, label, sample quote)
  - **Try Mode** — Quick preview button to see/hear a mode in action before selecting it
  - **Use As-Is** — Select any mode directly for use in tasks
  - **Fork & Customize** — Clone any mode into the user's personal collection, then tweak colors, audio, quotes, timing, and background
  - **Create from Scratch** — Blank Mode Builder (same UI as admin, scoped to the user's account)
  - **My Modes** — Personal collection with edit and delete controls

### Focus Overlay
- **Purpose**: Immersive full-screen experience for deep work
- **How it works**: Toggled via toolbar "🎯 Focus" button during execution. Consumes mode data from the API (no hardcoded config). Displays:
  - Mode-themed background (gradient **or** looping YouTube video, based on mode config)
  - Large SVG countdown ring with progress percentage
  - Task title and description
  - Rotating motivational quotes (cycle interval configurable per mode, with fade transitions)
  - Bottom control bar with pause/resume, skip, exit, and volume controls

### Ambient Audio
- **Purpose**: Background audio to enhance focus
- **How it works**: Supports two audio sources based on mode config:
  - **Built-in audio** — Local audio files managed via `useAmbientAudio` hook with HTML5 Audio elements
  - **YouTube playlist** — Embedded hidden YouTube player streams audio from a linked playlist
  - Supports volume control and smooth crossfading when transitioning between tasks with different audio sources

---

## 🎮 Gamification System *(Planned)*

> 📘 Full design reference: [GAMIFICATION_SYSTEM.md](./GAMIFICATION_SYSTEM.md)

### XP & Scoring
- **Purpose**: Meaningful reward for task completion
- **How it works**: Base XP from difficulty (25/50/100) multiplied by outcome (on-time ×1.0, early ×1.3, late ×0.7 decaying, failed ×0.0). Bonus XP from streaks, focus mode, daily first flow, and personal records.

### Energy System
- **Purpose**: Pacing mechanic to encourage balanced daily usage
- **How it works**: 100 max energy, regens at 10/hr passively. Deducted on task completion. Low energy reduces XP rewards (halved at 1–9, zero at 0). Never blocks users from working. Recovery bonuses from Zen mode tasks and first flow of the day.

### Level & Title System
- **Purpose**: Long-term progression and status
- **How it works**: Triangular XP progression formula. Levels unlock titles (🌱 Seedling → 🌟 Legendary). Displayed on dashboard stats bar alongside XP progress.

### Post-Task Review
- **Purpose**: Honest self-assessment drives better scoring
- **How it works**: When a timer ends, a popup asks "Did you finish?" with three options (Yes/Mostly/No). Failed tasks prompt a reason dropdown and optional note. Response determines XP multiplier and streak status.

### Streak System *(Planned)*
- **Purpose**: Short-term momentum within flow runs
- **How it works**: Consecutive on-time completions build a streak with escalating XP bonuses (+10% to +50%). Breaks on fail, skip, or late. Streak counter visible in toolbar.

### Task History & Reflection *(Planned)*
- **Purpose**: Learn from past attempts
- **How it works**: Each task stores a history of attempts with outcome, reason, and timing. Before re-running a task, a reflection card shows past performance and may suggest better durations.

### Reward Roulette *(Planned)*
- **Purpose**: Surprise rewards for early completion
- **How it works**: Spin wheel triggered on ahead-of-schedule finishes. Prizes include bonus XP, energy refills, XP multipliers, and cosmetic unlocks.

---

## 🗓️ Schedule & Summary *(Planned)*

### Schedule View
- **Purpose**: Map flow tasks to real time-of-day slots
- **How it works**: Tasks display as time blocks (e.g., 9:00–9:45 Study Math). Blocks show live progress and turn green/red on completion/failure. Drag to reschedule.

### End-of-Day Report Card
- **Purpose**: Summarize daily performance
- **How it works**: After flow completion, shows tasks completed vs failed, actual vs estimated time, total XP + flow completion bonus, streak status, and weekly trend.

---

## 🌟 Visual Polish *(Planned)*

### Node Glow Effects
- **Purpose**: Visual status indication on canvas nodes
- **How it works**: Completed nodes glow green, in-progress nodes pulse, failed nodes glow red.

### Animated Edge Particles
- **Purpose**: Show flow direction on edges
- **How it works**: Animated dots flow along edges to visualize dependency direction.

### Auto-Layout
- **Purpose**: Automatic node arrangement
- **How it works**: One-click button arranges all nodes in a clean, readable layout.

### Canvas Themes
- **Purpose**: Customizable workspace appearance
- **How it works**: Dark mode, light mode, and custom background options.

---

## 👥 Social Features *(Future)*

### Public Flow Sharing
- **Purpose**: Share flows for others to clone and use
- **How it works**: Users can publish flows publicly. Others can browse and clone them.

### Leaderboard
- **Purpose**: Competitive motivation
- **How it works**: Rankings by top streaks and most XP earned this week.

### Friend Challenges
- **Purpose**: Social accountability
- **How it works**: Challenge friends to complete the same flow and compare results.
