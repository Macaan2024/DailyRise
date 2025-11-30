import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkUser = async () => {
    try {
      const storedUser = localStorage.getItem('dailyrise_user');
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        setUser(userData);
        await fetchUserProfile(userData.id);
      }
    } catch (error) {
      console.error('Error checking user:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      setUserProfile(data);
      return data;
    } catch (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
  };

  const signUp = async (email, password, firstname, lastname) => {
    try {
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .single();

      if (existingUser) {
        return { error: { message: 'Email already exists' } };
      }

      const { data, error } = await supabase
        .from('users')
        .insert([
          {
            email,
            password,
            firstname,
            lastname,
          }
        ])
        .select()
        .single();

      if (error) throw error;

      localStorage.setItem('dailyrise_user', JSON.stringify(data));
      setUser(data);
      setUserProfile(data);
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  };

  const signIn = async (email, password) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .eq('password', password)
        .single();

      if (error || !data) {
        return { error: { message: 'Invalid email or password' } };
      }

      localStorage.setItem('dailyrise_user', JSON.stringify(data));
      setUser(data);
      setUserProfile(data);
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  };

  const signOut = async () => {
    localStorage.removeItem('dailyrise_user');
    setUser(null);
    setUserProfile(null);
  };

  const updateProfile = async (updates) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw error;

      localStorage.setItem('dailyrise_user', JSON.stringify(data));
      setUser(data);
      setUserProfile(data);
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  };

  const updatePassword = async (currentPassword, newPassword) => {
    try {
      const { data: userData } = await supabase
        .from('users')
        .select('password')
        .eq('id', user.id)
        .single();

      if (userData.password !== currentPassword) {
        return { error: { message: 'Current password is incorrect' } };
      }

      const { data, error } = await supabase
        .from('users')
        .update({ password: newPassword })
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw error;

      localStorage.setItem('dailyrise_user', JSON.stringify(data));
      setUser(data);
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  };

  const resetPassword = async (email, newPassword) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .update({ password: newPassword })
        .eq('email', email)
        .select()
        .single();

      if (error || !data) {
        return { error: { message: 'Email not found' } };
      }

      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  };

  const value = {
    user,
    userProfile,
    loading,
    signUp,
    signIn,
    signOut,
    updateProfile,
    updatePassword,
    resetPassword,
    fetchUserProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
