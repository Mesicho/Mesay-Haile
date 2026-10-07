-- ============================================================
-- ETHIO BUSINESS HELPER 🇪🇹
-- PRODUCTION POSTGRESQL MULTI-TENANT DATABASE SCHEMA (PART 2)
-- Architecture: Multi-tenant SaaS, Strict Tenant Isolation, 
-- Immutable Financial Ledgers, Offline Sync & Idempotency
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- 1. CORE TENANT & ORGANIZATIONS
-- ============================================================

CREATE TABLE IF NOT EXISTS businesses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    legal_name VARCHAR(250),
    business_type VARCHAR(100) NOT NULL,
    industry VARCHAR(100),
    phone VARCHAR(30) NOT NULL,
    email VARCHAR(150),
    address TEXT,
    city VARCHAR(100) NOT NULL DEFAULT 'Addis Ababa',
    sub_city VARCHAR(100),
    woreda VARCHAR(100),
    country VARCHAR(100) DEFAULT 'Ethiopia',
    currency VARCHAR(10) DEFAULT 'ETB',
    logo_url TEXT,
    tax_number VARCHAR(100), -- TIN Number
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE' 
        CHECK (status IN ('ACTIVE', 'SUSPENDED', 'TRIAL', 'CANCELLED', 'ARCHIVED')),
    subscription_plan_id UUID,
    timezone VARCHAR(100) DEFAULT 'Africa/Addis_Ababa',
    language VARCHAR(10) DEFAULT 'am',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_businesses_status ON businesses(status);
CREATE INDEX idx_businesses_phone ON businesses(phone);

-- ============================================================
-- 2. BRANCHES
-- ============================================================

CREATE TABLE IF NOT EXISTS branches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE RESTRICT,
    name VARCHAR(150) NOT NULL,
    code VARCHAR(50) NOT NULL,
    phone VARCHAR(30),
    address TEXT,
    city VARCHAR(100),
    sub_city VARCHAR(100),
    woreda VARCHAR(100),
    is_main BOOLEAN DEFAULT FALSE,
    status VARCHAR(30) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'ARCHIVED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ,
    CONSTRAINT uq_branch_code_per_business UNIQUE (business_id, code)
);

CREATE INDEX idx_branches_business ON branches(business_id);
CREATE INDEX idx_branches_business_status ON branches(business_id, status);

-- ============================================================
-- 3. USERS & AUTHENTICATION
-- ============================================================

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name VARCHAR(200) NOT NULL,
    phone VARCHAR(30) UNIQUE,
    email VARCHAR(150) UNIQUE,
    password_hash TEXT NOT NULL,
    profile_photo_url TEXT,
    language VARCHAR(10) DEFAULT 'am',
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE' 
        CHECK (status IN ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING')),
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_email ON users(email);

-- ============================================================
-- 4. EMPLOYEES
-- ============================================================

CREATE TABLE IF NOT EXISTS employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE RESTRICT,
    branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
    employee_code VARCHAR(50),
    full_name VARCHAR(200) NOT NULL,
    phone VARCHAR(30),
    email VARCHAR(150),
    position VARCHAR(100),
    hire_date DATE,
    salary NUMERIC(18,2) DEFAULT 0 CHECK (salary >= 0),
    commission_rate NUMERIC(8,4) DEFAULT 0 CHECK (commission_rate >= 0),
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE' 
        CHECK (status IN ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'TERMINATED')),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ,
    CONSTRAINT uq_employee_code_per_business UNIQUE (business_id, employee_code)
);

CREATE INDEX idx_employees_business ON employees(business_id);
CREATE INDEX idx_employees_branch ON employees(business_id, branch_id);

-- ============================================================
-- 5. BUSINESS USERS (Tenant Membership Link)
-- ============================================================

CREATE TABLE IF NOT EXISTS business_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE RESTRICT,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
    employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'SUSPENDED')),
    joined_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_business_user UNIQUE (business_id, user_id)
);

CREATE INDEX idx_business_users_business ON business_users(business_id);
CREATE INDEX idx_business_users_user ON business_users(user_id);

-- ============================================================
-- 6. ROLES & PERMISSIONS (RBAC)
-- ============================================================

CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE, -- NULL for platform system roles
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_system_role BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(150) UNIQUE NOT NULL,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    module VARCHAR(100) NOT NULL,
    action VARCHAR(50) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS role_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_role_permission UNIQUE (role_id, permission_id)
);

