import React, { useState, useEffect, useCallback, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchSheetData, fetchSheetDataDirect, createRecord, updateRecord, deleteRecord } from '../utils/api';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import Header from './Header';
import CollaborativeTable from './CollaborativeTable';
import AddRecordModal from './AddRecordModal.jsx';
import EditRecordModal from './EditRecordModal.jsx';
import DeleteConfirmDialog from './DeleteConfirmDialog.jsx';

const CalendarManagement = () => {
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
      const response = await createRecord('event', recordData);
      showToast('Event created successfully', 'success');
      await loadData();
      setShowAddModal(false);
    } catch (error) {
      console.error('Error creating event:', error);
      showToast(`Failed to create event: ${error.message}`, 'error');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleUpdateRecord = async (recordData, rowIndex) => {
    setIsActionLoading(true);
    try {
      const response = await updateRecord('event', rowIndex + 2, recordData);
      showToast('Event updated successfully', 'success');
      await loadData();
      setShowEditModal(false);
      setSelectedRecord(null);
      setSelectedRowIndex(null);
    } catch (error) {
      console.error('Error updating event:', error);
      showToast(`Failed to update event: ${error.message}`, 'error');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleDeleteRecord = async () => {
    setIsActionLoading(true);
    try {
      const response = await deleteRecord('event', selectedRowIndex + 2);
      showToast('Event deleted successfully', 'success');
      await loadData();
      setShowDeleteDialog(false);
      setSelectedRecord(null);
      setSelectedRowIndex(null);
      setDeleteRecordName('');
    } catch (error) {
      console.error('Error deleting event:', error);
      showToast(`Failed to delete event: ${error.message}`, 'error');
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
    setDeleteRecordName(record['Event/Task'] || `Event at row ${rowIndex + 1}`);
    setShowDeleteDialog(true);
  };

  const exportToCSV = useCallback(() => {
    if (filteredData.length === 0) {
      showToast('No data to export', 'error');
      return;
    }

    const headers = ['Event/Task', 'Date', 'Time', 'Location', 'Status'];
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
    link.setAttribute('download', `calendar_events_${new Date().toISOString().split('T')[0]}.csv`);
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
        console.log('Attempting direct Google Sheets API for events...');
        result = await fetchSheetDataDirect('event');
        directSuccess = true;
        console.log('Direct API succeeded for events');
      } catch (directError) {
        console.warn('Direct API failed for events, falling back to backend:', directError.message);
        // Fall back to backend API
        result = await fetchSheetData('event');
      }
      
      const sheetData = result.data || [];
      setData(sheetData);
      setFilteredData(sheetData);
      await cacheSheetData('event', sheetData);
      
      if (directSuccess) {
        showToast('Events loaded directly from Google Sheets', 'success');
      }
    } catch (error) {
      const cached = await getCachedSheetData('event');
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
    { key: 'Event/Task', label: 'Event/Task', className: 'font-semibold text-gray-900' },
    { key: 'Date', label: 'Date', className: 'text-gray-600' },
    { key: 'Time', label: 'Time', className: 'text-gray-600' },
    { key: 'Location', label: 'Location', className: 'text-gray-600' },
    {
      key: 'Status',
      label: 'Status',
      render: (value) => (
        <span
          className={`px-2 md:px-3 py-1 rounded-full text-xs font-semibold ${
            value === 'Upcoming'
              ? 'bg-blue-100 text-blue-700'
              : value === 'Completed'
              ? 'bg-green-100 text-green-700'
              : value === 'In Progress'
              ? 'bg-yellow-100 text-yellow-700'
              : value === 'Cancelled'
              ? 'bg-red-100 text-red-700'
              : 'bg-gray-100 text-gray-700'
          }`}
        >
          {value || ''}
        </span>
      )
    },
  ];

  return (
    <div className={isDarkMode ? 'bg-gray-900 min-h-screen' : 'bg-purple-50 min-h-screen'}>
      <Header />
      <div className="min-h-screen p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/')}
                className="bg-white border-2 border-gray-300 px-4 py-2 rounded-lg font-semibold hover:bg-gray-50 transition-all"
              >
                🔙 Back
              </button>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-2">
                  📅 Calendar Management
                </h1>
                <p className="text-sm mt-1 text-gray-600">{filteredData.length} events found</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowAddModal(true)}
                className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg font-semibold transition-all flex items-center gap-2"
                data-testid="add-button"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Event
              </button>
              <button
                onClick={exportToCSV}
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-semibold transition-all flex items-center gap-2"
                data-testid="export-csv-button"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export CSV
              </button>
              <button
                onClick={handlePrint}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold transition-all flex items-center gap-2"
                data-testid="print-button"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Print
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 md:p-6 shadow-md mb-6">
            <input
              type="text"
              placeholder="Search events and tasks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none transition-all"
            />
          </div>

          {isLoading ? (
            <div className="text-center py-20">
              <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-600">Loading events...</p>
            </div>
          ) : (
            <CollaborativeTable
              data={filteredData}
              columns={columns}
              sheetType="event"
              enableBulkOperations={true}
              enableCRUD={true}
              onEdit={openEditModal}
              onDelete={openDeleteDialog}
              onDataChange={(newData) => {
                setData(newData);
                setFilteredData(newData);
                cacheSheetData('event', newData);
              }}
              emptyMessage="No events scheduled. Click 'Add Event' to create a new record."
            />
          )}
        </div>
      </div>

      {/* Add Record Modal */}
      <AddRecordModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        sheetType="event"
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
        sheetType="event"
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

export default memo(CalendarManagement);
