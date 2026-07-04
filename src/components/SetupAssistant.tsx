/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { supabaseConfig, isSupabaseConfigured } from '../lib/supabase';
import { Check, Copy, Database, Shield, Key, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const SetupAssistant: React.FC = () => {
  const [copied, setCopied] = useState(false);
  const [isOpen, setIsOpen] = useState(!isSupabaseConfigured);

  const sqlCode = `-- 1. Create profiles table linked to Supabase Auth users
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  role TEXT CHECK (role IN ('admin', 'staff')) NOT NULL,
  full_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 2. Enable Row-Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS Policies
CREATE POLICY "Allow public read access to profiles" 
  ON public.profiles FOR SELECT 
  USING (true);

CREATE POLICY "Allow users to insert their own profile" 
  ON public.profiles FOR INSERT 
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Allow users to update their own profile" 
  ON public.profiles FOR UPDATE 
  USING (auth.uid() = id);`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(sqlCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto w-full px-4 font-sans">
      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-lg shadow-slate-100">
        {/* Header Bar */}
        <button
          id="btn-toggle-assistant"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between p-6 text-left hover:bg-cream-dark/30 transition-all duration-200"
        >
          <div className="flex items-center gap-3.5">
            <div className={`p-2.5 rounded-xl ${isSupabaseConfigured ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-tomato/5 text-tomato border border-tomato/10'}`}>
              <Database size={22} />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 font-display flex flex-wrap items-center gap-2 text-sm sm:text-base">
                PizzaFlow Backend Configuration
                {isSupabaseConfigured ? (
                  <span className="text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 px-2.5 py-0.5 rounded-full">
                    Supabase Connected
                  </span>
                ) : (
                  <span className="text-[10px] font-mono font-bold bg-tomato/5 text-tomato border border-tomato/10 px-2.5 py-0.5 rounded-full">
                    Demo Mode Active
                  </span>
                )}
              </h3>
              <p className="text-slate-500 text-xs mt-1">
                {isSupabaseConfigured 
                  ? 'Real-time role authentication is fully operational.' 
                  : 'Configure Supabase keys or run in local sandbox with pre-seeded accounts.'}
              </p>
            </div>
          </div>
          <div className="text-slate-500 text-xs font-mono bg-slate-50 hover:bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 transition">
            {isOpen ? 'COLLAPSE' : 'EXPAND'}
          </div>
        </button>

        {/* Content Panel */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="border-t border-slate-100 overflow-hidden"
            >
              <div className="p-6 space-y-6 bg-slate-50/50">
                
                {/* Status & Secrets Setup Guide */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Variables Status */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                    <h4 className="text-slate-700 text-xs font-mono uppercase tracking-wider mb-3.5 flex items-center gap-1.5 font-bold">
                      <Key size={14} className="text-tomato" />
                      Runtime Environment Keys
                    </h4>
                    <div className="space-y-3 font-mono text-xs text-slate-800">
                      <div>
                        <div className="text-slate-400 mb-1 font-sans">VITE_SUPABASE_URL</div>
                        <div className={`p-2.5 rounded-lg bg-slate-50 border truncate ${isSupabaseConfigured ? 'border-emerald-200 text-emerald-700' : 'border-slate-200 text-slate-500'}`}>
                          {supabaseConfig.url || 'Not configured'}
                        </div>
                      </div>
                      <div>
                        <div className="text-slate-400 mb-1 font-sans">VITE_SUPABASE_ANON_KEY</div>
                        <div className={`p-2.5 rounded-lg bg-slate-50 border truncate ${isSupabaseConfigured ? 'border-emerald-200 text-emerald-700' : 'border-slate-200 text-slate-500'}`}>
                          {supabaseConfig.anonKey ? '••••••••••••••••' : 'Not configured'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Sandbox / Mock Access Details */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
                    <div>
                      <h4 className="text-slate-700 text-xs font-mono uppercase tracking-wider mb-3.5 flex items-center gap-1.5 font-bold">
                        <Sparkles size={14} className="text-tomato animate-pulse" />
                        Demo Mode Accounts
                      </h4>
                      <p className="text-slate-600 text-xs leading-relaxed mb-4">
                        To test PizzaFlow instantly before configuring Supabase, we pre-loaded mock credentials backed by secure local storage:
                      </p>
                      
                      <div className="space-y-2 text-xs font-mono">
                        <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                          <span className="text-tomato font-semibold">Admin Account</span>
                          <span className="text-slate-700 font-medium">admin@pizzaflow.com</span>
                        </div>
                        <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                          <span className="text-tomato font-semibold">Staff Account</span>
                          <span className="text-slate-700 font-medium">staff@pizzaflow.com</span>
                        </div>
                        <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                          <span className="text-slate-400 font-medium">Shared Password</span>
                          <span className="text-slate-700 font-medium">password123</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Database Schema Seeding */}
                <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
                  <div className="flex items-center justify-between p-4 bg-slate-50 border-b border-slate-200">
                    <h4 className="text-slate-700 text-xs font-mono uppercase tracking-wider flex items-center gap-1.5 font-bold">
                      <Shield size={14} className="text-tomato" />
                      Supabase SQL Schema Setup
                    </h4>
                    <button
                      id="btn-copy-sql"
                      onClick={copyToClipboard}
                      className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 py-1.5 px-3 rounded-lg border border-slate-200 transition"
                    >
                      {copied ? (
                        <>
                          <Check size={14} className="text-emerald-600" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy size={14} />
                          Copy SQL
                        </>
                      )}
                    </button>
                  </div>
                  <div className="p-4 overflow-x-auto max-h-48 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
                    <pre className="text-xs text-tomato font-mono leading-relaxed">
                      {sqlCode}
                    </pre>
                  </div>
                </div>

                {/* Instructions steps */}
                <div className="space-y-3 pl-1">
                  <h4 className="text-slate-700 text-xs font-mono uppercase tracking-wider font-bold">
                    How to fully connect your Supabase project:
                  </h4>
                  <ol className="list-decimal list-inside text-slate-600 text-xs space-y-2 leading-relaxed">
                    <li>Create a free project at <a href="https://supabase.com" target="_blank" rel="noreferrer" className="text-tomato hover:underline font-semibold">supabase.com</a>.</li>
                    <li>Go to your project's <strong>SQL Editor</strong>, paste the schema above, and run it.</li>
                    <li>Under <strong>Project Settings &gt; API</strong>, retrieve your Project URL and Anon Key.</li>
                    <li>Open the <strong>Secrets panel</strong> in the AI Studio side-drawer, and define both <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code>.</li>
                    <li>Sign up a user via the application or Supabase Auth console, insert their role in the profiles table, and log in!</li>
                  </ol>
                </div>

              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
