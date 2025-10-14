/**
 * AIContext - State management for AI features
 * 
 * Manages:
 * - AI command submission and execution
 * - Loading states
 * - Error handling
 * - Command history
 * - Integration between OpenAI API and canvas actions
 */

import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { getOpenAIService } from '../services/openaiService';
import { getAllTools } from '../services/aiTools';
import { buildMessages } from '../utils/aiPrompts';
import { executeToolCall } from '../services/aiToolExecutor';
import { useCanvas } from './CanvasContext';
import { useToast } from '../hooks/useToast';

const AIContext = createContext(null);

/**
 * AIProvider component
 * Wraps application to provide AI functionality
 */
export const AIProvider = ({ children }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState([]);
  const { firestoreActions, state: canvasState } = useCanvas();
  const toast = useToast();

  /**
   * Submit a command to the AI
   * @param {string} command - Natural language command from user
   * @returns {Promise<Object>} Result of command execution
   */
  const submitCommand = useCallback(async (command) => {
    if (!command || !command.trim()) {
      toast.error('Please enter a command');
      return { success: false, error: 'Empty command' };
    }

    const trimmedCommand = command.trim();
    const startTime = Date.now();

    setLoading(true);
    setError(null);

    // Add user message to history
    const userMessage = {
      role: 'user',
      content: trimmedCommand,
      timestamp: Date.now(),
    };

    try {
      // Get OpenAI service
      const openai = getOpenAIService();

      // Build messages with system prompt
      const messages = buildMessages(trimmedCommand);

      // Get available tools
      const tools = getAllTools();

      // Call OpenAI API with tools
      const response = await openai.chat(messages, tools);

      // Extract response
      const message = response.message;

      // Check if AI wants to use tools
      if (message.tool_calls && message.tool_calls.length > 0) {
        // Execute tool calls
        const toolResults = [];
        
        for (const toolCall of message.tool_calls) {
          const toolName = toolCall.function.name;
          const toolArgs = JSON.parse(toolCall.function.arguments);

          // Execute the tool
          const result = await executeToolCall(toolName, toolArgs, {
            canvasActions: firestoreActions,
            canvasState,
          });

          toolResults.push({
            toolName,
            args: toolArgs,
            result,
          });

          // Show toast for each tool execution
          if (result.success) {
            toast.success(result.message, 2000);
          } else {
            toast.error(result.message, 4000);
          }
        }

        // Calculate latency
        const latency = Date.now() - startTime;

        // Add to history
        const assistantMessage = {
          role: 'assistant',
          content: message.content || `Executed ${toolResults.length} action(s)`,
          toolCalls: toolResults,
          timestamp: Date.now(),
          latency,
        };

        setHistory((prev) => [...prev, userMessage, assistantMessage]);

        return {
          success: toolResults.every((r) => r.result.success),
          toolResults,
          latency,
        };
      } else {
        // AI responded with text only (no tool calls)
        const latency = Date.now() - startTime;
        
        const assistantMessage = {
          role: 'assistant',
          content: message.content,
          timestamp: Date.now(),
          latency,
        };

        setHistory((prev) => [...prev, userMessage, assistantMessage]);

        toast.info(message.content, 3000);

        return {
          success: true,
          message: message.content,
          latency,
        };
      }
    } catch (err) {
      const errorMessage = err.message || 'Failed to process command';
      setError(errorMessage);
      toast.error(errorMessage, 5000);

      // Add error to history
      const errorEntry = {
        role: 'error',
        content: errorMessage,
        timestamp: Date.now(),
      };

      setHistory((prev) => [...prev, userMessage, errorEntry]);

      return {
        success: false,
        error: errorMessage,
      };
    } finally {
      setLoading(false);
    }
  }, [firestoreActions, canvasState, toast]);

  /**
   * Clear command history
   */
  const clearHistory = useCallback(() => {
    setHistory([]);
  }, []);

  /**
   * Check if AI service is available
   */
  const isAvailable = useMemo(() => {
    try {
      const service = getOpenAIService();
      return service.isConfigured();
    } catch {
      return false;
    }
  }, []);

  const value = useMemo(
    () => ({
      loading,
      error,
      history,
      submitCommand,
      clearHistory,
      isAvailable,
      toast,
    }),
    [loading, error, history, submitCommand, clearHistory, isAvailable, toast]
  );

  return <AIContext.Provider value={value}>{children}</AIContext.Provider>;
};

/**
 * Custom hook to use AI context
 * @returns {Object} AI context value
 */
export const useAI = () => {
  const context = useContext(AIContext);
  if (!context) {
    throw new Error('useAI must be used within an AIProvider');
  }
  return context;
};

export default AIContext;

