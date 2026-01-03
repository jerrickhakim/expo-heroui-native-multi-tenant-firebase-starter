import { handleApiError, ValidationError } from "@/server/errors";
import { TenantManager } from "@/server/TenantManager";
import type { UserCapability, UserRole } from "@/types/tenants";
import { getRoleValues } from "@/utils/tenantConfig";
import { z } from "zod";

// ============================================================================
// Schema Factory
// ============================================================================

const createUpdateUserSchema = (tenantType: string) => {
  const roleValues = getRoleValues(tenantType);
  return z.object({
    role: z.enum(roleValues as [string, ...string[]]).optional(),
    capabilities: z.array(z.string()).optional(),
  });
};

// ============================================================================
// PATCH - Update user role/capabilities
// ============================================================================

export async function PATCH(request: Request, { tenant, id, uid }: Record<string, string>): Promise<Response> {
  try {
    // Validate & authenticate (throws on failure)
    TenantManager.validateTenantType(tenant);
    const tenantManager = await TenantManager.fromRequest(request, tenant);

    // Authorize (throws ForbiddenError if not allowed)
    await tenantManager.requireRoleOrCapability(id, ["admin"], ["users.edit"]);

    // Validate request body
    const body = await request.json();
    const schema = createUpdateUserSchema(tenant);
    const result = schema.safeParse(body);
    if (!result.success) {
      throw new ValidationError(result.error.issues[0].message);
    }

    const { role, capabilities } = result.data;
    let updatedUser;

    // Update role if provided
    if (role) {
      updatedUser = await tenantManager.setRole(id, { userId: uid, role: role as UserRole }, tenant);
    }

    // Update capabilities if provided
    if (capabilities) {
      updatedUser = await tenantManager.setCapabilities(id, {
        userId: uid,
        capabilities: capabilities as UserCapability[],
      });
    }

    // If both were updated, fetch the latest state
    if (role && capabilities) {
      updatedUser = await tenantManager.getUser(id, uid);
    }

    return Response.json({ success: true, user: updatedUser });
  } catch (error) {
    return handleApiError(error);
  }
}

// ============================================================================
// DELETE - Remove user from tenant
// ============================================================================

export async function DELETE(request: Request, { tenant, id, uid }: Record<string, string>): Promise<Response> {
  try {
    // Validate & authenticate (throws on failure)
    TenantManager.validateTenantType(tenant);
    const tenantManager = await TenantManager.fromRequest(request, tenant);

    // Authorize (throws ForbiddenError if not allowed)
    await tenantManager.requireRoleOrCapability(id, ["admin"], ["users.remove"]);

    // Remove the user
    await tenantManager.removeUser(id, uid);

    return Response.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
