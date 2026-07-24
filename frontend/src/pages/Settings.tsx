import React, { useState, useEffect } from "react";
import { Settings as SettingsIcon, Save, User } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";

export const Settings: React.FC = () => {
  const { user } = useAuth();
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [role, setRole] = useState(typeof user?.role === 'string' ? user.role : (user?.role as any)?.name || "User");
  const [theme, setTheme] = useState("light");
  const [printerIP, setPrinterIP] = useState("192.168.1.100");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (user?.id) {
      api.get(`/settings/${user.id}`)
        .then(res => {
          if (res.data.data) {
            setTheme(res.data.data.theme || "light");
            if (res.data.data.payload?.printerIP) {
              setPrinterIP(res.data.data.payload.printerIP);
            }
            if (res.data.data.user) {
              setName(res.data.data.user.name || "");
              setEmail(res.data.data.user.email || "");
              setRole(res.data.data.user.role?.name || "User");
            }
          }
        })
        .finally(() => setLoading(false));
    }
  }, [user]);

  const handleSave = async () => {
    if (!user?.id) return;
    setSaving(true);
    setMessage("");
    try {
      await api.put(`/settings/${user.id}`, {
        theme,
        payload: { printerIP }
      });
      setMessage("Profile settings saved successfully!");
    } catch (error) {
      setMessage("Failed to save profile settings.");
    }
    setSaving(false);
  };

  if (loading) return <div className="p-8 flex justify-center items-center h-screen"><div className="w-8 h-8 border-4 border-[#00891D] border-t-transparent rounded-full animate-spin"></div></div>;

  const initials = (name || user?.name || "U")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="pb-20 min-h-screen bg-gray-50 dark:bg-gray-900 font-sans">
      {/* Dynamic Header Background */}
      <div className="bg-[#00891D] px-5 pt-8 pb-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
        <div className="max-w-3xl mx-auto relative z-10 flex items-center gap-4">
          <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center text-white shadow-inner border border-white/30">
            <User size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Account Settings</h2>
            <p className="text-green-100 text-sm mt-1 opacity-90">Manage your profile and application preferences</p>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto -mt-16 px-4 relative z-20">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl shadow-gray-200/50 dark:shadow-none border border-gray-100 dark:border-gray-700 overflow-hidden">
          
          <div className="p-6 sm:p-8 space-y-8">
            {/* Profile Avatar Section */}
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900 dark:to-green-800 flex items-center justify-center shadow-inner border-4 border-white dark:border-gray-800">
                <span className="text-2xl font-bold text-[#00891D] dark:text-green-400">{initials}</span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">{name || "Your Name"}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{role.replace("_", " ")}</p>
              </div>
            </div>

            <hr className="border-gray-100 dark:border-gray-700" />

            {/* Personal Details */}
            <div>
              <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <User size={14} />
                </div>
                Personal Details
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Full Name</label>
                  <input 
                    type="text"
                    value={name}
                    readOnly
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 text-sm cursor-not-allowed font-medium"
                    placeholder="Your Name"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Email Address</label>
                  <input 
                    type="email"
                    value={email}
                    readOnly
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 text-sm cursor-not-allowed font-medium"
                    placeholder="your.email@example.com"
                  />
                </div>
              </div>
            </div>

            <hr className="border-gray-100 dark:border-gray-700" />

            {/* Store Information */}
            <div>
              <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <SettingsIcon size={14} />
                </div>
                Store Details
              </h4>
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-5 border border-gray-200 dark:border-gray-600">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Store Name</p>
                    <p className="text-sm font-bold text-gray-900 dark:text-white">VillagKart Store</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Store ID</p>
                    <p className="text-sm font-bold text-gray-900 dark:text-white">VK-STORE-001</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Operating Hours</p>
                    <p className="text-sm font-bold text-gray-900 dark:text-white">08:00 AM - 08:00 PM</p>
                  </div>
                </div>
              </div>
            </div>

            <hr className="border-gray-100 dark:border-gray-700" />

            {/* Application Preferences */}
            <div>
              <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
                  <SettingsIcon size={14} />
                </div>
                Application Preferences
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Theme Preference</label>
                  <select 
                    value={theme}
                    onChange={(e) => {
                      setTheme(e.target.value);
                      setTimeout(handleSave, 100);
                    }}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white text-sm focus:bg-white dark:focus:bg-gray-800 focus:ring-2 focus:ring-[#00891D]/50 focus:border-[#00891D] transition-all duration-200 appearance-none cursor-pointer"
                  >
                    <option value="light">☀️ Light Mode</option>
                    <option value="dark">🌙 Dark Mode</option>
                    <option value="system">💻 System Default</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Default Printer IP</label>
                  <input 
                    type="text"
                    value={printerIP}
                    onChange={(e) => setPrinterIP(e.target.value)}
                    onBlur={() => handleSave()}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white text-sm font-mono focus:bg-white dark:focus:bg-gray-800 focus:ring-2 focus:ring-[#00891D]/50 focus:border-[#00891D] transition-all duration-200"
                    placeholder="e.g. 192.168.1.100"
                  />
                  <p className="text-[10px] text-gray-400 mt-1">Changes save automatically</p>
                </div>
              </div>
            </div>

            {message && (
              <div className={`p-4 rounded-xl flex items-center gap-3 text-sm font-bold transition-all duration-300 ${message.includes("success") ? "bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800" : "bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800"}`}>
                <div className={`w-2 h-2 rounded-full ${message.includes("success") ? "bg-green-500" : "bg-red-500"}`}></div>
                {message}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
