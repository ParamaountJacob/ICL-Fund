import React from 'react';
import { Mail, User, Calendar, Shield } from 'lucide-react';
import { updateUserVerification, type VerificationStatus } from '../../lib/supabase';
import { useState } from 'react';
import AlertModal from '../AlertModal'; 

interface UserProfileAccountInfoProps {
  email: string;
  role: string;
  createdAt: string;
  verificationStatus?: string;
  userId: string;
}

const UserProfileAccountInfo: React.FC<UserProfileAccountInfoProps> = ({
  email,
  role,
  createdAt,
  verificationStatus,
  userId
}) => {
  const [showAlert, setShowAlert] = useState(false);
  const [alertInfo, setAlertInfo] = useState({ title: '', message: '', type: 'info' as const });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getVerificationStatusBadge = (status?: string) => {
    switch (status) {
      case 'verified':
        return <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full verification-status flex items-center gap-1">
          <Shield className="w-3 h-3" />Verified
        </span>;
      case 'pending':
      default:
        return <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full verification-status flex items-center gap-1">
          <Shield className="w-3 h-3" />Pending
        </span>;
    }
  };

  const handleVerificationUpdate = async () => {
    try {
      await updateUserVerification(userId, 'verified');
      
      // Update the UI immediately
      const userElement = document.querySelector(`tr[data-user-id="${userId}"]`);
      if (userElement) {
        const statusElement = userElement.querySelector('.verification-status');
        if (statusElement) {
          statusElement.innerHTML = '<span class="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">Verified</span>';
        }
      }
      
      setAlertInfo({
        title: 'Status Updated',
        message: 'User has been verified successfully.',
        type: 'success'
      });
      setShowAlert(true);
    } catch (error) {
      console.error('Error updating verification status:', error);
      setAlertInfo({
        title: 'Update Failed',
        message: 'Failed to update verification status. Please try again.',
        type: 'error'
      });
      setShowAlert(true);
    }
  };

  return (
    <>
    <div className="bg-gray-50 p-6 rounded-lg">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Information</h3>
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <Mail className="w-4 h-4 text-gray-600" />
          <span className="text-gray-900">{email}</span>
        </div>
        <div className="flex items-center gap-3">
          <User className="w-4 h-4 text-gray-600" />
          <span className="text-gray-900">Role: {role.replace('_', ' ').toUpperCase()}</span>
        </div>
        <div className="flex items-center gap-3">
          <Calendar className="w-4 h-4 text-gray-600" />
          <span className="text-gray-900">Joined: {formatDate(createdAt)}</span>
        </div>
        <div className="flex items-center gap-3">
          <Shield className="w-4 h-4 text-gray-600" />
          <span>Status: {getVerificationStatusBadge(verificationStatus)}</span>
          {verificationStatus !== 'verified' && (
            <button
              onClick={handleVerificationUpdate}
              className="px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 flex items-center gap-1"
            >
              <Shield className="w-3 h-3" />
              Verify
            </button>
          )}
        </div>
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

export default UserProfileAccountInfo;