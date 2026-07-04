/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, LayoutDashboard, Flame, Layers, Clock, Bell } from 'lucide-react';
import { SetupAssistant } from '../components/SetupAssistant';
import { motion } from 'motion/react';

export const StaffDashboard: React.FC = () => {
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
              <span className="text-[10px] font-mono font-bold bg-amber-50 text-amber-700 border border-amber-100 px-2.5 py-0.5 rounded ml-2.5">
                KITCHEN PORTAL
              </span>
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex flex-col text-right text-xs">
              <span className="text-slate-900 font-bold">{profile?.full_name || 'Kitchen Staff'}</span>
              <span className="text-slate-400 font-mono text-[10px]">{user?.email}</span>
            </div>
            <button
              id="btn-staff-logout"
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
        
        {/* Banner Card - Premium tomato/amber operational accent */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-tomato to-amber-600 border border-tomato/10 rounded-3xl p-8 text-white relative overflow-hidden shadow-lg shadow-tomato/10"
        >
          {/* Decorative circular background */}
          <div className="absolute bottom-[-100px] right-[-100px] w-[300px] h-[300px] bg-white/5 rounded-full pointer-events-none" />
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2.5 text-amber-200 text-xs font-bold tracking-wider font-mono">
                <Flame size={15} className="animate-pulse" />
                STAFF ACCESS PORTS OPEN
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight font-display text-white">
                Kitchen Desk: {profile?.full_name || 'Staff Specialist'}
              </h1>
              <p className="text-white/90 text-sm mt-1.5 max-w-xl leading-relaxed">
                Keep the flow running! Oven temperatures are stable. New incoming customer orders will appear on the prep list once they are completed.
              </p>
            </div>
            
            <div className="flex flex-wrap gap-2 font-mono text-xs text-white">
              <div className="bg-black/15 px-3 py-1.5 rounded-lg border border-white/10">
                <span className="opacity-75">ROLE: </span>
                <span className="font-bold">STAFF</span>
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

        {/* Kitchen Status Row (Sleek card styles) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            { label: 'Active Baking Orders', value: '0 Queue', icon: Layers, color: 'text-tomato bg-tomato/5 border-tomato/10' },
            { label: 'Oven Temperature', value: '425°C', icon: Flame, color: 'text-rose-600 bg-rose-50 border-rose-100' },
            { label: 'Average Prep Time', value: '14 Mins', icon: Clock, color: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
            { label: 'Live Notifications', value: 'System Idle', icon: Bell, color: 'text-blue-600 bg-blue-50 border-blue-100' }
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <div key={idx} className="bg-white border border-slate-200/80 rounded-2xl p-6 flex items-center gap-4 shadow-xs">
                <div className={`p-3 rounded-xl border ${item.color}`}>
                  <Icon size={22} />
                </div>
                <div>
                  <div className="text-xs text-slate-400 font-mono uppercase tracking-wider font-bold">{item.label}</div>
                  <div className="text-lg font-bold text-slate-900 mt-1">{item.value}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Phase Scope notice */}
        <div className="bg-cream border border-tomato/10 rounded-3xl p-6 shadow-2xs">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-white text-tomato rounded-2xl border border-tomato/10 shadow-2xs shrink-0">
              <LayoutDashboard size={22} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 font-display">
                Staff Authentication & Guard Verification Complete
              </h2>
              <p className="text-slate-600 text-sm mt-1.5 leading-relaxed">
                You are currently in the Staff dashboard. This endpoint is secured using full JWT profile tracking. If you attempt to manipulate the URL and navigate to <code>/admin/dashboard</code>, our route guards will immediately detect the unauthorized role and block access.
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
