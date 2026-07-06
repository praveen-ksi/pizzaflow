/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { supabase, isSupabaseConfigured } from './supabase';

export interface SupabaseErrorLog {
  id: string;
  timestamp: string;
  action: string;
  message: string;
  details: string;
  hint: string;
  code: string;
}

export let supabaseErrorLogs: SupabaseErrorLog[] = [];

export function clearSupabaseErrorLogs() {
  supabaseErrorLogs = [];
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('supabase-error-change'));
  }
}

export function logSupabaseError(action: string, error: any) {
  const newLog: SupabaseErrorLog = {
    id: `err-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date().toISOString(),
    action,
    message: error?.message || String(error),
    details: error?.details || error?.code || '',
    hint: error?.hint || '',
    code: error?.code || ''
  };
  supabaseErrorLogs = [newLog, ...supabaseErrorLogs].slice(0, 50);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('supabase-error-change'));
  }
}


export interface OrderItemInput {
  pizza_id: string;
  pizza_name: string;
  base_name: string;
  toppings: string[];
  quantity: number;
  single_price: number;
}

export interface OrderInput {
  customer_name: string;
  customer_phone: string;
  payment_method: 'UPI' | 'Card' | 'Cash';
  items: OrderItemInput[];
  total: number;
}

export interface UnifiedOrder {
  id: string;
  token_number: string;
  customer_name: string;
  customer_phone: string;
  payment_method: 'UPI' | 'Card' | 'Cash';
  items: {
    pizza_name: string;
    base_name: string;
    toppings: string[];
    quantity: number;
    single_price: number;
  }[];
  total: number;
  status: 'Preparing' | 'Baking' | 'Dispatched' | 'Delivered' | 'Cancelled';
  created_at: string;
  payment_txn: string;
  payment_status: string;
}

// Map Database Status Enum to UI Status Strings
export function mapDbStatusToUi(dbStatus: string): 'Preparing' | 'Baking' | 'Dispatched' | 'Delivered' | 'Cancelled' {
  switch (dbStatus) {
    case 'CONFIRMED': return 'Preparing';
    case 'PREPARING': return 'Baking';
    case 'READY_FOR_PICKUP': return 'Dispatched';
    case 'COMPLETED': return 'Delivered';
    case 'CANCELLED': return 'Cancelled';
    default: return 'Preparing';
  }
}

// Map UI Status Strings back to Database Status Enum
export function mapUiStatusToDb(uiStatus: string): 'CONFIRMED' | 'PREPARING' | 'READY_FOR_PICKUP' | 'COMPLETED' | 'CANCELLED' {
  switch (uiStatus) {
    case 'Preparing': return 'CONFIRMED';
    case 'Baking': return 'PREPARING';
    case 'Dispatched': return 'READY_FOR_PICKUP';
    case 'Delivered': return 'COMPLETED';
    case 'Cancelled': return 'CANCELLED';
    default: return 'CONFIRMED';
  }
}

// Generate a daily token simulation for Demo/Sandbox mode
function generateSimulatedDailyToken(): string {
  try {
    const stored = localStorage.getItem('pizza_orders');
    const todayStr = new Date().toDateString();
    let highest = 100;

    if (stored) {
      const orders: UnifiedOrder[] = JSON.parse(stored);
      orders.forEach(ord => {
        if (new Date(ord.created_at).toDateString() === todayStr) {
          const tNum = parseInt(ord.token_number, 10);
          if (!isNaN(tNum) && tNum > highest) {
            highest = tNum;
          }
        }
      });
    }
    return (highest + 1).toString();
  } catch (e) {
    return (Math.floor(Math.random() * 899) + 100).toString();
  }
}

export const orderService = {
  /**
   * Place a new order
   */
  async placeOrder(input: OrderInput, txnId: string, paymentStatusText?: string): Promise<UnifiedOrder> {
    const isOnline = input.payment_method !== 'Cash';
    const payStatus = isOnline ? 'PAID' : 'PENDING';
    const pStatusText = paymentStatusText || (isOnline ? 'Paid' : 'Unpaid (Cash on Delivery)');
    const defaultTxn = txnId || `pay_pizzapay_${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    if (isSupabaseConfigured && supabase) {
      try {
        // Generate a fallback token number in case the trigger does not exist on the table
        const clientToken = generateSimulatedDailyToken();

        // 1. Insert row into public.orders table
        const { data: orderData, error: orderError } = await supabase
          .from('orders')
          .insert({
            customer_name: input.customer_name,
            customer_phone: input.customer_phone,
            token_number: clientToken, // Pre-populate so insert won't fail if DB trigger is missing or fails
            total_amount: Math.round(input.total * 100) / 100,
            subtotal_amount: Math.round(input.total * 100) / 100, // Simple fallback mapping
            order_status: 'CONFIRMED',
            fulfillment_type: 'DINE_IN'
          })
          .select('id, token_number, created_at')
          .single();

        if (orderError) throw orderError;
        const orderId = orderData.id;
        const dbToken = orderData.token_number;

        // 2. Insert rows into public.order_items table
        const orderItemsPayload = input.items.map(item => {
          const unitPriceRounded = Math.round(item.single_price * 100) / 100;
          const totalPriceRounded = Math.round(unitPriceRounded * item.quantity * 100) / 100;
          return {
            order_id: orderId,
            pizza_id: item.pizza_id,
            pizza_name: `${item.pizza_name} (${item.base_name})`, // Include base in snapshots
            quantity: item.quantity,
            unit_price: unitPriceRounded,
            total_price: totalPriceRounded
          };
        });

        const { error: itemsError } = await supabase
          .from('order_items')
          .insert(orderItemsPayload);

        if (itemsError) throw itemsError;

        // 3. Insert row into public.payments table
        const { error: payError } = await supabase
          .from('payments')
          .insert({
            order_id: orderId,
            provider: 'PIZZAPAY',
            payment_method: input.payment_method.toUpperCase(),
            payment_status: payStatus,
            transaction_reference: defaultTxn,
            amount: Math.round(input.total * 100) / 100
          });

        if (payError) throw payError;

        // Formulate returning unified order object
        const newOrder: UnifiedOrder = {
          id: orderId,
          token_number: dbToken || '101',
          customer_name: input.customer_name,
          customer_phone: input.customer_phone,
          payment_method: input.payment_method,
          items: input.items.map(item => ({
            pizza_name: item.pizza_name,
            base_name: item.base_name,
            toppings: item.toppings,
            quantity: item.quantity,
            single_price: item.single_price
          })),
          total: input.total,
          status: 'Preparing',
          created_at: orderData.created_at || new Date().toISOString(),
          payment_txn: defaultTxn,
          payment_status: pStatusText
        };

        // Also update local storage cache so admin can pick up without hard refreshing immediately
        try {
          const cachedOrders = JSON.parse(localStorage.getItem('pizza_orders') || '[]');
          localStorage.setItem('pizza_orders', JSON.stringify([newOrder, ...cachedOrders]));
        } catch (_) {}

        return newOrder;
      } catch (err: any) {
        console.error('Supabase write failed, logging database error and throwing:', err);
        logSupabaseError('Place Order', err);
        throw err;
      }
    }

    // Local Storage Simulation fallback (for sandbox mode)
    const simulatedToken = generateSimulatedDailyToken();
    const newOrder: UnifiedOrder = {
      id: `ORD-${Date.now()}`,
      token_number: simulatedToken,
      customer_name: input.customer_name.trim(),
      customer_phone: input.customer_phone.trim(),
      payment_method: input.payment_method,
      items: input.items,
      total: input.total,
      status: 'Preparing',
      created_at: new Date().toISOString(),
      payment_txn: defaultTxn,
      payment_status: pStatusText
    };

    try {
      const cachedOrders = JSON.parse(localStorage.getItem('pizza_orders') || '[]');
      localStorage.setItem('pizza_orders', JSON.stringify([newOrder, ...cachedOrders]));
    } catch (e) {
      console.error('LocalStorage write failed', e);
    }

    return newOrder;
  },

  /**
   * Fetch all orders
   */
  async fetchOrders(): Promise<UnifiedOrder[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        // Query orders with item snapshot mappings and payments details
        const { data: dbOrders, error } = await supabase
          .from('orders')
          .select(`
            id,
            token_number,
            customer_name,
            customer_phone,
            total_amount,
            order_status,
            created_at,
            order_items (
              pizza_name,
              quantity,
              unit_price
            ),
            payments (
              payment_method,
              payment_status,
              transaction_reference
            )
          `)
          .order('created_at', { ascending: false });

        if (error) throw error;

        if (dbOrders) {
          const mapped: UnifiedOrder[] = dbOrders.map(ord => {
            const pay = Array.isArray(ord.payments) ? ord.payments[0] : ord.payments;
            const items = Array.isArray(ord.order_items) ? ord.order_items : [];
            
            return {
              id: ord.id,
              token_number: ord.token_number,
              customer_name: ord.customer_name,
              customer_phone: ord.customer_phone,
              payment_method: (pay?.payment_method || 'UPI') as any,
              items: items.map((i: any) => {
                // Try parsing base name from name snapshot if formatted as "Name (Base)"
                const nameParts = i.pizza_name.match(/^(.*?)\s*\((.*?)\)$/);
                return {
                  pizza_name: nameParts ? nameParts[1] : i.pizza_name,
                  base_name: nameParts ? nameParts[2] : 'Thin Crust',
                  toppings: [], // Toppings are snapshotted inside the name or kept simple
                  quantity: i.quantity,
                  single_price: Number(i.unit_price)
                };
              }),
              total: Number(ord.total_amount),
              status: mapDbStatusToUi(ord.order_status),
              created_at: ord.created_at,
              payment_txn: pay?.transaction_reference || 'CASH-OFFLINE',
              payment_status: pay?.payment_status === 'PAID' ? 'Paid' : 'Unpaid'
            };
          });

          // Refresh the local cache to match Supabase state
          try {
            localStorage.setItem('pizza_orders', JSON.stringify(mapped));
          } catch (_) {}

          return mapped;
        }
      } catch (err: any) {
        console.error('Supabase query failed, returning local storage cache:', err);
        logSupabaseError('Fetch All Orders', err);
      }
    }

    // Local Storage Simulation
    try {
      const stored = localStorage.getItem('pizza_orders');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (_) {}
    return [];
  },

  /**
   * Update order status
   */
  async updateOrderStatus(orderId: string, nextStatus: 'Preparing' | 'Baking' | 'Dispatched' | 'Delivered' | 'Cancelled'): Promise<boolean> {
    const dbStatus = mapUiStatusToDb(nextStatus);

    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase
          .from('orders')
          .update({ order_status: dbStatus })
          .eq('id', orderId);

        if (error) throw error;
      } catch (err: any) {
        console.error('Supabase status update failed:', err);
        logSupabaseError('Update Order Status', err);
      }
    }

    // Always keep Local Storage fallback synchronized
    try {
      const stored = localStorage.getItem('pizza_orders');
      if (stored) {
        const orders: UnifiedOrder[] = JSON.parse(stored);
        const updated = orders.map(ord => 
          ord.id === orderId ? { ...ord, status: nextStatus } : ord
        );
        localStorage.setItem('pizza_orders', JSON.stringify(updated));
        return true;
      }
    } catch (e) {
      console.error(e);
    }
    return false;
  },

  /**
   * Delete or cancel an order
   */
  async deleteOrder(orderId: string): Promise<boolean> {
    if (isSupabaseConfigured && supabase) {
      try {
        // Use database CASCADE rules to automatically clear order_items and payments
        const { error } = await supabase
          .from('orders')
          .delete()
          .eq('id', orderId);

        if (error) throw error;
      } catch (err: any) {
        console.error('Supabase delete failed:', err);
        logSupabaseError('Delete Order', err);
      }
    }

    try {
      const stored = localStorage.getItem('pizza_orders');
      if (stored) {
        const orders: UnifiedOrder[] = JSON.parse(stored);
        const filtered = orders.filter(ord => ord.id !== orderId);
        localStorage.setItem('pizza_orders', JSON.stringify(filtered));
        return true;
      }
    } catch (e) {
      console.error(e);
    }
    return false;
  },

  /**
   * Fetch orders for a specific customer phone number
   */
  async fetchCustomerOrders(phone: string): Promise<UnifiedOrder[]> {
    const cleanPhone = phone.trim();
    if (!cleanPhone) return [];

    if (isSupabaseConfigured && supabase) {
      try {
        const { data: dbOrders, error } = await supabase
          .from('orders')
          .select(`
            id,
            token_number,
            customer_name,
            customer_phone,
            total_amount,
            order_status,
            created_at,
            order_items (
              pizza_name,
              quantity,
              unit_price
            ),
            payments (
              payment_method,
              payment_status,
              transaction_reference
            )
          `)
          .eq('customer_phone', cleanPhone)
          .order('created_at', { ascending: false });

        if (error) throw error;

        if (dbOrders) {
          return dbOrders.map(ord => {
            const pay = Array.isArray(ord.payments) ? ord.payments[0] : ord.payments;
            const items = Array.isArray(ord.order_items) ? ord.order_items : [];
            
            return {
              id: ord.id,
              token_number: ord.token_number,
              customer_name: ord.customer_name,
              customer_phone: ord.customer_phone,
              payment_method: (pay?.payment_method || 'UPI') as any,
              items: items.map((i: any) => {
                const nameParts = i.pizza_name.match(/^(.*?)\s*\((.*?)\)$/);
                return {
                  pizza_name: nameParts ? nameParts[1] : i.pizza_name,
                  base_name: nameParts ? nameParts[2] : 'Thin Crust',
                  toppings: [],
                  quantity: i.quantity,
                  single_price: Number(i.unit_price)
                };
              }),
              total: Number(ord.total_amount),
              status: mapDbStatusToUi(ord.order_status),
              created_at: ord.created_at,
              payment_txn: pay?.transaction_reference || 'CASH-OFFLINE',
              payment_status: pay?.payment_status === 'PAID' ? 'Paid' : 'Unpaid'
            };
          });
        }
      } catch (err: any) {
        console.error('Supabase customer fetch failed, relying on local storage cache:', err);
        logSupabaseError('Fetch Customer Orders', err);
      }
    }

    // Local Storage fallback
    try {
      const stored = localStorage.getItem('pizza_orders');
      if (stored) {
        const orders: UnifiedOrder[] = JSON.parse(stored);
        return orders.filter(ord => ord.customer_phone.replace(/\s+/g, '') === cleanPhone.replace(/\s+/g, ''));
      }
    } catch (_) {}
    return [];
  }
};
