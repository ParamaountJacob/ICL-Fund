import React, { useState } from 'react';
import { User, Phone, Building, Edit, Save } from 'lucide-react';
import AlertModal from '../AlertModal';

interface UserProfileContactInfoProps {
  firstName: string;
  lastName: string;
  phone: string;
  address: string;
  onSave: (data: { first_name: string; last_name: string; }) => Promise<void>;
  onSaveContact: (data: { phone: string; address: string; }) => Promise<void>;
}

const UserProfileContactInfo: React.FC<UserProfileContactInfoProps> = ({
  firstName,
  lastName,
  phone,
  address,
  onSave,
  onSaveContact
}) => {
  const [editingName, setEditingName] = useState(false);
  const [editingContact, setEditingContact] = useState(false);
  const [savingName, setSavingName] = useState(false);
  const [savingContact, setSavingContact] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertInfo, setAlertInfo] = useState({ title: '', message: '', type: 'info' as const });
  const [formData, setFormData] = useState({
    first_name: firstName,
    last_name: lastName,
    phone: phone,
    address: address
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveName = async () => {
    setSavingName(true);
    try {
      await onSave({
        first_name: formData.first_name,
        last_name: formData.last_name
      });
      setAlertInfo({
        title: 'Name Updated',
        message: 'User name has been updated successfully.',
        type: 'success'
      });
      setShowAlert(true);
      setEditingName(false);
    } catch (error) {
      console.error('Error saving name:', error);
      setAlertInfo({
        title: 'Update Failed',
        message: 'Failed to update user name. Please try again.',
        type: 'error'
      });
      setShowAlert(true);
    } finally {
      setSavingName(false);
    }
  };

  const handleSaveContact = async () => {
    setSavingContact(true);
    try {
      await onSaveContact({
        phone: formData.phone,
        address: formData.address
      });
      setAlertInfo({
        title: 'Contact Updated',
        message: 'Contact information has been updated successfully.',
        type: 'success'
      });
      setShowAlert(true);
      setEditingContact(false);
    } catch (error) {
      console.error('Error saving contact:', error);
      setAlertInfo({
        title: 'Update Failed',
        message: 'Failed to update contact information. Please try again.',
        type: 'error'
      });
      setShowAlert(true);
    } finally {
      setSavingContact(false);
    }
  };

  return (
    <>
    <div className="bg-gray-50 p-6 rounded-lg">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Contact Information</h3>
        {!editingName && (
          <button
            onClick={() => setEditingName(true)}
            className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            <Edit className="w-4 h-4" />
            <span>Edit</span>
          </button>
        )}
      </div>
      
      {editingName ? (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
            <input
              type="text"
              name="first_name"
              value={formData.first_name}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded text-gray-900 bg-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
            <input
              type="text"
              name="last_name"
              value={formData.last_name}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded text-gray-900 bg-white"
            />
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button
              onClick={() => setEditingName(false)}
              className="px-3 py-1 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveName}
              disabled={savingName}
              className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-1"
            >
              {savingName ? 'Saving...' : 'Save'}
              <Save className="w-3 h-3" />
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <User className="w-4 h-4 text-gray-600" />
            <span className="text-gray-900">{formData.first_name && formData.last_name ? `${formData.first_name} ${formData.last_name}` : 'Not provided'}</span>
          </div>
        </div>
      )}

      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <h4 className="font-medium text-gray-900">Contact Details</h4>
          {!editingContact && (
            <button
              onClick={() => setEditingContact(true)}
              className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              <Edit className="w-4 h-4" />
              <span>Edit</span>
            </button>
          )}
        </div>
        
        {editingContact ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded text-gray-900 bg-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleChange}
                rows={3}
                className="w-full p-2 border border-gray-300 rounded text-gray-900 bg-white"
              />
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setEditingContact(false)}
                className="px-3 py-1 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveContact}
                disabled={savingContact}
                className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-1"
              >
                {savingContact ? 'Saving...' : 'Save'}
                <Save className="w-3 h-3" />
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Phone className="w-4 h-4 text-gray-600" />
              <span className="text-gray-900">{formData.phone || 'Not provided'}</span>
            </div>
            <div className="flex items-start gap-3">
              <Building className="w-4 h-4 text-gray-600 mt-0.5" />
              <span className="text-gray-900">{formData.address || 'Not provided'}</span>
            </div>
          </div>
        )}
      </div>
    </div>
    
    <AlertModal
      isOpen={showAlert}
      onClose={() => setShowAlert(false)}
      title={alertInfo.title}
      message={alertInfo.message}
      type={alertInfo.type}
    />
    </>
  );
};

export default UserProfileContactInfo;