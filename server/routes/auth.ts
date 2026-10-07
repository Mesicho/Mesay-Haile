import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { ApiSuccessResponse, ApiErrorResponse, AuthenticatedUser } from '../types/api';

export const authRouter = Router();

// ============================================================
// 1. DATA MODELS & IN-MEMORY REPOSITORY (PERSISTENT ON SERVER)
// ============================================================

export interface StoredUser {
  id: string;
  fullName: string;
  phone: string;
  email?: string;
  passwordHash: string;
  salt: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'DEACTIVATED';
  avatarUrl?: string;
  createdAt: string;
  lastLoginAt?: string;
}

export interface StoredBusiness {
  id: string;
  name: string;
  businessType: string;
  phone: string;
  address?: string;
  ownerId: string;
  createdAt: string;
}

export interface StoredMembership {
  id: string;
  userId: string;
  businessId: string;
  role: 'OWNER' | 'MANAGER' | 'CASHIER' | 'INVENTORY_STAFF' | 'ACCOUNTANT' | 'SALESPERSON' | 'SUPER_ADMIN';
  status: 'ACTIVE' | 'SUSPENDED' | 'REVOKED';
  createdAt: string;
}

export interface StoredSession {
  token: string;
  userId: string;
  businessId: string;
  role: StoredMembership['role'];
  ipAddress: string;
  userAgent: string;
  deviceName: string;
  createdAt: string;
  lastUsedAt: string;
  expiresAt: string;
}

export interface PasswordResetToken {
  token: string;
  userId: string;
  expiresAt: number; // Unix timestamp
}

// In-memory persistent stores on server
export const usersStore: Map<string, StoredUser> = new Map();
export const businessesStore: Map<string, StoredBusiness> = new Map();
export const membershipsStore: StoredMembership[] = [];
export const sessionsStore: Map<string, StoredSession> = new Map();
export const passwordResetTokensStore: Map<string, PasswordResetToken> = new Map();

// Brute-force protection tracking
interface FailedAttempt {
  count: number;
  lockedUntil?: number;
  lastAttempt: number;
}
const failedAttempts: Map<string, FailedAttempt> = new Map();

// Helper for standard API responses
const sendSuccess = <T>(res: Response, data: T, status = 200) => {
  const response: ApiSuccessResponse<T> = {
    success: true,
    data,
    timestamp: new Date().toISOString(),
  };
  return res.status(status).json(response);
};

const sendError = (
  res: Response,
  status: number,
  code: string,
  message: string,
  message_am: string,
  details?: any
) => {
  const response: ApiErrorResponse = {
    success: false,
    error: {
      code,
      message,
      message_am,
      status,
      details,
    },
    timestamp: new Date().toISOString(),
  };
  return res.status(status).json(response);
};

// ============================================================
// 2. CRYPTOGRAPHIC & NORMALIZATION HELPERS
// ============================================================

export function hashPassword(password: string, salt?: string): { hash: string; salt: string } {
  const userSalt = salt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, userSalt, 10000, 64, 'sha256').toString('hex');
  return { hash, salt: userSalt };
}

export function verifyPassword(password: string, hash: string, salt: string): boolean {
  try {
    const computedHash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha256').toString('hex');
    const hashBuffer = Buffer.from(hash, 'hex');
    const computedBuffer = Buffer.from(computedHash, 'hex');
    if (hashBuffer.length !== computedBuffer.length) return false;
    return crypto.timingSafeEqual(hashBuffer, computedBuffer);
  } catch {
    return false;
  }
}

/**
 * Normalizes Ethiopian phone numbers to international standard +251XXXXXXXXX
 * Handles:
 * 0911223344 -> +251911223344
 * 0711223344 -> +251711223344
 * 911223344  -> +251911223344
 * +251911223344 -> +251911223344
 */
export function normalizeEthiopianPhone(input: string): string | null {
  if (!input) return null;
  const cleaned = input.trim().replace(/[\s\-()]/g, '');

  // If starts with +251 followed by 9 or 7 and 8 digits
  if (/^\+251[97]\d{8}$/.test(cleaned)) {
    return cleaned;
  }

  // If starts with 251 followed by 9 or 7 and 8 digits
  if (/^251[97]\d{8}$/.test(cleaned)) {
    return `+${cleaned}`;
  }

  // If starts with 09 or 07 and 8 digits
  if (/^0[97]\d{8}$/.test(cleaned)) {
    return `+251${cleaned.substring(1)}`;
  }

  // If starts directly with 9 or 7 and 8 digits
  if (/^[97]\d{8}$/.test(cleaned)) {
    return `+251${cleaned}`;
  }

  return null;
}

