// ============================================
// AUTHENTICATED MCP SERVER
// Wraps your existing server with authentication
// ============================================

import "dotenv/config";
import {
  McpServer,
  ResourceTemplate,
} from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import z from "zod";
import fs from "node:fs/promises";

// Import authentication modules
import { validateToken, AuthContext } from "./auth/authMiddleware";
import {
  canExecuteTool,
  canAccessResource,
  canUsePrompt,
  logAudit,
} from "./auth/authorizationService";

// ============================================
// AUTHENTICATION CHECK
// ============================================

/**
 * Get and validate the access token from environment
 * The client will pass MCP_ACCESS_TOKEN via environment variable
 */
async function getAuthContext(): Promise<AuthContext | null> {
  const accessToken = process.env.MCP_ACCESS_TOKEN;
  
  if (!accessToken) {
    console.log("⚠️  No access token provided - running in unauthenticated mode");
    return null;
  }
  
  try {
    const authContext = await validateToken(accessToken);
    console.log(`✅ Authenticated as: ${authContext.user.email}`);
    return authContext;
  } catch (error: any) {
    console.error(`❌ Authentication failed: ${error.message}`);
    throw new Error(`Authentication required: ${error.message}`);
  }
}

// Store the current auth context globally
let currentAuthContext: AuthContext | null = null;

// ============================================
// AUTHENTICATED WRAPPER FUNCTIONS
// ============================================

/**
 * Wrap a tool handler with authentication and authorization checks
 */
function authenticatedTool<T extends Record<string, any>>(
  toolName: string,
  handler: (params: T) => Promise<any>
) {
  return async (params: T) => {
    // Check if user is authenticated
    if (!currentAuthContext) {
      await logFailedAction(`tool.${toolName}`, "No authentication context");
      return {
        content: [{
          type: "text",
          text: "❌ Authentication required. Please login first.",
        }],
      };
    }
    
    // Check if user has permission
    const hasPermission = await canExecuteTool(currentAuthContext, toolName);
    
    if (!hasPermission) {
      await logAudit(currentAuthContext, `tool.${toolName}`, false, {
        errorMessage: "Permission denied",
      });
      
      return {
        content: [{
          type: "text",
          text: `❌ Permission denied. You don't have access to tool: ${toolName}`,
        }],
      };
    }
    
    // Execute the tool
    try {
      const result = await handler(params);
      
      // Log successful execution
      await logAudit(currentAuthContext, `tool.${toolName}`, true, {
        metadata: params,
      });
      
      return result;
    } catch (error: any) {
      // Log failed execution
      await logAudit(currentAuthContext, `tool.${toolName}`, false, {
        errorMessage: error.message,
        metadata: params,
      });
      
      throw error;
    }
  };
}

/**
 * Wrap a resource handler with authentication and authorization checks
 */
function authenticatedResource(
  resourceName: string,
  handler: (uri: URL) => Promise<any>
) {
  return async (uri: URL) => {
    // Check if user is authenticated
    if (!currentAuthContext) {
      return {
        contents: [{
          uri: uri.href,
          text: JSON.stringify({ error: "Authentication required" }),
          mimeType: "application/json",
        }],
      };
    }
    
    // Check if user has permission
    const hasPermission = await canAccessResource(currentAuthContext, resourceName);
    
    if (!hasPermission) {
      await logAudit(currentAuthContext, `resource.${resourceName}.read`, false, {
        errorMessage: "Permission denied",
        resourceId: uri.href,
      });
      
      return {
        contents: [{
          uri: uri.href,
          text: JSON.stringify({ error: "Permission denied" }),
          mimeType: "application/json",
        }],
      };
    }
    
    // Execute the resource handler
    try {
      const result = await handler(uri);
      
      // Log successful access
      await logAudit(currentAuthContext, `resource.${resourceName}.read`, true, {
        resourceId: uri.href,
      });
      
      return result;
    } catch (error: any) {
      // Log failed access
      await logAudit(currentAuthContext, `resource.${resourceName}.read`, false, {
        errorMessage: error.message,
        resourceId: uri.href,
      });
      
      throw error;
    }
  };
}

// ============================================
// HELPER FUNCTIONS
// ============================================

