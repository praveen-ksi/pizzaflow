-- ==========================================
-- PIZZAFLOW DATABASE SCHEMA (SUPABASE/POSTGRESQL)
-- ==========================================
-- Author: PizzaFlow Engineering
-- Date: July 2026
-- Description: Production-ready, fully-normalized schema for order tracking, 
--              pizza item snapshots, simulated PizzaPay payments, and 
--              future restaurant scale operations.

-- Enable PostgreSQL extensions for UUID generation and utility functions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 1. ENUM TYPE DEFINITIONS
-- ==========================================

-- Order preparation and fulfillment lifecycle
CREATE TYPE order_status_enum AS ENUM (
  'CONFIRMED', 
  'PREPARING', 
  'READY_FOR_PICKUP', 
  'COMPLETED', 
  'CANCELLED'
);

-- Supported transaction providers (designed for easy expansion, e.g., STRIPE, RAZORPAY)
CREATE TYPE payment_provider_enum AS ENUM (
  'PIZZAPAY'
);

-- Customer checkout settlement methods
CREATE TYPE payment_method_enum AS ENUM (
  'UPI', 
  'CARD', 
  'CASH'
);

-- Payment clearing state
CREATE TYPE payment_status_enum AS ENUM (
  'PENDING', 
  'PAID', 
  'FAILED', 
  'REFUNDED'
);

-- Delivery or fulfillment mode
CREATE TYPE fulfillment_type_enum AS ENUM (
  'DINE_IN',
  'TAKEAWAY',
  'DELIVERY'
);


-- ==========================================
-- 2. TABLE DEFINITIONS
-- ==========================================

-- --- TABLE: orders ---
-- Primary record tracking customer orders and core fulfillment state.
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  token_number VARCHAR(10) NOT NULL,
  customer_name VARCHAR(100) NOT NULL,
  customer_phone VARCHAR(20) NOT NULL,
  
  -- Financial totals
  subtotal_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  tax_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  discount_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  delivery_charge NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  total_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  
  -- State flags
  order_status order_status_enum NOT NULL DEFAULT 'CONFIRMED',
  fulfillment_type fulfillment_type_enum NOT NULL DEFAULT 'TAKEAWAY',
  
  -- Scalability details
  branch_id UUID NULL, -- Support for multi-branch scaling
  coupon_code VARCHAR(50) NULL, -- Coupon integration
  delivery_address TEXT NULL, -- Delivery location details
  order_notes TEXT NULL, -- Kitchen requests (e.g. "no olives", "extra spicy")
  
  -- Timestamps for KDS (Kitchen Display System) tracking & SLA analytics
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  preparing_at TIMESTAMPTZ NULL,
  ready_at TIMESTAMPTZ NULL,
  completed_at TIMESTAMPTZ NULL,

  -- Constraints
  CONSTRAINT chk_subtotal_non_negative CHECK (subtotal_amount >= 0.00),
  CONSTRAINT chk_tax_non_negative CHECK (tax_amount >= 0.00),
  CONSTRAINT chk_discount_non_negative CHECK (discount_amount >= 0.00),
  CONSTRAINT chk_delivery_charge_non_negative CHECK (delivery_charge >= 0.00),
  CONSTRAINT chk_total_amount_non_negative CHECK (total_amount >= 0.00)
);


-- --- TABLE: order_items ---
-- Line items representing individual pizzas ordered. Uses price snapshots for audit accuracy.
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL,
  pizza_id VARCHAR(100) NOT NULL, -- Aligns with frontend pizza catalog slugs
  pizza_name VARCHAR(150) NOT NULL, -- Snapshotted name for historic logging
  base_name VARCHAR(100) NOT NULL DEFAULT 'Thin Crust',
  toppings TEXT[] NOT NULL DEFAULT '{}',
  quantity INTEGER NOT NULL,
  unit_price NUMERIC(10, 2) NOT NULL, -- Snapshotted pricing for billing integrity
  total_price NUMERIC(10, 2) NOT NULL, -- Cached total (quantity * unit_price)
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Foreign Key Relationship
  CONSTRAINT fk_order_items_order_id 
    FOREIGN KEY (order_id) 
    REFERENCES orders(id) 
    ON DELETE CASCADE,

  -- Constraints
  CONSTRAINT chk_quantity_positive CHECK (quantity > 0),
  CONSTRAINT chk_unit_price_non_negative CHECK (unit_price >= 0.00),
  CONSTRAINT chk_total_price_non_negative CHECK (total_price >= 0.00),
  CONSTRAINT chk_calculated_total_price CHECK (total_price = (quantity * unit_price))
);


-- MIGRATION STATEMENTS FOR PRE-EXISTING TABLES:
-- If you are updating an existing database, run these lines to append the columns:
-- ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS base_name VARCHAR(100) NOT NULL DEFAULT 'Thin Crust';
-- ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS toppings TEXT[] NOT NULL DEFAULT '{}';


