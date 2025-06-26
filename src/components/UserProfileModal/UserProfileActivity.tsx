import React, { useState } from 'react';
import { Activity, ChevronDown, ChevronUp, UserCheck, UserMinus, UserPlus, Shield, Users } from 'lucide-react';

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

interface UserProfileActivityProps {
  activities: UserActivity[];
}

const UserProfileActivity: React.FC<UserProfileActivityProps> = ({ activities }) => {
  const [expanded, setExpanded] = useState(false);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'claim':
        return <UserPlus className="w-4 h-4 text-blue-600" />;
      case 'unclaim':
        return <UserMinus className="w-4 h-4 text-red-600" />;
      case 'assign':
        return <Users className="w-4 h-4 text-purple-600" />;
      case 'verification':
        return <Shield className="w-4 h-4 text-green-600" />;
      default:
        return <Activity className="w-4 h-4 text-gray-600" />;
    }
  };

  // Display only the 3 most recent activities when collapsed
  const displayedActivities = expanded ? activities : activities.slice(0, 3);
  const hasMoreActivities = activities.length > 3;

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900">User Activity</h3>
        {hasMoreActivities && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-sm"
          >
            {expanded ? (
              <>
                <ChevronUp className="w-4 h-4" />
                <span>Show Less</span>
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4" />
                <span>Show All ({activities.length})</span>
              </>
            )}
          </button>
        )}
      </div>
      
      {activities.length === 0 ? (
        <p className="text-gray-600 bg-gray-50 p-4 rounded-lg">No activity records found.</p>
      ) : (
        <div className="space-y-3">
          {displayedActivities.map((activity) => (
            <div key={activity.id} className="bg-gray-50 p-3 rounded-lg">
              <div className="flex items-start gap-3">
                {getActionIcon(activity.action_type)}
                <div className="flex-1">
                  <p className="text-sm text-gray-900">{activity.action_description}</p>
                  <div className="flex justify-between items-center mt-1">
                    <p className="text-xs text-gray-600">
                      By: {activity.performer_name || 'Unknown'}
                    </p>
                    <p className="text-xs text-gray-600">
                      {formatDate(activity.created_at)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          {!expanded && hasMoreActivities && (
            <button
              onClick={() => setExpanded(true)}
              className="w-full py-2 text-blue-600 hover:text-blue-800 text-sm border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
            >
              Show {activities.length - 3} more activities
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default UserProfileActivity;