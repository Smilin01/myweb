import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Download, Eye, Edit, Trash2, X, Save, Calendar, DollarSign, FileText, User } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { toast } from '../ui/toast';
import jsPDF from 'jspdf';
import { format } from 'date-fns';

interface Invoice {
  id: string;
  customer_id: string;
  invoice_number: string;
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  total: number;
  status: string;
  created_at: string;
  due_date: string;
}

interface InvoiceItem {
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
}

const InvoiceGenerator: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  
  const [newInvoice, setNewInvoice] = useState({
    customer_id: '',
    items: [{ description: '', quantity: 1, rate: 0, amount: 0 }],
    tax: 0,
    due_date: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [invoicesRes, customersRes] = await Promise.all([
        supabase.from('invoices').select('*').order('created_at', { ascending: false }),
        supabase.from('customers').select('id, name, email, phone')
      ]);

      setInvoices(invoicesRes.data || []);
      setCustomers(customersRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const generateInvoiceNumber = (): string => {
    const prefix = 'INV';
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${prefix}-${year}${month}-${random}`;
  };

  const calculateItemAmount = (quantity: number, rate: number): number => {
    return quantity * rate;
  };

  const calculateSubtotal = (items: InvoiceItem[]): number => {
    return items.reduce((sum, item) => sum + item.amount, 0);
  };

  const handleItemChange = (index: number, field: keyof InvoiceItem, value: any, isEdit = false) => {
    const targetInvoice = isEdit ? editingInvoice : newInvoice;
    const setTargetInvoice = isEdit ? setEditingInvoice : setNewInvoice;
    
    if (!targetInvoice) return;
    
    const updatedItems = [...targetInvoice.items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    
    if (field === 'quantity' || field === 'rate') {
      updatedItems[index].amount = calculateItemAmount(
        updatedItems[index].quantity,
        updatedItems[index].rate
      );
    }
    
    setTargetInvoice({ ...targetInvoice, items: updatedItems });
  };

  const addItem = (isEdit = false) => {
    const targetInvoice = isEdit ? editingInvoice : newInvoice;
    const setTargetInvoice = isEdit ? setEditingInvoice : setNewInvoice;
    
    if (!targetInvoice) return;
    
    setTargetInvoice({
      ...targetInvoice,
      items: [...targetInvoice.items, { description: '', quantity: 1, rate: 0, amount: 0 }]
    });
  };

  const removeItem = (index: number, isEdit = false) => {
    const targetInvoice = isEdit ? editingInvoice : newInvoice;
    const setTargetInvoice = isEdit ? setEditingInvoice : setNewInvoice;
    
    if (!targetInvoice) return;
    
    const updatedItems = targetInvoice.items.filter((_, i) => i !== index);
    setTargetInvoice({ ...targetInvoice, items: updatedItems });
  };

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const subtotal = calculateSubtotal(newInvoice.items);
      const total = subtotal + newInvoice.tax;
      
      const { error } = await supabase
        .from('invoices')
        .insert([{
          customer_id: newInvoice.customer_id,
          invoice_number: generateInvoiceNumber(),
          items: newInvoice.items,
          subtotal,
          tax: newInvoice.tax,
          total,
          status: 'pending',
          due_date: newInvoice.due_date
        }]);

      if (error) throw error;
      
      toast.success('Invoice created successfully');
      setShowCreateModal(false);
      setNewInvoice({
        customer_id: '',
        items: [{ description: '', quantity: 1, rate: 0, amount: 0 }],
        tax: 0,
        due_date: ''
      });
      fetchData();
    } catch (error) {
      console.error('Error creating invoice:', error);
      toast.error('Failed to create invoice');
    }
  };

  const handleEditInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingInvoice) return;
    
    try {
      const subtotal = calculateSubtotal(editingInvoice.items);
      const total = subtotal + editingInvoice.tax;
      
      const { error } = await supabase
        .from('invoices')
        .update({
          customer_id: editingInvoice.customer_id,
          items: editingInvoice.items,
          subtotal,
          tax: editingInvoice.tax,
          total,
          due_date: editingInvoice.due_date,
          status: editingInvoice.status
        })
        .eq('id', editingInvoice.id);

      if (error) throw error;
      
      toast.success('Invoice updated successfully');
      setShowEditModal(false);
      setEditingInvoice(null);
      fetchData();
    } catch (error) {
      console.error('Error updating invoice:', error);
      toast.error('Failed to update invoice');
    }
  };

  const handleDeleteInvoice = async (id: string) => {
    if (!confirm('Are you sure you want to delete this invoice? This action cannot be undone.')) return;

    try {
      const { error } = await supabase
        .from('invoices')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setInvoices(invoices.filter(inv => inv.id !== id));
      toast.success('Invoice deleted successfully');
    } catch (error) {
      console.error('Error deleting invoice:', error);
      toast.error('Failed to delete invoice');
    }
  };

  const updateInvoiceStatus = async (id: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('invoices')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;
      
      setInvoices(invoices.map(inv => 
        inv.id === id ? { ...inv, status: newStatus } : inv
      ));
      toast.success('Invoice status updated successfully');
    } catch (error) {
      console.error('Error updating invoice status:', error);
      toast.error('Failed to update invoice status');
    }
  };

  const generatePDF = (invoice: Invoice) => {
    const customer = customers.find(c => c.id === invoice.customer_id);
    const doc = new jsPDF();
    
    // Set up colors
    const primaryColor = [0, 0, 0]; // Black
    const secondaryColor = [128, 128, 128]; // Gray
    const accentColor = [0, 123, 255]; // Blue
    
    // Header Section
    doc.setFontSize(24);
    doc.setTextColor(...primaryColor);
    doc.text('Invoice', 20, 30);
    
    // Brand name (top right)
    doc.setFontSize(18);
    doc.setTextColor(...accentColor);
    doc.text('johnsmilin.', 150, 30);
    
    // Date
    doc.setFontSize(11);
    doc.setTextColor(...primaryColor);
    doc.text(format(new Date(invoice.created_at), 'dd MMMM yyyy'), 20, 50);
    
    // Billed To Section
    doc.setFontSize(9);
    doc.setTextColor(...secondaryColor);
    doc.text('BILLED TO', 20, 70);
    
    doc.setFontSize(11);
    doc.setTextColor(...primaryColor);
    doc.text(customer?.name || 'Unknown Customer', 20, 80);
    doc.text('Full address of the place', 20, 88);
    doc.text('Country, Pincode', 20, 96);
    
    // Payable To Section
    doc.setFontSize(9);
    doc.setTextColor(...secondaryColor);
    doc.text('PAYABLE TO', 120, 70);
    
    doc.setFontSize(11);
    doc.setTextColor(...primaryColor);
    doc.text('John Smilin DS', 120, 80);
    doc.text('Full address of the place', 120, 88);
    doc.text('Country, Pincode', 120, 96);
    
    // Table Header
    const tableStartY = 120;
    doc.setFontSize(11);
    doc.setTextColor(...primaryColor);
    
    // Draw table header line
    doc.line(20, tableStartY - 5, 190, tableStartY - 5);
    
    doc.text('ITEM', 20, tableStartY);
    doc.text('QTY', 100, tableStartY);
    doc.text('PRICE/QTY', 130, tableStartY);
    doc.text('TOTAL', 170, tableStartY);
    
    // Draw line under header
    doc.line(20, tableStartY + 5, 190, tableStartY + 5);
    
    // Table Items
    let currentY = tableStartY + 20;
    doc.setFontSize(11);
    
    invoice.items.forEach((item, index) => {
      // Service name
      doc.setTextColor(...primaryColor);
      doc.text(item.description, 20, currentY);
      
      // Service description (smaller text)
      doc.setFontSize(9);
      doc.setTextColor(...secondaryColor);
      doc.text('About the Service', 20, currentY + 8);
      
      // Quantity
      doc.setFontSize(11);
      doc.setTextColor(...primaryColor);
      doc.text(item.quantity.toString(), 100, currentY);
      
      // Price
      doc.text(`$ ${item.rate}`, 130, currentY);
      
      // Total
      doc.text(`$ ${item.amount}`, 170, currentY);
      
      currentY += 25;
    });
    
    // Total Section
    const totalY = currentY + 20;
    doc.setFontSize(16);
    doc.setTextColor(...primaryColor);
    doc.text('Total', 130, totalY);
    doc.text(`$ ${invoice.total}`, 170, totalY);
    
    // Footer Section (Payment Methods & Contact Details)
    const footerY = 220;
    
    // Set background color for footer
    doc.setFillColor(40, 40, 40);
    doc.rect(0, footerY, 210, 77, 'F');
    
    // Payment Methods
    doc.setFontSize(9);
    doc.setTextColor(200, 200, 200);
    doc.text('PAYMENT METHODS', 20, footerY + 15);
    
    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255);
    doc.text('Bank Name : Your Bank Name', 20, footerY + 25);
    doc.text('Account Number : Your Number', 20, footerY + 33);
    doc.text('IFSC Code : Code Number', 20, footerY + 41);
    doc.text('', 20, footerY + 49);
    doc.text('Paypal : paypal.me/username', 20, footerY + 57);
    doc.text('', 20, footerY + 65);
    doc.text('UPI : id@okicic.com', 20, footerY + 73);
    
    // Contact Details
    doc.setFontSize(9);
    doc.setTextColor(200, 200, 200);
    doc.text('CONTACT DETAILS', 120, footerY + 15);
    
    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255);
    doc.text('johnsmilin6@gmail.com', 120, footerY + 25);
    doc.text('+91 9772395492', 120, footerY + 33);
    doc.text('johnsmilinds.com', 120, footerY + 41);
    
    // Social Media Icons (represented as text)
    doc.setFontSize(12);
    doc.text('in', 120, footerY + 55);
    doc.text('@', 130, footerY + 55);
    
    doc.save(`invoice-${invoice.invoice_number}.pdf`);
    toast.success('Invoice PDF downloaded successfully!');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
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
          <h1 className="text-3xl font-bold text-gray-900">Invoice Generator</h1>
          <p className="text-gray-600 mt-2">Create and manage professional invoices</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Create Invoice
        </button>
      </div>

      {/* Invoices List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Invoice #
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Due Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {invoices.map((invoice) => {
                const customer = customers.find(c => c.id === invoice.customer_id);
                return (
                  <motion.tr
                    key={invoice.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {invoice.invoice_number}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{customer?.name || 'Unknown'}</div>
                      <div className="text-sm text-gray-500">{customer?.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${invoice.total.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={invoice.status}
                        onChange={(e) => updateInvoiceStatus(invoice.id, e.target.value)}
                        className={`px-2 py-1 rounded-full text-xs font-medium border-0 ${getStatusColor(invoice.status)}`}
                      >
                        <option value="draft">Draft</option>
                        <option value="pending">Pending</option>
                        <option value="paid">Paid</option>
                        <option value="overdue">Overdue</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {format(new Date(invoice.due_date), 'MMM dd, yyyy')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => {
                            setSelectedInvoice(invoice);
                            setShowViewModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-900"
                          title="View Invoice"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => {
                            setEditingInvoice(invoice);
                            setShowEditModal(true);
                          }}
                          className="text-gray-600 hover:text-gray-900"
                          title="Edit Invoice"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => generatePDF(invoice)}
                          className="text-green-600 hover:text-green-900"
                          title="Download PDF"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteInvoice(invoice.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete Invoice"
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

      {invoices.length === 0 && (
        <div className="text-center py-12">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <div className="text-gray-500">No invoices created yet. Create your first invoice to get started!</div>
        </div>
      )}

      {/* View Invoice Modal */}
      {showViewModal && selectedInvoice && (
        <ViewInvoiceModal
          invoice={selectedInvoice}
          customer={customers.find(c => c.id === selectedInvoice.customer_id)}
          onClose={() => setShowViewModal(false)}
          onDownload={() => generatePDF(selectedInvoice)}
        />
      )}

      {/* Create Invoice Modal */}
      {showCreateModal && (
        <InvoiceModal
          title="Create New Invoice"
          invoice={newInvoice}
          setInvoice={setNewInvoice}
          customers={customers}
          onSubmit={handleCreateInvoice}
          onClose={() => setShowCreateModal(false)}
          onItemChange={handleItemChange}
          onAddItem={addItem}
          onRemoveItem={removeItem}
          calculateSubtotal={calculateSubtotal}
        />
      )}

      {/* Edit Invoice Modal */}
      {showEditModal && editingInvoice && (
        <InvoiceModal
          title="Edit Invoice"
          invoice={editingInvoice}
          setInvoice={setEditingInvoice}
          customers={customers}
          onSubmit={handleEditInvoice}
          onClose={() => setShowEditModal(false)}
          onItemChange={(index, field, value) => handleItemChange(index, field, value, true)}
          onAddItem={() => addItem(true)}
          onRemoveItem={(index) => removeItem(index, true)}
          calculateSubtotal={calculateSubtotal}
          isEdit={true}
        />
      )}
    </div>
  );
};

// View Invoice Modal Component
const ViewInvoiceModal: React.FC<{
  invoice: Invoice;
  customer?: Customer;
  onClose: () => void;
  onDownload: () => void;
}> = ({ invoice, customer, onClose, onDownload }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl p-8 w-full max-w-4xl max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-gray-900">Invoice Details</h3>
          <div className="flex items-center gap-3">
            <button
              onClick={onDownload}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Download PDF
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Invoice Information */}
          <div className="space-y-6">
            <div className="bg-gray-50 rounded-xl p-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Invoice Information
              </h4>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-600">Invoice Number</label>
                  <p className="text-lg font-bold text-gray-900">{invoice.invoice_number}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Created Date</label>
                    <p className="text-gray-900">{format(new Date(invoice.created_at), 'MMM dd, yyyy')}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Due Date</label>
                    <p className="text-gray-900 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      {format(new Date(invoice.due_date), 'MMM dd, yyyy')}
                    </p>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Status</label>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    invoice.status === 'paid' ? 'bg-green-100 text-green-800' :
                    invoice.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    invoice.status === 'overdue' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                  </span>
                </div>
              </div>
            </div>

            {/* Customer Information */}
            <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
              <h4 className="text-lg font-semibold text-blue-900 mb-4 flex items-center gap-2">
                <User className="w-5 h-5" />
                Customer Information
              </h4>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-blue-600">Name</label>
                  <p className="text-blue-900 font-medium">{customer?.name || 'Unknown Customer'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-blue-600">Email</label>
                  <p className="text-blue-900">{customer?.email || 'N/A'}</p>
                </div>
                {customer?.phone && (
                  <div>
                    <label className="text-sm font-medium text-blue-600">Phone</label>
                    <p className="text-blue-900">{customer.phone}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Invoice Items and Totals */}
          <div className="space-y-6">
            <div className="bg-gray-50 rounded-xl p-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Invoice Items</h4>
              <div className="space-y-3">
                {invoice.items.map((item, index) => (
                  <div key={index} className="bg-white rounded-lg p-4 border border-gray-200">
                    <div className="flex justify-between items-start mb-2">
                      <h5 className="font-medium text-gray-900">{item.description}</h5>
                      <span className="font-bold text-gray-900">${item.amount.toFixed(2)}</span>
                    </div>
                    <div className="text-sm text-gray-600">
                      Quantity: {item.quantity} × Rate: ${item.rate.toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Totals */}
            <div className="bg-green-50 rounded-xl p-6 border border-green-200">
              <h4 className="text-lg font-semibold text-green-900 mb-4 flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Invoice Totals
              </h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-green-600">Subtotal:</span>
                  <span className="font-medium text-green-900">${invoice.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-600">Tax:</span>
                  <span className="font-medium text-green-900">${invoice.tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t border-green-200 pt-3">
                  <span className="text-green-900">Total:</span>
                  <span className="text-green-900">${invoice.total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

// Invoice Modal Component (for Create/Edit)
const InvoiceModal: React.FC<{
  title: string;
  invoice: any;
  setInvoice: (invoice: any) => void;
  customers: Customer[];
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
  onItemChange: (index: number, field: keyof InvoiceItem, value: any) => void;
  onAddItem: () => void;
  onRemoveItem: (index: number) => void;
  calculateSubtotal: (items: InvoiceItem[]) => number;
  isEdit?: boolean;
}> = ({ 
  title, 
  invoice, 
  setInvoice, 
  customers, 
  onSubmit, 
  onClose, 
  onItemChange, 
  onAddItem, 
  onRemoveItem, 
  calculateSubtotal,
  isEdit = false 
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl p-8 w-full max-w-4xl max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Customer *
              </label>
              <select
                required
                value={invoice.customer_id}
                onChange={(e) => setInvoice({...invoice, customer_id: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select customer</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name} ({customer.email})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Due Date *
              </label>
              <input
                type="date"
                required
                value={invoice.due_date}
                onChange={(e) => setInvoice({...invoice, due_date: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {isEdit && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={invoice.status}
                  onChange={(e) => setInvoice({...invoice, status: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="draft">Draft</option>
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                  <option value="overdue">Overdue</option>
                </select>
              </div>
            )}
          </div>

          {/* Items */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-medium text-gray-900">Items</h4>
              <button
                type="button"
                onClick={onAddItem}
                className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1"
              >
                <Plus className="w-4 h-4" />
                Add Item
              </button>
            </div>
            
            <div className="space-y-4">
              {invoice.items.map((item: InvoiceItem, index: number) => (
                <div key={index} className="grid grid-cols-12 gap-4 items-end">
                  <div className="col-span-5">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <input
                      type="text"
                      required
                      value={item.description}
                      onChange={(e) => onItemChange(index, 'description', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Item description"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Qty
                    </label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={item.quantity}
                      onChange={(e) => onItemChange(index, 'quantity', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Rate
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      required
                      value={item.rate}
                      onChange={(e) => onItemChange(index, 'rate', parseFloat(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Amount
                    </label>
                    <input
                      type="text"
                      value={`$${item.amount.toFixed(2)}`}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                    />
                  </div>
                  <div className="col-span-1">
                    {invoice.items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => onRemoveItem(index)}
                        className="text-red-600 hover:text-red-700 p-2"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Totals */}
          <div className="border-t pt-4">
            <div className="flex justify-end">
              <div className="w-64 space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>${calculateSubtotal(invoice.items).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Tax:</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={invoice.tax}
                    onChange={(e) => setInvoice({...invoice, tax: parseFloat(e.target.value) || 0})}
                    className="w-20 px-2 py-1 border border-gray-300 rounded text-right"
                  />
                </div>
                <div className="flex justify-between font-bold text-lg border-t pt-2">
                  <span>Total:</span>
                  <span>${(calculateSubtotal(invoice.items) + invoice.tax).toFixed(2)}</span>
                </div>
              </div>
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
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              {isEdit ? 'Update Invoice' : 'Create Invoice'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default InvoiceGenerator;