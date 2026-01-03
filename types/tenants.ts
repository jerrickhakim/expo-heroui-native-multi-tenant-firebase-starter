// ============================================================================
// Tenant Config (from _config.json)
// ============================================================================

export interface TenantRoleConfig {
  value: string;
  label: string;
  description: string;
  icon: string;
}

export interface TenantConfig {
  collection: string;
  singular: string;
  plural: string;
  description: string;
  icon: string;
  defaultRole: string;
  roles: TenantRoleConfig[];
  capabilities: Record<string, string[]>;
}

// ============================================================================
// User Roles & Capabilities
// ============================================================================

// User roles - string type to allow config-driven roles
export type UserRole = "admin" | "teamMember" | "viewer" | string;

// User capabilities - can be extended based on config
export type UserCapability = string;

// ============================================================================
// Timestamp Type (works for both client and server SDKs)
// ============================================================================

export type FirebaseTimestamp = {
  seconds: number;
  nanoseconds: number;
  toDate: () => Date;
};

// ============================================================================
// Tenant Types
// ============================================================================

export interface TenantData {
  id: string;
  name: string;
  createdBy: string;
  createdAt: FirebaseTimestamp;
  updatedAt: FirebaseTimestamp;
  users: Record<string, boolean>;
  settings?: Record<string, unknown>;
}

export interface TenantUserData {
  uid: string;
  role: UserRole;
  capabilities: UserCapability[];
  addedAt: FirebaseTimestamp;
  addedBy: string;
}

export interface TenantUserWithProfile extends TenantUserData {
  displayName: string | null;
  email: string | null;
  avatar: string | null;
  photoURL: string | null;
}

// ============================================================================
// Options Types
// ============================================================================

export interface CreateTenantOptions {
  name: string;
  tenantType: string;
  settings?: Record<string, unknown>;
}

export interface AddUserOptions {
  userId: string;
  role?: UserRole;
  capabilities?: UserCapability[];
}

export interface SetRoleOptions {
  userId: string;
  role: UserRole;
}

export interface SetCapabilitiesOptions {
  userId: string;
  capabilities: UserCapability[];
}

// ============================================================================
// Task Types
// ============================================================================

export interface TaskData {
  id: string;
  title: string;
  description?: string;
  status: "todo" | "in_progress" | "completed" | "archived";
  priority: "low" | "medium" | "high" | "urgent";
  assignedTo?: string;
  createdBy: string;
  createdAt: FirebaseTimestamp;
  updatedAt: FirebaseTimestamp;
  dueDate?: FirebaseTimestamp;
  completedAt?: FirebaseTimestamp;
}

// ============================================================================
// Constructor Types
// ============================================================================

export interface TenantManagerOptions {
  userId: string;
  collection: string;
}
