import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, 
  Search, 
  Filter, 
  Calendar, 
  Mail, 
  Phone, 
  Eye, 
  MessageSquare, 
  UserPlus, 
  Download,
  ExternalLink,
  Clock,
  TrendingUp,
  Users,
  Target,
  ChevronDown,
  X,
  Send,
  Edit,
  Trash2,
  CheckCircle,
  AlertCircle,
  Star,
  CalendarPlus,
  Bell,
  Flag,
  ArrowRight,
  RotateCcw,
  Plus
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { toast } from '../ui/toast';
import { format, isToday, parseISO, isPast, isThisWeek } from 'date-fns';
import emailjs from '@emailjs/browser';

interface FormSubmission {
  id: string;
  name: string;
  email: string;
  phone?: string;
  project_type: string;
  description: string;
  budget: string;
  referral_code?: string;
  status: string;
  created_at: string;
  next_followup_date?: string;
  followup_priority?: string;
  followup_count?: number;
}

interface FollowUp {
  followup_id: string;
  contact_id: string;
  contact_name: string;
  contact_email: string;
  contact_phone?: string;
  project_type: string;
  contact_status: string;
  next_followup_date: string;
  priority: string;
  followup_notes?: string;
  followup_status: string;
  created_at: string;
  completed_at?: string;
  days_until_followup: number;
  is_overdue: boolean;
}

interface Influencer {
  id: string;
  name: string;
  social_handles: string;
  contact_info: string;
  referral_code: string;
  total_referrals: number;
  commission_rate: number;
}

interface FormStats {
  totalSubmissions: number;
  todaySubmissions: number;
  pendingFollowUps: number;
  conversionRate: number;
}

interface FollowUpStats {
  total_followups: number;
  overdue_followups: number;
  today_followups: number;
  this_week_followups: number;
  high_priority_followups: number;
}

