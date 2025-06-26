import React, { useState } from 'react';
import { User, Edit, X, Trash2 } from 'lucide-react';
import { setUserRole, type UserRole } from '../../lib/supabase';
import AlertModal from '../AlertModal';

interface UserProfileHeaderProps {
  email: string;
  role: string;
  onClose: () => void;
  userId: string;
  onDeleteUser?: () => void;
  deleting?: boolean;
}

const UserProfileHeader: React.FC<UserProfileHeaderProps> = ({ 
  email, 
  role, 
  onClose,
  userId,
  onDeleteUser,
  deleting = false
}) => {
  const [editingRole, setEditingRole] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole>(role as UserRole);
  const [showAlert, setShowAlert] = useState(false);
  const [alertInfo, setAlertInfo] = useState({ title: '', message: '', type: 'info' as const });

  const getRoleBadge = (role: string) => {
    const colors = {
      admin: 'bg-gold text-background',
      sub_admin: 'bg-silver text-gray-800',
      user: 'bg-gray-100 text-gray-800'
    };

    return (
      <span className={`px-2 py-1 text-xs rounded-full ${colors[role as keyof typeof colors]}`}>
        {role.replace('_', ' ').toUpperCase()}
      </span>
    );
  };

  const handleRoleUpdate = async () => {
    try {
      await setUserRole(userId, selectedRole);
      setAlertInfo({
        title: 'Role Updated',
        message: 'User role has been updated successfully.',
        type: 'success'
      });
      setShowAlert(true);
      setEditingRole(false);
    } catch (error) {
      console.error('Error updating user role:', error);
      setAlertInfo({
        title: 'Update Failed',
        message: 'Failed to update user role. Please try again.',
        type: 'error'
      });
      setShowAlert(true);
    }
  };

  return (
    <>
    <div className="flex items-center justify-between p-6 border-b border-gray-200">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
          <User className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-900">User Profile</h2>
          <p className="text-gray-600">{email}</p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        {/* Role Management */}
        <div className="flex items-center gap-2">
          {editingRole ? (
            <div className="flex items-center gap-2">
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                className="border border-gray-300 rounded px-2 py-1 text-sm text-gray-900 bg-white"
              >
                <option value="user">User</option>
                <option value="sub_admin">Sub Admin</option>
                <option value="admin">Admin</option>
              </select>
              <button
                onClick={handleRoleUpdate}
                className="px-2 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
              >
                Save
              </button>
              <button
                onClick={() => setEditingRole(false)}
                className="px-2 py-1 bg-gray-300 text-gray-700 rounded text-sm hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              {getRoleBadge(role)}
              <button
                onClick={() => setEditingRole(true)}
                className="text-gray-400 hover:text-gray-600"
                title="Edit Role"
              >
                <Edit className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
        {onDeleteUser && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDeleteUser();
            }}
            disabled={deleting}
            className="p-2 hover:bg-red-100 rounded-full transition-colors text-red-600 disabled:opacity-50"
            title="Delete User"
          >
            {deleting ? 
              <div className="w-5 h-5 border-2 border-t-transparent border-red-600 rounded-full animate-spin"></div> : 
              <Trash2 className="w-5 h-5" />
            }
          </button>
        )}
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <X className="w-5 h-5 text-gray-600" />
        </button>
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

export default UserProfileHeader;