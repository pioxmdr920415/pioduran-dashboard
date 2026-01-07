import React, { useState, useEffect, useCallback, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchSheetData, fetchSheetDataDirect, createRecord, updateRecord, deleteRecord } from '../utils/api';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import Header from './Header';
import CollaborativeTable from './CollaborativeTable';
import { TableSkeleton } from './LoadingSkeleton';
import AddRecordModal from './AddRecordModal.jsx';
import EditRecordModal from './EditRecordModal.jsx';
import DeleteConfirmDialog from './DeleteConfirmDialog.jsx';

const ContactDirectory = () => {
  const { showToast, cacheSheetData, getCachedSheetData } = useApp();
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [selectedRowIndex, setSelectedRowIndex] = useState(null);
  const [deleteRecordName, setDeleteRecordName] = useState('');
  const [isActionLoading, setIsActionLoading] = useState(false);

  const handleCreateRecord = async (recordData) => {
    setIsActionLoading(true);
    try {
      const response = await createRecord('contact', recordData);
      showToast('Contact created successfully', 'success');
      await loadData();
      setShowAddModal(false);
    } catch (error) {
      console.error('Error creating contact:', error);
      showToast(`Failed to create contact: ${error.message}`, 'error');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleUpdateRecord = async (recordData, rowIndex) => {
    setIsActionLoading(true);
    try {
      const response = await updateRecord('contact', rowIndex + 2, recordData);
      showToast('Contact updated successfully', 'success');
      await loadData();
      setShowEditModal(false);
      setSelectedRecord(null);
      setSelectedRowIndex(null);
    } catch (error) {
      console.error('Error updating contact:', error);
      showToast(`Failed to update contact: ${error.message}`, 'error');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleDeleteRecord = async () => {
    setIsActionLoading(true);
    try {
      const response = await deleteRecord('contact', selectedRowIndex + 2);
      showToast('Contact deleted successfully', 'success');
      await loadData();
      setShowDeleteDialog(false);
      setSelectedRecord(null);
      setSelectedRowIndex(null);
      setDeleteRecordName('');
    } catch (error) {
      console.error('Error deleting contact:', error);
      showToast(`Failed to delete contact: ${error.message}`, 'error');
    } finally {
      setIsActionLoading(false);
    }
  };

  const openEditModal = (record, rowIndex) => {
    setSelectedRecord(record);
    setSelectedRowIndex(rowIndex);
    setShowEditModal(true);
  };

  const openDeleteDialog = (record, rowIndex) => {
    setSelectedRecord(record);
    setSelectedRowIndex(rowIndex);
    setDeleteRecordName(record['Name'] || `Contact at row ${rowIndex + 1}`);
    setShowDeleteDialog(true);
  };

  const exportToCSV = useCallback(() => {
    if (filteredData.length === 0) {
      showToast('No data to export', 'error');
      return;
    }

    const headers = ['Name', 'Position', 'Department', 'Phone', 'Email'];
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
    link.setAttribute('download', `contact_directory_${new Date().toISOString().split('T')[0]}.csv`);
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
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Try direct Google Sheets API first (bypasses backend)
      let result;
      let directSuccess = false;
      
      try {
        console.log('Attempting direct Google Sheets API for contacts...');
        result = await fetchSheetDataDirect('contact');
        directSuccess = true;
        console.log('Direct API succeeded for contacts');
      } catch (directError) {
        console.warn('Direct API failed for contacts, falling back to backend:', directError.message);
        // Fall back to backend API
        result = await fetchSheetData('contact');
      }
      
      const sheetData = result.data || [];
      setData(sheetData);
      setFilteredData(sheetData);
      await cacheSheetData('contact', sheetData);
      
      if (directSuccess) {
        showToast('Contacts loaded directly from Google Sheets', 'success');
      }
    } catch (error) {
      const cached = await getCachedSheetData('contact');
      if (cached && cached.data) {
        setData(cached.data);
        setFilteredData(cached.data);
        showToast('Loaded cached data', 'info');
      } else {
        showToast('Failed to load data', 'error');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!searchTerm) {
      setFilteredData(data);
    } else {
      const filtered = data.filter((item) =>
        Object.values(item).some((val) =>
          String(val).toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
      setFilteredData(filtered);
    }
  }, [searchTerm, data]);

  const columns = [
    { key: 'Name', label: 'Name', className: isDarkMode ? 'font-semibold text-white' : 'font-semibold text-gray-900' },
    { key: 'Position', label: 'Position', className: isDarkMode ? 'text-gray-300' : 'text-gray-600' },
    { key: 'Department', label: 'Department', className: isDarkMode ? 'text-gray-300' : 'text-gray-600' },
    { key: 'Phone', label: 'Phone', className: isDarkMode ? 'text-gray-300' : 'text-gray-900' },
    { key: 'Email', label: 'Email', className: isDarkMode ? 'text-blue-400' : 'text-blue-600' },
  ];

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isDarkMode 
        ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' 
        : 'bg-gradient-to-br from-green-50 via-white to-emerald-50'
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
                  👥 Contact Directory
                </h1>
                <p className={`text-sm mt-1 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  {filteredData.length} contacts found
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowAddModal(true)}
                className={`px-4 py-2 rounded-xl font-semibold transition-all flex items-center gap-2 hover:scale-105 ${
                  isDarkMode
                    ? 'bg-purple-600 hover:bg-purple-500 text-white'
                    : 'bg-purple-500 hover:bg-purple-600 text-white'
                }`}
                data-testid="add-button"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Contact
              </button>
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
              placeholder="Search by name, position, or department..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-12 pr-4 py-3 rounded-xl border-2 transition-all focus:outline-none focus:ring-2 ${
                isDarkMode
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-green-500 focus:ring-green-500/50'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-green-500 focus:ring-green-500/50'
              }`}
              data-testid="search-input"
            />
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <TableSkeleton rows={8} columns={5} />
        ) : (
          <CollaborativeTable
            data={filteredData}
            columns={columns}
            sheetType="contact"
            enableBulkOperations={true}
            enableCRUD={true}
            onEdit={openEditModal}
            onDelete={openDeleteDialog}
            onDataChange={(newData) => {
              setData(newData);
              setFilteredData(newData);
              cacheSheetData('contact', newData);
            }}
            emptyMessage="No contacts found. Click 'Add Contact' to create a new record."
          />
        )}
      </div>

      {/* Add Record Modal */}
      <AddRecordModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        sheetType="contact"
        onSubmit={handleCreateRecord}
        isDarkMode={isDarkMode}
      />

      {/* Edit Record Modal */}
      <EditRecordModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedRecord(null);
          setSelectedRowIndex(null);
        }}
        sheetType="contact"
        record={selectedRecord}
        rowIndex={selectedRowIndex}
        onSubmit={handleUpdateRecord}
        isDarkMode={isDarkMode}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => {
          setShowDeleteDialog(false);
          setSelectedRecord(null);
          setSelectedRowIndex(null);
          setDeleteRecordName('');
        }}
        onConfirm={handleDeleteRecord}
        record={selectedRecord}
        recordName={deleteRecordName}
        isLoading={isActionLoading}
      />
    </div>
  );
};

export default memo(ContactDirectory);
