"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mcp_js_1 = require("@modelcontextprotocol/sdk/server/mcp.js");
const stdio_js_1 = require("@modelcontextprotocol/sdk/server/stdio.js");
const zod_1 = __importDefault(require("zod"));
const types_js_1 = require("@modelcontextprotocol/sdk/types.js");
const promises_1 = __importDefault(require("node:fs/promises"));
// here, we create the server
const server = new mcp_js_1.McpServer({
    name: "Meriame's MCP Trial 01",
    version: "1.0.0",
    description: "A trial of the MCP SDK",
    capabilities: {
        resources: {},
        tools: {},
        prompts: {},
    },
});
// Here, we are defining the "create-user" tool, the name that the ai is going to see, and the second parameter is the description ,then te parameters we will pass in
server.tool("create-user", "Create a new user in the database", {
    name: zod_1.default.string(),
    email: zod_1.default.string().email(),
    address: zod_1.default.string(),
    phone: zod_1.default.string(),
}, 
// here, we define the different annotations, which are optional, but if we want that the ai can see, it will provide hints to the ai to help it understand and know what it can and what it can't do
{
    title: "Create a new user", //
    readOnlyHint: false, // this lets the ai know that this tool is not read only
    destructiveHint: false, // this lets the ai give extra steps of warning when using the tool
    idempotentHint: false,
    openWorldHint: true, //this lets the ai know if it access something external or not
}, 
// here, we pass what the function is going to do
async (params) => {
    try {
        const id = await createUser(params);
        return {
            content: [{ type: "text", text: `User ${id} created successfully` }],
        };
    }
    catch (error) {
        return {
            content: [
                {
                    type: "text",
                    text: "Something went wrong, please try again",
                },
            ],
        };
    }
});
server.tool("create-random-user", "Create a random user with fake data", {
    title: "Create Random User",
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: false,
    openWorldHint: true,
}, async () => {
    try {
        // Use sampling to ask AI for help generating fake user data
        const res = await server.server.request({
            method: "sampling/createMessage",
            params: {
                messages: [
                    {
                        role: "user",
                        content: {
                            type: "text",
                            text: "Generate realistic fake user data. Return ONLY a valid JSON object with name, email, address, and phone fields. No markdown, no explanations, just the JSON object.",
                        },
                    },
                ],
                maxTokens: 200,
            },
        }, types_js_1.CreateMessageResultSchema);
        if (res.content.type !== "text") {
            // Fallback to hardcoded data if AI fails
            const fallbackUser = {
                name: "John Doe",
                email: "john.doe@example.com",
                address: "123 Main St",
                phone: "555-0123",
            };
            const id = await createUser(fallbackUser);
            return {
                content: [
                    {
                        type: "text",
                        text: `Random user ${id} created successfully (fallback): ${fallbackUser.name}`,
                    },
                ],
            };
        }
        try {
            // Clean up the AI response and parse JSON
            const cleanedText = res.content.text
                .trim()
                .replace(/^```json\s*/, "")
                .replace(/\s*```$/, "")
                .replace(/^```\s*/, "")
                .trim();
            console.log("🤖 AI generated data:", cleanedText);
            const fakeUser = JSON.parse(cleanedText);
            // Validate the required fields exist
            if (!fakeUser.name ||
                !fakeUser.email ||
                !fakeUser.address ||
                !fakeUser.phone) {
                throw new Error("Missing required fields from AI response");
            }
            const id = await createUser(fakeUser);
            return {
                content: [
                    {
                        type: "text",
                        text: `Random user ${id} created successfully with AI: ${fakeUser.name}`,
                    },
                ],
            };
        }
        catch (parseError) {
            console.error("Failed to parse AI response:", parseError);
            // Fallback to hardcoded data if parsing fails
            const fallbackUser = {
                name: "Jane Smith",
                email: "jane.smith@example.com",
                address: "456 Oak Ave",
                phone: "555-0456",
            };
            const id = await createUser(fallbackUser);
            return {
                content: [
                    {
                        type: "text",
                        text: `Random user ${id} created successfully (fallback after AI error): ${fallbackUser.name}`,
                    },
                ],
            };
        }
    }
    catch (error) {
        console.error("Sampling request failed:", error);
        return {
            content: [
                {
                    type: "text",
                    text: "Something went wrong creating the random user, please try again",
                },
            ],
        };
    }
});
// prompts are useful to create complicated prompts from certain information , i give a name and it will return all of this prompt that can be run inside of the ai tool,
// name , description , params , function that takes the passed params
server.prompt("generate-fake-user", "Create a fake user  based on a given name", {
    name: zod_1.default.string(),
}, ({ name }, _extra) => {
    return {
        // the messages we want our ai to run
        messages: [
            {
                role: "user",
                content: {
                    type: "text",
                    text: `Generate a fake user based on the name ${name}, the user should have a realistic email, address and phone number.`,
                },
            },
        ],
    };
});
// Here, we will add the resource to the server to fetch all users
server.resource("users", // name of the resource
"users://all", // uri that must match a certain protocol
{
    description: "Get all users data from the database", // lets the ai know what it does
    title: "Users",
    mimeType: "application/json", // the type of data that the resource returns
}, async (uri) => {
    const users = await import("./data/users.json", {
        with: { type: "json" },
    }).then((m) => m.default);
    return {
        contents: [
            {
                uri: uri.href,
                text: JSON.stringify(users),
                mimeType: "application/json",
            },
        ],
    };
});
// Here, we will add the resource to the server to fetch a user by their id
server.resource("user-details", new mcp_js_1.ResourceTemplate("users://{userId}/profile", { list: undefined }), {
    description: "Get a user's details from teh database",
    title: "User Details",
    mimeType: "application/json",
}, async (uri, { userId }) => {
    const users = await import("./data/users.json", {
        with: { type: "json" },
    }).then((m) => m.default);
    const user = users.find((u) => u.id === parseInt(userId));
    if (user == null) {
        return {
            contents: [
                {
                    uri: uri.href,
                    text: JSON.stringify({ error: "User not found" }),
                    mimeType: "application/json",
                },
            ],
        };
    }
    return {
        contents: [
            {
                uri: uri.href,
                text: JSON.stringify(user),
                mimeType: "application/json",
            },
        ],
    };
});
async function main() {
    const transport = new stdio_js_1.StdioServerTransport();
    await server.connect(transport);
}
async function createUser(user) {
    const users = await import("./data/users.json", {
        with: { type: "json" },
    }).then((m) => m.default);
    const id = users.length + 1;
    users.push({ id, ...user });
    await promises_1.default.writeFile("./src/data/users.json", JSON.stringify(users, null, 2));
    return id;
}
main();