const FormsManagement: React.FC = () => {
  const [submissions, setSubmissions] = useState<FormSubmission[]>([]);
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [influencers, setInfluencers] = useState<Influencer[]>([]);
  const [filteredSubmissions, setFilteredSubmissions] = useState<FormSubmission[]>([]);
  const [filteredFollowUps, setFilteredFollowUps] = useState<FollowUp[]>([]);
  const [loading, setLoading] = useState(true);
  const [convertingIds, setConvertingIds] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'submissions' | 'followups'>('submissions');
  
  const [stats, setStats] = useState<FormStats>({
    totalSubmissions: 0,
    todaySubmissions: 0,
    pendingFollowUps: 0,
    conversionRate: 0
  });

  const [followUpStats, setFollowUpStats] = useState<FollowUpStats>({
    total_followups: 0,
    overdue_followups: 0,
    today_followups: 0,
    this_week_followups: 0,
    high_priority_followups: 0
  });

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [referralFilter, setReferralFilter] = useState('all');
  const [projectTypeFilter, setProjectTypeFilter] = useState('all');
  const [dateRange, setDateRange] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  // Follow-up filter states
  const [followUpStatusFilter, setFollowUpStatusFilter] = useState('scheduled');
  const [followUpPriorityFilter, setFollowUpPriorityFilter] = useState('all');
  const [followUpDateFilter, setFollowUpDateFilter] = useState('all');

  // Modal states
  const [selectedSubmission, setSelectedSubmission] = useState<FormSubmission | null>(null);
  const [selectedFollowUp, setSelectedFollowUp] = useState<FollowUp | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showFollowUpModal, setShowFollowUpModal] = useState(false);
  const [showCreateFollowUpModal, setShowCreateFollowUpModal] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Follow-up form data
  const [followUpForm, setFollowUpForm] = useState({
    next_followup_date: '',
    priority: 'medium',
    notes: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (activeTab === 'submissions') {
      applySubmissionFilters();
    } else {
      applyFollowUpFilters();
    }
  }, [submissions, followUps, searchTerm, statusFilter, referralFilter, projectTypeFilter, dateRange, followUpStatusFilter, followUpPriorityFilter, followUpDateFilter, activeTab]);

  const fetchData = async () => {
    try {
      const [submissionsRes, influencersRes, customersRes, followUpStatsRes] = await Promise.all([
        supabase.from('contacts').select('*').order('created_at', { ascending: false }),
        supabase.from('influencers').select('*'),
        supabase.from('customers').select('*'),
        supabase.rpc('get_followup_dashboard')
      ]);

      const submissionsData = submissionsRes.data || [];
      const influencersData = influencersRes.data || [];
      const customersData = customersRes.data || [];

      setSubmissions(submissionsData);
      setInfluencers(influencersData);

      // Calculate stats
      const today = new Date();
      const todaySubmissions = submissionsData.filter(sub => 
        isToday(parseISO(sub.created_at))
      ).length;

      const pendingFollowUps = submissionsData.filter(sub => 
        sub.status === 'contacted' && sub.next_followup_date
      ).length;

      const conversionRate = submissionsData.length > 0 
        ? (customersData.length / submissionsData.length) * 100 
        : 0;

      setStats({
        totalSubmissions: submissionsData.length,
        todaySubmissions,
        pendingFollowUps,
        conversionRate
      });

      // Set follow-up stats
      if (followUpStatsRes.data && followUpStatsRes.data.length > 0) {
        setFollowUpStats(followUpStatsRes.data[0]);
      }

      // Fetch follow-ups
      await fetchFollowUps();
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to fetch form submissions');
    } finally {
      setLoading(false);
    }
  };

  const fetchFollowUps = async () => {
    try {
      const { data, error } = await supabase.rpc('get_followups_with_contacts');
      if (error) throw error;
      setFollowUps(data || []);
    } catch (error) {
      console.error('Error fetching follow-ups:', error);
      toast.error('Failed to fetch follow-ups');
    }
  };

  const applySubmissionFilters = () => {
    let filtered = [...submissions];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(sub =>
        sub.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sub.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sub.project_type.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(sub => sub.status === statusFilter);
    }

    // Referral filter
    if (referralFilter === 'with_referral') {
      filtered = filtered.filter(sub => sub.referral_code);
    } else if (referralFilter === 'without_referral') {
      filtered = filtered.filter(sub => !sub.referral_code);
    } else if (referralFilter !== 'all') {
      filtered = filtered.filter(sub => sub.referral_code === referralFilter);
    }

    // Project type filter
    if (projectTypeFilter !== 'all') {
      filtered = filtered.filter(sub => sub.project_type === projectTypeFilter);
    }

    // Date range filter
    if (dateRange !== 'all') {
      const now = new Date();
      const filterDate = new Date();
      
      switch (dateRange) {
        case '7days':
          filterDate.setDate(now.getDate() - 7);
          break;
        case '30days':
          filterDate.setDate(now.getDate() - 30);
          break;
        case '3months':
          filterDate.setMonth(now.getMonth() - 3);
          break;
      }
      
      filtered = filtered.filter(sub => 
        parseISO(sub.created_at) >= filterDate
      );
    }

    setFilteredSubmissions(filtered);
    setCurrentPage(1);
  };

  const applyFollowUpFilters = () => {
    let filtered = [...followUps];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(followUp =>
        followUp.contact_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        followUp.contact_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        followUp.project_type.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (followUpStatusFilter !== 'all') {
      filtered = filtered.filter(followUp => followUp.followup_status === followUpStatusFilter);
    }

    // Priority filter
    if (followUpPriorityFilter !== 'all') {
      filtered = filtered.filter(followUp => followUp.priority === followUpPriorityFilter);
    }

    // Date filter
    if (followUpDateFilter !== 'all') {
      const today = new Date();
      filtered = filtered.filter(followUp => {
        const followUpDate = parseISO(followUp.next_followup_date);
        switch (followUpDateFilter) {
          case 'overdue':
            return followUp.is_overdue;
          case 'today':
            return isToday(followUpDate);
          case 'this_week':
            return isThisWeek(followUpDate);
          default:
            return true;
        }
      });
    }

    setFilteredFollowUps(filtered);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setReferralFilter('all');
    setProjectTypeFilter('all');
    setDateRange('all');
    setFollowUpStatusFilter('scheduled');
    setFollowUpPriorityFilter('all');
    setFollowUpDateFilter('all');
  };

  const updateSubmissionStatus = async (id: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('contacts')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;

      setSubmissions(prev => 
        prev.map(sub => sub.id === id ? { ...sub, status: newStatus } : sub)
      );
      
      toast.success('Status updated successfully');
      
      // If status changed to contacted, show follow-up modal
      if (newStatus === 'contacted') {
        const submission = submissions.find(s => s.id === id);
        if (submission) {
          setSelectedSubmission(submission);
          setShowCreateFollowUpModal(true);
        }
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };

  const createFollowUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubmission) return;

    try {
      const { error } = await supabase.rpc('create_followup_on_contacted', {
        contact_uuid: selectedSubmission.id,
        next_date: followUpForm.next_followup_date,
        priority_level: followUpForm.priority,
        notes: followUpForm.notes || null
      });

      if (error) throw error;

      toast.success('Follow-up scheduled successfully');
      setShowCreateFollowUpModal(false);
      setFollowUpForm({
        next_followup_date: '',
        priority: 'medium',
        notes: ''
      });
      
      // Refresh data
      fetchData();
    } catch (error) {
      console.error('Error creating follow-up:', error);
      toast.error('Failed to schedule follow-up');
    }
  };

  const completeFollowUp = async (followUpId: string, notes?: string) => {
    try {
      const { error } = await supabase.rpc('complete_followup', {
        followup_uuid: followUpId,
        completion_notes: notes || null
      });

      if (error) throw error;

      toast.success('Follow-up marked as completed');
      fetchFollowUps();
    } catch (error) {
      console.error('Error completing follow-up:', error);
      toast.error('Failed to complete follow-up');
    }
  };

  const updateFollowUpStatus = async (followUpId: string, contactId: string, newStatus: string) => {
    try {
      // Update contact status
      const { error: contactError } = await supabase
        .from('contacts')
        .update({ status: newStatus })
        .eq('id', contactId);

      if (contactError) throw contactError;

      // Update submissions state
      setSubmissions(prev => 
        prev.map(sub => sub.id === contactId ? { ...sub, status: newStatus } : sub)
      );

      toast.success('Status updated successfully');
      
      // Refresh follow-ups
      fetchFollowUps();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };

  const checkIfAlreadyConverted = async (submission: FormSubmission): Promise<boolean> => {
    try {
      // Check if a customer already exists with the same email and name
      const { data: existingCustomer, error } = await supabase
        .from('customers')
        .select('id, name, email')
        .eq('email', submission.email)
        .eq('name', submission.name)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
        throw error;
      }

      return !!existingCustomer;
    } catch (error) {
      console.error('Error checking existing customer:', error);
      return false;
    }
  };

  const convertToCustomer = async (submission: FormSubmission) => {
    // Prevent multiple simultaneous conversions
    if (convertingIds.has(submission.id)) {
      toast.error('Conversion already in progress');
      return;
    }

    // Check if already converted
    if (submission.status === 'converted') {
      toast.error('This form has already been converted to a customer');
      return;
    }

    setConvertingIds(prev => new Set(prev).add(submission.id));

    try {
      // Check if customer already exists
      const alreadyExists = await checkIfAlreadyConverted(submission);
      
      if (alreadyExists) {
        toast.error('A customer with this email and name already exists');
        return;
      }

      // Create new customer
      const { error: customerError } = await supabase
        .from('customers')
        .insert([{
          name: submission.name,
          email: submission.email,
          phone: submission.phone,
          project_type: submission.project_type,
          request_date: new Date().toISOString().split('T')[0],
          status: 'new',
          payment_status: 'not_started',
          project_value: 100000, // Default project value in INR
          referral_source: submission.referral_code ? `Referral: ${submission.referral_code}` : null
        }]);

      if (customerError) throw customerError;

      // Update submission status to converted
      await updateSubmissionStatus(submission.id, 'converted');
      
      toast.success('Successfully converted to customer');
      setShowDetailModal(false);
      
      // Refresh data to update stats
      fetchData();
    } catch (error) {
      console.error('Error converting to customer:', error);
      toast.error('Failed to convert to customer');
    } finally {
      setConvertingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(submission.id);
        return newSet;
      });
    }
  };

  const exportData = () => {
    const csvContent = [
      ['Name', 'Email', 'Phone', 'Project Type', 'Budget', 'Referral Code', 'Status', 'Date'],
      ...filteredSubmissions.map(sub => [
        sub.name,
        sub.email,
        sub.phone || '',
        sub.project_type,
        sub.budget,
        sub.referral_code || '',
        sub.status,
        format(parseISO(sub.created_at), 'yyyy-MM-dd HH:mm')
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `form-submissions-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800';
      case 'contacted': return 'bg-yellow-100 text-yellow-800';
      case 'converted': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getFollowUpStatusColor = (status: string, isOverdue: boolean) => {
    if (isOverdue) return 'bg-red-100 text-red-800';
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getProjectTypeIcon = (type: string) => {
    switch (type) {
      case 'Business Website': return '🌐';
      case 'Landing Page': return '📄';
      case 'SaaS Product': return '⚡';
      case 'Custom Software': return '💻';
      default: return '📋';
    }
  };

  // Pagination for current tab
  const currentData = activeTab === 'submissions' ? filteredSubmissions : filteredFollowUps;
  const totalPages = Math.ceil(currentData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = currentData.slice(startIndex, startIndex + itemsPerPage);

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
          <h1 className="text-3xl font-bold text-gray-900">Form Submissions & Follow-ups</h1>
          <p className="text-gray-600 mt-2">Track and manage all contact form submissions with follow-up system</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={exportData}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            <Download className="w-5 h-5" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('submissions')}
            className={`px-6 py-4 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'submissions'
                ? 'border-blue-500 text-blue-600 bg-blue-50'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Form Submissions
              <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs">
                {stats.totalSubmissions}
              </span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('followups')}
            className={`px-6 py-4 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'followups'
                ? 'border-blue-500 text-blue-600 bg-blue-50'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className="flex items-center gap-2">
              <CalendarPlus className="w-4 h-4" />
              Follow-ups
              <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs">
                {followUpStats.total_followups}
              </span>
              {followUpStats.overdue_followups > 0 && (
                <span className="bg-red-100 text-red-600 px-2 py-1 rounded-full text-xs">
                  {followUpStats.overdue_followups} overdue
                </span>
              )}
            </div>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {activeTab === 'submissions' ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Submissions</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalSubmissions}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Today's Submissions</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.todaySubmissions}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <Clock className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Follow-ups</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.pendingFollowUps}</p>
              </div>
              <div className="bg-yellow-100 p-3 rounded-lg">
                <AlertCircle className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Conversion Rate</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.conversionRate.toFixed(1)}%</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-lg">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </motion.div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Follow-ups</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{followUpStats.total_followups}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <CalendarPlus className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Overdue</p>
                <p className="text-2xl font-bold text-red-600 mt-1">{followUpStats.overdue_followups}</p>
              </div>
              <div className="bg-red-100 p-3 rounded-lg">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Today</p>
                <p className="text-2xl font-bold text-green-600 mt-1">{followUpStats.today_followups}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <Calendar className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">This Week</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">{followUpStats.this_week_followups}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <Clock className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">High Priority</p>
                <p className="text-2xl font-bold text-orange-600 mt-1">{followUpStats.high_priority_followups}</p>
              </div>
              <div className="bg-orange-100 p-3 rounded-lg">
                <Flag className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder={activeTab === 'submissions' ? "Search submissions..." : "Search follow-ups..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Filter className="w-5 h-5 text-gray-400" />
            Filters
            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Advanced Filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4 pt-4 border-t border-gray-200">
                {activeTab === 'submissions' ? (
                  <>
                    {/* Date Range */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
                      <select
                        value={dateRange}
                        onChange={(e) => setDateRange(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="all">All Time</option>
                        <option value="7days">Last 7 Days</option>
                        <option value="30days">Last 30 Days</option>
                        <option value="3months">Last 3 Months</option>
                      </select>
                    </div>

                    {/* Status Filter */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="all">All Status</option>
                        <option value="new">New</option>
                        <option value="contacted">Contacted</option>
                        <option value="converted">Converted</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    </div>

                    {/* Referral Filter */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Referral Source</label>
                      <select
                        value={referralFilter}
                        onChange={(e) => setReferralFilter(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="all">All Submissions</option>
                        <option value="with_referral">With Referral Code</option>
                        <option value="without_referral">Without Referral Code</option>
                        {influencers.map(inf => (
                          <option key={inf.id} value={inf.referral_code}>
                            {inf.name} ({inf.referral_code})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Project Type Filter */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Project Type</label>
                      <select
                        value={projectTypeFilter}
                        onChange={(e) => setProjectTypeFilter(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="all">All Types</option>
                        <option value="Business Website">Business Website</option>
                        <option value="Landing Page">Landing Page</option>
                        <option value="SaaS Product">SaaS Product</option>
                        <option value="Custom Software">Custom Software</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Follow-up Status Filter */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Follow-up Status</label>
                      <select
                        value={followUpStatusFilter}
                        onChange={(e) => setFollowUpStatusFilter(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="all">All Status</option>
                        <option value="scheduled">Scheduled</option>
                        <option value="completed">Completed</option>
                        <option value="overdue">Overdue</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>

                    {/* Priority Filter */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                      <select
                        value={followUpPriorityFilter}
                        onChange={(e) => setFollowUpPriorityFilter(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="all">All Priorities</option>
                        <option value="urgent">Urgent</option>
                        <option value="high">High</option>
                        <option value="medium">Medium</option>
                        <option value="low">Low</option>
                      </select>
                    </div>

                    {/* Date Filter */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Date Filter</label>
                      <select
                        value={followUpDateFilter}
                        onChange={(e) => setFollowUpDateFilter(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="all">All Dates</option>
                        <option value="overdue">Overdue</option>
                        <option value="today">Today</option>
                        <option value="this_week">This Week</option>
                      </select>
                    </div>
                  </>
                )}
              </div>

              <div className="flex justify-end mt-4">
                <button
                  onClick={clearFilters}
                  className="text-gray-600 hover:text-gray-800 text-sm flex items-center gap-1"
                >
                  <X className="w-4 h-4" />
                  Clear All Filters
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Results Summary */}
      <div className="flex items-center justify-between text-sm text-gray-600">
        <span>
          Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, currentData.length)} of {currentData.length} {activeTab === 'submissions' ? 'submissions' : 'follow-ups'}
        </span>
        <div className="flex items-center gap-2">
          <span>Items per page:</span>
          <select
            value={itemsPerPage}
            onChange={(e) => setItemsPerPage(Number(e.target.value))}
            className="px-2 py-1 border border-gray-300 rounded text-sm"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
        </div>
      </div>

      {/* Content Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          {activeTab === 'submissions' ? (
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Submission
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Project
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Referral
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedData.map((submission: FormSubmission) => {
                  const referrer = influencers.find(inf => inf.referral_code === submission.referral_code);
                  const isConverting = convertingIds.has(submission.id);
                  const isAlreadyConverted = submission.status === 'converted';
                  
                  return (
                    <motion.tr
                      key={submission.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="hover:bg-gray-50"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{submission.name}</div>
                          <div className="text-sm text-gray-500">
                            {format(parseISO(submission.created_at), 'MMM dd, yyyy HH:mm')}
                          </div>
                          {submission.followup_count && submission.followup_count > 0 && (
                            <div className="text-xs text-blue-600 flex items-center gap-1 mt-1">
                              <CalendarPlus className="w-3 h-3" />
                              {submission.followup_count} follow-up{submission.followup_count > 1 ? 's' : ''}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="space-y-1">
                          <a
                            href={`mailto:${submission.email}`}
                            className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                          >
                            <Mail className="w-3 h-3" />
                            {submission.email}
                          </a>
                          {submission.phone && (
                            <a
                              href={`tel:${submission.phone}`}
                              className="text-sm text-green-600 hover:text-green-800 flex items-center gap-1"
                            >
                              <Phone className="w-3 h-3" />
                              {submission.phone}
                            </a>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm text-gray-900 flex items-center gap-2">
                            <span>{getProjectTypeIcon(submission.project_type)}</span>
                            {submission.project_type}
                          </div>
                          <div className="text-sm text-gray-500">{submission.budget}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {submission.referral_code ? (
                          <div>
                            <div className="text-sm font-medium text-purple-600 bg-purple-100 px-2 py-1 rounded">
                              {submission.referral_code}
                            </div>
                            {referrer && (
                              <div className="text-xs text-gray-500 mt-1">{referrer.name}</div>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">Direct</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={submission.status}
                          onChange={(e) => updateSubmissionStatus(submission.id, e.target.value)}
                          className={`px-2 py-1 rounded-full text-xs font-medium border-0 ${getStatusColor(submission.status)}`}
                          disabled={isConverting}
                        >
                          <option value="new">New</option>
                          <option value="contacted">Contacted</option>
                          <option value="converted">Converted</option>
                          <option value="rejected">Rejected</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedSubmission(submission);
                              setShowDetailModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-900"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedSubmission(submission);
                              setShowEmailModal(true);
                            }}
                            className="text-green-600 hover:text-green-900"
                            title="Send Email"
                          >
                            <Send className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => convertToCustomer(submission)}
                            disabled={isConverting || isAlreadyConverted}
                            className={`${
                              isAlreadyConverted 
                                ? 'text-gray-400 cursor-not-allowed' 
                                : isConverting 
                                  ? 'text-gray-400 cursor-wait' 
                                  : 'text-purple-600 hover:text-purple-900'
                            }`}
                            title={
                              isAlreadyConverted 
                                ? 'Already converted to customer' 
                                : isConverting 
                                  ? 'Converting...' 
                                  : 'Convert to Customer'
                            }
                          >
                            {isConverting ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
                            ) : isAlreadyConverted ? (
                              <CheckCircle className="w-4 h-4" />
                            ) : (
                              <UserPlus className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Follow-up Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Priority
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Notes
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedData.map((followUp: FollowUp) => (
                  <motion.tr
                    key={followUp.followup_id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={`hover:bg-gray-50 ${followUp.is_overdue ? 'bg-red-50' : ''}`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{followUp.contact_name}</div>
                        <div className="text-sm text-gray-500">{followUp.contact_email}</div>
                        <div className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                          <span>{getProjectTypeIcon(followUp.project_type)}</span>
                          {followUp.project_type}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className={`text-sm font-medium ${followUp.is_overdue ? 'text-red-600' : 'text-gray-900'}`}>
                          {format(parseISO(followUp.next_followup_date), 'MMM dd, yyyy')}
                        </div>
                        <div className="text-xs text-gray-500">
                          {followUp.days_until_followup === 0 ? 'Today' :
                           followUp.days_until_followup < 0 ? `${Math.abs(followUp.days_until_followup)} days overdue` :
                           `In ${followUp.days_until_followup} days`}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(followUp.priority)}`}>
                        {followUp.priority.charAt(0).toUpperCase() + followUp.priority.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-1">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getFollowUpStatusColor(followUp.followup_status, followUp.is_overdue)}`}>
                          {followUp.is_overdue ? 'Overdue' : followUp.followup_status.charAt(0).toUpperCase() + followUp.followup_status.slice(1)}
                        </span>
                        <div className="text-xs text-gray-500">
                          Contact: {followUp.contact_status}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-600 max-w-xs truncate">
                        {followUp.followup_notes || 'No notes'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedFollowUp(followUp);
                            setShowFollowUpModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-900"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {followUp.followup_status === 'scheduled' && (
                          <button
                            onClick={() => completeFollowUp(followUp.followup_id)}
                            className="text-green-600 hover:text-green-900"
                            title="Mark as Completed"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setSelectedSubmission({
                              id: followUp.contact_id,
                              name: followUp.contact_name,
                              email: followUp.contact_email,
                              phone: followUp.contact_phone,
                              project_type: followUp.project_type,
                              status: followUp.contact_status
                            } as FormSubmission);
                            setShowEmailModal(true);
                          }}
                          className="text-purple-600 hover:text-purple-900"
                          title="Send Email"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-3 border-t border-gray-200 flex items-center justify-between">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {currentData.length === 0 && (
        <div className="text-center py-12">
          {activeTab === 'submissions' ? (
            <>
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <div className="text-gray-500">No form submissions found matching your criteria.</div>
            </>
          ) : (
            <>
              <CalendarPlus className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <div className="text-gray-500">No follow-ups found matching your criteria.</div>
            </>
          )}
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedSubmission && (
        <FormDetailModal
          submission={selectedSubmission}
          referrer={influencers.find(inf => inf.referral_code === selectedSubmission.referral_code)}
          onClose={() => setShowDetailModal(false)}
          onConvert={() => convertToCustomer(selectedSubmission)}
          onStatusUpdate={(status) => updateSubmissionStatus(selectedSubmission.id, status)}
          isConverting={convertingIds.has(selectedSubmission.id)}
          isAlreadyConverted={selectedSubmission.status === 'converted'}
        />
      )}

      {/* Follow-up Detail Modal */}
      {showFollowUpModal && selectedFollowUp && (
        <FollowUpDetailModal
          followUp={selectedFollowUp}
          onClose={() => setShowFollowUpModal(false)}
          onComplete={(notes) => completeFollowUp(selectedFollowUp.followup_id, notes)}
          onStatusUpdate={(status) => updateFollowUpStatus(selectedFollowUp.followup_id, selectedFollowUp.contact_id, status)}
        />
      )}

      {/* Email Modal */}
      {showEmailModal && selectedSubmission && (
        <EmailModal
          submission={selectedSubmission}
          onClose={() => setShowEmailModal(false)}
        />
      )}

      {/* Create Follow-up Modal */}
      {showCreateFollowUpModal && selectedSubmission && (
        <CreateFollowUpModal
          submission={selectedSubmission}
          followUpForm={followUpForm}
          setFollowUpForm={setFollowUpForm}
          onSubmit={createFollowUp}
          onClose={() => setShowCreateFollowUpModal(false)}
        />
      )}
    </div>
  );
};

