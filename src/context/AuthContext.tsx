/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Profile } from '../types';

interface AuthContextType {
  user: any | null;
  profile: Profile | null;
  loading: boolean;
  error: string | null;
  isDemoMode: boolean;
  signIn: (email: string, password: string, expectedRole: 'admin' | 'staff') => Promise<void>;
  signUp: (email: string, password: string, fullName: string, role: 'admin' | 'staff') => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Local storage keys for Mock/Demo mode
const MOCK_USERS_KEY = 'pizzaflow_mock_users';
const MOCK_PROFILES_KEY = 'pizzaflow_mock_profiles';
const MOCK_SESSION_KEY = 'pizzaflow_mock_session';

// Pre-seeded mock data
const DEFAULT_MOCK_USERS = [
  { id: 'mock-admin-id', email: 'admin@pizzaflow.com', password: 'password123' },
  { id: 'mock-staff-id', email: 'staff@pizzaflow.com', password: 'password123' },
];

const DEFAULT_MOCK_PROFILES: Profile[] = [
  { id: 'mock-admin-id', role: 'admin', full_name: 'Admin Chef', created_at: new Date().toISOString() },
  { id: 'mock-staff-id', role: 'staff', full_name: 'Staff Kitchen', created_at: new Date().toISOString() },
];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(!isSupabaseConfigured);

  // Initialize mock data in localStorage if not exists
  useEffect(() => {
    if (!localStorage.getItem(MOCK_USERS_KEY)) {
      localStorage.setItem(MOCK_USERS_KEY, JSON.stringify(DEFAULT_MOCK_USERS));
    }
    if (!localStorage.getItem(MOCK_PROFILES_KEY)) {
      localStorage.setItem(MOCK_PROFILES_KEY, JSON.stringify(DEFAULT_MOCK_PROFILES));
    }
  }, []);

  // Initialize Auth State (Listen to Real or Mock sessions)
  useEffect(() => {
    const initializeAuth = async () => {
      setLoading(true);
      setError(null);

      if (isSupabaseConfigured && supabase) {
        setIsDemoMode(false);
        try {
          // Get current session
          const { data: { session }, error: sessionError } = await supabase.auth.getSession();
          if (sessionError) throw sessionError;

          if (session?.user) {
            setUser(session.user);
            // Fetch profile
            const { data: profileData, error: profileError } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single();

            if (profileError) {
              // Profile might not exist yet, or other db issue
              console.error('Error fetching profile:', profileError);
              setProfile(null);
            } else {
              setProfile(profileData as Profile);
            }
          } else {
            setUser(null);
            setProfile(null);
          }
        } catch (err: any) {
          console.error('Initialization error:', err);
          setError(err.message || 'Failed to connect to Supabase.');
        } finally {
          setLoading(false);
        }

        // Listen for auth state changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
          setLoading(true);
          if (session?.user) {
            setUser(session.user);
            const { data: profileData } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single();
            setProfile(profileData as Profile);
          } else {
            setUser(null);
            setProfile(null);
          }
          setLoading(false);
        });

        return () => {
          subscription.unsubscribe();
        };
      } else {
        // Mock Session Initialization
        setIsDemoMode(true);
        const savedSession = localStorage.getItem(MOCK_SESSION_KEY);
        if (savedSession) {
          try {
            const parsed = JSON.parse(savedSession);
            setUser(parsed.user);
            setProfile(parsed.profile);
          } catch (e) {
            console.error('Failed to parse mock session', e);
            localStorage.removeItem(MOCK_SESSION_KEY);
          }
        }
        setLoading(false);
      }
    };

