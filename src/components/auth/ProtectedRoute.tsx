import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { AuthView } from './AuthView';
import { UserRole } from '../../types';
import { ShieldAlert, RefreshCw } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  fallback?: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
  fallback,
}) => {
  const { authStatus, isAuthenticated, user } = useAuth();

  // Loading state with branded spinner
  if (authStatus === 'LOADING') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-white p-4">
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

  // Not logged in -> Render AuthView
  if (!isAuthenticated || !user) {
    return fallback ? <>{fallback}</> : <AuthView />;
  }

  // Role guard check
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

export default ProtectedRoute;
