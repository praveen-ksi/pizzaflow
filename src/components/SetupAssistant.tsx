/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { supabaseConfig, isSupabaseConfigured } from '../lib/supabase';
import { Check, Copy, Database, Shield, Key, Sparkles, AlertTriangle, Trash2, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabaseErrorLogs, clearSupabaseErrorLogs } from '../lib/orderService';

export const SetupAssistant: React.FC = () => {
  const [copied, setCopied] = useState(false);
  const [isOpen, setIsOpen] = useState(!isSupabaseConfigured);
  const [errorLogs, setErrorLogs] = useState([...supabaseErrorLogs]);
  const [tableChecks, setTableChecks] = useState<{
    orders: boolean | null;
    order_items: boolean | null;
    payments: boolean | null;
    checking: boolean;
  }>({
    orders: null,
    order_items: null,
    payments: null,
    checking: false,
  });

  const checkDatabaseTables = async () => {
    if (!isSupabaseConfigured) return;
    setTableChecks(prev => ({ ...prev, checking: true }));
    
    try {
      const { supabase } = await import('../lib/supabase');
      if (!supabase) throw new Error('Supabase client not initialized');

      const [ordersCheck, itemsCheck, paymentsCheck] = await Promise.all([
        supabase.from('orders').select('id').limit(1).then(({ error }) => !error || (error.code !== 'PGRST116' && error.code !== '42P01')),
        supabase.from('order_items').select('id').limit(1).then(({ error }) => !error || (error.code !== 'PGRST116' && error.code !== '42P01')),
        supabase.from('payments').select('id').limit(1).then(({ error }) => !error || (error.code !== 'PGRST116' && error.code !== '42P01'))
      ]);

      setTableChecks({
        orders: ordersCheck,
        order_items: itemsCheck,
        payments: paymentsCheck,
        checking: false
      });
    } catch (e) {
      console.error('Failed to run table verification checks:', e);
      setTableChecks({
        orders: false,
        order_items: false,
        payments: false,
        checking: false
      });
    }
  };

  useEffect(() => {
    const handleLogsChange = () => {
      setErrorLogs([...supabaseErrorLogs]);
    };
    window.addEventListener('supabase-error-change', handleLogsChange);
    
    if (isSupabaseConfigured) {
      checkDatabaseTables();
    }

    return () => {
      window.removeEventListener('supabase-error-change', handleLogsChange);
    };
  }, []);

  const sqlCode = `-- 1. Create profiles table linked to Supabase Auth users
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  role TEXT CHECK (role IN ('admin', 'staff')) NOT NULL,
  full_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 2. Create tables for Pizzas, Bases, and Toppings
CREATE TABLE public.pizzas (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  price INTEGER NOT NULL,
  description TEXT,
  image TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE public.pizza_bases (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  price INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE public.pizza_toppings (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  price INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 3. Create ENUM Types for Order Lifecycle & Payments
CREATE TYPE public.order_status_enum AS ENUM ('CONFIRMED', 'PREPARING', 'READY_FOR_PICKUP', 'COMPLETED', 'CANCELLED');
CREATE TYPE public.payment_provider_enum AS ENUM ('PIZZAPAY');
CREATE TYPE public.payment_method_enum AS ENUM ('UPI', 'CARD', 'CASH');
CREATE TYPE public.payment_status_enum AS ENUM ('PENDING', 'PAID', 'FAILED', 'REFUNDED');
CREATE TYPE public.fulfillment_type_enum AS ENUM ('DINE_IN', 'TAKEAWAY', 'DELIVERY');

-- 4. Create Tables for Orders, Items, and Payments
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_number VARCHAR(10) NOT NULL,
  customer_name VARCHAR(100) NOT NULL,
  customer_phone VARCHAR(20) NOT NULL,
  subtotal_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  tax_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  discount_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  delivery_charge NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  total_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  order_status public.order_status_enum NOT NULL DEFAULT 'CONFIRMED',
  fulfillment_type public.fulfillment_type_enum NOT NULL DEFAULT 'TAKEAWAY',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  preparing_at TIMESTAMPTZ NULL,
  ready_at TIMESTAMPTZ NULL,
  completed_at TIMESTAMPTZ NULL,
  CONSTRAINT chk_total_amount_non_negative CHECK (total_amount >= 0.00)
);

CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  pizza_id VARCHAR(100) NOT NULL,
  pizza_name VARCHAR(150) NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(10, 2) NOT NULL CHECK (unit_price >= 0.00),
  total_price NUMERIC(10, 2) NOT NULL CHECK (total_price >= 0.00),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_calculated_total_price CHECK (total_price = (quantity * unit_price))
);

CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL UNIQUE REFERENCES public.orders(id) ON DELETE CASCADE,
  provider public.payment_provider_enum NOT NULL DEFAULT 'PIZZAPAY',
  payment_method public.payment_method_enum NOT NULL,
  payment_status public.payment_status_enum NOT NULL DEFAULT 'PENDING',
  transaction_reference VARCHAR(100) NOT NULL,
  amount NUMERIC(10, 2) NOT NULL CHECK (amount >= 0.00),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Enable Row-Level Security (RLS) on ALL tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pizzas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pizza_bases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pizza_toppings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- 6. Create RLS Policies

-- Public Read-Only Policies for Menu Configuration and Profiles
CREATE POLICY "Allow public read access to profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Allow public read access to pizzas" ON public.pizzas FOR SELECT USING (true);
CREATE POLICY "Allow public read access to pizza_bases" ON public.pizza_bases FOR SELECT USING (true);
CREATE POLICY "Allow public read access to pizza_toppings" ON public.pizza_toppings FOR SELECT USING (true);

-- User Insert/Update Policies for Profiles
CREATE POLICY "Allow users to insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Allow users to update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Public Read & Insert Policies for Orders, Items, and Payments
CREATE POLICY "Allow public select for orders" ON public.orders FOR SELECT USING (true);
CREATE POLICY "Allow public insert for orders" ON public.orders FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public select for order items" ON public.order_items FOR SELECT USING (true);
CREATE POLICY "Allow public insert for order items" ON public.order_items FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public select for payments" ON public.payments FOR SELECT USING (true);
CREATE POLICY "Allow public insert for payments" ON public.payments FOR INSERT WITH CHECK (true);

-- Admin control policies for menu items
CREATE POLICY "Allow admin write access to pizzas" ON public.pizzas FOR ALL TO authenticated 
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')) 
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Allow admin write access to pizza_bases" ON public.pizza_bases FOR ALL TO authenticated 
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')) 
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Allow admin write access to pizza_toppings" ON public.pizza_toppings FOR ALL TO authenticated 
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')) 
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Staff and Admin update/delete access for Order Management
CREATE POLICY "Allow staff/admin to update orders" ON public.orders FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'staff')))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'staff')));

CREATE POLICY "Allow staff/admin to delete orders" ON public.orders FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'staff')));

CREATE POLICY "Allow staff/admin to update order items" ON public.order_items FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'staff')))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'staff')));

CREATE POLICY "Allow staff/admin to update payments" ON public.payments FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'staff')))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'staff')));

-- 7. Automated Trigger Functions & Triggers

-- Trigger: Create profiles automatically for newly registered users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, role, full_name)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'role', 'staff'),
    COALESCE(new.raw_user_meta_data->>'full_name', 'New Member')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger: Automatically generate sequential, daily resetting order tokens
CREATE OR REPLACE FUNCTION public.generate_daily_token_number()
RETURNS TRIGGER AS $$
DECLARE
  today_date DATE := CURRENT_DATE;
  next_token INTEGER;
BEGIN
  -- Extract only digits from the token number to make the cast fully robust.
  SELECT COALESCE(MAX(NULLIF(regexp_replace(token_number, '\D', '', 'g'), '')::INTEGER), 100)
  INTO next_token
  FROM public.orders
  WHERE created_at::DATE = today_date;

  NEW.token_number := (next_token + 1)::VARCHAR;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_orders_daily_token ON public.orders;
CREATE TRIGGER tr_orders_daily_token
  BEFORE INSERT ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.generate_daily_token_number();

-- Trigger: Automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_orders_updated_at ON public.orders;
CREATE TRIGGER tr_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger: Automatically track order SLA transition state timestamps
CREATE OR REPLACE FUNCTION public.track_order_sla_timestamps()
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

DROP TRIGGER IF EXISTS tr_orders_sla_metrics ON public.orders;
CREATE TRIGGER tr_orders_sla_metrics
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.track_order_sla_timestamps();

-- 8. Seed Default Menu and Customizer Data
INSERT INTO public.pizzas (id, name, price, description, image) VALUES
('P1', 'Margherita', 299, 'Fresh whole-milk mozzarella, sweet tomato herb sauce, aromatic fresh basil leaves, and premium extra virgin olive oil.', 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=600&q=80'),
('P2', 'Chicago Deep Dish', 349, 'Indulgent deep dish layered with rich buttery crust, thick mozzarella block, loaded meats, and chunky vine-ripened tomato sauce.', 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=600&q=80'),
('P3', 'Greek Mediterranean', 329, 'Authentic crumbled feta, premium Kalamata olives, fire-roasted sweet peppers, red onions, and a touch of wild mountain oregano.', 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=600&q=80'),
('P4', 'California Veggie', 339, 'Garden fresh baby spinach, sweet golden corn, roasted garlic cloves, crisp green bell peppers, and vine-matured tomatoes.', 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=600&q=80'),
('P5', 'Farm House', 319, 'A classic, comforting blend of button mushrooms, golden sweet corn, juicy tomatoes, and crunchy farm-fresh capsicum.', 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=600&q=80'),
('P6', 'Pepperoni Classic', 369, 'Generous layers of premium smoky cured beef pepperoni slices, whole-milk mozzarella, and signature tomato reduction.', 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=600&q=80'),
('P7', 'BBQ Chicken', 379, 'Tender fire-grilled hickory chicken breast, caramelized onions, sweet tangy barbecue drizzle, and fresh cilantro.', 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=600&q=80'),
('P8', 'Paneer Tikka', 349, 'Tantalizing spiced cottage cheese (Paneer) tikka cubes, roasted baby onions, crisp capsicum, and a spicy peri-peri finishing drizzle.', 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=600&q=80')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  price = EXCLUDED.price,
  description = EXCLUDED.description,
  image = EXCLUDED.image;

INSERT INTO public.pizza_bases (id, name, price) VALUES
('B1', 'Thin Crust', 149),
('B2', 'Thick Crust', 179),
('B3', 'Cheese Burst', 229),
('B4', 'Whole Wheat', 159),
('B5', 'Multigrain', 169)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  price = EXCLUDED.price;

INSERT INTO public.pizza_toppings (id, name, price) VALUES
('T1', 'Black Olives', 49),
('T2', 'Extra Cheese', 69),
('T3', 'Button Mushrooms', 49),
('T4', 'Green Peppers', 39),
('T5', 'Jalapenos', 39),
('T6', 'Sun-Dried Tomatoes', 59),
('T7', 'Caramelised Onions', 49),
('T8', 'Sweet Corn', 39),
('T9', 'Roasted Garlic', 49),
('T10', 'Peri-Peri Drizzle', 59)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  price = EXCLUDED.price;`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(sqlCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto w-full px-4 font-sans">
      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-lg shadow-slate-100">
        {/* Header Bar */}
        <button
          id="btn-toggle-assistant"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between p-6 text-left hover:bg-cream-dark/30 transition-all duration-200"
        >
          <div className="flex items-center gap-3.5">
            <div className={`p-2.5 rounded-xl ${isSupabaseConfigured ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-tomato/5 text-tomato border border-tomato/10'}`}>
              <Database size={22} />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 font-display flex flex-wrap items-center gap-2 text-sm sm:text-base">
                PizzaFlow Backend Configuration
                {isSupabaseConfigured ? (
                  <span className="text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 px-2.5 py-0.5 rounded-full">
                    Supabase Connected
                  </span>
                ) : (
                  <span className="text-[10px] font-mono font-bold bg-tomato/5 text-tomato border border-tomato/10 px-2.5 py-0.5 rounded-full">
                    Demo Mode Active
                  </span>
                )}
              </h3>
              <p className="text-slate-500 text-xs mt-1">
                {isSupabaseConfigured 
                  ? 'Real-time role authentication is fully operational.' 
                  : 'Configure Supabase keys or run in local sandbox with pre-seeded accounts.'}
              </p>
            </div>
          </div>
          <div className="text-slate-500 text-xs font-mono bg-slate-50 hover:bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 transition">
            {isOpen ? 'COLLAPSE' : 'EXPAND'}
          </div>
        </button>

        {/* Content Panel */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="border-t border-slate-100 overflow-hidden"
            >
              <div className="p-6 space-y-6 bg-slate-50/50">
                
                {/* Status & Secrets Setup Guide */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Variables Status */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                    <h4 className="text-slate-700 text-xs font-mono uppercase tracking-wider mb-3.5 flex items-center gap-1.5 font-bold">
                      <Key size={14} className="text-tomato" />
                      Runtime Environment Keys
                    </h4>
                    <div className="space-y-3 font-mono text-xs text-slate-800">
                      <div>
                        <div className="text-slate-400 mb-1 font-sans">VITE_SUPABASE_URL</div>
                        <div className={`p-2.5 rounded-lg bg-slate-50 border truncate ${isSupabaseConfigured ? 'border-emerald-200 text-emerald-700' : 'border-slate-200 text-slate-500'}`}>
                          {supabaseConfig.url || 'Not configured'}
                        </div>
                      </div>
                      <div>
                        <div className="text-slate-400 mb-1 font-sans">VITE_SUPABASE_ANON_KEY</div>
                        <div className={`p-2.5 rounded-lg bg-slate-50 border truncate ${isSupabaseConfigured ? 'border-emerald-200 text-emerald-700' : 'border-slate-200 text-slate-500'}`}>
                          {supabaseConfig.anonKey ? '••••••••••••••••' : 'Not configured'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Sandbox / Mock Access Details */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
                    <div>
                      <h4 className="text-slate-700 text-xs font-mono uppercase tracking-wider mb-3.5 flex items-center gap-1.5 font-bold">
                        <Sparkles size={14} className="text-tomato animate-pulse" />
                        Demo Mode Accounts
                      </h4>
                      <p className="text-slate-600 text-xs leading-relaxed mb-4">
                        To test PizzaFlow instantly before configuring Supabase, we pre-loaded mock credentials backed by secure local storage:
                      </p>
                      
                      <div className="space-y-2 text-xs font-mono">
                        <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                          <span className="text-tomato font-semibold">Admin Account</span>
                          <span className="text-slate-700 font-medium">admin@pizzaflow.com</span>
                        </div>
                        <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                          <span className="text-tomato font-semibold">Staff Account</span>
                          <span className="text-slate-700 font-medium">staff@pizzaflow.com</span>
                        </div>
                        <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                          <span className="text-slate-400 font-medium">Shared Password</span>
                          <span className="text-slate-700 font-medium">password123</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Supabase Schema Verification Checklist */}
                {isSupabaseConfigured && (
                  <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-slate-700 text-xs font-mono uppercase tracking-wider flex items-center gap-1.5 font-bold">
                        <Database size={14} className="text-tomato" />
                        Supabase Table Verification
                      </h4>
                      <button
                        onClick={checkDatabaseTables}
                        disabled={tableChecks.checking}
                        className="flex items-center gap-1.5 text-xs text-tomato hover:text-tomato hover:bg-tomato/5 font-semibold py-1 px-2.5 rounded-lg border border-tomato/10 transition disabled:opacity-50"
                      >
                        <RefreshCw size={13} className={tableChecks.checking ? "animate-spin" : ""} />
                        {tableChecks.checking ? 'Verifying...' : 'Re-verify Tables'}
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className={`p-3.5 rounded-xl border flex items-center justify-between ${
                        tableChecks.orders === true 
                          ? 'bg-emerald-50/50 border-emerald-100 text-emerald-900' 
                          : tableChecks.orders === false 
                            ? 'bg-rose-50/50 border-rose-100 text-rose-900' 
                            : 'bg-slate-50 border-slate-100 text-slate-500'
                      }`}>
                        <div className="space-y-0.5">
                          <div className="text-xs font-bold font-mono">orders</div>
                          <div className="text-[10px] font-sans opacity-80">
                            {tableChecks.orders === true ? 'Table Detected' : tableChecks.orders === false ? 'Table Missing' : 'Checking...'}
                          </div>
                        </div>
                        <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold ${
                          tableChecks.orders === true 
                            ? 'bg-emerald-100 text-emerald-700' 
                            : tableChecks.orders === false 
                              ? 'bg-rose-100 text-rose-700' 
                              : 'bg-slate-200 text-slate-500'
                        }`}>
                          {tableChecks.orders === true ? '✓' : tableChecks.orders === false ? '✗' : '...'}
                        </div>
                      </div>

                      <div className={`p-3.5 rounded-xl border flex items-center justify-between ${
                        tableChecks.order_items === true 
                          ? 'bg-emerald-50/50 border-emerald-100 text-emerald-900' 
                          : tableChecks.order_items === false 
                            ? 'bg-rose-50/50 border-rose-100 text-rose-900' 
                            : 'bg-slate-50 border-slate-100 text-slate-500'
                      }`}>
                        <div className="space-y-0.5">
                          <div className="text-xs font-bold font-mono">order_items</div>
                          <div className="text-[10px] font-sans opacity-80">
                            {tableChecks.order_items === true ? 'Table Detected' : tableChecks.order_items === false ? 'Table Missing' : 'Checking...'}
                          </div>
                        </div>
                        <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold ${
                          tableChecks.order_items === true 
                            ? 'bg-emerald-100 text-emerald-700' 
                            : tableChecks.order_items === false 
                              ? 'bg-rose-100 text-rose-700' 
                              : 'bg-slate-200 text-slate-500'
                        }`}>
                          {tableChecks.order_items === true ? '✓' : tableChecks.order_items === false ? '✗' : '...'}
                        </div>
                      </div>

                      <div className={`p-3.5 rounded-xl border flex items-center justify-between ${
                        tableChecks.payments === true 
                          ? 'bg-emerald-50/50 border-emerald-100 text-emerald-900' 
                          : tableChecks.payments === false 
                            ? 'bg-rose-50/50 border-rose-100 text-rose-900' 
                            : 'bg-slate-50 border-slate-100 text-slate-500'
                      }`}>
                        <div className="space-y-0.5">
                          <div className="text-xs font-bold font-mono">payments</div>
                          <div className="text-[10px] font-sans opacity-80">
                            {tableChecks.payments === true ? 'Table Detected' : tableChecks.payments === false ? 'Table Missing' : 'Checking...'}
                          </div>
                        </div>
                        <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold ${
                          tableChecks.payments === true 
                            ? 'bg-emerald-100 text-emerald-700' 
                            : tableChecks.payments === false 
                              ? 'bg-rose-100 text-rose-700' 
                              : 'bg-slate-200 text-slate-500'
                        }`}>
                          {tableChecks.payments === true ? '✓' : tableChecks.payments === false ? '✗' : '...'}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Live Database Activity & Error Monitor */}
                {isSupabaseConfigured && (

                  <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
                    <div className="flex items-center justify-between p-4 bg-slate-50 border-b border-slate-200">
                      <h4 className="text-slate-700 text-xs font-mono uppercase tracking-wider flex items-center gap-1.5 font-bold">
                        <AlertTriangle size={14} className="text-amber-500 animate-bounce" />
                        Live Supabase Database Monitor
                      </h4>
                      {errorLogs.length > 0 && (
                        <button
                          onClick={clearSupabaseErrorLogs}
                          className="flex items-center gap-1.5 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 font-semibold py-1 px-2.5 rounded-lg border border-rose-100 transition"
                        >
                          <Trash2 size={13} />
                          Clear Logs
                        </button>
                      )}
                    </div>
                    <div className="p-4 space-y-3 max-h-64 overflow-y-auto">
                      {errorLogs.length === 0 ? (
                        <div className="text-center py-6 text-slate-400 text-xs font-sans">
                          <Database size={24} className="mx-auto mb-2 text-slate-300 animate-pulse" />
                          No database errors caught yet. Creating orders or updating status will show logs here.
                        </div>
                      ) : (
                        <div className="space-y-3 font-mono text-xs">
                          {errorLogs.map((log) => (
                            <div key={log.id} className="p-3 bg-rose-50/50 border border-rose-100 rounded-xl space-y-1.5 text-rose-900">
                              <div className="flex items-center justify-between font-bold text-[11px] uppercase tracking-wider text-rose-800">
                                <span className="bg-rose-100/80 px-2 py-0.5 rounded-md border border-rose-200/50">{log.action}</span>
                                <span className="text-rose-400 font-sans">{new Date(log.timestamp).toLocaleTimeString()}</span>
                              </div>
                              <div className="font-semibold text-rose-950">{log.message}</div>
                              {(log.details || log.code || log.hint) && (
                                <div className="p-2.5 bg-rose-100/30 border border-rose-200/20 rounded-lg text-[10px] space-y-1 text-rose-700">
                                  {log.code && <div><span className="font-bold">Postgres Code:</span> {log.code}</div>}
                                  {log.details && <div><span className="font-bold">Details:</span> {log.details}</div>}
                                  {log.hint && <div><span className="font-bold">Hint:</span> {log.hint}</div>}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Database Schema Seeding */}
                <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">

                  <div className="flex items-center justify-between p-4 bg-slate-50 border-b border-slate-200">
                    <h4 className="text-slate-700 text-xs font-mono uppercase tracking-wider flex items-center gap-1.5 font-bold">
                      <Shield size={14} className="text-tomato" />
                      Supabase SQL Schema Setup
                    </h4>
                    <button
                      id="btn-copy-sql"
                      onClick={copyToClipboard}
                      className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 py-1.5 px-3 rounded-lg border border-slate-200 transition"
                    >
                      {copied ? (
                        <>
                          <Check size={14} className="text-emerald-600" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy size={14} />
                          Copy SQL
                        </>
                      )}
                    </button>
                  </div>
                  <div className="p-4 overflow-x-auto max-h-48 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
                    <pre className="text-xs text-tomato font-mono leading-relaxed">
                      {sqlCode}
                    </pre>
                  </div>
                </div>

                {/* Instructions steps */}
                <div className="space-y-3 pl-1">
                  <h4 className="text-slate-700 text-xs font-mono uppercase tracking-wider font-bold">
                    How to fully connect your Supabase project:
                  </h4>
                  <ol className="list-decimal list-inside text-slate-600 text-xs space-y-2 leading-relaxed">
                    <li>Create a free project at <a href="https://supabase.com" target="_blank" rel="noreferrer" className="text-tomato hover:underline font-semibold">supabase.com</a>.</li>
                    <li>Go to your project's <strong>SQL Editor</strong>, paste the schema above, and run it.</li>
                    <li>Under <strong>Project Settings &gt; API</strong>, retrieve your Project URL and Anon Key.</li>
                    <li>Open the <strong>Secrets panel</strong> in the AI Studio side-drawer, and define both <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code>.</li>
                    <li>Sign up a user via the application or Supabase Auth console, insert their role in the profiles table, and log in!</li>
                  </ol>
                </div>

              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
