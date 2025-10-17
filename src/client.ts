import "dotenv/config";
import { createGoogleGenerativeAI } from "@ai-sdk/google"
import { confirm, input, select } from "@inquirer/prompts";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import {
  CreateMessageRequestSchema,
  Prompt,
  PromptMessage,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";
import { generateText, jsonSchema, ToolSet } from "ai"
import { z } from "zod";
// We will use the cli thanks to the inquirer package
const mcp = new Client(
  {
    name: "Meriame-client",
    version: "1.0.0",
  },
  { capabilities: { sampling: {} } } // sampling is a client capability
);
// here, we define the transport protocol
const transport = new StdioClientTransport({
  command: "npx",
  args: ["tsx", "src/server.ts"], // Run directly with tsx
  stderr: "inherit", // Changed to see errors
});
const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY,
})

async function main() {
    console.log("in client side...")
  await mcp.connect(transport);
  // extract the tools, prompts, resources and resource templates, which are all the things the server capable of
  const [{ tools }, { prompts }, { resources }, { resourceTemplates }] =
    await Promise.all([
      mcp.listTools(),
      mcp.listPrompts(),
      mcp.listResources(),
      mcp.listResourceTemplates(),
    ]);

  console.log("You are connected!");
  while (true) {
    // we ask the user what they want to do inside the cli, tool or resource or prompt or query
    const option = await select({
      message: "What would you like to do",
      choices: ["Query", "Tools", "Resources", "Prompts"],
    });

 switch (option) {
      case "Tools":
        //displaying the possible tools in our mcp server
        const toolName = await select({
          message: "Select a tool",
          choices: tools.map(tool => ({
            name: tool.annotations?.title || tool.name,
            value: tool.name,
            description: tool.description,
          })),
        })
        // based on the user s choice we look for the tool
        const tool = tools.find(t => t.name === toolName)
        if (tool == null) {
          console.error("Tool not found.")
        } else {
          await handleTool(tool) 
        }
        break
      case "Resources":
        const resourceUri = await select({
          message: "Select a resource",
          choices: [
            ...resources.map(resource => ({
              name: resource.name,
              value: resource.uri,
              description: resource.description,
            })),
            ...resourceTemplates.map(template => ({
              name: template.name,
              value: template.uriTemplate,
              description: template.description,
            })),
          ],
        })
        const uri =
          resources.find(r => r.uri === resourceUri)?.uri ??
          resourceTemplates.find(r => r.uriTemplate === resourceUri)
            ?.uriTemplate
        if (uri == null) {
          console.error("Resource not found.")
        } else {
          await handleResource(uri)
        }
        break
      case "Prompts":
        const promptName = await select({
          message: "Select a prompt",
          choices: prompts.map(prompt => ({
            name: prompt.name,
            value: prompt.name,
            description: prompt.description,
          })),
        })
        const prompt = prompts.find(p => p.name === promptName)
        if (prompt == null) {
          console.error("Prompt not found.")
        } else {
          await handlePrompt(prompt)
        }
        break
      case "Query":
        await handleQuery(tools)
    }
  }
  
}

// below are the functions that will be called based on the user's choice

// FIXED: Properly convert MCP tools to AI SDK format
async function handleQuery(tools: Tool[]) {
  const query = await input({ message: "Enter your query" })

  const { text, toolResults } = await generateText({
    model: google("gemini-2.0-flash"),
    prompt: query,
    tools: tools.reduce(
      (obj, tool) => ({
        ...obj,
        [tool.name]: {
          description: tool.description,
          parameters: jsonSchema(tool.inputSchema),
          execute: async (args: Record<string, any>) => {
            return await mcp.callTool({
              name: tool.name,
              arguments: args,
            })
          },
        },
      }),
      {} as ToolSet
    ),
  })

  console.log(
    // @ts-expect-error
    text || toolResults[0]?.result?.content[0]?.text || "No text generated."
  )
}



