/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Pizza, PizzaBase, PizzaTopping } from '../types';
import { supabase } from './supabase';

const PIZZA_DESCRIPTIONS: Record<string, string> = {
  P1: 'Fresh whole-milk mozzarella, sweet tomato herb sauce, aromatic fresh basil leaves, and premium extra virgin olive oil.',
  P2: 'Indulgent deep dish layered with rich buttery crust, thick mozzarella block, loaded meats, and chunky vine-ripened tomato sauce.',
  P3: 'Authentic crumbled feta, premium Kalamata olives, fire-roasted sweet peppers, red onions, and a touch of wild mountain oregano.',
  P4: 'Garden fresh baby spinach, sweet golden corn, roasted garlic cloves, crisp green bell peppers, and vine-matured tomatoes.',
  P5: 'A classic, comforting blend of button mushrooms, golden sweet corn, juicy tomatoes, and crunchy farm-fresh capsicum.',
  P6: 'Generous layers of premium smoky cured beef pepperoni slices, whole-milk mozzarella, and signature tomato reduction.',
  P7: 'Tender fire-grilled hickory chicken breast, caramelized onions, sweet tangy barbecue drizzle, and fresh cilantro.',
  P8: 'Tantalizing spiced cottage cheese (Paneer) tikka cubes, roasted baby onions, crisp capsicum, and a spicy peri-peri finishing drizzle.'
};

const PIZZA_IMAGE_PLACEHOLDER = 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=600&q=80';

// Local storage helper functions
function saveLocal(key: string, data: any) {
  localStorage.setItem(key, JSON.stringify(data));
}

function loadLocal(key: string): any {
  const val = localStorage.getItem(key);
  return val ? JSON.parse(val) : null;
}

export async function loadPizzas(): Promise<Pizza[]> {
  // 1. Try Supabase
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('pizzas')
        .select('*')
        .order('id');
      if (!error && data && data.length > 0) {
        saveLocal('db_pizzas', data);
        return data as Pizza[];
      }
    } catch (e) {
      console.warn('Supabase fetch pizzas failed, falling back to storage/txt', e);
    }
  }

  // 2. Try LocalStorage
  const local = loadLocal('db_pizzas');
  if (local && local.length > 0) {
    return local;
  }

  // 3. Try Text file parsing
  try {
    const response = await fetch('/Types_of_Pizza.txt');
    if (!response.ok) throw new Error('Failed to fetch Types_of_Pizza.txt');
    const text = await response.text();
    
    const parsed = text
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .map(line => {
        const [id, name, priceStr] = line.split(';');
        const price = parseInt(priceStr, 10) || 299;
        return {
          id,
          name,
          price,
          description: PIZZA_DESCRIPTIONS[id] || 'Bespoke custom recipe prepared with fresh artisan dough and signature red sauce.',
          image: PIZZA_IMAGE_PLACEHOLDER
        };
      });
    saveLocal('db_pizzas', parsed);
    return parsed;
  } catch (error) {
    console.error('Error loading pizzas:', error);
    // Fallback static data
    const fallback = [
      { id: 'P1', name: 'Margherita', price: 299, description: PIZZA_DESCRIPTIONS['P1'], image: PIZZA_IMAGE_PLACEHOLDER },
      { id: 'P2', name: 'Chicago Deep Dish', price: 349, description: PIZZA_DESCRIPTIONS['P2'], image: PIZZA_IMAGE_PLACEHOLDER },
      { id: 'P3', name: 'Greek Mediterranean', price: 329, description: PIZZA_DESCRIPTIONS['P3'], image: PIZZA_IMAGE_PLACEHOLDER },
      { id: 'P4', name: 'California Veggie', price: 339, description: PIZZA_DESCRIPTIONS['P4'], image: PIZZA_IMAGE_PLACEHOLDER },
      { id: 'P5', name: 'Farm House', price: 319, description: PIZZA_DESCRIPTIONS['P5'], image: PIZZA_IMAGE_PLACEHOLDER },
      { id: 'P6', name: 'Pepperoni Classic', price: 369, description: PIZZA_DESCRIPTIONS['P6'], image: PIZZA_IMAGE_PLACEHOLDER },
      { id: 'P7', name: 'BBQ Chicken', price: 379, description: PIZZA_DESCRIPTIONS['P7'], image: PIZZA_IMAGE_PLACEHOLDER },
      { id: 'P8', name: 'Paneer Tikka', price: 349, description: PIZZA_DESCRIPTIONS['P8'], image: PIZZA_IMAGE_PLACEHOLDER }
    ];
    saveLocal('db_pizzas', fallback);
    return fallback;
  }
}

