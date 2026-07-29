import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';

export const Login: React.FC = () => {
  const { login, isAuthenticated, user } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // If already authenticated, redirect based on role
  if (isAuthenticated && user) {
    const userRole = typeof user.role === 'string' ? user.role : (user.role as any)?.name;
    if (userRole === 'ADMIN' || userRole === 'MANAGER') {
      return <Navigate to="/" replace />;
    } else if (userRole === 'QC_INSPECTOR' || userRole === 'QC_CHECKER') {
      return <Navigate to="/qc/dashboard" replace />;
    } else if (userRole === 'OPERATOR') {
      return <Navigate to="/operator/dashboard" replace />;
    } else {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.reload(); 
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login({ email, password });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f7f9] flex font-sans">
      {/* Left Side */}
      <div className="hidden lg:flex lg:w-1/2 flex-col pt-16 px-16 relative">
        <div className="flex items-center h-14 mb-16">
          <img
            src="/villagekart_svg_icon-2.svg"
            alt="VillagKart"
            className="max-w-[180px] h-full object-contain"
          />
        </div>
        
        <div className="z-10">
          <h1 className="text-[36px] leading-tight font-bold text-slate-900">Welcome back!</h1>
          <h2 className="text-[24px] font-bold text-[#00891D] mt-1">Please login to your account</h2>
        </div>
        
        <div className="absolute bottom-0 left-0 w-full flex items-end justify-start px-8 pb-4 pointer-events-none">
          <img src="/login_illustration.png" alt="Login Illustration" className="w-full max-h-[65vh] object-contain object-left-bottom mix-blend-darken" />
        </div>
      </div>

      {/* Right Side */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 sm:px-16 lg:px-24">
        <div className="w-full max-w-md mx-auto">
          {/* Mobile Logo */}
          <div className="flex lg:hidden items-center h-14 mb-12 justify-center">
            <img
              src="/villagekart_svg_icon-2.svg"
              alt="VillagKart"
              className="max-w-[180px] h-full object-contain"
            />
          </div>

          <h3 className="text-3xl font-bold text-slate-900 mb-8">Hey Welcome!</h3>
          
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                {error}
              </div>
            )}
            
            <div>
              <label className="block text-[13px] font-medium text-slate-600 mb-2">
                Enter your Email or Mobile Number here
              </label>
              <input
                type="text"
                required
                className="block w-full px-4 py-3 border border-slate-200 rounded-lg text-sm placeholder-slate-400 focus:outline-none focus:border-[#00891D] focus:ring-1 focus:ring-[#00891D] bg-white transition-colors"
                placeholder="uniquepartner@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-[13px] font-medium text-slate-600 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  className="block w-full px-4 py-3 border border-slate-200 rounded-lg text-sm placeholder-slate-400 focus:outline-none focus:border-[#00891D] focus:ring-1 focus:ring-[#00891D] bg-white transition-colors"
                  placeholder="••••••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <a href="#" className="text-[13px] font-medium text-slate-700 hover:text-[#00891D]">
                Forgot Password?
              </a>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center py-3.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-[#00891D] hover:bg-[#007018] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#00891D] disabled:opacity-70 disabled:cursor-not-allowed transition-all"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  'Login'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
