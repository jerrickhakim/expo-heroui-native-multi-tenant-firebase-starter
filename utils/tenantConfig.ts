import config from "@/_config.json";
import type { UserCapability, UserRole } from "@/types/tenants";

// ============================================================================
// Types from Config
// ============================================================================

export interface RoleConfig {
  value: string;
  label: string;
  description: string;
  icon: string;
}

export interface TenantTypeConfig {
  singular: string;
  plural: string;
  description: string;
  icon: string;
  defaultRole: string;
  roles: RoleConfig[];
  capabilities: Record<string, string[]>;
}

// ============================================================================
// Config Accessors
// ============================================================================

/**
 * Get the configuration for a specific tenant type
 */
export const getTenantConfig = (tenantType: string): TenantTypeConfig | null => {
  const tenantConfig = config.tenants[tenantType as keyof typeof config.tenants];
  return (tenantConfig as TenantTypeConfig) || null;
};

/**
 * Get all available tenant types
 */
export const getTenantTypes = (): string[] => {
  return Object.keys(config.tenants);
};

// ============================================================================
// Role Helpers
// ============================================================================

/**
 * Get all role configurations for a tenant type
 */
export const getRoles = (tenantType: string): RoleConfig[] => {
  const tenantConfig = getTenantConfig(tenantType);
  return tenantConfig?.roles || [];
};

/**
 * Get role values (just the string values) for a tenant type
 */
export const getRoleValues = (tenantType: string): string[] => {
  return getRoles(tenantType).map((role) => role.value);
};

/**
 * Get a specific role configuration
 */
export const getRole = (tenantType: string, roleValue: string): RoleConfig | null => {
  const roles = getRoles(tenantType);
  return roles.find((role) => role.value === roleValue) || null;
};

/**
 * Get the default role for a tenant type
 */
export const getDefaultRole = (tenantType: string): UserRole => {
  const tenantConfig = getTenantConfig(tenantType);
  return (tenantConfig?.defaultRole as UserRole) || "teamMember";
};

// ============================================================================
// Capability Helpers
// ============================================================================

/**
 * Get default capabilities for a role in a tenant type
 */
export const getDefaultCapabilities = (tenantType: string, role: UserRole): UserCapability[] => {
  const tenantConfig = getTenantConfig(tenantType);
  if (!tenantConfig?.capabilities) return [];
  return (tenantConfig.capabilities[role as keyof typeof tenantConfig.capabilities] as UserCapability[]) || [];
};

/**
 * Get all available capabilities for a tenant type (union of all role capabilities)
 */
export const getAllCapabilities = (tenantType: string): UserCapability[] => {
  const tenantConfig = getTenantConfig(tenantType);
  if (!tenantConfig?.capabilities) return [];

  const caps = new Set<string>();
  Object.values(tenantConfig.capabilities).forEach((roleCaps) => {
    (roleCaps as string[]).forEach((cap) => caps.add(cap));
  });

  return Array.from(caps).sort() as UserCapability[];
};

// ============================================================================
// Capability Check Helpers (for use in components)
// ============================================================================

/**
 * Check if capabilities array includes any of the required capabilities
 */
export const hasCapability = (userCapabilities: UserCapability[], requiredCapabilities: UserCapability[]): boolean => {
  return requiredCapabilities.some((cap) => userCapabilities.includes(cap));
};

/**
 * Check if a role matches any of the required roles
 */
export const hasRole = (userRole: UserRole, requiredRoles: UserRole[]): boolean => {
  return requiredRoles.includes(userRole);
};

// ============================================================================
// Formatting Helpers
// ============================================================================

/**
 * Format a capability name for display (e.g., "users.add" -> "Users → Add")
 */
export const formatCapabilityName = (capability: string): string => {
  return capability
    .split(".")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" → ")
    .replace(/_/g, " ");
};
