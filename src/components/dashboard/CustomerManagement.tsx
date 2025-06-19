import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Filter, Edit, Trash2, Eye, Upload, DollarSign, CreditCard, TrendingUp, AlertTriangle, CheckCircle, Calendar, Receipt, Clock, PlayCircle, PauseCircle, X, Ban, RotateCcw } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { toast } from '../ui/toast';
import { format } from 'date-fns';

interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  project_type: string;
  request_date: string;
  advance_date?: string;
  deadline?: string;
  status: string;
  payment_status: string;
  payment_proof_url?: string;
  referral_source?: string;
  created_at: string;
  project_value: number;
  total_paid_amount: number;
  payment_terms?: string;
  payment_method_preference?: string;
  rejection_reason?: string;
  rejected_at?: string;
  rejected_by?: string;
}

interface PaymentHistory {
  id: string;
  payment_amount: number;
  payment_date: string;
  payment_method: string;
  transaction_reference?: string;
  notes?: string;
  receipt_url?: string;
}

interface PaymentSummary {
  project_value: number;
  total_paid: number;
  remaining_balance: number;
  payment_status: string;
  payment_progress: number;
  total_payments: number;
}

const CustomerManagement: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectingCustomer, setRejectingCustomer] = useState<Customer | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistory[]>([]);
  const [paymentSummary, setPaymentSummary] = useState<PaymentSummary | null>(null);
  
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    email: '',
    phone: '',
    project_type: '',
    request_date: new Date().toISOString().split('T')[0],
    advance_date: '',
    deadline: '',
    status: 'new',
    payment_status: 'not_started',
    referral_source: '',
    project_value: 0,
    payment_terms: '',
    payment_method_preference: ''
  });

  const [newPayment, setNewPayment] = useState({
    payment_amount: 0,
    payment_date: new Date().toISOString().split('T')[0],
    payment_method: '',
    transaction_reference: '',
    notes: ''
  });

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCustomers(data || []);
    } catch (error) {
      console.error('Error fetching customers:', error);
      toast.error('Failed to fetch customers');
    } finally {
      setLoading(false);
    }
  };

  const fetchPaymentDetails = async (customerId: string) => {
    try {
      const [summaryRes, historyRes] = await Promise.all([
        supabase.rpc('get_customer_payment_summary', { customer_uuid: customerId }),
        supabase.from('payment_history').select('*').eq('customer_id', customerId).order('payment_date', { ascending: false })
      ]);

      if (summaryRes.data && summaryRes.data.length > 0) {
        setPaymentSummary(summaryRes.data[0]);
      }
      
      setPaymentHistory(historyRes.data || []);
    } catch (error) {
      console.error('Error fetching payment details:', error);
      toast.error('Failed to fetch payment details');
    }
  };

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { error } = await supabase
        .from('customers')
        .insert([newCustomer]);

      if (error) throw error;
      
      toast.success('Customer added successfully');
      setShowAddModal(false);
      setNewCustomer({
        name: '',
        email: '',
        phone: '',
        project_type: '',
        request_date: new Date().toISOString().split('T')[0],
        advance_date: '',
        deadline: '',
        status: 'new',
        payment_status: 'not_started',
        referral_source: '',
        project_value: 0,
        payment_terms: '',
        payment_method_preference: ''
      });
      fetchCustomers();
    } catch (error) {
      console.error('Error adding customer:', error);
      toast.error('Failed to add customer');
    }
  };

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;
    
    try {
      const { error } = await supabase
        .from('payment_history')
        .insert([{
          customer_id: selectedCustomer.id,
          ...newPayment
        }]);

      if (error) throw error;
      
      toast.success('Payment recorded successfully');
      setShowPaymentModal(false);
      setNewPayment({
        payment_amount: 0,
        payment_date: new Date().toISOString().split('T')[0],
        payment_method: '',
        transaction_reference: '',
        notes: ''
      });
      
      // Refresh customer data and payment details
      fetchCustomers();
      if (selectedCustomer) {
        fetchPaymentDetails(selectedCustomer.id);
      }
    } catch (error) {
      console.error('Error adding payment:', error);
      toast.error('Failed to record payment');
    }
  };

  const handleEditCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCustomer) return;
    
    try {
      const { error } = await supabase
        .from('customers')
        .update(editingCustomer)
        .eq('id', editingCustomer.id);

      if (error) throw error;
      
      toast.success('Customer updated successfully');
      setEditingCustomer(null);
      fetchCustomers();
    } catch (error) {
      console.error('Error updating customer:', error);
      toast.error('Failed to update customer');
    }
  };

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.project_type.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || customer.status === statusFilter;
    const matchesPaymentStatus = paymentStatusFilter === 'all' || customer.payment_status === paymentStatusFilter;
    
    return matchesSearch && matchesStatus && matchesPaymentStatus;
  });

  const handleDeleteCustomer = async (id: string) => {
    if (!confirm('Are you sure you want to delete this customer?')) return;

    try {
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setCustomers(customers.filter(c => c.id !== id));
      toast.success('Customer deleted successfully');
    } catch (error) {
      console.error('Error deleting customer:', error);
      toast.error('Failed to delete customer');
    }
  };

  const handleStatusUpdate = async (id: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('customers')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;
      
      setCustomers(customers.map(c => 
        c.id === id ? { ...c, status: newStatus } : c
      ));
      toast.success('Status updated successfully');
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };

  const handleRejectCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingCustomer || !rejectionReason.trim()) return;

    try {
      const { error } = await supabase.rpc('reject_customer_with_reason', {
        customer_uuid: rejectingCustomer.id,
        reason: rejectionReason.trim(),
        rejected_by_user: 'Admin' // You can replace this with actual user info
      });

      if (error) throw error;

      toast.success('Customer rejected successfully');
      setShowRejectModal(false);
      setRejectingCustomer(null);
      setRejectionReason('');
      fetchCustomers();
    } catch (error) {
      console.error('Error rejecting customer:', error);
      toast.error('Failed to reject customer');
    }
  };

  const handleReactivateCustomer = async (customer: Customer) => {
    if (!confirm('Are you sure you want to reactivate this customer?')) return;

    try {
      const { error } = await supabase.rpc('reactivate_customer', {
        customer_uuid: customer.id
      });

      if (error) throw error;

      toast.success('Customer reactivated successfully');
      fetchCustomers();
    } catch (error) {
      console.error('Error reactivating customer:', error);
      toast.error('Failed to reactivate customer');
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'not_started': return 'bg-gray-100 text-gray-800';
      case 'partial_paid': return 'bg-yellow-100 text-yellow-800';
      case 'fully_paid': return 'bg-green-100 text-green-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusIcon = (status: string) => {
    switch (status) {
      case 'not_started': return <AlertTriangle className="w-4 h-4" />;
      case 'partial_paid': return <TrendingUp className="w-4 h-4" />;
      case 'fully_paid': return <CheckCircle className="w-4 h-4" />;
      case 'overdue': return <AlertTriangle className="w-4 h-4" />;
      default: return <DollarSign className="w-4 h-4" />;
    }
  };

  const getProjectStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'on_hold': return 'bg-red-100 text-red-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getProjectStatusIcon = (status: string) => {
    switch (status) {
      case 'new': return <Clock className="w-4 h-4" />;
      case 'in_progress': return <PlayCircle className="w-4 h-4" />;
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'on_hold': return <PauseCircle className="w-4 h-4" />;
      case 'rejected': return <Ban className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const calculateRemainingBalance = (customer: Customer) => {
    return customer.project_value - customer.total_paid_amount;
  };

  const calculatePaymentProgress = (customer: Customer) => {
    if (customer.project_value === 0) return 0;
    return (customer.total_paid_amount / customer.project_value) * 100;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Customer Management</h1>
          <p className="text-gray-600 mt-2">Manage customers with comprehensive payment tracking and rejection handling</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add Customer
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search customers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="new">New</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="on_hold">On Hold</option>
              <option value="rejected">Rejected</option>
            </select>
            <select
              value={paymentStatusFilter}
              onChange={(e) => setPaymentStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Payment Status</option>
              <option value="not_started">Not Started</option>
              <option value="partial_paid">Partial Paid</option>
              <option value="fully_paid">Fully Paid</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Project
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Project Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Project Value
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payment Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Balance Due
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Progress
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCustomers.map((customer) => {
                const remainingBalance = calculateRemainingBalance(customer);
                const paymentProgress = calculatePaymentProgress(customer);
                
                return (
                  <motion.tr
                    key={customer.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{customer.name}</div>
                        <div className="text-sm text-gray-500">{customer.email}</div>
                        {customer.phone && (
                          <div className="text-sm text-gray-500">{customer.phone}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{customer.project_type}</div>
                      {customer.referral_source && (
                        <div className="text-sm text-gray-500">via {customer.referral_source}</div>
                      )}
                      {customer.deadline && (
                        <div className="text-sm text-gray-500 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Due: {format(new Date(customer.deadline), 'MMM dd, yyyy')}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {customer.status === 'rejected' ? (
                        <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getProjectStatusColor(customer.status)}`}>
                          <Ban className="w-3 h-3" />
                          Rejected
                        </span>
                      ) : (
                        <select
                          value={customer.status}
                          onChange={(e) => handleStatusUpdate(customer.id, e.target.value)}
                          className={`px-2 py-1 rounded-full text-xs font-medium border-0 flex items-center gap-1 ${getProjectStatusColor(customer.status)}`}
                        >
                          <option value="new">New</option>
                          <option value="in_progress">In Progress</option>
                          <option value="completed">Completed</option>
                          <option value="on_hold">On Hold</option>
                        </select>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        ₹{customer.project_value.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-500">
                        Paid: ₹{customer.total_paid_amount.toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium gap-1 ${getPaymentStatusColor(customer.payment_status)}`}>
                        {getPaymentStatusIcon(customer.payment_status)}
                        {customer.payment_status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-sm font-medium ${remainingBalance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        ₹{remainingBalance.toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${Math.min(paymentProgress, 100)}%` }}
                        ></div>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">{paymentProgress.toFixed(1)}%</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => {
                            setSelectedCustomer(customer);
                            setShowDetailModal(true);
                            fetchPaymentDetails(customer.id);
                          }}
                          className="text-blue-600 hover:text-blue-900"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {customer.status !== 'rejected' && (
                          <>
                            <button 
                              onClick={() => setEditingCustomer(customer)}
                              className="text-gray-600 hover:text-gray-900"
                              title="Edit Customer"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => {
                                setSelectedCustomer(customer);
                                setShowPaymentModal(true);
                              }}
                              className="text-green-600 hover:text-green-900"
                              title="Add Payment"
                            >
                              <DollarSign className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => {
                                setRejectingCustomer(customer);
                                setShowRejectModal(true);
                              }}
                              className="text-red-600 hover:text-red-900"
                              title="Reject Customer"
                            >
                              <Ban className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        {customer.status === 'rejected' && (
                          <button 
                            onClick={() => handleReactivateCustomer(customer)}
                            className="text-green-600 hover:text-green-900"
                            title="Reactivate Customer"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                        )}
                        <button 
                          onClick={() => handleDeleteCustomer(customer.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete Customer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {filteredCustomers.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-500">No customers found matching your criteria.</div>
        </div>
      )}

      {/* Customer Detail Modal */}
      {showDetailModal && selectedCustomer && paymentSummary && (
        <CustomerDetailModal
          customer={selectedCustomer}
          paymentSummary={paymentSummary}
          paymentHistory={paymentHistory}
          onClose={() => setShowDetailModal(false)}
          onAddPayment={() => {
            setShowDetailModal(false);
            setShowPaymentModal(true);
          }}
          onStatusUpdate={handleStatusUpdate}
          onReject={() => {
            setRejectingCustomer(selectedCustomer);
            setShowDetailModal(false);
            setShowRejectModal(true);
          }}
          onReactivate={() => handleReactivateCustomer(selectedCustomer)}
        />
      )}

      {/* Add Payment Modal */}
      {showPaymentModal && selectedCustomer && (
        <AddPaymentModal
          customer={selectedCustomer}
          payment={newPayment}
          setPayment={setNewPayment}
          onSubmit={handleAddPayment}
          onClose={() => setShowPaymentModal(false)}
        />
      )}

      {/* Add Customer Modal */}
      {showAddModal && (
        <AddCustomerModal
          customer={newCustomer}
          setCustomer={setNewCustomer}
          onSubmit={handleAddCustomer}
          onClose={() => setShowAddModal(false)}
        />
      )}

      {/* Edit Customer Modal */}
      {editingCustomer && (
        <EditCustomerModal
          customer={editingCustomer}
          setCustomer={setEditingCustomer}
          onSubmit={handleEditCustomer}
          onClose={() => setEditingCustomer(null)}
        />
      )}

      {/* Reject Customer Modal */}
      {showRejectModal && rejectingCustomer && (
        <RejectCustomerModal
          customer={rejectingCustomer}
          rejectionReason={rejectionReason}
          setRejectionReason={setRejectionReason}
          onSubmit={handleRejectCustomer}
          onClose={() => {
            setShowRejectModal(false);
            setRejectingCustomer(null);
            setRejectionReason('');
          }}
        />
      )}
    </div>
  );
};

// Customer Detail Modal Component
const CustomerDetailModal: React.FC<{
  customer: Customer;
  paymentSummary: PaymentSummary;
  paymentHistory: PaymentHistory[];
  onClose: () => void;
  onAddPayment: () => void;
  onStatusUpdate: (id: string, status: string) => void;
  onReject: () => void;
  onReactivate: () => void;
}> = ({ customer, paymentSummary, paymentHistory, onClose, onAddPayment, onStatusUpdate, onReject, onReactivate }) => {
  const getProjectStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'on_hold': return 'bg-red-100 text-red-800 border-red-200';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getProjectStatusIcon = (status: string) => {
    switch (status) {
      case 'new': return <Clock className="w-5 h-5" />;
      case 'in_progress': return <PlayCircle className="w-5 h-5" />;
      case 'completed': return <CheckCircle className="w-5 h-5" />;
      case 'on_hold': return <PauseCircle className="w-5 h-5" />;
      case 'rejected': return <Ban className="w-5 h-5" />;
      default: return <Clock className="w-5 h-5" />;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl p-8 w-full max-w-6xl max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-gray-900">Customer Details</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Customer Information */}
          <div className="space-y-6">
            <div className="bg-gray-50 rounded-xl p-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Customer Information</h4>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-600">Name</label>
                  <p className="text-gray-900">{customer.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Email</label>
                  <p className="text-gray-900">{customer.email}</p>
                </div>
                {customer.phone && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Phone</label>
                    <p className="text-gray-900">{customer.phone}</p>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-gray-600">Project Type</label>
                  <p className="text-gray-900">{customer.project_type}</p>
                </div>
                {customer.deadline && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Deadline</label>
                    <p className="text-gray-900 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      {format(new Date(customer.deadline), 'MMMM dd, yyyy')}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Project Status Section */}
            <div className={`rounded-xl p-6 border ${getProjectStatusColor(customer.status)}`}>
              <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
                {getProjectStatusIcon(customer.status)}
                Project Status
              </h4>
              <div className="space-y-4">
                {customer.status !== 'rejected' ? (
                  <div>
                    <label className="text-sm font-medium mb-2 block">Current Status</label>
                    <select
                      value={customer.status}
                      onChange={(e) => onStatusUpdate(customer.id, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="new">New</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="on_hold">On Hold</option>
                    </select>
                  </div>
                ) : (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Ban className="w-5 h-5 text-red-600" />
                      <span className="font-medium text-red-900">Customer Rejected</span>
                    </div>
                    {customer.rejection_reason && (
                      <div className="mb-3">
                        <label className="text-sm font-medium text-red-600">Rejection Reason:</label>
                        <p className="text-red-800 mt-1">{customer.rejection_reason}</p>
                      </div>
                    )}
                    {customer.rejected_at && (
                      <div className="mb-3">
                        <label className="text-sm font-medium text-red-600">Rejected On:</label>
                        <p className="text-red-800">{format(new Date(customer.rejected_at), 'MMMM dd, yyyy \'at\' HH:mm')}</p>
                      </div>
                    )}
                    {customer.rejected_by && (
                      <div className="mb-4">
                        <label className="text-sm font-medium text-red-600">Rejected By:</label>
                        <p className="text-red-800">{customer.rejected_by}</p>
                      </div>
                    )}
                    <button
                      onClick={onReactivate}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Reactivate Customer
                    </button>
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Request Date</label>
                    <p className="text-gray-900">{format(new Date(customer.request_date), 'MMM dd, yyyy')}</p>
                  </div>
                  {customer.advance_date && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Advance Date</label>
                      <p className="text-gray-900">{format(new Date(customer.advance_date), 'MMM dd, yyyy')}</p>
                    </div>
                  )}
                </div>
                {customer.payment_terms && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Payment Terms</label>
                    <p className="text-gray-900">{customer.payment_terms}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Payment Overview */}
            <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
              <h4 className="text-lg font-semibold text-blue-900 mb-4 flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Payment Overview
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-blue-600">Project Value</label>
                  <p className="text-2xl font-bold text-blue-900">₹{paymentSummary.project_value.toLocaleString()}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-blue-600">Total Paid</label>
                  <p className="text-2xl font-bold text-green-600">₹{paymentSummary.total_paid.toLocaleString()}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-blue-600">Remaining Balance</label>
                  <p className={`text-2xl font-bold ${paymentSummary.remaining_balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    ₹{paymentSummary.remaining_balance.toLocaleString()}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-blue-600">Progress</label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-blue-200 rounded-full h-3">
                      <div
                        className="bg-blue-600 h-3 rounded-full"
                        style={{ width: `${Math.min(paymentSummary.payment_progress, 100)}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-blue-900">{paymentSummary.payment_progress.toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Payment History */}
          <div className="space-y-6">
            <div className="bg-gray-50 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold text-gray-900">Payment History</h4>
                {customer.status !== 'rejected' && (
                  <button
                    onClick={onAddPayment}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add Payment
                  </button>
                )}
              </div>
              
              {paymentHistory.length > 0 ? (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {paymentHistory.map((payment) => (
                    <div key={payment.id} className="bg-white rounded-lg p-4 border border-gray-200">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <CreditCard className="w-4 h-4 text-green-600" />
                          <span className="font-medium text-gray-900">
                            ₹{payment.payment_amount.toLocaleString()}
                          </span>
                        </div>
                        <span className="text-sm text-gray-500">
                          {format(new Date(payment.payment_date), 'MMM dd, yyyy')}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600">
                        <p>Method: {payment.payment_method}</p>
                        {payment.transaction_reference && (
                          <p>Ref: {payment.transaction_reference}</p>
                        )}
                        {payment.notes && (
                          <p className="mt-1 italic">{payment.notes}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Receipt className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                  <p>No payments recorded yet</p>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            {customer.status !== 'rejected' && (
              <div className="bg-gray-50 rounded-xl p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Customer Actions</h4>
                <div className="space-y-3">
                  <button
                    onClick={onReject}
                    className="w-full bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <Ban className="w-4 h-4" />
                    Reject Customer
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

// Reject Customer Modal Component
const RejectCustomerModal: React.FC<{
  customer: Customer;
  rejectionReason: string;
  setRejectionReason: (reason: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}> = ({ customer, rejectionReason, setRejectionReason, onSubmit, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl p-8 w-full max-w-md"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Ban className="w-6 h-6 text-red-600" />
            Reject Customer
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="mb-4 p-4 bg-red-50 rounded-lg border border-red-200">
          <p className="text-sm text-red-600">Customer: <span className="font-medium">{customer.name}</span></p>
          <p className="text-sm text-red-600">Email: {customer.email}</p>
          <p className="text-sm text-red-600">Project: {customer.project_type}</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rejection Reason *
            </label>
            <textarea
              rows={4}
              required
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              placeholder="Please provide a detailed reason for rejecting this customer..."
            />
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-sm text-yellow-800">
              <strong>Warning:</strong> Rejecting this customer will:
            </p>
            <ul className="text-sm text-yellow-700 mt-1 ml-4 list-disc">
              <li>Change the customer status to "Rejected"</li>
              <li>Cancel any pending commissions</li>
              <li>Prevent further status updates until reactivated</li>
            </ul>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
            >
              <Ban className="w-4 h-4" />
              Reject Customer
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

// Add Payment Modal Component
const AddPaymentModal: React.FC<{
  customer: Customer;
  payment: any;
  setPayment: (payment: any) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}> = ({ customer, payment, setPayment, onSubmit, onClose }) => {
  const remainingBalance = customer.project_value - customer.total_paid_amount;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl p-8 w-full max-w-md"
      >
        <h3 className="text-xl font-bold text-gray-900 mb-6">Record Payment</h3>
        
        <div className="mb-4 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-600">Customer: {customer.name}</p>
          <p className="text-sm text-blue-600">Remaining Balance: ₹{remainingBalance.toLocaleString()}</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Payment Amount *</label>
            <input
              type="number"
              step="0.01"
              min="0"
              max={remainingBalance}
              required
              value={payment.payment_amount}
              onChange={(e) => setPayment({...payment, payment_amount: parseFloat(e.target.value) || 0})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Payment Date *</label>
            <input
              type="date"
              required
              value={payment.payment_date}
              onChange={(e) => setPayment({...payment, payment_date: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method *</label>
            <select
              required
              value={payment.payment_method}
              onChange={(e) => setPayment({...payment, payment_method: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select payment method</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="UPI">UPI</option>
              <option value="Razorpay">Razorpay</option>
              <option value="Cash">Cash</option>
              <option value="Cheque">Cheque</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Transaction Reference</label>
            <input
              type="text"
              value={payment.transaction_reference}
              onChange={(e) => setPayment({...payment, transaction_reference: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Transaction ID, cheque number, etc."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
            <textarea
              rows={3}
              value={payment.notes}
              onChange={(e) => setPayment({...payment, notes: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Additional payment details..."
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              Record Payment
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

// Add Customer Modal Component
const AddCustomerModal: React.FC<{
  customer: any;
  setCustomer: (customer: any) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}> = ({ customer, setCustomer, onSubmit, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        <h3 className="text-xl font-bold text-gray-900 mb-6">Add New Customer</h3>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Name *</label>
              <input
                type="text"
                required
                value={customer.name}
                onChange={(e) => setCustomer({...customer, name: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
              <input
                type="email"
                required
                value={customer.email}
                onChange={(e) => setCustomer({...customer, email: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
              <input
                type="tel"
                value={customer.phone}
                onChange={(e) => setCustomer({...customer, phone: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Project Type *</label>
              <select
                required
                value={customer.project_type}
                onChange={(e) => setCustomer({...customer, project_type: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select project type</option>
                <option value="Business Website">Business Website</option>
                <option value="Landing Page">Landing Page</option>
                <option value="SaaS Product">SaaS Product</option>
                <option value="Custom Software">Custom Software</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Project Value *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={customer.project_value}
                onChange={(e) => setCustomer({...customer, project_value: parseFloat(e.target.value) || 0})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Payment Terms</label>
              <select
                value={customer.payment_terms}
                onChange={(e) => setCustomer({...customer, payment_terms: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select payment terms</option>
                <option value="Net 15">Net 15</option>
                <option value="Net 30">Net 30</option>
                <option value="50% upfront">50% upfront</option>
                <option value="100% upfront">100% upfront</option>
                <option value="Custom">Custom</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Deadline</label>
              <input
                type="date"
                value={customer.deadline}
                onChange={(e) => setCustomer({...customer, deadline: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method Preference</label>
              <select
                value={customer.payment_method_preference}
                onChange={(e) => setCustomer({...customer, payment_method_preference: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select preferred method</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="UPI">UPI</option>
                <option value="Razorpay">Razorpay</option>
                <option value="Cash">Cash</option>
                <option value="Cheque">Cheque</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Referral Source</label>
            <input
              type="text"
              value={customer.referral_source}
              onChange={(e) => setCustomer({...customer, referral_source: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="How did they find you?"
            />
          </div>
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Add Customer
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

// Edit Customer Modal Component
const EditCustomerModal: React.FC<{
  customer: Customer;
  setCustomer: (customer: Customer) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}> = ({ customer, setCustomer, onSubmit, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        <h3 className="text-xl font-bold text-gray-900 mb-6">Edit Customer</h3>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Name *</label>
              <input
                type="text"
                required
                value={customer.name}
                onChange={(e) => setCustomer({...customer, name: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
              <input
                type="email"
                required
                value={customer.email}
                onChange={(e) => setCustomer({...customer, email: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
              <input
                type="tel"
                value={customer.phone || ''}
                onChange={(e) => setCustomer({...customer, phone: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Project Type *</label>
              <select
                required
                value={customer.project_type}
                onChange={(e) => setCustomer({...customer, project_type: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="Business Website">Business Website</option>
                <option value="Landing Page">Landing Page</option>
                <option value="SaaS Product">SaaS Product</option>
                <option value="Custom Software">Custom Software</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Project Value *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={customer.project_value}
                onChange={(e) => setCustomer({...customer, project_value: parseFloat(e.target.value) || 0})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Project Status</label>
              <select
                value={customer.status}
                onChange={(e) => setCustomer({...customer, status: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="new">New</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="on_hold">On Hold</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Deadline</label>
              <input
                type="date"
                value={customer.deadline || ''}
                onChange={(e) => setCustomer({...customer, deadline: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Payment Terms</label>
              <select
                value={customer.payment_terms || ''}
                onChange={(e) => setCustomer({...customer, payment_terms: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select payment terms</option>
                <option value="Net 15">Net 15</option>
                <option value="Net 30">Net 30</option>
                <option value="50% upfront">50% upfront</option>
                <option value="100% upfront">100% upfront</option>
                <option value="Custom">Custom</option>
              </select>
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Update Customer
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default CustomerManagement;