// Form Detail Modal Component (Updated)
const FormDetailModal: React.FC<{
  submission: FormSubmission;
  referrer?: Influencer;
  onClose: () => void;
  onConvert: () => void;
  onStatusUpdate: (status: string) => void;
  isConverting: boolean;
  isAlreadyConverted: boolean;
}> = ({ submission, referrer, onClose, onConvert, onStatusUpdate, isConverting, isAlreadyConverted }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl p-8 w-full max-w-4xl max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-gray-900">Form Submission Details</h3>
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
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Full Name</label>
                  <p className="text-lg font-medium text-gray-900">{submission.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Email</label>
                  <a
                    href={`mailto:${submission.email}`}
                    className="text-blue-600 hover:text-blue-800 flex items-center gap-2"
                  >
                    <Mail className="w-4 h-4" />
                    {submission.email}
                  </a>
                </div>
                {submission.phone && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Phone</label>
                    <a
                      href={`tel:${submission.phone}`}
                      className="text-green-600 hover:text-green-800 flex items-center gap-2"
                    >
                      <Phone className="w-4 h-4" />
                      {submission.phone}
                    </a>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-gray-600">Submitted</label>
                  <p className="text-gray-900">
                    {format(parseISO(submission.created_at), 'MMMM dd, yyyy \'at\' HH:mm')}
                  </p>
                </div>
              </div>
            </div>

            {/* Project Requirements */}
            <div className="bg-gray-50 rounded-xl p-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Project Requirements</h4>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Project Type</label>
                  <p className="text-gray-900 flex items-center gap-2">
                    <span className="text-lg">{submission.project_type === 'Business Website' ? '🌐' : 
                                                submission.project_type === 'Landing Page' ? '📄' :
                                                submission.project_type === 'SaaS Product' ? '⚡' :
                                                submission.project_type === 'Custom Software' ? '💻' : '📋'}</span>
                    {submission.project_type}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Budget Range</label>
                  <p className="text-lg font-medium text-green-600">{submission.budget}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Project Description</label>
                  <p className="text-gray-900 leading-relaxed">{submission.description}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Referral Information & Actions */}
          <div className="space-y-6">
            {/* Referral Attribution */}
            {submission.referral_code && referrer ? (
              <div className="bg-purple-50 rounded-xl p-6 border border-purple-200">
                <h4 className="text-lg font-semibold text-purple-900 mb-4 flex items-center gap-2">
                  <Star className="w-5 h-5" />
                  Referral Attribution
                </h4>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-purple-600">Referral Code</label>
                    <p className="text-lg font-bold text-purple-900">{submission.referral_code}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-purple-600">Referrer</label>
                    <p className="text-purple-900 font-medium">{referrer.name}</p>
                    <p className="text-sm text-purple-700">{referrer.contact_info}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-purple-600">Total Referrals</label>
                      <p className="text-lg font-bold text-purple-900">{referrer.total_referrals}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-purple-600">Commission Rate</label>
                      <p className="text-lg font-bold text-purple-900">{referrer.commission_rate}%</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 rounded-xl p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-2">Direct Submission</h4>
                <p className="text-gray-600">This submission came directly without a referral code.</p>
              </div>
            )}

            {/* Actions */}
            <div className="bg-gray-50 rounded-xl p-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h4>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-600 mb-2 block">Update Status</label>
                  <select
                    value={submission.status}
                    onChange={(e) => onStatusUpdate(e.target.value)}
                    disabled={isConverting}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                  >
                    <option value="new">New</option>
                    <option value="contacted">Contacted</option>
                    <option value="converted">Converted</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
                
                <div className="grid grid-cols-2 gap-3 pt-4">
                  <button
                    onClick={() => window.open(`mailto:${submission.email}`, '_blank')}
                    className="flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Mail className="w-4 h-4" />
                    Send Email
                  </button>
                  <button
                    onClick={onConvert}
                    disabled={isConverting || isAlreadyConverted}
                    className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                      isAlreadyConverted
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : isConverting
                        ? 'bg-gray-300 text-gray-500 cursor-wait'
                        : 'bg-green-600 text-white hover:bg-green-700'
                    }`}
                  >
                    {isConverting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Converting...
                      </>
                    ) : isAlreadyConverted ? (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        Converted
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4" />
                        Convert
                      </>
                    )}
                  </button>
                </div>
                
                {isAlreadyConverted && (
                  <div className="mt-3 p-3 bg-green-100 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-800 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      This form has already been converted to a customer
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

// Follow-up Detail Modal Component
const FollowUpDetailModal: React.FC<{
  followUp: FollowUp;
  onClose: () => void;
  onComplete: (notes?: string) => void;
  onStatusUpdate: (status: string) => void;
}> = ({ followUp, onClose, onComplete, onStatusUpdate }) => {
  const [completionNotes, setCompletionNotes] = useState('');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-gray-900">Follow-up Details</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Contact Info */}
          <div className="bg-gray-50 rounded-xl p-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h4>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-600">Name</label>
                <p className="text-gray-900 font-medium">{followUp.contact_name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Email</label>
                <p className="text-gray-900">{followUp.contact_email}</p>
              </div>
              {followUp.contact_phone && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Phone</label>
                  <p className="text-gray-900">{followUp.contact_phone}</p>
                </div>
              )}
              <div>
                <label className="text-sm font-medium text-gray-600">Project Type</label>
                <p className="text-gray-900">{followUp.project_type}</p>
              </div>
            </div>
          </div>

          {/* Follow-up Details */}
          <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
            <h4 className="text-lg font-semibold text-blue-900 mb-4">Follow-up Details</h4>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-blue-600">Follow-up Date</label>
                  <p className={`text-blue-900 font-medium ${followUp.is_overdue ? 'text-red-600' : ''}`}>
                    {format(parseISO(followUp.next_followup_date), 'MMMM dd, yyyy')}
                  </p>
                  <p className="text-xs text-blue-700">
                    {followUp.days_until_followup === 0 ? 'Today' :
                     followUp.days_until_followup < 0 ? `${Math.abs(followUp.days_until_followup)} days overdue` :
                     `In ${followUp.days_until_followup} days`}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-blue-600">Priority</label>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${
                    followUp.priority === 'urgent' ? 'bg-red-100 text-red-800 border-red-200' :
                    followUp.priority === 'high' ? 'bg-orange-100 text-orange-800 border-orange-200' :
                    followUp.priority === 'medium' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                    'bg-green-100 text-green-800 border-green-200'
                  }`}>
                    {followUp.priority.charAt(0).toUpperCase() + followUp.priority.slice(1)}
                  </span>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-blue-600">Notes</label>
                <p className="text-blue-900">{followUp.followup_notes || 'No notes provided'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-blue-600">Status</label>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  followUp.is_overdue ? 'bg-red-100 text-red-800' :
                  followUp.followup_status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                  followUp.followup_status === 'completed' ? 'bg-green-100 text-green-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {followUp.is_overdue ? 'Overdue' : followUp.followup_status.charAt(0).toUpperCase() + followUp.followup_status.slice(1)}
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-gray-900">Actions</h4>
            
            {/* Contact Status Update */}
            <div>
              <label className="text-sm font-medium text-gray-600 mb-2 block">Update Contact Status</label>
              <select
                value={followUp.contact_status}
                onChange={(e) => onStatusUpdate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="new">New</option>
                <option value="contacted">Contacted</option>
                <option value="converted">Converted</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            {/* Complete Follow-up */}
            {followUp.followup_status === 'scheduled' && (
              <div>
                <label className="text-sm font-medium text-gray-600 mb-2 block">Complete Follow-up</label>
                <textarea
                  value={completionNotes}
                  onChange={(e) => setCompletionNotes(e.target.value)}
                  placeholder="Add completion notes (optional)..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-3"
                />
                <button
                  onClick={() => onComplete(completionNotes)}
                  className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  Mark as Completed
                </button>
              </div>
            )}

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => window.open(`mailto:${followUp.contact_email}`, '_blank')}
                className="flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Mail className="w-4 h-4" />
                Send Email
              </button>
              {followUp.contact_phone && (
                <button
                  onClick={() => window.open(`tel:${followUp.contact_phone}`, '_blank')}
                  className="flex items-center justify-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Phone className="w-4 h-4" />
                  Call
                </button>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

// Create Follow-up Modal Component
const CreateFollowUpModal: React.FC<{
  submission: FormSubmission;
  followUpForm: any;
  setFollowUpForm: (form: any) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}> = ({ submission, followUpForm, setFollowUpForm, onSubmit, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl p-8 w-full max-w-md"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900">Schedule Follow-up</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="mb-4 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-600">Contact: {submission.name}</p>
          <p className="text-sm text-blue-600">Email: {submission.email}</p>
          <p className="text-sm text-blue-600">Project: {submission.project_type}</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Next Follow-up Date *</label>
            <input
              type="date"
              required
              value={followUpForm.next_followup_date}
              onChange={(e) => setFollowUpForm({...followUpForm, next_followup_date: e.target.value})}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Priority *</label>
            <select
              required
              value={followUpForm.priority}
              onChange={(e) => setFollowUpForm({...followUpForm, priority: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
            <textarea
              rows={3}
              value={followUpForm.notes}
              onChange={(e) => setFollowUpForm({...followUpForm, notes: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Add follow-up notes..."
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
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
            >
              <CalendarPlus className="w-4 h-4" />
              Schedule
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

// Email Modal Component
const EmailModal: React.FC<{
  submission: FormSubmission;
  onClose: () => void;
}> = ({ submission, onClose }) => {
  const [subject, setSubject] = useState(`Re: ${submission.project_type} Project Inquiry`);
  const [message, setMessage] = useState(
    `Hi ${submission.name},\n\nThank you for your interest in ${submission.project_type} services. I've reviewed your project requirements and would love to discuss how I can help bring your vision to life.\n\nBest regards,\nJohn Smilin DS`
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSendEmail = async () => {
    setIsSubmitting(true);
    try {
      await emailjs.send(
        'service_3reet0s',
        'template_ozwduiu',
        {
          from_name: 'John Smilin DS',
          from_email: 'Johnsmilin6@gmail.com',
          to_email: submission.email,
          subject: subject,
          message: message,
          phone: submission.phone || 'Not provided',
          project_type: submission.project_type,
          budget: submission.budget || 'Not specified',
          referral_code: submission.referral_code || 'None',
          timeline: 'Not specified'
        },
        '1D5Q1owXLWze9SCAo'
      );
      toast.success('Email sent successfully!');
      onClose();
    } catch (error) {
      console.error('Error sending email:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to send email. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl p-8 w-full max-w-2xl"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900">Send Email</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              To:
            </label>
            <input
              type="email"
              value={submission.email}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Subject:
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Message:
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSendEmail}
              disabled={isSubmitting}
              className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Send
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default FormsManagement;