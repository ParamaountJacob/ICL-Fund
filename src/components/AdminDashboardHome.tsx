import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    BarChart3,
    Activity,
    Users,
    TrendingUp,
    Shield,
    Database,
    AlertTriangle,
    CheckCircle,
    Clock,
    DollarSign,
    FileText,
    Bell,
    Eye,
    Zap,
    ArrowRight,
    RefreshCw,
    Settings
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';

interface QuickStat {
    label: string;
    value: string;
    change: string;
    trend: 'up' | 'down' | 'stable';
    icon: React.ReactNode;
    color: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
}

interface SystemStatus {
    service: string;
    status: 'operational' | 'degraded' | 'down';
    responseTime: number;
    uptime: number;
}

interface RecentActivity {
    id: string;
    type: 'user_registration' | 'investment' | 'document_signed' | 'system_alert' | 'admin_action';
    message: string;
    timestamp: Date;
    severity: 'info' | 'warning' | 'success' | 'error';
}

export const AdminDashboardHome: React.FC = () => {
    const { userRole, profile } = useAuth();
    const { info, success } = useNotifications();

    const [quickStats, setQuickStats] = useState<QuickStat[]>([]);
    const [systemStatus, setSystemStatus] = useState<SystemStatus[]>([]);
    const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

    const generateQuickStats = (): QuickStat[] => [
        {
            label: 'Total Users',
            value: '1,247',
            change: '+12.5%',
            trend: 'up',
            icon: <Users className="h-6 w-6" />,
            color: 'blue'
        },
        {
            label: 'Active Investments',
            value: '$2.4M',
            change: '+8.2%',
            trend: 'up',
            icon: <DollarSign className="h-6 w-6" />,
            color: 'green'
        },
        {
            label: 'System Health',
            value: '98.7%',
            change: '+0.3%',
            trend: 'up',
            icon: <Shield className="h-6 w-6" />,
            color: 'green'
        },
        {
            label: 'Pending Reviews',
            value: '23',
            change: '-15.2%',
            trend: 'down',
            icon: <FileText className="h-6 w-6" />,
            color: 'yellow'
        },
        {
            label: 'Avg Response Time',
            value: '245ms',
            change: '-12.8%',
            trend: 'down',
            icon: <Activity className="h-6 w-6" />,
            color: 'blue'
        },
        {
            label: 'Monthly Revenue',
            value: '$485K',
            change: '+22.1%',
            trend: 'up',
            icon: <TrendingUp className="h-6 w-6" />,
            color: 'purple'
        }
    ];

    const generateSystemStatus = (): SystemStatus[] => [
        {
            service: 'Database',
            status: 'operational',
            responseTime: 45,
            uptime: 99.9
        },
        {
            service: 'API Gateway',
            status: 'operational',
            responseTime: 123,
            uptime: 99.8
        },
        {
            service: 'Authentication',
            status: 'operational',
            responseTime: 89,
            uptime: 100
        },
        {
            service: 'Document Service',
            status: 'degraded',
            responseTime: 456,
            uptime: 97.2
        },
        {
            service: 'Email Service',
            status: 'operational',
            responseTime: 234,
            uptime: 99.5
        },
        {
            service: 'Payment Gateway',
            status: 'operational',
            responseTime: 167,
            uptime: 99.7
        }
    ];

    const generateRecentActivity = (): RecentActivity[] => [
        {
            id: '1',
            type: 'user_registration',
            message: 'New user registration: john.doe@example.com',
            timestamp: new Date(Date.now() - 5 * 60000),
            severity: 'info'
        },
        {
            id: '2',
            type: 'investment',
            message: 'Investment application submitted: $75,000',
            timestamp: new Date(Date.now() - 12 * 60000),
            severity: 'success'
        },
        {
            id: '3',
            type: 'system_alert',
            message: 'Document service response time elevated',
            timestamp: new Date(Date.now() - 18 * 60000),
            severity: 'warning'
        },
        {
            id: '4',
            type: 'document_signed',
            message: 'Subscription agreement signed by Sarah Wilson',
            timestamp: new Date(Date.now() - 25 * 60000),
            severity: 'success'
        },
        {
            id: '5',
            type: 'admin_action',
            message: 'Investment application approved by Admin',
            timestamp: new Date(Date.now() - 32 * 60000),
            severity: 'info'
        }
    ];

    const loadDashboardData = async () => {
        setIsLoading(true);
        try {
            // Simulate API calls
            await new Promise(resolve => setTimeout(resolve, 800));

            setQuickStats(generateQuickStats());
            setSystemStatus(generateSystemStatus());
            setRecentActivity(generateRecentActivity());
            setLastRefresh(new Date());

            success('Dashboard Updated', 'Data refreshed successfully');
        } catch (error) {
            console.error('Error loading dashboard data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadDashboardData();

        // Auto-refresh every 5 minutes
        const interval = setInterval(loadDashboardData, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    const getStatusColor = (status: SystemStatus['status']) => {
        switch (status) {
            case 'operational': return 'green';
            case 'degraded': return 'yellow';
            case 'down': return 'red';
            default: return 'gray';
        }
    };

    const getActivityIcon = (type: RecentActivity['type']) => {
        switch (type) {
            case 'user_registration': return <Users className="h-4 w-4" />;
            case 'investment': return <DollarSign className="h-4 w-4" />;
            case 'document_signed': return <FileText className="h-4 w-4" />;
            case 'system_alert': return <AlertTriangle className="h-4 w-4" />;
            case 'admin_action': return <Settings className="h-4 w-4" />;
            default: return <Bell className="h-4 w-4" />;
        }
    };

    const getSeverityColor = (severity: RecentActivity['severity']) => {
        switch (severity) {
            case 'success': return 'text-green-600 bg-green-50';
            case 'warning': return 'text-yellow-600 bg-yellow-50';
            case 'error': return 'text-red-600 bg-red-50';
            case 'info': return 'text-blue-600 bg-blue-50';
            default: return 'text-gray-600 bg-gray-50';
        }
    };

    if (isLoading) {
        return (
            <div className="p-8">
                <div className="flex items-center justify-center h-64">
                    <div className="flex items-center space-x-3">
                        <RefreshCw className="h-6 w-6 animate-spin text-blue-500" />
                        <span className="text-gray-600">Loading admin dashboard...</span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8 space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
                    <p className="text-gray-600 mt-1">
                        Welcome back, {profile?.first_name || 'Admin'}. Here's what's happening with your platform.
                    </p>
                </div>
                <div className="flex items-center space-x-4">
                    <span className="text-sm text-gray-500">
                        Last updated: {lastRefresh.toLocaleTimeString()}
                    </span>
                    <button
                        onClick={loadDashboardData}
                        disabled={isLoading}
                        className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                        <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                        Refresh
                    </button>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {quickStats.map((stat, index) => (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className={`bg-white rounded-lg shadow-sm border border-${stat.color}-100 p-6`}
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">{stat.label}</p>
                                <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                                <div className="flex items-center mt-2">
                                    <span className={`text-sm ${stat.trend === 'up' ? 'text-green-600' :
                                            stat.trend === 'down' ? 'text-red-600' : 'text-gray-600'
                                        }`}>
                                        {stat.change}
                                    </span>
                                    <span className="text-xs text-gray-500 ml-1">vs last month</span>
                                </div>
                            </div>
                            <div className={`text-${stat.color}-600 bg-${stat.color}-50 p-3 rounded-lg`}>
                                {stat.icon}
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Quick Access Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Link
                    to="/admin/business-intelligence"
                    className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg p-6 hover:from-blue-600 hover:to-blue-700 transition-all duration-200 group"
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="font-semibold text-lg">Business Intelligence</h3>
                            <p className="text-blue-100 text-sm mt-1">Comprehensive analytics</p>
                        </div>
                        <BarChart3 className="h-8 w-8 text-blue-100 group-hover:scale-110 transition-transform" />
                    </div>
                    <div className="flex items-center mt-4 text-blue-100">
                        <span className="text-sm">View Analytics</span>
                        <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </div>
                </Link>

                <Link
                    to="/admin/user-journey"
                    className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg p-6 hover:from-green-600 hover:to-green-700 transition-all duration-200 group"
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="font-semibold text-lg">User Journey</h3>
                            <p className="text-green-100 text-sm mt-1">Conversion optimization</p>
                        </div>
                        <Users className="h-8 w-8 text-green-100 group-hover:scale-110 transition-transform" />
                    </div>
                    <div className="flex items-center mt-4 text-green-100">
                        <span className="text-sm">Analyze Funnel</span>
                        <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </div>
                </Link>

                <Link
                    to="/admin/monitoring"
                    className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-lg p-6 hover:from-purple-600 hover:to-purple-700 transition-all duration-200 group"
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="font-semibold text-lg">Real-Time Monitor</h3>
                            <p className="text-purple-100 text-sm mt-1">Live system status</p>
                        </div>
                        <Eye className="h-8 w-8 text-purple-100 group-hover:scale-110 transition-transform" />
                    </div>
                    <div className="flex items-center mt-4 text-purple-100">
                        <span className="text-sm">Monitor Systems</span>
                        <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </div>
                </Link>

                <Link
                    to="/admin/health"
                    className="bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-lg p-6 hover:from-orange-600 hover:to-orange-700 transition-all duration-200 group"
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="font-semibold text-lg">System Health</h3>
                            <p className="text-orange-100 text-sm mt-1">Health validation</p>
                        </div>
                        <Shield className="h-8 w-8 text-orange-100 group-hover:scale-110 transition-transform" />
                    </div>
                    <div className="flex items-center mt-4 text-orange-100">
                        <span className="text-sm">Check Health</span>
                        <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </div>
                </Link>
            </div>

            {/* System Status and Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* System Status */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-semibold text-gray-900">System Status</h2>
                        <Link
                            to="/admin/monitoring"
                            className="text-sm text-blue-600 hover:text-blue-700 flex items-center"
                        >
                            View Details
                            <ArrowRight className="h-3 w-3 ml-1" />
                        </Link>
                    </div>
                    <div className="space-y-4">
                        {systemStatus.map((service, index) => (
                            <div key={service.service} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div className="flex items-center space-x-3">
                                    <div className={`w-3 h-3 rounded-full bg-${getStatusColor(service.status)}-500`} />
                                    <div>
                                        <span className="font-medium text-gray-900">{service.service}</span>
                                        <div className="text-sm text-gray-600">
                                            {service.responseTime}ms • {service.uptime}% uptime
                                        </div>
                                    </div>
                                </div>
                                <span className={`text-xs px-2 py-1 rounded-full capitalize ${service.status === 'operational' ? 'bg-green-100 text-green-800' :
                                        service.status === 'degraded' ? 'bg-yellow-100 text-yellow-800' :
                                            'bg-red-100 text-red-800'
                                    }`}>
                                    {service.status}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
                        <Link
                            to="/admin/monitoring"
                            className="text-sm text-blue-600 hover:text-blue-700 flex items-center"
                        >
                            View All
                            <ArrowRight className="h-3 w-3 ml-1" />
                        </Link>
                    </div>
                    <div className="space-y-4">
                        {recentActivity.map((activity) => (
                            <div key={activity.id} className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                                <div className={`p-2 rounded-lg ${getSeverityColor(activity.severity)}`}>
                                    {getActivityIcon(activity.type)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900">{activity.message}</p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        {activity.timestamp.toLocaleTimeString()} • {activity.timestamp.toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
