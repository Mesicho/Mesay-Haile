import { RegisterPayload, User, Business, UserBusinessInfo } from '../types';

const TOKEN_STORAGE_KEY = 'ethio_biz_auth_token';

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    fullName: string;
    phone: string;
    email?: string;
    role: any;
    status: string;
    avatarUrl?: string;
    createdAt?: string;
    lastLoginAt?: string;
  };
  business: {
    id: string;
    name: string;
    businessType?: string;
    phone?: string;
    address?: string;
    ownerId?: string;
    createdAt?: string;
  };
  businesses?: UserBusinessInfo[];
  isNewBusiness?: boolean;
}

export function getStoredAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function setStoredAuthToken(token: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TOKEN_STORAGE_KEY, token);
}

export function clearStoredAuthToken(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TOKEN_STORAGE_KEY);
}

/**
 * Normalizes Ethiopian phone numbers to international standard +251XXXXXXXXX
 */
export function normalizeEthiopianPhone(input: string): string | null {
  if (!input) return null;
  const cleaned = input.trim().replace(/[\s\-()]/g, '');

  if (/^\+251[97]\d{8}$/.test(cleaned)) return cleaned;
  if (/^251[97]\d{8}$/.test(cleaned)) return `+${cleaned}`;
  if (/^0[97]\d{8}$/.test(cleaned)) return `+251${cleaned.substring(1)}`;
  if (/^[97]\d{8}$/.test(cleaned)) return `+251${cleaned}`;
  return null;
}

/**
 * Password strength evaluator
 * Returns 'WEAK' | 'MEDIUM' | 'STRONG' and score (1 to 4)
 */
export function checkPasswordStrength(password: string): {
  strength: 'WEAK' | 'MEDIUM' | 'STRONG';
  score: number;
  labelEn: string;
  labelAm: string;
  color: string;
} {
  if (!password || password.length < 8) {
    return { strength: 'WEAK', score: 1, labelEn: 'Weak', labelAm: 'ደካማ', color: 'bg-red-500 text-red-500' };
  }

  let score = 0;
  if (password.length >= 8) score += 1;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score += 1;

  if (score >= 4) {
    return { strength: 'STRONG', score: 4, labelEn: 'Strong', labelAm: 'በጣም ጠንካራ', color: 'bg-emerald-500 text-emerald-500' };
  } else if (score >= 3) {
    return { strength: 'MEDIUM', score: 3, labelEn: 'Medium', labelAm: 'መካከለኛ', color: 'bg-amber-500 text-amber-500' };
  }
  return { strength: 'WEAK', score: 2, labelEn: 'Weak', labelAm: 'ደካማ', color: 'bg-red-500 text-red-500' };
}

/**
 * Auth API client calls
 */
