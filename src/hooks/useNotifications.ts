import { useEffect, useState } from 'react';

interface NotificationPermission {
  granted: boolean;
  denied: boolean;
  default: boolean;
}

export const useNotifications = () => {
  const [permission, setPermission] = useState<NotificationPermission>({
    granted: false,
    denied: false,
    default: true
  });

  useEffect(() => {
    if ('Notification' in window) {
      updatePermissionState();
    }
  }, []);

  const updatePermissionState = () => {
    const currentPermission = Notification.permission;
    setPermission({
      granted: currentPermission === 'granted',
      denied: currentPermission === 'denied',
      default: currentPermission === 'default'
    });
  };

  const requestPermission = async (): Promise<boolean> => {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission === 'denied') {
      return false;
    }

    const result = await Notification.requestPermission();
    updatePermissionState();
    return result === 'granted';
  };

  const showNotification = (title: string, options?: NotificationOptions) => {
    if (!permission.granted) {
      console.warn('Notification permission not granted');
      return null;
    }

    const notification = new Notification(title, {
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      requireInteraction: false,
      silent: false,
      ...options
    });

    // Auto close after 5 seconds
    setTimeout(() => {
      notification.close();
    }, 5000);

    return notification;
  };

  return {
    permission,
    requestPermission,
    showNotification,
    isSupported: 'Notification' in window
  };
};