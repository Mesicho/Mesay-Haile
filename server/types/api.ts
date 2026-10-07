export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
  timestamp: string;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    message_am: string;
    status: number;
    details?: any;
  };
  timestamp: string;
}

export interface AuthenticatedUser {
  id: string;
  businessId: string;
  branchId?: string;
  role: 'OWNER' | 'MANAGER' | 'CASHIER' | 'INVENTORY_STAFF' | 'ACCOUNTANT' | 'SALESPERSON' | 'SUPER_ADMIN';
  name: string;
  phone: string;
  email?: string;
  avatarUrl?: string;
  status?: 'ACTIVE' | 'SUSPENDED' | 'DEACTIVATED';
  permissions: string[];
}
