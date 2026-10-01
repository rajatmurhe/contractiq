import React, { createContext, useContext, useState, ReactNode } from 'react';

interface AuthContextType {
  user: any;
  token: string | null;
  login: () => void;
  logout: () => void;
  isAuthenticated: boolean;
  tenantId: string | null;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>('mock-token');
  const [user, setUser] = useState<any>({ name: 'Admin' });
  
  const login = () => { setToken('mock-token'); setUser({ name: 'Admin' }); };
  const logout = () => { setToken(null); setUser(null); };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      login,
      logout,
      isAuthenticated: !!token,
      tenantId: 'tenant-1'
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
