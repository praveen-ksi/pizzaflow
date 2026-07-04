/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, LayoutDashboard, Shield, Users, Pizza, ChefHat, Activity } from 'lucide-react';
import { SetupAssistant } from '../components/SetupAssistant';
import { motion } from 'motion/react';

export const AdminDashboard: React.FC = () => {
  const { user, profile, signOut, isDemoMode } = useAuth();

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
              <span className="text-[10px] font-mono font-bold bg-tomato/5 text-tomato border border-tomato/10 px-2 py-0.5 rounded ml-2.5">
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
        
        {/* Banner Card - Premium tomato color accent */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-tomato to-rose-700 border border-tomato/10 rounded-3xl p-8 text-white relative overflow-hidden shadow-lg shadow-tomato/10"
        >
          {/* Decorative circular background */}
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
                The PizzaFlow administrative database is connected. You have full oversight on authentication, operations config, and role permissions.
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

        {/* KPI Row (Sleek card styles) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            { label: 'Active Kitchen Staff', value: '4 Online', icon: Users, color: 'text-tomato bg-tomato/5 border-tomato/10' },
            { label: 'Ovens Operating', value: '3 Active', icon: Pizza, color: 'text-rose-600 bg-rose-50 border-rose-100' },
            { label: 'Today\'s Order Target', value: '$2,480.00', icon: ChefHat, color: 'text-amber-600 bg-amber-50 border-amber-100' },
            { label: 'Database Health', value: isDemoMode ? 'Local Sandbox' : 'Supabase OK', icon: Activity, color: isDemoMode ? 'text-amber-600 bg-amber-50 border-amber-100' : 'text-emerald-600 bg-emerald-50 border-emerald-100' }
          ].map((kpi, idx) => {
            const Icon = kpi.icon;
            return (
              <div key={idx} className="bg-white border border-slate-200/80 rounded-2xl p-6 flex items-center gap-4 shadow-xs">
                <div className={`p-3 rounded-xl border ${kpi.color}`}>
                  <Icon size={22} />
                </div>
                <div>
                  <div className="text-xs text-slate-400 font-mono uppercase tracking-wider font-bold">{kpi.label}</div>
                  <div className="text-lg font-bold text-slate-900 mt-1">{kpi.value}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Scope Notice Card */}
        <div className="bg-cream border border-tomato/10 rounded-3xl p-6 shadow-2xs">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-white text-tomato rounded-2xl border border-tomato/10 shadow-2xs shrink-0">
              <LayoutDashboard size={22} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 font-display">
                Phase 1 Complete: Secure Role Authentication
              </h2>
              <p className="text-slate-600 text-sm mt-1.5 leading-relaxed">
                The PizzaFlow authentication system is successfully implemented. Admin and Staff routes are now separated with dynamic role-based guards, preventing cross-profile intrusions. In the next development phases, you will expand this workspace to support dynamic live order processing, menu item CRUD operations, customer checkout channels, and visual real-time metrics dashboards.
              </p>
            </div>
          </div>
        </div>

        {/* Setup Assistant Section */}
        <SetupAssistant />

      </main>
    </div>
  );
};
