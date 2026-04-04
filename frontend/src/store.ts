import { create } from 'zustand';

interface UserState {
  hasProfile: boolean | null;
  setHasProfile: (status: boolean | null) => void;
}

export const useUserStore = create<UserState>((set) => ({
  hasProfile: null,
  setHasProfile: (status) => set({ hasProfile: status }),
}));