export function parseDeviceName(userAgent?: string): string {
  if (!userAgent) return 'Web Browser';
  if (/android/i.test(userAgent)) return 'Android Device';
  if (/iphone|ipad|ipod/i.test(userAgent)) return 'iOS Device';
  if (/macintosh|mac os x/i.test(userAgent)) return 'Mac Computer';
  if (/windows/i.test(userAgent)) return 'Windows PC';
  if (/linux/i.test(userAgent)) return 'Linux PC';
  return 'Web Client';
}

// ============================================================
// 3. INITIAL SEED ACCOUNTS (Default Business: Selam Supermarket)
// ============================================================

function seedInitialData() {
  if (usersStore.size > 0) return;

  const defaultSalt = 'ethio_secure_salt_2026';
  const defaultPass = 'EthioBiz2026!';
  const { hash: defaultHash } = hashPassword(defaultPass, defaultSalt);

  // Business 001
  businessesStore.set('biz_001', {
    id: 'biz_001',
    name: 'Selam Supermarket & Wholesale',
    businessType: 'Wholesale',
    phone: '+251911223344',
    address: 'Bole Medhanialem, Behind Edna Mall',
    ownerId: 'usr_01',
    createdAt: '2026-09-01T08:00:00Z',
  });

  // User 01: Abebe Bikila (Owner)
  usersStore.set('usr_01', {
    id: 'usr_01',
    fullName: 'አበበ ቢቂላ (Owner)',
    phone: '+251911223344',
    email: 'abebe@selam.et',
    passwordHash: defaultHash,
    salt: defaultSalt,
    status: 'ACTIVE',
    createdAt: '2026-09-01T08:00:00Z',
  });
  membershipsStore.push({
    id: 'mem_01',
    userId: 'usr_01',
    businessId: 'biz_001',
    role: 'OWNER',
    status: 'ACTIVE',
    createdAt: '2026-09-01T08:00:00Z',
  });

  // User 02: Hana Tadesse (Manager)
  usersStore.set('usr_02', {
    id: 'usr_02',
    fullName: 'ሃና ታደሰ (Manager)',
    phone: '+251920112233',
    email: 'hana@selam.et',
    passwordHash: defaultHash,
    salt: defaultSalt,
    status: 'ACTIVE',
    createdAt: '2026-09-01T08:00:00Z',
  });
  membershipsStore.push({
    id: 'mem_02',
    userId: 'usr_02',
    businessId: 'biz_001',
    role: 'MANAGER',
    status: 'ACTIVE',
    createdAt: '2026-09-01T08:00:00Z',
  });

  // User 03: Dawit Mekonnen (Cashier)
  usersStore.set('usr_03', {
    id: 'usr_03',
    fullName: 'ዳዊት መኮንን (Cashier)',
    phone: '+251931445566',
    passwordHash: defaultHash,
    salt: defaultSalt,
    status: 'ACTIVE',
    createdAt: '2026-09-01T08:00:00Z',
  });
  membershipsStore.push({
    id: 'mem_03',
    userId: 'usr_03',
    businessId: 'biz_001',
    role: 'CASHIER',
    status: 'ACTIVE',
    createdAt: '2026-09-01T08:00:00Z',
  });

  // User 04: Almaz Girma (Accountant)
  usersStore.set('usr_04', {
    id: 'usr_04',
    fullName: 'አልማዝ ግርማ (Accountant)',
    phone: '+251944778899',
    passwordHash: defaultHash,
    salt: defaultSalt,
    status: 'ACTIVE',
    createdAt: '2026-09-01T08:00:00Z',
  });
  membershipsStore.push({
    id: 'mem_04',
    userId: 'usr_04',
    businessId: 'biz_001',
    role: 'ACCOUNTANT',
    status: 'ACTIVE',
    createdAt: '2026-09-01T08:00:00Z',
  });
}

seedInitialData();

// ============================================================
// 4. AUTHENTICATION CONTROLLER ENDPOINTS
// ============================================================

