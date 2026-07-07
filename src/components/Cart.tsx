/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { CartItem as CartItemType, PizzaBase, PizzaTopping } from '../types';
import { CartItem } from './CartItem';
import { orderService } from '../lib/orderService';
import {
  ShoppingCart,
  Sparkles,
  CheckCircle2,
  Trash2,
  ArrowRight,
  CreditCard,
  Smartphone,
  ShieldCheck,
  QrCode,
  AlertCircle,
  X,
  Lock,
  Check,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CartProps {
  items: CartItemType[];
  bases: PizzaBase[];
  toppings: PizzaTopping[];
  onUpdateBase: (itemId: string, base: PizzaBase) => void;
  onUpdateToppings: (itemId: string, toppings: PizzaTopping[]) => void;
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onRemove: (itemId: string) => void;
  onClear: () => void;
}

export const Cart: React.FC<CartProps> = ({
  items,
  bases,
  toppings,
  onUpdateBase,
  onUpdateToppings,
  onUpdateQuantity,
  onRemove,
  onClear,
}) => {
  const [isCheckoutSuccess, setIsCheckoutSuccess] = useState(false);
  const [isPlacing, setIsPlacing] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [fullName, setFullName] = useState(() => localStorage.getItem('pizza_customer_name') || '');
  const [phoneNumber, setPhoneNumber] = useState(() => localStorage.getItem('pizza_customer_phone') || '');
  const [placedOrderToken, setPlacedOrderToken] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'Cash' | 'Card'>('UPI');
  const [formErrors, setFormErrors] = useState<{ fullName?: string; phoneNumber?: string }>({});
  const [dbError, setDbError] = useState<string | null>(null);
  const [orderedItems, setOrderedItems] = useState<CartItemType[]>([]);
  const [orderedGrandTotal, setOrderedGrandTotal] = useState(0);
  const [orderedDiscount, setOrderedDiscount] = useState(0);

  // Discount / Promo Code states
  // Managed automatically based on pizza count (5 or more)
  const isPromoApplied = items.reduce((sum, item) => sum + item.quantity, 0) >= 5;

  // Payment Gateway simulation states
  const [paymentPartner] = useState<'PizzaPay'>('PizzaPay');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentStep, setPaymentStep] = useState<'details' | 'otp' | 'qr_scan' | 'processing' | 'success' | 'failed'>('details');
  const [paymentCardNo, setPaymentCardNo] = useState('');
  const [paymentCardName, setPaymentCardName] = useState('');
  const [paymentCardExpiry, setPaymentCardExpiry] = useState('');
  const [paymentCardCvv, setPaymentCardCvv] = useState('');
  const [paymentUpiId, setPaymentUpiId] = useState('');
  const [upiSubMethod, setUpiSubMethod] = useState<'qr' | 'id'>('qr');
  const [paymentOtp, setPaymentOtp] = useState('');
  const [paymentError, setPaymentError] = useState('');
  const [paymentErrors, setPaymentErrors] = useState<{ cardNo?: string; cardName?: string; cardExpiry?: string; cardCvv?: string; upiId?: string }>({});
  const [paymentTxnId, setPaymentTxnId] = useState('');
  const [qrTimer, setQrTimer] = useState(120);

  // Luhn Algorithm validation for PizzaPay card entries
  const validateLuhn = (cardNumber: string): boolean => {
    const cleanNum = cardNumber.replace(/\D/g, '');
    if (!cleanNum || cleanNum.length < 13 || cleanNum.length > 19) {
      return false;
    }
    let sum = 0;
    let shouldDouble = false;
    for (let i = cleanNum.length - 1; i >= 0; i--) {
      let digit = parseInt(cleanNum.charAt(i), 10);
      if (shouldDouble) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }
      sum += digit;
      shouldDouble = !shouldDouble;
    }
    return sum % 10 === 0;
  };

  // Card Expiry validation (MM/YY format, must be in the future or present)
  const validateExpiry = (expiry: string): boolean => {
    const match = expiry.match(/^(\d{2})\/(\d{2})$/);
    if (!match) return false;
    const month = parseInt(match[1], 10);
    const year = parseInt(match[2], 10);
    if (month < 1 || month > 12) return false;
    
    const now = new Date();
    const currentYear = now.getFullYear() % 100; // 2-digit representation (e.g. 26)
    const currentMonth = now.getMonth() + 1; // 1-indexed month
    
    if (year < currentYear) return false;
    if (year === currentYear && month < currentMonth) return false;
    return true;
  };

  const totalPizzaCount = items.reduce((sum, item) => sum + item.quantity, 0);

  // Math totals
  const subtotal = items.reduce((sum, item) => {
    const singlePizzaPrice =
      item.pizza.price +
      item.selectedBase.price +
      item.selectedToppings.reduce((tSum, t) => tSum + t.price, 0);
    return sum + singlePizzaPrice * item.quantity;
  }, 0);

  // Calculate discount (10% off subtotal if 10% OFF applied)
  const discountAmount = isPromoApplied ? Math.round(subtotal * 0.1) : 0;
  const subtotalWithDiscount = subtotal - discountAmount;

  const gstTax = Math.round(subtotalWithDiscount * 0.18); // 18% GST on food post-discount
  const grandTotal = subtotalWithDiscount + gstTax;

  // Real-time QR Code expiration countdown
  useEffect(() => {
    let interval: any;
    if (showPaymentModal && paymentStep === 'qr_scan' && qrTimer > 0) {
      interval = setInterval(() => {
        setQrTimer((prev) => prev - 1);
      }, 1000);
    } else if (qrTimer === 0 && paymentStep === 'qr_scan') {
      setPaymentStep('failed');
      setPaymentError('QR Code signature has expired. Please regenerate the QR code to proceed safely.');
    }
    return () => clearInterval(interval);
  }, [showPaymentModal, paymentStep, qrTimer]);

  const validateForm = () => {
    const errors: { fullName?: string; phoneNumber?: string } = {};
    const trimmedName = fullName.trim();
    if (!trimmedName) {
      errors.fullName = 'Full Name is required';
    } else if (trimmedName.length > 40) {
      errors.fullName = 'Full Name must be 40 characters or less';
    } else if (/[^a-zA-Z\s]/.test(trimmedName)) {
      errors.fullName = 'Full Name can only contain letters and spaces';
    } else if (/\s{2,}/.test(fullName)) {
      errors.fullName = 'Full Name cannot contain consecutive spaces';
    }
    
    const phoneTrimmed = phoneNumber.trim();
    if (!phoneTrimmed) {
      errors.phoneNumber = 'Phone Number is required';
    } else {
      // Strip everything except digits
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
        // Fallback for +91 prefixes or duplicate codes
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
        errors.phoneNumber = 'Enter a valid 10-digit Indian number (starts with 6, 7, 8, or 9)';
      } else if (!startsWithValidMobileRange) {
        errors.phoneNumber = 'Indian mobile numbers must start with 6, 7, 8, or 9';
      } else {
        // Format to a clean, standardized format: +91 XXXXX XXXXX
        const formattedPhone = `+91 ${main10Digits.substring(0, 5)} ${main10Digits.substring(5)}`;
        setPhoneNumber(formattedPhone);
      }
    }

    setFormErrors(errors);
    
    const hasErrors = Object.keys(errors).length > 0;
    if (hasErrors) {
      setTimeout(() => {
        const firstErrorKey = Object.keys(errors)[0];
        const elementId = firstErrorKey === 'fullName' ? 'input-checkout-name' : 'input-checkout-phone';
        const element = document.getElementById(elementId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          element.focus({ preventScroll: true });
        }
      }, 100);
    }

    return !hasErrors;
  };

  const handlePlaceOrder = async () => {
    if (items.length === 0) return;
    if (!validateForm()) return;
    setDbError(null);
    setIsPlacing(true);

    // Simulate placing order
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsPlacing(false);

    if (paymentMethod === 'Cash') {
      await completeOrderPlacement('CASH-OFFLINE', 'Unpaid (Cash on Delivery)');
    } else if (paymentMethod === 'UPI') {
      const txnId = `pay_upi_${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      await completeOrderPlacement(txnId, 'Paid (UPI)');
    } else { // Card
      const txnId = `pay_card_${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      await completeOrderPlacement(txnId, 'Paid (Card)');
    }
  };

  const completeOrderPlacement = async (txnId: string, paymentStatusText?: string) => {
    setDbError(null);
    // Store customer details to localStorage so they don't have to enter them always
    localStorage.setItem('pizza_customer_name', fullName.trim());
    localStorage.setItem('pizza_customer_phone', phoneNumber.trim());

    // Map items to the format required by the database schema
    const orderItemsInput = items.map(item => ({
      pizza_id: item.pizza.id,
      pizza_name: item.pizza.name,
      base_name: item.selectedBase.name,
      toppings: item.selectedToppings.map(t => t.name),
      quantity: item.quantity,
      single_price: item.pizza.price + item.selectedBase.price + item.selectedToppings.reduce((acc, t) => acc + t.price, 0)
    }));

    try {
      const placed = await orderService.placeOrder({
        customer_name: fullName.trim(),
        customer_phone: phoneNumber.trim(),
        payment_method: paymentMethod,
        items: orderItemsInput,
        subtotal: subtotal,
        discount: discountAmount,
        tax: gstTax,
        total: grandTotal
      }, txnId, paymentStatusText);

      setPlacedOrderToken(placed.token_number);
      // Cache ordered items and total for the receipt visualization before clearing
      setOrderedItems([...items]);
      setOrderedGrandTotal(grandTotal);
      setOrderedDiscount(discountAmount);
      // Clear parent cart state and localStorage immediately upon success
      onClear();
      setIsCheckoutSuccess(true);
    } catch (e: any) {
      console.error('Failed to write order via service:', e);
      setDbError(e?.message || 'Database transaction error occurred');
      setIsCheckoutSuccess(false);
      setPlacedOrderToken('');
    }
  };

  const handleResetCart = () => {
    setIsCheckoutSuccess(false);
    setIsCheckingOut(false);
    // Maintain stored customer details in state so they are pre-filled next time!
    setFullName(localStorage.getItem('pizza_customer_name') || '');
    setPhoneNumber(localStorage.getItem('pizza_customer_phone') || '');
    setPaymentMethod('UPI');
    setFormErrors({});
    // Reset discount/promo states
    setOrderedDiscount(0);
  };

  if (isCheckoutSuccess) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-emerald-50 border border-emerald-200 rounded-[32px] p-8 sm:p-12 text-center max-w-2xl mx-auto space-y-6 shadow-xl shadow-emerald-500/5"
      >
        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
          <CheckCircle2 size={36} />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl sm:text-3xl font-bold font-display text-emerald-950 tracking-tight">
            Order Dispatched to Kitchen!
          </h2>
          <p className="text-emerald-800/80 text-sm max-w-md mx-auto leading-relaxed">
            Your customized pizzas have been loaded directly into the Slicematic kitchen dispatch system. Oven specialists are heating the stones!
          </p>
        </div>

        {/* Highly visible, styled Token Number card */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 max-w-md mx-auto shadow-sm">
          <p className="text-[10px] uppercase tracking-wider font-mono font-bold text-amber-700">Your Order Token Number</p>
          <p className="text-4xl font-extrabold font-mono text-amber-900 mt-1">#{placedOrderToken || '101'}</p>
          <p className="text-[10px] text-amber-600 font-sans mt-1">Please keep this token handy. You can also track your order status on the Customer Page!</p>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-emerald-100 max-w-md mx-auto text-left space-y-4 shadow-sm font-sans">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">
            Kitchen Receipt
          </div>
          <div className="text-xs text-slate-600 bg-slate-50 border border-slate-100 p-3 rounded-xl space-y-1">
            <p><strong>Customer Name:</strong> {fullName}</p>
            <p><strong>Phone Number:</strong> {phoneNumber}</p>
            <p><strong>Payment Method:</strong> {paymentMethod}</p>
            {paymentMethod !== 'Cash' && (
              <>
                <p className="font-mono text-[10px] text-slate-500 mt-1"><strong>Txn ID:</strong> {paymentTxnId}</p>
                <p className="text-[10px] text-emerald-600 font-bold flex items-center gap-1 mt-0.5">
                  <ShieldCheck size={12} /> SECURED & AUTHORIZED
                </p>
              </>
            )}
          </div>
          <div className="space-y-1.5 border-b border-dashed border-slate-200 pb-3">
            {orderedItems.map((item) => (
              <div key={item.id} className="text-xs text-slate-700 flex justify-between">
                <span>
                  {item.quantity}x {item.pizza.name} ({item.selectedBase.name})
                </span>
                <span className="font-mono">
                  ₹{(item.pizza.price + item.selectedBase.price + item.selectedToppings.reduce((sum, t) => sum + t.price, 0)) * item.quantity}
                </span>
              </div>
            ))}
          </div>
          {orderedDiscount > 0 && (
            <div className="text-xs text-emerald-600 flex justify-between border-b border-dashed border-slate-200 pb-2 mt-2">
              <span>Promo Discount (10% OFF)</span>
              <span className="font-mono">-₹{orderedDiscount}</span>
            </div>
          )}
          <div className="flex justify-between text-xs font-bold text-slate-800">
            <span>Grand Total (incl. GST)</span>
            <span className="font-mono text-emerald-700">₹{orderedGrandTotal}</span>
          </div>
        </div>

        <button
          id="btn-order-another"
          onClick={handleResetCart}
          className="inline-flex items-center gap-2 py-3.5 px-6 rounded-xl font-bold text-xs uppercase tracking-wider bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-md shadow-emerald-600/10"
        >
          <span>Order Again</span>
          <ArrowRight size={14} />
        </button>
      </motion.div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
      {/* Dynamic Left Column: Item List OR Checkout Form */}
      <div className="lg:col-span-2 space-y-6">
        {!isCheckingOut ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-extrabold font-display text-slate-900 tracking-tight flex items-center gap-2">
                <ShoppingCart size={20} className="text-tomato" />
                Your Build Queue ({items.length})
              </h3>
              {items.length > 0 && (
                <button
                  id="btn-clear-cart"
                  onClick={onClear}
                  className="flex items-center gap-1 text-xs font-semibold text-slate-400 hover:text-rose-600 transition"
                >
                  <Trash2 size={13} />
                  Clear Queue
                </button>
              )}
            </div>

            <AnimatePresence mode="popLayout">
              {items.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-white border border-dashed border-slate-200 rounded-[28px] py-16 px-6 text-center text-slate-400 space-y-4"
                >
                  <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-300 mx-auto">
                    <ShoppingCart size={24} />
                  </div>
                  <div className="space-y-1">
                    <p className="font-bold text-slate-800 text-sm">Your cart is currently empty</p>
                    <p className="text-xs text-slate-400 max-w-xs mx-auto">
                      Browse our gourmet pizza menu on the left and start adding custom recipes to your oven queue!
                    </p>
                  </div>
                </motion.div>
              ) : (
                <div className="space-y-4">
                  {items.map((item) => (
                    <CartItem
                      key={item.id}
                      item={item}
                      bases={bases}
                      toppings={toppings}
                      onUpdateBase={onUpdateBase}
                      onUpdateToppings={onUpdateToppings}
                      onUpdateQuantity={onUpdateQuantity}
                      onRemove={onRemove}
                    />
                  ))}
                </div>
              )}
            </AnimatePresence>
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-[28px] p-6 sm:p-8 space-y-6 shadow-sm">
            <div>
              <h3 className="text-xl font-extrabold font-display text-slate-900 tracking-tight">
                Dine-In Checkout Details
              </h3>
              <p className="text-slate-500 text-xs mt-1 leading-relaxed">
                Please provide your contact information and payment method to send this build to the oven.
              </p>
            </div>

            {dbError && (
              <div className="p-4 bg-rose-50 border border-rose-200/80 rounded-2xl flex items-start gap-3 text-rose-950 text-xs font-medium">
                <AlertCircle className="text-rose-500 shrink-0 mt-0.5" size={16} />
                <div className="space-y-1">
                  <p className="font-bold">Database Order Submission Failed</p>
                  <p className="text-rose-700/90 leading-relaxed font-mono text-[10px] bg-white/60 p-2 rounded-lg border border-rose-100 overflow-x-auto">{dbError}</p>
                  <p className="text-rose-600/80 font-sans text-[11px] mt-1.5 leading-relaxed">
                    This error usually indicates that <strong>Row-Level Security (RLS)</strong> is enabled on your Supabase tables but you have not created policies allowing public/anonymous row inserts.
                  </p>
                  <p className="text-rose-600/80 font-sans text-[11px] leading-relaxed">
                    Please open your <strong>Supabase SQL Editor</strong> and ensure you have run the policies from the <strong>Setup Assistant</strong>:
                  </p>
                  <pre className="text-[9px] font-mono text-rose-800 bg-rose-100/50 p-2 rounded-lg border border-rose-200/50 mt-1">
                    CREATE POLICY "Allow public insert for orders" ON public.orders FOR INSERT WITH CHECK (true);
                  </pre>
                </div>
              </div>
            )}

            <div className="space-y-5 font-sans">
              {/* Full Name */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">Full Name</label>
                <input
                  id="input-checkout-name"
                  type="text"
                  value={fullName}
                  onChange={(e) => {
                    const cleaned = e.target.value
                      .replace(/[^a-zA-Z\s]/g, '') // Remove numbers and special characters
                      .replace(/\s+/g, ' ')       // Prevent consecutive spaces
                      .slice(0, 40);              // Max 40 characters
                    setFullName(cleaned);
                  }}
                  placeholder="e.g. Praveen Kumar"
                  className={`block w-full px-4 py-3 bg-slate-50 border rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white transition-all duration-200 ${
                    formErrors.fullName ? 'border-rose-400 focus:border-rose-500 ring-2 ring-rose-500/10' : 'border-slate-200 focus:border-tomato focus:ring-2 focus:ring-tomato/10'
                  }`}
                />
                {formErrors.fullName && (
                  <p className="text-[10px] text-rose-500 font-medium">{formErrors.fullName}</p>
                )}
              </div>

              {/* Phone Number */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="block text-xs font-bold text-slate-700">Phone Number</label>
                  <span className="text-[10px] text-slate-400 font-medium">🇮🇳 Indian mobile numbers only</span>
                </div>
                <input
                  id="input-checkout-phone"
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="e.g. 98765 43210 or +91 98765 43210"
                  className={`block w-full px-4 py-3 bg-slate-50 border rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white transition-all duration-200 ${
                    formErrors.phoneNumber ? 'border-rose-400 focus:border-rose-500 ring-2 ring-rose-500/10' : 'border-slate-200 focus:border-tomato focus:ring-2 focus:ring-tomato/10'
                  }`}
                />
                {formErrors.phoneNumber ? (
                  <p className="text-[10px] text-rose-500 font-medium">{formErrors.phoneNumber}</p>
                ) : (
                  <p className="text-[10px] text-slate-400">Accepts standard 10 digits, +91, 91, or 0 prefixes.</p>
                )}
              </div>

              {/* Payment Method Selector */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700">Payment Method</label>
                <div className="grid grid-cols-3 gap-3">
                  {(['UPI', 'Cash', 'Card'] as const).map((method) => {
                    const isSelected = paymentMethod === method;
                    return (
                      <button
                        key={method}
                        type="button"
                        id={`btn-payment-${method.toLowerCase()}`}
                        onClick={() => setPaymentMethod(method)}
                        className={`flex flex-col items-center justify-center py-3.5 px-4 rounded-xl border transition-all duration-200 ${
                          isSelected
                            ? 'border-tomato bg-tomato/5 text-tomato font-bold shadow-xs'
                            : 'border-slate-200 bg-white hover:border-slate-300 text-slate-600 hover:text-slate-800'
                        }`}
                      >
                        <span className="text-xs font-bold">{method}</span>
                      </button>
                    );
                  })}
                </div>
              </div>


            </div>

            <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
              <button
                id="btn-cancel-checkout"
                type="button"
                onClick={() => setIsCheckingOut(false)}
                className="py-2.5 px-4 rounded-xl font-bold text-xs uppercase tracking-wider bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
              >
                Back to Queue
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Cart Sticky Pricing Summary Card */}
      <div className="bg-white border border-slate-200 rounded-[28px] p-6 space-y-6 sticky top-24 shadow-sm">
        <h3 className="font-bold font-display text-slate-900 text-base">
          Cart Calculations
        </h3>

        <div className="space-y-3.5 border-b border-slate-100 pb-5 text-sm">
          <div className="flex justify-between text-slate-500">
            <span>Subtotal</span>
            <span className="font-mono text-slate-950 font-medium">₹{subtotal}</span>
          </div>
          {isPromoApplied && (
            <div className="flex justify-between text-emerald-600 font-medium">
              <span>Discount (10% OFF)</span>
              <span className="font-mono">-₹{discountAmount}</span>
            </div>
          )}
          <div className="flex justify-between text-slate-500">
            <span>GST Tax (18%)</span>
            <span className="font-mono text-slate-950 font-medium">₹{gstTax}</span>
          </div>
        </div>

        {/* Promo Code Info section */}
        {items.length > 0 && (
          <div className="space-y-2.5 border-b border-slate-100 pb-5">
            <div className="text-xs font-bold text-slate-700">Bulk Order Discount</div>
            {isPromoApplied ? (
              <div className="p-3 bg-emerald-50/85 border border-emerald-500/25 rounded-2xl space-y-1">
                <div className="flex items-center gap-1.5 text-emerald-800 font-bold text-xs">
                  <Check size={14} className="text-emerald-600 stroke-[3]" />
                  <span>10% OFF Auto-Applied!</span>
                </div>
                <p className="text-[10px] text-emerald-700 leading-normal font-sans">
                  Awesome! Since you have ordered <strong>{totalPizzaCount} pizzas</strong> (5 or more), a bulk discount of 10% has been automatically deducted from your subtotal.
                </p>
              </div>
            ) : (
              <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-1">
                <div className="flex items-center gap-1.5 text-slate-700 font-bold text-xs">
                  <AlertCircle size={14} className="text-slate-400" />
                  <span>Bulk Discount Reward</span>
                </div>
                <p className="text-[10px] text-slate-500 leading-normal font-sans">
                  Order <strong>5 or more pizzas</strong> to unlock <strong>10% OFF</strong> your entire cart automatically!
                </p>
                <div className="pt-1 flex items-center justify-between text-[10px] font-mono text-slate-400">
                  <span>Current: {totalPizzaCount} {totalPizzaCount === 1 ? 'pizza' : 'pizzas'}</span>
                  <span className="text-tomato font-bold">Need {5 - totalPizzaCount} more</span>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex justify-between items-baseline">
          <span className="font-bold text-slate-950 text-sm font-sans">Total Price</span>
          <span className="text-2xl font-extrabold text-tomato font-mono">₹{grandTotal}</span>
        </div>

        <button
          id="btn-place-order"
          disabled={items.length === 0 || isPlacing}
          onClick={isCheckingOut ? handlePlaceOrder : () => setIsCheckingOut(true)}
          className="w-full flex items-center justify-center gap-2 py-4 px-4 rounded-xl font-bold text-xs uppercase tracking-wider bg-tomato hover:bg-tomato-hover text-white transition disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-tomato/10"
        >
          {isPlacing ? (
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <span>{isCheckingOut ? 'Confirm & Place Order' : 'Proceed to Checkout'}</span>
              <ArrowRight size={14} />
            </>
          )}
        </button>

        <div className="text-[10px] text-slate-400 leading-relaxed flex gap-2">
          <Sparkles size={14} className="text-tomato shrink-0" />
          <span>Each item is compiled independently so staff can monitor the precise crust and topping build layers in real time.</span>
        </div>
      </div>

      {/* 5. Payment Gateway Simulator Portal */}
      <AnimatePresence>
        {showPaymentModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/80 backdrop-blur-xs z-50 flex items-center justify-center p-4 font-sans overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="w-full max-w-md overflow-hidden rounded-[24px] border border-slate-200 bg-white text-slate-800 shadow-2xl transition-all animate-none"
            >
              {/* Header */}
              <div className="p-5 flex items-center justify-between border-b border-slate-100 bg-slate-50">
                <div className="flex items-center gap-2.5">
                  <span className="text-xs font-black px-2.5 py-1 rounded-lg bg-tomato/10 text-tomato border border-tomato/20">
                    PizzaPay Secure Checkout
                  </span>
                </div>
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="p-1.5 rounded-full transition hover:bg-slate-200 text-slate-500"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Amount Display */}
              <div className="p-5 text-center bg-tomato/5">
                <p className="text-[10px] uppercase font-bold tracking-wider text-tomato/80">Order Amount Payable</p>
                <p className="text-3xl font-black font-mono mt-1 text-tomato">₹{grandTotal}</p>
                <p className="text-[10px] text-slate-500 mt-1 font-mono">Txn ID: {paymentTxnId}</p>
              </div>

              {/* Content Panel */}
              <div className="p-5 space-y-4">
                {paymentError && (
                  <div className="bg-rose-50 border border-rose-150 text-rose-600 text-xs p-3 rounded-xl flex items-start gap-2">
                    <AlertCircle size={16} className="shrink-0 mt-0.5" />
                    <span>{paymentError}</span>
                  </div>
                )}

                {/* STEP 1: ENTER DETAILS */}
                {paymentStep === 'details' && (
                  <div className="space-y-4">
                    {paymentMethod === 'Card' ? (
                      <div className="space-y-3">
                        {/* Cardholder Name */}
                        <div className="space-y-1">
                          <label className="block text-[10px] font-bold uppercase text-slate-600">Cardholder Name</label>
                          <input
                            type="text"
                            placeholder="e.g. Praveen Kumar"
                            value={paymentCardName}
                            onChange={(e) => {
                              setPaymentCardName(e.target.value);
                              if (paymentErrors.cardName) {
                                setPaymentErrors(prev => ({ ...prev, cardName: undefined }));
                              }
                            }}
                            className={`w-full px-4 py-2.5 rounded-xl text-xs border bg-slate-50 text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-tomato ${
                              paymentErrors.cardName ? 'border-rose-300 ring-1 ring-rose-300' : 'border-slate-200'
                            }`}
                          />
                          {paymentErrors.cardName && (
                            <p className="text-[10px] text-rose-500 font-semibold">{paymentErrors.cardName}</p>
                          )}
                        </div>

                        {/* Card Number */}
                        <div className="space-y-1">
                          <label className="block text-[10px] font-bold uppercase text-slate-600">Card Number</label>
                          <div className="relative">
                            <input
                              type="text"
                              maxLength={19}
                              value={paymentCardNo}
                              onChange={(e) => {
                                // Add spaces every 4 characters
                                const v = e.target.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
                                const parts = [];
                                for (let i = 0; i < v.length; i += 4) {
                                  parts.push(v.substring(i, i + 4));
                                }
                                setPaymentCardNo(parts.join(' '));
                                if (paymentErrors.cardNo) {
                                  setPaymentErrors(prev => ({ ...prev, cardNo: undefined }));
                                }
                              }}
                              placeholder="4111 2222 3333 4444"
                              className={`w-full px-4 py-2.5 rounded-xl text-xs border bg-slate-50 text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-tomato ${
                                paymentErrors.cardNo ? 'border-rose-300 ring-1 ring-rose-300' : 'border-slate-200'
                              }`}
                            />
                            <CreditCard size={14} className="absolute right-3.5 top-3.5 opacity-40 text-slate-500" />
                          </div>
                          {paymentErrors.cardNo && (
                            <p className="text-[10px] text-rose-500 font-semibold">{paymentErrors.cardNo}</p>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          {/* Expiry */}
                          <div className="space-y-1">
                            <label className="block text-[10px] font-bold uppercase text-slate-600">Expiry (MM/YY)</label>
                            <input
                              type="text"
                              maxLength={5}
                              placeholder="12/28"
                              value={paymentCardExpiry}
                              onChange={(e) => {
                                let v = e.target.value.replace(/[^0-9]/g, '');
                                if (v.length > 2) {
                                  v = v.substring(0,2) + '/' + v.substring(2,4);
                                }
                                setPaymentCardExpiry(v);
                                if (paymentErrors.cardExpiry) {
                                  setPaymentErrors(prev => ({ ...prev, cardExpiry: undefined }));
                                }
                              }}
                              className={`w-full px-4 py-2.5 rounded-xl text-xs border bg-slate-50 text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-tomato ${
                                paymentErrors.cardExpiry ? 'border-rose-300 ring-1 ring-rose-300' : 'border-slate-200'
                              }`}
                            />
                            {paymentErrors.cardExpiry && (
                              <p className="text-[10px] text-rose-500 font-semibold">{paymentErrors.cardExpiry}</p>
                            )}
                          </div>

                          {/* CVV */}
                          <div className="space-y-1">
                            <label className="block text-[10px] font-bold uppercase text-slate-600">CVV</label>
                            <input
                              type="password"
                              maxLength={4}
                              placeholder="737"
                              value={paymentCardCvv}
                              onChange={(e) => {
                                setPaymentCardCvv(e.target.value.replace(/[^0-9]/g, ''));
                                if (paymentErrors.cardCvv) {
                                  setPaymentErrors(prev => ({ ...prev, cardCvv: undefined }));
                                }
                              }}
                              className={`w-full px-4 py-2.5 rounded-xl text-xs border bg-slate-50 text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-tomato ${
                                paymentErrors.cardCvv ? 'border-rose-300 ring-1 ring-rose-300' : 'border-slate-200'
                              }`}
                            />
                            {paymentErrors.cardCvv && (
                              <p className="text-[10px] text-rose-500 font-semibold">{paymentErrors.cardCvv}</p>
                            )}
                          </div>
                        </div>

                        <div className="pt-2">
                          <button
                            type="button"
                            onClick={() => {
                              const errors: typeof paymentErrors = {};
                              if (!paymentCardName.trim()) {
                                errors.cardName = 'Cardholder Name is required';
                              } else if (paymentCardName.trim().length < 2) {
                                errors.cardName = 'Cardholder Name must be at least 2 characters';
                              }

                              const cleanCardNo = paymentCardNo.replace(/\s+/g, '');
                              if (!cleanCardNo) {
                                errors.cardNo = 'Card Number is required';
                              } else if (!validateLuhn(cleanCardNo)) {
                                errors.cardNo = 'Invalid card number (Luhn check failed)';
                              }

                              if (!paymentCardExpiry) {
                                errors.cardExpiry = 'Expiry Date is required';
                              } else if (!validateExpiry(paymentCardExpiry)) {
                                errors.cardExpiry = 'Invalid or expired date (MM/YY)';
                              }

                              if (!paymentCardCvv) {
                                errors.cardCvv = 'CVV is required';
                              } else if (!/^\d{3,4}$/.test(paymentCardCvv)) {
                                errors.cardCvv = 'CVV must be 3 or 4 digits';
                              }

                              setPaymentErrors(errors);

                              if (Object.keys(errors).length > 0) {
                                setPaymentError('Please correct the validation errors below.');
                                return;
                              }

                              setPaymentError('');
                              setPaymentStep('otp');
                            }}
                            className="w-full py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition bg-tomato hover:bg-tomato-hover text-white shadow-xs"
                          >
                            Proceed to Verify Secure OTP
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* UPI SECTION */
                      <div className="space-y-4">
                        {/* Two Payment Options Toggles */}
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setUpiSubMethod('qr');
                              setPaymentErrors({});
                              setPaymentError('');
                            }}
                            className={`p-3.5 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition text-center ${
                              upiSubMethod === 'qr'
                                ? 'border-tomato bg-tomato/5 text-tomato font-bold'
                                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                            }`}
                          >
                            <QrCode size={20} className={upiSubMethod === 'qr' ? 'text-tomato' : 'text-slate-500'} />
                            <span className="text-xs">Scan QR Code</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setUpiSubMethod('id');
                              setPaymentErrors({});
                              setPaymentError('');
                            }}
                            className={`p-3.5 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition text-center ${
                              upiSubMethod === 'id'
                                ? 'border-tomato bg-tomato/5 text-tomato font-bold'
                                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                            }`}
                          >
                            <Smartphone size={20} className={upiSubMethod === 'id' ? 'text-tomato' : 'text-slate-500'} />
                            <span className="text-xs">Enter UPI ID</span>
                          </button>
                        </div>

                        {upiSubMethod === 'qr' ? (
                          <div className="space-y-4 text-center">
                            <p className="text-xs text-slate-500">
                              Scan the dynamically generated PizzaPay UPI QR code using GPay, PhonePe, Paytm, or BHIM.
                            </p>

                            {/* QR Code Graphic Frame */}
                            <div className="relative p-3 bg-white border border-slate-100 rounded-2xl inline-block shadow-xs mx-auto animate-none">
                              <div className="w-36 h-36 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center relative overflow-hidden">
                                <div className="absolute inset-0 p-3 grid grid-cols-6 grid-rows-6 opacity-85">
                                  {Array.from({ length: 36 }).map((_, i) => (
                                    <div 
                                      key={i} 
                                      className={`rounded-[2px] ${
                                        (i % 2 === 0 && i % 3 === 0) || i < 6 || i % 6 === 0 || i > 30 || i % 6 === 5
                                          ? 'bg-slate-900' 
                                          : 'bg-transparent'
                                      }`} 
                                    />
                                  ))}
                                </div>
                                <div className="w-8 h-8 bg-slate-900 border border-slate-800 rounded-lg z-10 flex items-center justify-center shadow-md animate-none">
                                  <span className="text-tomato font-display font-black text-[10px]">PP</span>
                                </div>
                              </div>
                            </div>

                            {/* Timer */}
                            <div className="text-xs font-mono font-bold flex items-center justify-center gap-1.5 text-tomato">
                              <RefreshCw size={13} className="animate-spin" />
                              QR Expires In: {Math.floor(qrTimer / 60)}:{(qrTimer % 60).toString().padStart(2, '0')}
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                setPaymentError('');
                                setPaymentStep('processing');
                                setTimeout(() => {
                                  setPaymentStep('success');
                                  setTimeout(() => {
                                    setShowPaymentModal(false);
                                    completeOrderPlacement(paymentTxnId);
                                  }, 1500);
                                }, 1800);
                              }}
                              className="w-full py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition bg-tomato hover:bg-tomato-hover text-white shadow-xs"
                            >
                              Simulate Scan Success
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <div className="space-y-1">
                              <label className="block text-[10px] font-bold uppercase text-slate-600">UPI VPA Address ID</label>
                              <input
                                type="text"
                                placeholder="username@bank"
                                value={paymentUpiId}
                                onChange={(e) => {
                                  setPaymentUpiId(e.target.value);
                                  if (paymentErrors.upiId) {
                                    setPaymentErrors(prev => ({ ...prev, upiId: undefined }));
                                  }
                                }}
                                className={`w-full px-4 py-2.5 rounded-xl text-xs border bg-slate-50 text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-tomato ${
                                  paymentErrors.upiId ? 'border-rose-300 ring-1 ring-rose-300' : 'border-slate-200'
                                }`}
                              />
                              {paymentErrors.upiId ? (
                                <p className="text-[10px] text-rose-500 font-semibold">{paymentErrors.upiId}</p>
                              ) : (
                                <p className="text-[9px] text-slate-400 font-medium">e.g. name@upi, username@okhdfcbank</p>
                              )}
                            </div>

                            <div className="pt-2">
                              <button
                                type="button"
                                onClick={() => {
                                  const errors: typeof paymentErrors = {};
                                  const upiPattern = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z0-9.\-_]{2,64}$/;
                                  if (!paymentUpiId.trim()) {
                                    errors.upiId = 'UPI ID is required';
                                  } else if (!upiPattern.test(paymentUpiId.trim())) {
                                    errors.upiId = 'Invalid UPI ID format (e.g. username@bank)';
                                  }

                                  setPaymentErrors(errors);

                                  if (Object.keys(errors).length > 0) {
                                    setPaymentError('Please enter a valid UPI address.');
                                    return;
                                  }

                                  setPaymentError('');
                                  setPaymentStep('processing');
                                  setTimeout(() => {
                                    setPaymentStep('success');
                                    setTimeout(() => {
                                      setShowPaymentModal(false);
                                      completeOrderPlacement(paymentTxnId);
                                    }, 1500);
                                  }, 2000);
                                }}
                                className="w-full py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition bg-tomato hover:bg-tomato-hover text-white shadow-xs"
                              >
                                Request PizzaPay Push Payment
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* STEP 2: OTP VERIFICATION SHEET */}
                {paymentStep === 'otp' && (
                  <div className="space-y-4 text-center">
                    <p className="text-xs text-slate-600">
                      A secured simulation SMS passcode has been sent to your phone ending in{' '}
                      <strong>{phoneNumber.substring(phoneNumber.length - 4) || 'XXXX'}</strong>.
                    </p>
                    
                    <div className="space-y-1 max-w-[180px] mx-auto animate-none">
                      <input
                        type="text"
                        maxLength={6}
                        placeholder="123456"
                        value={paymentOtp}
                        onChange={(e) => setPaymentOtp(e.target.value.replace(/[^0-9]/g, ''))}
                        className="text-center tracking-widest text-lg font-mono w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:outline-none focus:border-tomato focus:bg-white animate-none"
                      />
                    </div>

                    <div className="flex gap-2 pt-2 animate-none">
                      <button
                        type="button"
                        onClick={() => setPaymentStep('details')}
                        className="flex-1 py-2.5 rounded-xl text-xs font-bold transition bg-slate-100 hover:bg-slate-200 text-slate-800 animate-none"
                      >
                        Back
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (!paymentOtp || paymentOtp.length < 4) {
                            setPaymentError('Please enter a valid 4-6 digit OTP passcode');
                            return;
                          }
                          setPaymentError('');
                          setPaymentStep('processing');
                          setTimeout(() => {
                            setPaymentStep('success');
                            setTimeout(() => {
                              setShowPaymentModal(false);
                              completeOrderPlacement(paymentTxnId);
                            }, 1500);
                          }, 2000);
                        }}
                        className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white transition bg-tomato hover:bg-tomato-hover animate-none"
                      >
                        Submit OTP
                      </button>
                    </div>

                    <p className="text-[10px] text-slate-400 font-mono animate-none">Simulate Success: enter any 4-6 digits</p>
                  </div>
                )}

                {/* STEP 3: PROCESSING */}
                {paymentStep === 'processing' && (
                  <div className="py-12 text-center space-y-4 animate-none">
                    <Loader2 size={40} className="mx-auto animate-spin text-tomato" />
                    <div className="space-y-1">
                      <p className="text-xs font-extrabold tracking-wide uppercase text-slate-700">Authorizing Funds...</p>
                      <p className="text-[10px] text-slate-400 leading-relaxed max-w-xs mx-auto">
                        Communicating with the PizzaPay mock terminal to verify credentials and authorize simulated funds safely.
                      </p>
                    </div>
                  </div>
                )}

                {/* STEP 4: SUCCESS */}
                {paymentStep === 'success' && (
                  <div className="py-10 text-center space-y-4 animate-none">
                    <div className="w-14 h-14 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20 animate-none">
                      <Check size={28} className="stroke-[3] animate-none" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-emerald-600">Transaction Successful</p>
                      <p className="text-[10px] text-slate-400 font-mono">ID: {paymentTxnId}</p>
                    </div>
                  </div>
                )}

                {/* STEP 5: FAILED */}
                {paymentStep === 'failed' && (
                  <div className="py-10 text-center space-y-4 animate-none">
                    <div className="w-14 h-14 bg-rose-500 text-white rounded-full flex items-center justify-center mx-auto shadow-lg shadow-rose-500/20 animate-none">
                      <AlertCircle size={28} className="stroke-[3] animate-none" />
                    </div>
                    <div className="space-y-1.5">
                      <p className="text-sm font-bold text-rose-500">Transaction Failed</p>
                      <p className="text-[10px] text-slate-500">{paymentError || 'Payment authorization was rejected.'}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setPaymentStep('details');
                        setPaymentError('');
                      }}
                      className="py-2 px-4 rounded-xl text-xs font-bold text-white bg-tomato hover:bg-tomato-hover animate-none"
                    >
                      Try Again
                    </button>
                  </div>
                )}

              </div>

              {/* Secure Footer */}
              <div className="p-4 text-center text-[10px] text-slate-400 flex items-center justify-center gap-1.5 border-t border-slate-100 bg-slate-50 animate-none">
                <Lock size={11} className="text-emerald-500" />
                <span>PCI-DSS Secured 256-bit Encrypted SSL Gateway Tunnel</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
