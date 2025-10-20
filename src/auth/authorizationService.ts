// ============================================
// AUTHORIZATION SERVICE
// Purpose: Check permissions and log actions
// ============================================

import { PrismaClient } from "@prisma/client";
import { AuthContext } from "./authMiddleware";

const prisma = new PrismaClient();

// ============================================
// PERMISSION CHECKING
// ============================================

/**
 * Check if user can execute a specific tool
 *
 * @param authContext - The authenticated user context
 * @param toolName - Name of the tool (e.g., "create-user")
 * @returns true if allowed, false otherwise
 */
export async function canExecuteTool(
  authContext: AuthContext,
  toolName: string
): Promise<boolean> {
  const permissionName = `tools.${toolName}`;
  return hasPermission(authContext, permissionName);
}

/**
 * Check if user can access a specific resource
 *
 * @param authContext - The authenticated user context
 * @param resourceName - Name of the resource (e.g., "users")
 * @returns true if allowed, false otherwise
 */
export async function canAccessResource(
  authContext: AuthContext,
  resourceName: string
): Promise<boolean> {
  // Check both with and without .read suffix for backwards compatibility
  const permissionWithRead = `resources.${resourceName}.read`;
  const permissionWithoutRead = `resources.${resourceName}`;

  return (
    hasPermission(authContext, permissionWithRead) ||
    hasPermission(authContext, permissionWithoutRead)
  );
}

/**
 * Check if user can use a specific prompt
 *
 * @param authContext - The authenticated user context
 * @param promptName - Name of the prompt
 * @returns true if allowed, false otherwise
 */
export async function canUsePrompt(
  authContext: AuthContext,
  promptName: string
): Promise<boolean> {
  const permissionName = `prompts.${promptName}`;
  return hasPermission(authContext, permissionName);
}

/**
 * Core permission checking logic
 * Supports wildcards: "tools.*" grants access to all tools
 *
 * @param authContext - The authenticated user context
 * @param permissionName - Permission to check (e.g., "tools.create-user")
 * @returns true if user has permission, false otherwise
 */
function hasPermission(
  authContext: AuthContext,
  permissionName: string
): boolean {
  // Check if user has exact permission
  const hasExact = authContext.permissions.some(
    (p) => p.name === permissionName
  );
  if (hasExact) {
    return true;
  }

  // Check for wildcard permissions
  // Example: "tools.*" grants access to all tools
  const parts = permissionName.split(".");

  for (let i = parts.length; i > 0; i--) {
    const wildcardName = parts.slice(0, i).join(".") + ".*";
    const hasWildcard = authContext.permissions.some(
      (p) => p.name === wildcardName
    );
    if (hasWildcard) {
      return true;
    }
  }

  return false;
}

// ============================================
// AUDIT LOGGING
// ============================================

/**
 * Log an action to the audit trail
 *
 * @param authContext - The authenticated user context
 * @param action - What action was performed
 * @param success - Did it succeed?
 * @param options - Additional logging options
 */
/**
 * Sanitize metadata by removing functions and non-serializable objects
 */
function sanitizeMetadata(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === "function") {
    return undefined; // Remove functions
  }

  if (typeof obj !== "object") {
    return obj; // Primitives are fine
  }

  if (Array.isArray(obj)) {
    return obj.map(sanitizeMetadata).filter((item) => item !== undefined);
  }

  // For objects, recursively sanitize and filter out functions
  const sanitized: any = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const value = sanitizeMetadata(obj[key]);
      if (value !== undefined && typeof value !== "function") {
        sanitized[key] = value;
      }
    }
  }

  return sanitized;
}

export async function logAudit(
  authContext: AuthContext,
  action: string,
  success: boolean,
  options: {
    resourceId?: string;
    errorMessage?: string;
    metadata?: any;
    ipAddress?: string;
    userAgent?: string;
  } = {}
): Promise<void> {
  try {
    // Sanitize metadata to remove functions and non-serializable objects
    const sanitizedMetadata = options.metadata
      ? sanitizeMetadata(options.metadata)
      : undefined;

    await prisma.auditLog.create({
      data: {
        userId: authContext.user.id,
        action,
        success,
        resourceId: options.resourceId,
        errorMessage: options.errorMessage,
        metadata: sanitizedMetadata,
        ipAddress: options.ipAddress,
        userAgent: options.userAgent,
      },
    });
  } catch (error) {
    // Don't fail the operation if logging fails
    console.error("❌ Failed to create audit log:", error);
  }
}

/**
 * Get audit logs for a user
 *
 * @param userId - User ID to get logs for
 * @param limit - Maximum number of logs to return
 * @returns Array of audit log entries
 */
export async function getUserAuditLogs(userId: string, limit: number = 100) {
  return prisma.auditLog.findMany({
    where: { userId },
    orderBy: { timestamp: "desc" },
    take: limit,
  });
}
