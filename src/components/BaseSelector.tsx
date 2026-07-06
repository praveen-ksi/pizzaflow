/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { PizzaBase } from '../types';

interface BaseSelectorProps {
  bases: PizzaBase[];
  selectedBase: PizzaBase;
  onChange: (base: PizzaBase) => void;
}

export const BaseSelector: React.FC<BaseSelectorProps> = ({ bases, selectedBase, onChange }) => {
  return (
    <div className="space-y-2">
      <label className="block text-[10px] font-bold text-slate-400 font-mono tracking-widest uppercase">
        Select Crust / Base
      </label>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {bases.map((base) => {
          const isSelected = base.id === selectedBase.id;
          return (
            <button
              key={base.id}
              type="button"
              id={`btn-select-base-${base.id}`}
              onClick={() => onChange(base)}
              className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all duration-200 ${
                isSelected
                  ? 'border-tomato bg-tomato/5 shadow-2xs'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <span className={`text-xs font-bold font-sans ${isSelected ? 'text-tomato' : 'text-slate-800'}`}>
                {base.name}
              </span>
              <span className="text-[10px] font-mono text-slate-400 mt-1">
                +₹{base.price}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
