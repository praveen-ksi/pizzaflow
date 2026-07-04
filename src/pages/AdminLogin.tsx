/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, Mail, Lock, AlertCircle, Eye, EyeOff, UserPlus, LogIn, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';

export const AdminLogin: React.FC = () => {
  const { signIn, signUp, error, loading, clearError, isDemoMode } = useAuth();
  const navigate = useNavigate();

  // Mode: 'signin' | 'signup'
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signin');
  
  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    clearError();

    if (!email || !password) {
      setFormError('Please enter both email and password.');
      return;
    }

    try {
      await signIn(email, password, 'admin');
      navigate('/admin/dashboard');
    } catch (err: any) {
      // Error is caught and set by AuthContext
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    clearError();
    setSuccessMsg(null);

    if (!email || !password || !fullName) {
      setFormError('Please fill in all registration fields.');
      return;
    }

    if (password.length < 6) {
      setFormError('Password must be at least 6 characters.');
      return;
    }

    try {
      await signUp(email, password, fullName, 'admin');
      setSuccessMsg('Admin profile registered successfully! You can now sign in.');
      setActiveTab('signin');
      setPassword(''); // clear password for login
    } catch (err: any) {
      // Error is caught by AuthContext
    }
  };

  return (
    <div className="min-h-screen bg-cream flex items-stretch font-sans">
      
      {/* Brand Panel (Left Column) - Inspired directly by Sleek Interface Brand Panel */}
      <div className="hidden lg:flex w-[460px] bg-tomato text-white p-16 flex-col justify-between relative overflow-hidden shrink-0">
        {/* Rounded visual circle background */}
        <div className="absolute bottom-[-100px] right-[-100px] w-[300px] h-[300px] bg-white/5 rounded-full pointer-events-none" />
        <div className="absolute top-[-50px] left-[-50px] w-[200px] h-[200px] bg-white/5 rounded-full pointer-events-none" />

        <div className="relative z-10">
          <Link to="/" className="inline-flex items-center gap-3.5 hover:opacity-90 transition">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg shadow-black/10">
              <span className="text-tomato font-black text-2xl">P</span>
            </div>
            <span className="text-2xl font-bold tracking-tight font-display">PizzaFlow</span>
          </Link>
        </div>

        <div className="relative z-10 my-auto space-y-6">
          <h1 className="text-5xl font-extrabold font-display leading-[1.1] tracking-tight">
            Streamline your slice.
          </h1>
          <p className="text-white/90 text-sm leading-relaxed max-w-[280px]">
            The central hub for managing inventory, orders, and delivery flow across all locations.
          </p>
        </div>

        <div className="relative z-10 text-xs text-white/60 font-mono">
          © 2026 PizzaFlow Enterprise v2.4.0
        </div>
      </div>

      {/* Auth Panel (Right/Central Area) */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
        <div className="max-w-[440px] w-full">
          
          {/* Back to Home Link for smaller screens */}
          <div className="mb-6 lg:hidden flex justify-center">
            <Link to="/" className="inline-flex items-center gap-2.5">
              <div className="w-9 h-9 bg-tomato rounded-lg flex items-center justify-center shadow-md">
                <span className="text-white font-extrabold text-lg">P</span>
              </div>
              <span className="text-xl font-bold tracking-tight text-slate-900 font-display">PizzaFlow</span>
            </Link>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="bg-white rounded-[24px] p-8 sm:p-10 shadow-xl shadow-slate-100 border border-slate-100"
          >
            {/* Header Title */}
            <div className="mb-8">
              <div className="flex items-center gap-2 text-rose-600 font-semibold text-xs font-mono tracking-wider mb-2 uppercase">
                <ShieldCheck size={14} />
                Admin Portal Gate
              </div>
              <h2 className="text-2xl font-bold font-display text-slate-900 tracking-tight">Welcome Back</h2>
              <p className="text-slate-500 text-sm mt-1">Sign in to your administrator dashboard</p>
            </div>

            {/* Role Toggle Tabs */}
            <div className="grid grid-cols-2 bg-slate-100 p-1 rounded-xl mb-6">
              <button
                id="tab-admin-signin"
                onClick={() => {
                  setActiveTab('signin');
                  setFormError(null);
                  clearError();
                  setSuccessMsg(null);
                }}
                className={`py-2.5 px-3 rounded-lg text-xs font-bold transition-all duration-200 ${
                  activeTab === 'signin'
                    ? 'bg-white text-tomato shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Sign In
              </button>
              <button
                id="tab-admin-signup"
                onClick={() => {
                  setActiveTab('signup');
                  setFormError(null);
                  clearError();
                  setSuccessMsg(null);
                }}
                className={`py-2.5 px-3 rounded-lg text-xs font-bold transition-all duration-200 ${
                  activeTab === 'signup'
                    ? 'bg-white text-tomato shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Register Admin
              </button>
            </div>

            {/* Messages */}
            {successMsg && (
              <div className="mb-5 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
                <span className="font-bold">✓</span>
                {successMsg}
              </div>
            )}

            {(formError || error) && (
              <div className="mb-5 p-3.5 bg-rose-50 border border-rose-100 text-rose-900 rounded-xl text-xs flex items-start gap-2.5">
                <AlertCircle size={16} className="shrink-0 mt-0.5 text-tomato" />
                <span>{formError || error}</span>
              </div>
            )}

            {isDemoMode && activeTab === 'signup' && (
              <div className="mb-5 p-3 bg-amber-50 border border-amber-100 text-amber-900 rounded-xl text-xs font-mono">
                ⚡ Sandbox Mode: Admins register instantly to browser storage.
              </div>
            )}

            {activeTab === 'signin' ? (
              /* SIGN IN */
              <form onSubmit={handleSignIn} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Work Email
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Mail size={16} />
                    </div>
                    <input
                      id="admin-email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="admin@pizzaflow.com"
                      className="block w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-tomato focus:bg-white transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock size={16} />
                    </div>
                    <input
                      id="admin-password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="block w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-tomato focus:bg-white transition-all"
                    />
                    <button
                      id="btn-toggle-admin-password"
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <button
                  id="btn-admin-submit-login"
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl font-bold bg-tomato hover:bg-tomato-hover text-white transition-all duration-200 shadow-md shadow-tomato/10 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <LogIn size={18} />
                      Sign In to Dashboard
                    </>
                  )}
                </button>
              </form>
            ) : (
              /* SIGN UP */
              <form onSubmit={handleSignUp} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Full Name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <ShieldCheck size={16} />
                    </div>
                    <input
                      id="admin-signup-fullname"
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Chef de Cuisine"
                      className="block w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-tomato focus:bg-white transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Work Email
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Mail size={16} />
                    </div>
                    <input
                      id="admin-signup-email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="chef@pizzaflow.com"
                      className="block w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-tomato focus:bg-white transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock size={16} />
                    </div>
                    <input
                      id="admin-signup-password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      className="block w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-tomato focus:bg-white transition-all"
                    />
                    <button
                      id="btn-toggle-admin-signup-password"
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <button
                  id="btn-admin-submit-signup"
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl font-bold bg-tomato hover:bg-tomato-hover text-white transition-all duration-200 shadow-md shadow-tomato/10 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <UserPlus size={18} />
                      Create Admin Profile
                    </>
                  )}
                </button>
              </form>
            )}

            {/* Links to switch portals */}
            <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col items-center gap-3 text-xs">
              <span className="text-slate-400 font-semibold font-sans">Looking for kitchen controls?</span>
              <Link
                to="/staff/login"
                className="flex items-center gap-1 text-tomato hover:text-tomato-hover font-bold tracking-wide transition-colors"
              >
                Switch to Staff Portal
                <ArrowRight size={14} />
              </Link>
            </div>

          </motion.div>
        </div>
      </div>
    </div>
  );
};
