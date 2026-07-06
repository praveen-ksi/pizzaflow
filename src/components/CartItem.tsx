/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { CartItem as CartItemType, PizzaBase, PizzaTopping } from '../types';
import { BaseSelector } from './BaseSelector';
import { ToppingsSelector } from './ToppingsSelector';
import { Trash2, ChevronDown, ChevronUp, Sliders, Layers } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CartItemProps {
  item: CartItemType;
  bases: PizzaBase[];
  toppings: PizzaTopping[];
  onUpdateBase: (itemId: string, base: PizzaBase) => void;
  onUpdateToppings: (itemId: string, toppings: PizzaTopping[]) => void;
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onRemove: (itemId: string) => void;
}

export const CartItem: React.FC<CartItemProps> = ({
  item,
  bases,
  toppings,
  onUpdateBase,
  onUpdateToppings,
  onUpdateQuantity,
  onRemove,
}) => {
  const [isCustomizing, setIsCustomizing] = useState(false);

  // Calculate individual pizza price
  const basePrice = item.pizza.price;
  const crustPrice = item.selectedBase.price;
  const toppingsPrice = item.selectedToppings.reduce((sum, t) => sum + t.price, 0);
  const singlePizzaPrice = basePrice + crustPrice + toppingsPrice;
  const totalPrice = singlePizzaPrice * item.quantity;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs relative"
    >
      {/* Item summary bar */}
      <div className="p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-50 shrink-0 border border-slate-100">
            <img
              src={item.pizza.image}
              alt={item.pizza.name}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="space-y-1">
            <h4 className="font-bold text-slate-900 font-display text-sm sm:text-base">
              {item.pizza.name}
            </h4>
            <div className="text-xs text-slate-500 font-sans flex flex-wrap gap-x-2 gap-y-1">
              <span className="font-semibold text-tomato bg-tomato/5 px-2 py-0.5 rounded-md border border-tomato/10 text-[10px] uppercase font-mono">
                {item.selectedBase.name}
              </span>
              {item.selectedToppings.length > 0 ? (
                <span className="text-slate-400">
                  with {item.selectedToppings.map(t => t.name).join(', ')}
                </span>
              ) : (
                <span className="text-slate-400 italic">No extra toppings selected</span>
              )}
            </div>
            {/* Price details breakdown */}
            <div className="text-[10px] font-mono text-slate-400 mt-1">
              ₹{basePrice} base + ₹{crustPrice} crust + ₹{toppingsPrice} toppings = ₹{singlePizzaPrice} each
            </div>
          </div>
        </div>

        {/* Action controllers */}
        <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 pt-3 sm:pt-0">
          {/* Quantity Controls */}
          <div className="flex items-center bg-slate-100 rounded-xl p-1 border border-slate-200/60">
            <button
              id={`btn-quantity-dec-${item.id}`}
              onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
              className="w-8 h-8 flex items-center justify-center text-slate-500 hover:text-slate-900 font-bold rounded-lg hover:bg-white transition"
            >
              -
            </button>
            <span className="w-8 text-center text-xs font-bold font-mono text-slate-800">
              {item.quantity}
            </span>
            <button
              id={`btn-quantity-inc-${item.id}`}
              onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
              className="w-8 h-8 flex items-center justify-center text-slate-500 hover:text-slate-900 font-bold rounded-lg hover:bg-white transition"
            >
              +
            </button>
          </div>

          {/* Subtotal */}
          <div className="text-right shrink-0">
            <div className="text-xs text-slate-400 font-mono">Subtotal</div>
            <div className="font-bold text-slate-900 text-base font-mono">
              ₹{totalPrice}
            </div>
          </div>

          {/* Control actions */}
          <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200">
            <button
              id={`btn-toggle-customize-${item.id}`}
              onClick={() => setIsCustomizing(!isCustomizing)}
              className={`p-2 rounded-xl border transition ${
                isCustomizing
                  ? 'bg-tomato/5 border-tomato text-tomato'
                  : 'bg-white border-slate-200 hover:border-slate-300 text-slate-500 hover:text-slate-900'
              }`}
              title="Customize Crust & Toppings"
            >
              <Sliders size={16} />
            </button>
            <button
              id={`btn-remove-item-${item.id}`}
              onClick={() => onRemove(item.id)}
              className="p-2 rounded-xl bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-slate-200 hover:border-rose-200 transition"
              title="Remove Pizza"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Expandable Customization panel */}
      <AnimatePresence>
        {isCustomizing && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="border-t border-slate-200/60 bg-slate-50/50 overflow-hidden"
          >
            <div className="p-6 space-y-6">
              <BaseSelector
                bases={bases}
                selectedBase={item.selectedBase}
                onChange={(base) => onUpdateBase(item.id, base)}
              />
              <ToppingsSelector
                toppings={toppings}
                selectedToppings={item.selectedToppings}
                onChange={(toppings) => onUpdateToppings(item.id, toppings)}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
