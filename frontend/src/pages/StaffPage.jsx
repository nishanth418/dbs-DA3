import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, UserCheck, Phone, DollarSign, Filter, Utensils, Calendar } from 'lucide-react';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import { api } from '../services/api';

const ROLES = ['Cook', 'Cleaner', 'Security', 'Electrician', 'Plumber', 'Supervisor', 'Administrator', 'Other'];

export default function StaffPage({ showToast }) {
  const [staffList, setStaffList] = useState([]);
  const [messList, setMessList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [deleteStaffId, setDeleteStaffId] = useState(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    role: 'Cook',
    salary: 22000,
    mess_id: '',
    join_date: new Date().toISOString().split('T')[0],
    phones: ''
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    loadMeta();
  }, []);

  useEffect(() => {
    loadStaff();
  }, [roleFilter, statusFilter]);

  async function loadMeta() {
    try {
      const mRes = await api.getMess();
      setMessList(mRes.data);
    } catch (err) {
      console.error(err);
    }
  }

  async function loadStaff() {
    try {
      setLoading(true);
      const res = await api.getStaff({
        role: roleFilter,
        status: statusFilter
      });
      setStaffList(res.data);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }

  function openCreateModal() {
    setEditingStaff(null);
    setFormData({
      name: '',
      role: 'Cook',
      salary: 22000,
      mess_id: messList[0]?.mess_id ? String(messList[0].mess_id) : '',
      join_date: new Date().toISOString().split('T')[0],
      phones: ''
    });
    setErrors({});
    setIsModalOpen(true);
  }

  function openEditModal(st) {
    setEditingStaff(st);
    setFormData({
      name: st.name || st.StaffName || '',
      role: st.role || st.Role || 'Cook',
      salary: st.salary !== undefined ? st.salary : (st.Salary || 22000),
      mess_id: st.mess_id ? String(st.mess_id) : (st.MessID ? String(st.MessID) : ''),
      join_date: st.join_date || st.JoinDate || new Date().toISOString().split('T')[0],
      phones: st.phones ? st.phones.join(', ') : (st.phone_numbers || '')
    });
    setErrors({});
    setIsModalOpen(true);
  }

  function validate() {
    const errs = {};
    if (!formData.name.trim()) errs.name = 'Staff name is required';
    if (!formData.role) errs.role = 'Role is required';
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
        salary: Number(formData.salary),
        phones: formData.phones
          ? formData.phones.split(',').map((p) => p.trim()).filter(Boolean)
          : []
      };

      if (editingStaff) {
        await api.updateStaff(editingStaff.staff_id || editingStaff.StaffID, payload);
        showToast('Staff profile updated successfully', 'success');
      } else {
        await api.createStaff(payload);
        showToast('Staff member registered successfully', 'success');
      }
      setIsModalOpen(false);
      loadStaff();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    try {
      setSaving(true);
      await api.deleteStaff(deleteStaffId);
      showToast('Staff member deleted successfully', 'success');
      setDeleteStaffId(null);
      loadStaff();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  }

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
              <UserCheck size={20} />
            </div>
            <div>
              <h2>Operational Staff & Personnel</h2>
              <p>Dining staff, cleaners, facility maintenance, and campus security workforce</p>
            </div>
          </div>
        </div>

        <div className="page-actions">
          <button className="btn btn-primary" onClick={openCreateModal}>
            <Plus size={16} />
            <span>Add Staff Member</span>
          </button>
        </div>
      </div>

      <div className="table-container">
        {/* Filters */}
        <div className="table-toolbar">
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <select
              className="form-select"
              style={{ width: 'auto', minWidth: 160 }}
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <option value="">All Staff Roles</option>
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Total: <strong>{staffList.length}</strong> personnel active
          </span>
        </div>

        {/* Data Table */}
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Staff Member</th>
                <th>Role / Designation</th>
                <th>Assigned Facility</th>
                <th>Monthly Salary</th>
                <th>Contact Phones</th>
                <th>Join Date</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '50px 0', color: 'var(--text-muted)' }}>
                    <div className="spin-animation" style={{ display: 'inline-block', marginBottom: 8 }}>
                      <UserCheck size={24} color="var(--primary)" />
                    </div>
                    <p>Loading staff personnel...</p>
                  </td>
                </tr>
              ) : staffList.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '50px 0', color: 'var(--text-muted)' }}>
                    No staff records found matching the query.
                  </td>
                </tr>
              ) : (
                staffList.map((st) => (
                  <tr key={st.staff_id || st.StaffID}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      #{st.staff_id || st.StaffID}
                    </td>

                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                        {st.name || st.StaffName}
                      </div>
                    </td>

                    <td>
                      <span className="badge badge-purple">
                        {st.role || st.Role}
                      </span>
                    </td>

                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Utensils size={14} color="var(--primary)" />
                        <span style={{ fontSize: '0.84rem' }}>{st.mess_name || 'Central Campus'}</span>
                      </div>
                    </td>

                    <td>
                      <span style={{ fontWeight: 700, color: '#10b981', fontFamily: 'var(--font-mono)' }}>
                        ₹{Number(st.salary || st.Salary || 22000).toLocaleString()}/mo
                      </span>
                    </td>

                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                      {st.phone_numbers || '044-220011'}
                    </td>

                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                      {st.join_date || st.JoinDate}
                    </td>

                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                        <button
                          className="btn btn-secondary btn-icon btn-sm"
                          onClick={() => openEditModal(st)}
                          title="Edit staff"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          className="btn btn-danger btn-icon btn-sm"
                          onClick={() => setDeleteStaffId(st.staff_id || st.StaffID)}
                          title="Delete staff"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingStaff ? `Edit Staff: ${editingStaff.name || editingStaff.StaffName}` : 'Add Staff Member'}
        maxWidth="540px"
      >
        <form onSubmit={handleSave}>
          <div className="form-grid">
            <div className="form-group form-grid-full">
              <label className="form-label">Full Name *</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Ramesh Chandra"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
              {errors.name && <span className="form-error">{errors.name}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">Operational Role</label>
              <select
                className="form-select"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Assigned Mess</label>
              <select
                className="form-select"
                value={formData.mess_id}
                onChange={(e) => setFormData({ ...formData, mess_id: e.target.value })}
              >
                <option value="">No Facility</option>
                {messList.map((m) => (
                  <option key={m.mess_id} value={m.mess_id}>
                    {m.mess_name || m.MessName}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Monthly Remuneration (₹)</label>
              <input
                type="number"
                className="form-input"
                value={formData.salary}
                onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Date of Joining</label>
              <input
                type="date"
                className="form-input"
                value={formData.join_date}
                onChange={(e) => setFormData({ ...formData, join_date: e.target.value })}
              />
            </div>

            <div className="form-group form-grid-full">
              <label className="form-label">Contact Phone Numbers (comma-separated)</label>
              <input
                type="text"
                className="form-input"
                placeholder="9876500010, 9876500011"
                value={formData.phones}
                onChange={(e) => setFormData({ ...formData, phones: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--bg-card-border)' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : editingStaff ? 'Update Staff' : 'Add Staff'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(deleteStaffId)}
        onClose={() => setDeleteStaffId(null)}
        onConfirm={handleDelete}
        title="Delete Staff Record"
        message="Are you sure you want to delete this staff record?"
        confirmText="Confirm Delete"
        isLoading={saving}
      />
    </div>
  );
}
