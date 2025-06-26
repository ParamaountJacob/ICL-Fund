import React, { useState, useEffect } from 'react';
import { supabase, checkUserRole, claimUserByAdmin, getManagedUsers, updateUserVerification, deleteAdminNotification, deleteUserAndAllData, type UserRole, type User as UserType, getAllAdmins } from '../lib/supabase';
import { Users, Bell, Search, Filter, Download, Eye, UserPlus, UserCheck, Activity, Trash2 } from 'lucide-react';
import UserProfileModal from '../components/UserProfileModal';
import { useLocation } from 'react-router-dom';
import AlertModal from '../components/AlertModal';

interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  verification_status: string;
  role: string;
  created_at: string;
  managed_by_admin_id?: string;
  admin_first_name?: string;
  admin_last_name?: string;
  admin_email?: string;
}

interface AdminNotification {
  id: string;
  user_email: string;
  message: string;
  notification_type: string;
  is_read: boolean;
  created_at: string;
}

const Admin: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'users' | 'notifications' | 'activity'>('users');
  const [currentUserRole, setCurrentUserRole] = useState<UserRole>('user');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertInfo, setAlertInfo] = useState({ title: '', message: '', type: 'info' as const });
  const [selectedUserDefaultTab, setSelectedUserDefaultTab] = useState<string | undefined>(undefined);
  const [deletingNotification, setDeletingNotification] = useState<string | null>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const location = useLocation();
  const [notificationToOpen, setNotificationToOpen] = useState<string | null>(null);

  useEffect(() => {
    const initUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
        const role = await checkUserRole();
        setCurrentUserRole(role);
      }
    };
    
    initUser();
    fetchData();

    // Check if we have a notification ID to open from URL params
    const params = new URLSearchParams(location.search);
    const notificationId = params.get('notification');
    if (notificationId) {
      setNotificationToOpen(notificationId);
    }
    
    // Listen for custom event to open user profile
    const handleOpenUserProfile = (event: CustomEvent) => {
      const { userId, defaultTab } = event.detail;
      if (userId) {
        // Find the user in the users array
        const user = users.find(u => u.id === userId);
        if (user) {
          handleUserClick(user, defaultTab);
        } else {
          // If user not found in current list, fetch the user data
          fetchUserById(userId, defaultTab);
        }
      }
    };
    
    window.addEventListener('openUserProfile', handleOpenUserProfile as EventListener);
    
    return () => {
      window.removeEventListener('openUserProfile', handleOpenUserProfile as EventListener);
    };
  }, [activeTab]);

  const fetchUserById = async (userId: string, defaultTab?: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
        
      if (error) throw error;
      
      if (data) {
        handleUserClick(data as User, defaultTab);
      }
    } catch (error) {
      console.error('Error fetching user by ID:', error);
      setAlertInfo({
        title: 'Error',
        message: 'Failed to fetch user details. Please try again.',
        type: 'error'
      });
      setShowAlert(true);
    }
  };

  useEffect(() => {
    // If we have a notification to open and users are loaded, find the user and open their profile
    if (notificationToOpen && users.length > 0) {
      // Find the notification
      const fetchNotificationDetails = async () => {
        try {
          const { data, error } = await supabase
            .from('admin_notifications')
            .select('*')
            .eq('id', notificationToOpen)
            .single();
            
          if (error) throw error;
          
          if (data && data.user_id) {
            // Find the user
            const user = users.find(u => u.id === data.user_id);
            if (user) {
              handleUserClick(user);
            } else {
              // If user not found in current list, fetch the user data
              fetchUserById(data.user_id);
            }
            
            // Mark notification as read
            await markNotificationRead(notificationToOpen);
          }
        } catch (error) {
          console.error('Error fetching notification details:', error);
        }
        
        // Clear the notification ID from URL
        navigate('/admin', { replace: true });
        setNotificationToOpen(null);
      };
      
      fetchNotificationDetails();
    }
  }, [notificationToOpen, users]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch data based on active tab
      switch (activeTab) {
        case 'users':
          if (currentUserRole === 'sub_admin') {
            await fetchManagedUsers();
          } else {
            await fetchUsers();
          }
          break;
        case 'notifications':
          await fetchNotifications();
          break;
        case 'activity':
          await fetchActivity();
          break;
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchManagedUsers = async () => {
    try {
      // Use the new function that includes admin details
      const { data, error } = await supabase.rpc('get_managed_users_with_admin_details');
      
      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching managed users:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      // Use a join to get admin details for claimed users
      const { data, error } = await supabase.rpc('get_managed_users_with_admin_details');
      
      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const markNotificationRead = async (notificationId: string) => {
    try {
      const { error } = await supabase.rpc('mark_notification_read', {
        p_notification_id: notificationId
      });
      
      if (error) throw error;
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const fetchNotifications = async () => {
    const { data, error } = await supabase
      .from('admin_notifications')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    setNotifications(data || []);
  };

  const fetchActivity = async () => {
    try {
      const { data, error } = await supabase
        .from('user_activity')
        .select(`
          id,
          user_id,
          action_type,
          action_description,
          performed_by,
          created_at,
          user_details:users!user_id(email, first_name, last_name),
          performer_details:users!performed_by(email, first_name, last_name)
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setActivities(data || []);
    } catch (error) {
      console.error('Error fetching activity:', error);
    }
  };

  const handleClaimUser = async (userId: string) => {
    if (!currentUserId) return;
    
    // Check if user is already claimed
    try {
      const { data } = await supabase
        .from('users')
        .select('managed_by_admin_id')
        .eq('id', userId)
        .single();
        
      if (data?.managed_by_admin_id) {
        setAlertInfo({
          title: 'User Already Claimed',
          message: 'This user is already claimed by an admin.',
          type: 'info'
        });
        setShowAlert(true);
        return;
      }
    } catch (error) {
      console.error('Error checking user claim status:', error);
    }
    
    try {
      await claimUserByAdmin(userId, currentUserId);
      setAlertInfo({
        title: 'User Claimed',
        message: 'User has been claimed successfully! You can now manage this user.',
        type: 'success'
      });
      setShowAlert(true);
      
      // Refresh the user list
      if (currentUserRole === 'sub_admin') {
        await fetchManagedUsers();
      } else {
        await fetchUsers();
      }
    } catch (error) {
      console.error('Error claiming user:', error);
      setAlertInfo({
        title: 'Claim Failed',
        message: 'Failed to claim user: ' + (error instanceof Error ? error.message : 'Unknown error'),
        type: 'error'
      });
      setShowAlert(true);
    }
  };

  const handleDeleteNotification = async (notificationId: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent opening the notification details
    
    if (currentUserRole !== 'admin') {
      setAlertInfo({
        title: 'Permission Denied',
        message: 'Only the main admin can delete notifications.',
        type: 'error'
      });
      setShowAlert(true);
      return;
    }

    if (window.confirm('Are you sure you want to delete this notification?')) {
      setDeletingNotification(notificationId);
      try {
        await deleteAdminNotification(notificationId);
        setAlertInfo({
          title: 'Notification Deleted',
          message: 'Notification has been successfully deleted.',
          type: 'success'
        });
        setShowAlert(true);
        // Remove the notification from the local state
        setNotifications(notifications.filter(n => n.id !== notificationId));
      } catch (error) {
        console.error('Error deleting notification:', error);
        setAlertInfo({
          title: 'Deletion Failed',
          message: 'Failed to delete notification: ' + (error instanceof Error ? error.message : 'Unknown error'),
          type: 'error'
        });
        setShowAlert(true);
      } finally {
        setDeletingNotification(null);
      }
    }
  };

  const handleDeleteUser = async (userId: string) => {
    // This function will be called from the UserProfileModal
    try {
      // Remove the user from the local state
      setUsers(users.filter(u => u.id !== userId));
      setAlertInfo({
        title: 'User Deleted',
        message: 'User and all associated data have been successfully deleted.',
        type: 'success'
      });
      setShowAlert(true);
    } catch (error) {
      console.error('Error handling user deletion:', error);
    }
  };

  const handleUserClick = (user: User, defaultTab?: string) => {
    setSelectedUser(user);
    setSelectedUserDefaultTab(defaultTab);
    setShowUserModal(true);
  };
  
  const handleUserModalClose = () => {
    setShowUserModal(false);
    setSelectedUser(null);
    // Refresh the user list to show any updates
    fetchData();
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         `${user.first_name} ${user.last_name}`.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || user.role === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const filteredNotifications = notifications.filter(notification => {
    const matchesSearch = notification.user_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         notification.message.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || 
                         (filterStatus === 'read' && notification.is_read) ||
                         (filterStatus === 'unread' && !notification.is_read);
    return matchesSearch && matchesFilter;
  });

  const filteredActivities = activities.filter(activity => {
    const userEmail = activity.user_details?.email || '';
    const userName = `${activity.user_details?.first_name || ''} ${activity.user_details?.last_name || ''}`;
    const performerEmail = activity.performer_details?.email || '';
    const performerName = `${activity.performer_details?.first_name || ''} ${activity.performer_details?.last_name || ''}`;
    
    const matchesSearch = 
      userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      performerEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      performerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.action_description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterStatus === 'all' || activity.action_type === filterStatus;
    
    return matchesSearch && matchesFilter;
  });

  const tabs = [
    { id: 'users', label: 'Users', icon: Users },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'activity', label: 'Activity', icon: Activity }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">Manage users and system notifications</p>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Search and Filter Controls */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Filter className="w-5 h-5 text-gray-400" />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Status</option>
                  {activeTab === 'users' && (
                    <>
                      <option value="admin">Admin</option>
                      <option value="sub_admin">Sub-Admin</option>
                      <option value="user">User</option>
                    </>
                  )}
                  {activeTab === 'notifications' && (
                    <>
                      <option value="read">Read</option>
                      <option value="unread">Unread</option>
                    </>
                  )}
                  {activeTab === 'activity' && (
                    <>
                      <option value="claim">Claim</option>
                      <option value="unclaim">Unclaim</option>
                      <option value="assign">Assign</option>
                      <option value="verification">Verification</option>
                    </>
                  )}
                </select>
              </div>
              <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                <Download className="w-4 h-4" />
                <span>Export</span>
              </button>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="bg-white rounded-lg shadow-sm">
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-2"></div>
              <span className="text-gray-600">Loading...</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              {activeTab === 'users' && (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredUsers.map((user) => (
                      <tr 
                        data-user-id={user.id}
                        key={user.id} 
                        className="hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => handleUserClick(user)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                <span className="text-blue-600 font-medium text-sm">
                                  {user.first_name?.[0]}{user.last_name?.[0]}
                                </span>
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {user.first_name} {user.last_name}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.email}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs rounded-full role-badge ${
                            user.role === 'admin' ? 'bg-gold text-background' : 
                            user.role === 'sub_admin' ? 'bg-silver text-gray-800' : 
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(user.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            {/* Show claimed status indicator */}
                            <div className="flex items-center gap-2">
                              {user.managed_by_admin_id && (
                              <span 
                                className="text-green-600 flex items-center gap-1 claimed-status" 
                                title={`Claimed by ${user.admin_first_name || ''} ${user.admin_last_name || ''}`}
                              >
                                <UserCheck className="w-4 h-4" />
                                <span className="text-xs">
                                  Claimed
                                </span>
                              </span>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {activeTab === 'notifications' && (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Message</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredNotifications.map((notification) => (
                      <tr key={notification.id} className={`hover:bg-gray-50 ${!notification.is_read ? 'bg-blue-50' : ''}`}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {notification.user_email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                            {notification.notification_type}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 max-w-xs truncate">
                            {notification.message}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            notification.is_read ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {notification.is_read ? 'Read' : 'Unread'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(notification.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                // Mark as read
                                markNotificationRead(notification.id);
                                
                                // If it has a user ID, open the user profile
                                if (notification.user_id) {
                                  const user = users.find(u => u.id === notification.user_id);
                                  if (user) {
                                    handleUserClick(user);
                                  } else {
                                    fetchUserById(notification.user_id);
                                  }
                                }
                              }}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => handleDeleteNotification(notification.id, e)}
                              disabled={deletingNotification === notification.id}
                              className={`text-red-500 hover:text-red-700 ${deletingNotification === notification.id ? 'opacity-50' : ''}`}
                              title="Delete Notification"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {activeTab === 'activity' && (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Performed By</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredActivities.map((activity) => (
                      <tr key={activity.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {activity.user_details?.first_name} {activity.user_details?.last_name}
                          </div>
                          <div className="text-sm text-gray-500">{activity.user_details?.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            activity.action_type === 'claim' ? 'bg-blue-100 text-blue-800' :
                            activity.action_type === 'unclaim' ? 'bg-red-100 text-red-800' :
                            activity.action_type === 'assign' ? 'bg-purple-100 text-purple-800' :
                            activity.action_type === 'verification' ? 'bg-green-100 text-green-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {activity.action_type.charAt(0).toUpperCase() + activity.action_type.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">{activity.action_description}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {activity.performer_details?.first_name} {activity.performer_details?.last_name}
                          </div>
                          <div className="text-sm text-gray-500">{activity.performer_details?.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(activity.created_at).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      </div>

      {/* User Profile Modal */}
      {showUserModal && selectedUser && (
        <UserProfileModal
          isOpen={showUserModal}
          onClose={handleUserModalClose}
          user={selectedUser}
          currentUserRole={currentUserRole}
          defaultTab={selectedUserDefaultTab as any}
          onDeleteUser={handleDeleteUser}
        />
      )}
      
      <AlertModal
        isOpen={showAlert}
        onClose={() => setShowAlert(false)}
        title={alertInfo.title}
        message={alertInfo.message}
        type={alertInfo.type}
      />
    </div>
  );
};

export default Admin;