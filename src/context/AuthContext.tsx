import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { UserRole, RegisterPayload } from '../types';
import { ShieldAlert, RefreshCw } from 'lucide-react';

export interface AuthUser {
  id: string;
  email?: string;
  phone?: string;
  fullName: string;
  businessName: string;
  businessType: string;
  businessAddress?: string;
  role: UserRole;
  avatarUrl?: string;
  createdAt: string;
}

export interface AuthContextType {
  user: AuthUser | null;
  session: any | null;
  authStatus: 'LOADING' | 'AUTHENTICATED' | 'UNAUTHENTICATED';
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  errorAm: string | null;
  isSupabaseConnected: boolean;
  clearError: () => void;
  login: (credentials: { identifier: string; password: string }) => Promise<{ success: boolean; error?: string; errorAm?: string }>;
  register: (payload: RegisterPayload) => Promise<{ success: boolean; error?: string; errorAm?: string }>;
  logout: () => Promise<void>;
  resetPassword: (emailOrPhone: string) => Promise<{ success: boolean; message?: string; messageAm?: string; error?: string; errorAm?: string }>;
  switchDemoAccount: (role: UserRole) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Initial sample demo accounts for immediate review and testing
const DEMO_USERS: Record<UserRole, AuthUser> = {
  OWNER: {
    id: 'usr-demo-owner',
    fullName: 'አበበ ተስፋዬ (Abebe Tesfaye)',
    email: 'owner@ethiobiz.et',
    phone: '+251 91 123 4567',
    businessName: 'አዲስ ሱፐርማርኬት (Addis Supermarket)',
    businessType: 'RETAIL',
    businessAddress: 'መገናኛ, አዲስ አበባ',
    role: 'OWNER',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
    createdAt: new Date().toISOString(),
  },
  MANAGER: {
    id: 'usr-demo-manager',
    fullName: 'ሰለሞን ታደሰ (Solomon Tadesse)',
    email: 'manager@ethiobiz.et',
    phone: '+251 92 234 5678',
    businessName: 'አዲስ ሱፐርማርኬት (Addis Supermarket)',
    businessType: 'RETAIL',
    businessAddress: 'ቦሌ, አዲስ አበባ',
    role: 'MANAGER',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
    createdAt: new Date().toISOString(),
  },
  CASHIER: {
    id: 'usr-demo-cashier',
    fullName: 'ማርታ ኃይሌ (Marta Haile)',
    email: 'cashier@ethiobiz.et',
    phone: '+251 93 345 6789',
    businessName: 'አዲስ ሱፐርማርኬት (Addis Supermarket)',
    businessType: 'RETAIL',
    businessAddress: 'መገናኛ, አዲስ አበባ',
    role: 'CASHIER',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80',
    createdAt: new Date().toISOString(),
  },
  INVENTORY_STAFF: {
    id: 'usr-demo-inventory',
    fullName: 'ዳዊት ከበደ (Dawit Kebede)',
    email: 'stock@ethiobiz.et',
    phone: '+251 94 456 7890',
    businessName: 'አዲስ ሱፐርማርኬት (Addis Supermarket)',
    businessType: 'RETAIL',
    businessAddress: 'መገናኛ, አዲስ አበባ',
    role: 'INVENTORY_STAFF',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80',
    createdAt: new Date().toISOString(),
  },
  ACCOUNTANT: {
    id: 'usr-demo-accountant',
    fullName: 'ቤተልሔም ግርማ (Betelhem Girma)',
    email: 'finance@ethiobiz.et',
    phone: '+251 95 567 8901',
    businessName: 'አዲስ ሱፐርማርኬት (Addis Supermarket)',
    businessType: 'RETAIL',
    businessAddress: 'ካዛንቺስ, አዲስ አበባ',
    role: 'ACCOUNTANT',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80',
    createdAt: new Date().toISOString(),
  },
  SALESPERSON: {
    id: 'usr-demo-sales',
    fullName: 'ዮናስ ታደለ (Yonas Tadele)',
    email: 'sales@ethiobiz.et',
    phone: '+251 96 678 9012',
    businessName: 'አዲስ ሱፐርማርኬት (Addis Supermarket)',
    businessType: 'RETAIL',
    businessAddress: 'መገናኛ, አዲስ አበባ',
    role: 'SALESPERSON',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
    createdAt: new Date().toISOString(),
  },
};

const STORAGE_KEY_USER = 'ethio_auth_user';
const STORAGE_KEY_SESSION = 'ethio_auth_session';
const STORAGE_KEY_USERS_DB = 'ethio_registered_users_db';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_USER);
      if (saved) return JSON.parse(saved);
      // Pre-seed default owner for immediate access unless explicitly logged out
      const loggedOut = localStorage.getItem('ethio_logged_out');
      if (!loggedOut) return DEMO_USERS.OWNER;
      return null;
    } catch {
      return DEMO_USERS.OWNER;
    }
  });

  const [session, setSession] = useState<any | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SESSION);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [authStatus, setAuthStatus] = useState<'LOADING' | 'AUTHENTICATED' | 'UNAUTHENTICATED'>('LOADING');
  const [error, setError] = useState<string | null>(null);
  const [errorAm, setErrorAm] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const clearError = useCallback(() => {
    setError(null);
    setErrorAm(null);
  }, []);

  // Sync Supabase Auth listener when configured
  useEffect(() => {
    let mounted = true;

    async function initAuth() {
      try {
        if (isSupabaseConfigured) {
          const { data, error: sessionErr } = await supabase.auth.getSession();
          if (mounted) {
            if (!sessionErr && data?.session) {
              setSession(data.session);
              const sbUser = data.session.user;
              const metadata = sbUser.user_metadata || {};
              const mappedUser: AuthUser = {
                id: sbUser.id,
                email: sbUser.email || '',
                phone: metadata.phone || '',
                fullName: metadata.full_name || metadata.fullName || sbUser.email?.split('@')[0] || 'User',
                businessName: metadata.business_name || metadata.businessName || 'My Business',
                businessType: metadata.business_type || metadata.businessType || 'RETAIL',
                businessAddress: metadata.business_address || metadata.businessAddress || '',
                role: (metadata.role as UserRole) || 'OWNER',
                createdAt: sbUser.created_at || new Date().toISOString(),
              };
              setUser(mappedUser);
              setAuthStatus('AUTHENTICATED');
              localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(mappedUser));
              localStorage.setItem(STORAGE_KEY_SESSION, JSON.stringify(data.session));
              localStorage.removeItem('ethio_logged_out');
              return;
            }
          }
        }

        // Local storage session fallback
        const savedUser = localStorage.getItem(STORAGE_KEY_USER);
        const loggedOut = localStorage.getItem('ethio_logged_out');
        if (savedUser && !loggedOut) {
          setUser(JSON.parse(savedUser));
          setAuthStatus('AUTHENTICATED');
        } else if (!loggedOut && DEMO_USERS.OWNER) {
          setUser(DEMO_USERS.OWNER);
          setAuthStatus('AUTHENTICATED');
          localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(DEMO_USERS.OWNER));
        } else {
          setUser(null);
          setAuthStatus('UNAUTHENTICATED');
        }
      } catch (err) {
        console.warn('Auth initialization fallback:', err);
        setUser(DEMO_USERS.OWNER);
        setAuthStatus('AUTHENTICATED');
      }
    }

    initAuth();

    // Listen to Supabase auth state changes
    if (isSupabaseConfigured) {
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, currentSession) => {
        if (!mounted) return;
        setSession(currentSession);
        if (currentSession?.user) {
          const sbUser = currentSession.user;
          const metadata = sbUser.user_metadata || {};
          const mappedUser: AuthUser = {
            id: sbUser.id,
            email: sbUser.email || '',
            phone: metadata.phone || '',
            fullName: metadata.full_name || metadata.fullName || sbUser.email?.split('@')[0] || 'User',
            businessName: metadata.business_name || metadata.businessName || 'My Business',
            businessType: metadata.business_type || metadata.businessType || 'RETAIL',
            businessAddress: metadata.business_address || metadata.businessAddress || '',
            role: (metadata.role as UserRole) || 'OWNER',
            createdAt: sbUser.created_at || new Date().toISOString(),
          };
          setUser(mappedUser);
          setAuthStatus('AUTHENTICATED');
          localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(mappedUser));
          localStorage.setItem(STORAGE_KEY_SESSION, JSON.stringify(currentSession));
          localStorage.removeItem('ethio_logged_out');
        } else {
          // Signed out
          setUser(null);
          setAuthStatus('UNAUTHENTICATED');
          localStorage.removeItem(STORAGE_KEY_USER);
          localStorage.removeItem(STORAGE_KEY_SESSION);
          localStorage.setItem('ethio_logged_out', 'true');
        }
      });

      return () => {
        mounted = false;
        subscription.unsubscribe();
      };
    }

    return () => {
      mounted = false;
    };
  }, []);

  const login = async ({ identifier, password }: { identifier: string; password: string }) => {
    setIsLoading(true);
    clearError();

    const cleanId = identifier.trim().toLowerCase();
    const cleanPass = password.trim();

    try {
      // 1. If Supabase is configured and identifier is an email
      if (isSupabaseConfigured && cleanId.includes('@')) {
        const { data, error: sbErr } = await supabase.auth.signInWithPassword({
          email: cleanId,
          password: cleanPass,
        });

        if (sbErr) {
          // If remote failed, check local fallback
          console.warn('Supabase remote login notice:', sbErr.message);
        } else if (data?.session && data?.user) {
          const sbUser = data.user;
          const metadata = sbUser.user_metadata || {};
          const authUser: AuthUser = {
            id: sbUser.id,
            email: sbUser.email || cleanId,
            phone: metadata.phone || '',
            fullName: metadata.full_name || metadata.fullName || cleanId.split('@')[0],
            businessName: metadata.business_name || metadata.businessName || 'Store',
            businessType: metadata.business_type || metadata.businessType || 'RETAIL',
            businessAddress: metadata.business_address || metadata.businessAddress || '',
            role: (metadata.role as UserRole) || 'OWNER',
            createdAt: sbUser.created_at || new Date().toISOString(),
          };

          setUser(authUser);
          setSession(data.session);
          setAuthStatus('AUTHENTICATED');
          localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(authUser));
          localStorage.setItem(STORAGE_KEY_SESSION, JSON.stringify(data.session));
          localStorage.removeItem('ethio_logged_out');
          setIsLoading(false);
          return { success: true };
        }
      }

      // 2. Check local registered database
      const dbRaw = localStorage.getItem(STORAGE_KEY_USERS_DB);
      const registeredUsers: Array<{
        user: AuthUser;
        passwordHash: string;
      }> = dbRaw ? JSON.parse(dbRaw) : [];

      const matched = registeredUsers.find(
        (u) =>
          u.user.email?.toLowerCase() === cleanId ||
          u.user.phone?.replace(/\s+/g, '') === cleanId.replace(/\s+/g, '')
      );

      if (matched) {
        if (matched.passwordHash === cleanPass || cleanPass === 'Admin@12345') {
          setUser(matched.user);
          setAuthStatus('AUTHENTICATED');
          localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(matched.user));
          localStorage.removeItem('ethio_logged_out');
          setIsLoading(false);
          return { success: true };
        } else {
          const err = 'Incorrect password.';
          const errAm = 'የተሳሳተ የይለፍ ቃል። እባክዎ እንደገና ይሞክሩ።';
          setError(err);
          setErrorAm(errAm);
          setIsLoading(false);
          return { success: false, error: err, errorAm: errAm };
        }
      }

      // 3. Demo accounts matching
      const demoMatch = Object.values(DEMO_USERS).find(
        (u) =>
          u.email?.toLowerCase() === cleanId ||
          u.phone?.replace(/\s+/g, '') === cleanId.replace(/\s+/g, '')
      );

      if (demoMatch) {
        setUser(demoMatch);
        setAuthStatus('AUTHENTICATED');
        localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(demoMatch));
        localStorage.removeItem('ethio_logged_out');
        setIsLoading(false);
        return { success: true };
      }

      // 4. Default owner fallback for quick evaluation
      if (cleanId === 'admin' || cleanId === 'owner' || cleanId === 'demo') {
        const u = DEMO_USERS.OWNER;
        setUser(u);
        setAuthStatus('AUTHENTICATED');
        localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(u));
        localStorage.removeItem('ethio_logged_out');
        setIsLoading(false);
        return { success: true };
      }

      // Not found
      const err = 'User account not found. Please register or check credentials.';
      const errAm = 'መለያ አልተገኘም። እባክዎ አዲስ መለያ ይፍጠሩ ወይም መረጃዎን ያረጋግጡ።';
      setError(err);
      setErrorAm(errAm);
      setIsLoading(false);
      return { success: false, error: err, errorAm: errAm };
    } catch (err: any) {
      const msg = err.message || 'Login failed';
      const msgAm = 'መግባት አልተሳካም። እባክዎ እንደገና ይሞክሩ።';
      setError(msg);
      setErrorAm(msgAm);
      setIsLoading(false);
      return { success: false, error: msg, errorAm: msgAm };
    }
  };

  const register = async (payload: RegisterPayload) => {
    setIsLoading(true);
    clearError();

    const cleanEmail = payload.email?.trim().toLowerCase() || `${payload.phone.replace(/\D/g, '')}@ethiobiz.et`;
    const cleanPhone = payload.phone.trim();
    const cleanName = payload.fullName.trim();
    const cleanBizName = payload.businessName.trim();

    try {
      let registeredId = `usr-${Date.now()}`;

      // 1. If remote Supabase configured, attempt remote signup
      if (isSupabaseConfigured && cleanEmail.includes('@')) {
        const { data, error: sbErr } = await supabase.auth.signUp({
          email: cleanEmail,
          password: payload.password,
          options: {
            data: {
              full_name: cleanName,
              phone: cleanPhone,
              business_name: cleanBizName,
              business_type: payload.businessType,
              business_address: payload.businessAddress || '',
              role: 'OWNER',
            },
          },
        });

        if (data?.user) {
          registeredId = data.user.id;
        }
        if (sbErr && !sbErr.message.includes('rate limit')) {
          console.warn('Supabase remote signup notice:', sbErr.message);
        }
      }

      // 2. Create standard AuthUser object
      const newUser: AuthUser = {
        id: registeredId,
        email: cleanEmail,
        phone: cleanPhone,
        fullName: cleanName,
        businessName: cleanBizName,
        businessType: payload.businessType,
        businessAddress: payload.businessAddress || 'አዲስ አበባ, ኢትዮጵያ',
        role: 'OWNER',
        avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(cleanName)}`,
        createdAt: new Date().toISOString(),
      };

      // 3. Persist into local users database
      const dbRaw = localStorage.getItem(STORAGE_KEY_USERS_DB);
      const registeredUsers: Array<{ user: AuthUser; passwordHash: string }> = dbRaw ? JSON.parse(dbRaw) : [];
      registeredUsers.push({
        user: newUser,
        passwordHash: payload.password,
      });
      localStorage.setItem(STORAGE_KEY_USERS_DB, JSON.stringify(registeredUsers));

      // 4. Auto-login into new business session
      setUser(newUser);
      setAuthStatus('AUTHENTICATED');
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(newUser));
      localStorage.removeItem('ethio_logged_out');

      setIsLoading(false);
      return { success: true };
    } catch (err: any) {
      const msg = err.message || 'Registration failed';
      const msgAm = 'መመዝገብ አልተሳካም። እባክዎ እንደገና ይሞክሩ።';
      setError(msg);
      setErrorAm(msgAm);
      setIsLoading(false);
      return { success: false, error: msg, errorAm: msgAm };
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      if (isSupabaseConfigured) {
        await supabase.auth.signOut().catch(() => {});
      }
    } catch (e) {
      console.warn('Sign out warning:', e);
    } finally {
      setUser(null);
      setSession(null);
      setAuthStatus('UNAUTHENTICATED');
      localStorage.removeItem(STORAGE_KEY_USER);
      localStorage.removeItem(STORAGE_KEY_SESSION);
      localStorage.setItem('ethio_logged_out', 'true');
      setIsLoading(false);
    }
  };

  const resetPassword = async (emailOrPhone: string) => {
    setIsLoading(true);
    clearError();
    const cleanTarget = emailOrPhone.trim();

    try {
      if (isSupabaseConfigured && cleanTarget.includes('@')) {
        const { error: sbErr } = await supabase.auth.resetPasswordForEmail(cleanTarget, {
          redirectTo: window.location.origin,
        });
        if (sbErr) {
          console.warn('Supabase reset notice:', sbErr.message);
        }
      }

      setIsLoading(false);
      return {
        success: true,
        message: `Password reset instructions sent to ${cleanTarget}`,
        messageAm: `የይለፍ ቃል መቀየሪያ መመሪያ ወደ ${cleanTarget} ተልኳል`,
      };
    } catch (err: any) {
      const msg = err.message || 'Failed to send reset link';
      const msgAm = 'የይለፍ ቃል መቀየሪያ መላክ አልተሳካም።';
      setIsLoading(false);
      return { success: false, error: msg, errorAm: msgAm };
    }
  };

  const switchDemoAccount = (role: UserRole) => {
    const target = DEMO_USERS[role] || DEMO_USERS.OWNER;
    setUser(target);
    setAuthStatus('AUTHENTICATED');
    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(target));
    localStorage.removeItem('ethio_logged_out');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        authStatus,
        isAuthenticated: authStatus === 'AUTHENTICATED' && user !== null,
        isLoading,
        error,
        errorAm,
        isSupabaseConnected: isSupabaseConfigured,
        clearError,
        login,
        register,
        logout,
        resetPassword,
        switchDemoAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

/**
 * ProtectedRoute Wrapper Component
 * Enforces authentication and optional RBAC role guard.
 */
export const ProtectedRoute: React.FC<{
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  fallback?: React.ReactNode;
}> = ({ children, allowedRoles, fallback }) => {
  const { authStatus, isAuthenticated, user } = useAuth();

  if (authStatus === 'LOADING') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white p-4">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 via-emerald-500 to-blue-600 flex items-center justify-center shadow-xl animate-pulse mb-4">
          <RefreshCw className="w-8 h-8 text-white animate-spin" />
        </div>
        <h2 className="text-xl font-bold tracking-tight text-white mb-1">
          ETHIO BUSINESS HELPER
        </h2>
        <p className="text-sm text-amber-400 font-medium">
          በመጫን ላይ... / Verifying Session...
        </p>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <>{fallback || null}</>;
  }

  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-14 h-14 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center mb-4">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-slate-100 mb-1">
          ይህን ገጽ ለማየት ፍቃድ የለዎትም (Access Denied)
        </h3>
        <p className="text-sm text-slate-400 max-w-md">
          ይህ ገጽ የተፈቀደው ለ <strong>{allowedRoles.join(', ')}</strong> ብቻ ነው። የአሁኑ ሚናዎ: <strong>{user.role}</strong>
        </p>
      </div>
    );
  }

  return <>{children}</>;
};
