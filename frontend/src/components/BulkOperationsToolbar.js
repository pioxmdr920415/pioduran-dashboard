import React, { useState, useCallback } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useApp } from '../context/AppContext';
import { bulkUpdate, bulkDelete, bulkImport, getBulkOperationStatus } from '../utils/api';
import { useCollaborative } from '../context/CollaborativeContext';
import ExportDialog from './ExportDialog';

const BulkOperationsToolbar = ({
  selectedRows,
  onClearSelection,
  sheetType,
  columns,
  onDataChange,
  data
}) => {
  const { isDarkMode } = useTheme();
  const { showToast } = useApp();
  const { sendOperation } = useCollaborative();

  const [isProcessing, setIsProcessing] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importData, setImportData] = useState('');
  const [updateExisting, setUpdateExisting] = useState(false);
  const [bulkOperationId, setBulkOperationId] = useState(null);
  const [operationProgress, setOperationProgress] = useState(null);
  const [showExportDialog, setShowExportDialog] = useState(false);

  const handleBulkUpdate = useCallback(async (field, value) => {
    if (selectedRows.length === 0) return;

    setIsProcessing(true);
    try {
      const updates = selectedRows.map(rowIndex => ({
        row_index: rowIndex,
        column_key: field,
        new_value: value,
        old_value: data[rowIndex]?.[field]
      }));

      const result = await bulkUpdate(sheetType, updates, `Bulk update ${field} for ${selectedRows.length} rows`);
      setBulkOperationId(result.bulk_operation_id);

      showToast(`Bulk update started for ${selectedRows.length} rows`, 'info');

      // Start monitoring progress
      monitorBulkOperation(result.bulk_operation_id);

    } catch (error) {
      showToast(`Bulk update failed: ${error.message}`, 'error');
    } finally {
      setIsProcessing(false);
    }
  }, [selectedRows, sheetType, data, showToast]);

  const handleBulkDelete = useCallback(async () => {
    if (selectedRows.length === 0) return;

    const confirmed = window.confirm(`Are you sure you want to delete ${selectedRows.length} selected rows?`);
    if (!confirmed) return;

    setIsProcessing(true);
    try {
      const result = await bulkDelete(sheetType, selectedRows, `Bulk delete ${selectedRows.length} rows`);
      setBulkOperationId(result.bulk_operation_id);

      showToast(`Bulk delete started for ${selectedRows.length} rows`, 'info');

      // Start monitoring progress
      monitorBulkOperation(result.bulk_operation_id);

    } catch (error) {
      showToast(`Bulk delete failed: ${error.message}`, 'error');
    } finally {
      setIsProcessing(false);
    }
  }, [selectedRows, sheetType, showToast]);

  const handleBulkImport = useCallback(async () => {
    if (!importData.trim()) return;

    setIsProcessing(true);
    try {
      let parsedData;
      try {
        parsedData = JSON.parse(importData);
      } catch (e) {
        // Try CSV parsing
        parsedData = parseCSV(importData);
      }

      if (!Array.isArray(parsedData)) {
        throw new Error('Import data must be an array of objects');
      }

      const result = await bulkImport(sheetType, parsedData, updateExisting, `Bulk import ${parsedData.length} rows`);
      setBulkOperationId(result.bulk_operation_id);

      showToast(`Bulk import started for ${parsedData.length} rows`, 'info');

      // Start monitoring progress
      monitorBulkOperation(result.bulk_operation_id);

      setShowImportDialog(false);
      setImportData('');

    } catch (error) {
      showToast(`Bulk import failed: ${error.message}`, 'error');
    } finally {
      setIsProcessing(false);
    }
  }, [importData, updateExisting, sheetType, showToast]);

  const monitorBulkOperation = useCallback(async (operationId) => {
    const checkStatus = async () => {
      try {
        const status = await getBulkOperationStatus(operationId);
        setOperationProgress(status);

        if (status.status === 'completed') {
          showToast(`Bulk operation completed successfully!`, 'success');
          onClearSelection();
          setBulkOperationId(null);
          setOperationProgress(null);
        } else if (status.status === 'failed') {
          showToast(`Bulk operation failed: ${status.error_message}`, 'error');
          setBulkOperationId(null);
          setOperationProgress(null);
        } else {
          // Continue monitoring
          setTimeout(checkStatus, 1000);
        }
      } catch (error) {
        console.error('Failed to check bulk operation status:', error);
        setTimeout(checkStatus, 2000);
      }
    };

    checkStatus();
  }, [showToast, onClearSelection]);

  const parseCSV = (csvText) => {
    const lines = csvText.trim().split('\n');
    if (lines.length < 2) throw new Error('CSV must have at least a header row and one data row');

    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const rows = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
      const row = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      rows.push(row);
    }

    return rows;
  };

  if (selectedRows.length === 0 && !operationProgress) {
    return null;
  }

  return (
    <>
      {/* Progress Indicator */}
      {operationProgress && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg border ${
          isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <div className="text-sm font-medium mb-1">
                Bulk Operation Progress
              </div>
              <div className="w-48 bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${operationProgress.progress}%` }}
                />
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                {operationProgress.progress}% complete
              </div>
            </div>
            <button
              onClick={() => {
                setBulkOperationId(null);
                setOperationProgress(null);
              }}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Bulk Operations Toolbar */}
      <div className={`mb-4 p-4 rounded-lg border ${
        isDarkMode
          ? 'bg-gray-800/50 border-gray-700'
          : 'bg-blue-50 border-blue-200'
      }`}>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <span className={`font-semibold ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              {selectedRows.length} row{selectedRows.length !== 1 ? 's' : ''} selected
            </span>
            <button
              onClick={onClearSelection}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                isDarkMode
                  ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
              }`}
            >
              Clear Selection
            </button>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Bulk Update Dropdown */}
            <div className="relative">
              <select
                onChange={(e) => {
                  const [field, value] = e.target.value.split(':');
                  if (field && value) {
                    handleBulkUpdate(field, value);
                  }
                  e.target.value = '';
                }}
                disabled={isProcessing}
                className={`px-3 py-2 rounded border text-sm ${
                  isDarkMode
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              >
                <option value="">Bulk Update...</option>
                {columns.map(col => (
                  <optgroup key={col.key} label={col.label}>
                    {col.key === 'Status' && (
                      <>
                        <option value={`${col.key}:In Stock`}>Set to In Stock</option>
                        <option value={`${col.key}:Out of Stock`}>Set to Out of Stock</option>
                      </>
                    )}
                    {col.key === 'Status' && sheetType === 'event' && (
                      <>
                        <option value={`${col.key}:Upcoming`}>Set to Upcoming</option>
                        <option value={`${col.key}:Completed`}>Set to Completed</option>
                        <option value={`${col.key}:Cancelled`}>Set to Cancelled</option>
                      </>
                    )}
                  </optgroup>
                ))}
              </select>
            </div>

            {/* Bulk Delete */}
            <button
              onClick={handleBulkDelete}
              disabled={isProcessing}
              className={`px-4 py-2 rounded font-semibold text-white text-sm transition-all ${
                isProcessing
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-red-500 hover:bg-red-600'
              }`}
            >
              {isProcessing ? 'Processing...' : 'Delete Selected'}
            </button>

            {/* Bulk Import */}
            <button
              onClick={() => setShowImportDialog(true)}
              disabled={isProcessing}
              className={`px-4 py-2 rounded font-semibold text-white text-sm transition-all ${
                isProcessing
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-green-500 hover:bg-green-600'
              }`}
            >
              Import Data
            </button>

            {/* Export Data */}
            <button
              onClick={() => setShowExportDialog(true)}
              disabled={isProcessing}
              className={`px-4 py-2 rounded font-semibold text-white text-sm transition-all ${
                isProcessing
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-purple-500 hover:bg-purple-600'
              }`}
            >
              Export Data
            </button>
          </div>
        </div>
      </div>

      {/* Import Dialog */}
      {showImportDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`p-6 rounded-lg max-w-2xl w-full mx-4 ${
            isDarkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <h3 className={`text-lg font-semibold mb-4 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              Bulk Import Data
            </h3>

            <div className="mb-4">
              <label className={`block text-sm font-medium mb-2 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Data Format (JSON array or CSV)
              </label>
              <textarea
                value={importData}
                onChange={(e) => setImportData(e.target.value)}
                placeholder={`JSON: [{"name": "John", "value": "123"}, ...]\n\nCSV: name,value\nJohn,123\nJane,456`}
                rows={10}
                className={`w-full px-3 py-2 border rounded ${
                  isDarkMode
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              />
            </div>

            <div className="mb-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={updateExisting}
                  onChange={(e) => setUpdateExisting(e.target.checked)}
                  className="mr-2"
                />
                <span className={`text-sm ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Update existing rows instead of appending
                </span>
              </label>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowImportDialog(false)}
                className={`px-4 py-2 rounded font-semibold transition-colors ${
                  isDarkMode
                    ? 'bg-gray-700 hover:bg-gray-600 text-white'
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={handleBulkImport}
                disabled={isProcessing || !importData.trim()}
                className={`px-4 py-2 rounded font-semibold text-white transition-colors ${
                  isProcessing || !importData.trim()
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-green-500 hover:bg-green-600'
                }`}
              >
                {isProcessing ? 'Importing...' : 'Import'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Export Dialog */}
      <ExportDialog
        isOpen={showExportDialog}
        onClose={() => setShowExportDialog(false)}
        sheetType={sheetType}
        columns={columns}
        data={data}
      />
    </>
  );
};

export default BulkOperationsToolbar;