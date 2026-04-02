import { create } from 'zustand';

interface UserState {
  hasProfile: boolean;
  setHasProfile: (status: boolean) => void;
}

export const useUserStore = create<UserState>((set) => ({
  hasProfile: false, // Default state
  setHasProfile: (status) => set({ hasProfile: status }),
}));