import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, CreditCard, Eye, Filter, Receipt, DollarSign, CheckCircle2, AlertCircle, Calendar } from 'lucide-react';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import { api } from '../services/api';

const METHODS = ['UPI', 'Net Banking', 'Cash', 'Credit Card', 'Debit Card'];
const STATUSES = ['Paid', 'Pending', 'Failed', 'Refunded'];
const FEE_TYPES = ['Hostel Rent', 'Mess Fee', 'Security Deposit', 'Maintenance', 'Late Fee', 'Other'];

export default function PaymentsPage({ showToast }) {
  const [payments, setPayments] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [methodFilter, setMethodFilter] = useState('');

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewingPayment, setViewingPayment] = useState(null);
  const [deletePaymentId, setDeletePaymentId] = useState(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    student_id: '',
    total_amount: 14000,
    payment_method: 'UPI',
    payment_status: 'Paid',
    transaction_id: `TXN-${Date.now().toString().slice(-6)}`,
    day: new Date().getDate(),
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear()
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    loadStudents();
  }, []);

  useEffect(() => {
    loadPayments();
  }, [statusFilter, methodFilter]);

  async function loadStudents() {
    try {
      const res = await api.getStudents();
      setStudents(res.data);
    } catch (err) {
      console.error(err);
    }
  }

  async function loadPayments() {
    try {
      setLoading(true);
      const res = await api.getPayments({
        payment_status: statusFilter,
        payment_method: methodFilter
      });
      setPayments(res.data);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }

  function openCreateModal() {
    setFormData({
      student_id: students[0]?.student_id || students[0]?.StudentID || '',
      total_amount: 14000,
      payment_method: 'UPI',
      payment_status: 'Paid',
      transaction_id: `TXN-${Date.now().toString().slice(-6)}`,
      day: new Date().getDate(),
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear()
    });
    setErrors({});
    setIsModalOpen(true);
  }

  function validate() {
    const errs = {};
    if (!formData.student_id) errs.student_id = 'Please select a student resident';
    if (!formData.total_amount || formData.total_amount <= 0) errs.total_amount = 'Valid payment amount required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!validate()) return;

    try {
      setSaving(true);
      const payload = {
        ...formData,
        total_amount: Number(formData.total_amount)
      };

      await api.createPayment(payload);
      showToast('Fee payment recorded in database ledger', 'success');
      setIsModalOpen(false);
      loadPayments();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    try {
      setSaving(true);
      await api.deletePayment(deletePaymentId);
      showToast('Payment record removed', 'success');
      setDeletePaymentId(null);
      loadPayments();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  }

  const totalCollected = payments
    .filter((p) => (p.payment_status || p.Status) === 'Paid')
    .reduce((sum, p) => sum + (Number(p.total_amount || p.Amount) || 0), 0);

  return (
    <div>
      <div className="page-header">
        <div className="page-header-title">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #2563eb, #06b6d4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff'
              }}
            >
              <CreditCard size={20} />
            </div>
            <div>
              <h2>Financial Management & Fee Collections</h2>
              <p>Resident room rent, mess charges, UPI/card transaction records, and payment receipts</p>
            </div>
          </div>
        </div>

        <div className="page-actions">
          <button className="btn btn-primary" onClick={openCreateModal}>
            <Plus size={16} />
            <span>Record Fee Payment</span>
          </button>
        </div>
      </div>

      {/* Financial Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 18, marginBottom: 24 }}>
        <div className="panel" style={{ padding: '18px 22px' }}>
          <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
            Total Collections (Filtered)
          </span>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#10b981', fontFamily: 'var(--font-mono)', marginTop: 4 }}>
            ₹{totalCollected.toLocaleString()}
          </div>
          <span style={{ fontSize: '0.74rem', color: '#10b981' }}>Verified Completed Transactions</span>
        </div>

        <div className="panel" style={{ padding: '18px 22px' }}>
          <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
            Transaction Count
          </span>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#38bdf8', marginTop: 4 }}>
            {payments.length}
          </div>
          <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Registered Ledger Entries</span>
        </div>

        <div className="panel" style={{ padding: '18px 22px' }}>
          <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
            Primary Gateway Mode
          </span>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#a855f7', marginTop: 4 }}>
            UPI & Net Banking
          </div>
          <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Instant Reconciliation</span>
        </div>
      </div>

      <div className="table-container">
        {/* Toolbar */}
        <div className="table-toolbar">
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <select
              className="form-select"
              style={{ width: 'auto', minWidth: 160 }}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Statuses</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>

            <select
              className="form-select"
              style={{ width: 'auto', minWidth: 160 }}
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
            >
              <option value="">All Payment Modes</option>
              {METHODS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Showing <strong>{payments.length}</strong> payment transactions
          </span>
        </div>

        {/* Table */}
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Txn ID</th>
                <th>Resident Student</th>
                <th>Room & Hostel</th>
                <th>Total Fee</th>
                <th>Mode</th>
                <th>Status</th>
                <th>Date</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '50px 0', color: 'var(--text-muted)' }}>
                    <div className="spin-animation" style={{ display: 'inline-block', marginBottom: 8 }}>
                      <CreditCard size={24} color="var(--primary)" />
                    </div>
                    <p>Loading fee transactions from database...</p>
                  </td>
                </tr>
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '50px 0', color: 'var(--text-muted)' }}>
                    No payment records match the selected filter.
                  </td>
                </tr>
              ) : (
                payments.map((p) => {
                  const status = p.payment_status || p.Status || 'Paid';
                  const amount = Number(p.total_amount || p.Amount || 0);

                  return (
                    <tr key={p.payment_id || p.PaymentID}>
                      <td>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                          {p.transaction_id || `TXN-${p.payment_id || p.PaymentID}`}
                        </span>
                      </td>

                      <td>
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                          {p.student_name || p.FirstName ? `${p.FirstName || ''} ${p.LastName || ''}` : `Student #${p.student_id || p.StudentID}`}
                        </span>
                      </td>

                      <td>
                        {p.room_number ? (
                          <span style={{ color: 'var(--text-secondary)' }}>
                            Room {p.room_number} ({p.hostel_name})
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>-</span>
                        )}
                      </td>

                      <td>
                        <span style={{ fontWeight: 800, color: '#10b981', fontFamily: 'var(--font-mono)', fontSize: '0.98rem' }}>
                          ₹{amount.toLocaleString()}
                        </span>
                      </td>

                      <td>
                        <span className="badge badge-info">
                          {p.payment_method || p.PaymentMode || 'UPI'}
                        </span>
                      </td>

                      <td>
                        <span
                          className={`badge ${
                            status === 'Paid'
                              ? 'badge-success'
                              : status === 'Pending'
                              ? 'badge-warning'
                              : 'badge-danger'
                          }`}
                        >
                          {status}
                        </span>
                      </td>

                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                        {p.payment_date || (p.PaymentDay ? `${p.PaymentDay}/${p.PaymentMonth}/${p.PaymentYear}` : '2026-03-10')}
                      </td>

                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                          <button
                            className="btn btn-secondary btn-icon btn-sm"
                            onClick={() => setViewingPayment(p)}
                            title="View receipt"
                          >
                            <Receipt size={13} />
                          </button>
                          <button
                            className="btn btn-danger btn-icon btn-sm"
                            onClick={() => setDeletePaymentId(p.payment_id || p.PaymentID)}
                            title="Delete payment"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Payment Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Record Student Fee Transaction"
        maxWidth="540px"
      >
        <form onSubmit={handleSave}>
          <div className="form-grid">
            <div className="form-group form-grid-full">
              <label className="form-label">Resident Student *</label>
              <select
                className="form-select"
                value={formData.student_id}
                onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
              >
                <option value="">Select Resident</option>
                {students.map((s) => (
                  <option key={s.student_id} value={s.student_id}>
                    {s.first_name} {s.last_name} (#{s.student_id}, {s.room_number ? `Room ${s.room_number}` : 'Unassigned'})
                  </option>
                ))}
              </select>
              {errors.student_id && <span className="form-error">{errors.student_id}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">Payment Amount (₹) *</label>
              <input
                type="number"
                min="100"
                className="form-input"
                value={formData.total_amount}
                onChange={(e) => setFormData({ ...formData, total_amount: e.target.value })}
              />
              {errors.total_amount && <span className="form-error">{errors.total_amount}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">Payment Mode</label>
              <select
                className="form-select"
                value={formData.payment_method}
                onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
              >
                {METHODS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Payment Status</label>
              <select
                className="form-select"
                value={formData.payment_status}
                onChange={(e) => setFormData({ ...formData, payment_status: e.target.value })}
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Transaction Reference ID</label>
              <input
                type="text"
                className="form-input"
                value={formData.transaction_id}
                onChange={(e) => setFormData({ ...formData, transaction_id: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--bg-card-border)' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Processing...' : 'Record Payment'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Receipt Modal */}
      {viewingPayment && (
        <Modal
          isOpen={true}
          onClose={() => setViewingPayment(null)}
          title="Payment Transaction Receipt"
          maxWidth="460px"
        >
          <div style={{ background: 'var(--bg-input)', padding: '20px', borderRadius: '12px', border: '1px solid var(--bg-card-border)', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ textAlign: 'center', paddingBottom: 12, borderBottom: '1px dashed var(--bg-card-border)' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>HOSTEL MANAGEMENT</h3>
              <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>Hostel & Mess Fee Acknowledgment</p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Transaction Reference:</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#38bdf8' }}>
                {viewingPayment.transaction_id || `TXN-${viewingPayment.payment_id || viewingPayment.PaymentID}`}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Student Resident:</span>
              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                {viewingPayment.student_name || `Resident #${viewingPayment.student_id || viewingPayment.StudentID}`}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Payment Mode:</span>
              <span>{viewingPayment.payment_method || viewingPayment.PaymentMode}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', paddingTop: 8, borderTop: '1px dashed var(--bg-card-border)' }}>
              <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Total Amount Paid:</span>
              <span style={{ fontSize: '1.2rem', fontWeight: 800, color: '#10b981', fontFamily: 'var(--font-mono)' }}>
                ₹{Number(viewingPayment.total_amount || viewingPayment.Amount || 0).toLocaleString()}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
            <button className="btn btn-secondary" onClick={() => setViewingPayment(null)}>
              Close Receipt
            </button>
          </div>
        </Modal>
      )}

      <ConfirmDialog
        isOpen={Boolean(deletePaymentId)}
        onClose={() => setDeletePaymentId(null)}
        onConfirm={handleDelete}
        title="Delete Payment Entry"
        message="Are you sure you want to permanently delete this payment ledger record?"
        confirmText="Confirm Delete"
        isLoading={saving}
      />
    </div>
  );
}
