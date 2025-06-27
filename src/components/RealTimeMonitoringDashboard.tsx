import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    AlertTriangle,
    CheckCircle,
    XCircle,
    Clock,
    Activity,
    Zap,
    Database,
    Server,
    Globe,
    Users,
    DollarSign,
    FileText,
    Bell,
    Settings,
    Pause,
    Play,
    RotateCcw,
    Download,
    Filter,
    Search,
    TrendingUp,
    TrendingDown,
    Minus
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import { supabase } from '../lib/supabase';

interface Alert {
    id: string;
    type: 'critical' | 'warning' | 'info' | 'success';
    category: 'system' | 'security' | 'business' | 'user' | 'performance';
    title: string;
    message: string;
    timestamp: Date;
    acknowledged: boolean;
    resolved: boolean;
    source: string;
    metadata?: Record<string, any>;
}

interface MetricPoint {
    timestamp: Date;
    value: number;
    status: 'healthy' | 'warning' | 'critical';
}

interface SystemMetric {
    id: string;
    name: string;
    description: string;
    unit: string;
    icon: React.ReactNode;
    currentValue: number;
    threshold: {
        warning: number;
        critical: number;
    };
    trend: 'up' | 'down' | 'stable';
    change: number;
    history: MetricPoint[];
}

interface MonitoringConfig {
    refreshInterval: number; // in seconds
    alertThresholds: Record<string, { warning: number; critical: number }>;
    enabledCategories: string[];
    notificationPreferences: {
        email: boolean;
        push: boolean;
        sms: boolean;
    };
}

