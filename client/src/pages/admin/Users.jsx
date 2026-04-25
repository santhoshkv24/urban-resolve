import React, { useEffect, useMemo, useState } from 'react';
import { Pencil, Plus, Search, UserX, Users as UsersIcon, XCircle, Filter, FileText } from 'lucide-react';
import apiClient from '../../api/client';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import { PageLoader } from '../../components/ui/Spinner';

const INITIAL_CREATE_FORM = {
  name: '',
  email: '',
  password: '',
  role: 'DEPT_WORKER',
  departmentId: '',
  phone: '',
  address: '',
};

const INITIAL_EDIT_FORM = {
  name: '',
  departmentId: '',
  isActive: true,
  phone: '',
  address: '',
};

const ROLE_LABELS = {
  DEPT_WORKER: 'Department Worker',
  OFFICER: 'Officer',
  ADMIN: 'Admin',
  CITIZEN: 'Citizen',
};

const ROLE_BADGE = {
  DEPT_WORKER: 'bg-sky-50 text-sky-700 border-sky-200',
  OFFICER: 'bg-violet-50 text-violet-700 border-violet-200',
  ADMIN: 'bg-amber-50 text-amber-800 border-amber-200',
  CITIZEN: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

const StatCard = ({ title, value, className = '' }) => (
  <div className={`p-5 rounded-2xl border border-outline-variant/25 bg-white shadow-ambient-sm transition-transform hover:-translate-y-0.5 duration-300 ${className}`}>
    <p className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">{title}</p>
    <p className="text-3xl font-display font-black text-on-surface">{value}</p>
  </div>
);

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [actionUserId, setActionUserId] = useState(null);

  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState(INITIAL_CREATE_FORM);

  const [editingUserId, setEditingUserId] = useState(null);
  const [editForm, setEditForm] = useState(INITIAL_EDIT_FORM);
  const [editLoading, setEditLoading] = useState(false);

  const [searchText, setSearchText] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const [feedback, setFeedback] = useState({ type: '', text: '' });
  const [deactivateModal, setDeactivateModal] = useState({ open: false, user: null });

  const resetFeedback = () => setFeedback({ type: '', text: '' });

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const [usersRes, departmentsRes] = await Promise.all([
        apiClient.get('/admin/users'),
        apiClient.get('/admin/departments'),
      ]);

      setUsers(usersRes.data.data.users || []);
      setDepartments(departmentsRes.data.data.departments || []);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      setFeedback({ type: 'error', text: 'Could not load users right now. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const activeUsers = useMemo(() => users.filter((user) => user.isActive).length, [users]);
  const workerCount = useMemo(() => users.filter((user) => user.role === 'DEPT_WORKER').length, [users]);

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const bySearch =
        user.name.toLowerCase().includes(searchText.toLowerCase()) ||
        user.email.toLowerCase().includes(searchText.toLowerCase());
      const byRole = roleFilter === 'ALL' ? true : user.role === roleFilter;
      const byStatus =
        statusFilter === 'ALL'
          ? true
          : statusFilter === 'ACTIVE'
            ? user.isActive
            : !user.isActive;
      return bySearch && byRole && byStatus;
    });
  }, [users, searchText, roleFilter, statusFilter]);

  const handleCreate = async (event) => {
    event.preventDefault();
    resetFeedback();

    if (createForm.role === 'DEPT_WORKER' && !createForm.departmentId) {
      setFeedback({ type: 'error', text: 'Department is required for worker accounts.' });
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        name: createForm.name,
        email: createForm.email,
        password: createForm.password,
        role: createForm.role,
        phone: createForm.phone || undefined,
        address: createForm.address || undefined,
      };

      if (createForm.role === 'DEPT_WORKER') {
        payload.departmentId = parseInt(createForm.departmentId, 10);
      }

      await apiClient.post('/admin/users', payload);

      setShowCreate(false);
      setCreateForm(INITIAL_CREATE_FORM);
      setFeedback({ type: 'success', text: 'User account created successfully.' });
      await fetchUsers();
    } catch (error) {
      console.error('Create user failed:', error);
      setFeedback({ type: 'error', text: error.response?.data?.error?.message || 'Failed to create user account.' });
    } finally {
      setSubmitting(false);
    }
  };

  const openEdit = async (user) => {
    resetFeedback();
    setEditingUserId(user.id);
    setEditLoading(true);
    setEditForm({
      name: user.name,
      departmentId: user.departmentId ? String(user.departmentId) : '',
      isActive: user.isActive,
      phone: '',
      address: '',
    });

    try {
      const response = await apiClient.get(`/admin/users/${user.id}`);
      const details = response.data.data.user;
      setEditForm({
        name: details.name || '',
        departmentId: details.departmentId ? String(details.departmentId) : '',
        isActive: Boolean(details.isActive),
        phone: details.phone || '',
        address: details.address || '',
      });
    } catch (error) {
      console.error('Fetch user details failed:', error);
      setFeedback({ type: 'error', text: 'Unable to load user details for editing.' });
    } finally {
      setEditLoading(false);
    }
  };

  const closeEdit = () => {
    setEditingUserId(null);
    setEditForm(INITIAL_EDIT_FORM);
  };

  const handleUpdate = async (event) => {
    event.preventDefault();
    if (!editingUserId) return;
    resetFeedback();

    const targetUser = users.find((user) => user.id === editingUserId);
    if (!targetUser) return;

    if (targetUser.role === 'DEPT_WORKER' && !editForm.departmentId) {
      setFeedback({ type: 'error', text: 'Department is required for worker accounts.' });
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        name: editForm.name,
        isActive: editForm.isActive,
        phone: editForm.phone || null,
        address: editForm.address || null,
        departmentId: targetUser.role === 'DEPT_WORKER' ? parseInt(editForm.departmentId, 10) : null,
      };

      await apiClient.put(`/admin/users/${editingUserId}`, payload);
      setFeedback({ type: 'success', text: 'User details updated.' });
      closeEdit();
      await fetchUsers();
    } catch (error) {
      console.error('Update user failed:', error);
      setFeedback({ type: 'error', text: error.response?.data?.error?.message || 'Failed to update user.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeactivate = async (user) => {
    resetFeedback();
    try {
      setActionUserId(user.id);
      await apiClient.delete(`/admin/users/${user.id}`);
      setFeedback({ type: 'success', text: 'User account deactivated.' });
      await fetchUsers();
    } catch (error) {
      setFeedback({ type: 'error', text: error.response?.data?.error?.message || 'Failed to deactivate user.' });
    } finally {
      setActionUserId(null);
      setDeactivateModal({ open: false, user: null });
    }
  };

  const handleReactivate = async (user) => {
    resetFeedback();
    try {
      setActionUserId(user.id);
      await apiClient.put(`/admin/users/${user.id}`, { isActive: true });
      setFeedback({ type: 'success', text: 'User account reactivated.' });
      await fetchUsers();
    } catch (error) {
      console.error('Reactivate user failed:', error);
      setFeedback({ type: 'error', text: error.response?.data?.error?.message || 'Failed to reactivate user.' });
    } finally {
      setActionUserId(null);
    }
  };

  if (loading && users.length === 0) return <PageLoader message="Loading workforce data..." />;

  return (
    <div className="p-6 lg:p-8 w-full max-w-7xl mx-auto animate-fade-up">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <p className="text-xs font-bold text-secondary/80 uppercase tracking-widest mb-2">
            Workforce Accounts
          </p>
          <h1 className="text-3xl font-display font-bold text-on-surface tracking-tight">
            User Management
          </h1>
          <p className="text-on-surface-variant text-[15px] mt-1">
            Create, update, and control officer and worker access.
          </p>
        </div>

        <Button 
          variant={showCreate ? "outline" : "civic"} 
          onClick={() => setShowCreate((current) => !current)} 
          className="w-full sm:w-auto"
          leftIcon={showCreate ? XCircle : Plus}
        >
          {showCreate ? 'Close Form' : 'Add User'}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard title="Total Accounts" value={users.length} />
        <StatCard title="Active Users" value={activeUsers} className="border-primary/20 bg-primary/5" />
        <StatCard title="Dept Workers" value={workerCount} />
      </div>

      {feedback.text && (
        <div className={`mb-6 p-4 rounded-xl border text-sm font-bold flex items-center gap-2 ${feedback.type === 'error' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
          {feedback.text}
        </div>
      )}

      {/* ── Create User Form ── */}
      {showCreate && (
        <div className="mb-8 p-6 lg:p-8 rounded-2xl border border-primary/20 bg-primary/5 shadow-inner-soft animate-in fade-in zoom-in-95 duration-200">
          <h3 className="font-bold text-on-surface text-lg font-display mb-6">Create New User</h3>
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Input
              label="Full Name"
              value={createForm.name}
              onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
              required
            />
            <Input
              label="Email Address"
              type="email"
              value={createForm.email}
              onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
              required
            />
            <Input
              label="Temporary Password"
              type="text"
              value={createForm.password}
              onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
              required
              minLength={6}
            />

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-on-surface-variant mb-2">Role</label>
              <select
                value={createForm.role}
                onChange={(e) => setCreateForm({ ...createForm, role: e.target.value, departmentId: '' })}
                className="w-full rounded-xl border border-outline-variant/50 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-shadow"
              >
                <option value="DEPT_WORKER">Department Worker</option>
                <option value="OFFICER">Officer</option>
              </select>
            </div>

            {createForm.role === 'DEPT_WORKER' && (
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-on-surface-variant mb-2">Department</label>
                <select
                  value={createForm.departmentId}
                  onChange={(e) => setCreateForm({ ...createForm, departmentId: e.target.value })}
                  required
                  className="w-full rounded-xl border border-outline-variant/50 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-shadow"
                >
                  <option value="">Select Department</option>
                  {departments.map((department) => (
                    <option key={department.id} value={department.id}>
                      {department.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <Input
              label="Phone (Optional)"
              value={createForm.phone}
              onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
            />

            <div className="md:col-span-2">
              <Input
                label="Address (Optional)"
                value={createForm.address}
                onChange={(e) => setCreateForm({ ...createForm, address: e.target.value })}
              />
            </div>

            <div className="lg:col-span-3 flex justify-end mt-4">
              <Button type="submit" variant="primary" loading={submitting}>
                Create User
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* ── Edit User Form ── */}
      {editingUserId && (
        <div className="mb-8 p-6 lg:p-8 rounded-2xl border border-secondary/30 bg-secondary/5 shadow-inner-soft animate-in fade-in zoom-in-95 duration-200">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-on-surface text-lg font-display">Edit User</h3>
            <Button variant="outline" size="sm" onClick={closeEdit}>Close</Button>
          </div>

          {editLoading ? (
            <div className="flex justify-center py-8">
              <PageLoader message="Loading details..." />
            </div>
          ) : (
            <form onSubmit={handleUpdate} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Name"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                required
              />

              {users.find((user) => user.id === editingUserId)?.role === 'DEPT_WORKER' && (
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-on-surface-variant mb-2">Department</label>
                  <select
                    value={editForm.departmentId}
                    onChange={(e) => setEditForm({ ...editForm, departmentId: e.target.value })}
                    required
                    className="w-full rounded-xl border border-outline-variant/50 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-shadow"
                  >
                    <option value="">Select Department</option>
                    {departments.map((department) => (
                      <option key={department.id} value={department.id}>
                        {department.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <Input
                label="Phone"
                value={editForm.phone}
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
              />

              <Input
                label="Address"
                value={editForm.address}
                onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
              />

              <div className="md:col-span-2">
                <label className="inline-flex items-center gap-3 cursor-pointer p-4 rounded-xl border border-outline-variant/30 bg-white hover:bg-surface-container-lowest transition-colors shadow-sm">
                  <input
                    type="checkbox"
                    className="w-5 h-5 rounded border-outline-variant/50 text-primary focus:ring-primary/20"
                    checked={editForm.isActive}
                    onChange={(e) => setEditForm({ ...editForm, isActive: e.target.checked })}
                  />
                  <div>
                    <span className="text-sm font-bold text-on-surface block">Account Active</span>
                    <span className="text-xs font-medium text-on-surface-variant">Allow user to log in and use the system</span>
                  </div>
                </label>
              </div>

              <div className="md:col-span-2 flex justify-end mt-2">
                <Button type="submit" variant="primary" loading={submitting}>
                  Save Changes
                </Button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* ── Users Table ── */}
      <div className="bg-white rounded-2xl border border-outline-variant/25 overflow-hidden shadow-ambient-sm transition-all duration-300">
        <div className="p-5 border-b border-outline-variant/20 bg-surface-container-low/50 flex flex-col lg:flex-row lg:items-center gap-4">
          <div className="relative flex-1">
            <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant" />
            <input
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Search by name or email..."
              className="w-full pl-11 pr-4 py-3 rounded-xl border border-outline-variant/50 bg-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>

          <div className="flex gap-3">
            <div className="relative">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="pl-4 pr-10 py-3 rounded-xl border border-outline-variant/50 bg-white text-sm font-bold text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all appearance-none cursor-pointer"
              >
                <option value="ALL">All Roles</option>
                <option value="DEPT_WORKER">Workers</option>
                <option value="OFFICER">Officers</option>
                <option value="ADMIN">Admins</option>
                <option value="CITIZEN">Citizens</option>
              </select>
              <Filter className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none" />
            </div>

            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="pl-4 pr-10 py-3 rounded-xl border border-outline-variant/50 bg-white text-sm font-bold text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all appearance-none cursor-pointer"
              >
                <option value="ALL">All Status</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-body">
            <thead className="bg-surface-container-low/30 text-on-surface-variant border-b border-outline-variant/20">
              <tr>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider">Name & Email</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider">Role</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider">Department</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id} className="border-b border-outline-variant/15 last:border-0 hover:bg-surface-container-low transition-colors table-row-hover">
                  <td className="px-6 py-4">
                    <p className="font-bold text-sm text-on-surface">{user.name}</p>
                    <p className="text-xs font-medium text-on-surface-variant mt-0.5">{user.email}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider border ${ROLE_BADGE[user.role] || 'bg-zinc-50 text-zinc-700 border-zinc-200'}`}>
                      {ROLE_LABELS[user.role] || user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-on-surface-variant">
                    {user.department?.name || '—'}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-[10px] font-black px-2 py-1 rounded-full uppercase tracking-wider border ${user.isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        leftIcon={Pencil}
                        onClick={() => openEdit(user)}
                      >
                        Edit
                      </Button>

                      {user.isActive ? (
                        <Button
                          variant="danger"
                          size="sm"
                          leftIcon={UserX}
                          onClick={() => setDeactivateModal({ open: true, user })}
                          disabled={actionUserId === user.id}
                        >
                          {actionUserId === user.id ? 'Working...' : 'Deactivate'}
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleReactivate(user)}
                          disabled={actionUserId === user.id}
                        >
                          {actionUserId === user.id ? 'Working...' : 'Reactivate'}
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredUsers.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
              <div className="w-16 h-16 rounded-2xl bg-surface-container-low flex items-center justify-center mb-4 border border-outline-variant/30">
                <FileText className="w-8 h-8 text-on-surface-variant/50" />
              </div>
              <h3 className="text-lg font-bold text-on-surface font-display mb-1">No Users Found</h3>
              <p className="text-sm text-on-surface-variant">No accounts match the current filters.</p>
            </div>
          )}
        </div>
      </div>

      <Modal
        open={deactivateModal.open}
        onClose={() => setDeactivateModal({ open: false, user: null })}
        title="Deactivate Account"
        variant="danger"
        confirmLabel="Deactivate"
        onConfirm={() => handleDeactivate(deactivateModal.user)}
        loading={actionUserId === deactivateModal.user?.id}
      >
        <p className="text-sm text-on-surface-variant font-medium">Are you sure you want to deactivate <strong>{deactivateModal.user?.name}</strong>? They will not be able to log in or access the system until their account is reactivated.</p>
      </Modal>
    </div>
  );
};

export default AdminUsers;
