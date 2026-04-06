import { create } from 'zustand';

// Made properties optional so the store can hold a "partial" profile 
// during the signup/onboarding transition.
interface UserProfile {
  id: string;
  full_name?: string;
  role?: 'rider' | 'driver';
  onboarded?: boolean;
  phone_number?: string; // Added this to match your SQL schema
}

interface UserState {
  profile: UserProfile | null;
  setProfile: (profile: UserProfile | null) => void;
  
  // hasProfile is used for the "Flicker Fix" in App.tsx
  hasProfile: boolean | null; 
  setHasProfile: (status: boolean | null) => void;

  notification: { 
    message: string; 
    visible: boolean; 
  };
  
  showToast: (msg: string) => void;
}

export const useUserStore = create<UserState>((set) => ({
  profile: null,
  setProfile: (profile) => set({ 
    profile, 
    // Automatically sync hasProfile based on the onboarded status
    hasProfile: profile?.onboarded ?? false 
  }),

  hasProfile: null,
  setHasProfile: (status) => set({ hasProfile: status }),

  notification: { 
    message: '', 
    visible: false 
  },

  showToast: (msg) => {
    // Basic debounce to prevent toast overlapping
    set({ notification: { message: msg, visible: true } });
    
    setTimeout(() => {
      set({ notification: { message: '', visible: false } });
    }, 3000);
  },
}));