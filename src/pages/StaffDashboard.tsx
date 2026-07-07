/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { orderService, UnifiedOrder } from '../lib/orderService';
import { 
  LogOut, 
  Flame, 
  Layers, 
  Clock, 
  Bell, 
  Search, 
  RefreshCw, 
  Check, 
  ChevronRight, 
  User, 
  Phone, 
  CheckCircle2, 
  AlertCircle,
  Truck,
  Pizza as PizzaIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const StaffDashboard: React.FC = () => {
  const { user, profile, signOut, isDemoMode } = useAuth();

  // State managers
  const [orders, setOrders] = useState<UnifiedOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'active' | 'completed' | 'all'>('active');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Preparing' | 'Baking' | 'Dispatched'>('all');
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [timeTicker, setTimeTicker] = useState(0);

  // Time elapsed ticker trigger (updates elapsed minutes text every 30 seconds)
  useEffect(() => {
    const ticker = setInterval(() => {
      setTimeTicker(prev => prev + 1);
    }, 30000);
    return () => clearInterval(ticker);
  }, []);

  // Fetch orders from database
  const loadOrders = async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      const fetched = await orderService.fetchOrders();
      setOrders(fetched || []);
    } catch (e) {
      console.error('Failed to load kitchen orders', e);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders(true);
    // Poll for new customer orders every 5 seconds
    const interval = setInterval(() => {
      loadOrders(false);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Status transitions handler
  const handleStatusChange = async (orderId: string, nextStatus: 'Preparing' | 'Baking' | 'Dispatched' | 'Delivered' | 'Cancelled') => {
    setActioningId(orderId);
    try {
      // Optimistic state update for instant tactile feedback
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: nextStatus } : o));
      const success = await orderService.updateOrderStatus(orderId, nextStatus);
      if (success) {
        const orderToken = orders.find(o => o.id === orderId)?.token_number || '';
        setToast({ 
          type: 'success', 
          message: `Order #${orderToken} status advanced to "${nextStatus}" successfully!` 
        });
      } else {
        setToast({ 
          type: 'error', 
          message: 'Status update failed. Reverting to database state...' 
        });
        loadOrders(false);
      }
    } catch (e) {
      console.error(e);
      setToast({ 
        type: 'error', 
        message: 'A communications error occurred. Reverting...' 
      });
      loadOrders(false);
    } finally {
      setActioningId(null);
      setTimeout(() => setToast(null), 3000);
    }
  };

  // Elapsed time utility
  const getElapsedTime = (createdAt: string) => {
    const diffMs = Date.now() - new Date(createdAt).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    return `${diffHours}h ago`;
  };

  // Kitchen Metrics derivations
  const activeOrders = orders.filter(o => o.status === 'Preparing' || o.status === 'Baking' || o.status === 'Dispatched');
  const completedOrders = orders.filter(o => o.status === 'Delivered');

  const preparingCount = orders.filter(o => o.status === 'Preparing').length;
  const bakingCount = orders.filter(o => o.status === 'Baking').length;
  const dispatchedCount = orders.filter(o => o.status === 'Dispatched').length;

  // Filter orders based on Tab selection & Search query
  const filteredOrders = orders.filter(order => {
    // 1. Tab filtering
    if (activeTab === 'active') {
      const isActive = order.status === 'Preparing' || order.status === 'Baking' || order.status === 'Dispatched';
      if (!isActive) return false;
      // Active state sub-filter
      if (statusFilter !== 'all' && order.status !== statusFilter) return false;
    } else if (activeTab === 'completed') {
      if (order.status !== 'Delivered') return false;
    }

    // 2. Search query filtering
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;

    return (
      order.customer_name.toLowerCase().includes(query) ||
      order.customer_phone.toLowerCase().includes(query) ||
      order.token_number.toLowerCase().includes(query) ||
      order.id.toLowerCase().includes(query) ||
      order.items.some(i => i.pizza_name.toLowerCase().includes(query))
    );
  });

  return (
    <div className="min-h-screen bg-warm-gray font-sans text-slate-800 selection:bg-tomato/10 selection:text-tomato">
      
      {/* Dynamic Toast Feedback Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -40, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -40, scale: 0.9 }}
            className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-3.5 rounded-2xl shadow-xl flex items-center gap-3 border text-xs font-bold transition-all duration-300 ${
              toast.type === 'success'
                ? 'bg-slate-900 border-emerald-500/30 text-white'
                : 'bg-rose-950 border-rose-500/30 text-rose-200'
            }`}
          >
            {toast.type === 'success' ? (
              <div className="w-5 h-5 rounded-full bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0">
                <Check size={12} className="stroke-[3]" />
              </div>
            ) : (
              <AlertCircle size={14} className="text-rose-400 shrink-0" />
            )}
            <span>{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navbar */}
      <header className="border-b border-slate-200 bg-white/85 backdrop-blur-md sticky top-0 z-10 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-tomato rounded-xl flex items-center justify-center shadow-md shadow-tomato/20">
              <span className="text-white font-black text-lg">P</span>
            </div>
            <span className="text-xl font-bold font-display tracking-tight text-slate-900">
              Slice<span className="text-tomato">matic</span>
              <span className="text-[10px] font-mono font-bold bg-amber-50 text-amber-700 border border-amber-100 px-2.5 py-0.5 rounded ml-2.5 uppercase">
                Kitchen Desk
              </span>
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex flex-col text-right text-xs">
              <span className="text-slate-900 font-bold">{profile?.full_name || 'Kitchen Specialist'}</span>
              <span className="text-slate-400 font-mono text-[10px]">{user?.email}</span>
            </div>
            <button
              id="btn-staff-logout"
              onClick={() => signOut()}
              className="flex items-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold bg-slate-50 hover:bg-rose-50 text-rose-600 border border-slate-200 hover:border-rose-200 transition duration-200 shadow-2xs"
            >
              <LogOut size={14} />
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-10 space-y-8">
        
        {/* Operations Hub Banner */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-tomato to-amber-600 border border-tomato/10 rounded-3xl p-8 text-white relative overflow-hidden shadow-lg shadow-tomato/10"
        >
          {/* Decorative circular background */}
          <div className="absolute bottom-[-100px] right-[-100px] w-[300px] h-[300px] bg-white/5 rounded-full pointer-events-none" />
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2.5 text-amber-200 text-xs font-bold tracking-wider font-mono">
                <Flame size={15} className="animate-pulse text-tomato-hover" />
                KITCHEN PORTAL DISPATCH
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight font-display text-white">
                Live Baking & Preparation Board
              </h1>
              <p className="text-white/90 text-sm mt-1.5 max-w-xl leading-relaxed">
                Update incoming dine-in table orders as you prepare them. Advancing status keeps customer screens updated instantly with active token cues.
              </p>
            </div>
            
            <div className="flex flex-wrap gap-2 font-mono text-xs text-white">
              <div className="bg-black/15 px-3 py-1.5 rounded-lg border border-white/10 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                <span className="opacity-75">KITCHEN: </span>
                <span className="font-bold">OPEN</span>
              </div>
              <div className="bg-black/15 px-3 py-1.5 rounded-lg border border-white/10">
                <span className="opacity-75">STATION: </span>
                <span className="font-bold">MAIN OVEN</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Dynamic Kitchen Status KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            { 
              label: 'Preparing Queue', 
              value: `${preparingCount} Orders`, 
              icon: Layers, 
              color: 'text-amber-600 bg-amber-550/5 border-amber-100',
              sub: 'Awaiting first prep'
            },
            { 
              label: 'Active Baking In Oven', 
              value: `${bakingCount} Pizzas`, 
              icon: Flame, 
              color: 'text-tomato bg-tomato/5 border-tomato/10',
              sub: 'Oven temperature 425°C'
            },
            { 
              label: 'Dispatched / Ready', 
              value: `${dispatchedCount} Handouts`, 
              icon: Truck, 
              color: 'text-blue-600 bg-blue-50 border-blue-100',
              sub: 'At counter for pickup'
            },
            { 
              label: 'System Notification', 
              value: activeOrders.length > 0 ? `${activeOrders.length} Pending` : 'System Idle', 
              icon: Bell, 
              color: activeOrders.length > 0 ? 'text-rose-600 bg-rose-50 border-rose-100' : 'text-slate-400 bg-slate-50 border-slate-200',
              sub: activeOrders.length > 0 ? 'Urgent attention required' : 'All orders complete!'
            }
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <div key={idx} className="bg-white border border-slate-200/80 rounded-2xl p-5 flex items-center gap-4 shadow-xs">
                <div className={`p-3 rounded-xl border ${item.color}`}>
                  <Icon size={22} className={idx === 1 && bakingCount > 0 ? "animate-bounce" : ""} />
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 font-mono uppercase tracking-wider font-bold">{item.label}</div>
                  <div className="text-base font-extrabold text-slate-900 mt-0.5">{item.value}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5 font-sans">{item.sub}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Live Kitchen Prep Board Section */}
        <div className="bg-white border border-slate-200 rounded-[28px] p-6 sm:p-8 shadow-sm space-y-6">
          
          {/* Header & Main tab navigation */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 border-b border-slate-100 pb-5">
            <div className="space-y-1">
              <h2 className="text-lg font-bold font-display text-slate-900 flex items-center gap-2">
                <Clock size={18} className="text-tomato" />
                Kitchen Operational Queue
              </h2>
              <p className="text-xs text-slate-400">
                A real-time list of customer orders. Click on action tags to move orders forward through the kitchen pipeline.
              </p>
            </div>

            {/* Filter tab controls */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="bg-slate-100 p-1 rounded-xl flex">
                {[
                  { id: 'active', label: `Active Queue (${activeOrders.length})` },
                  { id: 'completed', label: `Completed (${completedOrders.length})` },
                  { id: 'all', label: `All Orders (${orders.length})` }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id as any);
                      setStatusFilter('all');
                    }}
                    className={`py-1.5 px-3 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                      activeTab === tab.id
                        ? 'bg-white text-slate-800 shadow-xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Sync Button */}
              <button
                onClick={() => loadOrders(true)}
                disabled={loading}
                className="p-2 border border-slate-200 hover:bg-slate-50 text-slate-500 hover:text-slate-800 rounded-xl transition shrink-0 disabled:opacity-50"
                title="Force Sync Live Queue"
              >
                <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
              </button>
            </div>
          </div>

          {/* Sub-Filters for Active state */}
          {activeTab === 'active' && (
            <div className="flex flex-wrap items-center gap-1.5 bg-slate-50 p-1.5 rounded-xl border border-slate-100 max-w-fit">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider font-mono px-2.5">Pipeline:</span>
              {[
                { id: 'all', label: 'All Active' },
                { id: 'Preparing', label: `📝 Prep Pending (${preparingCount})` },
                { id: 'Baking', label: `🔥 Baking (${bakingCount})` },
                { id: 'Dispatched', label: `🚚 At Counter (${dispatchedCount})` }
              ].map((subFilter) => (
                <button
                  key={subFilter.id}
                  onClick={() => setStatusFilter(subFilter.id as any)}
                  className={`py-1 px-2.5 rounded-lg text-2xs font-bold transition ${
                    statusFilter === subFilter.id
                      ? 'bg-white text-slate-800 shadow-xs border border-slate-100/50'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {subFilter.label}
                </button>
              ))}
            </div>
          )}

          {/* Search bar */}
          <div className="relative">
            <Search size={14} className="absolute left-3.5 top-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search kitchen list by Token #, Client, Phone, or Pizza Recipe..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-tomato focus:ring-1 focus:ring-tomato/15 transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-2 py-1 px-2 text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-md font-semibold transition"
              >
                Clear
              </button>
            )}
          </div>

          {/* Render Queue Items */}
          <div className="space-y-4">
            {loading ? (
              <div className="py-20 text-center space-y-3">
                <RefreshCw size={24} className="text-tomato animate-spin mx-auto" />
                <p className="text-xs text-slate-400">Loading live kitchen order queue...</p>
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="py-16 text-center border border-dashed border-slate-200 rounded-2xl bg-slate-50/40 space-y-3">
                <PizzaIcon size={28} className="text-slate-300 mx-auto" />
                <div className="space-y-1">
                  <p className="text-xs font-extrabold text-slate-700">No matching orders found</p>
                  <p className="text-[10px] text-slate-400">
                    {searchQuery 
                      ? "Try searching for a different token number or customer phone."
                      : activeTab === 'active'
                        ? "Hooray! The active kitchen queue is clear. No baking is currently pending!"
                        : "No historical completed orders found."}
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {filteredOrders.map((order) => {
                  const isTransitioning = actioningId === order.id;

                  return (
                    <motion.div
                      key={order.id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white border border-slate-200 hover:border-slate-300 rounded-2xl p-5 sm:p-6 transition duration-200 flex flex-col md:flex-row justify-between gap-5 relative overflow-hidden shadow-2xs"
                    >
                      {/* Left border indicator depending on status */}
                      <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                        order.status === 'Preparing' ? 'bg-amber-400' :
                        order.status === 'Baking' ? 'bg-orange-500 animate-pulse' :
                        order.status === 'Dispatched' ? 'bg-blue-500' :
                        order.status === 'Delivered' ? 'bg-emerald-500' :
                        'bg-slate-400'
                      }`} />

                      {/* Main order info and contents */}
                      <div className="space-y-4 flex-1 pl-2">
                        {/* Order Header / Stats */}
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-[10px]">
                          <span className="font-mono font-black text-slate-400 uppercase tracking-wider">
                            ID: {order.id}
                          </span>
                          <span className="text-slate-300">•</span>
                          <span className="font-mono text-slate-500 font-bold flex items-center gap-1">
                            <Clock size={11} />
                            Placed {getElapsedTime(order.created_at)}
                          </span>
                          <span className="text-slate-300">•</span>
                          <span className="font-mono font-bold text-tomato bg-tomato/5 border border-tomato/10 px-1.5 py-0.5 rounded">
                            {order.payment_method}
                          </span>
                          <span className="text-slate-300">•</span>
                          <span className="font-mono font-bold text-slate-500">
                            Token: #{order.token_number}
                          </span>
                        </div>

                        {/* Customer profile */}
                        <div className="flex flex-wrap gap-4 items-center">
                          <div className="bg-amber-50 border border-amber-200/50 rounded-xl px-4 py-2 text-center shrink-0">
                            <p className="text-[9px] uppercase tracking-wider font-mono font-bold text-amber-800">TABLE TOKEN</p>
                            <p className="text-xl font-black font-mono text-amber-950">#{order.token_number}</p>
                          </div>

                          <div className="space-y-0.5">
                            <h4 className="text-sm font-extrabold text-slate-950 font-sans flex items-center gap-1.5">
                              <User size={13} className="text-slate-400" />
                              {order.customer_name}
                            </h4>
                            <p className="text-xs text-slate-500 font-mono flex items-center gap-1">
                              <Phone size={11} className="text-slate-400" />
                              {order.customer_phone}
                            </p>
                          </div>
                        </div>

                        {/* Order Items Snapshot specifications */}
                        <div className="bg-slate-50 border border-slate-100 p-3.5 rounded-xl space-y-2 max-w-2xl">
                          <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest font-mono">Baking Queue Specifications:</p>
                          <div className="space-y-1.5">
                            {order.items.map((item, idx) => (
                              <div key={idx} className="text-xs text-slate-800 flex flex-wrap items-baseline justify-between gap-2 border-b border-slate-200/40 pb-1.5 last:border-0 last:pb-0">
                                <div className="flex flex-wrap items-baseline gap-1.5">
                                  <span className="font-mono font-black text-tomato bg-tomato/5 px-1.5 py-0.5 rounded text-[10px]">
                                    {item.quantity}x
                                  </span>
                                  <span className="font-bold text-slate-900">{item.pizza_name}</span>
                                  <span className="text-slate-400 text-[10px] bg-white border border-slate-200/50 px-1 rounded">
                                    Crust: {item.base_name}
                                  </span>
                                  {item.toppings && item.toppings.length > 0 && (
                                    <span className="text-slate-500 text-[10px] italic">
                                      + Extra Toppings: {item.toppings.join(', ')}
                                    </span>
                                  )}
                                </div>
                                <span className="font-mono text-slate-400 text-[10px]">
                                  ₹{item.single_price * item.quantity}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Right segment: Order actions & controls */}
                      <div className="flex flex-col justify-between items-stretch md:items-end gap-4 md:w-56 shrink-0 md:border-l md:border-slate-100 md:pl-5 pt-4 md:pt-0">
                        
                        {/* Display aggregate cost */}
                        <div className="space-y-0.5 md:text-right">
                          <div className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">
                            Grand Total
                          </div>
                          <div className="text-lg font-black text-emerald-800 font-mono">
                            ₹{order.total}
                          </div>
                        </div>

                        {/* Visual Workflow Steps Buttons */}
                        <div className="space-y-2 w-full">
                          
                          {/* Main workflow action trigger */}
                          {(() => {
                            if (order.status === 'Preparing') {
                              return (
                                <button
                                  onClick={() => handleStatusChange(order.id, 'Baking')}
                                  disabled={isTransitioning}
                                  className="w-full py-2.5 px-4 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition duration-150 flex items-center justify-center gap-1.5 shadow-sm shadow-orange-500/10"
                                >
                                  {isTransitioning ? (
                                    <RefreshCw size={12} className="animate-spin" />
                                  ) : (
                                    <Flame size={13} className="animate-pulse" />
                                  )}
                                  <span>🔥 Start Baking</span>
                                </button>
                              );
                            }
                            if (order.status === 'Baking') {
                              return (
                                <button
                                  onClick={() => handleStatusChange(order.id, 'Dispatched')}
                                  disabled={isTransitioning}
                                  className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition duration-150 flex items-center justify-center gap-1.5 shadow-sm shadow-blue-500/10"
                                >
                                  {isTransitioning ? (
                                    <RefreshCw size={12} className="animate-spin" />
                                  ) : (
                                    <Truck size={13} />
                                  )}
                                  <span>🚚 Dispatch / Ready</span>
                                </button>
                              );
                            }
                            if (order.status === 'Dispatched') {
                              return (
                                <button
                                  onClick={() => handleStatusChange(order.id, 'Delivered')}
                                  disabled={isTransitioning}
                                  className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition duration-150 flex items-center justify-center gap-1.5 shadow-sm shadow-emerald-500/10"
                                >
                                  {isTransitioning ? (
                                    <RefreshCw size={12} className="animate-spin" />
                                  ) : (
                                    <CheckCircle2 size={13} />
                                  )}
                                  <span>✅ Hand Over / Deliver</span>
                                </button>
                              );
                            }
                            return (
                              <div className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-center text-slate-400 font-bold text-[11px] flex items-center justify-center gap-1">
                                <Check size={12} className="text-emerald-500 stroke-[3]" />
                                <span>Completed & Delivered</span>
                              </div>
                            );
                          })()}

                          {/* Fallback Manual Override Status Dropdown */}
                          <div className="space-y-1">
                            <label className="block text-[9px] text-slate-400 font-mono md:text-right uppercase tracking-wider font-bold">Manual State Override:</label>
                            <select
                              value={order.status}
                              onChange={(e) => handleStatusChange(order.id, e.target.value as any)}
                              disabled={isTransitioning}
                              className="w-full py-1.5 px-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-[10px] font-bold text-slate-700 outline-none transition"
                            >
                              <option value="Preparing">Preparing (📝 Confirmed)</option>
                              <option value="Baking">Baking (🔥 In Oven)</option>
                              <option value="Dispatched">Dispatched (🚚 At Counter)</option>
                              <option value="Delivered">Delivered (✅ Completed)</option>
                              <option value="Cancelled">Cancelled (❌ Dropped)</option>
                            </select>
                          </div>

                        </div>
                      </div>

                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Kitchen guidelines banner */}
        <div className="bg-cream border border-tomato/10 rounded-3xl p-6 shadow-2xs">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-white text-tomato rounded-2xl border border-tomato/10 shadow-2xs shrink-0">
              <Flame size={22} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 font-display">
                Kitchen Operational Safety Guidelines
              </h2>
              <p className="text-slate-600 text-sm mt-1.5 leading-relaxed">
                Welcome to the Kitchen Staff Dashboard! Please ensure all ingredients are kept fresh, workstation surfaces are sanitized regularly, and bake timers are monitored closely. Pizzas must always be served piping hot for maximum satisfaction.
              </p>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
};
