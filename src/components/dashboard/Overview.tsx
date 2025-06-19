import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Users, DollarSign, TrendingUp, FileText, Calendar, Mail } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Title, 
  Tooltip, 
  Legend,
  ArcElement
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface Stats {
  totalCustomers: number;
  totalContacts: number;
  activeProjects: number;
  totalRevenue: number;
  recentContacts: any[];
  projectStatusData: any;
}

const Overview: React.FC = () => {
  const [stats, setStats] = useState<Stats>({
    totalCustomers: 0,
    totalContacts: 0,
    activeProjects: 0,
    totalRevenue: 0,
    recentContacts: [],
    projectStatusData: null
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [customersRes, contactsRes, paymentsRes] = await Promise.all([
        supabase.from('customers').select('*'),
        supabase.from('contacts').select('*').order('created_at', { ascending: false }).limit(5),
        supabase.from('payment_history').select('payment_amount')
      ]);

      const customers = customersRes.data || [];
      const contacts = contactsRes.data || [];
      const payments = paymentsRes.data || [];

      // Calculate total revenue from actual payments received
      const totalRevenue = payments.reduce((sum, payment) => sum + (payment.payment_amount || 0), 0);

      // Calculate active projects (customers with status 'new' or 'in_progress')
      const activeProjects = customers.filter(customer => 
        customer.status === 'new' || customer.status === 'in_progress'
      ).length;

      // Project status data for chart
      const statusCounts = customers.reduce((acc: any, customer) => {
        const status = customer.status || 'unknown';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {});

      const projectStatusData = {
        labels: Object.keys(statusCounts).map(status => {
          // Capitalize and format status labels
          return status.split('_').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
          ).join(' ');
        }),
        datasets: [{
          data: Object.values(statusCounts),
          backgroundColor: [
            '#3B82F6', // Blue for new
            '#10B981', // Green for completed
            '#F59E0B', // Yellow for in_progress
            '#EF4444'  // Red for on_hold
          ]
        }]
      };

      setStats({
        totalCustomers: customers.length,
        totalContacts: contacts.length,
        activeProjects,
        totalRevenue,
        recentContacts: contacts,
        projectStatusData
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      name: 'Total Customers',
      value: stats.totalCustomers,
      icon: Users,
      color: 'bg-blue-500',
      change: '+12%'
    },
    {
      name: 'New Contacts',
      value: stats.totalContacts,
      icon: Mail,
      color: 'bg-green-500',
      change: '+8%'
    },
    {
      name: 'Total Revenue',
      value: `₹${stats.totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      color: 'bg-yellow-500',
      change: '+15%'
    },
    {
      name: 'Active Projects',
      value: stats.activeProjects,
      icon: FileText,
      color: 'bg-purple-500',
      change: '+3%'
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard Overview</h1>
        <p className="text-gray-600 mt-2">Welcome back! Here's what's happening with your business.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                <p className="text-sm text-green-600 mt-1">{stat.change} from last month</p>
              </div>
              <div className={`${stat.color} p-3 rounded-lg`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Project Status Chart */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Project Status</h3>
          {stats.projectStatusData && (
            <div className="h-64 flex items-center justify-center">
              <Doughnut 
                data={stats.projectStatusData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'bottom'
                    }
                  }
                }}
              />
            </div>
          )}
        </motion.div>

        {/* Recent Contacts */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Contacts</h3>
          <div className="space-y-4">
            {stats.recentContacts.map((contact, index) => (
              <div key={contact.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{contact.name}</p>
                  <p className="text-sm text-gray-600">{contact.project_type}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">
                    {new Date(contact.created_at).toLocaleDateString()}
                  </p>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    contact.status === 'new' ? 'bg-blue-100 text-blue-800' : 
                    contact.status === 'contacted' ? 'bg-yellow-100 text-yellow-800' :
                    contact.status === 'converted' ? 'bg-green-100 text-green-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {contact.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
        className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
            <Users className="w-5 h-5 text-blue-600" />
            <span className="font-medium text-blue-900">Add Customer</span>
          </button>
          <button className="flex items-center gap-3 p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
            <FileText className="w-5 h-5 text-green-600" />
            <span className="font-medium text-green-900">Create Invoice</span>
          </button>
          <button className="flex items-center gap-3 p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors">
            <TrendingUp className="w-5 h-5 text-purple-600" />
            <span className="font-medium text-purple-900">View Analytics</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default Overview;