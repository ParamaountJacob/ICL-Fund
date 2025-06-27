import React, { memo, useMemo } from 'react';
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

export const InvestmentOverview = memo<InvestmentOverviewProps>(({
    investmentData,
    isSampleData
}) => {
    // Memoize formatters to avoid recreation on every render
    const formatCurrency = useMemo(() => {
        const formatter = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        });
        return (amount: number) => formatter.format(amount);
    }, []);

    const formatDate = useMemo(() => {
        const formatter = new Intl.DateTimeFormat('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
        return (date: string | Date) => {
            if (typeof date === 'string' && date === 'Pending Activation') {
                return date;
            }
            return formatter.format(new Date(date));
        };
    }, []);

    // Memoize card data to avoid object recreation
    const cardData = useMemo(() => [
        {
            id: 'invested',
            title: 'Total Invested',
            value: formatCurrency(investmentData.totalInvested),
            icon: DollarSign,
            iconColor: 'text-blue-600',
            bgColor: 'bg-blue-50',
            delay: 0.1
        },
        {
            id: 'value',
            title: 'Current Value',
            value: formatCurrency(investmentData.currentValue),
            icon: Wallet,
            iconColor: 'text-green-600',
            bgColor: 'bg-green-50',
            delay: 0.2
        },
        {
            id: 'returns',
            title: 'Total Returns',
            value: formatCurrency(investmentData.totalReturns),
            subtitle: `${investmentData.annualizedReturn.toFixed(1)}% Annual Rate`,
            icon: TrendingUp,
            iconColor: 'text-green-600',
            bgColor: 'bg-green-50',
            valueColor: 'text-green-600',
            delay: 0.3
        },
        {
            id: 'payment',
            title: 'Next Payment',
            value: investmentData.nextPaymentAmount > 0
                ? formatCurrency(investmentData.nextPaymentAmount)
                : 'Pending',
            subtitle: formatDate(investmentData.nextPaymentDate),
            icon: Calendar,
            iconColor: 'text-gold',
            bgColor: 'bg-gold/10',
            delay: 0.4
        }
    ], [investmentData, formatCurrency, formatDate]);

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {cardData.map((card) => (
                <motion.div
                    key={card.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: card.delay }}
                    className="bg-card rounded-lg p-6 border border-card-border"
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-text-secondary text-sm font-medium">{card.title}</p>
                            <p className={`text-2xl font-bold ${card.valueColor || 'text-text-primary'}`}>
                                {card.value}
                            </p>
                            {card.subtitle && (
                                <p className="text-xs text-text-secondary">{card.subtitle}</p>
                            )}
                        </div>
                        <div className={`p-3 ${card.bgColor} rounded-lg`}>
                            <card.icon className={`w-6 h-6 ${card.iconColor}`} />
                        </div>
                    </div>
                </motion.div>
            ))}

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
});

InvestmentOverview.displayName = 'InvestmentOverview';
