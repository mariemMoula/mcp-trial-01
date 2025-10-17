import {
  McpServer,
  ResourceTemplate,
} from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import z from "zod";
import { CreateMessageResultSchema } from "@modelcontextprotocol/sdk/types.js";
import fs from "node:fs/promises";
// here, we create the server
const server = new McpServer({
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
server.tool(
  "create-user",
  "Create a new user in the database",
  {
    name: z.string(),
    email: z.string().email(),
    address: z.string(),
    phone: z.string(),
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
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: "Something went wrong, please try again",
          },
        ],
      };
    }
  }
);

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
  async () => {
    //  Use the prompt resource to guide the client
    // The server provides a prompt, the client uses sampling to get AI response
    // This demonstrates the proper MCP architecture pattern

    try {
      // Advanced random generation with more realistic patterns
      const fakeUser = generateRealisticFakeUser();

      const id = await createUser(fakeUser);
      return {
        content: [
          {
            type: "text",
            text: `🎲 Random user ${id} created successfully: ${fakeUser.name} | Email: ${fakeUser.email} | Address: ${fakeUser.address} | Phone: ${fakeUser.phone}
            
💡 Pro tip: For AI-generated data, use the 'generate-fake-user' prompt with sampling from the client side!`,
          },
        ],
      };
    } catch (error) {
      console.error("Random user creation failed:", error);
      return {
        content: [
          {
            type: "text",
            text: "Something went wrong creating the random user, please try again",
          },
        ],
      };
    }
  }
);

function generateRealisticFakeUser() {
  // More sophisticated fake data generation
  const firstNames = [
    "Alexander",
    "Charlotte",
    "Benjamin",
    "Isabella",
    "Christopher",
    "Sophia",
    "Daniel",
    "Emma",
    "Matthew",
    "Olivia",
    "Michael",
    "Ava",
    "William",
    "Emily",
    "James",
    "Madison",
    "Lucas",
    "Abigail",
    "Henry",
    "Mia",
  ];

  const lastNames = [
    "Anderson",
    "Thompson",
    "Garcia",
    "Martinez",
    "Robinson",
    "Clark",
    "Rodriguez",
    "Lewis",
    "Lee",
    "Walker",
    "Hall",
    "Allen",
    "Young",
    "King",
    "Wright",
    "Lopez",
    "Hill",
    "Scott",
    "Green",
    "Adams",
  ];

  const emailDomains = [
    "gmail.com",
    "yahoo.com",
    "outlook.com",
    "hotmail.com",
    "icloud.com",
    "protonmail.com",
    "company.com",
    "university.edu",
  ];

  const streetNames = [
    "Maple Street",
    "Oak Avenue",
    "Pine Road",
    "Cedar Lane",
    "Elm Drive",
    "Park Way",
    "Main Street",
    "First Avenue",
    "Second Street",
    "Broadway",
    "Washington Ave",
    "Lincoln Drive",
    "Madison Street",
    "Jefferson Road",
  ];

  const cities = [
    "Springfield",
    "Riverside",
    "Franklin",
    "Georgetown",
    "Clinton",
    "Fairview",
    "Madison",
    "Greenville",
    "Salem",
    "Chester",
  ];

  // Generate random selections
  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
  const domain = emailDomains[Math.floor(Math.random() * emailDomains.length)];
  const street = streetNames[Math.floor(Math.random() * streetNames.length)];
  const city = cities[Math.floor(Math.random() * cities.length)];

  // Generate realistic email (sometimes with numbers, dots, underscores)
  const emailVariations = [
    `${firstName.toLowerCase()}.${lastName.toLowerCase()}`,
    `${firstName.toLowerCase()}${lastName.toLowerCase()}`,
    `${firstName.toLowerCase()}_${lastName.toLowerCase()}`,
    `${firstName.toLowerCase()}${Math.floor(Math.random() * 99)}`,
  ];
  const emailPrefix =
    emailVariations[Math.floor(Math.random() * emailVariations.length)];

  // Generate realistic address
  const streetNumber = Math.floor(Math.random() * 9999) + 1;
  const zipCode = String(Math.floor(Math.random() * 90000) + 10000);

  // Generate realistic phone number
  const areaCode = Math.floor(Math.random() * 700) + 200; // Avoid invalid area codes
  const exchange = Math.floor(Math.random() * 800) + 200;
  const number = String(Math.floor(Math.random() * 10000)).padStart(4, "0");

  return {
    name: `${firstName} ${lastName}`,
    email: `${emailPrefix}@${domain}`,
    address: `${streetNumber} ${street}, ${city} ${zipCode}`,
    phone: `(${areaCode}) ${exchange}-${number}`,
  };
}

server.prompt(
  "generate-fake-user",
  "Generate realistic fake user data using AI (use with sampling from client)",
  {
    name: z.string().optional(),
    style: z.enum(["professional", "casual", "international"]).optional(),
  },
  ({ name, style = "professional" }, _extra) => {
    const basePrompt = name
      ? `Generate a fake user profile for someone named "${name}"`
      : "Generate a completely random fake user profile";

    const styleInstructions = {
      professional:
        "Use professional-sounding email domains and formal address formats",
      casual: "Use common email providers and simple address formats",
      international: "Include diverse international names and address formats",
    };

    return {
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `${basePrompt}. ${styleInstructions[style]}.

Return ONLY a valid JSON object with these exact fields:
- name: Full name (first and last)
- email: Realistic email address  
- address: Complete street address with city and zip
- phone: Phone number in (XXX) XXX-XXXX format

No markdown formatting, no explanations, just the raw JSON object.`,
          },
        },
      ],
    };
  }
);
// Here, we will add the resource to the server to fetch all users
server.resource(
  "users", // name of the resource
  "users://all", // uri that must match a certain protocol
  {
    description: "Get all users data from the database", // lets the ai know what it does
    title: "Users",
    mimeType: "application/json", // the type of data that the resource returns
  },
  async (uri) => {
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
  }
);
// Here, we will add the resource to the server to fetch a user by their id
server.resource(
  "user-details",
  new ResourceTemplate("users://{userId}/profile", { list: undefined }),
  {
    description: "Get a user's details from teh database",
    title: "User Details",
    mimeType: "application/json",
  },
  async (uri, { userId }) => {
    const users = await import("./data/users.json", {
      with: { type: "json" },
    }).then((m) => m.default);
    const user = users.find((u) => u.id === parseInt(userId as string));

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
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
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

main();
