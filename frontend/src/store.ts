import { create } from 'zustand';

interface UserProfile {
  id: string;
  full_name?: string;
  role?: 'rider' | 'driver';
  onboarded?: boolean;
  phone_number?: string;
}

interface UserState {
  profile: UserProfile | null;
  setProfile: (updates: Partial<UserProfile> | null) => void;
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
  
  setProfile: (updates) => set((state) => {
    if (updates === null) {
      return { profile: null, hasProfile: null };
    }

    const updatedProfile = state.profile 
      ? { ...state.profile, ...updates } 
      : (updates as UserProfile);

    return { 
      profile: updatedProfile,
      hasProfile: typeof updatedProfile.onboarded === 'boolean' 
        ? updatedProfile.onboarded 
        : state.hasProfile
    };
  }),

  hasProfile: null,
  setHasProfile: (status) => set({ hasProfile: status }),

  notification: { 
    message: '', 
    visible: false 
  },

  showToast: (msg) => {
    set({ notification: { message: msg, visible: true } });
    
    setTimeout(() => {
      set((state) => {
        if (state.notification.message === msg) {
          return { notification: { message: '', visible: false } };
        }
        return state;
      });
    }, 3000);
  },
}));