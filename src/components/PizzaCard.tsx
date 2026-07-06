/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Pizza } from '../types';
import { Plus, ShoppingBag } from 'lucide-react';
import { motion } from 'motion/react';

interface PizzaCardProps {
  pizza: Pizza;
  onAddToCart: (pizza: Pizza) => void;
}

export const PizzaCard: React.FC<PizzaCardProps> = ({ pizza, onAddToCart }) => {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-xl hover:shadow-tomato/5 hover:border-tomato/20 transition-all duration-300 flex flex-col justify-between group h-full"
    >
      {/* Pizza Image Block */}
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
        <img
          src={pizza.image}
          alt={pizza.name}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-xs text-slate-900 font-extrabold font-mono text-sm px-3 py-1.5 rounded-full shadow-md border border-slate-100 flex items-center gap-0.5">
          <span className="text-tomato">₹</span>
          <span>{pizza.price}</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-2">
          <h3 className="font-bold font-display text-lg text-slate-900 group-hover:text-tomato transition-colors">
            {pizza.name}
          </h3>
          <p className="text-slate-500 text-xs leading-relaxed font-sans line-clamp-3">
            {pizza.description}
          </p>
        </div>

        {/* Action button */}
        <button
          id={`btn-add-to-cart-${pizza.id}`}
          onClick={() => onAddToCart(pizza)}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider bg-slate-900 text-white hover:bg-tomato transition-all duration-200 shadow-xs"
        >
          <Plus size={15} />
          <span>Add to Cart</span>
        </button>
      </div>
    </motion.div>
  );
};
