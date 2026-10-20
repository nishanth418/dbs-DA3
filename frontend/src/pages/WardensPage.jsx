import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, ShieldCheck, Phone, Mail, Calendar, Building2 } from 'lucide-react';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import { api } from '../services/api';

export default function WardensPage({ showToast }) {
  const [wardens, setWardens] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWarden, setEditingWarden] = useState(null);
  const [deleteWardenId, setDeleteWardenId] = useState(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    gender: 'Male',
    address: '',
    join_date: new Date().toISOString().split('T')[0],
    salary: 70000,
    phones: ''
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const res = await api.getWardens();
      setWardens(res.data);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }

  function openCreateModal() {
    setEditingWarden(null);
    setFormData({
      name: '',
      email: '',
      gender: 'Male',
      address: '',
      join_date: new Date().toISOString().split('T')[0],
      salary: 70000,
      phones: ''
    });
    setErrors({});
    setIsModalOpen(true);
  }

  async function openEditModal(w) {
    try {
      const res = await api.getWarden(w.warden_id);
      const data = res.data;
      setEditingWarden(data);
      setFormData({
        name: data.name || data.WardenName || '',
        email: data.email || data.Email || '',
        gender: data.gender || 'Male',
        address: data.address || '',
        join_date: data.join_date || data.JoiningDate || new Date().toISOString().split('T')[0],
        salary: data.salary || 70000,
        phones: data.phones ? data.phones.join(', ') : (data.phone_numbers || '')
      });
      setErrors({});
      setIsModalOpen(true);
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  function validate() {
    const errs = {};
    if (!formData.name.trim()) errs.name = 'Warden name is required';
    if (!formData.email.trim() || !formData.email.includes('@')) errs.email = 'Valid email is required';
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

      if (editingWarden) {
        await api.updateWarden(editingWarden.warden_id || editingWarden.WardenID, payload);
        showToast('Warden profile updated successfully', 'success');
      } else {
        await api.createWarden(payload);
        showToast('Warden registered successfully', 'success');
      }
      setIsModalOpen(false);
      loadData();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    try {
      setSaving(true);
      await api.deleteWarden(deleteWardenId);
      showToast('Warden record deleted successfully', 'success');
      setDeleteWardenId(null);
      loadData();
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
              <ShieldCheck size={20} />
            </div>
            <div>
              <h2>Hostel Wardens & Supervisors</h2>
              <p>Hostel supervision officials, block assignments, and emergency contact directory</p>
            </div>
          </div>
        </div>

        <div className="page-actions">
          <button className="btn btn-primary" onClick={openCreateModal}>
            <Plus size={16} />
            <span>Register Warden</span>
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
        {wardens.map((w) => (
          <div key={w.warden_id} className="panel" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: '10px',
                      background: 'rgba(129, 140, 248, 0.15)',
                      border: '1px solid rgba(129, 140, 248, 0.3)',
                      color: '#818cf8',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700
                    }}
                  >
                    {w.name?.charAt(0) || 'W'}
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                      {w.name}
                    </h3>
                    <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                      ID: #{w.warden_id}
                    </span>
                  </div>
                </div>

                <span className="badge badge-success">Active Official</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: '0.86rem', color: 'var(--text-secondary)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Mail size={15} color="var(--primary)" />
                  <span>{w.email}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Building2 size={15} color="#38bdf8" />
                  <span>Assigned: <strong style={{ color: 'var(--text-primary)' }}>{w.hostel_name || 'All Blocks'}</strong></span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Phone size={15} color="#10b981" />
                  <span style={{ fontFamily: 'var(--font-mono)' }}>{w.phone_numbers || 'No registered contact'}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Calendar size={15} color="#f59e0b" />
                  <span>Joined: {w.join_date}</span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20, paddingTop: 14, borderTop: '1px solid var(--bg-card-border)' }}>
              <button className="btn btn-secondary btn-sm" onClick={() => openEditModal(w)}>
                <Edit2 size={13} />
                <span>Edit</span>
              </button>
              <button className="btn btn-danger btn-sm" onClick={() => setDeleteWardenId(w.warden_id)}>
                <Trash2 size={13} />
                <span>Delete</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingWarden ? `Edit Warden: ${editingWarden.name || editingWarden.WardenName}` : 'Register New Warden'}
        maxWidth="560px"
      >
        <form onSubmit={handleSave}>
          <div className="form-grid">
            <div className="form-group form-grid-full">
              <label className="form-label">Full Name & Title *</label>
              <input
                type="text"
                className="form-input"
                placeholder="Dr. Rajesh Kumar"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
              {errors.name && <span className="form-error">{errors.name}</span>}
            </div>

            <div className="form-group form-grid-full">
              <label className="form-label">Email Address *</label>
              <input
                type="email"
                className="form-input"
                placeholder="rajesh.k@univ.edu"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
              {errors.email && <span className="form-error">{errors.email}</span>}
            </div>

            <div className="form-group form-grid-full">
              <label className="form-label">Contact Phone Numbers (comma-separated)</label>
              <input
                type="text"
                className="form-input"
                placeholder="9876500001, 9876500002"
                value={formData.phones}
                onChange={(e) => setFormData({ ...formData, phones: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Joining Date</label>
              <input
                type="date"
                className="form-input"
                value={formData.join_date}
                onChange={(e) => setFormData({ ...formData, join_date: e.target.value })}
              />
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
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--bg-card-border)' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : editingWarden ? 'Update Warden' : 'Register Warden'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(deleteWardenId)}
        onClose={() => setDeleteWardenId(null)}
        onConfirm={handleDelete}
        title="Delete Warden Record"
        message="Are you sure you want to delete this warden? Hostels currently assigned to this warden will have their assignment unlinked."
        confirmText="Confirm Delete"
        isLoading={saving}
      />
    </div>
  );
}
