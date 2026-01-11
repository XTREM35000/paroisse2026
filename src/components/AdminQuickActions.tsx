import React from 'react';
import { Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface QuickAction {
  icon: React.ReactNode;
  label: string;
  description: string;
  href: string;
  color: 'blue' | 'green' | 'purple' | 'orange' | 'pink' | 'teal' | 'red';
  badge?: number; // Pour afficher des compteurs
}

interface AdminQuickActionsProps {
  actions: QuickAction[];
}

const colorClasses: Record<string, string> = {
  blue: 'hover:bg-blue-100 dark:hover:bg-blue-900 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800',
  green: 'hover:bg-green-100 dark:hover:bg-green-900 text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800',
  purple: 'hover:bg-purple-100 dark:hover:bg-purple-900 text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950 border-purple-200 dark:border-purple-800',
  orange: 'hover:bg-orange-100 dark:hover:bg-orange-900 text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950 border-orange-200 dark:border-orange-800',
  pink: 'hover:bg-pink-100 dark:hover:bg-pink-900 text-pink-600 dark:text-pink-400 bg-pink-50 dark:bg-pink-950 border-pink-200 dark:border-pink-800',
  teal: 'hover:bg-teal-100 dark:hover:bg-teal-900 text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950 border-teal-200 dark:border-teal-800',
  red: 'hover:bg-red-100 dark:hover:bg-red-900 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800',
};

const AdminQuickActions: React.FC<AdminQuickActionsProps> = ({ actions }) => {
  const navigate = useNavigate();

  return (
    <div className="mb-8">
      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">Actions rapides</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {actions.map((action, idx) => (
          <button
            key={idx}
            onClick={() => navigate(action.href)}
            className={`flex flex-col items-center justify-center p-4 rounded-lg border transition-all hover:shadow-md active:scale-95 ${
              colorClasses[action.color]
            }`}
          >
            <div className="relative mb-2 text-2xl">
              {action.icon}
              {action.badge !== undefined && (
                <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white bg-destructive rounded-full">
                  {action.badge > 99 ? '99+' : action.badge}
                </span>
              )}
            </div>
            <span className="text-xs font-semibold text-center">{action.label}</span>
            <span className="text-xs opacity-60 text-center mt-1">{action.description}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default AdminQuickActions;
