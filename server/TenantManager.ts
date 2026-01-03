import { admin, auth, db } from "@/integrations/firebase.server";
import { verifyIdToken } from "@/server/auth";
import { ConflictError, ForbiddenError, NotFoundError, UnauthorizedError, ValidationError } from "@/server/errors";
import {
  type AddUserOptions,
  type CreateTenantOptions,
  type SetCapabilitiesOptions,
  type SetRoleOptions,
  type TenantData,
  type TenantManagerOptions,
  type TenantUserData,
  type TenantUserWithProfile,
  type UserCapability,
  type UserRole,
} from "@/types/tenants";
import { getDefaultCapabilities, getDefaultRole, getTenantTypes } from "@/utils/tenantConfig";

// ============================================================================
// TenantManager Class
// ============================================================================

export class TenantManager {
  private readonly userId: string;
  private readonly collection: string;

  constructor({ userId, collection }: TenantManagerOptions) {
    this.userId = userId;
    this.collection = collection;
  }

  // --------------------------------------------------------------------------
  // Static Validation Methods
  // --------------------------------------------------------------------------

  /**
   * Validate that the tenant collection type exists in config
   * @throws ValidationError if tenant type is invalid
   */
  static validateTenantType(tenantType: string): void {
    const validTypes = getTenantTypes();
    if (!validTypes.includes(tenantType)) {
      throw new ValidationError(`Invalid tenant type: ${tenantType}`);
    }
  }

  // --------------------------------------------------------------------------
  // Static Factory Methods
  // --------------------------------------------------------------------------

  /**
   * Create a TenantManager instance from a Request by verifying the auth token
   * @throws UnauthorizedError if authentication fails
   */
  static async fromRequest(request: Request, collection: string): Promise<TenantManager> {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      throw new UnauthorizedError("Missing or invalid Authorization header");
    }

    const token = authHeader.split("Bearer ")[1];
    const decodedToken = await verifyIdToken(token);
    if (!decodedToken) {
      throw new UnauthorizedError("Invalid or expired token");
    }

