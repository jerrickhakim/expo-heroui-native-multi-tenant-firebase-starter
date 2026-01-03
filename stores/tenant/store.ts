import type { TenantConfig, TenantData, TenantUserData, UserCapability, UserRole } from "@/types/tenants";
import { create } from "zustand";

interface TenantState {
  collection: string | null;
  tenantId: string | null;
  loading: boolean;
  config: TenantConfig | null;
  tenant: TenantData | null;
  userAccess: TenantUserData | null;
  error: string | null;
}

interface TenantActions {
  setCollection: (collection: string | null) => void;
  setTenantId: (tenantId: string | null) => void;
  setLoading: (loading: boolean) => void;
  setConfig: (config: TenantConfig | null) => void;
  setTenant: (tenant: TenantData | null) => void;
  setUserAccess: (userAccess: TenantUserData | null) => void;
  setError: (error: string | null) => void;
  reset: () => void;
  hasRole: (roles: UserRole[]) => boolean;
  hasCapability: (capabilities: UserCapability[]) => boolean;
}

type TenantStore = TenantState & TenantActions;

const initialState: TenantState = {
  collection: null,
  tenantId: null,
  loading: true,
  config: null,
  tenant: null,
  userAccess: null,
  error: null,
};

export const useTenantStore = create<TenantStore>((set, get) => ({
  ...initialState,
  setCollection: (collection: string | null) => set({ collection }),
  setTenantId: (tenantId: string | null) => set({ tenantId }),
  setLoading: (loading) => set({ loading }),
  setConfig: (config) => set({ config }),
  setTenant: (tenant) => set({ tenant }),
  setUserAccess: (userAccess) => set({ userAccess }),
  setError: (error: string | null) => set({ error }),
  reset: () => set(initialState),
  hasRole: (roles: UserRole[]) => {
    const { userAccess } = get();
    if (!userAccess) return false;
    return roles.includes(userAccess.role);
  },
  hasCapability: (capabilities: UserCapability[]) => {
    const { userAccess } = get();
    if (!userAccess) return false;
    return capabilities.some((cap) => userAccess.capabilities.includes(cap));
  },
}));

//
// Action Hooks
//
// export const setCollection = (collection: string | null) => useTenantStore((state) => state.setCollection(collection));

// export const setTenantId = (tenantId: string | null) => useTenantStore((state) => state.setTenantId(tenantId));

//
// Selector hooks
//
export const useTenantConfig = () => useTenantStore((state) => state.config);
export const useTenant = () => useTenantStore((state) => state.tenant);
export const useUserAccess = () => useTenantStore((state) => state.userAccess);
export const useTenantLoading = () => useTenantStore((state) => state.loading);

export const useHasRole = (roles: UserRole[]) => {
  const userAccess = useTenantStore((state) => state.userAccess);
  if (!userAccess) return false;
  return roles.includes(userAccess.role);
};

export const useHasCapability = (capabilities: UserCapability[]) => {
  const userAccess = useTenantStore((state) => state.userAccess);
  if (!userAccess) return false;
  return capabilities.some((cap) => userAccess.capabilities.includes(cap));
};

export const useHasRoleOrCapability = (roles: UserRole[], capabilities: UserCapability[]) => {
  const hasRole = useHasRole(roles);
  const hasCapability = useHasCapability(capabilities);
  return hasRole || hasCapability;
};
