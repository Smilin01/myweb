import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Copy, ExternalLink, TrendingUp, Users, DollarSign, Edit, Trash2, Star, CreditCard, Calendar, Eye, CheckCircle, Clock, AlertCircle, Save, X, Percent, Calculator, Target, Settings } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { toast } from '../ui/toast';
import { format } from 'date-fns';

interface Influencer {
  id: string;
  name: string;
  social_handles: string;
  contact_info: string;
  referral_code: string;
  total_referrals: number;
  commission_rate: number;
  commission_type: 'percentage' | 'fixed';
  fixed_rate: number;
  commission_calculation_method: 'project_value' | 'payments_received' | 'first_payment';
  commission_trigger: 'signup' | 'first_payment' | 'project_completion';
  commission_cap?: number;
  commission_minimum?: number;
  created_at: string;
}

interface CommissionTracking {
  commission_id: string;
  customer_id: string;
  customer_name: string;
  customer_email: string;
  project_type: string;
  project_value: number;
  commission_rate: number;
  commission_amount: number;
  commission_status: string;
  commission_method_used: string;
  calculation_details: any;
  earned_date: string;
  paid_date?: string;
}

interface CommissionPayment {
  id: string;
  payment_amount: number;
  payment_date: string;
  payment_method: string;
  transaction_reference?: string;
  notes?: string;
}

interface ReferrerSummary {
  total_referrals: number;
  active_projects: number;
  total_commission_earned: number;
  unpaid_commission: number;
  average_project_value: number;
  conversion_rate: number;
}

interface ReferralMetrics {
  total_influencers: number;
  total_referrals: number;
  total_pending_commissions: number;
  total_paid_commissions: number;
}

interface CommissionOverride {
  id?: string;
  influencer_id: string;
  customer_id?: string;
  referral_code?: string;
  commission_type: 'percentage' | 'fixed';
  commission_rate?: number;
  fixed_rate?: number;
  commission_calculation_method: string;
  commission_trigger: string;
  commission_cap?: number;
  commission_minimum?: number;
  description: string;
  valid_from?: string;
  valid_until?: string;
}