export async function loadBases(): Promise<PizzaBase[]> {
  // 1. Try Supabase
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('pizza_bases')
        .select('*')
        .order('id');
      if (!error && data && data.length > 0) {
        saveLocal('db_bases', data);
        return data as PizzaBase[];
      }
    } catch (e) {
      console.warn('Supabase fetch bases failed, falling back to storage/txt', e);
    }
  }

  // 2. Try LocalStorage
  const local = loadLocal('db_bases');
  if (local && local.length > 0) {
    return local;
  }

  // 3. Try Text file parsing
  try {
    const response = await fetch('/Types_of_Base.txt');
    if (!response.ok) throw new Error('Failed to fetch Types_of_Base.txt');
    const text = await response.text();
    
    const parsed = text
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .map(line => {
        const [id, name, priceStr] = line.split(';');
        const price = parseInt(priceStr, 10) || 149;
        return { id, name, price };
      });
    saveLocal('db_bases', parsed);
    return parsed;
  } catch (error) {
    console.error('Error loading bases:', error);
    const fallback = [
      { id: 'B1', name: 'Thin Crust', price: 149 },
      { id: 'B2', name: 'Thick Crust', price: 179 },
      { id: 'B3', name: 'Cheese Burst', price: 229 },
      { id: 'B4', name: 'Whole Wheat', price: 159 },
      { id: 'B5', name: 'Multigrain', price: 169 }
    ];
    saveLocal('db_bases', fallback);
    return fallback;
  }
}

export async function loadToppings(): Promise<PizzaTopping[]> {
  // 1. Try Supabase
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('pizza_toppings')
        .select('*')
        .order('id');
      if (!error && data && data.length > 0) {
        saveLocal('db_toppings', data);
        return data as PizzaTopping[];
      }
    } catch (e) {
      console.warn('Supabase fetch toppings failed, falling back to storage/txt', e);
    }
  }

  // 2. Try LocalStorage
  const local = loadLocal('db_toppings');
  if (local && local.length > 0) {
    return local;
  }

  // 3. Try Text file parsing
  try {
    const response = await fetch('/Types_of_Toppings.txt');
    if (!response.ok) throw new Error('Failed to fetch Types_of_Toppings.txt');
    const text = await response.text();
    
    const parsed = text
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .map(line => {
        const [id, name, priceStr] = line.split(';');
        const price = parseInt(priceStr, 10) || 49;
        return { id, name, price };
      });
    saveLocal('db_toppings', parsed);
    return parsed;
  } catch (error) {
    console.error('Error loading toppings:', error);
    const fallback = [
      { id: 'T1', name: 'Black Olives', price: 49 },
      { id: 'T2', name: 'Extra Cheese', price: 69 },
      { id: 'T3', name: 'Button Mushrooms', price: 49 },
      { id: 'T4', name: 'Green Peppers', price: 39 },
      { id: 'T5', name: 'Jalapenos', price: 39 },
      { id: 'T6', name: 'Sun-Dried Tomatoes', price: 59 },
      { id: 'T7', name: 'Caramelised Onions', price: 49 },
      { id: 'T8', name: 'Sweet Corn', price: 39 },
      { id: 'T9', name: 'Roasted Garlic', price: 49 },
      { id: 'T10', name: 'Peri-Peri Drizzle', price: 59 }
    ];
    saveLocal('db_toppings', fallback);
    return fallback;
  }
}

export async function savePizza(pizza: Pizza): Promise<void> {
  // Save to LocalStorage
  const pizzas = await loadPizzas();
  const index = pizzas.findIndex(p => p.id === pizza.id);
  if (index >= 0) {
    pizzas[index] = pizza;
  } else {
    pizzas.push(pizza);
  }
  saveLocal('db_pizzas', pizzas);

  // Save to Supabase
  if (supabase) {
    try {
      const { error } = await supabase
        .from('pizzas')
        .upsert({
          id: pizza.id,
          name: pizza.name,
          price: pizza.price,
          description: pizza.description,
          image: pizza.image
        });
      if (error) console.error('Supabase upsert pizza failed:', error);
    } catch (e) {
      console.error('Supabase savePizza error:', e);
    }
  }
}

export async function deletePizza(id: string): Promise<void> {
  // Delete from LocalStorage
  const pizzas = await loadPizzas();
  const filtered = pizzas.filter(p => p.id !== id);
  saveLocal('db_pizzas', filtered);

  // Delete from Supabase
  if (supabase) {
    try {
      const { error } = await supabase
        .from('pizzas')
        .delete()
        .eq('id', id);
      if (error) console.error('Supabase delete pizza failed:', error);
    } catch (e) {
      console.error('Supabase deletePizza error:', e);
    }
  }
}