CREATE TABLE IF NOT EXISTS user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_user_id UUID NOT NULL REFERENCES business_users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_user_role UNIQUE (business_user_id, role_id)
);

-- ============================================================
-- 7. PRODUCT CATALOG & PRICING
-- ============================================================

CREATE TABLE IF NOT EXISTS product_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE RESTRICT,
    parent_id UUID REFERENCES product_categories(id) ON DELETE SET NULL,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    status VARCHAR(30) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_product_categories_business ON product_categories(business_id);

CREATE TABLE IF NOT EXISTS suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE RESTRICT,
    supplier_code VARCHAR(50),
    name VARCHAR(200) NOT NULL,
    contact_person VARCHAR(150),
    phone VARCHAR(30),
    email VARCHAR(150),
    address TEXT,
    opening_balance NUMERIC(18,2) DEFAULT 0,
    outstanding_payable NUMERIC(18,2) DEFAULT 0,
    notes TEXT,
    status VARCHAR(30) DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ,
    CONSTRAINT uq_supplier_code_per_biz UNIQUE (business_id, supplier_code)
);

CREATE INDEX idx_suppliers_business ON suppliers(business_id);

CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE RESTRICT,
    category_id UUID REFERENCES product_categories(id) ON DELETE SET NULL,
    supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    sku VARCHAR(100),
    barcode VARCHAR(100),
    brand VARCHAR(100),
    unit VARCHAR(50) NOT NULL DEFAULT 'pcs',
    purchase_price NUMERIC(18,2) NOT NULL DEFAULT 0 CHECK (purchase_price >= 0),
    selling_price NUMERIC(18,2) NOT NULL DEFAULT 0 CHECK (selling_price >= 0),
    wholesale_price NUMERIC(18,2) DEFAULT 0 CHECK (wholesale_price >= 0),
    min_stock NUMERIC(18,4) NOT NULL DEFAULT 0 CHECK (min_stock >= 0),
    max_stock NUMERIC(18,4) DEFAULT 0,
    track_inventory BOOLEAN DEFAULT TRUE,
    track_expiry BOOLEAN DEFAULT FALSE,
    status VARCHAR(30) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'ARCHIVED')),
    image_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ,
    CONSTRAINT uq_product_sku_per_biz UNIQUE (business_id, sku)
);

CREATE INDEX idx_products_business ON products(business_id);
CREATE INDEX idx_products_barcode ON products(business_id, barcode);
CREATE INDEX idx_products_category ON products(business_id, category_id);

CREATE TABLE IF NOT EXISTS product_prices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE RESTRICT,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    price_type VARCHAR(50) NOT NULL CHECK (price_type IN ('RETAIL', 'WHOLESALE', 'SPECIAL', 'PROMOTIONAL')),
    price NUMERIC(18,2) NOT NULL CHECK (price >= 0),
    effective_from TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    effective_to TIMESTAMPTZ,
    created_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_product_prices ON product_prices(business_id, product_id, price_type);

-- ============================================================
-- 8. INVENTORY & STOCK TRANSACTIONS (IMMUTABLE LEDGER)
-- ============================================================

CREATE TABLE IF NOT EXISTS inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE RESTRICT,
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE RESTRICT,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    quantity NUMERIC(18,4) NOT NULL DEFAULT 0,
    reserved_quantity NUMERIC(18,4) NOT NULL DEFAULT 0,
    available_quantity NUMERIC(18,4) GENERATED ALWAYS AS (quantity - reserved_quantity) STORED,
    average_cost NUMERIC(18,4) DEFAULT 0,
    last_counted_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_inventory_item UNIQUE (business_id, branch_id, product_id)
);

CREATE INDEX idx_inventory_lookup ON inventory(business_id, branch_id, product_id);

CREATE TABLE IF NOT EXISTS inventory_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE RESTRICT,
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE RESTRICT,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    transaction_type VARCHAR(50) NOT NULL CHECK (transaction_type IN (
        'OPENING', 'PURCHASE', 'SALE', 'CUSTOMER_RETURN', 'SUPPLIER_RETURN',
        'DAMAGED', 'EXPIRED', 'ADJUSTMENT_IN', 'ADJUSTMENT_OUT', 'TRANSFER_IN', 'TRANSFER_OUT', 'STOCK_COUNT'
    )),
    quantity NUMERIC(18,4) NOT NULL, -- Positive for stock in, Negative for stock out
    unit_cost NUMERIC(18,4) DEFAULT 0,
    reference_type VARCHAR(50),
    reference_id UUID,
    balance_after NUMERIC(18,4) NOT NULL,
    reason TEXT,
    created_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_inv_tx_product ON inventory_transactions(business_id, product_id, created_at);
CREATE INDEX idx_inv_tx_branch ON inventory_transactions(business_id, branch_id, created_at);

CREATE TABLE IF NOT EXISTS stock_transfers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE RESTRICT,
    from_branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE RESTRICT,
    to_branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE RESTRICT,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('DRAFT', 'PENDING', 'APPROVED', 'IN_TRANSIT', 'RECEIVED', 'CANCELLED')),
    transfer_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    approved_by UUID,
    received_by UUID,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS stock_transfer_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transfer_id UUID NOT NULL REFERENCES stock_transfers(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    quantity NUMERIC(18,4) NOT NULL CHECK (quantity > 0),
    received_quantity NUMERIC(18,4) DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 9. CUSTOMERS & CREDIT/DEBT MANAGEMENT (THE CORE MODULE)
-- ============================================================

CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE RESTRICT,
    customer_code VARCHAR(50),
    full_name VARCHAR(200) NOT NULL,
    phone VARCHAR(30) NOT NULL,
    email VARCHAR(150),
    address TEXT,
    customer_type VARCHAR(50) DEFAULT 'REGULAR' CHECK (customer_type IN ('REGULAR', 'WHOLESALE', 'VIP', 'CREDIT_CUSTOMER', 'OTHER')),
    credit_limit NUMERIC(18,2) NOT NULL DEFAULT 0 CHECK (credit_limit >= 0),
    opening_balance NUMERIC(18,2) DEFAULT 0,
    notes TEXT,
    status VARCHAR(30) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'BLOCKED', 'ARCHIVED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ,
    CONSTRAINT uq_customer_code_per_biz UNIQUE (business_id, customer_code)
);

CREATE INDEX idx_customers_business ON customers(business_id);
CREATE INDEX idx_customers_phone ON customers(business_id, phone);

CREATE TABLE IF NOT EXISTS customer_debts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE RESTRICT,
    branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
    sale_id UUID,
    original_amount NUMERIC(18,2) NOT NULL CHECK (original_amount >= 0),
    paid_amount NUMERIC(18,2) NOT NULL DEFAULT 0 CHECK (paid_amount >= 0),
    remaining_amount NUMERIC(18,2) NOT NULL CHECK (remaining_amount >= 0),
    due_date DATE NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'CANCELLED')),
    credit_limit NUMERIC(18,2),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_debts_customer ON customer_debts(business_id, customer_id);
CREATE INDEX idx_debts_status ON customer_debts(business_id, status);
CREATE INDEX idx_debts_due_date ON customer_debts(business_id, due_date);

CREATE TABLE IF NOT EXISTS debt_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE RESTRICT,
    branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
    debt_id UUID NOT NULL REFERENCES customer_debts(id) ON DELETE RESTRICT,
    transaction_type VARCHAR(50) NOT NULL CHECK (transaction_type IN ('DEBT_CREATED', 'PAYMENT', 'REVERSAL', 'ADJUSTMENT', 'RETURN')),
    amount NUMERIC(18,2) NOT NULL CHECK (amount > 0),
    payment_method VARCHAR(50),
    reference VARCHAR(150),
    notes TEXT,
    created_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_debt_tx_debt ON debt_transactions(business_id, debt_id, created_at);

CREATE TABLE IF NOT EXISTS customer_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE RESTRICT,
    branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
    transaction_type VARCHAR(50) NOT NULL CHECK (transaction_type IN ('OPENING_BALANCE', 'CREDIT_SALE', 'PAYMENT', 'RETURN', 'ADJUSTMENT', 'REVERSAL')),
    debit NUMERIC(18,2) DEFAULT 0 CHECK (debit >= 0),
    credit NUMERIC(18,2) DEFAULT 0 CHECK (credit >= 0),
    balance_after NUMERIC(18,2) NOT NULL,
    reference_type VARCHAR(50),
    reference_id UUID,
    description TEXT,
    created_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_cust_tx_ledger ON customer_transactions(business_id, customer_id, created_at);

-- ============================================================
-- 10. SALES & POS TRANSACTIONS
-- ============================================================

CREATE TABLE IF NOT EXISTS sales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE RESTRICT,
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE RESTRICT,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
    invoice_number VARCHAR(100) NOT NULL,
    sale_date TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    subtotal NUMERIC(18,2) NOT NULL CHECK (subtotal >= 0),
    discount NUMERIC(18,2) DEFAULT 0 CHECK (discount >= 0),
    tax NUMERIC(18,2) DEFAULT 0 CHECK (tax >= 0),
    total NUMERIC(18,2) NOT NULL CHECK (total >= 0),
    paid_amount NUMERIC(18,2) NOT NULL DEFAULT 0 CHECK (paid_amount >= 0),
    credit_amount NUMERIC(18,2) NOT NULL DEFAULT 0 CHECK (credit_amount >= 0),
    cost_of_goods NUMERIC(18,2) DEFAULT 0 CHECK (cost_of_goods >= 0),
    gross_profit NUMERIC(18,2) DEFAULT 0,
    status VARCHAR(30) NOT NULL DEFAULT 'COMPLETED' 
        CHECK (status IN ('DRAFT', 'COMPLETED', 'PARTIALLY_PAID', 'CREDIT', 'REFUNDED', 'PARTIALLY_REFUNDED', 'CANCELLED', 'REVERSED')),
    created_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_sale_invoice_per_biz UNIQUE (business_id, invoice_number)
);

CREATE INDEX idx_sales_business_date ON sales(business_id, sale_date);
CREATE INDEX idx_sales_branch ON sales(business_id, branch_id);
CREATE INDEX idx_sales_customer ON sales(business_id, customer_id);

CREATE TABLE IF NOT EXISTS sale_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    quantity NUMERIC(18,4) NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC(18,4) NOT NULL CHECK (unit_price >= 0),
    unit_cost NUMERIC(18,4) NOT NULL DEFAULT 0 CHECK (unit_cost >= 0),
    discount NUMERIC(18,2) DEFAULT 0 CHECK (discount >= 0),
    tax NUMERIC(18,2) DEFAULT 0 CHECK (tax >= 0),
    line_total NUMERIC(18,2) NOT NULL CHECK (line_total >= 0),
    cost_total NUMERIC(18,2) NOT NULL DEFAULT 0 CHECK (cost_total >= 0),
    profit NUMERIC(18,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sale_items_sale ON sale_items(sale_id);
CREATE INDEX idx_sale_items_product ON sale_items(product_id);

CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE RESTRICT,
    branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    sale_id UUID REFERENCES sales(id) ON DELETE SET NULL,
    debt_id UUID REFERENCES customer_debts(id) ON DELETE SET NULL,
    amount NUMERIC(18,2) NOT NULL CHECK (amount > 0),
    payment_method VARCHAR(50) NOT NULL CHECK (payment_method IN ('CASH', 'BANK', 'MOBILE_MONEY', 'CARD', 'CREDIT', 'OTHER')),
    reference_number VARCHAR(150),
    payment_date TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    received_by UUID,
    status VARCHAR(30) DEFAULT 'COMPLETED',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_payments_sale ON payments(business_id, sale_id);
CREATE INDEX idx_payments_debt ON payments(business_id, debt_id);

CREATE TABLE IF NOT EXISTS receipts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE RESTRICT,
    branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
    sale_id UUID REFERENCES sales(id) ON DELETE SET NULL,
    payment_id UUID REFERENCES payments(id) ON DELETE SET NULL,
    receipt_number VARCHAR(100) NOT NULL,
    verification_code VARCHAR(150) NOT NULL,
    issued_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    pdf_url TEXT,
    status VARCHAR(30) DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_receipt_number_per_biz UNIQUE (business_id, receipt_number)
);

-- ============================================================
-- 11. PURCHASES & SUPPLIER LEDGER
-- ============================================================