export async function apiLogin(credentials: { identifier: string; password: string }): Promise<{
  success: boolean;
  data?: AuthResponse;
  error?: string;
  errorAm?: string;
}> {
  try {
    const res = await fetch('/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });

    const body = await res.json();
    if (!res.ok || !body.success) {
      return {
        success: false,
        error: body.error?.message || 'Login failed',
        errorAm: body.error?.message_am || 'መግባት አልተቻለም',
      };
    }

    if (body.data?.token) {
      setStoredAuthToken(body.data.token);
    }

    return { success: true, data: body.data };
  } catch (err: any) {
    return {
      success: false,
      error: 'Network error. Please check your internet connection.',
      errorAm: 'የኢንተርኔት ግንኙነት ችግር አለ። እባክዎ እንደገና ይሞክሩ።',
    };
  }
}

export async function apiRegister(payload: RegisterPayload): Promise<{
  success: boolean;
  data?: AuthResponse;
  error?: string;
  errorAm?: string;
}> {
  try {
    const res = await fetch('/api/v1/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const body = await res.json();
    if (!res.ok || !body.success) {
      return {
        success: false,
        error: body.error?.message || 'Registration failed',
        errorAm: body.error?.message_am || 'መመዝገብ አልተቻለም',
      };
    }

    if (body.data?.token) {
      setStoredAuthToken(body.data.token);
    }

    return { success: true, data: body.data };
  } catch (err: any) {
    return {
      success: false,
      error: 'Network error. Please check your internet connection.',
      errorAm: 'የኢንተርኔት ግንኙነት ችግር አለ። እባክዎ እንደገና ይሞክሩ።',
    };
  }
}

export async function apiGetMe(): Promise<{
  success: boolean;
  data?: any;
  error?: string;
  errorAm?: string;
  isExpired?: boolean;
}> {
  const token = getStoredAuthToken();
  if (!token) {
    return { success: false, error: 'No active session' };
  }

  try {
    const res = await fetch('/api/v1/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    });

    const body = await res.json();
    if (res.status === 401) {
      clearStoredAuthToken();
      return {
        success: false,
        isExpired: true,
        error: 'Session expired',
        errorAm: 'የመግቢያ ጊዜዎ አልቋል። እባክዎ እንደገና ይግቡ።',
      };
    }

    if (!res.ok || !body.success) {
      return { success: false, error: body.error?.message };
    }

    return { success: true, data: body.data };
  } catch (err: any) {
    return {
      success: false,
      error: 'Network error',
      errorAm: 'የኢንተርኔት ግንኙነት ችግር አለ',
    };
  }
}

export async function apiLogout(): Promise<void> {
  const token = getStoredAuthToken();
  if (token) {
    try {
      await fetch('/api/v1/auth/logout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {}
  }
  clearStoredAuthToken();
}

export async function apiLogoutAll(): Promise<void> {
  const token = getStoredAuthToken();
  if (token) {
    try {
      await fetch('/api/v1/auth/logout-all', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {}
  }
  clearStoredAuthToken();
}

export async function apiChangePassword(params: {
  currentPassword: string;
  newPassword: string;
}): Promise<{ success: boolean; error?: string; errorAm?: string }> {
  const token = getStoredAuthToken();
  if (!token) return { success: false, error: 'Not authenticated', errorAm: 'እባክዎ መጀመሪያ ይግቡ' };

  try {
    const res = await fetch('/api/v1/auth/change-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(params),
    });

    const body = await res.json();
    if (!res.ok || !body.success) {
      return {
        success: false,
        error: body.error?.message || 'Failed to change password',
        errorAm: body.error?.message_am || 'የይለፍ ቃል መቀየር አልተቻለም',
      };
    }

    return { success: true };
  } catch {
    return {
      success: false,
      error: 'Network error',
      errorAm: 'የኢንተርኔት ግንኙነት ችግር አለ',
    };
  }
}

export async function apiForgotPassword(identifier: string): Promise<{
  success: boolean;
  resetToken?: string;
  error?: string;
  errorAm?: string;
}> {
  try {
    const res = await fetch('/api/v1/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier }),
    });

    const body = await res.json();
    if (!res.ok || !body.success) {
      return {
        success: false,
        error: body.error?.message || 'Failed to generate reset request',
        errorAm: body.error?.message_am || 'የይለፍ ቃል መቀየሪያ ጥያቄ አልተሳካም',
      };
    }

    return { success: true, resetToken: body.data?.resetToken };
  } catch {
    return {
      success: false,
      error: 'Network error',
      errorAm: 'የኢንተርኔት ግንኙነት ችግር አለ',
    };
  }
}

export async function apiResetPassword(params: {
  resetToken: string;
  newPassword: string;
}): Promise<{ success: boolean; error?: string; errorAm?: string }> {
  try {
    const res = await fetch('/api/v1/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    const body = await res.json();
    if (!res.ok || !body.success) {
      return {
        success: false,
        error: body.error?.message || 'Failed to reset password',
        errorAm: body.error?.message_am || 'የይለፍ ቃል መቀየር አልተሳካም',
      };
    }

    return { success: true };
  } catch {
    return {
      success: false,
      error: 'Network error',
      errorAm: 'የኢንተርኔት ግንኙነት ችግር አለ',
    };
  }
}

export async function apiSwitchBusiness(businessId: string): Promise<{
  success: boolean;
  data?: any;
  error?: string;
}> {
  const token = getStoredAuthToken();
  if (!token) return { success: false, error: 'Not authenticated' };

  try {
    const res = await fetch('/api/v1/auth/switch-business', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ businessId }),
    });

    const body = await res.json();
    if (!res.ok || !body.success) {
      return { success: false, error: body.error?.message };
    }

    return { success: true, data: body.data };
  } catch {
    return { success: false, error: 'Network error' };
  }
}
