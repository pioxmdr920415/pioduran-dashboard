import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useApp } from '../context/AppContext';
import { exportData, downloadBlob } from '../utils/api';

const ExportDialog = ({ isOpen, onClose, sheetType, columns, data }) => {
  const { isDarkMode } = useTheme();
  const { showToast } = useApp();

  const [selectedFormat, setSelectedFormat] = useState('csv');
  const [selectedColumns, setSelectedColumns] = useState([]);
  const [isExporting, setIsExporting] = useState(false);
  const [includeAllColumns, setIncludeAllColumns] = useState(true);

  // Initialize selected columns when dialog opens
  React.useEffect(() => {
    if (isOpen && columns) {
      setSelectedColumns(columns.map(col => col.key));
    }
  }, [isOpen, columns]);

  const handleColumnToggle = (columnKey) => {
    setSelectedColumns(prev =>
      prev.includes(columnKey)
        ? prev.filter(key => key !== columnKey)
        : [...prev, columnKey]
    );
  };

  const handleSelectAllColumns = () => {
    if (columns) {
      setSelectedColumns(columns.map(col => col.key));
    }
  };

  const handleDeselectAllColumns = () => {
    setSelectedColumns([]);
  };

  const handleExport = async () => {
    if (!selectedFormat) return;

    setIsExporting(true);
    try {
      const columnsParam = includeAllColumns ? null : selectedColumns.join(',');

      const blob = await exportData(sheetType, selectedFormat, columnsParam);

      // Generate filename
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '');
      const extensions = {
        csv: 'csv',
        excel: 'xlsx',
        pdf: 'pdf'
      };

      const filename = `${sheetType}_export_${timestamp}.${extensions[selectedFormat]}`;

      downloadBlob(blob, filename);
      showToast(`Data exported successfully as ${selectedFormat.toUpperCase()}`, 'success');
      onClose();

    } catch (error) {
      showToast(`Export failed: ${error.message}`, 'error');
    } finally {
      setIsExporting(false);
    }
  };

  const formatOptions = [
    {
      value: 'csv',
      label: 'CSV',
      description: 'Comma-separated values, compatible with Excel and other spreadsheet software',
      icon: '📊'
    },
    {
      value: 'excel',
      label: 'Excel',
      description: 'Microsoft Excel format with professional styling and formatting',
      icon: '📈'
    },
    {
      value: 'pdf',
      label: 'PDF',
      description: 'Portable Document Format, perfect for printing and sharing',
      icon: '📄'
    }
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={`p-6 rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto ${
        isDarkMode ? 'bg-gray-800' : 'bg-white'
      }`}>
        <div className="flex items-center justify-between mb-6">
          <h3 className={`text-xl font-semibold ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>
            Export Data
          </h3>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors ${
              isDarkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'
            }`}
          >
            ✕
          </button>
        </div>

        {/* Format Selection */}
        <div className="mb-6">
          <h4 className={`text-lg font-medium mb-3 ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>
            Choose Export Format
          </h4>
          <div className="grid gap-3">
            {formatOptions.map(format => (
              <label
                key={format.value}
                className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  selectedFormat === format.value
                    ? (isDarkMode ? 'border-blue-500 bg-blue-900/20' : 'border-blue-500 bg-blue-50')
                    : (isDarkMode ? 'border-gray-600 hover:border-gray-500' : 'border-gray-300 hover:border-gray-400')
                }`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="radio"
                    name="format"
                    value={format.value}
                    checked={selectedFormat === format.value}
                    onChange={(e) => setSelectedFormat(e.target.value)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-2xl">{format.icon}</span>
                      <span className={`font-semibold ${
                        isDarkMode ? 'text-white' : 'text-gray-900'
                      }`}>
                        {format.label}
                      </span>
                    </div>
                    <p className={`text-sm ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-600'
                    }`}>
                      {format.description}
                    </p>
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Column Selection */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h4 className={`text-lg font-medium ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              Column Selection
            </h4>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={includeAllColumns}
                onChange={(e) => setIncludeAllColumns(e.target.checked)}
                className="rounded"
              />
              <span className={`text-sm ${
                isDarkMode ? 'text-gray-300' : 'text-gray-600'
              }`}>
                Export all columns
              </span>
            </label>
          </div>

          {!includeAllColumns && (
            <div className={`p-4 border rounded-lg ${
              isDarkMode ? 'border-gray-600 bg-gray-700' : 'border-gray-300 bg-gray-50'
            }`}>
              <div className="flex gap-2 mb-3">
                <button
                  onClick={handleSelectAllColumns}
                  className={`px-3 py-1 text-sm rounded transition-colors ${
                    isDarkMode
                      ? 'bg-gray-600 hover:bg-gray-500 text-white'
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                  }`}
                >
                  Select All
                </button>
                <button
                  onClick={handleDeselectAllColumns}
                  className={`px-3 py-1 text-sm rounded transition-colors ${
                    isDarkMode
                      ? 'bg-gray-600 hover:bg-gray-500 text-white'
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                  }`}
                >
                  Deselect All
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                {columns?.map(column => (
                  <label key={column.key} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedColumns.includes(column.key)}
                      onChange={() => handleColumnToggle(column.key)}
                      className="rounded"
                    />
                    <span className={`text-sm ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      {column.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Export Summary */}
        <div className={`p-4 rounded-lg mb-6 ${
          isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
        }`}>
          <h5 className={`font-medium mb-2 ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>
            Export Summary
          </h5>
          <div className={`text-sm space-y-1 ${
            isDarkMode ? 'text-gray-300' : 'text-gray-600'
          }`}>
            <p>Format: <span className="font-medium">{formatOptions.find(f => f.value === selectedFormat)?.label}</span></p>
            <p>Records: <span className="font-medium">{data?.length || 0}</span></p>
            <p>Columns: <span className="font-medium">
              {includeAllColumns ? 'All' : `${selectedColumns.length} selected`}
            </span></p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isExporting}
            className={`px-4 py-2 rounded font-semibold transition-colors ${
              isDarkMode
                ? 'bg-gray-700 hover:bg-gray-600 text-white'
                : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
            }`}
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting || !selectedFormat || (!includeAllColumns && selectedColumns.length === 0)}
            className={`px-6 py-2 rounded font-semibold text-white transition-colors ${
              isExporting || !selectedFormat || (!includeAllColumns && selectedColumns.length === 0)
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-green-500 hover:bg-green-600'
            }`}
          >
            {isExporting ? 'Exporting...' : 'Export Data'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportDialog;