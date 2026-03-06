# 🎨 Canvas Frontend — Deep Dive

## Component Architecture

```
FlowEditor.jsx (Page — state owner)
├── CanvasToolbar.jsx (top bar — zoom, save, templates)
├── FlowCanvas.jsx (viewport — pan, zoom, drag, connect)
│   ├── <svg> — edge layer (CanvasEdge × N)
│   └── <div> — node layer (CanvasNode × N)
├── NodeEditPanel.jsx (right sidebar — edit selected node)
└── XPPopup.jsx (floating XP animations)
```

---

## 1. `FlowCanvas.jsx` — The Core Engine (~350 lines)

This is a **custom-built canvas from scratch** — no React Flow library, no D3. It uses pure React + CSS transforms + SVG.

### Layer Structure

```jsx
<div class="canvas-viewport">              ← mouse event capture layer
  <div class="canvas-transform-layer"       ← CSS transform: translate + scale
       style="transform: translate(Xpx, Ypx) scale(Z)">
    <svg>                                   ← edge layer (Bézier curves)
      <CanvasEdge /> × N
    </svg>
    <CanvasNode /> × N                      ← positioned via translate()
  </div>
</div>
```

The key insight: **everything inside `canvas-transform-layer` is in "canvas space"**. The outer `canvas-viewport` captures mouse events in **screen space**, and the code converts between the two using:

```js
canvasX = (e.clientX - rect.left - viewport.x) / viewport.zoom
canvasY = (e.clientY - rect.top - viewport.y) / viewport.zoom
```

### Pan (lines 98–110, 112–143)

- **Left-click on empty canvas** or **middle-click anywhere** starts panning.
- `panStart` records where the drag began.
- On `mousemove`, viewport `x/y` is updated = everything slides.
- Clicking on canvas also deselects nodes/edges.

### Zoom (lines 33–55)

- **Scroll wheel** zooms in/out.
- Uses `e.deltaY > 0` to detect direction (scroll down = zoom out).
- **Zooms toward mouse cursor**, not center:
  ```js
  newX = mouseX - (mouseX - prev.x) * (newZoom / prev.zoom)
  newY = mouseY - (mouseY - prev.y) * (newZoom / prev.zoom)
  ```
  This is a standard "zoom-to-point" transform — it keeps whatever the mouse is pointing at in the same screen position.
- Zoom is clamped between `0.2` (20%) and `3` (300%).
- Uses a non-passive `wheel` listener (via `useEffect`) because calling `e.preventDefault()` requires it.

### Node Dragging (lines 122–133, 179–192)

1. `CanvasNode` calls `onDragStart(nodeId, e)` when you mousedown on the node body.
2. `FlowCanvas` captures this, calculates the **offset** between mouse position and node position.
3. On `mousemove`, updates that specific node's position = smooth dragging.
4. On `mouseup`, clears the drag state.

### Connection Drawing (lines 136–142, 153–176, 194–207)

1. When you mousedown on an **output handle**, `handleConnectionStart` fires.
2. A temporary Bézier curve follows your mouse (`connecting.currentX/Y`).
3. On `mouseup`, it uses `document.elementFromPoint()` to check if you landed on an **input handle**:
   ```js
   const targetEl = document.elementFromPoint(e.clientX, e.clientY)
   const handleType = targetEl?.dataset?.handleType  // 'input'?
   const targetNodeId = targetEl?.dataset?.nodeId
   ```
4. If valid and no duplicate edge exists → creates a new edge.

### Handle Position Calculation (lines 210–244)

For drawing edges, it needs the exact pixel positions of handles:

| Node Type | Width × Height | Output Handle | Input Handle |
|-----------|---------------|---------------|--------------|
| **task** (rectangle/rounded) | 200 × 60 | Right center | Left center |
| **start / end** | 120 × 50 | Right center | Left center |
| **decision** (diamond) | 110 × 110 | Bottom center | Top center |

### Fit View (lines 64–83)

Calculates the bounding box of all nodes, then sets zoom + translation so everything fits on screen with some padding.

---

## 2. `CanvasNode.jsx` — Individual Nodes (~178 lines)

Each node is a `<div>` with `position: absolute`, placed via CSS `transform: translate(x, y)`:

```jsx
<div style={{ transform: `translate(${node.position.x}px, ${node.position.y}px)` }}>
  <div class="node-handle input" />   ← invisible circle on left (data-handle-type="input")
  <div class="node-body">
    {renderNodeContent()}              ← different content per nodeType
  </div>
  <div class="node-handle output" />  ← invisible circle on right (data-handle-type="output")
</div>
```