    return new TenantManager({ userId: decodedToken.uid, collection });
  }

  /**
   * Get the user ID of the current authenticated user
   */
  getUserId(): string {
    return this.userId;
  }

  // --------------------------------------------------------------------------
  // Auth Verification Methods (return boolean)
  // --------------------------------------------------------------------------

  /**
   * Check if the current user has one of the specified roles in a tenant
   * @returns true if authorized, false otherwise
   */
  async verifyRole(tenantId: string, roles: UserRole[]): Promise<boolean> {
    const userData = await this.getUserRoleData(tenantId, this.userId);
    if (!userData) return false;
    return roles.includes(userData.role);
  }

  /**
   * Check if the current user has one of the specified capabilities in a tenant
   * @returns true if authorized, false otherwise
   */
  async verifyCapability(tenantId: string, capabilities: UserCapability[]): Promise<boolean> {
    const userData = await this.getUserRoleData(tenantId, this.userId);
    if (!userData) return false;
    return capabilities.some((cap) => userData.capabilities.includes(cap));
  }

  /**
   * Check if the current user has one of the specified roles OR capabilities in a tenant
   * @returns true if authorized, false otherwise
   */
  async verifyRoleOrCapability(tenantId: string, roles: UserRole[], capabilities: UserCapability[]): Promise<boolean> {
    const userData = await this.getUserRoleData(tenantId, this.userId);
    if (!userData) return false;

    const hasRole = roles.includes(userData.role);
    if (hasRole) return true;

    return capabilities.some((cap) => userData.capabilities.includes(cap));
  }

  // --------------------------------------------------------------------------
  // Auth Requirement Methods (throw on failure)
  // --------------------------------------------------------------------------

  /**
   * Require the current user has one of the specified roles in a tenant
   * @throws ForbiddenError if user lacks required role
   */
  async requireRole(tenantId: string, roles: UserRole[]): Promise<void> {
    const hasRole = await this.verifyRole(tenantId, roles);
    if (!hasRole) {
      throw new ForbiddenError(`Required role: ${roles.join(" or ")}`);
    }
  }

  /**
   * Require the current user has one of the specified capabilities in a tenant
   * @throws ForbiddenError if user lacks required capability
   */
  async requireCapability(tenantId: string, capabilities: UserCapability[]): Promise<void> {
    const hasCapability = await this.verifyCapability(tenantId, capabilities);
    if (!hasCapability) {
      throw new ForbiddenError(`Required capability: ${capabilities.join(" or ")}`);
    }
  }

  /**
   * Require the current user has one of the specified roles OR capabilities in a tenant
   * @throws ForbiddenError if user lacks both required role and capability
   */
  async requireRoleOrCapability(tenantId: string, roles: UserRole[], capabilities: UserCapability[]): Promise<void> {
    const authorized = await this.verifyRoleOrCapability(tenantId, roles, capabilities);
    if (!authorized) {
      throw new ForbiddenError(`Required: ${roles.join("/")} role or ${capabilities.join("/")} capability`);
    }
  }

  // --------------------------------------------------------------------------
  // Private Helpers
  // --------------------------------------------------------------------------

  private get tenantsCollection() {
    return db.collection(this.collection);
  }

  private tenantDoc(tenantId: string) {
    return this.tenantsCollection.doc(tenantId);
  }

  private usersCollection(tenantId: string) {
    return db.collection(`${this.collection}/${tenantId}/users`);
  }

  private userDoc(tenantId: string, userId: string) {
    return this.usersCollection(tenantId).doc(userId);
  }

  private async getTenantData(tenantId: string): Promise<TenantData | null> {
    const doc = await this.tenantDoc(tenantId).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() } as TenantData;
  }

  private async getUserRoleData(tenantId: string, userId: string): Promise<TenantUserData | null> {
    const doc = await this.userDoc(tenantId, userId).get();
    if (!doc.exists) return null;
    return doc.data() as TenantUserData;
  }

  // --------------------------------------------------------------------------
  // Tenant Operations
  // --------------------------------------------------------------------------

  /**
   * Create a new tenant with the current user as admin
   */
  async createTenant(options: CreateTenantOptions): Promise<TenantData> {
    const { name, tenantType, settings } = options;

    const tenantRef = this.tenantsCollection.doc();
    const now = admin.firestore.Timestamp.now();

    const tenantData: Omit<TenantData, "id"> = {
      name,
      createdBy: this.userId,
      createdAt: now,
      updatedAt: now,
      users: { [this.userId]: true },
      settings: settings || {},
    };

    await tenantRef.set(tenantData);

    // Add creator as admin with full capabilities from config
    const adminCapabilities = getDefaultCapabilities(tenantType, "admin");
    await this.userDoc(tenantRef.id, this.userId).set({
      uid: this.userId,
      role: "admin" as UserRole,
      capabilities: adminCapabilities,
      addedAt: now,
      addedBy: this.userId,
    });

    return { id: tenantRef.id, ...tenantData };
  }

  /**
   * Get tenant by ID
   * @throws NotFoundError if tenant doesn't exist
   */
  async getTenant(tenantId: string): Promise<TenantData> {
    const tenant = await this.getTenantData(tenantId);
    if (!tenant) {
      throw new NotFoundError("Tenant not found");
    }
    return tenant;
  }

  /**
   * Update tenant details
   * Note: Permission check should be done in API route before calling this
   */
  async updateTenant(tenantId: string, updates: Partial<Pick<TenantData, "name" | "settings">>): Promise<TenantData> {
    await this.tenantDoc(tenantId).update({
      ...updates,
      updatedAt: admin.firestore.Timestamp.now(),
    });

    return this.getTenant(tenantId);
  }

  /**
   * Delete a tenant and all associated data
   * @throws NotFoundError if tenant doesn't exist
   * @throws ForbiddenError if user is not the creator
   */
  async deleteTenant(tenantId: string): Promise<void> {
    const tenant = await this.getTenantData(tenantId);
    if (!tenant) {
      throw new NotFoundError("Tenant not found");
    }

    // Only the creator can delete the tenant
    if (tenant.createdBy !== this.userId) {
      throw new ForbiddenError("Only the tenant creator can delete it");
    }

    // Delete all user documents in the subcollection
    const usersSnapshot = await this.usersCollection(tenantId).get();
    const batch = db.batch();

    usersSnapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    // Delete the tenant document
    batch.delete(this.tenantDoc(tenantId));

    await batch.commit();
  }

  /**
   * Get all tenants for the current user
   */
  async getTenantsForUser(): Promise<TenantData[]> {
    const snapshot = await this.tenantsCollection.where(`users.${this.userId}`, "==", true).get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as TenantData[];
  }

  // --------------------------------------------------------------------------
  // User Operations
  // --------------------------------------------------------------------------

  /**
   * Add a user to a tenant
   * @throws ConflictError if user already exists in tenant
   * @throws NotFoundError if user doesn't exist in Firebase Auth
   */
  async addUser(tenantId: string, options: AddUserOptions, tenantType: string): Promise<TenantUserData> {
    const defaultRole = getDefaultRole(tenantType);
    const { userId, role = defaultRole, capabilities } = options;

    // Check if user already exists in tenant
    const existingUser = await this.getUserRoleData(tenantId, userId);
    if (existingUser) {
      throw new ConflictError("User already exists in tenant");
    }

    // Verify the user exists in Firebase Auth
    try {
      await auth.getUser(userId);
    } catch (error) {
      throw new NotFoundError("User not found in Firebase Auth");
    }

    const now = admin.firestore.Timestamp.now();
    const userCapabilities = capabilities || getDefaultCapabilities(tenantType, role);

    const userData: TenantUserData = {
      uid: userId,
      role,
      capabilities: userCapabilities,
      addedAt: now,
      addedBy: this.userId,
    };

    // Add user to users subcollection
    await this.userDoc(tenantId, userId).set(userData);

    // Add user reference to tenant document
    await this.tenantDoc(tenantId).update({
      [`users.${userId}`]: true,
      updatedAt: now,
    });

    return userData;
  }

  /**
   * Remove a user from a tenant
   * @throws NotFoundError if tenant or user doesn't exist
   * @throws ValidationError if trying to remove self or creator
   */
  async removeUser(tenantId: string, userId: string): Promise<void> {
    const tenant = await this.getTenantData(tenantId);
    if (!tenant) {
      throw new NotFoundError("Tenant not found");
    }

    // Prevent self-removal
    if (userId === this.userId) {
      throw new ValidationError("Cannot remove yourself from the tenant");
    }

    // Prevent removal of tenant creator
    if (userId === tenant.createdBy) {
      throw new ValidationError("Cannot remove the tenant creator");
    }

    // Check if user exists in tenant
    const existingUser = await this.getUserRoleData(tenantId, userId);
    if (!existingUser) {
      throw new NotFoundError("User not found in tenant");
    }

    // Remove user from users subcollection
    await this.userDoc(tenantId, userId).delete();

    // Remove user reference from tenant document
    await this.tenantDoc(tenantId).update({
      [`users.${userId}`]: admin.firestore.FieldValue.delete(),
      updatedAt: admin.firestore.Timestamp.now(),
    });
  }

  /**
   * Set a user's role
   * @throws NotFoundError if tenant or user doesn't exist
   * @throws ValidationError if trying to demote the creator
   */
  async setRole(tenantId: string, options: SetRoleOptions, tenantType: string): Promise<TenantUserData> {
    const { userId, role } = options;

    const tenant = await this.getTenantData(tenantId);
    if (!tenant) {
      throw new NotFoundError("Tenant not found");
    }

    // Prevent changing role of tenant creator
    if (userId === tenant.createdBy && role !== "admin") {
      throw new ValidationError("Cannot change the tenant creator's role from admin");
    }

    const existingUser = await this.getUserRoleData(tenantId, userId);
    if (!existingUser) {
      throw new NotFoundError("User not found in tenant");
    }

    // Update role and capabilities based on new role from config
    const updatedData = {
      role,
      capabilities: getDefaultCapabilities(tenantType, role),
    };

    await this.userDoc(tenantId, userId).update(updatedData);

    return {
      ...existingUser,
      ...updatedData,
    };
  }

  /**
   * Set a user's capabilities
   * @throws NotFoundError if user doesn't exist in tenant
   */
  async setCapabilities(tenantId: string, options: SetCapabilitiesOptions): Promise<TenantUserData> {
    const { userId, capabilities } = options;

    const existingUser = await this.getUserRoleData(tenantId, userId);
    if (!existingUser) {
      throw new NotFoundError("User not found in tenant");
    }

    await this.userDoc(tenantId, userId).update({ capabilities });

    return {
      ...existingUser,
      capabilities,
    };
  }

  /**
   * Add capabilities to a user (without removing existing ones)
   * @throws NotFoundError if user doesn't exist in tenant
   */
  async addCapabilities(tenantId: string, userId: string, capabilities: UserCapability[]): Promise<TenantUserData> {
    const existingUser = await this.getUserRoleData(tenantId, userId);
    if (!existingUser) {
      throw new NotFoundError("User not found in tenant");
    }

    const newCapabilities = [...new Set([...existingUser.capabilities, ...capabilities])];

    await this.userDoc(tenantId, userId).update({
      capabilities: newCapabilities,
    });

    return {
      ...existingUser,
      capabilities: newCapabilities,
    };
  }

  /**
   * Remove capabilities from a user
   * @throws NotFoundError if user doesn't exist in tenant
   */
  async removeCapabilities(tenantId: string, userId: string, capabilities: UserCapability[]): Promise<TenantUserData> {
    const existingUser = await this.getUserRoleData(tenantId, userId);
    if (!existingUser) {
      throw new NotFoundError("User not found in tenant");
    }

    const newCapabilities = existingUser.capabilities.filter((cap) => !capabilities.includes(cap));

    await this.userDoc(tenantId, userId).update({
      capabilities: newCapabilities,
    });

    return {
      ...existingUser,
      capabilities: newCapabilities,
    };
  }

  /**
   * Get a single user from a tenant with their Firebase profile
   * @throws NotFoundError if user doesn't exist in tenant or Firebase Auth
   */
  async getUser(tenantId: string, userId: string): Promise<TenantUserWithProfile> {
    const userData = await this.getUserRoleData(tenantId, userId);
    if (!userData) {
      throw new NotFoundError("User not found in tenant");
    }

    let firebaseUser;
    try {
      firebaseUser = await auth.getUser(userId);
    } catch (error) {
      throw new NotFoundError("User not found in Firebase Auth");
    }

    return {
      ...userData,
      displayName: firebaseUser.displayName || null,
      email: firebaseUser.email || null,
      avatar: firebaseUser.photoURL || null,
      photoURL: firebaseUser.photoURL || null,
    };
  }

  /**
   * Get all users in a tenant with their Firebase profiles
   * @throws NotFoundError if tenant doesn't exist
   */
  async getUsers(tenantId: string): Promise<TenantUserWithProfile[]> {
    const tenant = await this.getTenantData(tenantId);
    if (!tenant) {
      throw new NotFoundError("Tenant not found");
    }

    const usersSnapshot = await this.usersCollection(tenantId).get();

    const userPromises = usersSnapshot.docs.map(async (doc) => {
      const userData = doc.data() as TenantUserData;

      try {
        const firebaseUser = await auth.getUser(userData.uid);
        return {
          ...userData,
          displayName: firebaseUser.displayName || null,
          email: firebaseUser.email || null,
          avatar: firebaseUser.photoURL || null,
          photoURL: firebaseUser.photoURL || null,
        };
      } catch (error) {
        // User exists in tenant but not in Firebase Auth
        return null;
      }
    });

    const users = await Promise.all(userPromises);
    return users.filter((user): user is TenantUserWithProfile => user !== null);
  }

  /**
   * Check if a user has any of the specified roles in a tenant
   */
  async hasRole(tenantId: string, userId: string, roles: UserRole[]): Promise<boolean> {
    const userData = await this.getUserRoleData(tenantId, userId);
    if (!userData) return false;
    return roles.includes(userData.role);
  }

  /**
   * Check if a user has any of the specified capabilities in a tenant
   */
  async hasCapability(tenantId: string, userId: string, capabilities: UserCapability[]): Promise<boolean> {
    const userData = await this.getUserRoleData(tenantId, userId);
    if (!userData) return false;
    return capabilities.some((cap) => userData.capabilities.includes(cap));
  }

  /**
   * Get the current user's role and capabilities in a tenant
   */
  async getCurrentUserAccess(tenantId: string): Promise<{ role: UserRole; capabilities: UserCapability[] } | null> {
    const userData = await this.getUserRoleData(tenantId, this.userId);
    if (!userData) return null;
    return {
      role: userData.role,
      capabilities: userData.capabilities,
    };
  }
}
