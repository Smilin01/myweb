import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import DashboardLayout from '../components/dashboard/DashboardLayout';
import Overview from '../components/dashboard/Overview';
import CustomerManagement from '../components/dashboard/CustomerManagement';
import FormsManagement from '../components/dashboard/FormsManagement';
import ReferralManagement from '../components/dashboard/ReferralManagement';
import InvoiceGenerator from '../components/dashboard/InvoiceGenerator';
import Settings from '../components/dashboard/Settings';

const Dashboard: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <DashboardLayout>
      <Routes>
        <Route index element={<Overview />} />
        <Route path="customers" element={<CustomerManagement />} />
        <Route path="forms" element={<FormsManagement />} />
        <Route path="referrals" element={<ReferralManagement />} />
        <Route path="invoices" element={<InvoiceGenerator />} />
        <Route path="settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/app" replace />} />
      </Routes>
    </DashboardLayout>
  );
};

export default Dashboard;