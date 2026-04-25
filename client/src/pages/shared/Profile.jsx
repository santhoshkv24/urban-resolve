import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../api/client';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { useToast } from '../../components/ui/Toast';

const UnifiedProfile = () => {
  const { user, logout, refreshUser } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    address: user?.address || '',
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        phone: user.phone || '',
        address: user.address || '',
      });
    }
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await apiClient.put('/auth/profile', formData);
      await refreshUser();
      setIsEditing(false);
      toast.success('Profile updated successfully!');
    } catch (err) {
      console.error('Update profile error:', err);
      toast.error(err.response?.data?.error?.message || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  // Icon component to handle Material Symbols
  const Icon = ({ name, className = "" }) => (
    <span className={`material-symbols-outlined ${className}`} style={{ fontSize: 'inherit' }}>
      {name}
    </span>
  );

  const isStaff = ['ADMIN', 'DEPT_WORKER', 'OFFICER'].includes(user?.role);
  const roleLabel = user?.role?.replace('_', ' ');

  return (
    <div className="p-6 lg:p-10 max-w-6xl mx-auto space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-on-surface tracking-tight">
            {isStaff ? 'Staff Profile' : 'Citizen Account'}
          </h1>
          <p className="text-on-surface-variant text-sm mt-1">
            Manage your {isStaff ? 'professional' : 'personal'} UrbanResolve identity
          </p>
        </div>
        <div className={`px-4 py-2 rounded-2xl flex items-center gap-2 font-bold text-xs uppercase tracking-widest border shadow-sm ${
          user?.role === 'ADMIN' ? 'bg-slate-900 text-white border-slate-800' :
          user?.role === 'CITIZEN' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
          'bg-sky-50 text-sky-700 border-sky-100'
        }`}>
          <Icon name={user?.role === 'ADMIN' ? 'shield_person' : 'person'} />
          {roleLabel}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: ID Card */}
        <div className="lg:col-span-4">
          <div className={`relative overflow-hidden rounded-[32px] p-8 border shadow-2xl transition-all duration-500 ${
            user?.role === 'ADMIN' 
              ? 'bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 text-white border-white/10' 
              : 'bg-white border-outline-variant/30 text-on-surface'
          }`}>
            {/* Premium background mesh effect */}
            {user?.role === 'ADMIN' && (
              <>
                <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_100%_0%,rgba(2,132,199,0.15)_0%,transparent_50%)]" />
                <div className="absolute bottom-0 left-0 w-full h-full bg-[radial-gradient(circle_at_0%_100%,rgba(14,165,233,0.1)_0%,transparent_50%)]" />
              </>
            )}
            
            <div className="relative z-10 text-center">
              <div className={`w-24 h-24 rounded-3xl flex items-center justify-center text-4xl font-display font-bold mx-auto mb-6 shadow-xl border transition-transform duration-500 hover:scale-105 ${
                user?.role === 'ADMIN' ? 'bg-white/10 border-white/20 text-white' : 'bg-gradient-civic border-transparent text-white'
              }`}>
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              
              <h2 className={`text-xl font-display font-bold mb-1 ${user?.role === 'ADMIN' ? 'text-white' : 'text-on-surface'}`}>
                {user?.name}
              </h2>
              <p className={`text-[10px] uppercase tracking-[0.2em] mb-8 font-black ${
                user?.role === 'ADMIN' ? 'text-slate-400' : 'text-secondary'
              }`}>{user?.email}</p>
              
              <div className="space-y-4 mb-10 text-left">
                <div className={`flex items-center justify-between text-xs py-3 border-b ${user?.role === 'ADMIN' ? 'border-white/10' : 'border-outline-variant/30'}`}>
                  <span className={user?.role === 'ADMIN' ? 'text-slate-400' : 'text-on-surface-variant'}>Account Status</span>
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <Icon name="check_circle" className="text-sm" /> Active
                  </span>
                </div>
                
                {user?.role === 'CITIZEN' && (
                  <div className="flex items-center justify-between text-xs py-3 border-b border-outline-variant/30">
                    <span className="text-on-surface-variant">Civic Trust</span>
                    <span className="text-secondary font-bold font-display text-lg">{user?.civicTrustScore}</span>
                  </div>
                )}

                {user?.department && (
                  <div className={`flex items-center justify-between text-xs py-3 border-b ${user?.role === 'ADMIN' ? 'border-white/10' : 'border-outline-variant/30'}`}>
                    <span className={user?.role === 'ADMIN' ? 'text-slate-400' : 'text-on-surface-variant'}>Department</span>
                    <span className={`font-bold ${user?.role === 'ADMIN' ? 'text-white' : 'text-on-surface'}`}>{user.department.name}</span>
                  </div>
                )}
              </div>

              <button 
                onClick={handleLogout}
                className={`w-full py-3.5 rounded-2xl flex items-center justify-center gap-2 font-bold text-sm transition-all duration-300 border ${
                  user?.role === 'ADMIN' 
                  ? 'bg-white/5 border-white/10 hover:bg-error/20 hover:text-error' 
                  : 'bg-surface-container-low border-outline-variant/20 hover:bg-error/10 hover:text-error hover:border-error/20'
                }`}
              >
                <Icon name="logout" className="text-lg" />
                Logout
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Settings Form */}
        <div className="lg:col-span-8 space-y-8">
          <div className="glass-card rounded-[32px] p-8 border border-outline-variant/30 shadow-ambient-lg bg-white/80 backdrop-blur-md">
            <div className="flex items-center justify-between mb-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary">
                  <Icon name="settings" />
                </div>
                <h3 className="text-lg font-display font-bold text-on-surface">General Settings</h3>
              </div>
              <button 
                onClick={() => setIsEditing(!isEditing)}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${isEditing ? 'bg-error/10 text-error' : 'bg-primary/10 text-primary hover:scale-110'}`}
              >
                <Icon name={isEditing ? 'close' : 'edit'} />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Input
                  label="Display Name"
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  disabled={!isEditing}
                  leftIcon={() => <Icon name="person" />}
                />
                <Input
                  label="Email (Non-editable)"
                  id="email"
                  value={user?.email || ''}
                  disabled={true}
                  leftIcon={() => <Icon name="mail" />}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Input
                  label="Phone Number"
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  disabled={!isEditing}
                  leftIcon={() => <Icon name="phone" />}
                  placeholder="Enter your phone"
                />
                <Input
                  label="Primary Address"
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  disabled={!isEditing}
                  leftIcon={() => <Icon name="location_on" />}
                  placeholder="Street, Area, City"
                />
              </div>

              {isEditing && (
                <div className="flex justify-end pt-4">
                  <Button
                    type="submit"
                    variant="civic"
                    loading={loading}
                    className="w-full sm:w-auto px-12 h-14 rounded-2xl"
                  >
                    <div className="flex items-center gap-2">
                      <Icon name="save" />
                      Save Changes
                    </div>
                  </Button>
                </div>
              )}
            </form>
          </div>

          {/* Security Banner */}
          <div className="p-6 rounded-[24px] bg-slate-100 border border-slate-200 flex items-start gap-4 shadow-inner-soft">
            <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shrink-0 shadow-sm border border-slate-200 text-slate-400">
              <Icon name="encrypted" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900 mb-1">Data Privacy Notice</p>
              <p className="text-xs text-slate-500 leading-relaxed">
                Your contact information is encrypted using AES-256-CBC. In accordance with UrbanResolve guidelines, this information is only accessible to department workers when actively resolving your assigned tickets.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UnifiedProfile;