async function logFailedAction(action: string, reason: string) {
  console.error(`❌ ${action} failed: ${reason}`);
  // Could log to audit trail here if needed
}

// ============================================
// CREATE SERVER WITH AUTHENTICATION
// ============================================

const server = new McpServer({
  name: "Meriame's MCP Trial 01 (Authenticated)",
  version: "1.0.0",
  description: "A trial of the MCP SDK with Stytch authentication",
  capabilities: {
    resources: {},
    tools: {},
    prompts: {},
  },
});

// ============================================
// TOOLS (with authentication)
// ============================================

/**
 * Tool: create-user
 * Creates a new user in the database
 */
server.tool(
  "create-user",
  "Create a new user in the database",
  {
    name: z.string(),
    email: z.string().email(),
    address: z.string(),
    phone: z.string(),
  },
  {
    title: "Create a new user",
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: false,
    openWorldHint: true,
  },
  authenticatedTool<{ name: string; email: string; address: string; phone: string }>(
    "create-user",
    async (params) => {
      const id = await createUser(params);
      return {
        content: [{ type: "text", text: `User ${id} created successfully by ${currentAuthContext?.user.email}` }],
      };
    }
  )
);

/**
 * Tool: create-random-user
 * Creates a random user with fake data
 */
server.tool(
  "create-random-user",
  "Create a random user with fake data",
  {
    title: "Create Random User",
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: false,
    openWorldHint: true,
  },
  authenticatedTool("create-random-user", async () => {
    const fakeUser = generateRealisticFakeUser();
    const id = await createUser(fakeUser);
    
    return {
      content: [{
        type: "text",
        text: `🎲 Random user ${id} created successfully by ${currentAuthContext?.user.email}: ${fakeUser.name} | Email: ${fakeUser.email} | Address: ${fakeUser.address} | Phone: ${fakeUser.phone}
        
💡 Pro tip: For AI-generated data, use the 'generate-fake-user' prompt with sampling from the client side!`,
      }],
    };
  })
);

// ============================================
// RESOURCES (with authentication)
// ============================================

/**
 * Resource: users (all users)
 */
server.resource(
  "users",
  "users://all",
  {
    description: "Get all users data from the database",
    title: "Users",
    mimeType: "application/json",
  },
  authenticatedResource("users", async (uri) => {
    const users = await import("./data/users.json", {
      with: { type: "json" },
    }).then((m) => m.default);

    return {
      contents: [{
        uri: uri.href,
        text: JSON.stringify(users),
        mimeType: "application/json",
      }],
    };
  })
);

/**
 * Resource: user-details (single user)
 */
server.resource(
  "user-details",
  new ResourceTemplate("users://{userId}/profile", { list: undefined }),
  {
    description: "Get a user's details from the database",
    title: "User Details",
    mimeType: "application/json",
  },
  authenticatedResource("user-details", async (uri) => {
    const urlParts = uri.pathname.split('/');
    const userId = urlParts[1]; // Extract userId from URL
    
    const users = await import("./data/users.json", {
      with: { type: "json" },
    }).then((m) => m.default);
    
    const user = users.find((u) => u.id === parseInt(userId));

    if (user == null) {
      return {
        contents: [{
          uri: uri.href,
          text: JSON.stringify({ error: "User not found" }),
          mimeType: "application/json",
        }],
      };
    }

    return {
      contents: [{
        uri: uri.href,
        text: JSON.stringify(user),
        mimeType: "application/json",
      }],
    };
  })
);

// ============================================
// PROMPTS (with authentication)
// ============================================

/**
 * Prompt: generate-fake-user
 * Uses AI to generate realistic fake user data
 */
