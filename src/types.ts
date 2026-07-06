/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 'admin' | 'staff' | 'customer';

export interface Profile {
  id: string;
  role: 'admin' | 'staff';
  full_name: string;
  created_at: string;
}

export interface AuthState {
  user: any | null;
  profile: Profile | null;
  loading: boolean;
  error: string | null;
}

export interface Pizza {
  id: string;
  name: string;
  price: number;
  description: string;
  image: string;
}

export interface PizzaBase {
  id: string;
  name: string;
  price: number;
}

export interface PizzaTopping {
  id: string;
  name: string;
  price: number;
}

export interface CartItem {
  id: string;
  pizza: Pizza;
  quantity: number;
  selectedBase: PizzaBase;
  selectedToppings: PizzaTopping[];
}

