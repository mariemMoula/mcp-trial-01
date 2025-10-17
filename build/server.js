"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mcp_js_1 = require("@modelcontextprotocol/sdk/server/mcp.js");
const stdio_js_1 = require("@modelcontextprotocol/sdk/server/stdio.js");
const zod_1 = __importDefault(require("zod"));
const promises_1 = __importDefault(require("node:fs/promises"));
// here, we create the server
const server = new mcp_js_1.McpServer({
    name: "MCP Trial 01",
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
                    text: "Something went wrong, please try again"
                }
            ]
        };
    }
});
async function main() {
    const transport = new stdio_js_1.StdioServerTransport();
    await server.connect(transport);
}
async function createUser(user) {
    const users = await import("./data/users.json", {
        with: { type: "json" },
    }).then(m => m.default);
    const id = users.length + 1;
    users.push({ id, ...user });
    await promises_1.default.writeFile("./src/data/users.json", JSON.stringify(users, null, 2));
    return id;
}
main();