-- --- TABLE: payments ---
-- Isolated payment entities recording checkout settlement separate from order routing.
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL UNIQUE, -- One-to-one order integration
  provider payment_provider_enum NOT NULL DEFAULT 'PIZZAPAY',
  payment_method payment_method_enum NOT NULL,
  payment_status payment_status_enum NOT NULL DEFAULT 'PENDING',
  transaction_reference VARCHAR(100) NOT NULL, -- Generated txn receipt
  amount NUMERIC(10, 2) NOT NULL,
  
  -- Refunds & dispute handling
  refund_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  refunded_at TIMESTAMPTZ NULL,
  
  -- Audits
  paid_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Foreign Key Relationship
  CONSTRAINT fk_payments_order_id 
    FOREIGN KEY (order_id) 
    REFERENCES orders(id) 
    ON DELETE CASCADE,

  -- Constraints
  CONSTRAINT chk_payment_amount_non_negative CHECK (amount >= 0.00),
  CONSTRAINT chk_refund_amount_non_negative CHECK (refund_amount >= 0.00),
  CONSTRAINT chk_refund_limit CHECK (refund_amount <= amount)
);


-- ==========================================
-- 3. TRIGGERS & UTILITY FUNCTIONS
-- ==========================================

-- --- TRIGGER FUNCTION: Update timestamp ---
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- --- TRIGGER: Apply updated_at on orders ---
CREATE TRIGGER tr_orders_updated_at
BEFORE UPDATE ON orders
FOR EACH ROW
EXECUTE PROCEDURE update_updated_at_column();


-- --- TRIGGER FUNCTION: Daily resetting token generator ---
-- Generates human-readable, sequential tokens (e.g. 101, 102...) unique per day
CREATE OR REPLACE FUNCTION generate_daily_token_number()
RETURNS TRIGGER AS $$
DECLARE
  today_date DATE := CURRENT_DATE;
  next_token INTEGER;
BEGIN
  -- Select highest token sequence number assigned today.
  -- If none exist, we initialize the daily batch at 100 so the first order is 101.
  -- We extract only digits from the token number to make the cast fully robust.
  SELECT COALESCE(MAX(NULLIF(regexp_replace(token_number, '\D', '', 'g'), '')::INTEGER), 100)
  INTO next_token
  FROM orders
  WHERE created_at::DATE = today_date;

  NEW.token_number := (next_token + 1)::VARCHAR;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- --- TRIGGER: Assign token before order creation ---
CREATE TRIGGER tr_orders_daily_token
BEFORE INSERT ON orders
FOR EACH ROW
EXECUTE PROCEDURE generate_daily_token_number();


-- --- TRIGGER FUNCTION: Record SLA timestamps based on Status transitions ---
CREATE OR REPLACE FUNCTION track_order_sla_timestamps()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.order_status = 'PREPARING' AND OLD.order_status != 'PREPARING' THEN
    NEW.preparing_at = NOW();
  ELSIF NEW.order_status = 'READY_FOR_PICKUP' AND OLD.order_status != 'READY_FOR_PICKUP' THEN
    NEW.ready_at = NOW();
  ELSIF NEW.order_status = 'COMPLETED' AND OLD.order_status != 'COMPLETED' THEN
    NEW.completed_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- --- TRIGGER: Apply SLA metrics ---
CREATE TRIGGER tr_orders_sla_metrics
BEFORE UPDATE ON orders
FOR EACH ROW
EXECUTE PROCEDURE track_order_sla_timestamps();


-- ==========================================
-- 4. PERFORMANCE & REPORTING INDEXES
-- ==========================================

-- Speed up order status updates and queue tracking on KDS / staff dashboard
CREATE INDEX idx_orders_order_status ON orders (order_status);

-- Facilitate fast daily sequence counts and customer reports
CREATE INDEX idx_orders_created_at ON orders (created_at);

-- Support rapid customer support order lookups
CREATE INDEX idx_orders_customer_phone ON orders (customer_phone);

-- Multi-tenant branch analytics
CREATE INDEX idx_orders_branch_id ON orders (branch_id) WHERE branch_id IS NOT NULL;

-- Payment lifecycle querying & accounting audits
CREATE INDEX idx_payments_payment_status ON payments (payment_status);
CREATE INDEX idx_payments_payment_method ON payments (payment_method);
CREATE INDEX idx_payments_created_at ON payments (created_at);


-- ==========================================
-- 5. COLUMN DOCUMENTATION (SUPABASE/POSTGRES COMMENTS)
-- ==========================================
COMMENT ON TABLE orders IS 'Primary transaction table capturing customer details, billing, and fulfillment state.';
COMMENT ON COLUMN orders.token_number IS 'Daily cycling, human-readable queue number (e.g. 101, 102) generated automatically.';
COMMENT ON COLUMN order_items.unit_price IS 'Snapshotted historical pricing to protect ledger against future menu price updates.';
COMMENT ON COLUMN payments.transaction_reference IS 'Unique simulated identifier generated by PizzaPay or external settlement providers.';