export const RealTimeMonitoringDashboard: React.FC = () => {
    const { userRole } = useAuth();
    const { info, success, showError, showWarning } = useNotifications();

    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [metrics, setMetrics] = useState<SystemMetric[]>([]);
    const [isMonitoring, setIsMonitoring] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [alertFilter, setAlertFilter] = useState<string>('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [config, setConfig] = useState<MonitoringConfig>({
        refreshInterval: 30,
        alertThresholds: {},
        enabledCategories: ['system', 'security', 'business', 'user', 'performance'],
        notificationPreferences: {
            email: true,
            push: true,
            sms: false
        }
    });

    const monitoringInterval = useRef<NodeJS.Timeout | null>(null);
    const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

    const systemMetrics: SystemMetric[] = [
        {
            id: 'database_connections',
            name: 'Database Connections',
            description: 'Active database connections',
            unit: 'connections',
            icon: <Database className="h-5 w-5" />,
            currentValue: 45,
            threshold: { warning: 80, critical: 95 },
            trend: 'stable',
            change: 0.2,
            history: []
        },
        {
            id: 'api_response_time',
            name: 'API Response Time',
            description: 'Average API response time',
            unit: 'ms',
            icon: <Server className="h-5 w-5" />,
            currentValue: 235,
            threshold: { warning: 500, critical: 1000 },
            trend: 'down',
            change: -15.3,
            history: []
        },
        {
            id: 'active_users',
            name: 'Active Users',
            description: 'Currently active users',
            unit: 'users',
            icon: <Users className="h-5 w-5" />,
            currentValue: 124,
            threshold: { warning: 500, critical: 800 },
            trend: 'up',
            change: 8.5,
            history: []
        },
        {
            id: 'error_rate',
            name: 'Error Rate',
            description: 'Application error rate',
            unit: '%',
            icon: <AlertTriangle className="h-5 w-5" />,
            currentValue: 2.1,
            threshold: { warning: 5, critical: 10 },
            trend: 'stable',
            change: 0.1,
            history: []
        },
        {
            id: 'transaction_volume',
            name: 'Transaction Volume',
            description: 'Daily transaction volume',
            unit: '$',
            icon: <DollarSign className="h-5 w-5" />,
            currentValue: 125000,
            threshold: { warning: 1000000, critical: 2000000 },
            trend: 'up',
            change: 12.8,
            history: []
        },
        {
            id: 'memory_usage',
            name: 'Memory Usage',
            description: 'System memory utilization',
            unit: '%',
            icon: <Activity className="h-5 w-5" />,
            currentValue: 68,
            threshold: { warning: 80, critical: 95 },
            trend: 'up',
            change: 3.2,
            history: []
        }
    ];

    const generateMockAlerts = (): Alert[] => {
        const alertTypes = [
            {
                type: 'warning' as const,
                category: 'performance' as const,
                title: 'High API Response Time',
                message: 'API response time has exceeded 400ms threshold',
                source: 'Performance Monitor'
            },
            {
                type: 'info' as const,
                category: 'business' as const,
                title: 'New Investment Application',
                message: 'Large investment application received requiring manual review',
                source: 'Application System'
            },
            {
                type: 'critical' as const,
                category: 'security' as const,
                title: 'Multiple Failed Login Attempts',
                message: 'Unusual login pattern detected from IP 192.168.1.100',
                source: 'Security Monitor'
            },
            {
                type: 'success' as const,
                category: 'system' as const,
                title: 'Backup Completed',
                message: 'Daily database backup completed successfully',
                source: 'Backup System'
            }
        ];

        return alertTypes.map((alert, index) => ({
            id: `alert-${Date.now()}-${index}`,
            ...alert,
            timestamp: new Date(Date.now() - Math.random() * 3600000),
            acknowledged: Math.random() > 0.7,
            resolved: Math.random() > 0.8,
            metadata: {
                details: `Additional context for ${alert.title}`,
                affectedSystems: ['Database', 'API', 'Frontend'][Math.floor(Math.random() * 3)]
            }
        }));
    };

    const fetchRealTimeData = async () => {
        try {
            // In a real implementation, this would fetch actual metrics from your monitoring system
            const updatedMetrics = systemMetrics.map(metric => {
                // Simulate metric updates
                const variation = (Math.random() - 0.5) * 0.1; // ±5% variation
                const newValue = Math.max(0, metric.currentValue * (1 + variation));

                const status: 'healthy' | 'warning' | 'critical' =
                    newValue >= metric.threshold.critical ? 'critical' :
                        newValue >= metric.threshold.warning ? 'warning' : 'healthy';

                return {
                    ...metric,
                    currentValue: newValue,
                    history: [
                        ...metric.history.slice(-29), // Keep last 29 points
                        {
                            timestamp: new Date(),
                            value: newValue,
                            status
                        }
                    ]
                };
            });

            setMetrics(updatedMetrics);

            // Check for new alerts based on metric thresholds
            checkMetricAlerts(updatedMetrics);

            // Occasionally add random alerts for demonstration
            if (Math.random() < 0.1) {
                const newAlert = generateMockAlerts()[0];
                setAlerts(prev => [newAlert, ...prev.slice(0, 49)]); // Keep last 50 alerts

                // Show notification for new critical/warning alerts
                if (newAlert.type === 'critical') {
                    showError('Critical Alert', newAlert.message);
                } else if (newAlert.type === 'warning') {
                    showWarning('Warning Alert', newAlert.message);
                }
            }

            setLastUpdate(new Date());
        } catch (error) {
            console.error('Error fetching real-time data:', error);
        }
    };

    const checkMetricAlerts = (metrics: SystemMetric[]) => {
        metrics.forEach(metric => {
            const currentValue = metric.currentValue;

            if (currentValue >= metric.threshold.critical) {
                // Critical threshold exceeded
                const existingAlert = alerts.find(
                    alert => alert.source === `Metric: ${metric.name}` &&
                        alert.type === 'critical' &&
                        !alert.resolved
                );

                if (!existingAlert) {
                    const criticalAlert: Alert = {
                        id: `metric-critical-${metric.id}-${Date.now()}`,
                        type: 'critical',
                        category: 'performance',
                        title: `Critical: ${metric.name}`,
                        message: `${metric.name} has exceeded critical threshold: ${currentValue.toFixed(2)} ${metric.unit}`,
                        timestamp: new Date(),
                        acknowledged: false,
                        resolved: false,
                        source: `Metric: ${metric.name}`,
                        metadata: {
                            metricId: metric.id,
                            value: currentValue,
                            threshold: metric.threshold.critical,
                            unit: metric.unit
                        }
                    };

                    setAlerts(prev => [criticalAlert, ...prev]);
                }
            } else if (currentValue >= metric.threshold.warning) {
                // Warning threshold exceeded
                const existingAlert = alerts.find(
                    alert => alert.source === `Metric: ${metric.name}` &&
                        alert.type === 'warning' &&
                        !alert.resolved
                );

                if (!existingAlert) {
                    const warningAlert: Alert = {
                        id: `metric-warning-${metric.id}-${Date.now()}`,
                        type: 'warning',
                        category: 'performance',
                        title: `Warning: ${metric.name}`,
                        message: `${metric.name} has exceeded warning threshold: ${currentValue.toFixed(2)} ${metric.unit}`,
                        timestamp: new Date(),
                        acknowledged: false,
                        resolved: false,
                        source: `Metric: ${metric.name}`,
                        metadata: {
                            metricId: metric.id,
                            value: currentValue,
                            threshold: metric.threshold.warning,
                            unit: metric.unit
                        }
                    };

                    setAlerts(prev => [warningAlert, ...prev]);
                }
            }
        });
    };

    const acknowledgeAlert = (alertId: string) => {
        setAlerts(prev => prev.map(alert =>
            alert.id === alertId ? { ...alert, acknowledged: true } : alert
        ));
        info('Alert Acknowledged', 'Alert has been acknowledged');
    };

    const resolveAlert = (alertId: string) => {
        setAlerts(prev => prev.map(alert =>
            alert.id === alertId ? { ...alert, resolved: true } : alert
        ));
        success('Alert Resolved', 'Alert has been marked as resolved');
    };

    const exportAlerts = () => {
        const filteredAlerts = getFilteredAlerts();
        const exportData = {
            exportedAt: new Date().toISOString(),
            totalAlerts: filteredAlerts.length,
            filters: { category: selectedCategory, type: alertFilter, search: searchTerm },
            alerts: filteredAlerts
        };

        const blob = new Blob([JSON.stringify(exportData, null, 2)], {
            type: 'application/json'
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `monitoring-alerts-${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        info('Export Complete', 'Alert data has been exported successfully');
    };

    const getFilteredAlerts = () => {
        return alerts.filter(alert => {
            if (selectedCategory !== 'all' && alert.category !== selectedCategory) return false;
            if (alertFilter !== 'all') {
                if (alertFilter === 'unresolved' && alert.resolved) return false;
                if (alertFilter === 'unacknowledged' && alert.acknowledged) return false;
                if (alertFilter !== 'unresolved' && alertFilter !== 'unacknowledged' && alert.type !== alertFilter) return false;
            }
            if (searchTerm && !alert.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
                !alert.message.toLowerCase().includes(searchTerm.toLowerCase())) return false;
            return true;
        });
    };

    const getAlertIcon = (type: Alert['type']) => {
        switch (type) {
            case 'critical': return <XCircle className="h-4 w-4" />;
            case 'warning': return <AlertTriangle className="h-4 w-4" />;
            case 'info': return <Bell className="h-4 w-4" />;
            case 'success': return <CheckCircle className="h-4 w-4" />;
        }
    };

    const getAlertColor = (type: Alert['type']) => {
        switch (type) {
            case 'critical': return 'red';
            case 'warning': return 'yellow';
            case 'info': return 'blue';
            case 'success': return 'green';
        }
    };

    const getMetricStatus = (metric: SystemMetric) => {
        if (metric.currentValue >= metric.threshold.critical) return 'critical';
        if (metric.currentValue >= metric.threshold.warning) return 'warning';
        return 'healthy';
    };

    const getMetricColor = (status: string) => {
        switch (status) {
            case 'critical': return 'red';
            case 'warning': return 'yellow';
            case 'healthy': return 'green';
            default: return 'gray';
        }
    };

    const formatValue = (value: number, unit: string) => {
        if (unit === '$') {
            return new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
            }).format(value);
        }
        return `${value.toFixed(unit === '%' ? 1 : 0)}${unit}`;
    };

    useEffect(() => {
        // Initial data load
        setAlerts(generateMockAlerts());
        setMetrics(systemMetrics);
        fetchRealTimeData();

        // Start monitoring
        if (isMonitoring) {
            monitoringInterval.current = setInterval(fetchRealTimeData, config.refreshInterval * 1000);
        }

        return () => {
            if (monitoringInterval.current) {
                clearInterval(monitoringInterval.current);
            }
        };
    }, [isMonitoring, config.refreshInterval]);

    useEffect(() => {
        // Restart monitoring when interval changes
        if (monitoringInterval.current) {
            clearInterval(monitoringInterval.current);
        }

        if (isMonitoring) {
            monitoringInterval.current = setInterval(fetchRealTimeData, config.refreshInterval * 1000);
        }

        return () => {
            if (monitoringInterval.current) {
                clearInterval(monitoringInterval.current);
            }
        };
    }, [config.refreshInterval]);

    if (userRole !== 'admin' && userRole !== 'super_admin') {
        return (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center">
                    <AlertTriangle className="h-5 w-5 text-red-400 mr-2" />
                    <span className="text-red-700">Admin access required for real-time monitoring</span>
                </div>
            </div>
        );
    }

    const filteredAlerts = getFilteredAlerts();
    const unacknowledgedAlerts = alerts.filter(a => !a.acknowledged && !a.resolved).length;
    const criticalAlerts = alerts.filter(a => a.type === 'critical' && !a.resolved).length;

    return (
        <div className="max-w-7xl mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Real-Time Monitoring</h1>
                        <p className="text-gray-600">System health, alerts, and performance metrics</p>
                        <div className="mt-2 flex items-center space-x-4 text-sm">
                            <div className="flex items-center">
                                <div className={`w-2 h-2 rounded-full mr-2 ${isMonitoring ? 'bg-green-500' : 'bg-red-500'}`} />
                                <span className="text-gray-600">
                                    {isMonitoring ? 'Monitoring Active' : 'Monitoring Paused'}
                                </span>
                            </div>
                            <span className="text-gray-500">
                                Last update: {lastUpdate.toLocaleTimeString()}
                            </span>
                        </div>
                    </div>
                    <div className="flex items-center space-x-4">
                        <select
                            value={config.refreshInterval}
                            onChange={(e) => setConfig(prev => ({ ...prev, refreshInterval: parseInt(e.target.value) }))}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                            <option value={10}>10 seconds</option>
                            <option value={30}>30 seconds</option>
                            <option value={60}>1 minute</option>
                            <option value={300}>5 minutes</option>
                        </select>

                        <button
                            onClick={() => setIsMonitoring(!isMonitoring)}
                            className={`flex items-center px-4 py-2 rounded-lg transition-colors ${isMonitoring
                                    ? 'bg-red-600 text-white hover:bg-red-700'
                                    : 'bg-green-600 text-white hover:bg-green-700'
                                }`}
                        >
                            {isMonitoring ? <Pause className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
                            {isMonitoring ? 'Pause' : 'Resume'}
                        </button>

                        <button
                            onClick={fetchRealTimeData}
                            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            <RotateCcw className="h-4 w-4 mr-2" />
                            Refresh Now
                        </button>
                    </div>
                </div>
            </div>

            {/* Alert Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-lg shadow-sm p-6"
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Total Alerts</p>
                            <p className="text-2xl font-bold text-gray-900">{alerts.length}</p>
                        </div>
                        <Bell className="h-8 w-8 text-blue-500" />
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white rounded-lg shadow-sm p-6"
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Critical Alerts</p>
                            <p className="text-2xl font-bold text-red-600">{criticalAlerts}</p>
                        </div>
                        <XCircle className="h-8 w-8 text-red-500" />
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white rounded-lg shadow-sm p-6"
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Unacknowledged</p>
                            <p className="text-2xl font-bold text-yellow-600">{unacknowledgedAlerts}</p>
                        </div>
                        <AlertTriangle className="h-8 w-8 text-yellow-500" />
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-white rounded-lg shadow-sm p-6"
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">System Health</p>
                            <p className="text-2xl font-bold text-green-600">
                                {Math.round((metrics.filter(m => getMetricStatus(m) === 'healthy').length / metrics.length) * 100)}%
                            </p>
                        </div>
                        <Activity className="h-8 w-8 text-green-500" />
                    </div>
                </motion.div>
            </div>

            {/* System Metrics */}
            <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-6">System Metrics</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {metrics.map((metric) => {
                        const status = getMetricStatus(metric);
                        const color = getMetricColor(status);

                        return (
                            <motion.div
                                key={metric.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`border-2 border-${color}-200 bg-${color}-50 rounded-lg p-4`}
                            >
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center">
                                        <div className={`text-${color}-600 mr-2`}>
                                            {metric.icon}
                                        </div>
                                        <div>
                                            <h3 className="font-medium text-gray-900">{metric.name}</h3>
                                            <p className="text-xs text-gray-600">{metric.description}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center text-sm">
                                        {metric.trend === 'up' && <TrendingUp className="h-4 w-4 text-green-500 mr-1" />}
                                        {metric.trend === 'down' && <TrendingDown className="h-4 w-4 text-red-500 mr-1" />}
                                        {metric.trend === 'stable' && <Minus className="h-4 w-4 text-gray-500 mr-1" />}
                                        <span className={`${metric.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            {metric.change >= 0 ? '+' : ''}{metric.change.toFixed(1)}%
                                        </span>
                                    </div>
                                </div>

                                <div className="mb-3">
                                    <div className="text-2xl font-bold text-gray-900">
                                        {formatValue(metric.currentValue, metric.unit)}
                                    </div>
                                    <div className="text-sm text-gray-600">
                                        Warning: {formatValue(metric.threshold.warning, metric.unit)} |
                                        Critical: {formatValue(metric.threshold.critical, metric.unit)}
                                    </div>
                                </div>

                                {/* Mini Chart */}
                                <div className="h-16 flex items-end space-x-1">
                                    {metric.history.slice(-20).map((point, index) => {
                                        const height = Math.max(4, (point.value / Math.max(...metric.history.map(p => p.value))) * 60);
                                        const pointColor = getMetricColor(point.status);

                                        return (
                                            <div
                                                key={index}
                                                className={`bg-${pointColor}-400 w-2 rounded-t`}
                                                style={{ height: `${height}%` }}
                                                title={`${formatValue(point.value, metric.unit)} at ${point.timestamp.toLocaleTimeString()}`}
                                            />
                                        );
                                    })}
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </div>

            {/* Alerts */}
            <div className="bg-white rounded-lg shadow-sm">
                <div className="p-6 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-gray-900">Recent Alerts</h2>
                        <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-2">
                                <Search className="h-4 w-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search alerts..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <select
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                                className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="all">All Categories</option>
                                <option value="system">System</option>
                                <option value="security">Security</option>
                                <option value="business">Business</option>
                                <option value="user">User</option>
                                <option value="performance">Performance</option>
                            </select>

                            <select
                                value={alertFilter}
                                onChange={(e) => setAlertFilter(e.target.value)}
                                className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="all">All Alerts</option>
                                <option value="unresolved">Unresolved</option>
                                <option value="unacknowledged">Unacknowledged</option>
                                <option value="critical">Critical</option>
                                <option value="warning">Warning</option>
                                <option value="info">Info</option>
                                <option value="success">Success</option>
                            </select>

                            <button
                                onClick={exportAlerts}
                                className="flex items-center px-3 py-1 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                            >
                                <Download className="h-4 w-4 mr-1" />
                                Export
                            </button>
                        </div>
                    </div>
                </div>

                <div className="max-h-96 overflow-y-auto">
                    <AnimatePresence>
                        {filteredAlerts.length === 0 ? (
                            <div className="p-8 text-center text-gray-500">
                                <Bell className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                                <p>No alerts match your current filters</p>
                            </div>
                        ) : (
                            filteredAlerts.map((alert) => {
                                const color = getAlertColor(alert.type);

                                return (
                                    <motion.div
                                        key={alert.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 20 }}
                                        className={`border-l-4 border-${color}-400 bg-${color}-50 p-4 border-b border-gray-200 ${alert.resolved ? 'opacity-60' : ''
                                            }`}
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-start space-x-3">
                                                <div className={`text-${color}-600 mt-0.5`}>
                                                    {getAlertIcon(alert.type)}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center space-x-2">
                                                        <h3 className="font-medium text-gray-900">{alert.title}</h3>
                                                        {alert.acknowledged && (
                                                            <span className="inline-block px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full">
                                                                Acknowledged
                                                            </span>
                                                        )}
                                                        {alert.resolved && (
                                                            <span className="inline-block px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded-full">
                                                                Resolved
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-sm text-gray-600 mt-1">{alert.message}</p>
                                                    <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                                                        <span>{alert.source}</span>
                                                        <span>{alert.timestamp.toLocaleString()}</span>
                                                        <span className="capitalize">{alert.category}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {!alert.resolved && (
                                                <div className="flex items-center space-x-2">
                                                    {!alert.acknowledged && (
                                                        <button
                                                            onClick={() => acknowledgeAlert(alert.id)}
                                                            className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
                                                        >
                                                            Acknowledge
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => resolveAlert(alert.id)}
                                                        className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors"
                                                    >
                                                        Resolve
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                );
                            })
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};
