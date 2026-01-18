import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';

/**
 * AddRecordModal Component
 * Modal dialog for adding new records to Google Sheets
 */
const AddRecordModal = ({
  isOpen,
  onClose,
  sheetType,
  onSubmit,
  isDarkMode
}) => {
  const [formData, setFormData] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      setFormData({});
      onClose();
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Common fields for supply records
  const defaultFields = [
    'Item Name',
    'Category',
    'Quantity',
    'Unit',
    'Location',
    'Status',
    'Notes'
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`max-w-2xl ${isDarkMode ? 'dark' : ''}`}>
        <DialogHeader>
          <DialogTitle>Add New {sheetType} Record</DialogTitle>
          <DialogDescription>
            Fill in the fields below to create a new record.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[400px] pr-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            {defaultFields.map((field) => (
              <div key={field} className="space-y-2">
                <Label htmlFor={field}>{field}</Label>
                <Input
                  id={field}
                  name={field}
                  value={formData[field] || ''}
                  onChange={handleChange}
                  placeholder={`Enter ${field}`}
                  className={isDarkMode ? 'dark' : ''}
                />
              </div>
            ))}

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Creating...' : 'Create Record'}
              </Button>
            </div>
          </form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default AddRecordModal;
