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
- **Color Picker:** Customize shape colors
- **Undo/Redo:** Full command history for all shape operations
- **Pan & Zoom:** Navigate large canvases easily
- **Google Authentication:** Secure login with Google OAuth

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
- **Backend:** Firebase (Authentication, Firestore, Realtime Database)
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