/**
 * POST /api/v1/auth/register
 * Creates a brand new business owner account with an isolated business.
 */
authRouter.post('/register', (req: Request, res: Response) => {
  const { fullName, phone, email, password, businessName, businessType, businessAddress } = req.body;

  // Validation
  if (!fullName || typeof fullName !== 'string' || fullName.trim().length < 2) {
    return sendError(res, 422, 'VALIDATION_ERROR', 'Full name is required.', 'ሙሉ ስምዎን ያስገቡ');
  }

  const normalizedPhone = normalizeEthiopianPhone(phone);
  if (!normalizedPhone && !email) {
    return sendError(
      res,
      422,
      'VALIDATION_ERROR',
      'A valid Ethiopian phone number or email is required.',
      'ትክክለኛ የኢትዮጵያ ስልክ ቁጥር ወይም ኢሜይል ያስገቡ'
    );
  }

  if (phone && !normalizedPhone) {
    return sendError(
      res,
      422,
      'INVALID_PHONE',
      'Please enter a valid Ethiopian phone number (e.g., 0911223344 or 0711223344).',
      'እባክዎ ትክክለኛ የኢትዮጵያ ስልክ ቁጥር ያስገቡ (ለምሳሌ 0911223344 ወይም 0711223344)'
    );
  }

  if (!password || password.length < 8) {
    return sendError(
      res,
      422,
      'WEAK_PASSWORD',
      'Password must be at least 8 characters long.',
      'የይለፍ ቃል ቢያንስ 8 ፊደላት ወይም ቁጥሮች መሆን አለበት'
    );
  }

  if (!businessName || typeof businessName !== 'string' || businessName.trim().length < 2) {
    return sendError(res, 422, 'VALIDATION_ERROR', 'Business name is required.', 'የንግድዎን ስም ያስገቡ');
  }

  // Duplicate checks
  for (const u of usersStore.values()) {
    if (normalizedPhone && u.phone === normalizedPhone) {
      return sendError(
        res,
        409,
        'PHONE_EXISTS',
        'This phone number is already registered. Please log in instead.',
        'ይህ ስልክ ቁጥር ቀድሞ ተመዝግቧል። እባክዎ በቀጥታ ይግቡ'
      );
    }
    if (email && u.email && u.email.toLowerCase() === email.trim().toLowerCase()) {
      return sendError(
        res,
        409,
        'EMAIL_EXISTS',
        'This email address is already registered. Please log in instead.',
        'ይህ ኢሜይል ቀድሞ ተመዝግቧል። እባክዎ በቀጥታ ይግቡ'
      );
    }
  }

  // Create User
  const userId = `usr_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
  const { hash, salt } = hashPassword(password);
  const now = new Date().toISOString();

  const newUser: StoredUser = {
    id: userId,
    fullName: fullName.trim(),
    phone: normalizedPhone || '',
    email: email ? email.trim().toLowerCase() : undefined,
    passwordHash: hash,
    salt,
    status: 'ACTIVE',
    createdAt: now,
    lastLoginAt: now,
  };
  usersStore.set(userId, newUser);

  // Create Business (New Tenant)
  const businessId = `biz_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
  const newBusiness: StoredBusiness = {
    id: businessId,
    name: businessName.trim(),
    businessType: businessType || 'Retail Shop',
    phone: normalizedPhone || '',
    address: businessAddress ? businessAddress.trim() : 'Addis Ababa, Ethiopia',
    ownerId: userId,
    createdAt: now,
  };
  businessesStore.set(businessId, newBusiness);

  // Assign OWNER Membership
  membershipsStore.push({
    id: `mem_${Date.now()}`,
    userId,
    businessId,
    role: 'OWNER',
    status: 'ACTIVE',
    createdAt: now,
  });

  // Create Session Token
  const token = `ethio_token_${crypto.randomBytes(24).toString('hex')}`;
  const session: StoredSession = {
    token,
    userId,
    businessId,
    role: 'OWNER',
    ipAddress: req.ip || '127.0.0.1',
    userAgent: req.headers['user-agent'] || 'Browser',
    deviceName: parseDeviceName(req.headers['user-agent']),
    createdAt: now,
    lastUsedAt: now,
    expiresAt: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(), // 7 days
  };
  sessionsStore.set(token, session);

  return sendSuccess(
    res,
    {
      token,
      user: {
        id: userId,
        fullName: newUser.fullName,
        phone: newUser.phone,
        email: newUser.email,
        role: 'OWNER',
        status: newUser.status,
      },
      business: newBusiness,
      isNewBusiness: true,
      message: 'Account and business created successfully!',
      message_am: 'መለያዎ እና የንግድ ድርጅትዎ በተሳካ ሁኔታ ተፈጥሯል!',
    },
    201
  );
});

