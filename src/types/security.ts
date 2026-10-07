export type SessionStatus = 'ACTIVE' | 'EXPIRED' | 'REVOKED';

export type DeviceStatus = 'ACTIVE' | 'PENDING' | 'REVOKED' | 'BLOCKED' | 'EXPIRED';

export type DevicePlatform = 'ANDROID' | 'IOS' | 'WEB' | 'DESKTOP' | 'POS_TERMINAL';

export interface UserSession {
  id: string;
  userId: string;
  userName: string;
  businessId: string;
  branchId?: string;
  deviceId: string;
  deviceName: string;
  ipAddress: string;
  userAgent: string;
  createdAt: string;
  lastUsedAt: string;
  expiresAt: string;
  revokedAt?: string;
  status: SessionStatus;
  isCurrent: boolean;
}

export interface RegisteredDevice {
  id: string;
  userId: string;
  userName: string;
  businessId: string;
  branchId?: string;
  branchName?: string;
  deviceName: string;
  fingerprint: string;
  platform: DevicePlatform;
  appVersion: string;
  status: DeviceStatus;
  isTrusted: boolean;
  registeredAt: string;
  lastSeenAt: string;
  revokedAt?: string;
  ipAddress: string;
}

export type SecurityAlertLevel = 'INFO' | 'WARNING' | 'HIGH' | 'CRITICAL';

export type SecurityEventType =
  | 'LOGIN_SUCCESS'
  | 'LOGIN_FAILURE'
  | 'LOGOUT'
  | 'PASSWORD_CHANGED'
  | 'PASSWORD_RESET'
  | 'MFA_ENABLED'
  | 'MFA_DISABLED'
  | 'NEW_DEVICE'
  | 'DEVICE_REVOKED'
  | 'SESSION_REVOKED'
  | 'UNAUTHORIZED_ACCESS_ATTEMPT'
  | 'CROSS_TENANT_ATTEMPT'
  | 'CROSS_BRANCH_ATTEMPT'
  | 'RATE_LIMIT_EXCEEDED'
  | 'SUSPICIOUS_PAYMENT_WEBHOOK'
  | 'REPLAY_ATTACK_BLOCKED'
  | 'SQL_INJECTION_BLOCKED'
  | 'MALICIOUS_UPLOAD_BLOCKED'
  | 'PRIVILEGE_ESCALATION_BLOCKED'
  | 'TEMPORARY_PERMISSION_GRANTED'
  | 'TEMPORARY_PERMISSION_EXPIRED'
  | 'BREAK_GLASS_ACCESS_REQUESTED'
  | 'SENSITIVE_FINANCIAL_ACTION';

export interface SecurityEventLog {
  id: string;
  businessId: string;
  userId?: string;
  userName?: string;
  deviceId?: string;
  deviceName?: string;
  type: SecurityEventType;
  level: SecurityAlertLevel;
  title: string;
  titleAm: string;
  description: string;
  descriptionAm?: string;
  ipAddress: string;
  userAgent?: string;
  resourceType?: string;
  resourceId?: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface TemporaryPermission {
  id: string;
  businessId: string;
  userId: string;
  userName: string;
  permission: string;
  permissionAm: string;
  startAt: string;
  endAt: string;
  grantedBy: string;
  grantedByName: string;
  reason: string;
  active: boolean;
}

export interface BreakGlassRequest {
  id: string;
  businessId: string;
  businessName: string;
  adminUserId: string;
  adminName: string;
  ticketReference: string;
  reason: string;
  requestedAt: string;
  expiresAt: string;
  status: 'APPROVED' | 'ACTIVE' | 'EXPIRED' | 'REVOKED';
  accessedResources?: string[];
}

export interface SecuritySettings {
  mfaRequiredForOwners: boolean;
  mfaRequiredForAccountants: boolean;
  sessionTimeoutMinutes: number; // e.g. 30 minutes
  maxLoginAttempts: number; // e.g. 5
  lockoutDurationMinutes: number; // e.g. 15
  requireDeviceApproval: boolean;
  restrictCrossBranchAccess: boolean;
  requireReauthForFinancialChanges: boolean;
  maskCustomerPhoneForCashiers: boolean;
}

export interface SecurityAcceptanceTest {
  id: number;
  name: string;
  nameAm: string;
  category: 'Authorization' | 'Isolation' | 'Network & API' | 'Financial & Audit' | 'Storage & Device';
  threatModelRef: string;
  expectedBehavior: string;
  actualResult: string;
  passed: boolean;
  mitigationRule: string;
}
