import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '../data');
const STORE_FILE = path.join(DATA_DIR, 'tenants.json');

export interface StoredUser {
  id: string;
  email: string;
  phone: string;
  name: string;
  passwordHash: string;
  salt: string;
  businessId: string;
  role: 'OWNER' | 'MANAGER' | 'ACCOUNTANT' | 'CASHIER' | 'INVENTORY_STAFF' | 'SALESPERSON' | 'SUPER_ADMIN';
  createdAt: string;
}

export interface StoredBusiness {
  id: string;
  name: string;
  amharicName?: string;
  ownerName: string;
  phone: string;
  email?: string;
  businessType: string;
  currency: string;
  city: string;
  plan: 'FREE' | 'STARTER' | 'BUSINESS' | 'PRO';
  createdAt: string;
}

export interface StoredSession {
  token: string;
  userId: string;
  businessId: string;
  role: StoredUser['role'];
  userName: string;
  createdAt: string;
  expiresAt: string;
}

interface TenantStoreData {
  users: StoredUser[];
  businesses: StoredBusiness[];
  sessions: StoredSession[];
}

function hashPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
}

class AuthStore {
  private data: TenantStoreData;

  constructor() {
    this.ensureDir();
    this.data = this.loadData();
    this.seedDemoIfEmpty();
  }

  private ensureDir() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  }

  private loadData(): TenantStoreData {
    try {
      if (fs.existsSync(STORE_FILE)) {
        const raw = fs.readFileSync(STORE_FILE, 'utf-8');
        return JSON.parse(raw);
      }
    } catch (e) {
      console.warn('Could not read tenants.json, initializing fresh store', e);
    }
    return { users: [], businesses: [], sessions: [] };
  }

  private saveData() {
    try {
      this.ensureDir();
      fs.writeFileSync(STORE_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (e) {
      console.error('Failed to save tenants.json', e);
    }
  }

  private seedDemoIfEmpty() {
    if (this.data.users.length === 0) {
      const demoSalt = crypto.randomBytes(16).toString('hex');
      const demoBusiness: StoredBusiness = {
        id: 'biz_demo_001',
        name: 'Selam Supermarket & Wholesale',
        amharicName: 'ሰላም ሱፐርማርኬት እና የሸቀጥ ንግድ',
        ownerName: 'አበበ ቢቂላ (Owner)',
        phone: '0911223344',
        email: 'demo@ethiohelper.com',
        businessType: 'Wholesale',
        currency: 'ETB',
        city: 'Addis Ababa',
        plan: 'BUSINESS',
        createdAt: new Date().toISOString(),
      };

      const demoUser: StoredUser = {
        id: 'usr_demo_001',
        email: 'demo@ethiohelper.com',
        phone: '0911223344',
        name: 'አበበ ቢቂላ (Owner)',
        passwordHash: hashPassword('demo123', demoSalt),
        salt: demoSalt,
        businessId: demoBusiness.id,
        role: 'OWNER',
        createdAt: new Date().toISOString(),
      };

      this.data.businesses.push(demoBusiness);
      this.data.users.push(demoUser);
      this.saveData();
    }
  }

  public register(params: {
    email: string;
    password: string;
    name: string;
    phone: string;
    businessName: string;
    amharicName?: string;
    businessType?: string;
    currency?: string;
    city?: string;
  }): { token: string; user: Omit<StoredUser, 'passwordHash' | 'salt'>; business: StoredBusiness } {
    const cleanEmail = params.email.trim().toLowerCase();
    const existing = this.data.users.find(
      (u) => u.email === cleanEmail || (params.phone && u.phone === params.phone.trim())
    );

    if (existing) {
      throw new Error('A user with this email or phone number already exists.');
    }

    const salt = crypto.randomBytes(16).toString('hex');
    const passwordHash = hashPassword(params.password, salt);

    const businessId = `biz_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const userId = `usr_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

    const business: StoredBusiness = {
      id: businessId,
      name: params.businessName.trim(),
      amharicName: params.amharicName?.trim() || params.businessName.trim(),
      ownerName: params.name.trim(),
      phone: params.phone.trim(),
      email: cleanEmail,
      businessType: params.businessType || 'Shop',
      currency: params.currency || 'ETB',
      city: params.city || 'Addis Ababa',
      plan: 'FREE',
      createdAt: new Date().toISOString(),
    };

    const user: StoredUser = {
      id: userId,
      email: cleanEmail,
      phone: params.phone.trim(),
      name: params.name.trim(),
      passwordHash,
      salt,
      businessId,
      role: 'OWNER',
      createdAt: new Date().toISOString(),
    };

    this.data.businesses.push(business);
    this.data.users.push(user);

    // Create session token
    const token = `ebh_${crypto.randomBytes(32).toString('hex')}`;
    const session: StoredSession = {
      token,
      userId: user.id,
      businessId: business.id,
      role: user.role,
      userName: user.name,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 30 * 86400 * 1000).toISOString(), // 30 days
    };

    this.data.sessions.push(session);
    this.saveData();

    const { passwordHash: _, salt: __, ...userSafe } = user;
    return { token, user: userSafe, business };
  }

  public login(identifier: string, password: string): {
    token: string;
    user: Omit<StoredUser, 'passwordHash' | 'salt'>;
    business: StoredBusiness;
  } {
    const cleanId = identifier.trim().toLowerCase();
    const user = this.data.users.find(
      (u) => u.email === cleanId || u.phone === cleanId || u.phone === identifier.trim()
    );

    if (!user) {
      throw new Error('Invalid credentials. User not found.');
    }

    const calculatedHash = hashPassword(password, user.salt);
    if (calculatedHash !== user.passwordHash) {
      throw new Error('Invalid password. Please check your credentials.');
    }

    const business = this.data.businesses.find((b) => b.id === user.businessId);
    if (!business) {
      throw new Error('Business record associated with this user not found.');
    }

    const token = `ebh_${crypto.randomBytes(32).toString('hex')}`;
    const session: StoredSession = {
      token,
      userId: user.id,
      businessId: business.id,
      role: user.role,
      userName: user.name,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 30 * 86400 * 1000).toISOString(),
    };

    this.data.sessions.push(session);
    this.saveData();

    const { passwordHash: _, salt: __, ...userSafe } = user;
    return { token, user: userSafe, business };
  }

  public getSession(token: string): { session: StoredSession; user: StoredUser; business: StoredBusiness } | null {
    if (!token) return null;
    const session = this.data.sessions.find((s) => s.token === token);
    if (!session) return null;

    if (new Date(session.expiresAt) < new Date()) {
      return null;
    }

    const user = this.data.users.find((u) => u.id === session.userId);
    const business = this.data.businesses.find((b) => b.id === session.businessId);

    if (!user || !business) return null;
    return { session, user, business };
  }

  public logout(token: string): boolean {
    const index = this.data.sessions.findIndex((s) => s.token === token);
    if (index >= 0) {
      this.data.sessions.splice(index, 1);
      this.saveData();
      return true;
    }
    return false;
  }

  public getBusiness(businessId: string): StoredBusiness | null {
    return this.data.businesses.find((b) => b.id === businessId) || null;
  }
}

export const authStore = new AuthStore();
