// ============================================
// AUTHENTICATED MCP CLIENT
// Handles Stytch login and token passing
// ============================================

import "dotenv/config";
import { Client as StytchClient } from "stytch";
import express, { Request, Response } from "express";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { input } from "@inquirer/prompts";

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
  console.log("🔐 Welcome to Authenticated MCP Client!");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  // Get user's email
  const email = await input({
    message: "Enter your email to login:",
    validate: (value) => {
      if (!value.includes("@")) {
        return "Please enter a valid email address";
      }
      return true;
    },
  });

  //  Send magic link email
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

  //  Start local server to receive callback
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
// MAIN CLIENT LOGIC
// ============================================

async function main() {
  try {
    //  Authenticate with Stytch
    const accessToken = await authenticateWithStytch();

    //  Create MCP client
    console.log("🔌 Connecting to authenticated MCP server...");

    const mcp = new Client(
      {
        name: "Meriame-authenticated-client",
        version: "1.0.0",
      },
      { capabilities: {} }
    );

    //  Start server with access token in environment
    const transport = new StdioClientTransport({
      command: "npx",
      args: ["tsx", "src/authenticated_server.ts"],
      stderr: "inherit",
      env: {
        ...process.env,
        MCP_ACCESS_TOKEN: accessToken, // ← Pass token to server!
      },
    });

    await mcp.connect(transport);

    console.log("✅ Connected to authenticated server!");
    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("🎯 You are now ready to use authenticated tools!");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    // Test the connection
    const { tools } = await mcp.listTools();
    console.log(`📋 Available tools: ${tools.map((t) => t.name).join(", ")}\n`);

    //  create a random user
    console.log("🧪 Testing: Creating a random user...");
    const result = await mcp.callTool({
      name: "create-random-user",
      arguments: {},
    });

    console.log("\n✅ Result:");
    console.log((result.content as any)[0].text);

    console.log("\n🎉 Authentication and tool execution successful!");
    console.log(
      "You can now integrate this with your existing client logic.\n"
    );

    // Close connection
    await mcp.close();
    process.exit(0);
  } catch (error: any) {
    console.error("\n❌ Error:", error.message);
    process.exit(1);
  }
}

main();
