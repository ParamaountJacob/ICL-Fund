import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase, getUserProfileById, updateUserProfile, addAdminNote, type User as UserType, deleteUserAndAllData } from '../../lib/supabase';
import AlertModal from '../AlertModal';

// Import sub-components
import UserProfileHeader from './UserProfileHeader';
import UserProfileTabs from './UserProfileTabs';
import UserProfileAccountInfo from './UserProfileAccountInfo';
import UserProfileContactInfo from './UserProfileContactInfo';
import UserProfileInvestmentProfile from './UserProfileInvestmentProfile';
import UserProfileAdminNotes from './UserProfileAdminNotes';
import UserProfileConsultationRequests from './UserProfileConsultationRequests';
import UserProfileActivity from './UserProfileActivity';
import UserProfileInvestments from './UserProfileInvestments';
import UserProfileMessages from './UserProfileMessages';
import UserProfileClaimStatus from './UserProfileClaimStatus';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserType | null;
  currentUserRole?: 'user' | 'sub_admin' | 'admin';
  defaultTab?: 'profile' | 'investments' | 'messages';
  onDeleteUser?: (userId: string) => void;
}

interface UserProfile {
  id?: string;
  user_id?: string;
  first_name: string;
  last_name: string;
  phone: string;
  address: string;
  ira_accounts: string;
  investment_goals: string;
  risk_tolerance: string;
  net_worth: string;
  annual_income: string;
  admin_notes?: string[];
}

interface UserActivity {
  id: string;
  user_id: string;
  action_type: string;
  action_description: string;
  performed_by: string;
  performer_name: string;
  performer_email: string;
  created_at: string;
}

interface ConsultationRequest {
  id: string;
  name: string;
  email: string;
  phone?: string;
  consultation_type: 'video' | 'phone';
  preferred_date?: string;
  preferred_time?: string;
  suggested_investment_amount?: number;
  notes?: string;
  status: string;
  created_at: string;
}

