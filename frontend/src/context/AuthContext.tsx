import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { authService } from '../api/authService';
import type { User, LoginCredentials } from '../api/authService';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Helper to determine storage keys based on current path
  const getStorageKeys = (path: string = window.location.pathname) => {
    if (path.startsWith('/operator')) {
      return { tokenKey: 'token_operator', userKey: 'user_operator' };
    } else if (path.startsWith('/qc')) {
      return { tokenKey: 'token_qc', userKey: 'user_qc' };
    } else {
      return { tokenKey: 'token_admin', userKey: 'user_admin' };
    }
  };

  // Restore session on mount
  useEffect(() => {
    const { tokenKey, userKey } = getStorageKeys();
    const storedToken = localStorage.getItem(tokenKey) || localStorage.getItem('token_admin') || localStorage.getItem('token');
    const storedUser = localStorage.getItem(userKey) || localStorage.getItem('user_admin') || localStorage.getItem('user');

    if (storedToken && storedUser) {
      setToken(storedToken);
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error('Failed to parse user from local storage', e);
        localStorage.removeItem(userKey);
        localStorage.removeItem(tokenKey);
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (credentials: LoginCredentials) => {
    const response = await authService.login(credentials);
    const { token, user } = response.data;
    
    setToken(token);
    setUser(user);
    
    const userRole = typeof user.role === 'string' ? user.role : (user.role as any)?.name;
    const currentPath = window.location.pathname;

    // Save to portal-isolated keys based on role and current portal path
    if (userRole === 'OPERATOR' || currentPath.startsWith('/operator')) {
      localStorage.setItem('token_operator', token);
      localStorage.setItem('user_operator', JSON.stringify(user));
    } else if (userRole === 'QC' || userRole === 'QC_INSPECTOR' || userRole === 'QC_CHECKER' || currentPath.startsWith('/qc')) {
      localStorage.setItem('token_qc', token);
      localStorage.setItem('user_qc', JSON.stringify(user));
    } else {
      localStorage.setItem('token_admin', token);
      localStorage.setItem('user_admin', JSON.stringify(user));
    }

    // Fallback sync for admin/manager users accessing all portals
    if (userRole === 'ADMIN' || userRole === 'MANAGER') {
      localStorage.setItem('token_admin', token);
      localStorage.setItem('user_admin', JSON.stringify(user));
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    
    const { tokenKey, userKey } = getStorageKeys();
    localStorage.removeItem(tokenKey);
    localStorage.removeItem(userKey);
    
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
