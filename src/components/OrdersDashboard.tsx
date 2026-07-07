/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { orderService } from '../lib/orderService';
import {
  ShoppingBag,
  TrendingUp,
  DollarSign,
  Clock,
  CheckCircle2,
  Trash2,
  Calendar,
  User,
  Phone,
  Sparkles,
  Database,
  BarChart3,
  PieChart as PieIcon,
  Activity,
  Flame,
  Truck,
  Pizza as PizzaIcon,
  Layers,
  Sliders,
  ChevronDown,
  RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie,
  Legend
} from 'recharts';

interface OrderItem {
  pizza_name: string;
  base_name: string;
  toppings: string[];
  quantity: number;
  single_price: number;
}

interface Order {
  id: string;
  customer_name: string;
  customer_phone: string;
  payment_method: 'UPI' | 'Cash' | 'Card';
  items: OrderItem[];
  total: number;
  status: 'Preparing' | 'Baking' | 'Dispatched' | 'Delivered';
  created_at: string;
}

interface OrdersDashboardProps {
  onSwitchTab: (tabId: 'overview' | 'pizzas' | 'bases' | 'toppings' | 'data-import') => void;
  pizzasCount: number;
  basesCount: number;
  toppingsCount: number;
}

// Beautiful colors for charts
const COLORS = ['#FF4D4D', '#FF8533', '#FFB31A', '#4D94FF', '#33CC59', '#AA66CC', '#FF66B2'];

const SEED_ORDERS: Order[] = [
  {
    id: 'ORD-1001',
    customer_name: 'Amit Sharma',
    customer_phone: '+91 98765 43210',
    payment_method: 'UPI',
    items: [
      { pizza_name: 'Margherita', base_name: 'Thin Crust', toppings: ['Extra Cheese', 'Black Olives'], quantity: 1, single_price: 417 }
    ],
    total: 417,
    status: 'Delivered',
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000 - 3 * 3600 * 1000).toISOString() // 5 days ago
  },
  {
    id: 'ORD-1002',
    customer_name: 'Pooja Patel',
    customer_phone: '+91 98234 56789',
    payment_method: 'Card',
    items: [
      { pizza_name: 'Chicago Deep Dish', base_name: 'Thick Crust', toppings: ['Button Mushrooms', 'Jalapenos'], quantity: 1, single_price: 617 }
    ],
    total: 617,
    status: 'Delivered',
    created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000 - 1.5 * 3600 * 1000).toISOString() // 4 days ago
  },
  {
    id: 'ORD-1003',
    customer_name: 'Rohan Verma',
    customer_phone: '+91 99112 23344',
    payment_method: 'UPI',
    items: [
      { pizza_name: 'Farm House', base_name: 'Cheese Burst', toppings: ['Sweet Corn', 'Green Peppers'], quantity: 1, single_price: 627 },
      { pizza_name: 'Margherita', base_name: 'Thin Crust', toppings: [], quantity: 1, single_price: 448 }
    ],
    total: 1075,
    status: 'Delivered',
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 - 6 * 3600 * 1000).toISOString() // 3 days ago
  },
  {
    id: 'ORD-1004',
    customer_name: 'Anjali Gupta',
    customer_phone: '+91 98991 12233',
    payment_method: 'Cash',
    items: [
      { pizza_name: 'California Veggie', base_name: 'Whole Wheat', toppings: ['Sun-Dried Tomatoes'], quantity: 1, single_price: 557 }
    ],
    total: 557,
    status: 'Delivered',
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 - 4 * 3600 * 1000).toISOString() // 2 days ago
  },
  {
    id: 'ORD-1005',
    customer_name: 'Suresh Kumar',
    customer_phone: '+91 97112 34567',
    payment_method: 'UPI',
    items: [
      { pizza_name: 'Pepperoni Classic', base_name: 'Cheese Burst', toppings: ['Extra Cheese', 'Jalapenos'], quantity: 1, single_price: 707 }
    ],
    total: 707,
    status: 'Delivered',
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 - 8 * 3600 * 1000).toISOString() // 1 day ago
  },
  {
    id: 'ORD-1006',
    customer_name: 'Vikram Singh',
    customer_phone: '+91 96112 87654',
    payment_method: 'UPI',
    items: [
      { pizza_name: 'Paneer Tikka', base_name: 'Thin Crust', toppings: ['Peri-Peri Drizzle', 'Sweet Corn'], quantity: 1, single_price: 647 },
      { pizza_name: 'Margherita', base_name: 'Thin Crust', toppings: ['Extra Cheese'], quantity: 1, single_price: 517 }
    ],
    total: 1164,
    status: 'Preparing',
    created_at: new Date(Date.now() - 15 * 60 * 1000).toISOString() // 15 mins ago
  },
  {
    id: 'ORD-1007',
    customer_name: 'Neha Mehta',
    customer_phone: '+91 95432 10987',
    payment_method: 'Card',
    items: [
      { pizza_name: 'Greek Mediterranean', base_name: 'Multigrain', toppings: ['Black Olives', 'Roasted Garlic'], quantity: 1, single_price: 597 }
    ],
    total: 597,
    status: 'Baking',
    created_at: new Date(Date.now() - 40 * 60 * 1000).toISOString() // 40 mins ago
  },
  {
    id: 'ORD-1008',
    customer_name: 'Karan Johar',
    customer_phone: '+91 94321 09876',
    payment_method: 'UPI',
    items: [
      { pizza_name: 'BBQ Chicken', base_name: 'Thick Crust', toppings: ['Caramelised Onions'], quantity: 1, single_price: 607 }
    ],
    total: 607,
    status: 'Dispatched',
    created_at: new Date(Date.now() - 90 * 60 * 1000).toISOString() // 1.5 hours ago
  }
];