/**
 * POST /api/v1/auth/login
 * Validates credentials with brute-force delay and protection.
 */
authRouter.post('/login', (req: Request, res: Response) => {
  const { identifier, password } = req.body;
  const clientIp = req.ip || '127.0.0.1';
  const trackKey = `${clientIp}_${identifier || ''}`;

  // Check Brute-Force lockout
  const attempt = failedAttempts.get(trackKey);
  if (attempt && attempt.lockedUntil && attempt.lockedUntil > Date.now()) {
    const remainingMin = Math.ceil((attempt.lockedUntil - Date.now()) / 60000);
    return sendError(
      res,
      429,
      'TOO_MANY_ATTEMPTS',
      `Too many failed login attempts. Please wait ${remainingMin} minutes before trying again.`,
      `ተደጋጋሚ የተሳሳተ ሙከራ ተደርጓል። እባክዎ ${remainingMin} ደቂቃ ቆይተው እንደገና ይሞክሩ።`
    );
  }

  if (!identifier || !password) {
    return sendError(
      res,
      422,
      'VALIDATION_ERROR',
      'Please enter your phone/email and password.',
      'እባክዎ ስልክ/ኢሜይል እና የይለፍ ቃል ያስገቡ'
    );
  }

  // Lookup user by email or normalized phone
  const cleanId = identifier.trim();
  const normalizedPhone = normalizeEthiopianPhone(cleanId);
  let matchedUser: StoredUser | null = null;

  for (const u of usersStore.values()) {
    if (normalizedPhone && u.phone === normalizedPhone) {
      matchedUser = u;
      break;
    }
    if (u.email && u.email.toLowerCase() === cleanId.toLowerCase()) {
      matchedUser = u;
      break;
    }
    // Also match raw phone without international code
    if (u.phone.replace('+251', '0') === cleanId || u.phone.replace('+251', '') === cleanId) {
      matchedUser = u;
      break;
    }
  }

  // User not found or invalid password
  if (!matchedUser || !verifyPassword(password, matchedUser.passwordHash, matchedUser.salt)) {
    const current = failedAttempts.get(trackKey) || { count: 0, lastAttempt: Date.now() };
    current.count += 1;
    current.lastAttempt = Date.now();
    if (current.count >= 5) {
      current.lockedUntil = Date.now() + 15 * 60 * 1000; // 15 min lock
    }
    failedAttempts.set(trackKey, current);

    return sendError(
      res,
      401,
      'INVALID_CREDENTIALS',
      'Invalid phone, email, or password. Please check your credentials.',
      'የተሳሳተ ስልክ፣ ኢሜይል ወይም የይለፍ ቃል ነው። እባክዎ ትክክለኛነቱን አረጋግጠው እንደገና ይሞክሩ።'
    );
  }

  // Check Account Status
  if (matchedUser.status === 'SUSPENDED') {
    return sendError(
      res,
      403,
      'ACCOUNT_SUSPENDED',
      'This user account is suspended. Please contact the administrator.',
      'ይህ መለያ ታግዷል። እባክዎ አስተዳዳሪውን ያነጋግሩ።'
    );
  }
  if (matchedUser.status === 'DEACTIVATED') {
    return sendError(
      res,
      403,
      'ACCOUNT_DEACTIVATED',
      'This user account has been deactivated.',
      'ይህ መለያ ተዘግቷል (Deactivated)።'
    );
  }

  // Clear failed attempt tracking on success
  failedAttempts.delete(trackKey);

  // Find business memberships
  const userMemberships = membershipsStore.filter(
    (m) => m.userId === matchedUser!.id && m.status === 'ACTIVE'
  );

  if (userMemberships.length === 0) {
    return sendError(
      res,
      403,
      'NO_BUSINESS_MEMBERSHIP',
      'No active business found for this user account.',
      'ለዚህ መለያ የተመዘገበ ንግድ አልተገኘም።'
    );
  }

  // Default to first business membership
  const activeMembership = userMemberships[0];
  const activeBusiness = businessesStore.get(activeMembership.businessId);

  // Update Last Login
  matchedUser.lastLoginAt = new Date().toISOString();
  usersStore.set(matchedUser.id, matchedUser);

  // Issue Session Token
  const now = new Date().toISOString();
  const token = `ethio_token_${crypto.randomBytes(24).toString('hex')}`;
  const session: StoredSession = {
    token,
    userId: matchedUser.id,
    businessId: activeMembership.businessId,
    role: activeMembership.role,
    ipAddress: clientIp,
    userAgent: req.headers['user-agent'] || 'Browser',
    deviceName: parseDeviceName(req.headers['user-agent']),
    createdAt: now,
    lastUsedAt: now,
    expiresAt: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
  };
  sessionsStore.set(token, session);

  // Collect all businesses user belongs to
  const availableBusinesses = userMemberships.map((m) => {
    const b = businessesStore.get(m.businessId);
    return {
      id: m.businessId,
      name: b ? b.name : 'Store',
      role: m.role,
      businessType: b ? b.businessType : 'Retail',
    };
  });

  return sendSuccess(res, {
    token,
    user: {
      id: matchedUser.id,
      fullName: matchedUser.fullName,
      phone: matchedUser.phone,
      email: matchedUser.email,
      role: activeMembership.role,
      status: matchedUser.status,
      avatarUrl: matchedUser.avatarUrl,
      lastLoginAt: matchedUser.lastLoginAt,
    },
    business: activeBusiness || { id: activeMembership.businessId, name: 'Store' },
    businesses: availableBusinesses,
    expiresIn: 7 * 24 * 3600,
  });
});

