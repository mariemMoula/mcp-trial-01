// ============================================
// INTERACTIVE AUTHENTICATED MCP CLIENT
// Login once, use tools interactively with a menu
// ============================================

import "dotenv/config";
import { Client as StytchClient } from "stytch";
import express, { Request, Response } from "express";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { input, select, confirm } from "@inquirer/prompts";

// ============================================
// INITIALIZE STYTCH
// ============================================

const stytch = new StytchClient({
  project_id: process.env.STYTCH_PROJECT_ID || "",
  secret: process.env.STYTCH_SECRET || "",
});

// ============================================
// AUTHENTICATION FLOW
// ============================================

/**
 * Authenticate user with Stytch magic link
 * Returns access token
 */
async function authenticateWithStytch(): Promise<string> {
  console.log("🔐 Welcome to Interactive MCP Client!");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  // Step 1: Get user's email
  const email = await input({
    message: "Enter your email to login:",
    validate: (value) => {
      if (!value.includes("@")) {
        return "Please enter a valid email address";
      }
      return true;
    },
  });

  // Step 2: Send magic link email
  console.log("\n📧 Sending magic link to your email...");

  try {
    await stytch.magicLinks.email.loginOrCreate({
      email,
      login_magic_link_url: "http://localhost:3000/auth/callback",
      signup_magic_link_url: "http://localhost:3000/auth/callback",
    });

    console.log("✅ Magic link sent!");
    console.log("\n📬 Check your email and click the link to continue...");
    console.log("⏳ Waiting for you to click the link...\n");
  } catch (error: any) {
    console.error("❌ Failed to send magic link:", error.message);
    throw error;
  }

  // Step 3: Start local server to receive callback
  const token = await waitForMagicLinkCallback();

  console.log("✅ Successfully authenticated!\n");
  return token;
}

/**
 * Start a local web server to receive Stytch callback
 */
