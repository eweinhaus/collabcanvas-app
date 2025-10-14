# CollabCanvas

A real-time collaborative canvas application where multiple users can create and manipulate shapes together.

## 🚀 Live Demo

**Production:** [https://collabcanvas-app-km8k.onrender.com/](https://collabcanvas-app-km8k.onrender.com/)

## ✨ Features

- **Real-time Collaboration:** Multiple users can work on the same canvas simultaneously
- **Shape Creation:** Draw rectangles, circles, and add text
- **Live Cursors:** See other users' cursors moving in real-time
- **Presence Awareness:** View who's currently active on the canvas
- **Shape Manipulation:** Select, move, resize, and delete shapes
- **Color Picker:** Customize shape colors
- **Pan & Zoom:** Navigate large canvases easily
- **Google Authentication:** Secure login with Google OAuth

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

Shapes are stored in Firestore with the following structure:
- Collection: `boards/{boardId}/shapes/{shapeId}`
- Authentication required for all operations

### Realtime Database Rules

Cursors and presence data use Realtime Database:
- `boards/{boardId}/cursors/{uid}` - User cursor positions
- `boards/{boardId}/presence/{uid}` - User presence status

## 🤝 Contributing

See `md_files/planning/tasks.md` for the development roadmap and task breakdown.

## 📄 License

MIT

## 🙏 Acknowledgments

- Built as part of the Gauntlet project
- Uses Firebase for real-time backend services
- Canvas rendering powered by Konva.js
