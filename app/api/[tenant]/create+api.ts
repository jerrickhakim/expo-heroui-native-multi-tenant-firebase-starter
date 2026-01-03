import config from "@/_config.json";
import { verifyAuth } from "@/server/auth";
import { TenantManager } from "@/server/TenantManager";
import { z } from "zod";

const validTenants = Object.keys(config.tenants);

const createTenantSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(50, "Name must be less than 50 characters"),
});

export async function POST(request: Request, { tenant }: Record<string, string>): Promise<Response> {
  try {
    // Validate tenant type exists in config
    if (!validTenants.includes(tenant)) {
      return Response.json({ error: "Invalid tenant type" }, { status: 400 });
    }

    // Verify authentication - any authenticated user can create a tenant
    const decodedToken = await verifyAuth(request);
    if (!decodedToken) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validated = createTenantSchema.safeParse(body);
    if (!validated.success) {
      return Response.json({ error: validated.error.issues[0].message }, { status: 400 });
    }

    // Create the tenant using TenantManager
    const tenantManager = new TenantManager({
      userId: decodedToken.uid,
      collection: tenant,
    });

    const newTenant = await tenantManager.createTenant({
      name: validated.data.name,
      tenantType: tenant,
    });

    return Response.json({
      success: true,
      tenant: {
        id: newTenant.id,
        name: newTenant.name,
      },
      redirectTo: `/${tenant}/${newTenant.id}`,
    });
  } catch (error) {
    console.error("Error creating tenant:", error);
    const message = error instanceof Error ? error.message : "Failed to create tenant";
    return Response.json({ error: message }, { status: 500 });
  }
}
