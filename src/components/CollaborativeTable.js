import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useCollaborative } from '../context/CollaborativeContext';
import { useTheme } from '../context/ThemeContext';
import BulkOperationsToolbar from './BulkOperationsToolbar';

const CollaborativeTable = ({
  data,
  columns,
  sheetType,
  onDataChange,
  emptyMessage = "No data available",
  enableBulkOperations = true
}) => {
  const { isDarkMode } = useTheme();
  const {
    connectToSheet,
    disconnectFromSheet,
    isConnected,
    getActiveUsers,
    sendOperation,
    updateCursor,
    userId,
    userColor,
    cursors
  } = useCollaborative();

  const [editingCell, setEditingCell] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [localData, setLocalData] = useState(data);
  const [selectedRows, setSelectedRows] = useState([]);
  const inputRef = useRef(null);

  // Bulk selection handlers
  const handleRowSelect = useCallback((rowIndex, selected) => {
    setSelectedRows(prev => {
      if (selected) {
        return [...prev, rowIndex].sort((a, b) => a - b);
      } else {
        return prev.filter(i => i !== rowIndex);
      }
    });
  }, []);

  const handleSelectAll = useCallback((selected) => {
    if (selected) {
      setSelectedRows(localData.map((_, index) => index));
    } else {
      setSelectedRows([]);
    }
  }, [localData]);

  const clearSelection = useCallback(() => {
    setSelectedRows([]);
  }, []);

  // Connect to collaborative editing when component mounts
  useEffect(() => {
    connectToSheet(sheetType);
    return () => disconnectFromSheet(sheetType);
  }, [sheetType, connectToSheet, disconnectFromSheet]);

  // Update local data when props change
  useEffect(() => {
    setLocalData(data);
  }, [data]);

  const handleCellClick = useCallback((rowIndex, columnKey, currentValue) => {
    setEditingCell({ rowIndex, columnKey });
    setEditValue(currentValue || '');
    setTimeout(() => inputRef.current?.focus(), 0);
  }, []);

  const handleCellEdit = useCallback((value) => {
    if (!editingCell) return;

    const { rowIndex, columnKey } = editingCell;
    const oldValue = localData[rowIndex]?.[columnKey];

    // Update local data immediately for optimistic UI
    const newData = [...localData];
    if (!newData[rowIndex]) newData[rowIndex] = {};
    newData[rowIndex][columnKey] = value;
    setLocalData(newData);

    // Send operation to other users
    sendOperation(sheetType, {
      sheet_type: sheetType,
      operation_type: 'update',
      row_index: rowIndex,
      column_key: columnKey,
      old_value: oldValue,
      new_value: value
    });

    // Notify parent component
    onDataChange?.(newData);

    setEditingCell(null);
    setEditValue('');
  }, [editingCell, localData, sheetType, sendOperation, onDataChange]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter') {
      handleCellEdit(editValue);
    } else if (e.key === 'Escape') {
      setEditingCell(null);
      setEditValue('');
    }
  }, [editValue, handleCellEdit]);

  const handleMouseMove = useCallback((e, rowIndex, columnKey) => {
    const rect = e.currentTarget.getBoundingClientRect();
    updateCursor(sheetType, {
      rowIndex,
      columnKey,
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  }, [sheetType, updateCursor]);

  const activeUsers = getActiveUsers(sheetType);
  const showCollaborators = activeUsers.length > 1;

  return (
    <div className="relative">
      {/* Bulk Operations Toolbar */}
      {enableBulkOperations && (
        <BulkOperationsToolbar
          selectedRows={selectedRows}
          onClearSelection={clearSelection}
          sheetType={sheetType}
          columns={columns}
          onDataChange={onDataChange}
          data={localData}
        />
      )}

      {/* Connection Status */}
      <div className="mb-4 flex items-center gap-4">
        <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
          isConnected(sheetType)
            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
            : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
        }`}>
          <div className={`w-2 h-2 rounded-full ${
            isConnected(sheetType) ? 'bg-green-500' : 'bg-red-500'
          }`} />
          {isConnected(sheetType) ? 'Connected' : 'Disconnected'}
        </div>

        {showCollaborators && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {activeUsers.length} user{activeUsers.length !== 1 ? 's' : ''} editing:
            </span>
            <div className="flex gap-1">
              {activeUsers.map(user => (
                <div
                  key={user.user_id}
                  className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold text-white"
                  style={{ backgroundColor: user.color }}
                  title={user.username}
                >
                  {user.username.charAt(0).toUpperCase()}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className={`${
            isDarkMode ? 'bg-gray-800' : 'bg-gray-50'
          }`}>
            <tr>
              {enableBulkOperations && (
                <th className={`px-4 py-4 text-left text-sm font-semibold ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  <input
                    type="checkbox"
                    checked={selectedRows.length === localData.length && localData.length > 0}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className={`rounded border-gray-300 ${
                      isDarkMode ? 'bg-gray-700 border-gray-600' : ''
                    }`}
                  />
                </th>
              )}
              {columns.map((column, index) => (
                <th
                  key={column.key || index}
                  className={`px-4 md:px-6 py-4 text-left text-sm font-semibold ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className={`divide-y ${
            isDarkMode ? 'divide-gray-700' : 'divide-gray-200'
          }`}>
            {localData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (enableBulkOperations ? 1 : 0)}
                  className={`px-4 md:px-6 py-20 text-center ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}
                >
                  <div className="text-6xl mb-4">📋</div>
                  <h3 className="text-xl font-bold mb-2">No data available</h3>
                  <p>{emptyMessage}</p>
                </td>
              </tr>
            ) : (
              localData.map((row, rowIndex) => (
                <tr
                  key={rowIndex}
                  className={`${
                    selectedRows.includes(rowIndex)
                      ? (isDarkMode ? 'bg-blue-900/30' : 'bg-blue-50')
                      : (isDarkMode ? 'hover:bg-gray-800/50' : 'hover:bg-gray-50')
                  } transition-colors relative`}
                >
                  {enableBulkOperations && (
                    <td className="px-4 py-4">
                      <input
                        type="checkbox"
                        checked={selectedRows.includes(rowIndex)}
                        onChange={(e) => handleRowSelect(rowIndex, e.target.checked)}
                        className={`rounded border-gray-300 ${
                          isDarkMode ? 'bg-gray-700 border-gray-600' : ''
                        }`}
                      />
                    </td>
                  )}
                  {columns.map((column, colIndex) => {
                    const cellValue = row[column.key] || '';
                    const isEditing = editingCell?.rowIndex === rowIndex && editingCell?.columnKey === column.key;

                    return (
                      <td
                        key={column.key || colIndex}
                        className={`px-4 md:px-6 py-4 relative ${
                          column.className || (isDarkMode ? 'text-gray-300' : 'text-gray-900')
                        }`}
                        onMouseMove={(e) => handleMouseMove(e, rowIndex, column.key)}
                      >
                        {isEditing ? (
                          <input
                            ref={inputRef}
                            type="text"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={() => handleCellEdit(editValue)}
                            onKeyDown={handleKeyDown}
                            className={`w-full px-2 py-1 border rounded focus:outline-none focus:ring-2 ${
                              isDarkMode
                                ? 'bg-gray-700 border-gray-600 text-white focus:ring-blue-500'
                                : 'bg-white border-gray-300 text-gray-900 focus:ring-blue-500'
                            }`}
                          />
                        ) : (
                          <div
                            className="cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded px-2 py-1 -mx-2 -my-1"
                            onClick={() => handleCellClick(rowIndex, column.key, cellValue)}
                            title="Click to edit"
                          >
                            {column.render ? column.render(cellValue, row) : cellValue}
                          </div>
                        )}

                        {/* Collaborative cursors */}
                        {showCollaborators && Object.entries(cursors[sheetType] || {}).map(([userId, position]) => {
                          if (position.rowIndex === rowIndex && position.columnKey === column.key) {
                            const user = activeUsers.find(u => u.user_id === userId);
                            if (user && user.user_id !== userId) { // Don't show own cursor
                              return (
                                <div
                                  key={userId}
                                  className="absolute pointer-events-none"
                                  style={{
                                    left: position.x,
                                    top: position.y,
                                    transform: 'translate(-50%, -100%)'
                                  }}
                                >
                                  <div
                                    className="w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent"
                                    style={{ borderBottomColor: user.color }}
                                  />
                                  <div
                                    className="px-2 py-1 rounded text-xs text-white whitespace-nowrap"
                                    style={{ backgroundColor: user.color }}
                                  >
                                    {user.username}
                                  </div>
                                </div>
                              );
                            }
                          }
                          return null;
                        })}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Edit Instructions */}
      <div className={`mt-4 p-4 rounded-lg ${
        isDarkMode ? 'bg-blue-900/20 border border-blue-800' : 'bg-blue-50 border border-blue-200'
      }`}>
        <h4 className={`font-semibold mb-2 ${
          isDarkMode ? 'text-blue-400' : 'text-blue-800'
        }`}>
          💡 Collaborative Editing Tips
        </h4>
        <ul className={`text-sm space-y-1 ${
          isDarkMode ? 'text-blue-300' : 'text-blue-700'
        }`}>
          <li>• Click any cell to edit its content</li>
          <li>• Press Enter to save changes, Escape to cancel</li>
          <li>• See other users' cursors in real-time</li>
          <li>• Changes are synchronized instantly across all users</li>
        </ul>
      </div>
    </div>
  );
};

export default CollaborativeTable;