/**
 * GET /api/v1/auth/me
 * Retrieves authenticated user profile & active business context.
 */
authRouter.get('/me', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;

  if (!token) {
    return sendError(res, 401, 'UNAUTHORIZED', 'Missing authorization token.', 'እባክዎ መጀመሪያ ይግቡ');
  }

  const session = sessionsStore.get(token);
  if (!session) {
    return sendError(
      res,
      401,
      'SESSION_EXPIRED',
      'Session expired or invalid. Please log in again.',
      'የመግቢያ ጊዜዎ አልቋል። እባክዎ እንደገና ይግቡ።'
    );
  }

  // Check Expiration
  if (new Date(session.expiresAt).getTime() < Date.now()) {
    sessionsStore.delete(token);
    return sendError(
      res,
      401,
      'SESSION_EXPIRED',
      'Session expired. Please log in again.',
      'የመግቢያ ጊዜዎ አልቋል። እባክዎ እንደገና ይግቡ።'
    );
  }

  const user = usersStore.get(session.userId);
  if (!user || user.status !== 'ACTIVE') {
    return sendError(res, 403, 'FORBIDDEN', 'User account is inactive or suspended.', 'መለያው ገቢር አይደለም።');
  }

  const business = businessesStore.get(session.businessId);
  const userMemberships = membershipsStore.filter(
    (m) => m.userId === user.id && m.status === 'ACTIVE'
  );
  const availableBusinesses = userMemberships.map((m) => {
    const b = businessesStore.get(m.businessId);
    return {
      id: m.businessId,
      name: b ? b.name : 'Store',
      role: m.role,
      businessType: b ? b.businessType : 'Retail',
    };
  });

  session.lastUsedAt = new Date().toISOString();
  sessionsStore.set(token, session);

  return sendSuccess(res, {
    user: {
      id: user.id,
      fullName: user.fullName,
      phone: user.phone,
      email: user.email,
      role: session.role,
      status: user.status,
      avatarUrl: user.avatarUrl,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
    },
    business: business || { id: session.businessId, name: 'Store' },
    businesses: availableBusinesses,
    session: {
      deviceName: session.deviceName,
      ipAddress: session.ipAddress,
      createdAt: session.createdAt,
    },
  });
});

/**
 * POST /api/v1/auth/logout
 * Destroys session token on server.
 */
authRouter.post('/logout', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;

  if (token) {
    sessionsStore.delete(token);
  }

  return sendSuccess(res, {
    loggedOut: true,
    message: 'Logged out successfully.',
    message_am: 'በተሳካ ሁኔታ ወጥተዋል።',
  });
});

