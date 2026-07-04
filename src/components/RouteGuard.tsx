/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, LogOut, ArrowLeftRight } from 'lucide-react';
import { motion } from 'motion/react';

interface RouteGuardProps {
  children: React.ReactNode;
  allowedRole: 'admin' | 'staff';
}

export const RouteGuard: React.FC<RouteGuardProps> = ({ children, allowedRole }) => {
  const { user, profile, loading, signOut } = useAuth();

  // Loading state with an elegant pizza spinning slice or loader
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-100 font-sans">
        <div className="relative flex items-center justify-center">
          <motion.div
            className="w-16 h-16 border-4 border-t-amber-500 border-r-amber-500/30 border-b-amber-500/10 border-l-amber-500/50 rounded-full"
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          />
          <span className="absolute text-amber-500 font-bold text-xl">🍕</span>
        </div>
        <p className="mt-4 text-slate-400 font-mono text-sm tracking-wider animate-pulse">
          VERIFYING ACCESS PERMISSIONS...
        </p>
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    // Redirect to the correct login page based on where they tried to go
    const redirectPath = allowedRole === 'admin' ? '/admin/login' : '/staff/login';
    return <Navigate to={redirectPath} replace />;
  }

  // Authenticated but wrong role
  if (profile && profile.role !== allowedRole) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4 font-sans selection:bg-amber-500/30">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="max-w-md w-full bg-slate-900 border border-red-500/20 rounded-2xl p-8 shadow-2xl relative overflow-hidden"
        >
          {/* Subtle Red glow */}
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-red-500/50" />
          
          <div className="flex flex-col items-center text-center">
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-full text-red-400 mb-6">
              <ShieldAlert size={40} className="animate-pulse" />
            </div>

            <h1 className="text-2xl font-semibold tracking-tight text-white mb-2 font-sans">
              Access Restricted
            </h1>
            
            <p className="text-slate-400 text-sm mb-6 leading-relaxed">
              You are logged in as <span className="text-amber-500 font-medium">{profile.full_name}</span> with a{' '}
              <span className="text-slate-200 font-mono font-bold bg-slate-800/80 px-2 py-0.5 rounded text-xs border border-slate-700/50">
                {profile.role.toUpperCase()}
              </span>{' '}
              profile. This area is reserved strictly for{' '}
              <span className="text-amber-500 font-mono font-bold bg-slate-800/80 px-2 py-0.5 rounded text-xs border border-slate-700/50">
                {allowedRole.toUpperCase()}
              </span>{' '}
              users.
            </p>

            <div className="w-full space-y-3">
              <button
                id="btn-switch-portal"
                onClick={() => {
                  window.location.href = allowedRole === 'admin' ? '/admin/login' : '/staff/login';
                }}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium bg-amber-500 hover:bg-amber-600 text-slate-950 transition duration-200 shadow-lg shadow-amber-500/10"
              >
                <ArrowLeftRight size={18} />
                Switch to {allowedRole.charAt(0).toUpperCase() + allowedRole.slice(1)} Portal
              </button>

              <button
                id="btn-access-denied-logout"
                onClick={() => signOut()}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium border border-slate-700 hover:bg-slate-800/50 text-slate-300 transition duration-200"
              >
                <LogOut size={18} />
                Sign Out Account
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  // Correct role, allow entry
  return <>{children}</>;
};