export const OrdersDashboard: React.FC<OrdersDashboardProps> = ({
  onSwitchTab,
  pizzasCount,
  basesCount,
  toppingsCount
}) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeAnalysisTab, setActiveAnalysisTab] = useState<'trends' | 'popular' | 'customizations'>('trends');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [timeRange, setTimeRange] = useState<'all' | '2h' | 'today' | '24h' | '7d'>('all');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

  // Load and sync orders from database or simulated storage
  const loadOrders = async () => {
    try {
      const fetched = await orderService.fetchOrders();
      if (fetched && fetched.length > 0) {
        setOrders(fetched);
      } else {
        const stored = localStorage.getItem('pizza_orders');
        if (stored) {
          setOrders(JSON.parse(stored));
        } else {
          // First time - Seed database with stunning realistic telemetry orders
          localStorage.setItem('pizza_orders', JSON.stringify(SEED_ORDERS));
          setOrders(SEED_ORDERS);
        }
      }
    } catch (e) {
      console.error('Failed to load pizza orders', e);
      setOrders(SEED_ORDERS);
    }
  };

  useEffect(() => {
    loadOrders();
    // Set interval to poll database or local storage changes
    const timer = setInterval(() => {
      loadOrders();
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  // Update order status
  const handleUpdateStatus = async (orderId: string, nextStatus: 'Preparing' | 'Baking' | 'Dispatched' | 'Delivered') => {
    const updated = orders.map(ord => 
      ord.id === orderId ? { ...ord, status: nextStatus } : ord
    );
    setOrders(updated);
    try {
      await orderService.updateOrderStatus(orderId, nextStatus);
    } catch (e) {
      console.error('Failed to update status on database', e);
    }
  };

  // Delete an order
  const handleDeleteOrder = async (orderId: string) => {
    if (window.confirm(`Are you sure you want to cancel and delete Order ${orderId}?`)) {
      const filtered = orders.filter(ord => ord.id !== orderId);
      setOrders(filtered);
      try {
        await orderService.deleteOrder(orderId);
      } catch (e) {
        console.error('Failed to delete order from database', e);
      }
    }
  };

  // Reset to seed data
  const handleResetToSeed = () => {
    if (window.confirm('Would you like to reset orders to seed telemetry data for visualization purposes? This will append the default orders.')) {
      localStorage.setItem('pizza_orders', JSON.stringify(SEED_ORDERS));
      setOrders(SEED_ORDERS);
    }
  };

  // Clear all orders
  const handleClearAllOrders = async () => {
    if (window.confirm('WARNING: This will delete ALL current orders from the database. Proceed?')) {
      for (const ord of orders) {
        try {
          await orderService.deleteOrder(ord.id);
        } catch (_) {}
      }
      localStorage.setItem('pizza_orders', JSON.stringify([]));
      setOrders([]);
    }
  };

  // Analytics derivations
  const totalRevenue = orders.reduce((sum, ord) => sum + ord.total, 0);
  const averageOrderVal = orders.length > 0 ? Math.round(totalRevenue / orders.length) : 0;
  const activeOrdersCount = orders.filter(ord => ord.status !== 'Delivered').length;
  const completedOrdersCount = orders.filter(ord => ord.status === 'Delivered').length;

  // 1. Revenue trend calculation (Grouped by Date)
  const getRevenueTrendData = () => {
    const dailyMap: Record<string, number> = {};
    // Last 7 days template
    for (let i = 6; i >= 0; i--) {
      const dateStr = new Date(Date.now() - i * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      dailyMap[dateStr] = 0;
    }

    orders.forEach(ord => {
      const dateStr = new Date(ord.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (dailyMap[dateStr] !== undefined) {
        dailyMap[dateStr] += ord.total;
      } else {
        // Fallback or stretch
        dailyMap[dateStr] = ord.total;
      }
    });

    return Object.entries(dailyMap).map(([date, sales]) => ({
      date,
      'Revenue (₹)': sales
    }));
  };

  // 2. Popular Pizza calculation
  const getPopularPizzasData = () => {
    const counts: Record<string, number> = {};
    orders.forEach(ord => {
      ord.items.forEach(item => {
        counts[item.pizza_name] = (counts[item.pizza_name] || 0) + item.quantity;
      });
    });

    return Object.entries(counts)
      .map(([name, quantity]) => ({ name, quantity }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);
  };

  // 3. Customizations trends (Bases & Toppings frequency)
  const getCustomizationsData = () => {
    const basesMap: Record<string, number> = {};
    const toppingsMap: Record<string, number> = {};

    orders.forEach(ord => {
      ord.items.forEach(item => {
        basesMap[item.base_name] = (basesMap[item.base_name] || 0) + item.quantity;
        item.toppings.forEach(top => {
          toppingsMap[top] = (toppingsMap[top] || 0) + item.quantity;
        });
      });
    });

    const basesData = Object.entries(basesMap).map(([name, value]) => ({ name, value }));
    const toppingsData = Object.entries(toppingsMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);

    return { basesData, toppingsData };
  };

  const { basesData, toppingsData } = getCustomizationsData();

  // Filtered orders list
  const filteredOrders = orders.filter(ord => {
    const matchesStatus = filterStatus === 'all' || ord.status.toLowerCase() === filterStatus.toLowerCase();
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch = !query || 
      ord.customer_name.toLowerCase().includes(query) || 
      ord.id.toLowerCase().includes(query) ||
      ord.customer_phone.toLowerCase().includes(query) ||
      ord.items.some(i => i.pizza_name.toLowerCase().includes(query));

    // Time Range Filter
    const createdTime = new Date(ord.created_at).getTime();
    const now = Date.now();
    let matchesTime = true;
    
    if (timeRange === '2h') {
      matchesTime = (now - createdTime) <= 2 * 60 * 60 * 1000;
    } else if (timeRange === 'today') {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      matchesTime = createdTime >= todayStart.getTime();
    } else if (timeRange === '24h') {
      matchesTime = (now - createdTime) <= 24 * 60 * 60 * 1000;
    } else if (timeRange === '7d') {
      matchesTime = (now - createdTime) <= 7 * 24 * 60 * 60 * 1000;
    }

    return matchesStatus && matchesSearch && matchesTime;
  });

  // Sort orders by created_at based on sortOrder ('newest' or 'oldest')
  const sortedAndFilteredOrders = [...filteredOrders].sort((a, b) => {
    const timeA = new Date(a.created_at).getTime();
    const timeB = new Date(b.created_at).getTime();
    return sortOrder === 'newest' ? timeB - timeA : timeA - timeB;
  });

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'Preparing': return 'bg-amber-50 text-amber-700 border-amber-200/60';
      case 'Baking': return 'bg-orange-50 text-orange-700 border-orange-200/60 animate-pulse';
      case 'Dispatched': return 'bg-blue-50 text-blue-700 border-blue-200/60';
      case 'Delivered': return 'bg-emerald-50 text-emerald-700 border-emerald-200/60';
      default: return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Preparing': return <Flame size={12} className="text-amber-500" />;
      case 'Baking': return <Activity size={12} className="text-orange-500 animate-spin" />;
      case 'Dispatched': return <Truck size={12} className="text-blue-500" />;
      case 'Delivered': return <CheckCircle2 size={12} className="text-emerald-500" />;
      default: return null;
    }
  };

  return (
    <div className="space-y-8 font-sans">
      
      {/* 1. KPIs Panel Card Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          { label: 'Total Sales Revenue', value: `₹${totalRevenue.toLocaleString()}`, icon: DollarSign, color: 'text-tomato bg-tomato/5 border-tomato/10' },
          { label: 'Oven Active Queue', value: `${activeOrdersCount} Pending`, icon: Flame, color: 'text-amber-600 bg-amber-50 border-amber-100' },
          { label: 'Baking Average Value', value: `₹${averageOrderVal}`, icon: TrendingUp, color: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
          { label: 'Total Orders Handled', value: `${orders.length} Dispatched`, icon: ShoppingBag, color: 'text-blue-600 bg-blue-50 border-blue-100' }
        ].map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              key={idx} 
              className="bg-white border border-slate-200/80 rounded-2xl p-6 flex items-center gap-4 shadow-xs hover:shadow-sm transition"
            >
              <div className={`p-3 rounded-xl border ${kpi.color}`}>
                <Icon size={22} />
              </div>
              <div>
                <div className="text-xs text-slate-400 font-mono uppercase tracking-wider font-bold">{kpi.label}</div>
                <div className="text-lg font-bold text-slate-900 mt-1">{kpi.value}</div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* 2. Visual Charts & Analytics Section */}
      <div className="bg-white border border-slate-200 rounded-[28px] p-6 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-lg font-extrabold text-slate-900 font-display flex items-center gap-2">
              <BarChart3 size={18} className="text-tomato" />
              Storefront Pizza Analytics
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Live visualization of customer orders, ingredient distribution, and daily performance metrics.
            </p>
          </div>

          {/* Sub Tab Controls */}
          <div className="bg-slate-100 p-1 rounded-xl flex self-start sm:self-center">
            {[
              { id: 'trends', label: 'Revenue Trends', icon: TrendingUp },
              { id: 'popular', label: 'Popular Recipes', icon: PizzaIcon },
              { id: 'customizations', label: 'Ingredient Metrics', icon: Sliders }
            ].map((tab) => {
              const TabIcon = tab.icon;
              const isSelected = activeAnalysisTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveAnalysisTab(tab.id as any)}
                  className={`flex items-center gap-1.5 py-1.5 px-3.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                    isSelected
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <TabIcon size={12} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Charts Presentation Arena */}
        <div className="min-h-[280px] flex items-center justify-center">
          {orders.length === 0 ? (
            <div className="text-center py-10 space-y-3">
              <Activity size={32} className="text-slate-300 mx-auto animate-pulse" />
              <p className="text-xs text-slate-400">No telemetry data detected to build visualizations.</p>
              <button
                onClick={handleResetToSeed}
                className="py-1.5 px-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg border border-slate-200 transition"
              >
                Seed Mock Orders
              </button>
            </div>
          ) : (
            <div className="w-full h-[320px]">
              
              {/* ANALYSIS TAB 1: AREA REVENUE TREND */}
              {activeAnalysisTab === 'trends' && (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={getRevenueTrendData()} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#FF4D4D" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#FF4D4D" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="date" tickLine={false} axisLine={false} style={{ fontSize: '10px', fontFamily: 'monospace', fill: '#94A3B8' }} />
                    <YAxis tickLine={false} axisLine={false} style={{ fontSize: '10px', fontFamily: 'monospace', fill: '#94A3B8' }} tickFormatter={(val) => `₹${val}`} />
                    <Tooltip 
                      contentStyle={{ background: '#0F172A', border: 'none', borderRadius: '12px', padding: '10px 14px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                      labelStyle={{ color: '#94A3B8', fontSize: '10px', fontFamily: 'monospace', fontWeight: 'bold' }}
                      itemStyle={{ color: '#FFF', fontSize: '12px', fontWeight: 'bold' }}
                      formatter={(val) => [`₹${val}`, 'Daily Revenue']}
                    />
                    <Area type="monotone" dataKey="Revenue (₹)" stroke="#FF4D4D" strokeWidth={2.5} fillOpacity={1} fill="url(#colorSales)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}

              {/* ANALYSIS TAB 2: BAR POPULAR RECIPES */}
              {activeAnalysisTab === 'popular' && (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={getPopularPizzasData()} margin={{ top: 10, right: 10, left: -25, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="name" tickLine={false} axisLine={false} style={{ fontSize: '10px', fill: '#94A3B8', fontWeight: 'bold' }} />
                    <YAxis tickLine={false} axisLine={false} allowDecimals={false} style={{ fontSize: '10px', fontFamily: 'monospace', fill: '#94A3B8' }} />
                    <Tooltip
                      contentStyle={{ background: '#0F172A', border: 'none', borderRadius: '12px', padding: '10px' }}
                      itemStyle={{ color: '#FFF', fontSize: '12px', fontWeight: 'bold' }}
                      labelStyle={{ color: '#94A3B8', fontSize: '10px', fontWeight: 'bold' }}
                      formatter={(val) => [`${val} Sold`, 'Volume']}
                    />
                    <Bar dataKey="quantity" radius={[8, 8, 0, 0]}>
                      {getPopularPizzasData().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}

              {/* ANALYSIS TAB 3: CUSTOMIZATION DISTRIBUTIONS */}
              {activeAnalysisTab === 'customizations' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
                  
                  {/* Left sub-chart: Bases distribution */}
                  <div className="h-full flex flex-col justify-between">
                    <div className="text-[10px] font-extrabold text-slate-400 font-mono text-center uppercase tracking-wider">
                      Crust Bases Selection Volume
                    </div>
                    {basesData.length === 0 ? (
                      <div className="text-center py-10 text-xs text-slate-400">No bases customized yet</div>
                    ) : (
                      <div className="h-56">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={basesData}
                              cx="50%"
                              cy="50%"
                              innerRadius={50}
                              outerRadius={75}
                              paddingAngle={3}
                              dataKey="value"
                            >
                              {basesData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(val) => [`${val} orders`, 'Preferred']} />
                            <Legend verticalAlign="bottom" height={36} iconSize={8} iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold' }} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </div>

                  {/* Right sub-chart: Toppings preference */}
                  <div className="h-full flex flex-col justify-between">
                    <div className="text-[10px] font-extrabold text-slate-400 font-mono text-center uppercase tracking-wider">
                      Top Requested Toppings
                    </div>
                    {toppingsData.length === 0 ? (
                      <div className="text-center py-10 text-xs text-slate-400">No toppings selected yet</div>
                    ) : (
                      <div className="h-56">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={toppingsData} layout="vertical" margin={{ top: 10, right: 10, left: 15, bottom: 5 }}>
                            <XAxis type="number" tickLine={false} axisLine={false} style={{ fontSize: '9px', fontFamily: 'monospace', fill: '#94A3B8' }} />
                            <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} style={{ fontSize: '9px', fill: '#475569', fontWeight: 'bold' }} />
                            <Tooltip formatter={(val) => [`${val} selections`, 'Popularity']} />
                            <Bar dataKey="value" fill="#FF8533" radius={[0, 6, 6, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </div>

                </div>
              )}

            </div>
          )}
        </div>

        {/* AI-Style Analytics Insights Bar */}
        {orders.length > 0 && (
          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-600 font-sans">
            <div className="flex items-center gap-2">
              <Sparkles size={15} className="text-tomato shrink-0" />
              <span>
                <strong>Oven Intelligence:</strong> The most popular base crust choice is{' '}
                <span className="text-tomato font-bold">
                  {basesData.length > 0 
                    ? basesData.sort((a,b)=>b.value-a.value)[0]?.name 
                    : 'Thin Crust'}
                </span>{' '}
                and the top flavor enhancement is{' '}
                <span className="text-tomato font-bold">
                  {toppingsData.length > 0 
                    ? toppingsData[0]?.name 
                    : 'Extra Cheese'}
                </span>.
              </span>
            </div>
            <div className="text-[10px] font-mono text-slate-400 bg-white border border-slate-200/60 px-2.5 py-1 rounded-lg self-start sm:self-auto">
              AOV: ₹{averageOrderVal} • Complete: {completedOrdersCount}/{orders.length}
            </div>
          </div>
        )}
      </div>

      {/* 3. Orders Board & Queue */}
      <div className="bg-white border border-slate-200 rounded-[28px] p-6 shadow-sm space-y-6">
        
        {/* Board Header & Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-lg font-extrabold text-slate-900 font-display flex items-center gap-2">
              <ShoppingBag size={18} className="text-tomato" />
              Orders Directory & Archives
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Read-only system log. Admin cannot alter order states or delete records.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Filter Buttons */}
            <div className="bg-slate-100 p-1 rounded-xl flex">
              {[
                { id: 'all', label: 'All' },
                { id: 'preparing', label: 'Preparing' },
                { id: 'baking', label: 'Baking' },
                { id: 'dispatched', label: 'Dispatched' },
                { id: 'delivered', label: 'Delivered' }
              ].map((btn) => (
                <button
                  key={btn.id}
                  onClick={() => setFilterStatus(btn.id)}
                  className={`py-1.5 px-3 rounded-lg text-2xs font-bold transition ${
                    filterStatus === btn.id
                      ? 'bg-white text-slate-800 shadow-xs'
                      : 'text-slate-400 hover:text-slate-700'
                  }`}
                >
                  {btn.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Search, Time Filter & Sorting Panel */}
        <div className="space-y-4">
          {/* Search bar input */}
          <div className="flex gap-2">
            <input
              id="input-search-orders"
              type="text"
              placeholder="Search orders by Client Name, Pizza Name, Order ID, or Phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-tomato focus:ring-1 focus:ring-tomato/15 transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="px-3 text-xs font-semibold text-slate-400 hover:text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50"
              >
                Clear
              </button>
            )}
          </div>

          {/* Time Filter & Sort Row */}
          <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between bg-slate-50 p-4 rounded-2xl border border-slate-100">
            {/* Time Range Selector */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase flex items-center gap-1">
                <Calendar size={11} className="text-slate-400" />
                Time Filter:
              </span>
              <div className="bg-white border border-slate-200/80 p-0.5 rounded-lg flex shadow-2xs">
                {[
                  { id: 'all', label: 'All Time' },
                  { id: '2h', label: 'Last 2 hrs' },
                  { id: 'today', label: 'Today' },
                  { id: '24h', label: 'Last 24 hrs' },
                  { id: '7d', label: 'Last 7 days' }
                ].map((range) => (
                  <button
                    key={range.id}
                    type="button"
                    onClick={() => setTimeRange(range.id as any)}
                    className={`py-1 px-2.5 rounded-md text-[10px] font-bold transition-all ${
                      timeRange === range.id
                        ? 'bg-slate-900 text-white'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    {range.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Sort Order Selector */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase flex items-center gap-1">
                <Sliders size={11} className="text-slate-400" />
                Sort:
              </span>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as any)}
                className="py-1 px-2 bg-white border border-slate-200 rounded-lg text-[10px] font-bold text-slate-700 focus:outline-none focus:border-tomato focus:ring-1 focus:ring-tomato/20"
              >
                <option value="newest">Created At: Newest First</option>
                <option value="oldest">Created At: Oldest First</option>
              </select>
            </div>
          </div>
        </div>

        {/* Read-Only Table View */}
        <div className="overflow-x-auto border border-slate-200 rounded-2xl bg-white shadow-2xs">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-4 font-mono font-black text-slate-400">Order ID</th>
                <th className="py-3.5 px-4">Created At</th>
                <th className="py-3.5 px-4">Customer Details</th>
                <th className="py-3.5 px-4">Items Ordered</th>
                <th className="py-3.5 px-4">Payment</th>
                <th className="py-3.5 px-4">Total Amount</th>
                <th className="py-3.5 px-4">Oven Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {sortedAndFilteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-400 font-medium">
                    <ShoppingBag size={24} className="text-slate-300 mx-auto mb-2" />
                    No orders matching the current filter and search settings.
                  </td>
                </tr>
              ) : (
                sortedAndFilteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50/50 transition duration-150">
                    {/* Order ID */}
                    <td className="py-4 px-4 font-mono font-bold text-slate-500">
                      {order.id}
                    </td>

                    {/* Created At */}
                    <td className="py-4 px-4 whitespace-nowrap text-slate-600 font-mono text-[11px]">
                      {new Date(order.created_at).toLocaleString('en-IN', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>

                    {/* Customer Info */}
                    <td className="py-4 px-4">
                      <div className="font-bold text-slate-900">{order.customer_name}</div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">{order.customer_phone}</div>
                    </td>

                    {/* Items Ordered */}
                    <td className="py-4 px-4 max-w-sm">
                      <div className="space-y-1">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="flex flex-col gap-0.5">
                            <div className="flex items-baseline gap-1">
                              <span className="font-bold text-tomato font-mono text-[10px] bg-tomato/5 px-1 rounded">
                                {item.quantity}x
                              </span>
                              <span className="font-semibold text-slate-800">{item.pizza_name}</span>
                              <span className="text-[10px] text-slate-400">({item.base_name})</span>
                            </div>
                            {item.toppings.length > 0 && (
                              <div className="text-[10px] text-slate-400 ml-5 font-medium leading-tight">
                                Toppings: {item.toppings.join(', ')}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </td>

                    {/* Payment Method */}
                    <td className="py-4 px-4">
                      <span className="inline-block text-[10px] font-mono font-bold text-tomato bg-tomato/5 border border-tomato/10 px-2 py-0.5 rounded">
                        {order.payment_method}
                      </span>
                    </td>

                    {/* Total Amount */}
                    <td className="py-4 px-4 font-mono font-bold text-slate-950">
                      ₹{order.total}
                    </td>

                    {/* Read-Only Status Badge */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${getStatusBadgeClass(order.status)}`}>
                        {getStatusIcon(order.status)}
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </div>

    </div>
  );
};
