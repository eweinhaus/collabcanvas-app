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


