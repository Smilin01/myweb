import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, Mail, UserPlus, DollarSign, FileText, Check, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { toast } from './toast';
import { format } from 'date-fns';

interface Notification {
  id: string;
  type: 'form_submission' | 'referral_conversion' | 'payment_received' | 'invoice_created';
  title: string;
  message: string;
  data?: any;
  read: boolean;
  created_at: string;
}

const NotificationCenter: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    // Load existing notifications
    loadNotifications();

    // Set up real-time subscriptions
    setupRealtimeSubscriptions();

    return () => {
      // Cleanup subscriptions
      supabase.removeAllChannels();
    };
  }, []);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      // Load from localStorage (for demo purposes)
      const stored = localStorage.getItem('dashboard_notifications');
      if (stored) {
        const parsedNotifications = JSON.parse(stored);
        setNotifications(parsedNotifications);
        setUnreadCount(parsedNotifications.filter((n: Notification) => !n.read).length);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveNotifications = (newNotifications: Notification[]) => {
    localStorage.setItem('dashboard_notifications', JSON.stringify(newNotifications));
    setNotifications(newNotifications);
    setUnreadCount(newNotifications.filter(n => !n.read).length);
  };

  const setupRealtimeSubscriptions = () => {
    // Subscribe to contacts table for new form submissions
    const contactsChannel = supabase
      .channel('contacts_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'contacts'
        },
        (payload) => {
          handleNewFormSubmission(payload.new);
        }
      )
      .subscribe();

    // Subscribe to customers table for referral conversions
    const customersChannel = supabase
      .channel('customers_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'customers'
        },
        (payload) => {
          handleNewCustomer(payload.new);
        }
      )
      .subscribe();

    // Subscribe to payment_history table for new payments
    const paymentsChannel = supabase
      .channel('payments_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'payment_history'
        },
        (payload) => {
          handleNewPayment(payload.new);
        }
      )
      .subscribe();

    // Subscribe to invoices table for new invoices
    const invoicesChannel = supabase
      .channel('invoices_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'invoices'
        },
        (payload) => {
          handleNewInvoice(payload.new);
        }
      )
      .subscribe();
  };

  const handleNewFormSubmission = (contact: any) => {
    const notification: Notification = {
      id: `form_${contact.id}_${Date.now()}`,
      type: 'form_submission',
      title: 'New Form Submission',
      message: `${contact.name} submitted a ${contact.project_type} inquiry`,
      data: contact,
      read: false,
      created_at: new Date().toISOString()
    };

    addNotification(notification);
    showBrowserNotification(notification);
    toast.success('New form submission received!');
  };

  const handleNewCustomer = (customer: any) => {
    if (customer.referral_source) {
      const notification: Notification = {
        id: `referral_${customer.id}_${Date.now()}`,
        type: 'referral_conversion',
        title: 'Referral Conversion',
        message: `${customer.name} converted from referral: ${customer.referral_source}`,
        data: customer,
        read: false,
        created_at: new Date().toISOString()
      };

      addNotification(notification);
      showBrowserNotification(notification);
      toast.success('New referral conversion!');
    }
  };

  const handleNewPayment = async (payment: any) => {
    try {
      // Get customer details
      const { data: customer } = await supabase
        .from('customers')
        .select('name')
        .eq('id', payment.customer_id)
        .single();

      const notification: Notification = {
        id: `payment_${payment.id}_${Date.now()}`,
        type: 'payment_received',
        title: 'Payment Received',
        message: `$${payment.payment_amount} received from ${customer?.name || 'Unknown Customer'}`,
        data: { ...payment, customer_name: customer?.name },
        read: false,
        created_at: new Date().toISOString()
      };

      addNotification(notification);
      showBrowserNotification(notification);
      toast.success('New payment received!');
    } catch (error) {
      console.error('Error handling payment notification:', error);
    }
  };

  const handleNewInvoice = async (invoice: any) => {
    try {
      // Get customer details
      const { data: customer } = await supabase
        .from('customers')
        .select('name')
        .eq('id', invoice.customer_id)
        .single();

      const notification: Notification = {
        id: `invoice_${invoice.id}_${Date.now()}`,
        type: 'invoice_created',
        title: 'Invoice Created',
        message: `Invoice ${invoice.invoice_number} created for ${customer?.name || 'Unknown Customer'}`,
        data: { ...invoice, customer_name: customer?.name },
        read: false,
        created_at: new Date().toISOString()
      };

      addNotification(notification);
      showBrowserNotification(notification);
      toast.success('New invoice created!');
    } catch (error) {
      console.error('Error handling invoice notification:', error);
    }
  };

  const addNotification = (notification: Notification) => {
    const updatedNotifications = [notification, ...notifications].slice(0, 50); // Keep only last 50
    saveNotifications(updatedNotifications);
  };

  const showBrowserNotification = (notification: Notification) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      const browserNotification = new Notification(notification.title, {
        body: notification.message,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: notification.id,
        requireInteraction: false,
        silent: false
      });

      // Auto close after 5 seconds
      setTimeout(() => {
        browserNotification.close();
      }, 5000);

      // Handle click
      browserNotification.onclick = () => {
        window.focus();
        setIsOpen(true);
        markAsRead(notification.id);
        browserNotification.close();
      };
    }
  };

  const markAsRead = (notificationId: string) => {
    const updatedNotifications = notifications.map(n =>
      n.id === notificationId ? { ...n, read: true } : n
    );
    saveNotifications(updatedNotifications);
  };

  const markAllAsRead = () => {
    const updatedNotifications = notifications.map(n => ({ ...n, read: true }));
    saveNotifications(updatedNotifications);
  };

  const deleteNotification = (notificationId: string) => {
    const updatedNotifications = notifications.filter(n => n.id !== notificationId);
    saveNotifications(updatedNotifications);
  };

  const clearAllNotifications = () => {
    saveNotifications([]);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'form_submission': return <Mail className="w-5 h-5 text-blue-600" />;
      case 'referral_conversion': return <UserPlus className="w-5 h-5 text-purple-600" />;
      case 'payment_received': return <DollarSign className="w-5 h-5 text-green-600" />;
      case 'invoice_created': return <FileText className="w-5 h-5 text-orange-600" />;
      default: return <Bell className="w-5 h-5 text-gray-600" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'form_submission': return 'border-l-blue-500 bg-blue-50';
      case 'referral_conversion': return 'border-l-purple-500 bg-purple-50';
      case 'payment_received': return 'border-l-green-500 bg-green-50';
      case 'invoice_created': return 'border-l-orange-500 bg-orange-50';
      default: return 'border-l-gray-500 bg-gray-50';
    }
  };

  return (
    <>
      {/* Notification Bell */}
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="relative p-2 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-full"
        >
          <Bell className="w-6 h-6" />
          {unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </motion.span>
          )}
        </button>

        {/* Notification Dropdown */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ duration: 0.2 }}
              className="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-lg border border-gray-200 z-50 max-h-96 overflow-hidden"
            >
              {/* Header */}
              <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-sm text-blue-600 hover:text-blue-700"
                    >
                      Mark all read
                    </button>
                  )}
                  <button
                    onClick={() => setIsOpen(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Notifications List */}
              <div className="max-h-80 overflow-y-auto">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Bell className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    <p>No notifications yet</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {notifications.map((notification) => (
                      <motion.div
                        key={notification.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={`p-4 hover:bg-gray-50 cursor-pointer border-l-4 ${getNotificationColor(notification.type)} ${
                          !notification.read ? 'bg-blue-50' : ''
                        }`}
                        onClick={() => markAsRead(notification.id)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-3 flex-1">
                            <div className="flex-shrink-0 mt-1">
                              {getNotificationIcon(notification.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <p className={`text-sm font-medium ${!notification.read ? 'text-gray-900' : 'text-gray-700'}`}>
                                  {notification.title}
                                </p>
                                {!notification.read && (
                                  <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0"></div>
                                )}
                              </div>
                              <p className="text-sm text-gray-600 mt-1">
                                {notification.message}
                              </p>
                              <p className="text-xs text-gray-500 mt-2">
                                {format(new Date(notification.created_at), 'MMM dd, yyyy HH:mm')}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 ml-2">
                            {!notification.read && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  markAsRead(notification.id);
                                }}
                                className="text-blue-600 hover:text-blue-700 p-1"
                                title="Mark as read"
                              >
                                <Check className="w-3 h-3" />
                              </button>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteNotification(notification.id);
                              }}
                              className="text-red-600 hover:text-red-700 p-1"
                              title="Delete notification"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              {notifications.length > 0 && (
                <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
                  <button
                    onClick={clearAllNotifications}
                    className="text-sm text-red-600 hover:text-red-700 w-full text-center"
                  >
                    Clear All Notifications
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};

export default NotificationCenter;