export async function saveBase(base: PizzaBase): Promise<void> {
  // Save to LocalStorage
  const bases = await loadBases();
  const index = bases.findIndex(b => b.id === base.id);
  if (index >= 0) {
    bases[index] = base;
  } else {
    bases.push(base);
  }
  saveLocal('db_bases', bases);

  // Save to Supabase
  if (supabase) {
    try {
      const { error } = await supabase
        .from('pizza_bases')
        .upsert({
          id: base.id,
          name: base.name,
          price: base.price
        });
      if (error) console.error('Supabase upsert base failed:', error);
    } catch (e) {
      console.error('Supabase saveBase error:', e);
    }
  }
}

export async function deleteBase(id: string): Promise<void> {
  // Delete from LocalStorage
  const bases = await loadBases();
  const filtered = bases.filter(b => b.id !== id);
  saveLocal('db_bases', filtered);

  // Delete from Supabase
  if (supabase) {
    try {
      const { error } = await supabase
        .from('pizza_bases')
        .delete()
        .eq('id', id);
      if (error) console.error('Supabase delete base failed:', error);
    } catch (e) {
      console.error('Supabase deleteBase error:', e);
    }
  }
}

export async function saveTopping(topping: PizzaTopping): Promise<void> {
  // Save to LocalStorage
  const toppings = await loadToppings();
  const index = toppings.findIndex(t => t.id === topping.id);
  if (index >= 0) {
    toppings[index] = topping;
  } else {
    toppings.push(topping);
  }
  saveLocal('db_toppings', toppings);

  // Save to Supabase
  if (supabase) {
    try {
      const { error } = await supabase
        .from('pizza_toppings')
        .upsert({
          id: topping.id,
          name: topping.name,
          price: topping.price
        });
      if (error) console.error('Supabase upsert topping failed:', error);
    } catch (e) {
      console.error('Supabase saveTopping error:', e);
    }
  }
}

export async function deleteTopping(id: string): Promise<void> {
  // Delete from LocalStorage
  const toppings = await loadToppings();
  const filtered = toppings.filter(t => t.id !== id);
  saveLocal('db_toppings', filtered);

  // Delete from Supabase
  if (supabase) {
    try {
      const { error } = await supabase
        .from('pizza_toppings')
        .delete()
        .eq('id', id);
      if (error) console.error('Supabase delete topping failed:', error);
    } catch (e) {
      console.error('Supabase deleteTopping error:', e);
    }
  }
}

export async function resetToTextFiles(): Promise<void> {
  // Clear local storage overrides
  localStorage.removeItem('db_pizzas');
  localStorage.removeItem('db_bases');
  localStorage.removeItem('db_toppings');

  // Load fresh from text files
  const responseP = await fetch('/Types_of_Pizza.txt');
  let pizzas: Pizza[] = [];
  if (responseP.ok) {
    const text = await responseP.text();
    pizzas = text
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .map(line => {
        const [id, name, priceStr] = line.split(';');
        const price = parseInt(priceStr, 10) || 299;
        return {
          id,
          name,
          price,
          description: PIZZA_DESCRIPTIONS[id] || 'Bespoke custom recipe prepared with fresh artisan dough and signature red sauce.',
          image: PIZZA_IMAGE_PLACEHOLDER
        };
      });
  }

  const responseB = await fetch('/Types_of_Base.txt');
  let bases: PizzaBase[] = [];
  if (responseB.ok) {
    const text = await responseB.text();
    bases = text
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .map(line => {
        const [id, name, priceStr] = line.split(';');
        const price = parseInt(priceStr, 10) || 149;
        return { id, name, price };
      });
  }

  const responseT = await fetch('/Types_of_Toppings.txt');
  let toppings: PizzaTopping[] = [];
  if (responseT.ok) {
    const text = await responseT.text();
    toppings = text
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .map(line => {
        const [id, name, priceStr] = line.split(';');
        const price = parseInt(priceStr, 10) || 49;
        return { id, name, price };
      });
  }

  saveLocal('db_pizzas', pizzas);
  saveLocal('db_bases', bases);
  saveLocal('db_toppings', toppings);

  // If Supabase is connected, write them all
  if (supabase) {
    try {
      for (const p of pizzas) {
        await supabase.from('pizzas').upsert({
          id: p.id,
          name: p.name,
          price: p.price,
          description: p.description,
          image: p.image
        });
      }
      for (const b of bases) {
        await supabase.from('pizza_bases').upsert({
          id: b.id,
          name: b.name,
          price: b.price
        });
      }
      for (const t of toppings) {
        await supabase.from('pizza_toppings').upsert({
          id: t.id,
          name: t.name,
          price: t.price
        });
      }
    } catch (e) {
      console.error('Error seeding Supabase on reset:', e);
    }
  }
}

