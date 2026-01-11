import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatCard {
  label: string;
  value: string | number;
  change?: string;
  icon: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  color: 'blue' | 'green' | 'purple' | 'orange' | 'pink' | 'teal';
}

interface AdminStatsWidgetProps {
  stats: StatCard[];
  isLoading?: boolean;
}

const colorClasses: Record<string, string> = {
  blue: 'bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-200',
  green: 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800 text-green-700 dark:text-green-200',
  purple: 'bg-purple-50 dark:bg-purple-950 border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-200',
  orange: 'bg-orange-50 dark:bg-orange-950 border-orange-200 dark:border-orange-800 text-orange-700 dark:text-orange-200',
  pink: 'bg-pink-50 dark:bg-pink-950 border-pink-200 dark:border-pink-800 text-pink-700 dark:text-pink-200',
  teal: 'bg-teal-50 dark:bg-teal-950 border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-200',
};

const AdminStatsWidget: React.FC<AdminStatsWidgetProps> = ({ stats, isLoading = false }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
      {stats.map((stat, idx) => (
        <div
          key={idx}
          className={`border rounded-lg p-4 ${colorClasses[stat.color]} transition-all hover:shadow-md`}
        >
          {isLoading ? (
            <div className="space-y-3">
              <div className="h-8 bg-current opacity-20 rounded animate-pulse" />
              <div className="h-4 bg-current opacity-20 rounded w-2/3 animate-pulse" />
            </div>
          ) : (
            <>
              <div className="flex items-start justify-between mb-2">
                <span className="text-sm font-medium opacity-75">{stat.label}</span>
                <span className="text-lg">{stat.icon}</span>
              </div>

              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-bold">{stat.value}</span>
                {stat.change && (
                  <div className={`flex items-center gap-1 text-xs font-semibold ${
                    stat.trend === 'down' ? 'text-red-600 dark:text-red-400' :
                    stat.trend === 'up' ? 'text-green-600 dark:text-green-400' :
                    'text-gray-600 dark:text-gray-400'
                  }`}>
                    {stat.trend === 'up' && <TrendingUp className="h-3 w-3" />}
                    {stat.trend === 'down' && <TrendingDown className="h-3 w-3" />}
                    {stat.change}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      ))}
    </div>
  );
};

export default AdminStatsWidget;
