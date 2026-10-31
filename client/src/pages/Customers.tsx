import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Users,
  Search,
  Plus,
  Building,
  Mail,
  Phone,
  Receipt,
  Repeat,
  Banknote,
  Clock,
  Trash2,
  Edit,
  ExternalLink,
  MapPin,
  CheckCircle2,
  XCircle,
  FileText
} from 'lucide-react';
import { customerApi } from '../services/api';
import { Customer } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import { Modal } from '../components/common/Modal';
import { SkeletonLoader } from '../components/common/SkeletonLoader';
import { EmptyState } from '../components/common/EmptyState';
import { formatINR, formatDate, formatDateTime } from '../utils/formatters';

export const Customers: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchParams, setSearchParams] = useSearchParams();

  // Selected customer for detail drawer
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [customerDetails, setCustomerDetails] = useState<any>(null);
  const [timelineEvents, setTimelineEvents] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'subscriptions' | 'invoices' | 'payments' | 'timeline'>('overview');
  const [detailLoading, setDetailLoading] = useState(false);

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    email: '',
    phone: '',
    gstNumber: '',
    line1: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'India',
    notes: ''
  });

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const res = await customerApi.list({ search, status: statusFilter });
      if (res.data.success) {
        setCustomers(res.data.customers);
      }
    } catch (err) {
      console.error('Failed to load customers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, [search, statusFilter]);

  // Check URL query params for auto-open actions
  useEffect(() => {
    const action = searchParams.get('action');
    const id = searchParams.get('id');
    if (action === 'new') {
      setCreateModalOpen(true);
    }
    if (id) {
      handleOpenCustomer(id);
    }
  }, [searchParams]);

  const handleOpenCustomer = async (id: string) => {
    setSelectedCustomerId(id);
    setDetailLoading(true);
    try {
      const [detailRes, timelineRes] = await Promise.all([
        customerApi.get(id),
        customerApi.getTimeline(id)
      ]);
      if (detailRes.data.success) setCustomerDetails(detailRes.data);
      if (timelineRes.data.success) setTimelineEvents(timelineRes.data.events);
    } catch (err) {
      console.error('Failed to load customer details:', err);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMessage('');
    try {
      const res = await customerApi.create({
        name: formData.name,
        company: formData.company,
        email: formData.email,
        phone: formData.phone,
        gstNumber: formData.gstNumber,
        billingAddress: {
          line1: formData.line1,
          city: formData.city,
          state: formData.state,
          postalCode: formData.postalCode,
          country: formData.country
        },
        notes: formData.notes
      });
      if (res.data.success) {
        setCreateModalOpen(false);
        resetForm();
        loadCustomers();
      }
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'Failed to create customer');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId) return;
    setSubmitting(true);
    setErrorMessage('');
    try {
      const res = await customerApi.update(selectedCustomerId, {
        name: formData.name,
        company: formData.company,
        email: formData.email,
        phone: formData.phone,
        gstNumber: formData.gstNumber,
        billingAddress: {
          line1: formData.line1,
          city: formData.city,
          state: formData.state,
          postalCode: formData.postalCode,
          country: formData.country
        },
        notes: formData.notes
      });
      if (res.data.success) {
        setEditModalOpen(false);
        handleOpenCustomer(selectedCustomerId);
        loadCustomers();
      }
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'Failed to update customer');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedCustomerId) return;
    setSubmitting(true);
    setErrorMessage('');
    try {
      const res = await customerApi.delete(selectedCustomerId);
      if (res.data.success) {
        setDeleteConfirmOpen(false);
        setSelectedCustomerId(null);
        setCustomerDetails(null);
        loadCustomers();
      }
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'Failed to delete customer');
    } finally {
      setSubmitting(false);
    }
  };

  const startEdit = (c: any) => {
    setFormData({
      name: c.name || '',
      company: c.company || '',
      email: c.email || '',
      phone: c.phone || '',
      gstNumber: c.gstNumber || '',
      line1: c.billingAddress?.line1 || '',
      city: c.billingAddress?.city || '',
      state: c.billingAddress?.state || '',
      postalCode: c.billingAddress?.postalCode || '',
      country: c.billingAddress?.country || 'India',
      notes: c.notes || ''
    });
    setEditModalOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      company: '',
      email: '',
      phone: '',
      gstNumber: '',
      line1: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'India',
      notes: ''
    });
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-bordergrey">
        <div>
          <h2 className="text-xl font-bold text-obsidian tracking-tight">Customer Management</h2>
          <p className="text-xs text-slategrey mt-0.5">
            Directory of corporate client accounts, billing entities, and unified engagement history.
          </p>
        </div>

        <button
          onClick={() => { resetForm(); setCreateModalOpen(true); }}
          className="flex items-center gap-1.5 rounded-lg bg-obsidian px-3.5 py-2 text-xs font-semibold text-white shadow-subtle hover:bg-forest transition-colors shrink-0"
        >
          <Plus className="h-4 w-4 text-chartreuse" />
          <span>Add Customer</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slategrey" />
          <input
            type="text"
            placeholder="Search by customer name, company, email, or GST..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-bordergrey bg-white pl-9 pr-4 py-2 text-xs text-obsidian placeholder:text-slategrey outline-none focus:border-forest shadow-subtle"
          />
        </div>

        <div className="flex items-center rounded-xl border border-bordergrey bg-white p-1 shadow-subtle text-xs shrink-0">
          {(['All', 'Active', 'Inactive'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1 font-semibold rounded-lg transition-all ${
                statusFilter === status
                  ? 'bg-obsidian text-chartreuse shadow-xs'
                  : 'text-slategrey hover:text-obsidian'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Main Customers Table */}
      {loading ? (
        <SkeletonLoader rows={6} />
      ) : customers.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No customers found"
          description="Get started by creating your first enterprise client or adjust search criteria."
          actionText="Add Customer"
          onAction={() => { resetForm(); setCreateModalOpen(true); }}
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-bordergrey bg-white shadow-subtle">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-ivory border-b border-bordergrey text-[11px] font-bold uppercase tracking-wider text-slategrey">
                <tr>
                  <th className="px-5 py-3.5">Customer & ID</th>
                  <th className="px-5 py-3.5">Company</th>
                  <th className="px-5 py-3.5">GST Number</th>
                  <th className="px-5 py-3.5">Active Subs</th>
                  <th className="px-5 py-3.5">Lifetime Revenue</th>
                  <th className="px-5 py-3.5">Outstanding</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-bordergrey">
                {customers.map((c) => (
                  <tr
                    key={c._id}
                    className="hover:bg-ivory/50 transition-colors cursor-pointer group"
                    onClick={() => handleOpenCustomer(c._id)}
                  >
                    <td className="px-5 py-4">
                      <div className="font-semibold text-obsidian group-hover:text-forest transition-colors">
                        {c.name}
                      </div>
                      <div className="text-[11px] text-slategrey">{c.customerNumber} • {c.email}</div>
                    </td>
                    <td className="px-5 py-4 text-obsidian font-medium">
                      {c.company || '—'}
                    </td>
                    <td className="px-5 py-4 font-mono text-[11px] text-slategrey">
                      {c.gstNumber || 'Unregistered'}
                    </td>
                    <td className="px-5 py-4 font-semibold text-obsidian tabular-nums">
                      {c.activeSubscriptionsCount || 0}
                    </td>
                    <td className="px-5 py-4 font-bold text-obsidian tabular-nums">
                      {formatINR(c.totalRevenueInPaise || 0)}
                    </td>
                    <td className="px-5 py-4 font-semibold text-rose-700 tabular-nums">
                      {formatINR(c.totalOutstandingInPaise || 0)}
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={c.status} size="sm" />
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleOpenCustomer(c._id); }}
                        className="p-1.5 rounded-lg text-forest hover:bg-ivory border border-transparent hover:border-bordergrey transition-colors"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Customer Detail Drawer / Modal */}
      {selectedCustomerId && (
        <Modal
          isOpen={!!selectedCustomerId}
          onClose={() => { setSelectedCustomerId(null); setCustomerDetails(null); }}
          title={customerDetails?.customer?.name || 'Customer Account Profile'}
          subtitle={`${customerDetails?.customer?.company || ''} • ${customerDetails?.customer?.customerNumber || ''}`}
          maxWidth="4xl"
        >
          {detailLoading || !customerDetails ? (
            <SkeletonLoader rows={4} />
          ) : (
            <div className="space-y-6">
              {/* Financial Snapshot Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-ivory border border-bordergrey">
                <div>
                  <span className="text-[10px] font-bold uppercase text-slategrey">Total Revenue</span>
                  <p className="text-base font-bold text-obsidian tabular-nums mt-0.5">
                    {formatINR(customerDetails.stats.totalRevenueInPaise)}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-slategrey">Outstanding Due</span>
                  <p className="text-base font-bold text-rose-700 tabular-nums mt-0.5">
                    {formatINR(customerDetails.stats.totalOutstandingInPaise)}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-slategrey">Subscriptions</span>
                  <p className="text-base font-bold text-obsidian tabular-nums mt-0.5">
                    {customerDetails.stats.subscriptionsCount}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-slategrey">GST Reg</span>
                  <p className="text-xs font-mono font-medium text-forest truncate mt-1">
                    {customerDetails.customer.gstNumber || 'Consumer'}
                  </p>
                </div>
              </div>

              {/* Navigation Tabs */}
              <div className="flex border-b border-bordergrey gap-6 text-xs">
                {(['overview', 'subscriptions', 'invoices', 'payments', 'timeline'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`pb-2.5 font-semibold capitalize transition-colors relative ${
                      activeTab === tab ? 'text-forest border-b-2 border-forest' : 'text-slategrey hover:text-obsidian'
                    }`}
                  >
                    {tab === 'timeline' ? '⚡ Unified Timeline' : tab}
                  </button>
                ))}
              </div>

              {/* Tab 1: Overview */}
              {activeTab === 'overview' && (
                <div className="space-y-4 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl border border-bordergrey bg-white space-y-2">
                      <h4 className="font-bold uppercase tracking-wider text-slategrey text-[10px]">Contact Info</h4>
                      <p className="flex items-center gap-2 text-obsidian"><Mail className="h-3.5 w-3.5 text-sage" /> {customerDetails.customer.email}</p>
                      <p className="flex items-center gap-2 text-obsidian"><Phone className="h-3.5 w-3.5 text-sage" /> {customerDetails.customer.phone || 'Not provided'}</p>
                      <p className="flex items-center gap-2 text-obsidian"><Building className="h-3.5 w-3.5 text-sage" /> {customerDetails.customer.company || 'Individual account'}</p>
                    </div>

                    <div className="p-4 rounded-xl border border-bordergrey bg-white space-y-2">
                      <h4 className="font-bold uppercase tracking-wider text-slategrey text-[10px]">Billing Address</h4>
                      <p className="flex items-start gap-2 text-obsidian">
                        <MapPin className="h-3.5 w-3.5 text-sage shrink-0 mt-0.5" />
                        <span>
                          {customerDetails.customer.billingAddress?.line1 || 'No street specified'}<br />
                          {customerDetails.customer.billingAddress?.city}, {customerDetails.customer.billingAddress?.state} {customerDetails.customer.billingAddress?.postalCode}<br />
                          {customerDetails.customer.billingAddress?.country || 'India'}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-bordergrey">
                    <button
                      onClick={() => startEdit(customerDetails.customer)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-bordergrey hover:bg-ivory text-xs font-semibold text-obsidian transition-colors"
                    >
                      <Edit className="h-3.5 w-3.5 text-forest" />
                      <span>Edit Customer Details</span>
                    </button>

                    <button
                      onClick={() => setDeleteConfirmOpen(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Delete Customer</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Tab 2: Subscriptions */}
              {activeTab === 'subscriptions' && (
                <div className="space-y-3">
                  {customerDetails.subscriptions.length === 0 ? (
                    <p className="py-8 text-center text-xs text-slategrey">No subscriptions linked to this customer.</p>
                  ) : (
                    <div className="divide-y divide-bordergrey rounded-xl border border-bordergrey overflow-hidden">
                      {customerDetails.subscriptions.map((s: any) => (
                        <div key={s._id} className="p-3.5 flex items-center justify-between text-xs bg-white hover:bg-ivory/50">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-obsidian">{s.subscriptionNumber}</span>
                              <StatusBadge status={s.status} size="sm" />
                            </div>
                            <p className="text-slategrey text-[11px] mt-0.5">
                              {s.productId?.name} — {s.planId?.name} ({s.billingInterval})
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-obsidian tabular-nums">{formatINR(s.unitPriceInPaise * (s.quantity || 1))}</p>
                            <span className="text-[11px] text-slategrey">Renews {formatDate(s.nextBillingDate)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Tab 3: Invoices */}
              {activeTab === 'invoices' && (
                <div className="space-y-3">
                  {customerDetails.invoices.length === 0 ? (
                    <p className="py-8 text-center text-xs text-slategrey">No invoices recorded yet.</p>
                  ) : (
                    <div className="divide-y divide-bordergrey rounded-xl border border-bordergrey overflow-hidden">
                      {customerDetails.invoices.map((inv: any) => (
                        <div key={inv._id} className="p-3.5 flex items-center justify-between text-xs bg-white hover:bg-ivory/50">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-obsidian">{inv.invoiceNumber}</span>
                              <StatusBadge status={inv.status} size="sm" />
                            </div>
                            <p className="text-slategrey text-[11px] mt-0.5">Due: {formatDate(inv.dueDate)}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-obsidian tabular-nums">{formatINR(inv.totalAmountInPaise)}</p>
                            <span className="text-[11px] text-slategrey">Paid: {formatINR(inv.paidAmountInPaise)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Tab 4: Payments */}
              {activeTab === 'payments' && (
                <div className="space-y-3">
                  {customerDetails.payments.length === 0 ? (
                    <p className="py-8 text-center text-xs text-slategrey">No payments recorded yet.</p>
                  ) : (
                    <div className="divide-y divide-bordergrey rounded-xl border border-bordergrey overflow-hidden">
                      {customerDetails.payments.map((p: any) => (
                        <div key={p._id} className="p-3.5 flex items-center justify-between text-xs bg-white hover:bg-ivory/50">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-obsidian">{p.paymentNumber}</span>
                              <StatusBadge status={p.status} size="sm" />
                            </div>
                            <p className="text-slategrey text-[11px] mt-0.5">
                              {p.method} • Ref: {p.referenceNumber} • {formatDate(p.paymentDate)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-obsidian tabular-nums">{formatINR(p.amountInPaise)}</p>
                            <span className="text-[11px] text-emerald-800">Against {p.invoiceId?.invoiceNumber || 'Invoice'}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Tab 5: Unified Activity Timeline (Differentiator 4) */}
              {activeTab === 'timeline' && (
                <div className="space-y-4">
                  <p className="text-xs text-slategrey">
                    Consolidated, chronological audit of all commercial events, contract negotiations, renewals, and payments.
                  </p>

                  <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-bordergrey">
                    {timelineEvents.map((evt: any) => (
                      <div key={evt.id} className="relative group">
                        {/* Event icon dot */}
                        <div className="absolute -left-6 top-1 h-5 w-5 rounded-full border-2 border-white bg-forest flex items-center justify-center text-chartreuse shadow-xs">
                          {evt.type === 'QUOTATION' && <FileText className="h-2.5 w-2.5" />}
                          {evt.type === 'SUBSCRIPTION' && <Repeat className="h-2.5 w-2.5" />}
                          {evt.type === 'SUBSCRIPTION_LIFECYCLE' && <Clock className="h-2.5 w-2.5" />}
                          {evt.type === 'INVOICE' && <Receipt className="h-2.5 w-2.5" />}
                          {evt.type === 'PAYMENT' && <Banknote className="h-2.5 w-2.5" />}
                        </div>

                        <div className="rounded-xl border border-bordergrey bg-white p-3 shadow-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs text-obsidian">{evt.title}</span>
                            <span className="text-[10px] text-slategrey">{formatDateTime(evt.timestamp)}</span>
                          </div>
                          <p className="text-xs text-slategrey mt-1">{evt.description}</p>
                          {evt.performedBy && (
                            <span className="inline-block mt-1.5 text-[10px] text-forest font-semibold bg-ivory px-2 py-0.5 rounded">
                              Actor: {evt.performedBy}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </Modal>
      )}

      {/* Create Customer Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Add Enterprise Customer"
        subtitle="Create a new customer profile and billing address."
        maxWidth="lg"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
          {errorMessage && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 font-medium">
              {errorMessage}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-obsidian mb-1">Customer Full Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Arun Nair"
                className="w-full rounded-lg border border-bordergrey p-2 outline-none focus:border-forest"
              />
            </div>

            <div>
              <label className="block font-semibold text-obsidian mb-1">Company Name</label>
              <input
                type="text"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                placeholder="e.g. Vertex Media Technologies"
                className="w-full rounded-lg border border-bordergrey p-2 outline-none focus:border-forest"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-obsidian mb-1">Email Address *</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="arun@vertexmedia.in"
                className="w-full rounded-lg border border-bordergrey p-2 outline-none focus:border-forest"
              />
            </div>

            <div>
              <label className="block font-semibold text-obsidian mb-1">Phone Number</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+91 98450 12345"
                className="w-full rounded-lg border border-bordergrey p-2 outline-none focus:border-forest"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-obsidian mb-1">GSTIN Number (India)</label>
              <input
                type="text"
                value={formData.gstNumber}
                onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value.toUpperCase() })}
                placeholder="29AABCU9603R1ZM"
                className="w-full rounded-lg border border-bordergrey p-2 outline-none focus:border-forest font-mono uppercase"
              />
            </div>

            <div>
              <label className="block font-semibold text-obsidian mb-1">City & State</label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="Bengaluru, Karnataka"
                className="w-full rounded-lg border border-bordergrey p-2 outline-none focus:border-forest"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-obsidian mb-1">Street Address</label>
            <input
              type="text"
              value={formData.line1}
              onChange={(e) => setFormData({ ...formData, line1: e.target.value })}
              placeholder="e.g. 45 Embassy Golf Links"
              className="w-full rounded-lg border border-bordergrey p-2 outline-none focus:border-forest"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-bordergrey">
            <button
              type="button"
              onClick={() => setCreateModalOpen(false)}
              className="px-4 py-2 rounded-lg border border-bordergrey text-slategrey hover:bg-ivory"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded-lg bg-obsidian text-white font-semibold hover:bg-forest disabled:opacity-50"
            >
              {submitting ? 'Creating...' : 'Save Customer'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Customer Modal */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title="Edit Customer Profile"
        subtitle="Update contact and billing details."
        maxWidth="lg"
      >
        <form onSubmit={handleEditSubmit} className="space-y-4 text-xs">
          {errorMessage && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 font-medium">
              {errorMessage}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-obsidian mb-1">Customer Full Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full rounded-lg border border-bordergrey p-2 outline-none focus:border-forest"
              />
            </div>

            <div>
              <label className="block font-semibold text-obsidian mb-1">Company Name</label>
              <input
                type="text"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                className="w-full rounded-lg border border-bordergrey p-2 outline-none focus:border-forest"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-obsidian mb-1">Email Address *</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full rounded-lg border border-bordergrey p-2 outline-none focus:border-forest"
              />
            </div>

            <div>
              <label className="block font-semibold text-obsidian mb-1">Phone Number</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full rounded-lg border border-bordergrey p-2 outline-none focus:border-forest"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-obsidian mb-1">GSTIN Number</label>
              <input
                type="text"
                value={formData.gstNumber}
                onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value.toUpperCase() })}
                className="w-full rounded-lg border border-bordergrey p-2 outline-none focus:border-forest font-mono uppercase"
              />
            </div>

            <div>
              <label className="block font-semibold text-obsidian mb-1">Street Address</label>
              <input
                type="text"
                value={formData.line1}
                onChange={(e) => setFormData({ ...formData, line1: e.target.value })}
                className="w-full rounded-lg border border-bordergrey p-2 outline-none focus:border-forest"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-bordergrey">
            <button
              type="button"
              onClick={() => setEditModalOpen(false)}
              className="px-4 py-2 rounded-lg border border-bordergrey text-slategrey hover:bg-ivory"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded-lg bg-obsidian text-white font-semibold hover:bg-forest disabled:opacity-50"
            >
              {submitting ? 'Updating...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        title="Confirm Customer Deletion"
        subtitle="This action is protected by referential consistency safeguards."
        maxWidth="sm"
      >
        <div className="space-y-4 text-xs">
          {errorMessage && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 font-medium">
              {errorMessage}
            </div>
          )}
          <p className="text-obsidian">
            Are you sure you want to permanently delete customer <strong>{customerDetails?.customer?.name}</strong>?
          </p>
          <p className="text-slategrey">
            If active or past due subscriptions exist, the system will prevent deletion to preserve billing and revenue audit integrity.
          </p>
          <div className="flex justify-end gap-3 pt-3 border-t border-bordergrey">
            <button
              onClick={() => setDeleteConfirmOpen(false)}
              className="px-4 py-2 rounded-lg border border-bordergrey text-slategrey hover:bg-ivory"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={submitting}
              className="px-4 py-2 rounded-lg bg-rose-600 text-white font-semibold hover:bg-rose-700 disabled:opacity-50"
            >
              {submitting ? 'Deleting...' : 'Confirm Delete'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
