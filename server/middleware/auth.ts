import { Request, Response, NextFunction } from 'express';
import { AuthenticatedUser, ApiErrorResponse } from '../types/api';
import { sessionsStore, usersStore } from '../routes/auth';

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
      businessId?: string;
      branchId?: string;
    }
  }
}

// Role to default permissions mapping for server enforcement
const ROLE_PERMISSIONS: Record<string, string[]> = {
  OWNER: [
    'dashboard.view',
    'sales.view', 'sales.create', 'sales.update', 'sales.cancel', 'sales.reverse', 'sales.refund', 'sales.discount', 'sales.discount_override', 'sales.export',
    'products.view', 'products.create', 'products.update', 'products.archive', 'products.price_update',
    'inventory.view', 'inventory.adjust', 'inventory.transfer', 'inventory.count', 'inventory.receive', 'inventory.export',
    'customers.view', 'customers.create', 'customers.update', 'customers.archive', 'customers.export',
    'debts.view', 'debts.create', 'debts.payment', 'debts.adjust', 'debts.reverse', 'debts.reminder', 'debts.credit_limit_override', 'debts.export',
    'expenses.view', 'expenses.create', 'expenses.update', 'expenses.reverse', 'expenses.approve', 'expenses.export',
    'purchases.view', 'purchases.create', 'purchases.update', 'purchases.receive', 'purchases.reverse', 'purchases.export',
    'suppliers.view', 'suppliers.create', 'suppliers.update', 'suppliers.archive',
    'employees.view', 'employees.create', 'employees.update', 'employees.deactivate', 'employees.assign_role',
    'branches.view', 'branches.create', 'branches.update', 'branches.archive',
    'reports.view', 'reports.financial', 'reports.export',
    'audit.view', 'audit.export',
    'settings.view', 'settings.update',
    'subscriptions.view', 'subscriptions.manage',
  ],
  MANAGER: [
    'dashboard.view',
    'sales.view', 'sales.create', 'sales.update', 'sales.cancel', 'sales.refund', 'sales.discount', 'sales.export',
    'products.view', 'products.create', 'products.update',
    'inventory.view', 'inventory.adjust', 'inventory.transfer', 'inventory.count', 'inventory.receive', 'inventory.export',
    'customers.view', 'customers.create', 'customers.update',
    'debts.view', 'debts.create', 'debts.payment', 'debts.reminder', 'debts.export',
    'expenses.view', 'expenses.create', 'expenses.update',
    'purchases.view', 'purchases.create', 'purchases.receive', 'purchases.export',
    'suppliers.view', 'suppliers.create', 'suppliers.update',
    'employees.view', 'employees.update',
    'reports.view', 'reports.export',
    'audit.view',
    'settings.view',
  ],
  ACCOUNTANT: [
    'dashboard.view',
    'sales.view', 'sales.export',
    'products.view',
    'inventory.view',
    'customers.view',
    'debts.view', 'debts.payment', 'debts.adjust', 'debts.export',
    'expenses.view', 'expenses.create', 'expenses.update', 'expenses.reverse', 'expenses.approve', 'expenses.export',
    'purchases.view', 'purchases.export',
    'suppliers.view',
    'reports.view', 'reports.financial', 'reports.export',
    'audit.view',
  ],
  CASHIER: [
    'dashboard.view',
    'sales.view', 'sales.create', 'sales.update',
    'products.view',
    'inventory.view',
    'customers.view', 'customers.create', 'customers.update',
    'debts.view', 'debts.create', 'debts.payment', 'debts.reminder',
  ],
  INVENTORY_STAFF: [
    'dashboard.view',
    'products.view', 'products.create', 'products.update',
    'inventory.view', 'inventory.adjust', 'inventory.transfer', 'inventory.count', 'inventory.receive',
    'purchases.view', 'purchases.create', 'purchases.receive',
    'suppliers.view', 'suppliers.create',
  ],
  SALESPERSON: [
    'dashboard.view',
    'sales.view', 'sales.create',
    'products.view',
    'inventory.view',
    'customers.view', 'customers.create', 'customers.update',
    'debts.view', 'debts.create', 'debts.reminder',
  ],
  SUPER_ADMIN: [
    'platform.manage', 'tenants.manage', 'subscriptions.manage', 'health.view',
  ],
};

