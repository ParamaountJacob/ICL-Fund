import React, { useState, useEffect } from 'react';
import { Activity, Database, Users, Bell, CheckCircle, AlertTriangle, XCircle, TrendingUp } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import { supabase } from '../lib/supabase';

interface DatabaseStatus {
    functionsWorking: number;
    totalFunctions: number;
    policiesActive: number;
    tablesHealthy: number;
    lastError: string | null;
}

interface SystemMetrics {
    activeUsers: number;
    profilesComplete: number;
    investmentsActive: number;
    notificationsUnread: number;
    errorsLast24h: number;
    performanceScore: number;
}

interface FunctionStatus {
    name: string;
    working: boolean;
    lastChecked: Date;
    error?: string;
}

export const AdminPerformanceDashboard: React.FC = () => {
    const { user, userRole } = useAuth();
    const { info, success, showError } = useNotifications();

    const [databaseStatus, setDatabaseStatus] = useState<DatabaseStatus>({
        functionsWorking: 0,
        totalFunctions: 26,
        policiesActive: 0,
        tablesHealthy: 0,
        lastError: null
    });

    const [systemMetrics, setSystemMetrics] = useState<SystemMetrics>({
        activeUsers: 0,
        profilesComplete: 0,
        investmentsActive: 0,
        notificationsUnread: 0,
        errorsLast24h: 0,
        performanceScore: 0
    });

    const [functionStatuses, setFunctionStatuses] = useState<FunctionStatus[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

    // Critical functions to monitor
    const criticalFunctions = [
        'get_unread_notification_count',
        'get_managed_users_with_admin_details',
        'get_all_admins',
        'claim_user_by_admin',
        'get_user_activity',
        'get_active_user_documents',
        'get_admin_investments_with_users',
        'get_all_investments_with_applications',
        'get_investment_application_by_id',
        'move_investment_to_bank_details_stage',
        'update_onboarding_step',
        'activate_user_investment',
        'create_investment_from_application',
        'user_has_active_investments'
    ];

    const checkFunctionExists = async (functionName: string): Promise<FunctionStatus> => {
        try {
            const { data, error } = await supabase.rpc(functionName as any);

            return {
                name: functionName,
                working: !error,
                lastChecked: new Date(),
                error: error?.message
            };
        } catch (err) {
            return {
                name: functionName,
                working: false,
                lastChecked: new Date(),
                error: err instanceof Error ? err.message : 'Unknown error'
            };
        }
    };

    const runDiagnostics = async () => {
        if (userRole !== 'admin' && userRole !== 'super_admin') return;

        setIsLoading(true);
        try {
            // Check function statuses
            const functionResults = await Promise.all(
                criticalFunctions.map(fn => checkFunctionExists(fn))
            );
            setFunctionStatuses(functionResults);

            const workingFunctions = functionResults.filter(f => f.working).length;

            // Check system metrics
            const [usersResult, profilesResult, investmentsResult, notificationsResult] = await Promise.all([
                supabase.from('user_profiles').select('user_id', { count: 'exact' }),
                supabase.from('user_profiles').select('user_id', { count: 'exact' }).not('first_name', 'is', null),
                supabase.from('simple_applications').select('id', { count: 'exact' }).eq('status', 'active'),
                supabase.rpc('get_unread_notification_count').then(res => ({ count: res.data || 0, error: res.error }))
            ]);

            // Check for recent errors
            const { data: errorLogs } = await supabase
                .from('error_logs')
                .select('id')
                .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

            // Calculate performance score
            const functionHealth = (workingFunctions / criticalFunctions.length) * 100;
            const systemHealth = usersResult.error ? 0 : 100;
            const performanceScore = Math.round((functionHealth + systemHealth) / 2);

            setDatabaseStatus({
                functionsWorking: workingFunctions,
                totalFunctions: criticalFunctions.length,
                policiesActive: workingFunctions > 10 ? 15 : 5, // Estimate based on function success
                tablesHealthy: usersResult.error ? 0 : 8,
                lastError: functionResults.find(f => !f.working)?.error || null
            });

            setSystemMetrics({
                activeUsers: usersResult.count || 0,
                profilesComplete: profilesResult.count || 0,
                investmentsActive: investmentsResult.count || 0,
                notificationsUnread: notificationsResult.count || 0,
                errorsLast24h: errorLogs?.length || 0,
                performanceScore
            });

            setLastRefresh(new Date());

            if (performanceScore >= 90) {
                success('System Health', 'All systems operational!');
            } else if (performanceScore >= 70) {
                info('System Status', 'Minor issues detected but system functional');
            } else {
                showError('System Alert', 'Critical issues detected requiring attention');
            }

        } catch (error) {
            console.error('Diagnostics error:', error);
            showError('Diagnostics Failed', 'Unable to run system diagnostics');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        runDiagnostics();

        // Auto-refresh every 5 minutes
        const interval = setInterval(runDiagnostics, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, [userRole]);

    if (userRole !== 'admin' && userRole !== 'super_admin') {
        return (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center">
                    <XCircle className="h-5 w-5 text-red-400 mr-2" />
                    <span className="text-red-700">Admin access required</span>
                </div>
            </div>
        );
    }

    const getStatusColor = (score: number) => {
        if (score >= 90) return 'text-green-600';
        if (score >= 70) return 'text-yellow-600';
        return 'text-red-600';
    };

    const getStatusIcon = (working: boolean) => {
        return working ? (
            <CheckCircle className="h-4 w-4 text-green-500" />
        ) : (
            <XCircle className="h-4 w-4 text-red-500" />
        );
    };

    return (
        <div className="max-w-7xl mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">System Performance Dashboard</h1>
                        <p className="text-gray-600">Monitor database functions, system health, and user activity</p>
                    </div>
                    <div className="flex items-center space-x-4">
                        <button
                            onClick={runDiagnostics}
                            disabled={isLoading}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                        >
                            {isLoading ? 'Running...' : 'Run Diagnostics'}
                        </button>
                        <div className="text-sm text-gray-500">
                            Last updated: {lastRefresh.toLocaleTimeString()}
                        </div>
                    </div>
                </div>
            </div>

            {/* Performance Score */}
            <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900">Overall System Health</h2>
                        <div className={`text-3xl font-bold ${getStatusColor(systemMetrics.performanceScore)}`}>
                            {systemMetrics.performanceScore}%
                        </div>
                    </div>
                    <TrendingUp className={`h-12 w-12 ${getStatusColor(systemMetrics.performanceScore)}`} />
                </div>
                <div className="mt-4 bg-gray-200 rounded-full h-3">
                    <div
                        className={`h-3 rounded-full transition-all ${systemMetrics.performanceScore >= 90 ? 'bg-green-500' :
                                systemMetrics.performanceScore >= 70 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                        style={{ width: `${systemMetrics.performanceScore}%` }}
                    ></div>
                </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white rounded-lg shadow-sm p-6">
                    <div className="flex items-center">
                        <Database className="h-8 w-8 text-blue-500" />
                        <div className="ml-4">
                            <p className="text-sm text-gray-600">Database Functions</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {databaseStatus.functionsWorking}/{databaseStatus.totalFunctions}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-6">
                    <div className="flex items-center">
                        <Users className="h-8 w-8 text-green-500" />
                        <div className="ml-4">
                            <p className="text-sm text-gray-600">Active Users</p>
                            <p className="text-2xl font-bold text-gray-900">{systemMetrics.activeUsers}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-6">
                    <div className="flex items-center">
                        <Bell className="h-8 w-8 text-yellow-500" />
                        <div className="ml-4">
                            <p className="text-sm text-gray-600">Unread Notifications</p>
                            <p className="text-2xl font-bold text-gray-900">{systemMetrics.notificationsUnread}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-6">
                    <div className="flex items-center">
                        <Activity className="h-8 w-8 text-purple-500" />
                        <div className="ml-4">
                            <p className="text-sm text-gray-600">Errors (24h)</p>
                            <p className="text-2xl font-bold text-gray-900">{systemMetrics.errorsLast24h}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Function Status Table */}
            <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Critical Functions Status</h2>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Function Name
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Last Checked
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Error
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {functionStatuses.map((func, index) => (
                                <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {func.name}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        <div className="flex items-center">
                                            {getStatusIcon(func.working)}
                                            <span className="ml-2">
                                                {func.working ? 'Working' : 'Failed'}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {func.lastChecked.toLocaleTimeString()}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-red-600 max-w-xs truncate">
                                        {func.error || '-'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* System Status */}
            <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">System Status Summary</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 border rounded-lg">
                        <h3 className="font-medium text-gray-900">Profile System</h3>
                        <p className="text-sm text-gray-600 mt-1">
                            {systemMetrics.profilesComplete} of {systemMetrics.activeUsers} profiles complete
                        </p>
                        <div className="mt-2">
                            {systemMetrics.activeUsers > 0 && (
                                <div className="bg-gray-200 rounded-full h-2">
                                    <div
                                        className="bg-green-500 h-2 rounded-full"
                                        style={{
                                            width: `${Math.round((systemMetrics.profilesComplete / systemMetrics.activeUsers) * 100)}%`
                                        }}
                                    ></div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="p-4 border rounded-lg">
                        <h3 className="font-medium text-gray-900">Investment System</h3>
                        <p className="text-sm text-gray-600 mt-1">
                            {systemMetrics.investmentsActive} active investments
                        </p>
                        <div className="mt-2">
                            {databaseStatus.functionsWorking > 20 ? (
                                <span className="text-green-600 text-sm font-medium">✓ Operational</span>
                            ) : (
                                <span className="text-red-600 text-sm font-medium">⚠ Issues detected</span>
                            )}
                        </div>
                    </div>

                    <div className="p-4 border rounded-lg">
                        <h3 className="font-medium text-gray-900">Notification System</h3>
                        <p className="text-sm text-gray-600 mt-1">
                            {systemMetrics.notificationsUnread} unread notifications
                        </p>
                        <div className="mt-2">
                            {functionStatuses.find(f => f.name === 'get_unread_notification_count')?.working ? (
                                <span className="text-green-600 text-sm font-medium">✓ Operational</span>
                            ) : (
                                <span className="text-red-600 text-sm font-medium">⚠ Issues detected</span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Errors */}
            {databaseStatus.lastError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center">
                        <AlertTriangle className="h-5 w-5 text-red-400 mr-2" />
                        <div>
                            <h3 className="font-medium text-red-800">Recent Error Detected</h3>
                            <p className="text-sm text-red-700 mt-1">{databaseStatus.lastError}</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
