import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { 
  signInWithPopup, 
  signOut as firebaseSignOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { auth, googleProvider } from '../services/firebase';
import { setPresence as setUserPresence, removePresence as removeUserPresence, registerDisconnectCleanup as registerPresenceDisconnect } from '../services/presenceService';
import { getColorForUser, getInitials } from '../utils/cursorColors';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const presenceDisconnectCancelRef = useRef(null);

  useEffect(() => {
    // Listen to auth state changes and persist across refresh
    const unsubscribe = onAuthStateChanged(
      auth,
      (firebaseUser) => {
        if (firebaseUser) {
          // User is signed in
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL,
          });
          // Update presence in Realtime DB
          const color = getColorForUser(firebaseUser.uid);
          const displayName = firebaseUser.displayName || getInitials(firebaseUser.displayName, firebaseUser.email);
          setUserPresence({ uid: firebaseUser.uid, name: displayName, color }).catch(() => {});
          // Register onDisconnect cleanup (cancel previous if exists)
          if (presenceDisconnectCancelRef.current) {
            presenceDisconnectCancelRef.current();
            presenceDisconnectCancelRef.current = null;
          }
          presenceDisconnectCancelRef.current = registerPresenceDisconnect({ uid: firebaseUser.uid });
        } else {
          // User is signed out
          const prevUid = user?.uid;
          setUser(null);
          if (presenceDisconnectCancelRef.current) {
            presenceDisconnectCancelRef.current();
            presenceDisconnectCancelRef.current = null;
          }
          if (prevUid) {
            removeUserPresence({ uid: prevUid }).catch(() => {});
          }
        }
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Auth state change error:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await signInWithPopup(auth, googleProvider);
      setUser({
        uid: result.user.uid,
        email: result.user.email,
        displayName: result.user.displayName,
        photoURL: result.user.photoURL,
      });
      return result.user;
    } catch (err) {
      console.error('Sign in error:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      setError(null);
      await firebaseSignOut(auth);
      setUser(null);
      if (presenceDisconnectCancelRef.current) {
        presenceDisconnectCancelRef.current();
        presenceDisconnectCancelRef.current = null;
      }
      // Best-effort presence cleanup
      if (user?.uid) {
        await removeUserPresence({ uid: user.uid });
      }
    } catch (err) {
      console.error('Sign out error:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    loading,
    error,
    signInWithGoogle,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

