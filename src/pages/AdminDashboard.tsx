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
  Upload,
  Sparkles,
  ShieldAlert
} from 'lucide-react';
import { OrdersDashboard } from '../components/OrdersDashboard';
import { AIForecast } from '../components/AIForecast';
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
import { getPizzaImage } from '../lib/pizzaImages';

export const AdminDashboard: React.FC = () => {
  const { user, profile, signOut, isDemoMode } = useAuth();
  
  // Tab states: 'overview' | 'pizzas' | 'bases' | 'toppings' | 'data-import' | 'forecast'
  const [activeTab, setActiveTab] = useState<'overview' | 'pizzas' | 'bases' | 'toppings' | 'data-import' | 'forecast'>('overview');
  
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
  const [validationError, setValidationError] = useState<string | null>(null);

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
      setValidationError(null);
      return;
    }
    try {
      const lines = importText
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0 && !line.startsWith('#'));

      let errorMsg: string | null = null;

      const parsed = lines.map((line, idx) => {
        const parts = line.split(';');
        const lineNum = idx + 1;
        const id = parts[0]?.trim() || '';
        const name = parts[1]?.trim() || '';

        if (parts.length < 3) {
          if (!errorMsg) {
            errorMsg = `Validation Error: Row #${lineNum} does not contain at least 3 parts separated by semicolons (Format: ID;Name;Price).`;
          }
          return {
            id: id || '?',
            name: name || '?',
            price: 0,
            invalidId: true,
            invalidPrice: true
          };
        }

        if (importTable === 'pizzas') {
          const [idVal, nameVal, priceStr, desc, img] = parts;
          const cleanId = idVal?.trim() || '';
          const cleanName = nameVal?.trim() || '';
          const cleanPriceStr = priceStr?.trim() || '';
          const parsedPrice = cleanPriceStr.length > 0 ? parseInt(cleanPriceStr, 10) : NaN;
          
          const isIdInvalid = !/^[pP]\d+$/.test(cleanId);
          const isPriceInvalid = isNaN(parsedPrice) || parsedPrice <= 0;

          if (isIdInvalid && !errorMsg) {
            errorMsg = `Validation Error: Row #${lineNum} ("${cleanName || cleanId || 'Unknown'}") has an invalid Pizza ID format "${cleanId}". Pizza IDs must start with 'P' followed by a number (e.g. P1, P2).`;
          } else if (isPriceInvalid && !errorMsg) {
            errorMsg = `Validation Error: Row #${lineNum} ("${cleanName || cleanId || 'Unknown'}") is missing a valid price. Please provide a positive integer price (e.g. 299).`;
          }

          return {
            id: cleanId || '?',
            name: cleanName || '?',
            price: isNaN(parsedPrice) ? 0 : parsedPrice,
            description: desc?.trim() || '',
            image: img?.trim() || '',
            invalidId: isIdInvalid,
            invalidPrice: isPriceInvalid
          };
        } else if (importTable === 'bases') {
          const [idVal, nameVal, priceStr] = parts;
          const cleanId = idVal?.trim() || '';
          const cleanName = nameVal?.trim() || '';
          const cleanPriceStr = priceStr?.trim() || '';
          const parsedPrice = cleanPriceStr.length > 0 ? parseInt(cleanPriceStr, 10) : NaN;
          
          const isIdInvalid = !/^[bB]\d+$/.test(cleanId);
          const isPriceInvalid = isNaN(parsedPrice) || parsedPrice <= 0;

          if (isIdInvalid && !errorMsg) {
            errorMsg = `Validation Error: Row #${lineNum} ("${cleanName || cleanId || 'Unknown'}") has an invalid Base ID format "${cleanId}". Base IDs must start with 'B' followed by a number (e.g. B1, B2).`;
          } else if (isPriceInvalid && !errorMsg) {
            errorMsg = `Validation Error: Row #${lineNum} ("${cleanName || cleanId || 'Unknown'}") is missing a valid price. Please provide a positive integer price.`;
          }

          return {
            id: cleanId || '?',
            name: cleanName || '?',
            price: isNaN(parsedPrice) ? 0 : parsedPrice,
            invalidId: isIdInvalid,
            invalidPrice: isPriceInvalid
          };
        } else {
          // toppings
          const [idVal, nameVal, priceStr] = parts;
          const cleanId = idVal?.trim() || '';
          const cleanName = nameVal?.trim() || '';
          const cleanPriceStr = priceStr?.trim() || '';
          const parsedPrice = cleanPriceStr.length > 0 ? parseInt(cleanPriceStr, 10) : NaN;
          
          const isIdInvalid = !/^[tT]\d+$/.test(cleanId);
          const isPriceInvalid = isNaN(parsedPrice) || parsedPrice <= 0;

          if (isIdInvalid && !errorMsg) {
            errorMsg = `Validation Error: Row #${lineNum} ("${cleanName || cleanId || 'Unknown'}") has an invalid Topping ID format "${cleanId}". Topping IDs must start with 'T' followed by a number (e.g. T1, T2).`;
          } else if (isPriceInvalid && !errorMsg) {
            errorMsg = `Validation Error: Row #${lineNum} ("${cleanName || cleanId || 'Unknown'}") is missing a valid price. Please provide a positive integer price.`;
          }

          return {
            id: cleanId || '?',
            name: cleanName || '?',
            price: isNaN(parsedPrice) ? 0 : parsedPrice,
            invalidId: isIdInvalid,
            invalidPrice: isPriceInvalid
          };
        }
      });
      setImportPreview(parsed);
      setValidationError(errorMsg);
    } catch (e) {
      setImportPreview([]);
      setValidationError('Failed to parse input data. Please ensure rows are semicolon-separated.');
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
    if (validationError) {
      setImportResult({ success: false, text: validationError });
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
              Slice<span className="text-tomato">matic</span>
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
                The Slicematic administrative dashboard is active. Manage menu options, update item pricing, customize recipes, and assign team roles with full oversight.
              </p>
            </div>
            
            <div className="flex flex-wrap gap-2 font-mono text-xs text-white">
              <div className="bg-black/15 px-3 py-1.5 rounded-lg border border-white/10">
                <span className="opacity-75">PORTAL: </span>
                <span className="font-bold">ADMINISTRATION</span>
              </div>
              <div className="bg-black/15 px-3 py-1.5 rounded-lg border border-white/10">
                <span className="opacity-75">STATUS: </span>
                <span className="font-bold">LIVE OVERVIEW</span>
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
              { id: 'data-import', label: 'Data Import API', icon: Database },
              { id: 'forecast', label: 'AI Demand Forecast', icon: Sparkles }
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
                            <img src={getPizzaImage(pizza.name, pizza.image)} alt={pizza.name} className="w-7 h-7 rounded-lg object-cover" />
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
              <div className="lg:col-span-2 bg-white border border-slate-200/80 rounded-[32px] p-6 sm:p-8 shadow-xs space-y-8">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-tomato bg-tomato/5 px-2.5 py-1 rounded-md">
                      Database Sync API
                    </span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-55 bg-emerald-500 animate-pulse" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 font-display mt-2.5">Data Import Console</h3>
                  <p className="text-slate-500 text-xs mt-1 leading-relaxed">
                    Instantly batch update your system tables. Upload local configurations or paste semicolon-separated values directly into the interactive code terminal.
                  </p>
                </div>

                <form onSubmit={handleImportSubmit} className="space-y-6">
                  {/* Select Table & Presets (Re-designed with Segmented Control for Target Table) */}
                  <div className="space-y-3.5">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      1. Select Target Database Table
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
                      <button
                        type="button"
                        onClick={() => {
                          setImportTable('pizzas');
                          setImportResult(null);
                        }}
                        className={`flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl text-xs font-bold transition-all ${
                          importTable === 'pizzas'
                            ? 'bg-white text-slate-900 shadow-sm border border-slate-100'
                            : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        <Pizza size={14} className={importTable === 'pizzas' ? 'text-tomato' : 'text-slate-400'} />
                        <span>Pizzas (pizzas)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setImportTable('bases');
                          setImportResult(null);
                        }}
                        className={`flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl text-xs font-bold transition-all ${
                          importTable === 'bases'
                            ? 'bg-white text-slate-900 shadow-sm border border-slate-100'
                            : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        <ChefHat size={14} className={importTable === 'bases' ? 'text-tomato' : 'text-slate-400'} />
                        <span>Bases (bases)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setImportTable('toppings');
                          setImportResult(null);
                        }}
                        className={`flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl text-xs font-bold transition-all ${
                          importTable === 'toppings'
                            ? 'bg-white text-slate-900 shadow-sm border border-slate-100'
                            : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        <Sliders size={14} className={importTable === 'toppings' ? 'text-tomato' : 'text-slate-400'} />
                        <span>Toppings (toppings)</span>
                      </button>
                    </div>
                  </div>

                  {/* Quick Fill section - Elegant design with Source File tags */}
                  <div className="bg-slate-50/50 rounded-2xl p-4.5 border border-slate-100 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-mono font-bold text-slate-500 uppercase tracking-wider">
                        Quick Template Seeding
                      </span>
                      <span className="text-[10px] text-slate-400">Click to fill with default files</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => handleLoadDefaultText('pizzas')}
                        className={`flex items-center gap-2 py-1.5 px-3 rounded-lg text-xs font-semibold border transition-all ${
                          importTable === 'pizzas'
                            ? 'bg-tomato/5 border-tomato/30 text-tomato'
                            : 'bg-white border-slate-200/80 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <FileText size={12} />
                        <span>Pizzas Default</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleLoadDefaultText('bases')}
                        className={`flex items-center gap-2 py-1.5 px-3 rounded-lg text-xs font-semibold border transition-all ${
                          importTable === 'bases'
                            ? 'bg-tomato/5 border-tomato/30 text-tomato'
                            : 'bg-white border-slate-200/80 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <FileText size={12} />
                        <span>Bases Default</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleLoadDefaultText('toppings')}
                        className={`flex items-center gap-2 py-1.5 px-3 rounded-lg text-xs font-semibold border transition-all ${
                          importTable === 'toppings'
                            ? 'bg-tomato/5 border-tomato/30 text-tomato'
                            : 'bg-white border-slate-200/80 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <FileText size={12} />
                        <span>Toppings Default</span>
                      </button>
                    </div>
                  </div>

                  {/* Drag and drop Area */}
                  <div className="space-y-2.5">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      2. Upload Config File
                    </label>
                    <div
                      onDragEnter={handleDrag}
                      onDragOver={handleDrag}
                      onDragLeave={handleDrag}
                      onDrop={handleDrop}
                      className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300 flex flex-col items-center justify-center cursor-pointer ${
                        dragActive
                          ? 'border-tomato bg-tomato/5'
                          : 'border-slate-200 hover:border-slate-300/80 bg-slate-50/20 hover:bg-slate-50/50'
                      }`}
                    >
                      <input
                        id="file-import-upload"
                        type="file"
                        accept=".txt"
                        onChange={handleFileInputChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <div className={`p-3 rounded-xl border mb-3 transition-colors ${
                        dragActive ? 'bg-tomato/10 border-tomato/20 text-tomato' : 'bg-white border-slate-100 text-slate-400 shadow-2xs'
                      }`}>
                        <Upload size={22} className={dragActive ? 'scale-110 transition-transform' : ''} />
                      </div>
                      <p className="text-xs font-bold text-slate-800">Drag & Drop file here</p>
                      <p className="text-[10px] text-slate-400 mt-1">Accepts raw text format (.txt) configuration</p>
                    </div>
                  </div>

                  {/* Validation Error banner inside the form */}
                  {validationError && (
                    <div className="p-4 rounded-2xl text-xs font-semibold bg-rose-50 text-rose-800 border border-rose-100/80 flex items-start gap-2.5">
                      <ShieldAlert size={16} className="text-rose-600 shrink-0 mt-0.5" />
                      <div>
                        <div className="font-bold uppercase tracking-wider text-[10px] text-rose-700">File Validation Failed</div>
                        <div className="mt-1 font-sans text-slate-600 font-normal leading-relaxed">{validationError}</div>
                      </div>
                    </div>
                  )}

                  {/* Action button */}
                  <div className="flex items-center justify-between pt-2">
                    <button
                      id="btn-execute-import"
                      type="submit"
                      disabled={loading || !importText.trim() || !!validationError}
                      className="w-full sm:w-auto flex items-center justify-center gap-2 py-3 px-8 rounded-xl text-xs font-bold text-white bg-tomato hover:bg-tomato-hover shadow-md shadow-tomato/10 transition disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none"
                    >
                      <Database size={14} />
                      {loading ? 'Processing Upload API...' : 'Sync Config & Update Database'}
                    </button>

                    {importText && (
                      <button
                        type="button"
                        onClick={() => {
                          setImportText('');
                          setImportResult(null);
                        }}
                        className="text-xs font-bold text-rose-600 hover:text-rose-700 transition"
                      >
                        Clear Current File
                      </button>
                    )}
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

              {/* Right Column: Live Preview Only */}
              <div className="space-y-6">
                
                {/* Live parsed preview container */}
                <div className="bg-white border border-slate-200 rounded-[28px] p-6 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-extrabold font-mono uppercase tracking-wider text-slate-400">
                      Live Parsed Preview
                    </h4>
                    <span className={`text-[10px] font-bold border px-2 py-0.5 rounded ${
                      validationError 
                        ? 'bg-rose-50 text-rose-600 border-rose-100' 
                        : 'bg-tomato/5 text-tomato border-tomato/10'
                    }`}>
                      {validationError ? 'Parsing Blocked' : `${importPreview.length} Rows Detected`}
                    </span>
                  </div>

                  {importPreview.length === 0 ? (
                    <div className="py-12 text-center text-xs text-slate-400">
                      Upload a file or choose a default template above to preview the system parser output.
                    </div>
                  ) : (
                    <div className="max-h-80 overflow-y-auto border border-slate-100 rounded-xl">
                      <table className="w-full text-left text-[10px] border-collapse font-mono">
                        <thead>
                          <tr className="bg-slate-50 text-slate-400 font-bold border-b border-slate-100 sticky top-0">
                            <th className="py-2 px-2.5">ID</th>
                            <th className="py-2 px-2.5">NAME</th>
                            <th className="py-2 px-2.5 text-right">PRICE</th>
                          </tr>
                        </thead>
                        <tbody>
                          {importPreview.map((row, index) => {
                            const isRowInvalid = row.invalidPrice || row.invalidId;
                            return (
                              <tr 
                                key={index} 
                                className={`border-b border-slate-50 ${
                                  isRowInvalid 
                                    ? 'bg-rose-50/50 hover:bg-rose-50/80 text-rose-800' 
                                    : 'hover:bg-slate-50/50'
                                }`}
                              >
                                <td className="py-2.5 px-2.5 font-bold">
                                  {row.invalidId ? (
                                    <span className="text-[9px] font-mono font-bold bg-rose-100/60 text-rose-600 border border-rose-200/50 px-1.5 py-0.5 rounded">
                                      BAD ID: {row.id}
                                    </span>
                                  ) : (
                                    <span className="text-slate-500">{row.id}</span>
                                  )}
                                </td>
                                <td className="py-2.5 px-2.5 font-sans truncate max-w-[120px] font-medium text-slate-900">
                                  {row.name}
                                </td>
                                <td className="py-2.5 px-2.5 text-right font-bold">
                                  {row.invalidPrice ? (
                                    <span className="text-[9px] font-mono font-bold bg-rose-100/60 text-rose-600 border border-rose-200/50 px-1.5 py-0.5 rounded">
                                      MISSING/INVALID
                                    </span>
                                  ) : (
                                    `₹${row.price}`
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

              </div>

            </div>
          )}

          {/* TAB: AI DEMAND FORECAST */}
          {activeTab === 'forecast' && (
            <AIForecast pizzas={pizzas} bases={bases} toppings={toppings} />
          )}

        </div>

      </main>
    </div>
  );
};
