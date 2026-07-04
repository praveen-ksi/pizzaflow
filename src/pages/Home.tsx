/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { ChefHat, Pizza, ArrowRight, ShieldCheck, Code, Sparkles } from 'lucide-react';
import { SetupAssistant } from '../components/SetupAssistant';
import { motion } from 'motion/react';

export const Home: React.FC = () => {
  return (
    <div className="min-h-screen bg-cream font-sans text-slate-900 relative overflow-hidden selection:bg-tomato/10 selection:text-tomato">
      {/* Decorative pizza flow background circles to mimic the design panel */}
      <div className="absolute top-[-200px] right-[-200px] w-[500px] h-[500px] bg-tomato/5 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-[-150px] left-[-150px] w-[450px] h-[450px] bg-amber-500/5 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Header */}
      <header className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between border-b border-slate-200/60">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-tomato rounded-xl flex items-center justify-center shadow-md shadow-tomato/20">
            <span className="text-white font-extrabold text-xl font-display">P</span>
          </div>
          <span className="text-2xl font-bold font-display tracking-tight text-slate-900">
            Pizza<span className="text-tomato">Flow</span>
          </span>
        </div>
        <div className="flex items-center gap-2 font-mono text-xs text-slate-600 bg-white px-3 py-1.5 rounded-full border border-slate-200 shadow-xs">
          <Code size={13} className="text-tomato" />
          <span>PHASE 1: SECURE AUTH</span>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-5xl mx-auto text-center px-6 pt-16 pb-12">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-5"
        >
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold font-mono bg-tomato/5 text-tomato border border-tomato/10">
            <Sparkles size={12} className="animate-pulse" />
            SUPABASE FULL-STACK ARCHITECTURE
          </span>
          <h1 className="text-4xl sm:text-6xl font-extrabold font-display tracking-tight text-slate-900 max-w-4xl mx-auto leading-[1.1]">
            Oven-Fresh Security For Your{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-tomato to-amber-600">
              Pizza Enterprise
            </span>
          </h1>
          <p className="text-slate-600 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed font-sans">
            Streamline your slice. PizzaFlow provides robust role-based portal protection for admins and kitchen dispatchers. Connect your real database or explore the sandbox workspace instantly.
          </p>
        </motion.div>
      </section>

      {/* Navigation Cards (Three Roles) */}
      <section className="max-w-5xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
        
        {/* Customer Guest Card */}
        <div className="bg-slate-50/50 border border-slate-200/60 rounded-3xl p-8 flex flex-col justify-between relative overflow-hidden shadow-xs">
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div className="p-3 bg-slate-100 border border-slate-200 text-slate-400 rounded-2xl">
                <Pizza size={22} />
              </div>
              <span className="text-[10px] font-mono tracking-widest bg-slate-100 text-slate-500 px-3 py-1 rounded-full border border-slate-200 font-bold">
                PHASE 2
              </span>
            </div>
            <div>
              <h3 className="text-lg font-bold font-display text-slate-400">Customer Guest</h3>
              <p className="text-slate-500 text-xs mt-1.5 leading-relaxed font-sans">
                Browse gourmet menus, craft bespoke custom recipes, specify dynamic toppings, and submit guest orders directly.
              </p>
            </div>
          </div>
          <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-mono text-slate-400 font-semibold">
            <span>UNAUTHENTICATED</span>
            <span className="italic">In Production</span>
          </div>
        </div>

        {/* Staff Operations Card */}
        <Link
          to="/staff/login"
          id="card-staff-portal"
          className="bg-white border border-slate-200 hover:border-tomato/30 rounded-3xl p-8 flex flex-col justify-between transition-all duration-300 shadow-sm hover:shadow-xl hover:shadow-tomato/5 group"
        >
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div className="p-3 bg-amber-50 border border-amber-100 text-amber-600 rounded-2xl group-hover:scale-105 transition duration-300">
                <ChefHat size={22} />
              </div>
              <span className="text-[10px] font-mono tracking-widest bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full border border-emerald-100 font-bold">
                ACTIVE
              </span>
            </div>
            <div>
              <h3 className="text-lg font-bold font-display text-slate-950 group-hover:text-tomato transition-colors">Kitchen Staff Portal</h3>
              <p className="text-slate-600 text-xs mt-1.5 leading-relaxed font-sans">
                Real-time dispatch system. Access active orders, control oven bake states, and coordinate courier deliveries.
              </p>
            </div>
          </div>
          <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-mono text-slate-500 font-bold">
            <span>ROLE: STAFF</span>
            <span className="flex items-center gap-1 group-hover:text-tomato transition-colors">
              Access Desk
              <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </span>
          </div>
        </Link>

        {/* Executive Admin Card */}
        <Link
          to="/admin/login"
          id="card-admin-portal"
          className="bg-white border border-slate-200 hover:border-tomato/30 rounded-3xl p-8 flex flex-col justify-between transition-all duration-300 shadow-sm hover:shadow-xl hover:shadow-tomato/5 group"
        >
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div className="p-3 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl group-hover:scale-105 transition duration-300">
                <ShieldCheck size={22} />
              </div>
              <span className="text-[10px] font-mono tracking-widest bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full border border-emerald-100 font-bold">
                ACTIVE
              </span>
            </div>
            <div>
              <h3 className="text-lg font-bold font-display text-slate-950 group-hover:text-tomato transition-colors">Admin Portal</h3>
              <p className="text-slate-600 text-xs mt-1.5 leading-relaxed font-sans">
                Full enterprise configuration tools. Manage menu item pricing, inspect operational logs, and seed user records.
              </p>
            </div>
          </div>
          <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-mono text-slate-500 font-bold">
            <span>ROLE: ADMIN</span>
            <span className="flex items-center gap-1 group-hover:text-tomato transition-colors">
              Access Command
              <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </span>
          </div>
        </Link>

      </section>

      {/* Database Setup Assistance directly on Home */}
      <div className="pb-16">
        <SetupAssistant />
      </div>

      {/* Footer */}
      <footer className="text-center py-10 border-t border-slate-200 text-slate-400 text-xs font-mono">
        PizzaFlow Inc. © 2026. Made with Google AI Studio.
      </footer>
    </div>
  );
};