CREATE TABLE IF NOT EXISTS purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE RESTRICT,
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE RESTRICT,
    supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
    invoice_number VARCHAR(100),
    purchase_date TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    subtotal NUMERIC(18,2) NOT NULL CHECK (subtotal >= 0),
    discount NUMERIC(18,2) DEFAULT 0,
    tax NUMERIC(18,2) DEFAULT 0,
    total NUMERIC(18,2) NOT NULL CHECK (total >= 0),
    paid_amount NUMERIC(18,2) DEFAULT 0,
    credit_amount NUMERIC(18,2) DEFAULT 0,
    due_date DATE,
    payment_status VARCHAR(30) DEFAULT 'PAID',
    status VARCHAR(30) DEFAULT 'RECEIVED',
    created_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS purchase_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    purchase_id UUID NOT NULL REFERENCES purchases(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    quantity NUMERIC(18,4) NOT NULL CHECK (quantity > 0),
    unit_cost NUMERIC(18,4) NOT NULL CHECK (unit_cost >= 0),
    discount NUMERIC(18,2) DEFAULT 0,
    tax NUMERIC(18,2) DEFAULT 0,
    total NUMERIC(18,2) NOT NULL CHECK (total >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS supplier_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE RESTRICT,
    branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
    supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
    transaction_type VARCHAR(50) NOT NULL CHECK (transaction_type IN ('OPENING_BALANCE', 'PURCHASE', 'PAYMENT', 'RETURN', 'ADJUSTMENT', 'REVERSAL')),
    debit NUMERIC(18,2) DEFAULT 0,
    credit NUMERIC(18,2) DEFAULT 0,
    balance_after NUMERIC(18,2) NOT NULL,
    reference_type VARCHAR(50),
    reference_id UUID,
    description TEXT,
    created_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 12. EXPENSES
-- ============================================================

CREATE TABLE IF NOT EXISTS expense_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE, -- NULL for global default categories
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE RESTRICT,
    branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
    category_id UUID REFERENCES expense_categories(id) ON DELETE SET NULL,
    amount NUMERIC(18,2) NOT NULL CHECK (amount > 0),
    expense_date TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    payment_method VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    attachment_url TEXT,
    reference_number VARCHAR(150),
    created_by UUID,
    status VARCHAR(30) NOT NULL DEFAULT 'POSTED' CHECK (status IN ('POSTED', 'REVERSED', 'CANCELLED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_expenses_biz_date ON expenses(business_id, expense_date);

-- ============================================================
-- 13. CASH REGISTERS (DRAWER SHIFTS)
-- ============================================================

CREATE TABLE IF NOT EXISTS cash_registers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE RESTRICT,
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE RESTRICT,
    name VARCHAR(100) NOT NULL,
    opening_balance NUMERIC(18,2) NOT NULL DEFAULT 0,
    current_balance NUMERIC(18,2) NOT NULL DEFAULT 0,
    status VARCHAR(30) NOT NULL DEFAULT 'CLOSED' CHECK (status IN ('OPEN', 'CLOSED', 'SUSPENDED')),
    opened_by UUID,
    opened_at TIMESTAMPTZ,
    closed_by UUID,
    closed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS cash_register_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE RESTRICT,
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE RESTRICT,
    register_id UUID NOT NULL REFERENCES cash_registers(id) ON DELETE CASCADE,
    transaction_type VARCHAR(50) NOT NULL CHECK (transaction_type IN ('SALE', 'CUSTOMER_PAYMENT', 'EXPENSE', 'REFUND', 'CASH_IN', 'CASH_OUT', 'OPENING', 'CLOSING', 'ADJUSTMENT')),
    amount NUMERIC(18,2) NOT NULL,
    balance_after NUMERIC(18,2) NOT NULL,
    reference_type VARCHAR(50),
    reference_id UUID,
    description TEXT,
    created_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 14. RETURNS & REVERSALS (NO HARD DELETIONS)
-- ============================================================

CREATE TABLE IF NOT EXISTS returns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE RESTRICT,
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE RESTRICT,
    return_type VARCHAR(30) NOT NULL CHECK (return_type IN ('CUSTOMER_RETURN', 'SUPPLIER_RETURN')),
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
    original_sale_id UUID REFERENCES sales(id) ON DELETE SET NULL,
    original_purchase_id UUID REFERENCES purchases(id) ON DELETE SET NULL,
    return_number VARCHAR(100) NOT NULL,
    total_amount NUMERIC(18,2) NOT NULL CHECK (total_amount >= 0),
    reason TEXT,
    status VARCHAR(30) NOT NULL DEFAULT 'COMPLETED',
    created_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS return_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    return_id UUID NOT NULL REFERENCES returns(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    quantity NUMERIC(18,4) NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC(18,4) NOT NULL CHECK (unit_price >= 0),
    amount NUMERIC(18,2) NOT NULL CHECK (amount >= 0),
    condition VARCHAR(50) NOT NULL CHECK (condition IN ('GOOD', 'DAMAGED', 'DEFECTIVE', 'EXPIRED', 'OTHER')),
    reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 15. AUDIT LOGS (IMMUTABLE APPEND-ONLY)
-- ============================================================

CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    device_id UUID,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_logs_business_time ON audit_logs(business_id, created_at DESC);
CREATE INDEX idx_audit_logs_entity ON audit_logs(business_id, entity_type, entity_id);

-- ============================================================
-- 16. OFFLINE SYNC & IDEMPOTENCY KEYS
-- ============================================================

CREATE TABLE IF NOT EXISTS devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE RESTRICT,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    device_identifier VARCHAR(200) NOT NULL,
    device_name VARCHAR(150),
    platform VARCHAR(50) CHECK (platform IN ('ANDROID', 'IOS', 'WEB', 'WINDOWS')),
    app_version VARCHAR(50),
    last_sync_at TIMESTAMPTZ,
    last_seen_at TIMESTAMPTZ,
    status VARCHAR(30) DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_device_identifier UNIQUE (business_id, device_identifier)
);

CREATE TABLE IF NOT EXISTS idempotency_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE RESTRICT,
    device_id UUID REFERENCES devices(id) ON DELETE SET NULL,
    key VARCHAR(200) NOT NULL,
    request_hash VARCHAR(255),
    response_status INTEGER,
    response_body JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (CURRENT_TIMESTAMP + INTERVAL '7 days'),
    CONSTRAINT uq_idempotency_key UNIQUE (business_id, key)
);

CREATE TABLE IF NOT EXISTS sync_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE RESTRICT,
    branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
    device_id UUID REFERENCES devices(id) ON DELETE SET NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id UUID NOT NULL,
    operation VARCHAR(30) NOT NULL CHECK (operation IN ('CREATE', 'UPDATE', 'REVERSAL', 'DELETE_SOFT')),
    payload JSONB NOT NULL,
    version BIGINT NOT NULL DEFAULT 1,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'SYNCED', 'FAILED', 'CONFLICT')),
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMPTZ
);