// Helper function to convert JSON Schema to Zod schema
function convertJsonSchemaToZod(jsonSchema: any): z.ZodObject<any> {
  const properties = jsonSchema.properties || {};
  const required = jsonSchema.required || [];

  const shape: Record<string, z.ZodTypeAny> = {};

  for (const [key, value] of Object.entries(properties)) {
    const prop = value as any;
    let zodType: z.ZodTypeAny;

    // Convert based on JSON Schema type
    switch (prop.type) {
      case "string":
        zodType = z.string();
        if (prop.description) {
          zodType = zodType.describe(prop.description);
        }
        break;
      case "number":
        zodType = z.number();
        if (prop.description) {
          zodType = zodType.describe(prop.description);
        }
        break;
      case "boolean":
        zodType = z.boolean();
        if (prop.description) {
          zodType = zodType.describe(prop.description);
        }
        break;
      case "array":
        zodType = z.array(z.any());
        if (prop.description) {
          zodType = zodType.describe(prop.description);
        }
        break;
      case "object":
        zodType = z.object({});
        if (prop.description) {
          zodType = zodType.describe(prop.description);
        }
        break;
      default:
        zodType = z.any();
    }

    // Make optional if not in required array
    if (!required.includes(key)) {
      zodType = zodType.optional();
    }

    shape[key] = zodType;
  }

  return z.object(shape);
}

// a function that will be called when the user picks a tool
async function handleTool(tool: Tool) {
  const args: Record<string, string> = {} // the passed arguments to the tool
  for (const [key, value] of Object.entries( // if wse have a parameter , we will loop through each to extract it
    tool.inputSchema.properties ?? {}
  )) {
    args[key] = await input({ // this allows me to get input for a user
      message: `Enter value for ${key} (${(value as { type: string }).type}):`,
    })
  }
// calling the tool via passing the tool name and the arguments
  const res = await mcp.callTool({
    name: tool.name,
    arguments: args,
  })

  console.log((res.content as [{ text: string }])[0].text)
}

async function handleResource(uri: string) {
  let finalUri = uri
  const paramMatches = uri.match(/{([^}]+)}/g)

  if (paramMatches != null) {
    for (const paramMatch of paramMatches) {
      const paramName = paramMatch.replace("{", "").replace("}", "")
      const paramValue = await input({
        message: `Enter value for ${paramName}:`,
      })
      finalUri = finalUri.replace(paramMatch, paramValue)//relace the dynamic parameter with the user's input
    }
  }

  const res = await mcp.readResource({
    uri: finalUri,
  })

  console.log(
    JSON.stringify(JSON.parse(res.contents[0].text as string), null, 2)
  )
}

async function handlePrompt(prompt: Prompt) {

  const args: Record<string, string> = {}
  // looping through the arguments, and asking the user for input
  for (const arg of prompt.arguments ?? []) {
    args[arg.name] = await input({
      message: `Enter value for ${arg.name}:`,
    })
  }

  const response = await mcp.getPrompt({
    name: prompt.name,
    arguments: args,
  })

  for (const message of response.messages) {
    const result = await handleServerMessagePrompt(message);
    if (result) {
      console.log("\n--- AI Generated ---");
      console.log(result);
      console.log("-------------------\n");
    }
  }
}

async function handleServerMessagePrompt(message: PromptMessage) {
  if (message.content.type !== "text") return
// printing the message to the user
console.log("\n--- Prompt Content ---");
  console.log(message.content.text);
  console.log("---------------------\n");
    // the confirm function will ask the user if they want to run the prompt
  const run = await confirm({
    message: "Would you like to run the above prompt",
    default: true,
  })

  if (!run) return
// we will call the ai to run the prompt
  const { text } = await generateText({
    model: google("gemini-2.0-flash"),
    prompt: message.content.text,
  })

  return text
}

main().catch(console.error);