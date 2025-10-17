# CollabCanvas

A real-time collaborative canvas application where multiple users can create and manipulate shapes together.

## 🚀 Live Demo

**Production:** [https://collabcanvas-app-km8k.onrender.com/](https://collabcanvas-app-km8k.onrender.com/)

## ✨ Features

- **Real-time Collaboration:** Multiple users can work on the same canvas simultaneously
- **Shape Creation:** Draw rectangles, circles, triangles, and add text
- **Live Cursors:** See other users' cursors moving in real-time
- **Presence Awareness:** View who's currently active on the canvas
- **Shape Manipulation:** Select, move, resize, rotate, and delete shapes
- **Collaborative Comments:** Add, edit, and view comments on any shape with real-time sync
- **Layers Panel:** Manage shape stacking order with drag-and-drop reordering and visibility toggles
- **Alignment Tools:** Align and distribute multiple shapes with toolbar or keyboard shortcuts
- **Color Picker:** Customize shape colors
- **Undo/Redo:** Full command history for all shape operations
- **Pan & Zoom:** Navigate large canvases easily
- **Google Authentication:** Secure login with Google OAuth
- **AI Assistant:** Natural language commands to create and manipulate shapes

## 🤖 AI Assistant

Create and manipulate shapes using natural language commands powered by OpenAI:

### Creation Commands

**Simple Creation:**
- "Create a red circle"
- "Add a blue square at 100, 100"
- "Make a purple rectangle"
- "Add text that says Hello World"

**With Dimensions:**
- "Create a 150x100 green rectangle"
- "Make a circle with radius 80"
- "Add a 200x200 yellow square"

**Shape Types:**
- Rectangles / Squares
- Circles
- Triangles
- Text

**Automatic Defaults:**
- Position: Center of current viewport
- Color: Blue
- Size: 100x100 (rectangles/triangles), radius 50 (circles)

### Manipulation Commands

**Move Shapes:**
- "Move the blue rectangle to 600, 200"
- "Move the red circle to 300, 400"
- "Move the text to 500, 100"

**Rotate Shapes:**
- "Rotate the blue rectangle 45 degrees"
- "Rotate the red circle 90 degrees"
- "Rotate the triangle 180 degrees"

**Shape Identification:**

The AI can identify shapes by:
- **Color**: "the blue rectangle", "the red circle"
- **Type**: "the rectangle", "the circle", "the text"
- **Combination**: "the blue rectangle", "the green triangle"
- **Recency**: When multiple shapes match, the most recently created shape is selected

**Supported Colors:**
- Primary: red, blue, green, yellow, orange, purple, pink
- Variants: All CSS color names (e.g., dodgerblue, crimson, skyblue)
- Hex codes: #FF0000, #0000FF, etc.

### Grid Layout Commands

Create organized grids of shapes with a single command:

**Basic Grids:**
- "Create a 3x3 grid of red squares"
- "Create a 5x5 grid of blue circles"
- "Create a 2x4 grid of green rectangles"

**Custom Positioning:**
- "Create a 3x3 grid of red squares at 400, 300"
- "Create a 4x2 grid of purple circles at 100, 200"

**Custom Spacing:**
- "Create a 3x3 grid with 150 pixel spacing"
- "Create a 5x2 grid of circles with 200 spacing"

**Combined Parameters:**
- "Create a 4x4 grid of blue triangles at 500, 400 with 120 spacing"

**Grid Specifications:**
- Maximum grid size: 20×20 (up to 100 shapes total)
- Spacing range: 10-500 pixels (default: 120px)
- All grid shapes created in a single batch operation
- Changes sync instantly to all users

### How to Use

1. Click the AI chat icon to open the panel
2. Type natural language commands
3. Shapes appear or update instantly on the canvas
4. All changes sync in real-time to collaborators

## 🔄 Collaboration & Conflict Resolution

CollabCanvas uses a **last-write-wins (LWW)** strategy for handling concurrent edits:

### How It Works

1. **Optimistic UI Updates:** Changes appear instantly in your browser before syncing to the server
2. **Server Authority:** Firebase Firestore acts as the authoritative source of truth
3. **Timestamp-Based Resolution:** Server timestamps determine which edit wins in conflicts
4. **Tolerance Window:** 100ms tolerance prevents minor network jitter from causing unnecessary overwrites
5. **Real-time Sync:** All users receive updates via Firebase `onSnapshot` listeners within 50-100ms

### Concurrent Editing Behavior

- **Same shape, different users:** Last user to finish editing wins (their changes persist)
- **Rapid edits:** Updates are throttled (75ms for shapes, 35ms for cursors) to balance responsiveness and Firebase costs
- **Drag operations:** Real-time position broadcasts via Realtime Database show intermediate states; final position written to Firestore on drag end
- **Self-healing:** Periodic reconciliation (every 10s) ensures clients stay in sync even after network issues

### Visual Feedback

- **Live cursors:** See where other users are pointing in real-time
- **Drag broadcasts:** Watch shapes move as others drag them (before drag completes)
- **Presence indicators:** Know who's currently active on the canvas

### Trade-offs

**Pros:**
- Simple and predictable behavior
- Low latency (50-100ms sync time)
- No complex merge logic needed
- Works well for casual collaboration

**Cons:**
- Simultaneous edits on the same shape can result in one user's changes being overwritten
- No built-in "undo" for overwritten changes (last-write-wins is final)
- Best suited for teams where users typically work on different areas of the canvas

### Future Enhancements

For tighter collaboration scenarios, we may explore:
- **Operational Transform (OT)** or **CRDTs** for conflict-free editing
- **Shape locking** to prevent simultaneous edits
- **Edit history** to recover overwritten changes
- **Conflict warnings** when multiple users select the same shape

## 📚 Layers Panel

Manage the stacking order and visibility of shapes on your canvas:

### Features

- **Drag-and-Drop Reordering:** Rearrange shapes in the z-index stack by dragging layers
- **Visibility Toggle:** Show/hide individual shapes without deleting them (eye icon)
- **Layer Selection:** Click a layer to select the corresponding shape on canvas
- **Quick Actions:** Duplicate or delete shapes directly from the layers panel
- **Real-time Sync:** Layer changes sync instantly across all users
- **Persistent State:** Panel open/closed state saved to localStorage

### How to Use

1. **Open the Layers Panel:** Click the "Layers" button in the Actions toolbar
2. **Reorder layers:** Drag and drop layers to change z-index (top = front, bottom = back)
3. **Toggle visibility:** Click the eye icon to hide/show shapes
4. **Select shapes:** Click a layer to select it on the canvas
5. **Quick actions:** Use duplicate or delete icons on each layer

### Keyboard Shortcuts

- `Cmd/Ctrl + ]` - Bring selected shape to front
- `Cmd/Ctrl + [` - Send selected shape to back
- `]` - Bring selected shape forward one level
- `[` - Send selected shape backward one level

## ⚡ Alignment Tools

Quickly align and distribute multiple shapes with precision:

### Features

- **6 Alignment Options:** Left, Center, Right, Top, Middle, Bottom
- **2 Distribution Options:** Horizontal and Vertical (requires 3+ shapes)
- **Floating Toolbar:** Appears automatically when 2+ shapes are selected
- **Keyboard Shortcuts:** Fast access to all alignment operations
- **Batch Updates:** All aligned shapes update in a single atomic operation
- **Real-time Sync:** Alignment changes sync instantly to all collaborators

### How to Use

1. **Select multiple shapes:** Shift+click or drag selection box over 2+ shapes
2. **Use the toolbar:** Click alignment buttons in the floating toolbar above selection
3. **Or use shortcuts:** Press keyboard combinations for instant alignment

### Keyboard Shortcuts

- `Cmd/Ctrl + Shift + L` - Align Left
- `Cmd/Ctrl + Shift + R` - Align Right
- `Cmd/Ctrl + Shift + T` - Align Top
- `Cmd/Ctrl + Shift + B` - Align Bottom
- `Cmd/Ctrl + Shift + M` - Align Middle (vertical center)
- `Cmd/Ctrl + Shift + H` - Distribute Horizontally (3+ shapes)
- `Cmd/Ctrl + Shift + V` - Distribute Vertically (3+ shapes)

### Alignment Behavior

- **Align Left/Right/Top/Bottom:** Aligns all shapes to the extreme edge of the selection
- **Align Center/Middle:** Aligns shapes to the center of the selection bounds
- **Distribute Horizontally/Vertically:** Creates even spacing between shapes while maintaining their relative order

## 💬 Collaborative Comments

Add context and discussion to any shape with real-time collaborative comments:

### Features

- **Comment Badges:** Visual indicators show which shapes have comments
- **Real-time Sync:** Comments appear instantly for all users (<500ms)
- **Thread Panel:** Clean, intuitive UI for viewing and managing comments
- **Edit & Delete:** Any authenticated user can edit or delete any comment
- **Persistence:** Comments are stored in Firestore and persist across sessions

### How to Use

1. **Add a comment:**
   - Select a shape and press `Cmd/Ctrl + Shift + C`
   - Or right-click a shape and select "Add Comment"
   - Or click the comment badge (💬) on a shape that has comments

2. **View comments:** Click the badge or use the keyboard shortcut to open the comment thread panel

3. **Edit/Delete:** Click the edit or delete icon on any comment

### Technical Details

- Comments are stored as Firestore subcollections: `boards/{boardId}/shapes/{shapeId}/comments/{commentId}`
- Real-time updates via `onSnapshot` listeners
- Comment counts are automatically synced across all users
- Maximum comment length: 500 characters

## 🛠️ Tech Stack

- **Frontend:** React + Vite
- **Canvas Rendering:** Konva + React Konva
- **Backend:** Firebase (Authentication, Firestore, Realtime Database, Cloud Functions)
- **AI:** OpenAI GPT-4o-mini via Firebase Cloud Functions
- **Deployment:** Render
- **Testing:** Jest + React Testing Library

## 🏃‍♂️ Running Locally

### Prerequisites

- Node.js 20.x (see `.nvmrc`)
- Firebase project with Authentication, Firestore, and Realtime Database enabled

### Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd CollabCanvas/collabcanvas-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env` file in the root directory:
   ```env
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   VITE_FIREBASE_DATABASE_URL=your_database_url
   ```

4. **Run development server**
   ```bash
   npm run dev
   ```

5. **Run tests**
   ```bash
   npm test
   ```

## 📦 Deployment

This app is deployed on Render. See `RENDER_DEPLOYMENT.md` for detailed deployment instructions.

### Build for Production

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## 🧪 Testing

- **Unit Tests:** `npm test`
- **Coverage Report:** `npm test -- --coverage`
- **Watch Mode:** `npm test -- --watch`

## 📁 Project Structure

```
collabcanvas-app/
├── src/
│   ├── components/       # React components
│   │   ├── auth/        # Authentication components
│   │   ├── canvas/      # Canvas and shape components
│   │   ├── collaboration/ # Presence and user components
│   │   ├── common/      # Shared components
│   │   └── layout/      # Layout components
│   ├── context/         # React context providers
│   ├── services/        # Firebase service layers
│   ├── hooks/           # Custom React hooks
│   └── utils/           # Utility functions
├── public/              # Static assets
└── md_files/           # Documentation
```

## 🔐 Firebase Configuration

### Firestore Rules

Data is stored in Firestore with the following structure:
- Shapes: `boards/{boardId}/shapes/{shapeId}`
- Comments: `boards/{boardId}/shapes/{shapeId}/comments/{commentId}`
- Authentication required for all operations
- All authenticated users can read, create, update, and delete shapes and comments

### Realtime Database Rules

Cursors and presence data use Realtime Database:
- `boards/{boardId}/cursors/{uid}` - User cursor positions
- `boards/{boardId}/presence/{uid}` - User presence status
- `boards/{boardId}/dragUpdates/{shapeId}` - Real-time drag position broadcasts

## 🤝 Contributing

See `md_files/planning/tasks.md` for the development roadmap and task breakdown.

## 📄 License

MIT

## 🙏 Acknowledgments

- Built as part of the Gauntlet project
- Uses Firebase for real-time backend services
- Canvas rendering powered by Konva.js
