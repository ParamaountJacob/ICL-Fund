import React from 'react';
import { User, TrendingUp, MessageSquare } from 'lucide-react';

interface UserProfileTabsProps {
  activeTab: 'profile' | 'investments' | 'messages';
  setActiveTab: (tab: 'profile' | 'investments' | 'messages') => void;
}

const UserProfileTabs: React.FC<UserProfileTabsProps> = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: 'profile', label: 'Profile & Documents', icon: User },
    { id: 'investments', label: 'Investments', icon: TrendingUp },
    { id: 'messages', label: 'Messages', icon: MessageSquare }
  ];

  return (
    <div className="border-b border-gray-200">
      <nav className="flex space-x-8 px-6">
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
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default UserProfileTabs;