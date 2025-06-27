import React, { useState, useEffect } from 'react';
import { Shield, AlertTriangle, CheckCircle, XCircle, RefreshCw, Clock } from 'lucide-react';
import { SystemValidator, TestSuite } from '../lib/system-validator';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';

interface HealthCheckProps {
    autoRefresh?: boolean;
    refreshInterval?: number; // in seconds
    onHealthChange?: (isHealthy: boolean) => void;
}

export const SystemHealthChecker: React.FC<HealthCheckProps> = ({
    autoRefresh = true,
    refreshInterval = 300, // 5 minutes
    onHealthChange
}) => {
    const { userRole } = useAuth();
    const { info, success, showError } = useNotifications();

    const [isRunning, setIsRunning] = useState(false);
    const [lastCheck, setLastCheck] = useState<Date | null>(null);
    const [healthData, setHealthData] = useState<{
        suites: TestSuite[];
        overallPass: boolean;
        summary: any;
    } | null>(null);
    const [selectedSuite, setSelectedSuite] = useState<string | null>(null);

    const runHealthCheck = async () => {
        setIsRunning(true);
        try {
            const results = await SystemValidator.runFullValidation();
            setHealthData(results);
            setLastCheck(new Date());

            onHealthChange?.(results.overallPass);

            if (results.summary.successRate >= 90) {
                success('Health Check', 'All systems operational');
            } else if (results.summary.successRate >= 70) {
                info('Health Check', 'Minor issues detected');
            } else {
                showError('Health Check', 'Critical issues require attention');
            }
        } catch (error) {
            console.error('Health check failed:', error);
            showError('Health Check Failed', 'Unable to complete system validation');
        } finally {
            setIsRunning(false);
        }
    };

    const runSpecificCheck = async (issueType: 'profile-loop' | 'admin-panel' | 'notifications' | 'investments') => {
        setIsRunning(true);
        try {
            const result = await SystemValidator.validateSpecificIssue(issueType);

            // Update the specific suite in the health data
            if (healthData) {
                const updatedSuites = healthData.suites.map(suite =>
                    suite.name.toLowerCase().includes(issueType.split('-')[0]) ? result : suite
                );

                const overallPass = updatedSuites.every(suite => suite.overallPass);
                const allTests = updatedSuites.flatMap(suite => suite.tests);
                const passedTests = allTests.filter(test => test.passed).length;

                setHealthData({
                    suites: updatedSuites,
                    overallPass,
                    summary: {
                        totalTests: allTests.length,
                        passedTests,
                        failedTests: allTests.length - passedTests,
                        successRate: Math.round((passedTests / allTests.length) * 100)
                    }
                });
            }

            if (result.overallPass) {
                success('Specific Check', `${result.name} is working correctly`);
            } else {
                showError('Specific Check', `Issues found in ${result.name}`);
            }
        } catch (error) {
            console.error('Specific check failed:', error);
            showError('Check Failed', 'Unable to validate specific system');
        } finally {
            setIsRunning(false);
        }
    };

    useEffect(() => {
        // Run initial health check
        runHealthCheck();

        // Set up auto-refresh if enabled
        if (autoRefresh) {
            const interval = setInterval(runHealthCheck, refreshInterval * 1000);
            return () => clearInterval(interval);
        }
    }, [autoRefresh, refreshInterval]);

    const getStatusIcon = (passed: boolean) => {
        return passed ? (
            <CheckCircle className="h-5 w-5 text-green-500" />
        ) : (
            <XCircle className="h-5 w-5 text-red-500" />
        );
    };

    const getStatusColor = (passed: boolean) => {
        return passed ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50';
    };

    if (userRole !== 'admin' && userRole !== 'super_admin') {
        return null; // Don't show health checker to non-admins
    }

    return (
        <div className="bg-white rounded-lg shadow-sm border">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                    <div className="flex items-center">
                        <Shield className="h-6 w-6 text-blue-500 mr-3" />
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900">System Health Monitor</h3>
                            <p className="text-sm text-gray-600">
                                {lastCheck ? `Last check: ${lastCheck.toLocaleTimeString()}` : 'No checks run yet'}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={runHealthCheck}
                        disabled={isRunning}
                        className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                        <RefreshCw className={`h-4 w-4 mr-2 ${isRunning ? 'animate-spin' : ''}`} />
                        {isRunning ? 'Checking...' : 'Check Now'}
                    </button>
                </div>
            </div>

            {/* Overall Status */}
            {healthData && (
                <div className="px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            {getStatusIcon(healthData.overallPass)}
                            <span className="ml-2 text-lg font-medium">
                                Overall System Status: {healthData.overallPass ? 'Healthy' : 'Issues Detected'}
                            </span>
                        </div>
                        <div className="text-right">
                            <div className="text-2xl font-bold text-gray-900">
                                {healthData.summary.successRate}%
                            </div>
                            <div className="text-sm text-gray-600">
                                {healthData.summary.passedTests}/{healthData.summary.totalTests} tests passed
                            </div>
                        </div>
                    </div>

                    {/* Progress bar */}
                    <div className="mt-3 bg-gray-200 rounded-full h-2">
                        <div
                            className={`h-2 rounded-full transition-all ${healthData.summary.successRate >= 90 ? 'bg-green-500' :
                                    healthData.summary.successRate >= 70 ? 'bg-yellow-500' : 'bg-red-500'
                                }`}
                            style={{ width: `${healthData.summary.successRate}%` }}
                        ></div>
                    </div>
                </div>
            )}

            {/* Quick Action Buttons */}
            <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={() => runSpecificCheck('profile-loop')}
                        disabled={isRunning}
                        className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors disabled:opacity-50"
                    >
                        Check Profile System
                    </button>
                    <button
                        onClick={() => runSpecificCheck('admin-panel')}
                        disabled={isRunning}
                        className="px-3 py-1 text-sm bg-purple-100 text-purple-700 rounded-md hover:bg-purple-200 transition-colors disabled:opacity-50"
                    >
                        Check Admin Panel
                    </button>
                    <button
                        onClick={() => runSpecificCheck('notifications')}
                        disabled={isRunning}
                        className="px-3 py-1 text-sm bg-yellow-100 text-yellow-700 rounded-md hover:bg-yellow-200 transition-colors disabled:opacity-50"
                    >
                        Check Notifications
                    </button>
                    <button
                        onClick={() => runSpecificCheck('investments')}
                        disabled={isRunning}
                        className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors disabled:opacity-50"
                    >
                        Check Investments
                    </button>
                </div>
            </div>

            {/* Test Suites */}
            {healthData && (
                <div className="px-6 py-4">
                    <div className="space-y-4">
                        {healthData.suites.map((suite, index) => (
                            <div key={index} className="border rounded-lg overflow-hidden">
                                <button
                                    onClick={() => setSelectedSuite(selectedSuite === suite.name ? null : suite.name)}
                                    className="w-full px-4 py-3 bg-gray-50 flex items-center justify-between hover:bg-gray-100 transition-colors"
                                >
                                    <div className="flex items-center">
                                        {getStatusIcon(suite.overallPass)}
                                        <span className="ml-3 font-medium text-gray-900">{suite.name}</span>
                                        <span className="ml-2 text-sm text-gray-600">
                                            ({suite.tests.filter(t => t.passed).length}/{suite.tests.length})
                                        </span>
                                    </div>
                                    <div className="flex items-center text-sm text-gray-500">
                                        <Clock className="h-4 w-4 mr-1" />
                                        {suite.totalDuration}ms
                                    </div>
                                </button>

                                {selectedSuite === suite.name && (
                                    <div className="px-4 py-3 border-t border-gray-200">
                                        <div className="space-y-2">
                                            {suite.tests.map((test, testIndex) => (
                                                <div key={testIndex} className={`p-3 rounded-lg ${getStatusColor(test.passed)}`}>
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center">
                                                            {getStatusIcon(test.passed)}
                                                            <span className="ml-2 font-medium">{test.name}</span>
                                                        </div>
                                                        <span className="text-sm">{test.duration}ms</span>
                                                    </div>
                                                    {test.error && (
                                                        <div className="mt-2 text-sm text-red-600">
                                                            <AlertTriangle className="h-4 w-4 inline mr-1" />
                                                            {test.error}
                                                        </div>
                                                    )}
                                                    {test.details && (
                                                        <div className="mt-2 text-sm text-gray-600">
                                                            <pre className="whitespace-pre-wrap">
                                                                {JSON.stringify(test.details, null, 2)}
                                                            </pre>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Auto-refresh indicator */}
            {autoRefresh && (
                <div className="px-6 py-2 bg-gray-50 text-sm text-gray-600 border-t">
                    <div className="flex items-center justify-center">
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Auto-refreshing every {refreshInterval / 60} minutes
                    </div>
                </div>
            )}
        </div>
    );
};
