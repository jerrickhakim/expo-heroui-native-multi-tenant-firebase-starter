import config from "@/_config.json";
import { auth } from "@/integrations/firebase.client";
import type { TenantData } from "@/types/tenants";
import type { User } from "@/types/user";
import { create } from "zustand";

// Tenant types from config
export type TenantType = keyof typeof config.tenants;

interface AuthState {
  loading: boolean;
  user: User | null;
  isAdmin: boolean;
  tenants: Record<TenantType, TenantData[]>;
  tenantsLoading: Record<TenantType, boolean>;
}

interface AuthActions {
  setLoading: (loading: boolean) => void;
  setUser: (user: User | null) => void;
  setIsAdmin: (isAdmin: boolean) => void;
  setTenantData: (tenantType: TenantType, data: TenantData[]) => void;
  setTenantLoading: (tenantType: TenantType, loading: boolean) => void;
  setAllTenantsLoading: (loading: boolean) => void;
  setBatchTenantData: (data: Record<TenantType, TenantData[]>) => void;
  resetTenants: () => void;
  resetAuth: () => void;
  refreshUser: () => void;
}

type AuthStore = AuthState & AuthActions;

// Dynamically build initial state from config
const tenantKeys = Object.keys(config.tenants) as TenantType[];

const initialTenants = tenantKeys.reduce((acc, key) => ({ ...acc, [key]: [] }), {} as Record<TenantType, TenantData[]>);

const initialTenantsLoading = tenantKeys.reduce((acc, key) => ({ ...acc, [key]: true }), {} as Record<TenantType, boolean>);

export { tenantKeys };

export const useAuthStore = create<AuthStore>((set) => ({
  loading: true,
  user: null,
  isAdmin: false,
  tenants: initialTenants,
  tenantsLoading: initialTenantsLoading,

  setLoading: (loading) => set({ loading }),
  setUser: (user) => set({ user }),
  setIsAdmin: (isAdmin) => set({ isAdmin }),

  setTenantData: (tenantType, data) =>
    set((state) => ({
      tenants: { ...state.tenants, [tenantType]: data },
    })),

  setTenantLoading: (tenantType, loading) =>
    set((state) => ({
      tenantsLoading: { ...state.tenantsLoading, [tenantType]: loading },
    })),

  setAllTenantsLoading: (loading) =>
    set({
      tenantsLoading: tenantKeys.reduce((acc, key) => ({ ...acc, [key]: loading }), {} as Record<TenantType, boolean>),
    }),

  setBatchTenantData: (data) =>
    set({
      tenants: data,
      tenantsLoading: tenantKeys.reduce((acc, key) => ({ ...acc, [key]: false }), {} as Record<TenantType, boolean>),
    }),

  resetTenants: () =>
    set({
      tenants: initialTenants,
      tenantsLoading: initialTenantsLoading,
    }),

  resetAuth: () =>
    set({
      user: null,
      isAdmin: false,
      tenants: initialTenants,
      tenantsLoading: initialTenantsLoading,
    }),

  refreshUser: async () => {
    const user = auth.currentUser;
    if (user) {
      set({ user });
    }
  },
}));

// Selectors
export const useIsAuthenticated = () => {
  const { user } = useAuthStore();
  return user !== null;
};

export const useTenants = (tenantType: TenantType) => {
  return useAuthStore((state) => state.tenants[tenantType]);
};

export const useTenantsLoading = (tenantType: TenantType) => {
  return useAuthStore((state) => state.tenantsLoading[tenantType]);
};

export const useAllTenantsLoading = () => {
  return useAuthStore((state) => Object.values(state.tenantsLoading).some((loading) => loading));
};

export const useIsAdmin = () => {
  return useAuthStore((state) => state.isAdmin);
};