    initializeAuth();
  }, [isDemoMode]);

  // Sign In implementation
  const signIn = async (email: string, password: string, expectedRole: 'admin' | 'staff') => {
    setLoading(true);
    setError(null);

    if (isSupabaseConfigured && supabase) {
      try {
        const { data: { user: authUser }, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) throw signInError;
        if (!authUser) throw new Error('No user returned after sign in.');

        // Fetch profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authUser.id)
          .single();

        if (profileError || !profileData) {
          await supabase.auth.signOut();
          throw new Error(`Profile not found. Please ensure your profiles table is seeded.`);
        }

        const userProfile = profileData as Profile;

        // Role Validation
        if (userProfile.role !== expectedRole) {
          await supabase.auth.signOut();
          throw new Error(
            `Access Denied: The account linked to "${email}" is registered as a ${userProfile.role.toUpperCase()} and cannot log in through the ${expectedRole.toUpperCase()} portal.`
          );
        }

        setUser(authUser);
        setProfile(userProfile);
      } catch (err: any) {
        setError(err.message || 'Authentication failed.');
        throw err;
      } finally {
        setLoading(false);
      }
    } else {
      // Mock Sign In
      return new Promise<void>((resolve, reject) => {
        setTimeout(() => {
          try {
            const mockUsers = JSON.parse(localStorage.getItem(MOCK_USERS_KEY) || '[]');
            const mockProfiles = JSON.parse(localStorage.getItem(MOCK_PROFILES_KEY) || '[]');

            const foundUser = mockUsers.find(
              (u: any) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
            );

            if (!foundUser) {
              const err = new Error('Invalid email or password.');
              setError(err.message);
              setLoading(false);
              return reject(err);
            }

            const foundProfile = mockProfiles.find((p: Profile) => p.id === foundUser.id);
            if (!foundProfile) {
              const err = new Error('Profile details not found for this user.');
              setError(err.message);
              setLoading(false);
              return reject(err);
            }

            if (foundProfile.role !== expectedRole) {
              const err = new Error(
                `Access Denied: The account linked to "${email}" is registered as a ${foundProfile.role.toUpperCase()} and cannot log in through the ${expectedRole.toUpperCase()} portal.`
              );
              setError(err.message);
              setLoading(false);
              return reject(err);
            }

            const sessionUser = { id: foundUser.id, email: foundUser.email };
            setUser(sessionUser);
            setProfile(foundProfile);

            // Persist session
            localStorage.setItem(
              MOCK_SESSION_KEY,
              JSON.stringify({ user: sessionUser, profile: foundProfile })
            );

            setLoading(false);
            resolve();
          } catch (err: any) {
            setError(err.message || 'Authentication failed.');
            setLoading(false);
            reject(err);
          }
        }, 800); // realistic latency
      });
    }
  };

  // Sign Up implementation (for seeding or custom signups in dev)
  const signUp = async (email: string, password: string, fullName: string, role: 'admin' | 'staff') => {
    setLoading(true);
    setError(null);

    if (isSupabaseConfigured && supabase) {
      try {
        const { data: { user: authUser }, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              role: role,
            }
          }
        });

        if (signUpError) throw signUpError;
        if (!authUser) throw new Error('Failed to create account.');

        // Delay briefly to allow any database trigger to finish executing
        await new Promise(resolve => setTimeout(resolve, 500));

        // Check if profile was already created automatically by a database trigger
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', authUser.id)
          .maybeSingle();

        if (!existingProfile) {
          // Fallback: Create profile manually in DB (if trigger wasn't set up yet)
          const { error: profileError } = await supabase.from('profiles').insert({
            id: authUser.id,
            role,
            full_name: fullName,
            created_at: new Date().toISOString(),
          });

          if (profileError) {
            // Handle RLS/Permission blocks due to unconfirmed emails
            if (profileError.code === '42501' || profileError.message.toLowerCase().includes('row-level security') || profileError.message.toLowerCase().includes('permission denied')) {
              console.warn('Profile insert blocked by RLS. This is normal if email confirmation is enabled.');
              throw new Error(
                'Registration succeeded on Supabase Auth, but saving your profile was blocked. ' +
                'This happens when "Confirm Email" is enabled in your Supabase Dashboard. ' +
                'Please click the confirmation link sent to your email, or disable "Confirm Email" under Auth > Providers > Email to enable instant logins.'
              );
            }
            throw profileError;
          }
        }
      } catch (err: any) {
        setError(err.message || 'Registration failed.');
        throw err;
      } finally {
        setLoading(false);
      }
    } else {
      // Mock Sign Up
      return new Promise<void>((resolve, reject) => {
        setTimeout(() => {
          try {
            const mockUsers = JSON.parse(localStorage.getItem(MOCK_USERS_KEY) || '[]');
            const mockProfiles = JSON.parse(localStorage.getItem(MOCK_PROFILES_KEY) || '[]');

            if (mockUsers.some((u: any) => u.email.toLowerCase() === email.toLowerCase())) {
              const err = new Error('User already exists.');
              setError(err.message);
              setLoading(false);
              return reject(err);
            }

            const newId = `mock-${role}-${Date.now()}`;
            const newUser = { id: newId, email: email.toLowerCase(), password };
            const newProfile: Profile = {
              id: newId,
              role,
              full_name: fullName,
              created_at: new Date().toISOString(),
            };

            mockUsers.push(newUser);
            mockProfiles.push(newProfile);

            localStorage.setItem(MOCK_USERS_KEY, JSON.stringify(mockUsers));
            localStorage.setItem(MOCK_PROFILES_KEY, JSON.stringify(mockProfiles));

            setLoading(false);
            resolve();
          } catch (err: any) {
            setError(err.message || 'Registration failed.');
            setLoading(false);
            reject(err);
          }
        }, 800);
      });
    }
  };

  // Sign Out implementation
  const signOut = async () => {
    setLoading(true);
    setError(null);

    if (isSupabaseConfigured && supabase) {
      try {
        const { error: signOutError } = await supabase.auth.signOut();
        if (signOutError) throw signOutError;
      } catch (err: any) {
        console.error('Error signing out:', err);
        setError(err.message || 'Signout failed.');
      } finally {
        setUser(null);
        setProfile(null);
        setLoading(false);
      }
    } else {
      // Mock Sign Out
      localStorage.removeItem(MOCK_SESSION_KEY);
      setUser(null);
      setProfile(null);
      setLoading(false);
    }
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        error,
        isDemoMode,
        signIn,
        signUp,
        signOut,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
