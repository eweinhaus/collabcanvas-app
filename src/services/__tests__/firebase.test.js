// Mock Firebase modules
jest.mock('firebase/app', () => ({
  initializeApp: jest.fn(() => ({})),
}));

jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(() => ({ name: 'auth' })),
  GoogleAuthProvider: jest.fn(),
}));

jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(() => ({ name: 'firestore' })),
}));

jest.mock('firebase/database', () => ({
  getDatabase: jest.fn(() => ({ name: 'realtimeDB' })),
}));

// Mock import.meta.env
if (!global.import) {
  global.import = { meta: { env: {} } };
} else if (!global.import.meta) {
  global.import.meta = { env: {} };
} else if (!global.import.meta.env) {
  global.import.meta.env = {};
}

describe('Firebase Configuration', () => {
  test('Firebase modules can be imported', () => {
    const { initializeApp } = require('firebase/app');
    const { getAuth, GoogleAuthProvider } = require('firebase/auth');
    const { getFirestore } = require('firebase/firestore');
    const { getDatabase } = require('firebase/database');

    expect(initializeApp).toBeDefined();
    expect(getAuth).toBeDefined();
    expect(GoogleAuthProvider).toBeDefined();
    expect(getFirestore).toBeDefined();
    expect(getDatabase).toBeDefined();
  });
});
