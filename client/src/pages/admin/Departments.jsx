import React, { useState, useEffect } from 'react';
import apiClient from '../../api/client';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import { PageLoader } from '../../components/ui/Spinner';
import { Building, Plus, AlertCircle, Edit2, Search, Trash2, XCircle, FileText, Settings2 } from 'lucide-react';

const AdminDepartments = () => {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [actionDepartmentId, setActionDepartmentId] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [editingDepartmentId, setEditingDepartmentId] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [feedback, setFeedback] = useState({ type: '', text: '' });
  const [deleteModal, setDeleteModal] = useState({ open: false, dept: null });
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    aiLabel: '',
    keywords: ''
  });

  const [editData, setEditData] = useState({
    name: '',
    description: '',
    aiLabel: '',
    keywords: '',
    isActive: true,
  });

  const resetFeedback = () => setFeedback({ type: '', text: '' });

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/admin/departments');
      if (res.data.success) {
        setDepartments(res.data.data.departments);
      }
    } catch (err) {
      console.error('Failed to fetch departments:', err);
      setFeedback({ type: 'error', text: 'Failed to load departments.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDepartments(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    resetFeedback();

    try {
      setSubmitting(true);
      const payload = {
        name: formData.name,
        description: formData.description,
        aiLabel: formData.aiLabel,
        keywords: formData.keywords
      };

      await apiClient.post('/admin/departments', payload);
      setShowCreate(false);
      setFormData({ name: '', description: '', aiLabel: '', aiKeywords: '' });
      setFeedback({ type: 'success', text: 'Department created successfully.' });
      await fetchDepartments();
    } catch (err) {
      setFeedback({ type: 'error', text: err.response?.data?.error?.message || 'Failed to create department.' });
    } finally {
      setSubmitting(false);
    }
  };

  const openEdit = (department) => {
    resetFeedback();
    setEditingDepartmentId(department.id);
    setEditData({
      name: department.name || '',
      description: department.description || '',
      aiLabel: department.aiLabel || '',
      keywords: department.keywords || '',
      isActive: Boolean(department.isActive),
    });
  };

  const closeEdit = () => {
    setEditingDepartmentId(null);
    setEditData({ name: '', description: '', aiLabel: '', aiKeywords: '', isActive: true });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editingDepartmentId) return;
    resetFeedback();

    try {
      setSubmitting(true);
      const payload = {
        name: editData.name,
        description: editData.description,
        aiLabel: editData.aiLabel || null,
        keywords: editData.keywords,
        isActive: editData.isActive,
      };

      await apiClient.put(`/admin/departments/${editingDepartmentId}`, payload);
      closeEdit();
      setFeedback({ type: 'success', text: 'Department updated successfully.' });
      await fetchDepartments();
    } catch (err) {
      setFeedback({ type: 'error', text: err.response?.data?.error?.message || 'Failed to update department.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    resetFeedback();
    try {
      setActionDepartmentId(id);
      await apiClient.delete(`/admin/departments/${id}`);
      setFeedback({ type: 'success', text: 'Department deleted successfully.' });
      await fetchDepartments();
    } catch(err) {
      setFeedback({ type: 'error', text: err.response?.data?.error?.message || 'Failed to delete department.' });
    } finally {
      setActionDepartmentId(null);
      setDeleteModal({ open: false, dept: null });
    }
  };

  const filteredDepartments = departments.filter((department) => {
    const haystack = `${department.name} ${department.description || ''} ${department.aiLabel || ''} ${department.keywords || ''}`.toLowerCase();
    return haystack.includes(searchText.toLowerCase());
  });

  if (loading && departments.length === 0) return <PageLoader message="Loading departments..." />;

  return (
    <div className="p-6 lg:p-8 w-full max-w-6xl mx-auto animate-fade-up">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <p className="text-xs font-bold text-secondary/80 uppercase tracking-widest mb-2">
            Operations Setup
          </p>
          <h1 className="text-3xl font-display font-bold text-on-surface tracking-tight">
            Departments
          </h1>
          <p className="text-on-surface-variant text-[15px] mt-1">
            Manage departmental divisions and AI routing logic.
          </p>
        </div>
        <Button 
          variant={showCreate ? "outline" : "civic"} 
          onClick={() => setShowCreate(!showCreate)} 
          className="w-full sm:w-auto"
          leftIcon={showCreate ? XCircle : Plus}
        >
          {showCreate ? 'Close Form' : 'Add Department'}
        </Button>
      </div>

      {feedback.text && (
        <div className={`mb-6 p-4 rounded-xl border text-sm font-bold flex items-center gap-2 ${feedback.type === 'error' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
          {feedback.text}
        </div>
      )}

      {/* ── Create Department Form ── */}
      {showCreate && (
        <div className="mb-8 p-6 lg:p-8 rounded-2xl border border-primary/20 bg-primary/5 shadow-inner-soft animate-in fade-in zoom-in-95 duration-200">
          <h3 className="font-bold text-on-surface text-lg font-display mb-6">Register New Department</h3>
          <form onSubmit={handleCreate} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input label="Department Name" value={formData.name} onChange={e=>setFormData({...formData, name: e.target.value})} placeholder="e.g. Water Supply" required/>
              <Input label="AI Recognition Label" value={formData.aiLabel} onChange={e=>setFormData({...formData, aiLabel: e.target.value})} placeholder="e.g. Water" required/>
            </div>
            
            <Input label="Description" value={formData.description} onChange={e=>setFormData({...formData, description: e.target.value})} placeholder="Briefly describe what this department handles..." required/>
            
            <div>
               <label className="block text-[11px] font-bold uppercase tracking-wider text-on-surface-variant mb-2">AI Keywords (comma separated)</label>
               <textarea 
                  value={formData.keywords} 
                  onChange={e=>setFormData({...formData, keywords: e.target.value})} 
                  placeholder="water, pipe, leak, drainage" 
                  className="w-full rounded-xl border border-outline-variant/50 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-shadow resize-none"
                  rows={3}
               />
               <p className="text-xs font-semibold text-on-surface-variant mt-2 flex items-center gap-1.5">
                 <AlertCircle className="w-4 h-4 text-primary" /> Helps the AI automatically classify incoming tickets.
               </p>
            </div>

            <div className="flex justify-end pt-2">
              <Button type="submit" variant="primary" loading={submitting}>
                Create Department
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* ── Edit Department Form ── */}
      {editingDepartmentId && (
        <div className="mb-8 p-6 lg:p-8 rounded-2xl border border-secondary/30 bg-secondary/5 shadow-inner-soft animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-on-surface text-lg font-display">Edit Department</h3>
            <Button variant="outline" size="sm" onClick={closeEdit}>Close</Button>
          </div>

          <form onSubmit={handleUpdate} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Department Name"
                value={editData.name}
                onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                required
              />
              <Input
                label="AI Recognition Label"
                value={editData.aiLabel}
                onChange={(e) => setEditData({ ...editData, aiLabel: e.target.value })}
              />
            </div>

            <Input
              label="Description"
              value={editData.description}
              onChange={(e) => setEditData({ ...editData, description: e.target.value })}
              required
            />

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-on-surface-variant mb-2">AI Keywords (comma separated)</label>
              <textarea
                value={editData.keywords}
                onChange={(e) => setEditData({ ...editData, keywords: e.target.value })}
                className="w-full rounded-xl border border-outline-variant/50 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-shadow resize-none"
                rows={3}
              />
            </div>

            <label className="inline-flex items-center gap-3 cursor-pointer p-4 rounded-xl border border-outline-variant/30 bg-white hover:bg-surface-container-lowest transition-colors shadow-sm w-full md:w-auto">
              <input
                type="checkbox"
                className="w-5 h-5 rounded border-outline-variant/50 text-primary focus:ring-primary/20"
                checked={editData.isActive}
                onChange={(e) => setEditData({ ...editData, isActive: e.target.checked })}
              />
              <div>
                <span className="text-sm font-bold text-on-surface block">Department Active</span>
                <span className="text-xs font-medium text-on-surface-variant">Allow new tickets to be routed here</span>
              </div>
            </label>

            <div className="flex justify-end pt-2">
              <Button type="submit" variant="primary" loading={submitting}>
                Save Changes
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* ── Table ── */}
      <div className="bg-white rounded-2xl border border-outline-variant/25 overflow-hidden shadow-ambient-sm transition-all duration-300">
        <div className="p-5 border-b border-outline-variant/20 bg-surface-container-low/50">
          <div className="relative max-w-md">
            <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant" />
            <input
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Search by name, label, or keyword..."
              className="w-full pl-11 pr-4 py-3 rounded-xl border border-outline-variant/50 bg-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-body">
            <thead className="bg-surface-container-low/30 text-on-surface-variant border-b border-outline-variant/20">
              <tr>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider">Department</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider">AI Routing Rules</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-center">Workers</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-center">Active Load</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-center">Status</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDepartments.map((dept) => (
                <tr key={dept.id} className="border-b border-outline-variant/15 last:border-0 hover:bg-surface-container-low transition-colors table-row-hover">
                  <td className="px-6 py-4">
                    <div className="font-bold text-sm text-on-surface">{dept.name}</div>
                    <div className="text-xs font-medium text-on-surface-variant max-w-xs truncate mt-0.5">{dept.description}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-[10px] font-black uppercase tracking-wider text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full inline-block mb-1.5">
                      Label: {dept.aiLabel}
                    </div>
                    <div className="text-xs font-medium text-on-surface-variant truncate max-w-[200px]" title={dept.keywords}>
                      {dept.keywords || 'No keywords'}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center font-bold text-on-surface">{dept._count?.workers || 0}</td>
                  <td className="px-6 py-4 text-center font-bold text-on-surface">{dept._count?.assignedTickets || 0}</td>
                  <td className="px-6 py-4 text-center">
                    <span
                      className={`text-[10px] font-black px-2 py-1 rounded-full uppercase tracking-wider border ${
                        dept.isActive
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-red-50 text-red-700 border-red-200'
                      }`}
                    >
                      {dept.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="secondary" size="sm" onClick={() => openEdit(dept)} leftIcon={Edit2}>
                        Edit
                      </Button>
                      <button
                        onClick={() => setDeleteModal({ open: true, dept })}
                        disabled={actionDepartmentId === dept.id}
                        className="p-2 text-on-surface-variant hover:text-error hover:bg-error/10 rounded-lg transition-colors disabled:opacity-50"
                        title="Delete department"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredDepartments.length === 0 && (
                <tr>
                  <td colSpan="6" className="py-16 px-6 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-16 h-16 rounded-2xl bg-surface-container-low flex items-center justify-center mb-4 border border-outline-variant/30">
                        <Building className="w-8 h-8 text-on-surface-variant/50" />
                      </div>
                      <h3 className="text-lg font-bold text-on-surface font-display mb-1">No Departments Found</h3>
                      <p className="text-sm text-on-surface-variant">No departments match your current search.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        open={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, dept: null })}
        title="Delete Department"
        confirmLabel="Delete"
        variant="danger"
        onConfirm={() => handleDelete(deleteModal.dept?.id)}
        loading={actionDepartmentId === deleteModal.dept?.id}
      >
        <p className="text-sm text-on-surface-variant font-medium">Are you sure you want to delete <strong>{deleteModal.dept?.name}</strong>?</p>
        <div className="mt-4 p-3 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2 text-red-800 text-xs font-semibold">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <p>This action will fail if there are active tickets assigned to this department. You must reassign tickets and workers first.</p>
        </div>
      </Modal>
    </div>
  );
};

export default AdminDepartments;