/**
 * POST /api/v1/auth/logout-all
 * Invalidates all sessions for this user across all devices.
 */
authRouter.post('/logout-all', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;
  const session = token ? sessionsStore.get(token) : null;

  if (session) {
    const userId = session.userId;
    for (const [key, sess] of sessionsStore.entries()) {
      if (sess.userId === userId) {
        sessionsStore.delete(key);
      }
    }
  }

  return sendSuccess(res, {
    loggedOutAll: true,
    message: 'Logged out from all devices.',
    message_am: 'ከሁሉም መሳሪያዎች በተሳካ ሁኔታ ወጥተዋል።',
  });
});

/**
 * POST /api/v1/auth/change-password
 * Securely changes user password.
 */
authRouter.post('/change-password', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;
  const session = token ? sessionsStore.get(token) : null;

  if (!session) {
    return sendError(res, 401, 'UNAUTHORIZED', 'Authentication required.', 'እባክዎ መጀመሪያ ይግቡ');
  }

  const { currentPassword, newPassword } = req.body;
  const user = usersStore.get(session.userId);

  if (!user) {
    return sendError(res, 404, 'NOT_FOUND', 'User not found.', 'መለያው አልተገኘም');
  }

  if (!currentPassword || !verifyPassword(currentPassword, user.passwordHash, user.salt)) {
    return sendError(
      res,
      400,
      'INVALID_CURRENT_PASSWORD',
      'Incorrect current password.',
      'የአሁኑ የይለፍ ቃል የተሳሳተ ነው'
    );
  }

  if (!newPassword || newPassword.length < 8) {
    return sendError(
      res,
      400,
      'WEAK_NEW_PASSWORD',
      'New password must be at least 8 characters long.',
      'አዲሱ የይለፍ ቃል ቢያንስ 8 ፊደላት ወይም ቁጥሮች መሆን አለበት'
    );
  }

  const { hash: newHash, salt: newSalt } = hashPassword(newPassword);
  user.passwordHash = newHash;
  user.salt = newSalt;
  usersStore.set(user.id, user);

  return sendSuccess(res, {
    message: 'Password changed successfully.',
    message_am: 'የይለፍ ቃልዎ በተሳካ ሁኔታ ተቀይሯል።',
  });
});

/**
 * POST /api/v1/auth/forgot-password
 * Generates secure password reset request token.
 */
authRouter.post('/forgot-password', (req: Request, res: Response) => {
  const { identifier } = req.body;
  if (!identifier) {
    return sendError(res, 422, 'VALIDATION_ERROR', 'Identifier required.', 'ስልክ ወይም ኢሜይል ያስገቡ');
  }

  const cleanId = identifier.trim();
  const normalizedPhone = normalizeEthiopianPhone(cleanId);
  let matchedUser: StoredUser | null = null;

  for (const u of usersStore.values()) {
    if (normalizedPhone && u.phone === normalizedPhone) {
      matchedUser = u;
      break;
    }
    if (u.email && u.email.toLowerCase() === cleanId.toLowerCase()) {
      matchedUser = u;
      break;
    }
    if (u.phone.replace('+251', '0') === cleanId || u.phone.replace('+251', '') === cleanId) {
      matchedUser = u;
      break;
    }
  }

  if (!matchedUser) {
    return sendError(
      res,
      404,
      'USER_NOT_FOUND',
      'No user account registered with this phone or email.',
      'በዚህ ስልክ ወይም ኢሜይል የተመዘገበ መለያ አልተገኘም'
    );
  }

  const resetToken = `rst_${crypto.randomBytes(16).toString('hex')}`;
  passwordResetTokensStore.set(resetToken, {
    token: resetToken,
    userId: matchedUser.id,
    expiresAt: Date.now() + 60 * 60 * 1000, // 1 hour
  });

  return sendSuccess(res, {
    resetToken,
    message: 'Password reset request generated. Please enter your new password.',
    message_am: 'የይለፍ ቃል መቀየሪያ ጥያቄ ተልኳል። እባክዎ አዲሱን የይለፍ ቃልዎን ያስገቡ።',
  });
});

/**
 * POST /api/v1/auth/reset-password
 * Applies password reset using valid reset token.
 */