async function waitForMagicLinkCallback(): Promise<string> {
  return new Promise((resolve, reject) => {
    const app = express();

    // Handle the callback from Stytch
    app.get("/auth/callback", async (req: Request, res: Response) => {
      const token = req.query.token as string;

      if (!token) {
        res.send("❌ Error: No token received");
        reject(new Error("No token in callback"));
        return;
      }

      try {
        // Authenticate the token with Stytch
        const authResult = await stytch.magicLinks.authenticate({
          token,
          session_duration_minutes: 60, // 1 hour session
        });

        // Success! Send response to browser
        res.send(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Authentication Successful</title>
              <style>
                body {
                  font-family: system-ui;
                  display: flex;
                  justify-content: center;
                  align-items: center;
                  height: 100vh;
                  margin: 0;
                  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                }
                .card {
                  background: white;
                  padding: 3rem;
                  border-radius: 1rem;
                  box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                  text-align: center;
                }
                .success-icon {
                  font-size: 4rem;
                  margin-bottom: 1rem;
                }
                h1 { color: #4caf50; margin: 0; }
                p { color: #666; margin-top: 1rem; }
              </style>
            </head>
            <body>
              <div class="card">
                <div class="success-icon">✅</div>
                <h1>Authentication Successful!</h1>
                <p>You can close this window and return to the terminal.</p>
              </div>
            </body>
          </html>
        `);

        // Return the session token
        server.close();
        resolve(authResult.session_jwt);
      } catch (error: any) {
        res.send(`❌ Authentication failed: ${error.message}`);
        server.close();
        reject(error);
      }
    });

    // Start server on port 3000
    const server = app.listen(3000, () => {
      console.log("🌐 Callback server running on http://localhost:3000");
    });

    // Timeout after 5 minutes
    setTimeout(() => {
      server.close();
      reject(new Error("Authentication timeout - please try again"));
    }, 5 * 60 * 1000);
  });
}

// ============================================
// INTERACTIVE MENU SYSTEM
// ============================================

/**
 * Show interactive menu and handle user choices
 */
async function showMenu(mcp: Client): Promise<boolean> {
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  const action = await select({
    message: "What would you like to do?",
    choices: [
      {
        name: "🎲 Create random user",
        value: "create-random",
        description: "Generate a user with fake data",
      },
      {
        name: "👤 Create specific user",
        value: "create-specific",
        description: "Create a user with your own data",
      },
      {
        name: "👥 View all users",
        value: "view-users",
        description: "List all users in the database",
      },
      {
        name: "📋 List available tools",
        value: "list-tools",
        description: "Show all tools you can use",
      },
      {
        name: "📚 List available resources",
        value: "list-resources",
        description: "Show all resources you can access",
      },
      {
        name: "🚪 Exit",
        value: "exit",
        description: "Close the application",
      },
    ],
  });

  console.log(""); // Blank line for spacing

  switch (action) {
    case "create-random":
      await handleCreateRandomUser(mcp);
      break;

    case "create-specific":
      await handleCreateSpecificUser(mcp);
      break;

    case "view-users":
      await handleViewUsers(mcp);
      break;

    case "list-tools":
      await handleListTools(mcp);
      break;

    case "list-resources":
      await handleListResources(mcp);
      break;

    case "exit":
      return false; // Signal to exit
  }

  return true; // Continue running
}

/**
 * Handle creating a random user
 */
async function handleCreateRandomUser(mcp: Client) {
  try {
    console.log("🎲 Creating random user...\n");

    const result = await mcp.callTool({
      name: "create-random-user",
      arguments: {},
    });

    console.log("✅ Success!");
    console.log((result.content as any)[0].text);
  } catch (error: any) {
    console.error("❌ Error:", error.message);
  }
}

/**
 * Handle creating a specific user
 */
async function handleCreateSpecificUser(mcp: Client) {
  try {
    console.log("👤 Create a new user\n");

    // Get user details
    const name = await input({
      message: "Enter name:",
      validate: (value) => value.length > 0 || "Name is required",
    });

    const email = await input({
      message: "Enter email:",
      validate: (value) => value.includes("@") || "Please enter a valid email",
    });

    const address = await input({
      message: "Enter address:",
      validate: (value) => value.length > 0 || "Address is required",
    });

    const phone = await input({
      message: "Enter phone:",
      validate: (value) => value.length > 0 || "Phone is required",
    });

    // Confirm before creating
    const confirmed = await confirm({
      message: `Create user "${name}" with email "${email}"?`,
      default: true,
    });

    if (!confirmed) {
      console.log("❌ Cancelled");
      return;
    }

    console.log("\n👤 Creating user...\n");

    const result = await mcp.callTool({
      name: "create-user",
      arguments: { name, email, address, phone },
    });

    console.log("✅ Success!");
    console.log((result.content as any)[0].text);
  } catch (error: any) {
    console.error("❌ Error:", error.message);
  }
}

/**
 * Handle viewing all users
 */
async function handleViewUsers(mcp: Client) {
  try {
    console.log("👥 Loading users...\n");

    const result = await mcp.readResource({
      uri: "users://all",
    });

    console.log("✅ Users in database:");
    console.log((result.contents as any)[0].text);
  } catch (error: any) {
    console.error("❌ Error:", error.message);
  }
}

/**
 * Handle listing available tools
 */
async function handleListTools(mcp: Client) {
  try {
    console.log("📋 Available tools:\n");

    const { tools } = await mcp.listTools();

    tools.forEach((tool, index) => {
      console.log(`${index + 1}. ${tool.name}`);
      console.log(`   ${tool.description || "No description"}`);
      console.log("");
    });

    console.log(`Total: ${tools.length} tool(s)`);
  } catch (error: any) {
    console.error("❌ Error:", error.message);
  }
}

/**
 * Handle listing available resources
 */
async function handleListResources(mcp: Client) {
  try {
    console.log("📚 Available resources:\n");

    const { resources } = await mcp.listResources();

    resources.forEach((resource, index) => {
      console.log(`${index + 1}. ${resource.name}`);
      console.log(`   URI: ${resource.uri}`);
      console.log(`   ${resource.description || "No description"}`);
      console.log("");
    });

    console.log(`Total: ${resources.length} resource(s)`);
  } catch (error: any) {
    console.error("❌ Error:", error.message);
  }
}

// ============================================
// MAIN CLIENT LOGIC
// ============================================

async function main() {
  try {
    // Step 1: Authenticate with Stytch
    const accessToken = await authenticateWithStytch();

    // Step 2: Create MCP client
    console.log("🔌 Connecting to authenticated MCP server...");

    const mcp = new Client(
      {
        name: "interactive-authenticated-client",
        version: "1.0.0",
      },
      { capabilities: {} }
    );

    // Step 3: Start server with access token in environment
    const transport = new StdioClientTransport({
      command: "npx",
      args: ["tsx", "src/authenticated_server.ts"],
      stderr: "inherit",
      env: {
        ...process.env,
        MCP_ACCESS_TOKEN: accessToken,
      },
    });

    await mcp.connect(transport);

    console.log("✅ Connected to authenticated server!");
    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("🎯 Welcome! You can now use tools interactively.");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    // Step 4: Interactive menu loop
    let keepRunning = true;
    while (keepRunning) {
      keepRunning = await showMenu(mcp);
    }

    // Step 5: Cleanup
    console.log("\n👋 Goodbye! Thanks for using the MCP client.");
    await mcp.close();
    process.exit(0);
  } catch (error: any) {
    console.error("\n❌ Error:", error.message);
    process.exit(1);
  }
}

main();
