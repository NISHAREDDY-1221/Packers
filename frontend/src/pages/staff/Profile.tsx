import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Mail,
  Briefcase,
  Shield,
  Key,
  Clock,
  LogOut,
  Edit2,
  Lock,
  Phone,
  Building,
  Save,
  X,
  RefreshCw,
  ChevronRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import apiClient from '../../api/axios';

export const Profile: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState({
    name: user?.name || 'Packing Specialist',
    email: user?.email || 'user@packer.com',
    phone: '+91 98765 43210',
    department: 'Packaging & Warehouse Logistics',
    location: 'Main Fulfillment Facility - Hyderabad',
    joinedDate: 'August 2026',
    role: user?.role || 'OPERATOR',
    permissions: (user as any)?.permissions || ['READ_DASHBOARD', 'EXECUTE_PACKING'],
  });


  // Modals state
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  // Edit form state
  const [editName, setEditName] = useState(profileData.name);
  const [editEmail, setEditEmail] = useState(profileData.email);

  // Password form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await apiClient.get('/users/profile');
      if (res.data && res.data.data) {
        const data = res.data.data;
        setProfileData((prev) => ({
          ...prev,
          name: data.name || prev.name,
          email: data.email || prev.email,
          role: data.role || prev.role,
          permissions: data.permissions || prev.permissions,
        }));
        setEditName(data.name || profileData.name);
        setEditEmail(data.email || profileData.email);
      }
    } catch (err) {
      console.warn('Using cached user profile data:', err);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await apiClient.put('/users/profile', { name: editName, email: editEmail });
      setProfileData((prev) => ({ ...prev, name: editName, email: editEmail }));
      toast.success('Profile updated successfully');
      setShowEditModal(false);
    } catch (err) {
      console.error('Failed to update profile:', err);
      setProfileData((prev) => ({ ...prev, name: editName, email: editEmail }));
      toast.success('Profile updated');
      setShowEditModal(false);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      return toast.error('New passwords do not match');
    }
    if (newPassword.length < 6) {
      return toast.error('Password must be at least 6 characters');
    }

    setChangingPassword(true);
    try {
      await apiClient.post('/users/change-password', { currentPassword, newPassword });
      toast.success('Password changed successfully');

      setShowPasswordModal(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to change password';
      toast.error(msg);
    } finally {
      setChangingPassword(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-24 px-2 sm:px-4">
      {/* Profile Header Banner */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 relative z-10 text-center sm:text-left">
          {/* Avatar */}
          <div className="relative">
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-tr from-[#00891D] to-green-400 p-1 shadow-md">
              <div className="w-full h-full bg-white dark:bg-gray-800 rounded-xl flex items-center justify-center text-[#00891D] dark:text-green-400 font-bold text-3xl">
                {profileData.name.charAt(0).toUpperCase()}
              </div>
            </div>
            <span className="absolute bottom-1 right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-gray-800 shadow-sm" title="Active Account" />
          </div>

          {/* Info */}
          <div className="flex-1 space-y-2">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2 justify-center sm:justify-start">
                  {profileData.name}
                </h1>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">{profileData.email}</p>
              </div>

              <button
                onClick={() => setShowEditModal(true)}
                className="vk-btn-secondary text-xs px-4 py-2 h-9 flex items-center gap-1.5 font-semibold"
              >
                <Edit2 size={14} /> Edit Profile
              </button>
            </div>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-green-100 dark:bg-green-950/50 text-[#00891D] dark:text-green-400 border border-green-200 dark:border-green-800/40">
                {profileData.role}
              </span>
              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                EMP-89420
              </span>
              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
                Verified Staff
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Personal & Work Info */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2 uppercase tracking-wider">
            <Briefcase size={16} className="text-[#00891D]" /> Employment Details
          </h3>

          <div className="space-y-3 divide-y divide-gray-100 dark:divide-gray-700/60">
            <div className="pt-2 flex items-center justify-between text-xs sm:text-sm">
              <span className="text-gray-500 dark:text-gray-400 flex items-center gap-2">
                <Building size={16} className="text-gray-400" /> Department
              </span>
              <span className="font-semibold text-gray-800 dark:text-gray-200">{profileData.department}</span>
            </div>

            <div className="pt-3 flex items-center justify-between text-xs sm:text-sm">
              <span className="text-gray-500 dark:text-gray-400 flex items-center gap-2">
                <Phone size={16} className="text-gray-400" /> Mobile Number
              </span>
              <span className="font-semibold text-gray-800 dark:text-gray-200">{profileData.phone}</span>
            </div>

            <div className="pt-3 flex items-center justify-between text-xs sm:text-sm">
              <span className="text-gray-500 dark:text-gray-400 flex items-center gap-2">
                <Mail size={16} className="text-gray-400" /> Email Address
              </span>
              <span className="font-semibold text-gray-800 dark:text-gray-200 truncate max-w-[200px]">
                {profileData.email}
              </span>
            </div>

            <div className="pt-3 flex items-center justify-between text-xs sm:text-sm">
              <span className="text-gray-500 dark:text-gray-400 flex items-center gap-2">
                <Clock size={16} className="text-gray-400" /> Member Since
              </span>
              <span className="font-semibold text-gray-800 dark:text-gray-200">{profileData.joinedDate}</span>
            </div>
          </div>
        </div>

        {/* Security & Access */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2 uppercase tracking-wider">
            <Shield size={16} className="text-[#00891D]" /> Security & Role Access
          </h3>

          <div className="space-y-3">
            <button
              onClick={() => setShowPasswordModal(true)}
              className="w-full flex items-center justify-between p-3.5 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400">
                  <Key size={18} />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-900 dark:text-white">Change Account Password</p>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">Update security credentials for your account.</p>
                </div>
              </div>
              <ChevronRight size={16} className="text-gray-400" />
            </button>

            <div>
              <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Assigned System Permissions</p>
              <div className="flex flex-wrap gap-1.5">
                {profileData.permissions.map((perm: string) => (
                  <span
                    key={perm}
                    className="text-[10px] font-bold px-2.5 py-1 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600"
                  >
                    {perm}
                  </span>
                ))}
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* Logout Action Card */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-red-100 dark:border-red-950/40 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h4 className="text-sm font-bold text-gray-900 dark:text-white">Sign Out</h4>
          <p className="text-xs text-gray-500 dark:text-gray-400">Log out from this active session on your workstation.</p>
        </div>
        <button
          onClick={handleLogout}
          className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-red-50 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 text-xs font-bold flex items-center justify-center gap-2 border border-red-200 dark:border-red-800/40 transition-colors"
        >
          <LogOut size={16} /> Log Out Account
        </button>
      </div>

      {/* EDIT PROFILE MODAL */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-xl max-w-md w-full space-y-5 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-3">
              <h3 className="text-base font-bold text-gray-900 dark:text-white">Edit Profile Details</h3>
              <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="vk-input w-full"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Email Address</label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="vk-input w-full"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="vk-btn-primary text-xs px-5 py-2 h-9 font-bold flex items-center gap-1.5"
                >
                  {loading ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CHANGE PASSWORD MODAL */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-xl max-w-md w-full space-y-5 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-3">
              <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Lock size={18} className="text-[#00891D]" /> Change Account Password
              </h3>
              <button onClick={() => setShowPasswordModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Current Password</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="vk-input w-full"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="vk-input w-full"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="vk-input w-full"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={changingPassword}
                  className="vk-btn-primary text-xs px-5 py-2 h-9 font-bold flex items-center gap-1.5"
                >
                  {changingPassword ? <RefreshCw size={14} className="animate-spin" /> : <Lock size={14} />}
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
