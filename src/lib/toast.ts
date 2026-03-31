import { toast } from 'react-hot-toast';

export const showToast = {
  success: (message: string, options?: Parameters<typeof toast.success>[1]) => {
    toast.success(message, {
      duration: 3000,
      position: 'top-right',
      style: {
        background: '#10b981',
        color: '#fff',
        padding: '12px 20px',
        borderRadius: '12px',
        fontWeight: '500',
      },
      icon: '✅',
      ...options,
    });
  },

  error: (message: string, options?: Parameters<typeof toast.error>[1]) => {
    toast.error(message, {
      duration: 4000,
      position: 'top-right',
      style: {
        background: '#ef4444',
        color: '#fff',
        padding: '12px 20px',
        borderRadius: '12px',
        fontWeight: '500',
      },
      icon: '❌',
      ...options,
    });
  },

  warning: (message: string, options?: Parameters<typeof toast>[1]) => {
    toast(message, {
      duration: 4000,
      position: 'top-right',
      icon: '⚠️',
      style: {
        background: '#f59e0b',
        color: '#fff',
        padding: '12px 20px',
        borderRadius: '12px',
        fontWeight: '500',
      },
      ...options,
    });
  },

  info: (message: string, options?: Parameters<typeof toast>[1]) => {
    toast(message, {
      duration: 3000,
      position: 'top-right',
      icon: 'ℹ️',
      style: {
        background: '#3b82f6',
        color: '#fff',
        padding: '12px 20px',
        borderRadius: '12px',
        fontWeight: '500',
      },
      ...options,
    });
  },

  loading: (message: string, options?: Parameters<typeof toast.loading>[1]) => {
    return toast.loading(message, {
      position: 'top-right',
      style: {
        background: '#6b7280',
        color: '#fff',
        padding: '12px 20px',
        borderRadius: '12px',
        fontWeight: '500',
      },
      ...options,
    });
  },

  dismiss: (toastId?: string) => {
    if (toastId) {
      toast.dismiss(toastId);
    } else {
      toast.dismiss();
    }
  },
};
