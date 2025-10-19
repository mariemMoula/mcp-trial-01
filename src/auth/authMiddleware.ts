// ============================================
// AUTHENTICATION MIDDLEWARE
// Purpose: Validate Stytch tokens and load user data
// ============================================

import { Client as StytchClient } from "stytch";
import {
  PrismaClient,
  User,
  Permission,
  PermissionCategory,
} from "@prisma/client";

// ============================================
// INITIALIZE CLIENTS
// ============================================

// Stytch client for token validation
const stytch = new StytchClient({
  project_id: process.env.STYTCH_PROJECT_ID || "",
  secret: process.env.STYTCH_SECRET || "",
});

// Prisma client for database access
const prisma = new PrismaClient();

// ============================================
// TYPES
// ============================================

// What information do we store about authenticated users?
export interface AuthContext {
  user: User; // The user object from database
  permissions: Permission[]; // What can this user do?
  sessionId: string; // Current session ID
  accessToken: string; // The JWT token
}

// ============================================
// MAIN AUTHENTICATION FUNCTION
// ============================================

/**
 * Validate a Stytch JWT token and return user context
 *
 * @param accessToken - The JWT token from Stytch
 * @returns AuthContext with user info and permissions
 * @throws Error if token is invalid or expired
 */
export async function validateToken(accessToken: string): Promise<AuthContext> {
  try {
    // ========================================
    // STEP 1: Validate token with Stytch
    // ========================================

    console.log("🔐 Validating token with Stytch...");

    const authResult = await stytch.sessions.authenticate({
      session_jwt: accessToken,
    });

    // Extract Stytch user ID and session ID
    const stytchUserId = authResult.session.user_id;
    const stytchSessionId = authResult.session.session_id;

    console.log(`✅ Token valid for Stytch user: ${stytchUserId}`);

    // ========================================
    // STEP 2: Load or create user in database
    // ========================================

    let user = await prisma.user.findUnique({
      where: { stytchUserId },
    });

    // If user doesn't exist in our database, create them
    if (!user) {
      console.log("👤 First time login - creating user...");

      // Get user info from Stytch (the response itself is the user object)
      const stytchUser = await stytch.users.get({ user_id: stytchUserId });

      user = await prisma.user.create({
        data: {
          stytchUserId,
          email: stytchUser.emails?.[0]?.email || "",
          name: stytchUser.name?.first_name || null,
        },
      });

      console.log(`✅ Created new user: ${user.email}`);

      // Grant default permissions for new users
      await grantDefaultPermissions(user.id);
    }

    // ========================================
    // STEP 3: Update or create session
    // ========================================

    const expiresAt = new Date(
      authResult.session.expires_at || Date.now() + 3600000
    ); // Default to 1 hour from now

    // Try to find existing session
    let session = await prisma.session.findUnique({
      where: { stytchSessionId },
    });

    if (session) {
      // Update existing session
      await prisma.session.update({
        where: { id: session.id },
        data: { lastUsedAt: new Date() },
      });
    } else {
      // Create new session
      session = await prisma.session.create({
        data: {
          userId: user.id,
          stytchSessionId,
          accessToken,
          expiresAt,
        },
      });
    }

    // ========================================
    // STEP 4: Load user permissions
    // ========================================

    const userPermissions = await prisma.userPermission.findMany({
      where: { userId: user.id },
      include: { permission: true },
    });

    const permissions = userPermissions.map((up) => up.permission);

    console.log(
      `✅ Loaded ${permissions.length} permissions for ${user.email}`
    );

    // ========================================
    // STEP 5: Return auth context
    // ========================================

    return {
      user,
      permissions,
      sessionId: session.id,
      accessToken,
    };
  } catch (error: any) {
    console.error("❌ Token validation failed:", error.message);
    throw new Error(`Authentication failed: ${error.message}`);
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Grant default permissions to new users
 *
 * @param userId - The user ID to grant permissions to
 */
async function grantDefaultPermissions(userId: string): Promise<void> {
  // Define default permissions for new users
  const defaultPermissions = [
    {
      name: "tools.create-random-user",
      category: PermissionCategory.TOOL,
      description: "Can create random users",
    },
    {
      name: "tools.create-user",
      category: PermissionCategory.TOOL,
      description: "Can create specific users",
    },
    {
      name: "resources.users",
      category: PermissionCategory.RESOURCE,
      description: "Can view user list",
    },
    {
      name: "resources.user-details",
      category: PermissionCategory.RESOURCE,
      description: "Can view user details",
    },
    {
      name: "prompts.generate-fake-user",
      category: PermissionCategory.PROMPT,
      description: "Can use fake user generator",
    },
  ];

  for (const permDef of defaultPermissions) {
    // Find or create permission
    let permission = await prisma.permission.findUnique({
      where: { name: permDef.name },
    });

    if (!permission) {
      permission = await prisma.permission.create({
        data: permDef,
      });
    }

    // Grant permission to user
    await prisma.userPermission.create({
      data: {
        userId,
        permissionId: permission.id,
        grantedBy: "system",
      },
    });
  }

  console.log(`✅ Granted ${defaultPermissions.length} default permissions`);
}

/**
 * Cleanup expired sessions (run periodically)
 */
export async function cleanupExpiredSessions(): Promise<void> {
  const result = await prisma.session.deleteMany({
    where: {
      expiresAt: {
        lt: new Date(), // Less than now = expired
      },
    },
  });

  console.log(`🧹 Cleaned up ${result.count} expired sessions`);
}
