import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { Order, Address, Favorite, Product, UserProfile } from '../models';

type FavoriteWithProduct = Favorite & { product: Product };

interface DataState {
  orders: Order[];
  addresses: Address[];
  favorites: FavoriteWithProduct[];
  
  userProfile: UserProfile | null;
  
  hasLoadedOrders: boolean;
  hasLoadedAddresses: boolean;
  hasLoadedFavorites: boolean;
  hasLoadedProfile: boolean;

  fetchOrders: (userId: string) => Promise<void>;
  fetchAddresses: (userId: string) => Promise<void>;
  fetchFavorites: (userId: string) => Promise<void>;
  fetchUserProfile: (userId: string) => Promise<void>;
  updateUserProfile: (profile: Partial<UserProfile>) => void;
  
  clearData: () => void;
}

export const useDataStore = create<DataState>((set, get) => ({
  orders: [],
  addresses: [],
  favorites: [],
  
  userProfile: null,
  
  hasLoadedOrders: false,
  hasLoadedAddresses: false,
  hasLoadedFavorites: false,
  hasLoadedProfile: false,

  fetchOrders: async (userId: string) => {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (!error && data) {
      set({ orders: data as Order[], hasLoadedOrders: true });
    }
  },

  fetchAddresses: async (userId: string) => {
    const { data, error } = await supabase
      .from('addresses')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (!error && data) {
      set({ addresses: data as Address[], hasLoadedAddresses: true });
    }
  },

  fetchFavorites: async (userId: string) => {
    const { data, error } = await supabase
      .from('favorites')
      .select('*, product:products(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (!error && data) {
      set({ favorites: data as FavoriteWithProduct[], hasLoadedFavorites: true });
    }
  },

  fetchUserProfile: async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (!error && data) {
      set({ userProfile: data as UserProfile, hasLoadedProfile: true });
    }
  },

  updateUserProfile: (updates: Partial<UserProfile>) => {
    set((state) => ({
      userProfile: state.userProfile ? { ...state.userProfile, ...updates } : null
    }));
  },

  clearData: () => {
    set({
      orders: [],
      addresses: [],
      favorites: [],
      userProfile: null,
      hasLoadedOrders: false,
      hasLoadedAddresses: false,
      hasLoadedFavorites: false,
      hasLoadedProfile: false,
    });
  }
}));
