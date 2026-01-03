import { auth } from "@/integrations/firebase.server";
import { handleApiError, NotFoundError, ValidationError } from "@/server/errors";
import { TenantManager } from "@/server/TenantManager";
import type { UserRole } from "@/types/tenants";
import { getDefaultRole, getRoleValues } from "@/utils/tenantConfig";
import { z } from "zod";

// ============================================================================
// Schema Factory
// ============================================================================

const createAddUserSchema = (tenantType: string) => {
  const roleValues = getRoleValues(tenantType);
  const defaultRole = getDefaultRole(tenantType);
  return z.object({
    email: z.email("Please enter a valid email address"),
    role: z
      .enum(roleValues as [string, ...string[]])
      .optional()
      .default(defaultRole),
    capabilities: z.array(z.string()).optional(),
  });
};

// ============================================================================
// GET - List all users in tenant
// ============================================================================

export async function GET(request: Request, { tenant, id }: Record<string, string>): Promise<Response> {
  try {
    // Validate & authenticate (throws on failure)
    TenantManager.validateTenantType(tenant);
    const tenantManager = await TenantManager.fromRequest(request, tenant);

    // Authorize (throws ForbiddenError if not allowed)
    await tenantManager.requireRoleOrCapability(id, ["admin"], ["users.view"]);

    // Fetch and return users
    const users = await tenantManager.getUsers(id);
    return Response.json({ users });
  } catch (error) {
    return handleApiError(error);
  }
}

// ============================================================================
// POST - Add user to tenant
// ============================================================================

export async function POST(request: Request, { tenant, id }: Record<string, string>): Promise<Response> {
  try {
    // Validate & authenticate (throws on failure)
    TenantManager.validateTenantType(tenant);
    const tenantManager = await TenantManager.fromRequest(request, tenant);

    // Authorize (throws ForbiddenError if not allowed)
    await tenantManager.requireRoleOrCapability(id, ["admin"], ["users.add"]);

    // Validate request body
    const body = await request.json();
    const schema = createAddUserSchema(tenant);
    const result = schema.safeParse(body);
    if (!result.success) {
      throw new ValidationError(result.error.issues[0].message);
    }

    // Look up user by email in Firebase Auth
    let userToAdd;
    try {
      userToAdd = await auth.getUserByEmail(result.data.email);
    } catch {
      throw new NotFoundError("No user found with this email address. They must create an account first.");
    }

    // Add user to tenant
    const userData = await tenantManager.addUser(
      id,
      {
        userId: userToAdd.uid,
        role: result.data.role as UserRole,
        capabilities: result.data.capabilities,
      },
      tenant
    );

    return Response.json({
      success: true,
      user: {
        uid: userData.uid,
        role: userData.role,
        email: userToAdd.email,
        displayName: userToAdd.displayName,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
