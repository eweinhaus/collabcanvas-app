/**
 * @fileoverview Authentication helper utilities
 * Centralized auth checks and user info extraction to reduce code duplication
 * 
 * @module utils/authHelpers
 */

import { auth } from '../services/firebase';
import { logger } from './logger';
import toast from 'react-hot-toast';

/**
 * Requires an authenticated user and returns user info
 * Throws an error if no user is authenticated
 * 
 * @param {string} [context] - Context for error messages (e.g., 'create shapes')
 * @returns {{uid: string, name: string, email: string}} User information
 * @throws {Error} If user is not authenticated or missing UID
 * 
 * @example
 * try {
 *   const user = requireAuth('create shapes');
 *   console.log(user.uid, user.name);
 * } catch (error) {
 *   // User will see toast error, shape creation fails
 * }
 */
export function requireAuth(context = 'perform this action') {
  const currentUser = auth.currentUser;
  
  if (!currentUser) {
    logger.error(`authHelpers: No authenticated user when trying to ${context}`);
    toast.error('You must be signed in. Please refresh and sign in again.');
    throw new Error(`User must be authenticated to ${context}`);
  }
  
  // Ensure we have a valid UID
  if (!currentUser.uid) {
    logger.error('authHelpers: Authenticated user missing UID:', currentUser);
    toast.error('Authentication error. Please refresh and sign in again.');
    throw new Error('Authenticated user missing UID');
  }
  
  const userName = currentUser.displayName || currentUser.email?.split('@')[0] || 'Anonymous';
  
  return {
    uid: currentUser.uid,
    name: userName,
    email: currentUser.email || '',
  };
}

/**
 * Gets current user info if authenticated, returns null otherwise
 * Does not throw errors or show toasts
 * 
 * @returns {{uid: string, name: string, email: string} | null} User info or null
 * 
 * @example
 * const user = getCurrentUser();
 * if (user) {
 *   console.log('Logged in as:', user.name);
 * }
 */
export function getCurrentUser() {
  const currentUser = auth.currentUser;
  
  if (!currentUser || !currentUser.uid) {
    return null;
  }
  
  const userName = currentUser.displayName || currentUser.email?.split('@')[0] || 'Anonymous';
  
  return {
    uid: currentUser.uid,
    name: userName,
    email: currentUser.email || '',
  };
}

/**
 * Checks if a user is currently authenticated
 * 
 * @returns {boolean} True if user is authenticated with valid UID
 * 
 * @example
 * if (isAuthenticated()) {
 *   // Enable editing features
 * }
 */
export function isAuthenticated() {
  return auth.currentUser && auth.currentUser.uid;
}

/**
 * Creates an auth metadata object for Firestore documents
 * Includes createdBy, createdByName fields
 * 
 * @param {string} [context] - Context for error messages
 * @returns {{createdBy: string, createdByName: string, updatedBy: string, updatedByName: string}}
 * @throws {Error} If user is not authenticated
 * 
 * @example
 * const doc = {
 *   ...otherFields,
 *   ...createAuthMetadata('create shape'),
 *   createdAt: serverTimestamp(),
 * };
 */
export function createAuthMetadata(context) {
  const user = requireAuth(context);
  
  return {
    createdBy: user.uid,
    createdByName: user.name,
    updatedBy: user.uid,
    updatedByName: user.name,
  };
}

/**
 * Creates an update metadata object for Firestore documents
 * Includes only updatedBy, updatedByName fields
 * 
 * @param {string} [context] - Context for error messages
 * @returns {{updatedBy: string, updatedByName: string}}
 * @throws {Error} If user is not authenticated
 * 
 * @example
 * await updateDoc(ref, {
 *   ...updates,
 *   ...updateAuthMetadata('update shape'),
 *   updatedAt: serverTimestamp(),
 * });
 */
export function updateAuthMetadata(context) {
  const user = requireAuth(context);
  
  return {
    updatedBy: user.uid,
    updatedByName: user.name,
  };
}

