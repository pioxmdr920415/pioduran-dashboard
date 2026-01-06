import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { useApp } from './AppContext';

const CollaborativeContext = createContext();

export const useCollaborative = () => {
  const context = useContext(CollaborativeContext);
  if (!context) {
    throw new Error('useCollaborative must be used within a CollaborativeProvider');
  }
  return context;
};

export const CollaborativeProvider = ({ children }) => {
  const { showToast } = useApp();
  const [connections, setConnections] = useState({});
  const [userPresence, setUserPresence] = useState({});
  const [operations, setOperations] = useState({});
  const [cursors, setCursors] = useState({});
  const wsRefs = useRef({});

  // Generate unique user ID
  const [userId] = useState(() => `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  const [username] = useState(() => `User ${userId.slice(-4)}`);
  const [userColor] = useState(() => `#${Math.floor(Math.random()*16777215).toString(16)}`);

  const connectToSheet = useCallback((sheetType) => {
    if (connections[sheetType]) {
      return; // Already connected
    }

    const wsUrl = `${process.env.REACT_APP_BACKEND_URL?.replace('http', 'ws') || 'ws://localhost:8000'}/api/ws/collaborate/${sheetType}/${userId}`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log(`Connected to collaborative editing for ${sheetType}`);
      setConnections(prev => ({ ...prev, [sheetType]: ws }));
      showToast(`Connected to collaborative editing for ${sheetType}`, 'success');
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        handleWebSocketMessage(sheetType, data);
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    ws.onclose = () => {
      console.log(`Disconnected from collaborative editing for ${sheetType}`);
      setConnections(prev => {
        const newConnections = { ...prev };
        delete newConnections[sheetType];
        return newConnections;
      });
      setUserPresence(prev => {
        const newPresence = { ...prev };
        delete newPresence[sheetType];
        return newPresence;
      });
    };

    ws.onerror = (error) => {
      console.error(`WebSocket error for ${sheetType}:`, error);
      showToast(`Connection error for ${sheetType}`, 'error');
    };

    wsRefs.current[sheetType] = ws;
  }, [connections, userId, showToast]);

  const disconnectFromSheet = useCallback((sheetType) => {
    if (wsRefs.current[sheetType]) {
      wsRefs.current[sheetType].close();
      delete wsRefs.current[sheetType];
    }
  }, []);

  const handleWebSocketMessage = useCallback((sheetType, data) => {
    switch (data.type) {
      case 'presence_update':
        setUserPresence(prev => ({
          ...prev,
          [sheetType]: data.users.reduce((acc, user) => {
            acc[user.user_id] = user;
            return acc;
          }, {})
        }));
        break;

      case 'user_joined':
        setUserPresence(prev => ({
          ...prev,
          [sheetType]: {
            ...prev[sheetType],
            [data.user.user_id]: data.user
          }
        }));
        showToast(`${data.user.username} joined ${sheetType} editing`, 'info');
        break;

      case 'user_left':
        setUserPresence(prev => {
          const newPresence = { ...prev };
          if (newPresence[sheetType]) {
            delete newPresence[sheetType][data.user_id];
          }
          return newPresence;
        });
        break;

      case 'operation':
        setOperations(prev => ({
          ...prev,
          [sheetType]: [...(prev[sheetType] || []), data.operation]
        }));
        break;

      case 'cursor_update':
        setCursors(prev => ({
          ...prev,
          [sheetType]: {
            ...prev[sheetType],
            [data.user_id]: data.position
          }
        }));
        break;

      default:
        console.log('Unknown message type:', data.type);
    }
  }, [showToast]);

  const sendOperation = useCallback((sheetType, operation) => {
    const ws = connections[sheetType];
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'operation',
        operation: {
          ...operation,
          user_id: userId,
          username: username
        }
      }));
    }
  }, [connections, userId, username]);

  const updateCursor = useCallback((sheetType, position) => {
    const ws = connections[sheetType];
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'cursor_update',
        position
      }));
    }
  }, [connections]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      Object.keys(wsRefs.current).forEach(sheetType => {
        wsRefs.current[sheetType].close();
      });
    };
  }, []);

  const value = {
    // Connection management
    connectToSheet,
    disconnectFromSheet,
    connections,

    // User info
    userId,
    username,
    userColor,

    // Collaborative state
    userPresence,
    operations,
    cursors,

    // Actions
    sendOperation,
    updateCursor,

    // Utilities
    isConnected: (sheetType) => !!connections[sheetType],
    getActiveUsers: (sheetType) => Object.values(userPresence[sheetType] || {}),
    getOperations: (sheetType) => operations[sheetType] || []
  };

  return (
    <CollaborativeContext.Provider value={value}>
      {children}
    </CollaborativeContext.Provider>
  );
};