server.prompt(
  "generate-fake-user",
  "Generate realistic fake user data using AI (use with sampling from client)",
  {
    name: z.string().optional(),
    style: z.enum(["professional", "casual", "international"]).optional(),
  },
  async ({ name, style = "professional" }, _extra) => {
    // Check authentication
    if (!currentAuthContext) {
      return {
        messages: [{
          role: "user" as const,
          content: {
            type: "text" as const,
            text: "Authentication required to use this prompt.",
          },
        }],
      };
    }
    
    // Check permission
    const hasPermission = await canUsePrompt(currentAuthContext, "generate-fake-user");
    
    if (!hasPermission) {
      await logAudit(currentAuthContext, "prompt.generate-fake-user", false, {
        errorMessage: "Permission denied",
      });
      
      return {
        messages: [{
          role: "user" as const,
          content: {
            type: "text" as const,
            text: "Permission denied. You don't have access to this prompt.",
          },
        }],
      };
    }
    
    // Log successful prompt usage
    await logAudit(currentAuthContext, "prompt.generate-fake-user", true, {
      metadata: { name, style },
    });
    
    const basePrompt = name
      ? `Generate a fake user profile for someone named "${name}"`
      : "Generate a completely random fake user profile";

    const styleInstructions = {
      professional: "Use professional-sounding email domains and formal address formats",
      casual: "Use common email providers and simple address formats",
      international: "Include diverse international names and address formats",
    };

    return {
      messages: [{
        role: "user" as const,
        content: {
          type: "text" as const,
          text: `${basePrompt}. ${styleInstructions[style]}.

Return ONLY a valid JSON object with these exact fields:
- name: Full name (first and last)
- email: Realistic email address  
- address: Complete street address with city and zip
- phone: Phone number in (XXX) XXX-XXXX format

No markdown formatting, no explanations, just the raw JSON object.`,
        },
      }],
    };
  }
);

// ============================================
// UTILITY FUNCTIONS (from original server)
// ============================================

function generateRealisticFakeUser() {
  const firstNames = [
    "Alexander", "Charlotte", "Benjamin", "Isabella", "Christopher",
    "Sophia", "Daniel", "Emma", "Matthew", "Olivia",
  ];
  
  const lastNames = [
    "Anderson", "Thompson", "Garcia", "Martinez", "Robinson",
    "Clark", "Rodriguez", "Lewis", "Lee", "Walker",
  ];
  
  const emailDomains = [
    "gmail.com", "yahoo.com", "outlook.com", "hotmail.com", "icloud.com",
  ];
  
  const streetNames = [
    "Maple Street", "Oak Avenue", "Pine Road", "Cedar Lane", "Elm Drive",
  ];
  
  const cities = [
    "Springfield", "Riverside", "Franklin", "Georgetown", "Clinton",
  ];
  
  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
  const domain = emailDomains[Math.floor(Math.random() * emailDomains.length)];
  const street = streetNames[Math.floor(Math.random() * streetNames.length)];
  const city = cities[Math.floor(Math.random() * cities.length)];
  
  const emailPrefix = `${firstName.toLowerCase()}.${lastName.toLowerCase()}`;
  const streetNumber = Math.floor(Math.random() * 9999) + 1;
  const zipCode = String(Math.floor(Math.random() * 90000) + 10000);
  
  const areaCode = Math.floor(Math.random() * 700) + 200;
  const exchange = Math.floor(Math.random() * 800) + 200;
  const number = String(Math.floor(Math.random() * 10000)).padStart(4, "0");
  
  return {
    name: `${firstName} ${lastName}`,
    email: `${emailPrefix}@${domain}`,
    address: `${streetNumber} ${street}, ${city} ${zipCode}`,
    phone: `(${areaCode}) ${exchange}-${number}`,
  };
}

async function createUser(user: {
  name: string;
  email: string;
  address: string;
  phone: string;
}) {
  const users = await import("./data/users.json", {
    with: { type: "json" },
  }).then((m) => m.default);

  const id = users.length + 1;
  users.push({ id, ...user });

  await fs.writeFile("./src/data/users.json", JSON.stringify(users, null, 2));

  return id;
}

// ============================================
// MAIN ENTRY POINT
// ============================================

async function main() {
  console.log("🚀 Starting authenticated MCP server...");
  
  // Authenticate on startup
  try {
    currentAuthContext = await getAuthContext();
    
    if (currentAuthContext) {
      console.log(`✅ Server ready for user: ${currentAuthContext.user.email}`);
      console.log(`📋 Permissions loaded: ${currentAuthContext.permissions.length}`);
    } else {
      console.log("⚠️  Server running in unauthenticated mode");
    }
  } catch (error: any) {
    console.error(`❌ Startup failed: ${error.message}`);
    process.exit(1);
  }
  
  const transport = new StdioServerTransport();
  await server.connect(transport);
  
  console.log("🎯 Server connected and ready!");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});