CREATE INDEX idx_sync_events_queue ON sync_events(business_id, status, created_at);

-- ============================================================
-- 17. NOTIFICATIONS, SETTINGS & TAX CONFIG
-- ============================================================

CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('LOW_STOCK', 'DEBT_DUE', 'DEBT_OVERDUE', 'PAYMENT_RECEIVED', 'SALE_COMPLETED', 'SYSTEM', 'SUBSCRIPTION', 'SECURITY')),
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    channel VARCHAR(50) DEFAULT 'IN_APP' CHECK (channel IN ('IN_APP', 'SMS', 'EMAIL', 'TELEGRAM', 'WHATSAPP')),
    status VARCHAR(30) DEFAULT 'PENDING',
    scheduled_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    sent_at TIMESTAMPTZ,
    failure_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE RESTRICT,
    branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,
    setting_key VARCHAR(150) NOT NULL,
    setting_value JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_setting_key_scope UNIQUE (business_id, branch_id, setting_key)
);

CREATE TABLE IF NOT EXISTS tax_rates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    rate NUMERIC(8,4) NOT NULL CHECK (rate >= 0),
    tax_type VARCHAR(50) DEFAULT 'VAT',
    is_active BOOLEAN DEFAULT TRUE,
    effective_from DATE DEFAULT CURRENT_DATE,
    effective_to DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 18. SUBSCRIPTIONS, SUPPORT & AI
-- ============================================================

CREATE TABLE IF NOT EXISTS subscription_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price NUMERIC(18,2) NOT NULL DEFAULT 0,
    billing_cycle VARCHAR(30) DEFAULT 'MONTHLY',
    max_users INTEGER DEFAULT 1,
    max_branches INTEGER DEFAULT 1,
    max_products INTEGER DEFAULT 50,
    max_transactions INTEGER DEFAULT 500,
    features JSONB,
    status VARCHAR(30) DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS business_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE RESTRICT,
    plan_id UUID NOT NULL REFERENCES subscription_plans(id) ON DELETE RESTRICT,
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    end_date DATE,
    auto_renew BOOLEAN DEFAULT TRUE,
    external_reference VARCHAR(200),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS support_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    subject VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    priority VARCHAR(30) DEFAULT 'MEDIUM' CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    status VARCHAR(30) DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'IN_PROGRESS', 'WAITING', 'RESOLVED', 'CLOSED')),
    assigned_to UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ai_queries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE RESTRICT,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    query TEXT NOT NULL,
    response TEXT NOT NULL,
    data_sources JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ai_insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE RESTRICT,
    branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
    insight_type VARCHAR(100) NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    data JSONB,
    confidence NUMERIC(8,4),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
