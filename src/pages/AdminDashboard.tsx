/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  LogOut,
  LayoutDashboard,
  Shield,
  Users,
  Pizza,
  ChefHat,
  Activity,
  Plus,
  Edit2,
  Trash2,
  RefreshCw,
  Check,
  X,
  FileText,
  Sliders,
  Database,
  Upload
} from 'lucide-react';
import { SetupAssistant } from '../components/SetupAssistant';
import { OrdersDashboard } from '../components/OrdersDashboard';
import { motion, AnimatePresence } from 'motion/react';
import {
  loadPizzas,
  loadBases,
  loadToppings,
  savePizza,
  deletePizza,
  saveBase,
  deleteBase,
  saveTopping,
  deleteTopping,
  resetToTextFiles,
  uploadTableData
} from '../lib/dataLoader';
import { Pizza as PizzaType, PizzaBase as BaseType, PizzaTopping as ToppingType } from '../types';

export const AdminDashboard: React.FC = () => {
  const { user, profile, signOut, isDemoMode } = useAuth();
  
  // Tab states: 'overview' | 'pizzas' | 'bases' | 'toppings' | 'data-import'
  const [activeTab, setActiveTab] = useState<'overview' | 'pizzas' | 'bases' | 'toppings' | 'data-import'>('overview');
  
  // Table states
  const [pizzas, setPizzas] = useState<PizzaType[]>([]);
  const [bases, setBases] = useState<BaseType[]>([]);
  const [toppings, setToppingList] = useState<ToppingType[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form states for creating & editing
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Input form templates
  const [pizzaForm, setPizzaForm] = useState({ id: '', name: '', price: 0, description: '', image: '' });
  const [baseForm, setBaseForm] = useState({ id: '', name: '', price: 0 });
  const [toppingForm, setToppingForm] = useState({ id: '', name: '', price: 0 });

  // Data Import states
  const [importTable, setImportTable] = useState<'pizzas' | 'bases' | 'toppings'>('pizzas');
  const [importText, setImportText] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [importResult, setImportResult] = useState<{ success: boolean; text: string } | null>(null);
  const [importPreview, setImportPreview] = useState<any[]>([]);

  const reloadData = async () => {
    setLoading(true);
    try {
      const [loadedPizzas, loadedBases, loadedToppings] = await Promise.all([
        loadPizzas(),
        loadBases(),
        loadToppings(),
      ]);
      setPizzas(loadedPizzas);
      setBases(loadedBases);
      setToppingList(loadedToppings);
    } catch (e) {
      console.error(e);
      setMessage({ type: 'error', text: 'Failed to query database tables.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reloadData();
  }, []);

  // Live Parse effect
  useEffect(() => {
    if (!importText.trim()) {
      setImportPreview([]);
      return;
    }
    try {
      const lines = importText
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0 && !line.startsWith('#'));

      const parsed = lines.map(line => {
        const parts = line.split(';');
        if (importTable === 'pizzas') {
          const [id, name, priceStr, desc, img] = parts;
          return {
            id: id?.trim() || '?',
            name: name?.trim() || '?',
            price: parseInt(priceStr, 10) || 0,
            description: desc?.trim() || '',
            image: img?.trim() || ''
          };
        } else {
          const [id, name, priceStr] = parts;
          return {
            id: id?.trim() || '?',
            name: name?.trim() || '?',
            price: parseInt(priceStr, 10) || 0
          };
        }
      });
      setImportPreview(parsed);
    } catch (e) {
      setImportPreview([]);
    }
  }, [importText, importTable]);

  const handleLoadDefaultText = async (type: 'pizzas' | 'bases' | 'toppings') => {
    setImportTable(type);
    setLoading(true);
    try {
      const filename = type === 'pizzas'
        ? '/Types_of_Pizza.txt'
        : type === 'bases'
          ? '/Types_of_Base.txt'
          : '/Types_of_Toppings.txt';
      const response = await fetch(filename);
      if (!response.ok) throw new Error(`Could not fetch ${filename}`);
      const text = await response.text();
      setImportText(text);
      setImportResult(null);
    } catch (err: any) {
      setImportResult({ success: false, text: `Failed to load default file: ${err.message}` });
    } finally {
      setLoading(false);
    }
  };

  const handleImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importText.trim()) {
      setImportResult({ success: false, text: 'Please upload a file or paste configuration data first.' });
      return;
    }
    setLoading(true);
    setImportResult(null);
    try {
      const res = await uploadTableData(importTable, importText);
      if (res.success) {
        setImportResult({
          success: true,
          text: `Successfully uploaded & synchronized ${res.rowsParsed} records inside the "${importTable}" table!`
        });
        await reloadData();
      } else {
        setImportResult({ success: false, text: res.error || 'Failed to import data.' });
      }
    } catch (err: any) {
      setImportResult({ success: false, text: err.message || 'An unexpected error occurred during database upload.' });
    } finally {
      setLoading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file: File) => {
    const name = file.name.toLowerCase();
    if (name.includes('pizza')) {
      setImportTable('pizzas');
    } else if (name.includes('base') || name.includes('crust')) {
      setImportTable('bases');
    } else if (name.includes('topping')) {
      setImportTable('toppings');
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (text) {
        setImportText(text);
        setImportResult(null);
      }
    };
    reader.readAsText(file);
  };

  // Sync / Reset to Text Files
  const handleSyncTextFiles = async () => {
    if (!window.confirm('This will synchronize your database tables with the raw text files (Types_of_Pizza.txt, etc.), overwriting any conflicts. Continue?')) {
      return;
    }
    setLoading(true);
    try {
      await resetToTextFiles();
      await reloadData();
      setMessage({ type: 'success', text: 'Tables seeded & synced with text files successfully!' });
    } catch (e) {
      console.error(e);
      setMessage({ type: 'error', text: 'Seeding from text files failed.' });
    } finally {
      setLoading(false);
    }
  };

  // --- PIZZAS CRUD ---
  const handleAddPizzaClick = () => {
    setEditingId(null);
    setPizzaForm({
      id: `P${pizzas.length + 1}`,
      name: '',
      price: 299,
      description: '',
      image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=600&q=80'
    });
    setIsAddingNew(true);
  };

  const handleEditPizza = (pizza: PizzaType) => {
    setEditingId(pizza.id);
    setPizzaForm({
      id: pizza.id,
      name: pizza.name,
      price: pizza.price,
      description: pizza.description || '',
      image: pizza.image || ''
    });
    setIsAddingNew(false);
  };

  const handleSavePizzaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pizzaForm.id.trim() || !pizzaForm.name.trim() || pizzaForm.price <= 0) {
      setMessage({ type: 'error', text: 'Valid ID, Name, and positive Price are required.' });
      return;
    }
    setLoading(true);
    try {
      await savePizza({
        id: pizzaForm.id.trim(),
        name: pizzaForm.name.trim(),
        price: Number(pizzaForm.price),
        description: pizzaForm.description.trim(),
        image: pizzaForm.image.trim()
      });
      await reloadData();
      setMessage({ type: 'success', text: `Saved pizza recipe "${pizzaForm.name}" successfully!` });
      setIsAddingNew(false);
      setEditingId(null);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to write pizza.' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePizzaItem = async (id: string) => {
    if (!window.confirm('Are you sure you want to remove this pizza?')) return;
    setLoading(true);
    try {
      await deletePizza(id);
      await reloadData();
      setMessage({ type: 'success', text: 'Pizza recipe removed.' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to delete pizza.' });
    } finally {
      setLoading(false);
    }
  };

  // --- BASES CRUD ---
  const handleAddBaseClick = () => {
    setEditingId(null);
    setBaseForm({
      id: `B${bases.length + 1}`,
      name: '',
      price: 149
    });
    setIsAddingNew(true);
  };

  const handleEditBase = (base: BaseType) => {
    setEditingId(base.id);
    setBaseForm({
      id: base.id,
      name: base.name,
      price: base.price
    });
    setIsAddingNew(false);
  };

  const handleSaveBaseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!baseForm.id.trim() || !baseForm.name.trim() || baseForm.price <= 0) {
      setMessage({ type: 'error', text: 'Valid ID, Name, and positive Price are required.' });
      return;
    }
    setLoading(true);
    try {
      await saveBase({
        id: baseForm.id.trim(),
        name: baseForm.name.trim(),
        price: Number(baseForm.price)
      });
      await reloadData();
      setMessage({ type: 'success', text: `Saved pizza base "${baseForm.name}" successfully!` });
      setIsAddingNew(false);
      setEditingId(null);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to write pizza base.' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBaseItem = async (id: string) => {
    if (!window.confirm('Are you sure you want to remove this base?')) return;
    setLoading(true);
    try {
      await deleteBase(id);
      await reloadData();
      setMessage({ type: 'success', text: 'Crust base removed.' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to delete base.' });
    } finally {
      setLoading(false);
    }
  };

  // --- TOPPINGS CRUD ---
  const handleAddToppingClick = () => {
    setEditingId(null);
    setToppingForm({
      id: `T${toppings.length + 1}`,
      name: '',
      price: 49
    });
    setIsAddingNew(true);
  };

  const handleEditTopping = (topping: ToppingType) => {
    setEditingId(topping.id);
    setToppingForm({
      id: topping.id,
      name: topping.name,
      price: topping.price
    });
    setIsAddingNew(false);
  };

  const handleSaveToppingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!toppingForm.id.trim() || !toppingForm.name.trim() || toppingForm.price <= 0) {
      setMessage({ type: 'error', text: 'Valid ID, Name, and positive Price are required.' });
      return;
    }
    setLoading(true);
    try {
      await saveTopping({
        id: toppingForm.id.trim(),
        name: toppingForm.name.trim(),
        price: Number(toppingForm.price)
      });
      await reloadData();
      setMessage({ type: 'success', text: `Saved topping "${toppingForm.name}" successfully!` });
      setIsAddingNew(false);
      setEditingId(null);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to write topping.' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteToppingItem = async (id: string) => {
    if (!window.confirm('Are you sure you want to remove this topping?')) return;
    setLoading(true);
    try {
      await deleteTopping(id);
      await reloadData();
      setMessage({ type: 'success', text: 'Topping removed.' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to delete topping.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-warm-gray font-sans text-slate-800 selection:bg-tomato/10 selection:text-tomato">
      {/* Navbar */}
      <header className="border-b border-slate-200 bg-white/85 backdrop-blur-md sticky top-0 z-10 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-tomato rounded-xl flex items-center justify-center shadow-md shadow-tomato/20">
              <span className="text-white font-black text-lg">P</span>
            </div>
            <span className="text-xl font-bold font-display tracking-tight text-slate-900">
              Pizza<span className="text-tomato">Flow</span>
              <span className="text-[10px] font-mono font-bold bg-tomato/5 text-tomato border border-tomato/10 px-2.5 py-0.5 rounded ml-2.5">
                ADMIN CONTROL
              </span>
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex flex-col text-right text-xs">
              <span className="text-slate-900 font-bold">{profile?.full_name || 'Admin'}</span>
              <span className="text-slate-400 font-mono text-[10px]">{user?.email}</span>
            </div>
            <button
              id="btn-admin-logout"
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
        
        {/* Banner Card */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-tomato to-rose-700 border border-tomato/10 rounded-3xl p-8 text-white relative overflow-hidden shadow-lg shadow-tomato/10"
        >
          <div className="absolute bottom-[-100px] right-[-100px] w-[300px] h-[300px] bg-white/5 rounded-full pointer-events-none" />
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2.5 text-rose-200 text-xs font-bold tracking-wider font-mono">
                <Shield size={15} />
                ENTERPRISE CONTROL PLANE
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight font-display text-white">
                Welcome Back, {profile?.full_name || 'Chef'}!
              </h1>
              <p className="text-white/90 text-sm mt-1.5 max-w-xl leading-relaxed">
                The PizzaFlow administrative dashboard is connected. Manage configuration tables (pizzas, bases, toppings) directly and update user roles.
              </p>
            </div>
            
            <div className="flex flex-wrap gap-2 font-mono text-xs text-white">
              <div className="bg-black/15 px-3 py-1.5 rounded-lg border border-white/10">
                <span className="opacity-75">ROLE: </span>
                <span className="font-bold">ADMIN</span>
              </div>
              <div className="bg-black/15 px-3 py-1.5 rounded-lg border border-white/10">
                <span className="opacity-75">ENVIRONMENT: </span>
                <span className="font-bold">
                  {isDemoMode ? 'SANDBOX' : 'PRODUCTION'}
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Global Alerts / Messages */}
        <AnimatePresence>
          {message && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`p-4 rounded-xl text-xs font-semibold flex items-center justify-between shadow-xs ${
                message.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-100'
                  : 'bg-rose-50 text-rose-800 border border-rose-100'
              }`}
            >
              <span>{message.text}</span>
              <button onClick={() => setMessage(null)} className="hover:opacity-70 p-1">
                <X size={14} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tab Controls Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-1">
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
            {[
              { id: 'overview', label: 'System Overview', icon: LayoutDashboard },
              { id: 'pizzas', label: 'Gourmet Pizzas', icon: Pizza },
              { id: 'bases', label: 'Crust Bases', icon: ChefHat },
              { id: 'toppings', label: 'Toppings Manager', icon: Sliders },
              { id: 'data-import', label: 'Data Import API', icon: Database }
            ].map((tab) => {
              const TabIcon = tab.icon;
              const isSelected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  id={`btn-tab-${tab.id}`}
                  onClick={() => {
                    setActiveTab(tab.id as any);
                    setIsAddingNew(false);
                    setEditingId(null);
                  }}
                  className={`flex items-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-200 ${
                    isSelected
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-500 hover:text-slate-800 hover:border-slate-300'
                  }`}
                >
                  <TabIcon size={14} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Sync from .txt Files Action */}
            <button
              id="btn-sync-txt"
              onClick={handleSyncTextFiles}
              className="flex items-center gap-1.5 py-2 px-3.5 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 hover:border-slate-300 hover:shadow-xs transition duration-200"
            >
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
              Sync Text Files
            </button>
          </div>
        </div>

        {/* Dynamic Workspace Panels */}
        <div className="space-y-6">
          
          {/* TAB: SYSTEM OVERVIEW (ORDERS DASHBOARD & PIZZA SALES ANALYSIS) */}
          {activeTab === 'overview' && (
            <OrdersDashboard
              onSwitchTab={(tabId) => {
                setActiveTab(tabId);
                setIsAddingNew(false);
                setEditingId(null);
              }}
              pizzasCount={pizzas.length}
              basesCount={bases.length}
              toppingsCount={toppings.length}
            />
          )}

          {/* TAB: GOURMET PIZZAS */}
          {activeTab === 'pizzas' && (
            <div className="bg-white border border-slate-200 rounded-[28px] p-6 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900 font-display">Gourmet Pizzas List</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Manage recipe templates available for customers in the storefront.</p>
                </div>
                {!isAddingNew && editingId === null && (
                  <button
                    id="btn-add-pizza"
                    onClick={handleAddPizzaClick}
                    className="flex items-center gap-1.5 py-2 px-4 rounded-xl text-xs font-bold text-white bg-tomato hover:bg-tomato-hover shadow-md shadow-tomato/10 transition"
                  >
                    <Plus size={14} />
                    Add Recipe
                  </button>
                )}
              </div>

              {/* Edit or Add Form */}
              {(isAddingNew || editingId !== null) && (
                <form onSubmit={handleSavePizzaSubmit} className="bg-slate-50 border border-slate-200 p-5 rounded-2xl space-y-4 font-sans">
                  <h4 className="text-xs font-extrabold font-mono uppercase tracking-wider text-tomato">
                    {isAddingNew ? 'Create New Pizza Recipe' : `Edit Recipe (ID: ${editingId})`}
                  </h4>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Pizza ID</label>
                      <input
                        id="input-pizza-id"
                        type="text"
                        disabled={editingId !== null}
                        value={pizzaForm.id}
                        onChange={(e) => setPizzaForm({ ...pizzaForm, id: e.target.value })}
                        placeholder="e.g. P9"
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-tomato disabled:bg-slate-100 disabled:text-slate-400 font-mono"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-slate-700 mb-1">Name</label>
                      <input
                        id="input-pizza-name"
                        type="text"
                        value={pizzaForm.name}
                        onChange={(e) => setPizzaForm({ ...pizzaForm, name: e.target.value })}
                        placeholder="e.g. Spicy Peperone"
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-tomato"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Base Price (₹)</label>
                      <input
                        id="input-pizza-price"
                        type="number"
                        value={pizzaForm.price}
                        onChange={(e) => setPizzaForm({ ...pizzaForm, price: Number(e.target.value) })}
                        placeholder="e.g. 299"
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-tomato"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-slate-700 mb-1">Image URL</label>
                      <input
                        id="input-pizza-image"
                        type="text"
                        value={pizzaForm.image}
                        onChange={(e) => setPizzaForm({ ...pizzaForm, image: e.target.value })}
                        placeholder="URL to photo"
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-tomato font-mono text-[10px]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Description</label>
                    <textarea
                      id="input-pizza-desc"
                      value={pizzaForm.description}
                      onChange={(e) => setPizzaForm({ ...pizzaForm, description: e.target.value })}
                      placeholder="e.g. Fresh slices, hot oregano, baked on request..."
                      rows={2}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-tomato"
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      id="btn-pizza-save"
                      type="submit"
                      className="flex items-center gap-1.5 py-2 px-4 rounded-xl text-xs font-bold text-white bg-tomato hover:bg-tomato-hover transition"
                    >
                      <Check size={14} />
                      Save Changes
                    </button>
                    <button
                      id="btn-pizza-cancel"
                      type="button"
                      onClick={() => {
                        setIsAddingNew(false);
                        setEditingId(null);
                      }}
                      className="py-2 px-4 rounded-xl text-xs font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 transition"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              {/* Pizza Grid / Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse font-sans">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 font-bold">
                      <th className="py-3 px-2 font-mono">ID</th>
                      <th className="py-3 px-2">RECIPE</th>
                      <th className="py-3 px-2">BASE PRICE</th>
                      <th className="py-3 px-2 hidden md:table-cell">DESCRIPTION</th>
                      <th className="py-3 px-2 text-right">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pizzas.map((pizza) => (
                      <tr key={pizza.id} className="border-b border-slate-100 hover:bg-slate-50 transition duration-150">
                        <td className="py-3.5 px-2 font-mono font-bold text-slate-500">{pizza.id}</td>
                        <td className="py-3.5 px-2">
                          <div className="flex items-center gap-2">
                            <img src={pizza.image} alt={pizza.name} className="w-7 h-7 rounded-lg object-cover" />
                            <span className="font-bold text-slate-900">{pizza.name}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-2 font-mono font-bold text-tomato">₹{pizza.price}</td>
                        <td className="py-3.5 px-2 text-slate-500 hidden md:table-cell max-w-sm truncate">{pizza.description}</td>
                        <td className="py-3.5 px-2 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              id={`btn-edit-pizza-${pizza.id}`}
                              onClick={() => handleEditPizza(pizza)}
                              className="p-1.5 text-slate-400 hover:text-tomato hover:bg-slate-100 rounded-lg transition"
                            >
                              <Edit2 size={13} />
                            </button>
                            <button
                              id={`btn-delete-pizza-${pizza.id}`}
                              onClick={() => handleDeletePizzaItem(pizza.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB: CRUST BASES */}
          {activeTab === 'bases' && (
            <div className="bg-white border border-slate-200 rounded-[28px] p-6 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900 font-display">Gourmet Bases</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Manage crust bases loaded inside the interactive customizer.</p>
                </div>
                {!isAddingNew && editingId === null && (
                  <button
                    id="btn-add-base"
                    onClick={handleAddBaseClick}
                    className="flex items-center gap-1.5 py-2 px-4 rounded-xl text-xs font-bold text-white bg-tomato hover:bg-tomato-hover shadow-md shadow-tomato/10 transition"
                  >
                    <Plus size={14} />
                    Add Crust Option
                  </button>
                )}
              </div>

              {/* Add or Edit Base Form */}
              {(isAddingNew || editingId !== null) && (
                <form onSubmit={handleSaveBaseSubmit} className="bg-slate-50 border border-slate-200 p-5 rounded-2xl space-y-4 font-sans">
                  <h4 className="text-xs font-extrabold font-mono uppercase tracking-wider text-tomato">
                    {isAddingNew ? 'Create New Crust Base' : `Edit Base (ID: ${editingId})`}
                  </h4>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Base ID</label>
                      <input
                        id="input-base-id"
                        type="text"
                        disabled={editingId !== null}
                        value={baseForm.id}
                        onChange={(e) => setBaseForm({ ...baseForm, id: e.target.value })}
                        placeholder="e.g. B6"
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-tomato disabled:bg-slate-100 disabled:text-slate-400 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Name</label>
                      <input
                        id="input-base-name"
                        type="text"
                        value={baseForm.name}
                        onChange={(e) => setBaseForm({ ...baseForm, name: e.target.value })}
                        placeholder="e.g. Gluten-Free"
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-tomato"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Price (₹)</label>
                      <input
                        id="input-base-price"
                        type="number"
                        value={baseForm.price}
                        onChange={(e) => setBaseForm({ ...baseForm, price: Number(e.target.value) })}
                        placeholder="e.g. 199"
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-tomato"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      id="btn-base-save"
                      type="submit"
                      className="flex items-center gap-1.5 py-2 px-4 rounded-xl text-xs font-bold text-white bg-tomato hover:bg-tomato-hover transition"
                    >
                      <Check size={14} />
                      Save Changes
                    </button>
                    <button
                      id="btn-base-cancel"
                      type="button"
                      onClick={() => {
                        setIsAddingNew(false);
                        setEditingId(null);
                      }}
                      className="py-2 px-4 rounded-xl text-xs font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 transition"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              {/* Bases Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse font-sans">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 font-bold">
                      <th className="py-3 px-2 font-mono">ID</th>
                      <th className="py-3 px-2">CRUST NAME</th>
                      <th className="py-3 px-2">PRICE</th>
                      <th className="py-3 px-2 text-right">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bases.map((base) => (
                      <tr key={base.id} className="border-b border-slate-100 hover:bg-slate-50 transition duration-150">
                        <td className="py-3.5 px-2 font-mono font-bold text-slate-500">{base.id}</td>
                        <td className="py-3.5 px-2 font-bold text-slate-900">{base.name}</td>
                        <td className="py-3.5 px-2 font-mono font-bold text-tomato">₹{base.price}</td>
                        <td className="py-3.5 px-2 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              id={`btn-edit-base-${base.id}`}
                              onClick={() => handleEditBase(base)}
                              className="p-1.5 text-slate-400 hover:text-tomato hover:bg-slate-100 rounded-lg transition"
                            >
                              <Edit2 size={13} />
                            </button>
                            <button
                              id={`btn-delete-base-${base.id}`}
                              onClick={() => handleDeleteBaseItem(base.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB: TOPPINGS MANAGER */}
          {activeTab === 'toppings' && (
            <div className="bg-white border border-slate-200 rounded-[28px] p-6 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900 font-display">Toppings Ingredients</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Manage custom dynamic toppings and extra ingredients.</p>
                </div>
                {!isAddingNew && editingId === null && (
                  <button
                    id="btn-add-topping"
                    onClick={handleAddToppingClick}
                    className="flex items-center gap-1.5 py-2 px-4 rounded-xl text-xs font-bold text-white bg-tomato hover:bg-tomato-hover shadow-md shadow-tomato/10 transition"
                  >
                    <Plus size={14} />
                    Add Topping Option
                  </button>
                )}
              </div>

              {/* Add or Edit Topping Form */}
              {(isAddingNew || editingId !== null) && (
                <form onSubmit={handleSaveToppingSubmit} className="bg-slate-50 border border-slate-200 p-5 rounded-2xl space-y-4 font-sans">
                  <h4 className="text-xs font-extrabold font-mono uppercase tracking-wider text-tomato">
                    {isAddingNew ? 'Create New Topping' : `Edit Topping (ID: ${editingId})`}
                  </h4>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Topping ID</label>
                      <input
                        id="input-topping-id"
                        type="text"
                        disabled={editingId !== null}
                        value={toppingForm.id}
                        onChange={(e) => setToppingForm({ ...toppingForm, id: e.target.value })}
                        placeholder="e.g. T11"
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-tomato disabled:bg-slate-100 disabled:text-slate-400 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Name</label>
                      <input
                        id="input-topping-name"
                        type="text"
                        value={toppingForm.name}
                        onChange={(e) => setToppingForm({ ...toppingForm, name: e.target.value })}
                        placeholder="e.g. Avocado Chunks"
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-tomato"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Price (₹)</label>
                      <input
                        id="input-topping-price"
                        type="number"
                        value={toppingForm.price}
                        onChange={(e) => setToppingForm({ ...toppingForm, price: Number(e.target.value) })}
                        placeholder="e.g. 59"
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-tomato"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      id="btn-topping-save"
                      type="submit"
                      className="flex items-center gap-1.5 py-2 px-4 rounded-xl text-xs font-bold text-white bg-tomato hover:bg-tomato-hover transition"
                    >
                      <Check size={14} />
                      Save Changes
                    </button>
                    <button
                      id="btn-topping-cancel"
                      type="button"
                      onClick={() => {
                        setIsAddingNew(false);
                        setEditingId(null);
                      }}
                      className="py-2 px-4 rounded-xl text-xs font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 transition"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              {/* Toppings Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse font-sans">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 font-bold">
                      <th className="py-3 px-2 font-mono">ID</th>
                      <th className="py-3 px-2">TOPPING NAME</th>
                      <th className="py-3 px-2">PRICE</th>
                      <th className="py-3 px-2 text-right">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {toppings.map((topping) => (
                      <tr key={topping.id} className="border-b border-slate-100 hover:bg-slate-50 transition duration-150">
                        <td className="py-3.5 px-2 font-mono font-bold text-slate-500">{topping.id}</td>
                        <td className="py-3.5 px-2 font-bold text-slate-900">{topping.name}</td>
                        <td className="py-3.5 px-2 font-mono font-bold text-tomato">₹{topping.price}</td>
                        <td className="py-3.5 px-2 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              id={`btn-edit-topping-${topping.id}`}
                              onClick={() => handleEditTopping(topping)}
                              className="p-1.5 text-slate-400 hover:text-tomato hover:bg-slate-100 rounded-lg transition"
                            >
                              <Edit2 size={13} />
                            </button>
                            <button
                              id={`btn-delete-topping-${topping.id}`}
                              onClick={() => handleDeleteToppingItem(topping.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB: DATA IMPORT API */}
          {activeTab === 'data-import' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left Column: Form and File Drag & Drop */}
              <div className="lg:col-span-2 bg-white border border-slate-200 rounded-[28px] p-6 shadow-sm space-y-6">
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900 font-display">Data Import API</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Upload configuration files or write semicolon-separated configurations directly to update database tables.
                  </p>
                </div>

                <form onSubmit={handleImportSubmit} className="space-y-4">
                  {/* Select Table & Presets */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">Target Database Table</label>
                      <select
                        id="select-import-table"
                        value={importTable}
                        onChange={(e) => {
                          setImportTable(e.target.value as any);
                          setImportResult(null);
                        }}
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-tomato"
                      >
                        <option value="pizzas">Pizzas Table (pizzas)</option>
                        <option value="bases">Pizza Bases Table (pizza_bases)</option>
                        <option value="toppings">Pizza Toppings Table (pizza_toppings)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">Quick Fill from Source Files</label>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleLoadDefaultText('pizzas')}
                          className="flex-1 py-2 px-3 rounded-xl text-2xs font-bold border border-slate-200 hover:border-tomato bg-white hover:bg-tomato/5 text-slate-700 hover:text-tomato transition"
                        >
                          Pizzas TXT
                        </button>
                        <button
                          type="button"
                          onClick={() => handleLoadDefaultText('bases')}
                          className="flex-1 py-2 px-3 rounded-xl text-2xs font-bold border border-slate-200 hover:border-tomato bg-white hover:bg-tomato/5 text-slate-700 hover:text-tomato transition"
                        >
                          Bases TXT
                        </button>
                        <button
                          type="button"
                          onClick={() => handleLoadDefaultText('toppings')}
                          className="flex-1 py-2 px-3 rounded-xl text-2xs font-bold border border-slate-200 hover:border-tomato bg-white hover:bg-tomato/5 text-slate-700 hover:text-tomato transition"
                        >
                          Toppings TXT
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Drag and drop Area */}
                  <div
                    onDragEnter={handleDrag}
                    onDragOver={handleDrag}
                    onDragLeave={handleDrag}
                    onDrop={handleDrop}
                    className={`relative border-2 border-dashed rounded-2xl p-6 text-center transition flex flex-col items-center justify-center cursor-pointer ${
                      dragActive
                        ? 'border-tomato bg-tomato/5'
                        : 'border-slate-200 hover:border-slate-300 bg-slate-50/50 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      id="file-import-upload"
                      type="file"
                      accept=".txt"
                      onChange={handleFileInputChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <Upload size={28} className="text-slate-400 mb-2.5" />
                    <p className="text-xs font-extrabold text-slate-700">Drag & Drop .txt configuration file here</p>
                    <p className="text-[10px] text-slate-400 mt-1">or click to browse your local computer (e.g. Types_of_Pizza.txt)</p>
                  </div>

                  {/* Text-Area editor */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-bold text-slate-700">Configuration Editor</label>
                      {importText && (
                        <button
                          type="button"
                          onClick={() => {
                            setImportText('');
                            setImportResult(null);
                          }}
                          className="text-[10px] font-bold text-rose-500 hover:underline"
                        >
                          Clear Text
                        </button>
                      )}
                    </div>
                    <textarea
                      id="textarea-import-data"
                      rows={8}
                      value={importText}
                      onChange={(e) => setImportText(e.target.value)}
                      placeholder="Enter semicolon-separated values, one per line..."
                      className="w-full px-3.5 py-3 bg-white border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:outline-none focus:border-tomato focus:ring-1 focus:ring-tomato/20"
                    />
                  </div>

                  {/* Action button */}
                  <div className="flex items-center justify-between pt-1">
                    <button
                      id="btn-execute-import"
                      type="submit"
                      disabled={loading || !importText.trim()}
                      className="w-full sm:w-auto flex items-center justify-center gap-2 py-2.5 px-6 rounded-xl text-xs font-bold text-white bg-tomato hover:bg-tomato-hover shadow-md shadow-tomato/10 transition disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none"
                    >
                      <Database size={14} />
                      {loading ? 'Processing Upload API...' : 'Upload & Sync Database'}
                    </button>
                  </div>
                </form>

                {/* Import Result banner */}
                {importResult && (
                  <div
                    className={`p-4 rounded-xl text-xs font-semibold border ${
                      importResult.success
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-100'
                        : 'bg-rose-50 text-rose-800 border-rose-100'
                    }`}
                  >
                    {importResult.text}
                  </div>
                )}
              </div>

              {/* Right Column: Documentation / Help & Live Preview */}
              <div className="space-y-6">
                
                {/* Format documentation */}
                <div className="bg-white border border-slate-200 rounded-[28px] p-6 shadow-sm space-y-4">
                  <h4 className="text-xs font-extrabold font-mono uppercase tracking-wider text-slate-400">
                    File API Specifications
                  </h4>
                  <div className="space-y-3.5 text-xs text-slate-600">
                    <p className="leading-relaxed">
                      The database parser expects files formatted with semicolon-separated values (one record per line).
                    </p>
                    <div className="space-y-2 font-mono text-[10px] bg-slate-50 p-3 rounded-lg border border-slate-200/60">
                      <div>
                        <div className="text-tomato font-bold">pizzas table:</div>
                        <div className="text-slate-400">ID;Name;Price;Description;ImageURL</div>
                        <div className="text-slate-700 mt-1">P9;Classic Supreme;399;Tender olives...;https://...</div>
                      </div>
                      <hr className="border-slate-200 my-2" />
                      <div>
                        <div className="text-rose-600 font-bold">pizza_bases table:</div>
                        <div className="text-slate-400">ID;Name;Price</div>
                        <div className="text-slate-700 mt-1">B6;Stuffed Crust;249</div>
                      </div>
                      <hr className="border-slate-200 my-2" />
                      <div>
                        <div className="text-amber-600 font-bold">pizza_toppings table:</div>
                        <div className="text-slate-400">ID;Name;Price</div>
                        <div className="text-slate-700 mt-1">T11;Pineapple Chunks;59</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Live parsed preview container */}
                <div className="bg-white border border-slate-200 rounded-[28px] p-6 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-extrabold font-mono uppercase tracking-wider text-slate-400">
                      Live Parsed Preview
                    </h4>
                    <span className="text-[10px] bg-tomato/5 text-tomato font-bold border border-tomato/10 px-2 py-0.5 rounded">
                      {importPreview.length} Rows Detected
                    </span>
                  </div>

                  {importPreview.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-400">
                      Upload/paste lines to see real-time parsing visualization.
                    </div>
                  ) : (
                    <div className="max-h-60 overflow-y-auto border border-slate-100 rounded-xl">
                      <table className="w-full text-left text-[10px] border-collapse font-mono">
                        <thead>
                          <tr className="bg-slate-50 text-slate-400 font-bold border-b border-slate-100 sticky top-0">
                            <th className="py-2 px-2.5">ID</th>
                            <th className="py-2 px-2.5">NAME</th>
                            <th className="py-2 px-2.5 text-right">PRICE</th>
                          </tr>
                        </thead>
                        <tbody>
                          {importPreview.slice(0, 8).map((row, index) => (
                            <tr key={index} className="border-b border-slate-50 hover:bg-slate-50/50">
                              <td className="py-2 px-2.5 font-bold text-slate-500">{row.id}</td>
                              <td className="py-2 px-2.5 text-slate-900 font-sans truncate max-w-[120px]">{row.name}</td>
                              <td className="py-2 px-2.5 text-right text-tomato font-bold">₹{row.price}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {importPreview.length > 8 && (
                        <div className="p-2 text-center text-[9px] text-slate-400 bg-slate-50/50 border-t border-slate-50">
                          And {importPreview.length - 8} more rows...
                        </div>
                      )}
                    </div>
                  )}
                </div>

              </div>

            </div>
          )}

        </div>

      </main>
    </div>
  );
};
