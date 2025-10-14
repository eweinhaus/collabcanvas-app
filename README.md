# CollabCanvas

A real-time collaborative canvas application where multiple users can create and manipulate shapes together.

## 🚀 Live Demo

**Production:** [https://collabcanvas-app-km8k.onrender.com/](https://collabcanvas-app-km8k.onrender.com/)

## ✨ Features

- **Real-time Collaboration:** Multiple users can work on the same canvas simultaneously
- **Shape Creation:** Draw rectangles, circles, triangles, and add text
- **Live Cursors:** See other users' cursors moving in real-time
- **Presence Awareness:** View who's currently active on the canvas
- **Shape Manipulation:** Select, move, resize, and delete shapes
- **Color Picker:** Customize shape colors
- **Pan & Zoom:** Navigate large canvases easily
- **Google Authentication:** Secure login with Google OAuth
- **AI Assistant:** Create shapes using natural language commands (optional, requires OpenAI API key)

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
   
   Create a `.env` or `.env.local` file in the root directory:
   ```env
   # Firebase Configuration (Required)
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   VITE_FIREBASE_DATABASE_URL=your_database_url
   
   # OpenAI Configuration (Optional - for AI features)
   VITE_OPENAI_API_KEY=your_openai_api_key
   ```
   
   > **Note:** The OpenAI API key is optional. If not provided, the app will work without AI features.

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

## 🤖 AI Foundation Setup

CollabCanvas includes an AI assistant powered by OpenAI's GPT-4 that allows users to create and manipulate shapes using natural language commands.

### Getting Started with AI Features

1. **Obtain an OpenAI API Key**
   
   Visit [OpenAI Platform](https://platform.openai.com/api-keys) and create a new API key.

2. **Add the API Key to Your Environment**
   
   Add the following to your `.env.local` file:
   ```env
   VITE_OPENAI_API_KEY=sk-your-actual-api-key-here
   ```

3. **Verify Configuration**
   
   The service will automatically initialize when the app starts. If the key is missing, AI features will be disabled but the app will continue to work normally.

### AI Capabilities (PR 10 Foundation)

The foundation layer provides:
- **OpenAI Service**: Wrapper for GPT-4o-mini chat completions
- **Tool Definitions**: JSON schemas for `createShape` and `getCanvasState` functions
- **System Prompts**: Pre-configured prompts that guide the AI assistant
- **Color Normalizer**: Utility to convert any color format (hex, rgb, hsl, CSS names) to canonical hex

### Security Considerations

⚠️ **Important Security Notice**

The current implementation uses `dangerouslyAllowBrowser: true` which exposes the API key in the client. This is acceptable for:
- Development and testing
- Personal projects
- Trusted user environments

**For production use, you should:**
1. Implement a backend proxy to handle OpenAI API calls
2. Store the API key securely on the server (never in client code)
3. Implement rate limiting and usage tracking
4. Add authentication and authorization for AI requests

### Cost Estimation

OpenAI API usage is pay-per-use:
- Model: `gpt-4o-mini` (optimized for cost and speed)
- Typical cost: ~$0.0001 per request for basic commands
- Monitor usage at [OpenAI Usage Dashboard](https://platform.openai.com/usage)

### Testing

Unit tests for AI services use mocked API calls:
```bash
# Run all tests including AI service tests
npm test

# Run specific AI tests
npm test -- openaiService.test.js
npm test -- colorNormalizer.test.js
npm test -- openaiConnection.mock.test.js
```

### Mocking in Tests

The test suite includes comprehensive mocks for OpenAI:
```javascript
// OpenAI SDK is fully mocked - no actual API calls in tests
vi.mock('openai', () => { /* mock implementation */ });
```

This ensures:
- ✅ Tests run without API keys
- ✅ Tests run offline
- ✅ No API costs during testing
- ✅ Fast test execution

### Development Guidelines

1. **Never commit API keys**: Always use `.env.local` (which is gitignored)
2. **Handle missing keys gracefully**: The app should work without AI features
3. **Monitor costs**: Set usage limits in your OpenAI account
4. **Test thoroughly**: Use mocked tests before making real API calls

## 🤝 Contributing

See `md_files/planning/tasks.md` for the development roadmap and task breakdown.

## 📄 License

MIT

## 🙏 Acknowledgments

- Built as part of the Gauntlet project
- Uses Firebase for real-time backend services
- Canvas rendering powered by Konva.js
