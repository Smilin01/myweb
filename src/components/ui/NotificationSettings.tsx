import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bell, BellOff, Check, X } from 'lucide-react';
import { useNotifications } from '../../hooks/useNotifications';
import { toast } from './toast';

interface NotificationPreferences {
  formSubmissions: boolean;
  referralConversions: boolean;
  paymentUpdates: boolean;
  invoiceCreated: boolean;
  browserNotifications: boolean;
  soundEnabled: boolean;
}

const NotificationSettings: React.FC = () => {
  const { permission, requestPermission, isSupported } = useNotifications();
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    formSubmissions: true,
    referralConversions: true,
    paymentUpdates: true,
    invoiceCreated: true,
    browserNotifications: true,
    soundEnabled: true
  });

  useEffect(() => {
    // Load preferences from localStorage
    const stored = localStorage.getItem('notification_preferences');
    if (stored) {
      try {
        setPreferences(JSON.parse(stored));
      } catch (error) {
        console.error('Error loading notification preferences:', error);
      }
    }
  }, []);

  const savePreferences = (newPreferences: NotificationPreferences) => {
    setPreferences(newPreferences);
    localStorage.setItem('notification_preferences', JSON.stringify(newPreferences));
    toast.success('Notification preferences saved');
  };

  const handleToggle = (key: keyof NotificationPreferences) => {
    const newPreferences = { ...preferences, [key]: !preferences[key] };
    savePreferences(newPreferences);
  };

  const handleBrowserNotificationToggle = async () => {
    if (!preferences.browserNotifications) {
      // Enabling browser notifications
      const granted = await requestPermission();
      if (granted) {
        const newPreferences = { ...preferences, browserNotifications: true };
        savePreferences(newPreferences);
        toast.success('Browser notifications enabled');
      } else {
        toast.error('Browser notification permission denied');
      }
    } else {
      // Disabling browser notifications
      const newPreferences = { ...preferences, browserNotifications: false };
      savePreferences(newPreferences);
      toast.success('Browser notifications disabled');
    }
  };

  const testNotification = () => {
    if (permission.granted && preferences.browserNotifications) {
      new Notification('Test Notification', {
        body: 'This is a test notification from your dashboard',
        icon: '/favicon.ico',
        tag: 'test-notification'
      });
      toast.success('Test notification sent');
    } else {
      toast.error('Browser notifications are not enabled');
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Bell className="w-5 h-5" />
          Notification Settings
        </h3>

        {/* Browser Notification Permission */}
        <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-blue-900">Browser Notifications</h4>
              <p className="text-sm text-blue-700 mt-1">
                {!isSupported ? 'Browser notifications are not supported' :
                 permission.granted ? 'Browser notifications are enabled' :
                 permission.denied ? 'Browser notifications are blocked' :
                 'Click to enable browser notifications'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {isSupported && (
                <button
                  onClick={testNotification}
                  disabled={!permission.granted || !preferences.browserNotifications}
                  className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Test
                </button>
              )}
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.browserNotifications && permission.granted}
                  onChange={handleBrowserNotificationToggle}
                  disabled={!isSupported || permission.denied}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Notification Types */}
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900">Notification Types</h4>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <h5 className="font-medium text-gray-900">New Form Submissions</h5>
                <p className="text-sm text-gray-600">Get notified when someone submits the contact form</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.formSubmissions}
                  onChange={() => handleToggle('formSubmissions')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <h5 className="font-medium text-gray-900">Referral Conversions</h5>
                <p className="text-sm text-gray-600">Get notified when referrals convert to customers</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.referralConversions}
                  onChange={() => handleToggle('referralConversions')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <h5 className="font-medium text-gray-900">Payment Updates</h5>
                <p className="text-sm text-gray-600">Get notified about payment status changes</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.paymentUpdates}
                  onChange={() => handleToggle('paymentUpdates')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <h5 className="font-medium text-gray-900">Invoice Created</h5>
                <p className="text-sm text-gray-600">Get notified when new invoices are created</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.invoiceCreated}
                  onChange={() => handleToggle('invoiceCreated')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <h5 className="font-medium text-gray-900">Sound Notifications</h5>
                <p className="text-sm text-gray-600">Play sound when notifications arrive</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.soundEnabled}
                  onChange={() => handleToggle('soundEnabled')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Permission Status */}
        {isSupported && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Permission Status</h4>
            <div className="flex items-center gap-2">
              {permission.granted ? (
                <>
                  <Check className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-green-600">Notifications enabled</span>
                </>
              ) : permission.denied ? (
                <>
                  <X className="w-4 h-4 text-red-600" />
                  <span className="text-sm text-red-600">Notifications blocked</span>
                </>
              ) : (
                <>
                  <BellOff className="w-4 h-4 text-yellow-600" />
                  <span className="text-sm text-yellow-600">Permission not granted</span>
                </>
              )}
            </div>
            {permission.denied && (
              <p className="text-xs text-gray-600 mt-1">
                To enable notifications, please allow them in your browser settings and refresh the page.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationSettings;