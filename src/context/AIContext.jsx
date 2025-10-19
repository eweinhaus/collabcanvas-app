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
      updateShape: canvas.firestoreActions.updateShape,
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
        } else if (name === 'moveShape') {
          result = await executor.executeMoveShape(args);
        } else if (name === 'rotateShape') {
          result = await executor.executeRotateShape(args);
        } else if (name === 'createGrid') {
          result = await executor.executeCreateGrid(args);
        } else if (name === 'createShapesVertically') {
          result = await executor.executeCreateShapesVertically(args);
        } else if (name === 'createShapesHorizontally') {
          result = await executor.executeCreateShapesHorizontally(args);
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
        // Silent success for all operations
        console.log(`Tool ${name} executed successfully:`, result);
      } else {
        allSuccessful = false;
        const errorMsg = error ? error.message : (result.error || 'Tool execution failed');
        // Replace error toast with assistant chat message
        const assistantError = createAssistantMessage(`Sorry, I couldn't complete that: ${errorMsg}`);
        setMessages(prev => [...prev, assistantError]);
      }
    }

    // Note: We don't persist tool messages to conversation history
    // Tool results are logged to console; only errors are shown to users via chat messages

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
          
          // Check if getCanvasState was called without other manipulation tools
          const toolNames = toolCalls.map(tc => tc.function.name);
          const hasGetCanvasState = toolNames.includes('getCanvasState');
          const hasManipulation = toolNames.some(name => 
            ['moveShape', 'rotateShape', 'resizeShape', 'deleteShape'].includes(name)
          );
          
          // If only getCanvasState was called, the AI needs to continue with the actual manipulation
          if (success && hasGetCanvasState && !hasManipulation && toolCalls.length === 1) {
            // Don't show completion message yet - the AI needs to continue
            // Instead, make a follow-up call to let the AI use the canvas state
            const getCanvasStateCall = toolCalls.find(tc => tc.function.name === 'getCanvasState');
            
            // Get the result of getCanvasState
            const executor = createAIToolExecutor({
              addShape: canvas.firestoreActions.addShape,
              addShapesBatch: canvas.firestoreActions.addShapesBatch,
              updateShape: canvas.firestoreActions.updateShape,
              getShapes: () => canvas.state.shapes,
              getViewportCenter: () => {
                const { scale, position, stageSize } = canvas.state;
                const canvasX = (stageSize.width / 2 - position.x) / scale;
                const canvasY = (stageSize.height / 2 - position.y) / scale;
                return { x: Math.round(canvasX), y: Math.round(canvasY) };
              },
            });
            
            const canvasState = executor.executeGetCanvasState();
            
            // Create a tool result message
            const toolResultMessage = createToolMessage(
              getCanvasStateCall.id,
              canvasState
            );
            
            // Add working message
            const workingMessage = createAssistantMessage('Analyzing shapes...');
            setMessages(prev => [...prev, workingMessage]);
            
            // Make a follow-up API call with the canvas state result
            const followUpMessages = [
              systemPrompt,
              ...recentMessages,
              userMessage,
              assistantMessage,
              toolResultMessage,
            ];
            
            try {
              const followUpResponse = await postChat(followUpMessages, {
                tools: getToolDefinitions(),
                toolChoice: 'auto',
                abortSignal: abortControllerRef.current?.signal,
              });
              
              if (followUpResponse?.choices?.[0]) {
                const followUpChoice = followUpResponse.choices[0];
                const followUpToolCalls = followUpChoice.message?.tool_calls || null;
                const followUpContent = followUpChoice.message?.content || 'Continuing...';
                
                const followUpAssistantMessage = createAssistantMessage(followUpContent, followUpToolCalls);
                setMessages(prev => [...prev, followUpAssistantMessage]);
                
                // Execute the follow-up tool calls
                if (followUpToolCalls && followUpToolCalls.length > 0) {
                  const followUpSuccess = await executeToolCalls(followUpToolCalls, followUpAssistantMessage);
                  
                  if (followUpSuccess) {
                    const followUpNames = followUpToolCalls.map(tc => tc.function.name);
                    let summary = '';
                    if (followUpNames.includes('moveShape')) {
                      summary = '✓ Shape moved successfully!';
                    } else if (followUpNames.includes('rotateShape')) {
                      summary = '✓ Shape rotated successfully!';
                    }
                    
                    if (summary) {
                      const summaryMessage = createAssistantMessage(summary);
                      setMessages(prev => [...prev, summaryMessage]);
                    }
                  }
                }
              }
            } catch (followUpError) {
              console.error('Follow-up call failed:', followUpError);
              // If follow-up fails, just show the canvas state was retrieved
              const fallbackMessage = createAssistantMessage('✓ Retrieved canvas state.');
              setMessages(prev => [...prev, fallbackMessage]);
            }
          } else {
            // Normal case - show success message
            if (success) {
              let summary = '';
              if (toolNames.includes('createShape')) {
                summary = '✓ Shape created successfully!';
              } else if (toolNames.includes('moveShape')) {
                summary = '✓ Shape moved successfully!';
              } else if (toolNames.includes('rotateShape')) {
                summary = '✓ Shape rotated successfully!';
              } else if (toolNames.includes('createGrid')) {
                summary = '✓ Grid created successfully!';
              } else if (toolNames.includes('createShapesVertically')) {
                summary = '✓ Shapes created vertically!';
              } else if (toolNames.includes('createShapesHorizontally')) {
                summary = '✓ Shapes created horizontally!';
              } else if (toolNames.includes('getCanvasState')) {
                summary = '✓ Retrieved canvas state.';
              }
              
              if (summary) {
                const summaryMessage = createAssistantMessage(summary);
                setMessages(prev => [...prev, summaryMessage]);
              }
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
  }, [user]);

  /**
   * Cancel ongoing request
   */
  const cancelRequest = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setLoading(false);
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