const ReferralManagement: React.FC = () => {
  const [influencers, setInfluencers] = useState<Influencer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingInfluencer, setEditingInfluencer] = useState<Influencer | null>(null);
  const [selectedInfluencer, setSelectedInfluencer] = useState<Influencer | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showCommissionModal, setShowCommissionModal] = useState(false);
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [commissionData, setCommissionData] = useState<CommissionTracking[]>([]);
  const [commissionPayments, setCommissionPayments] = useState<CommissionPayment[]>([]);
  const [referrerSummary, setReferrerSummary] = useState<ReferrerSummary | null>(null);
  const [selectedCommissions, setSelectedCommissions] = useState<string[]>([]);
  const [referralMetrics, setReferralMetrics] = useState<ReferralMetrics>({
    total_influencers: 0,
    total_referrals: 0,
    total_pending_commissions: 0,
    total_paid_commissions: 0
  });
  
  // Editing referral code states
  const [editingReferralCode, setEditingReferralCode] = useState<string | null>(null);
  const [tempReferralCode, setTempReferralCode] = useState('');
  
  const [newInfluencer, setNewInfluencer] = useState({
    name: '',
    social_handles: '',
    contact_info: '',
    commission_type: 'percentage' as 'percentage' | 'fixed',
    commission_rate: 10,
    fixed_rate: 100,
    commission_calculation_method: 'payments_received',
    commission_trigger: 'first_payment',
    commission_cap: undefined as number | undefined,
    commission_minimum: undefined as number | undefined
  });

  const [newCommissionPayment, setNewCommissionPayment] = useState({
    payment_amount: 0,
    payment_method: '',
    transaction_reference: '',
    notes: ''
  });

  const [newOverride, setNewOverride] = useState<CommissionOverride>({
    influencer_id: '',
    commission_type: 'percentage',
    commission_rate: 10,
    fixed_rate: 100,
    commission_calculation_method: 'payments_received',
    commission_trigger: 'first_payment',
    description: ''
  });

  useEffect(() => {
    fetchInfluencers();
    fetchReferralMetrics();
  }, []);

  const fetchInfluencers = async () => {
    try {
      const { data, error } = await supabase
        .from('influencers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInfluencers(data || []);
    } catch (error) {
      console.error('Error fetching influencers:', error);
      toast.error('Failed to fetch influencers');
    } finally {
      setLoading(false);
    }
  };

  const fetchReferralMetrics = async () => {
    try {
      // First sync commission data to ensure accuracy
      await supabase.rpc('sync_commission_data');
      
      // Then fetch the metrics
      const { data, error } = await supabase.rpc('get_referral_metrics');
      
      if (error) {
        console.error('Error fetching referral metrics:', error);
        // Set default values if function fails
        setReferralMetrics({
          total_influencers: influencers.length,
          total_referrals: 0,
          total_pending_commissions: 0,
          total_paid_commissions: 0
        });
        return;
      }
      
      if (data && data.length > 0) {
        setReferralMetrics({
          total_influencers: Number(data[0].total_influencers) || 0,
          total_referrals: Number(data[0].total_referrals) || 0,
          total_pending_commissions: Number(data[0].total_pending_commissions) || 0,
          total_paid_commissions: Number(data[0].total_paid_commissions) || 0
        });
      } else {
        // Fallback to manual calculation
        const [influencersRes, commissionsRes] = await Promise.all([
          supabase.from('influencers').select('id'),
          supabase.from('commission_tracking').select('commission_amount, commission_status')
        ]);

        const totalInfluencers = influencersRes.data?.length || 0;
        const commissions = commissionsRes.data || [];
        const totalReferrals = commissions.length;
        const totalPending = commissions
          .filter(c => c.commission_status === 'pending')
          .reduce((sum, c) => sum + (Number(c.commission_amount) || 0), 0);
        const totalPaid = commissions
          .filter(c => c.commission_status === 'paid')
          .reduce((sum, c) => sum + (Number(c.commission_amount) || 0), 0);

        setReferralMetrics({
          total_influencers: totalInfluencers,
          total_referrals: totalReferrals,
          total_pending_commissions: totalPending,
          total_paid_commissions: totalPaid
        });
      }
    } catch (error) {
      console.error('Error fetching referral metrics:', error);
      // Set safe defaults
      setReferralMetrics({
        total_influencers: influencers.length,
        total_referrals: 0,
        total_pending_commissions: 0,
        total_paid_commissions: 0
      });
    }
  };

  const fetchReferrerDetails = async (influencerId: string) => {
    try {
      const [summaryRes, commissionsRes, paymentsRes] = await Promise.all([
        supabase.rpc('get_referrer_commission_summary', { referrer_uuid: influencerId }),
        supabase.rpc('get_referrer_commissions_with_customers', { referrer_uuid: influencerId }),
        supabase
          .from('commission_payment_history')
          .select('*')
          .eq('referrer_id', influencerId)
          .order('payment_date', { ascending: false })
      ]);

      if (summaryRes.data && summaryRes.data.length > 0) {
        const summary = summaryRes.data[0];
        setReferrerSummary({
          total_referrals: Number(summary.total_referrals) || 0,
          active_projects: Number(summary.active_projects) || 0,
          total_commission_earned: Number(summary.total_commission_earned) || 0,
          unpaid_commission: Number(summary.unpaid_commission) || 0,
          average_project_value: Number(summary.average_project_value) || 0,
          conversion_rate: Number(summary.conversion_rate) || 0
        });
      } else {
        // Set default values if no data
        setReferrerSummary({
          total_referrals: 0,
          active_projects: 0,
          total_commission_earned: 0,
          unpaid_commission: 0,
          average_project_value: 0,
          conversion_rate: 0
        });
      }

      setCommissionData(commissionsRes.data || []);
      setCommissionPayments(paymentsRes.data || []);
    } catch (error) {
      console.error('Error fetching referrer details:', error);
      toast.error('Failed to fetch referrer details');
      // Set default values on error
      setReferrerSummary({
        total_referrals: 0,
        active_projects: 0,
        total_commission_earned: 0,
        unpaid_commission: 0,
        average_project_value: 0,
        conversion_rate: 0
      });
      setCommissionData([]);
      setCommissionPayments([]);
    }
  };

  const generateReferralCode = (name: string): string => {
    const cleanName = name.replace(/\s+/g, '').toUpperCase();
    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${cleanName.substring(0, 4)}${randomSuffix}`;
  };

  const handleAddInfluencer = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const referralCode = generateReferralCode(newInfluencer.name);
      
      const { error } = await supabase
        .from('influencers')
        .insert([{
          ...newInfluencer,
          referral_code: referralCode,
          total_referrals: 0
        }]);

      if (error) throw error;
      
      toast.success('Influencer added successfully');
      setShowAddModal(false);
      setNewInfluencer({
        name: '',
        social_handles: '',
        contact_info: '',
        commission_type: 'percentage',
        commission_rate: 10,
        fixed_rate: 100,
        commission_calculation_method: 'payments_received',
        commission_trigger: 'first_payment',
        commission_cap: undefined,
        commission_minimum: undefined
      });
      fetchInfluencers();
      fetchReferralMetrics();
    } catch (error) {
      console.error('Error adding influencer:', error);
      toast.error('Failed to add influencer');
    }
  };

  const handleEditInfluencer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingInfluencer) return;
    
    try {
      const { error } = await supabase
        .from('influencers')
        .update({
          name: editingInfluencer.name,
          social_handles: editingInfluencer.social_handles,
          contact_info: editingInfluencer.contact_info,
          commission_type: editingInfluencer.commission_type,
          commission_rate: editingInfluencer.commission_rate,
          fixed_rate: editingInfluencer.fixed_rate,
          commission_calculation_method: editingInfluencer.commission_calculation_method,
          commission_trigger: editingInfluencer.commission_trigger,
          commission_cap: editingInfluencer.commission_cap,
          commission_minimum: editingInfluencer.commission_minimum
        })
        .eq('id', editingInfluencer.id);

      if (error) throw error;
      
      toast.success('Influencer updated successfully');
      setEditingInfluencer(null);
      fetchInfluencers();
    } catch (error) {
      console.error('Error updating influencer:', error);
      toast.error('Failed to update influencer');
    }
  };

  const handleDeleteInfluencer = async (id: string) => {
    if (!confirm('Are you sure you want to delete this influencer?')) return;

    try {
      const { error } = await supabase
        .from('influencers')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setInfluencers(influencers.filter(i => i.id !== id));
      toast.success('Influencer deleted successfully');
      fetchReferralMetrics();
    } catch (error) {
      console.error('Error deleting influencer:', error);
      toast.error('Failed to delete influencer');
    }
  };

  const handlePayCommissions = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInfluencer || selectedCommissions.length === 0) return;

    try {
      const { error } = await supabase.rpc('pay_commissions', {
        referrer_uuid: selectedInfluencer.id,
        commission_ids_to_pay: selectedCommissions,
        payment_amount: newCommissionPayment.payment_amount,
        payment_method: newCommissionPayment.payment_method,
        transaction_ref: newCommissionPayment.transaction_reference || null,
        payment_notes: newCommissionPayment.notes || null
      });

      if (error) throw error;

      toast.success('Commission payment recorded successfully');
      setShowCommissionModal(false);
      setSelectedCommissions([]);
      setNewCommissionPayment({
        payment_amount: 0,
        payment_method: '',
        transaction_reference: '',
        notes: ''
      });

      // Refresh data
      if (selectedInfluencer) {
        fetchReferrerDetails(selectedInfluencer.id);
      }
      fetchReferralMetrics();
    } catch (error) {
      console.error('Error paying commissions:', error);
      toast.error('Failed to record commission payment');
    }
  };

  const handleCreateOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { error } = await supabase
        .from('commission_overrides')
        .insert([newOverride]);

      if (error) throw error;
      
      toast.success('Commission override created successfully');
      setShowOverrideModal(false);
      setNewOverride({
        influencer_id: '',
        commission_type: 'percentage',
        commission_rate: 10,
        fixed_rate: 100,
        commission_calculation_method: 'payments_received',
        commission_trigger: 'first_payment',
        description: ''
      });
    } catch (error) {
      console.error('Error creating override:', error);
      toast.error('Failed to create commission override');
    }
  };

  const handleEditReferralCode = (influencerId: string, currentCode: string) => {
    setEditingReferralCode(influencerId);
    setTempReferralCode(currentCode);
  };

  const handleSaveReferralCode = async (influencerId: string) => {
    if (!tempReferralCode.trim()) {
      toast.error('Referral code cannot be empty');
      return;
    }

    // Check if the new code already exists
    const existingInfluencer = influencers.find(inf => 
      inf.referral_code.toLowerCase() === tempReferralCode.toLowerCase() && inf.id !== influencerId
    );

    if (existingInfluencer) {
      toast.error('This referral code is already in use');
      return;
    }

    try {
      const { error } = await supabase
        .from('influencers')
        .update({ referral_code: tempReferralCode.toUpperCase() })
        .eq('id', influencerId);

      if (error) throw error;

      // Update local state
      setInfluencers(prev => prev.map(inf => 
        inf.id === influencerId 
          ? { ...inf, referral_code: tempReferralCode.toUpperCase() }
          : inf
      ));

      setEditingReferralCode(null);
      setTempReferralCode('');
      toast.success('Referral code updated successfully! The new code is now live for form submissions.');
    } catch (error) {
      console.error('Error updating referral code:', error);
      toast.error('Failed to update referral code');
    }
  };

  const handleCancelEditReferralCode = () => {
    setEditingReferralCode(null);
    setTempReferralCode('');
  };

  const copyReferralLink = (code: string) => {
    const link = `${window.location.origin}/ref/${code}`;
    navigator.clipboard.writeText(link);
    toast.success('Referral link copied to clipboard!');
  };

  const generateFormLink = (code?: string) => {
    const baseLink = `${window.location.origin}`;
    const link = code ? `${baseLink}/ref/${code}` : baseLink;
    navigator.clipboard.writeText(link);
    toast.success('Form link copied to clipboard!');
  };

  const getCommissionStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'paid': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCommissionStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'paid': return <CheckCircle className="w-4 h-4" />;
      case 'cancelled': return <AlertCircle className="w-4 h-4" />;
      default: return <DollarSign className="w-4 h-4" />;
    }
  };

  const getCommissionTypeIcon = (type: string) => {
    switch (type) {
      case 'percentage': return <Percent className="w-4 h-4" />;
      case 'fixed': return <DollarSign className="w-4 h-4" />;
      default: return <Calculator className="w-4 h-4" />;
    }
  };

  const getCommissionTypeColor = (type: string) => {
    switch (type) {
      case 'percentage': return 'bg-blue-100 text-blue-800';
      case 'fixed': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCommissionDisplay = (influencer: Influencer) => {
    if (influencer.commission_type === 'fixed') {
      return `$${influencer.fixed_rate} per referral`;
    } else {
      let display = `${influencer.commission_rate}%`;
      if (influencer.commission_calculation_method === 'project_value') {
        display += ' of project value';
      } else if (influencer.commission_calculation_method === 'payments_received') {
        display += ' of payments';
      } else if (influencer.commission_calculation_method === 'first_payment') {
        display += ' of first payment';
      }
      
      if (influencer.commission_cap) {
        display += ` (max $${influencer.commission_cap})`;
      }
      if (influencer.commission_minimum) {
        display += ` (min $${influencer.commission_minimum})`;
      }
      
      return display;
    }
  };

  const calculateSelectedCommissionTotal = () => {
    return commissionData
      .filter(commission => selectedCommissions.includes(commission.commission_id) && commission.commission_status === 'pending')
      .reduce((total, commission) => total + commission.commission_amount, 0);
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
          <h1 className="text-3xl font-bold text-gray-900">Referral Management</h1>
          <p className="text-gray-600 mt-2">Manage influencers with flexible commission structures and advanced tracking</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowOverrideModal(true)}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
          >
            <Settings className="w-5 h-5" />
            Commission Override
          </button>
          <button
            onClick={() => generateFormLink()}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            <ExternalLink className="w-5 h-5" />
            Generate Form Link
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add Influencer
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Influencers</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{referralMetrics.total_influencers}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Referrals</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{referralMetrics.total_referrals}</p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending Commissions</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                ${referralMetrics.total_pending_commissions.toLocaleString()}
              </p>
            </div>
            <div className="bg-yellow-100 p-3 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Paid Commissions</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                ${referralMetrics.total_paid_commissions.toLocaleString()}
              </p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Influencers List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Influencers</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {influencers.map((influencer) => (
            <motion.div
              key={influencer.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-6 hover:bg-gray-50"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="text-lg font-medium text-gray-900">{influencer.name}</h4>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium gap-1 ${getCommissionTypeColor(influencer.commission_type)}`}>
                      {getCommissionTypeIcon(influencer.commission_type)}
                      {influencer.commission_type === 'percentage' ? 'Percentage' : 'Fixed Rate'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-1">{influencer.social_handles}</p>
                  <p className="text-sm text-gray-600 mb-2">{influencer.contact_info}</p>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-500">
                      Referrals: {influencer.total_referrals}
                    </span>
                    <span className="text-sm font-medium text-purple-600">
                      {formatCommissionDisplay(influencer)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="flex items-center gap-2 mb-2">
                      <p className="text-sm font-medium text-gray-900">Code:</p>
                      {editingReferralCode === influencer.id ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={tempReferralCode}
                            onChange={(e) => setTempReferralCode(e.target.value.toUpperCase())}
                            className="px-2 py-1 border border-gray-300 rounded text-sm font-mono w-24"
                            maxLength={10}
                          />
                          <button
                            onClick={() => handleSaveReferralCode(influencer.id)}
                            className="text-green-600 hover:text-green-700"
                          >
                            <Save className="w-4 h-4" />
                          </button>
                          <button
                            onClick={handleCancelEditReferralCode}
                            className="text-red-600 hover:text-red-700"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold text-purple-600 font-mono">
                            {influencer.referral_code}
                          </span>
                          <button
                            onClick={() => handleEditReferralCode(influencer.id, influencer.referral_code)}
                            className="text-gray-400 hover:text-gray-600"
                            title="Edit referral code"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => copyReferralLink(influencer.referral_code)}
                        className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1"
                      >
                        <Copy className="w-4 h-4" />
                        Copy Link
                      </button>
                      <button
                        onClick={() => {
                          setSelectedInfluencer(influencer);
                          setShowDetailModal(true);
                          fetchReferrerDetails(influencer.id);
                        }}
                        className="text-purple-600 hover:text-purple-700 text-sm flex items-center gap-1"
                      >
                        <Eye className="w-4 h-4" />
                        Details
                      </button>
                      <button
                        onClick={() => setEditingInfluencer(influencer)}
                        className="text-gray-600 hover:text-gray-700 text-sm flex items-center gap-1"
                      >
                        <Edit className="w-4 h-4" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteInfluencer(influencer.id)}
                        className="text-red-600 hover:text-red-700 text-sm flex items-center gap-1"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {influencers.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-500">No influencers added yet. Add your first influencer to get started!</div>
        </div>
      )}

      {/* Referrer Detail Modal */}
      {showDetailModal && selectedInfluencer && referrerSummary && (
        <ReferrerDetailModal
          influencer={selectedInfluencer}
          summary={referrerSummary}
          commissions={commissionData}
          payments={commissionPayments}
          onClose={() => setShowDetailModal(false)}
          onPayCommissions={() => {
            setShowDetailModal(false);
            setShowCommissionModal(true);
          }}
          getCommissionStatusColor={getCommissionStatusColor}
          getCommissionStatusIcon={getCommissionStatusIcon}
          formatCommissionDisplay={formatCommissionDisplay}
        />
      )}

      {/* Commission Payment Modal */}
      {showCommissionModal && selectedInfluencer && (
        <CommissionPaymentModal
          influencer={selectedInfluencer}
          commissions={commissionData.filter(c => c.commission_status === 'pending')}
          selectedCommissions={selectedCommissions}
          setSelectedCommissions={setSelectedCommissions}
          payment={newCommissionPayment}
          setPayment={setNewCommissionPayment}
          onSubmit={handlePayCommissions}
          onClose={() => setShowCommissionModal(false)}
          totalAmount={calculateSelectedCommissionTotal()}
        />
      )}

      {/* Commission Override Modal */}
      {showOverrideModal && (
        <CommissionOverrideModal
          override={newOverride}
          setOverride={setNewOverride}
          influencers={influencers}
          onSubmit={handleCreateOverride}
          onClose={() => setShowOverrideModal(false)}
        />
      )}

      {/* Add Influencer Modal */}
      {showAddModal && (
        <AddInfluencerModal
          influencer={newInfluencer}
          setInfluencer={setNewInfluencer}
          onSubmit={handleAddInfluencer}
          onClose={() => setShowAddModal(false)}
        />
      )}

      {/* Edit Influencer Modal */}
      {editingInfluencer && (
        <EditInfluencerModal
          influencer={editingInfluencer}
          setInfluencer={setEditingInfluencer}
          onSubmit={handleEditInfluencer}
          onClose={() => setEditingInfluencer(null)}
        />
      )}
    </div>
  );
};

