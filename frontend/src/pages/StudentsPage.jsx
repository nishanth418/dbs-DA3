import React, { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Phone,
  Eye,
  AlertCircle,
  Users,
  Filter,
  CheckCircle2,
  Building2,
  BedDouble,
  Mail,
  Calendar,
  X
} from 'lucide-react';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import { api } from '../services/api';

export default function StudentsPage({ showToast }) {
  const [students, setStudents] = useState([]);
  const [hostels, setHostels] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [hostelFilter, setHostelFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [viewingStudent, setViewingStudent] = useState(null);
  const [deleteStudentId, setDeleteStudentId] = useState(null);
  const [saving, setSaving] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    dob: '2004-01-01',
    gender: 'Male',
    blood_group: 'O+',
    guardian_name: '',
    guardian_phone: '',
    address: '',
    admission_date: new Date().toISOString().split('T')[0],
    room_id: '',
    status: 'Active',
    phones: ''
  });

  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    loadData();
    loadHostelsAndRooms();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const res = await api.getStudents({
        search: searchTerm,
        hostel_id: hostelFilter,
        status: statusFilter
      });
      setStudents(res.data);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }

  async function loadHostelsAndRooms() {
    try {
      const [hRes, rRes] = await Promise.all([api.getHostels(), api.getRooms()]);
      setHostels(hRes.data);
      setRooms(rRes.data);
    } catch (err) {
      console.error(err);
    }
  }

  function handleFilterSubmit(e) {
    if (e) e.preventDefault();
    loadData();
  }

  function openCreateModal() {
    setEditingStudent(null);
    setFormData({
      first_name: '',
      last_name: '',
      email: '',
      dob: '2004-01-01',
      gender: 'Male',
      blood_group: 'O+',
      guardian_name: '',
      guardian_phone: '',
      address: '',
      admission_date: new Date().toISOString().split('T')[0],
      room_id: '',
      status: 'Active',
      phones: ''
    });
    setFormErrors({});
    setIsModalOpen(true);
  }

  async function openEditModal(student) {
    try {
      const res = await api.getStudent(student.student_id);
      const s = res.data;
      setEditingStudent(s);
      setFormData({
        first_name: s.first_name || '',
        last_name: s.last_name || '',
        email: s.email || '',
        dob: s.dob || '',
        gender: s.gender || 'Male',
        blood_group: s.blood_group || 'O+',
        guardian_name: s.guardian_name || '',
        guardian_phone: s.guardian_phone || '',
        address: s.address || '',
        admission_date: s.admission_date || '',
        room_id: s.room_id ? String(s.room_id) : '',
        status: s.status || 'Active',
        phones: s.phones ? s.phones.join(', ') : ''
      });
      setFormErrors({});
      setIsModalOpen(true);
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  function validateForm() {
    const errors = {};
    if (!formData.first_name.trim()) errors.first_name = 'First name is required';
    if (!formData.last_name.trim()) errors.last_name = 'Last name is required';
    if (!formData.email.trim() || !formData.email.includes('@')) errors.email = 'Valid email is required';
    if (!formData.dob) errors.dob = 'Date of birth is required';
    if (!formData.guardian_name.trim()) errors.guardian_name = 'Guardian name is required';
    if (!formData.guardian_phone.trim()) errors.guardian_phone = 'Guardian phone is required';
    if (!formData.address.trim()) errors.address = 'Permanent address is required';
    if (!formData.admission_date) errors.admission_date = 'Admission date is required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSaveStudent(e) {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setSaving(true);
      const payload = {
        ...formData,
        room_id: formData.room_id ? Number(formData.room_id) : null,
        phones: formData.phones
          ? formData.phones.split(',').map((p) => p.trim()).filter(Boolean)
          : []
      };

      if (editingStudent) {
        await api.updateStudent(editingStudent.student_id, payload);
        showToast('Resident record updated successfully', 'success');
      } else {
        await api.createStudent(payload);
        showToast('Resident registered in database successfully', 'success');
      }
      setIsModalOpen(false);
      loadData();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteStudent() {
    try {
      setSaving(true);
      await api.deleteStudent(deleteStudentId);
      showToast('Student deleted successfully', 'success');
      setDeleteStudentId(null);
      loadData();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div className="page-header-title">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #3b82f6, #06b6d4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff'
              }}
            >
              <Users size={20} />
            </div>
            <div>
              <h2>Resident & Student Management</h2>
              <p>Hostel resident records, room allocation, and guardian contact registry</p>
            </div>
          </div>
        </div>

        <div className="page-actions">
          <button className="btn btn-primary" onClick={openCreateModal}>
            <Plus size={16} />
            <span>Register New Student</span>
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="table-container">
        {/* Filter Toolbar */}
        <div className="table-toolbar">
          <form onSubmit={handleFilterSubmit} style={{ display: 'flex', gap: 12, flex: 1, flexWrap: 'wrap' }}>
            <div className="search-input-wrapper">
              <Search size={16} />
              <input
                type="text"
                className="search-input"
                placeholder="Search by student name, email, or room..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <select
              className="form-select"
              style={{ width: 'auto', minWidth: 160 }}
              value={hostelFilter}
              onChange={(e) => {
                setHostelFilter(e.target.value);
                setTimeout(loadData, 50);
              }}
            >
              <option value="">All Hostels</option>
              {hostels.map((h) => (
                <option key={h.hostel_id} value={h.hostel_id}>
                  {h.name}
                </option>
              ))}
            </select>

            <select
              className="form-select"
              style={{ width: 'auto', minWidth: 140 }}
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setTimeout(loadData, 50);
              }}
            >
              <option value="">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Alumni">Alumni</option>
              <option value="Suspended">Suspended</option>
            </select>

            <button type="submit" className="btn btn-secondary btn-sm">
              Apply Filters
            </button>
            {(searchTerm || hostelFilter || statusFilter) && (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  setSearchTerm('');
                  setHostelFilter('');
                  setStatusFilter('');
                  setTimeout(loadData, 50);
                }}
              >
                Clear
              </button>
            )}
          </form>

          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Showing <strong>{students.length}</strong> resident(s)
          </span>
        </div>

        {/* Data Table */}
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Student Profile</th>
                <th>Email Address</th>
                <th>Assigned Room & Hostel</th>
                <th>Phone Numbers</th>
                <th>Guardian Contact</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '50px 0', color: 'var(--text-muted)' }}>
                    <div className="spin-animation" style={{ display: 'inline-block', marginBottom: 8 }}>
                      <Users size={24} color="var(--primary)" />
                    </div>
                    <p>Loading resident database records...</p>
                  </td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '50px 0', color: 'var(--text-muted)' }}>
                    <AlertCircle size={24} style={{ marginBottom: 6, opacity: 0.5 }} />
                    <p>No residents found matching the query.</p>
                  </td>
                </tr>
              ) : (
                students.map((s) => (
                  <tr key={s.student_id}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      #{s.student_id}
                    </td>

                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div
                          style={{
                            width: 34,
                            height: 34,
                            borderRadius: '8px',
                            background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.2), rgba(6, 182, 212, 0.2))',
                            border: '1px solid rgba(56, 189, 248, 0.25)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            color: '#38bdf8',
                            fontSize: '0.82rem'
                          }}
                        >
                          {s.first_name?.charAt(0)}{s.last_name?.charAt(0)}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                            {s.first_name} {s.last_name}
                          </div>
                          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                            {s.gender} • Blood Group: {s.blood_group || 'O+'}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.86rem' }}>
                      {s.email}
                    </td>

                    <td>
                      {s.room_number ? (
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontWeight: 700, color: '#38bdf8', fontSize: '0.88rem' }}>
                            Room {s.room_number}
                          </span>
                          <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                            {s.hostel_name} (Floor {s.floor || 1})
                          </span>
                        </div>
                      ) : (
                        <span className="badge badge-warning">Unassigned</span>
                      )}
                    </td>

                    <td style={{ fontSize: '0.82rem', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                      {s.phone_numbers || 'No phone registered'}
                    </td>

                    <td>
                      <div style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {s.guardian_name}
                      </div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                        {s.guardian_phone}
                      </div>
                    </td>

                    <td>
                      <span
                        className={`badge ${
                          s.status === 'Active'
                            ? 'badge-success'
                            : s.status === 'Suspended'
                            ? 'badge-danger'
                            : 'badge-info'
                        }`}
                      >
                        {s.status}
                      </span>
                    </td>

                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                        <button
                          className="btn btn-secondary btn-icon btn-sm"
                          onClick={() => setViewingStudent(s)}
                          title="View complete record"
                        >
                          <Eye size={13} />
                        </button>
                        <button
                          className="btn btn-secondary btn-icon btn-sm"
                          onClick={() => openEditModal(s)}
                          title="Edit student"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          className="btn btn-danger btn-icon btn-sm"
                          onClick={() => setDeleteStudentId(s.student_id)}
                          title="Delete student"
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

      {/* Add / Edit Student Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingStudent ? `Edit Student: ${editingStudent.first_name} ${editingStudent.last_name}` : 'Register New Resident'}
        maxWidth="720px"
      >
        <form onSubmit={handleSaveStudent}>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">First Name *</label>
              <input
                type="text"
                className="form-input"
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
              />
              {formErrors.first_name && <span className="form-error">{formErrors.first_name}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">Last Name *</label>
              <input
                type="text"
                className="form-input"
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
              />
              {formErrors.last_name && <span className="form-error">{formErrors.last_name}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">Email Address *</label>
              <input
                type="email"
                className="form-input"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
              {formErrors.email && <span className="form-error">{formErrors.email}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">Date of Birth *</label>
              <input
                type="date"
                className="form-input"
                value={formData.dob}
                onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
              />
              {formErrors.dob && <span className="form-error">{formErrors.dob}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">Gender *</label>
              <select
                className="form-select"
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Blood Group</label>
              <select
                className="form-select"
                value={formData.blood_group}
                onChange={(e) => setFormData({ ...formData, blood_group: e.target.value })}
              >
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Guardian Name *</label>
              <input
                type="text"
                className="form-input"
                value={formData.guardian_name}
                onChange={(e) => setFormData({ ...formData, guardian_name: e.target.value })}
              />
              {formErrors.guardian_name && <span className="form-error">{formErrors.guardian_name}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">Guardian Phone *</label>
              <input
                type="text"
                className="form-input"
                placeholder="+91-9876543210"
                value={formData.guardian_phone}
                onChange={(e) => setFormData({ ...formData, guardian_phone: e.target.value })}
              />
              {formErrors.guardian_phone && <span className="form-error">{formErrors.guardian_phone}</span>}
            </div>

            <div className="form-group form-grid-full">
              <label className="form-label">Student Phone Numbers (comma-separated)</label>
              <input
                type="text"
                className="form-input"
                placeholder="+91-9011122233, +91-9011122234"
                value={formData.phones}
                onChange={(e) => setFormData({ ...formData, phones: e.target.value })}
              />
            </div>

            <div className="form-group form-grid-full">
              <label className="form-label">Permanent Address *</label>
              <textarea
                className="form-textarea"
                rows="2"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
              {formErrors.address && <span className="form-error">{formErrors.address}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">Room Allocation</label>
              <select
                className="form-select"
                value={formData.room_id}
                onChange={(e) => setFormData({ ...formData, room_id: e.target.value })}
              >
                <option value="">No Room Assigned</option>
                {rooms.map((r) => (
                  <option key={r.room_id} value={r.room_id}>
                    Room {r.room_number} - {r.hostel_name} ({r.type_name}, Status: {r.status})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Admission Date *</label>
              <input
                type="date"
                className="form-input"
                value={formData.admission_date}
                onChange={(e) => setFormData({ ...formData, admission_date: e.target.value })}
              />
              {formErrors.admission_date && <span className="form-error">{formErrors.admission_date}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">Enrollment Status</label>
              <select
                className="form-select"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <option value="Active">Active</option>
                <option value="Alumni">Alumni</option>
                <option value="Suspended">Suspended</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--bg-card-border)' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsModalOpen(false)}
              disabled={saving}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving to Database...' : editingStudent ? 'Update Resident Record' : 'Register Resident'}
            </button>
          </div>
        </form>
      </Modal>

      {/* View Record Modal */}
      {viewingStudent && (
        <Modal
          isOpen={true}
          onClose={() => setViewingStudent(null)}
          title={`Resident Profile: ${viewingStudent.first_name} ${viewingStudent.last_name}`}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>STUDENT ID</span>
                <p style={{ fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                  #{viewingStudent.student_id}
                </p>
              </div>
              <div>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>STATUS</span>
                <p>
                  <span className={`badge ${viewingStudent.status === 'Active' ? 'badge-success' : 'badge-danger'}`}>
                    {viewingStudent.status}
                  </span>
                </p>
              </div>
              <div>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>EMAIL</span>
                <p style={{ color: 'var(--text-primary)' }}>{viewingStudent.email}</p>
              </div>
              <div>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>GENDER & BLOOD GROUP</span>
                <p style={{ color: 'var(--text-primary)' }}>
                  {viewingStudent.gender} • {viewingStudent.blood_group || 'O+'}
                </p>
              </div>
              <div>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>ALLOCATED ROOM</span>
                <p style={{ color: '#38bdf8', fontWeight: 700 }}>
                  {viewingStudent.room_number ? `${viewingStudent.room_number} (${viewingStudent.hostel_name})` : 'Unassigned'}
                </p>
              </div>
              <div>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>ADMISSION DATE</span>
                <p style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                  {viewingStudent.admission_date}
                </p>
              </div>
            </div>

            <div>
              <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>CONTACT PHONE NUMBERS</span>
              <p style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                {viewingStudent.phone_numbers || 'No registered phone numbers'}
              </p>
            </div>

            <div>
              <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>GUARDIAN PROFILE</span>
              <p style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{viewingStudent.guardian_name}</p>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.84rem', fontFamily: 'var(--font-mono)' }}>
                {viewingStudent.guardian_phone}
              </p>
            </div>

            <div>
              <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>PERMANENT RESIDENTIAL ADDRESS</span>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.86rem' }}>{viewingStudent.address}</p>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--bg-card-border)' }}>
            <button className="btn btn-secondary" onClick={() => setViewingStudent(null)}>
              Close
            </button>
          </div>
        </Modal>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deleteStudentId)}
        onClose={() => setDeleteStudentId(null)}
        onConfirm={handleDeleteStudent}
        title="Delete Resident Record"
        message="Are you sure you want to delete this student record? Database foreign keys will prevent accidental deletion if active payment records exist."
        confirmText="Confirm Delete"
        isLoading={saving}
      />
    </div>
  );
}
