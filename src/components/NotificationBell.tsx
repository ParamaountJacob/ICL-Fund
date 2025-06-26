import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, FileSignature, CheckCircle, X, UserPlus, FileText, AlertCircle, UserCheck, Users } from 'lucide-react';
import { supabase, getUnreadNotificationCount, getAdminNotifications, markNotificationRead, assignDocumentToAdmin, getAdminSigningUrl, claimUserByAdmin, type AdminNotification } from '../lib/supabase';
import AlertModal from './AlertModal';

interface NotificationBellProps {
  userRole: 'user' | 'sub_admin' | 'admin';
  isMobile?: boolean;
  onNavigateToAdmin?: () => void;
  onNavigateToDashboard?: () => void;
}

const NotificationBell: React.FC<NotificationBellProps> = ({ 
  userRole, 
  isMobile = false, 
  onNavigateToAdmin,
  onNavigateToDashboard
}) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertInfo, setAlertInfo] = useState({ title: '', message: '', type: 'info' as const });
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [userNotifications, setUserNotifications] = useState<any[]>([]);

  // Check if user is admin or sub-admin
  const isAdmin = userRole === 'admin' || userRole === 'sub_admin';

  useEffect(() => {
    const fetchNotificationCount = async () => {
      try {
        if (isAdmin) {
          const count = await getUnreadNotificationCount();
          setUnreadCount(count);
        } else {
          // For regular users, fetch their messages/notifications
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const { data, error } = await supabase
              .from('messages')
              .select('*')
              .eq('receiver_id', user.id)
              .eq('is_read', false)
              .order('created_at', { ascending: false });
              
            if (error) throw error;
            setUserNotifications(data || []);
            setUnreadCount(data?.length || 0);
          }
        }
      } catch (error) {
        console.error('Error fetching notification count:', error);
      }
    };

    fetchNotificationCount();
    
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchNotificationCount, 30000);
    
    return () => clearInterval(interval);
  }, [isAdmin]);

  useEffect(() => {
    // Close dropdown when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleBellClick = async () => {
    setShowDropdown(!showDropdown);
    
    if (!showDropdown) {
      if (isAdmin) {
        setLoading(true);
        try {
          // Fallback to direct query if the function fails
          try {
            const notifs = await getAdminNotifications(10, 0);
            setNotifications(notifs);
          } catch (funcError) {
            console.error('Error using function, falling back to direct query:', funcError);
            // Direct query as fallback
            const { data, error } = await supabase
              .from('admin_notifications')
              .select('*')
              .order('created_at', { ascending: false })
              .limit(10);
              
            if (error) throw error;
            setNotifications(data || []);
          }
        } catch (error) {
          console.error('Error fetching notifications:', error);
          setAlertInfo({
            title: 'Error',
            message: 'Failed to load notifications. Please try again.',
            type: 'error'
          });
          setShowAlert(true);
        } finally {
          setLoading(false);
        }
      } else {
        // For regular users, fetch their messages/notifications
        setLoading(true);
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const { data, error } = await supabase
              .from('messages')
              .select('*')
              .eq('receiver_id', user.id)
              .order('created_at', { ascending: false })
              .limit(10);
              
            if (error) throw error;
            setUserNotifications(data || []);
          }
        } catch (error) {
          console.error('Error fetching user notifications:', error);
        } finally {
          setLoading(false);
        }
      }
    }
  };

  const handleMarkAsRead = async (id: string, event: React.MouseEvent) => {
    event.stopPropagation();
    
    if (!isAdmin) return;
    
    try {
      await markNotificationRead(id);
      setNotifications(notifications.map(n => 
        n.id === id ? { ...n, is_read: true } : n
      ));
      setUnreadCount(Math.max(0, unreadCount - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleUserNotificationClick = async (notification: any) => {
    try {
      // Mark message as read
      if (!notification.is_read) {
        const { error } = await supabase
          .from('messages')
          .update({ is_read: true })
          .eq('id', notification.id);
          
        if (error) throw error;
        
        // Update local state
        setUserNotifications(userNotifications.map(n => 
          n.id === notification.id ? { ...n, is_read: true } : n
        ));
        setUnreadCount(Math.max(0, unreadCount - 1));
      }
      
      // Check if this is an investment approval notification
      if (notification.subject?.includes('Investment Approved')) {
        // Navigate to dashboard
        if (onNavigateToDashboard) {
          onNavigateToDashboard();
          setShowDropdown(false);
        }
      }
    } catch (error) {
      console.error('Error handling user notification click:', error);
    }
  };

  const handleNotificationClick = async (notification: AdminNotification) => {
    try {
      // Mark notification as read if not already read
      if (!notification.is_read) {
        await markNotificationRead(notification.id);
        setNotifications(notifications.map(n => 
          n.id === notification.id ? { ...n, is_read: true } : n
        ));
        setUnreadCount(Math.max(0, unreadCount - 1));
      }

      // Navigate to admin dashboard and trigger user profile opening
      if (onNavigateToAdmin) {
        onNavigateToAdmin();
        setShowDropdown(false);
        
        // If we have a user ID, trigger the user profile modal after navigation
        if (notification.user_id) {
          // Wait a bit for navigation to complete, then trigger user profile
          setTimeout(() => {
            // Dispatch a custom event to open the user profile
            window.dispatchEvent(new CustomEvent('openUserProfile', {
              detail: { 
                userId: notification.user_id,
                defaultTab: notification.notification_type === 'document_signed' || 
                           notification.notification_type === 'application_submitted' ? 
                           'investments' : 'profile'
              }
            }));
          }, 100);
        }
      }
    } catch (error) {
      console.error('Error handling notification click:', error);
    }
  };

  const handleClaimUser = async (notificationId: string, userId: string | undefined, event: React.MouseEvent) => {
    event.stopPropagation();
    
    if (!isAdmin || !userId) return;
    
    // Check if user is already claimed
    try {
      const { data, error } = await supabase
        .from('users')
        .select('managed_by_admin_id')
        .eq('id', userId)
        .single();
      
      if (error) throw error;
      
      if (data && data.managed_by_admin_id) {
        setAlertInfo({
          title: 'User Already Claimed',
          message: 'This user has already been claimed by an admin.',
          type: 'info'
        });
        setShowAlert(true);
        return;
      }
    } catch (error) {
      console.error("Error checking user claim status:", error);
      // Continue with claim attempt if check fails
    }
    
    try {
      // Claim the user
      await claimUserByAdmin(userId);
      
      // Mark notification as read
      await markNotificationRead(notificationId);
      setNotifications(notifications.map(n => 
        n.id === notificationId ? { ...n, is_read: true } : n
      ));
      setUnreadCount(Math.max(0, unreadCount - 1));

      setAlertInfo({
        title: 'User Claimed',
        message: 'User claimed successfully! You can now manage this user.',
        type: 'success'
      });
      setShowAlert(true);
      
      // Remove the notification from the list since the action is complete
      setNotifications(notifications.filter(n => n.id !== notificationId));
      setUnreadCount(Math.max(0, unreadCount - 1));
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

  const handleAssignToMe = async (notificationId: string, applicationId: string | undefined, documentType: string | undefined, event: React.MouseEvent) => {
    event.stopPropagation();
    
    if (!isAdmin || !applicationId || !documentType) return;
    
    try {
      // Find the document signature ID
      const { data: signatures, error: sigError } = await supabase
        .from('document_signatures')
        .select('id, status')
        .eq('application_id', applicationId)
        .eq('document_type', documentType)
        .eq('status', 'investor_signed')
        .maybeSingle();

      if (sigError) throw sigError;
      
      if (!signatures) {
        throw new Error('No signature found for this document');
      }
      
      // Assign the document to the current admin
      await assignDocumentToAdmin(signatures.id);
      
      // Mark the notification as read
      await markNotificationRead(notificationId);
      
      // Update local state
      setNotifications(notifications.map(n => 
        n.id === notificationId ? { ...n, is_read: true } : n
      ));
      setUnreadCount(Math.max(0, unreadCount - 1));

      // Get the admin signing URL
      try {
        const adminSigningUrl = await getAdminSigningUrl(signatures.id);
        
        if (adminSigningUrl) {
          // Open the admin signing URL in a new tab
          window.open(adminSigningUrl, '_blank');
        } else {
          throw new Error('No admin signing URL found');
        }
        setAlertInfo({
          title: 'Document Assigned',
          message: 'Document has been assigned to you successfully.',
          type: 'success'
        });
      } catch (urlError) {
        console.error('Error getting admin signing URL:', urlError);
        setAlertInfo({
          title: 'Partial Success',
          message: 'Document assigned, but could not open signing page: ' + (urlError instanceof Error ? urlError.message : 'Unknown error'),
          type: 'info'
        });
        setShowDropdown(false);
        setShowAlert(true);
        return;
      }
      setShowAlert(true);
      setShowDropdown(false);
    } catch (err) {
      console.error('Error assigning document:', err);
      setAlertInfo({
        title: 'Assignment Failed',
        message: 'Failed to assign document: ' + (err instanceof Error ? err.message : 'Unknown error'),
        type: 'error'
      });
      setShowAlert(true);
    }
  };

  return (
    <>
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={handleBellClick}
        className="relative flex items-center justify-center w-8 h-8 rounded-full bg-surface border border-graphite hover:bg-accent transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-4 h-4 text-gold" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {showDropdown && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
            className={`absolute ${isMobile ? 'right-0' : 'right-0'} mt-2 w-80 bg-surface border border-graphite rounded-lg shadow-xl z-50 ${isMobile ? '-right-20' : 'right-0'}`}
          >
            <div className="px-4 py-3 border-b border-graphite flex justify-between items-center">
              <h3 className="font-semibold text-text-primary">Notifications</h3>
              <button 
                onClick={() => setShowDropdown(false)}
                className="text-text-secondary hover:text-text-primary"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            {isAdmin ? (
              loading ? (
                <div className="p-4 text-center text-text-secondary">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gold mx-auto mb-2"></div>
                  <p>Loading notifications...</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-4 text-center text-text-secondary">
                  <p>No notifications</p>
                </div>
              ) : (
                <div className="max-h-96 overflow-y-auto">
                  {notifications.map(notification => (
                    <div 
                      key={notification.id} 
                      className={`p-3 border-b border-graphite hover:bg-accent transition-colors cursor-pointer ${
                        !notification.is_read ? 'bg-gold/5' : ''
                      }`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex items-start gap-2">
                          {notification.notification_type === 'document_signed' ? (
                            <FileSignature className="w-4 h-4 text-gold mt-1 flex-shrink-0" />
                         ) : notification.notification_type === 'application_submitted' ? (
                            <FileText className="w-4 h-4 text-blue-600 mt-1 flex-shrink-0" />
                         ) : notification.notification_type === 'user_management' ? (
                            <Users className="w-4 h-4 text-green-600 mt-1 flex-shrink-0" />
                         ) : notification.notification_type === 'error' ? (
                            <AlertCircle className="w-4 h-4 text-red-600 mt-1 flex-shrink-0" />
                          ) : (
                            <Bell className="w-4 h-4 text-gold mt-1 flex-shrink-0" />
                          )}
                          <div>
                            <p className={`text-sm ${!notification.is_read ? 'font-semibold text-text-primary' : 'text-text-secondary'}`}>
                              {notification.message}
                            </p>
                            <p className="text-xs text-text-secondary mt-1">
                              {new Date(notification.created_at).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        {!notification.is_read && (
                          <button
                            onClick={(e) => handleMarkAsRead(notification.id, e)}
                            className="text-xs text-gold hover:text-gold/80 transition-colors"
                          >
                            <CheckCircle className="w-3 h-3" />
                          </button>
                        )}
                      </div>

                      {/* Action buttons for notifications */}
                      {(notification.notification_type === 'document_signed' || 
                        notification.notification_type === 'application_submitted') && 
                       notification.application_id &&
                       (
                        <div className="mt-2 flex justify-end gap-2">
                          {/* Assign document to me button - only for document_signed */}
                          {notification.notification_type === 'document_signed' && notification.document_type && (
                            <button
                              onClick={(e) => handleAssignToMe(
                                notification.id, 
                                notification.application_id!, 
                                notification.document_type!,
                                e
                              )}
                              className="text-xs bg-gold text-background px-2 py-1 rounded hover:bg-gold/90 transition-colors mr-2"
                            >
                              Assign to me
                            </button>
                          )}

                          {/* Claim user button - only show for unclaimed users and specific notification types */}
                          {notification.user_id && 
                           notification.notification_type === 'application_submitted' && 
                           !notification.is_read && 
                           (() => {
                             // Check for already claimed status
                             const isAlreadyClaimed = notifications
                               .filter(n => n.user_id === notification.user_id)
                               .some(n => 
                                 n.notification_type === 'user_management' && 
                                 n.message.includes('claimed by')
                               );
                             
                             return !isAlreadyClaimed;
                           })() && (
                            <button
                              onClick={(e) => handleClaimUser(notification.id, notification.user_id, e)}
                              className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700 transition-colors"
                            >
                              Claim User
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )
            ) : !isAdmin ? (
              loading ? (
                <div className="p-4 text-center text-text-secondary">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gold mx-auto mb-2"></div>
                  <p>Loading notifications...</p>
                </div>
              ) : userNotifications.length === 0 ? (
                <div className="p-4 text-center text-text-secondary">
                  <p>No notifications</p>
                </div>
              ) : (
                <div className="max-h-96 overflow-y-auto">
                  {userNotifications.map(notification => (
                    <div 
                      key={notification.id} 
                      className={`p-3 border-b border-graphite hover:bg-accent transition-colors cursor-pointer ${
                        !notification.is_read ? 'bg-gold/5' : ''
                      }`}
                      onClick={() => handleUserNotificationClick(notification)}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex items-start gap-2">
                          {notification.subject?.includes('Investment Approved') ? (
                            <FileSignature className="w-4 h-4 text-green-600 mt-1 flex-shrink-0" />
                          ) : (
                            <Bell className="w-4 h-4 text-gold mt-1 flex-shrink-0" />
                          )}
                          <div>
                            <p className={`text-sm ${!notification.is_read ? 'font-semibold text-text-primary' : 'text-text-secondary'}`}>
                              {notification.subject || 'Message'}
                            </p>
                            <p className="text-xs text-text-secondary mt-1">
                              {new Date(notification.created_at).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        {!notification.is_read && (
                          <div className="w-2 h-2 rounded-full bg-gold"></div>
                        )}
                      </div>
                      <p className="text-sm text-text-secondary mt-2 line-clamp-2">
                        {notification.content}
                      </p>
                    </div>
                  ))}
                </div>
              )
            ): (
              <div className="p-4 text-center text-text-secondary">
                <p>No notifications available</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
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

export default NotificationBell;