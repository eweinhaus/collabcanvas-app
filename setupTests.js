import '@testing-library/jest-dom';
import 'whatwg-fetch';

// Mock crypto for Firebase Auth
if (!global.crypto) {
  global.crypto = {
    subtle: {},
    getRandomValues: (arr) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256);
      }
      return arr;
    },
  };
}

// Shim import.meta.env for Jest environment
if (!global.import) {
  global.import = { meta: { env: {} } };
} else if (!global.import.meta) {
  global.import.meta = { env: {} };
} else if (!global.import.meta.env) {
  global.import.meta.env = {};
}

// Mock uuid module for Jest (uuid v13+ is ESM-only)
jest.mock('uuid', () => ({
  v4: () => 'test-uuid-123',
  v1: () => 'test-uuid-v1',
  v5: () => 'test-uuid-v5',
  v6: () => 'test-uuid-v6',
  v7: () => 'test-uuid-v7',
  validate: () => true,
  parse: () => [],
  stringify: () => '',
}));

