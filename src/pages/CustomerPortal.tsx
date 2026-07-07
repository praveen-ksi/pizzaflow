/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { Pizza, PizzaBase, PizzaTopping, CartItem as CartItemType } from '../types';
import { loadPizzas, loadBases, loadToppings } from '../lib/dataLoader';
import { PizzaListing } from '../components/PizzaListing';
import { Cart } from '../components/Cart';
import { orderService, UnifiedOrder } from '../lib/orderService';
import { 
  ShoppingBag, 
  ChevronRight, 
  Home as HomeIcon, 
  Flame, 
  UtensilsCrossed, 
  Info, 
  Phone, 
  Clock, 
  Sparkles, 
  RefreshCw, 
  Search, 
  AlertCircle, 
  CheckCircle2, 
  Pizza as PizzaIcon,
  Layers,
  Check,
  X
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';

export const CustomerPortal: React.FC = () => {
  const [pizzas, setPizzas] = useState<Pizza[]>([]);
  const [bases, setBases] = useState<PizzaBase[]>([]);
  const [toppings, setToppings] = useState<PizzaTopping[]>([]);
  const [cart, setCart] = useState<CartItemType[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'menu' | 'cart'>('menu');
  const [isStatusOpen, setIsStatusOpen] = useState(false);

  // Tracking Modal and Indian Phone Validation states
  const [isTrackModalOpen, setIsTrackModalOpen] = useState(false);
  const [trackingPhoneInput, setTrackingPhoneInput] = useState('');
  const [trackingPhoneError, setTrackingPhoneError] = useState('');

  // Order tracking and 30-second status polling states
  const [trackedPhone, setTrackedPhone] = useState(() => localStorage.getItem('pizza_customer_phone') || '');
  const [phoneInput, setPhoneInput] = useState('');
  const [trackedOrders, setTrackedOrders] = useState<UnifiedOrder[]>([]);
  const [isTrackingLoading, setIsTrackingLoading] = useState(false);
  const [trackingError, setTrackingError] = useState('');
  const [countdown, setCountdown] = useState(30);

  // Search orders for a phone number using Indian phone validation
  const handleSearchOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setTrackingPhoneError('');

    const triggerError = (msg: string) => {
      setTrackingPhoneError(msg);
      setTimeout(() => {
        const element = document.getElementById('input-tracking-phone');
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          element.focus({ preventScroll: true });
        }
      }, 100);
    };
    
    const phoneTrimmed = trackingPhoneInput.trim();
    if (!phoneTrimmed) {
      triggerError('Phone Number is required');
      return;
    }

    const digitsOnly = phoneTrimmed.replace(/\D/g, '');
    let main10Digits = digitsOnly;
    let isValidIndianPhone = false;

    if (digitsOnly.length === 10) {
      main10Digits = digitsOnly;
      isValidIndianPhone = true;
    } else if (digitsOnly.length === 11 && digitsOnly.startsWith('0')) {
      main10Digits = digitsOnly.substring(1);
      isValidIndianPhone = true;
    } else if (digitsOnly.length === 12 && digitsOnly.startsWith('91')) {
      main10Digits = digitsOnly.substring(2);
      isValidIndianPhone = true;
    } else if (digitsOnly.length > 10) {
      const possibleMain = digitsOnly.slice(-10);
      const prefix = digitsOnly.slice(0, -10);
      if (prefix === '91' || prefix === '0' || prefix === '091' || prefix === '9191') {
        main10Digits = possibleMain;
        isValidIndianPhone = true;
      }
    }

    const firstDigit = main10Digits[0];
    const startsWithValidMobileRange = ['6', '7', '8', '9'].includes(firstDigit);

    if (!isValidIndianPhone || main10Digits.length !== 10) {
      triggerError('Enter a valid 10-digit Indian number (starts with 6, 7, 8, or 9)');
      return;
    }
    
    if (!startsWithValidMobileRange) {
      triggerError('Indian mobile numbers must start with 6, 7, 8, or 9');
      return;
    }

    const formattedPhone = `+91 ${main10Digits.substring(0, 5)} ${main10Digits.substring(5)}`;
    
    setIsTrackingLoading(true);
    try {
      const orders = await orderService.fetchCustomerOrders(formattedPhone);
      setTrackedOrders(orders);
      
      if (orders.length > 0) {
        setTrackedPhone(formattedPhone);
        localStorage.setItem('pizza_customer_phone', formattedPhone);
        setIsTrackModalOpen(false);
        setIsStatusOpen(true);
        setTrackingPhoneInput('');
      } else {
        triggerError('No orders found for this Indian mobile number.');
      }
    } catch (err) {
      console.error(err);
      triggerError('Error connecting to the kitchen queue. Please try again.');
    } finally {
      setIsTrackingLoading(false);
    }
  };

  // Fetch orders for customer
  const fetchCustomerOrders = async (phone: string) => {
    if (!phone.trim()) return;
    setIsTrackingLoading(true);
    setTrackingError('');
    try {
      const orders = await orderService.fetchCustomerOrders(phone);
      setTrackedOrders(orders);
    } catch (e) {
      console.error('Failed to poll customer orders:', e);
      setTrackingError('Failed to fetch live oven updates. Reconnecting...');
    } finally {
      setIsTrackingLoading(false);
    }
  };

  // Poll status of the token using the phone number every 30 seconds
  useEffect(() => {
    if (trackedPhone) {
      fetchCustomerOrders(trackedPhone);
      setCountdown(30);

      const interval = setInterval(() => {
        fetchCustomerOrders(trackedPhone);
        setCountdown(30);
      }, 30000); // 30 seconds

      return () => clearInterval(interval);
    } else {
      setTrackedOrders([]);
    }
  }, [trackedPhone]);

  // Countdown timer for user feedback
  useEffect(() => {
    if (trackedPhone && trackedOrders.length > 0) {
      const timer = setInterval(() => {
        setCountdown(prev => (prev > 1 ? prev - 1 : 30));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [trackedPhone, trackedOrders]);

  // Watcher to auto-trigger tracking when a new order is placed in the Cart component
  useEffect(() => {
    const storageWatcher = setInterval(() => {
      const storedPhone = localStorage.getItem('pizza_customer_phone') || '';
      if (storedPhone && storedPhone !== trackedPhone) {
        setTrackedPhone(storedPhone);
      }
    }, 2000);
    return () => clearInterval(storageWatcher);
  }, [trackedPhone]);

  useEffect(() => {
    async function fetchData() {
      try {
        const [loadedPizzas, loadedBases, loadedToppings] = await Promise.all([
          loadPizzas(),
          loadBases(),
          loadToppings(),
        ]);
        setPizzas(loadedPizzas);
        setBases(loadedBases);
        setToppings(loadedToppings);

        // Load existing cart from localStorage if present
        const savedCart = localStorage.getItem('pizza_cart');
        if (savedCart) {
          setCart(JSON.parse(savedCart));
        }
      } catch (error) {
        console.error('Error fetching pizza configuration files:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // Save cart changes to local storage
  const saveCart = (newCart: CartItemType[]) => {
    setCart(newCart);
    localStorage.setItem('pizza_cart', JSON.stringify(newCart));
  };

  const handleAddToCart = (pizza: Pizza) => {
    // Standard default base (typically the first one, e.g. Thin Crust)
    const defaultBase = bases[0] || { id: 'B1', name: 'Thin Crust', price: 149 };
    
    const newItem: CartItemType = {
      id: `cart-item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      pizza,
      quantity: 1,
      selectedBase: defaultBase,
      selectedToppings: [],
    };

    saveCart([...cart, newItem]);
    
    // Smooth scroll or indicator feedback to let the user know it's added (Cart opening deactivated)
  };

  const handleUpdateBase = (itemId: string, base: PizzaBase) => {
    const updated = cart.map((item) =>
      item.id === itemId ? { ...item, selectedBase: base } : item
    );
    saveCart(updated);
  };

  const handleUpdateToppings = (itemId: string, selectedToppings: PizzaTopping[]) => {
    const updated = cart.map((item) =>
      item.id === itemId ? { ...item, selectedToppings } : item
    );
    saveCart(updated);
  };

  const handleUpdateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveItem(itemId);
      return;
    }
    const updated = cart.map((item) =>
      item.id === itemId ? { ...item, quantity } : item
    );
    saveCart(updated);
  };

  const handleRemoveItem = (itemId: string) => {
    const filtered = cart.filter((item) => item.id !== itemId);
    saveCart(filtered);
  };

  const handleClearCart = () => {
    saveCart([]);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
        <div className="space-y-4 text-center">
          <div className="w-12 h-12 border-4 border-tomato border-t-transparent rounded-full animate-spin mx-auto" />
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest font-mono">
              Loading Kitchen Data
            </h3>
            <p className="text-xs text-slate-400">
              Parsing configuration files: Pizza options, gourmet bases, and toppings...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition"
            >
              <HomeIcon size={18} />
            </Link>
            <span className="text-slate-300">/</span>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-tomato/10 text-tomato flex items-center justify-center font-bold">
                <Flame size={18} className="animate-pulse" />
              </div>
              <span className="font-extrabold font-display tracking-tight text-slate-900 text-sm sm:text-base">
                Slicematic
              </span>
            </div>
          </div>

          {/* Order Tracking & Status Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsTrackModalOpen(true)}
              className="px-3.5 py-2 rounded-full font-bold text-xs text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200/50 transition duration-300 flex items-center gap-1.5"
            >
              <Search size={13} />
              <span>Track Order</span>
            </button>

            {(() => {
              const activeStatuses = ['Preparing', 'Baking', 'Dispatched'];
              const activeOrder = trackedOrders.find(ord => activeStatuses.includes(ord.status));
              if (!activeOrder) return null;

              return (
                <button
                  onClick={() => setIsStatusOpen(true)}
                  className={`px-3.5 py-2 rounded-full font-bold text-xs transition duration-300 flex items-center gap-1.5 border shadow-xs hover:scale-105 active:scale-95 ${
                    activeOrder.status === 'Dispatched'
                      ? 'border-emerald-500 text-emerald-700 bg-emerald-50/85 hover:bg-emerald-100 hover:border-emerald-600'
                      : 'border-amber-400 text-amber-700 bg-amber-50/85 hover:bg-amber-100 hover:border-amber-500'
                  }`}
                >
                  <Clock size={13} className={activeOrder.status === 'Baking' ? "animate-spin text-tomato" : "animate-pulse text-amber-500"} />
                  <span>Order Status</span>
                  <span className="font-mono bg-white px-1.5 py-0.5 rounded-md text-[9px] border border-inherit text-slate-800">
                    #{activeOrder.token_number}
                  </span>
                </button>
              );
            })()}
          </div>
        </div>
      </header>

      {/* Hero Intro */}
      <section className="bg-white border-b border-slate-200 py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-mono tracking-widest bg-tomato/10 text-tomato font-extrabold px-3 py-1 rounded-full border border-tomato/20">
              ONLINE ORDERING
            </span>
            <span className="text-[10px] font-mono tracking-widest bg-slate-100 text-slate-600 font-bold px-3 py-1 rounded-full border border-slate-200 flex items-center gap-1">
              <Info size={12} />
              100% FRESH DAILY INGREDIENTS
            </span>
          </div>
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold font-display text-slate-950 tracking-tight leading-none">
              Build Your Bespoke Pizza
            </h1>
            <p className="text-slate-500 text-sm mt-2 max-w-2xl leading-relaxed font-sans">
              Choose your starter recipe below. Once added to your build queue, customize the crust size, thickness, and premium toppings layer-by-layer.
            </p>
          </div>
        </div>
      </section>

      {/* Main Board */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10 space-y-10">
        {activeTab === 'menu' ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h2 className="text-xl font-bold font-display text-slate-900">
                Select a Pizza Recipe
              </h2>
            </div>
            <PizzaListing pizzas={pizzas} onAddToCart={handleAddToCart} />
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <button
                onClick={() => setActiveTab('menu')}
                className="text-xs font-bold text-tomato hover:underline flex items-center gap-1"
              >
                ← Back to Pizza Menu
              </button>
              <h2 className="text-xl font-bold font-display text-slate-900">
                Customization Oven
              </h2>
            </div>
            <Cart
              items={cart}
              bases={bases}
              toppings={toppings}
              onUpdateBase={handleUpdateBase}
              onUpdateToppings={handleUpdateToppings}
              onUpdateQuantity={handleUpdateQuantity}
              onRemove={handleRemoveItem}
              onClear={handleClearCart}
            />
          </div>
        )}
      </main>

      {/* Floating Bottom Cart Bar */}
      {cart.length > 0 && activeTab === 'menu' && (
        <div className="fixed bottom-6 left-0 right-0 z-50 flex justify-center px-4">
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="w-full max-w-xl bg-slate-950/95 backdrop-blur-md border border-slate-800 text-white py-4 px-6 rounded-3xl shadow-2xl flex items-center justify-between gap-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-tomato flex items-center justify-center font-bold text-white shrink-0">
                <ShoppingBag size={18} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                  Your Oven Queue
                </p>
                <p className="text-xs sm:text-sm font-bold text-slate-100">
                  {cart.reduce((sum, item) => sum + item.quantity, 0)} {cart.reduce((sum, item) => sum + item.quantity, 0) === 1 ? 'pizza' : 'pizzas'} • <span className="text-tomato font-mono font-extrabold">₹{
                    cart.reduce((sum, item) => {
                      const singlePizzaPrice =
                        item.pizza.price +
                        item.selectedBase.price +
                        item.selectedToppings.reduce((tSum, t) => tSum + t.price, 0);
                      return sum + singlePizzaPrice * item.quantity;
                    }, 0) + 
                    Math.round(cart.reduce((sum, item) => {
                      const singlePizzaPrice =
                        item.pizza.price +
                        item.selectedBase.price +
                        item.selectedToppings.reduce((tSum, t) => tSum + t.price, 0);
                      return sum + singlePizzaPrice * item.quantity;
                    }, 0) * 0.05) +
                    (cart.reduce((sum, item) => {
                      const singlePizzaPrice =
                        item.pizza.price +
                        item.selectedBase.price +
                        item.selectedToppings.reduce((tSum, t) => tSum + t.price, 0);
                      return sum + singlePizzaPrice * item.quantity;
                    }, 0) > 999 ? 0 : 40)
                  }</span>
                </p>
              </div>
            </div>
            <button
              id="btn-floating-view-cart"
              onClick={() => setActiveTab('cart')}
              className="py-2.5 px-5 bg-tomato hover:bg-tomato-hover text-white rounded-2xl text-xs font-bold transition-all duration-300 flex items-center gap-1.5 shadow-md shadow-tomato/20 hover:scale-105"
            >
              <span>View Cart</span>
              <ChevronRight size={14} />
            </button>
          </motion.div>
        </div>
      )}

      {/* Active Order Status Modal Popup */}
      <AnimatePresence>
        {isStatusOpen && (() => {
          const activeStatuses = ['Preparing', 'Baking', 'Dispatched'];
          const activeOrder = trackedOrders.find(ord => activeStatuses.includes(ord.status));
          if (!activeOrder) return null;

          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsStatusOpen(false)}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs"
              />
              
              {/* Modal Box */}
              <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                className="relative w-full max-w-lg bg-white rounded-[32px] p-6 sm:p-8 shadow-2xl border border-slate-100 overflow-hidden space-y-6 z-10"
              >
                {/* Modal Header */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                      activeOrder.status === 'Dispatched' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                    }`}>
                      <Clock size={18} className="animate-pulse" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 font-display">
                        Live Order Status
                      </h3>
                      <p className="text-[10px] text-slate-400 font-mono">
                        ID: {activeOrder.id}
                      </p>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => setIsStatusOpen(false)}
                    className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-xl transition"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Sequential Token Number Banner */}
                <div className="bg-amber-50 border border-amber-200/60 rounded-2xl p-4 text-center">
                  <p className="text-[10px] uppercase tracking-wider font-mono font-bold text-amber-800">
                    Your Dine-In Table Token Number
                  </p>
                  <p className="text-3xl font-black font-mono text-amber-950 mt-1">
                    #{activeOrder.token_number}
                  </p>
                  <p className="text-[11px] text-slate-500 font-sans mt-1.5">
                    Dine-In order placed from table. Kitchen specialists are preparing your bespoke recipe.
                  </p>
                </div>

                {/* Progress Bar / Visual Stepper */}
                <div className="space-y-3 bg-slate-50 border border-slate-100 p-5 rounded-2xl">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono text-center">
                    Preparation Progress
                  </p>
                  
                  <div className="pt-2">
                    {(() => {
                      const steps = ['Preparing', 'Baking', 'Ready'];
                      let currentStepIndex = 0;
                      if (activeOrder.status === 'Baking') currentStepIndex = 1;
                      if (activeOrder.status === 'Dispatched') currentStepIndex = 2;

                      return (
                        <div className="space-y-4">
                          {/* Real progress bar */}
                          <div className="relative h-2 bg-slate-200 rounded-full overflow-hidden">
                            <div
                              className="absolute left-0 top-0 h-full bg-emerald-500 transition-all duration-500"
                              style={{ width: `${(currentStepIndex / 2) * 100}%` }}
                            />
                          </div>

                          {/* Interactive Steps Label */}
                          <div className="flex justify-between">
                            {steps.map((step, idx) => {
                              const isCompleted = idx < currentStepIndex;
                              const isActive = idx === currentStepIndex;

                              return (
                                <div key={step} className="flex flex-col items-center">
                                  <span
                                    className={`text-[10px] font-mono font-bold uppercase ${
                                      isActive
                                        ? 'text-tomato font-black'
                                        : isCompleted
                                          ? 'text-emerald-600'
                                          : 'text-slate-400'
                                    }`}
                                  >
                                    {step}
                                  </span>
                                  <span className={`text-[9px] text-slate-400 mt-0.5 ${isActive ? 'text-tomato font-semibold' : ''}`}>
                                    {idx === 0 && 'Confirmed'}
                                    {idx === 1 && 'In Oven'}
                                    {idx === 2 && 'At Counter'}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>

                {/* Order Details List */}
                <div className="bg-white border border-slate-100 rounded-2xl p-4.5 space-y-3">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                    Baking Queue Items:
                  </p>
                  <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                    {activeOrder.items.map((item, idx) => (
                      <div key={idx} className="text-xs text-slate-700 font-medium flex justify-between border-b border-slate-50 pb-1.5 last:border-0 last:pb-0">
                        <span>
                          • {item.quantity}x {item.pizza_name} <span className="text-slate-400">({item.base_name})</span>
                        </span>
                        <span className="font-mono text-slate-500">
                          ₹{item.single_price * item.quantity}
                        </span>
                      </div>
                    ))}
                  </div>
                  
                  <div className="border-t border-slate-100 pt-2.5 flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-800">Grand Total Paid</span>
                    <span className="font-mono font-bold text-emerald-700">₹{activeOrder.total}</span>
                  </div>
                </div>

                {/* Status footer actions */}
                <div className="flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-100 pt-4">
                  <span>Auto-refreshing in {countdown}s</span>
                  <button
                    onClick={() => fetchCustomerOrders(trackedPhone)}
                    className="flex items-center gap-1 hover:text-slate-600 font-bold"
                  >
                    <RefreshCw size={11} className={isTrackingLoading ? "animate-spin" : ""} />
                    Sync Now
                  </button>
                </div>

              </motion.div>
            </div>
          );
        })()}

        {/* Track Order Modal */}
        {isTrackModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsTrackModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs"
            />
            
            {/* Modal Box */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-[32px] p-6 sm:p-8 shadow-2xl border border-slate-100 overflow-hidden space-y-6 z-10"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-tomato/10 text-tomato flex items-center justify-center">
                    <Search size={16} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 font-display">
                      Track Your Pizza Order
                    </h3>
                    <p className="text-[10px] text-slate-400 font-mono">
                      Enter your Indian mobile number
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsTrackModalOpen(false)}
                  className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-xl transition"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSearchOrder} className="space-y-4">
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="block text-xs font-bold text-slate-700">Phone Number</label>
                    <span className="text-[10px] text-slate-400 font-medium">🇮🇳 Indian mobile numbers</span>
                  </div>
                  <input
                    id="input-tracking-phone"
                    type="tel"
                    value={trackingPhoneInput}
                    onChange={(e) => setTrackingPhoneInput(e.target.value)}
                    placeholder="e.g. 98765 43210 or +91 98765 43210"
                    className="block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-tomato focus:ring-2 focus:ring-tomato/10 transition-all duration-200"
                  />
                  {trackingPhoneError ? (
                    <p className="text-[10px] text-rose-500 font-medium">{trackingPhoneError}</p>
                  ) : (
                    <p className="text-[10px] text-slate-400">Accepts standard 10 digits, +91, 91, or 0 prefixes.</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isTrackingLoading}
                  className="w-full py-3 bg-tomato hover:bg-tomato-hover text-white rounded-xl text-xs font-bold transition-all duration-300 shadow-md shadow-tomato/10 flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {isTrackingLoading ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      <span>Checking Oven Queue...</span>
                    </>
                  ) : (
                    <>
                      <Search size={14} />
                      <span>Search Live Orders</span>
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
