/**
 * AI Context
 * Manages AI chat state, message history, and communication with OpenAI
 */

import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useCanvas } from './CanvasContext';
import { postChat, getErrorMessage, isRateLimitError, isAuthError } from '../services/openaiService';
import { getInitialMessages, createUserMessage, createAssistantMessage, createToolMessage } from '../utils/aiPrompts';
import { getToolDefinitions } from '../services/aiTools';
import { createAIToolExecutor } from '../services/aiToolExecutor';
import { setupPerformanceTesting } from '../utils/performanceTest';
import toast from 'react-hot-toast';

const AIContext = createContext(null);

/**
 * Hook to access AI context
 */
export const useAI = () => {
  const context = useContext(AIContext);
  if (!context) {
    throw new Error('useAI must be used within AIProvider');
  }
  return context;
};

/**
 * AI Provider Component
 */
export const AIProvider = ({ children }) => {
  const { user } = useAuth();
  const canvas = useCanvas();
  const [messages, setMessages] = useState(() => {
    // Load messages from localStorage on init
    try {
      const saved = localStorage.getItem('ai_messages');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Limit to last 50 messages to avoid storage bloat
        return parsed.slice(-50);
      }
    } catch (error) {
      console.error('Failed to load AI messages from localStorage:', error);
    }
    return getInitialMessages(user);
  });

  const [loading, setLoading] = useState(false);
  const [panelOpen, setPanelOpen] = useState(() => {
    // Load panel state from localStorage
    try {
      const saved = localStorage.getItem('ai_panel_open');
      return saved === 'true';
    } catch (error) {
      return false;
    }
  });

  const abortControllerRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Persist messages to localStorage whenever they change
  useEffect(() => {
    try {
      // Only save user and assistant messages (not system or tool messages)
      const toSave = messages
        .filter(m => m.role === 'user' || m.role === 'assistant')
        .slice(-30); // Keep last 30 user/assistant messages
      localStorage.setItem('ai_messages', JSON.stringify(toSave));
    } catch (error) {
      console.error('Failed to save AI messages to localStorage:', error);
    }
  }, [messages]);

  // Persist panel state to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('ai_panel_open', panelOpen.toString());
    } catch (error) {
      console.error('Failed to save panel state:', error);
    }
  }, [panelOpen]);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  /**
   * Toggle AI panel open/closed
   */
  const togglePanel = useCallback(() => {
    setPanelOpen(prev => !prev);
  }, []);

  /**
   * Open AI panel
   */
  const openPanel = useCallback(() => {
    setPanelOpen(true);
  }, []);

  /**
   * Close AI panel
   */
  const closePanel = useCallback(() => {
    setPanelOpen(false);
  }, []);

  /**
   * Execute tool calls from the AI
   * @param {Array} toolCalls - Array of tool call objects from OpenAI
   * @param {Object} assistantMessage - The assistant message that contains the tool calls
   * @returns {Promise<boolean>} True if all tools executed successfully
   */
  const executeToolCalls = useCallback(async (toolCalls, assistantMessage) => {
    if (!canvas || !canvas.firestoreActions || !canvas.state) {
      console.error('Canvas context not available for tool execution');
      return false;
    }

    // Create tool executor with canvas dependencies
    const executor = createAIToolExecutor({
      addShape: canvas.firestoreActions.addShape,
      addShapesBatch: canvas.firestoreActions.addShapesBatch,
      getShapes: () => canvas.state.shapes,
      getViewportCenter: () => {
        const { scale, position, stageSize } = canvas.state;
        // Convert screen center to canvas coordinates
        const canvasX = (stageSize.width / 2 - position.x) / scale;
        const canvasY = (stageSize.height / 2 - position.y) / scale;
        return { x: Math.round(canvasX), y: Math.round(canvasY) };
      },
    });

    let allSuccessful = true;

    // Execute tool calls in parallel for better performance
    const toolPromises = toolCalls.map(async (toolCall) => {
      try {
        const { name, arguments: argsString } = toolCall.function;
        const args = JSON.parse(argsString);

        let result;
        if (name === 'createShape') {
          result = await executor.executeCreateShape(args);
        } else if (name === 'getCanvasState') {
          result = executor.executeGetCanvasState();
        } else {
          result = { success: false, error: `Unknown tool: ${name}` };
        }

        return { name, result, success: true };
      } catch (error) {
        console.error('Tool execution error:', error);
        return { name: toolCall.function.name, error, success: false };
      }
    });

    // Wait for all tools to complete
    const results = await Promise.all(toolPromises);

    // Show user feedback for each result
    for (const { name, result, error, success } of results) {
      if (success && result.success) {
        if (name === 'createShape') {
          toast.success(result.message || 'Shape created successfully');
        } else if (name === 'getCanvasState') {
          // Silent success for read operations
          console.log('Canvas state retrieved:', result);
        }
      } else {
        allSuccessful = false;
        const errorMsg = error ? error.message : (result.error || 'Tool execution failed');
        toast.error(errorMsg);
      }
    }

    // Note: We don't persist tool messages to conversation history
    // Tool results are shown via toast notifications and success messages

    return allSuccessful;
  }, [canvas]);

  /**
   * Send a message to the AI
   * @param {string} content - User message content
   */
  const sendMessage = useCallback(async (content) => {
    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      toast.error('Please enter a message');
      return;
    }

    if (!user) {
      toast.error('Please sign in to use AI features');
      return;
    }

    if (loading) {
      toast.error('Please wait for the current response to complete');
      return;
    }

    // Cancel any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();

    // Add user message to chat
    const userMessage = createUserMessage(content.trim());
    setMessages(prev => [...prev, userMessage]);

    setLoading(true);

    try {
      // Prepare messages for API (include system prompt)
      const systemPrompt = getInitialMessages(user)[0];
      
      // Keep only recent conversation history to stay under 20 message limit
      // Strategy: Keep only user and assistant messages (no tool messages)
      // Strip out tool_calls from assistant messages (already executed)
      const recentMessages = messages
        .filter(m => m.role === 'user' || m.role === 'assistant')
        .slice(-8) // Keep last 8 user/assistant messages (optimized for speed)
        .map(m => {
          // Remove tool_calls from assistant messages (already processed)
          if (m.role === 'assistant' && m.tool_calls) {
            const { tool_calls, ...rest } = m;
            return rest;
          }
          return m;
        });
      
      const conversationMessages = [
        systemPrompt,
        ...recentMessages,
        userMessage,
      ];

      // Call OpenAI via Cloud Function with tools
      const response = await postChat(conversationMessages, {
        tools: getToolDefinitions(),
        toolChoice: 'auto',
        abortSignal: abortControllerRef.current.signal,
      });

      // Extract assistant message from response
      if (response && response.choices && response.choices.length > 0) {
        const choice = response.choices[0];
        const toolCalls = choice.message?.tool_calls || null;
        
        // Generate appropriate content
        let assistantContent = choice.message?.content;
        
        // If no content but there are tool calls, generate a helpful message
        if (!assistantContent && toolCalls && toolCalls.length > 0) {
          assistantContent = 'Working on it...';
        } else if (!assistantContent) {
          assistantContent = 'I apologize, but I could not generate a response.';
        }

        const assistantMessage = createAssistantMessage(assistantContent, toolCalls);
        setMessages(prev => [...prev, assistantMessage]);

        // Execute tool calls if present
        if (toolCalls && toolCalls.length > 0) {
          const success = await executeToolCalls(toolCalls, assistantMessage);
          
          // Add a follow-up message only if successful
          if (success) {
            const toolNames = toolCalls.map(tc => tc.function.name);
            let summary = '';
            if (toolNames.includes('createShape')) {
              summary = '✓ Shape created successfully!';
            } else if (toolNames.includes('getCanvasState')) {
              summary = '✓ Retrieved canvas state.';
            }
            
            if (summary) {
              const summaryMessage = createAssistantMessage(summary);
              setMessages(prev => [...prev, summaryMessage]);
            }
          }
        }
      } else {
        throw new Error('Invalid response from AI service');
      }

    } catch (error) {
      console.error('AI message error:', error);

      // Handle specific error types
      if (error.name === 'AbortError' || error.code === 'ABORTED') {
        // Request was cancelled, don't show error
        return;
      }

      if (isRateLimitError(error)) {
        toast.error('Rate limit reached. Please wait a minute and try again.', {
          duration: 5000,
        });
      } else if (isAuthError(error)) {
        toast.error('Authentication failed. Please sign in again.', {
          duration: 4000,
        });
      } else {
        toast.error(getErrorMessage(error), {
          duration: 4000,
        });
      }

      // Add error message to chat for context
      const errorMessage = createAssistantMessage(
        `Sorry, I encountered an error: ${getErrorMessage(error)}`
      );
      setMessages(prev => [...prev, errorMessage]);

    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  }, [user, messages, loading, executeToolCalls]);

  /**
   * Clear conversation history
   */
  const clearMessages = useCallback(() => {
    const initialMessages = getInitialMessages(user);
    setMessages(initialMessages);
    toast.success('Conversation cleared');
  }, [user]);

  /**
   * Cancel ongoing request
   */
  const cancelRequest = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setLoading(false);
      toast('Request cancelled', { icon: '⏹️' });
    }
  }, []);

  // Setup performance testing in development
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' || import.meta.env.DEV) {
      setupPerformanceTesting();
      // Expose sendMessage for testing
      window.__aiSendMessage = sendMessage;
      
      return () => {
        delete window.__aiSendMessage;
      };
    }
  }, [sendMessage]);

  const value = {
    // State
    messages,
    loading,
    panelOpen,
    messagesEndRef,

    // Actions
    sendMessage,
    clearMessages,
    cancelRequest,
    togglePanel,
    openPanel,
    closePanel,
  };

  return (
    <AIContext.Provider value={value}>
      {children}
    </AIContext.Provider>
  );
};

