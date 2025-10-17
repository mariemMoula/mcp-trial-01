"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const google_1 = require("@ai-sdk/google");
const generative_ai_1 = require("@google/generative-ai");
const prompts_1 = require("@inquirer/prompts");
const index_js_1 = require("@modelcontextprotocol/sdk/client/index.js");
const stdio_js_1 = require("@modelcontextprotocol/sdk/client/stdio.js");
const ai_1 = require("ai");
const zod_1 = require("zod");
// We will use the cli thanks to the inquirer package
const mcp = new index_js_1.Client({
    name: "Meriame-client",
    version: "1.0.0",
}, { capabilities: {} } // No special capabilities needed
);
// here, we define the transport protocol
const transport = new stdio_js_1.StdioClientTransport({
    command: "npx",
    args: ["tsx", "src/server.ts"], // Run directly with tsx
    stderr: "inherit", // Changed to see errors
});
const google = (0, google_1.createGoogleGenerativeAI)({
    apiKey: process.env.GEMINI_API_KEY,
});
// Alternative: Direct Google SDK
const directGoogle = new generative_ai_1.GoogleGenerativeAI(process.env.GEMINI_API_KEY);
async function main() {
    console.log("in client side...");
    await mcp.connect(transport);
    // extract the tools, prompts, resources and resource templates, which are all the things the server capable of
    const [{ tools }, { prompts }, { resources }, { resourceTemplates }] = await Promise.all([
        mcp.listTools(),
        mcp.listPrompts(),
        mcp.listResources(),
        mcp.listResourceTemplates(),
    ]);
    console.log("You are connected!");
    while (true) {
        // we ask the user what they want to do inside the cli, tool or resource or prompt or query
        const option = await (0, prompts_1.select)({
            message: "What would you like to do",
            choices: ["Query", "Tools", "Resources", "Prompts"],
        });
        switch (option) {
            case "Tools":
                //displaying the possible tools in our mcp server
                const toolName = await (0, prompts_1.select)({
                    message: "Select a tool",
                    choices: tools.map((tool) => ({
                        name: tool.annotations?.title || tool.name,
                        value: tool.name,
                        description: tool.description,
                    })),
                });
                // based on the user s choice we look for the tool
                const tool = tools.find((t) => t.name === toolName);
                if (tool == null) {
                    console.error("Tool not found.");
                }
                else {
                    await handleTool(tool);
                }
                break;
            case "Resources":
                const resourceUri = await (0, prompts_1.select)({
                    message: "Select a resource",
                    choices: [
                        ...resources.map((resource) => ({
                            name: resource.name,
                            value: resource.uri,
                            description: resource.description,
                        })),
                        ...resourceTemplates.map((template) => ({
                            name: template.name,
                            value: template.uriTemplate,
                            description: template.description,
                        })),
                    ],
                });
                const uri = resources.find((r) => r.uri === resourceUri)?.uri ??
                    resourceTemplates.find((r) => r.uriTemplate === resourceUri)
                        ?.uriTemplate;
                if (uri == null) {
                    console.error("Resource not found.");
                }
                else {
                    await handleResource(uri);
                }
                break;
            case "Prompts":
                const promptName = await (0, prompts_1.select)({
                    message: "Select a prompt",
                    choices: prompts.map((prompt) => ({
                        name: prompt.name,
                        value: prompt.name,
                        description: prompt.description,
                    })),
                });
                const prompt = prompts.find((p) => p.name === promptName);
                if (prompt == null) {
                    console.error("Prompt not found.");
                }
                else {
                    await handlePrompt(prompt);
                }
                break;
            case "Query":
                // Get the user's query first
                const userQuery = await (0, prompts_1.input)({ message: "Enter your query" });
                // First try the direct Google SDK approach
                const directSdkWorked = await testDirectGoogleSDK(tools, userQuery);
                if (!directSdkWorked) {
                    // If direct SDK fails, try the AI SDK approach
                    await handleQuery(tools);
                }
        }
    }
}
// below are the functions that will be called based on the user's choice
async function testDirectGoogleSDK(tools, query) {
    console.log("🧪 Testing with Direct Google Generative AI SDK...");
    console.log("🔍 Available MCP tools:", tools.map((t) => t.name));
    console.log("🔍 User query:", query);
    try {
        const model = directGoogle.getGenerativeModel({
            model: "gemini-2.0-flash",
        });
        // Test 1: Basic functionality
        const result1 = await model.generateContent("Say hello");
        console.log("✅ Direct Google SDK basic test:", result1.response.text());
        // Test 2: Try with function calling using direct Google SDK format
        console.log("Testing with function calling using direct Google SDK...");
        const modelWithTools = directGoogle.getGenerativeModel({
            model: "gemini-2.0-flash",
            tools: [
                {
                    functionDeclarations: [
                        {
                            name: "create_random_user",
                            description: "Create a random user with fake data",
                            parameters: {
                                type: generative_ai_1.SchemaType.OBJECT,
                                properties: {},
                            },
                        },
                        {
                            name: "create_user",
                            description: "Create a new user in the database",
                            parameters: {
                                type: generative_ai_1.SchemaType.OBJECT,
                                properties: {
                                    name: {
                                        type: generative_ai_1.SchemaType.STRING,
                                        description: "The user's full name",
                                    },
                                    email: {
                                        type: generative_ai_1.SchemaType.STRING,
                                        description: "The user's email address",
                                    },
                                    address: {
                                        type: generative_ai_1.SchemaType.STRING,
                                        description: "The user's address",
                                    },
                                    phone: {
                                        type: generative_ai_1.SchemaType.STRING,
                                        description: "The user's phone number",
                                    },
                                },
                                required: ["name", "email", "address", "phone"],
                            },
                        },
                    ],
                },
            ],
        });
        const result2 = await modelWithTools.generateContent(query);
        console.log("✅ Direct Google SDK with tools test:");
        console.log("Response:", result2.response.text());
        // Check if there are function calls
        const functionCalls = result2.response.functionCalls();
        if (functionCalls && functionCalls.length > 0) {
            console.log("🎯 Function was called:", functionCalls[0].name);
            // Execute the MCP tool (convert function name back to MCP format)
            const mcpToolName = functionCalls[0].name.replace(/_/g, "-"); // convert underscores to hyphens
            console.log("🔍 Debug: Original function name:", functionCalls[0].name);
            console.log("🔍 Debug: Converted MCP tool name:", mcpToolName);
            console.log("🔍 Debug: Function arguments:", functionCalls[0].args);
            // Let's also verify the connection is working by listing tools again
            console.log("🔍 Debug: Re-checking MCP connection...");
            const { tools: currentTools } = await mcp.listTools();
            console.log("🔍 Debug: Current MCP tools:", currentTools.map((t) => t.name));
            try {
                const mcpResult = await mcp.callTool({
                    name: mcpToolName,
                    arguments: functionCalls[0].args || {},
                });
                console.log("✅ MCP Result:", mcpResult.content[0]);
            }
            catch (mcpError) {
                console.error("❌ MCP Error details:", mcpError);
                console.log("🔍 Debug: Trying to call tool directly...");
                // Let's try calling the tool with the exact name from the tools list
                const exactTool = currentTools.find((t) => t.name === mcpToolName);
                if (exactTool) {
                    console.log("✅ Found exact tool:", exactTool.name);
                    const directResult = await mcp.callTool({
                        name: exactTool.name,
                        arguments: {},
                    });
                    console.log("✅ Direct MCP Result:", directResult.content[0]);
                }
                else {
                    console.log("❌ Tool not found in current tools list");
                }
            }
        }
        return true;
    }
    catch (directError) {
        console.error("❌ Direct Google SDK failed:", directError.message);
        return false;
    }
}
// FIXED: Properly convert MCP tools to AI SDK format
async function handleQuery(tools) {
    const query = await (0, prompts_1.input)({ message: "Enter your query" });
    // Debug: Log the structure of the tools
    console.log("Tool schemas before conversion:");
    tools.forEach((tool) => {
        console.log(`Tool: ${tool.name}`);
        console.log("InputSchema:", JSON.stringify(tool.inputSchema, null, 2));
    });
    // TEST: Try with just one simple tool first
    console.log("Testing with minimal tool setup...");
    // Start with just the create-random-user tool (simplest case)
    const formattedTools = {};
    // Only add create-random-user tool for testing
    const randomUserTool = tools.find((t) => t.name === "create-random-user");
    if (randomUserTool) {
        formattedTools["create-random-user"] = {
            description: "Create a random user with fake data",
            parameters: {
                type: "object",
                properties: {},
                required: [],
            },
            execute: async () => {
                console.log("Executing create-random-user tool...");
                return await mcp.callTool({
                    name: "create-random-user",
                    arguments: {},
                });
            },
        };
        console.log("Added create-random-user tool for testing");
    }
    // If the simple tool works, let's try adding create-user
    if (Object.keys(formattedTools).length > 0) {
        console.log("Simple tool added, now testing if we can add create-user...");
        // Try a very basic create-user schema
        formattedTools["test-create-user"] = {
            description: "Create a new user",
            parameters: {
                type: "object",
                properties: {
                    name: { type: "string" },
                },
                required: ["name"],
            },
            execute: async (args) => {
                console.log("Executing test-create-user tool with args:", args);
                return await mcp.callTool({
                    name: "create-user",
                    arguments: {
                        name: args.name || "Test User",
                        email: "test@example.com",
                        address: "123 Test St",
                        phone: "555-0123",
                    },
                });
            },
        };
    }
    console.log("Explicitly formatted schemas:");
    Object.keys(formattedTools).forEach((toolName) => {
        console.log(`Tool: ${toolName}`);
        console.log("Schema:", JSON.stringify(formattedTools[toolName].parameters, null, 2));
    });
    console.log("Sending tools to Gemini:", Object.keys(formattedTools));
    // First try without tools to test basic connectivity
    if (Object.keys(formattedTools).length === 0) {
        console.log("No tools available, making basic request...");
        const { text } = await (0, ai_1.generateText)({
            model: google("gemini-2.0-flash"),
            prompt: query,
        });
        console.log(text || "No text generated.");
        return;
    }
    // Let's try testing with absolutely minimal tools first
    console.log("Trying with no tools first to confirm this works...");
    try {
        // Test 1: No tools at all (this should work)
        const { text: noToolsText } = await (0, ai_1.generateText)({
            model: google("gemini-2.0-flash"),
            prompt: "Say hello",
        });
        console.log("✅ No tools test passed:", noToolsText);
        // Test 2: Try with a single, extremely simple tool
        console.log("Now trying with one extremely simple tool...");
        const simpleTools = {
            "simple-tool": {
                description: "A simple test tool",
                parameters: {
                    type: "object",
                    properties: {},
                    required: [],
                },
                execute: async () => {
                    return {
                        content: [{ type: "text", text: "Simple tool executed!" }],
                    };
                },
            },
        };
        console.log("Simple tool schema:", JSON.stringify(simpleTools["simple-tool"].parameters, null, 2));
        const { text: simpleToolText } = await (0, ai_1.generateText)({
            model: google("gemini-2.0-flash"),
            prompt: "Use the simple tool",
            tools: simpleTools,
        });
        console.log("✅ Simple tool test passed:", simpleToolText);
        // If we get here, let's try with the MCP tools
        console.log("Now trying with MCP tools...");
        const { text, toolResults } = await (0, ai_1.generateText)({
            model: google("gemini-2.0-flash"),
            prompt: query,
            tools: formattedTools,
        });
        console.log(
        // @ts-expect-error
        text || toolResults[0]?.result?.content[0]?.text || "No text generated.");
    }
    catch (error) {
        console.error("❌ Error details:", error);
        console.error("Error message:", error.message);
        // Check if it's specifically a tool error
        if (error.message.includes("functionDeclaration")) {
            console.error("This is a tool schema validation error");
            // Let's try to see what the AI SDK is actually sending
            console.log("Debugging: Our formatted tools structure:");
            console.log(JSON.stringify(formattedTools, (key, value) => {
                if (typeof value === "function")
                    return "[Function]";
                return value;
            }, 2));
        }
        // Fallback: try without tools
        const { text } = await (0, ai_1.generateText)({
            model: google("gemini-2.0-flash"),
            prompt: query,
        });
        console.log("Response without tools:", text || "No text generated.");
    }
}
// Helper function to convert JSON Schema to Zod schema
function convertJsonSchemaToZod(jsonSchema) {
    const properties = jsonSchema.properties || {};
    const required = jsonSchema.required || [];
    const shape = {};
    for (const [key, value] of Object.entries(properties)) {
        const prop = value;
        let zodType;
        // Convert based on JSON Schema type
        switch (prop.type) {
            case "string":
                zodType = zod_1.z.string();
                if (prop.description) {
                    zodType = zodType.describe(prop.description);
                }
                break;
            case "number":
                zodType = zod_1.z.number();
                if (prop.description) {
                    zodType = zodType.describe(prop.description);
                }
                break;
            case "boolean":
                zodType = zod_1.z.boolean();
                if (prop.description) {
                    zodType = zodType.describe(prop.description);
                }
                break;
            case "array":
                zodType = zod_1.z.array(zod_1.z.any());
                if (prop.description) {
                    zodType = zodType.describe(prop.description);
                }
                break;
            case "object":
                zodType = zod_1.z.object({});
                if (prop.description) {
                    zodType = zodType.describe(prop.description);
                }
                break;
            default:
                zodType = zod_1.z.any();
        }
        // Make optional if not in required array
        if (!required.includes(key)) {
            zodType = zodType.optional();
        }
        shape[key] = zodType;
    }
    return zod_1.z.object(shape);
}
// a function that will be called when the user picks a tool
async function handleTool(tool) {
    const args = {}; // the passed arguments to the tool
    for (const [key, value] of Object.entries(
    // if wse have a parameter , we will loop through each to extract it
    tool.inputSchema.properties ?? {})) {
        args[key] = await (0, prompts_1.input)({
            // this allows me to get input for a user
            message: `Enter value for ${key} (${value.type}):`,
        });
    }
    // calling the tool via passing the tool name and the arguments
    const res = await mcp.callTool({
        name: tool.name,
        arguments: args,
    });
    console.log(res.content[0].text);
}
async function handleResource(uri) {
    let finalUri = uri;
    const paramMatches = uri.match(/{([^}]+)}/g);
    if (paramMatches != null) {
        for (const paramMatch of paramMatches) {
            const paramName = paramMatch.replace("{", "").replace("}", "");
            const paramValue = await (0, prompts_1.input)({
                message: `Enter value for ${paramName}:`,
            });
            finalUri = finalUri.replace(paramMatch, paramValue); //relace the dynamic parameter with the user's input
        }
    }
    const res = await mcp.readResource({
        uri: finalUri,
    });
    console.log(JSON.stringify(JSON.parse(res.contents[0].text), null, 2));
}
async function handlePrompt(prompt) {
    const args = {};
    // looping through the arguments, and asking the user for input
    for (const arg of prompt.arguments ?? []) {
        args[arg.name] = await (0, prompts_1.input)({
            message: `Enter value for ${arg.name}:`,
        });
    }
    const response = await mcp.getPrompt({
        name: prompt.name,
        arguments: args,
    });
    for (const message of response.messages) {
        const result = await handleServerMessagePrompt(message);
        if (result) {
            console.log("\n--- AI Generated ---");
            console.log(result);
            console.log("-------------------\n");
        }
    }
}
async function handleServerMessagePrompt(message) {
    if (message.content.type !== "text")
        return;
    // printing the message to the user
    console.log("\n--- Prompt Content ---");
    console.log(message.content.text);
    console.log("---------------------\n");
    // the confirm function will ask the user if they want to run the prompt
    const run = await (0, prompts_1.confirm)({
        message: "Would you like to run the above prompt",
        default: true,
    });
    if (!run)
        return;
    // we will call the ai to run the prompt
    const { text } = await (0, ai_1.generateText)({
        model: google("gemini-2.5-flash"),
        prompt: message.content.text,
    });
    return text;
}
main().catch(console.error);
