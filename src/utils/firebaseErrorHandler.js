/**
 * @fileoverview Centralized Firebase error handling
 * Provides consistent error handling and user feedback for Firebase operations
 * 
 * @module utils/firebaseErrorHandler
 */

import { logger } from './logger';
import toast from 'react-hot-toast';
import { auth } from '../services/firebase';

/**
 * Checks if an error is a permission denied error
 * @param {Error} error - The error to check
 * @returns {boolean} True if permission denied
 */
export function isPermissionDenied(error) {
  return error.code === 'permission-denied' || 
         error.message?.includes('permission-denied');
}

/**
 * Checks if an error is a network-related error
 * @param {Error} error - The error to check
 * @returns {boolean} True if network error
 */
export function isNetworkError(error) {
  const networkCodes = [
    'unavailable',
    'deadline-exceeded',
    'internal',
    'resource-exhausted',
    'aborted',
  ];
  
  const errorCode = error.code?.replace('firestore/', '').replace('database/', '');
  
  if (networkCodes.includes(errorCode)) {
    return true;
  }
  
  if (error.message && (
    error.message.includes('network') ||
    error.message.includes('offline') ||
    error.message.includes('fetch')
  )) {
    return true;
  }
  
  return false;
}

/**
 * Handles Firebase errors with appropriate logging and user feedback
 * 
 * @param {Error} error - The Firebase error
 * @param {string} operation - Description of the operation that failed (e.g., 'create shape')
 * @param {Object} [options] - Options for error handling
 * @param {boolean} [options.showToast=true] - Whether to show toast notification
 * @param {string} [options.customMessage] - Custom error message for toast
 * @param {Object} [options.context] - Additional context to log
 * 
 * @example
 * try {
 *   await createShape(shape);
 * } catch (error) {
 *   handleFirebaseError(error, 'create shape', {
 *     context: { shapeId: shape.id }
 *   });
 *   throw error;
 * }
 */
export function handleFirebaseError(error, operation, options = {}) {
  const {
    showToast = true,
    customMessage,
    context = {},
  } = options;
  
  // Log the error with context
  logger.error(`Firebase error during ${operation}:`, error);
  
  if (Object.keys(context).length > 0) {
    logger.error('Error context:', context);
  }
  
  // Handle specific error types
  if (isPermissionDenied(error)) {
    logger.error('Permission denied. Auth state:', {
      hasCurrentUser: !!auth.currentUser,
      userId: auth.currentUser?.uid,
      userEmail: auth.currentUser?.email,
      operation,
    });
    
    if (showToast) {
      toast.error(customMessage || 'Permission denied. Please refresh the page and sign in again.');
    }
  } else if (isNetworkError(error)) {
    logger.warn(`Network error during ${operation}:`, error.code);
    
    if (showToast) {
      toast.error(customMessage || 'Network error. Changes will sync when online.');
    }
  } else {
    // Generic error
    if (showToast) {
      toast.error(customMessage || `Failed to ${operation}. Please try again.`);
    }
  }
}

/**
 * Wraps an async Firebase operation with error handling
 * Automatically handles errors and provides user feedback
 * 
 * @param {Function} operation - Async function to execute
 * @param {string} operationName - Name of the operation for error messages
 * @param {Object} [options] - Options passed to handleFirebaseError
 * @returns {Promise} Result of the operation or null if failed
 * 
 * @example
 * const result = await withFirebaseErrorHandling(
 *   () => createShape(shape),
 *   'create shape',
 *   { context: { shapeId: shape.id } }
 * );
 */
export async function withFirebaseErrorHandling(operation, operationName, options = {}) {
  try {
    return await operation();
  } catch (error) {
    handleFirebaseError(error, operationName, options);
    throw error; // Re-throw to allow caller to handle if needed
  }
}

/**
 * Determines if an operation should be queued (offline or retryable error)
 * Used by offline queue system
 * 
 * @param {Error} [error] - The error that occurred
 * @returns {boolean} True if operation should be queued
 */
export function shouldQueueOperation(error) {
  // Check if offline
  if (!navigator.onLine) {
    return true;
  }
  
  // Check for retryable Firebase errors
  if (error && isNetworkError(error)) {
    return true;
  }
  
  return false;
}

