import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchSheetData } from '../utils/api';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import useDebounce from '../hooks/useDebounce';
import Header from './Header';
import CollaborativeTable from './CollaborativeTable';
import { TableSkeleton } from './LoadingSkeleton';

const SupplyInventory = () => {
  const { isOnline, showToast, cacheSheetData, getCachedSheetData } = useApp();
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Debounce search term to avoid excessive filtering
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const exportToCSV = useCallback(() => {
    if (filteredData.length === 0) {
      showToast('No data to export', 'error');
      return;
    }

    const headers = ['Item Name', 'Category', 'Quantity', 'Unit', 'Location', 'Status'];
    const csvContent = [
      headers.join(','),
      ...filteredData.map(row => 
        headers.map(header => {
          const value = row[header] || '';
          return `"${String(value).replace(/"/g, '""')}"`;
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `supply_inventory_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Data exported successfully', 'success');
  }, [showToast]);

  const handlePrint = useCallback(() => {
    window.print();
    showToast('Print dialog opened', 'info');
  }, [showToast]);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const result = await fetchSheetData('supply');
      const sheetData = result.data || [];
      setData(sheetData);
      
      // Cache the data
      await cacheSheetData('supply', sheetData);
    } catch (error) {
      console.error('Error loading supply data:', error);
      
      // Try to load from IndexedDB
      const cached = await getCachedSheetData('supply');
      if (cached && cached.data) {
        setData(cached.data);
        showToast('Loaded cached data', 'info');
      } else {
        showToast('Failed to load data', 'error');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Memoize filtered data to avoid recalculating on every render
  const filteredData = useMemo(() => {
    if (!debouncedSearchTerm) {
      return data;
    }
    
    return data.filter((item) =>
      Object.values(item).some((val) =>
        String(val).toLowerCase().includes(debouncedSearchTerm.toLowerCase())
      )
    );
  }, [debouncedSearchTerm, data]);

  // Memoize columns configuration
  const columns = useMemo(() => [
    { key: 'Item Name', label: 'Item Name', className: isDarkMode ? 'font-semibold text-white' : 'font-semibold text-gray-900' },
    { key: 'Category', label: 'Category', className: isDarkMode ? 'text-gray-300' : 'text-gray-600' },
    { key: 'Quantity', label: 'Quantity', className: isDarkMode ? 'text-gray-300' : 'text-gray-900' },
    { key: 'Unit', label: 'Unit', className: isDarkMode ? 'text-gray-300' : 'text-gray-600' },
    { key: 'Location', label: 'Location', className: isDarkMode ? 'text-gray-300' : 'text-gray-600' },
    {
      key: 'Status',
      label: 'Status',
      render: (value) => (
        <span
          className={`px-3 py-1 rounded-full text-xs font-semibold ${
            value === 'In Stock'
              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
              : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
          }`}
        >
          {value || ''}
        </span>
      )
    },
  ], [isDarkMode]);

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isDarkMode 
        ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' 
        : 'bg-gradient-to-br from-cyan-50 via-white to-blue-50'
    }`}>
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className={`mb-6 p-6 rounded-2xl backdrop-blur-xl border transition-all duration-300 ${
          isDarkMode
            ? 'bg-gray-800/50 border-gray-700/50'
            : 'bg-white/80 border-white/50'
        }`}>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/')}
                className={`px-4 py-2 rounded-xl font-semibold transition-all flex items-center gap-2 hover:scale-105 ${
                  isDarkMode
                    ? 'bg-gray-700 hover:bg-gray-600 text-white'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
                data-testid="back-button"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back
              </button>
              <div>
                <h1 className={`text-3xl font-bold flex items-center gap-3 ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  📦 Supply Inventory
                </h1>
                <p className={`text-sm mt-1 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  {filteredData.length} items found
                </p>
              </div>
            </div>
            
            {/* Export and Print Buttons */}
            <div className="flex items-center gap-3">
              <button
                onClick={exportToCSV}
                className={`px-4 py-2 rounded-xl font-semibold transition-all flex items-center gap-2 hover:scale-105 ${
                  isDarkMode
                    ? 'bg-green-600 hover:bg-green-500 text-white'
                    : 'bg-green-500 hover:bg-green-600 text-white'
                }`}
                data-testid="export-csv-button"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export CSV
              </button>
              <button
                onClick={handlePrint}
                className={`px-4 py-2 rounded-xl font-semibold transition-all flex items-center gap-2 hover:scale-105 ${
                  isDarkMode
                    ? 'bg-blue-600 hover:bg-blue-500 text-white'
                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                }`}
                data-testid="print-button"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Print
              </button>
            </div>
          </div>
        </div>

        {/* Search Box */}
        <div className={`mb-6 p-6 rounded-2xl backdrop-blur-xl border transition-all duration-300 ${
          isDarkMode
            ? 'bg-gray-800/50 border-gray-700/50'
            : 'bg-white/80 border-white/50'
        }`}>
          <div className="relative">
            <svg
              className={`absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-400'
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search by item name, category, or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-12 pr-4 py-3 rounded-xl border-2 transition-all focus:outline-none focus:ring-2 ${
                isDarkMode
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-cyan-500 focus:ring-cyan-500/50'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-cyan-500 focus:ring-cyan-500/50'
              }`}
              data-testid="search-input"
            />
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <TableSkeleton rows={8} columns={6} />
        ) : (
          <CollaborativeTable
            data={filteredData}
            columns={columns}
            sheetType="supply"
            enableBulkOperations={true}
            onDataChange={(newData) => {
              // Update local data state
              setData(newData);
              // Cache the updated data
              cacheSheetData('supply', newData);
            }}
            emptyMessage="No items found"
          />
        )}
      </div>
    </div>
  );
};

export default memo(SupplyInventory);
