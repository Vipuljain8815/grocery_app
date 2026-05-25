import { create } from 'zustand';
import { supabase } from '../lib/supabase';

interface AppSettings {
  currency_symbol: string;
  currency_code: string;
  delivery_charge: number;
  min_order_value: number;
  tax_percentage: number;
}

interface SettingsState {
  settings: AppSettings;
  isLoading: boolean;
  fetchSettings: () => Promise<void>;
}

const defaultSettings: AppSettings = {
  currency_symbol: '$',
  currency_code: 'USD',
  delivery_charge: 5.00,
  min_order_value: 10.00,
  tax_percentage: 0.00,
};

export const useSettingsStore = create<SettingsState>((set) => ({
  settings: defaultSettings,
  isLoading: true,
  fetchSettings: async () => {
    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('*')
        .limit(1)
        .single();
        
      if (data && !error) {
        set({ settings: data, isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
      set({ isLoading: false });
    }
  },
}));
