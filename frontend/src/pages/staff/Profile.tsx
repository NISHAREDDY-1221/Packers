import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Camera, User, MapPin, Briefcase, Phone, Mail, Key, Shield, Clock, MessageSquare, FileText, Info, LogOut, ChevronRight, Edit2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Profile: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="max-w-md mx-auto md:max-w-4xl pb-24 px-4 sm:px-6 space-y-6">
      {/* Profile Summary Card */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col items-center">
        <div className="relative mb-4">
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center border-4 border-white shadow-sm overflow-hidden">
            <User size={40} className="text-green-600" />
          </div>
          <button className="absolute bottom-0 right-0 bg-white dark:bg-gray-800 p-2 rounded-full shadow-md border border-gray-100 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:text-green-600 transition-colors">
            <Camera size={16} />
          </button>
        </div>
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 text-center">{user?.name || 'Packing Operator'}</h2>
        <div className="flex items-center gap-2 mt-1 mb-4">
          <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 bg-gray-100 px-2 py-1 rounded-md">ID: EMP-09824</span>
          <span className="text-xs font-bold text-green-700 bg-green-100 px-2 py-1 rounded-md">Active</span>
        </div>
        <div className="w-full bg-slate-50 dark:bg-gray-900 rounded-xl p-4 border border-slate-100 dark:border-gray-700 space-y-3">
          <div className="flex items-center text-sm">
            <Briefcase size={16} className="text-gray-400 mr-3" />
            <span className="font-semibold text-gray-700 dark:text-gray-200">Packing Operator</span>
          </div>
          <div className="flex items-center text-sm">
            <MapPin size={16} className="text-gray-400 mr-3" />
            <span className="font-semibold text-gray-700 dark:text-gray-200">VillagKart Hyderabad</span>
          </div>
          <div className="flex items-center text-sm">
            <Clock size={16} className="text-gray-400 mr-3" />
            <span className="font-semibold text-gray-700 dark:text-gray-200">Shift A (06:00 AM - 02:00 PM)</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-6">
          {/* Contact Information Card */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="p-4 border-b border-gray-50 flex justify-between items-center bg-slate-50 dark:bg-gray-900">
              <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100 uppercase tracking-wide">Contact Information</h3>
              <button className="text-green-600 hover:text-green-700 flex items-center text-xs font-bold">
                <Edit2 size={12} className="mr-1" /> Edit
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center text-sm">
                  <Phone size={18} className="text-gray-400 mr-3" />
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Mobile Number</p>
                    <p className="font-semibold text-gray-800 dark:text-gray-100">+91 98765 43210</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center text-sm">
                  <Mail size={18} className="text-gray-400 mr-3" />
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Email Address</p>
                    <p className="font-semibold text-gray-800 dark:text-gray-100">{user?.email || 'operator@villagkart.com'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="space-y-6">
          {/* Account & Security Card */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="p-4 border-b border-gray-50 bg-slate-50 dark:bg-gray-900">
              <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100 uppercase tracking-wide">Account & Security</h3>
            </div>
            <div className="divide-y divide-gray-50">
              <button className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center">
                  <Key size={18} className="text-gray-400 mr-3" />
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">Change Password</span>
                </div>
                <ChevronRight size={18} className="text-gray-300" />
              </button>
              <button className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center">
                  <Shield size={18} className="text-gray-400 mr-3" />
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">Change Login PIN</span>
                </div>
                <ChevronRight size={18} className="text-gray-300" />
              </button>
            </div>
          </div>

          {/* Help & Support Card */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="p-4 border-b border-gray-50 bg-slate-50 dark:bg-gray-900">
              <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100 uppercase tracking-wide">Help & Support</h3>
            </div>
            <div className="divide-y divide-gray-50">
              <button className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center">
                  <MessageSquare size={18} className="text-gray-400 mr-3" />
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">Report App Issue</span>
                </div>
                <ChevronRight size={18} className="text-gray-300" />
              </button>

              <button className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center">
                  <FileText size={18} className="text-gray-400 mr-3" />
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">Help & Guide</span>
                </div>
                <ChevronRight size={18} className="text-gray-300" />
              </button>
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center">
                  <Info size={18} className="text-gray-400 mr-3" />
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">About App</span>
                </div>
                <span className="text-xs text-gray-400 font-medium">v1.2.4</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Logout Button */}
      <div className="pt-2">
        <button 
          onClick={handleLogout}
          className="w-full bg-white dark:bg-gray-800 border-2 border-red-500 text-red-600 font-bold py-3.5 rounded-xl hover:bg-red-50 flex items-center justify-center transition-colors"
        >
          <LogOut size={20} className="mr-2" />
          Log Out
        </button>
        <p className="text-[11px] text-gray-500 dark:text-gray-400 text-center mt-2 font-medium">You will be logged out from this device.</p>
      </div>
    </div>
  );
};