interface Investment {
  id: string;
  amount: number;
  annual_percentage: number;
  payment_frequency: string;
  start_date: string;
  status: string;
  created_at: string;
}

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  subject?: string;
  content: string;
  is_read: boolean;
  created_at: string;
  sender?: {
    first_name: string;
    last_name: string;
    email: string;
  };
  receiver?: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  user,
  currentUserRole = 'user',
  defaultTab,
  onDeleteUser
}) => {
  const [profile, setProfile] = useState<UserProfile>({
    user_id: '',
    first_name: '',
    last_name: '',
    phone: '',
    address: '',
    ira_accounts: '',
    investment_goals: '',
    risk_tolerance: '',
    net_worth: '',
    annual_income: ''
  });
  const [consultationRequests, setConsultationRequests] = useState<ConsultationRequest[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activities, setActivities] = useState<UserActivity[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'investments' | 'messages'>(defaultTab || 'profile');

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [showAlert, setShowAlert] = useState(false);
  const [alertInfo, setAlertInfo] = useState({ title: '', message: '', type: 'info' as const });
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      // Get current user ID
      supabase.auth.getUser().then(({ data: { user: currentUser } }) => {
        if (currentUser) {
          setCurrentUserId(currentUser.id);
        }
      });

      fetchUserData();
    }
  }, [isOpen, user]);

  const fetchUserData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Fetch user profile
      const profileData = await getUserProfileById(user.id);

      if (profileData) {
        setProfile({
          id: profileData.id,
          user_id: profileData.user_id,
          first_name: profileData.first_name || '',
          last_name: profileData.last_name || '',
          phone: profileData.phone || '',
          address: profileData.address || '',
          ira_accounts: profileData.ira_accounts || '',
          investment_goals: profileData.investment_goals || '',
          risk_tolerance: profileData.risk_tolerance || '',
          net_worth: profileData.net_worth || '',
          annual_income: profileData.annual_income || '',
          admin_notes: profileData.admin_notes || []
        });
      } else {
        // If no profile exists, initialize with user's first/last name
        setProfile({
          user_id: user.id,
          first_name: user.first_name || '',
          last_name: user.last_name || '',
          phone: '',
          address: '',
          ira_accounts: '',
          investment_goals: '',
          risk_tolerance: '',
          net_worth: '',
          annual_income: ''
        });
      }

      // Fetch consultation requests
      const { data: consultRequests } = await supabase
        .from('consultation_requests')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (consultRequests) {
        setConsultationRequests(consultRequests);
      }

      try {
        // Use the new simple workflow function (no user_id parameter needed - uses auth.uid())
        const { data: investmentsWithApps, error } = await supabase.rpc('get_user_applications');

        if (error) throw error;

        if (investmentsWithApps) {
          setInvestments(investmentsWithApps);
        }
      } catch (error) {
        console.error('Error fetching investments:', error);
      }

      // Fetch messages with improved approach to avoid relationship issues
      const { data: messageData } = await supabase
        .from('messages')
        .select('*')
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (messageData && messageData.length > 0) {
        // Extract unique user IDs from messages
        const userIds = new Set<string>();
        messageData.forEach(msg => {
          userIds.add(msg.sender_id);
          userIds.add(msg.receiver_id);
        });

        // Fetch user details for all involved users
        const { data: userData } = await supabase
          .from('users')
          .select('id, first_name, last_name, email')
          .in('id', Array.from(userIds));

        // Create a map for quick lookup
        const userMap = new Map();
        userData?.forEach(u => {
          userMap.set(u.id, {
            first_name: u.first_name,
            last_name: u.last_name,
            email: u.email
          });
        });

        // Map user details back to messages
        const messagesWithUsers = messageData.map(msg => ({
          ...msg,
          sender: userMap.get(msg.sender_id),
          receiver: userMap.get(msg.receiver_id)
        }));

        setMessages(messagesWithUsers);
      } else {
        setMessages([]);
      }

      // Fetch user activity
      try {
        const { data: activityData, error: activityError } = await supabase.rpc('get_user_activity', {
          p_user_id: user.id,
          p_limit: 50,
          p_offset: 0
        });

        if (activityError) throw activityError;
        setActivities(activityData || []);
      } catch (activityError) {
        console.error('Error fetching user activity:', activityError);
        // Fallback to direct query
        try {
          const { data: fallbackData, error: fallbackError } = await supabase
            .from('user_activity')
            .select(`
              id,
              user_id,
              action_type,
              action_description,
              performed_by,
              created_at
            `)
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(50);

          if (fallbackError) throw fallbackError;

          // Get performer details
          const performerIds = [...new Set(fallbackData.map(a => a.performed_by))];
          const { data: performers } = await supabase
            .from('users')
            .select('id, first_name, last_name, email')
            .in('id', performerIds);

          const performerMap = new Map();
          performers?.forEach(p => {
            performerMap.set(p.id, {
              name: `${p.first_name} ${p.last_name}`,
              email: p.email
            });
          });

          // Map performer details to activities
          const activitiesWithPerformers = fallbackData.map(a => ({
            ...a,
            performer_name: performerMap.get(a.performed_by)?.name || 'Unknown',
            performer_email: performerMap.get(a.performed_by)?.email || 'Unknown'
          }));

          setActivities(activitiesWithPerformers);
        } catch (fallbackErr) {
          console.error('Error with fallback activity query:', fallbackErr);
          setActivities([]);
        }
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!user || !onDeleteUser) return;

    if (currentUserRole !== 'admin') {
      setAlertInfo({
        title: 'Permission Denied',
        message: 'Only the main admin can delete users.',
        type: 'error'
      });
      setShowAlert(true);
      return;
    }

    if (window.confirm(`Are you sure you want to delete user "${user.first_name} ${user.last_name}" (${user.email})? This will permanently delete ALL data associated with this user and cannot be undone.`)) {
      setDeleting(true);
      try {
        await deleteUserAndAllData(user.id);
        setAlertInfo({
          title: 'User Deleted',
          message: 'User and all associated data have been successfully deleted.',
          type: 'success'
        });
        setShowAlert(true);

        // Close the modal after a short delay
        setTimeout(() => {
          onDeleteUser(user.id);
          onClose();
        }, 1500);
      } catch (error) {
        console.error('Error deleting user:', error);
        setAlertInfo({
          title: 'Deletion Failed',
          message: 'Failed to delete user: ' + (error instanceof Error ? error.message : 'Unknown error'),
          type: 'error'
        });
        setShowAlert(true);
        setDeleting(false);
      }
    }
  };

  const handleAddNote = async (note: string) => {
    if (!user) return;
    await addAdminNote(user.id, note);

    // Update local state
    setProfile(prev => ({
      ...prev,
      admin_notes: [...(prev.admin_notes || []), note]
    }));
  };

  const handleSaveNameSection = async (data: { first_name: string; last_name: string }) => {
    if (!user) return;

    // Update the profile
    await updateUserProfile({
      user_id: user.id,
      ...data
    });

    // Update the user's first and last name in the users table
    const { error } = await supabase
      .from('users')
      .update({
        first_name: data.first_name,
        last_name: data.last_name
      })
      .eq('id', user.id);

    if (error) throw error;

    // Update local state
    setProfile(prev => ({
      ...prev,
      first_name: data.first_name,
      last_name: data.last_name
    }));

    // Update the local user object
    user.first_name = data.first_name;
    user.last_name = data.last_name;
  };

  const handleSaveContactSection = async (data: { phone: string; address: string }) => {
    if (!user) return;

    // Update the profile
    await updateUserProfile({
      user_id: user.id,
      ...data
    });

    // Update local state
    setProfile(prev => ({
      ...prev,
      phone: data.phone,
      address: data.address
    }));
  };

  const handleSaveInvestmentProfile = async (data: {
    net_worth: string;
    annual_income: string;
    risk_tolerance: string;
    ira_accounts: string;
    investment_goals: string;
  }) => {
    if (!user) return;

    // Update the profile
    await updateUserProfile({
      user_id: user.id,
      ...data
    });

    // Update local state
    setProfile(prev => ({
      ...prev,
      net_worth: data.net_worth,
      annual_income: data.annual_income,
      risk_tolerance: data.risk_tolerance,
      ira_accounts: data.ira_accounts,
      investment_goals: data.investment_goals
    }));
  };

  const handleSendMessage = async (subject: string, content: string) => {
    if (!user) return;

    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (!currentUser) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('messages')
      .insert([{
        sender_id: currentUser.id,
        receiver_id: user.id,
        subject: subject || 'Message from Admin',
        content: content
      }]);

    if (error) throw error;

    await fetchUserData(); // Refresh messages
    setAlertInfo({
      title: 'Message Sent',
      message: 'Message sent successfully!',
      type: 'success'
    });
    setShowAlert(true);
  };

  if (!isOpen || !user) return null;

  return (
    <>
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={e => e.stopPropagation()}
            className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden"
          >
            {/* Header */}
            <UserProfileHeader
              email={user.email}
              role={user.role}
              onClose={onClose}
              userId={user.id}
              onDeleteUser={currentUserRole === 'admin' ? handleDeleteUser : undefined}
              deleting={deleting}
            />

            {/* Tab Navigation */}
            <UserProfileTabs
              activeTab={activeTab}
              setActiveTab={setActiveTab}
            />

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-3 text-gray-600">Loading user data...</span>
                </div>
              ) : (
                <div>
                  {activeTab === 'profile' && (
                    <div className="space-y-8">
                      {/* Basic Information */}
                      <div className="grid md:grid-cols-2 gap-6">
                        <UserProfileAccountInfo
                          email={user.email}
                          role={user.role}
                          createdAt={user.created_at}
                          verificationStatus={user.verification_status}
                          userId={user.id}
                        />

                        {/* Claim Status - Only show for regular users */}
                        {user.role === 'user' && (
                          <UserProfileClaimStatus
                            user={user}
                            currentUserId={currentUserId}
                            onUserClaimed={fetchUserData}
                          />
                        )}

                        <UserProfileContactInfo
                          firstName={profile.first_name}
                          lastName={profile.last_name}
                          phone={profile.phone}
                          address={profile.address}
                          onSave={handleSaveNameSection}
                          onSaveContact={handleSaveContactSection}
                        />
                      </div>

                      {/* Investment Profile */}
                      <UserProfileInvestmentProfile
                        netWorth={profile.net_worth}
                        annualIncome={profile.annual_income}
                        riskTolerance={profile.risk_tolerance}
                        iraAccounts={profile.ira_accounts}
                        investmentGoals={profile.investment_goals}
                        onSave={handleSaveInvestmentProfile}
                      />

                      {/* Admin Notes */}
                      <UserProfileAdminNotes
                        notes={profile.admin_notes || []}
                        onAddNote={handleAddNote}
                      />

                      {/* User Activity */}
                      <UserProfileActivity
                        activities={activities}
                      />

                      {/* Consultation Requests */}
                      <UserProfileConsultationRequests
                        consultationRequests={consultationRequests}
                        onDeleteConsultationRequest={fetchUserData}
                        currentUserRole={currentUserRole}
                      />
                    </div>
                  )}

                  {activeTab === 'investments' && (
                    <UserProfileInvestments
                      investments={investments}
                      user={user}
                      onInvestmentUpdate={fetchUserData}
                    />
                  )}

                  {activeTab === 'messages' && (
                    <UserProfileMessages
                      messages={messages}
                      onSendMessage={handleSendMessage}
                    />
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>

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

export default UserProfileModal;