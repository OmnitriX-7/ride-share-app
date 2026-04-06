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
  // Merges new data into the existing profile to prevent data loss
  setProfile: (updates: Partial<UserProfile> | null) => void;
  
  // hasProfile: null (loading), false (not onboarded), true (ready)
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
      return { profile: null, hasProfile: false };
    }

    // Merge existing profile with new updates
    const updatedProfile = state.profile 
      ? { ...state.profile, ...updates } 
      : (updates as UserProfile);

    return { 
      profile: updatedProfile,
      // If the update contains 'onboarded', sync hasProfile immediately
      hasProfile: updatedProfile.onboarded ?? false
    };
  }),

  hasProfile: null,
  setHasProfile: (status) => set({ hasProfile: status }),

  notification: { 
    message: '', 
    visible: false 
  },

  showToast: (msg) => {
    // Immediate reset if a toast is already visible to "restart" the animation
    set({ notification: { message: msg, visible: true } });
    
    // Clear after 3 seconds
    setTimeout(() => {
      set((state) => {
        // Only clear if the message hasn't changed (prevents race conditions)
        if (state.notification.message === msg) {
          return { notification: { message: '', visible: false } };
        }
        return state;
      });
    }, 3000);
  },
}));