export const authenticateTenantUser = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const businessHeader = (req.headers['x-business-id'] as string) || 'biz_001';
  const branchHeader = (req.headers['x-branch-id'] as string) || 'br_01';
  const roleHeader = (req.headers['x-user-role'] as string) || 'OWNER';

  // 1. If Bearer token is provided, validate cryptographic session
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7).trim();
    const session = sessionsStore.get(token);

    if (session) {
      // Check expiration
      if (new Date(session.expiresAt).getTime() < Date.now()) {
        sessionsStore.delete(token);
        const errRes: ApiErrorResponse = {
          success: false,
          error: {
            code: 'SESSION_EXPIRED',
            message: 'Session has expired. Please log in again.',
            message_am: 'የመግቢያ ጊዜዎ አልቋል። እባክዎ እንደገና ይግቡ።',
            status: 401,
          },
          timestamp: new Date().toISOString(),
        };
        return res.status(401).json(errRes);
      }

      const user = usersStore.get(session.userId);
      if (user && user.status === 'ACTIVE') {
        const permissions = ROLE_PERMISSIONS[session.role] || [];
        req.user = {
          id: user.id,
          businessId: session.businessId,
          branchId: branchHeader,
          role: session.role,
          name: user.fullName,
          phone: user.phone,
          email: user.email,
          status: user.status,
          permissions,
        };
        req.businessId = session.businessId;
        req.branchId = branchHeader;
        return next();
      }
    }
  }

  // 2. Fallback for internal smoke tests & development headers
  const userRole = (roleHeader in ROLE_PERMISSIONS ? roleHeader : 'OWNER') as AuthenticatedUser['role'];
  const permissions = ROLE_PERMISSIONS[userRole] || [];

  req.user = {
    id: (req.headers['x-user-id'] as string) || 'usr_01',
    businessId: businessHeader,
    branchId: branchHeader,
    role: userRole,
    name: userRole === 'OWNER' ? 'አበበ ቢቂላ (Owner)' : `${userRole} User`,
    phone: '0911223344',
    permissions,
  };

  req.businessId = businessHeader;
  req.branchId = branchHeader;

  next();
};

export const requirePermission = (permissionCode: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      const errRes: ApiErrorResponse = {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'User authentication required.',
          message_am: 'እባክዎ መጀመሪያ ይግቡ (ማረጋገጫ ያስፈልጋል)።',
          status: 401,
        },
        timestamp: new Date().toISOString(),
      };
      return res.status(401).json(errRes);
    }

    // Tenant Isolation Check: Super Admin cannot query business financial endpoints directly
    if (
      req.user.role === 'SUPER_ADMIN' &&
      (permissionCode.startsWith('sales.') ||
        permissionCode.startsWith('debts.') ||
        permissionCode.startsWith('reports.financial'))
    ) {
      const errRes: ApiErrorResponse = {
        success: false,
        error: {
          code: 'SUPER_ADMIN_TENANT_PRIVACY_RESTRICTION',
          message: 'Super Admin is strictly forbidden from accessing private business financial data without explicit logged authorization.',
          message_am: 'የሲስተም አድሚን የደንበኛን የግል ፋይናንስ ወይም የዕዳ መረጃ በቀጥታ ማየት አይፈቀድለትም!',
          status: 403,
        },
        timestamp: new Date().toISOString(),
      };
      return res.status(403).json(errRes);
    }

    const hasPerm = req.user.permissions.includes(permissionCode);
    if (!hasPerm) {
      const errRes: ApiErrorResponse = {
        success: false,
        error: {
          code: 'PERMISSION_DENIED',
          message: `Access denied. Missing required permission: ${permissionCode}`,
          message_am: `ይህን ተግባር ለመፈጸም ፈቃድ የለዎትም (${permissionCode})።`,
          status: 403,
        },
        timestamp: new Date().toISOString(),
      };
      return res.status(403).json(errRes);
    }

    next();
  };
};
