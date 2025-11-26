
import React, { createContext, useContext, useState, useCallback } from 'react';
import { Notification, NotificationType } from '../types';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

interface NotificationContextType {
  notify: (type: NotificationType, message: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const notify = useCallback((type: NotificationType, message: string) => {
    const id = Math.random().toString(36).substr(2, 9);
    setNotifications((prev) => [...prev, { id, type, message }]);

    // Auto remove after 5 seconds
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 5000);
  }, []);

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <NotificationContext.Provider value={{ notify }}>
      {children}

      {/* Notification Toast Container */}
      <div className="fixed top-4 left-4 right-4 sm:left-auto sm:right-4 z-[100] space-y-3 sm:w-full sm:max-w-sm pointer-events-none">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`pointer-events-auto transform transition-all duration-300 ease-in-out translate-x-0 opacity-100 flex items-start p-4 rounded-xl shadow-lg border border-white/20 backdrop-blur-md text-white ${notification.type === 'success' ? 'bg-green-600/90' :
                notification.type === 'error' ? 'bg-red-600/90' :
                  notification.type === 'warning' ? 'bg-amber-500/90' :
                    'bg-blue-600/90'
              }`}
          >
            <div className="flex-shrink-0 mr-3">
              {notification.type === 'success' && <CheckCircle size={20} />}
              {notification.type === 'error' && <AlertCircle size={20} />}
              {notification.type === 'warning' && <AlertTriangle size={20} />}
              {notification.type === 'info' && <Info size={20} />}
            </div>
            <div className="flex-1 text-sm font-medium">{notification.message}</div>
            <button
              onClick={() => removeNotification(notification.id)}
              className="ml-4 flex-shrink-0 text-white/70 hover:text-white transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
};