export async function uploadTableData(
  tableType: 'pizzas' | 'bases' | 'toppings',
  fileContent: string
): Promise<{ success: boolean; rowsParsed: number; error?: string }> {
  try {
    const lines = fileContent
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0 && !line.startsWith('#'));

    // Validate all lines first
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const parts = line.split(';');
      if (parts.length < 3) {
        throw new Error(`Validation Error on Line ${i + 1}: Line must have at least 3 parts (ID;Name;Price) separated by semicolons.`);
      }

      const id = parts[0]?.trim();
      const name = parts[1]?.trim();
      const priceStr = parts[2]?.trim();

      if (!id) {
        throw new Error(`Validation Error on Line ${i + 1}: Item number/ID is required.`);
      }

      // 1. Entering a price number instead of an item number
      if (/^\d+$/.test(id)) {
        throw new Error(`Validation Error on Line ${i + 1}: Entered a price number "${id}" instead of a valid item number (e.g. P1, B1, T1).`);
      }

      // 2. Missing price field
      if (priceStr === undefined || priceStr === '') {
        throw new Error(`Validation Error on Line ${i + 1}: Price field is missing for item "${name || id}".`);
      }

      if (isNaN(Number(priceStr))) {
        throw new Error(`Validation Error on Line ${i + 1}: Invalid price "${priceStr}" for item "${name || id}".`);
      }
    }

    if (tableType === 'pizzas') {
      const parsedPizzas: Pizza[] = lines.map(line => {
        const [id, name, priceStr, desc, img] = line.split(';');
        const price = parseInt(priceStr, 10) || 299;
        return {
          id: id.trim(),
          name: name.trim(),
          price,
          description: desc ? desc.trim() : (PIZZA_DESCRIPTIONS[id.trim()] || 'Bespoke custom recipe prepared with fresh artisan dough and signature red sauce.'),
          image: img ? img.trim() : PIZZA_IMAGE_PLACEHOLDER
        };
      });

      const existing = await loadPizzas();
      for (const p of parsedPizzas) {
        const idx = existing.findIndex(ex => ex.id === p.id);
        if (idx >= 0) existing[idx] = p;
        else existing.push(p);
      }
      saveLocal('db_pizzas', existing);

      if (supabase) {
        const { error } = await supabase
          .from('pizzas')
          .upsert(parsedPizzas.map(p => ({
            id: p.id,
            name: p.name,
            price: p.price,
            description: p.description,
            image: p.image
          })));
        if (error) throw error;
      }
      return { success: true, rowsParsed: parsedPizzas.length };

    } else if (tableType === 'bases') {
      const parsedBases: PizzaBase[] = lines.map(line => {
        const [id, name, priceStr] = line.split(';');
        const price = parseInt(priceStr, 10) || 149;
        return {
          id: id.trim(),
          name: name.trim(),
          price
        };
      });

      const existing = await loadBases();
      for (const b of parsedBases) {
        const idx = existing.findIndex(ex => ex.id === b.id);
        if (idx >= 0) existing[idx] = b;
        else existing.push(b);
      }
      saveLocal('db_bases', existing);

      if (supabase) {
        const { error } = await supabase
          .from('pizza_bases')
          .upsert(parsedBases.map(b => ({
            id: b.id,
            name: b.name,
            price: b.price
          })));
        if (error) throw error;
      }
      return { success: true, rowsParsed: parsedBases.length };

    } else if (tableType === 'toppings') {
      const parsedToppings: PizzaTopping[] = lines.map(line => {
        const [id, name, priceStr] = line.split(';');
        const price = parseInt(priceStr, 10) || 49;
        return {
          id: id.trim(),
          name: name.trim(),
          price
        };
      });

      const existing = await loadToppings();
      for (const t of parsedToppings) {
        const idx = existing.findIndex(ex => ex.id === t.id);
        if (idx >= 0) existing[idx] = t;
        else existing.push(t);
      }
      saveLocal('db_toppings', existing);

      if (supabase) {
        const { error } = await supabase
          .from('pizza_toppings')
          .upsert(parsedToppings.map(t => ({
            id: t.id,
            name: t.name,
            price: t.price
          })));
        if (error) throw error;
      }
      return { success: true, rowsParsed: parsedToppings.length };
    }

    throw new Error('Invalid table type');
  } catch (err: any) {
    console.error('File parse/upload error:', err);
    return { success: false, rowsParsed: 0, error: err.message || 'Failed to parse file or communicate with database.' };
  }
}