authRouter.post('/reset-password', (req: Request, res: Response) => {
  const { resetToken, newPassword } = req.body;

  if (!resetToken || !passwordResetTokensStore.has(resetToken)) {
    return sendError(
      res,
      400,
      'INVALID_RESET_TOKEN',
      'Invalid or expired password reset link.',
      'የይለፍ ቃል መቀየሪያው ጊዜው አልፏል ወይም ትክክል አይደለም'
    );
  }

  const item = passwordResetTokensStore.get(resetToken)!;
  if (item.expiresAt < Date.now()) {
    passwordResetTokensStore.delete(resetToken);
    return sendError(
      res,
      400,
      'EXPIRED_RESET_TOKEN',
      'Password reset request has expired. Please request again.',
      'የይለፍ ቃል መቀየሪያው ጊዜው አልፏል። እባክዎ እንደገና ይጠይቁ።'
    );
  }

  if (!newPassword || newPassword.length < 8) {
    return sendError(
      res,
      422,
      'WEAK_PASSWORD',
      'Password must be at least 8 characters long.',
      'የይለፍ ቃል ቢያንስ 8 ፊደላት ወይም ቁጥሮች መሆን አለበት'
    );
  }

  const user = usersStore.get(item.userId);
  if (!user) {
    return sendError(res, 404, 'USER_NOT_FOUND', 'User account not found.', 'መለያው አልተገኘም');
  }

  const { hash, salt } = hashPassword(newPassword);
  user.passwordHash = hash;
  user.salt = salt;
  usersStore.set(user.id, user);

  passwordResetTokensStore.delete(resetToken);

  return sendSuccess(res, {
    message: 'Password reset successfully! You can now log in.',
    message_am: 'የይለፍ ቃልዎ በተሳካ ሁኔታ ተቀይሯል! አሁን መግባት ይችላሉ።',
  });
});

/**
 * POST /api/v1/auth/switch-business
 * Switches the active tenant business for a multi-business user.
 */
authRouter.post('/switch-business', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;
  const session = token ? sessionsStore.get(token) : null;

  if (!session || !token) {
    return sendError(res, 401, 'UNAUTHORIZED', 'Authentication required.', 'እባክዎ መጀመሪያ ይግቡ');
  }

  const { businessId } = req.body;
  if (!businessId) {
    return sendError(res, 422, 'VALIDATION_ERROR', 'Target business ID required.', 'የንግድ መለያ ያስፈልጋል');
  }

  // Server-side Tenant Authorization: Verify membership in target business
  const membership = membershipsStore.find(
    (m) => m.userId === session.userId && m.businessId === businessId && m.status === 'ACTIVE'
  );

  if (!membership) {
    return sendError(
      res,
      403,
      'ACCESS_DENIED',
      'You do not have permission to access this business.',
      'ወደዚህ የንግድ ድርጅት ለመግባት ፍቃድ የለዎትም።'
    );
  }

  const targetBusiness = businessesStore.get(businessId);

  // Update session context
  session.businessId = businessId;
  session.role = membership.role;
  session.lastUsedAt = new Date().toISOString();
  sessionsStore.set(token, session);

  return sendSuccess(res, {
    business: targetBusiness || { id: businessId, name: 'Store' },
    role: membership.role,
    message: `Switched to ${targetBusiness?.name || 'Store'}`,
    message_am: `ወደ ${targetBusiness?.name || 'ንግድ'} በተሳካ ሁኔታ ተቀይሯል`,
  });
});

/**
 * GET /api/v1/auth/sessions
 * Returns user's active devices and sessions.
 */
authRouter.get('/sessions', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;
  const session = token ? sessionsStore.get(token) : null;

  if (!session) {
    return sendError(res, 401, 'UNAUTHORIZED', 'Authentication required.', 'እባክዎ መጀመሪያ ይግቡ');
  }

  const userSessions: Array<{
    id: string;
    deviceName: string;
    ipAddress: string;
    lastUsedAt: string;
    isCurrent: boolean;
  }> = [];

  for (const [key, s] of sessionsStore.entries()) {
    if (s.userId === session.userId) {
      userSessions.push({
        id: key,
        deviceName: s.deviceName,
        ipAddress: s.ipAddress,
        lastUsedAt: s.lastUsedAt,
        isCurrent: key === token,
      });
    }
  }

  return sendSuccess(res, userSessions);
});
