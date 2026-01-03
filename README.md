# Expo Firebase Starter

Multi-tenant Expo + Firebase starter with role-based access control.

> I'm still working on this starter kit, PR are welcomed.

## Features

- **Multi-tenant architecture** — Dynamic tenant types defined in config
- **Role-based access control** — Roles with granular capabilities
- **Unified access checks** — Same patterns across client, server, and Firestore rules
- **Type-safe** — Full TypeScript support with generated types from config

**Demo:** https://expo-firebase-starter.vercel.app

---

## Tech Stack

- [Expo](https://expo.dev) / React Native
- [Firebase](https://firebase.google.com) (Auth, Firestore)
- [HeroUI Native](https://github.com/heroui-inc/heroui-native)
- [Zustand](https://zustand-demo.pmnd.rs/) (state management)
- [Resend](https://resend.com) (email)
- [Formik](https://formik.org/) (forms)

---

## Quick Start

See: https://jhakim.com/firebase-env-helper to automatically convert firebase config to env variables

```bash
bun install
cp .env.example .env
bun start
```

---

## Access Control

Roles and capabilities are defined in `_config.json`. Access can be verified on the **client**, **server**, and in **Firebase Rules**.

| Layer     | Function                                                                          |
| --------- | --------------------------------------------------------------------------------- |
| Client    | `useHasRole([])`, `useHasCapability([])`, `useHasRoleOrCapability([], [])`        |
| Server    | `manager.verifyRole()`, `manager.requireCapability()`, `verifyRoleOrCapability()` |
| Firestore | `hasRole()`, `hasCapability()`                                                    |

---

## Client Hooks

### Check Roles

```tsx
import { useHasRole } from "@/stores/tenant";

function SettingsButton() {
  const isAdmin = useHasRole(["admin"]);
  if (!isAdmin) return null;
  return <Button>Settings</Button>;
}
```

### Check Capabilities

```tsx
import { useHasCapability } from "@/stores/tenant";

function AddUserButton() {
  const canAdd = useHasCapability(["users.add"]);

  if (!canAdd) return null;
  return <Button>Add User</Button>;
}
```

### Check Role OR Capability

```tsx
import { useHasRoleOrCapability } from "@/stores/tenant";

function ManageUsersButton() {
  const canManage = useHasRoleOrCapability(["admin"], ["users.edit"]);

  if (!canManage) return null;
  return <Button>Manage Users</Button>;
}
```

### Get User's Tenants

```tsx
import { useTenants } from "@/stores/auth";

function WorkspaceList() {
  const workspaces = useTenants("workspaces");

  return <FlatList data={workspaces} renderItem={({ item }) => <Text>{item.name}</Text>} />;
}
```

### Check Super Admin

This is for internal app level access with custom claims

```tsx
import { useIsAdmin } from "@/stores/auth";

function SuperAdminBadge() {
  const isSuperAdmin = useIsAdmin();

  if (!isSuperAdmin) return null;
  return <Badge>Super Admin</Badge>;
}
```

---

## Server Usage

### TenantManager

The `TenantManager` provides two patterns for access control:

- **`verify*` methods** — Return `boolean`, use for conditional logic
- **`require*` methods** — Throw `ForbiddenError`, use for guard clauses

```typescript
import { TenantManager } from "@/server/TenantManager";

// Create from request (recommended)
const manager = await TenantManager.fromRequest(request, "workspaces");

// Or create manually
const manager = new TenantManager({
  userId: decodedToken.uid,
  collection: "workspaces",
});

// Verify methods (return boolean)
const isAdmin = await manager.verifyRole(tenantId, ["admin"]);
const canEdit = await manager.verifyCapability(tenantId, ["users.edit"]);
const authorized = await manager.verifyRoleOrCapability(tenantId, ["admin"], ["users.edit"]);

// Require methods (throw ForbiddenError if unauthorized)
await manager.requireRole(tenantId, ["admin"]);
await manager.requireCapability(tenantId, ["users.add"]);
await manager.requireRoleOrCapability(tenantId, ["admin"], ["users.edit"]);
```

### API Route Example

```typescript
import { TenantManager } from "@/server/TenantManager";

export async function POST(request: Request, { tenant, id }: Record<string, string>) {
  // Creates manager and validates auth token in one step
  const manager = await TenantManager.fromRequest(request, tenant);

  // Throws ForbiddenError if user lacks capability
  await manager.requireCapability(id, ["users.add"]);

  // Add the user
  const user = await manager.addUser(id, { userId: "newUser", role: "viewer" }, tenant);

  return Response.json({ user });
}
```

### Auth Helpers

Standalone auth utilities in `server/auth.ts`:

```typescript
import { verifyAuth, verifyIdToken, verifyRoleOrCapability } from "@/server/auth";

// Verify token and get decoded user
const decodedToken = await verifyIdToken(token);

// Verify auth from request (returns { uid } or null)
const user = await verifyAuth(request);

// Verify role or capability without creating a TenantManager
const authorized = await verifyRoleOrCapability(
  userId, // User ID to check
  "workspaces", // Collection/tenant type
  tenantId, // Tenant ID
  ["admin"], // Roles (any match)
  ["users.edit"] // Capabilities (any match)
);
```

---

## Firebase Rules

### Helper Functions

```javascript
// Check role
function hasRole(tenant, tenantId, role) {
  let userData = get(/databases/$(database)/documents/$(tenant)/$(tenantId)/users/$(request.auth.uid)).data;
  return userData.role == role || request.auth.token.admin == true;
}

// Check capability
function hasCapability(tenant, tenantId, capability) {
  let userData = get(/databases/$(database)/documents/$(tenant)/$(tenantId)/users/$(request.auth.uid)).data;
  return capability in userData.capabilities || request.auth.token.admin == true;
}
```

### Example Rules

```javascript
match /workspaces/{workspaceId} {
  // Members can read
  allow read: if resource.data.users[request.auth.uid] == true;

  // Admins can update
  allow update: if hasRole('workspaces', workspaceId, 'admin');

  // Sub-resources use capabilities
  match /projects/{projectId} {
    allow read: if hasCapability('workspaces', workspaceId, 'read');
    allow write: if hasCapability('workspaces', workspaceId, 'write');
    allow delete: if hasCapability('workspaces', workspaceId, 'delete');
  }
}
```

---

## Project Structure

```
├── app/                    # Expo Router pages & API routes
│   ├── api/                # Server API routes
│   ├── auth/               # Auth screens
│   └── (tabs)/             # Main app tabs
├── components/             # Reusable UI components
├── hooks/                  # Custom React hooks
├── integrations/           # Firebase client & server setup
├── providers/              # Context providers (Auth, Tenant)
├── server/                 # Server utilities
│   ├── TenantManager.ts    # Multi-tenant CRUD & access control
│   ├── auth.ts             # Auth helpers
│   └── errors.ts           # Typed error classes
├── stores/                 # Zustand stores
│   ├── auth/               # Auth state & user tenants
│   └── tenant/             # Current tenant & access state
├── types/                  # TypeScript types
├── utils/                  # Utility functions
├── _config.json            # App & tenant configuration
└── firestore.rules         # Firestore security rules
```

---

## Config Reference

Roles and capabilities are defined in `_config.json`:

```json
{
  "name": "Firebase + Expo + HeroUI Native MultiTenant Starter",
  "description": "A fast way to begin creating multitenant apps with access level client hooks, backend hook, and capability and roles based access controls for data with dynamic tenants & roles and caps.",
  "links": {
    "terms": "https://www.google.com",
    "privacy": "https://www.google.com"
  },
  "branding": {
    "logo": "./assets/images/icon.png"
  },
  "mail": {
    "from": "noreply@saaskickoff.com"
  },
  "tenants": {
    "workspaces": {
      "singular": "Workspace",
      "plural": "Workspaces",
      "description": "Workspaces are the main way to group users and resources together.",
      "icon": "business-outline",
      "defaultRole": "teamMember",
      "roles": [
        {
          "value": "admin",
          "label": "Admin",
          "description": "Full access to all features and settings",
          "icon": "shield-checkmark-outline"
        },
        {
          "value": "teamMember",
          "label": "Team Member",
          "description": "Can read and write content",
          "icon": "person-outline"
        },
        {
          "value": "viewer",
          "label": "Viewer",
          "description": "Read-only access",
          "icon": "eye-outline"
        }
      ],
      "capabilities": {
        "admin": [
          "read",
          "write",
          "delete",
          "workspace.edit",
          "users.add",
          "users.remove",
          "users.edit",
          "users.view",
          "tasks.create",
          "tasks.edit",
          "tasks.delete",
          "tasks.view"
        ],
        "teamMember": ["read", "write", "users.view", "tasks.create", "tasks.edit", "tasks.view"],
        "viewer": ["read", "users.view", "tasks.view"]
      }
    }
  }
}
```

---

## Environment Variables

```env
# Firebase Client
EXPO_PUBLIC_FIREBASE_API_KEY=
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=
EXPO_PUBLIC_FIREBASE_PROJECT_ID=
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
EXPO_PUBLIC_FIREBASE_APP_ID=

# Firebase Admin
FIREBASE_PROJECT_ID=
FIREBASE_PRIVATE_KEY=
FIREBASE_CLIENT_EMAIL=

# Resend
RESEND_API_KEY=
```

---

## License

MIT

---

## Credits

- [HeroUI Native](https://github.com/heroui-inc/heroui-native)
