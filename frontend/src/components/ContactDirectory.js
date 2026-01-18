import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LoadingSpinner } from './LoadingSpinner';
import { Toast } from './Toast';
import { fetchSheetData, fetchSheetDataDirect } from '../utils/api';

/**
 * ContactDirectory Component
 * Displays and manages contact records from Google Sheets
 */
const ContactDirectory = ({ isDarkMode = false }) => {
  const [contacts, setContacts] = useState([]);
  const [filteredContacts, setFilteredContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    loadContacts();
  }, []);

  useEffect(() => {
    const filtered = contacts.filter(contact =>
      Object.values(contact).some(value =>
        String(value).toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
    setFilteredContacts(filtered);
  }, [searchTerm, contacts]);

  const loadContacts = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchSheetDataDirect('contact');
      setContacts(result || []);
      setToastMessage('Contacts loaded successfully');
      setShowToast(true);
    } catch (error) {
      console.error('Error loading contacts:', error);
      setError('Failed to load contacts');
      setToastMessage('Error loading contacts');
      setShowToast(true);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className={`space-y-6 ${isDarkMode ? 'dark' : ''}`}>
      <Card>
        <CardHeader>
          <CardTitle>Contact Directory</CardTitle>
          <CardDescription>Browse and search your contact database</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search Bar */}
          <div className="flex gap-2">
            <Input
              placeholder="Search contacts..."
              value={searchTerm}
              onChange={handleSearch}
              className="flex-1"
            />
            <Button onClick={loadContacts} variant="outline">
              Refresh
            </Button>
          </div>

          {/* Results */}
          {error && (
            <div className="p-4 bg-red-100 text-red-700 rounded">
              {error}
            </div>
          )}

          {/* Contacts Table */}
          <div className="overflow-x-auto">
            {filteredContacts.length > 0 ? (
              <table className="w-full text-sm">
                <thead className="border-b">
                  <tr>
                    {Object.keys(filteredContacts[0]).map(key => (
                      <th key={key} className="text-left p-3 font-semibold">
                        {key}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredContacts.map((contact, idx) => (
                    <tr key={idx} className="border-b hover:bg-gray-50">
                      {Object.values(contact).map((value, i) => (
                        <td key={i} className="p-3">
                          {String(value)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-8 text-center text-gray-500">
                No contacts found
              </div>
            )}
          </div>

          {/* Info */}
          <div className="text-sm text-gray-600">
            Showing {filteredContacts.length} of {contacts.length} contacts
          </div>
        </CardContent>
      </Card>

      {/* Toast Notification */}
      {showToast && (
        <Toast
          message={toastMessage}
          onClose={() => setShowToast(false)}
        />
      )}
    </div>
  );
};

export default ContactDirectory;
