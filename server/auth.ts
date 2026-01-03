import { auth } from "@/integrations/firebase.server";
import { UserCapability, UserRole } from "@/types/tenants";
import { TenantManager } from "./TenantManager";

const verifyIdToken = async (token: string) => {
  const decodedToken = await auth.verifyIdToken(token);
  return decodedToken;
};

const getUserByEmail = async (email: string) => {
  const user = await auth.getUserByEmail(email);
  return user;
};

/**
 * Verify authentication and return decoded token
 */
const verifyAuth = async (request: Request): Promise<{ uid: string } | null> => {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.split("Bearer ")[1];
  const decodedToken = await verifyIdToken(token);
  if (!decodedToken) {
    return null;
  }

  return decodedToken;
};

/**
 * Verify if a user has one of the specified roles OR capabilities in a tenant
 * @returns true if user has required role or capability, false otherwise
 */
const verifyRoleOrCapability = async (
  userId: string,
  collection: string,
  tenantId: string,
  roles: UserRole[],
  capabilities: UserCapability[]
): Promise<boolean> => {
  const tenantManager = new TenantManager({ userId, collection: collection });
  return await tenantManager.verifyRoleOrCapability(tenantId, roles, capabilities);
};

export { getUserByEmail, verifyAuth, verifyIdToken, verifyRoleOrCapability };
