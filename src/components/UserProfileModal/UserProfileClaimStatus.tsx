import React, { useState, useEffect } from 'react';
import { User, UserCheck, Users, Save } from 'lucide-react';
import { claimUserByAdmin, unclaim_user, assignUserToAdmin, getAllAdmins, type User as UserType } from '../../lib/supabase';
import AlertModal from '../AlertModal';

interface UserProfileClaimStatusProps {
  user: UserType;
  currentUserId: string | null;
  onUserClaimed: () => void;
}

interface Admin {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
}

const UserProfileClaimStatus: React.FC<UserProfileClaimStatusProps> = ({ 
  user, 
  currentUserId,
  onUserClaimed
}) => {
  const [loading, setLoading] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertInfo, setAlertInfo] = useState({ title: '', message: '', type: 'info' as const });
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [selectedAdminId, setSelectedAdminId] = useState<string>(user.managed_by_admin_id || '');

  const isClaimedByCurrentUser = user.managed_by_admin_id === currentUserId;
  const isClaimedByOtherAdmin = user.managed_by_admin_id && user.managed_by_admin_id !== currentUserId;
  const isAdmin = currentUserId && user.role === 'admin';

  useEffect(() => {
    // Load admins for the dropdown
    const fetchAdmins = async () => {
      try {
        const adminsList = await getAllAdmins();
        setAdmins(adminsList || []);
      } catch (error) {
        console.error('Error fetching admins:', error);
      }
    };

    fetchAdmins();
  }, []);

  const handleSaveAssignment = async () => {
    if (!selectedAdminId && selectedAdminId !== 'unassigned') return;
    
    setLoading(true);
    try {
      if (selectedAdminId === 'unassigned') {
        // Unclaim the user
        await unclaim_user(user.id);
        setAlertInfo({
          title: 'User Unassigned',
          message: 'User has been successfully unassigned.',
          type: 'success'
        });
      } else if (selectedAdminId === currentUserId) {
        // Claim the user for current admin
        await claimUserByAdmin(user.id, currentUserId);
        setAlertInfo({
          title: 'User Claimed',
          message: 'You have successfully claimed this user.',
          type: 'success'
        });
      } else {
        // Assign to another admin
        await assignUserToAdmin(user.id, selectedAdminId);
        const selectedAdmin = admins.find(admin => admin.id === selectedAdminId);
        setAlertInfo({
          title: 'User Assigned',
          message: `User has been assigned to ${selectedAdmin?.first_name} ${selectedAdmin?.last_name}.`,
          type: 'success'
        });
      }
      
      setShowAlert(true);
      onUserClaimed();
    } catch (error) {
      console.error('Error updating user assignment:', error);
      setAlertInfo({
        title: 'Update Failed',
        message: 'Failed to update user assignment: ' + (error instanceof Error ? error.message : 'Unknown error'),
        type: 'error'
      });
      setShowAlert(true);
    } finally {
      setLoading(false);
    }
  };

  // Don't show claim status for admin users
  if (user.role === 'admin' || user.role === 'sub_admin') return null;

  return (
    <>
    <div className="bg-gray-50 p-6 rounded-lg">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Claim Status</h3>
      
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="space-y-4">
          {/* Current status display */}
          <div className="flex items-center gap-3">
            {user.managed_by_admin_id ? (
              <>
                <UserCheck className="w-5 h-5 text-green-600" />
                <div>
                  <span className="font-medium text-gray-900">
                    {isClaimedByCurrentUser 
                      ? 'Claimed by you' 
                      : `Claimed by ${user.admin_first_name || ''} ${user.admin_last_name || ''}`}
                  </span>
                  {user.admin_email && (
                    <p className="text-sm text-gray-600">{user.admin_email}</p>
                  )}
                </div>
              </>
            ) : (
              <>
                <User className="w-5 h-5 text-gray-600" />
                <span className="text-gray-700">Unclaimed</span>
              </>
            )}
          </div>
          
          {/* Assignment dropdown and save button */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <select
                value={selectedAdminId}
                onChange={(e) => setSelectedAdminId(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded text-sm text-gray-900 bg-white"
                disabled={loading}
              >
                <option value="unassigned">Unassigned</option>
                {currentUserId && (
                  <option value={currentUserId}>
                    Claim for yourself
                  </option>
                )}
                <optgroup label="Assign to Admin">
                  {admins.map(admin => (
                    <option key={admin.id} value={admin.id}>
                      {admin.first_name} {admin.last_name} ({admin.role})
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>
            
            <button
              onClick={handleSaveAssignment}
              disabled={loading || (selectedAdminId === user.managed_by_admin_id && user.managed_by_admin_id !== null) || (selectedAdminId === 'unassigned' && !user.managed_by_admin_id)}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              {loading ? 'Saving...' : 'Save'}
            </button>
          </div>
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

export default UserProfileClaimStatus;