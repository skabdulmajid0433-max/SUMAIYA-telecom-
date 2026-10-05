import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';

interface AuthContextType {
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  isAdmin: boolean;
  isManager: boolean;
  isStaff: boolean;
  canAccessFinances: boolean;
  canManageSettings: boolean;
  canManageStaff: boolean;
  canManageSuppliers: boolean;
  canDeleteRecords: boolean;
  loginAsUser: (user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Default to owner sk abdulmajid for shop operations
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('sumaiya_active_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    return {
      id: 'usr-1',
      name: 'sk abdulmajid',
      role: 'admin',
      username: 'owner',
      pin: '1234',
      phone: '9679100433',
      active: true
    };
  });

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('sumaiya_active_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('sumaiya_active_user');
    }
  }, [currentUser]);

  const role: UserRole = currentUser?.role || 'staff';
  const isAdmin = role === 'admin';
  const isManager = role === 'manager' || role === 'admin';
  const isStaff = true; // All authenticated roles have staff capabilities

  const canAccessFinances = isAdmin || isManager;
  const canManageSettings = isAdmin;
  const canManageStaff = isAdmin;
  const canManageSuppliers = isAdmin || isManager;
  const canDeleteRecords = isAdmin;

  const loginAsUser = (user: User) => {
    setCurrentUser(user);
  };

  const logout = () => {
    // Return to default admin or null
    setCurrentUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        isAdmin,
        isManager,
        isStaff,
        canAccessFinances,
        canManageSettings,
        canManageStaff,
        canManageSuppliers,
        canDeleteRecords,
        loginAsUser,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
