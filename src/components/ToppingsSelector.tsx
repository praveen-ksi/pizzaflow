/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { PizzaTopping } from '../types';
import { Check } from 'lucide-react';

interface ToppingsSelectorProps {
  toppings: PizzaTopping[];
  selectedToppings: PizzaTopping[];
  onChange: (toppings: PizzaTopping[]) => void;
}

export const ToppingsSelector: React.FC<ToppingsSelectorProps> = ({
  toppings,
  selectedToppings,
  onChange,
}) => {
  const handleToggle = (topping: PizzaTopping) => {
    const isSelected = selectedToppings.some((t) => t.id === topping.id);
    if (isSelected) {
      onChange(selectedToppings.filter((t) => t.id !== topping.id));
    } else {
      onChange([...selectedToppings, topping]);
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-[10px] font-bold text-slate-400 font-mono tracking-widest uppercase">
        Choose Gourmet Toppings (Multi-Select)
      </label>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {toppings.map((topping) => {
          const isSelected = selectedToppings.some((t) => t.id === topping.id);
          return (
            <button
              key={topping.id}
              type="button"
              id={`btn-select-topping-${topping.id}`}
              onClick={() => handleToggle(topping)}
              className={`flex items-center justify-between p-2.5 rounded-xl border text-left transition-all duration-200 ${
                isSelected
                  ? 'border-tomato bg-tomato/5 shadow-2xs'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div className="flex flex-col">
                <span className={`text-[11px] font-semibold font-sans ${isSelected ? 'text-tomato font-bold' : 'text-slate-800'}`}>
                  {topping.name}
                </span>
                <span className="text-[10px] font-mono text-slate-400 mt-0.5">
                  +₹{topping.price}
                </span>
              </div>
              {isSelected && (
                <div className="w-4 h-4 rounded-full bg-tomato flex items-center justify-center text-white shrink-0 ml-1">
                  <Check size={10} strokeWidth={3} />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