// Referrer Detail Modal Component
const ReferrerDetailModal: React.FC<{
  influencer: Influencer;
  summary: ReferrerSummary;
  commissions: CommissionTracking[];
  payments: CommissionPayment[];
  onClose: () => void;
  onPayCommissions: () => void;
  getCommissionStatusColor: (status: string) => string;
  getCommissionStatusIcon: (status: string) => JSX.Element;
  formatCommissionDisplay: (influencer: Influencer) => string;
}> = ({ influencer, summary, commissions, payments, onClose, onPayCommissions, getCommissionStatusColor, getCommissionStatusIcon, formatCommissionDisplay }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl p-8 w-full max-w-6xl max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-gray-900">Referrer Dashboard</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ×
          </button>
        </div>

        {/* Referrer Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-gray-50 rounded-xl p-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Referrer Information</h4>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-600">Name</label>
                <p className="text-gray-900">{influencer.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Social Handles</label>
                <p className="text-gray-900">{influencer.social_handles}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Contact</label>
                <p className="text-gray-900">{influencer.contact_info}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Referral Code</label>
                <p className="text-lg font-bold text-purple-600">{influencer.referral_code}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Commission Structure</label>
                <p className="text-gray-900 font-medium">{formatCommissionDisplay(influencer)}</p>
              </div>
            </div>
          </div>

          <div className="bg-purple-50 rounded-xl p-6 border border-purple-200">
            <h4 className="text-lg font-semibold text-purple-900 mb-4 flex items-center gap-2">
              <Star className="w-5 h-5" />
              Performance Overview
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-purple-600">Total Referrals</label>
                <p className="text-2xl font-bold text-purple-900">{summary.total_referrals}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-purple-600">Active Projects</label>
                <p className="text-2xl font-bold text-purple-900">{summary.active_projects}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-purple-600">Total Earned</label>
                <p className="text-2xl font-bold text-green-600">${summary.total_commission_earned.toLocaleString()}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-purple-600">Unpaid Commission</label>
                <p className="text-2xl font-bold text-red-600">${summary.unpaid_commission.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Commission Tracking */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-gray-50 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold text-gray-900">Commission Tracking</h4>
              {summary.unpaid_commission > 0 && (
                <button
                  onClick={onPayCommissions}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                >
                  <CreditCard className="w-4 h-4" />
                  Pay Commissions
                </button>
              )}
            </div>
            
            {commissions.length > 0 ? (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {commissions.map((commission) => (
                  <div key={commission.commission_id} className="bg-white rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getCommissionStatusIcon(commission.commission_status)}
                        <span className="font-medium text-gray-900">
                          ${commission.commission_amount.toLocaleString()}
                        </span>
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                          {commission.commission_method_used || 'Unknown'}
                        </span>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCommissionStatusColor(commission.commission_status)}`}>
                        {commission.commission_status}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600">
                      <p>Customer: {commission.customer_name}</p>
                      <p>Project: {commission.project_type}</p>
                      <p>Value: ${commission.project_value.toLocaleString()}</p>
                      <p>Earned: {format(new Date(commission.earned_date), 'MMM dd, yyyy')}</p>
                      {commission.calculation_details && (
                        <p className="text-xs text-gray-500 mt-1">
                          Method: {commission.calculation_details.method || 'Standard'}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <DollarSign className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                <p>No commissions earned yet</p>
              </div>
            )}
          </div>

          {/* Payment History */}
          <div className="bg-gray-50 rounded-xl p-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Payment History</h4>
            
            {payments.length > 0 ? (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {payments.map((payment) => (
                  <div key={payment.id} className="bg-white rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="font-medium text-gray-900">
                          ${payment.payment_amount.toLocaleString()}
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
                <CreditCard className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                <p>No payments made yet</p>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

// Commission Payment Modal Component
const CommissionPaymentModal: React.FC<{
  influencer: Influencer;
  commissions: CommissionTracking[];
  selectedCommissions: string[];
  setSelectedCommissions: (ids: string[]) => void;
  payment: any;
  setPayment: (payment: any) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
  totalAmount: number;
}> = ({ influencer, commissions, selectedCommissions, setSelectedCommissions, payment, setPayment, onSubmit, onClose, totalAmount }) => {
  const handleCommissionToggle = (commissionId: string) => {
    if (selectedCommissions.includes(commissionId)) {
      setSelectedCommissions(selectedCommissions.filter(id => id !== commissionId));
    } else {
      setSelectedCommissions([...selectedCommissions, commissionId]);
    }
  };

  const handleSelectAll = () => {
    if (selectedCommissions.length === commissions.length) {
      setSelectedCommissions([]);
    } else {
      setSelectedCommissions(commissions.map(c => c.commission_id));
    }
  };

  // Update payment amount when selections change
  React.useEffect(() => {
    setPayment({ ...payment, payment_amount: totalAmount });
  }, [totalAmount]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl p-8 w-full max-w-4xl max-h-[90vh] overflow-y-auto"
      >
        <h3 className="text-xl font-bold text-gray-900 mb-6">Pay Commission to {influencer.name}</h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Commission Selection */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold text-gray-900">Select Commissions to Pay</h4>
              <button
                onClick={handleSelectAll}
                className="text-blue-600 hover:text-blue-700 text-sm"
              >
                {selectedCommissions.length === commissions.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>
            
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {commissions.map((commission) => (
                <div
                  key={commission.commission_id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedCommissions.includes(commission.commission_id)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleCommissionToggle(commission.commission_id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={selectedCommissions.includes(commission.commission_id)}
                        onChange={() => handleCommissionToggle(commission.commission_id)}
                        className="w-4 h-4 text-blue-600"
                      />
                      <div>
                        <p className="font-medium text-gray-900">${commission.commission_amount.toLocaleString()}</p>
                        <p className="text-sm text-gray-600">{commission.customer_name}</p>
                        <p className="text-sm text-gray-500">{commission.project_type}</p>
                        {commission.commission_method_used && (
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded mt-1 inline-block">
                            {commission.commission_method_used}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">
                        {format(new Date(commission.earned_date), 'MMM dd')}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Payment Details */}
          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Payment Details</h4>
            
            <div className="mb-4 p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-green-600">Total Amount to Pay</p>
              <p className="text-2xl font-bold text-green-800">${totalAmount.toLocaleString()}</p>
              <p className="text-sm text-green-600">{selectedCommissions.length} commission(s) selected</p>
            </div>

            <form onSubmit={onSubmit} className="space-y-4">
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
                  <option value="PayPal">PayPal</option>
                  <option value="Check">Check</option>
                  <option value="Cash">Cash</option>
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
                  placeholder="Transaction ID, check number, etc."
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
                  disabled={selectedCommissions.length === 0}
                  className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Pay Commission
                </button>
              </div>
            </form>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

// Commission Override Modal Component
const CommissionOverrideModal: React.FC<{
  override: CommissionOverride;
  setOverride: (override: CommissionOverride) => void;
  influencers: Influencer[];
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}> = ({ override, setOverride, influencers, onSubmit, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        <h3 className="text-xl font-bold text-gray-900 mb-6">Create Commission Override</h3>
        
        <form onSubmit={onSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Influencer *</label>
              <select
                required
                value={override.influencer_id}
                onChange={(e) => setOverride({...override, influencer_id: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select influencer</option>
                {influencers.map((influencer) => (
                  <option key={influencer.id} value={influencer.id}>
                    {influencer.name} ({influencer.referral_code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Commission Type *</label>
              <select
                required
                value={override.commission_type}
                onChange={(e) => setOverride({...override, commission_type: e.target.value as 'percentage' | 'fixed'})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="percentage">Percentage</option>
                <option value="fixed">Fixed Rate</option>
              </select>
            </div>
          </div>

          {override.commission_type === 'percentage' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Commission Rate (%) *</label>
                <input
                  type="number"
                  min="0.1"
                  max="50"
                  step="0.1"
                  required
                  value={override.commission_rate || ''}
                  onChange={(e) => setOverride({...override, commission_rate: parseFloat(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Calculation Method</label>
                <select
                  value={override.commission_calculation_method}
                  onChange={(e) => setOverride({...override, commission_calculation_method: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="project_value">Project Value</option>
                  <option value="payments_received">Payments Received</option>
                  <option value="first_payment">First Payment Only</option>
                </select>
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Fixed Rate ($) *</label>
              <input
                type="number"
                min="1"
                step="0.01"
                required
                value={override.fixed_rate || ''}
                onChange={(e) => setOverride({...override, fixed_rate: parseFloat(e.target.value)})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Commission Cap ($)</label>
              <input
                type="number"
                min="1"
                step="0.01"
                value={override.commission_cap || ''}
                onChange={(e) => setOverride({...override, commission_cap: e.target.value ? parseFloat(e.target.value) : undefined})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Optional maximum"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Commission Minimum ($)</label>
              <input
                type="number"
                min="1"
                step="0.01"
                value={override.commission_minimum || ''}
                onChange={(e) => setOverride({...override, commission_minimum: e.target.value ? parseFloat(e.target.value) : undefined})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Optional minimum"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Commission Trigger</label>
            <select
              value={override.commission_trigger}
              onChange={(e) => setOverride({...override, commission_trigger: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="signup">Customer Signup</option>
              <option value="first_payment">First Payment</option>
              <option value="project_completion">Project Completion</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
            <textarea
              required
              rows={3}
              value={override.description}
              onChange={(e) => setOverride({...override, description: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Reason for this override (e.g., Special promotion, High-value client agreement)"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Valid From</label>
              <input
                type="date"
                value={override.valid_from || ''}
                onChange={(e) => setOverride({...override, valid_from: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Valid Until</label>
              <input
                type="date"
                value={override.valid_until || ''}
                onChange={(e) => setOverride({...override, valid_until: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
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
              className="flex-1 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
            >
              Create Override
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

// Add Influencer Modal Component
const AddInfluencerModal: React.FC<{
  influencer: any;
  setInfluencer: (influencer: any) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}> = ({ influencer, setInfluencer, onSubmit, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        <h3 className="text-xl font-bold text-gray-900 mb-6">Add New Influencer</h3>
        <form onSubmit={onSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Name *</label>
              <input
                type="text"
                required
                value={influencer.name}
                onChange={(e) => setInfluencer({...influencer, name: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Influencer name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Social Handles *</label>
              <input
                type="text"
                required
                value={influencer.social_handles}
                onChange={(e) => setInfluencer({...influencer, social_handles: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="@username, @handle"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Contact Information *</label>
            <input
              type="text"
              required
              value={influencer.contact_info}
              onChange={(e) => setInfluencer({...influencer, contact_info: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Email or phone"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Commission Type *</label>
            <div className="grid grid-cols-2 gap-4">
              <label className="flex items-center p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="commission_type"
                  value="percentage"
                  checked={influencer.commission_type === 'percentage'}
                  onChange={(e) => setInfluencer({...influencer, commission_type: e.target.value})}
                  className="mr-3"
                />
                <div>
                  <div className="font-medium">Percentage Rate</div>
                  <div className="text-sm text-gray-600">% of project value/payments</div>
                </div>
              </label>
              <label className="flex items-center p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="commission_type"
                  value="fixed"
                  checked={influencer.commission_type === 'fixed'}
                  onChange={(e) => setInfluencer({...influencer, commission_type: e.target.value})}
                  className="mr-3"
                />
                <div>
                  <div className="font-medium">Fixed Rate</div>
                  <div className="text-sm text-gray-600">Flat fee per referral</div>
                </div>
              </label>
            </div>
          </div>

          {influencer.commission_type === 'percentage' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Commission Rate (%) *</label>
                <input
                  type="number"
                  min="0.1"
                  max="50"
                  step="0.1"
                  required
                  value={influencer.commission_rate}
                  onChange={(e) => setInfluencer({...influencer, commission_rate: parseFloat(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Calculation Method</label>
                <select
                  value={influencer.commission_calculation_method}
                  onChange={(e) => setInfluencer({...influencer, commission_calculation_method: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="project_value">Project Value</option>
                  <option value="payments_received">Payments Received</option>
                  <option value="first_payment">First Payment Only</option>
                </select>
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Fixed Rate ($) *</label>
              <input
                type="number"
                min="1"
                step="0.01"
                required
                value={influencer.fixed_rate}
                onChange={(e) => setInfluencer({...influencer, fixed_rate: parseFloat(e.target.value)})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Commission Cap ($)</label>
              <input
                type="number"
                min="1"
                step="0.01"
                value={influencer.commission_cap || ''}
                onChange={(e) => setInfluencer({...influencer, commission_cap: e.target.value ? parseFloat(e.target.value) : undefined})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Optional maximum"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Commission Minimum ($)</label>
              <input
                type="number"
                min="1"
                step="0.01"
                value={influencer.commission_minimum || ''}
                onChange={(e) => setInfluencer({...influencer, commission_minimum: e.target.value ? parseFloat(e.target.value) : undefined})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Optional minimum"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Commission Trigger</label>
            <select
              value={influencer.commission_trigger}
              onChange={(e) => setInfluencer({...influencer, commission_trigger: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="signup">Customer Signup</option>
              <option value="first_payment">First Payment</option>
              <option value="project_completion">Project Completion</option>
            </select>
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
              Add Influencer
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

// Edit Influencer Modal Component
const EditInfluencerModal: React.FC<{
  influencer: Influencer;
  setInfluencer: (influencer: Influencer) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}> = ({ influencer, setInfluencer, onSubmit, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        <h3 className="text-xl font-bold text-gray-900 mb-6">Edit Influencer</h3>
        <form onSubmit={onSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Name *</label>
              <input
                type="text"
                required
                value={influencer.name}
                onChange={(e) => setInfluencer({...influencer, name: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Social Handles *</label>
              <input
                type="text"
                required
                value={influencer.social_handles}
                onChange={(e) => setInfluencer({...influencer, social_handles: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Contact Information *</label>
            <input
              type="text"
              required
              value={influencer.contact_info}
              onChange={(e) => setInfluencer({...influencer, contact_info: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Commission Type *</label>
            <div className="grid grid-cols-2 gap-4">
              <label className="flex items-center p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="commission_type"
                  value="percentage"
                  checked={influencer.commission_type === 'percentage'}
                  onChange={(e) => setInfluencer({...influencer, commission_type: e.target.value as 'percentage' | 'fixed'})}
                  className="mr-3"
                />
                <div>
                  <div className="font-medium">Percentage Rate</div>
                  <div className="text-sm text-gray-600">% of project value/payments</div>
                </div>
              </label>
              <label className="flex items-center p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="commission_type"
                  value="fixed"
                  checked={influencer.commission_type === 'fixed'}
                  onChange={(e) => setInfluencer({...influencer, commission_type: e.target.value as 'percentage' | 'fixed'})}
                  className="mr-3"
                />
                <div>
                  <div className="font-medium">Fixed Rate</div>
                  <div className="text-sm text-gray-600">Flat fee per referral</div>
                </div>
              </label>
            </div>
          </div>

          {influencer.commission_type === 'percentage' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Commission Rate (%) *</label>
                <input
                  type="number"
                  min="0.1"
                  max="50"
                  step="0.1"
                  required
                  value={influencer.commission_rate}
                  onChange={(e) => setInfluencer({...influencer, commission_rate: parseFloat(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Calculation Method</label>
                <select
                  value={influencer.commission_calculation_method}
                  onChange={(e) => setInfluencer({...influencer, commission_calculation_method: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="project_value">Project Value</option>
                  <option value="payments_received">Payments Received</option>
                  <option value="first_payment">First Payment Only</option>
                </select>
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Fixed Rate ($) *</label>
              <input
                type="number"
                min="1"
                step="0.01"
                required
                value={influencer.fixed_rate}
                onChange={(e) => setInfluencer({...influencer, fixed_rate: parseFloat(e.target.value)})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Commission Cap ($)</label>
              <input
                type="number"
                min="1"
                step="0.01"
                value={influencer.commission_cap || ''}
                onChange={(e) => setInfluencer({...influencer, commission_cap: e.target.value ? parseFloat(e.target.value) : undefined})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Optional maximum"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Commission Minimum ($)</label>
              <input
                type="number"
                min="1"
                step="0.01"
                value={influencer.commission_minimum || ''}
                onChange={(e) => setInfluencer({...influencer, commission_minimum: e.target.value ? parseFloat(e.target.value) : undefined})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Optional minimum"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Commission Trigger</label>
            <select
              value={influencer.commission_trigger}
              onChange={(e) => setInfluencer({...influencer, commission_trigger: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="signup">Customer Signup</option>
              <option value="first_payment">First Payment</option>
              <option value="project_completion">Project Completion</option>
            </select>
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
              Update Influencer
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default ReferralManagement;