import { create } from 'zustand';

interface UserState {
  hasProfile: boolean | null;
  setHasProfile: (status: boolean | null) => void;
  
  // --- NEW: NOTIFICATION STATE ---
  notification: { 
    message: string; 
    visible: boolean; 
  };
  
  // Call this function from any component to trigger the pop-up
  showToast: (msg: string) => void;
}

export const useUserStore = create<UserState>((set) => ({
  hasProfile: null,
  setHasProfile: (status) => set({ hasProfile: status }),

  // Initial state: empty and hidden
  notification: { 
    message: '', 
    visible: false 
  },

  showToast: (msg) => {
    // 1. Set the message and make it visible
    set({ notification: { message: msg, visible: true } });

    // 2. Automatically hide after 3 seconds (3000ms)
    setTimeout(() => {
      set({ notification: { message: '', visible: false } });
    }, 3000);
  },
}));