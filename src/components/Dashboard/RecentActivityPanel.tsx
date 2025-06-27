import React from 'react';
import { motion } from 'framer-motion';
import { Activity, DollarSign, FileText, TrendingUp } from 'lucide-react';

interface RecentActivity {
    id: string;
    type: 'payment' | 'document_access' | 'investment';
    description: string;
    amount?: number;
    date: string;
    status: 'completed' | 'pending' | 'processing';
}

interface RecentActivityPanelProps {
    recentActivity: RecentActivity[];
    isSampleData: boolean;
}

export const RecentActivityPanel: React.FC<RecentActivityPanelProps> = ({
    recentActivity,
    isSampleData
}) => {
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(amount);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const getActivityIcon = (type: string) => {
        switch (type) {
            case 'payment':
                return <DollarSign className="w-4 h-4" />;
            case 'document_access':
                return <FileText className="w-4 h-4" />;
            case 'investment':
                return <TrendingUp className="w-4 h-4" />;
            default:
                return <Activity className="w-4 h-4" />;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed':
                return 'text-green-600 bg-green-50';
            case 'pending':
                return 'text-yellow-600 bg-yellow-50';
            case 'processing':
                return 'text-blue-600 bg-blue-50';
            default:
                return 'text-gray-600 bg-gray-50';
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-card rounded-lg p-6 border border-card-border"
        >
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-text-primary flex items-center">
                    <Activity className="w-5 h-5 mr-2 text-gold" />
                    Recent Activity
                </h3>
            </div>

            <div className="space-y-4">
                {recentActivity.length > 0 ? (
                    recentActivity.map((activity) => (
                        <div key={activity.id} className="flex items-center justify-between p-4 bg-background rounded-lg border border-card-border">
                            <div className="flex items-center">
                                <div className={`p-2 rounded-lg mr-3 ${getStatusColor(activity.status)}`}>
                                    {getActivityIcon(activity.type)}
                                </div>
                                <div>
                                    <p className="font-medium text-text-primary">{activity.description}</p>
                                    <p className="text-sm text-text-secondary">{formatDate(activity.date)}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                {activity.amount && (
                                    <p className="font-semibold text-text-primary">
                                        {formatCurrency(activity.amount)}
                                    </p>
                                )}
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getStatusColor(activity.status)}`}>
                                    {activity.status}
                                </span>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-8">
                        <Activity className="w-12 h-12 text-text-tertiary mx-auto mb-4" />
                        <p className="text-text-secondary">
                            {isSampleData
                                ? "Your investment activity will appear here"
                                : "No recent activity"
                            }
                        </p>
                    </div>
                )}
            </div>
        </motion.div>
    );
};