### Node Types

| Type | Visual | Content |
|------|--------|---------|
| `start` | Green rounded pill | ▶ Start |
| `end` | Red rounded pill | 🏁 End |
| `decision` | Purple diamond | ❓ + question text |
| `task` | Rectangle/rounded card | Status emoji + title + difficulty + duration + points + energy |

### Key Interactions

- **Click on node body** → selects it + starts drag
- **Click on output handle** → starts connection drawing
- **Click status emoji** → cycles pending → in-progress → completed (task nodes only)
- Handles use `data-*` attributes so `elementFromPoint` can detect them during connection.

---

## 3. `CanvasEdge.jsx` — Connections (~70 lines)

Each edge is an SVG `<path>` using **cubic Bézier curves**:

```
M sourceX sourceY
C (sourceX + offset) sourceY,
  (targetX - offset) targetY,
  targetX targetY
```

The control offset is `Math.max(|dx| * 0.5, 60)` — ensures a smooth curve even for short connections.

### Two paths are rendered:

1. **Invisible wide path** (16px stroke) — for easier clicking
2. **Visible thin path** — the actual edge with `stroke-dasharray` animation

### Edge Labels

For decision branches, labels render at the Bézier midpoint with a pill background:

```jsx
<rect class="edge-label-bg" />    ← white rounded rect
<text class="edge-label-text" />  ← "Yes" / "No" etc.
```

---

## 4. `FlowEditor.jsx` — The State Owner (~288 lines)

This is the **page component** that owns all state and orchestrates everything.

### State

- `nodes[]`, `edges[]` — the flow graph
- `selectedNodeId`, `selectedEdgeId` — selection
- `saveStatus` — `'saved'` | `'unsaved'` | `'saving'`
- `xpPopups[]` — floating XP animations

### Auto-Creates Start/End Nodes

When loading a flow, if no `nodeType: 'start'` or `nodeType: 'end'` exists, they're injected automatically — Start at the left, End ~300px to the right of the rightmost node.

### Template-Based Node Creation

`CanvasToolbar` passes a template object; `FlowEditor` creates a node from it with pre-filled `difficulty`, `pointsReward`, `energyCost`, `duration`, and `nodeType`.

### Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Delete` / `Backspace` | Delete selected node/edge |
| `Escape` | Deselect |
| `Ctrl+S` | Save |

### Save Logic

1. Saves the entire `{ nodes, edges }` to the flow document.
2. For each **task node**, creates/updates a Task document in the backend (linking via `nodeId`).
3. Start/End/Decision nodes are **not** synced to the Task collection.

---

## 5. `NodeEditPanel.jsx` — Right Sidebar (~280 lines)

Shows different UI based on `nodeType`:

| Node Type | Panel Content |
|-----------|---------------|
| `start` / `end` | Info text only ("This is the flow's entry point...") |
| `decision` | Question input + edge label editor for outgoing edges |
| `task` | Title, description, duration picker (15/30/45/60 presets + custom), difficulty selector (Easy/Medium/Hard), shape selector, advanced mode for manual points/energy |

### Duration Picker

Preset buttons that highlight when active, plus a `<input type="number">` for custom values.

### Edge Label Editor

When editing a Decision node, shows all outgoing edges with their target names and editable label inputs.

---

## 6. How It All Connects — Data Flow

```
User drags node → FlowCanvas.handlePanMove → onNodesChange(updater)
                                              ↓
                                    FlowEditor.setNodes(prev => ...)
                                              ↓
                                    React re-renders → FlowCanvas gets new `nodes`
                                              ↓
                              getHandlePos recalculates → edges re-render
```

Every interaction follows this pattern — **state lives in FlowEditor**, child components call callbacks, React re-renders everything. No DOM manipulation, no imperative API — pure declarative React.

---

## 7. CSS Tricks (`canvas.css`, ~1340 lines)

- **Canvas viewport** fills the screen with `cursor: grab`
- **CSS transforms** handle all panning/zooming — no canvas API
- **Node shapes** via `border-radius` (rounded) or `transform: rotate(45deg)` (diamond)
- **Connection animation** — `stroke-dasharray` + `stroke-dashoffset` animation on edges
- **XP popup** — `@keyframes` for floating upward + fade out
- **Completion burst** — radial gradient keyframe on completed nodes
- **Runner pulse** — glowing `box-shadow` animation on the active node
