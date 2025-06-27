import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    BarChart3,
    Activity,
    Users,
    TrendingUp,
    Shield,
    Database,
    AlertTriangle,
    Settings,
    ChevronDown,
    ChevronRight,
    Home,
    Bell,
    FileText,
    CreditCard,
    UserCheck,
    Globe,
    Eye,
    Zap
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface AdminNavSection {
    id: string;
    title: string;
    icon: React.ReactNode;
    items: {
        path: string;
        label: string;
        icon: React.ReactNode;
        description: string;
    }[];
}

export const EnhancedAdminNavigation: React.FC = () => {
    const { userRole } = useAuth();
    const location = useLocation();
    const [expandedSections, setExpandedSections] = useState<string[]>(['dashboard']);

    const toggleSection = (sectionId: string) => {
        setExpandedSections(prev =>
            prev.includes(sectionId)
                ? prev.filter(id => id !== sectionId)
                : [...prev, sectionId]
        );
    };

    const adminSections: AdminNavSection[] = [
        {
            id: 'dashboard',
            title: 'Main Dashboard',
            icon: <Home className="h-5 w-5" />,
            items: [
                {
                    path: '/admin',
                    label: 'Overview',
                    icon: <BarChart3 className="h-4 w-4" />,
                    description: 'Main admin dashboard and overview'
                },
                {
                    path: '/admin/health',
                    label: 'System Health',
                    icon: <Shield className="h-4 w-4" />,
                    description: 'Real-time system health monitoring'
                },
                {
                    path: '/admin/performance',
                    label: 'Performance',
                    icon: <Activity className="h-4 w-4" />,
                    description: 'System performance and function monitoring'
                }
            ]
        },
        {
            id: 'analytics',
            title: 'Business Intelligence',
            icon: <TrendingUp className="h-5 w-5" />,
            items: [
                {
                    path: '/admin/business-intelligence',
                    label: 'Analytics Dashboard',
                    icon: <BarChart3 className="h-4 w-4" />,
                    description: 'Comprehensive business analytics and insights'
                },
                {
                    path: '/admin/user-journey',
                    label: 'User Journey',
                    icon: <Users className="h-4 w-4" />,
                    description: 'User conversion funnel and journey analysis'
                }
            ]
        },
        {
            id: 'monitoring',
            title: 'System Monitoring',
            icon: <Eye className="h-5 w-5" />,
            items: [
                {
                    path: '/admin/monitoring',
                    label: 'Real-Time Monitor',
                    icon: <Zap className="h-4 w-4" />,
                    description: 'Live system monitoring and alerts'
                }
            ]
        },
        {
            id: 'management',
            title: 'User Management',
            icon: <UserCheck className="h-5 w-5" />,
            items: [
                {
                    path: '/admin/users',
                    label: 'User Profiles',
                    icon: <Users className="h-4 w-4" />,
                    description: 'Manage user accounts and profiles'
                },
                {
                    path: '/admin/applications',
                    label: 'Applications',
                    icon: <FileText className="h-4 w-4" />,
                    description: 'Review and manage investment applications'
                },
                {
                    path: '/admin/documents',
                    label: 'Documents',
                    icon: <FileText className="h-4 w-4" />,
                    description: 'Document management and signing'
                }
            ]
        },
        {
            id: 'system',
            title: 'System Settings',
            icon: <Settings className="h-5 w-5" />,
            items: [
                {
                    path: '/admin/settings',
                    label: 'Configuration',
                    icon: <Settings className="h-4 w-4" />,
                    description: 'System configuration and settings'
                },
                {
                    path: '/admin/notifications',
                    label: 'Notifications',
                    icon: <Bell className="h-4 w-4" />,
                    description: 'Notification management and templates'
                }
            ]
        }
    ];

    if (userRole !== 'admin' && userRole !== 'super_admin') {
        return null;
    }

    const isActive = (path: string) => location.pathname === path;
    const isSectionActive = (section: AdminNavSection) =>
        section.items.some(item => isActive(item.path));

    return (
        <div className="bg-white border-r border-gray-200 w-80 min-h-screen p-6">
            <div className="mb-8">
                <h2 className="text-xl font-bold text-gray-900 mb-2">Admin Center</h2>
                <p className="text-sm text-gray-600">Manage your investment platform</p>
            </div>

            <nav className="space-y-2">
                {adminSections.map((section) => {
                    const isExpanded = expandedSections.includes(section.id);
                    const sectionActive = isSectionActive(section);

                    return (
                        <div key={section.id} className="space-y-1">
                            <button
                                onClick={() => toggleSection(section.id)}
                                className={`w-full flex items-center justify-between p-3 rounded-lg transition-all duration-200 ${sectionActive
                                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                        : 'text-gray-700 hover:bg-gray-50'
                                    }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`${sectionActive ? 'text-blue-600' : 'text-gray-400'}`}>
                                        {section.icon}
                                    </div>
                                    <span className="font-medium">{section.title}</span>
                                </div>
                                {isExpanded ? (
                                    <ChevronDown className="h-4 w-4" />
                                ) : (
                                    <ChevronRight className="h-4 w-4" />
                                )}
                            </button>

                            <AnimatePresence>
                                {isExpanded && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.2 }}
                                        className="overflow-hidden"
                                    >
                                        <div className="ml-6 space-y-1">
                                            {section.items.map((item) => (
                                                <Link
                                                    key={item.path}
                                                    to={item.path}
                                                    className={`flex items-start space-x-3 p-3 rounded-lg transition-all duration-200 ${isActive(item.path)
                                                            ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                                        }`}
                                                >
                                                    <div className={`mt-0.5 ${isActive(item.path) ? 'text-blue-600' : 'text-gray-400'}`}>
                                                        {item.icon}
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="font-medium">{item.label}</div>
                                                        <div className="text-xs text-gray-500 mt-1">{item.description}</div>
                                                    </div>
                                                </Link>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    );
                })}
            </nav>

            {/* Quick Actions */}
            <div className="mt-8 pt-6 border-t border-gray-200">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Quick Actions</h3>
                <div className="space-y-2">
                    <Link
                        to="/admin/monitoring"
                        className="flex items-center space-x-2 p-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
                    >
                        <AlertTriangle className="h-4 w-4 text-orange-500" />
                        <span>Check System Status</span>
                    </Link>
                    <Link
                        to="/admin/business-intelligence"
                        className="flex items-center space-x-2 p-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
                    >
                        <TrendingUp className="h-4 w-4 text-green-500" />
                        <span>View Analytics</span>
                    </Link>
                    <Link
                        to="/admin/user-journey"
                        className="flex items-center space-x-2 p-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
                    >
                        <Users className="h-4 w-4 text-blue-500" />
                        <span>User Insights</span>
                    </Link>
                </div>
            </div>

            {/* System Status Indicator */}
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm font-medium text-green-800">System Operational</span>
                </div>
                <div className="text-xs text-green-600 mt-1">
                    All systems running normally
                </div>
            </div>
        </div>
    );
};
