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

      // Call OpenAI API with tools (may need multiple rounds)
      let response = await openai.chat(messages, tools);
      let conversationMessages = [...messages];
      let allToolResults = [];
      let rounds = 0;
      const maxRounds = 3; // Prevent infinite loops

      // Keep calling AI until it stops making tool calls or reaches max rounds
      while (response.message.tool_calls && response.message.tool_calls.length > 0 && rounds < maxRounds) {
        rounds++;
        const message = response.message;

        // Add assistant message with tool calls to conversation
        conversationMessages.push({
          role: 'assistant',
          content: message.content || null,
          tool_calls: message.tool_calls,
        });

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
            toolCallId: toolCall.id,
          });

          // Add tool result to conversation
          conversationMessages.push({
            role: 'tool',
            content: JSON.stringify(result),
            tool_call_id: toolCall.id,
          });

          // Collect action tools for summary toast (skip getCanvasState)
          if (toolName !== 'getCanvasState') {
            // Don't show individual toasts yet - we'll show a summary at the end
          }

          allToolResults.push({
            toolName,
            args: toolArgs,
            result,
          });
        }

        // If any action tool was executed (not just getCanvasState), we're done
        const hasActionTool = toolResults.some(r => r.toolName !== 'getCanvasState');
        if (hasActionTool) {
          break;
        }

        // Call AI again with updated conversation to get next action
        response = await openai.chat(conversationMessages, tools);
      }

      // Extract final message
      const finalMessage = response.message;

      // Calculate latency
      const latency = Date.now() - startTime;

      // Check if we executed any tools
      if (allToolResults.length > 0) {
        // Show summary toast for action tools (not getCanvasState)
        const actionResults = allToolResults.filter(r => r.toolName !== 'getCanvasState');
        
        if (actionResults.length > 0) {
          const successCount = actionResults.filter(r => r.result.success).length;
          const failCount = actionResults.length - successCount;
          
          if (actionResults.length === 1) {
            // Single action - show specific message
            const result = actionResults[0].result;
            if (result.success) {
              toast.success(result.message, 2000);
            } else {
              toast.error(result.message, 4000);
            }
          } else {
            // Multiple actions - show summary
            if (failCount === 0) {
              toast.success(`✅ Successfully executed ${successCount} action(s)`, 3000);
            } else if (successCount === 0) {
              toast.error(`❌ Failed to execute ${failCount} action(s)`, 4000);
            } else {
              toast.info(`⚠️ ${successCount} succeeded, ${failCount} failed`, 4000);
            }
          }
        }

        // Add to history
        const assistantMessage = {
          role: 'assistant',
          content: finalMessage.content || `Executed ${allToolResults.length} action(s)`,
          toolCalls: allToolResults,
          timestamp: Date.now(),
          latency,
          rounds,
        };

        setHistory((prev) => [...prev, userMessage, assistantMessage]);

        return {
          success: allToolResults.every((r) => r.result.success),
          toolResults: allToolResults,
          latency,
          rounds,
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

