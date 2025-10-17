# Render Deployment Guide for CollabCanvas

## 📋 Production Environment Variables

Copy these values to Render when deploying:

```
VITE_FIREBASE_API_KEY=AIzaSyD8egc6e9I88T6GfrwkptSxvAmt38X7o2s
VITE_FIREBASE_AUTH_DOMAIN=collabcanvas-prod.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=collabcanvas-prod
VITE_FIREBASE_STORAGE_BUCKET=collabcanvas-prod.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=41772725235
VITE_FIREBASE_APP_ID=1:41772725235:web:3a6c0d6086416ebd435886
VITE_FIREBASE_DATABASE_URL=https://collabcanvas-prod-default-rtdb.firebaseio.com
```

## 🚀 Render Deployment Steps

### Option 1: Static Site (Recommended for Vite apps)

1. **Go to Render Dashboard**
   - Visit: https://dashboard.render.com/
   - Sign up or login with GitHub

2. **Create New Static Site**
   - Click "New +" → "Static Site"
   - Connect your GitHub repository
   - Select the `Gauntlet/CollabCanvas` repository

3. **Configure Build Settings**
   ```
   Name: collabcanvas-prod
   Branch: main (or your production branch)
   Root Directory: collabcanvas-app
   Build Command: npm install && npm run build
   Publish Directory: collabcanvas-app/dist
   ```

4. **Add Environment Variables**
   - Click "Advanced" → "Add Environment Variable"
   - Add each variable from the list above
   - Or use "Add from .env" and paste all variables at once

5. **Deploy**
   - Click "Create Static Site"
   - Wait for build to complete (5-10 minutes)
   - Get your URL: `https://collabcanvas-prod.onrender.com`

### Option 2: Web Service (Alternative)

If you need a web service instead:

1. **Create New Web Service**
   - Click "New +" → "Web Service"
   - Connect GitHub repository

2. **Configure Settings**
   ```
   Name: collabcanvas-prod
   Branch: main
   Root Directory: collabcanvas-app
   Build Command: npm install && npm run build
   Start Command: npm run preview -- --host 0.0.0.0 --port $PORT
   ```

3. **Add Environment Variables** (same as above)

4. **Deploy**

## 🔧 Post-Deployment Setup

### 1. Update Firebase Authorized Domains

After getting your Render URL:

1. Go to Firebase Console: https://console.firebase.google.com/project/collabcanvas-prod/authentication/settings
2. Scroll to "Authorized domains"
3. Click "Add domain"
4. Add your Render domain: `collabcanvas-prod.onrender.com`
5. Save changes

### 2. Test Authentication

1. Visit your Render URL
2. Try to login with Google
3. Verify authentication works

### 3. Test Multi-User Collaboration

1. Open 3+ browser windows/incognito tabs
2. Login with different accounts
3. Test shape creation/editing
4. Verify cursors appear
5. Check presence list

## 🐛 Troubleshooting

### Build Fails
- Check build logs in Render dashboard
- Verify `package.json` scripts are correct
- Ensure all dependencies are listed

### Authentication Fails
- Verify Firebase authorized domains include Render URL
- Check environment variables are set correctly
- Check browser console for errors

### Shapes Not Syncing
- Verify Firestore rules are deployed
- Check Firebase Console for errors
- Test with dev environment first

### Cursors Not Appearing
- Verify Realtime Database rules are deployed
- Check browser network tab for WebSocket connection
- Ensure databaseURL is correct

## 📊 Monitoring

### Render Dashboard
- Build logs: Check for build errors
- Deploy logs: Check for runtime errors
- Metrics: Monitor CPU/Memory usage

### Firebase Console
- Usage: Monitor read/write operations
- Authentication: Check active users
- Performance: Review query performance

## 🎯 Success Checklist

- [ ] Static site created on Render
- [ ] All environment variables added
- [ ] Build completed successfully
- [ ] App accessible via Render URL
- [ ] Firebase authorized domains updated
- [ ] Authentication works
- [ ] Multi-user shape sync works
- [ ] Cursors appear in real-time
- [ ] Presence list shows users
- [ ] No console errors

## 🔗 Important Links

- **Render Dashboard:** https://dashboard.render.com/
- **Firebase Console:** https://console.firebase.google.com/project/collabcanvas-prod
- **Firestore Rules:** https://console.firebase.google.com/project/collabcanvas-prod/firestore/rules
- **Realtime DB Rules:** https://console.firebase.google.com/project/collabcanvas-prod/database/collabcanvas-prod-default-rtdb/rules
- **Firebase Auth Settings:** https://console.firebase.google.com/project/collabcanvas-prod/authentication/settings

## 📝 Notes

- Render free tier may have cold starts (30-60 seconds)
- Static sites are faster than web services
- Environment variables are rebuilt into the app (not runtime)
- Any env variable change requires a rebuild

