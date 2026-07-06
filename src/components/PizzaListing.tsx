/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Pizza } from '../types';
import { PizzaCard } from './PizzaCard';
import { Search, SlidersHorizontal, Eye } from 'lucide-react';

interface PizzaListingProps {
  pizzas: Pizza[];
  onAddToCart: (pizza: Pizza) => void;
}

export const PizzaListing: React.FC<PizzaListingProps> = ({ pizzas, onAddToCart }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredPizzas = useMemo(() => {
    return pizzas.filter((pizza) => {
      // Name/desc filter
      return (
        pizza.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pizza.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
  }, [pizzas, searchTerm]);

  return (
    <div className="space-y-6">
      {/* Search Bar - Only Control in Toolbar */}
      <div className="flex justify-center w-full">
        <div className="relative w-full max-w-2xl">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
            <Search size={18} />
          </div>
          <input
            id="input-search-pizza"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search our delicious pizzas (e.g. Margherita, Deep Dish, Paneer)..."
            className="block w-full pl-11 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-tomato focus:ring-2 focus:ring-tomato/20 focus:bg-white transition-all shadow-sm"
          />
        </div>
      </div>

      {/* Pizza Grid */}
      {filteredPizzas.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-[28px] py-16 text-center text-slate-400">
          <p className="font-bold text-slate-800 text-sm">No gourmet pizzas matched your filters</p>
          <p className="text-xs text-slate-400 mt-1">Try updating your keywords or category filters above.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredPizzas.map((pizza) => (
            <PizzaCard
              key={pizza.id}
              pizza={pizza}
              onAddToCart={onAddToCart}
            />
          ))}
        </div>
      )}
    </div>
  );
};
