import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, DollarSign, Calendar, Wallet } from 'lucide-react';

interface InvestmentData {
    totalInvested: number;
    currentValue: number;
    totalReturns: number;
    monthlyReturn: number;
    annualizedReturn: number;
    nextPaymentDate: string | Date;
    nextPaymentAmount: number;
}

interface InvestmentOverviewProps {
    investmentData: InvestmentData;
    isSampleData: boolean;
}

export const InvestmentOverview: React.FC<InvestmentOverviewProps> = ({
    investmentData,
    isSampleData
}) => {
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(amount);
    };

    const formatDate = (date: string | Date) => {
        if (typeof date === 'string' && date === 'Pending Activation') {
            return date;
        }
        return new Date(date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-card rounded-lg p-6 border border-card-border"
            >
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-text-secondary text-sm font-medium">Total Invested</p>
                        <p className="text-2xl font-bold text-text-primary">
                            {formatCurrency(investmentData.totalInvested)}
                        </p>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-lg">
                        <DollarSign className="w-6 h-6 text-blue-600" />
                    </div>
                </div>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-card rounded-lg p-6 border border-card-border"
            >
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-text-secondary text-sm font-medium">Current Value</p>
                        <p className="text-2xl font-bold text-text-primary">
                            {formatCurrency(investmentData.currentValue)}
                        </p>
                    </div>
                    <div className="p-3 bg-green-50 rounded-lg">
                        <Wallet className="w-6 h-6 text-green-600" />
                    </div>
                </div>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-card rounded-lg p-6 border border-card-border"
            >
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-text-secondary text-sm font-medium">Total Returns</p>
                        <p className="text-2xl font-bold text-green-600">
                            {formatCurrency(investmentData.totalReturns)}
                        </p>
                        <p className="text-xs text-text-secondary">
                            {investmentData.annualizedReturn.toFixed(1)}% Annual Rate
                        </p>
                    </div>
                    <div className="p-3 bg-green-50 rounded-lg">
                        <TrendingUp className="w-6 h-6 text-green-600" />
                    </div>
                </div>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-card rounded-lg p-6 border border-card-border"
            >
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-text-secondary text-sm font-medium">Next Payment</p>
                        <p className="text-lg font-bold text-text-primary">
                            {investmentData.nextPaymentAmount > 0
                                ? formatCurrency(investmentData.nextPaymentAmount)
                                : 'Pending'
                            }
                        </p>
                        <p className="text-xs text-text-secondary">
                            {formatDate(investmentData.nextPaymentDate)}
                        </p>
                    </div>
                    <div className="p-3 bg-gold/10 rounded-lg">
                        <Calendar className="w-6 h-6 text-gold" />
                    </div>
                </div>
            </motion.div>

            {isSampleData && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="col-span-full bg-blue-50 border border-blue-200 rounded-lg p-4"
                >
                    <div className="flex items-center">
                        <div className="p-2 bg-blue-100 rounded-lg mr-3">
                            <TrendingUp className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-blue-800 font-medium text-sm">Sample Data Displayed</p>
                            <p className="text-blue-600 text-xs">
                                Start your investment journey to see real portfolio data here.
                            </p>
                        </div>
                    </div>
                </motion.div>
            )}
        </div>
    );
};
